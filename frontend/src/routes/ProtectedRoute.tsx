import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { useAuth } from '../lib/auth'
import { RUTA_POR_ROL, ROL_ETIQUETA, type Rol } from '../lib/roles'

/**
 * Guard de sesión + rol (FR-003):
 * - sin sesión → redirige a /login
 * - rol no permitido → pantalla de acceso denegado (US1.4)
 */
export function ProtectedRoute({
  roles,
  children,
}: {
  roles: Rol[]
  children: ReactNode
}) {
  const { usuario, cargando } = useAuth()
  const location = useLocation()

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

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  }

  if (!roles.includes(usuario.rol)) {
    return <AccesoDenegado />
  }

  return <>{children}</>
}

function AccesoDenegado() {
  const { usuario } = useAuth()
  const destino = usuario ? RUTA_POR_ROL[usuario.rol] : '/login'

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-heading text-2xl font-bold">Acceso denegado</h1>
      <p className="text-muted-foreground">
        Tu rol ({usuario ? ROL_ETIQUETA[usuario.rol] : ''}) no tiene permiso
        para acceder a esta sección.
      </p>
      <Link
        to={destino}
        className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground"
      >
        Volver a mi sección
      </Link>
    </main>
  )
}
