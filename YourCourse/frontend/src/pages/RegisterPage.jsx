/**
 * RegisterPage.jsx — v3
 * - Merge conflict resuelto: lógica de disabled mejorada + colores de tema correctos
 * - i18n completo con useT()
 * - REGLAS_PWD usa labelKey para internacionalización
 * - localStorage unificado: yc_tema (mismo que App.jsx / AjustesPage)
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Moon, Sun, UserPlus, Loader2, Check, X } from 'lucide-react';
import { api } from '../services/api';
import useAuthStore from '../stores/authStore';
import { useT } from '../contexts/I18nContext';

// ── Reglas de política de contraseñas (sincronizadas con el backend) ──────────
const REGLAS_PWD = [
  { id: 'longitud',  labelKey: 'pwd.rule.longitud',  test: (p) => p.length >= 10 },
  { id: 'mayuscula', labelKey: 'pwd.rule.mayuscula',  test: (p) => /[A-Z]/.test(p) },
  { id: 'minuscula', labelKey: 'pwd.rule.minuscula',  test: (p) => /[a-z]/.test(p) },
  { id: 'numero',    labelKey: 'pwd.rule.numero',     test: (p) => /[0-9]/.test(p) },
  { id: 'especial',  labelKey: 'pwd.rule.especial',   test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

export default function RegisterPage() {
  const t = useT();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [searchParams] = useSearchParams();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const invitationToken = searchParams.get('token');
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('yc_tema') === 'dark' ||
          (!localStorage.getItem('yc_tema') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  const setAuth  = useAuthStore(s => s.setAuth);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('yc_tema', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nombre || !email || !password) {
      setError(t('register.errorRequired'));
      return;
    }
    if (password !== confirm) {
      setError(t('register.errorMismatch'));
      return;
    }

    // Validar todas las reglas de la política
    const reglasFallidas = REGLAS_PWD.filter(r => !r.test(password));
    if (reglasFallidas.length > 0) {
      setError(t('register.errorPolicy', { rule: t(reglasFallidas[0].labelKey) }));
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/register', { 
        nombre: nombre.trim(), 
        email: email.trim(), 
        password,
        invitationToken: invitationToken || undefined
      });
      login(res.user, res.token);
      if (invitationToken) {
        navigate('/student/dashboard');
      } else {
        navigate('/verify-email?token=' + (res.user.verification_token || ''));
      }
    } catch (err) {
      setError(err.message || 'Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  const pwdValida = password.length > 0 && REGLAS_PWD.every(r => r.test(password));

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
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">{t('register.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            {t('register.hasAccount')}{' '}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              {t('register.loginLink')}
            </Link>
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('register.fullName')}</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder={t('settings.fullName')} className={INPUT} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('register.email')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" className={INPUT} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('register.password')}</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('register.minChars')} className={`${INPUT} pr-11`} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {/* Checklist de política en tiempo real */}
              {password.length > 0 && (
                <ul className="mt-2 space-y-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                  {REGLAS_PWD.map(regla => {
                    const cumplida = regla.test(password);
                    return (
                      <li key={regla.id} className="flex items-center gap-2 text-xs">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          cumplida ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`}>
                          {cumplida
                            ? <Check size={9} className="text-white" />
                            : <X size={9} className="text-gray-400" />
                          }
                        </span>
                        <span className={cumplida ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}>
                          {t(regla.labelKey)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('register.confirmPwd')}</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder={t('register.repeatPwd')} className={INPUT} />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button id="btn-register" type="submit"
              disabled={loading || !pwdValida || !password}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-500 hover:to-primary-500 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-primary-500/30 transition-all active:scale-95 mt-2"
            >
              {loading
                ? <><Loader2 size={17} className="animate-spin" /> {t('register.creating')}</>
                : <><UserPlus size={17} /> {t('register.createFree')}</>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600">{t('login.copyright')}</p>
      </div>
    </div>
  );
}
