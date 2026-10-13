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
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

interface ItemMenu {
  id: number
  nombre: string
  categoria: string | null
  precio: number
  disponible: boolean
}

interface Partida {
  nombre: string
  cantidad: number
}

interface Pedido {
  id: number
  numero: string
  estado: string
  total: number
  partidas: Partida[]
}

interface PedidoListo extends Pedido {
  cliente_nombre: string | null
}

function formatearPrecio(precio: number): string {
  return `$${precio.toFixed(2)}`
}

/**
 * Pantalla de caja (US1, FR-015…FR-016): captura de pedidos presenciales en
 * pocos pasos con cobro en efectivo, y entrega/cancelación de los pedidos
 * Listo. Objetivos táctiles de 44 px para el uso en mostrador (FR-020).
 */
export default function CajaPage() {
  const [menu, setMenu] = useState<ItemMenu[]>([])
  const [cargandoMenu, setCargandoMenu] = useState(true)
  const [errorMenu, setErrorMenu] = useState<string | null>(null)
  const [intentoMenu, setIntentoMenu] = useState(0)
  const [cantidades, setCantidades] = useState<Record<number, number>>({})
  const [clienteNombre, setClienteNombre] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [ultimo, setUltimo] = useState<{ pedido: Pedido; pagado: boolean } | null>(
    null,
  )
  const [listos, setListos] = useState<PedidoListo[]>([])
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(
    null,
  )

  const cargarMenu = useCallback(async () => {
    setCargandoMenu(true)
    setErrorMenu(null)
    try {
      const datos = await api<{ items: ItemMenu[] }>('/api/menu')
      setMenu(datos.items.filter((i) => i.disponible))
    } catch (err) {
      setErrorMenu(
        err instanceof ApiError
          ? err.message
          : 'No se pudo cargar el menú de hoy.',
      )
    } finally {
      setCargandoMenu(false)
    }
  }, [])

  const cargarListos = useCallback(async () => {
    try {
      const datos = await api<{ pedidos: PedidoListo[] }>(
        '/api/caja/pedidos/listos',
      )
      setListos(datos.pedidos)
    } catch {
      // La lista de entregas no debe bloquear la captura
    }
  }, [])

  useEffect(() => {
    void cargarMenu()
    void cargarListos()
  }, [cargarMenu, cargarListos])

  useEffect(() => {
    if (intentoMenu > 0) void cargarMenu()
  }, [intentoMenu, cargarMenu])

  const seleccionados = menu.filter((i) => (cantidades[i.id] ?? 0) > 0)
  const total = seleccionados.reduce(
    (suma, i) => suma + i.precio * (cantidades[i.id] ?? 0),
    0,
  )

  function cambiarCantidad(id: number, delta: number): void {
    setCantidades((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(99, (prev[id] ?? 0) + delta)),
    }))
  }

  /** Cobro aislado: si falla, el pedido queda Pendiente y se puede reintentar. */
  async function cobrarPedido(pedido: Pedido): Promise<void> {
    try {
      const res = await api<{ pedido: Pedido }>(
        `/api/caja/pedidos/${pedido.id}/pago`,
        { method: 'POST' },
      )
      setUltimo({ pedido: res.pedido, pagado: true })
      setMensaje({
        tipo: 'exito',
        texto: `Cobro confirmado: folio ${res.pedido.numero}.`,
      })
      setCantidades({})
      setClienteNombre('')
    } catch (err) {
      setUltimo({ pedido, pagado: false })
      setMensaje({
        tipo: 'error',
        texto:
          err instanceof ApiError
            ? err.message
            : 'No se pudo cobrar el pedido.',
      })
    }
  }

  /** Captura + cobro en un solo paso (FR-015, SC-S4-01). */
  async function registrarYCobrar(): Promise<void> {
    if (seleccionados.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Agrega al menos un platillo al pedido.' })
      return
    }
    setOcupado(true)
    setMensaje(null)
    try {
      const pedido = await api<Pedido>('/api/caja/pedidos', {
        method: 'POST',
        body: JSON.stringify({
          ...(clienteNombre.trim()
            ? { cliente_nombre: clienteNombre.trim() }
            : {}),
          items: seleccionados.map((i) => ({
            menu_dia_id: i.id,
            cantidad: cantidades[i.id] ?? 1,
          })),
        }),
      })
      await cobrarPedido(pedido)
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto:
          err instanceof ApiError
            ? err.message
            : 'No se pudo registrar el pedido.',
      })
    } finally {
      setOcupado(false)
    }
  }

  async function cambiarEstado(
    id: number,
    estado: 'Entregado' | 'Cancelado',
  ): Promise<void> {
    setOcupado(true)
    try {
      await api(`/api/caja/pedidos/${id}/estado`, {
        method: 'POST',
        body: JSON.stringify({ estado }),
      })
      setMensaje({
        tipo: 'exito',
        texto:
          estado === 'Entregado' ? 'Pedido entregado.' : 'Pedido cancelado.',
      })
      if (ultimo?.pedido.id === id) setUltimo(null)
      await cargarListos()
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

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo pedido de mostrador</CardTitle>
          <CardDescription>
            Toca la cantidad de cada platillo del menú de hoy y cobra en un
            solo paso.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="cliente-nombre">Nombre del cliente (opcional)</Label>
            <Input
              id="cliente-nombre"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              maxLength={100}
              placeholder="Para identificar el pedido al entregar"
            />
          </div>

          {cargandoMenu && (
            <p className="text-sm text-muted-foreground">Cargando menú…</p>
          )}
          {errorMenu && (
            <div className="flex items-center gap-3" role="alert">
              <p className="text-sm font-medium text-destructive">{errorMenu}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIntentoMenu((n) => n + 1)}
              >
                Reintentar
              </Button>
            </div>
          )}
          {!cargandoMenu && !errorMenu && menu.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay platillos disponibles en el menú de hoy.
            </p>
          )}

          <ul className="grid gap-2">
            {menu.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface-container-low px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatearPrecio(item.precio)} c/u
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="touch"
                    variant="outline"
                    aria-label={`Quitar uno de ${item.nombre}`}
                    disabled={(cantidades[item.id] ?? 0) === 0}
                    onClick={() => cambiarCantidad(item.id, -1)}
                  >
                    −
                  </Button>
                  <span
                    aria-label={`Cantidad de ${item.nombre}`}
                    className="w-8 text-center text-base font-semibold"
                  >
                    {cantidades[item.id] ?? 0}
                  </span>
                  <Button
                    type="button"
                    size="touch"
                    variant="outline"
                    aria-label={`Agregar uno de ${item.nombre}`}
                    onClick={() => cambiarCantidad(item.id, 1)}
                  >
                    +
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid content-start gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Cobro</CardTitle>
            <CardDescription>
              Total calculado con los precios vigentes del menú.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-heading text-xl font-bold text-primary">
                {formatearPrecio(total)}
              </span>
            </p>

            {mensaje && (
              <p
                role="alert"
                className={
                  mensaje.tipo === 'error'
                    ? 'text-sm font-medium text-destructive'
                    : 'text-sm font-medium text-primary'
                }
              >
                {mensaje.texto}
              </p>
            )}

            {ultimo && !ultimo.pagado && (
              <div className="grid gap-2 rounded-md border border-destructive/40 bg-surface-container-low p-3">
                <p className="text-sm font-medium">
                  El pedido {ultimo.pedido.numero} quedó Pendiente: el cobro no
                  pasó.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="touch"
                    disabled={ocupado}
                    onClick={() => void cobrarPedido(ultimo.pedido)}
                  >
                    Reintentar cobro
                  </Button>
                  <Button
                    type="button"
                    size="touch"
                    variant="outline"
                    disabled={ocupado}
                    onClick={() =>
                      void cambiarEstado(ultimo.pedido.id, 'Cancelado')
                    }
                  >
                    Cancelar pedido
                  </Button>
                </div>
              </div>
            )}

            {ultimo?.pagado && (
              <div className="rounded-md border border-primary/40 bg-surface-container-low p-3">
                <p className="text-sm font-semibold">
                  Pedido {ultimo.pedido.numero} cobrado ({ultimo.pedido.estado}
                  ).
                </p>
                <Button
                  type="button"
                  size="touch"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => setUltimo(null)}
                >
                  Nuevo pedido
                </Button>
              </div>
            )}

            <Button
              type="button"
              size="touch"
              disabled={ocupado}
              onClick={() => void registrarYCobrar()}
            >
              Registrar y cobrar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Listos para entregar</CardTitle>
            <CardDescription>
              Pedidos que cocina marcó como Listo.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {listos.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay pedidos listos por ahora.
              </p>
            )}
            {listos.map((p) => (
              <div
                key={p.id}
                className="grid gap-2 rounded-md border border-border bg-surface-container-low p-3"
              >
                <div>
                  <p className="text-sm font-semibold">{p.numero}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.cliente_nombre ?? 'Sin nombre'} ·{' '}
                    {p.partidas
                      .map((partida) => `${partida.cantidad}× ${partida.nombre}`)
                      .join(', ')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="touch"
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
                    disabled={ocupado}
                    aria-label={`Cancelar ${p.numero}`}
                    onClick={() => void cambiarEstado(p.id, 'Cancelado')}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
