/**
 * StudentDashboard.jsx — Mis Cursos (con porcentaje de avance)
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen, AlertCircle, GraduationCap, Play,
  CheckCircle, Clock, Layers,
} from 'lucide-react';
import { api } from '../services/api';
import useAuthStore from '../stores/authStore';
import { useT } from '../contexts/I18nContext';

/* ─── Barra de progreso ────────────────────────────────────────────────────── */
function ProgressBar({ value = 0 }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">Progreso</span>
        <span className={`text-xs font-bold ${pct === 100 ? 'text-emerald-600' : 'text-primary-600'}`}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-primary-500 to-primary-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Tarjeta de curso inscrito ────────────────────────────────────────────── */
const CATEGORY_META = {
  tecnologia: { emoji: '💻', color: 'from-blue-600 to-cyan-500'     },
  matematicas: { emoji: '📐', color: 'from-indigo-600 to-violet-600' },
  idiomas:    { emoji: '🌐', color: 'from-teal-500 to-emerald-600'  },
  negocios:   { emoji: '💼', color: 'from-amber-500 to-orange-600'  },
  diseno:     { emoji: '🎨', color: 'from-rose-500 to-pink-600'     },
  ciencias:   { emoji: '🔬', color: 'from-emerald-600 to-teal-700'  },
};

function getCategoryMeta(categoria) {
  return CATEGORY_META[categoria] || { emoji: '📚', color: 'from-primary-600 to-primary-700' };
}

function CursoCard({ curso }) {
  const navigate = useNavigate();
  const meta = getCategoryMeta(curso.categoria);
  const pct = curso.progreso || 0;
  const completed = pct === 100;

  return (
    <div
      onClick={() => navigate(`/student/cursos/${curso.id}/ver`)}
      className="group relative flex flex-col bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
      <div className={`h-36 bg-gradient-to-br ${meta.color} flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '25px 25px' }} />
        <span className="text-5xl z-10">{meta.emoji}</span>
        {completed && (
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
            <CheckCircle size={14} className="text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 gap-3">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">
          {curso.titulo}
        </h3>

        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          {curso.modulos_count > 0 && (
            <span className="flex items-center gap-1"><Layers size={11} />{curso.modulos_count} mód.</span>
          )}
          {curso.duracion && (
            <span className="flex items-center gap-1"><Clock size={11} />{curso.duracion}</span>
          )}
        </div>

        <div className="mt-auto">
          <ProgressBar value={pct} />
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="bg-white text-gray-900 px-4 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2 text-sm">
          <Play size={14} /> {completed ? 'Revisar' : 'Continuar'}
        </div>
      </div>
    </div>
  );
}

/* ─── Página ────────────────────────────────────────────────────────────────── */
export default function StudentDashboard() {
  const t = useT();
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [misCursos, setMisCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [verificandoPago, setVerificandoPago] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/estudiantes/${user.id}`);
      setMisCursos(res.data.cursos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* Verificar pago Stripe */
  useEffect(() => {
    const session_id = searchParams.get('session_id');
    if (!session_id) return;
    setVerificandoPago(true);
    api.get(`/pagos/success?session_id=${session_id}`)
      .then(res => {
        alert(res.message || 'Pago verificado correctamente.');
        searchParams.delete('session_id');
        setSearchParams(searchParams);
        fetchData();
      })
      .catch(err => {
        alert(err.message || 'Error al verificar el pago.');
        searchParams.delete('session_id');
        setSearchParams(searchParams);
      })
      .finally(() => setVerificandoPago(false));
  }, [searchParams, setSearchParams, fetchData]);

  const cursosCompletados = misCursos.filter(c => (c.progreso || 0) === 100).length;
  const cursosEnProgreso  = misCursos.filter(c => (c.progreso || 0) > 0 && (c.progreso || 0) < 100).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
      {/* Banner */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-8 text-white shadow-xl shadow-primary-500/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-1">
            ¡Hola, {user?.nombre?.split(' ')[0] || 'Estudiante'}! 👋
          </h2>
          <p className="text-primary-100 text-sm mb-5">Sigue aprendiendo a tu propio ritmo.</p>

          {/* Estadísticas */}
          <div className="flex flex-wrap gap-4">
            {[
              { label: 'Cursos inscritos', value: misCursos.length, icon: BookOpen },
              { label: 'En progreso',       value: cursosEnProgreso, icon: Play },
              { label: 'Completados',       value: cursosCompletados, icon: CheckCircle },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center gap-3">
                <Icon size={18} className="text-white/70" />
                <div>
                  <p className="text-2xl font-black leading-none">{value}</p>
                  <p className="text-xs text-primary-100">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />{error}
          <button onClick={fetchData} className="ml-auto underline text-xs">Reintentar</button>
        </div>
      )}
      {verificandoPago && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm">
          <AlertCircle size={16} className="animate-pulse" /> Verificando pago con Stripe, por favor espera...
        </div>
      )}

      {/* Grid de mis cursos */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BookOpen size={20} className="text-primary-500" /> Mis Cursos
        </h3>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-52 bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : misCursos.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
            <GraduationCap size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">Aún no estás inscrito en ningún curso</p>
            <button
              onClick={() => navigate('/student/buscar')}
              className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm transition-all shadow-lg shadow-primary-500/25"
            >
              Explorar cursos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {misCursos.map(c => <CursoCard key={c.id} curso={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}
