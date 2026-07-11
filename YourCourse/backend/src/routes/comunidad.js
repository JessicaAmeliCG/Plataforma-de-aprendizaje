/**
 * comunidad.js — Rutas de la comunidad
 * GET    /api/comunidad                    — Listar posts (reseñas o recomendaciones)
 * POST   /api/comunidad                    — Crear post
 * DELETE /api/comunidad/:id               — Eliminar post
 * POST   /api/comunidad/:id/respuestas    — Responder a un post
 * DELETE /api/comunidad/respuestas/:rid   — Eliminar respuesta
 */

const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');
const notif  = require('../services/notif');


const JWT_SECRET = process.env.JWT_SECRET || 'yourcourse_fallback_secret';

async function auth(req, res, next) {
  const h = req.headers['authorization'];
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: { message: 'No autenticado.' } });
  try { req.user = jwt.verify(h.split(' ')[1], JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: { message: 'Token inválido.' } }); }
}

// ─── GET /api/comunidad ───────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  const { tipo = 'all' } = req.query;

  // Whitelist explícita — ningún valor del usuario se interpola en el SQL
  const TIPOS_VALIDOS = ['resena', 'recomendacion'];
  const tipoFiltrado = TIPOS_VALIDOS.includes(tipo) ? tipo : null;

  const posts = tipoFiltrado
    ? await db.query(`
        SELECT
          p.*,
          u.nombre AS autor_nombre,
          u.avatar_color AS autor_color,
          c.titulo AS curso_titulo
        FROM comunidad_posts p
        JOIN usuarios u ON u.id = p.usuario_id
        LEFT JOIN cursos c ON c.id = p.curso_id
        WHERE p.tipo = ? AND u.academia_id = ?
        ORDER BY p.created_at DESC
      `, [tipoFiltrado, req.user.academia_id || 1])
    : await db.query(`
        SELECT
          p.*,
          u.nombre AS autor_nombre,
          u.avatar_color AS autor_color,
          c.titulo AS curso_titulo
        FROM comunidad_posts p
        JOIN usuarios u ON u.id = p.usuario_id
        LEFT JOIN cursos c ON c.id = p.curso_id
        WHERE u.academia_id = ?
        ORDER BY p.created_at DESC
      `, [req.user.academia_id || 1]);

  // Cargar respuestas para cada post de forma asíncrona
  const data = await Promise.all(posts.map(async p => {
    const respuestas = await db.query(`
      SELECT r.*, u.nombre AS autor_nombre, u.avatar_color AS autor_color, u.rol AS autor_rol
      FROM comunidad_respuestas r
      JOIN usuarios u ON u.id = r.usuario_id
      WHERE r.post_id = ?
      ORDER BY r.created_at ASC
    `, [p.id]);

    return {
      ...p,
      tags: (() => { try { return JSON.parse(p.tags || '[]'); } catch { return []; } })(),
      respuestas,
    };
  }));

  res.json({ success: true, data });
});

