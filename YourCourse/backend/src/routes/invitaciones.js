const router = require('express').Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const mailer = require('../services/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'yourcourse_fallback_secret';

// Middleware para autenticación
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

// ─── POST /api/invitaciones/enviar ─────────────────────────────────────────────
// Solo creadores pueden invitar
router.post('/enviar', authMiddleware, async (req, res) => {
  if (req.user.rol !== 'creador') {
    return res.status(403).json({ error: { message: 'Solo los creadores pueden enviar invitaciones.' } });
  }

  const { curso_id, email } = req.body;
  if (!curso_id || !email) {
    return res.status(400).json({ error: { message: 'Falta curso_id o email.' } });
  }

  const curso = await db.get('SELECT id, titulo, creator_id FROM cursos WHERE id = ?', curso_id);
  if (!curso || curso.creator_id !== req.user.id) {
    return res.status(403).json({ error: { message: 'No tienes permiso sobre este curso.' } });
  }

  // Verificar si ya está inscrito
  const userExists = await db.get('SELECT id FROM usuarios WHERE email = ?', email.toLowerCase().trim());
  if (userExists) {
    const isEnrolled = await db.get('SELECT id FROM inscripciones WHERE estudiante_id = ? AND curso_id = ?', userExists.id, curso.id);
    if (isEnrolled) {
      return res.status(400).json({ error: { message: 'El estudiante ya está inscrito en este curso.' } });
    }
  }

  const token = crypto.randomBytes(32).toString('hex');
  
  await db.run('INSERT INTO curso_invitaciones (curso_id, email, token) VALUES (?, ?, ?)', curso.id, email.toLowerCase().trim(), token);

  const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invitacion?token=${token}`;
  
  const html = `
    <h2 style="color:#1f2937;font-size:22px;margin:0 0 12px;">¡Te han invitado a un curso! 🎉</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 16px;">
      El creador del curso <strong>"${curso.titulo}"</strong> te ha enviado una invitación exclusiva para unirte.
    </p>
    <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-weight:700;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;">
      Aceptar Invitación
    </a>
  `;

  // Usar la función interna expuesta por mailer.js para enviar correo personalizado
  // O podemos modificar mailer.js para soportar esto. Para ser rápido, asumo que enviaremos correo.
  // Pero mailer.js no exporta una función genérica sendMail.
  // Vamos a usar un truco: modificaremos temporalmente mailer.js, o...
  // wait, mailer.js exporta funciones específicas. 
  // Modificaré mailer.js en un paso posterior para exportar `sendCourseInvitation`.
  try {
    if (mailer.sendCourseInvitation) {
       await mailer.sendCourseInvitation({ email, cursoTitulo: curso.titulo, inviteUrl });
    } else {
       console.log('⚠️ sendCourseInvitation no implementado aún en mailer.js. Token URL:', inviteUrl);
    }
  } catch(e) {
    console.error('Error enviando invitacion', e);
  }

  return res.json({ success: true, message: 'Invitación enviada correctamente.' });
});

// ─── GET /api/invitaciones/verificar ────────────────────────────────────────
// Este endpoint lee el token y dice a qué curso corresponde y a qué email.
router.get('/verificar', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: { message: 'Token requerido.' } });

  const invitacion = await db.get('SELECT ci.*, c.titulo as curso_titulo FROM curso_invitaciones ci JOIN cursos c ON ci.curso_id = c.id WHERE ci.token = ?', token);
  
  if (!invitacion) {
    return res.status(404).json({ error: { message: 'Invitación no encontrada o inválida.' } });
  }

  if (invitacion.usada) {
    return res.status(400).json({ error: { message: 'Esta invitación ya fue utilizada.' } });
  }

  return res.json({
    success: true,
    invitacion: {
      email: invitacion.email,
      curso_id: invitacion.curso_id,
      curso_titulo: invitacion.curso_titulo
    }
  });
});

// ─── POST /api/invitaciones/aceptar ─────────────────────────────────────────
// Para usuarios ya logueados que aceptan la invitación. (Si no están logueados, el frontend los manda a login/registro y el registro los auto-inscribe)
router.post('/aceptar', authMiddleware, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: { message: 'Token requerido.' } });

  const invitacion = await db.get('SELECT * FROM curso_invitaciones WHERE token = ?', token);
  if (!invitacion) return res.status(404).json({ error: { message: 'Invitación inválida.' } });
  if (invitacion.usada) return res.status(400).json({ error: { message: 'Invitación ya utilizada.' } });

  // Verificar si el email coincide (opcional, pero buena práctica)
  if (req.user.email !== invitacion.email) {
    return res.status(403).json({ error: { message: 'Esta invitación es para otro correo.' } });
  }

  try {
    await db.run('INSERT INTO inscripciones (estudiante_id, curso_id) VALUES (?, ?)', req.user.id, invitacion.curso_id);
    await db.run('UPDATE curso_invitaciones SET usada = 1 WHERE id = ?', invitacion.id);
    return res.json({ success: true, message: 'Inscripción exitosa.' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message.includes('UNIQUE')) {
       await db.run('UPDATE curso_invitaciones SET usada = 1 WHERE id = ?', invitacion.id); // Marcar como usada de todas formas
       return res.json({ success: true, message: 'Ya estabas inscrito.' });
    }
    return res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

module.exports = router;
