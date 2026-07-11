/**
 * PerfilCreadorPage.jsx — Perfil público del creador/maestro
 * Muestra biografía y cursos disponibles del creador.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  GraduationCap, BookOpen, Layers, Clock, ChevronLeft,
  Loader2, AlertCircle, Star, Users,
} from 'lucide-react';
import { api } from '../services/api';

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

const CATEGORY_META = {
  tecnologia: { emoji: '💻', color: 'from-blue-600 to-cyan-500', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80' },
  matematicas: { emoji: '📐', color: 'from-indigo-600 to-violet-600', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80' },
  idiomas:    { emoji: '🌐', color: 'from-teal-500 to-emerald-600', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80' },
  negocios:   { emoji: '💼', color: 'from-amber-500 to-orange-600', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80' },
  diseno:     { emoji: '🎨', color: 'from-rose-500 to-pink-600', image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&auto=format&fit=crop&q=80' },
  ciencias:   { emoji: '🔬', color: 'from-emerald-600 to-teal-700', image: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=600&auto=format&fit=crop&q=80' },
};
function getCat(c) {
  return CATEGORY_META[c] || { emoji: '📚', color: 'from-primary-600 to-primary-700', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80' };
}

export default function PerfilCreadorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const res = await api.get(`/maestros/${id}/perfil`);
        setPerfil(res.data);
      } catch (err) {
        setError(err.message || 'No se pudo cargar el perfil.');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={28} className="animate-spin text-primary-500" />
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto pt-10">
      <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
        <AlertCircle size={16} /> {error}
      </div>
    </div>
  );

  const cursos = perfil?.cursos || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      {/* Botón volver */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
      >
        <ChevronLeft size={18} /> Volver
      </button>

      {/* Tarjeta del perfil */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-primary-500/20">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 flex items-start gap-6">
          <div className={`w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-black text-2xl shrink-0`}>
            {getInitials(perfil?.nombre || 'M')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-black">{perfil?.nombre}</h2>
              <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <GraduationCap size={12} /> Instructor
              </span>
            </div>
            <p className="text-primary-100 text-sm mt-1">{perfil?.email}</p>
            {perfil?.bio && (
              <p className="text-primary-100 text-sm mt-3 leading-relaxed">{perfil.bio}</p>
            )}
            {/* Estadísticas */}
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <BookOpen size={14} className="text-white/70" />
                <span className="text-sm font-bold">{cursos.length} curso{cursos.length !== 1 ? 's' : ''}</span>
              </div>
              {perfil?.total_estudiantes > 0 && (
                <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-white/70" />
                  <span className="text-sm font-bold">{perfil.total_estudiantes} estudiante{perfil.total_estudiantes !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cursos del creador */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <BookOpen size={20} className="text-primary-500" /> Cursos de {perfil?.nombre?.split(' ')[0]}
        </h3>

        {cursos.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-10 text-center">
            <BookOpen size={36} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Este instructor aún no tiene cursos publicados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {cursos.map(c => {
              const meta = getCat(c.categoria);
              return (
                <div
                  key={c.id}
                  className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div 
                    className={`h-28 bg-gradient-to-br ${meta.color} flex items-center justify-center relative overflow-hidden`}
                    style={c.thumbnail || meta.image ? {
                      backgroundImage: `url(${c.thumbnail || meta.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    } : {}}
                  >
                    {(c.thumbnail || meta.image) && (
                      <div className="absolute inset-0 bg-black/40" />
                    )}
                    <div className="absolute inset-0 opacity-10"
                      style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '25px 25px' }} />
                    <span className="text-4xl z-10 drop-shadow-md">{meta.emoji}</span>
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">{c.titulo}</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {c.modelo_negocio === 'gratis' ? '🎁 Gratis' : `$${c.precio}`}
                      </span>
                      {c.modulos_count > 0 && (
                        <span className="flex items-center gap-1 ml-auto"><Layers size={11} />{c.modulos_count} mód.</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
