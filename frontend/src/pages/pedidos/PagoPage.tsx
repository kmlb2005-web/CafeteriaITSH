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
 * Paso de pago del pedido (FR-012): sin datos de tarjeta — el adaptador
 * del proveedor es simulado y solo devuelve una referencia (SC-S3-04).
 * Un rechazo deja el pedido `Pendiente` y permite reintentar (US1.5).
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
      setError(
        err instanceof ApiError
          ? err.message
          : 'El pago no pudo procesarse. Inténtalo de nuevo.',
      )
    } finally {
      setPagando(false)
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
            Folio {pedido.numero} · estado Pagado.
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

  return (
    <div className="mx-auto max-w-md">
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
            <span className="font-heading text-xl font-bold text-primary">
              {formatearPrecio(pedido.total)}
            </span>
          </p>

          <p className="rounded-md bg-surface-container-low px-3 py-2 text-xs text-muted-foreground">
            Pago en línea simulado (demo): no se solicita ni se almacena
            información de tarjetas.
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
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <Button type="button" disabled={pagando} onClick={() => void pagar()}>
            {pagando ? 'Procesando…' : 'Pagar ahora'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
