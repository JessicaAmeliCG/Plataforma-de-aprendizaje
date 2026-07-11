/**
 * maestros.js — Endpoints para gestionar maestros
 * GET    /api/maestros
 * POST   /api/maestros
 * DELETE /api/maestros/:id
 */

const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db     = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'yourcourse_fallback_secret';

async function auth(req, res, next) {
  const h = req.headers['authorization'];
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: { message: 'No autenticado.' } });
  try { req.user = jwt.verify(h.split(' ')[1], JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: { message: 'Token inválido.' } }); }
}

function soloAdmins(req, res, next) {
  if (req.user.rol !== 'moderador' && req.user.rol !== 'superadmin') {
    return res.status(403).json({ error: { message: 'Acceso restringido a moderadores y administradores.' } });
  }
  next();
}

// GET /api/maestros
router.get('/', auth, soloAdmins, async (req, res) => {
  const maestros = await db.query(`
    SELECT id, nombre, email, rol, bio, avatar_color, created_at
    FROM usuarios
    WHERE rol = 'creador' OR rol = 'maestro'
    ORDER BY created_at DESC
  `);
  res.json({ success: true, data: maestros });
});

// POST /api/maestros
router.post('/', auth, soloAdmins, async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: { message: 'Nombre, email y contraseña son requeridos.' } });
  }

  const existing = await db.get('SELECT id FROM usuarios WHERE email = ?', email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: { message: 'Este email ya está registrado.' } });
  }

  const hash = bcrypt.hashSync(password, 12);
  const COLORS = [
    'from-violet-500 to-purple-700',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
  ];
  const avatarColor = COLORS[Math.floor(Math.random() * COLORS.length)];

  const result = await db.run(`
    INSERT INTO usuarios (nombre, email, password_hash, rol, avatar_color, academia_id, is_verified)
    VALUES (?, ?, ?, 'creador', ?, 1, 1)
  `, nombre.trim(), email.toLowerCase().trim(), hash, avatarColor);

  const newMaestro = await db.get('SELECT id, nombre, email, rol, bio, avatar_color, created_at FROM usuarios WHERE id = ?', result.lastInsertRowid);
  res.status(201).json({ success: true, data: newMaestro, message: 'Maestro creado exitosamente.' });
});

// GET /api/maestros/:id/perfil — Perfil público del creador
router.get('/:id/perfil', auth, async (req, res) => {
  try {
    const creador = await db.get(`
      SELECT id, nombre, email, bio, avatar_color, created_at
      FROM usuarios WHERE id = ? AND (rol = 'creador' OR rol = 'maestro' OR rol = 'moderador')
    `, req.params.id);

    if (!creador) return res.status(404).json({ error: { message: 'Creador no encontrado.' } });

    // Query adaptativa — usa columnas que existan
    let cursos = [];
    try {
      cursos = await db.query(`
        SELECT id, titulo, descripcion, modelo_negocio, precio,
               gradient_class, modulos_count, duracion, estado,
               categoria
        FROM cursos
        WHERE creator_id = ? AND estado = 'publicado'
        ORDER BY created_at DESC
      `, req.params.id);
    } catch(_) {
      // Fallback sin columna categoria
      cursos = await db.query(`
        SELECT id, titulo, descripcion, modelo_negocio, precio,
               gradient_class, modulos_count, duracion, estado
        FROM cursos
        WHERE creator_id = ? AND estado = 'publicado'
        ORDER BY created_at DESC
      `, req.params.id);
    }

    let totalEstudiantes = 0;
    try {
      const r = await db.get(`
        SELECT COUNT(*) as total FROM inscripciones i
        INNER JOIN cursos c ON c.id = i.curso_id
        WHERE c.creator_id = ?
      `, req.params.id);
      totalEstudiantes = r?.total || 0;
    } catch(_) {}

    res.json({ success: true, data: { ...creador, cursos, total_estudiantes: totalEstudiantes } });
  } catch(err) {
    res.status(500).json({ error: { message: 'Error al obtener perfil: ' + err.message } });
  }
});

// DELETE /api/maestros/:id
router.delete('/:id', auth, soloAdmins, async (req, res) => {
  const maestro = await db.get("SELECT * FROM usuarios WHERE id = ? AND (rol = 'creador' OR rol = 'maestro')", req.params.id);
  if (!maestro) {
    return res.status(404).json({ error: { message: 'Maestro no encontrado.' } });
  }

  // Desvincular cursos de este creador (o ponerles creator_id a NULL si se pudiera, pero es REFERENCES, así que delete cursos or change them)
  // Let's delete their courses or set creator_id to something else
  // To avoid SQL foreign key failures, we delete the cursos of this teacher
  await db.run('DELETE FROM cursos WHERE creator_id = ?', maestro.id);
  await db.run('DELETE FROM usuarios WHERE id = ?', maestro.id);

  res.json({ success: true, message: 'Maestro eliminado correctamente junto con sus cursos.' });
});

module.exports = router;
