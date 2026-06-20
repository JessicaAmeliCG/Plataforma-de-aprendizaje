/**
 * AjustesPage.jsx — v2
 * Usa i18n para todas las cadenas + sincroniza notif_email/notif_platform con backend
 */
import { useState, useEffect, useCallback } from 'react';
import {
  User, Palette, Lock, Globe, Bell, LogOut, Check,
  AlertCircle, Loader2, Sun, Moon, Monitor,
  Shield, Trash2, FileText,
} from 'lucide-react';
import { api } from '../services/api';
import useAuthStore from '../stores/authStore';
import { useI18n, useT } from '../contexts/I18nContext';

// ─── Constantes ───────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { value: 'from-violet-500 to-purple-700',  label: 'Violeta'   },
  { value: 'from-blue-500 to-cyan-600',      label: 'Azul'      },
  { value: 'from-emerald-500 to-teal-600',   label: 'Verde'     },
  { value: 'from-rose-500 to-pink-600',      label: 'Rosa'      },
  { value: 'from-amber-500 to-orange-600',   label: 'Naranja'   },
  { value: 'from-red-500 to-rose-700',       label: 'Rojo'      },
  { value: 'from-indigo-500 to-blue-700',    label: 'Índigo'    },
  { value: 'from-teal-500 to-cyan-600',      label: 'Teal'      },
  { value: 'from-fuchsia-500 to-pink-700',   label: 'Fucsia'    },
  { value: 'from-lime-500 to-green-600',     label: 'Lima'      },
  { value: 'from-sky-500 to-blue-600',       label: 'Cielo'     },
  { value: 'from-orange-500 to-red-600',     label: 'Fuego'     },
];

const IDIOMAS = [
  { value: 'es', label: 'Español',   flag: '🇲🇽' },
  { value: 'en', label: 'English',   flag: '🇺🇸' },
  { value: 'pt', label: 'Português', flag: '🇧🇷' },
  { value: 'fr', label: 'Français',  flag: '🇫🇷' },
];

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl font-semibold text-sm animate-fade-in-up ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  );
}

// ─── Sección ──────────────────────────────────────────────────────────────────
function Section({ title, Icon, iconColor, children }) {
  return (
    <section className="glass-card rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
        <div className={`p-2 rounded-xl ${iconColor}`}><Icon size={16} className="text-white" /></div>
        <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {children}
    </div>
  );
}

function Input({ value, onChange, type = 'text', placeholder, maxLength, disabled }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      maxLength={maxLength} disabled={disabled}
      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition disabled:opacity-50 disabled:cursor-not-allowed" />
  );
}

