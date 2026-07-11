/**
 * cursos.js — Rutas de cursos y lecciones (videos)
 *
 * GET    /api/cursos                           — Listar cursos del creador
 * GET    /api/cursos/publicos                  — Cursos publicados
 * GET    /api/cursos/:id                       — Detalle de curso + lecciones
 * POST   /api/cursos                           — Crear curso
 * PATCH  /api/cursos/:id                       — Actualizar curso
 * DELETE /api/cursos/:id                       — Eliminar curso
 *
 * POST   /api/cursos/:id/lecciones             — Subir video (multipart/form-data)
 * PATCH  /api/cursos/:id/lecciones/:lid        — Editar título o reemplazar video
 * DELETE /api/cursos/:id/lecciones/:lid        — Eliminar lección + archivo
 * PUT    /api/cursos/:id/lecciones/reorder     — Reordenar lecciones (batch)
 */

const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../config/db');

const JWT_SECRET  = process.env.JWT_SECRET || 'yourcourse_fallback_secret';
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// ─── Multer — almacenamiento de videos ───────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext    = path.extname(file.originalname);
    cb(null, `video-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['.mp4', '.webm', '.mov', '.mkv', '.avi', '.m4v'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de video (mp4, webm, mov, mkv, avi, m4v).'));
    }
  },
});

// ─── Middlewares de auth ──────────────────────────────────────────────────────
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

const ROLES_CREADOR = ['creador', 'superadmin'];

function soloCreador(req, res, next) {
  if (!ROLES_CREADOR.includes(req.user.rol)) {
    return res.status(403).json({ error: { message: 'Solo los creadores o administradores pueden realizar esta acción.' } });
  }
  next();
}

// Helper: verificar que el curso pertenece al creador
async function getCursoPropio(cursoId, creatorId) {
  return await db.get('SELECT * FROM cursos WHERE id = ? AND creator_id = ?', cursoId, creatorId);
}

// Helper: eliminar archivo de disco si existe
function deleteFile(filePath) {
  try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
}

// ─── GET /api/cursos ──────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  // superadmin y moderador ven TODOS los cursos de su academia; creador solo los suyos de su academia
  const esSuperAdmin = ['superadmin', 'moderador'].includes(req.user.rol);
  const academiaId = req.user.academia_id || 1;
  const cursos = esSuperAdmin
    ? await db.query(`
        SELECT c.*, COUNT(i.id) AS estudiantes, u.nombre AS creador_nombre
        FROM cursos c
        LEFT JOIN inscripciones i ON i.curso_id = c.id
        LEFT JOIN usuarios u ON u.id = c.creator_id
        WHERE c.academia_id = ?
        GROUP BY c.id, u.nombre
        ORDER BY c.created_at DESC
      `, [academiaId])
    : await db.query(`
        SELECT c.*, COUNT(i.id) AS estudiantes
        FROM cursos c
        LEFT JOIN inscripciones i ON i.curso_id = c.id
        WHERE c.creator_id = ? AND c.academia_id = ?
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `, [req.user.id, academiaId]);
  return res.json({ success: true, data: cursos });
});

// ─── GET /api/cursos/publicos ─────────────────────────────────────────────────
router.get('/publicos', async (req, res) => {
  const academiaId = req.headers['x-academia-id'] || req.query.academia_id || 1;
  const cursos = await db.query(`
    SELECT c.*, COUNT(i.id) AS estudiantes, u.nombre AS creador_nombre
    FROM cursos c
    LEFT JOIN inscripciones i ON i.curso_id = c.id
    LEFT JOIN usuarios u ON u.id = c.creator_id
    WHERE c.estado = 'publicado' AND c.visibilidad = 'publico' AND c.academia_id = ?
    GROUP BY c.id, u.nombre
    ORDER BY c.created_at DESC
  `, [academiaId]);
  return res.json({ success: true, data: cursos });
});

// ─── GET /api/cursos/:id ──────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  const esAdmin = ['superadmin', 'moderador'].includes(req.user.rol);

  // superadmin y moderador acceden a cualquier curso
  const curso = esAdmin
    ? await db.get(`
        SELECT c.*, COUNT(i.id) AS estudiantes, u.nombre AS creador_nombre
        FROM cursos c
        LEFT JOIN inscripciones i ON i.curso_id = c.id
        LEFT JOIN usuarios u ON u.id = c.creator_id
        WHERE c.id = ?
        GROUP BY c.id, u.nombre
      `, req.params.id)
    : await db.get(`
        SELECT c.*, COUNT(i.id) AS estudiantes
        FROM cursos c
        LEFT JOIN inscripciones i ON i.curso_id = c.id
        WHERE c.id = ? AND (c.creator_id = ? OR EXISTS (
          SELECT 1 FROM inscripciones WHERE estudiante_id = ? AND curso_id = c.id
        ))
        GROUP BY c.id
      `, req.params.id, req.user.id, req.user.id);

  if (!curso) return res.status(404).json({ error: { message: 'Curso no encontrado o sin acceso.' } });

  const lecciones = await db.query(`
    SELECT * FROM lecciones WHERE curso_id = ? ORDER BY orden ASC, id ASC
  `, req.params.id);

  return res.json({ success: true, data: { ...curso, lecciones } });
});

// ─── POST /api/cursos ─────────────────────────────────────────────────────────
router.post('/', auth, soloCreador, async (req, res) => {
  const {
    titulo,
    descripcion    = '',
    precio         = 0,
    modelo_negocio = 'gratis',
    estado         = 'borrador',
    visibilidad    = 'publico',
    modulos_count  = 0,
    duracion       = '',
    gradient_class = 'from-violet-600 to-indigo-700',
  } = req.body;

  if (!titulo || titulo.trim().length < 3) {
    return res.status(400).json({ error: { message: 'El título debe tener al menos 3 caracteres.' } });
  }

  const MODELOS_VALIDOS = ['gratis', 'pago_unico', 'suscripcion'];
  if (!MODELOS_VALIDOS.includes(modelo_negocio)) {
    return res.status(400).json({ error: { message: 'Modelo de negocio inválido.' } });
  }

  const result = await db.run(`
    INSERT INTO cursos (titulo, descripcion, precio, modelo_negocio, estado, visibilidad, creator_id, modulos_count, duracion, gradient_class, academia_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, titulo.trim(),
    descripcion.trim(),
    modelo_negocio === 'gratis' ? 0 : Number(precio),
    modelo_negocio,
    estado,
    visibilidad,
    req.user.id,
    Number(modulos_count),
    duracion.trim(),
    gradient_class,
    req.user.academia_id || 1);

  const newCurso = await db.get('SELECT *, 0 as estudiantes FROM cursos WHERE id = ?', result.lastInsertRowid);
  return res.status(201).json({ success: true, data: newCurso });
});

