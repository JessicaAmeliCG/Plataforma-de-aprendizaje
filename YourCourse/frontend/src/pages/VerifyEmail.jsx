import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Enlace de verificación inválido o faltante.');
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const res = await api.post('/auth/verify-email', { token });
        setSuccess(res.message || 'Tu cuenta ha sido verificada correctamente.');
        setTimeout(() => navigate('/login'), 4000);
      } catch (err) {
        setError(err.message || 'Ocurrió un error al verificar tu cuenta.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 flex flex-col items-center text-center gap-4">
        
        {loading ? (
          <>
            <Loader2 size={48} className="animate-spin text-primary-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-4">Verificando tu cuenta...</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Por favor, espera un momento.</p>
          </>
        ) : error ? (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Error de Verificación</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
            <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline mt-2">
              Volver al inicio de sesión
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cuenta Verificada</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {success} Serás redirigido al inicio de sesión en unos segundos...
            </p>
            <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline mt-2">
              Ir a Iniciar Sesión ahora
            </Link>
          </>
        )}

      </div>
    </div>
  );
}
