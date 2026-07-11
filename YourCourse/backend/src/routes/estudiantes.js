/**
 * estudiantes.js — Rutas de estudiantes
 */

const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');
const { procesarAccion } = require('../services/gamificationEngine');

const JWT_SECRET = process.env.JWT_SECRET || 'yourcourse_fallback_secret';

async function auth(req, res, next) {
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

// GET /api/estudiantes
router.get('/', auth, async (req, res) => {
  try {
    const estudiantes = await db.query(`
      SELECT id, nombre, email, bio, avatar_color, created_at
      FROM usuarios
      WHERE rol = 'estudiante' AND academia_id = ?
      ORDER BY created_at DESC
    `, [req.user.academia_id || 1]);

    const result = await Promise.all(estudiantes.map(async e => {
      const cursos = await db.query(`
        SELECT c.id, c.titulo, c.gradient_class, c.modelo_negocio,
               i.created_at AS inscrito_en, i.progreso, i.completed_lessons
        FROM inscripciones i
        JOIN cursos c ON c.id = i.curso_id
        WHERE i.estudiante_id = ?
        ORDER BY i.created_at DESC
      `, [e.id]);

      return {
        ...e,
        cursos: cursos.map(c => ({
          ...c,
          completed_lessons: JSON.parse(c.completed_lessons || '[]'),
        })),
      };
    }));

    return res.json({ success: true, data: result, total: result.length });
  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/estudiantes/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const estudiante = await db.get(`
      SELECT id, nombre, email, bio, avatar_color, created_at
      FROM usuarios WHERE id = ? AND rol = 'estudiante'
    `, req.params.id);

    if (!estudiante) {
      return res.status(404).json({ error: { message: 'Estudiante no encontrado.' } });
    }

    const enrolled = await db.query(`
      SELECT c.id, c.titulo, c.gradient_class, c.modelo_negocio, c.precio,
             i.created_at AS inscrito_en, i.progreso, i.completed_lessons
      FROM inscripciones i
      JOIN cursos c ON c.id = i.curso_id
      WHERE i.estudiante_id = ?
    `, estudiante.id);

    const cursos = enrolled.map(c => ({
      ...c,
      completed_lessons: JSON.parse(c.completed_lessons || '[]'),
    }));

    return res.json({ success: true, data: { ...estudiante, cursos } });
  } catch(err) {
    return res.status(500).json({ error: { message: err.message } });
  }
});

// POST /api/estudiantes/inscribir
router.post('/inscribir', auth, async (req, res) => {
  const { curso_id } = req.body;
  if (!curso_id) {
    return res.status(400).json({ error: { message: 'curso_id es requerido.' } });
  }

  const curso = await db.get("SELECT id FROM cursos WHERE id = ? AND estado = 'publicado'", curso_id);
  if (!curso) {
    return res.status(404).json({ error: { message: 'Curso no disponible.' } });
  }

  try {
    await db.run('INSERT INTO inscripciones (estudiante_id, curso_id) VALUES (?, ?)', req.user.id, curso_id);

    // Gamificación: Inscribirse en un curso (AWAITED)
    const gamification = await procesarAccion(req.user.id, 'INSCRIBIRSE_CURSO');

    return res.status(201).json({
      success: true,
      message: '¡Inscripción exitosa!',
      gamification,
    });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: { message: 'Ya estás inscrito en este curso.' } });
    }
    return res.status(500).json({ error: { message: err.message } });
  }
});

// POST /api/estudiantes/progreso
router.post('/progreso', auth, async (req, res) => {
  const { curso_id, completed_lessons } = req.body;
  if (!curso_id || !Array.isArray(completed_lessons)) {
    return res.status(400).json({ error: { message: 'curso_id y completed_lessons (array) son requeridos.' } });
  }

  try {
    const totalLeccionesRow = await db.get('SELECT COUNT(*) as c FROM lecciones WHERE curso_id = ?', curso_id);
    const totalLecciones = totalLeccionesRow ? totalLeccionesRow.c : 0;
    const progreso = totalLecciones > 0
      ? Math.min(100, Math.round((completed_lessons.length / totalLecciones) * 100))
      : 0;

    const insc = await db.get('SELECT completed_lessons, progreso FROM inscripciones WHERE estudiante_id = ? AND curso_id = ?', req.user.id, curso_id);
    const oldCompleted = insc ? JSON.parse(insc.completed_lessons || '[]') : [];
    const oldProgreso = insc ? insc.progreso : 0;

    await db.run(`
      UPDATE inscripciones
      SET completed_lessons = ?, progreso = ?
      WHERE estudiante_id = ? AND curso_id = ?
    `, JSON.stringify(completed_lessons), progreso, req.user.id, curso_id);

    let gamification = null;
    if (completed_lessons.length > oldCompleted.length) {
      gamification = await procesarAccion(req.user.id, 'LECCION_COMPLETADA');
    }

    if (progreso === 100 && oldProgreso < 100) {
      gamification = await procesarAccion(req.user.id, 'CURSO_COMPLETADO');
    }

    return res.json({ success: true, progreso, completed_lessons, gamification });
  } catch(err) {
    return res.status(500).json({ error: { message: err.message } });
  }
});

module.exports = router;
