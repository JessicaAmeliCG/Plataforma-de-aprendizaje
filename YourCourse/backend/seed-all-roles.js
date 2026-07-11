/**
 * seed-all-roles.js — Inserta/actualiza las cuentas de prueba oficiales con roles
 * y credenciales diferenciadas tanto para PostgreSQL como SQLite.
 */

const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 Iniciando siembra de cuentas con roles y credenciales diferenciadas...');

  // Hashing passwords
  const superadminHash = bcrypt.hashSync('SuperAdmin2026!', 12);
  const adminHash      = bcrypt.hashSync('Admin1234!', 12);
  const moderadorHash  = bcrypt.hashSync('Mod2026!', 12);
  const creadorHash    = bcrypt.hashSync('Crea123456!', 12);
  const estudianteHash = bcrypt.hashSync('Est123456!', 12);

  const ACCOUNTS = [
    { nombre: 'SuperAdmin Global', email: 'superadmin@yourcourse.mx', hash: superadminHash, rol: 'superadmin', bio: 'Administrador global del sistema' },
    { nombre: 'Admin Plataforma',  email: 'admin@yourcourse.mx',      hash: adminHash,      rol: 'superadmin', bio: 'Administrador de la plataforma' },
    { nombre: 'Moderador Foros',   email: 'moderador@yourcourse.mx',  hash: moderadorHash,  rol: 'moderador',  bio: 'Moderador del foro y la comunidad' },
    { nombre: 'Creador Contenido',  email: 'creador@yourcourse.mx',    hash: creadorHash,    rol: 'creador',    bio: 'Creador de cursos e instructor' },
    { nombre: 'Carlos Estudiante',  email: 'carlos@gmail.com',         hash: estudianteHash, rol: 'estudiante', bio: 'Estudiante de la plataforma' }
  ];

  for (const acc of ACCOUNTS) {
    try {
      // Verificar si ya existe
      const existing = await db.get('SELECT id FROM usuarios WHERE email = ?', [acc.email]);
      if (existing) {
        // Actualizar contraseña y rol
        await db.run(
          'UPDATE usuarios SET nombre = ?, password_hash = ?, rol = ?, bio = ?, is_verified = 1 WHERE id = ?',
          [acc.nombre, acc.hash, acc.rol, acc.bio, existing.id]
        );
        console.log(`✅ Cuenta actualizada: ${acc.email} | Rol: ${acc.rol}`);
      } else {
        // Insertar nuevo
        await db.run(
          'INSERT INTO usuarios (nombre, email, password_hash, rol, bio, avatar_color, academia_id, is_verified) VALUES (?, ?, ?, ?, ?, ?, 1, 1)',
          [acc.nombre, acc.email, acc.hash, acc.rol, acc.bio, 'from-violet-500 to-purple-700']
        );
        console.log(`✅ Cuenta creada: ${acc.email} | Rol: ${acc.rol}`);
      }
    } catch (err) {
      console.error(`❌ Error con la cuenta ${acc.email}:`, err.message);
    }
  }

  // Asegurar que todos tengan registro en gamificación para evitar errores
  try {
    const users = await db.query('SELECT id FROM usuarios');
    for (const u of users) {
      await db.run(`
        INSERT INTO gamificacion (usuario_id, puntos_total, nivel, racha_dias, logros)
        VALUES (?, 0, 1, 0, '[]')
        ON CONFLICT (usuario_id) DO NOTHING
      `, [u.id]);
    }
    console.log('✅ Registros de gamificación sincronizados.');
  } catch (err) {
    console.error('❌ Error al sincronizar gamificación:', err.message);
  }

  console.log('🌱 Siembra de roles completada exitosamente.');
  process.exit(0);
}

seed();
