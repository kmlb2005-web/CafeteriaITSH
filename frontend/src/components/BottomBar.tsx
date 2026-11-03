import { NavLink } from 'react-router'
import { cn } from '../lib/utils'

export interface ItemBottomBar {
  to: string
  /** Texto en español, ej. "Caja" | "Entregas" | "Menú" | "Mis pedidos" */
  etiqueta: string
  /** Id de symbol en /icons.svg (obligatorio) */
  icono: string
}

export interface BottomBarProps {
  /** 2 items exactos por rol (contrato §2) */
  items: ItemBottomBar[]
  /** Ruta → contador a mostrar en badge (B3) */
  contador?: Record<string, number>
}

/**
 * Barra inferior de secciones para caja y cliente (contrato §2): solo en
 * móvil (`lg:hidden`), pestañas ≥56 px de alto (área táctil ≥44 px, B1) y
 * badge pill cuando la ruta tiene contador.
 */
export function BottomBar({ items, contador = {} }: BottomBarProps) {
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface-container-lowest/95 shadow-[0_-12px_32px_-24px_rgba(28,25,23,0.8)] backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex">
        {items.map((item) => {
          const n = contador[item.to] ?? 0
          return (
            <li key={item.to} className="min-w-0 flex-1">
              <NavLink
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    'flex min-h-14 flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-xs font-semibold transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'relative rounded-full px-3 py-1 transition-all duration-200',
                        isActive && 'bg-primary/10 text-primary shadow-sm',
                      )}
                    >
                      <svg
                        className="h-5 w-5"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <use href={`/icons.svg#${item.icono}`} />
                      </svg>
                      {n > 0 && (
                        <span className="absolute -top-1.5 -right-3 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground shadow-sm shadow-primary/40">
                          {n}
                        </span>
                      )}
                    </span>
                    <span className="max-w-full truncate">{item.etiqueta}</span>
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
