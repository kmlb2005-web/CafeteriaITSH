import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
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
import {
  agregarAlCarrito,
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

function formatearPrecio(precio: number): string {
  return `$${precio.toFixed(2)}`
}

/**
 * Consulta del menú del día para alumnos y docentes (FR-009):
 * precios, disponibilidad y especiales, con vacío y error explicados.
 * Los platillos disponibles se agregan al carrito persistente (FR-010).
 */
export default function MenuPage() {
  const [datos, setDatos] = useState<RespuestaMenu | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [cantidades, setCantidades] = useState<Record<number, number>>({})
  const [lineas, setLineas] = useState<LineaCarrito[]>(() => leerCarrito())

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      setDatos(await api<RespuestaMenu>('/api/menu'))
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo cargar el menú. Inténtalo de nuevo.',
      )
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar, intento])

  function agregarAlPedido(item: ItemMenu): void {
    const cantidad = Math.min(99, Math.max(1, cantidades[item.id] ?? 1))
    setLineas(
      agregarAlCarrito({
        menu_dia_id: item.id,
        nombre: item.nombre,
        precio: item.precio,
        cantidad,
      }),
    )
  }

  const barra =
    lineas.length > 0 ? (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/10 px-4 py-3">
        <p className="text-sm font-semibold">
          {unidadesCarrito(lineas)} en tu pedido ·{' '}
          {formatearPrecio(totalCarrito(lineas))}
        </p>
        <Link
          to="/pedido/confirmar"
          className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Revisar pedido
        </Link>
      </div>
    ) : null

  if (cargando) {
    return (
      <>
        {barra}
        <p role="status" className="py-10 text-center text-muted-foreground">
          Cargando menú…
        </p>
      </>
    )
  }

  if (error) {
    return (
      <>
        {barra}
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
      </>
    )
  }

  if (!datos || datos.items.length === 0) {
    return (
      <>
        {barra}
        <Card>
          <CardHeader>
            <CardTitle>Menú no disponible hoy</CardTitle>
            <CardDescription>
              Todavía no se ha publicado el menú de hoy. Vuelve a intentarlo más
              tarde.
            </CardDescription>
          </CardHeader>
        </Card>
      </>
    )
  }

  return (
    <>
      {barra}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {datos.items.map((item) => (
          <Card
            key={item.id}
            className={item.disponible ? undefined : 'opacity-75'}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base">{item.nombre}</CardTitle>
                <span className="whitespace-nowrap font-heading text-lg font-bold text-primary">
                  {formatearPrecio(item.precio)}
                </span>
              </div>
              <CardDescription>
                {item.categoria ?? 'Sin categoría'}
              </CardDescription>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {item.especial && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                    Especial del día
                  </span>
                )}
                {!item.disponible && (
                  <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">
                    No disponible
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              {item.descripcion && (
                <p className="text-sm text-muted-foreground">
                  {item.descripcion}
                </p>
              )}
              {item.disponible && (
                <div className="flex items-center gap-2">
                  <label
                    className="text-xs text-muted-foreground"
                    htmlFor={`cantidad-${item.id}`}
                  >
                    Cantidad
                  </label>
                  <Input
                    id={`cantidad-${item.id}`}
                    type="number"
                    min={1}
                    max={99}
                    className="h-9 w-16"
                    value={cantidades[item.id] ?? 1}
                    onChange={(e) =>
                      setCantidades((c) => ({
                        ...c,
                        [item.id]: Number(e.target.value),
                      }))
                    }
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => agregarAlPedido(item)}
                  >
                    Agregar al pedido
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
