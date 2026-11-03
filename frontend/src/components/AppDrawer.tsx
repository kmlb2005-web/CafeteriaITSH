import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { useAuth } from '../lib/auth'
import { ROL_ETIQUETA } from '../lib/roles'
import { cn } from '../lib/utils'
import { Button } from './ui/button'

/** Entrada del menú lateral (contrato navegacion-ui.md §1). */
export interface ItemDrawer {
  /** Ruta de la app (relativa al rol, ej. "/caja") */
  to: string
  /** Texto en español, ej. "Capturar pedido" */
  etiqueta: string
  /** Id de symbol en /icons.svg (opcional) */
  icono?: string
  /** Cierra el drawer al navegar (default true) */
  fin?: boolean
}

export interface AppDrawerProps {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  items: ItemDrawer[]
  /** Ruta → contador a mostrar en badge (D5) */
  contador?: Record<string, number>
  /** En lg se muestra como panel lateral fijo (default true) */
  escritorioFijo?: boolean
}

/**
 * Menú lateral compartido por los 4 roles (contrato §1): en móvil entra
 * desde la izquierda sobre un overlay y se cierra con Escape o al
 * navegar; en escritorio queda como rail lateral siempre visible (D3).
 */
export function AppDrawer({
  abierto,
  onCerrar,
  titulo,
  items,
  contador = {},
  escritorioFijo = true,
}: AppDrawerProps) {
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!abierto) return
    function alTeclear(evento: KeyboardEvent): void {
      if (evento.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [abierto, onCerrar])

  async function alCerrarSesion(): Promise<void> {
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {abierto && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onCerrar}
        />
      )}
      <nav
        aria-label={`Menú lateral de ${titulo}`}
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-e border-border bg-surface-container-lowest shadow-[10px_0_32px_-22px_rgba(28,25,23,0.9)] transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0 lg:shadow-none lg:transition-none',
          abierto ? 'translate-x-0' : '-translate-x-full',
          !escritorioFijo && 'lg:hidden',
        )}
      >
        <div className="border-b border-border bg-gradient-to-b from-primary/10 to-transparent px-4 py-4">
          <p className="truncate font-heading text-base font-bold">
            {usuario?.nombre ?? '…'}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {usuario && `${ROL_ETIQUETA[usuario.rol]} · `}
            {titulo}
          </p>
        </div>

        <ul className="flex-1 overflow-y-auto px-2 py-3">
          {items.map((item) => {
            const n = contador[item.to] ?? 0
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to.split('/').length <= 2}
                  onClick={() => {
                    if (item.fin !== false) onCerrar()
                  }}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-lg border-s-2 px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                      isActive
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-transparent text-foreground hover:translate-x-0.5 hover:bg-muted',
                    )
                  }
                >
                  {item.icono && (
                    <svg
                      className="h-5 w-5 shrink-0"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <use href={`/icons.svg#${item.icono}`} />
                    </svg>
                  )}
                  <span className="truncate">{item.etiqueta}</span>
                  {n > 0 && (
                    <span className="ms-auto rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/40">
                      {n}
                    </span>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>

        <div className="border-t border-border px-3 py-3">
          <Button
            type="button"
            variant="outline"
            size="touch"
            className="w-full"
            onClick={() => void alCerrarSesion()}
          >
            Cerrar sesión
          </Button>
        </div>
      </nav>
    </>
  )
}