// ─── PATCH /api/cursos/:id ────────────────────────────────────────────────────
router.patch('/:id', auth, soloCreador, async (req, res) => {
  // superadmin puede editar cualquier curso; creador solo los suyos
  const esAdmin = ['superadmin'].includes(req.user.rol);
  const curso = esAdmin
    ? await db.get('SELECT * FROM cursos WHERE id = ?', req.params.id)
    : getCursoPropio(req.params.id, req.user.id);
  if (!curso) return res.status(404).json({ error: { message: 'Curso no encontrado.' } });

  const { titulo, descripcion, precio, modelo_negocio, estado, visibilidad, modulos_count, duracion, gradient_class } = req.body;

  await db.run(`
    UPDATE cursos SET
      titulo         = COALESCE(?, titulo),
      descripcion    = COALESCE(?, descripcion),
      precio         = COALESCE(?, precio),
      modelo_negocio = COALESCE(?, modelo_negocio),
      estado         = COALESCE(?, estado),
      visibilidad    = COALESCE(?, visibilidad),
      modulos_count  = COALESCE(?, modulos_count),
      duracion       = COALESCE(?, duracion),
      gradient_class = COALESCE(?, gradient_class)
    WHERE id = ?
  `, titulo, descripcion, precio, modelo_negocio, estado, visibilidad, modulos_count, duracion, gradient_class, req.params.id);

  const updated = await db.get(`
    SELECT *, (SELECT COUNT(*) FROM inscripciones WHERE curso_id = ?) as estudiantes
    FROM cursos WHERE id = ?
  `, req.params.id, req.params.id);

  return res.json({ success: true, data: updated });
});

