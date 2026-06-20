/**
 * index.js — Servidor principal YourCourse Backend
 */

require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
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
app.use(helmet({ crossOriginResourcePolicy: false })); // Seguridad HTTP (deshabilita CORP para que carguen recursos locales como imágenes)
app.use(compression()); // Optimiza tamaño de respuestas
const ALLOWED_ORIGINS = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',') 
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ─── Limitador de peticiones masivas (Prevención DDoS) ────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // 200 peticiones por ventana
  message: { error: 'Demasiadas peticiones, intenta de nuevo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});
// Aplicar limiter a rutas de API
app.use('/api', limiter);

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
