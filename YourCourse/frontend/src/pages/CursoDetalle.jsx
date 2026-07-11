/**
 * CursoDetalle.jsx — Detalle del curso con tabs: Lecciones | Ejercicios
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Users, Clock, ChevronUp, ChevronDown,
  Upload, Trash2, Play, Edit3, Check, X, Plus, Loader2,
  AlertCircle, Video, Film, FileText, Download, Eye, GraduationCap, Mail, Send
} from 'lucide-react';
import { api } from '../services/api';
import { useT } from '../contexts/I18nContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ProgressBar({ progress }) {
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
      <div
        className="h-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function EstadoBadge({ estado }) {
  const t = useT();
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
      estado === 'publicado'
        ? 'bg-emerald-500/30 text-emerald-100'
        : 'bg-white/20 text-white/80'
    }`}>
      {estado === 'publicado' ? t('creator.badgePublished') : t('creator.badgeDraft')}
    </span>
  );
}

function VisibilidadBadge({ visibilidad }) {
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
      visibilidad === 'publico'
        ? 'bg-blue-500/30 text-blue-100'
        : 'bg-gray-500/30 text-gray-100'
    }`}>
      {visibilidad === 'publico' ? 'Público' : 'Privado'}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// TAB: LECCIONES
// ──────────────────────────────────────────────────────────────────────────────
function VideoPlayer({ src }) {
  return (
    <div className="rounded-2xl overflow-hidden bg-black">
      <video src={src} className="w-full max-h-64 object-contain" controls />
    </div>
  );
}

function LeccionRow({ leccion, index, total, onMoveUp, onMoveDown, onDelete, onRename, previewUrl, onPreview }) {
  const t = useT();
  const [editando, setEditando]       = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState(leccion.titulo);
  const [guardando, setGuardando]     = useState(false);

  const handleSave = async () => {
    if (!nuevoTitulo.trim() || nuevoTitulo === leccion.titulo) { setEditando(false); setNuevoTitulo(leccion.titulo); return; }
    setGuardando(true);
    await onRename(leccion.id, nuevoTitulo.trim());
    setGuardando(false); setEditando(false);
  };

  const hasVideo = !!leccion.video_url || !!leccion.iframe_url;
  const isActive = previewUrl === leccion.video_url && leccion.video_url;

  return (
    <div className={`group flex items-start gap-3 p-4 rounded-2xl border transition-all duration-200 ${
      isActive
        ? 'border-primary-400 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/10 shadow-md'
        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm'
    }`}>
      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
        <span className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">{index + 1}</span>
        <button onClick={onMoveUp} disabled={index === 0} className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all"><ChevronUp size={14} /></button>
        <button onClick={onMoveDown} disabled={index === total - 1} className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all"><ChevronDown size={14} /></button>
      </div>

      <button onClick={() => leccion.video_url && onPreview(leccion.video_url)} disabled={!leccion.video_url}
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
          leccion.video_url ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-sm hover:shadow-primary-500/30 hover:scale-105 cursor-pointer' : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-default'
        }`}>
        {leccion.video_url ? <Play size={18} fill="white" /> : <Film size={18} />}
      </button>

      <div className="flex-1 min-w-0">
        {editando ? (
          <div className="flex items-center gap-2">
            <input autoFocus value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditando(false); setNuevoTitulo(leccion.titulo); } }}
              className="flex-1 text-sm font-medium bg-white dark:bg-gray-800 border border-primary-400 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" maxLength={120} />
            <button onClick={handleSave} disabled={guardando} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors">{guardando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}</button>
            <button onClick={() => { setEditando(false); setNuevoTitulo(leccion.titulo); }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X size={15} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{leccion.titulo}</p>
            <button onClick={() => setEditando(true)} title={t('creator.rename')} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-all"><Edit3 size={13} /></button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {leccion.video_url ? (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1"><Video size={10} /> Video local subido</span>
          ) : leccion.iframe_url ? (
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1"><Video size={10} /> Enlace externo / iFrame</span>
          ) : (
            <span className="text-[11px] text-gray-400 flex items-center gap-1"><Video size={10} /> {t('creator.noVideo')}</span>
          )}
          {leccion.duracion && <span className="text-[11px] text-gray-400">· <Clock size={10} className="inline" /> {leccion.duracion}</span>}
          {leccion.video_url && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(window.location.origin + leccion.video_url);
                alert('¡Enlace de video copiado al portapapeles!');
              }}
              className="text-[10px] text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-0.5 ml-2 cursor-pointer font-bold"
            >
              (Copiar enlace)
            </button>
          )}
          {leccion.iframe_url && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(leccion.iframe_url);
                alert('¡Código iFrame / URL copiado al portapapeles!');
              }}
              className="text-[10px] text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-0.5 ml-2 cursor-pointer font-bold"
            >
              (Copiar código/URL)
            </button>
          )}
        </div>
      </div>
      <button onClick={() => onDelete(leccion.id)} title={t('creator.delete')} className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all shrink-0"><Trash2 size={15} /></button>
    </div>
  );
}

function VideoUploadZone({ cursoId, onSuccess }) {
  const t = useT();
  const [titulo, setTitulo]       = useState('');
  const [sourceType, setSourceType] = useState('file'); // 'file' o 'iframe'
  const [archivo, setArchivo]     = useState(null);
  const [iframeUrl, setIframeUrl] = useState('');
  const [progress, setProgress]   = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const fileRef = useRef(null);

  const handleFile = (f) => { setArchivo(f); if (!titulo) setTitulo(f.name.replace(/\.[^.]+$/, '')); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) { setError(t('creator.titleRequired')); return; }
    if (sourceType === 'iframe' && !iframeUrl.trim()) { setError('La URL o código iFrame es requerido.'); return; }
    
    setUploading(true); setProgress(0); setError('');
    try {
      const fd = new FormData();
      fd.append('titulo', titulo.trim());
      if (sourceType === 'file' && archivo) {
        fd.append('video', archivo);
      } else if (sourceType === 'iframe') {
        fd.append('iframe_url', iframeUrl.trim());
      }
      
      const res = await api.upload(`/cursos/${cursoId}/lecciones`, fd, pct => setProgress(pct));
      onSuccess(res.data);
      setTitulo(''); setArchivo(null); setIframeUrl(''); setProgress(0);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) { setError(err.message); }
    finally { setUploading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('creator.title')} <span className="text-red-400">*</span></label>
        <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder={t('creator.lessonTitleEx')} maxLength={120}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
      </div>

      {/* Selectores de tipo de fuente */}
      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => { setSourceType('file'); setError(''); }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${sourceType === 'file' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
        >
          Subir archivo (.mp4)
        </button>
        <button
          type="button"
          onClick={() => { setSourceType('iframe'); setError(''); }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${sourceType === 'iframe' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
        >
          Reproductor externo (iFrame / URL)
        </button>
      </div>

      {sourceType === 'file' ? (
        <div onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }} onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${archivo ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10'}`}>
          <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska,video/x-msvideo,.mp4,.webm,.mov,.mkv,.avi" className="hidden" onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
          {archivo ? (
            <div className="flex flex-col items-center gap-2">
              <Film size={24} className="text-primary-500" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-xs">{archivo.name}</p>
              <p className="text-xs text-gray-400">{(archivo.size / (1024 * 1024)).toFixed(1)} MB · clic para cambiar</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={22} className="text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('creator.dragOrSelectVideo')}</p>
              <p className="text-xs text-gray-400">{t('creator.videoFormatsMax')}</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Código iframe o URL directa (YouTube, Vimeo, etc.)</label>
          <textarea
            value={iframeUrl}
            onChange={e => setIframeUrl(e.target.value)}
            placeholder="Pegar enlace de YouTube/Vimeo o código <iframe ...></iframe>"
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition resize-none"
          />
        </div>
      )}

      {uploading && progress > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500"><span className="flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> {t('creator.uploading')}</span><span className="font-semibold">{progress}%</span></div>
          <ProgressBar progress={progress} />
        </div>
      )}
      {error && <p className="text-sm text-red-500 flex items-center gap-1.5"><AlertCircle size={14} />{error}</p>}
      <button type="submit" disabled={uploading} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-500 hover:to-primary-500 disabled:opacity-60 text-white font-semibold text-sm shadow-lg shadow-primary-500/25 transition-all active:scale-95">
        {uploading ? <><Loader2 size={16} className="animate-spin" /> Procesando lección...</> : <><Plus size={16} /> {t('creator.addLesson')}</>}
      </button>
    </form>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// TAB: EJERCICIOS (PDFs)
// ──────────────────────────────────────────────────────────────────────────────
function EjercicioRow({ ejercicio, index, onDelete, onRename }) {
  const t = useT();
  const [editando, setEditando]       = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState(ejercicio.titulo);
  const [guardando, setGuardando]     = useState(false);

  const ext = ejercicio.archivo_url?.split('.').pop()?.toUpperCase() || 'PDF';
  const extColor = {
    PDF: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    DOC: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    DOCX: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    PPT: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    PPTX: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    TXT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  const handleSave = async () => {
    if (!nuevoTitulo.trim() || nuevoTitulo === ejercicio.titulo) { setEditando(false); setNuevoTitulo(ejercicio.titulo); return; }
    setGuardando(true);
    await onRename(ejercicio.id, nuevoTitulo.trim());
    setGuardando(false); setEditando(false);
  };

  return (
    <div className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm transition-all">
      {/* Número */}
      <span className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">{index + 1}</span>

      {/* Ícono */}
      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold text-[10px] ${extColor[ext] || extColor.PDF}`}>
        <FileText size={18} />
        <span className="mt-0.5">{ext}</span>
      </div>

      {/* Título */}
      <div className="flex-1 min-w-0">
        {editando ? (
          <div className="flex items-center gap-2">
            <input autoFocus value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditando(false); setNuevoTitulo(ejercicio.titulo); } }}
              className="flex-1 text-sm font-medium bg-white dark:bg-gray-800 border border-primary-400 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <button onClick={handleSave} disabled={guardando} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/20">{guardando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}</button>
            <button onClick={() => { setEditando(false); setNuevoTitulo(ejercicio.titulo); }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={15} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{ejercicio.titulo}</p>
            <button onClick={() => setEditando(true)} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-all"><Edit3 size={13} /></button>
          </div>
        )}
        {ejercicio.descripcion && <p className="text-xs text-gray-400 mt-0.5 truncate">{ejercicio.descripcion}</p>}
        <p className="text-[11px] text-gray-400 mt-0.5">{ejercicio.created_at?.slice(0, 10)}</p>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 shrink-0">
        {ejercicio.archivo_url && (
          <a href={ejercicio.archivo_url} target="_blank" rel="noreferrer"
            className="p-2 rounded-xl text-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-colors" title="Ver / Descargar">
            <Eye size={16} />
          </a>
        )}
        <button onClick={() => onDelete(ejercicio.id)} className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all" title={t('creator.delete')}><Trash2 size={15} /></button>
      </div>
    </div>
  );
}

function PdfUploadZone({ cursoId, onSuccess }) {
  const t = useT();
  const [titulo, setTitulo]         = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo]       = useState(null);
  const [progress, setProgress]     = useState(0);
  const [uploading, setUploading]   = useState(false);
  const [error, setError]           = useState('');
  const fileRef = useRef(null);

  const handleFile = (f) => { setArchivo(f); if (!titulo) setTitulo(f.name.replace(/\.[^.]+$/, '')); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!archivo)        { setError('Selecciona un archivo.'); return; }
    if (!titulo.trim())  { setError(t('creator.titleRequired')); return; }
    setUploading(true); setProgress(0); setError('');
    try {
      const fd = new FormData();
      fd.append('titulo', titulo.trim());
      fd.append('descripcion', descripcion.trim());
      fd.append('archivo', archivo);
      const res = await api.upload(`/cursos/${cursoId}/ejercicios`, fd, pct => setProgress(pct));
      onSuccess(res.data);
      setTitulo(''); setDescripcion(''); setArchivo(null); setProgress(0);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) { setError(err.message); }
    finally { setUploading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('creator.title')} <span className="text-red-400">*</span></label>
        <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder={t('creator.exerciseTitleEx')} maxLength={120}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('creator.descOptional')}</label>
        <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder={t('creator.exerciseDescEx')} maxLength={200}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
      </div>
      <div onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }} onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${archivo ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-900/10'}`}>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" className="hidden" onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
        {archivo ? (
          <div className="flex flex-col items-center gap-2">
            <FileText size={24} className="text-rose-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-xs">{archivo.name}</p>
            <p className="text-xs text-gray-400">{(archivo.size / (1024 * 1024)).toFixed(2)} MB · clic para cambiar</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={22} className="text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('creator.dragOrSelectFile')}</p>
            <p className="text-xs text-gray-400">{t('creator.fileFormatsMax')}</p>
          </div>
        )}
      </div>
      {uploading && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500"><span className="flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> {t('creator.uploading')}</span><span className="font-semibold">{progress}%</span></div>
          <ProgressBar progress={progress} />
        </div>
      )}
      {error && <p className="text-sm text-red-500 flex items-center gap-1.5"><AlertCircle size={14} />{error}</p>}
      <button type="submit" disabled={uploading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 disabled:opacity-60 text-white font-semibold text-sm shadow-lg shadow-rose-500/25 transition-all active:scale-95">
        {uploading ? <><Loader2 size={16} className="animate-spin" /> {t('creator.uploading')} {progress}%</> : <><Plus size={16} /> {t('creator.addExercise')}</>}
      </button>
    </form>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ──────────────────────────────────────────────────────────────────────────────
export default function CursoDetalle() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const t = useT();
  const [tab,         setTab]         = useState('lecciones'); // 'lecciones' | 'ejercicios' | 'estudiantes'
  const [curso,       setCurso]       = useState(null);
  const [lecciones,   setLecciones]   = useState([]);
  const [ejercicios,  setEjercicios]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [previewUrl,  setPreviewUrl]  = useState(null);
  const [panelOpen,   setPanelOpen]   = useState(false);
  const [reordering,  setReordering]  = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting,    setInviting]    = useState(false);
  const [inviteMsg,   setInviteMsg]   = useState({ type: '', text: '' });

  const fetchCurso = useCallback(async () => {
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

  useEffect(() => { fetchCurso(); }, [fetchCurso]);

  // Reordenar lecciones
  const persistOrder = async (newList) => {
    setReordering(true);
    try { await api.put(`/cursos/${id}/lecciones/reorder`, { ids: newList.map(l => l.id) }); }
    catch (err) { console.error(err); }
    finally { setReordering(false); }
  };

  const handleMoveUp = async (i) => {
    if (i === 0) return;
    const newList = [...lecciones];
    [newList[i - 1], newList[i]] = [newList[i], newList[i - 1]];
    setLecciones(newList); await persistOrder(newList);
  };
  const handleMoveDown = async (i) => {
    if (i === lecciones.length - 1) return;
    const newList = [...lecciones];
    [newList[i], newList[i + 1]] = [newList[i + 1], newList[i]];
    setLecciones(newList); await persistOrder(newList);
  };
  const handleRenombarLeccion = async (lecId, nuevoTitulo) => {
    try {
      const fd = new FormData(); fd.append('titulo', nuevoTitulo);
      const res = await api.uploadPatch(`/cursos/${id}/lecciones/${lecId}`, fd);
      setLecciones(prev => prev.map(l => l.id === lecId ? res.data : l));
    } catch (err) { alert(err.message); }
  };
  const handleDeleteLeccion = async (lecId) => {
    if (!confirm(t('creator.confirmDeleteLesson'))) return;
    try {
      await api.delete(`/cursos/${id}/lecciones/${lecId}`);
      setLecciones(prev => prev.filter(l => l.id !== lecId));
      if (previewUrl && lecciones.find(l => l.id === lecId)?.video_url === previewUrl) setPreviewUrl(null);
    } catch (err) { alert(err.message); }
  };

  // Ejercicios
  const handleRenombarEjercicio = async (ejId, nuevoTitulo) => {
    try {
      const res = await api.patch(`/cursos/${id}/ejercicios/${ejId}`, { titulo: nuevoTitulo });
      setEjercicios(prev => prev.map(e => e.id === ejId ? res.data : e));
    } catch (err) { alert(err.message); }
  };
  const handleDeleteEjercicio = async (ejId) => {
    if (!confirm(t('creator.confirmDeleteExercise'))) return;
    try {
      await api.delete(`/cursos/${id}/ejercicios/${ejId}`);
      setEjercicios(prev => prev.filter(e => e.id !== ejId));
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary-500" /></div>;
  if (error || !curso) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle size={40} className="text-red-400" />
      <p className="text-gray-600 dark:text-gray-400">{error || t('creator.courseNotFound')}</p>
      <button onClick={() => navigate('/creator/cursos')} className="underline text-primary-500 text-sm">{t('creator.back')}</button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/creator/cursos')} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"><ArrowLeft size={20} /></button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">{curso.titulo}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t('creator.contentManagement')}</p>
        </div>
        <button
          onClick={() => navigate(`/creator/cursos/${id}/ver`)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-95 whitespace-nowrap"
        >
          <GraduationCap size={16} /> {t('creator.takeClass')}
        </button>
      </div>

      {/* Card del curso */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${curso.gradient_class || 'from-primary-600 to-indigo-700'} p-6 text-white shadow-lg`}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '25px 25px' }} />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex gap-2">
              <EstadoBadge estado={curso.estado} />
              <VisibilidadBadge visibilidad={curso.visibilidad} />
            </div>
            <h3 className="text-xl font-black mt-2 leading-tight">{curso.titulo}</h3>
            {curso.descripcion && <p className="text-white/70 text-sm mt-1 line-clamp-2">{curso.descripcion}</p>}
          </div>
          <div className="flex gap-6">
            <div className="text-center"><p className="text-2xl font-black">{lecciones.length}</p><p className="text-xs text-white/60">{t('creator.lessons')}</p></div>
            <div className="text-center"><p className="text-2xl font-black">{ejercicios.length}</p><p className="text-xs text-white/60">{t('creator.exercises')}</p></div>
            <div className="text-center"><p className="text-2xl font-black">{curso.estudiantes || 0}</p><p className="text-xs text-white/60">{t('creator.studentsWord')}</p></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-2xl w-fit">
        <button onClick={() => { setTab('lecciones'); setPanelOpen(false); }}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'lecciones' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
          <Video size={16} /> {t('creator.lessons')} <span className="text-xs opacity-60 ml-1">({lecciones.length})</span>
        </button>
        <button onClick={() => { setTab('ejercicios'); setPanelOpen(false); }}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'ejercicios' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
          <FileText size={16} /> {t('creator.exercises')} <span className="text-xs opacity-60 ml-1">({ejercicios.length})</span>
        </button>
        <button onClick={() => { setTab('estudiantes'); setPanelOpen(false); setInviteMsg({ type: '', text: '' }); }}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'estudiantes' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
          <Users size={16} /> Estudiantes
        </button>
      </div>

      {/* ── TAB LECCIONES ─────────────────────────────────────────────────────── */}
      {tab === 'lecciones' && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Video size={18} className="text-primary-500" /> {t('creator.lessons')}
                <span className="text-sm font-normal text-gray-400">({lecciones.length})</span>
                {reordering && <Loader2 size={14} className="animate-spin text-primary-400 ml-1" />}
              </h3>
            </div>
            {lecciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-center">
                <Film size={28} className="text-gray-300 dark:text-gray-600" />
                <p className="font-semibold text-gray-600 dark:text-gray-400">{t('creator.noLessons')}</p>
                <p className="text-sm text-gray-400">{t('creator.addFirstVideo')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lecciones.map((lec, i) => (
                  <LeccionRow key={lec.id} leccion={lec} index={i} total={lecciones.length}
                    onMoveUp={() => handleMoveUp(i)} onMoveDown={() => handleMoveDown(i)}
                    onDelete={handleDeleteLeccion} onRename={handleRenombarLeccion}
                    previewUrl={previewUrl} onPreview={url => setPreviewUrl(prev => prev === url ? null : url)} />
                ))}
              </div>
            )}
          </div>

          <div className="xl:col-span-2 space-y-4">
            {previewUrl && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><Play size={14} className="text-primary-500" /> {t('creator.preview')}</h4>
                <VideoPlayer src={previewUrl} />
                <button onClick={() => setPreviewUrl(null)} className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">{t('creator.close')}</button>
              </div>
            )}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <button onClick={() => setPanelOpen(p => !p)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Plus size={17} className="text-primary-500" /> {t('creator.addNewLesson')}</span>
                <span className={`text-gray-400 text-xs transition-transform duration-200 ${panelOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {panelOpen && (
                <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
                  <VideoUploadZone cursoId={id} onSuccess={lec => { setLecciones(prev => [...prev, lec]); setPanelOpen(false); }} />
                </div>
              )}
            </div>
            <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800 rounded-2xl p-4">
              <p className="text-xs font-semibold text-primary-700 dark:text-primary-400 mb-1">💡 {t('creator.tip')}</p>
              <p className="text-xs text-primary-600 dark:text-primary-300 leading-relaxed">{t('creator.reorderTip')}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB EJERCICIOS ────────────────────────────────────────────────────── */}
      {tab === 'ejercicios' && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3 space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText size={18} className="text-rose-500" /> {t('creator.exercisesMaterial')}
              <span className="text-sm font-normal text-gray-400">({ejercicios.length})</span>
            </h3>
            {ejercicios.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-center">
                <FileText size={28} className="text-gray-300 dark:text-gray-600" />
                <p className="font-semibold text-gray-600 dark:text-gray-400">{t('creator.noExercises')}</p>
                <p className="text-sm text-gray-400">{t('creator.uploadPdfsDesc')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {ejercicios.map((ej, i) => (
                  <EjercicioRow key={ej.id} ejercicio={ej} index={i}
                    onDelete={handleDeleteEjercicio} onRename={handleRenombarEjercicio} />
                ))}
              </div>
            )}
          </div>

          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <button onClick={() => setPanelOpen(p => !p)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Plus size={17} className="text-rose-500" /> {t('creator.uploadNewExercise')}</span>
                <span className={`text-gray-400 text-xs transition-transform duration-200 ${panelOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {panelOpen && (
                <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
                  <PdfUploadZone cursoId={id} onSuccess={ej => { setEjercicios(prev => [...prev, ej]); setPanelOpen(false); }} />
                </div>
              )}
            </div>
            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-2xl p-4">
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1">📎 {t('creator.supportedFormats')}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['PDF', 'Word (.docx)', 'PowerPoint (.pptx)', 'Texto (.txt)'].map(f => (
                  <span key={f} className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-medium">{f}</span>
                ))}
              </div>
              <p className="text-xs text-rose-600 dark:text-rose-300 leading-relaxed mt-2">{t('creator.studentsCanDownload')}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB ESTUDIANTES / INVITACIONES ──────────────────────────────────── */}
      {tab === 'estudiantes' && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3 space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users size={18} className="text-primary-500" /> Gestión de Estudiantes
            </h3>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Invitar Estudiante</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Envía una invitación por correo. Si el estudiante no tiene cuenta, se le pedirá crear una y será inscrito automáticamente a este curso al terminar.
              </p>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!inviteEmail.trim()) return;
                setInviting(true); setInviteMsg({ type: '', text: '' });
                try {
                  const res = await api.post('/invitaciones/enviar', { curso_id: id, email: inviteEmail.trim() });
                  setInviteMsg({ type: 'success', text: res.message });
                  setInviteEmail('');
                } catch (err) {
                  setInviteMsg({ type: 'error', text: err.message });
                } finally {
                  setInviting(false);
                }
              }} className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <input type="email" required placeholder="correo@estudiante.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
                </div>
                <button type="submit" disabled={inviting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {inviting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Enviar Invitación
                </button>
              </form>
              
              {inviteMsg.text && (
                <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${inviteMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                  {inviteMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                  {inviteMsg.text}
                </div>
              )}
            </div>
          </div>
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800 rounded-2xl p-4">
              <p className="text-xs font-semibold text-primary-700 dark:text-primary-400 mb-1">💡 Consejos</p>
              <ul className="text-xs text-primary-600 dark:text-primary-300 leading-relaxed list-disc list-inside space-y-1">
                <li>Usa las invitaciones para regalar acceso a cursos de pago.</li>
                <li>Los invitados reciben un enlace único de un solo uso.</li>
                <li>Si configuras un curso como "Privado", esta es la única forma de que puedan entrar al curso.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
