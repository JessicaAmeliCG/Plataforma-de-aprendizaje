/**
 * NotificationBell.jsx — Campana de notificaciones con dropdown
 * Muestra badge de no leídas, dropdown con lista y acciones
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, X, Check, Users, Star, MessageSquare, AlertCircle,
  Loader2, Info, Reply,
} from 'lucide-react';
import { api } from '../services/api';
import { useT } from '../contexts/I18nContext';

// ─── Ícono por tipo ───────────────────────────────────────────────────────────
const TIPO_CONFIG = {
  nuevo_estudiante: { Icon: Users,        color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20' },
  nueva_resena:     { Icon: Star,         color: 'text-amber-500  bg-amber-100  dark:bg-amber-900/20'  },
  nuevo_post:       { Icon: MessageSquare,color: 'text-blue-500   bg-blue-100   dark:bg-blue-900/20'   },
  nueva_respuesta:  { Icon: Reply,        color: 'text-primary-500 bg-primary-100 dark:bg-primary-900/20' },
  info:             { Icon: Info,         color: 'text-gray-500   bg-gray-100   dark:bg-gray-800'       },
};

// ─── Tiempo relativo ──────────────────────────────────────────────────────────
function timeAgo(dateStr, t) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)  return t('notif.justNow');
  if (diff < 3600) return t('notif.minutesAgo', { n: Math.floor(diff / 60) });
  if (diff < 86400) return t('notif.hoursAgo',  { n: Math.floor(diff / 3600) });
  return t('notif.daysAgo', { n: Math.floor(diff / 86400) });
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function NotificationBell() {
  const t = useT();
  const navigate = useNavigate();
  const [open,     setOpen]     = useState(false);
  const [notifs,   setNotifs]   = useState([]);
  const [count,    setCount]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const ref = useRef(null);

  // ── Obtener conteo (ligero, se llama periódicamente) ──────────────────────
  const fetchCount = useCallback(async () => {
    try {
      const res = await api.get('/notificaciones/count');
      setCount(res.count || 0);
    } catch {}
  }, []);

  // ── Obtener lista completa (al abrir el dropdown) ─────────────────────────
  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/notificaciones');
      setNotifs(res.data || []);
      setCount((res.data || []).filter(n => !n.leida).length);
    } catch {}
    finally { setLoading(false); }
  }, []);

  // Polling cada 30 segundos para el badge
  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30_000);
    return () => clearInterval(id);
  }, [fetchCount]);

  // Cerrar al click fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Al abrir, cargar lista
  const handleOpen = () => {
    setOpen(p => {
      if (!p) fetchNotifs();
      return !p;
    });
  };

  // Marcar todas como leídas
  const handleMarkAll = async () => {
    try {
      await api.patch('/notificaciones/leer-todas', {});
      setNotifs(prev => prev.map(n => ({ ...n, leida: 1 })));
      setCount(0);
    } catch {}
  };

  // Click en una notificación
  const handleClick = async (notif) => {
    if (!notif.leida) {
      try {
        await api.patch(`/notificaciones/${notif.id}/leer`, {});
        setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, leida: 1 } : n));
        setCount(prev => Math.max(0, prev - 1));
      } catch {}
    }
    if (notif.enlace) navigate(notif.enlace);
    setOpen(false);
  };

  // Eliminar notificación
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notificaciones/${id}`);
      setNotifs(prev => {
        const updated = prev.filter(n => n.id !== id);
        setCount(updated.filter(n => !n.leida).length);
        return updated;
      });
    } catch {}
  };

  return (
    <div ref={ref} className="relative">
      {/* Botón campana */}
      <button
        onClick={handleOpen}
        aria-label={`${t('notif.title')} (${count})`}
        className="relative p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-primary-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">

          {/* Header del dropdown */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell size={14} className="text-primary-500" />
              {t('notif.title')}
              {count > 0 && <span className="bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{count}</span>}
            </h3>
            {notifs.some(n => !n.leida) && (
              <button onClick={handleMarkAll} className="text-[11px] text-primary-500 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-colors">
                {t('notif.markAll')}
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={20} className="animate-spin text-primary-400" />
              </div>
            ) : notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Bell size={20} className="text-gray-300 dark:text-gray-700" />
                </div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('notif.empty')}</p>
                <p className="text-xs text-gray-400">{t('notif.emptyDesc')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {notifs.map(n => {
                  const cfg = TIPO_CONFIG[n.tipo] || TIPO_CONFIG.info;
                  const { Icon } = cfg;
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!n.leida ? 'bg-primary-50/40 dark:bg-primary-900/10' : ''}`}
                    >
                      {/* Ícono */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                        <Icon size={16} />
                      </div>
                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold leading-snug ${!n.leida ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                          {n.titulo}
                        </p>
                        {n.mensaje && <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{n.mensaje}</p>}
                        <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">{timeAgo(n.created_at, t)}</p>
                      </div>
                      {/* Indicador no leída + eliminar */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {!n.leida && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                        <button
                          onClick={(e) => handleDelete(e, n.id)}
                          className="p-0.5 rounded-md text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
              <button
                onClick={() => { navigate('/creator/ajustes'); setOpen(false); }}
                className="text-xs text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors w-full text-center"
              >
                Ir a Ajustes de notificaciones →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
