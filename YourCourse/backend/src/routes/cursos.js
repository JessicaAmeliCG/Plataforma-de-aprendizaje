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

function soloCreador(req, res, next) {
  if (req.user.rol !== 'creador') {
    return res.status(403).json({ error: { message: 'Solo los creadores pueden realizar esta acción.' } });
  }
  next();
}

// Helper: verificar que el curso pertenece al creador
function getCursoPropio(cursoId, creatorId) {
  return db.prepare('SELECT * FROM cursos WHERE id = ? AND creator_id = ?').get(cursoId, creatorId);
}

// Helper: eliminar archivo de disco si existe
function deleteFile(filePath) {
  try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
}

// ─── GET /api/cursos ──────────────────────────────────────────────────────────
router.get('/', auth, (req, res) => {
  const cursos = db.prepare(`
    SELECT
      c.*,
      COUNT(i.id) AS estudiantes
    FROM cursos c
    LEFT JOIN inscripciones i ON i.curso_id = c.id
    WHERE c.creator_id = ?
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all(req.user.id);
  return res.json({ success: true, data: cursos });
});

// ─── GET /api/cursos/publicos ─────────────────────────────────────────────────
router.get('/publicos', (req, res) => {
  const cursos = db.prepare(`
    SELECT c.*, COUNT(i.id) AS estudiantes, u.nombre AS creador_nombre
    FROM cursos c
    LEFT JOIN inscripciones i ON i.curso_id = c.id
    LEFT JOIN usuarios u ON u.id = c.creator_id
    WHERE c.estado = 'publicado'
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all();
  return res.json({ success: true, data: cursos });
});

// ─── GET /api/cursos/:id ──────────────────────────────────────────────────────
router.get('/:id', auth, (req, res) => {
  const curso = db.prepare(`
    SELECT c.*, COUNT(i.id) AS estudiantes
    FROM cursos c
    LEFT JOIN inscripciones i ON i.curso_id = c.id
    WHERE c.id = ? AND c.creator_id = ?
    GROUP BY c.id
  `).get(req.params.id, req.user.id);

  if (!curso) return res.status(404).json({ error: { message: 'Curso no encontrado.' } });

  const lecciones = db.prepare(`
    SELECT * FROM lecciones WHERE curso_id = ? ORDER BY orden ASC, id ASC
  `).all(req.params.id);

  return res.json({ success: true, data: { ...curso, lecciones } });
});

// ─── POST /api/cursos ─────────────────────────────────────────────────────────
router.post('/', auth, soloCreador, (req, res) => {
  const {
    titulo,
    descripcion    = '',
    precio         = 0,
    modelo_negocio = 'gratis',
    estado         = 'borrador',
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

  const result = db.prepare(`
    INSERT INTO cursos (titulo, descripcion, precio, modelo_negocio, estado, creator_id, modulos_count, duracion, gradient_class)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    titulo.trim(),
    descripcion.trim(),
    modelo_negocio === 'gratis' ? 0 : Number(precio),
    modelo_negocio,
    estado,
    req.user.id,
    Number(modulos_count),
    duracion.trim(),
    gradient_class,
  );

  const newCurso = db.prepare('SELECT *, 0 as estudiantes FROM cursos WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({ success: true, data: newCurso });
});

// ─── PATCH /api/cursos/:id ────────────────────────────────────────────────────
router.patch('/:id', auth, soloCreador, (req, res) => {
  const curso = getCursoPropio(req.params.id, req.user.id);
  if (!curso) return res.status(404).json({ error: { message: 'Curso no encontrado.' } });

  const { titulo, descripcion, precio, modelo_negocio, estado, modulos_count, duracion, gradient_class } = req.body;

  db.prepare(`
    UPDATE cursos SET
      titulo         = COALESCE(?, titulo),
      descripcion    = COALESCE(?, descripcion),
      precio         = COALESCE(?, precio),
      modelo_negocio = COALESCE(?, modelo_negocio),
      estado         = COALESCE(?, estado),
      modulos_count  = COALESCE(?, modulos_count),
      duracion       = COALESCE(?, duracion),
      gradient_class = COALESCE(?, gradient_class)
    WHERE id = ?
  `).run(titulo, descripcion, precio, modelo_negocio, estado, modulos_count, duracion, gradient_class, req.params.id);

  const updated = db.prepare(`
    SELECT *, (SELECT COUNT(*) FROM inscripciones WHERE curso_id = ?) as estudiantes
    FROM cursos WHERE id = ?
  `).get(req.params.id, req.params.id);

  return res.json({ success: true, data: updated });
});

// ─── DELETE /api/cursos/:id ───────────────────────────────────────────────────
router.delete('/:id', auth, soloCreador, (req, res) => {
  const curso = getCursoPropio(req.params.id, req.user.id);
  if (!curso) return res.status(404).json({ error: { message: 'Curso no encontrado.' } });

  // Borrar archivos de video de las lecciones del curso
  const lecciones = db.prepare('SELECT video_url FROM lecciones WHERE curso_id = ?').all(req.params.id);
  for (const l of lecciones) {
    if (l.video_url) deleteFile(path.join(UPLOADS_DIR, path.basename(l.video_url)));
  }

  db.prepare('DELETE FROM cursos WHERE id = ?').run(req.params.id);
  return res.json({ success: true, message: 'Curso eliminado.' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LECCIONES (VIDEOS)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── POST /api/cursos/:id/lecciones ──────────────────────────────────────────
// Subir video + crear lección
router.post('/:id/lecciones', auth, soloCreador, upload.single('video'), (req, res) => {
  const curso = getCursoPropio(req.params.id, req.user.id);
  if (!curso) {
    if (req.file) deleteFile(req.file.path);
    return res.status(404).json({ error: { message: 'Curso no encontrado.' } });
  }

  const titulo = (req.body.titulo || 'Lección sin título').trim();

  // Calcular el siguiente orden (máximo actual + 1)
  const maxOrden = db.prepare('SELECT MAX(orden) as m FROM lecciones WHERE curso_id = ?').get(req.params.id);
  const orden    = (maxOrden.m ?? -1) + 1;

  const videoUrl = req.file ? `/uploads/${req.file.filename}` : '';

  const result = db.prepare(`
    INSERT INTO lecciones (titulo, video_url, orden, curso_id)
    VALUES (?, ?, ?, ?)
  `).run(titulo, videoUrl, orden, req.params.id);

  const leccion = db.prepare('SELECT * FROM lecciones WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({ success: true, data: leccion });
});

// ─── PATCH /api/cursos/:id/lecciones/reorder ─────────────────────────────────
// Debe ir ANTES de /:lid para evitar conflicto de rutas
router.put('/:id/lecciones/reorder', auth, soloCreador, (req, res) => {
  const curso = getCursoPropio(req.params.id, req.user.id);
  if (!curso) return res.status(404).json({ error: { message: 'Curso no encontrado.' } });

  const { ids } = req.body; // Array de IDs en el nuevo orden
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: { message: '`ids` debe ser un array.' } });
  }

  const update = db.prepare('UPDATE lecciones SET orden = ? WHERE id = ? AND curso_id = ?');
  ids.forEach((id, index) => update.run(index, id, req.params.id));

  const lecciones = db.prepare('SELECT * FROM lecciones WHERE curso_id = ? ORDER BY orden ASC').all(req.params.id);
  return res.json({ success: true, data: lecciones });
});

// ─── PATCH /api/cursos/:id/lecciones/:lid ────────────────────────────────────
// Editar título y/o reemplazar video
router.patch('/:id/lecciones/:lid', auth, soloCreador, upload.single('video'), (req, res) => {
  const curso = getCursoPropio(req.params.id, req.user.id);
  if (!curso) {
    if (req.file) deleteFile(req.file.path);
    return res.status(404).json({ error: { message: 'Curso no encontrado.' } });
  }

  const leccion = db.prepare('SELECT * FROM lecciones WHERE id = ? AND curso_id = ?').get(req.params.lid, req.params.id);
  if (!leccion) {
    if (req.file) deleteFile(req.file.path);
    return res.status(404).json({ error: { message: 'Lección no encontrada.' } });
  }

  const titulo = req.body.titulo !== undefined ? req.body.titulo.trim() : leccion.titulo;
  let videoUrl  = leccion.video_url;

  if (req.file) {
    // Borrar video anterior si había uno
    if (leccion.video_url) deleteFile(path.join(UPLOADS_DIR, path.basename(leccion.video_url)));
    videoUrl = `/uploads/${req.file.filename}`;
  }

  db.prepare('UPDATE lecciones SET titulo = ?, video_url = ? WHERE id = ?').run(titulo, videoUrl, leccion.id);
  const updated = db.prepare('SELECT * FROM lecciones WHERE id = ?').get(leccion.id);
  return res.json({ success: true, data: updated });
});

// ─── DELETE /api/cursos/:id/lecciones/:lid ────────────────────────────────────
router.delete('/:id/lecciones/:lid', auth, soloCreador, (req, res) => {
  const curso = getCursoPropio(req.params.id, req.user.id);
  if (!curso) return res.status(404).json({ error: { message: 'Curso no encontrado.' } });

  const leccion = db.prepare('SELECT * FROM lecciones WHERE id = ? AND curso_id = ?').get(req.params.lid, req.params.id);
  if (!leccion) return res.status(404).json({ error: { message: 'Lección no encontrada.' } });

  // Borrar archivo físico
  if (leccion.video_url) deleteFile(path.join(UPLOADS_DIR, path.basename(leccion.video_url)));

  db.prepare('DELETE FROM lecciones WHERE id = ?').run(leccion.id);

  // Re-normalizar los órdenes restantes
  const restantes = db.prepare('SELECT id FROM lecciones WHERE curso_id = ? ORDER BY orden ASC, id ASC').all(req.params.id);
  const reorder   = db.prepare('UPDATE lecciones SET orden = ? WHERE id = ?');
  restantes.forEach((l, i) => reorder.run(i, l.id));

  return res.json({ success: true, message: 'Lección eliminada.' });
});

module.exports = router;
