const router = require('express').Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
const stripe = require('stripe')(STRIPE_KEY); // Clave secreta de prueba
const notif = require('../services/notif');

const JWT_SECRET = process.env.JWT_SECRET || 'yourcourse_fallback_secret';

// Middleware de autenticación
async function authMiddleware(req, res, next) {
  const h = req.headers['authorization'];
  if (!h || !h.startsWith('Bearer '))
    return res.status(401).json({ error: { message: 'No autenticado.' } });
  try {
    req.user = jwt.verify(h.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: { message: 'Token inválido o expirado.' } });
  }
}

// ─── POST /api/pagos/create-checkout-session ──────────────────────────────────
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  const { curso_id } = req.body;
  if (!curso_id) return res.status(400).json({ error: { message: 'curso_id es requerido.' } });

  const curso = await db.get('SELECT * FROM cursos WHERE id = ?', curso_id);
  if (!curso) return res.status(404).json({ error: { message: 'Curso no encontrado.' } });

  if (curso.estado !== 'publicado') {
    return res.status(400).json({ error: { message: 'El curso no está disponible para compra.' } });
  }

  // Verificar si ya está inscrito
  const inscripcion = await db.get('SELECT id FROM inscripciones WHERE estudiante_id = ? AND curso_id = ?', req.user.id, curso.id);
  if (inscripcion) {
    return res.status(400).json({ error: { message: 'Ya estás inscrito en este curso.' } });
  }

  // Si es gratis, inscribir directamente (no debería llegar aquí, pero por seguridad)
  if (curso.modelo_negocio === 'gratis' || curso.precio <= 0) {
    try {
      await db.run('INSERT INTO inscripciones (estudiante_id, curso_id) VALUES (?, ?)', req.user.id, curso.id);
      return res.json({ success: true, redirect: `/student/dashboard?success=true&curso_id=${curso.id}` });
    } catch (err) {
      return res.status(500).json({ error: { message: 'Error al inscribir al curso gratuito.' } });
    }
  }

  // Crear sesión de Stripe
  try {
    if (STRIPE_KEY === 'sk_test_mock') {
      // ── MODO SIMULADO (El usuario aún no crea su cuenta) ──
      console.log('⚠️ Simulando pago de Stripe (No hay llave válida). Curso:', curso.titulo);
      const fakeSessionId = 'cs_test_' + Math.random().toString(36).substring(2, 15);
      
      // Guardar metadata simulada temporalmente (en producción Stripe lo guarda)
      global.mockStripeSessions = global.mockStripeSessions || {};
      global.mockStripeSessions[fakeSessionId] = {
        payment_status: 'paid',
        metadata: {
          estudiante_id: req.user.id.toString(),
          curso_id: curso.id.toString(),
        }
      };

      const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/dashboard?session_id=${fakeSessionId}`;
      
      // Simularemos que lo redirigimos directo al success
      return res.json({ success: true, url: successUrl, message: 'Modo simulado activo. Redirigiendo a éxito.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn', // O la moneda de preferencia
            product_data: {
              name: curso.titulo,
              description: curso.descripcion || 'Acceso completo al curso.',
            },
            unit_amount: Math.round(curso.precio * 100), // Stripe requiere el precio en centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Metadata importante para saber qué curso compró qué usuario tras el pago exitoso
      metadata: {
        estudiante_id: req.user.id.toString(),
        curso_id: curso.id.toString(),
      },
      // URLs de redirección al finalizar el pago
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/`,
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error('Error creando Checkout Session:', error);
    res.status(500).json({ error: { message: 'Error al iniciar el pago con Stripe.' } });
  }
});

// ─── GET /api/pagos/success ───────────────────────────────────────────────────
// Verifica la sesión de Stripe y completa la inscripción (Alternativa a Webhooks para MVP)
router.get('/success', authMiddleware, async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: { message: 'Falta session_id' } });

  try {
    let session;
    
    if (session_id.startsWith('cs_test_') && global.mockStripeSessions && global.mockStripeSessions[session_id]) {
      // 1. MODO SIMULADO
      session = global.mockStripeSessions[session_id];
    } else {
      // 1. Recuperar la sesión REAL de Stripe
      session = await stripe.checkout.sessions.retrieve(session_id);
    }

    // 2. Verificar que el pago fue exitoso
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: { message: 'El pago no ha sido completado.' } });
    }

    // 3. Obtener la metadata
    const estudiante_id = parseInt(session.metadata.estudiante_id, 10);
    const curso_id = parseInt(session.metadata.curso_id, 10);

    // Seguridad adicional: asegurar que el usuario autenticado sea el mismo que inició el pago
    if (estudiante_id !== req.user.id) {
       return res.status(403).json({ error: { message: 'No tienes permiso para validar esta sesión.' } });
    }

    // 4. Inscribir al estudiante
    try {
      await db.run('INSERT INTO inscripciones (estudiante_id, curso_id) VALUES (?, ?)', estudiante_id, curso_id);
      
      // Notificar al creador
      const curso = await db.get('SELECT creator_id, titulo FROM cursos WHERE id = ?', curso_id);
      if (curso) {
        notif.crearNotificacion({
          usuario_id: curso.creator_id,
          tipo: 'ingreso',
          titulo: 'Nueva venta',
          mensaje: `Alguien ha comprado tu curso "${curso.titulo}".`,
          enlace: '/creator/estudiantes'
        });
      }

      return res.json({ success: true, message: 'Pago verificado e inscripción completada.' });
    } catch (dbErr) {
      // Si el error es restricción UNIQUE, significa que ya estaba inscrito (ej. recargó la página)
      if (dbErr.code === 'SQLITE_CONSTRAINT_UNIQUE' || dbErr.message.includes('UNIQUE constraint failed')) {
         return res.json({ success: true, message: 'Ya estabas inscrito en este curso.' });
      }
      throw dbErr;
    }

  } catch (error) {
    console.error('Error verificando pago:', error);
    return res.status(500).json({ error: { message: 'Error al verificar el pago con Stripe.' } });
  }
});

module.exports = router;
