import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import CreatorLayout    from './layouts/CreatorLayout'
import DashboardHome    from './pages/DashboardHome'
import CursosPage       from './pages/CursosPage'
import CursoDetalle     from './pages/CursoDetalle'
import CursoViewer      from './pages/CursoViewer'
import NuevoCurso       from './pages/NuevoCurso'
import EstudiantesPage  from './pages/EstudiantesPage'
import ComunidadPage    from './pages/ComunidadPage'
import AnaliticasPage   from './pages/AnaliticasPage'
import AjustesPage      from './pages/AjustesPage'
import LoginPage        from './pages/LoginPage'
import RegisterPage     from './pages/RegisterPage'
import StudentLayout    from './layouts/StudentLayout'
import StudentDashboard from './pages/StudentDashboard'
import StudentCursoViewer from './pages/StudentCursoViewer'
import useAuthStore     from './stores/authStore'
import { useEffect } from 'react'
import PageTransition   from './components/PageTransition'

function PrivateRoute({ children }) {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  // Inicializar temas globalmente
  useEffect(() => {
    const root = document.documentElement;
    
    // Tema oscuro/claro
    const tema = localStorage.getItem('yc_tema') || 'system';
    if (tema === 'dark')  root.classList.add('dark');
    else if (tema === 'light') root.classList.remove('dark');
    else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
      else root.classList.remove('dark');
    }

    // Estilo visual (colores)
    const estilo = localStorage.getItem('yc_estilo') || 'profesional';
    root.classList.remove('theme-vibrante', 'theme-bosque', 'theme-oceano', 'theme-ocaso');
    if (estilo !== 'profesional') {
      root.classList.add(`theme-${estilo}`);
    }
  }, []);

  return (
    <BrowserRouter>
      <PageTransition>
        <Routes>
          {/* Públicas */}
          <Route path="/"         element={<Navigate to="/login" replace />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Panel del Creador — protegido */}
          <Route path="/creator" element={<PrivateRoute><CreatorLayout /></PrivateRoute>}>
            <Route path="dashboard"        element={<DashboardHome />} />
            <Route path="cursos"           element={<CursosPage />} />
            <Route path="cursos/nuevo"     element={<NuevoCurso />} />
            <Route path="cursos/:id"       element={<CursoDetalle />} />
            <Route path="cursos/:id/ver"   element={<CursoViewer />} />
            <Route path="estudiantes"      element={<EstudiantesPage />} />
            <Route path="comunidad"        element={<ComunidadPage />} />
            <Route path="analiticas"       element={<AnaliticasPage />} />
            <Route path="ajustes"          element={<AjustesPage />} />
          </Route>

          {/* Panel de Estudiante — protegido */}
          <Route path="/student" element={<PrivateRoute><StudentLayout /></PrivateRoute>}>
            <Route path="dashboard"        element={<StudentDashboard />} />
            <Route path="cursos/:id/ver"   element={<StudentCursoViewer />} />
            <Route path="comunidad"        element={<ComunidadPage />} />
            <Route path="ajustes"          element={<AjustesPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </PageTransition>
    </BrowserRouter>
  )
}

export default App