// ─── DELETE /api/cursos/:id ───────────────────────────────────────────────────
router.delete('/:id', auth, soloCreador, async (req, res) => {
  const curso = await getCursoPropio(req.params.id, req.user.id);
  if (!curso) return res.status(404).json({ error: { message: 'Curso no encontrado.' } });

  // Borrar archivos de video de las lecciones del curso
  const lecciones = await db.query('SELECT video_url FROM lecciones WHERE curso_id = ?', req.params.id);
  for (const l of lecciones) {
    if (l.video_url) deleteFile(path.join(UPLOADS_DIR, path.basename(l.video_url)));
  }

  await db.run('DELETE FROM cursos WHERE id = ?', req.params.id);
  return res.json({ success: true, message: 'Curso eliminado.' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LECCIONES (VIDEOS)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── POST /api/cursos/:id/lecciones ──────────────────────────────────────────
// Subir video o ingresar iFrame + crear lección
router.post('/:id/lecciones', auth, soloCreador, upload.single('video'), async (req, res) => {
  const curso = await getCursoPropio(req.params.id, req.user.id);
  if (!curso) {
    if (req.file) deleteFile(req.file.path);
    return res.status(404).json({ error: { message: 'Curso no encontrado.' } });
  }

  const titulo = (req.body.titulo || 'Lección sin título').trim();
  const iframeUrl = (req.body.iframe_url || '').trim();

  // Calcular el siguiente orden (máximo actual + 1)
  const maxOrden = await db.get('SELECT MAX(orden) as m FROM lecciones WHERE curso_id = ?', req.params.id);
  const orden    = (maxOrden.m ?? -1) + 1;

  const videoUrl = req.file ? `/uploads/${req.file.filename}` : '';

  const result = await db.run(`
    INSERT INTO lecciones (titulo, video_url, iframe_url, orden, curso_id)
    VALUES (?, ?, ?, ?, ?)
  `, titulo, videoUrl, iframeUrl, orden, req.params.id);

  const leccion = await db.get('SELECT * FROM lecciones WHERE id = ?', result.lastInsertRowid);
  return res.status(201).json({ success: true, data: leccion });
});

// ─── PATCH /api/cursos/:id/lecciones/reorder ─────────────────────────────────
// Debe ir ANTES de /:lid para evitar conflicto de rutas
router.put('/:id/lecciones/reorder', auth, soloCreador, async (req, res) => {
  const curso = await getCursoPropio(req.params.id, req.user.id);
  if (!curso) return res.status(404).json({ error: { message: 'Curso no encontrado.' } });

  const { ids } = req.body; // Array de IDs en el nuevo orden
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: { message: '`ids` debe ser un array.' } });
  }

  for (let i = 0; i < ids.length; i++) {
    await db.run('UPDATE lecciones SET orden = ? WHERE id = ? AND curso_id = ?', i, ids[i], req.params.id);
  }

  const lecciones = await db.query('SELECT * FROM lecciones WHERE curso_id = ? ORDER BY orden ASC', req.params.id);
  return res.json({ success: true, data: lecciones });
});

// ─── PATCH /api/cursos/:id/lecciones/:lid ────────────────────────────────────
// Editar título, reemplazar video o actualizar iFrame URL
router.patch('/:id/lecciones/:lid', auth, soloCreador, upload.single('video'), async (req, res) => {
  const curso = await getCursoPropio(req.params.id, req.user.id);
  if (!curso) {
    if (req.file) deleteFile(req.file.path);
    return res.status(404).json({ error: { message: 'Curso no encontrado.' } });
  }

  const leccion = await db.get('SELECT * FROM lecciones WHERE id = ? AND curso_id = ?', req.params.lid, req.params.id);
  if (!leccion) {
    if (req.file) deleteFile(req.file.path);
    return res.status(404).json({ error: { message: 'Lección no encontrada.' } });
  }

  const titulo = req.body.titulo !== undefined ? req.body.titulo.trim() : leccion.titulo;
  const iframeUrl = req.body.iframe_url !== undefined ? req.body.iframe_url.trim() : leccion.iframe_url;
  let videoUrl  = leccion.video_url;

  if (req.file) {
    // Borrar video anterior si había uno y se sube uno nuevo
    if (leccion.video_url) deleteFile(path.join(UPLOADS_DIR, path.basename(leccion.video_url)));
    videoUrl = `/uploads/${req.file.filename}`;
  }

  await db.run('UPDATE lecciones SET titulo = ?, video_url = ?, iframe_url = ? WHERE id = ?', titulo, videoUrl, iframeUrl, leccion.id);
  const updated = await db.get('SELECT * FROM lecciones WHERE id = ?', leccion.id);
  return res.json({ success: true, data: updated });
});

// ─── DELETE /api/cursos/:id/lecciones/:lid ────────────────────────────────────
router.delete('/:id/lecciones/:lid', auth, soloCreador, async (req, res) => {
  const curso = await getCursoPropio(req.params.id, req.user.id);
  if (!curso) return res.status(404).json({ error: { message: 'Curso no encontrado.' } });

  const leccion = await db.get('SELECT * FROM lecciones WHERE id = ? AND curso_id = ?', req.params.lid, req.params.id);
  if (!leccion) return res.status(404).json({ error: { message: 'Lección no encontrada.' } });

  // Borrar archivo físico
  if (leccion.video_url) deleteFile(path.join(UPLOADS_DIR, path.basename(leccion.video_url)));

  await db.run('DELETE FROM lecciones WHERE id = ?', leccion.id);

  // Re-normalizar los órdenes restantes
  const restantes = await db.query('SELECT id FROM lecciones WHERE curso_id = ? ORDER BY orden ASC, id ASC', req.params.id);
  for (let i = 0; i < restantes.length; i++) {
    await db.run('UPDATE lecciones SET orden = ? WHERE id = ?', i, restantes[i].id);
  }

  return res.json({ success: true, message: 'Lección eliminada.' });
});

module.exports = router;
