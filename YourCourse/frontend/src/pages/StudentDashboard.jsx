import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, AlertCircle, Plus, Layers, GraduationCap } from 'lucide-react';
import { api } from '../services/api';
import useAuthStore from '../stores/authStore';

function CursoCard({ curso, isEnrolled, onEnroll }) {
  const navigate = useNavigate();

  return (
    <div className="group relative flex flex-col bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className={`h-32 bg-gradient-to-br ${curso.gradient_class || 'from-blue-600 to-cyan-700'} flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '25px 25px' }} />
        <BookOpen size={32} className="text-white/50" />
      </div>
      
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">
          {curso.titulo}
        </h3>
        {curso.descripcion && (
          <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 leading-relaxed">
            {curso.descripcion}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-auto pt-2 border-t border-gray-100 dark:border-gray-800">
          <span className="font-bold text-gray-900 dark:text-white">{curso.modelo_negocio === 'gratis' ? 'GRATIS' : `$${curso.precio}`}</span>
          {curso.modulos_count > 0 && <span className="flex items-center gap-1 ml-auto"><Layers size={11} />{curso.modulos_count} mód.</span>}
        </div>
      </div>
      
      {/* Overlay action */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
        {isEnrolled ? (
          <button onClick={() => navigate(`/student/cursos/${curso.id}/ver`)} className="bg-white text-gray-900 px-4 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">
            Continuar
          </button>
        ) : (
          <button onClick={() => onEnroll(curso.id)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">
            Inscribirme
          </button>
        )}
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [misCursos, setMisCursos] = useState([]);
  const [cursosPublicos, setCursosPublicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Usamos el endpoint de estudiante para sacar sus inscritos y el endpoint de publicos
      const [estRes, pubRes] = await Promise.all([
        api.get(`/estudiantes/${user.id}`),
        api.get('/cursos/publicos')
      ]);
      setMisCursos(estRes.data.cursos || []);
      setCursosPublicos(pubRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEnroll = async (cursoId) => {
    try {
      await api.post('/estudiantes/inscribir', { curso_id: cursoId });
      // Refetch
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const misCursosIds = new Set(misCursos.map(c => c.id));
  const disponibles = cursosPublicos.filter(c => !misCursosIds.has(c.id));

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
      <div className="bg-gradient-to-br from-blue-600 to-cyan-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"
             style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10">
           <h2 className="text-3xl font-black mb-2">¡Hola, {user?.nombre?.split(' ')[0]}! 🎓</h2>
           <p className="text-blue-100 text-sm">Continúa tu aprendizaje donde lo dejaste.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />{error}
          <button onClick={fetchData} className="ml-auto underline text-xs">Reintentar</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
             <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-blue-500" /> Mis Cursos
            </h3>
            {misCursos.length === 0 ? (
               <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center">
                 <GraduationCap size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                 <p className="text-gray-500 dark:text-gray-400 font-medium">No estás inscrito en ningún curso aún.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                 {misCursos.map(c => (
                   <CursoCard key={c.id} curso={c} isEnrolled={true} />
                 ))}
               </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Plus size={20} className="text-emerald-500" /> Cursos Disponibles
            </h3>
            {disponibles.length === 0 ? (
               <p className="text-gray-500 dark:text-gray-400 text-sm">Ya estás inscrito en todos los cursos disponibles o no hay nuevos cursos.</p>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                 {disponibles.map(c => (
                   <CursoCard key={c.id} curso={c} isEnrolled={false} onEnroll={handleEnroll} />
                 ))}
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
