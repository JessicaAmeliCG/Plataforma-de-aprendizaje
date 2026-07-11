/**
 * gamificationEngine.js — Motor de Experiencia (XP), Niveles y Logros
 * Compatible con SQLite (better-sqlite3) y PostgreSQL de forma asíncrona
 */

const db = require('../config/db');

const XP_POR_ACCION = {
  LOGIN_DIARIO:        25,
  INSCRIBIRSE_CURSO:  100,
  LECCION_COMPLETADA:  50,
  CURSO_COMPLETADO:   500,
  CREAR_DUDA:          20,
  CREAR_POST:          30,
  RESPONDER_POST:      15,
};

const LOGROS_CONFIG = [
  { id: 'primer_paso',   nombre: 'Primer Paso 🏁',        desc: 'Inscríbete en tu primer curso.' },
  { id: 'explorador',    nombre: 'Explorador 🧭',         desc: 'Completa tu primera lección.' },
  { id: 'graduado',      nombre: 'Graduado 🎓',           desc: 'Completa un curso al 100%.' },
  { id: 'curioso',       nombre: 'Curioso 💬',            desc: 'Realiza tu primera duda en clase.' },
  { id: 'comunicador',   nombre: 'Comunicador 📣',        desc: 'Publica tu primer post en la comunidad.' },
  { id: 'superestrella', nombre: 'Súper Estrella ⭐',     desc: 'Alcanza el nivel 5 de aprendizaje.' },
];

/**
 * Asegura que el usuario tenga un registro de gamificación
 */
async function asegurarRegistro(usuarioId) {
  await db.run(`
    INSERT INTO gamificacion (usuario_id, puntos_total, nivel, racha_dias, logros)
    VALUES (?, 0, 1, 0, '[]')
    ON CONFLICT (usuario_id) DO NOTHING
  `, usuarioId);
}

/**
 * Procesa una acción y otorga XP/logros al usuario
 */
async function procesarAccion(usuarioId, accion, metadatos = {}) {
  try {
    await asegurarRegistro(usuarioId);

    const xpGanado = XP_POR_ACCION[accion] || 0;
    if (xpGanado === 0) return { xp_ganado: 0, nivel_anterior: 1, nivel_nuevo: 1 };

    // 1. Obtener estado actual
    const current = await db.get('SELECT * FROM gamificacion WHERE usuario_id = ?', usuarioId);
    const puntosAnteriores = current.puntos_total;
    const puntosNuevos = puntosAnteriores + xpGanado;

    // Calcular nivel (500 XP por nivel)
    const nivelAnterior = current.nivel;
    const nivelNuevo = Math.floor(puntosNuevos / 500) + 1;
    const levelUp = nivelNuevo > nivelAnterior;

    // 2. Evaluar logros a desbloquear
    let logros = JSON.parse(current.logros || '[]');
    const nuevosLogros = [];

    const unlockLogro = (logroId) => {
      if (!logros.some(l => l.id === logroId)) {
        const config = LOGROS_CONFIG.find(c => c.id === logroId);
        if (config) {
          const unlockedLogro = {
            ...config,
            unlocked_at: new Date().toISOString()
          };
          logros.push(unlockedLogro);
          nuevosLogros.push(unlockedLogro);
        }
      }
    };

    // Evaluar por acción o nivel
    if (accion === 'INSCRIBIRSE_CURSO') unlockLogro('primer_paso');
    if (accion === 'LECCION_COMPLETADA') unlockLogro('explorador');
    if (accion === 'CURSO_COMPLETADO') unlockLogro('graduado');
    if (accion === 'CREAR_DUDA') unlockLogro('curioso');
    if (accion === 'CREAR_POST') unlockLogro('comunicador');
    if (nivelNuevo >= 5) unlockLogro('superestrella');

    // 3. Actualizar BD
    await db.run(`
      UPDATE gamificacion
      SET puntos_total = ?, nivel = ?, logros = ?
      WHERE usuario_id = ?
    `, puntosNuevos, nivelNuevo, JSON.stringify(logros), usuarioId);

    // Crear notificaciones en la plataforma si sube de nivel o desbloquea logro
    if (levelUp) {
      await db.run(`
        INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, enlace)
        VALUES (?, 'info', '¡Subiste de Nivel! 🎉', ?, '/student/gamificacion')
      `, usuarioId, `¡Felicidades! Has alcanzado el Nivel ${nivelNuevo}. ¡Sigue así!`);
    }

    for (const logro of nuevosLogros) {
      await db.run(`
        INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, enlace)
        VALUES (?, 'info', '¡Logro Desbloqueado! 🏆', ?, '/student/gamificacion')
      `, usuarioId, `Desbloqueaste: ${logro.nombre} - ${logro.desc}`);
    }

    return {
      success: true,
      xp_ganado: xpGanado,
      xp_total: puntosNuevos,
      nivel_anterior: nivelAnterior,
      nivel_nuevo: nivelNuevo,
      level_up: levelUp,
      nuevos_logros: nuevosLogros,
    };
  } catch(err) {
    console.error('[GamificationEngine] Error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Obtiene el perfil de gamificación de un usuario
 */
async function obtenerPerfil(usuarioId) {
  await asegurarRegistro(usuarioId);
  return await db.get(`
    SELECT puntos_total, nivel, racha_dias, logros
    FROM gamificacion
    WHERE usuario_id = ?
  `, usuarioId);
}

/**
 * Obtiene la tabla de posiciones general (Top 10) filtrada por academia
 */
async function obtenerLeaderboard(academiaId = 1) {
  return await db.query(`
    SELECT g.puntos_total, g.nivel, u.nombre, u.avatar_color
    FROM gamificacion g
    JOIN usuarios u ON u.id = g.usuario_id
    WHERE u.academia_id = ?
    ORDER BY g.puntos_total DESC
    LIMIT 10
  `, [academiaId]);
}

module.exports = {
  procesarAccion,
  obtenerPerfil,
  obtenerLeaderboard,
  LOGROS_CONFIG,
};
