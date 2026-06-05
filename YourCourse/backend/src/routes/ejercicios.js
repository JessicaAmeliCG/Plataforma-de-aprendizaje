/**
 * ejercicios.js — Rutas de ejercicios (PDFs) por curso
 * GET    /api/ejercicios/:cursoId            — Listar ejercicios
 * POST   /api/ejercicios/:cursoId            — Subir PDF
 * PATCH  /api/ejercicios/:cursoId/:id        — Renombrar / actualizar descripción
 * DELETE /api/ejercicios/:cursoId/:id        — Eliminar ejercicio + archivo
 */

const router  = require('express').Router({ mergeParams: true });
const jwt     = require('jsonwebtoken');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../config/db');

const JWT_SECRET  = process.env.JWT_SECRET || 'yourcourse_fallback_secret';
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// ─── Multer para PDFs ─────────────────────────────────────────────────────────
const storagePdf = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(UPLOADS_DIR, 'ejercicios');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext    = path.extname(file.originalname);
    cb(null, `ejercicio-${unique}${ext}`);
  },
});

const uploadPdf = multer({
  storage: storagePdf,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Solo se permiten PDF, Word, PowerPoint o TXT.'));
  },
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
function auth(req, res, next) {
  const h = req.headers['authorization'];
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: { message: 'No autenticado.' } });
  try { req.user = jwt.verify(h.split(' ')[1], JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: { message: 'Token inválido.' } }); }
}
function soloCreador(req, res, next) {
  if (req.user.rol !== 'creador') return res.status(403).json({ error: { message: 'Solo creadores.' } });
  next();
}
function verifyCurso(req, res, next) {
  const curso = db.prepare('SELECT id FROM cursos WHERE id = ? AND creator_id = ?').get(req.params.cursoId, req.user.id);
  if (!curso) return res.status(404).json({ error: { message: 'Curso no encontrado.' } });
  next();
}
function deleteFile(p) { try { if (p && fs.existsSync(p)) fs.unlinkSync(p); } catch {} }

// ─── GET /:cursoId/ejercicios ─────────────────────────────────────────────────
router.get('/', auth, verifyCurso, (req, res) => {
  const ejercicios = db.prepare('SELECT * FROM ejercicios WHERE curso_id = ? ORDER BY orden ASC, id ASC').all(req.params.cursoId);
  res.json({ success: true, data: ejercicios });
});

// ─── POST /:cursoId/ejercicios ────────────────────────────────────────────────
router.post('/', auth, soloCreador, verifyCurso, uploadPdf.single('archivo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: { message: 'Se requiere un archivo.' } });
  const titulo = (req.body.titulo || req.file.originalname.replace(/\.[^.]+$/, '')).trim();
  const descripcion = (req.body.descripcion || '').trim();
  const maxOrden = db.prepare('SELECT MAX(orden) as m FROM ejercicios WHERE curso_id = ?').get(req.params.cursoId);
  const orden = (maxOrden.m ?? -1) + 1;
  const archivoUrl = `/uploads/ejercicios/${req.file.filename}`;
  const result = db.prepare('INSERT INTO ejercicios (titulo, archivo_url, descripcion, orden, curso_id) VALUES (?, ?, ?, ?, ?)').run(titulo, archivoUrl, descripcion, orden, req.params.cursoId);
  const ejercicio = db.prepare('SELECT * FROM ejercicios WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: ejercicio });
});

// ─── PATCH /:cursoId/ejercicios/:id ──────────────────────────────────────────
router.patch('/:id', auth, soloCreador, verifyCurso, (req, res) => {
  const ej = db.prepare('SELECT * FROM ejercicios WHERE id = ? AND curso_id = ?').get(req.params.id, req.params.cursoId);
  if (!ej) return res.status(404).json({ error: { message: 'Ejercicio no encontrado.' } });
  const titulo      = req.body.titulo      !== undefined ? req.body.titulo.trim()      : ej.titulo;
  const descripcion = req.body.descripcion !== undefined ? req.body.descripcion.trim() : ej.descripcion;
  db.prepare('UPDATE ejercicios SET titulo = ?, descripcion = ? WHERE id = ?').run(titulo, descripcion, ej.id);
  res.json({ success: true, data: db.prepare('SELECT * FROM ejercicios WHERE id = ?').get(ej.id) });
});

// ─── DELETE /:cursoId/ejercicios/:id ─────────────────────────────────────────
router.delete('/:id', auth, soloCreador, verifyCurso, (req, res) => {
  const ej = db.prepare('SELECT * FROM ejercicios WHERE id = ? AND curso_id = ?').get(req.params.id, req.params.cursoId);
  if (!ej) return res.status(404).json({ error: { message: 'Ejercicio no encontrado.' } });
  if (ej.archivo_url) deleteFile(path.join(UPLOADS_DIR, 'ejercicios', path.basename(ej.archivo_url)));
  db.prepare('DELETE FROM ejercicios WHERE id = ?').run(ej.id);
  const restantes = db.prepare('SELECT id FROM ejercicios WHERE curso_id = ? ORDER BY orden ASC, id ASC').all(req.params.cursoId);
  restantes.forEach((e, i) => db.prepare('UPDATE ejercicios SET orden = ? WHERE id = ?').run(i, e.id));
  res.json({ success: true, message: 'Ejercicio eliminado.' });
});

module.exports = router;
