import { useNavigate } from 'react-router'
import { useAuth } from '../lib/auth'
import { ROL_ETIQUETA } from '../lib/roles'
import { Button } from './ui/button'

/**
 * Barra superior compartida por los layouts de rol: muestra al usuario en
 * sesión y permite cerrar sesión (US1) desde cualquier pantalla.
 */
export function RoleHeader({ titulo }: { titulo: string }) {
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  async function onLogout(): Promise<void> {
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface-container-lowest/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-lg font-bold leading-tight">
            {titulo}
          </p>
          {usuario && (
            <p className="truncate text-xs text-muted-foreground">
              {usuario.nombre} · {ROL_ETIQUETA[usuario.rol]}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void onLogout()}
        >
          Cerrar sesión
        </Button>
      </div>
    </header>
  )
}
