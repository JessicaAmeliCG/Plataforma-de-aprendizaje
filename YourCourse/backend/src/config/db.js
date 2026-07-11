/**
 * db.js — Adaptador de Base de Datos Dual (PostgreSQL con Fallback a SQLite)
 */

const { execSync } = require('child_process');
const Database = require('better-sqlite3');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path   = require('path');
const fs     = require('fs');

const pgHost = process.env.PGHOST || 'localhost';
const pgUser = process.env.PGUSER || 'postgres';
const pgPassword = process.env.PGPASSWORD || 'yourcourse_secure_pass';
const pgDatabase = process.env.PGDATABASE || 'yourcourse_db';
const pgPort = process.env.PGPORT || 5432;

let isPostgres = false;
let pool = null;
let sqliteDb = null;

// 1. Probar la conexión a PostgreSQL de forma síncrona
try {
  console.log(`🔌 Probando conexión a PostgreSQL en ${pgHost}:${pgPort}...`);
  execSync(`node -e "const {Client} = require('pg'); const c = new Client({host:'${pgHost}', user:'${pgUser}', password:'${pgPassword}', database:'${pgDatabase}', port:${pgPort}}); c.connect().then(() => { process.exit(0); }).catch(() => { process.exit(1); })"`, { stdio: 'pipe', timeout: 2500 });
  isPostgres = true;
  console.log('✅ PostgreSQL está disponible. Iniciando Pool de conexiones.');
  pool = new Pool({
    host: pgHost,
    user: pgUser,
    password: pgPassword,
    database: pgDatabase,
    port: pgPort,
    max: 20, // Connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
} catch (err) {
  console.log('⚠️  PostgreSQL no está disponible o no respondió a tiempo. Utilizando fallback SQLite.');
  isPostgres = false;
  
  const DATA_DIR = path.join(__dirname, '../../data');
  const DB_PATH  = path.join(DATA_DIR, 'yourcourse.db');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  sqliteDb = new Database(DB_PATH);
  sqliteDb.exec(`PRAGMA journal_mode = WAL;`);
  sqliteDb.exec(`PRAGMA foreign_keys = ON;`);
}

// Helper para traducir queries de SQLite a PostgreSQL en tiempo de ejecución
function translateQuery(sql) {
  if (!isPostgres) return sql;

  // 1. Traducir placeholders de ? a $1, $2, etc.
  let paramIndex = 0;
  let translatedSql = sql.replace(/\?/g, () => {
    paramIndex++;
    return `$${paramIndex}`;
  });

  // 2. Reemplazar funciones de fecha SQLite por PostgreSQL
  translatedSql = translatedSql.replace(/datetime\('now',\s*'localtime'\)/gi, 'CURRENT_TIMESTAMP');
  translatedSql = translatedSql.replace(/\(datetime\('now',\s*'localtime'\)\)/gi, 'CURRENT_TIMESTAMP');

  // 3. Reemplazar strftime para PostgreSQL
  translatedSql = translatedSql.replace(/strftime\(\s*['"]%Y-%m['"]\s*,\s*([^)]+)\)/gi, "to_char($1, 'YYYY-MM')");
  translatedSql = translatedSql.replace(/strftime\(\s*['"]%Y-%m-%d['"]\s*,\s*([^)]+)\)/gi, "to_char($1, 'YYYY-MM-DD')");

  // 4. Adaptar ROUND para PostgreSQL (casteando primer argumento a numeric)
  translatedSql = translatedSql.replace(/ROUND\(([^,)]+),\s*([0-9]+)\)/gi, "ROUND(($1)::numeric, $2)");

  // 5. Reemplazar INSERT OR IGNORE por ON CONFLICT DO NOTHING (si tiene tabla con UNIQUE clave)
  if (translatedSql.toUpperCase().includes('INSERT OR IGNORE')) {
    translatedSql = translatedSql.replace(/INSERT OR IGNORE/gi, 'INSERT');
    // Para inscripciones, agregar ON CONFLICT
    if (translatedSql.toLowerCase().includes('inscripciones')) {
      translatedSql += ' ON CONFLICT (estudiante_id, curso_id) DO NOTHING';
    }
  }

  // 6. Case-insensitive LIKE en Postgres es ILIKE
  translatedSql = translatedSql.replace(/\s+LIKE\s+/gi, ' ILIKE ');

  // 7. Devolver ID insertado automáticamente en inserts para compatibilidad con lastInsertRowid
  if (translatedSql.trim().toUpperCase().startsWith('INSERT INTO') && !translatedSql.trim().toUpperCase().includes('RETURNING')) {
    translatedSql += ' RETURNING id';
  }

  return translatedSql;
}

// Interfaz unificada de Base de Datos Asíncrona
const db = {
  isPostgres,

  /**
   * Ejecuta una consulta SQL multi-sentencia de inicialización (DDL)
   */
  async exec(sql) {
    if (isPostgres) {
      await pool.query(sql);
    } else {
      sqliteDb.exec(sql);
    }
  },

  /**
   * Retorna todas las filas que coincidan
   */
  async query(sql, ...params) {
    const cleanParams = (params.length === 1 && Array.isArray(params[0])) ? params[0] : params;
    if (isPostgres) {
      const pgSql = translateQuery(sql);
      const res = await pool.query(pgSql, cleanParams);
      return res.rows;
    } else {
      return sqliteDb.prepare(sql).all(cleanParams);
    }
  },

  /**
   * Retorna una sola fila
   */
  async get(sql, ...params) {
    const cleanParams = (params.length === 1 && Array.isArray(params[0])) ? params[0] : params;
    if (isPostgres) {
      const pgSql = translateQuery(sql);
      const res = await pool.query(pgSql, cleanParams);
      return res.rows[0] || null;
    } else {
      return sqliteDb.prepare(sql).get(cleanParams) || null;
    }
  },

  /**
   * Ejecuta un INSERT/UPDATE/DELETE y retorna metadatos de inserción
   */
  async run(sql, ...params) {
    const cleanParams = (params.length === 1 && Array.isArray(params[0])) ? params[0] : params;
    if (isPostgres) {
      const pgSql = translateQuery(sql);
      const res = await pool.query(pgSql, cleanParams);
      return {
        lastInsertRowid: res.rows[0]?.id || null,
        changes: res.rowCount,
      };
    } else {
      const res = sqliteDb.prepare(sql).run(cleanParams);
      return {
        lastInsertRowid: res.lastInsertRowid,
        changes: res.changes,
      };
    }
  }
};

// ─── Inicialización de Esquemas DDL ──────────────────────────────────────────
async function initDb() {
  if (isPostgres) {
    console.log('⚡ Inicializando Esquema PostgreSQL...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS academias (
        id           SERIAL PRIMARY KEY,
        nombre       TEXT    NOT NULL,
        slug         TEXT    NOT NULL UNIQUE,
        activa       INTEGER DEFAULT 1,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS usuarios (
        id           SERIAL PRIMARY KEY,
        nombre       TEXT    NOT NULL,
        email        TEXT    NOT NULL UNIQUE,
        password_hash TEXT   NOT NULL,
        rol          TEXT    NOT NULL DEFAULT 'estudiante',
        bio          TEXT    DEFAULT '',
        avatar_color TEXT    DEFAULT 'from-violet-500 to-purple-700',
        academia_id  INTEGER DEFAULT 1 REFERENCES academias(id),
        reset_token  TEXT    DEFAULT NULL,
        reset_token_expires TEXT DEFAULT NULL,
        is_verified  INTEGER DEFAULT 0,
        verification_token TEXT DEFAULT NULL,
        notif_email  INTEGER DEFAULT 1,
        notif_platform INTEGER DEFAULT 1,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cursos (
        id              SERIAL PRIMARY KEY,
        titulo          TEXT    NOT NULL,
        descripcion     TEXT    DEFAULT '',
        precio          DOUBLE PRECISION DEFAULT 0,
        modelo_negocio  TEXT    DEFAULT 'gratis',
        estado          TEXT    DEFAULT 'borrador',
        visibilidad     TEXT    DEFAULT 'publico',
        creator_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        academia_id     INTEGER DEFAULT 1 REFERENCES academias(id),
        modulos_count   INTEGER DEFAULT 0,
        duracion        TEXT    DEFAULT '',
        gradient_class  TEXT    DEFAULT 'from-violet-600 to-indigo-700',
        categoria       TEXT    DEFAULT NULL,
        thumbnail       TEXT    DEFAULT NULL,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS inscripciones (
        id            SERIAL PRIMARY KEY,
        estudiante_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        curso_id      INTEGER NOT NULL REFERENCES cursos(id)  ON DELETE CASCADE,
        completed_lessons TEXT DEFAULT '[]',
        progreso      INTEGER DEFAULT 0,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(estudiante_id, curso_id)
      );

      CREATE TABLE IF NOT EXISTS lecciones (
        id         SERIAL PRIMARY KEY,
        titulo     TEXT    NOT NULL DEFAULT 'Lección sin título',
        video_url  TEXT    DEFAULT '',
        iframe_url TEXT    DEFAULT '',
        duracion   TEXT    DEFAULT '',
        orden      INTEGER NOT NULL DEFAULT 0,
        curso_id   INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ejercicios (
        id          SERIAL PRIMARY KEY,
        titulo      TEXT    NOT NULL DEFAULT 'Ejercicio sin título',
        archivo_url TEXT    DEFAULT '',
        descripcion TEXT    DEFAULT '',
        orden       INTEGER DEFAULT 0,
        curso_id    INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS comunidad_posts (
        id         SERIAL PRIMARY KEY,
        tipo       TEXT    NOT NULL DEFAULT 'resena',
        titulo     TEXT    DEFAULT '',
        contenido  TEXT    NOT NULL,
        rating     INTEGER DEFAULT 0,
        tags       TEXT    DEFAULT '[]',
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        curso_id   INTEGER DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS comunidad_respuestas (
        id         SERIAL PRIMARY KEY,
        post_id    INTEGER NOT NULL REFERENCES comunidad_posts(id) ON DELETE CASCADE,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        contenido  TEXT    NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notificaciones (
        id         SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        tipo       TEXT    NOT NULL DEFAULT 'info',
        titulo     TEXT    NOT NULL,
        mensaje    TEXT    DEFAULT '',
        enlace     TEXT    DEFAULT '',
        leida      INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS curso_invitaciones (
        id         SERIAL PRIMARY KEY,
        curso_id   INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
        email      TEXT    NOT NULL,
        token      TEXT    NOT NULL UNIQUE,
        usada      INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS dudas_videos (
        id            SERIAL PRIMARY KEY,
        curso_id      INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
        leccion_id    INTEGER NOT NULL REFERENCES lecciones(id) ON DELETE CASCADE,
        estudiante_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        pregunta      TEXT NOT NULL,
        respuesta     TEXT DEFAULT NULL,
        respondida_por INTEGER DEFAULT NULL REFERENCES usuarios(id) ON DELETE SET NULL,
        respondida_en TEXT DEFAULT NULL,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS gamificacion (
        id              SERIAL PRIMARY KEY,
        usuario_id      INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
        puntos_total    INTEGER DEFAULT 0,
        nivel           INTEGER DEFAULT 1,
        racha_dias      INTEGER DEFAULT 0,
        ultima_actividad TEXT DEFAULT NULL,
        logros          TEXT DEFAULT '[]',
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } else {
    console.log('📦 Inicializando Esquema SQLite...');
    await db.exec(`
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
        rol          TEXT    NOT NULL DEFAULT 'estudiante',
        bio          TEXT    DEFAULT '',
        avatar_color TEXT    DEFAULT 'from-violet-500 to-purple-700',
        academia_id  INTEGER DEFAULT 1 REFERENCES academias(id),
        reset_token  TEXT    DEFAULT NULL,
        reset_token_expires TEXT DEFAULT NULL,
        is_verified  INTEGER DEFAULT 0,
        verification_token TEXT DEFAULT NULL,
        notif_email  INTEGER DEFAULT 1,
        notif_platform INTEGER DEFAULT 1,
        created_at   TEXT    DEFAULT (datetime('now', 'localtime'))
      );

      CREATE TABLE IF NOT EXISTS cursos (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo          TEXT    NOT NULL,
        descripcion     TEXT    DEFAULT '',
        precio          REAL    DEFAULT 0,
        modelo_negocio  TEXT    DEFAULT 'gratis',
        estado          TEXT    DEFAULT 'borrador',
        visibilidad     TEXT    DEFAULT 'publico',
        creator_id      INTEGER NOT NULL REFERENCES usuarios(id),
        academia_id     INTEGER DEFAULT 1 REFERENCES academias(id),
        modulos_count   INTEGER DEFAULT 0,
        duracion        TEXT    DEFAULT '',
        gradient_class  TEXT    DEFAULT 'from-violet-600 to-indigo-700',
        categoria       TEXT    DEFAULT NULL,
        thumbnail       TEXT    DEFAULT NULL,
        created_at      TEXT    DEFAULT (datetime('now', 'localtime'))
      );

      CREATE TABLE IF NOT EXISTS inscripciones (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        estudiante_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        curso_id      INTEGER NOT NULL REFERENCES cursos(id)  ON DELETE CASCADE,
        completed_lessons TEXT DEFAULT '[]',
        progreso      INTEGER DEFAULT 0,
        created_at    TEXT    DEFAULT (datetime('now', 'localtime')),
        UNIQUE(estudiante_id, curso_id)
      );

      CREATE TABLE IF NOT EXISTS lecciones (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo     TEXT    NOT NULL DEFAULT 'Lección sin título',
        video_url  TEXT    DEFAULT '',
        iframe_url TEXT    DEFAULT '',
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

      CREATE TABLE IF NOT EXISTS dudas_videos (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        curso_id      INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
        leccion_id    INTEGER NOT NULL REFERENCES lecciones(id) ON DELETE CASCADE,
        estudiante_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        pregunta      TEXT NOT NULL,
        respuesta     TEXT DEFAULT NULL,
        respondida_por INTEGER DEFAULT NULL REFERENCES usuarios(id) ON DELETE SET NULL,
        respondida_en TEXT DEFAULT NULL,
        created_at    TEXT    DEFAULT (datetime('now', 'localtime'))
      );

      CREATE TABLE IF NOT EXISTS gamificacion (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id      INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
        puntos_total    INTEGER DEFAULT 0,
        nivel           INTEGER DEFAULT 1,
        racha_dias      INTEGER DEFAULT 0,
        ultima_actividad TEXT DEFAULT NULL,
        logros          TEXT DEFAULT '[]',
        created_at      TEXT    DEFAULT (datetime('now', 'localtime'))
      );
    `);
  }

  // ─── Seeders de Inicialización ──────────────────────────────────────────────
  const checkAcademia = await db.get('SELECT COUNT(*) as c FROM academias WHERE id = 1');
  if (parseInt(checkAcademia?.c || checkAcademia?.count || 0) === 0) {
    console.log('🌱 Poblando base de datos inicial con seeders...');
    await db.run("INSERT INTO academias (id, nombre, slug) VALUES (1, 'Academia Principal', 'principal')");

    const superadminHash = bcrypt.hashSync('SuperAdmin2026!', 12);
    const creatorHash = bcrypt.hashSync('YourCourse2025!', 12);
    const estHash = bcrypt.hashSync('Est123456!', 12);

    // Creadores/Admins
    const admin = await db.run("INSERT INTO usuarios (nombre, email, password_hash, rol, bio, avatar_color, academia_id, is_verified) VALUES (?, ?, ?, ?, ?, ?, 1, 1)", 
      ['Admin Plataforma', 'admin@yourcourse.mx', superadminHash, 'superadmin', 'Gestor global de la plataforma', 'from-slate-700 to-slate-900']
    );
    const creator = await db.run("INSERT INTO usuarios (nombre, email, password_hash, rol, bio, avatar_color, academia_id, is_verified) VALUES (?, ?, ?, ?, ?, ?, 1, 1)", 
      ['Jessica Castro', 'creador@yourcourse.mx', creatorHash, 'creador', 'Educadora apasionada', 'from-violet-500 to-purple-700']
    );
    
    // Estudiantes
    const creatorId = creator.lastInsertRowid;
    const est1 = await db.run("INSERT INTO usuarios (nombre, email, password_hash, rol, bio, avatar_color, academia_id, is_verified) VALUES (?, ?, ?, ?, ?, ?, 1, 1)",
      ['Carlos Rodríguez', 'carlos@gmail.com', estHash, 'estudiante', '', 'from-blue-500 to-cyan-600']
    );
    const est2 = await db.run("INSERT INTO usuarios (nombre, email, password_hash, rol, bio, avatar_color, academia_id, is_verified) VALUES (?, ?, ?, ?, ?, ?, 1, 1)",
      ['Ana Jiménez', 'ana@gmail.com', estHash, 'estudiante', '', 'from-emerald-500 to-teal-600']
    );

    // Cursos
    const c1 = await db.run("INSERT INTO cursos (titulo, descripcion, precio, modelo_negocio, estado, creator_id, academia_id, modulos_count, duracion, gradient_class, categoria) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)",
      ['React Avanzado con Hooks y Context API', 'Domina React 18 con hooks.', 499, 'pago_unico', 'publicado', creatorId, 8, '12h 30m', 'from-violet-600 to-indigo-700', 'tecnologia']
    );
    const c2 = await db.run("INSERT INTO cursos (titulo, descripcion, precio, modelo_negocio, estado, creator_id, academia_id, modulos_count, duracion, gradient_class, categoria) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)",
      ['Node.js y Express desde Cero', 'Construye APIs REST robustas.', 0, 'gratis', 'publicado', creatorId, 5, '8h 15m', 'from-blue-600 to-cyan-600', 'tecnologia']
    );

    // Inscripciones
    await db.run("INSERT INTO inscripciones (estudiante_id, curso_id, progreso) VALUES (?, ?, 0)", [est1.lastInsertRowid, c1.lastInsertRowid]);
    await db.run("INSERT INTO inscripciones (estudiante_id, curso_id, progreso) VALUES (?, ?, 0)", [est2.lastInsertRowid, c1.lastInsertRowid]);
    await db.run("INSERT INTO inscripciones (estudiante_id, curso_id, progreso) VALUES (?, ?, 0)", [est2.lastInsertRowid, c2.lastInsertRowid]);

    // Gamificación inicial
    await db.run("INSERT INTO gamificacion (usuario_id, puntos_total, nivel, racha_dias, logros) VALUES (?, 0, 1, 0, '[]')", [est1.lastInsertRowid]);
    await db.run("INSERT INTO gamificacion (usuario_id, puntos_total, nivel, racha_dias, logros) VALUES (?, 0, 1, 0, '[]')", [est2.lastInsertRowid]);

    console.log('✅ Base de datos inicializada y poblada con seeders correctamente.');
  } else {
    console.log('✅ Base de datos cargada sin necesidad de poblar.');
  }
}

// Ejecutar inicialización de forma asíncrona no bloqueante al requerir
initDb().catch(err => {
  console.error('❌ Error fatal al inicializar base de datos:', err.message);
});

module.exports = db;
