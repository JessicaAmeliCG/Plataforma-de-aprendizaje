/**
 * roleMiddleware.js
 * YourCourse — Middleware RBAC Contextual (Role-Based Access Control)
 *
 * Verifica que el usuario autenticado (req.user) tenga los permisos necesarios
 * para acceder a un recurso. Soporta dos niveles de permiso:
 *
 *   1. Nivel Global (SuperAdmin): acceso total a cualquier recurso de la plataforma.
 *   2. Nivel Contextual (Academia): el usuario debe tener el rol requerido
 *      específicamente en la academia indicada por req.params.academia_id o
 *      req.body.academia_id.
 *
 * IMPORTANTE: Este middleware DEBE ejecutarse DESPUÉS de authMiddleware.
 *
 * Uso:
 *   // Solo SuperAdmin puede acceder
 *   router.delete('/academia/:academia_id', authMiddleware, requireRole(['owner']), handler)
 *
 *   // Owner o Editor de la academia específica
 *   router.put('/academia/:academia_id/curso/:id', authMiddleware, requireRole(['owner', 'editor']), handler)
 */

const { Pool } = require('pg');

// ─── Pool de conexión (inyección de dependencias) ───────────────────────────────
// Se crea UNA SOLA vez y se reutiliza. En producción, inyectar desde config/db.js
let _pool;

/**
 * Configura el pool de PostgreSQL que usará el middleware.
 * Llamar una sola vez al inicializar la aplicación.
 *
 * @param {Pool} pool — Instancia de pg.Pool ya configurada
 */
const setPool = (pool) => {
  _pool = pool;
};

/**
 * Obtiene el pool activo. Lanza error si no fue configurado.
 * @returns {Pool}
 */
const getPool = () => {
  if (!_pool) {
    throw new Error('[roleMiddleware] El pool de base de datos no ha sido configurado. Llama a setPool() al inicializar la app.');
  }
  return _pool;
};

// ─── Mensajes de error estandarizados ──────────────────────────────────────────
const ERRORS = {
  NO_USER:        { status: 401, code: 'ROLE_NO_USER',         message: 'No autenticado. Ejecuta authMiddleware antes de roleMiddleware.' },
  NO_ACADEMIA_ID: { status: 400, code: 'ROLE_NO_ACADEMIA_ID',  message: 'Se requiere academia_id para verificar permisos contextuales.' },
  FORBIDDEN:      { status: 403, code: 'ROLE_FORBIDDEN',       message: 'No tienes permisos suficientes para realizar esta acción.' },
  DB_ERROR:       { status: 500, code: 'ROLE_DB_ERROR',        message: 'Error interno al verificar permisos.' },
};

const sendError = (res, error) => {
  return res.status(error.status).json({
    success: false,
    error: {
      code:    error.code,
      message: error.message,
    },
  });
};

/**
 * Factory que retorna un middleware de verificación de roles contextual.
 *
 * @param {string[]} rolesPermitidos — Lista de roles que pueden acceder (ej. ['owner', 'editor'])
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   // Solo owner o editor de la academia pueden modificar cursos
 *   router.put('/cursos/:id', authMiddleware, requireRole(['owner', 'editor']), updateCursoHandler);
 */
const requireRole = (rolesPermitidos = []) => {
  return async (req, res, next) => {
    // ── 1. Validar que authMiddleware haya inyectado req.user ─────────────────
    if (!req.user || !req.user.id) {
      return sendError(res, ERRORS.NO_USER);
    }

    const { id: userId, rol_global } = req.user;

    // ── 2. SuperAdmin tiene acceso global sin restricciones ───────────────────
    if (rol_global === 'superadmin') {
      return next();
    }

    // ── 3. Obtener el academia_id del contexto de la petición ─────────────────
    // Prioridad: params > body > query
    const academiaId =
      req.params.academia_id ||
      req.body?.academia_id  ||
      req.query?.academia_id;

    if (!academiaId) {
      return sendError(res, ERRORS.NO_ACADEMIA_ID);
    }

    // ── 4. Consultar el rol contextual del usuario en esta academia específica ─
    try {
      const pool = getPool();

      const result = await pool.query(
        `SELECT rol
         FROM roles_contextuales
         WHERE usuario_id  = $1
           AND academia_id = $2
         LIMIT 1`,
        [userId, academiaId]
      );

      if (result.rows.length === 0) {
        // El usuario no tiene ningún rol en esta academia
        return sendError(res, ERRORS.FORBIDDEN);
      }

      const rolContextual = result.rows[0].rol;

      // ── 5. Verificar si el rol contextual está en la lista de permitidos ────
      if (!rolesPermitidos.includes(rolContextual)) {
        return sendError(res, ERRORS.FORBIDDEN);
      }

      // Inyectar el rol resuelto para que los handlers lo puedan usar
      req.rolContextual = rolContextual;
      req.academiaId    = academiaId;

      return next();

    } catch (dbError) {
      console.error('[roleMiddleware] Error al consultar roles_contextuales:', dbError.message);
      return sendError(res, ERRORS.DB_ERROR);
    }
  };
};

/**
 * Middleware para rutas exclusivas de SuperAdmin.
 * Atajo de requireRole([]) con validación directa de rol_global.
 *
 * @type {import('express').RequestHandler}
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || !req.user.id) {
    return sendError(res, ERRORS.NO_USER);
  }

  if (req.user.rol_global !== 'superadmin') {
    return sendError(res, ERRORS.FORBIDDEN);
  }

  return next();
};

module.exports = {
  requireRole,
  requireSuperAdmin,
  setPool,
};
