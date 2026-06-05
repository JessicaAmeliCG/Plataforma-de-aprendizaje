/**
 * db.js — Base de datos SQLite con node:sqlite (built-in Node.js v22.5+)
 * Sin dependencias nativas extra. Funciona directamente con Node.js v24.
 *
 * Tablas: usuarios, cursos, inscripciones
 * Seed: cuenta de creador + estudiantes de prueba
 */

const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path   = require('path');
const fs     = require('fs');

// Directorio para la base de datos
const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH  = path.join(DATA_DIR, 'yourcourse.db');

// Crear directorio si no existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// ─── Pragma para mejorar rendimiento y consistencia ───────────────────────────
db.exec(`PRAGMA journal_mode = WAL;`);
db.exec(`PRAGMA foreign_keys = ON;`);

// ─── Crear tablas ─────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre       TEXT    NOT NULL,
    email        TEXT    NOT NULL UNIQUE,
    password_hash TEXT   NOT NULL,
    rol          TEXT    NOT NULL DEFAULT 'estudiante', -- 'creador' | 'estudiante'
    bio          TEXT    DEFAULT '',
    avatar_color TEXT    DEFAULT 'from-violet-500 to-purple-700',
    created_at   TEXT    DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS cursos (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo          TEXT    NOT NULL,
    descripcion     TEXT    DEFAULT '',
    precio          REAL    DEFAULT 0,
    modelo_negocio  TEXT    DEFAULT 'gratis', -- 'gratis' | 'pago_unico' | 'suscripcion'
    estado          TEXT    DEFAULT 'borrador', -- 'borrador' | 'publicado'
    creator_id      INTEGER NOT NULL REFERENCES usuarios(id),
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
`);

// Agregar columnas de preferencias de notificaciones (idempotente)
try { db.exec('ALTER TABLE usuarios ADD COLUMN notif_email INTEGER DEFAULT 1'); } catch {}
try { db.exec('ALTER TABLE usuarios ADD COLUMN notif_platform INTEGER DEFAULT 1'); } catch {};


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

  // ── Crear cuenta de CREADOR ────────────────────────────────────────────────
  const creatorHash = bcrypt.hashSync('YourCourse2025!', 10);
  const insertUser = db.prepare(`
    INSERT INTO usuarios (nombre, email, password_hash, rol, bio, avatar_color)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const creatorResult = insertUser.run(
    'Jessica Castro',
    'creador@yourcourse.mx',
    creatorHash,
    'creador',
    'Educadora apasionada por el desarrollo web y la tecnología.',
    'from-violet-500 to-purple-700'
  );
  const creatorId = creatorResult.lastInsertRowid;

  // ── Crear ESTUDIANTES de prueba ────────────────────────────────────────────
  const estudiantes = [
    { nombre: 'Carlos Rodríguez', email: 'carlos@gmail.com',  color: AVATAR_COLORS[1] },
    { nombre: 'Ana Jiménez',      email: 'ana@gmail.com',     color: AVATAR_COLORS[2] },
    { nombre: 'Luis García',      email: 'luis@gmail.com',    color: AVATAR_COLORS[3] },
    { nombre: 'María López',      email: 'maria@gmail.com',   color: AVATAR_COLORS[0] },
    { nombre: 'Diego Torres',     email: 'diego@gmail.com',   color: AVATAR_COLORS[1] },
  ];

  const estHash = bcrypt.hashSync('Est123456!', 10);
  const estudianteIds = [];

  for (const e of estudiantes) {
    const r = insertUser.run(e.nombre, e.email, estHash, 'estudiante', '', e.color);
    estudianteIds.push(Number(r.lastInsertRowid));
  }

  // ── Crear CURSOS de prueba ─────────────────────────────────────────────────
  const insertCurso = db.prepare(`
    INSERT INTO cursos (titulo, descripcion, precio, modelo_negocio, estado, creator_id, modulos_count, duracion, gradient_class)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const cursos = [
    { titulo: 'React Avanzado con Hooks y Context API', desc: 'Domina React 18 con hooks personalizados, Context, y patrones avanzados de estado.', precio: 499, modelo: 'pago_unico',  estado: 'publicado', modulos: 8, duracion: '12h 30m', gradient: GRADIENTS[0] },
    { titulo: 'Node.js y Express desde Cero',           desc: 'Construye APIs REST robustas con Node.js, Express y buenas prácticas de arquitectura.', precio: 0,   modelo: 'gratis',     estado: 'publicado', modulos: 5, duracion: '8h 15m',  gradient: GRADIENTS[1] },
    { titulo: 'PostgreSQL: Bases de Datos Relacionales',desc: 'Diseño avanzado de esquemas, índices, transacciones y optimización de consultas.', precio: 149, modelo: 'suscripcion', estado: 'publicado', modulos: 6, duracion: '10h',     gradient: GRADIENTS[2] },
    { titulo: 'Docker para Desarrolladores',            desc: 'Containeriza tus aplicaciones y orquesta servicios con Docker Compose.', precio: 299, modelo: 'pago_unico',  estado: 'borrador',  modulos: 4, duracion: '6h 45m',  gradient: GRADIENTS[3] },
  ];

  const cursoIds = [];
  for (const c of cursos) {
    const r = insertCurso.run(c.titulo, c.desc, c.precio, c.modelo, c.estado, creatorId, c.modulos, c.duracion, c.gradient);
    cursoIds.push(Number(r.lastInsertRowid));
  }

  // ── Crear INSCRIPCIONES de prueba ──────────────────────────────────────────
  const insertInscripcion = db.prepare(`
    INSERT OR IGNORE INTO inscripciones (estudiante_id, curso_id) VALUES (?, ?)
  `);

  // Carlos → curso 1
  insertInscripcion.run(estudianteIds[0], cursoIds[0]);
  // Ana → cursos 1 y 2
  insertInscripcion.run(estudianteIds[1], cursoIds[0]);
  insertInscripcion.run(estudianteIds[1], cursoIds[1]);
  // Luis → cursos 2 y 3
  insertInscripcion.run(estudianteIds[2], cursoIds[1]);
  insertInscripcion.run(estudianteIds[2], cursoIds[2]);
  // María → cursos 1, 2 y 3
  insertInscripcion.run(estudianteIds[3], cursoIds[0]);
  insertInscripcion.run(estudianteIds[3], cursoIds[1]);
  insertInscripcion.run(estudianteIds[3], cursoIds[2]);
  // Diego → curso 1
  insertInscripcion.run(estudianteIds[4], cursoIds[0]);

  // ── Crear POSTS DE COMUNIDAD de prueba ──────────────────────────────────
  const insertPost = db.prepare(`
    INSERT INTO comunidad_posts (tipo, titulo, contenido, rating, tags, usuario_id, curso_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertResp = db.prepare(`
    INSERT INTO comunidad_respuestas (post_id, usuario_id, contenido) VALUES (?, ?, ?)
  `);

  const p1 = insertPost.run('resena', '¡Plataforma excelente!', 'Llevo dos semanas usando YourCourse y la experiencia ha sido fantástica. Los cursos están muy bien organizados y los videos son de alta calidad.', 5, '[]', estudianteIds[0], null);
  const p2 = insertPost.run('resena', 'Muy buen contenido', 'Me gusta la forma en que están estructurados los cursos. La interfaz es intuitiva y me ha permitido aprender a mi propio ritmo.', 4, '[]', estudianteIds[1], null);
  const p3 = insertPost.run('resena', 'Superadas mis expectativas', 'Pensé que sería un curso básico pero el nivel es muy bueno. Aprendes de verdad con los ejercicios.', 5, '[]', estudianteIds[3], null);
  const p4 = insertPost.run('recomendacion', '¿Alguien tiene recursos de React?', 'Estoy aprendiendo desarrollo frontend pero me atasco con los hooks. ¿Recomiendan algún curso o material complementario?', 0, JSON.stringify(['React', 'Frontend']), estudianteIds[2], cursoIds[0]);
  const p5 = insertPost.run('recomendacion', 'Problema con Docker Compose', '¡Hola a todos! Estoy tratando de configurar un entorno de desarrollo con Docker pero no logro que los contenedores se comuniquen. ¿Alguien pasó por lo mismo?', 0, JSON.stringify(['Docker', 'DevOps']), estudianteIds[4], cursoIds[3]);
  const p6 = insertPost.run('recomendacion', 'PostgreSQL vs MySQL para proyectos grandes', '¿Cuál recomiendan para un proyecto con millones de registros? Tengo dudas sobre el rendimiento de cada uno.', 0, JSON.stringify(['Bases de datos', 'PostgreSQL']), estudianteIds[1], cursoIds[2]);

  insertResp.run(p4.lastInsertRowid, creatorId, '¡Hola Carlos! Te recomiendo revisar la documentación oficial de React sobre hooks. En el curso de React Avanzado cubrimos exactamente ese tema con ejemplos prácticos.');
  insertResp.run(p4.lastInsertRowid, estudianteIds[3], 'Yo también tuve ese problema al principio. Lo que más me ayudó fue hacer proyectos pequeños de práctica con useState y useEffect.');
  insertResp.run(p5.lastInsertRowid, creatorId, 'Para la comunicación entre contenedores asegúrate de que estén en la misma red de Docker. En el curso de Docker lo explicamos con ejemplos paso a paso.');
  insertResp.run(p6.lastInsertRowid, estudianteIds[0], 'En mi experiencia PostgreSQL escala mucho mejor y tiene mejor soporte para consultas complejas. Para proyectos grandes definitivamente PostgreSQL.');

  console.log('✅ Base de datos inicializada con datos de prueba');
  console.log('📧 Creador: creador@yourcourse.mx | 🔑 YourCourse2025!');
} else {
  console.log(`✅ BD cargada — ${totalUsuarios.c} usuarios registrados`);
}

// ─── Seed comunidad para BD existente (si está vacía) ─────────────────────────────────
const totalPosts = db.prepare('SELECT COUNT(*) as c FROM comunidad_posts').get();
if (totalPosts.c === 0) {
  const usuarios = db.prepare('SELECT id, rol FROM usuarios ORDER BY id ASC').all();
  const creadorRow = usuarios.find(u => u.rol === 'creador');
  const estudiantes = usuarios.filter(u => u.rol === 'estudiante');
  const cursosRows = db.prepare('SELECT id FROM cursos ORDER BY id ASC').all();

  if (creadorRow && estudiantes.length >= 3 && cursosRows.length >= 3) {
    const ip = db.prepare('INSERT INTO comunidad_posts (tipo, titulo, contenido, rating, tags, usuario_id, curso_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const ir = db.prepare('INSERT INTO comunidad_respuestas (post_id, usuario_id, contenido) VALUES (?, ?, ?)');

    const p1 = ip.run('resena', '¡Plataforma excelente!', 'Llevo dos semanas usando YourCourse y la experiencia ha sido fantástica. Los cursos están muy bien organizados y los videos son de alta calidad.', 5, '[]', estudiantes[0].id, null);
    const p2 = ip.run('resena', 'Muy buen contenido', 'Me gusta la forma en que están estructurados los cursos. La interfaz es intuitiva y me ha permitido aprender a mi propio ritmo.', 4, '[]', estudiantes[1].id, null);
    const p3 = ip.run('resena', 'Superadas mis expectativas', 'Pensé que sería un curso básico pero el nivel es muy bueno. Aprendes de verdad con los ejercicios.', 5, '[]', estudiantes[3] ? estudiantes[3].id : estudiantes[2].id, null);
    const p4 = ip.run('recomendacion', '¿Alguien tiene recursos de React?', 'Estoy aprendiendo desarrollo frontend pero me atasco con los hooks. ¿Recomiendan algún curso o material?', 0, JSON.stringify(['React', 'Frontend']), estudiantes[2].id, cursosRows[0].id);
    const p5 = ip.run('recomendacion', 'Problema con Docker Compose', '¡Hola! Estoy configurando Docker pero no logro que los contenedores se comuniquen. ¿Alguien pasó por lo mismo?', 0, JSON.stringify(['Docker', 'DevOps']), estudiantes[0].id, cursosRows[cursosRows.length - 1].id);
    const p6 = ip.run('recomendacion', 'PostgreSQL vs MySQL para proyectos grandes', '¿Cuál recomiendan para un proyecto con millones de registros?', 0, JSON.stringify(['Bases de datos', 'PostgreSQL']), estudiantes[1].id, cursosRows[2] ? cursosRows[2].id : cursosRows[0].id);

    ir.run(p4.lastInsertRowid, creadorRow.id, '¡Hola! Te recomiendo revisar el curso de React Avanzado donde cubrimos hooks con ejemplos prácticos.');
    ir.run(p4.lastInsertRowid, estudiantes[2] ? estudiantes[2].id : estudiantes[0].id, 'Yo también tuve ese problema. Lo que más me ayudó fue hacer proyectos pequeños con useState y useEffect.');
    ir.run(p5.lastInsertRowid, creadorRow.id, 'Para la comunicación entre contenedores asegúrate de que estén en la misma red de Docker.');
    ir.run(p6.lastInsertRowid, estudiantes[0].id, 'PostgreSQL escala mucho mejor y tiene mejor soporte para consultas complejas.');

    console.log('✅ Seed de comunidad insertado');
  }
}

module.exports = db;
