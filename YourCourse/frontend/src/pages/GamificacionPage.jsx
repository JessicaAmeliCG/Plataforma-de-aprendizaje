/**
 * GamificacionPage.jsx — Panel de progreso, logros y tabla de posiciones
 */
import { useState, useEffect } from 'react';
import {
  Trophy, Star, Award, Zap, Shield, Flame,
  Loader2, AlertCircle, TrendingUp, Users, Medal
} from 'lucide-react';
import { api } from '../services/api';
import useAuthStore from '../stores/authStore';

export default function GamificacionPage() {
  const user = useAuthStore(s => s.user);
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [resProfile, resLeader] = await Promise.all([
          api.get('/gamificacion'),
          api.get('/gamificacion/leaderboard')
        ]);
        setProfile(resProfile.data);
        setLeaderboard(resLeader.data || []);
      } catch (err) {
        setError(err.message || 'Error al cargar los datos de gamificación.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto pt-10">
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      </div>
    );
  }

  const { puntos_total = 0, nivel = 1, racha_dias = 0, logros = [] } = profile || {};

  // Calcular barra de progreso al siguiente nivel (500 XP por nivel)
  const xpEnNivelActual = puntos_total % 500;
  const xpParaSiguienteNivel = 500;
  const progresoPct = Math.round((xpEnNivelActual / xpParaSiguienteNivel) * 100);
  const xpFaltante = xpParaSiguienteNivel - xpEnNivelActual;

  const RANGOS = [
    { nivelMax: 2,  nombre: 'Caminante Inicial 🚶' },
    { nivelMax: 4,  nombre: 'Explorador Aprendiz 🧭' },
    { nivelMax: 7,  nombre: 'Desarrollador Junior 💻' },
    { nivelMax: 10, nombre: 'Máster de Código 🚀' },
    { nivelMax: 99, nombre: 'Sabio Antigravedad 🌌' }
  ];
  const rangoActual = RANGOS.find(r => nivel <= r.nivelMax)?.nombre || 'Leyenda 👑';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      {/* Cabecera / Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-primary-600 to-violet-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-primary-500/20">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 10% 90%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full w-fit text-xs font-bold uppercase tracking-wider">
              <Shield size={12} className="text-amber-300" /> Rango: {rangoActual}
            </div>
            <h2 className="text-3xl font-black">Mi Progreso Académico</h2>
            <p className="text-primary-100 text-sm">Gana puntos XP completando lecciones, cursos y ayudando a la comunidad.</p>
          </div>

          <div className="flex gap-4 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 text-center border border-white/10">
              <span className="text-sm text-primary-200 block font-semibold mb-1">Nivel</span>
              <span className="text-4xl font-black block">{nivel}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 text-center border border-white/10">
              <span className="text-sm text-primary-200 block font-semibold mb-1">Puntos XP</span>
              <span className="text-4xl font-black block">{puntos_total}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 text-center border border-white/10">
              <span className="text-sm text-primary-200 block font-semibold mb-1 flex items-center gap-1"><Flame size={14} className="text-orange-400 fill-orange-400" /> Racha</span>
              <span className="text-4xl font-black block">{racha_dias} <span className="text-xs">días</span></span>
            </div>
          </div>
        </div>

        {/* Nivel Barra de Progreso */}
        <div className="mt-8 bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-5 relative z-10">
          <div className="flex justify-between items-center text-xs font-bold text-primary-100 mb-2">
            <span>Progreso de Nivel</span>
            <span>{xpEnNivelActual} / {xpParaSiguienteNivel} XP ({progresoPct}%)</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
              style={{ width: `${progresoPct}%` }}
            />
          </div>
          <p className="text-[11px] text-primary-200 mt-2 italic">Te faltan {xpFaltante} XP para alcanzar el Nivel {nivel + 1}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LOGROS / LOGROS DESBLOQUEADOS (Col 1 y 2) */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award size={22} className="text-primary-500" /> Mis Logros y Medallas ({logros.length} / 6)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'primer_paso',   nombre: 'Primer Paso 🏁',        desc: 'Inscríbete en tu primer curso.' },
              { id: 'explorador',    nombre: 'Explorador 🧭',         desc: 'Completa tu primera lección.' },
              { id: 'graduado',      nombre: 'Graduado 🎓',           desc: 'Completa un curso al 100%.' },
              { id: 'curioso',       nombre: 'Curioso 💬',            desc: 'Realiza tu primera duda en clase.' },
              { id: 'comunicador',   nombre: 'Comunicador 📣',        desc: 'Publica tu primer post en la comunidad.' },
              { id: 'superestrella', nombre: 'Súper Estrella ⭐',     desc: 'Alcanza el nivel 5 de aprendizaje.' },
            ].map(l => {
              const unlocked = logros.find(un => un.id === l.id);
              return (
                <div
                  key={l.id}
                  className={`flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 ${
                    unlocked
                      ? 'bg-white dark:bg-gray-900 border-emerald-200 dark:border-emerald-900/30 shadow-md ring-1 ring-emerald-500/10'
                      : 'bg-gray-50/50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 opacity-60'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl ${
                    unlocked ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}>
                    {unlocked ? '🏆' : '🔒'}
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm ${unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {l.nombre}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">{l.desc}</p>
                    {unlocked && (
                      <span className="inline-block text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full mt-2">
                        Desbloqueado el {new Date(unlocked.unlocked_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TABLA DE POSICIONES (Col 3) */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={22} className="text-primary-500" /> Tabla de Posiciones (Leaderboard)
          </h3>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-md">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center text-xs font-bold text-gray-500 dark:text-gray-400">
              <span>ESTUDIANTE</span>
              <span>PUNTOS XP</span>
            </div>

            <div className="divide-y divide-gray-150 dark:divide-gray-800">
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Cargando leaderboard...</div>
              ) : (
                leaderboard.map((u, i) => {
                  const esCurrentUser = u.nombre === user?.nombre;
                  const medalEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;

                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-4 transition-colors ${
                        esCurrentUser ? 'bg-primary-50/55 dark:bg-primary-950/20 font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Medalla o número */}
                        <span className="w-6 shrink-0 text-center text-sm font-black text-gray-400">
                          {medalEmoji || `${i + 1}`}
                        </span>

                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${u.avatar_color || 'from-primary-500 to-primary-600'} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className={`text-sm truncate ${esCurrentUser ? 'text-primary-700 dark:text-primary-400' : 'text-gray-800 dark:text-gray-300'}`}>
                            {u.nombre}
                          </p>
                          <span className="text-[10px] text-gray-400 block font-normal">Nivel {u.nivel}</span>
                        </div>
                      </div>

                      <span className={`text-sm font-bold shrink-0 ${esCurrentUser ? 'text-primary-600' : 'text-gray-900 dark:text-white'}`}>
                        {u.puntos_total}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
