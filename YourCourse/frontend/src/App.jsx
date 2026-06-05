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
import useAuthStore     from './stores/authStore'

function PrivateRoute({ children }) {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
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

        {/* 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
