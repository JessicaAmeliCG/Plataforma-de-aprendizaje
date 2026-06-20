/**
 * ComunidadPage.jsx — Comunidad de estudiantes
 * Tabs: Reseñas de la plataforma | Foro de Recomendaciones
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageSquare, Star, ThumbsUp, Send, Trash2, Plus, Loader2,
  AlertCircle, ChevronDown, ChevronUp, Tag, BookOpen, Users,
  GraduationCap,
} from 'lucide-react';
import { api } from '../services/api';
import useAuthStore from '../stores/authStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)    return 'Hace un momento';
  if (diff < 3600)  return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
  return `Hace ${Math.floor(diff / 86400)} días`;
}

// ─── Estrellas ────────────────────────────────────────────────────────────────
function Stars({ rating, interactive = false, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`transition-transform ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        >
          <Star
            size={interactive ? 22 : 14}
            className={`transition-colors ${
              i <= (hover || rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Avatar del autor ─────────────────────────────────────────────────────────
function AutorAvatar({ nombre, avatarColor, rol }) {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColor || 'from-primary-500 to-primary-700'} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
        {getInitials(nombre)}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{nombre}</p>
        {rol === 'creador' && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">Creador</span>
        )}
      </div>
    </div>
  );
}

// ─── Tarjeta de reseña ────────────────────────────────────────────────────────
function ResenaCard({ post, onDelete, onReply, currentUser }) {
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [replyText, setReplyText]     = useState('');
  const [sending, setSending]         = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await onReply(post.id, replyText.trim());
      post.respuestas.push(res);
      setReplyText('');
      setRepliesOpen(true);
    } catch (err) { alert(err.message); }
    finally { setSending(false); }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <AutorAvatar nombre={post.autor_nombre} avatarColor={post.autor_color} rol={post.autor_rol} />
        <div className="flex items-center gap-3 shrink-0">
          <Stars rating={post.rating} />
          <span className="text-xs text-gray-400">{timeAgo(post.created_at)}</span>
          {(currentUser?.id === post.usuario_id || currentUser?.rol === 'creador') && (
            <button onClick={() => onDelete(post.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={14} /></button>
          )}
        </div>
      </div>

      {/* Título + contenido */}
      {post.titulo && <h4 className="font-bold text-gray-900 dark:text-white">{post.titulo}</h4>}
      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{post.contenido}</p>

      {/* Respuestas */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-3">
        {post.respuestas.length > 0 && (
          <button onClick={() => setRepliesOpen(p => !p)} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            <MessageSquare size={13} /> {post.respuestas.length} respuesta{post.respuestas.length !== 1 ? 's' : ''}
            {repliesOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}

        {repliesOpen && post.respuestas.length > 0 && (
          <div className="space-y-3 pl-4 border-l-2 border-primary-200 dark:border-primary-800">
            {post.respuestas.map(r => (
              <div key={r.id} className="flex items-start gap-2.5">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${r.autor_color || 'from-primary-500 to-primary-700'} flex items-center justify-center text-white font-bold text-[10px] shrink-0`}>
                  {getInitials(r.autor_nombre)}
                </div>
                <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{r.autor_nombre}</span>
                    {r.autor_rol === 'creador' && <span className="text-[9px] font-bold px-1 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">Creador</span>}
                    <span className="text-[11px] text-gray-400 ml-auto">{timeAgo(r.created_at)}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{r.contenido}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Responder */}
        <div className="flex items-center gap-2">
          <input
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
            placeholder="Responder..."
            className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
          />
          <button onClick={handleReply} disabled={sending || !replyText.trim()}
            className="p-2 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-40 text-white transition-all active:scale-95">
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tarjeta del foro ─────────────────────────────────────────────────────────
function ForoCard({ post, onDelete, onReply, currentUser }) {
  const [repliesOpen, setRepliesOpen] = useState(true);
  const [replyText, setReplyText]     = useState('');
  const [sending, setSending]         = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await onReply(post.id, replyText.trim());
      post.respuestas.push(res);
      setReplyText('');
    } catch (err) { alert(err.message); }
    finally { setSending(false); }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <AutorAvatar nombre={post.autor_nombre} avatarColor={post.autor_color} rol={post.autor_rol} />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400">{timeAgo(post.created_at)}</span>
          {(currentUser?.id === post.usuario_id || currentUser?.rol === 'creador') && (
            <button onClick={() => onDelete(post.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={14} /></button>
          )}
        </div>
      </div>

      <div>
        <h4 className="font-bold text-gray-900 dark:text-white">{post.titulo || 'Sin título'}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-1">{post.contenido}</p>
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map(t => (
            <span key={t} className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
              <Tag size={9} />{t}
            </span>
          ))}
        </div>
      )}

      {/* Curso vinculado */}
      {post.curso_titulo && (
        <div className="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400 font-medium">
          <BookOpen size={13} /><span>Relacionado con: {post.curso_titulo}</span>
        </div>
      )}

      {/* Respuestas */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-3">
        {post.respuestas.length > 0 && (
          <button onClick={() => setRepliesOpen(p => !p)} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <MessageSquare size={13} /> {post.respuestas.length} respuesta{post.respuestas.length !== 1 ? 's' : ''}
            {repliesOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}

        {repliesOpen && post.respuestas.length > 0 && (
          <div className="space-y-3 pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
            {post.respuestas.map(r => (
              <div key={r.id} className="flex items-start gap-2.5">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${r.autor_color || 'from-primary-500 to-primary-700'} flex items-center justify-center text-white font-bold text-[10px] shrink-0`}>{getInitials(r.autor_nombre)}</div>
                <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{r.autor_nombre}</span>
                    {r.autor_rol === 'creador' && <span className="text-[9px] font-bold px-1 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">Creador</span>}
                    <span className="text-[11px] text-gray-400 ml-auto">{timeAgo(r.created_at)}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{r.contenido}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
            placeholder="Responder a esta discusión..."
            className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
          <button onClick={handleReply} disabled={sending || !replyText.trim()} className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all active:scale-95">
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Formulario nueva reseña ──────────────────────────────────────────────────
function NuevaResenaForm({ onSuccess }) {
  const [titulo, setTitulo]       = useState('');
  const [contenido, setContenido] = useState('');
  const [rating, setRating]       = useState(5);
  const [sending, setSending]     = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contenido.trim()) { setError('El contenido es obligatorio.'); return; }
    setSending(true); setError('');
    try {
      const res = await api.post('/comunidad', { tipo: 'resena', titulo, contenido, rating });
      onSuccess(res.data);
      setTitulo(''); setContenido(''); setRating(5);
    } catch (err) { setError(err.message); }
    finally { setSending(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
      <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Star size={16} className="text-amber-400 fill-amber-400" /> Nueva Reseña</h4>
      <div>
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Tu calificación</label>
        <Stars rating={rating} interactive onChange={setRating} />
      </div>
      <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título de tu reseña (opcional)" maxLength={100}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition" />
      <textarea value={contenido} onChange={e => setContenido(e.target.value)} placeholder="Comparte tu experiencia con la plataforma..." rows={3} maxLength={500}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition resize-none" />
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
      <button type="submit" disabled={sending || !contenido.trim()}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95">
        {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Publicar reseña
      </button>
    </form>
  );
}

// ─── Formulario nueva recomendación/foro ─────────────────────────────────────
function NuevaRecomendacionForm({ onSuccess }) {
  const [titulo, setTitulo]       = useState('');
  const [contenido, setContenido] = useState('');
  const [tags, setTags]           = useState('');
  const [sending, setSending]     = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !contenido.trim()) { setError('Título y contenido son obligatorios.'); return; }
    setSending(true); setError('');
    try {
      const tagsArr = tags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await api.post('/comunidad', { tipo: 'recomendacion', titulo, contenido, tags: tagsArr });
      onSuccess(res.data);
      setTitulo(''); setContenido(''); setTags('');
    } catch (err) { setError(err.message); }
    finally { setSending(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
      <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><MessageSquare size={16} className="text-indigo-500" /> Nueva Discusión</h4>
      <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título de tu pregunta o recomendación *" maxLength={120}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
      <textarea value={contenido} onChange={e => setContenido(e.target.value)} placeholder="Describe tu problema o recomendación..." rows={3} maxLength={800}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none" />
      <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags: React, Docker, SQL (separados por comas)" maxLength={100}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
      <button type="submit" disabled={sending || !titulo.trim() || !contenido.trim()}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-primary-600 hover:from-indigo-500 hover:to-primary-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
        {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Publicar
      </button>
    </form>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ComunidadPage() {
  const currentUser = useAuthStore(s => s.user);
  const [tab,     setTab]     = useState('resenas');
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/comunidad');
      setPosts(res.data || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const resenas        = posts.filter(p => p.tipo === 'resena');
  const recomendaciones = posts.filter(p => p.tipo === 'recomendacion');
  const currentList    = tab === 'resenas' ? resenas : recomendaciones;

  const avgRating = resenas.length > 0
    ? (resenas.reduce((s, p) => s + (p.rating || 0), 0) / resenas.length).toFixed(1)
    : '—';

  const handleDelete = async (postId) => {
    if (!confirm('¿Eliminar esta publicación?')) return;
    try {
      await api.delete(`/comunidad/${postId}`);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) { alert(err.message); }
  };

  const handleReply = async (postId, contenido) => {
    const res = await api.post(`/comunidad/${postId}/respuestas`, { contenido });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, respuestas: [...p.respuestas, res.data] } : p));
    return res.data;
  };

  const handleNewPost = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
    setShowForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare size={24} className="text-indigo-500" /> Comunidad
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Reseñas de la plataforma y foro de recomendaciones entre estudiantes.</p>
        </div>
        <button onClick={() => setShowForm(p => !p)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-primary-600 hover:from-indigo-500 hover:to-primary-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all active:scale-95 whitespace-nowrap">
          <Plus size={17} /> {showForm ? 'Cancelar' : 'Nueva publicación'}
        </button>
      </div>

      {/* Stats rápidas */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Reseñas',         value: resenas.length,         color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
            { label: 'Calificación avg', value: avgRating,              color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' },
            { label: 'Discusiones',      value: recomendaciones.length,  color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/10' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl w-fit">
        {[
          { key: 'resenas',         label: 'Reseñas',           count: resenas.length },
          { key: 'recomendaciones', label: 'Foro / Discusiones', count: recomendaciones.length },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}>
            {t.label} <span className="text-xs opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Formulario nuevo post */}
      {showForm && (
        <div>
          {tab === 'resenas'
            ? <NuevaResenaForm onSuccess={handleNewPost} />
            : <NuevaRecomendacionForm onSuccess={handleNewPost} />
          }
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />{error}
          <button onClick={fetchPosts} className="ml-auto underline text-xs">Reintentar</button>
        </div>
      )}

      {/* Lista de posts */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : currentList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <GraduationCap size={28} className="text-gray-400" />
          </div>
          <p className="font-semibold text-gray-600 dark:text-gray-400">
            {tab === 'resenas' ? 'Aún no hay reseñas' : 'Aún no hay discusiones'}
          </p>
          <p className="text-sm text-gray-400">
            {tab === 'resenas' ? 'Los estudiantes podrán calificar y opinar sobre la plataforma.' : 'Los estudiantes podrán hacer preguntas y recomendaciones aquí.'}
          </p>
          <button onClick={() => setShowForm(true)} className="text-sm font-semibold text-indigo-500 hover:underline">Publica el primero →</button>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map(post =>
            tab === 'resenas'
              ? <ResenaCard key={post.id} post={post} onDelete={handleDelete} onReply={handleReply} currentUser={currentUser} />
              : <ForoCard   key={post.id} post={post} onDelete={handleDelete} onReply={handleReply} currentUser={currentUser} />
          )}
        </div>
      )}
    </div>
  );
}
