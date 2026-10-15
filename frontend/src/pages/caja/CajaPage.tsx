import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CheckoutBar } from '../../components/CheckoutBar'
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

const ICONO_CATEGORIA: Record<string, string> = {
  Bebidas: 'icon-bebidas',
  Comida: 'icon-comida',
  Snacks: 'icon-snacks',
  Postres: 'icon-postres',
}

function formatearPrecio(precio: number): string {
  return `$${precio.toFixed(2)}`
}

function iconoCategoria(categoria: string | null): string {
  return (categoria && ICONO_CATEGORIA[categoria]) || 'icon-menu'
}

/**
 * Pantallas 2 y 3 de caja (design §4.3–4.4, FR-005…FR-007): catálogo con
 * búsqueda en vivo, chips de categoría, stepper 0–99 y `CheckoutBar`;
 * la vista interna **Resumen de cobro** muestra el desglose con el CTA
 * único **Registrar y cobrar** (captura + cobro en un solo paso,
 * SC-S4-01). La entrega de pedidos listos vive en `EntregasPage`.
 */
export default function CajaPage() {
  const [menu, setMenu] = useState<ItemMenu[]>([])
  const [cargandoMenu, setCargandoMenu] = useState(true)
  const [errorMenu, setErrorMenu] = useState<string | null>(null)
  const [intentoMenu, setIntentoMenu] = useState(0)
  const [cantidades, setCantidades] = useState<Record<number, number>>({})
  const [clienteNombre, setClienteNombre] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [ultimo, setUltimo] = useState<{
    pedido: Pedido
    pagado: boolean
  } | null>(null)
  const [mensaje, setMensaje] = useState<{
    tipo: 'exito' | 'error'
    texto: string
  } | null>(null)
  const [vista, setVista] = useState<'catalogo' | 'resumen'>('catalogo')
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)

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

  useEffect(() => {
    void cargarMenu()
  }, [cargarMenu])

  useEffect(() => {
    if (intentoMenu > 0) void cargarMenu()
  }, [intentoMenu, cargarMenu])

  const categorias = useMemo(
    () => [
      ...new Set(
        menu
          .map((i) => i.categoria)
          .filter((c): c is string => typeof c === 'string' && c.length > 0),
      ),
    ],
    [menu],
  )

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return menu.filter(
      (i) =>
        (categoria === null || i.categoria === categoria) &&
        (texto === '' || i.nombre.toLowerCase().includes(texto)),
    )
  }, [menu, busqueda, categoria])

  const seleccionados = menu.filter((i) => (cantidades[i.id] ?? 0) > 0)
  const total = seleccionados.reduce(
    (suma, i) => suma + i.precio * (cantidades[i.id] ?? 0),
    0,
  )
  const unidades = seleccionados.reduce(
    (suma, i) => suma + (cantidades[i.id] ?? 0),
    0,
  )

  function cambiarCantidad(id: number, delta: number): void {
    setCantidades((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(99, (prev[id] ?? 0) + delta)),
    }))
  }

  /** Limpia carrito, resultado y mensaje; regresa al catálogo. */
  function nuevoPedido(): void {
    setCantidades({})
    setClienteNombre('')
    setUltimo(null)
    setMensaje(null)
    setVista('catalogo')
  }

  /**
   * Cobro aislado: si falla, el pedido queda Pendiente y se ofrece
   * reintentar sin duplicarlo (comportamiento conservado, FR-007).
   */
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
      setVista('resumen')
    } catch (err) {
      setUltimo({ pedido, pagado: false })
      setMensaje({
        tipo: 'error',
        texto:
          err instanceof ApiError
            ? err.message
            : 'No se pudo cobrar el pedido.',
      })
      setVista('resumen')
    }
  }

  /** Captura + cobro en un solo paso (FR-015, SC-S4-01). */
  async function registrarYCobrar(): Promise<void> {
    if (seleccionados.length === 0) {
      setMensaje({
        tipo: 'error',
        texto: 'Agrega al menos un platillo al pedido.',
      })
      return
    }
    setVista('resumen')
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

  /** Cancela un pedido que quedó Pendiente tras un cobro fallido. */
  async function cancelarPedidoPendiente(): Promise<void> {
    if (!ultimo) return
    setOcupado(true)
    try {
      await api(`/api/caja/pedidos/${ultimo.pedido.id}/estado`, {
        method: 'POST',
        body: JSON.stringify({ estado: 'Cancelado' }),
      })
      nuevoPedido()
      setMensaje({ tipo: 'exito', texto: 'Pedido cancelado.' })
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto:
          err instanceof ApiError
            ? err.message
            : 'No se pudo cancelar el pedido.',
      })
    } finally {
      setOcupado(false)
    }
  }

  function volverAlCatalogo(): void {
    // Un resultado cobrado solo se sale con "Nuevo pedido" (limpia todo).
    if (ultimo?.pagado) {
      nuevoPedido()
      return
    }
    setMensaje(null)
    setVista('catalogo')
  }

  function claseMensaje(): string {
    return mensaje?.tipo === 'error'
      ? 'text-sm font-medium text-destructive'
      : 'text-sm font-medium text-primary'
  }

  const bloquePendiente = ultimo && !ultimo.pagado && (
    <div className="grid gap-2 rounded-md border border-destructive/40 bg-surface-container-low p-3">
      <p className="font-mono text-xl font-bold">{ultimo.pedido.numero}</p>
      <p className="text-sm font-medium text-destructive">
        El pedido quedó Pendiente: el cobro no pasó.
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
          onClick={() => void cancelarPedidoPendiente()}
        >
          Cancelar pedido
        </Button>
      </div>
    </div>
  )

  /** Pantalla 3: resumen de cobro (vista interna). */
  if (vista === 'resumen') {
    return (
      <div className="grid gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="touch"
            className="h-11 w-11 px-0"
            aria-label="Volver al catálogo"
            onClick={volverAlCatalogo}
          >
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
          </Button>
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-bold">Cobro</h1>
            <p className="text-xs text-muted-foreground">
              Revisa el pedido antes de cobrar
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resumen del pedido</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {seleccionados.length === 0 && !ultimo && (
              <p className="text-sm text-muted-foreground">
                Tu pedido está vacío. Vuelve al catálogo para agregar
                platillos.
              </p>
            )}

            {seleccionados.length > 0 && (
              <ul className="grid gap-2">
                {seleccionados.map((i) => (
                  <li
                    key={i.id}
                    className="flex min-h-14 items-center gap-3 rounded-md border border-border bg-surface-container-low px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {cantidades[i.id] ?? 0}× {i.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatearPrecio(
                          i.precio * (cantidades[i.id] ?? 0),
                        )}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="touch"
                      variant="outline"
                      aria-label={`Quitar ${i.nombre}`}
                      onClick={() =>
                        cambiarCantidad(i.id, -(cantidades[i.id] ?? 0))
                      }
                    >
                      ×
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <p className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-heading text-3xl font-extrabold text-primary">
                {formatearPrecio(total)}
              </span>
            </p>

            <p className="text-xs text-muted-foreground">
              El pedido se registra y cobra en un solo paso.
            </p>

            {mensaje && (
              <p role="alert" className={claseMensaje()}>
                {mensaje.texto}
              </p>
            )}

            {bloquePendiente ? (
              bloquePendiente
            ) : ultimo?.pagado ? (
              <div className="grid gap-3 rounded-md border border-primary/40 bg-surface-container-low p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-xl font-bold">
                    {ultimo.pedido.numero}
                  </p>
                  <span className="rounded-full bg-status-paid px-2 py-0.5 text-xs font-bold text-white">
                    Pagado
                  </span>
                </div>
                <Button
                  type="button"
                  size="touch"
                  className="min-h-12"
                  onClick={nuevoPedido}
                >
                  Nuevo pedido
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="touch"
                className="min-h-12"
                disabled={ocupado}
                onClick={() => void registrarYCobrar()}
              >
                Registrar y cobrar
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  /** Pantalla 2: catálogo y carrito. */
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Link
          to="/caja"
          aria-label="Volver al inicio de caja"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-muted"
        >
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
        </Link>
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold">Nuevo pedido</h1>
          <p className="text-xs text-muted-foreground">
            Toca la cantidad de cada platillo y cobra en un solo paso
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Card>
          <CardHeader>
            <CardTitle>Menú de hoy</CardTitle>
            <CardDescription>
              Selecciona cantidades (0–99) y cobra en efectivo en un solo
              paso.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="cliente-nombre">
                Nombre del cliente (opcional)
              </Label>
              <Input
                id="cliente-nombre"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                maxLength={100}
                placeholder="Para identificar el pedido al entregar"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="buscar-producto" className="sr-only">
                Buscar producto
              </Label>
              <Input
                id="buscar-producto"
                type="search"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            {categorias.length > 0 && (
              <div
                role="group"
                aria-label="Categorías"
                className="flex gap-2 overflow-x-auto pb-1"
              >
                <button
                  type="button"
                  aria-pressed={categoria === null}
                  onClick={() => setCategoria(null)}
                  className={
                    categoria === null
                      ? 'inline-flex min-h-11 items-center rounded-full border border-primary bg-primary/10 px-4 text-sm font-semibold text-primary'
                      : 'inline-flex min-h-11 items-center rounded-full border border-border bg-surface-container-low px-4 text-sm font-semibold text-foreground hover:bg-muted'
                  }
                >
                  Todas
                </button>
                {categorias.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={categoria === c}
                    onClick={() => setCategoria(c)}
                    className={
                      categoria === c
                        ? 'inline-flex min-h-11 items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-4 text-sm font-semibold text-primary'
                        : 'inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-surface-container-low px-4 text-sm font-semibold text-foreground hover:bg-muted'
                    }
                  >
                    <svg
                      className="h-4 w-4"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <use href={`/icons.svg#${iconoCategoria(c)}`} />
                    </svg>
                    {c}
                  </button>
                ))}
              </div>
            )}

            {cargandoMenu && (
              <p className="text-sm text-muted-foreground">Cargando menú…</p>
            )}
            {errorMenu && (
              <div className="flex items-center gap-3" role="alert">
                <p className="text-sm font-medium text-destructive">
                  {errorMenu}
                </p>
                <Button
                  type="button"
                  size="touch"
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
            {!cargandoMenu &&
              !errorMenu &&
              menu.length > 0 &&
              visibles.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Sin resultados para tu búsqueda.
                </p>
              )}

            <ul className="grid gap-2">
              {visibles.map((item) => (
                <li
                  key={item.id}
                  className="flex min-h-14 flex-wrap items-center gap-3 rounded-md border border-border bg-surface-container-low px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {item.nombre}
                    </p>
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
                      className="w-9 text-center text-xl font-bold"
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

        {/* Panel de cobro: escritorio (contract C3); oculto en móvil. */}
        <div className="hidden content-start gap-4 lg:grid">
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
                <p role="alert" className={claseMensaje()}>
                  {mensaje.texto}
                </p>
              )}

              {bloquePendiente ? (
                bloquePendiente
              ) : (
                <Button
                  type="button"
                  size="touch"
                  className="min-h-12"
                  disabled={ocupado}
                  onClick={() => void registrarYCobrar()}
                >
                  Registrar y cobrar
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CheckoutBar
        cantidad={unidades}
        total={total}
        etiquetaCTA="Ver cobro"
        onCTA={() => {
          setMensaje(null)
          setVista('resumen')
        }}
        className="lg:hidden"
      />
    </div>
  )
}
