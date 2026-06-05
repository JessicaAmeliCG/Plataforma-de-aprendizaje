/**
 * estudiantes.js — Rutas de estudiantes (solo para creador)
 * GET  /api/estudiantes           — Todos los estudiantes con sus cursos inscritos
 * GET  /api/estudiantes/:id       — Detalle de un estudiante específico
 * POST /api/estudiantes/inscribir — Inscribir estudiante en un curso
 */

const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'yourcourse_fallback_secret';

function auth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'No autenticado.' } });
  }
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: { message: 'Token inválido o expirado.' } });
  }
}

// ─── GET /api/estudiantes ─────────────────────────────────────────────────────
// Retorna todos los estudiantes con sus cursos inscritos (del creador autenticado)
router.get('/', auth, (req, res) => {
  // Todos los estudiantes
  const estudiantes = db.prepare(`
    SELECT
      u.id,
      u.nombre,
      u.email,
      u.bio,
      u.avatar_color,
      u.created_at
    FROM usuarios u
    WHERE u.rol = 'estudiante'
    ORDER BY u.created_at DESC
  `).all();

  // Para cada estudiante, obtener sus cursos inscritos
  const getCursos = db.prepare(`
    SELECT
      c.id,
      c.titulo,
      c.gradient_class,
      c.modelo_negocio,
      i.created_at AS inscrito_en
    FROM inscripciones i
    JOIN cursos c ON c.id = i.curso_id
    WHERE i.estudiante_id = ?
    ORDER BY i.created_at DESC
  `);

  const result = estudiantes.map(e => ({
    ...e,
    cursos: getCursos.all(e.id),
  }));

  return res.json({ success: true, data: result, total: result.length });
});

// ─── GET /api/estudiantes/:id ─────────────────────────────────────────────────
router.get('/:id', auth, (req, res) => {
  const estudiante = db.prepare(`
    SELECT id, nombre, email, bio, avatar_color, created_at
    FROM usuarios WHERE id = ? AND rol = 'estudiante'
  `).get(req.params.id);

  if (!estudiante) {
    return res.status(404).json({ error: { message: 'Estudiante no encontrado.' } });
  }

  const cursos = db.prepare(`
    SELECT c.id, c.titulo, c.gradient_class, c.modelo_negocio, c.precio, i.created_at AS inscrito_en
    FROM inscripciones i
    JOIN cursos c ON c.id = i.curso_id
    WHERE i.estudiante_id = ?
  `).all(estudiante.id);

  return res.json({ success: true, data: { ...estudiante, cursos } });
});

// ─── POST /api/estudiantes/inscribir ─────────────────────────────────────────
// Cualquier estudiante autenticado puede inscribirse en un curso público
router.post('/inscribir', auth, (req, res) => {
  const { curso_id } = req.body;
  if (!curso_id) {
    return res.status(400).json({ error: { message: 'curso_id es requerido.' } });
  }

  const curso = db.prepare("SELECT id FROM cursos WHERE id = ? AND estado = 'publicado'").get(curso_id);
  if (!curso) {
    return res.status(404).json({ error: { message: 'Curso no disponible.' } });
  }

  try {
    db.prepare('INSERT INTO inscripciones (estudiante_id, curso_id) VALUES (?, ?)').run(req.user.id, curso_id);
    return res.status(201).json({ success: true, message: '¡Inscripción exitosa!' });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: { message: 'Ya estás inscrito en este curso.' } });
    }
    throw err;
  }
});

module.exports = router;
