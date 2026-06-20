/**
 * AnaliticasPage.jsx — Gráficas de ingresos, alumnos y comprensión por curso
 */
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend, Cell,
} from 'recharts';
import {
  TrendingUp, DollarSign, Users, Star, BookOpen,
  Loader2, AlertCircle, Award, BarChart2,
} from 'lucide-react';
import { api } from '../services/api';
import { useT } from '../contexts/I18nContext';

// ─── Tooltip personalizado ─────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, prefix = '', suffix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl px-4 py-3">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 truncate max-w-[180px]">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-black" style={{ color: p.color }}>
          {prefix}{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}{suffix}
        </p>
      ))}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, Icon, gradient, delay = 0 }) {
  return (
    <div className="flex items-center gap-4 p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all"
      style={{ animationDelay: `${delay}ms` }}>
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm shrink-0`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Abreviar títulos para los ejes ──────────────────────────────────────────
function shortTitle(titulo = '', maxLen = 16) {
  if (!titulo) return '';
  const words = titulo.split(' ');
  return words.slice(0, 3).join(' ').slice(0, maxLen) + (titulo.length > maxLen ? '…' : '');
}

// ─── Colores de gradiente para las barras ────────────────────────────────────
const BAR_COLORS = [
  '#8b5cf6', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'
];

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AnaliticasPage() {
  const t = useT();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetch = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/analiticas');
      setData(res.data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-primary-500" />
    </div>
  );
  if (error) return (
    <div className="flex items-center gap-3 p-5 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
      <AlertCircle size={20} />{error}
      <button onClick={fetch} className="ml-auto underline text-sm">{t('creator.retry')}</button>
    </div>
  );

  const { cursos = [], ratings = [], actividadMensual = [], kpis = {} } = data || {};

  // Preparar datos para las gráficas
  const ingresosData = cursos.map((c, i) => ({
    name:    shortTitle(c.titulo),
    titulo:  c.titulo,
    valor:   c.ingresos_estimados || 0,
    color:   BAR_COLORS[i % BAR_COLORS.length],
  }));

  const alumnosData = cursos.map((c, i) => ({
    name:   shortTitle(c.titulo),
    titulo: c.titulo,
    valor:  c.estudiantes || 0,
    color:  BAR_COLORS[i % BAR_COLORS.length],
  }));

  const comprensionData = ratings.map((r, i) => {
    const curso = cursos.find(c => c.id === r.curso_id);
    return {
      name:   shortTitle(r.titulo),
      titulo: r.titulo,
      rating: r.avg_rating || 0,
      resenas: r.total_resenas || 0,
      color:  BAR_COLORS[i % BAR_COLORS.length],
      estado: curso?.estado,
    };
  }).filter(r => r.resenas > 0);

  const actividadData = actividadMensual.map(m => ({
    name:          m.mes,
    inscripciones: m.inscripciones,
  }));

  const hasIngresos    = ingresosData.some(d => d.valor > 0);
  const hasAlumnos     = alumnosData.some(d => d.valor > 0);
  const hasComprension = comprensionData.length > 0;
  const hasActividad   = actividadData.length > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart2 size={24} className="text-emerald-500" /> {t('creator.analyticsTitle')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('creator.analyticsDesc')}
        </p>
      </div>

      {/* KPIs globales */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label={t('creator.coursesCreated')}    value={kpis.totalCursos}        sub={`${cursos.filter(c=>c.estado==='publicado').length} ${t('creator.publishedWord')}`} Icon={BookOpen}    gradient="from-primary-500 to-primary-600" delay={0} />
        <KpiCard label={t('creator.studentsTitle')}       value={kpis.totalEstudiantes}   sub={t('creator.onPlatform')}                                                  Icon={Users}       gradient="from-blue-500 to-cyan-500"     delay={80} />
        <KpiCard label={t('creator.enrollments')}     value={kpis.totalInscripciones} sub={t('creator.totalEnrollmentsSub')}                                            Icon={Award}       gradient="from-emerald-500 to-teal-500"  delay={160} />
        <KpiCard label={t('creator.estimatedRevenue')} value={`$${(kpis.ingresoTotal||0).toLocaleString()}`} sub={t('creator.mxnAccumulated')}                              Icon={DollarSign}  gradient="from-amber-400 to-orange-500"  delay={240} />
      </div>

      {/* Fila de 2 gráficas: Ingresos y Alumnos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Gráfica: Ingresos por curso */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/20"><DollarSign size={18} className="text-amber-500" /></div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t('creator.revenueByCourse')}</h3>
              <p className="text-xs text-gray-400">{t('creator.estimatedRevenueDesc')}</p>
            </div>
          </div>
          {!hasIngresos ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <DollarSign size={32} className="text-gray-200 dark:text-gray-700" />
              <p className="text-sm text-gray-400">{t('creator.noPaidCoursesEnrolled')}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ingresosData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:opacity-10" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toLocaleString()}`} />
                <Tooltip content={<CustomTooltip prefix="$" suffix=" MXN" />} />
                <Bar dataKey="valor" radius={[8, 8, 0, 0]} maxBarSize={56}>
                  {ingresosData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gráfica: Alumnos por curso */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/20"><Users size={18} className="text-blue-500" /></div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t('creator.studentsByCourse')}</h3>
              <p className="text-xs text-gray-400">{t('creator.enrollmentsByCourse')}</p>
            </div>
          </div>
          {!hasAlumnos ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <Users size={32} className="text-gray-200 dark:text-gray-700" />
              <p className="text-sm text-gray-400">{t('creator.noEnrollmentsYet')}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={alumnosData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:opacity-10" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip suffix={t('creator.studentsSuffix')} />} />
                <Bar dataKey="valor" radius={[8, 8, 0, 0]} maxBarSize={56}>
                  {alumnosData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Fila 2: Comprensión y Actividad mensual */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Gráfica: Comprensión (rating promedio por curso) */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/20"><Star size={18} className="text-emerald-500" /></div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t('creator.comprehensionByCourse')}</h3>
              <p className="text-xs text-gray-400">{t('creator.avgRatingDesc')}</p>
            </div>
          </div>
          {!hasComprension ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <Star size={32} className="text-gray-200 dark:text-gray-700" />
              <p className="text-sm text-gray-400">{t('creator.noCourseReviewsYet')}</p>
              <p className="text-xs text-gray-400">{t('creator.reviewsWillAppearHere')}</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={comprensionData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:opacity-10" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip prefix="★ " suffix="/5" />} />
                  <Bar dataKey="rating" radius={[8, 8, 0, 0]} maxBarSize={56}>
                    {comprensionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-3">
                {comprensionData.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                    <span className="text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{c.titulo}</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">★ {c.rating}</span>
                    <span className="text-gray-400">({c.resenas})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Gráfica: Actividad mensual (inscripciones) */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/20"><TrendingUp size={18} className="text-primary-500" /></div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t('creator.monthlyActivity')}</h3>
              <p className="text-xs text-gray-400">{t('creator.enrollmentsPerMonth')}</p>
            </div>
          </div>
          {!hasActividad ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <TrendingUp size={32} className="text-gray-200 dark:text-gray-700" />
              <p className="text-sm text-gray-400">{t('creator.noActivityYet')}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={actividadData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:opacity-10" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip suffix={t('creator.enrollmentsSuffix')} />} />
                <Line
                  type="monotone"
                  dataKey="inscripciones"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', r: 5, strokeWidth: 0 }}
                  activeDot={{ r: 7, fill: '#8b5cf6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tabla resumen de cursos */}
      {cursos.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm overflow-x-auto">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-primary-500" /> {t('creator.courseSummary')}
          </h3>
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                <th className="text-left pb-3 font-semibold">{t('creator.courseHeader')}</th>
                <th className="text-center pb-3 font-semibold">{t('creator.statusHeader')}</th>
                <th className="text-right pb-3 font-semibold">{t('creator.studentsHeader')}</th>
                <th className="text-right pb-3 font-semibold">{t('creator.priceHeader')}</th>
                <th className="text-right pb-3 font-semibold">{t('creator.estRevenueHeader')}</th>
                <th className="text-right pb-3 font-semibold">{t('creator.ratingHeader')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {cursos.map((c, i) => {
                const r = ratings.find(r => r.curso_id === c.id);
                return (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full`} style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                        <span className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{c.titulo}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.estado === 'publicado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {c.estado === 'publicado' ? t('creator.badgePublished') : t('creator.badgeDraft')}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold text-gray-900 dark:text-white">{c.estudiantes}</td>
                    <td className="py-3 text-right text-gray-500 dark:text-gray-400">
                      {c.modelo_negocio === 'gratis' ? <span className="text-emerald-500 font-bold text-xs">{t('creator.freeCaps')}</span> : `$${Number(c.precio).toLocaleString()}`}
                    </td>
                    <td className="py-3 text-right font-bold text-gray-900 dark:text-white">
                      {c.ingresos_estimados > 0 ? `$${Number(c.ingresos_estimados).toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 text-right">
                      {r?.avg_rating > 0
                        ? <span className="flex items-center justify-end gap-1 font-semibold text-amber-500"><Star size={12} fill="currentColor" />{r.avg_rating}<span className="text-gray-400 font-normal text-xs">({r.total_resenas})</span></span>
                        : <span className="text-gray-300 dark:text-gray-700">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
