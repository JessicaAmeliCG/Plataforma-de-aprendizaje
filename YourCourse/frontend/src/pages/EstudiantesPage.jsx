/**
 * EstudiantesPage.jsx — Panel de estudiantes para el creador
 * Lista todos los estudiantes registrados con sus cursos inscritos
 */

import { useState, useEffect } from 'react';
import { Users, Search, BookOpen, Calendar, Mail, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function formatDate(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
  } catch { return str; }
}

// ─── Tarjeta de estudiante ────────────────────────────────────────────────────
function EstudianteCard({ estudiante, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={() => setExpanded(p => !p)}
      >
        {/* Avatar */}
        <div className={`
          w-11 h-11 rounded-xl shrink-0
          bg-gradient-to-br ${estudiante.avatar_color || 'from-primary-500 to-primary-700'}
          flex items-center justify-center
          text-white font-bold text-sm
        `}>
          {getInitials(estudiante.nombre)}
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{estudiante.nombre}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
            <Mail size={11} />{estudiante.email}
          </p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-center hidden sm:block">
            <p className="text-lg font-black text-primary-600 dark:text-primary-400">{estudiante.cursos.length}</p>
            <p className="text-[10px] text-gray-400">cursos</p>
          </div>
          <div className="text-center hidden sm:block">
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(estudiante.created_at)}</p>
            <p className="text-[10px] text-gray-400">registro</p>
          </div>
          <span className={`text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>›</span>
        </div>
      </div>

      {/* Cursos expandidos */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-4 pt-3">
          {estudiante.cursos.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Sin cursos inscritos aún.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Cursos inscritos</p>
              {estudiante.cursos.map(c => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.gradient_class} flex items-center justify-center shrink-0`}>
                    <BookOpen size={13} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{c.titulo}</p>
                    <p className="text-[10px] text-gray-400">Inscrito el {formatDate(c.inscrito_en)}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    c.modelo_negocio === 'gratis'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : c.modelo_negocio === 'suscripcion'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {c.modelo_negocio === 'gratis' ? 'GRATIS' : c.modelo_negocio === 'suscripcion' ? 'SUSCR.' : 'PAGO'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function EstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');

  const fetchEstudiantes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/estudiantes');
      setEstudiantes(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEstudiantes(); }, []);

  const filtered = estudiantes.filter(e =>
    e.nombre.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalInscripciones = estudiantes.reduce((acc, e) => acc + e.cursos.length, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Estudiantes</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {estudiantes.length} estudiantes registrados · {totalInscripciones} inscripciones totales
          </p>
        </div>
        <button
          onClick={fetchEstudiantes}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw size={15} /> Actualizar
        </button>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        {[
          { label: 'Total registrados', value: estudiantes.length,       icon: Users,    color: 'text-primary-600 dark:text-primary-400' },
          { label: 'Con cursos activos', value: estudiantes.filter(e => e.cursos.length > 0).length, icon: BookOpen, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Inscripciones',     value: totalInscripciones,       icon: Calendar, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center shadow-sm">
            <s.icon size={20} className={`${s.color} mx-auto mb-1`} />
            <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="relative animate-fade-in-up" style={{ animationDelay: '160ms' }}>
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="
            w-full pl-11 pr-4 py-3 rounded-xl text-sm
            bg-white dark:bg-gray-900
            border border-gray-200 dark:border-gray-700
            text-gray-900 dark:text-white
            placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-primary-500
            transition-all shadow-sm
          "
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 size={32} className="text-primary-500 animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando estudiantes…</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl p-6 text-center text-sm">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
          <Users size={40} className="opacity-30" />
          <p className="text-sm">{search ? 'Sin resultados para tu búsqueda' : 'Aún no hay estudiantes registrados'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e, i) => <EstudianteCard key={e.id} estudiante={e} index={i} />)}
        </div>
      )}
    </div>
  );
}
