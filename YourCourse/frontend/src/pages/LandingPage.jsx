import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Rocket, BookOpen, Users, Video, Shield, 
  ChevronRight, CheckCircle, Play, Globe, Star
} from 'lucide-react';
import { useT } from '../contexts/I18nContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const t = useT();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans selection:bg-primary-500 selection:text-white overflow-x-hidden">
      
      {/* Navbar con Glassmorphism */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">
              YourCourse
            </span>
          </div>
          <div className="hidden md:flex space-x-8 items-center font-medium">
            <a href="#caracteristicas" className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">Características</a>
            <a href="#saas" className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">Para Instituciones</a>
            <a href="#cursos" className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">Catálogo Libre</a>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-700 hover:text-primary-600 dark:text-gray-200 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              Iniciar Sesión
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 shadow-lg shadow-primary-500/30 hover:-translate-y-1 transition-all flex items-center gap-2 group"
            >
              Regístrate Gratis
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex items-center justify-center min-h-[90vh]">
        {/* Abstract Background Shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob dark:mix-blend-screen dark:opacity-30"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob animation-delay-2000 dark:mix-blend-screen dark:opacity-30"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob animation-delay-4000 dark:mix-blend-screen dark:opacity-30"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium mb-8 border border-primary-200 dark:border-primary-800 shadow-sm animate-fade-in-up">
            <Rocket className="w-4 h-4" />
            <span>La nueva era del aprendizaje digital</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight animate-fade-in-up animation-delay-100">
            Aprende sin límites, <br className="hidden md:block"/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-indigo-500 to-purple-600 dark:from-primary-400 dark:via-indigo-400 dark:to-purple-400">
              enseña sin fronteras.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
            YourCourse es la plataforma dual donde puedes formarte gratis en nuestra academia abierta, o alquilar tu propio espacio educativo como institución (SaaS).
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 animate-fade-in-up animation-delay-300">
            <button onClick={() => navigate('/register')} className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 shadow-xl shadow-primary-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group">
              Explorar Cursos Gratis
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg text-gray-700 dark:text-white bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 shadow-lg hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
              <Play className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="currentColor" />
              Ver Demo Institucional
            </button>
          </div>
        </div>
      </section>

      {/* Características Section */}
      <section id="caracteristicas" className="py-24 bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Todo lo que necesitas para triunfar</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Nuestra tecnología te respalda tanto si eres un estudiante curioso como si eres el administrador de una gran academia.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Video, title: 'Reproductor Integrado', desc: 'Soporte nativo para videos y enlaces directos sin salir de la plataforma.', color: 'from-blue-500 to-cyan-500' },
              { icon: Globe, title: 'Multi-Idioma Real', desc: 'Aprende y enseña en Español, Inglés, Francés o Portugués al instante.', color: 'from-emerald-500 to-teal-500' },
              { icon: Users, title: 'Comunidad Viva', desc: 'Foros integrados en cada curso para interactuar directamente con profesores y alumnos.', color: 'from-rose-500 to-pink-500' },
              { icon: Shield, title: 'Seguridad Total', desc: 'Datos encriptados, políticas de contraseña robustas y protección de cuentas.', color: 'from-amber-500 to-orange-500' },
              { icon: Star, title: 'Sistema de Reseñas', desc: 'Valida la calidad de los cursos y creadores mediante un sistema transparente de calificación.', color: 'from-purple-500 to-indigo-500' },
              { icon: BookOpen, title: 'Progreso Detallado', desc: 'Analíticas avanzadas para que no pierdas de vista tu meta de aprendizaje.', color: 'from-primary-500 to-blue-600' }
            ].map((feature, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-black/50 hover:-translate-y-2 transition-all duration-300 group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="text-white w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modelo Dual (SaaS) */}
      <section id="saas" className="py-24 bg-gray-50 dark:bg-gray-800 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.05]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wider uppercase text-sm">Modelo B2B & SaaS</span>
              <h2 className="text-4xl md:text-5xl font-black mt-3 mb-6 leading-tight">¿Tienes tu propia academia? <br/>Te rentamos el espacio.</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Nuestra plataforma no solo es para estudiantes. Si eres una institución, empresa o un gran creador, te ofrecemos un entorno privado con tu propio <strong>Panel SuperAdmin</strong>, moderadores y profesores ilimitados.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Cuentas ilimitadas para alumnos (siempre gratis)',
                  'Múltiples profesores y moderadores por institución',
                  'Gestión de cobros y privacidad de cursos personalizable',
                  'Marca blanca y dominio personalizado (Próximamente)'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
                    <CheckCircle className="text-emerald-500 w-6 h-6 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button className="px-8 py-4 rounded-2xl font-bold text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-xl hover:-translate-y-1 transition-all">
                Contactar Ventas
              </button>
            </div>
            <div className="flex-1 relative w-full">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl transform rotate-3 scale-105 opacity-20 dark:opacity-40 animate-pulse"></div>
              <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Estudiantes felices" className="relative rounded-3xl shadow-2xl border-4 border-white dark:border-gray-700 object-cover aspect-video" />
              
              {/* Floating Card */}
              <div className="absolute -bottom-8 -left-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-4 animate-bounce hover:animate-none">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-emerald-600 dark:text-emerald-400 w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Escalabilidad</p>
                  <p className="font-bold text-gray-900 dark:text-white">Alumnos ilimitados</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-gray-900 relative z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-tr from-primary-600 to-indigo-700 rounded-[3rem] p-12 md:p-20 shadow-2xl shadow-primary-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            <div className="relative z-10 text-white">
              <h2 className="text-4xl md:text-5xl font-black mb-6">Empieza tu viaje hoy mismo</h2>
              <p className="text-lg md:text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
                Únete a miles de estudiantes que ya están aprendiendo gratis, o conviértete en creador y comparte tu conocimiento con el mundo.
              </p>
              <button onClick={() => navigate('/register')} className="px-10 py-4 rounded-2xl font-bold text-xl text-primary-700 bg-white hover:bg-gray-50 shadow-xl hover:scale-105 transition-all">
                Crear Cuenta Gratis
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12 text-center text-gray-500 dark:text-gray-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-black text-xl text-gray-900 dark:text-white">
            <BookOpen className="text-primary-600 w-6 h-6" />
            YourCourse
          </div>
          <p>© {new Date().getFullYear()} YourCourse Platform. Todos los derechos reservados.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-primary-600 transition-colors">Términos</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
