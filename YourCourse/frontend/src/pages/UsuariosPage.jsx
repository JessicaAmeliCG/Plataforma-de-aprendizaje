/**
 * UsuariosPage.jsx — Panel de gestión de usuarios exclusivo para el SuperAdmin
 */

import { useState, useEffect } from 'react';
import { Users, Search, Trash2, ShieldCheck, Mail, ShieldAlert, Check, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [filterRole, setFilterRole] = useState('todos');

  const fetchUsuarios = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/usuarios');
      setUsuarios(res.data || []);
    } catch (err) {
      setError(err.message || 'Error al cargar usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleChangeRole = async (userId, newRol) => {
    try {
      await api.patch(`/admin/usuarios/${userId}/rol`, { rol: newRol });
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, rol: newRol } : u));
    } catch (err) {
      alert(err.message || 'Error al cambiar de rol.');
    }
  };

  const handleVerifyManually = async (userId) => {
    try {
      await api.patch(`/admin/usuarios/${userId}/verificar`);
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, is_verified: 1 } : u));
    } catch (err) {
      alert(err.message || 'Error al verificar usuario.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente a este usuario? Esta acción es irreversible y eliminará todas sus inscripciones.')) return;
    try {
      await api.delete(`/admin/usuarios/${userId}`);
      setUsuarios(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.message || 'Error al eliminar usuario.');
    }
  };

  const filtered = usuarios
    .filter(u => filterRole === 'todos' || u.rol === filterRole)
    .filter(u =>
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );

  const ROL_BADGES = {
    superadmin: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    moderador:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    creador:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    estudiante: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="text-rose-500" size={24} />
          Gestión Global de Usuarios
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Busca, filtra, cambia roles, verifica o elimina cualquier cuenta registrada en la plataforma.
        </p>
      </div>

      {/* Buscador + Filtro de rol */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {['todos', 'estudiante', 'creador', 'moderador', 'superadmin'].map(r => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                filterRole === r
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {r === 'todos' ? 'Todos' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />{error}
          <button onClick={fetchUsuarios} className="ml-auto underline text-xs">Reintentar</button>
        </div>
      )}

      {/* Tabla de Usuarios */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 size={32} className="text-rose-500 animate-spin" />
          <p className="text-sm text-gray-500">Cargando lista de usuarios...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No se encontraron usuarios coincidentes.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold bg-gray-50/50 dark:bg-gray-950/20">
                  <th className="p-4">Usuario</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Rol</th>
                  <th className="p-4">Verificación</th>
                  <th className="p-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/40 dark:hover:bg-gray-800/10 transition-colors">
                    {/* Nombre / Avatar */}
                    <td className="p-4 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${u.avatar_color || 'from-primary-500 to-primary-700'} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                        {u.nombre[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">{u.nombre}</span>
                    </td>

                    {/* Email */}
                    <td className="p-4 text-gray-600 dark:text-gray-300">
                      <span className="flex items-center gap-1"><Mail size={12} /> {u.email}</span>
                    </td>

                    {/* Rol (Dropdown) */}
                    <td className="p-4">
                      <select
                        value={u.rol}
                        onChange={e => handleChangeRole(u.id, e.target.value)}
                        className={`text-xs font-bold rounded-full px-3 py-1 border-0 focus:ring-2 focus:ring-rose-500 cursor-pointer ${ROL_BADGES[u.rol] || ROL_BADGES.estudiante}`}
                      >
                        <option value="estudiante">Estudiante</option>
                        <option value="creador">Maestro (Creador)</option>
                        <option value="moderador">Moderador</option>
                        <option value="superadmin">SuperAdmin</option>
                      </select>
                    </td>

                    {/* Estado Verificación */}
                    <td className="p-4">
                      {u.is_verified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
                          <Check size={11} /> Verificado
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-955/20 px-2 py-0.5 rounded-full">
                            <ShieldAlert size={11} /> Pendiente
                          </span>
                          <button
                            onClick={() => handleVerifyManually(u.id)}
                            className="text-[10px] text-primary-500 hover:underline font-semibold"
                          >
                            Verificar ya
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Botón borrar */}
                    <td className="p-4">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        title="Eliminar usuario permanentemente"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
