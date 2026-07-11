/**
 * LoginPage.jsx — v3
 * - i18n completo con useT()
 * - Fix localStorage: yc_dark_mode → yc_tema (unificado con app)
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Moon, Sun, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import useAuthStore from '../stores/authStore';
import { useT } from '../contexts/I18nContext';

export default function LoginPage() {
  const t = useT();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('yc_tema') === 'dark' ||
          (!localStorage.getItem('yc_tema') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  const setAuth  = useAuthStore(s => s.setAuth);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('yc_tema', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError(t('login.errorFields')); return; }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.user, res.token);

      // Redirigir según rol
      if (res.user.rol === 'estudiante') {
        navigate('/student/dashboard');
      } else if (res.user.rol === 'superadmin') {
        navigate('/admin/dashboard');
      } else if (res.user.rol === 'moderador') {
        navigate('/moderador/dashboard');
      } else {
        navigate('/creator/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const INPUT = "w-full px-4 py-3 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all";

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 transition-colors duration-300">

      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-700 via-primary-700 to-indigo-800 flex-col justify-between p-12 overflow-hidden">
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
          <h2 className="text-4xl font-black text-white leading-tight mb-4" style={{ whiteSpace: 'pre-line' }}>
            {t('login.slogan')}
          </h2>
          <p className="text-primary-200 text-base leading-relaxed">
            {t('login.platformDesc')}
          </p>
          <div className="mt-8 flex gap-4">
            {[
              ['1,240+', t('login.stat1')],
              ['8',      t('login.stat2')],
              ['4.8★',   t('login.stat3')],
            ].map(([val, lab]) => (
              <div key={lab} className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 text-center">
                <p className="text-white font-black text-xl">{val}</p>
                <p className="text-primary-200 text-xs">{lab}</p>
              </div>
            ))}
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
            <GraduationCap className="text-primary-600" size={28} />
            <span className="font-bold text-gray-900 dark:text-white text-xl">YourCourse</span>
          </div>

          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">{t('login.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              {t('login.noAccount')}{' '}
              <Link to="/register" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                {t('login.register')}
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('login.email')}
              </label>
              <input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" className={INPUT}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('login.password')}
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input id="password" type={showPass ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className={`${INPUT} pr-11`}
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
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-500 hover:to-primary-500 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-primary-500/30 transition-all active:scale-95"
            >
              {loading
                ? <><Loader2 size={17} className="animate-spin" /> {t('login.entering')}</>
                : <>{t('login.enter')} <ArrowRight size={17} /></>
              }
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 dark:text-gray-600">{t('login.copyright')}</p>
        </div>
      </div>
    </div>
  );
}
