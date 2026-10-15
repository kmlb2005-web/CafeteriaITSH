import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ApiError, api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Icono, IconoChip } from '../../components/Icono'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'

/** Fila de "mis pedidos" (contrato GET /api/pedidos). */
interface PedidoLista {
  id: number
  numero: string
  tipo: 'anticipado' | 'mostrador'
  estado: string
  total: number
  fecha_recoleccion: string | null
  creado_en: string
  /** true cuando el pedido está Listo: aviso in-app "Listo para recoger". */
  aviso_listo: boolean
}

interface Partida {
  nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

/** Detalle completo (contrato GET /api/pedidos/:id). */
interface PedidoDetalle {
  id: number
  numero: string
  estado: string
  total: number
  fecha_recoleccion: string | null
  partidas: Partida[]
}

const COLOR_ESTADO: Record<string, string> = {
  Pendiente: 'bg-status-pending',
  Pagado: 'bg-status-paid',
  'En preparación': 'bg-status-preparing',
  Listo: 'bg-status-ready',
  Entregado: 'bg-status-delivered',
  Cancelado: 'bg-status-cancelled',
}

function formatearPrecio(precio: number): string {
  return `$${precio.toFixed(2)}`
}

function fechaLocal(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

/**
 * "Mis pedidos" (US1, FR-014): el cliente consulta sus pedidos con el estado
 * vigente y el detalle de cada uno. El pedido `Listo` se destaca como aviso
 * in-app del pedido listo (US2).
 */
export default function MisPedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoLista[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [detalles, setDetalles] = useState<Record<number, PedidoDetalle>>({})
  const [abierto, setAbierto] = useState<number | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState<number | null>(null)
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const datos = await api<{ pedidos: PedidoLista[] }>('/api/pedidos')
      setPedidos(datos.pedidos)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudieron cargar tus pedidos. Inténtalo de nuevo.',
      )
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar, intento])

  async function alternarDetalle(pedido: PedidoLista): Promise<void> {
    if (abierto === pedido.id) {
      setAbierto(null)
      return
    }
    setAbierto(pedido.id)
    setErrorDetalle(null)
    if (detalles[pedido.id]) return

    setCargandoDetalle(pedido.id)
    try {
      const detalle = await api<PedidoDetalle>(`/api/pedidos/${pedido.id}`)
      setDetalles((prev) => ({ ...prev, [pedido.id]: detalle }))
    } catch (err) {
      setErrorDetalle(
        err instanceof ApiError
          ? err.message
          : 'No se pudo cargar el detalle del pedido.',
      )
    } finally {
      setCargandoDetalle(null)
    }
  }

  if (cargando) {
    return (
      <p role="status" className="py-10 text-center text-muted-foreground">
        Cargando tus pedidos…
      </p>
    )
  }

  if (error) {
    return (
      <div className="grid justify-items-center gap-4 py-10 text-center">
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
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

  if (pedidos.length === 0) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Mis pedidos</CardTitle>
          <CardDescription>Tu historial de pedidos en la cafetería.</CardDescription>
        </CardHeader>
        <CardContent className="grid justify-items-center gap-4 py-6 text-center">
          <IconoChip id="icon-pedidos" tono="cafe" className="h-12 w-12" />
          <p className="text-sm text-muted-foreground">
            Aún no tienes pedidos. ¡Anímate a pedir!
          </p>
          <Link
            to="/menu"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Nuevo pedido
          </Link>
        </CardContent>
      </Card>
    )
  }

  const activos = pedidos.filter(
    (p) => p.estado !== 'Entregado' && p.estado !== 'Cancelado',
  ).length

  return (
    <div className="mx-auto grid max-w-2xl gap-3 entrada">
      <header className="flex flex-wrap items-center gap-3">
        <IconoChip id="icon-pedidos" />
        <h1 className="min-w-0 flex-1 font-heading text-xl font-bold">
          Mis pedidos
        </h1>
        <span
          aria-label={`${activos} pedidos activos`}
          className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/40"
        >
          {activos} {activos === 1 ? 'activo' : 'activos'}
        </span>
      </header>

      {pedidos.map((p) => {
        const detalle = detalles[p.id]
        const expandido = abierto === p.id
        return (
          <Card
            key={p.id}
            className={`acento-superior transition-all duration-200 hover:-translate-y-0.5 ${
              p.aviso_listo
                ? 'border-status-ready shadow-sm ring-1 ring-status-ready/30'
                : ''
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm font-semibold">{p.numero}</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${COLOR_ESTADO[p.estado] ?? 'bg-status-pending'}`}
                >
                  {p.estado}
                </span>
              </div>
              <CardDescription>
                {p.tipo === 'anticipado' ? 'Anticipado' : 'Mostrador'} ·{' '}
                {fechaLocal(p.creado_en)}
                {p.fecha_recoleccion ? ` · recoge ${p.fecha_recoleccion}` : ''}
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-3">
              {p.aviso_listo && (
                <p className="flex items-center gap-2 rounded-lg border border-status-ready/40 bg-status-ready/10 px-3 py-2 text-sm font-semibold text-status-ready">
                  <Icono id="icon-check" className="h-4 w-4" />
                  ¡Listo para recoger! Pasa por el mostrador.
                </p>
              )}

              <p className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-heading text-lg font-bold text-primary">
                  {formatearPrecio(p.total)}
                </span>
              </p>

              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-expanded={expandido}
                  onClick={() => void alternarDetalle(p)}
                >
                  {expandido ? 'Ocultar detalle' : 'Ver detalle'}
                </Button>
              </div>

              {expandido && (
                <div className="grid gap-2">
                  {cargandoDetalle === p.id && (
                    <p role="status" className="text-sm text-muted-foreground">
                      Cargando detalle…
                    </p>
                  )}
                  {errorDetalle && (
                    <p role="alert" className="text-sm font-medium text-destructive">
                      {errorDetalle}
                    </p>
                  )}
                  {detalle && (
                    <>
                      <ul className="grid gap-1">
                        {detalle.partidas.map((partida, i) => (
                          <li
                            key={`${p.id}-${partida.nombre}-${i}`}
                            className="flex justify-between gap-3 rounded-md border border-border bg-surface-container-low px-3 py-2 text-sm"
                          >
                            <span className="font-medium">
                              {partida.cantidad} × {partida.nombre}
                            </span>
                            <span className="text-muted-foreground">
                              {formatearPrecio(partida.subtotal)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="flex justify-between text-sm font-semibold">
                        <span>Total pagado</span>
                        <span>{formatearPrecio(detalle.total)}</span>
                      </p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
