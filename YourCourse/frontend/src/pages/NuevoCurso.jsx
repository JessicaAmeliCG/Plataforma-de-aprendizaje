/**
 * NuevoCurso.jsx — Formulario para crear un nuevo curso
 * Vista previa en tiempo real de la tarjeta del curso
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, DollarSign, Clock, Layers, Palette,
  ChevronLeft, Check, Loader2, AlertCircle, Users, Star,
} from 'lucide-react';
import { api } from '../services/api';
import { useT } from '../contexts/I18nContext';

const GRADIENTS = [
  { label: 'Violeta',   value: 'from-primary-600 to-indigo-700' },
  { label: 'Azul',      value: 'from-blue-600 to-cyan-600'    },
  { label: 'Verde',     value: 'from-teal-500 to-emerald-600' },
  { label: 'Rosa',      value: 'from-rose-500 to-pink-600'    },
  { label: 'Ámbar',     value: 'from-amber-500 to-orange-600' },
  { label: 'Índigo',    value: 'from-indigo-600 to-primary-700'},
];

const MODELOS = [
  { value: 'gratis',      label: 'Gratuito',          desc: 'Sin costo para los estudiantes', icon: '🎁' },
  { value: 'pago_unico',  label: 'Pago único',        desc: 'Los estudiantes pagan una vez',  icon: '💳' },
  { value: 'suscripcion', label: 'Suscripción mensual', desc: 'Cobro mensual recurrente',     icon: '🔄' },
];

// ─── Preview Card (espejo de CursoCard del Dashboard) ─────────────────────────
function PreviewCard({ form }) {
  const t = useT();
  const gradient = form.gradient_class || 'from-primary-600 to-indigo-700';
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-900 w-full max-w-xs mx-auto">
      <div className={`relative h-40 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 25% 75%, white 1px, transparent 1px)', backgroundSize: '25px 25px' }}
        />
        <BookOpen size={38} className="text-white/50" />
        <span className={`absolute top-3 left-3 text-xs font-bold px-2 py-0.5 rounded-full ${
          form.estado === 'publicado'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-amber-100 text-amber-700'
        }`}>
          {form.estado === 'publicado' ? t('creator.published') : t('creator.draft')}
        </span>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 min-h-[40px]">
          {form.titulo || t('creator.courseTitlePlaceholder')}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[32px]">
          {form.descripcion || t('creator.courseDescPlaceholder')}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Users size={11} />0 {t('creator.studentsLower')}</span>
          <span className="flex items-center gap-1"><Clock size={11} />{form.duracion || '—'}</span>
          {form.modulos_count > 0 && <span className="flex items-center gap-1"><Layers size={11} />{t('creator.modulesShort', { n: form.modulos_count })}</span>}
        </div>
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          {form.modelo_negocio === 'gratis'      && <span className="text-xs font-bold text-emerald-600">{t('creator.free')}</span>}
          {form.modelo_negocio === 'pago_unico'  && <span className="text-sm font-bold text-gray-900 dark:text-white">${form.precio || 0} MXN</span>}
          {form.modelo_negocio === 'suscripcion' && <span className="text-xs font-bold text-primary-600">${form.precio || 0}/mes</span>}
          <Star size={13} className="text-gray-300" />
        </div>
      </div>
    </div>
  );
}

// ─── Componente de campo de formulario ────────────────────────────────────────
function Field({ label, required, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-primary-500 text-xs">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

const INPUT_CLS = `
  w-full px-4 py-2.5 rounded-xl text-sm
  bg-white dark:bg-gray-900
  border border-gray-200 dark:border-gray-700
  text-gray-900 dark:text-white
  placeholder-gray-400 dark:placeholder-gray-600
  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
  transition-all
`;

// ─── Componente principal ─────────────────────────────────────────────────────
export default function NuevoCurso() {
  const navigate = useNavigate();
  const t = useT();

  const GRADIENTS = [
    { label: t('creator.colorViolet'),   value: 'from-primary-600 to-indigo-700' },
    { label: t('creator.colorBlue'),      value: 'from-blue-600 to-cyan-600'    },
    { label: t('creator.colorGreen'),     value: 'from-teal-500 to-emerald-600' },
    { label: t('creator.colorPink'),      value: 'from-rose-500 to-pink-600'    },
    { label: t('creator.colorAmber'),     value: 'from-amber-500 to-orange-600' },
    { label: t('creator.colorIndigo'),    value: 'from-indigo-600 to-primary-700'},
  ];

  const MODELOS = [
    { value: 'gratis',      label: t('creator.modelFree'),          desc: t('creator.modelFreeDesc'), icon: '🎁' },
    { value: 'pago_unico',  label: t('creator.modelOneTime'),        desc: t('creator.modelOneTimeDesc'),  icon: '💳' },
    { value: 'suscripcion', label: t('creator.modelSub'), desc: t('creator.modelSubDesc'),     icon: '🔄' },
  ];

  const [form, setForm] = useState({
    titulo:         '',
    descripcion:    '',
    modelo_negocio: 'gratis',
    precio:         '',
    estado:         'borrador',
    modulos_count:  '',
    duracion:       '',
    gradient_class: GRADIENTS[0].value,
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.titulo.trim()) { setError(t('creator.titleRequired')); return; }

    try {
      setLoading(true);
      await api.post('/cursos', {
        ...form,
        precio:        Number(form.precio) || 0,
        modulos_count: Number(form.modulos_count) || 0,
      });
      setSuccess(true);
      setTimeout(() => navigate('/creator/cursos'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4 animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <Check size={32} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('creator.courseCreated')}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('creator.redirectingCourses')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('creator.createNewCourse')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('creator.fillDetailsPreview')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Formulario — 2/3 ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Información básica */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen size={16} className="text-primary-500" /> {t('creator.basicInfo')}
              </h3>

              <Field label={t('creator.courseTitle')} required>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={e => set('titulo', e.target.value)}
                  placeholder={t('creator.courseTitleEx')}
                  maxLength={120}
                  className={INPUT_CLS}
                />
              </Field>

              <Field label={t('creator.description')} hint={t('creator.courseDescHint')}>
                <textarea
                  rows={4}
                  value={form.descripcion}
                  onChange={e => set('descripcion', e.target.value)}
                  placeholder={t('creator.courseDescEx')}
                  className={`${INPUT_CLS} resize-none`}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label={t('creator.modules')} hint={t('creator.modulesNumberHint')}>
                  <div className="relative">
                    <Layers size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="number" min={0} max={99}
                      value={form.modulos_count}
                      onChange={e => set('modulos_count', e.target.value)}
                      placeholder="8"
                      className={`${INPUT_CLS} pl-9`}
                    />
                  </div>
                </Field>
                <Field label={t('creator.estimatedDuration')} hint={t('creator.durationEx')}>
                  <div className="relative">
                    <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text"
                      value={form.duracion}
                      onChange={e => set('duracion', e.target.value)}
                      placeholder="12h 30m"
                      className={`${INPUT_CLS} pl-9`}
                    />
                  </div>
                </Field>
              </div>
            </div>

            {/* Precio y modelo */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign size={16} className="text-primary-500" /> {t('creator.monetization')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MODELOS.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => set('modelo_negocio', m.value)}
                    className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all text-center ${
                      form.modelo_negocio === m.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{m.label}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{m.desc}</span>
                  </button>
                ))}
              </div>

              {form.modelo_negocio !== 'gratis' && (
                <Field label={form.modelo_negocio === 'suscripcion' ? t('creator.monthlyPrice') : t('creator.price')} required>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                    <input
                      type="number" min={0} step={1}
                      value={form.precio}
                      onChange={e => set('precio', e.target.value)}
                      placeholder="499"
                      className={`${INPUT_CLS} pl-8`}
                    />
                  </div>
                </Field>
              )}
            </div>

            {/* Color del curso */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Palette size={16} className="text-primary-500" /> {t('creator.cardColor')}
              </h3>
              <div className="flex flex-wrap gap-3">
                {GRADIENTS.map(g => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => set('gradient_class', g.value)}
                    title={g.label}
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${g.value} transition-all ${
                      form.gradient_class === g.value ? 'ring-3 ring-offset-2 ring-primary-500 scale-110' : 'hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Estado */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-3">
              <h3 className="font-bold text-gray-900 dark:text-white">{t('creator.publishState')}</h3>
              <div className="flex gap-3">
                {[
                  { value: 'borrador',  label: t('creator.saveAsDraft'), sub: t('creator.notVisibleStudents'), color: 'amber'  },
                  { value: 'publicado', label: t('creator.publishNow'),         sub: t('creator.visibleAll'),          color: 'emerald' },
                ].map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => set('estado', s.value)}
                    className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${
                      form.estado === s.value
                        ? `border-${s.color}-500 bg-${s.color}-50 dark:bg-${s.color}-900/20`
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{s.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{s.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Error y submit */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle size={16} />{error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              id="btn-guardar-curso"
              className="
                w-full flex items-center justify-center gap-2
                px-6 py-3 rounded-xl
                bg-gradient-to-r from-primary-600 to-primary-600
                hover:from-primary-500 hover:to-primary-500
                disabled:opacity-60
                text-white font-bold text-sm
                shadow-lg shadow-primary-500/30
                transition-all active:scale-95
              "
            >
              {loading
                ? <><Loader2 size={17} className="animate-spin" /> {t('creator.creatingCourse')}</>
                : <><Check size={17} /> {form.estado === 'publicado' ? t('creator.publishCourse') : t('creator.saveDraft')}</>
              }
            </button>
          </div>

          {/* ── Preview — 1/3 ────────────────────────────────────────────── */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm flex items-center gap-2">
              {t('creator.cardPreview')}
            </h3>
            <div className="sticky top-4">
              <PreviewCard form={form} />
              <p className="text-xs text-center text-gray-400 dark:text-gray-600 mt-3">
                {t('creator.howStudentsWillSee')}
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
