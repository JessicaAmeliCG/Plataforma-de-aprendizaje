/**
 * AdminDashboard.jsx — Panel de control del Super Administrador
 * Vista general: estadísticas globales, acciones rápidas, últimos usuarios
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, BookOpen, GraduationCap, ShieldCheck,
  AlertTriangle, TrendingUp, Plus, RefreshCw,
  Loader2, AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import useAuthStore from '../stores/authStore';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex items-center gap-4 shadow-sm`}>
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shrink-0`}>
        <Icon size={26} className="text-white" />
      </div>
      <div>
        <p className="text-3xl font-black text-gray-900 dark:text-white">{value ?? '—'}</p>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate  = useNavigate();
  const user      = useAuthStore(s => s.user);
  const [stats,   setStats]   = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError('');
      try {
        // Traemos los datos con los endpoints existentes
        const [cursosRes, usersRes] = await Promise.all([
          api.get('/cursos'),
          api.get('/admin/usuarios').catch(() => ({ data: [] })),
        ]);

        const cursos = cursosRes.data || [];
        const users  = usersRes.data  || [];

        setStats({
          totalCursos:      cursos.length,
          totalPublicados:  cursos.filter(c => c.estado === 'publicado').length,
          totalBorradores:  cursos.filter(c => c.estado === 'borrador').length,
          totalUsuarios:    users.length,
          totalCreadores:   users.filter(u => u.rol === 'creador').length,
          totalModeradoes:  users.filter(u => u.rol === 'moderador').length,
          totalEstudiantes: users.filter(u => u.rol === 'estudiante').length,
        });

        setUsuarios(users.slice(0, 10));
      } catch (err) {
        setError(err.message || 'Error al cargar estadísticas');
        // Intentar con cursos al menos
        try {
          const cursosRes = await api.get('/cursos');
          const cursos = cursosRes.data || [];
          setStats({
            totalCursos:     cursos.length,
            totalPublicados: cursos.filter(c => c.estado === 'publicado').length,
            totalBorradores: cursos.filter(c => c.estado === 'borrador').length,
          });
        } catch {}
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const ROL_BADGE = {
    superadmin: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    moderador:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    creador:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    estudiante: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-rose-600 via-rose-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl shadow-rose-500/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold mb-3">
              <ShieldCheck size={14} />
              Super Administrador
            </div>
            <h2 className="text-3xl font-black mb-1">
              Bienvenido, {user?.nombre?.split(' ')[0] || 'Admin'} 👑
            </h2>
            <p className="text-rose-100 text-sm">
              Tienes acceso total al sistema. Gestiona usuarios, cursos y moderadores.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/cursos')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm transition-all backdrop-blur-sm"
            >
              <BookOpen size={16} /> Ver Cursos
            </button>
            <button
              onClick={() => navigate('/admin/usuarios')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-bold text-sm transition-all shadow-lg"
            >
              <Users size={16} /> Gestionar Usuarios
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm">
          <AlertCircle size={16} />
          {error} — Mostrando datos parciales
        </div>
      )}

      {/* Tarjetas de estadísticas */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={BookOpen}      label="Total de Cursos"    value={stats?.totalCursos}      color="bg-gradient-to-tr from-primary-500 to-primary-700" sub={`${stats?.totalPublicados ?? 0} publicados`} />
          <StatCard icon={GraduationCap} label="Estudiantes"        value={stats?.totalEstudiantes} color="bg-gradient-to-tr from-emerald-500 to-teal-600" />
          <StatCard icon={Users}         label="Creadores"          value={stats?.totalCreadores}   color="bg-gradient-to-tr from-blue-500 to-indigo-600" />
          <StatCard icon={ShieldCheck}   label="Moderadores"        value={stats?.totalModeradoes}  color="bg-gradient-to-tr from-rose-500 to-purple-600" />
        </div>
      )}

      {/* Acciones Rápidas */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-rose-500" />
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { label: 'Gestionar Usuarios',    icon: Users,          path: '/admin/usuarios',    color: 'from-blue-500 to-blue-600' },
            { label: 'Ver todos los Cursos',  icon: BookOpen,       path: '/admin/cursos',      color: 'from-primary-500 to-primary-600' },
            { label: 'Gestionar Moderadores', icon: ShieldCheck,    path: '/admin/moderadores', color: 'from-indigo-500 to-indigo-600' },
            { label: 'Ver Analíticas',        icon: TrendingUp,     path: '/admin/analiticas',  color: 'from-emerald-500 to-emerald-600' },
          ].map(action => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-tr ${action.color} text-white font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-1 transition-all`}
            >
              <action.icon size={22} />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Últimos usuarios */}
      {usuarios.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
            <Users size={20} className="text-rose-500" />
            Últimos Usuarios Registrados
          </h3>
          <div className="space-y-2">
            {usuarios.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${u.avatar_color || 'from-primary-500 to-primary-700'} flex items-center justify-center text-white font-bold text-xs`}>
                  {(u.nombre || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{u.nombre}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ROL_BADGE[u.rol] || ROL_BADGE.estudiante}`}>
                  {u.rol}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
