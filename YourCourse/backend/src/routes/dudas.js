/**
 * dudas.js — Flujo de dudas y respuestas sobre videos
 */

const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'yourcourse_fallback_secret';

async function auth(req, res, next) {
  const h = req.headers['authorization'];
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: { message: 'No autenticado.' } });
  try { req.user = jwt.verify(h.split(' ')[1], JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: { message: 'Token inválido.' } }); }
}

// GET /api/dudas/leccion/:lid — Obtener dudas de una lección específica
router.get('/leccion/:lid', auth, async (req, res) => {
  try {
    const dudas = await db.query(`
      SELECT d.*, u.nombre AS estudiante_nombre, u.avatar_color AS estudiante_color,
             p.nombre AS respondido_por_nombre
      FROM dudas_videos d
      JOIN usuarios u ON u.id = d.estudiante_id
      LEFT JOIN usuarios p ON p.id = d.respondida_por
      WHERE d.leccion_id = ?
      ORDER BY d.created_at ASC
    `, req.params.lid);
    res.json({ success: true, data: dudas });
  } catch(err) {
    res.status(500).json({ error: { message: 'Error al obtener dudas.' } });
  }
});

// GET /api/dudas/curso/:cid — Obtener todas las dudas de un curso (maestro/creador/moderador/admin)
router.get('/curso/:cid', auth, async (req, res) => {
  try {
    const dudas = await db.query(`
      SELECT d.*, u.nombre AS estudiante_nombre, u.avatar_color AS estudiante_color,
             l.titulo AS leccion_titulo, c.titulo AS curso_titulo
      FROM dudas_videos d
      JOIN usuarios u ON u.id = d.estudiante_id
      LEFT JOIN lecciones l ON l.id = d.leccion_id
      LEFT JOIN cursos c ON c.id = d.curso_id
      WHERE d.curso_id = ?
      ORDER BY d.created_at DESC
    `, req.params.cid);
    res.json({ success: true, data: dudas });
  } catch(err) {
    res.status(500).json({ error: { message: 'Error al obtener dudas del curso.' } });
  }
});

// POST /api/dudas — Estudiante crea una nueva duda
router.post('/', auth, async (req, res) => {
  const { curso_id, leccion_id, pregunta } = req.body;
  if (!curso_id || !leccion_id || !pregunta || !pregunta.trim()) {
    return res.status(400).json({ error: { message: 'Faltan campos requeridos (curso_id, leccion_id, pregunta).' } });
  }

  try {
    const result = await db.run(`
      INSERT INTO dudas_videos (curso_id, leccion_id, estudiante_id, pregunta)
      VALUES (?, ?, ?, ?)
    `, curso_id, leccion_id, req.user.id, pregunta.trim());

    // Notificar al instructor (no bloqueante)
    try {
      const curso = await db.get('SELECT creator_id, titulo FROM cursos WHERE id = ?', curso_id);
      if (curso) {
        await db.run(`
          INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, enlace)
          VALUES (?, 'info', ?, ?, ?)
        `, curso.creator_id,
          'Nueva duda en tu curso',
          'Un estudiante ha dejado una pregunta en tu curso "' + curso.titulo + '".',
          '/creator/cursos/' + curso_id);
      }
    } catch(_) { /* notificación no bloqueante */ }

    // Gamificación: Estudiante realiza una pregunta/duda
    let gamification = null;
    try {
      const { procesarAccion } = require('../services/gamificationEngine');
      gamification = await procesarAccion(req.user.id, 'CREAR_DUDA');
    } catch(e) { console.error('Error gamificación:', e.message); }

    const newDuda = await db.get(`
      SELECT d.*, u.nombre AS estudiante_nombre, u.avatar_color AS estudiante_color
      FROM dudas_videos d
      JOIN usuarios u ON u.id = d.estudiante_id
      WHERE d.id = ?
    `, result.lastInsertRowid);

    res.status(201).json({ success: true, data: newDuda, gamification });
  } catch(err) {
    if (err.message && err.message.includes('FOREIGN KEY')) {
      return res.status(400).json({ error: { message: 'El curso o la lección especificada no existe.' } });
    }

    return res.status(500).json({ error: { message: 'Error al guardar la duda: ' + err.message } });
  }
});

// PATCH /api/dudas/:id/responder — Creador/Maestro/Admin responde a la duda
router.patch('/:id/responder', auth, async (req, res) => {
  const { respuesta } = req.body;
  if (!respuesta || !respuesta.trim()) {
    return res.status(400).json({ error: { message: 'La respuesta no puede estar vacía.' } });
  }

  try {
    const duda = await db.get('SELECT * FROM dudas_videos WHERE id = ?', req.params.id);
    if (!duda) {
      return res.status(404).json({ error: { message: 'Duda no encontrada.' } });
    }

    const now = new Date().toISOString();
    await db.run(`
      UPDATE dudas_videos
      SET respuesta = ?, respondida_por = ?, respondida_en = ?
      WHERE id = ?
    `, respuesta.trim(), req.user.id, now, duda.id);

    // Notificar al estudiante
    try {
      const curso = await db.get('SELECT titulo FROM cursos WHERE id = ?', duda.curso_id);
      await db.run(`
        INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, enlace)
        VALUES (?, 'info', 'Duda respondida', ?, ?)
      `, duda.estudiante_id,
        'El instructor ha respondido a tu duda en el curso "' + (curso?.titulo || '') + '".',
        '/student/cursos/' + duda.curso_id + '/ver');
    } catch(_) { /* notificación no bloqueante */ }

    const updatedDuda = await db.get(`
      SELECT d.*, u.nombre AS estudiante_nombre, u.avatar_color AS estudiante_color,
             p.nombre AS respondido_por_nombre
      FROM dudas_videos d
      JOIN usuarios u ON u.id = d.estudiante_id
      LEFT JOIN usuarios p ON p.id = d.respondida_por
      WHERE d.id = ?
    `, duda.id);

    res.json({ success: true, data: updatedDuda, message: 'Duda respondida exitosamente.' });
  } catch(err) {
    res.status(500).json({ error: { message: 'Error al responder la duda.' } });
  }
});

module.exports = router;
