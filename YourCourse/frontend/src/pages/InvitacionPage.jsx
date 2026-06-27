import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, GraduationCap } from 'lucide-react';
import { api } from '../services/api';
import useAuthStore from '../stores/authStore';

export default function InvitacionPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { token: authToken, user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invitacion, setInvitacion] = useState(null);
  const [aceptando, setAceptando] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Falta el token de invitación.');
      setLoading(false);
      return;
    }

    const verificar = async () => {
      try {
        const res = await api.get(`/invitaciones/verificar?token=${token}`);
        setInvitacion(res.invitacion);
      } catch (err) {
        setError(err.message || 'La invitación es inválida o ya fue utilizada.');
      } finally {
        setLoading(false);
      }
    };

    verificar();
  }, [token]);

  const handleAceptar = async () => {
    setAceptando(true);
    try {
      const res = await api.post('/invitaciones/aceptar', { token });
      alert(res.message);
      navigate(`/student/dashboard`);
    } catch (err) {
      alert(err.message || 'Error al aceptar invitación.');
    } finally {
      setAceptando(false);
    }
  };

  const isSameUser = user && invitacion && user.email.toLowerCase() === invitacion.email.toLowerCase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 flex flex-col items-center text-center gap-4 animate-fade-in-up">
        
        {loading ? (
          <>
            <Loader2 size={48} className="animate-spin text-primary-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-4">Validando invitación...</h2>
          </>
        ) : error ? (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invitación Inválida</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
            <Link to="/" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline mt-2">
              Volver al Inicio
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center">
              <GraduationCap size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">¡Has sido invitado!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tienes una invitación pendiente para unirte al curso:
            </p>
            <div className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="font-bold text-gray-900 dark:text-white">{invitacion.curso_titulo}</p>
              <p className="text-xs text-gray-500 mt-1">Para: {invitacion.email}</p>
            </div>

            {authToken ? (
              isSameUser ? (
                <button onClick={handleAceptar} disabled={aceptando}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm transition-all disabled:opacity-50">
                  {aceptando ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Aceptar e Inscribirme
                </button>
              ) : (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm text-left">
                  <AlertCircle size={16} className="inline mr-1" />
                  Has iniciado sesión como <strong>{user.email}</strong>, pero esta invitación es para <strong>{invitacion.email}</strong>. Por favor, cierra sesión e ingresa con la cuenta correcta.
                </div>
              )
            ) : (
              <div className="w-full mt-4 space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Debes iniciar sesión o registrarte para continuar.</p>
                <Link to={`/register?email=${encodeURIComponent(invitacion.email)}&token=${token}`}
                  className="block w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm transition-all">
                  Crear cuenta nueva
                </Link>
                <Link to="/login"
                  className="block w-full py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-all">
                  Ya tengo cuenta (Iniciar sesión)
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
