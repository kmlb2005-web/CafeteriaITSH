import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError, api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'

interface Partida {
  id: number
  menu_dia_id: number
  nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

interface Pedido {
  id: number
  numero: string
  estado: string
  total: number
  fecha_recoleccion: string | null
  partidas: Partida[]
}

function formatearPrecio(precio: number): string {
  return `$${precio.toFixed(2)}`
}

/**
 * Confirmación del pedido recién creado (US2, FR-014): consulta el estado
 * real al montar — la fuente de verdad es el servidor (caso borde: la
 * confirmación no visible tras un fallo de red).
 */
export default function ConfirmacionPage() {
  const { id } = useParams<{ id: string }>()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      setPedido(await api<Pedido>(`/api/pedidos/${id}`))
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo cargar el pedido. Inténtalo de nuevo.',
      )
    } finally {
      setCargando(false)
    }
  }, [id])

  useEffect(() => {
    void cargar()
  }, [cargar, intento])

  if (cargando) {
    return (
      <p role="status" className="py-10 text-center text-muted-foreground">
        Cargando tu pedido…
      </p>
    )
  }

  if (error || !pedido) {
    return (
      <div className="grid justify-items-center gap-4 py-10 text-center">
        <p role="alert" className="text-sm font-medium text-destructive">
          {error ?? 'Pedido no encontrado.'}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIntento((i) => i + 1)}
        >
          Reintentar
        </Button>
      </div>
    )
  }

  const pagado = pedido.estado === 'Pagado'

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Confirmación de pedido</CardTitle>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                pagado
                  ? 'bg-primary/15 text-primary'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {pedido.estado}
            </span>
          </div>
          <CardDescription>
            Folio <span className="font-mono font-semibold">{pedido.numero}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            {pagado
              ? 'Tu pedido está confirmado y pagado. Preséntate en la cafetería a la hora acordada.'
              : 'Tu pedido está pendiente de pago. Puedes pagarlo cuando quieras.'}
          </p>

          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Hora de recolección</dt>
            <dd className="font-semibold">
              {pedido.fecha_recoleccion ?? '—'}
            </dd>
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-heading text-lg font-bold text-primary">
              {formatearPrecio(pedido.total)}
            </dd>
          </dl>

          <ul className="grid gap-2">
            {pedido.partidas.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface-container-low px-3 py-2 text-sm"
              >
                <span className="font-medium">{p.nombre}</span>
                <span className="text-muted-foreground">
                  {p.cantidad} × {formatearPrecio(p.precio_unitario)}
                </span>
                <span className="font-semibold">
                  {formatearPrecio(p.subtotal)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex justify-end">
            {pagado ? (
              <Link
                to="/menu"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Volver al menú
              </Link>
            ) : (
              <Link
                to={`/pedido/${pedido.id}/pago`}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Pagar ahora
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
