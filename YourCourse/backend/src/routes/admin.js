/**
 * admin.js — Rutas exclusivas del SuperAdmin
 * GET  /api/admin/usuarios          — Listar todos los usuarios
 * PATCH /api/admin/usuarios/:id/rol — Cambiar rol de usuario
 * DELETE /api/admin/usuarios/:id    — Eliminar usuario
 */

const router     = require('express').Router();
const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');
const db         = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'yourcourse_fallback_secret';

// ─── Auth + SuperAdmin guard ───────────────────────────────────────────────────
async function auth(req, res, next) {
  const h = req.headers['authorization'];
  if (!h || !h.startsWith('Bearer '))
    return res.status(401).json({ error: { message: 'No autenticado.' } });
  try { req.user = jwt.verify(h.split(' ')[1], JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: { message: 'Token inválido.' } }); }
}

function soloSuperAdmin(req, res, next) {
  if (req.user.rol !== 'superadmin')
    return res.status(403).json({ error: { message: 'Acceso restringido a SuperAdmin.' } });
  next();
}

function soloAdmin(req, res, next) {
  if (!['superadmin', 'moderador'].includes(req.user.rol))
    return res.status(403).json({ error: { message: 'Acceso restringido a administradores.' } });
  next();
}

// ─── GET /api/admin/usuarios ─────────────────────────────────────────────────
router.get('/usuarios', auth, soloAdmin, async (req, res) => {
  const usuarios = await db.query(`
    SELECT id, nombre, email, rol, is_verified, academia_id, avatar_color, created_at
    FROM usuarios
    ORDER BY created_at DESC
  `);
  return res.json({ success: true, data: usuarios });
});

// ─── GET /api/admin/usuarios/:id ─────────────────────────────────────────────
router.get('/usuarios/:id', auth, soloAdmin, async (req, res) => {
  const usuario = await db.get(`
    SELECT id, nombre, email, rol, is_verified, academia_id, avatar_color, bio, created_at
    FROM usuarios WHERE id = ?
  `, req.params.id);
  if (!usuario) return res.status(404).json({ error: { message: 'Usuario no encontrado.' } });
  return res.json({ success: true, data: usuario });
});

// ─── PATCH /api/admin/usuarios/:id/rol ───────────────────────────────────────
router.patch('/usuarios/:id/rol', auth, soloSuperAdmin, async (req, res) => {
  const { rol } = req.body;
  const ROLES_VALIDOS = ['estudiante', 'creador', 'moderador', 'superadmin'];
  if (!rol || !ROLES_VALIDOS.includes(rol))
    return res.status(400).json({ error: { message: `Rol inválido. Válidos: ${ROLES_VALIDOS.join(', ')}` } });

  const usuario = await db.get('SELECT * FROM usuarios WHERE id = ?', req.params.id);
  if (!usuario) return res.status(404).json({ error: { message: 'Usuario no encontrado.' } });

  // No se puede cambiar el propio rol
  if (usuario.id === req.user.id)
    return res.status(400).json({ error: { message: 'No puedes cambiar tu propio rol.' } });

  await db.run('UPDATE usuarios SET rol = ? WHERE id = ?', rol, req.params.id);
  const updated = await db.get('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?', req.params.id);
  return res.json({ success: true, data: updated, message: `Rol actualizado a '${rol}' correctamente.` });
});

// ─── PATCH /api/admin/usuarios/:id/verificar ─────────────────────────────────
router.patch('/usuarios/:id/verificar', auth, soloSuperAdmin, async (req, res) => {
  const usuario = await db.get('SELECT * FROM usuarios WHERE id = ?', req.params.id);
  if (!usuario) return res.status(404).json({ error: { message: 'Usuario no encontrado.' } });

  await db.run('UPDATE usuarios SET is_verified = 1, verification_token = NULL WHERE id = ?', req.params.id);
  return res.json({ success: true, message: 'Cuenta verificada manualmente.' });
});

// ─── DELETE /api/admin/usuarios/:id ──────────────────────────────────────────
router.delete('/usuarios/:id', auth, soloSuperAdmin, async (req, res) => {
  const usuario = await db.get('SELECT * FROM usuarios WHERE id = ?', req.params.id);
  if (!usuario) return res.status(404).json({ error: { message: 'Usuario no encontrado.' } });

  if (usuario.id === req.user.id)
    return res.status(400).json({ error: { message: 'No puedes eliminarte a ti mismo.' } });

  // Eliminar registros relacionados
  await db.run('DELETE FROM inscripciones WHERE estudiante_id = ?', req.params.id);
  await db.run('DELETE FROM notificaciones WHERE usuario_id = ?', req.params.id);
  await db.run('DELETE FROM usuarios WHERE id = ?', req.params.id);

  return res.json({ success: true, message: 'Usuario eliminado correctamente.' });
});

// ─── GET /api/admin/stats ────────────────────────────────────────────────────
router.get('/stats', auth, soloAdmin, async (req, res) => {
  const academiaId = req.user.academia_id || 1;

  const totalUsuarios    = (await db.get("SELECT COUNT(*) as n FROM usuarios WHERE academia_id = ?", [academiaId]))?.n || 0;
  const totalCursos      = (await db.get("SELECT COUNT(*) as n FROM cursos WHERE academia_id = ?", [academiaId]))?.n || 0;
  const totalPublicados  = (await db.get("SELECT COUNT(*) as n FROM cursos WHERE estado='publicado' AND academia_id = ?", [academiaId]))?.n || 0;
  const totalEstudiantes = (await db.get("SELECT COUNT(*) as n FROM usuarios WHERE rol='estudiante' AND academia_id = ?", [academiaId]))?.n || 0;
  const totalCreadores   = (await db.get("SELECT COUNT(*) as n FROM usuarios WHERE rol='creador' AND academia_id = ?", [academiaId]))?.n || 0;
  const totalModeradoes  = (await db.get("SELECT COUNT(*) as n FROM usuarios WHERE rol='moderador' AND academia_id = ?", [academiaId]))?.n || 0;
  const totalInscrip     = (await db.get("SELECT COUNT(*) as n FROM inscripciones i JOIN cursos c ON c.id = i.curso_id WHERE c.academia_id = ?", [academiaId]))?.n || 0;

  return res.json({
    success: true,
    data: {
      totalUsuarios, totalCursos, totalPublicados,
      totalEstudiantes, totalCreadores, totalModeradoes, totalInscrip,
    }
  });
});

module.exports = router;
