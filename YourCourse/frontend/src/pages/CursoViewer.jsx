/**
 * CursoViewer.jsx — Reproductor de clase: videos + ejercicios del curso
 * Accesible desde /creator/cursos/:id/ver
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Play, Pause, SkipForward, SkipBack, ChevronRight,
  ChevronDown, ChevronUp, BookOpen, FileText, Video, Film,
  Check, Clock, Loader2, AlertCircle, ExternalLink, GraduationCap,
  Download, Menu, X,
} from 'lucide-react';
import { api } from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extIcon(url = '') {
  const ext = url.split('.').pop()?.toUpperCase();
  const colors = {
    PDF:  'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    DOCX: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    DOC:  'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    PPTX: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    PPT:  'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    TXT:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };
  return { ext: ext || 'FILE', color: colors[ext] || colors.TXT };
}

import ReactPlayer from 'react-player';

// ─── Reproductor de video principal ──────────────────────────────────────────
function VideoPlayer({ leccion, onEnded }) {
  if (leccion?.iframe_url && leccion.iframe_url.trim()) {
    const urlStr = leccion.iframe_url.trim();
    if (urlStr.toLowerCase().includes('<iframe')) {
      const responsiveIframe = urlStr
        .replace(/width="[0-9]+"/, 'width="100%"')
        .replace(/height="[0-9]+"/, 'height="100%"')
        .replace(/position:\s*absolute/, '');
      return (
        <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative">
          <div 
            className="absolute top-0 left-0 w-full h-full"
            dangerouslySetInnerHTML={{ __html: responsiveIframe }}
          />
        </div>
      );
    } else {
      return (
        <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative">
          <ReactPlayer
            url={urlStr}
            controls={true}
            width="100%"
            height="100%"
            className="absolute top-0 left-0"
          />
        </div>
      );
    }
  }

  if (!leccion?.video_url) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-2xl flex flex-col items-center justify-center gap-4">
        <Film size={48} className="text-gray-700" />
        <p className="text-gray-500 text-sm">Esta lección no tiene video ni reproductor externo</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-black shadow-2xl relative pt-[56.25%]">
      <ReactPlayer
        url={leccion.video_url}
        controls={true}
        width="100%"
        height="100%"
        className="absolute top-0 left-0"
        onEnded={onEnded}
      />
    </div>
  );
}

// ─── Item de lección en la barra lateral ─────────────────────────────────────
function LeccionItem({ leccion, index, isActive, isCompleted, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
        isActive
          ? 'bg-primary-600 text-white'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
      }`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
        isActive
          ? 'bg-white/20 text-white'
          : isCompleted
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
      }`}>
        {isCompleted ? <Check size={13} /> : index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : ''}`}>
          {leccion.titulo}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {leccion.video_url ? (
            <span className={`text-[10px] flex items-center gap-0.5 ${isActive ? 'text-white/60' : 'text-gray-400'}`}><Video size={9} /> Video local</span>
          ) : leccion.iframe_url ? (
            <span className={`text-[10px] flex items-center gap-0.5 ${isActive ? 'text-white/60' : 'text-gray-400'}`}><Video size={9} /> Externo (iFrame)</span>
          ) : (
            <span className={`text-[10px] flex items-center gap-0.5 ${isActive ? 'text-white/60' : 'text-gray-400'}`}><Film size={9} /> Sin video</span>
          )}
        </div>
      </div>
      {isActive && <ChevronRight size={14} className="text-white/60 shrink-0" />}
    </button>
  );
}

// ─── Pestaña Ejercicios en la vista de clase ──────────────────────────────────
function EjerciciosTab({ ejercicios }) {
  if (ejercicios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <FileText size={24} className="text-gray-300 dark:text-gray-600" />
        </div>
        <p className="font-semibold text-gray-500 dark:text-gray-400">Sin ejercicios aún</p>
        <p className="text-sm text-gray-400">El creador del curso no ha subido material de apoyo todavía.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
        Material de apoyo · {ejercicios.length} archivo{ejercicios.length !== 1 ? 's' : ''}
      </p>
      {ejercicios.map((ej, i) => {
        const { ext, color } = extIcon(ej.archivo_url);
        return (
          <a
            key={ej.id}
            href={ej.archivo_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all group"
          >
            <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold text-[10px] ${color}`}>
              <FileText size={18} />
              <span className="mt-0.5">{ext}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {ej.titulo}
              </p>
              {ej.descripcion && <p className="text-xs text-gray-400 mt-0.5 truncate">{ej.descripcion}</p>}
              <p className="text-[11px] text-primary-500 font-medium mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink size={10} /> Abrir / Descargar
              </p>
            </div>
            <Download size={16} className="text-gray-300 dark:text-gray-700 group-hover:text-primary-500 transition-colors shrink-0" />
          </a>
        );
      })}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function CursoViewer() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [curso,      setCurso]      = useState(null);
  const [lecciones,  setLecciones]  = useState([]);
  const [ejercicios, setEjercicios] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [activeIdx,  setActiveIdx]  = useState(0);
  const [completed,  setCompleted]  = useState(new Set());
  const [sidebarTab, setSidebarTab] = useState('lecciones'); // 'lecciones' | 'ejercicios'
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [cursoRes, ejerciciosRes] = await Promise.all([
        api.get(`/cursos/${id}`),
        api.get(`/cursos/${id}/ejercicios`),
      ]);
      setCurso(cursoRes.data);
      setLecciones(cursoRes.data.lecciones || []);
      setEjercicios(ejerciciosRes.data || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeLeccion = lecciones[activeIdx] || null;

  const handlePrev = () => { if (activeIdx > 0) setActiveIdx(activeIdx - 1); };
  const handleNext = () => {
    if (activeIdx < lecciones.length - 1) {
      setCompleted(prev => new Set([...prev, activeLeccion?.id]));
      setActiveIdx(activeIdx + 1);
    }
  };
  const handleVideoEnded = () => {
    setCompleted(prev => new Set([...prev, activeLeccion?.id]));
    if (activeIdx < lecciones.length - 1) {
      // Pausa breve antes de ir a la siguiente
      setTimeout(() => setActiveIdx(i => i + 1), 1500);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
      <Loader2 size={36} className="animate-spin text-primary-500" />
    </div>
  );
  if (error || !curso) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <AlertCircle size={40} className="text-red-400" />
      <p className="text-gray-600 dark:text-gray-400">{error || 'Curso no encontrado.'}</p>
      <button onClick={() => navigate('/creator/cursos')} className="underline text-primary-500 text-sm">Volver</button>
    </div>
  );

  const progressPct = lecciones.length > 0 ? Math.round((completed.size / lecciones.length) * 100) : 0;

  return (
    <div className="flex h-full overflow-hidden bg-gray-50 dark:bg-gray-950 -m-6">

      {/* ── BARRA LATERAL ───────────────────────────────────────────────────── */}
      <aside className={`flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 shrink-0 overflow-hidden ${sidebarOpen ? 'w-80' : 'w-0'}`}>

        {/* Header sidebar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <button onClick={() => navigate(`/creator/cursos/${id}`)} className="flex items-center gap-2 text-xs text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-3">
            <ArrowLeft size={14} /> Volver a gestión
          </button>
          <h2 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">{curso.titulo}</h2>

          {/* Progreso */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
              <span>Progreso</span>
              <span className="font-semibold text-primary-600 dark:text-primary-400">{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-primary-500 to-primary-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        {/* Tabs de la sidebar */}
        <div className="flex border-b border-gray-100 dark:border-gray-800">
          {[
            { key: 'lecciones',  label: `Lecciones (${lecciones.length})` },
            { key: 'ejercicios', label: `Ejercicios (${ejercicios.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setSidebarTab(t.key)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                sidebarTab === t.key
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenido de la sidebar */}
        <div className="flex-1 overflow-y-auto">
          {sidebarTab === 'lecciones' ? (
            lecciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
                <Film size={24} className="text-gray-300 dark:text-gray-700" />
                <p className="text-sm text-gray-400">Sin lecciones</p>
              </div>
            ) : (
              <div className="py-2">
                {lecciones.map((lec, i) => (
                  <LeccionItem
                    key={lec.id}
                    leccion={lec}
                    index={i}
                    isActive={i === activeIdx}
                    isCompleted={completed.has(lec.id)}
                    onClick={() => setActiveIdx(i)}
                  />
                ))}
              </div>
            )
          ) : (
            <EjerciciosTab ejercicios={ejercicios} />
          )}
        </div>
      </aside>

      {/* ── ÁREA PRINCIPAL ───────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-y-auto">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <button onClick={() => setSidebarOpen(p => !p)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
            <Menu size={18} />
          </button>
          <div className="flex-1 min-w-0">
            {activeLeccion && (
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{activeLeccion.titulo}</p>
            )}
            <p className="text-xs text-gray-400">{curso.titulo}</p>
          </div>
          {/* Navegación prev/next */}
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} disabled={activeIdx === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <SkipBack size={13} /> Anterior
            </button>
            <button onClick={handleNext} disabled={activeIdx === lecciones.length - 1}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm shadow-primary-500/20">
              Siguiente <SkipForward size={13} />
            </button>
          </div>
        </div>

        {/* Reproductor */}
        <div className="flex-1 p-6 space-y-5 max-w-4xl mx-auto w-full">

          {lecciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-5 text-center">
              <div className="w-20 h-20 rounded-3xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <GraduationCap size={36} className="text-primary-500" />
              </div>
              <div>
                <p className="font-bold text-gray-700 dark:text-gray-300 text-lg">Sin contenido aún</p>
                <p className="text-sm text-gray-400 mt-1">Este curso no tiene lecciones publicadas.</p>
              </div>
              <button onClick={() => navigate(`/creator/cursos/${id}`)}
                className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm transition-all">
                Ir a agregar lecciones →
              </button>
            </div>
          ) : (
            <>
              {/* Video */}
              <VideoPlayer leccion={activeLeccion} onEnded={handleVideoEnded} />

              {/* Info de la lección */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-primary-500">Lección {activeIdx + 1} de {lecciones.length}</span>
                      {completed.has(activeLeccion?.id) && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                          <Check size={10} /> Completada
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{activeLeccion?.titulo}</h3>
                  </div>
                  {!completed.has(activeLeccion?.id) && activeLeccion?.video_url && (
                    <button
                      onClick={() => setCompleted(prev => new Set([...prev, activeLeccion.id]))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all whitespace-nowrap shrink-0">
                      <Check size={13} /> Marcar completada
                    </button>
                  )}
                </div>

                {/* Lección anterior / siguiente rápido */}
                {lecciones.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
                    {activeIdx > 0 ? (
                      <button onClick={handlePrev} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        <ChevronUp size={16} />
                        <span className="truncate max-w-[180px]">{lecciones[activeIdx - 1]?.titulo}</span>
                      </button>
                    ) : <div />}
                    {activeIdx < lecciones.length - 1 && (
                      <button onClick={handleNext} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors ml-auto">
                        <span className="truncate max-w-[180px]">{lecciones[activeIdx + 1]?.titulo}</span>
                        <ChevronDown size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Ejercicios relacionados (si hay) — acceso rápido */}
              {ejercicios.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                    <FileText size={16} className="text-rose-500" /> Material de apoyo
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ejercicios.map(ej => {
                      const { ext, color } = extIcon(ej.archivo_url);
                      return (
                        <a key={ej.id} href={ej.archivo_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all group">
                          <div className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center text-[9px] font-bold ${color} shrink-0`}>
                            <FileText size={14} />
                            <span>{ext}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{ej.titulo}</p>
                            <p className="text-[10px] text-rose-400 flex items-center gap-0.5 mt-0.5"><Download size={9} /> Descargar</p>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
