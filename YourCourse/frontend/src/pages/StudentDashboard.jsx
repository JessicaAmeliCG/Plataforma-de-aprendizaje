import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, AlertCircle, Plus, Layers, GraduationCap } from 'lucide-react';
import { api } from '../services/api';
import useAuthStore from '../stores/authStore';
import { useT } from '../contexts/I18nContext';

function CursoCard({ curso, isEnrolled, onEnroll }) {
  const navigate = useNavigate();
  const t = useT();

  return (
    <div className="group relative flex flex-col bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className={`h-32 bg-gradient-to-br ${curso.gradient_class || 'from-primary-600 to-primary-700'} flex items-center justify-center relative overflow-hidden`}>
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
          <span className="font-bold text-gray-900 dark:text-white">{curso.modelo_negocio === 'gratis' ? t('student.free') : `$${curso.precio}`}</span>
          {curso.modulos_count > 0 && <span className="flex items-center gap-1 ml-auto"><Layers size={11} />{t('student.modules', { n: curso.modulos_count })}</span>}
        </div>
      </div>
      
      {/* Overlay action */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
        {isEnrolled ? (
          <button onClick={() => navigate(`/student/cursos/${curso.id}/ver`)} className="bg-white text-gray-900 px-4 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">
            {t('student.continue')}
          </button>
        ) : (
          <button onClick={() => onEnroll(curso.id)} className="bg-primary-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">
            {t('student.enroll')}
          </button>
        )}
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const t = useT();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [misCursos, setMisCursos] = useState([]);
  const [cursosPublicos, setCursosPublicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [verificandoPago, setVerificandoPago] = useState(false);

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

  // Verificar pago si venimos de Stripe
  useEffect(() => {
    const session_id = searchParams.get('session_id');
    if (session_id) {
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
        .finally(() => {
          setVerificandoPago(false);
        });
    }
  }, [searchParams, setSearchParams, fetchData]);

  const handleEnroll = async (curso) => {
    try {
      if (curso.modelo_negocio === 'gratis' || curso.precio <= 0) {
        // Inscripción directa
        await api.post('/estudiantes/inscribir', { curso_id: curso.id });
        fetchData();
      } else {
        // Pago con Stripe
        const res = await api.post('/pagos/create-checkout-session', { curso_id: curso.id });
        if (res.url) {
          window.location.href = res.url; // Redirigir a Stripe
        }
      }
    } catch (err) {
      alert(err.message || 'Error al procesar la inscripción.');
    }
  };

  const misCursosIds = new Set(misCursos.map(c => c.id));
  const disponibles = cursosPublicos.filter(c => !misCursosIds.has(c.id));

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-8 text-white shadow-xl shadow-primary-500/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"
             style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10">
           <h2 className="text-3xl font-black mb-2">{t('student.dashboardTitle', { name: user?.nombre?.split(' ')[0] || '' })}</h2>
           <p className="text-primary-100 text-sm">{t('student.dashboardSubtitle')}</p>
        </div>
      </div>

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
              <BookOpen size={20} className="text-primary-500" /> {t('student.myCourses')}
            </h3>
            {misCursos.length === 0 ? (
               <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center">
                 <GraduationCap size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                 <p className="text-gray-500 dark:text-gray-400 font-medium">{t('student.noCourses')}</p>
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
              <Plus size={20} className="text-emerald-500" /> {t('student.availableCourses')}
            </h3>
            {disponibles.length === 0 ? (
               <p className="text-gray-500 dark:text-gray-400 text-sm">{t('student.noAvailable')}</p>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                 {disponibles.map(c => (
                   <CursoCard key={c.id} curso={c} isEnrolled={false} onEnroll={() => handleEnroll(c)} />
                 ))}
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
