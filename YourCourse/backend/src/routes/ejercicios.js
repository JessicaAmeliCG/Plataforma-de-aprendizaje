/**
 * ejercicios.js — Rutas de ejercicios del curso (PDFs)
 */

const router  = require('express').Router({ mergeParams: true });
const jwt     = require('jsonwebtoken');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../config/db');

const JWT_SECRET  = process.env.JWT_SECRET || 'yourcourse_fallback_secret';
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Asegurar carpeta uploads/ejercicios
const EJERCICIOS_DIR = path.join(UPLOADS_DIR, 'ejercicios');
if (!fs.existsSync(EJERCICIOS_DIR)) {
  fs.mkdirSync(EJERCICIOS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, EJERCICIOS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext    = path.extname(file.originalname);
    cb(null, `archivo-${unique}${ext}`);
  },
});

const uploadPdf = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.zip', '.rar'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo de apoyo no soportado.'));
    }
  },
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function auth(req, res, next) {
  const h = req.headers['authorization'];
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: { message: 'No autenticado.' } });
  try { req.user = jwt.verify(h.split(' ')[1], JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: { message: 'Token inválido.' } }); }
}

function soloCreador(req, res, next) {
  if (req.user.rol !== 'creador' && req.user.rol !== 'superadmin') return res.status(403).json({ error: { message: 'Solo creadores.' } });
  next();
}

async function verifyCurso(req, res, next) {
  try {
    const curso = await db.get('SELECT id FROM cursos WHERE id = ? AND (creator_id = ? OR 1 = ?)', req.params.cursoId, req.user.id, req.user.rol === 'superadmin' ? 1 : 0);
    if (!curso) return res.status(404).json({ error: { message: 'Curso no encontrado.' } });
    next();
  } catch(e) {
    res.status(500).json({ error: { message: e.message } });
  }
}

function deleteFile(p) { try { if (p && fs.existsSync(p)) fs.unlinkSync(p); } catch {} }

// ─── GET /:cursoId/ejercicios ─────────────────────────────────────────────────
router.get('/', auth, verifyCurso, async (req, res) => {
  const ejercicios = await db.query('SELECT * FROM ejercicios WHERE curso_id = ? ORDER BY orden ASC, id ASC', req.params.cursoId);
  res.json({ success: true, data: ejercicios });
});

// ─── POST /:cursoId/ejercicios ────────────────────────────────────────────────
router.post('/', auth, soloCreador, verifyCurso, uploadPdf.single('archivo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: { message: 'Se requiere un archivo.' } });
  try {
    const titulo = (req.body.titulo || req.file.originalname.replace(/\.[^.]+$/, '')).trim();
    const descripcion = (req.body.descripcion || '').trim();
    const maxOrden = await db.get('SELECT MAX(orden) as m FROM ejercicios WHERE curso_id = ?', req.params.cursoId);
    const orden = (maxOrden.m ?? -1) + 1;
    const archivoUrl = `/uploads/ejercicios/${req.file.filename}`;
    
    const result = await db.run('INSERT INTO ejercicios (titulo, archivo_url, descripcion, orden, curso_id) VALUES (?, ?, ?, ?, ?)', titulo, archivoUrl, descripcion, orden, req.params.cursoId);
    const ejercicio = await db.get('SELECT * FROM ejercicios WHERE id = ?', result.lastInsertRowid);
    res.status(201).json({ success: true, data: ejercicio });
  } catch(err) {
    if (req.file) deleteFile(req.file.path);
    res.status(500).json({ error: { message: err.message } });
  }
});

// ─── PATCH /:cursoId/ejercicios/:id ──────────────────────────────────────────
router.patch('/:id', auth, soloCreador, verifyCurso, async (req, res) => {
  const ej = await db.get('SELECT * FROM ejercicios WHERE id = ? AND curso_id = ?', req.params.id, req.params.cursoId);
  if (!ej) return res.status(404).json({ error: { message: 'Ejercicio no encontrado.' } });
  const titulo      = req.body.titulo      !== undefined ? req.body.titulo.trim()      : ej.titulo;
  const descripcion = req.body.descripcion !== undefined ? req.body.descripcion.trim() : ej.descripcion;
  await db.run('UPDATE ejercicios SET titulo = ?, descripcion = ? WHERE id = ?', titulo, descripcion, ej.id);
  res.json({ success: true, data: await db.get('SELECT * FROM ejercicios WHERE id = ?', ej.id) });
});

// ─── DELETE /:cursoId/ejercicios/:id ─────────────────────────────────────────
router.delete('/:id', auth, soloCreador, verifyCurso, async (req, res) => {
  const ej = await db.get('SELECT * FROM ejercicios WHERE id = ? AND curso_id = ?', req.params.id, req.params.cursoId);
  if (!ej) return res.status(404).json({ error: { message: 'Ejercicio no encontrado.' } });
  if (ej.archivo_url) deleteFile(path.join(UPLOADS_DIR, 'ejercicios', path.basename(ej.archivo_url)));
  await db.run('DELETE FROM ejercicios WHERE id = ?', ej.id);
  
  const restantes = await db.query('SELECT id FROM ejercicios WHERE curso_id = ? ORDER BY orden ASC, id ASC', req.params.cursoId);
  for (let i = 0; i < restantes.length; i++) {
    await db.run('UPDATE ejercicios SET orden = ? WHERE id = ?', i, restantes[i].id);
  }
  res.json({ success: true, message: 'Ejercicio eliminado.' });
});

module.exports = router;
