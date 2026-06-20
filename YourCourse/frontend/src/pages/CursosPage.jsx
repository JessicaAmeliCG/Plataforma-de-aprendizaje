/**
 * CursosPage.jsx — Gestión de todos los cursos del Creador
 * Listado con búsqueda, filtros, menú de acciones y acceso al detalle del curso
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, BookOpen, Users, Layers, Clock, MoreVertical,
  Eye, Edit3, Trash2, Search, Filter, Loader2, AlertCircle,
  Video, GraduationCap, TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';

// ─── Badge de estado ──────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  const map = {
    publicado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    borrador:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    archivado: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  };
  const labels = { publicado: 'Publicado', borrador: 'Borrador', archivado: 'Archivado' };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${map[estado] || map.borrador}`}>
      {labels[estado] || estado}
    </span>
  );
}

// ─── Tarjeta de Curso ─────────────────────────────────────────────────────────
function CursoCard({ curso, index, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      className="group relative flex flex-col bg-white dark:bg-gray-900 rounded-2xl overflow-visible border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl dark:hover:shadow-gray-950/80 transition-all duration-300 hover:-translate-y-1.5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Portada con degradado */}
      <div
        className={`relative h-36 bg-gradient-to-br ${curso.gradient_class || 'from-primary-600 to-indigo-700'} rounded-t-2xl flex items-center justify-center overflow-hidden cursor-pointer`}
        onClick={() => navigate(`/creator/cursos/${curso.id}`)}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '25px 25px' }}
        />
        <BookOpen size={36} className="text-white/40" />

        {/* Badge de estado */}
        <div className="absolute top-3 left-3">
          <EstadoBadge estado={curso.estado} />
        </div>

        {/* Menú de acciones */}
        <div className="absolute top-2 right-2 z-20">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(p => !p); }}
            className="p-1.5 rounded-lg bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-colors"
          >
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-30">
              {[
                {
                  label: 'Ver y gestionar',
                  Icon: Eye,
                  action: () => navigate(`/creator/cursos/${curso.id}`),
                },
                {
                  label: 'Eliminar',
                  Icon: Trash2,
                  danger: true,
                  action: () => { onDelete(curso.id); setMenuOpen(false); },
                },
              ].map(({ label, Icon, action, danger }) => (
                <button
                  key={label}
                  onClick={() => { action(); setMenuOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                    danger
                      ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div
        className="flex flex-col flex-1 p-4 gap-2 cursor-pointer"
        onClick={() => navigate(`/creator/cursos/${curso.id}`)}
      >
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {curso.titulo}
        </h3>
        {curso.descripcion && (
          <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 leading-relaxed">
            {curso.descripcion}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-1">
          <span className="flex items-center gap-1"><Users size={11} />{(curso.estudiantes || 0)} alumnos</span>
          {curso.modulos_count > 0 && <span className="flex items-center gap-1"><Layers size={11} />{curso.modulos_count} módulos</span>}
          {curso.duracion && <span className="flex items-center gap-1"><Clock size={11} />{curso.duracion}</span>}
        </div>
        <div className="flex items-center justify-between pt-2 mt-auto border-t border-gray-100 dark:border-gray-800">
          {curso.modelo_negocio === 'gratis'      && <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">GRATIS</span>}
          {curso.modelo_negocio === 'pago_unico'  && <span className="text-sm font-bold text-gray-900 dark:text-white">${Number(curso.precio).toLocaleString()} MXN</span>}
          {curso.modelo_negocio === 'suscripcion' && <span className="text-xs font-bold text-primary-600 dark:text-primary-400">${Number(curso.precio).toLocaleString()}/mes</span>}
          <span className="text-xs text-primary-500 dark:text-primary-400 font-medium flex items-center gap-1 ml-auto">
            <Video size={11} /> Ver lecciones →
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ busqueda, onCrear }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-5 text-center">
      <div className="w-20 h-20 rounded-3xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
        <GraduationCap size={36} className="text-primary-500" />
      </div>
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
          {busqueda ? 'Sin resultados' : 'Aún no tienes cursos'}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-xs">
          {busqueda
            ? `No encontramos cursos que coincidan con "${busqueda}".`
            : 'Crea tu primer curso y empieza a compartir tu conocimiento.'}
        </p>
      </div>
      {!busqueda && (
        <button
          onClick={onCrear}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-500 hover:to-primary-500 text-white font-semibold text-sm shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all active:scale-95"
        >
          <Plus size={17} /> Crear primer curso
        </button>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function CursosPage() {
  const navigate = useNavigate();
  const [cursos,   setCursos]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtro,   setFiltro]   = useState('todos');

  const fetchCursos = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/cursos');
      setCursos(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCursos(); }, [fetchCursos]);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este curso? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/cursos/${id}`);
      setCursos(prev => prev.filter(c => c.id !== id));
    } catch (err) { alert(err.message); }
  };

  // Filtrar
  const cursosFiltrados = cursos
    .filter(c => filtro === 'todos' || c.estado === filtro)
    .filter(c => !busqueda || c.titulo.toLowerCase().includes(busqueda.toLowerCase()));

  // Stats rápidas
  const publicados = cursos.filter(c => c.estado === 'publicado').length;
  const borradores = cursos.filter(c => c.estado === 'borrador').length;
  const totalAlumnos = cursos.reduce((a, c) => a + (c.estudiantes || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen size={24} className="text-primary-500" /> Mis Cursos
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestiona tus cursos, sube videos y organiza el contenido.
          </p>
        </div>
        <button
          id="btn-cursos-nuevo"
          onClick={() => navigate('/creator/cursos/nuevo')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-500 hover:to-primary-500 text-white font-semibold text-sm shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all active:scale-95 whitespace-nowrap"
        >
          <Plus size={17} /> Crear Curso
        </button>
      </div>

      {/* Mini-stats */}
      {!loading && cursos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total cursos',   value: cursos.length,   color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20' },
            { label: 'Publicados',     value: publicados,      color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Total alumnos',  value: totalAlumnos,    color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Buscador + filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar curso por título..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl self-start sm:self-auto">
          {['todos', 'publicado', 'borrador'].map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                filtro === f
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'todos' && (
                <span className="ml-1.5 text-[10px] opacity-60">
                  {f === 'publicado' ? publicados : borradores}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />{error}
          <button onClick={fetchCursos} className="ml-auto underline text-xs">Reintentar</button>
        </div>
      )}

      {/* Grid de cursos */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-60 bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cursosFiltrados.map((c, i) => (
            <CursoCard key={c.id} curso={c} index={i} onDelete={handleDelete} />
          ))}

          {/* Botón añadir */}
          {!busqueda && (
            <button
              onClick={() => navigate('/creator/cursos/nuevo')}
              className="flex flex-col items-center justify-center gap-3 min-h-[220px] rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600 hover:border-primary-400 dark:hover:border-primary-700 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all group"
            >
              <div className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/20 transition-colors">
                <Plus size={26} />
              </div>
              <span className="text-sm font-semibold">Nuevo Curso</span>
            </button>
          )}

          {cursosFiltrados.length === 0 && (
            <EmptyState busqueda={busqueda} onCrear={() => navigate('/creator/cursos/nuevo')} />
          )}
        </div>
      )}
    </div>
  );
}
