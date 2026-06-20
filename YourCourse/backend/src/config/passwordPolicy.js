/**
 * passwordPolicy.js
 * YourCourse — Política centralizada de contraseñas
 *
 * Define las reglas de complejidad que debe cumplir toda contraseña
 * en la plataforma. Se aplica en registro y en cambio de contraseña.
 *
 * Uso:
 *   const { validatePassword } = require('../config/passwordPolicy');
 *   const result = validatePassword(password);
 *   if (!result.valid) return res.status(400).json({ error: { message: result.message } });
 */

// ─── Definición de reglas ─────────────────────────────────────────────────────

/**
 * Lista de reglas que debe cumplir la contraseña.
 * Cada regla tiene:
 *  - id:      identificador único (para el frontend)
 *  - label:   descripción legible para el usuario
 *  - test:    función que retorna true si la regla se cumple
 */
const REGLAS = [
  {
    id:    'longitud',
    label: 'Mínimo 10 caracteres',
    test:  (pwd) => pwd.length >= 10,
  },
  {
    id:    'mayuscula',
    label: 'Al menos una letra mayúscula (A-Z)',
    test:  (pwd) => /[A-Z]/.test(pwd),
  },
  {
    id:    'minuscula',
    label: 'Al menos una letra minúscula (a-z)',
    test:  (pwd) => /[a-z]/.test(pwd),
  },
  {
    id:    'numero',
    label: 'Al menos un número (0-9)',
    test:  (pwd) => /[0-9]/.test(pwd),
  },
  {
    id:    'especial',
    label: 'Al menos un carácter especial (!@#$%^&*)',
    test:  (pwd) => /[^a-zA-Z0-9]/.test(pwd),
  },
];

const MAX_LENGTH = 128;

// ─── Función principal de validación ─────────────────────────────────────────

/**
 * Valida una contraseña contra la política de la plataforma.
 *
 * @param {string} password — La contraseña a validar
 * @returns {{
 *   valid:   boolean,
 *   message: string|null,        // Primer error encontrado (para respuesta API)
 *   errores: string[],           // Lista de todos los errores
 *   reglas:  Array<{id, label, cumplida: boolean}> // Estado de cada regla (para UI)
 * }}
 */
function validatePassword(password) {
  // Validaciones previas básicas
  if (typeof password !== 'string' || password.length === 0) {
    return {
      valid:   false,
      message: 'La contraseña es requerida.',
      errores: ['La contraseña es requerida.'],
      reglas:  REGLAS.map(r => ({ ...r, cumplida: false })),
    };
  }

  if (password.length > MAX_LENGTH) {
    return {
      valid:   false,
      message: `La contraseña no puede superar ${MAX_LENGTH} caracteres.`,
      errores: [`La contraseña no puede superar ${MAX_LENGTH} caracteres.`],
      reglas:  REGLAS.map(r => ({ ...r, cumplida: false })),
    };
  }

  if (password !== password.trim()) {
    return {
      valid:   false,
      message: 'La contraseña no puede comenzar ni terminar con espacios.',
      errores: ['La contraseña no puede comenzar ni terminar con espacios.'],
      reglas:  REGLAS.map(r => ({ ...r, cumplida: false })),
    };
  }

  // Evaluar cada regla
  const reglasEvaluadas = REGLAS.map(regla => ({
    id:       regla.id,
    label:    regla.label,
    cumplida: regla.test(password),
  }));

  const errores = reglasEvaluadas
    .filter(r => !r.cumplida)
    .map(r => r.label);

  return {
    valid:   errores.length === 0,
    message: errores.length > 0 ? `La contraseña no cumple: ${errores[0]}` : null,
    errores,
    reglas:  reglasEvaluadas,
  };
}

/**
 * Calcula el nivel de fortaleza de la contraseña (0-4).
 * Útil para la barra de progreso del frontend.
 *
 * @param {string} password
 * @returns {{ nivel: 0|1|2|3|4, label: string, color: string }}
 */
function passwordStrength(password) {
  if (!password) return { nivel: 0, label: '', color: '' };

  const reglasCumplidas = REGLAS.filter(r => r.test(password)).length;

  if (password.length < 6)           return { nivel: 0, label: 'Muy débil',  color: 'bg-red-500' };
  if (reglasCumplidas <= 1)          return { nivel: 1, label: 'Débil',      color: 'bg-red-400' };
  if (reglasCumplidas === 2)         return { nivel: 2, label: 'Regular',    color: 'bg-amber-400' };
  if (reglasCumplidas === 3)         return { nivel: 3, label: 'Buena',      color: 'bg-blue-500' };
  if (reglasCumplidas === 4)         return { nivel: 4, label: 'Fuerte',     color: 'bg-emerald-400' };
  /* reglasCumplidas === 5 */        return { nivel: 4, label: 'Muy fuerte', color: 'bg-emerald-500' };
}

module.exports = {
  validatePassword,
  passwordStrength,
  REGLAS,
  MAX_LENGTH,
};
