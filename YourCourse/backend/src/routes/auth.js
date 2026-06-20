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
const db               = require('../config/db');
const notif            = require('../services/notif');
const { validatePassword } = require('../config/passwordPolicy');


const JWT_SECRET  = process.env.JWT_SECRET || 'yourcourse_fallback_secret';
const JWT_EXPIRES = '7d';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function publicUser(u) {
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
router.post('/register', (req, res) => {
  const { nombre, email, password } = req.body;

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

  const existing = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email.toLowerCase().trim());
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

  const result = db.prepare(`
    INSERT INTO usuarios (nombre, email, password_hash, rol, avatar_color, academia_id)
    VALUES (?, ?, ?, 'estudiante', ?, 1)
  `).run(nombre.trim(), email.toLowerCase().trim(), hash, avatarColor);

  const newUser = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(result.lastInsertRowid);
  const token   = jwt.sign({ id: newUser.id, email: newUser.email, rol: newUser.rol }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

  // Disparar notificaciones y email de bienvenida de forma asíncrona
  notif.onNuevoEstudiante(newUser).catch(err => console.error('notif error:', err.message));

  return res.status(201).json({ success: true, message: 'Cuenta creada exitosamente.', token, user: publicUser(newUser) });

});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: { message: 'Email y contraseña son requeridos.' } });

  const user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: { message: 'Credenciales incorrectas.' } });

  const token = jwt.sign({ id: user.id, email: user.email, rol: user.rol }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return res.json({ success: true, token, user: publicUser(user) });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: { message: 'Usuario no encontrado.' } });
  return res.json({ success: true, user: publicUser(user) });
});

// ─── PATCH /api/auth/me — Actualizar perfil ───────────────────────────────────
router.patch('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: { message: 'Usuario no encontrado.' } });

  const { nombre, bio, avatar_color, notif_email, notif_platform } = req.body;

  if (nombre !== undefined && (!nombre || nombre.trim().length < 2))
    return res.status(400).json({ error: { message: 'El nombre debe tener al menos 2 caracteres.' } });

  const nuevoNombre      = nombre       !== undefined ? nombre.trim()  : user.nombre;
  const nuevaBio         = bio          !== undefined ? bio.trim()     : (user.bio || '');
  const nuevoAvatarColor = avatar_color !== undefined ? avatar_color   : user.avatar_color;
  const nuevoNotifEmail    = notif_email    !== undefined ? (notif_email    ? 1 : 0) : (user.notif_email    ?? 1);
  const nuevoNotifPlatform = notif_platform !== undefined ? (notif_platform ? 1 : 0) : (user.notif_platform ?? 1);

  db.prepare('UPDATE usuarios SET nombre = ?, bio = ?, avatar_color = ?, notif_email = ?, notif_platform = ? WHERE id = ?')
    .run(nuevoNombre, nuevaBio, nuevoAvatarColor, nuevoNotifEmail, nuevoNotifPlatform, user.id);

  const updated = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(user.id);
  return res.json({ success: true, user: publicUser(updated) });

});

// ─── PATCH /api/auth/password — Cambiar contraseña ───────────────────────────
router.patch('/password', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.user.id);
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

  db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?')
    .run(bcrypt.hashSync(newPassword, 12), user.id);

  return res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
});

module.exports = router;
