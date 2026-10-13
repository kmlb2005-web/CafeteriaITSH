import { useCallback, useEffect, useState } from 'react'
import { ApiError, api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'

interface PedidoCocina {
  id: number
  numero: string
  tipo: 'anticipado' | 'mostrador'
  estado: string
  cliente_nombre: string | null
  fecha_recoleccion: string | null
  creado_en: string
  orden: number
  partidas: { nombre: string; cantidad: number }[]
}

/** Pasos que el cocinero puede aplicar (enum del servidor, R2). */
const SIGUIENTE: Record<string, { estado: string; etiqueta: string }> = {
  Pagado: { estado: 'En preparación', etiqueta: 'Iniciar preparación' },
  'En preparación': { estado: 'Listo', etiqueta: 'Marcar listo' },
}

const COLOR_ESTADO: Record<string, string> = {
  Pagado: 'bg-status-paid',
  'En preparación': 'bg-status-preparing',
  Listo: 'bg-status-ready',
}

/** La cocina se actualiza sola cada 4 s (FR-017, SC-S4-03, research R5). */
const SONDEO_MS = 4000

function horaLocal(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Tablero de cocina (KDS, US2, FR-017/FR-018): pedidos pagados de ambos
 * orígenes ordenados por llegada, con avance de estados en un toque y
 * actualización sin recarga manual. Alto contraste y botones ≥44 px (FR-020).
 */
export default function CocinaPage() {
  const [pedidos, setPedidos] = useState<PedidoCocina[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<number | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const recargar = useCallback(async () => {
    try {
      const datos = await api<{ pedidos: PedidoCocina[] }>('/api/cocina/pedidos')
      setPedidos(datos.pedidos)
      setError(null)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo consultar la cocina.',
      )
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void recargar()
    const timer = window.setInterval(() => {
      void recargar()
    }, SONDEO_MS)
    return () => window.clearInterval(timer)
  }, [recargar])

  async function avanzar(pedido: PedidoCocina): Promise<void> {
    const paso = SIGUIENTE[pedido.estado]
    if (!paso) return
    setOcupado(pedido.id)
    setAviso(null)
    try {
      await api(`/api/cocina/pedidos/${pedido.id}/estado`, {
        method: 'POST',
        body: JSON.stringify({ estado: paso.estado }),
      })
      await recargar()
    } catch (err) {
      setAviso(
        err instanceof ApiError
          ? err.message
          : 'No se pudo actualizar el pedido.',
      )
      // Re-sincroniza si otro operador ya avanzó o canceló el pedido
      await recargar()
    } finally {
      setOcupado(null)
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Tablero de cocina</CardTitle>
          <CardDescription>
            Pedidos pagados (anticipados y de mostrador) por orden de llegada.
            Se actualiza solo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aviso && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {aviso}
            </p>
          )}
        </CardContent>
      </Card>

      {cargando && (
        <p className="text-sm text-muted-foreground">Cargando pedidos…</p>
      )}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3" role="alert">
              <p className="text-sm font-medium text-destructive">{error}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setCargando(true)
                  void recargar()
                }}
              >
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {!cargando && !error && pedidos.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              No hay pedidos en cocina. Los pedidos pagados aparecen aquí solos.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pedidos.map((pedido) => {
          const paso = SIGUIENTE[pedido.estado]
          return (
            <Card key={pedido.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-heading text-xl font-extrabold text-primary">
                    #{pedido.orden}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${COLOR_ESTADO[pedido.estado] ?? 'bg-status-pending'}`}
                  >
                    {pedido.estado}
                  </span>
                </div>
                <CardTitle className="font-mono text-xl">{pedido.numero}</CardTitle>
                <CardDescription>
                  {pedido.tipo === 'anticipado' ? 'Anticipado' : 'Mostrador'}
                  {pedido.cliente_nombre ? ` · ${pedido.cliente_nombre}` : ''} ·{' '}
                  {horaLocal(pedido.creado_en)}
                  {pedido.fecha_recoleccion
                    ? ` · recoge ${horaLocal(pedido.fecha_recoleccion)}`
                    : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <ul className="grid gap-1">
                  {pedido.partidas.map((partida, i) => (
                    <li
                      key={`${pedido.id}-${partida.nombre}-${i}`}
                      className="text-sm"
                    >
                      <span className="text-xl font-extrabold">
                        {partida.cantidad}×
                      </span>{' '}
                      {partida.nombre}
                    </li>
                  ))}
                </ul>
                {paso && (
                  <Button
                    type="button"
                    size="touch"
                    disabled={ocupado === pedido.id}
                    onClick={() => void avanzar(pedido)}
                  >
                    {paso.etiqueta}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
