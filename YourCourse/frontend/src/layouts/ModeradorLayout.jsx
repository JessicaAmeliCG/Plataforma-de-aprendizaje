/**
 * ModeradorLayout.jsx — Layout para Moderadores
 * Sin Analíticas ni Crear Curso. Incluye pestaña de Maestros.
 */
import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen, Users, MessageSquare, Settings,
  LogOut, ChevronLeft, ChevronRight, Moon, Sun,
  GraduationCap, Menu, UserCheck,
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import NotificationBell from '../components/NotificationBell';

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function ModeradorLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('yc_tema');
    if (saved === 'dark')  return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = useAuthStore(s => s.user);
  const logout    = useAuthStore(s => s.logout);
  const displayUser = user || { nombre: 'Moderador', email: '', avatar_color: 'from-indigo-500 to-indigo-700' };

  // Sin Analíticas, sin Crear Curso. Sí tiene Maestros.
  const NAV_ITEMS = [
    { to: '/moderador/cursos',    label: 'Todos los Cursos', Icon: BookOpen },
    { to: '/moderador/maestros',  label: 'Gestionar Maestros', Icon: UserCheck },
    { to: '/moderador/comunidad', label: 'Comunidad',         Icon: MessageSquare },
    { to: '/moderador/ajustes',   label: 'Ajustes',           Icon: Settings },
  ];

  const ROUTE_TITLES = {};
  NAV_ITEMS.forEach(i => { ROUTE_TITLES[i.to] = i.label; });
  const pageTitle = ROUTE_TITLES[location.pathname] ?? 'Moderación';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    const saved = localStorage.getItem('yc_tema');
    if (!saved) localStorage.setItem('yc_tema', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">

      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 flex flex-col border-r shadow-sm transition-all duration-300 ease-in-out bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${collapsed ? 'w-[68px]' : 'w-64'}`}>

        {/* Logo con badge */}
        <div className="flex items-center h-16 border-b border-gray-200 dark:border-gray-800 px-4 gap-3 overflow-hidden">
          <div className="relative shrink-0">
            <GraduationCap className="text-primary-600 dark:text-primary-400" size={24} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white dark:border-gray-950" />
          </div>
          <div className={`transition-all duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'} overflow-hidden whitespace-nowrap`}>
            <span className="font-bold text-gray-900 dark:text-white text-base">YourCourse</span>
            <span className="ml-2 text-xs font-bold text-white bg-indigo-500 px-1.5 py-0.5 rounded-md">Mod</span>
          </div>
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
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
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

        {/* Info usuario */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-800 space-y-1">
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
              <div className={`w-7 h-7 rounded-full shrink-0 bg-gradient-to-br ${displayUser.avatar_color || 'from-indigo-500 to-indigo-700'} flex items-center justify-center text-white font-bold text-xs`}>
                {getInitials(displayUser.nombre)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{displayUser.nombre}</p>
                <p className="text-[10px] text-indigo-500 font-bold">Moderador</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut size={17} className="shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              Cerrar Sesión
            </span>
          </button>
        </div>

        <button
          onClick={() => setCollapsed(prev => !prev)}
          className="hidden lg:flex absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm items-center justify-center text-gray-500 hover:text-indigo-600 transition-all z-10"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>

      {/* Área principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between h-16 px-4 lg:px-6 shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-gray-900 dark:text-white font-bold text-lg leading-none">{pageTitle}</h1>
              <p className="text-xs text-indigo-500 font-semibold mt-0.5">Panel de Moderación</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => {
                const next = !darkMode;
                setDarkMode(next);
                localStorage.setItem('yc_tema', next ? 'dark' : 'light');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <div
              onClick={() => navigate('/moderador/ajustes')}
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${displayUser.avatar_color || 'from-indigo-500 to-indigo-700'} flex items-center justify-center text-white font-bold text-sm cursor-pointer ring-2 ring-indigo-400/30 hover:ring-indigo-400/60 transition-all`}
            >
              {getInitials(displayUser.nombre)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
