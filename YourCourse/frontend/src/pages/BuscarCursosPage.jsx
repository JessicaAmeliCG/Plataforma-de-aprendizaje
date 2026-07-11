/**
 * BuscarCursosPage.jsx — Catálogo de cursos para el estudiante
 * Búsqueda por palabra clave, filtros, modal de vista previa e inscripción.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, BookOpen, Clock, Layers, Users, Star,
  DollarSign, GraduationCap, Loader2, AlertCircle,
  ChevronRight, CheckCircle, Play,
} from 'lucide-react';
import { api } from '../services/api';
import useAuthStore from '../stores/authStore';

/* ─── Íconos de categoría ──────────────────────────────────────────────────── */
const CATEGORY_META = {
  tecnologia: { label: 'Tecnología',   emoji: '💻', color: 'from-blue-600 to-cyan-500', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80' },
  matematicas: { label: 'Matemáticas', emoji: '📐', color: 'from-indigo-600 to-violet-600', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80' },
  idiomas:     { label: 'Idiomas',     emoji: '🌐', color: 'from-teal-500 to-emerald-600', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80' },
  negocios:    { label: 'Negocios',    emoji: '💼', color: 'from-amber-500 to-orange-600', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80' },
  diseno:      { label: 'Diseño',      emoji: '🎨', color: 'from-rose-500 to-pink-600', image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&auto=format&fit=crop&q=80' },
  ciencias:    { label: 'Ciencias',    emoji: '🔬', color: 'from-emerald-600 to-teal-700', image: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=600&auto=format&fit=crop&q=80' },
};

function getCategoryMeta(categoria) {
  return CATEGORY_META[categoria] || { label: categoria || 'General', emoji: '📚', color: 'from-primary-600 to-primary-700', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80' };
}

/* ─── Tarjeta de curso ─────────────────────────────────────────────────────── */
function CursoCard({ curso, misCursosIds, onOpenModal }) {
  const meta = getCategoryMeta(curso.categoria);
  const isEnrolled = misCursosIds.has(curso.id);

  return (
    <div
      onClick={() => onOpenModal(curso)}
      className="group relative flex flex-col bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
      <div 
        className={`h-36 bg-gradient-to-br ${meta.color} flex items-center justify-center relative overflow-hidden`}
        style={curso.thumbnail || meta.image ? {
          backgroundImage: `url(${curso.thumbnail || meta.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
      >
        {(curso.thumbnail || meta.image) && (
          <div className="absolute inset-0 bg-black/40" />
        )}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '25px 25px' }} />
        <span className="text-5xl z-10 drop-shadow-md">{meta.emoji}</span>
        {isEnrolled && (
          <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
            <CheckCircle size={9} /> Inscrito
          </span>
        )}
        <span className={`absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full z-10 ${
          curso.estado === 'publicado'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-amber-100 text-amber-700'
        }`}>
          {meta.label}
        </span>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">
          {curso.titulo}
        </h3>
        {curso.descripcion && (
          <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 leading-relaxed flex-1">
            {curso.descripcion}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-auto pt-2 border-t border-gray-100 dark:border-gray-800">
          <span className="font-bold text-gray-900 dark:text-white">
            {curso.modelo_negocio === 'gratis' ? '🎁 Gratis' : `$${curso.precio}`}
          </span>
          {curso.modulos_count > 0 && (
            <span className="flex items-center gap-1 ml-auto">
              <Layers size={11} />{curso.modulos_count} mód.
            </span>
          )}
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="bg-white text-gray-900 px-4 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2 text-sm">
          <Play size={14} /> Ver detalles
        </div>
      </div>
    </div>
  );
}

/* ─── Modal de Vista Previa ────────────────────────────────────────────────── */
function ModalVistaPrevia({ curso, onClose, onEnroll, isEnrolled, enrolling }) {
  const navigate = useNavigate();
  const meta = getCategoryMeta(curso.categoria);
  const overlayRef = useRef(null);

  // Cerrar al hacer clic fuera
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Extraer todas las lecciones directamente
  const todasLecciones = curso.lecciones || [];

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        {/* Header del modal */}
        <div 
          className={`h-40 bg-gradient-to-br ${meta.color} relative flex items-end p-6 shrink-0`}
          style={curso.thumbnail || meta.image ? {
            backgroundImage: `url(${curso.thumbnail || meta.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {}}
        >
          {(curso.thumbnail || meta.image) && (
            <div className="absolute inset-0 bg-black/50" />
          )}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '25px 25px' }} />
          <span className="absolute top-4 right-4 text-4xl z-10 drop-shadow-md">{meta.emoji}</span>
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors z-10"
          >
            <X size={16} />
          </button>
          <div className="relative z-10">
            <span className="text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
              {meta.label}
            </span>
            <h2 className="text-xl font-black text-white mt-1 leading-tight drop-shadow-md">{curso.titulo}</h2>
          </div>
        </div>

        {/* Body del modal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: DollarSign, label: 'Precio', value: curso.modelo_negocio === 'gratis' ? 'Gratis' : `$${curso.precio}` },
              { icon: Layers, label: 'Contenido', value: todasLecciones.length ? `${todasLecciones.length} lecciones` : 'N/D' },
              { icon: Clock, label: 'Duración', value: curso.duracion || 'Autodidacta' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                <Icon size={16} className="mx-auto text-primary-500 mb-1" />
                <p className="text-[10px] text-gray-400 uppercase font-bold">{label}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Descripción */}
          {curso.descripcion && (
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <BookOpen size={15} className="text-primary-500" /> Descripción
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{curso.descripcion}</p>
            </div>
          )}

          {/* Temario */}
          {todasLecciones.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <GraduationCap size={15} className="text-primary-500" />
                Temario ({todasLecciones.length} lecciones)
              </h4>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {todasLecciones.map((l, i) => (
                  <div key={l.id || i} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{l.titulo}</span>
                    <Play size={12} className="text-gray-300 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {todasLecciones.length === 0 && (
            <div className="text-center py-4 text-gray-400 text-sm">
              <Layers size={32} className="mx-auto mb-2 text-gray-200 dark:text-gray-700" />
              El creador aún no ha cargado el temario del curso.
            </div>
          )}
        </div>

        {/* Footer con botón CTA */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 shrink-0">
          {isEnrolled ? (
            <button
              onClick={() => navigate(`/student/cursos/${curso.id}/ver`)}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Play size={16} /> Continuar curso
            </button>
          ) : (
            <button
              onClick={() => onEnroll(curso)}
              disabled={enrolling}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-bold transition-all shadow-lg shadow-primary-500/30 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {enrolling
                ? <><Loader2 size={16} className="animate-spin" /> Inscribiendo...</>
                : <><GraduationCap size={16} /> {curso.modelo_negocio === 'gratis' ? 'Inscribirse Gratis' : `Comprar por $${curso.precio}`}</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Página principal ─────────────────────────────────────────────────────── */
export default function BuscarCursosPage() {
  const user = useAuthStore(s => s.user);
  const [cursos, setCursos] = useState([]);
  const [misCursos, setMisCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filtroModelo, setFiltroModelo] = useState('todos');
  const [modalCurso, setModalCurso] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pubRes, estRes] = await Promise.all([
        api.get('/cursos/publicos'),
        api.get(`/estudiantes/${user.id}`),
      ]);
      setCursos(pubRes.data || []);
      setMisCursos(estRes.data.cursos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const misCursosIds = new Set(misCursos.map(c => c.id));

  /* Filtrado */
  const cursosFiltrados = cursos.filter(c => {
    const matchQuery = !query || c.titulo.toLowerCase().includes(query.toLowerCase()) || (c.descripcion || '').toLowerCase().includes(query.toLowerCase());
    const matchModelo = filtroModelo === 'todos' || c.modelo_negocio === filtroModelo;
    return matchQuery && matchModelo;
  });

  const handleEnroll = async (curso) => {
    try {
      setEnrolling(true);
      if (curso.modelo_negocio === 'gratis' || !curso.precio || curso.precio <= 0) {
        await api.post('/estudiantes/inscribir', { curso_id: curso.id });
        await fetchData();
        setModalCurso(null);
      } else {
        const res = await api.post('/pagos/create-checkout-session', { curso_id: curso.id });
        if (res.url) window.location.href = res.url;
      }
    } catch (err) {
      alert(err.message || 'Error al procesar la inscripción.');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-primary-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-1">Explorar Cursos</h2>
          <p className="text-indigo-100 text-sm mb-5">Encuentra el conocimiento que estás buscando</p>

          {/* Barra de búsqueda */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar cursos por nombre o descripción..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm shadow-lg"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Filtrar por:</span>
        {[
          { value: 'todos',      label: 'Todos' },
          { value: 'gratis',     label: '🎁 Gratuitos' },
          { value: 'pago_unico', label: '💳 De pago' },
          { value: 'suscripcion',label: '🔄 Suscripción' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFiltroModelo(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              filtroModelo === f.value
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-300'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
          {cursosFiltrados.length} curso{cursosFiltrados.length !== 1 ? 's' : ''} encontrado{cursosFiltrados.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} /> {error}
          <button onClick={fetchData} className="ml-auto underline text-xs">Reintentar</button>
        </div>
      )}

      {/* Grid de cursos */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-52 bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : cursosFiltrados.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
          <Search size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {query ? `No se encontraron cursos para "${query}"` : 'No hay cursos disponibles'}
          </p>
          {query && (
            <button onClick={() => setQuery('')} className="mt-3 text-primary-600 text-sm underline">
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {cursosFiltrados.map(c => (
            <CursoCard
              key={c.id}
              curso={c}
              misCursosIds={misCursosIds}
              onOpenModal={setModalCurso}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalCurso && (
        <ModalVistaPrevia
          curso={modalCurso}
          onClose={() => setModalCurso(null)}
          onEnroll={handleEnroll}
          isEnrolled={misCursosIds.has(modalCurso.id)}
          enrolling={enrolling}
        />
      )}
    </div>
  );
}
