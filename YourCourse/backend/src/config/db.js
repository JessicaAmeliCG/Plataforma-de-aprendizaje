/**
 * db.js — Base de datos SQLite con node:sqlite (built-in Node.js v22.5+)
 * Actualizado para soportar SaaS Multi-Tenant o Institución Única.
 */

const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path   = require('path');
const fs     = require('fs');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH  = path.join(DATA_DIR, 'yourcourse.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

db.exec(`PRAGMA journal_mode = WAL;`);
db.exec(`PRAGMA foreign_keys = ON;`);

// ─── Modo SaaS / Single Tenant ──────────────────────────────────────────────
const PLATFORM_MODE = process.env.PLATFORM_MODE || 'SINGLE_TENANT'; // 'SAAS' o 'SINGLE_TENANT'

db.exec(`
  CREATE TABLE IF NOT EXISTS academias (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre       TEXT    NOT NULL,
    slug         TEXT    NOT NULL UNIQUE,
    activa       INTEGER DEFAULT 1,
    created_at   TEXT    DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre       TEXT    NOT NULL,
    email        TEXT    NOT NULL UNIQUE,
    password_hash TEXT   NOT NULL,
    rol          TEXT    NOT NULL DEFAULT 'estudiante', -- 'superadmin' | 'creador' | 'moderador' | 'estudiante'
    bio          TEXT    DEFAULT '',
    avatar_color TEXT    DEFAULT 'from-violet-500 to-purple-700',
    academia_id  INTEGER DEFAULT 1 REFERENCES academias(id),
    reset_token  TEXT    DEFAULT NULL,
    reset_token_expires TEXT DEFAULT NULL,
    is_verified  INTEGER DEFAULT 0,
    verification_token TEXT DEFAULT NULL,
    created_at   TEXT    DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS cursos (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo          TEXT    NOT NULL,
    descripcion     TEXT    DEFAULT '',
    precio          REAL    DEFAULT 0,
    modelo_negocio  TEXT    DEFAULT 'gratis',
    estado          TEXT    DEFAULT 'borrador',
    visibilidad     TEXT    DEFAULT 'publico', -- 'publico' | 'privado'
    creator_id      INTEGER NOT NULL REFERENCES usuarios(id),
    academia_id     INTEGER DEFAULT 1 REFERENCES academias(id),
    modulos_count   INTEGER DEFAULT 0,
    duracion        TEXT    DEFAULT '',
    gradient_class  TEXT    DEFAULT 'from-violet-600 to-indigo-700',
    created_at      TEXT    DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS inscripciones (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    curso_id      INTEGER NOT NULL REFERENCES cursos(id)  ON DELETE CASCADE,
    created_at    TEXT    DEFAULT (datetime('now', 'localtime')),
    UNIQUE(estudiante_id, curso_id)
  );

  CREATE TABLE IF NOT EXISTS lecciones (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo     TEXT    NOT NULL DEFAULT 'Lección sin título',
    video_url  TEXT    DEFAULT '',
    duracion   TEXT    DEFAULT '',
    orden      INTEGER NOT NULL DEFAULT 0,
    curso_id   INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    created_at TEXT    DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS ejercicios (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo      TEXT    NOT NULL DEFAULT 'Ejercicio sin título',
    archivo_url TEXT    DEFAULT '',
    descripcion TEXT    DEFAULT '',
    orden       INTEGER DEFAULT 0,
    curso_id    INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    created_at  TEXT    DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS comunidad_posts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo       TEXT    NOT NULL DEFAULT 'resena',
    titulo     TEXT    DEFAULT '',
    contenido  TEXT    NOT NULL,
    rating     INTEGER DEFAULT 0,
    tags       TEXT    DEFAULT '[]',
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    curso_id   INTEGER DEFAULT NULL,
    created_at TEXT    DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS comunidad_respuestas (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id    INTEGER NOT NULL REFERENCES comunidad_posts(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    contenido  TEXT    NOT NULL,
    created_at TEXT    DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS notificaciones (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo       TEXT    NOT NULL DEFAULT 'info',
    titulo     TEXT    NOT NULL,
    mensaje    TEXT    DEFAULT '',
    enlace     TEXT    DEFAULT '',
    leida      INTEGER DEFAULT 0,
    created_at TEXT    DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS curso_invitaciones (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    curso_id   INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    email      TEXT    NOT NULL,
    token      TEXT    NOT NULL UNIQUE,
    usada      INTEGER DEFAULT 0,
    created_at TEXT    DEFAULT (datetime('now', 'localtime'))
  );
`);

// Migraciones idempotentes (columnas añadidas post-lanzamiento)
try { db.exec('ALTER TABLE usuarios ADD COLUMN notif_email INTEGER DEFAULT 1'); } catch {}
try { db.exec('ALTER TABLE usuarios ADD COLUMN notif_platform INTEGER DEFAULT 1'); } catch {}
try { db.exec('ALTER TABLE usuarios ADD COLUMN academia_id INTEGER DEFAULT 1 REFERENCES academias(id)'); } catch {}
try { db.exec('ALTER TABLE cursos ADD COLUMN academia_id INTEGER DEFAULT 1 REFERENCES academias(id)'); } catch {}
try { db.exec("ALTER TABLE cursos ADD COLUMN visibilidad TEXT DEFAULT 'publico'"); } catch {}
try { db.exec('ALTER TABLE usuarios ADD COLUMN reset_token TEXT DEFAULT NULL'); } catch {}
try { db.exec('ALTER TABLE usuarios ADD COLUMN reset_token_expires TEXT DEFAULT NULL'); } catch {}
try { 
  db.exec('ALTER TABLE usuarios ADD COLUMN is_verified INTEGER DEFAULT 0');
  db.exec('ALTER TABLE usuarios ADD COLUMN verification_token TEXT DEFAULT NULL');
  db.exec('UPDATE usuarios SET is_verified = 1'); // Setear los existentes a 1
} catch {}
try {
  db.exec(`CREATE TABLE IF NOT EXISTS curso_invitaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    curso_id INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    usada INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  )`);
} catch {}


// ─── Asegurar Academia Principal siempre ──────────────────────────────────────
const checkAcademia = db.prepare('SELECT COUNT(*) as c FROM academias WHERE id = 1').get();
if (checkAcademia.c === 0) {
  db.prepare("INSERT INTO academias (id, nombre, slug) VALUES (1, 'Academia Principal', 'principal')").run();
}

// ─── Seed: insertar datos iniciales si la tabla está vacía ────────────────────
const totalUsuarios = db.prepare('SELECT COUNT(*) as c FROM usuarios').get();

if (totalUsuarios.c === 0) {
  const GRADIENTS = [
    'from-violet-600 to-indigo-700',
    'from-blue-600 to-cyan-600',
    'from-teal-500 to-emerald-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-indigo-600 to-purple-700',
  ];

  const AVATAR_COLORS = [
    'from-violet-500 to-purple-700',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
  ];

  const insertUser = db.prepare(`
    INSERT INTO usuarios (nombre, email, password_hash, rol, bio, avatar_color, academia_id, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, 1, 1)
  `);

  // 1. Crear SUPERADMIN (Plataforma/SaaS) - Usa bcrypt 12 rounds por seguridad
  const superadminHash = bcrypt.hashSync('SuperAdmin2026!', 12);
  insertUser.run('Admin Plataforma', 'admin@yourcourse.mx', superadminHash, 'superadmin', 'Gestor global de la plataforma', 'from-slate-700 to-slate-900');

  // 2. Crear cuenta de CREADOR de la Academia Principal
  const creatorHash = bcrypt.hashSync('YourCourse2025!', 12);
  const creatorResult = insertUser.run(
    'Jessica Castro',
    'creador@yourcourse.mx',
    creatorHash,
    'creador',
    'Educadora apasionada por el desarrollo web y la tecnología.',
    'from-violet-500 to-purple-700'
  );
  const creatorId = creatorResult.lastInsertRowid;

  // 3. Crear ESTUDIANTES de prueba
  const estudiantes = [
    { nombre: 'Carlos Rodríguez', email: 'carlos@gmail.com',  color: AVATAR_COLORS[1] },
    { nombre: 'Ana Jiménez',      email: 'ana@gmail.com',     color: AVATAR_COLORS[2] },
    { nombre: 'Luis García',      email: 'luis@gmail.com',    color: AVATAR_COLORS[3] },
    { nombre: 'María López',      email: 'maria@gmail.com',   color: AVATAR_COLORS[0] },
    { nombre: 'Diego Torres',     email: 'diego@gmail.com',   color: AVATAR_COLORS[1] },
  ];

  const estHash = bcrypt.hashSync('Est123456!', 12);
  const estudianteIds = [];

  for (const e of estudiantes) {
    const r = insertUser.run(e.nombre, e.email, estHash, 'estudiante', '', e.color);
    estudianteIds.push(Number(r.lastInsertRowid));
  }

  // 4. Crear CURSOS de prueba
  const insertCurso = db.prepare(`
    INSERT INTO cursos (titulo, descripcion, precio, modelo_negocio, estado, creator_id, academia_id, modulos_count, duracion, gradient_class)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `);

  const cursos = [
    { titulo: 'React Avanzado con Hooks y Context API', desc: 'Domina React 18 con hooks.', precio: 499, modelo: 'pago_unico',  estado: 'publicado', modulos: 8, duracion: '12h 30m', gradient: GRADIENTS[0] },
    { titulo: 'Node.js y Express desde Cero',           desc: 'Construye APIs REST robustas.', precio: 0,   modelo: 'gratis',     estado: 'publicado', modulos: 5, duracion: '8h 15m',  gradient: GRADIENTS[1] },
    { titulo: 'PostgreSQL: Bases de Datos Relacionales',desc: 'Diseño avanzado de esquemas.', precio: 149, modelo: 'suscripcion', estado: 'publicado', modulos: 6, duracion: '10h',     gradient: GRADIENTS[2] },
    { titulo: 'Docker para Desarrolladores',            desc: 'Containeriza tus aplicaciones.', precio: 299, modelo: 'pago_unico',  estado: 'borrador',  modulos: 4, duracion: '6h 45m',  gradient: GRADIENTS[3] },
  ];

  const cursoIds = [];
  for (const c of cursos) {
    const r = insertCurso.run(c.titulo, c.desc, c.precio, c.modelo, c.estado, creatorId, c.modulos, c.duracion, c.gradient);
    cursoIds.push(Number(r.lastInsertRowid));
  }

  // 5. Crear INSCRIPCIONES
  const insertInscripcion = db.prepare(`INSERT OR IGNORE INTO inscripciones (estudiante_id, curso_id) VALUES (?, ?)`);
  insertInscripcion.run(estudianteIds[0], cursoIds[0]);
  insertInscripcion.run(estudianteIds[1], cursoIds[0]);
  insertInscripcion.run(estudianteIds[1], cursoIds[1]);
  insertInscripcion.run(estudianteIds[2], cursoIds[1]);
  insertInscripcion.run(estudianteIds[3], cursoIds[0]);
  insertInscripcion.run(estudianteIds[3], cursoIds[2]);

  console.log('✅ Base de datos inicializada con esquema SaaS/Single-Tenant');
  console.log(`🌐 MODO: ${PLATFORM_MODE}`);
  console.log('📧 SuperAdmin: admin@yourcourse.mx | 🔑 SuperAdmin2026!');
  console.log('📧 Creador: creador@yourcourse.mx | 🔑 YourCourse2025!');
} else {
  console.log(`✅ BD cargada — MODO: ${PLATFORM_MODE} — ${totalUsuarios.c} usuarios`);
}

module.exports = db;
