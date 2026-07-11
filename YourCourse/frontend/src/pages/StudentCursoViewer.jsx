/**
 * StudentCursoViewer.jsx — Reproductor de cursos para estudiantes
 * 4 tabs: Descripción | Temario | Archivos | Dudas de la Clase
 * Autoplay desactivado. Dudas conectadas al backend.
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import useAuthStore from '../stores/authStore';
import {
  PlayCircle, BookOpen, ChevronLeft, Layers, Paperclip,
  MessageSquare, Send, Loader2, CheckCircle, AlertCircle,
  ExternalLink,
} from 'lucide-react';
import ReactPlayer from 'react-player';

/* ─── Tabs ─────────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'descripcion', label: 'Descripción',    Icon: BookOpen      },
  { id: 'temario',     label: 'Temario',         Icon: Layers        },
  { id: 'archivos',    label: 'Archivos',        Icon: Paperclip     },
  { id: 'dudas',       label: 'Dudas de Clase',  Icon: MessageSquare },
];

/* ─── Panel de Dudas ───────────────────────────────────────────────────────── */
function DudasPanel({ leccionId, cursoId }) {
  const user = useAuthStore(s => s.user);
  const [dudas, setDudas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [texto, setTexto] = useState('');
  const [sending, setSending] = useState(false);

  const fetchDudas = useCallback(async () => {
    if (!leccionId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/dudas/leccion/${leccionId}`);
      setDudas(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [leccionId]);

  useEffect(() => { fetchDudas(); }, [fetchDudas]);

  const handleSend = async () => {
    if (!texto.trim()) return;
    setSending(true);
    try {
      await api.post('/dudas', {
        curso_id:    cursoId,
        leccion_id:  leccionId,
        pregunta:    texto.trim(),
      });
      setTexto('');
      fetchDudas();
    } catch (err) {
      alert(err.message || 'Error al enviar la duda.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <Loader2 size={20} className="animate-spin text-primary-500" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Formulario enviar duda */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">¿Tienes una pregunta sobre esta lección?</p>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          rows={3}
          placeholder="Escribe tu duda aquí..."
          className="w-full px-4 py-3 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none transition-all"
        />
        <div className="flex justify-end">
          <button
            onClick={handleSend}
            disabled={sending || !texto.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold disabled:opacity-50 transition-all active:scale-95"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Enviar duda
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Lista de dudas */}
      <div className="space-y-4">
        {dudas.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare size={32} className="mx-auto text-gray-200 dark:text-gray-700 mb-2" />
            <p className="text-sm text-gray-400">Sé el primero en preguntar sobre esta lección</p>
          </div>
        ) : (
          dudas.map(d => (
            <div key={d.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
              {/* Pregunta */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {(d.estudiante_nombre || 'E').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{d.estudiante_nombre || 'Estudiante'}</span>
                    <span className="text-[10px] text-gray-400">{d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{d.pregunta}</p>
                </div>
              </div>

              {/* Respuesta del maestro */}
              {d.respuesta ? (
                <div className="ml-11 bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 border border-primary-100 dark:border-primary-800">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle size={12} className="text-primary-500" />
                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400">Respuesta del instructor</span>
                    {d.respondida_en && (
                      <span className="text-[10px] text-gray-400">{new Date(d.respondida_en).toLocaleDateString()}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{d.respuesta}</p>
                </div>
              ) : (
                <div className="ml-11 text-xs text-gray-400 italic">Sin respuesta aún — el instructor será notificado.</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Página principal ─────────────────────────────────────────────────────── */
export default function StudentCursoViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [curso, setCurso] = useState(null);
  const [todasLecciones, setTodasLecciones] = useState([]);
  const [leccionActiva, setLeccionActiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('descripcion');

  useEffect(() => {
    async function fetchCursoData() {
      try {
        const res = await api.get(`/cursos/${id}`);
        setCurso(res.data);

        // Extraer lecciones directamente (YourCourse usa un esquema plano de lecciones)
        const lecciones = res.data.lecciones || [];
        setTodasLecciones(lecciones);
        if (lecciones.length > 0) setLeccionActiva(lecciones[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCursoData();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-primary-500" />
        <p className="text-gray-400 text-sm">Cargando curso...</p>
      </div>
    </div>
  );
  if (!curso) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-red-500">Curso no encontrado</p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-900 overflow-hidden">
      {/* Top Navbar */}
      <header className="h-14 bg-gray-950 border-b border-gray-800 flex items-center px-4 gap-4 shrink-0">
        <button
          onClick={() => navigate('/student/cursos')}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ChevronLeft size={18} /> Mis Cursos
        </button>
        <div className="h-4 w-px bg-gray-700" />
        <h1 className="text-sm font-bold text-white truncate flex-1">{curso.titulo}</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Área principal (Video + Tabs) ──────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {/* Player */}
          <div className="bg-black w-full relative" style={{ paddingTop: '56.25%' }}>
            {(() => {
              if (leccionActiva?.iframe_url && leccionActiva.iframe_url.trim()) {
                const urlStr = leccionActiva.iframe_url.trim();
                if (urlStr.startsWith('<iframe')) {
                  // Ajustar iframe para ser responsivo dentro de nuestro div
                  const responsiveIframe = urlStr
                    .replace(/width="[0-9]+"/, 'width="100%"')
                    .replace(/height="[0-9]+"/, 'height="100%"')
                    .replace(/position:\s*absolute/, '');
                  return (
                    <div 
                      className="absolute top-0 left-0 w-full h-full"
                      dangerouslySetInnerHTML={{ __html: responsiveIframe }}
                    />
                  );
                } else {
                  return (
                    <ReactPlayer
                      url={urlStr}
                      controls={true}
                      playing={false}
                      width="100%"
                      height="100%"
                      className="absolute top-0 left-0"
                    />
                  );
                }
              } else if (leccionActiva?.video_url) {
                return (
                  <ReactPlayer
                    url={leccionActiva.video_url}
                    controls={true}
                    playing={false}
                    width="100%"
                    height="100%"
                    className="absolute top-0 left-0"
                  />
                );
              } else {
                return (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-gray-500 flex-col gap-4 bg-gray-950">
                    <PlayCircle size={64} className="text-gray-700" />
                    <p className="text-sm text-gray-500">Esta lección no tiene video ni reproductor externo</p>
                  </div>
                );
              }
            })()}
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <div className="flex px-4 space-x-1 overflow-x-auto">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3.5 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.Icon size={15} /> {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 max-w-4xl">
            {activeTab === 'descripcion' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {leccionActiva?.titulo || 'Selecciona una lección'}
                </h2>
                {leccionActiva?.modulo_nombre && (
                  <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                    {leccionActiva.modulo_nombre}
                  </span>
                )}
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {leccionActiva?.descripcion || 'El instructor no ha agregado una descripción para esta lección.'}
                </p>
                {leccionActiva?.recursos_url && (
                  <a
                    href={leccionActiva.recursos_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 text-sm font-semibold hover:underline"
                  >
                    <ExternalLink size={14} /> Recursos de la lección
                  </a>
                )}
              </div>
            )}

            {activeTab === 'temario' && (
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Contenido del curso ({todasLecciones.length} lecciones)
                </h3>
                {todasLecciones.length === 0 ? (
                  <p className="text-sm text-gray-400">El instructor no ha cargado el temario aún.</p>
                ) : (
                  todasLecciones.map((l, i) => (
                    <button
                      key={l.id || i}
                      onClick={() => { setLeccionActiva(l); setActiveTab('descripcion'); }}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        leccionActiva?.id === l.id
                          ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800'
                          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-100 dark:border-gray-700'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        leccionActiva?.id === l.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          leccionActiva?.id === l.id
                            ? 'text-primary-700 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {l.titulo}
                        </p>
                        {l.modulo_nombre && (
                          <p className="text-xs text-gray-400 truncate">{l.modulo_nombre}</p>
                        )}
                      </div>
                      <PlayCircle size={16} className={leccionActiva?.id === l.id ? 'text-primary-500' : 'text-gray-300'} />
                    </button>
                  ))
                )}
              </div>
            )}

            {activeTab === 'archivos' && (
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 dark:text-white">Material de apoyo</h3>
                {curso.archivos && curso.archivos.length > 0 ? (
                  curso.archivos.map((a, i) => (
                    <a
                      key={i}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group"
                    >
                      <Paperclip size={16} className="text-gray-400 group-hover:text-primary-500 transition-colors" />
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{a.nombre || `Archivo ${i + 1}`}</span>
                      <ExternalLink size={14} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
                    </a>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Paperclip size={32} className="mx-auto text-gray-200 dark:text-gray-700 mb-2" />
                    <p className="text-sm text-gray-400">El instructor no ha cargado archivos de apoyo aún</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'dudas' && leccionActiva && (
              <DudasPanel leccionId={leccionActiva.id} cursoId={id} />
            )}
            {activeTab === 'dudas' && !leccionActiva && (
              <div className="text-center py-8 text-gray-400 text-sm">
                Selecciona una lección para ver o enviar dudas
              </div>
            )}
          </div>
        </main>

        {/* ── Sidebar de lecciones ──────────────────────────────────────────── */}
        <aside className="w-72 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col shrink-0 hidden lg:flex">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">Contenido</h2>
            <p className="text-xs text-gray-400 mt-0.5">{todasLecciones.length} lecciones</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {todasLecciones.map((l, i) => (
              <button
                key={l.id || i}
                onClick={() => { setLeccionActiva(l); setActiveTab('descripcion'); }}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-start gap-3 ${
                  leccionActiva?.id === l.id
                    ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  <PlayCircle
                    size={16}
                    className={leccionActiva?.id === l.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-300 dark:text-gray-600'}
                  />
                </div>
                <div className="min-w-0">
                  <h4 className={`text-xs font-medium leading-tight ${
                    leccionActiva?.id === l.id
                      ? 'text-primary-700 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {i + 1}. {l.titulo}
                  </h4>
                  {l.modulo_nombre && (
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{l.modulo_nombre}</p>
                  )}
                </div>
              </button>
            ))}

            {todasLecciones.length === 0 && (
              <div className="text-center py-8">
                <Layers size={24} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                <p className="text-xs text-gray-400">Sin lecciones cargadas</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
