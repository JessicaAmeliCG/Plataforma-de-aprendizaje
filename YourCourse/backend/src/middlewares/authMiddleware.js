/**
 * authMiddleware.js
 * YourCourse — Middleware de Autenticación JWT
 *
 * Valida el token Bearer en la cabecera Authorization de cada petición HTTP.
 * Si el token es válido, inyecta el payload decodificado en req.user y pasa al
 * siguiente middleware. De lo contrario, responde con el código HTTP adecuado.
 *
 * Uso:
 *   router.get('/ruta-protegida', authMiddleware, (req, res) => { ... })
 */

const jwt = require('jsonwebtoken');

// ─── Constantes ────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // Falla rápido en arranque si no está configurado el secreto
  throw new Error('[authMiddleware] La variable de entorno JWT_SECRET no está definida.');
}

// ─── Mensajes de error estandarizados ──────────────────────────────────────────
const ERRORS = {
  NO_TOKEN:        { status: 401, code: 'AUTH_NO_TOKEN',        message: 'Acceso denegado. No se proporcionó token de autenticación.' },
  INVALID_FORMAT:  { status: 401, code: 'AUTH_INVALID_FORMAT',  message: 'Formato de token inválido. Usa el esquema: Bearer <token>' },
  TOKEN_EXPIRED:   { status: 401, code: 'AUTH_TOKEN_EXPIRED',   message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.' },
  TOKEN_INVALID:   { status: 401, code: 'AUTH_TOKEN_INVALID',   message: 'Token de autenticación inválido o manipulado.' },
};

/**
 * Responde con un error de autenticación estandarizado.
 *
 * @param {import('express').Response} res
 * @param {{ status: number, code: string, message: string }} error
 */
const sendAuthError = (res, error) => {
  return res.status(error.status).json({
    success: false,
    error: {
      code:    error.code,
      message: error.message,
    },
  });
};

/**
 * Middleware principal de autenticación.
 * Extrae y verifica el JWT del header `Authorization: Bearer <token>`.
 *
 * @type {import('express').RequestHandler}
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // 1. Verificar existencia del header
  if (!authHeader) {
    return sendAuthError(res, ERRORS.NO_TOKEN);
  }

  // 2. Verificar formato "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return sendAuthError(res, ERRORS.INVALID_FORMAT);
  }

  const token = parts[1];

  // 3. Verificar y decodificar el token
  jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return sendAuthError(res, ERRORS.TOKEN_EXPIRED);
      }
      // JsonWebTokenError, NotBeforeError u otros
      return sendAuthError(res, ERRORS.TOKEN_INVALID);
    }

    /**
     * Inyectar el payload decodificado en req.user para uso posterior.
     * El payload debe contener al menos:
     *   { id, email, username, rol_global, tipo_suscripcion }
     */
    req.user = decoded;
    next();
  });
};

module.exports = authMiddleware;
