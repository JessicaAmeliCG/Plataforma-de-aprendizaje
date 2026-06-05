/**
 * DashboardHome.jsx — v3 con datos reales de la API
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, BookOpen, Users, Star, TrendingUp, MoreVertical,
  Edit3, Trash2, Clock, Award, Zap, ChevronRight,
  DollarSign, Loader2, AlertCircle, Layers,
} from 'lucide-react';
import { api } from '../services/api';
import useAuthStore from '../stores/authStore';

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function EstadoBadge({ estado }) {
  const map = {
    publicado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    borrador:  'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
    archivado: 'bg-gray-100   text-gray-500   dark:bg-gray-800      dark:text-gray-400',
  };
  return (
    <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full ${map[estado]}`}>
      {estado.charAt(0).toUpperCase() + estado.slice(1)}
    </span>
  );
}

function CursoCard({ curso, index, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      className="group relative flex flex-col bg-white dark:bg-gray-900 rounded-2xl overflow-visible border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl dark:hover:shadow-gray-950/80 transition-all duration-300 hover:-translate-y-1.5 animate-fade-in-up"
      style={{ animationDelay: `${200 + index * 70}ms` }}
    >
      <div className={`relative h-36 bg-gradient-to-br ${curso.gradient_class || 'from-violet-600 to-indigo-700'} rounded-t-2xl flex items-center justify-center overflow-hidden`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '25px 25px' }} />
        <BookOpen size={36} className="text-white/50" />
        <EstadoBadge estado={curso.estado} />
        <div className="absolute top-3 right-3 z-20">
          <button onClick={e => { e.stopPropagation(); setMenuOpen(p => !p); }}
            className="p-1.5 rounded-lg bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-colors">
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-30">
              {[
                { label: 'Gestionar',   Icon: Edit3, action: () => navigate(`/creator/cursos/${curso.id}`) },
                { label: 'Eliminar',    Icon: Trash2, danger: true, action: () => { onDelete(curso.id); setMenuOpen(false); } },
              ].map(({ label, Icon, action, danger }) => (
                <button key={label} onClick={() => { action(); setMenuOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                           : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}>
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
          {curso.titulo}
        </h3>
        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1"><Users size={11} />{(curso.estudiantes || 0).toLocaleString()}</span>
          {curso.modulos_count > 0 && <span className="flex items-center gap-1"><Layers size={11} />{curso.modulos_count} mód.</span>}
          {curso.duracion && <span className="flex items-center gap-1"><Clock size={11} />{curso.duracion}</span>}
        </div>
        <div className="flex items-center justify-between pt-2 mt-auto border-t border-gray-100 dark:border-gray-800">
          {curso.modelo_negocio === 'gratis'      && <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">GRATIS</span>}
          {curso.modelo_negocio === 'pago_unico'  && <span className="text-sm font-bold text-gray-900 dark:text-white">${Number(curso.precio).toLocaleString()} MXN</span>}
          {curso.modelo_negocio === 'suscripcion' && <span className="text-xs font-bold text-violet-600 dark:text-violet-400">${Number(curso.precio).toLocaleString()}/mes</span>}
          <span className="text-xs text-gray-400 dark:text-gray-500">{curso.modulos_count || 0} módulos</span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const navigate  = useNavigate();
  const user      = useAuthStore(s => s.user);
  const [cursos,  setCursos]  = useState([]);
  const [stats,   setStats]   = useState({ cursos: 0, estudiantes: 0 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [filtro,  setFiltro]  = useState('todos');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cursosRes, estRes] = await Promise.all([
        api.get('/cursos'),
        api.get('/estudiantes'),
      ]);
      const lista = cursosRes.data || [];
      setCursos(lista);
      setStats({
        cursos:      lista.length,
        estudiantes: (estRes.data || []).length,
        publicados:  lista.filter(c => c.estado === 'publicado').length,
        inscritos:   lista.reduce((a, c) => a + (c.estudiantes || 0), 0),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este curso?')) return;
    try {
      await api.delete(`/cursos/${id}`);
      setCursos(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const cursosFiltrados = filtro === 'todos'
    ? cursos
    : cursos.filter(c => c.estado === filtro);

  const STAT_CARDS = [
    { label: 'Cursos totales',   value: stats.cursos,      Icon: BookOpen,    from: 'from-violet-500', to: 'to-purple-600', delta: `${stats.publicados || 0} publicados` },
    { label: 'Estudiantes',      value: stats.estudiantes, Icon: Users,       from: 'from-blue-500',   to: 'to-cyan-500',   delta: 'Registrados en la plataforma' },
    { label: 'Inscripciones',    value: stats.inscritos,   Icon: Award,       from: 'from-emerald-500',to: 'to-teal-500',   delta: 'Total de inscripciones' },
    { label: 'Ingresos aprox.',  value: `$${cursos.filter(c=>c.modelo_negocio!=='gratis').reduce((a,c)=>a+(c.precio||0)*(c.estudiantes||0),0).toLocaleString()}`,
      Icon: DollarSign, from: 'from-amber-400', to: 'to-orange-500', delta: 'Estimado acumulado' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-7">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            ¡Bienvenida, {user?.nombre?.split(' ')[0] || 'Creador'}! 👋
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Aquí está el resumen de tu academia hoy.</p>
        </div>
        <button
          id="btn-crear-curso"
          onClick={() => navigate('/creator/cursos/nuevo')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all active:scale-95 whitespace-nowrap"
        >
          <Plus size={17} /> Crear Nuevo Curso
        </button>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {STAT_CARDS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-4 p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all animate-fade-in-up" style={{ animationDelay: `${i*80}ms` }}>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${s.from} ${s.to} text-white shadow-sm shrink-0`}>
                <s.Icon size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{s.delta}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />{error}
          <button onClick={fetchData} className="ml-auto underline text-xs">Reintentar</button>
        </div>
      )}

      {/* Cursos grid + actividad */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen size={18} className="text-violet-500" /> Mis Cursos
            </h3>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              {['todos','publicado','borrador'].map(f => (
                <button key={f} onClick={() => setFiltro(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${
                    filtro === f
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}>
                  {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_,i) => <div key={i} className="h-52 bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cursosFiltrados.map((c, i) => (
                <CursoCard key={c.id} curso={c} index={i} onDelete={handleDelete} />
              ))}
              <button
                onClick={() => navigate('/creator/cursos/nuevo')}
                className="flex flex-col items-center justify-center gap-3 min-h-[200px] rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600 hover:border-violet-400 dark:hover:border-violet-700 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-all group animate-fade-in-up"
                style={{ animationDelay: `${200 + cursosFiltrados.length * 70}ms` }}
              >
                <div className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/20 transition-colors">
                  <Plus size={26} />
                </div>
                <span className="text-sm font-semibold">Nuevo Curso</span>
              </button>
            </div>
          )}
        </div>

        {/* Accesos rápidos */}
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap size={18} className="text-violet-500" /> Accesos rápidos
          </h3>

          <div className="space-y-3">
            {[
              { label: 'Ver estudiantes',   sub: `${stats.estudiantes} registrados`, icon: Users,    to: '/creator/estudiantes', color: 'text-blue-500' },
              { label: 'Crear nuevo curso', sub: 'Añade contenido',                  icon: Plus,     to: '/creator/cursos/nuevo', color: 'text-violet-500' },
              { label: 'Ver analíticas',    sub: 'Estadísticas detalladas',          icon: TrendingUp,to: '/creator/analiticas', color: 'text-emerald-500' },
            ].map(item => (
              <button key={item.label} onClick={() => navigate(item.to)}
                className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-left">
                <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800">
                  <item.icon size={18} className={item.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.sub}</p>
                </div>
                <ChevronRight size={16} className="text-gray-400 shrink-0" />
              </button>
            ))}
          </div>

          {/* XP card */}
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg shadow-violet-500/20">
            <p className="text-xs font-semibold text-violet-200 mb-1">Tu academia</p>
            <p className="text-3xl font-black">{user?.nombre || 'Creador'}</p>
            <p className="text-xs text-violet-200 mt-1">{user?.email}</p>
            <div className="mt-4 flex items-center gap-2">
              <Star size={14} className="fill-violet-200 text-violet-200" />
              <span className="text-xs font-semibold">Creador verificado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