function SaveButton({ loading, disabled, label, onClick }) {
  return (
    <button onClick={onClick} disabled={loading || disabled}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-violet-500/20 transition-all active:scale-95">
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
      {loading ? '...' : label}
    </button>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full relative shrink-0 transition-all duration-300 ${value ? 'bg-violet-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${value ? 'left-6' : 'left-0.5'}`} />
    </button>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function AjustesPage() {
  const t = useT();
  const { lang, changeLang } = useI18n();
  const { user, updateUser, logout } = useAuthStore();
  const [toast, setToast] = useState(null);

  // Perfil
  const [nombre,      setNombre]      = useState(user?.nombre       || '');
  const [bio,         setBio]         = useState(user?.bio          || '');
  const [avatarColor, setAvatarColor] = useState(user?.avatar_color || AVATAR_COLORS[0].value);
  const [savingPerfil, setSavingPerfil] = useState(false);

  // Notificaciones — sincronizadas con el backend
  const [notifEmail,    setNotifEmail]    = useState(user?.notif_email    !== 0);
  const [notifPlatform, setNotifPlatform] = useState(user?.notif_platform !== 0);
  const [savingNotifs,  setSavingNotifs]  = useState(false);

  // Seguridad
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [savingPwd,  setSavingPwd]  = useState(false);

  // Tema oscuro/claro
  const [tema, setTema] = useState(() => localStorage.getItem('yc_tema') || 'system');

  const TEMAS = [
    { value: 'light',  label: t('settings.themeLight'),  Icon: Sun     },
    { value: 'dark',   label: t('settings.themeDark'),   Icon: Moon    },
    { value: 'system', label: t('settings.themeSystem'), Icon: Monitor },
  ];

  // Estilo visual (Profesional vs Vibrante)
  const [estilo, setEstilo] = useState(() => localStorage.getItem('yc_estilo') || 'profesional');
  const ESTILOS = [
    { value: 'profesional', label: 'Profesional (Sobrio)', colorClass: 'bg-slate-500' },
    { value: 'vibrante', label: 'Vibrante (Moderno)', colorClass: 'bg-violet-500' },
  ];

  const showToast = (message, type = 'success') => setToast({ message, type });

  // Sincronizar estado con el usuario del store cuando cambia
  useEffect(() => {
    if (user) {
      setNombre(user.nombre || '');
      setBio(user.bio || '');
      setAvatarColor(user.avatar_color || AVATAR_COLORS[0].value);
      setNotifEmail(user.notif_email !== 0);
      setNotifPlatform(user.notif_platform !== 0);
    }
  }, [user]);

  // Aplicar tema (dark/light)
  useEffect(() => {
    const root = document.documentElement;
    if (tema === 'dark')  root.classList.add('dark');
    else if (tema === 'light') root.classList.remove('dark');
    else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
      else root.classList.remove('dark');
    }
    localStorage.setItem('yc_tema', tema);
  }, [tema]);

  // Aplicar estilo visual
  useEffect(() => {
    const root = document.documentElement;
    if (estilo === 'vibrante') {
      root.classList.add('theme-vibrant');
    } else {
      root.classList.remove('theme-vibrant');
    }
    localStorage.setItem('yc_estilo', estilo);
  }, [estilo]);

  // ── Guardar perfil ────────────────────────────────────────────────────────
  const handleSavePerfil = async () => {
    if (!nombre.trim() || nombre.trim().length < 2) {
      showToast('El nombre debe tener al menos 2 caracteres.', 'error'); return;
    }
    setSavingPerfil(true);
    try {
      const res = await api.patch('/auth/me', { nombre, bio, avatar_color: avatarColor });
      updateUser(res.user);
      showToast(t('settings.save') + ' ✓');
    } catch (err) { showToast(err.message || 'Error.', 'error'); }
    finally { setSavingPerfil(false); }
  };

  // ── Guardar notificaciones → backend ──────────────────────────────────────
  const handleSaveNotifs = async () => {
    setSavingNotifs(true);
    try {
      const res = await api.patch('/auth/me', { notif_email: notifEmail, notif_platform: notifPlatform });
      updateUser(res.user);
      showToast(t('settings.savePrefs') + ' ✓');
    } catch (err) { showToast(err.message || 'Error.', 'error'); }
    finally { setSavingNotifs(false); }
  };

  // ── Cambiar contraseña ────────────────────────────────────────────────────
  const handleSavePwd = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) { showToast('Completa todos los campos.', 'error'); return; }
    if (newPwd.length < 8) { showToast('Mínimo 8 caracteres.', 'error'); return; }
    if (newPwd !== confirmPwd) { showToast('Las contraseñas no coinciden.', 'error'); return; }
    setSavingPwd(true);
    try {
      await api.patch('/auth/password', { currentPassword: currentPwd, newPassword: newPwd });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      showToast(t('settings.changePwd') + ' ✓');
    } catch (err) { showToast(err.message || 'Error.', 'error'); }
    finally { setSavingPwd(false); }
  };

  const handleLogout = () => {
    if (!confirm('¿Cerrar sesión?')) return;
    logout(); window.location.href = '/login';
  };

  // Indicador de fuerza de contraseña
  const pwdStrength = () => {
    if (!newPwd) return null;
    if (newPwd.length < 8) return { label: t('settings.pwdShort'),  color: 'bg-red-500',    w: 'w-1/4' };
    if (newPwd.length < 12 || !/[A-Z]/.test(newPwd) || !/[0-9]/.test(newPwd))
      return { label: t('settings.pwdMedium'), color: 'bg-amber-400',  w: 'w-2/4' };
    if (/[^a-zA-Z0-9]/.test(newPwd))
      return { label: t('settings.pwdStrong'), color: 'bg-emerald-500',w: 'w-full' };
    return { label: t('settings.pwdGood'),   color: 'bg-blue-500',    w: 'w-3/4' };
  };
  const strength = pwdStrength();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* ── PERFIL ───────────────────────────────────────────────────────────── */}
      <Section title={t('settings.profile')} Icon={User} iconColor="bg-violet-600">
        <div className="space-y-6">
          {/* Avatar + selector de color */}
          <div className="flex items-start gap-6">
            <div className="shrink-0">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-black text-2xl shadow-lg`}>
                {getInitials(nombre || user?.nombre || '?')}
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">{t('settings.preview')}</p>
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">{t('settings.avatarColor')}</p>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map(c => (
                  <button key={c.value} onClick={() => setAvatarColor(c.value)} title={c.label}
                    className={`w-8 h-8 rounded-xl bg-gradient-to-br ${c.value} transition-all hover:scale-110 ${avatarColor === c.value ? 'ring-2 ring-offset-2 ring-violet-500 dark:ring-offset-gray-900 scale-110' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('settings.fullName')}>
              <Input value={nombre} onChange={setNombre} placeholder="Tu nombre" maxLength={60} />
            </Field>
            <Field label={t('settings.email')} hint={t('settings.emailHint')}>
              <Input value={user?.email || ''} onChange={() => {}} disabled />
            </Field>
          </div>

          <Field label={t('settings.bio')} hint={t('settings.bioHint')}>
            <textarea value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Cuéntanos sobre ti..." rows={3} maxLength={200}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition resize-none" />
            <div className="flex justify-end"><span className="text-[11px] text-gray-400">{bio.length}/200</span></div>
          </Field>
          <div className="flex justify-end">
            <SaveButton loading={savingPerfil} onClick={handleSavePerfil} label={t('settings.save')} />
          </div>
        </div>
      </Section>

      {/* ── APARIENCIA ────────────────────────────────────────────────────────── */}
      <Section title={t('settings.appearance')} Icon={Palette} iconColor="bg-indigo-600">
        <div className="space-y-6">
          <Field label={t('settings.theme')}>
            <div className="grid grid-cols-3 gap-3 mt-1">
              {TEMAS.map(({ value, label, Icon }) => (
                <button key={value} onClick={() => setTema(value)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all hover:-translate-y-1 ${tema === value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-md' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                  <Icon size={22} />
                  <span className="text-xs font-semibold">{label}</span>
                  {tema === value && <span className="w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center"><Check size={10} className="text-white" /></span>}
                </button>
              ))}
            </div>
          </Field>
          
          <Field label="Estilo Visual">
            <div className="grid grid-cols-2 gap-3 mt-1">
              {ESTILOS.map(({ value, label, colorClass }) => (
                <button key={value} onClick={() => setEstilo(value)}
                  className={`flex items-center justify-between px-4 py-4 rounded-2xl border-2 transition-all hover:-translate-y-1 ${estilo === value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-4 h-4 rounded-full ${colorClass}`} />
                    <span className={`text-sm font-semibold ${estilo === value ? 'text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`}>{label}</span>
                  </div>
                  {estilo === value && <Check size={16} className="text-primary-500" />}
                </button>
              ))}
            </div>
          </Field>
          <p className="text-xs text-gray-400">El tema y estilo se aplican inmediatamente y se guardan de forma automática.</p>
        </div>
      </Section>

      {/* ── IDIOMA ───────────────────────────────────────────────────────────── */}
      <Section title={t('settings.language')} Icon={Globe} iconColor="bg-sky-600">
        <div className="space-y-4">
          <Field label={t('settings.langPlatform')}>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {IDIOMAS.map(({ value, label, flag }) => (
                <button key={value} onClick={() => changeLang(value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${lang === value ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                  <span className="text-2xl">{flag}</span>
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    {lang === value && <p className="text-[10px] text-sky-500 font-bold">✓ Activo</p>}
                  </div>
                </button>
              ))}
            </div>
          </Field>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-900/30">
            <AlertCircle size={14} className="text-sky-500 shrink-0" />
            <p className="text-xs text-sky-600 dark:text-sky-400">{t('settings.langNote')}</p>
          </div>
        </div>
      </Section>

      {/* ── NOTIFICACIONES ───────────────────────────────────────────────────── */}
      <Section title={t('settings.notifications')} Icon={Bell} iconColor="bg-amber-500">
        <div className="space-y-4">
          {[
            { key: 'email', label: t('settings.notifEmail'), desc: t('settings.notifEmailDesc'), value: notifEmail, set: setNotifEmail },
            { key: 'platform', label: t('settings.notifPlatform'), desc: t('settings.notifPlatformDesc'), value: notifPlatform, set: setNotifPlatform },
          ].map(({ key, label, desc, value, set }) => (
            <div key={key} className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <Toggle value={value} onChange={set} />
            </div>
          ))}

          {/* Info email */}
          {notifEmail && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Los emails se enviarán a <strong>{user?.email}</strong>. Para que funcionen los correos, configura las credenciales MAIL_USER y MAIL_PASS en el archivo <code>.env</code> del backend.
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <SaveButton loading={savingNotifs} onClick={handleSaveNotifs} label={t('settings.savePrefs')} />
          </div>
        </div>
      </Section>

      {/* ── SEGURIDAD ────────────────────────────────────────────────────────── */}
      <Section title={t('settings.security')} Icon={Shield} iconColor="bg-emerald-600">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label={t('settings.currentPwd')}><Input type="password" value={currentPwd} onChange={setCurrentPwd} placeholder="••••••••" /></Field>
            <Field label={t('settings.newPwd')}><Input type="password" value={newPwd} onChange={setNewPwd} placeholder="••••••••" /></Field>
            <Field label={t('settings.confirmPwd')}><Input type="password" value={confirmPwd} onChange={setConfirmPwd} placeholder="••••••••" /></Field>
          </div>
          {strength && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">{t('settings.pwdStrength')}</span>
                <span className={`font-semibold ${strength.color === 'bg-red-500' ? 'text-red-500' : strength.color === 'bg-amber-400' ? 'text-amber-500' : strength.color === 'bg-blue-500' ? 'text-blue-500' : 'text-emerald-500'}`}>{strength.label}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-1.5 ${strength.color} ${strength.w} rounded-full transition-all duration-500`} />
              </div>
            </div>
          )}
          <ul className="text-xs text-gray-400 space-y-1">
            {[
              { text: t('settings.pwdReq1'), check: newPwd.length >= 8 },
              { text: t('settings.pwdReq2'), check: /[A-Z]/.test(newPwd) },
              { text: t('settings.pwdReq3'), check: /[^a-zA-Z]/.test(newPwd) },
            ].map((r, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${r.check ? 'bg-emerald-400' : 'bg-gray-300 dark:bg-gray-700'}`} />
                {r.text}
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <SaveButton loading={savingPwd} onClick={handleSavePwd} label={t('settings.changePwd')} />
          </div>
        </div>
      </Section>

      {/* ── CUENTA ───────────────────────────────────────────────────────────── */}
      <Section title={t('settings.account')} Icon={User} iconColor="bg-gray-500">
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${user?.avatar_color || avatarColor} flex items-center justify-center text-white font-bold text-lg`}>
              {getInitials(user?.nombre || '?')}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{user?.nombre}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
              <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${user?.rol === 'creador' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                {user?.rol === 'creador' ? '🎓 Creador' : '👨‍🎓 Estudiante'}
              </span>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[11px] text-gray-400">{t('settings.memberSince')}</p>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'pt' ? 'pt-BR' : lang === 'fr' ? 'fr-FR' : 'es-MX', { year: 'numeric', month: 'long' }) : '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('settings.logout')}</p>
              <p className="text-xs text-gray-400">{t('settings.logoutDesc')}</p>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-semibold transition-all">
              <LogOut size={15} /> {t('settings.logout')}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-700 dark:text-red-400">{t('settings.dangerZone')}</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{t('settings.dangerDesc')}</p>
              </div>
              <button onClick={() => alert('Para eliminar tu cuenta contacta a soporte@yourcourse.mx')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all shrink-0">
                <Trash2 size={12} /> {t('settings.deleteAccount')}
              </button>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
