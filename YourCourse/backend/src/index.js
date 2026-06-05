/**
 * index.js — Servidor principal YourCourse Backend
 */

require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');

// Inicializar BD (crea tablas y seed si es primera vez)
const db = require('./config/db');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Carpeta de uploads ───────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ─── Middlewares globales ─────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());

// Servir videos subidos estáticamente
app.use('/uploads', express.static(UPLOADS_DIR));

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/auth',               require('./routes/auth'));
app.use('/api/cursos',             require('./routes/cursos'));
app.use('/api/cursos/:cursoId/ejercicios', require('./routes/ejercicios'));
app.use('/api/estudiantes',        require('./routes/estudiantes'));
app.use('/api/comunidad',          require('./routes/comunidad'));
app.use('/api/analiticas',         require('./routes/analiticas'));
app.use('/api/notificaciones',     require('./routes/notificaciones'));



// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ─── Manejo de rutas no encontradas ──────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// ─── Arrancar servidor ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Backend YourCourse corriendo en http://localhost:${PORT}`);
});
