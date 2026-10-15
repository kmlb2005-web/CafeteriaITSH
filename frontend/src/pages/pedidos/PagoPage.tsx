import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError, api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'

interface Pedido {
  id: number
  numero: string
  estado: string
  total: number
  fecha_recoleccion: string | null
  partidas: unknown[]
}

function formatearPrecio(precio: number): string {
  return `$${precio.toFixed(2)}`
}

/**
 * Paso de pago del pedido (FR-012, design §3.4): sin datos de tarjeta —
 * el adaptador del proveedor es simulado y solo devuelve una referencia
 * (SC-S3-04). Un rechazo deja el pedido `Pendiente` y ofrece **Reintentar
 * pago** o **Cancelar pedido** (cancelación propia vía
 * `POST /api/pedidos/:id/cancelar`, decisión 2026-10-14).
 */
export default function PagoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [simularRechazo, setSimularRechazo] = useState(false)
  const [pagando, setPagando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [intento, setIntento] = useState(0)

  const cargar = useCallback(async () => {
    setCargando(true)
    setErrorCarga(null)
    try {
      setPedido(await api<Pedido>(`/api/pedidos/${id}`))
    } catch (err) {
      setErrorCarga(
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

  async function pagar(): Promise<void> {
    setError(null)
    setPagando(true)
    try {
      await api(`/api/pedidos/${id}/pago`, {
        method: 'POST',
        body: JSON.stringify({ simular_rechazo: simularRechazo }),
      })
      navigate(`/pedido/${id}/confirmacion`)
    } catch (err) {
      // Rechazo (402): el pedido queda Pendiente y se ofrece reintentar o
      // cancelar sin perder el folio (SC-S3-03).
      setError(
        err instanceof ApiError
          ? err.message
          : 'El pago no pudo procesarse. Inténtalo de nuevo.',
      )
    } finally {
      setPagando(false)
    }
  }

  async function cancelarPedido(): Promise<void> {
    setError(null)
    setCancelando(true)
    try {
      await api(`/api/pedidos/${id}/cancelar`, { method: 'POST' })
      navigate('/mis-pedidos')
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo cancelar el pedido.',
      )
    } finally {
      setCancelando(false)
    }
  }

  if (cargando) {
    return (
      <p role="status" className="py-10 text-center text-muted-foreground">
        Cargando pedido…
      </p>
    )
  }

  if (errorCarga || !pedido) {
    return (
      <div className="grid justify-items-center gap-4 py-10 text-center">
        <p role="alert" className="text-sm font-medium text-destructive">
          {errorCarga ?? 'Pedido no encontrado.'}
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

  if (pedido.estado === 'Pagado') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Este pedido ya está pagado</CardTitle>
          <CardDescription>
            Folio <span className="font-mono font-semibold">{pedido.numero}</span>{' '}
            · estado Pagado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to={`/pedido/${pedido.id}/confirmacion`}
            className="font-semibold text-primary hover:underline"
          >
            Ver confirmación
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (pedido.estado === 'Cancelado') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pedido cancelado</CardTitle>
          <CardDescription>
            Folio <span className="font-mono font-semibold">{pedido.numero}</span>{' '}
            · estado Cancelado. Ya no requiere pago.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to="/mis-pedidos"
            className="font-semibold text-primary hover:underline"
          >
            Ver mis pedidos
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto grid max-w-md gap-4 entrada">
      <Card>
        <CardHeader>
          <CardTitle>Pagar pedido</CardTitle>
          <CardDescription>
            Folio <span className="font-mono font-semibold">{pedido.numero}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Total a pagar</span>
            <span className="font-heading text-3xl font-extrabold text-primary">
              {formatearPrecio(pedido.total)}
            </span>
          </p>

          <p className="rounded-md bg-surface-container-low px-3 py-2 text-xs text-muted-foreground">
            Este proceso no captura datos de tarjeta: el pago es simulado
            (demo) y solo devuelve una referencia.
          </p>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={simularRechazo}
              onChange={(e) => setSimularRechazo(e.target.checked)}
            />
            Simular rechazo (demo)
          </label>

          {error && (
            <div
              role="alert"
              className="grid gap-3 rounded-md border border-destructive/40 bg-surface-container-low p-3"
            >
              <p className="text-sm font-medium text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground">
                Tu pedido{' '}
                <span className="font-mono font-semibold">{pedido.numero}</span>{' '}
                sigue Pendiente: puedes reintentar el pago o cancelarlo.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="touch"
                  className="min-h-12"
                  disabled={pagando || cancelando}
                  onClick={() => void pagar()}
                >
                  {pagando ? 'Procesando…' : 'Reintentar pago'}
                </Button>
                <Button
                  type="button"
                  size="touch"
                  variant="outline"
                  className="min-h-12"
                  disabled={pagando || cancelando}
                  onClick={() => void cancelarPedido()}
                >
                  Cancelar pedido
                </Button>
              </div>
            </div>
          )}

          {!error && (
            <Button
              type="button"
              size="touch"
              className="min-h-12"
              disabled={pagando}
              onClick={() => void pagar()}
            >
              {pagando ? (
                <span role="status" className="inline-flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                    />
                  </svg>
                  Procesando tu pago…
                </span>
              ) : (
                'Pagar ahora'
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
