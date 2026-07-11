/**
 * auth.js — Rutas de autenticación
 * POST  /api/auth/register  — Registro de estudiantes
 * POST  /api/auth/login     — Login (creador y estudiantes)
 * GET   /api/auth/me        — Obtener perfil propio
 * PATCH /api/auth/me        — Actualizar perfil (nombre, bio, avatar_color)
 * PATCH /api/auth/password  — Cambiar contraseña
 */

const router           = require('express').Router();
const bcrypt           = require('bcryptjs');
const jwt              = require('jsonwebtoken');
const crypto           = require('crypto');
const db               = require('../config/db');
const notif            = require('../services/notif');
const mailer           = require('../services/mailer');
const { validatePassword } = require('../config/passwordPolicy');


const JWT_SECRET  = process.env.JWT_SECRET || 'yourcourse_fallback_secret';
const JWT_EXPIRES = '7d';

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function publicUser(u) {
  return {
    id:              u.id,
    nombre:          u.nombre,
    email:           u.email,
    rol:             u.rol,
    bio:             u.bio          || '',
    avatar_color:    u.avatar_color || 'from-violet-500 to-purple-700',
    notif_email:     u.notif_email    !== undefined ? u.notif_email    : 1,
    notif_platform:  u.notif_platform !== undefined ? u.notif_platform : 1,
    academia_id:     u.academia_id    !== undefined ? u.academia_id    : 1,
    created_at:      u.created_at,
  };
}


function authMiddleware(req, res, next) {
  const h = req.headers['authorization'];
  if (!h || !h.startsWith('Bearer '))
    return res.status(401).json({ error: { message: 'No autenticado.' } });
  try {
    req.user = jwt.verify(h.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: { message: 'Token inválido o expirado.' } });
  }
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { nombre, email, password, invitationToken } = req.body;

  if (!nombre || !email || !password)
    return res.status(400).json({ error: { message: 'Nombre, email y contraseña son requeridos.' } });

  // ── Validar política de contraseñas ───────────────────────────────────────
  const pwdCheck = validatePassword(password);
  if (!pwdCheck.valid)
    return res.status(400).json({
      error: {
        message: pwdCheck.message,
        errores: pwdCheck.errores,
      },
    });

  const existing = await db.get('SELECT id FROM usuarios WHERE email = ?', email.toLowerCase().trim());
  if (existing)
    return res.status(409).json({ error: { message: 'Este email ya está registrado.' } });

  const COLORS = [
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
  ];
  const avatarColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  const hash = bcrypt.hashSync(password, 12);
  const verifyToken = crypto.randomBytes(32).toString('hex');
  const is_verified = 1; // Auto-verificado por defecto para facilitar pruebas e ingreso inmediato

  const result = await db.run(`
    INSERT INTO usuarios (nombre, email, password_hash, rol, avatar_color, academia_id, verification_token, is_verified)
    VALUES (?, ?, ?, 'estudiante', ?, 1, ?, ?)
  `, nombre.trim(), email.toLowerCase().trim(), hash, avatarColor, verifyToken, is_verified);

  const newUser = await db.get('SELECT * FROM usuarios WHERE id = ?', result.lastInsertRowid);
  
  // Procesar token de invitación si existe
  if (invitationToken) {
    try {
      const invitacion = await db.get('SELECT * FROM curso_invitaciones WHERE token = ?', invitationToken);
      if (invitationToken && invitacion && !invitacion.usada && invitacion.email === newUser.email) {
        await db.run('INSERT INTO inscripciones (estudiante_id, curso_id) VALUES (?, ?)', newUser.id, invitacion.curso_id);
        await db.run('UPDATE curso_invitaciones SET usada = 1 WHERE id = ?', invitacion.id);
      }
    } catch (err) {
      console.error('Error procesando invitación en registro:', err);
    }
  }

  const token   = jwt.sign({ id: newUser.id, email: newUser.email, rol: newUser.rol, academia_id: newUser.academia_id || 1 }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

  // Disparar notificaciones y email de verificación (si no fue auto-verificado)
  notif.onNuevoEstudiante(newUser).catch(err => console.error('notif error:', err.message));
  if (!is_verified) {
    mailer.sendVerificationEmail({ email: newUser.email, nombre: newUser.nombre, token: verifyToken })
      .catch(err => console.error('Error enviando email de verificación:', err));
  } else {
    mailer.sendWelcomeEmail({ email: newUser.email, nombre: newUser.nombre })
      .catch(err => console.error('Error enviando email de bienvenida:', err));
  }

  return res.status(201).json({ success: true, message: 'Cuenta creada exitosamente.', token, user: publicUser(newUser) });

});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: { message: 'Email y contraseña son requeridos.' } });

  const user = await db.get('SELECT * FROM usuarios WHERE email = ?', email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: { message: 'Credenciales incorrectas.' } });

  // Comprobar si está verificado
  if (!user.is_verified) {
    return res.status(403).json({ error: { message: 'Por favor, verifica tu cuenta desde el enlace que enviamos a tu correo.' } });
  }

  const token = jwt.sign({ id: user.id, email: user.email, rol: user.rol, academia_id: user.academia_id || 1 }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return res.json({ success: true, token, user: publicUser(user) });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  const user = await db.get('SELECT * FROM usuarios WHERE id = ?', req.user.id);
  if (!user) return res.status(404).json({ error: { message: 'Usuario no encontrado.' } });
  return res.json({ success: true, user: publicUser(user) });
});

