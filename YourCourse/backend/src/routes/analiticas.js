/**
 * analiticas.js — Rutas de analíticas del creador
 * GET /api/analiticas — Datos para gráficas de ingresos, alumnos y comprensión
 */

const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'yourcourse_fallback_secret';

function auth(req, res, next) {
  const h = req.headers['authorization'];
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: { message: 'No autenticado.' } });
  try { req.user = jwt.verify(h.split(' ')[1], JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: { message: 'Token inválido.' } }); }
}

// ─── GET /api/analiticas ──────────────────────────────────────────────────────
router.get('/', auth, (req, res) => {
  // 1. Cursos con estudiantes e ingresos estimados
  const cursosData = db.prepare(`
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
        ELSE ROUND(c.precio * COUNT(i.id), 2)
      END AS ingresos_estimados
    FROM cursos c
    LEFT JOIN inscripciones i ON i.curso_id = c.id
    WHERE c.creator_id = ?
    GROUP BY c.id
    ORDER BY estudiantes DESC
  `).all(req.user.id);

  // 2. Promedio de calificación por curso (de reseñas de la comunidad)
  const ratingsData = db.prepare(`
    SELECT
      c.id AS curso_id,
      c.titulo,
      ROUND(AVG(CASE WHEN p.rating > 0 THEN p.rating ELSE NULL END), 1) AS avg_rating,
      COUNT(CASE WHEN p.rating > 0 THEN 1 END) AS total_resenas
    FROM cursos c
    LEFT JOIN comunidad_posts p ON p.curso_id = c.id AND p.tipo = 'resena'
    WHERE c.creator_id = ?
    GROUP BY c.id
  `).all(req.user.id);

  // 3. KPIs globales
  const totalEstudiantes = db.prepare("SELECT COUNT(*) as c FROM usuarios WHERE rol = 'estudiante'").get().c;
  const totalInscripciones = db.prepare(`
    SELECT COUNT(*) as c FROM inscripciones i
    JOIN cursos c ON c.id = i.curso_id
    WHERE c.creator_id = ?
  `).get(req.user.id).c;

  const ingresoTotal = cursosData.reduce((sum, c) => sum + (c.ingresos_estimados || 0), 0);
  const totalResenas = db.prepare("SELECT COUNT(*) as c FROM comunidad_posts WHERE tipo = 'resena'").get().c;
  const avgRatingGlobal = db.prepare("SELECT ROUND(AVG(rating), 1) as avg FROM comunidad_posts WHERE tipo = 'resena' AND rating > 0").get().avg;


  // 4. Actividad mensual (últimos 6 meses de inscripciones)
  const actividadMensual = db.prepare(`
    SELECT
      strftime('%Y-%m', i.created_at) AS mes,
      COUNT(*) AS inscripciones
    FROM inscripciones i
    JOIN cursos c ON c.id = i.curso_id
    WHERE c.creator_id = ?
    GROUP BY mes
    ORDER BY mes ASC
    LIMIT 6
  `).all(req.user.id);

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
});

module.exports = router;
