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

function auth(req, res, next) {
  const h = req.headers['authorization'];
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: { message: 'No autenticado.' } });
  try { req.user = jwt.verify(h.split(' ')[1], JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: { message: 'Token inválido.' } }); }
}

// ─── GET /api/comunidad ───────────────────────────────────────────────────────
router.get('/', auth, (req, res) => {
  const { tipo = 'all' } = req.query;

  // Whitelist explícita — ningún valor del usuario se interpola en el SQL
  const TIPOS_VALIDOS = ['resena', 'recomendacion'];
  const tipoFiltrado = TIPOS_VALIDOS.includes(tipo) ? tipo : null;

  // Dos prepared statements separados: con filtro o sin filtro
  const posts = tipoFiltrado
    ? db.prepare(`
        SELECT
          p.*,
          u.nombre AS autor_nombre,
          u.avatar_color AS autor_color,
          c.titulo AS curso_titulo
        FROM comunidad_posts p
        JOIN usuarios u ON u.id = p.usuario_id
        LEFT JOIN cursos c ON c.id = p.curso_id
        WHERE p.tipo = ?
        ORDER BY p.created_at DESC
      `).all(tipoFiltrado)
    : db.prepare(`
        SELECT
          p.*,
          u.nombre AS autor_nombre,
          u.avatar_color AS autor_color,
          c.titulo AS curso_titulo
        FROM comunidad_posts p
        JOIN usuarios u ON u.id = p.usuario_id
        LEFT JOIN cursos c ON c.id = p.curso_id
        ORDER BY p.created_at DESC
      `).all();

  // Cargar respuestas para cada post
  const getRespuestas = db.prepare(`
    SELECT r.*, u.nombre AS autor_nombre, u.avatar_color AS autor_color, u.rol AS autor_rol
    FROM comunidad_respuestas r
    JOIN usuarios u ON u.id = r.usuario_id
    WHERE r.post_id = ?
    ORDER BY r.created_at ASC
  `);

  const data = posts.map(p => ({
    ...p,
    tags: (() => { try { return JSON.parse(p.tags || '[]'); } catch { return []; } })(),
    respuestas: getRespuestas.all(p.id),
  }));

  res.json({ success: true, data });
});

// ─── POST /api/comunidad ──────────────────────────────────────────────────────
router.post('/', auth, (req, res) => {
  const { tipo = 'resena', titulo = '', contenido, rating = 0, tags = [], curso_id } = req.body;

  if (!contenido || contenido.trim().length < 5) {
    return res.status(400).json({ error: { message: 'El contenido debe tener al menos 5 caracteres.' } });
  }
  if (!['resena', 'recomendacion'].includes(tipo)) {
    return res.status(400).json({ error: { message: 'Tipo inválido.' } });
  }

  const result = db.prepare(`
    INSERT INTO comunidad_posts (tipo, titulo, contenido, rating, tags, usuario_id, curso_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    tipo,
    titulo.trim(),
    contenido.trim(),
    tipo === 'resena' ? Math.min(5, Math.max(0, Number(rating))) : 0,
    JSON.stringify(Array.isArray(tags) ? tags : []),
    req.user.id,
    curso_id || null,
  );

  const post = db.prepare(`
    SELECT p.*, u.nombre AS autor_nombre, u.avatar_color AS autor_color
    FROM comunidad_posts p JOIN usuarios u ON u.id = p.usuario_id
    WHERE p.id = ?
  `).get(result.lastInsertRowid);

  // Disparar notificación al creador (async)
  const autor = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.user.id);
  notif.onNuevoPost(post, autor).catch(e => console.error('notif post:', e.message));

  res.status(201).json({ success: true, data: { ...post, tags: JSON.parse(post.tags || '[]'), respuestas: [] } });

});

// ─── DELETE /api/comunidad/:id ────────────────────────────────────────────────
router.delete('/:id', auth, (req, res) => {
  const post = db.prepare('SELECT * FROM comunidad_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: { message: 'Post no encontrado.' } });
  if (post.usuario_id !== req.user.id && req.user.rol !== 'creador') {
    return res.status(403).json({ error: { message: 'Sin permiso para eliminar.' } });
  }
  db.prepare('DELETE FROM comunidad_posts WHERE id = ?').run(post.id);
  res.json({ success: true, message: 'Post eliminado.' });
});

// ─── POST /api/comunidad/:id/respuestas ──────────────────────────────────────
router.post('/:id/respuestas', auth, (req, res) => {
  const post = db.prepare('SELECT id FROM comunidad_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: { message: 'Post no encontrado.' } });

  const { contenido } = req.body;
  if (!contenido || contenido.trim().length < 2) {
    return res.status(400).json({ error: { message: 'La respuesta debe tener al menos 2 caracteres.' } });
  }

  const result = db.prepare('INSERT INTO comunidad_respuestas (post_id, usuario_id, contenido) VALUES (?, ?, ?)').run(post.id, req.user.id, contenido.trim());

  const resp = db.prepare(`
    SELECT r.*, u.nombre AS autor_nombre, u.avatar_color AS autor_color, u.rol AS autor_rol
    FROM comunidad_respuestas r JOIN usuarios u ON u.id = r.usuario_id
    WHERE r.id = ?
  `).get(result.lastInsertRowid);

  // Notificar al autor del post (async)
  const postCompleto = db.prepare('SELECT * FROM comunidad_posts WHERE id = ?').get(post.id);
  const autor        = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.user.id);
  const postAutor    = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(postCompleto.usuario_id);
  notif.onNuevaRespuesta(postCompleto, autor, postAutor).catch(e => console.error('notif reply:', e.message));

  res.status(201).json({ success: true, data: resp });

});

// ─── DELETE /api/comunidad/respuestas/:rid ────────────────────────────────────
router.delete('/respuestas/:rid', auth, (req, res) => {
  const resp = db.prepare('SELECT * FROM comunidad_respuestas WHERE id = ?').get(req.params.rid);
  if (!resp) return res.status(404).json({ error: { message: 'Respuesta no encontrada.' } });
  if (resp.usuario_id !== req.user.id && req.user.rol !== 'creador') {
    return res.status(403).json({ error: { message: 'Sin permiso.' } });
  }
  db.prepare('DELETE FROM comunidad_respuestas WHERE id = ?').run(resp.id);
  res.json({ success: true });
});

module.exports = router;
