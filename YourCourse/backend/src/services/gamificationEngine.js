/**
 * gamificationEngine.js
 * YourCourse — Motor de Experiencia (XP) y Niveles
 *
 * Procesa el progreso del usuario, calcula el XP otorgado por cada acción
 * y determina si el usuario ha subido de nivel usando una fórmula exponencial.
 *
 * Uso:
 *   const engine = new GamificationEngine(dbPool);
 *   const result = await engine.procesarAccion({
 *     usuario_id: 'uuid',
 *     academia_id: 'uuid',
 *     accion: 'LECCION_COMPLETADA',
 *     referencia_id: 'uuid-leccion',
 *   });
 */

const { Pool } = require('pg');

// ─── Configuración del sistema de XP ──────────────────────────────────────────

/**
 * Mapa de XP base por tipo de acción.
 * Estos valores se pueden mover a la base de datos para hacerlos configurables.
 */
const XP_POR_ACCION = {
  LOGIN_DIARIO:        25,
  LECCION_COMPLETADA:  10,
  MODULO_COMPLETADO:   50,
  CURSO_COMPLETADO:   200,
  PARTICIPACION_FORO:  15,
  RESPUESTA_UTIL:      30,
  BONUS_ADMIN:          0, // El monto lo determina el admin en metadatos
};

/**
 * Fórmula de XP requerido para alcanzar un nivel:
 *   xp_requerido(n) = XP_BASE * MULTIPLICADOR^(n - 1)
 *
 * Donde n es el orden del nivel (1=Caminante, 2=Explorador, etc.).
 *
 * Ejemplos:
 *   Nivel 1 (Caminante):  0     (nivel inicial, sin requisito)
 *   Nivel 2 (Explorador): 500
 *   Nivel 3 (Aprendiz):   1500  (no sigue la fórmula exacta — ver init.sql)
 */
const XP_BASE         = 500;
const MULTIPLICADOR   = 2.5;

// ─── Motor de Gamificación ─────────────────────────────────────────────────────

class GamificationEngine {
  /**
   * @param {Pool} pool — Instancia de pg.Pool configurada con la conexión a PostgreSQL
   */
  constructor(pool) {
    if (!pool) {
      throw new Error('[GamificationEngine] Se requiere una instancia de pg.Pool.');
    }
    this._pool = pool;
  }

  // ── Métodos privados ────────────────────────────────────────────────────────

  /**
   * Calcula el XP que otorga una acción.
   * Para BONUS_ADMIN, el valor viene en los metadatos.
   *
   * @param {string} accion
   * @param {object} [metadatos]
   * @returns {number}
   */
  _calcularXP(accion, metadatos = {}) {
    if (accion === 'BONUS_ADMIN') {
      const xp = parseInt(metadatos?.xp_bonus, 10);
      if (!xp || xp <= 0) {
        throw new Error('[GamificationEngine] BONUS_ADMIN requiere metadatos.xp_bonus > 0.');
      }
      return xp;
    }

    const xp = XP_POR_ACCION[accion];
    if (xp === undefined) {
      throw new Error(`[GamificationEngine] Acción desconocida: "${accion}".`);
    }
    return xp;
  }

  /**
   * Evalúa si el nuevo XP total supera el umbral del siguiente nivel.
   * Compara contra los niveles almacenados en la base de datos (tabla niveles_globales).
   *
   * @param {object} client — Cliente de transacción de pg
   * @param {number} xpTotalNuevo — XP total del usuario después de sumar el nuevo XP
   * @param {string|null} nivelActualId — UUID del nivel actual del usuario
   * @returns {{ levelUp: boolean, nuevoNivelId: string|null, nuevoNivelNombre: string|null }}
   */
  async _evaluarNivel(client, xpTotalNuevo, nivelActualId) {
    // Obtener todos los niveles ordenados ascendentemente
    const { rows: niveles } = await client.query(
      `SELECT id, nombre, xp_requerido, nivel_orden
       FROM niveles_globales
       ORDER BY nivel_orden ASC`
    );

    if (!niveles.length) {
      return { levelUp: false, nuevoNivelId: nivelActualId, nuevoNivelNombre: null };
    }

    // Encontrar el nivel más alto que el usuario puede alcanzar con su XP actual
    let nivelAlcanzado = niveles[0]; // Mínimo: el primer nivel
    for (const nivel of niveles) {
      if (xpTotalNuevo >= nivel.xp_requerido) {
        nivelAlcanzado = nivel;
      } else {
        break; // Los niveles están ordenados, si no alcanza este, tampoco los siguientes
      }
    }

    const levelUp = nivelActualId !== nivelAlcanzado.id;

    return {
      levelUp,
      nuevoNivelId:     nivelAlcanzado.id,
      nuevoNivelNombre: nivelAlcanzado.nombre,
      nivelOrden:       nivelAlcanzado.nivel_orden,
    };
  }

  // ── API Pública ─────────────────────────────────────────────────────────────

