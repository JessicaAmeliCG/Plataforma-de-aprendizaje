/**
 * MaestrosPage.jsx — Gestión de Maestros/Creadores para Moderadores y Admins
 */
import { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap, Plus, Trash2, Loader2, AlertCircle,
  User, Mail, Lock, X, Check, Search,
} from 'lucide-react';
import { api } from '../services/api';

const INPUT_CLS = `
  w-full px-4 py-2.5 rounded-xl text-sm
  bg-white dark:bg-gray-900
  border border-gray-200 dark:border-gray-700
  text-gray-900 dark:text-white
  placeholder-gray-400 dark:placeholder-gray-600
  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
  transition-all
`;

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function MaestrosPage() {
  const [maestros, setMaestros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });

  const fetchMaestros = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/maestros');
      setMaestros(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMaestros(); }, [fetchMaestros]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.nombre.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Todos los campos son requeridos.');
      return;
    }
    try {
      setSaving(true);
      await api.post('/maestros', form);
      setShowModal(false);
      setForm({ nombre: '', email: '', password: '' });
      fetchMaestros();
    } catch (err) {
      setFormError(err.message || 'Error al crear maestro.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este maestro? Sus cursos se mantendrán.')) return;
    try {
      setDeletingId(id);
      await api.delete(`/maestros/${id}`);
      setMaestros(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert(err.message || 'Error al eliminar maestro.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtrados = maestros.filter(m =>
    !query ||
    m.nombre.toLowerCase().includes(query.toLowerCase()) ||
    m.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap size={24} className="text-primary-500" /> Gestión de Maestros
          </h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {maestros.length} maestro{maestros.length !== 1 ? 's' : ''} registrado{maestros.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          id="btn-agregar-maestro"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm transition-all shadow-lg shadow-primary-500/25 active:scale-95"
        >
          <Plus size={16} /> Agregar Maestro
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} /> {error}
          <button onClick={fetchMaestros} className="ml-auto underline text-xs">Reintentar</button>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
          <GraduationCap size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {query ? 'No se encontraron maestros con esa búsqueda' : 'No hay maestros registrados aún'}
          </p>
          {!query && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-primary-600 text-sm underline font-semibold"
            >
              Agregar el primer maestro
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Maestro</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Correo</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Verificado</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtrados.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${m.avatar_color || 'from-primary-500 to-primary-600'} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                        {getInitials(m.nombre)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{m.nombre}</p>
                        <p className="text-xs text-gray-400 md:hidden">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500 dark:text-gray-400 hidden md:table-cell">{m.email}</td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    {m.verificado ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                        <Check size={10} /> Verificado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleDelete(m.id)}
                      disabled={deletingId === m.id}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                      title="Eliminar maestro"
                    >
                      {deletingId === m.id
                        ? <Loader2 size={15} className="animate-spin" />
                        : <Trash2 size={15} />
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Agregar Maestro */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-black text-gray-900 dark:text-white text-lg flex items-center gap-2">
                <GraduationCap size={20} className="text-primary-500" /> Nuevo Maestro
              </h3>
              <button
                onClick={() => { setShowModal(false); setFormError(''); }}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <User size={14} /> Nombre completo
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej. María García López"
                  className={INPUT_CLS}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Mail size={14} /> Correo electrónico
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="maestro@correo.com"
                  className={INPUT_CLS}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Lock size={14} /> Contraseña temporal
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  className={INPUT_CLS}
                  minLength={8}
                  required
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle size={14} /> {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormError(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  id="btn-guardar-maestro"
                  className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving
                    ? <><Loader2 size={14} className="animate-spin" /> Creando...</>
                    : <><Check size={14} /> Crear Maestro</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
