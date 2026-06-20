import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { PlayCircle, CheckCircle, MessageSquare, BookOpen, ChevronLeft } from 'lucide-react';

export default function StudentCursoViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [curso, setCurso] = useState(null);
  const [lecciones, setLecciones] = useState([]);
  const [leccionActiva, setLeccionActiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('descripcion');

  useEffect(() => {
    async function fetchCursoData() {
      try {
        const res = await api.get(`/cursos/${id}`);
        setCurso(res.data);
        
        // Asumiendo que el endpoint devuelve los modulos/lecciones
        // O simulamos si no vienen
        if (res.data.modulos && res.data.modulos.length > 0 && res.data.modulos[0].lecciones) {
          setLecciones(res.data.modulos[0].lecciones);
          setLeccionActiva(res.data.modulos[0].lecciones[0]);
        } else {
          // Fallback temporal si no hay lecciones
          setLecciones([{ id: 1, titulo: 'Introducción', video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', descripcion: 'Bienvenido al curso.' }]);
          setLeccionActiva({ id: 1, titulo: 'Introducción', video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', descripcion: 'Bienvenido al curso.' });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCursoData();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Cargando curso...</div>;
  if (!curso) return <div className="p-8 text-center text-red-500">Curso no encontrado</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden animate-fade-in-up">
      {/* Top Navbar */}
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 shrink-0">
        <button onClick={() => navigate('/student/dashboard')} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 hover-bounce">
          <ChevronLeft size={24} /> Volver al Dashboard
        </button>
        <h1 className="ml-4 font-bold text-lg text-gray-900 dark:text-white truncate">
          {curso.titulo}
        </h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area (Video + Tabs) */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {/* Video Player */}
          <div className="bg-black aspect-video w-full relative group">
            {leccionActiva?.video_url ? (
              <video 
                src={leccionActiva.video_url} 
                controls 
                className="w-full h-full object-contain"
                controlsList="nodownload"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 flex-col gap-4">
                <PlayCircle size={64} className="hover-scale" />
                <p>No hay video disponible para esta lección</p>
              </div>
            )}
          </div>

          {/* Tabs Container */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <div className="flex px-4 space-x-6">
              {[
                { id: 'descripcion', label: 'Descripción', icon: BookOpen },
                { id: 'preguntas', label: 'Preguntas', icon: MessageSquare },
                { id: 'notas', label: 'Mis Notas', icon: CheckCircle }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium transition-colors hover-bounce ${
                    activeTab === t.id 
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <t.icon size={18} /> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'descripcion' && (
              <div className="prose dark:prose-invert max-w-none">
                <h2 className="text-2xl font-bold mb-4">{leccionActiva?.titulo}</h2>
                <p>{leccionActiva?.descripcion || 'No hay descripción disponible para esta lección.'}</p>
              </div>
            )}
            
            {activeTab === 'preguntas' && (
              <div>
                <h3 className="font-bold mb-4">Preguntas de la comunidad</h3>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl">
                  <p className="text-sm text-gray-500">Aún no hay preguntas. ¡Sé el primero en preguntar!</p>
                  <textarea className="w-full mt-4 p-3 rounded-lg border dark:bg-gray-900 dark:border-gray-700" placeholder="Escribe tu pregunta aquí..." rows="3"></textarea>
                  <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover-scale">Enviar pregunta</button>
                </div>
              </div>
            )}

            {activeTab === 'notas' && (
              <div>
                <h3 className="font-bold mb-4">Mis notas personales</h3>
                <textarea className="w-full p-4 rounded-xl border dark:bg-gray-800 dark:border-gray-700 h-64 focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Escribe tus apuntes aquí... se guardarán automáticamente."></textarea>
              </div>
            )}
          </div>
        </main>

        {/* Sidebar (Syllabus) */}
        <aside className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-bold text-gray-900 dark:text-white">Contenido del Curso</h2>
            <div className="mt-2 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-3 py-1 rounded-full inline-block">
              1 / {lecciones.length} Completado
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {lecciones.map((l, index) => (
              <button
                key={l.id || index}
                onClick={() => setLeccionActiva(l)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-start gap-3 hover-scale ${
                  leccionActiva?.id === l.id 
                    ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                }`}
              >
                <div className="mt-0.5 text-gray-400">
                  <PlayCircle size={18} className={leccionActiva?.id === l.id ? 'text-blue-600 animate-pulse' : ''} />
                </div>
                <div>
                  <h4 className={`text-sm font-medium ${leccionActiva?.id === l.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {index + 1}. {l.titulo}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">10:00 min</p>
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