  /**
   * Procesa una acción del usuario, actualiza su XP en la BD y determina
   * si subió de nivel. Todo en una transacción atómica.
   *
   * @param {object} params
   * @param {string} params.usuario_id   — UUID del usuario
   * @param {string} params.academia_id  — UUID de la academia donde ocurrió la acción
   * @param {string} params.accion       — Tipo de acción (ver XP_POR_ACCION)
   * @param {string} [params.referencia_id]  — UUID del recurso relacionado (lección, módulo, etc.)
   * @param {string} [params.referencia_tipo] — Tipo del recurso ('leccion', 'modulo', 'curso', 'foro')
   * @param {object} [params.metadatos]  — Datos adicionales del evento
   *
   * @returns {Promise<{
   *   xp_ganado: number,
   *   xp_total:  number,
   *   levelUp:   boolean,
   *   nivel_nombre: string|null,
   *   nivel_orden:  number|null,
   * }>}
   */
  async procesarAccion({
    usuario_id,
    academia_id,
    accion,
    referencia_id  = null,
    referencia_tipo = null,
    metadatos      = {},
  }) {
    // ── Validaciones de entrada ──────────────────────────────────────────────
    if (!usuario_id)  throw new Error('[GamificationEngine] usuario_id es requerido.');
    if (!academia_id) throw new Error('[GamificationEngine] academia_id es requerido.');
    if (!accion)      throw new Error('[GamificationEngine] accion es requerida.');

    const xpGanado = this._calcularXP(accion, metadatos);

    // ── Transacción atómica ──────────────────────────────────────────────────
    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Obtener el estado actual del usuario (con bloqueo para evitar race conditions)
      const { rows } = await client.query(
        `SELECT xp_total, nivel_id
         FROM usuarios
         WHERE id = $1
         FOR UPDATE`,
        [usuario_id]
      );

      if (!rows.length) {
        throw new Error(`[GamificationEngine] Usuario no encontrado: ${usuario_id}`);
      }

      const { xp_total: xpActual, nivel_id: nivelActualId } = rows[0];
      const xpTotalNuevo = xpActual + xpGanado;

      // 2. Evaluar si el usuario sube de nivel
      const { levelUp, nuevoNivelId, nuevoNivelNombre, nivelOrden } =
        await this._evaluarNivel(client, xpTotalNuevo, nivelActualId);

      // 3. Actualizar el XP total (y el nivel si aplica) del usuario
      await client.query(
        `UPDATE usuarios
         SET xp_total  = $1,
             nivel_id  = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [xpTotalNuevo, nuevoNivelId, usuario_id]
      );

      // 4. Registrar el evento en el log de XP (registro_xp es inmutable)
      await client.query(
        `INSERT INTO registro_xp
           (usuario_id, academia_id, accion, xp_otorgado, referencia_id, referencia_tipo, metadatos)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          usuario_id,
          academia_id,
          accion,
          xpGanado,
          referencia_id,
          referencia_tipo,
          JSON.stringify({
            ...metadatos,
            xp_previo:    xpActual,
            xp_nuevo:     xpTotalNuevo,
            level_up:     levelUp,
            nivel_nombre: nuevoNivelNombre,
          }),
        ]
      );

      await client.query('COMMIT');

      // 5. Retornar el resultado estructurado
      return {
        xp_ganado:   xpGanado,
        xp_total:    xpTotalNuevo,
        levelUp,
        nivel_nombre: nuevoNivelNombre,
        nivel_orden:  nivelOrden ?? null,
      };

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Consulta el historial de XP de un usuario (últimos N registros).
   *
   * @param {string} usuario_id
   * @param {number} [limite=20]
   * @returns {Promise<object[]>}
   */
  async obtenerHistorial(usuario_id, limite = 20) {
    const { rows } = await this._pool.query(
      `SELECT
         r.id,
         r.accion,
         r.xp_otorgado,
         r.referencia_tipo,
         r.created_at,
         a.nombre AS academia_nombre
       FROM registro_xp r
       LEFT JOIN academias a ON a.id = r.academia_id
       WHERE r.usuario_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2`,
      [usuario_id, limite]
    );
    return rows;
  }

  /**
   * Calcula el XP necesario para el siguiente nivel usando la fórmula exponencial.
   * Útil para barras de progreso en el frontend.
   *
   * @param {number} nivelOrden — Nivel actual (1-indexed)
   * @returns {{ xp_nivel_actual: number, xp_nivel_siguiente: number, formula: string }}
   */
  static calcularUmbralNivel(nivelOrden) {
    const xpActual   = nivelOrden <= 1 ? 0 : Math.round(XP_BASE * Math.pow(MULTIPLICADOR, nivelOrden - 2));
    const xpSiguiente = Math.round(XP_BASE * Math.pow(MULTIPLICADOR, nivelOrden - 1));
    return {
      xp_nivel_actual:    xpActual,
      xp_nivel_siguiente: xpSiguiente,
      formula: `${XP_BASE} × ${MULTIPLICADOR}^(n-1)`,
    };
  }
}

module.exports = {
  GamificationEngine,
  XP_POR_ACCION,
};
