/**
 * gamificacion.js — Endpoints para el sistema de gamificación
 * GET /api/gamificacion             — Obtener perfil de gamificación del usuario logueado
 * GET /api/gamificacion/leaderboard — Obtener tabla de posiciones
 */

const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const { obtenerPerfil, obtenerLeaderboard } = require('../services/gamificationEngine');

const JWT_SECRET = process.env.JWT_SECRET || 'yourcourse_fallback_secret';

function auth(req, res, next) {
  const h = req.headers['authorization'];
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: { message: 'No autenticado.' } });
  try { req.user = jwt.verify(h.split(' ')[1], JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: { message: 'Token inválido.' } }); }
}

// GET /api/gamificacion
router.get('/', auth, async (req, res) => {
  try {
    const perfil = await obtenerPerfil(req.user.id);
    if (!perfil) {
      return res.json({
        success: true,
        data: { puntos_total: 0, nivel: 1, racha_dias: 0, logros: [] }
      });
    }
    res.json({
      success: true,
      data: {
        ...perfil,
        logros: JSON.parse(perfil.logros || '[]'),
      }
    });
  } catch(err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/gamificacion/leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const leaderboard = await obtenerLeaderboard(req.user.academia_id || 1);
    res.json({ success: true, data: leaderboard });
  } catch(err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

module.exports = router;
