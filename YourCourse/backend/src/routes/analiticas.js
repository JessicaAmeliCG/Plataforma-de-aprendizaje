/**
 * analiticas.js — Rutas de analíticas del creador
 * GET /api/analiticas — Datos para gráficas de ingresos, alumnos y comprensión
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

// ─── GET /api/analiticas ──────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const academiaId = req.user.academia_id || 1;

    // 1. Cursos con estudiantes e ingresos estimados (con GROUP BY completo para PostgreSQL y CAST a numeric para ROUND)
    const cursosData = await db.query(`
      SELECT
        c.id,
        c.titulo,
        c.precio,
        c.modelo_negocio,
        c.estado,
        c.gradient_class,
        COUNT(i.id) AS estudiantes,
        CASE
          WHEN c.modelo_negocio = 'gratis' THEN 0
          ELSE ROUND(CAST(c.precio * COUNT(i.id) AS numeric), 2)
        END AS ingresos_estimados
      FROM cursos c
      LEFT JOIN inscripciones i ON i.curso_id = c.id
      WHERE c.creator_id = ? AND c.academia_id = ?
      GROUP BY c.id, c.titulo, c.precio, c.modelo_negocio, c.estado, c.gradient_class
      ORDER BY estudiantes DESC
    `, [req.user.id, academiaId]);

    // 2. Promedio de calificación por curso (de reseñas de la comunidad con CAST a numeric para ROUND)
    const ratingsData = await db.query(`
      SELECT
        c.id AS curso_id,
        c.titulo,
        ROUND(CAST(AVG(CASE WHEN p.rating > 0 THEN p.rating ELSE NULL END) AS numeric), 1) AS avg_rating,
        COUNT(CASE WHEN p.rating > 0 THEN 1 END) AS total_resenas
      FROM cursos c
      LEFT JOIN comunidad_posts p ON p.curso_id = c.id AND p.tipo = 'resena'
      WHERE c.creator_id = ? AND c.academia_id = ?
      GROUP BY c.id, c.titulo
    `, [req.user.id, academiaId]);

    // 3. KPIs globales (Corrigiendo precedencia de operadores en await db.get)
    const totalEstudiantesRow = await db.get("SELECT COUNT(*) as c FROM usuarios WHERE rol = 'estudiante' AND academia_id = ?", [academiaId]);
    const totalEstudiantes = totalEstudiantesRow ? totalEstudiantesRow.c : 0;

    const totalInscripcionesRow = await db.get(`
      SELECT COUNT(*) as c FROM inscripciones i
      JOIN cursos c ON c.id = i.curso_id
      WHERE c.creator_id = ? AND c.academia_id = ?
    `, [req.user.id, academiaId]);
    const totalInscripciones = totalInscripcionesRow ? totalInscripcionesRow.c : 0;

    const ingresoTotal = cursosData.reduce((sum, c) => sum + (Number(c.ingresos_estimados) || 0), 0);

    const totalResenasRow = await db.get(`
      SELECT COUNT(*) as c FROM comunidad_posts p
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.tipo = 'resena' AND u.academia_id = ?
    `, [academiaId]);
    const totalResenas = totalResenasRow ? totalResenasRow.c : 0;

    const avgRatingRow = await db.get(`
      SELECT AVG(p.rating) as avg FROM comunidad_posts p
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.tipo = 'resena' AND u.academia_id = ? AND p.rating > 0
    `, [academiaId]);
    const avgRatingGlobal = avgRatingRow && avgRatingRow.avg ? Math.round(Number(avgRatingRow.avg) * 10) / 10 : 0;

    // 4. Actividad mensual (últimos 6 meses de inscripciones)
    const actividadMensual = await db.query(`
      SELECT
        strftime('%Y-%m', i.created_at) AS mes,
        COUNT(*) AS inscripciones
      FROM inscripciones i
      JOIN cursos c ON c.id = i.curso_id
      WHERE c.creator_id = ? AND c.academia_id = ?
      GROUP BY strftime('%Y-%m', i.created_at)
      ORDER BY mes ASC
      LIMIT 6
    `, [req.user.id, academiaId]);

    res.json({
      success: true,
      data: {
        cursos:           cursosData,
        ratings:          ratingsData,
        actividadMensual,
        kpis: {
          totalEstudiantes,
          totalInscripciones,
          ingresoTotal: Math.round(ingresoTotal),
          totalResenas,
          avgRatingGlobal: avgRatingGlobal || 0,
          totalCursos: cursosData.length,
        },
      },
    });
  } catch (err) {
    console.error('Error en GET /api/analiticas:', err.message);
    res.status(500).json({ error: { message: err.message } });
  }
});

module.exports = router;
