import { useNavigate } from 'react-router'
import { useAuth } from '../lib/auth'
import { ROL_ETIQUETA } from '../lib/roles'
import { Button } from './ui/button'

/**
 * Barra superior compartida por los layouts de rol: muestra al usuario en
 * sesión, permite cerrar sesión (US1) desde cualquier pantalla y, con el
 * rediseño (spec 007), abre el menú lateral en móvil mediante `onAbrirMenu`
 * (contrato §4). En escritorio la hamburguesa no se muestra.
 */
export function RoleHeader({
  titulo,
  onAbrirMenu,
}: {
  titulo: string
  onAbrirMenu?: () => void
}) {
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  async function onLogout(): Promise<void> {
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface-container-lowest/95 backdrop-blur after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-gradient-to-r after:from-primary after:to-secondary after:content-['']">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        {onAbrirMenu && (
          <Button
            type="button"
            variant="ghost"
            size="touch"
            aria-label="Abrir menú"
            className="-ms-1 h-11 w-11 px-0 lg:hidden"
            onClick={onAbrirMenu}
          >
            <svg
              className="h-6 w-6"
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </Button>
        )}
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm shadow-primary/40"
        >
          <svg className="h-5 w-5" aria-hidden="true" focusable="false">
            <use href="/icons.svg#icon-bebidas" />
          </svg>
        </span>
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
