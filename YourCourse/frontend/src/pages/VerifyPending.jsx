/**
 * VerifyPending.jsx — Página de espera de verificación
 * Se muestra después de registrarse exitosamente.
 */
import { MailCheck, GraduationCap, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

export default function VerifyPending() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  const handleBackToLogin = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <GraduationCap className="text-primary-600" size={32} />
          <span className="font-bold text-gray-900 dark:text-white text-2xl">YourCourse</span>
        </div>

        {/* Ícono principal */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <MailCheck size={48} className="text-primary-600 dark:text-primary-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8 space-y-4">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            ¡Revisa tu correo!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            Hemos enviado un enlace de verificación a{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {user?.email || 'tu correo electrónico'}
            </span>
            . Por favor revisa tu bandeja de entrada (y la carpeta de spam) para activar tu cuenta.
          </p>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-400">
            <strong>Nota:</strong> Si estás en un entorno de desarrollo local, el correo puede no llegar. Puedes verificar tu cuenta manualmente en la base de datos o usar el enlace del log de servidor.
          </div>

          <button
            onClick={handleBackToLogin}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
          >
            <ArrowLeft size={16} />
            Volver al inicio de sesión
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600">
          © {new Date().getFullYear()} YourCourse Platform
        </p>
      </div>
    </div>
  );
}
