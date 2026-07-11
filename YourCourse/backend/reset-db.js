require('dotenv').config();
const { execSync } = require('child_process');
const Database = require('better-sqlite3');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const pgHost = process.env.PGHOST || 'localhost';
const pgUser = process.env.PGUSER || 'postgres';
const pgPassword = process.env.PGPASSWORD || 'yourcourse_secure_pass';
const pgDatabase = process.env.PGDATABASE || 'yourcourse_db';
const pgPort = process.env.PGPORT || 5432;

async function runReset() {
  console.log('🔄 Iniciando reseteo y actualización total de la base de datos...');
  
  // 1. Probar Postgres
  let isPostgres = false;
  try {
    execSync(`node -e "const {Client} = require('pg'); const c = new Client({host:'${pgHost}', user:'${pgUser}', password:'${pgPassword}', database:'${pgDatabase}', port:${pgPort}}); c.connect().then(() => { process.exit(0); }).catch(() => { process.exit(1); })"`, { stdio: 'pipe', timeout: 2500 });
    isPostgres = true;
  } catch {}

  if (isPostgres) {
    console.log('🐘 Detectado PostgreSQL. Eliminando tablas existentes...');
    const pool = new Pool({ host: pgHost, user: pgUser, password: pgPassword, database: pgDatabase, port: pgPort });
    
    const tables = [
      'gamificacion', 'dudas_videos', 'curso_invitaciones', 'notificaciones', 
      'comunidad_respuestas', 'comunidad_posts', 'ejercicios', 'lecciones', 
      'inscripciones', 'cursos', 'usuarios', 'academias'
    ];
    for (const t of tables) {
      await pool.query(`DROP TABLE IF EXISTS ${t} CASCADE`);
    }
    await pool.end();
    console.log('✅ Tablas de PostgreSQL eliminadas.');
  } else {
    console.log('📦 Detectado SQLite. Eliminando archivo de base de datos para inicio limpio...');
    const DATA_DIR = path.join(__dirname, 'data');
    const DB_PATH  = path.join(DATA_DIR, 'yourcourse.db');
    
    try {
      if (fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH);
        console.log('✅ Archivo SQLite original eliminado.');
      }
    } catch (e) {
      console.log('No se pudo borrar el archivo SQLite (puede estar bloqueado por el servidor). Intentando vaciar tablas...');
      const sqliteDb = new Database(DB_PATH);
      sqliteDb.exec('PRAGMA foreign_keys = OFF;');
      const tables = [
        'gamificacion', 'dudas_videos', 'curso_invitaciones', 'notificaciones', 
        'comunidad_respuestas', 'comunidad_posts', 'ejercicios', 'lecciones', 
        'inscripciones', 'cursos', 'usuarios', 'academias'
      ];
      for (const t of tables) {
        sqliteDb.exec(`DROP TABLE IF EXISTS ${t}`);
      }
      sqliteDb.close();
      console.log('✅ Tablas de SQLite eliminadas.');
    }
  }

  console.log('🚀 Iniciando reinicialización de esquemas y semilla de datos...');
  delete require.cache[require.resolve('./src/config/db')];
  
  // Requiriendo db.js ejecutará initDb() en una base de datos vacía
  const db = require('./src/config/db');
  
  // Esperar a que la inicialización DDL y seeds asíncronos terminen
  await new Promise(r => setTimeout(r, 4000));
  
  console.log('🎉 ¡Base de datos completamente actualizada y recreada de forma exitosa!');
  process.exit(0);
}

runReset().catch(err => {
  console.error('❌ Error ejecutando el reseteo:', err);
  process.exit(1);
});