// ─── POST /api/comunidad ──────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { tipo = 'resena', titulo = '', contenido, rating = 0, tags = [], curso_id } = req.body;

  if (!contenido || contenido.trim().length < 5) {
    return res.status(400).json({ error: { message: 'El contenido debe tener al menos 5 caracteres.' } });
  }
  if (!['resena', 'recomendacion'].includes(tipo)) {
    return res.status(400).json({ error: { message: 'Tipo inválido.' } });
  }

  const result = await db.run(`
    INSERT INTO comunidad_posts (tipo, titulo, contenido, rating, tags, usuario_id, curso_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, tipo,
    titulo.trim(),
    contenido.trim(),
    tipo === 'resena' ? Math.min(5, Math.max(0, Number(rating))) : 0,
    JSON.stringify(Array.isArray(tags) ? tags : []),
    req.user.id,
    curso_id || null,);

  const post = await db.get(`
    SELECT p.*, u.nombre AS autor_nombre, u.avatar_color AS autor_color
    FROM comunidad_posts p JOIN usuarios u ON u.id = p.usuario_id
    WHERE p.id = ?
  `, result.lastInsertRowid);

  // Gamificación: Estudiante crea un post en el foro
  let gamification = null;
  try {
    const { procesarAccion } = require('../services/gamificationEngine');
    gamification = await procesarAccion(req.user.id, 'CREAR_POST');
  } catch(e) { console.error('Error gamificación:', e.message); }

  // Disparar notificación al creador (async)
  const autor = await db.get('SELECT * FROM usuarios WHERE id = ?', req.user.id);
  notif.onNuevoPost(post, autor).catch(e => console.error('notif post:', e.message));

  res.status(201).json({ success: true, data: { ...post, tags: JSON.parse(post.tags || '[]'), respuestas: [] }, gamification });

});

// ─── DELETE /api/comunidad/:id ────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  // RBAC: verificar rol ANTES de buscar el post
  if (req.user.rol !== 'superadmin' && req.user.rol !== 'moderador') {
    return res.status(403).json({ error: { message: 'Solo moderadores y administradores pueden eliminar posts.' } });
  }
  const post = await db.get('SELECT * FROM comunidad_posts WHERE id = ?', req.params.id);
  if (!post) return res.status(404).json({ error: { message: 'Post no encontrado.' } });
  await db.run('DELETE FROM comunidad_posts WHERE id = ?', post.id);
  res.json({ success: true, message: 'Post eliminado.' });
});


// ─── POST /api/comunidad/:id/respuestas ──────────────────────────────────────
router.post('/:id/respuestas', auth, async (req, res) => {
  const post = await db.get('SELECT id FROM comunidad_posts WHERE id = ?', req.params.id);
  if (!post) return res.status(404).json({ error: { message: 'Post no encontrado.' } });

  const { contenido } = req.body;
  if (!contenido || contenido.trim().length < 2) {
    return res.status(400).json({ error: { message: 'La respuesta debe tener al menos 2 caracteres.' } });
  }

  const result = await db.run('INSERT INTO comunidad_respuestas (post_id, usuario_id, contenido) VALUES (?, ?, ?)', post.id, req.user.id, contenido.trim());

  // Gamificación: Estudiante responde a un post
  let gamification = null;
  try {
    const { procesarAccion } = require('../services/gamificationEngine');
    gamification = await procesarAccion(req.user.id, 'RESPONDER_POST');
  } catch(e) { console.error('Error gamificación:', e.message); }

  const resp = await db.get(`
    SELECT r.*, u.nombre AS autor_nombre, u.avatar_color AS autor_color, u.rol AS autor_rol
    FROM comunidad_respuestas r JOIN usuarios u ON u.id = r.usuario_id
    WHERE r.id = ?
  `, result.lastInsertRowid);


  // Notificar al autor del post (async)
  const postCompleto = await db.get('SELECT * FROM comunidad_posts WHERE id = ?', post.id);
  const autor        = await db.get('SELECT * FROM usuarios WHERE id = ?', req.user.id);
  const postAutor    = await db.get('SELECT * FROM usuarios WHERE id = ?', postCompleto.usuario_id);
  notif.onNuevaRespuesta(postCompleto, autor, postAutor).catch(e => console.error('notif reply:', e.message));

  res.status(201).json({ success: true, data: resp, gamification });

});

// ─── DELETE /api/comunidad/respuestas/:rid ────────────────────────────────────
router.delete('/respuestas/:rid', auth, async (req, res) => {
  const resp = await db.get('SELECT * FROM comunidad_respuestas WHERE id = ?', req.params.rid);
  if (!resp) return res.status(404).json({ error: { message: 'Respuesta no encontrada.' } });
  if (req.user.rol !== 'superadmin' && req.user.rol !== 'moderador') {
    return res.status(403).json({ error: { message: 'Solo moderadores y administradores pueden eliminar respuestas.' } });
  }
  await db.run('DELETE FROM comunidad_respuestas WHERE id = ?', resp.id);
  res.json({ success: true });
});

module.exports = router;
