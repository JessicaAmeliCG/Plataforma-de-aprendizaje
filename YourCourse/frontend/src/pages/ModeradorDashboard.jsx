/**
 * ModeradorDashboard.jsx — Panel del Moderador
 * Vista: todos los cursos de la plataforma, gestión de maestros
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, UserCheck, MessageSquare,
  AlertCircle, GraduationCap, Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import useAuthStore from '../stores/authStore';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 dark:text-white">{value ?? '—'}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}

export default function ModeradorDashboard() {
  const navigate = useNavigate();
  const user     = useAuthStore(s => s.user);
  const [cursos,  setCursos]  = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [cursosRes, statsRes] = await Promise.all([
          api.get('/cursos'),
          api.get('/admin/stats').catch(() => ({ data: null })),
        ]);
        setCursos(cursosRes.data || []);
        setStats(statsRes.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">

      {/* Banner */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-indigo-200 text-sm font-semibold mb-1">Panel de Moderación</p>
            <h2 className="text-3xl font-black mb-1">
              Hola, {user?.nombre?.split(' ')[0] || 'Moderador'} 🛡️
            </h2>
            <p className="text-indigo-100 text-sm">Gestiona los cursos y maestros de la plataforma.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/moderador/maestros')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-sm shadow-lg"
            >
              <UserCheck size={16} /> Gestionar Maestros
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={BookOpen}  label="Total de Cursos"  value={stats?.totalCursos || cursos.length} color="bg-gradient-to-tr from-primary-500 to-primary-700" />
        <StatCard icon={Users}     label="Publicados"       value={stats?.totalPublicados || cursos.filter(c => c.estado === 'publicado').length} color="bg-gradient-to-tr from-emerald-500 to-teal-600" />
        <StatCard icon={UserCheck} label="Creadores"        value={stats?.totalCreadores} color="bg-gradient-to-tr from-indigo-500 to-indigo-700" />
      </div>

      {/* Lista de cursos */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
          <BookOpen size={20} className="text-indigo-500" />
          Todos los Cursos de la Plataforma
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
          </div>
        ) : cursos.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <GraduationCap size={40} className="mx-auto mb-3" />
            <p>No hay cursos en la plataforma</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cursos.slice(0, 15).map(c => (
              <div key={c.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient_class || 'from-primary-500 to-indigo-600'} flex items-center justify-center shrink-0`}>
                  <BookOpen size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.titulo}</p>
                  <p className="text-xs text-gray-400">{c.creador_nombre || 'Sin asignar'} · {c.estudiantes || 0} estudiantes</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  c.estado === 'publicado'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {c.estado}
                </span>
              </div>
            ))}
            {cursos.length > 15 && (
              <button
                onClick={() => navigate('/moderador/cursos')}
                className="w-full mt-2 py-2 text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
              >
                Ver todos los {cursos.length} cursos →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
