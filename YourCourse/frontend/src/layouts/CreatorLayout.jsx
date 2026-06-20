/**
 * CreatorLayout.jsx — v3
 * Integra: i18n (useT), campana real (NotificationBell), tema
 */
import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Users, MessageSquare,
  BarChart2, Settings, LogOut, ChevronLeft, ChevronRight,
  Moon, Sun, GraduationCap, Menu, X,
} from 'lucide-react';
import useAuthStore     from '../stores/authStore';
import NotificationBell from '../components/NotificationBell';
import { useT, useI18n } from '../contexts/I18nContext';

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function CreatorLayout() {
  const t     = useT();
  const { lang } = useI18n();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode,  setDarkMode]  = useState(() => {
    const saved = localStorage.getItem('yc_tema');
    if (saved === 'dark')  return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = useAuthStore(s => s.user);
  const logout    = useAuthStore(s => s.logout);
  const displayUser = user || { nombre: 'Creador', email: '', avatar_color: 'from-primary-500 to-primary-700' };

  // Nav items con traducción reactiva al idioma
  const NAV_ITEMS = [
    { to: '/creator/dashboard',   label: t('nav.dashboard'),  Icon: LayoutDashboard },
    { to: '/creator/cursos',      label: t('nav.courses'),    Icon: BookOpen },
    { to: '/creator/estudiantes', label: t('nav.students'),   Icon: Users },
    { to: '/creator/comunidad',   label: t('nav.community'),  Icon: MessageSquare },
    { to: '/creator/analiticas',  label: t('nav.analytics'),  Icon: BarChart2 },
    { to: '/creator/ajustes',     label: t('nav.settings'),   Icon: Settings },
  ];

  // Título dinámico según ruta
  const ROUTE_TITLES = {
    '/creator/dashboard':   t('nav.dashboard'),
    '/creator/cursos':      t('nav.courses'),
    '/creator/estudiantes': t('nav.students'),
    '/creator/comunidad':   t('nav.community'),
    '/creator/analiticas':  t('nav.analytics'),
    '/creator/ajustes':     t('nav.settings'),
  };
  const pageTitle = ROUTE_TITLES[location.pathname] ?? t('nav.panel');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    // Sincronizar con la preferencia guardada en ajustes
    const saved = localStorage.getItem('yc_tema');
    if (!saved) localStorage.setItem('yc_tema', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Sincronizar darkMode cuando cambie yc_tema (p.ej. desde Ajustes)
  useEffect(() => {
    const handler = () => {
      const tema = localStorage.getItem('yc_tema');
      if (tema === 'dark')  setDarkMode(true);
      else if (tema === 'light') setDarkMode(false);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">

      {/* ── OVERLAY MÓVIL ────────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 flex flex-col glass border-r shadow-sm transition-all duration-300 ease-in-out bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${collapsed ? 'w-[68px]' : 'w-64'}`}>

        {/* Logo */}
        <div className="flex items-center h-16 border-b border-gray-200 dark:border-gray-800 px-4 gap-3 overflow-hidden">
          <GraduationCap className="text-primary-600 dark:text-primary-400 shrink-0" size={24} />
          <span className={`font-bold text-gray-900 dark:text-white text-lg whitespace-nowrap transition-all duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
            YourCourse
          </span>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-2 mt-1 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-sm font-medium transition-all duration-150 overflow-hidden
                ${isActive
                  ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/25'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }
              `}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icon size={18} className="shrink-0" />
              <span className={`whitespace-nowrap transition-all duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Info usuario + Logout */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-800 space-y-1">
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div className={`w-7 h-7 rounded-full shrink-0 bg-gradient-to-br ${displayUser.avatar_color || 'from-primary-500 to-primary-700'} flex items-center justify-center text-white font-bold text-xs`}>
                {getInitials(displayUser.nombre)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{displayUser.nombre}</p>
                <p className="text-[10px] text-gray-400 truncate">{displayUser.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={collapsed ? t('nav.logout') : undefined}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut size={17} className="shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              {t('nav.logout')}
            </span>
          </button>
        </div>

        {/* Toggle sidebar */}
        <button
          onClick={() => setCollapsed(prev => !prev)}
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          className="hidden lg:flex absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm items-center justify-center text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 z-10"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>

      {/* ── ÁREA PRINCIPAL ───────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Header */}
        <header className="flex items-center justify-between h-16 px-4 lg:px-6 shrink-0 glass border-b shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-gray-900 dark:text-white font-bold text-lg leading-none">{pageTitle}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{t('header.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Campana de notificaciones REAL */}
            <NotificationBell />

            {/* Toggle Dark/Light */}
            <button
              onClick={() => {
                const next = !darkMode;
                setDarkMode(next);
                localStorage.setItem('yc_tema', next ? 'dark' : 'light');
              }}
              id="dark-mode-toggle"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            >
              {darkMode
                ? <><Sun size={15} /><span className="hidden sm:inline">{t('common.lightMode')}</span></>
                : <><Moon size={15} /><span className="hidden sm:inline">{t('common.darkMode')}</span></>}
            </button>

            {/* Avatar */}
            <div
              onClick={() => navigate('/creator/ajustes')}
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${displayUser.avatar_color || 'from-primary-500 to-primary-700'} flex items-center justify-center text-white font-bold text-sm cursor-pointer select-none ring-2 ring-primary-400/20 hover:ring-primary-400/50 transition-all`}
              title={t('nav.settings')}
            >
              {getInitials(displayUser.nombre)}
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
