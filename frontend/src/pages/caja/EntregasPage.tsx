import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { ApiError, api } from '../../lib/api'
import { EVENTO_PEDIDOS_ACTUALIZADOS } from '../../lib/eventos'

interface Partida {
  nombre: string
  cantidad: number
}

interface PedidoListo {
  id: number
  numero: string
  estado: string
  cliente_nombre: string | null
  creado_en: string
  partidas: Partida[]
}

function formatearHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Pantalla 4 — Entregas (design §4.5, FR-008): pedidos que cocina marcó
 * como Listo, en orden de llegada, con Entregar/Cancelar ≥44 px. Tras cada
 * acción avisa al layout (`EVENTO_PEDIDOS_ACTUALIZADOS`) para refrescar el
 * contador del badge y la bottom bar.
 */
export default function EntregasPage() {
  const [pedidos, setPedidos] = useState<PedidoListo[] | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState<{
    tipo: 'exito' | 'error'
    texto: string
  } | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const datos = await api<{ pedidos: PedidoListo[] }>(
        '/api/caja/pedidos/listos',
      )
      setPedidos(datos.pedidos)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudieron cargar los pedidos listos.',
      )
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useEffect(() => {
    if (intento > 0) void cargar()
  }, [intento, cargar])

  /** Entrega o cancelación: la fila sale de la lista al instante. */
  async function cambiarEstado(
    id: number,
    estado: 'Entregado' | 'Cancelado',
  ): Promise<void> {
    setOcupado(true)
    setMensaje(null)
    try {
      await api(`/api/caja/pedidos/${id}/estado`, {
        method: 'POST',
        body: JSON.stringify({ estado }),
      })
      setPedidos((prev) => (prev ?? []).filter((p) => p.id !== id))
      setMensaje({
        tipo: 'exito',
        texto: estado === 'Entregado' ? 'Pedido entregado.' : 'Pedido cancelado.',
      })
      window.dispatchEvent(new Event(EVENTO_PEDIDOS_ACTUALIZADOS))
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto:
          err instanceof ApiError
            ? err.message
            : 'No se pudo actualizar el pedido.',
      })
    } finally {
      setOcupado(false)
    }
  }

  const pendientes = pedidos?.length ?? 0

  return (
    <div className="grid gap-4 entrada">
      <header className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-2xl font-bold">Pedidos listos</h1>
          <p className="text-xs text-muted-foreground">
            Por orden de llegada desde cocina
          </p>
        </div>
        {!cargando && !error && pedidos !== null && (
          <span
            aria-label={`${pendientes} pedidos pendientes`}
            className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/40"
          >
            {pendientes}
          </span>
        )}
      </header>

      {mensaje && (
        <p
          role={mensaje.tipo === 'error' ? 'alert' : 'status'}
          className={
            mensaje.tipo === 'error'
              ? 'text-sm font-medium text-destructive'
              : 'text-sm font-medium text-primary'
          }
        >
          {mensaje.texto}
        </p>
      )}

      {cargando && (
        <p className="text-sm text-muted-foreground">Cargando pedidos…</p>
      )}

      {error && (
        <div className="flex items-center gap-3" role="alert">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <Button
            type="button"
            size="touch"
            variant="outline"
            onClick={() => setIntento((n) => n + 1)}
          >
            Reintentar
          </Button>
        </div>
      )}

      {!cargando && !error && pedidos !== null && pedidos.length === 0 && (
        <div className="grid place-items-center gap-2 rounded-lg border border-dashed border-border bg-surface-container-low p-8 text-center">
          <svg
            className="h-10 w-10 text-primary"
            aria-hidden="true"
            focusable="false"
          >
            <use href="/icons.svg#icon-entregas" />
          </svg>
          <p className="font-heading text-lg font-bold">
            ¡Todo está al día!
          </p>
          <p className="text-sm text-muted-foreground">
            No hay pedidos listos por entregar.
          </p>
        </div>
      )}

      {!error && pedidos !== null && pedidos.length > 0 && (
        <ul className="grid gap-3">
          {pedidos.map((p) => (
            <li
              key={p.id}
              className="acento-superior grid gap-3 rounded-xl border border-border bg-surface-container-lowest p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-status-ready/50 hover:shadow-md"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-xl font-bold">{p.numero}</p>
                <span className="rounded-full bg-status-ready px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                  Listo
                </span>
                <span className="ms-auto text-xs text-muted-foreground">
                  {formatearHora(p.creado_en)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {p.cliente_nombre ?? 'Sin nombre'} ·{' '}
                {p.partidas
                  .map((partida) => `${partida.cantidad}× ${partida.nombre}`)
                  .join(', ')}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="touch"
                  className="min-h-12"
                  disabled={ocupado}
                  aria-label={`Entregar ${p.numero}`}
                  onClick={() => void cambiarEstado(p.id, 'Entregado')}
                >
                  Entregar
                </Button>
                <Button
                  type="button"
                  size="touch"
                  variant="outline"
                  className="min-h-12"
                  disabled={ocupado}
                  aria-label={`Cancelar ${p.numero}`}
                  onClick={() => void cambiarEstado(p.id, 'Cancelado')}
                >
                  Cancelar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
