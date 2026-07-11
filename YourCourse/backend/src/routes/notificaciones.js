/**
 * notificaciones.js — CRUD de notificaciones de usuario
 * GET    /api/notificaciones          — Lista las del usuario autenticado
 * GET    /api/notificaciones/count    — Cuenta las no leídas
 * PATCH  /api/notificaciones/leer-todas — Marca todas como leídas
 * PATCH  /api/notificaciones/:id/leer  — Marca una como leída
 * DELETE /api/notificaciones/:id       — Elimina una notificación
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

// GET /api/notificaciones — últimas 30
router.get('/', auth, async (req, res) => {
  const notifs = await db.query(`
    SELECT * FROM notificaciones
    WHERE usuario_id = ?
    ORDER BY created_at DESC
    LIMIT 30
  `, req.user.id);
  return res.json({ success: true, data: notifs });
});

// GET /api/notificaciones/count — solo el conteo de no leídas
router.get('/count', auth, async (req, res) => {
  const row = await db.get(`
    SELECT COUNT(*) as count FROM notificaciones
    WHERE usuario_id = ? AND leida = 0
  `, req.user.id);
  return res.json({ success: true, count: row.count });
});

// PATCH /api/notificaciones/leer-todas
router.patch('/leer-todas', auth, async (req, res) => {
  await db.run('UPDATE notificaciones SET leida = 1 WHERE usuario_id = ?', req.user.id);
  return res.json({ success: true });
});

// PATCH /api/notificaciones/:id/leer
router.patch('/:id/leer', auth, async (req, res) => {
  await db.run('UPDATE notificaciones SET leida = 1 WHERE id = ? AND usuario_id = ?', req.params.id, req.user.id);
  return res.json({ success: true });
});

// DELETE /api/notificaciones/:id
router.delete('/:id', auth, async (req, res) => {
  await db.run('DELETE FROM notificaciones WHERE id = ? AND usuario_id = ?', req.params.id, req.user.id);
  return res.json({ success: true });
});

module.exports = router;
