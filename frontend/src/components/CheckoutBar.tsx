import { cn } from '../lib/utils'
import { Button } from './ui/button'

export interface CheckoutBarProps {
  /** Número de productos con cantidad > 0 */
  cantidad: number
  /** Suma de precio × cantidad */
  total: number
  /** "Ver cobro" (caja) | "Ver pedido" (cliente) */
  etiquetaCTA: string
  onCTA: () => void
  /** Carrito vacío → la barra no se muestra (C1) */
  deshabilitado?: boolean
  /** Clases extra para variantes responsivas (ej. `lg:hidden` en caja) */
  className?: string
}

/**
 * Barra flotante de resumen (contrato §3): en móvil queda fija encima de
 * la `BottomBar` (bottom-14) con CTA ≥48 px; en escritorio se muestra en
 * el flujo del contenido salvo que la página la oculte con `className`
 * (caja usa su panel lateral derecho).
 */
export function CheckoutBar({
  cantidad,
  total,
  etiquetaCTA,
  onCTA,
  deshabilitado = false,
  className,
}: CheckoutBarProps) {
  if (cantidad <= 0 || deshabilitado) return null

  return (
    <>
      {/* Reserva de espacio en móvil para que el contenido no quede tapado */}
      <div className="h-16 lg:hidden" aria-hidden="true" />
      <div
        className={cn(
          'fixed inset-x-0 bottom-14 z-20 flex items-center justify-between gap-3 border-t border-border bg-surface-container-lowest/95 px-4 py-3 backdrop-blur lg:static lg:z-auto lg:border-x-0 lg:border-b-0 lg:rounded-t-xl lg:px-0 lg:py-4',
          className,
        )}
      >
        <div>
          <p className="text-xs text-muted-foreground">
            {cantidad} platillo{cantidad === 1 ? '' : 's'}
          </p>
          {/* C4: total en peso 800 con formato $N.NN */}
          <p className="font-heading text-xl font-extrabold text-primary">
            ${total.toFixed(2)}
          </p>
        </div>
        <Button
          type="button"
          size="touch"
          className="min-h-12"
          onClick={onCTA}
        >
          {etiquetaCTA}
        </Button>
      </div>
    </>
  )
}
