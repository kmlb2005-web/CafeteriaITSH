import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError, api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  actualizarCantidad,
  leerCarrito,
  quitarDelCarrito,
  totalCarrito,
  vaciarCarrito,
  type LineaCarrito,
} from '../../lib/carrito'

const pad = (n: number): string => String(n).padStart(2, '0')

function formatearLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

function formatearPrecio(precio: number): string {
  return `$${precio.toFixed(2)}`
}

/**
 * Revisión del pedido antes de confirmarlo (FR-010): partidas con sus
 * cantidades, total visible y hora de recolección con la regla de los
 * 10 minutos validada también en cliente (FR-011, FR-021).
 */
export default function ConfirmarPedidoPage() {
  const navigate = useNavigate()
  const [lineas, setLineas] = useState<LineaCarrito[]>(() => leerCarrito())
  const [hora, setHora] = useState(() =>
    formatearLocal(new Date(Date.now() + 30 * 60 * 1000)),
  )
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const total = totalCarrito(lineas)

  if (lineas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tu carrito está vacío</CardTitle>
          <CardDescription>
            Agrega platillos del menú del día para armar tu pedido.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to="/menu"
            className="font-semibold text-primary hover:underline"
          >
            Ver el menú del día
          </Link>
        </CardContent>
      </Card>
    )
  }

  async function confirmar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault()
    setError(null)

    const recogida = new Date(hora)
    if (Number.isNaN(recogida.getTime())) {
      setError('La hora de recolección no es válida.')
      return
    }
    if (recogida.getTime() < Date.now() + 10 * 60 * 1000) {
      setError(
        'El pedido debe hacerse con al menos 10 minutos de anticipación. Elige una hora de recolección más alejada.',
      )
      return
    }

    setEnviando(true)
    try {
      const pedido = await api<{ id: number }>('/api/pedidos', {
        method: 'POST',
        body: JSON.stringify({
          items: lineas.map((l) => ({
            menu_dia_id: l.menu_dia_id,
            cantidad: l.cantidad,
          })),
          fecha_recoleccion: hora,
        }),
      })
      vaciarCarrito()
      navigate(`/pedido/${pedido.id}/pago`)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo confirmar el pedido. Inténtalo de nuevo.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card>
        <CardHeader>
          <CardTitle>Revisa tu pedido</CardTitle>
          <CardDescription>
            El total se calcula con los precios vigentes del menú.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <ul className="grid gap-2">
            {lineas.map((l) => (
              <li
                key={l.menu_dia_id}
                className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface-container-low px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{l.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatearPrecio(l.precio)} c/u
                  </p>
                </div>
                <label
                  className="text-xs text-muted-foreground"
                  htmlFor={`cantidad-${l.menu_dia_id}`}
                >
                  Cantidad
                </label>
                <Input
                  id={`cantidad-${l.menu_dia_id}`}
                  aria-label={`Cantidad de ${l.nombre}`}
                  type="number"
                  min={1}
                  max={99}
                  className="h-9 w-16"
                  value={l.cantidad}
                  onChange={(e) =>
                    setLineas(
                      actualizarCantidad(
                        l.menu_dia_id,
                        Number(e.target.value) || 1,
                      ),
                    )
                  }
                />
                <span className="w-16 text-right text-sm font-semibold">
                  {formatearPrecio(l.precio * l.cantidad)}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setLineas(quitarDelCarrito(l.menu_dia_id))}
                >
                  Quitar
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Confirmar</CardTitle>
          <CardDescription>Recogida presencial en la cafetería.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => void confirmar(e)}
            noValidate
            className="grid gap-4"
          >
            <p className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-heading text-xl font-bold text-primary">
                {formatearPrecio(total)}
              </span>
            </p>

            <div className="grid gap-2">
              <Label htmlFor="hora">Hora de recolección</Label>
              <Input
                id="hora"
                type="datetime-local"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 10 minutos de anticipación.
              </p>
            </div>

            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={enviando}>
              {enviando ? 'Confirmando…' : 'Confirmar pedido'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
