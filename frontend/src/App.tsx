import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider, useAuth } from './lib/auth'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { RUTA_POR_ROL } from './lib/roles'
import { AdminLayout } from './layouts/AdminLayout'
import { CajaLayout } from './layouts/CajaLayout'
import { CocinaLayout } from './layouts/CocinaLayout'
import { ClienteLayout } from './layouts/ClienteLayout'
import LoginPage from './pages/login/LoginPage'
import RegistroPage from './pages/registro/RegistroPage'
import UsuariosPage from './pages/admin/UsuariosPage'
import CajaPage from './pages/caja/CajaPage'
import CocinaPage from './pages/cocina/CocinaPage'
import MenuPage from './pages/menu/MenuPage'
import MisPedidosPage from './pages/pedidos/MisPedidosPage'

/** Raíz: según la sesión, a la pantalla del rol o al login. */
function Inicio() {
  const { usuario, cargando } = useAuth()
  if (cargando) {
    return (
      <div
        role="status"
        className="flex min-h-screen items-center justify-center text-muted-foreground"
      >
        Cargando…
      </div>
    )
  }
  if (!usuario) return <Navigate to="/login" replace />
  return <Navigate to={RUTA_POR_ROL[usuario.rol]} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />

          {/* Administrador (US2) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['administrador']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<UsuariosPage />} />
          </Route>

          {/* Cajero — esqueletos en Sprint 1, pantalla en Sprint 4 */}
          <Route
            path="/caja"
            element={
              <ProtectedRoute roles={['cajero']}>
                <CajaLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CajaPage />} />
          </Route>

          {/* Cocinero — esqueletos en Sprint 1, pantalla en Sprint 4 */}
          <Route
            path="/cocina"
            element={
              <ProtectedRoute roles={['cocinero']}>
                <CocinaLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CocinaPage />} />
          </Route>

          {/* Cliente: menú (Sprint 2) y seguimiento (Sprint 5) */}
          <Route
            element={
              <ProtectedRoute roles={['usuario']}>
                <ClienteLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/mis-pedidos" element={<MisPedidosPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