// ─── PATCH /api/auth/me — Actualizar perfil ───────────────────────────────────
router.patch('/me', authMiddleware, async (req, res) => {
  const user = await db.get('SELECT * FROM usuarios WHERE id = ?', req.user.id);
  if (!user) return res.status(404).json({ error: { message: 'Usuario no encontrado.' } });

  const { nombre, bio, avatar_color, notif_email, notif_platform } = req.body;

  if (nombre !== undefined && (!nombre || nombre.trim().length < 2))
    return res.status(400).json({ error: { message: 'El nombre debe tener al menos 2 caracteres.' } });

  const nuevoNombre      = nombre       !== undefined ? nombre.trim()  : user.nombre;
  const nuevaBio         = bio          !== undefined ? bio.trim()     : (user.bio || '');
  const nuevoAvatarColor = avatar_color !== undefined ? avatar_color   : user.avatar_color;
  const nuevoNotifEmail    = notif_email    !== undefined ? (notif_email    ? 1 : 0) : (user.notif_email    ?? 1);
  const nuevoNotifPlatform = notif_platform !== undefined ? (notif_platform ? 1 : 0) : (user.notif_platform ?? 1);

  await db.run('UPDATE usuarios SET nombre = ?, bio = ?, avatar_color = ?, notif_email = ?, notif_platform = ? WHERE id = ?', 
    nuevoNombre, nuevaBio, nuevoAvatarColor, nuevoNotifEmail, nuevoNotifPlatform, user.id);

  const updated = await db.get('SELECT * FROM usuarios WHERE id = ?', user.id);
  return res.json({ success: true, user: publicUser(updated) });

});

// ─── PATCH /api/auth/password — Cambiar contraseña ───────────────────────────
router.patch('/password', authMiddleware, async (req, res) => {
  const user = await db.get('SELECT * FROM usuarios WHERE id = ?', req.user.id);
  if (!user) return res.status(404).json({ error: { message: 'Usuario no encontrado.' } });

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: { message: 'Contraseña actual y nueva son requeridas.' } });

  // ── Validar política de contraseñas en la nueva ────────────────────────────
  const pwdCheck = validatePassword(newPassword);
  if (!pwdCheck.valid)
    return res.status(400).json({
      error: {
        message: pwdCheck.message,
        errores: pwdCheck.errores,
      },
    });

  if (!bcrypt.compareSync(currentPassword, user.password_hash))
    return res.status(401).json({ error: { message: 'La contraseña actual es incorrecta.' } });

  await db.run('UPDATE usuarios SET password_hash = ? WHERE id = ?', 
    bcrypt.hashSync(newPassword, 12), user.id);

  return res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
});

// ─── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: { message: 'El correo electrónico es requerido.' } });

  const user = await db.get('SELECT * FROM usuarios WHERE email = ?', email.toLowerCase().trim());
  if (!user) {
    // Por seguridad, no decimos si el usuario existe o no, pero retornamos success
    return res.json({ success: true, message: 'Si el correo existe, recibirás instrucciones.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  // Expira en 1 hora
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  await db.run('UPDATE usuarios SET reset_token = ?, reset_token_expires = ? WHERE id = ?', resetToken, expiresAt, user.id);

  const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

  try {
    await mailer.sendPasswordResetEmail({ email: user.email, nombre: user.nombre, token: resetToken });
    return res.json({ success: true, message: 'Si el correo existe, recibirás instrucciones.', devResetUrl: resetUrl });
  } catch (err) {
    console.error('Error al enviar correo de recuperación:', err);
    // Devolvemos success con devResetUrl de todas formas en desarrollo para no bloquear el flujo
    return res.json({ success: true, message: 'Si el correo existe, recibirás instrucciones (correo simulado).', devResetUrl: resetUrl });
  }
});

// ─── POST /api/auth/reset-password ────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: { message: 'Faltan parámetros.' } });

  const user = await db.get('SELECT * FROM usuarios WHERE reset_token = ?', token);
  
  if (!user) {
    return res.status(400).json({ error: { message: 'Enlace inválido o expirado.' } });
  }

  // Verificar expiración
  if (new Date() > new Date(user.reset_token_expires)) {
    return res.status(400).json({ error: { message: 'El enlace ha expirado.' } });
  }

  const pwdCheck = validatePassword(newPassword);
  if (!pwdCheck.valid) {
    return res.status(400).json({
      error: { message: pwdCheck.message, errores: pwdCheck.errores },
    });
  }

  const hash = bcrypt.hashSync(newPassword, 12);
  await db.run('UPDATE usuarios SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', hash, user.id);

  return res.json({ success: true, message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' });
});

// ─── POST /api/auth/verify-email ──────────────────────────────────────────────
router.post('/verify-email', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: { message: 'Falta el token de verificación.' } });

  const user = await db.get('SELECT * FROM usuarios WHERE verification_token = ?', token);
  if (!user) {
    return res.status(400).json({ error: { message: 'Enlace de verificación inválido.' } });
  }

  if (user.is_verified) {
    return res.json({ success: true, message: 'La cuenta ya ha sido verificada.' });
  }

  await db.run('UPDATE usuarios SET is_verified = 1, verification_token = NULL WHERE id = ?', user.id);

  // Enviar email de bienvenida una vez verificado
  mailer.sendWelcomeEmail({ email: user.email, nombre: user.nombre })
    .catch(err => console.error('Error enviando email de bienvenida:', err));

  return res.json({ success: true, message: 'Tu cuenta ha sido verificada correctamente.' });
});

module.exports = router;
