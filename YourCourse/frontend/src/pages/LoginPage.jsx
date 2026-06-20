/**
 * LoginPage.jsx — v2 con autenticación real
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Moon, Sun, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import useAuthStore from '../stores/authStore';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Completa todos los campos.'); return; }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.user, res.token);

      // Redirigir según rol
      if (res.user.rol === 'estudiante') {
        navigate('/student/dashboard');
      } else {
        navigate('/creator/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 transition-colors duration-300">

      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <GraduationCap className="text-white" size={32} />
            <span className="text-white font-bold text-2xl">YourCourse</span>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white leading-tight mb-4">Crea, enseña<br/>y crece.</h2>
          <p className="text-violet-200 text-base leading-relaxed">
            La plataforma e-learning multi-tenant diseñada para creadores que quieren monetizar su conocimiento.
          </p>
          <div className="mt-8 flex gap-4">
            {['1,240+\nEstudiantes', '8\nCursos', '4.8★\nCalificación'].map(item => {
              const [val, lab] = item.split('\n');
              return (
                <div key={lab} className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 text-center">
                  <p className="text-white font-black text-xl">{val}</p>
                  <p className="text-violet-200 text-xs">{lab}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-20">
        <div className="absolute top-5 right-5">
          <button onClick={() => setDarkMode(p => !p)}
            className="p-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="max-w-sm w-full mx-auto space-y-8 animate-fade-in-up">
          <div className="lg:hidden flex items-center gap-2">
            <GraduationCap className="text-violet-600" size={28} />
            <span className="font-bold text-gray-900 dark:text-white text-xl">YourCourse</span>
          </div>

          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Iniciar sesión</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
                Regístrate gratis
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Correo electrónico</label>
              <input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contraseña</label>
              <div className="relative">
                <input id="password" type={showPass ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button id="btn-login" type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-violet-500/30 transition-all active:scale-95"
            >
              {loading
                ? <><Loader2 size={17} className="animate-spin" /> Entrando...</>
                : <>Entrar <ArrowRight size={17} /></>
              }
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 dark:text-gray-600">© 2025 YourCourse · Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
}
