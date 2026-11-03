import { useCallback, useEffect, useState } from 'react'
import { ApiError, api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Icono, IconoChip } from '../../components/Icono'
import { Card, CardContent, CardHeader } from '../../components/ui/card'

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
/** Reloj del indicador "act. hace X s" (research R3). */
const RELOJ_FRESURA_MS = 1000
/** Reloj del cálculo de retraso "¡Retrasado!" (research R4). */
const RELOJ_RETRASO_MS = 30000

function horaLocal(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Tiempo transcurrido desde el registro, en cliente (sin backend nuevo). */
function transcurrido(creadoIso: string, ahoraMs: number): string {
  const minutos = Math.floor(
    (ahoraMs - new Date(creadoIso).getTime()) / 60000,
  )
  if (minutos < 1) return 'recién'
  if (minutos < 60) return `hace ${minutos} min`
  return `hace ${Math.floor(minutos / 60)} h ${minutos % 60} min`
}

/**
 * Tablero de cocina (KDS, US2, FR-009…FR-012): pedidos pagados de ambos
 * orígenes por orden de llegada, avance de estados en un toque, tiempo
 * transcurrido con marcador "¡Retrasado!" e indicador de frescura del
 * sondeo. Cifras legibles y CTA ≥48 px (FR-020).
 */
export default function CocinaPage() {
  const [pedidos, setPedidos] = useState<PedidoCocina[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<number | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [reloj, setReloj] = useState(() => Date.now())
  const [ahora, setAhora] = useState(() => Date.now())
  const [ultimaActualizacion, setUltimaActualizacion] = useState<number | null>(
    null,
  )
  const [fallos, setFallos] = useState(0)

  const recargar = useCallback(async () => {
    try {
      const datos = await api<{ pedidos: PedidoCocina[] }>('/api/cocina/pedidos')
      setPedidos(datos.pedidos)
      setError(null)
      setFallos(0)
      setUltimaActualizacion(Date.now())
    } catch (err) {
      // El sondeo continúa tras el fallo (FR-011); 2 fallos seguidos
      // cambian el indicador a "Sin conexión" sin bloquear la vista.
      setFallos((n) => n + 1)
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

  // Relojes: 1 s para "act. hace X s"; 30 s para el cálculo de retraso.
  useEffect(() => {
    const frescura = window.setInterval(
      () => setReloj(Date.now()),
      RELOJ_FRESURA_MS,
    )
    const retraso = window.setInterval(
      () => setAhora(Date.now()),
      RELOJ_RETRASO_MS,
    )
    return () => {
      window.clearInterval(frescura)
      window.clearInterval(retraso)
    }
  }, [])

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

  const desconectado = fallos >= 2
  const textoFrescura = desconectado
    ? 'Sin conexión — reintentando…'
    : ultimaActualizacion === null
      ? 'Actualizando…'
      : `act. hace ${Math.max(
          0,
          Math.floor((reloj - ultimaActualizacion) / 1000),
        )} s`

  return (
    <div className="grid gap-4 entrada">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <IconoChip id="icon-comida" tono="solido" className="h-11 w-11" />
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-2xl font-bold">
            Tablero de cocina
          </h1>
          <p className="text-xs text-muted-foreground">
            Pedidos pagados por orden de llegada · se actualiza solo
          </p>
        </div>
        {!cargando && !error && (
          <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/40">
            {pedidos.length}{' '}
            {pedidos.length === 1 ? 'pedido' : 'pedidos'}
          </span>
        )}
        <p
          role="status"
          className={
            desconectado
              ? 'text-xs font-semibold text-destructive'
              : 'text-xs text-muted-foreground'
          }
        >
          {textoFrescura}
        </p>
      </header>

      {aviso && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {aviso}
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
            onClick={() => {
              setCargando(true)
              void recargar()
            }}
          >
            Reintentar
          </Button>
        </div>
      )}

      {!cargando && !error && pedidos.length === 0 && (
        <div className="grid place-items-center gap-2 rounded-lg border border-dashed border-border bg-surface-container-low p-8 text-center">
          <svg
            className="h-10 w-10 text-primary"
            aria-hidden="true"
            focusable="false"
          >
            <use href="/icons.svg#icon-pedidos" />
          </svg>
          <p className="font-heading text-lg font-bold">¡Todo está al día!</p>
          <p className="text-sm text-muted-foreground">
            No hay pedidos en cocina. Los pedidos pagados aparecen aquí solos.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pedidos.map((pedido) => {
          const paso = SIGUIENTE[pedido.estado]
          const retrasado =
            pedido.fecha_recoleccion !== null &&
            new Date(pedido.fecha_recoleccion).getTime() < ahora
          return (
            <Card
              key={pedido.id}
              className="acento-superior h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-heading text-2xl font-extrabold text-primary">
                    #{pedido.orden}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm ${COLOR_ESTADO[pedido.estado] ?? 'bg-status-pending'}`}
                  >
                    {pedido.estado}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xl font-bold">
                    {pedido.numero}
                  </span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                    {pedido.tipo === 'anticipado' ? 'Anticipado' : 'Mostrador'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {pedido.cliente_nombre ? `${pedido.cliente_nombre} · ` : ''}
                  {horaLocal(pedido.creado_en)}
                  {pedido.fecha_recoleccion && (
                    <>
                      {' · '}
                      <span className="font-bold text-foreground">
                        recoge {horaLocal(pedido.fecha_recoleccion)}
                      </span>
                    </>
                  )}
                </p>
                <p
                  className={
                    retrasado
                      ? 'flex items-center gap-1 text-xs font-bold text-destructive'
                      : 'flex items-center gap-1 text-xs text-muted-foreground'
                  }
                >
                  {retrasado && <Icono id="icon-alerta" className="h-4 w-4" />}
                  {retrasado
                    ? '¡Retrasado!'
                    : transcurrido(pedido.creado_en, ahora)}
                </p>
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
                {paso ? (
                  <Button
                    type="button"
                    size="touch"
                    className="min-h-12"
                    disabled={ocupado === pedido.id}
                    onClick={() => void avanzar(pedido)}
                  >
                    {paso.etiqueta}
                  </Button>
                ) : (
                  <p className="text-center text-xs font-semibold text-muted-foreground">
                    Listo — en espera de caja
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
