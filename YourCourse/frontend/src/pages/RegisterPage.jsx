/**
 * RegisterPage.jsx — Registro de nuevos estudiantes
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Moon, Sun, UserPlus, Loader2, Check, X } from 'lucide-react';
import { api } from '../services/api';
import useAuthStore from '../stores/authStore';

// ── Reglas de política de contraseñas (sincronizadas con el backend) ────────────
const REGLAS_PWD = [
  { id: 'longitud', label: 'Mínimo 10 caracteres', test: (p) => p.length >= 10 },
  { id: 'mayuscula', label: 'Al menos una mayúscula (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { id: 'minuscula', label: 'Al menos una minúscula (a-z)', test: (p) => /[a-z]/.test(p) },
  { id: 'numero', label: 'Al menos un número (0-9)', test: (p) => /[0-9]/.test(p) },
  { id: 'especial', label: 'Al menos un símbolo (!@#$%^&*...)', test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

export default function RegisterPage() {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('yc_dark_mode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  const setAuth = useAuthStore(s => s.setAuth);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('yc_dark_mode', String(darkMode));
  }, [darkMode]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.nombre || !form.email || !form.password) { setError('Todos los campos son obligatorios.'); return; }
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden.'); return; }

    // Validar todas las reglas de la política
    const reglasFallidas = REGLAS_PWD.filter(r => !r.test(form.password));
    if (reglasFallidas.length > 0) {
      setError(`La contraseña no cumple: ${reglasFallidas[0].label}`);
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/register', {
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setAuth(res.user, res.token);
      // Por defecto el registro es de estudiantes
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const INPUT = "w-full px-4 py-3 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 transition-colors duration-300">
      <div className="absolute top-5 right-5">
        <button onClick={() => setDarkMode(p => !p)}
          className="p-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="w-full max-w-md space-y-8 animate-fade-in-up">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="text-primary-600" size={32} />
            <span className="font-bold text-gray-900 dark:text-white text-2xl">YourCourse</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Crear cuenta</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nombre completo</label>
              <input type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)}
                placeholder="Tu nombre" className={INPUT} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Correo electrónico</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="tu@email.com" className={INPUT} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contraseña</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                  placeholder="Mínimo 10 caracteres" className={`${INPUT} pr-11`} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {/* Checklist de política en tiempo real */}
              {form.password.length > 0 && (
                <ul className="mt-2 space-y-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                  {REGLAS_PWD.map(regla => {
                    const cumplida = regla.test(form.password);
                    return (
                      <li key={regla.id} className="flex items-center gap-2 text-xs">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${cumplida ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                          }`}>
                          {cumplida
                            ? <Check size={9} className="text-white" />
                            : <X size={9} className="text-gray-400" />
                          }
                        </span>
                        <span className={cumplida ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}>
                          {regla.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Confirmar contraseña</label>
              <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)}
                placeholder="Repite tu contraseña" className={INPUT} />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button id="btn-register" type="submit"
              disabled={loading || REGLAS_PWD.some(r => !r.test(form.password)) || !form.password}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-violet-500/30 transition-all active:scale-95 mt-2"
            >
              {loading
                ? <><Loader2 size={17} className="animate-spin" /> Creando cuenta...</>
                : <><UserPlus size={17} /> Crear cuenta gratis</>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600">© 2025 YourCourse · Todos los derechos reservados</p>
      </div>
    </div>
  );
}
