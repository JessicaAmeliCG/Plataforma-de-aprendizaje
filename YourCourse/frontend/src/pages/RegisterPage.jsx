/**
 * RegisterPage.jsx — Registro de nuevos estudiantes
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Moon, Sun, UserPlus, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import useAuthStore from '../stores/authStore';

export default function RegisterPage() {
  const [form,    setForm]    = useState({ nombre: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('yc_dark_mode') === 'true' ||
          window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  const setAuth  = useAuthStore(s => s.setAuth);
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
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }

    try {
      setLoading(true);
      const res = await api.post('/auth/register', {
        nombre:   form.nombre.trim(),
        email:    form.email.trim(),
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

  const INPUT = "w-full px-4 py-3 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all";

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
            <GraduationCap className="text-violet-600" size={32} />
            <span className="font-bold text-gray-900 dark:text-white text-2xl">YourCourse</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Crear cuenta</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
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
                  placeholder="Mínimo 8 caracteres" className={`${INPUT} pr-11`} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Confirmar contraseña</label>
              <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)}
                placeholder="Repite tu contraseña" className={INPUT} />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button id="btn-register" type="submit" disabled={loading}
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
