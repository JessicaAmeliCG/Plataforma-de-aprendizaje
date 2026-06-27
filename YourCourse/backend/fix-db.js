const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

const superadminHash = bcrypt.hashSync('SuperAdmin2026!', 12);

try {
  const insertUser = db.prepare(`
    INSERT INTO usuarios (nombre, email, password_hash, rol, bio, avatar_color, academia_id)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  insertUser.run('Admin Plataforma', 'admin@yourcourse.mx', superadminHash, 'superadmin', 'Gestor global de la plataforma', 'from-slate-700 to-slate-900');
  console.log('✅ Super Administrador creado exitosamente.');
} catch (err) {
  if (err.message.includes('UNIQUE')) {
    console.log('ℹ️ El Super Administrador ya existe en la base de datos.');
  } else {
    console.error('❌ Error:', err.message);
  }
}

const usuarios = db.prepare('SELECT id, nombre, email, rol FROM usuarios').all();
console.table(usuarios);
