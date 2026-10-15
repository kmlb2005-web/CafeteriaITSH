import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
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
import { ApiError, api } from '../../lib/api'
import {
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

function formatearHora(d: Date): string {
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function formatearPrecio(precio: number): string {
  return `$${precio.toFixed(2)}`
}

function flechaRegresar(): ReactNode {
  return (
    <svg
      className="h-6 w-6"
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 5.5 8.5 12l6.5 6.5" />
    </svg>
  )
}

/**
 * Revisión del pedido antes de confirmarlo (FR-014, design §3.3): partidas
 * con quitar, total grande, hora de recolección con la regla de los 10
 * minutos validada también en cliente —el mensaje incluye la hora mínima
 * posible— y CTA **Continuar al pago**. Carrito vacío → vuelta al menú
 * (SC-006).
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
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Volver al menú
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
      // La hora mínima real la calcula el servidor (FR-011); en cliente
      // ofrecemos la misma regla con la hora posible más temprana.
      setError(
        `El pedido debe hacerse con al menos 10 minutos de anticipación. ` +
          `La hora más temprana para recoger es ${formatearHora(
            new Date(Date.now() + 10 * 60 * 1000),
          )}.`,
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
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Link
          to="/menu"
          aria-label="Volver al menú"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-muted"
        >
          {flechaRegresar()}
        </Link>
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold">
            Revisa tu pedido
          </h1>
          <p className="text-xs text-muted-foreground">
            Recogida presencial en la cafetería
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
            <CardDescription>
              El total se calcula con los precios vigentes del menú.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2">
              {lineas.map((l) => (
                <li
                  key={l.menu_dia_id}
                  className="flex min-h-14 flex-wrap items-center gap-3 rounded-md border border-border bg-surface-container-low px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      <span className="text-lg font-extrabold">
                        {l.cantidad}×
                      </span>{' '}
                      {l.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatearPrecio(l.precio * l.cantidad)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="touch"
                    variant="outline"
                    aria-label={`Quitar ${l.nombre}`}
                    onClick={() => setLineas(quitarDelCarrito(l.menu_dia_id))}
                  >
                    ×
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Confirmar</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => void confirmar(e)}
              noValidate
              className="grid gap-4"
            >
              <p className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-heading text-3xl font-extrabold text-primary">
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

              <Button
                type="submit"
                size="touch"
                className="min-h-12"
                disabled={enviando}
              >
                {enviando ? 'Confirmando…' : 'Continuar al pago'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
