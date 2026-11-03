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
import InicioAdminPage from './pages/admin/InicioAdminPage'
import PlatillosPage from './pages/admin/PlatillosPage'
import MenuDelDiaPage from './pages/admin/MenuDelDiaPage'
import CajaInicioPage from './pages/caja/CajaInicioPage'
import CajaPage from './pages/caja/CajaPage'
import EntregasPage from './pages/caja/EntregasPage'
import CocinaPage from './pages/cocina/CocinaPage'
import MenuPage from './pages/menu/MenuPage'
import MisPedidosPage from './pages/pedidos/MisPedidosPage'
import ConfirmarPedidoPage from './pages/pedidos/ConfirmarPedidoPage'
import PagoPage from './pages/pedidos/PagoPage'
import ConfirmacionPage from './pages/pedidos/ConfirmacionPage'

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
            <Route index element={<InicioAdminPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="platillos" element={<PlatillosPage />} />
            <Route path="menu" element={<MenuDelDiaPage />} />
          </Route>

          {/* Cajero — rediseño 007: inicio, captura y entregas (US1) */}
          <Route
            path="/caja"
            element={
              <ProtectedRoute roles={['cajero']}>
                <CajaLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CajaInicioPage />} />
            <Route path="nuevo" element={<CajaPage />} />
            <Route path="entregas" element={<EntregasPage />} />
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

          {/* Cliente: menú (Sprint 2), pedido+pago (Sprint 3), seguimiento (Sprint 5) */}
          <Route
            element={
              <ProtectedRoute roles={['usuario']}>
                <ClienteLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/pedido/confirmar" element={<ConfirmarPedidoPage />} />
            <Route path="/pedido/:id/pago" element={<PagoPage />} />
            <Route
              path="/pedido/:id/confirmacion"
              element={<ConfirmacionPage />}
            />
            <Route path="/mis-pedidos" element={<MisPedidosPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
