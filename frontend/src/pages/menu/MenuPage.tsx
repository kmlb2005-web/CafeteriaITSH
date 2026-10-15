import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { CheckoutBar } from '../../components/CheckoutBar'
import { Button } from '../../components/ui/button'
import { Icono, IconoChip, type IconoId } from '../../components/Icono'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { ApiError, api } from '../../lib/api'
import {
  agregarAlCarrito,
  actualizarCantidad,
  leerCarrito,
  totalCarrito,
  unidadesCarrito,
  type LineaCarrito,
} from '../../lib/carrito'

interface ItemMenu {
  id: number
  platillo_id: number
  nombre: string
  categoria: string | null
  descripcion: string | null
  precio: number
  disponible: boolean
  especial: boolean
}

interface RespuestaMenu {
  fecha: string
  items: ItemMenu[]
}

const ICONO_CATEGORIA: Record<string, IconoId> = {
  Bebidas: 'icon-bebidas',
  Comida: 'icon-comida',
  Snacks: 'icon-snacks',
  Postres: 'icon-postres',
}

function formatearPrecio(precio: number): string {
  return `$${precio.toFixed(2)}`
}

function iconoCategoria(categoria: string | null): IconoId {
  return (categoria && ICONO_CATEGORIA[categoria]) || 'icon-menu'
}

/**
 * Menú del día del cliente (US3, FR-013, design §3.1–3.2): búsqueda en
 * vivo, chips de categoría, tarjetas con badge `Especial` (espresso) y
 * `No disponible` (atenuada, stepper deshabilitado), stepper 0–99 sobre el
 * carrito persistente (localStorage, research R6) y `CheckoutBar` hacia
 * la revisión. Estados vacío/error con `Reintentar` (SC-006).
 */
export default function MenuPage() {
  const navigate = useNavigate()
  const [menu, setMenu] = useState<ItemMenu[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [lineas, setLineas] = useState<LineaCarrito[]>(() => leerCarrito())
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)

  const cargarMenu = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const datos = await api<RespuestaMenu>('/api/menu')
      setMenu(datos.items)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo cargar el menú de hoy.',
      )
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargarMenu()
  }, [cargarMenu])

  useEffect(() => {
    if (intento > 0) void cargarMenu()
  }, [intento, cargarMenu])

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

  /** El stepper maneja el carrito: + suma, − resta, 0 quita la línea. */
  function cambiarCantidad(item: ItemMenu, delta: number): void {
    const actual =
      lineas.find((l) => l.menu_dia_id === item.id)?.cantidad ?? 0
    const nueva = Math.max(0, Math.min(99, actual + delta))
    if (actual === 0 && nueva > 0) {
      setLineas(
        agregarAlCarrito({
          menu_dia_id: item.id,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: 1,
        }),
      )
      return
    }
    setLineas(actualizarCantidad(item.id, nueva))
  }

  const unidades = unidadesCarrito(lineas)
  const total = totalCarrito(lineas)

  return (
    <div className="grid gap-4 entrada">
      <header className="grid gap-1">
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <h1 className="font-heading text-2xl font-bold">Menú del día</h1>
      </header>

      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="flex items-center gap-4 py-5">
          <svg
            className="h-9 w-9 shrink-0 text-primary"
            aria-hidden="true"
            focusable="false"
          >
            <use href="/icons.svg#icon-menu" />
          </svg>
          <p className="font-heading text-base font-semibold">
            ¡Buen día! Tu café, en buenas manos
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-2">
        <label htmlFor="buscar-producto" className="sr-only">
          Buscar producto
        </label>
        <div className="relative">
          <Icono
            id="icon-buscar"
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="buscar-producto"
            type="search"
            className="ps-9"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
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
                ? 'inline-flex min-h-11 items-center rounded-full border border-primary bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30'
                : 'inline-flex min-h-11 items-center rounded-full border border-border bg-surface-container-low px-4 text-sm font-semibold text-foreground transition-all duration-200 hover:border-primary/50 hover:bg-muted active:scale-95'
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
                  ? 'inline-flex min-h-11 items-center gap-1.5 rounded-full border border-primary bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30'
                  : 'inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-surface-container-low px-4 text-sm font-semibold text-foreground transition-all duration-200 hover:border-primary/50 hover:bg-muted active:scale-95'
              }
            >
              <svg className="h-4 w-4" aria-hidden="true" focusable="false">
                <use href={`/icons.svg#${iconoCategoria(c)}`} />
              </svg>
              {c}
            </button>
          ))}
        </div>
      )}

      {cargando && (
        <p className="text-sm text-muted-foreground">Cargando menú…</p>
      )}

      {error && (
        <div className="flex items-center gap-3" role="alert">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIntento((n) => n + 1)}
          >
            Reintentar
          </Button>
        </div>
      )}

      {!cargando && !error && menu.length === 0 && (
        <p className="text-sm text-muted-foreground">
          El menú aún no está disponible hoy.
        </p>
      )}

      {!cargando && !error && menu.length > 0 && visibles.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Sin resultados para “{busqueda.trim()}”.
        </p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((item) => {
          const cantidad =
            lineas.find((l) => l.menu_dia_id === item.id)?.cantidad ?? 0
          return (
            <li key={item.id}>
              <Card
                className={`h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  item.disponible ? '' : 'opacity-60'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <IconoChip
                        id={iconoCategoria(item.categoria)}
                        tono="cafe"
                        className="h-8 w-8 rounded-lg"
                      />
                      <CardTitle className="text-base">{item.nombre}</CardTitle>
                    </div>
                    {item.especial && (
                      <span className="shrink-0 rounded-full bg-[#6B3F23] px-2 py-0.5 text-xs font-bold text-white">
                        Especial
                      </span>
                    )}
                  </div>
                  {item.descripcion && (
                    <p className="text-xs text-muted-foreground">
                      {item.descripcion}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="grid gap-3">
                  <p className="font-heading text-lg font-bold text-primary">
                    {formatearPrecio(item.precio)}
                    <span className="text-xs font-medium text-muted-foreground">
                      {' '}
                      c/u
                    </span>
                  </p>
                  {!item.disponible && (
                    <span className="justify-self-start rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      No disponible
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="touch"
                      variant="outline"
                      aria-label={`Quitar uno de ${item.nombre}`}
                      disabled={!item.disponible || cantidad === 0}
                      onClick={() => cambiarCantidad(item, -1)}
                    >
                      −
                    </Button>
                    <span
                      aria-label={`Cantidad de ${item.nombre}`}
                      className="w-9 text-center text-xl font-bold"
                    >
                      {cantidad}
                    </span>
                    <Button
                      type="button"
                      size="touch"
                      variant="outline"
                      aria-label={`Agregar uno de ${item.nombre}`}
                      disabled={!item.disponible}
                      onClick={() => cambiarCantidad(item, 1)}
                    >
                      +
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ul>

      <CheckoutBar
        cantidad={unidades}
        total={total}
        etiquetaCTA="Ver pedido"
        onCTA={() => navigate('/pedido/confirmar')}
      />
    </div>
  )
}
