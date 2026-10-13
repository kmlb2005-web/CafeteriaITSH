import { useCallback, useEffect, useState, type FormEvent } from 'react'
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

interface ItemMenuAdmin {
  id: number
  platillo_id: number
  nombre: string
  categoria: string | null
  descripcion: string | null
  precio: number
  disponible: boolean
  especial: boolean
  activo: boolean
}

interface Platillo {
  id: number
  nombre: string
  categoria: string | null
  descripcion: string | null
  activo: boolean
}

interface RespuestaAdmin {
  fecha: string
  items: ItemMenuAdmin[]
}

function fechaHoy(): string {
  const hoy = new Date()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mes}-${dia}`
}

function mensajeDe(err: unknown, porDefecto: string): string {
  return err instanceof ApiError ? err.message : porDefecto
}

/** Publica el menú del día: agregar, editar precio/disponibilidad/especial. */
export default function MenuDelDiaPage() {
  const [fecha, setFecha] = useState(fechaHoy())
  const [items, setItems] = useState<ItemMenuAdmin[]>([])
  const [catalogo, setCatalogo] = useState<Platillo[]>([])
  const [cargando, setCargando] = useState(true)
  const [platilloNuevo, setPlatilloNuevo] = useState('')
  const [precioNuevo, setPrecioNuevo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const [menu, platillos] = await Promise.all([
        api<RespuestaAdmin>(`/api/admin/menu?fecha=${fecha}`),
        api<Platillo[]>('/api/admin/platillos'),
      ])
      setItems(menu.items)
      setCatalogo(platillos)
    } catch (err) {
      setError(mensajeDe(err, 'No se pudo cargar el menú.'))
    } finally {
      setCargando(false)
    }
  }, [fecha])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const enMenu = new Set(items.map((i) => i.platillo_id))
  const opciones = catalogo.filter((p) => p.activo && !enMenu.has(p.id))

  async function agregar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault()
    setError(null)
    setExito(null)

    const precio = Number(precioNuevo)
    if (!precioNuevo.trim() || Number.isNaN(precio) || precio < 0) {
      setError('Ingresa un precio válido.')
      return
    }
    if (!platilloNuevo) {
      setError('Selecciona un platillo para agregar.')
      return
    }

    setEnviando(true)
    try {
      await api('/api/admin/menu', {
        method: 'PUT',
        body: JSON.stringify({
          fecha,
          platillo_id: Number(platilloNuevo),
          precio,
        }),
      })
      setExito('Platillo agregado al menú.')
      setPlatilloNuevo('')
      setPrecioNuevo('')
      await cargar()
    } catch (err) {
      setError(mensajeDe(err, 'No se pudo agregar el platillo.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card>
        <CardHeader>
          <CardTitle>Menú del día</CardTitle>
          <CardDescription>
            Los cambios se reflejan de inmediato en la consulta de los
            clientes.
          </CardDescription>
          <div className="grid w-44 gap-2 pt-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          {cargando ? (
            <p className="text-sm text-muted-foreground">Cargando menú…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay platillos en este menú. Agrégalos desde el panel
              lateral.
            </p>
          ) : (
            <ul className="grid gap-2">
              {items.map((item) => (
                <FilaMenu
                  key={item.id}
                  item={item}
                  fecha={fecha}
                  actualizado={() => void cargar()}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agregar al menú</CardTitle>
          <CardDescription>Asigna el precio del día.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void agregar(e)} noValidate className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="platillo">Platillo para agregar</Label>
              <select
                id="platillo"
                className="flex h-10 w-full rounded-md border border-input bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                value={platilloNuevo}
                onChange={(e) => setPlatilloNuevo(e.target.value)}
              >
                <option value="">Selecciona un platillo…</option>
                {opciones.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="precio">Precio</Label>
              <Input
                id="precio"
                type="number"
                min={0}
                step={0.5}
                inputMode="decimal"
                placeholder="35"
                value={precioNuevo}
                onChange={(e) => setPrecioNuevo(e.target.value)}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}
            {exito && (
              <p role="status" className="text-sm font-medium text-primary">
                {exito}
              </p>
            )}

            <Button type="submit" disabled={enviando}>
              {enviando ? 'Agregando…' : 'Agregar al menú'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

/** Renglón editable del menú: precio, disponibilidad, especial y quitar. */
function FilaMenu({
  item,
  fecha,
  actualizado,
}: {
  item: ItemMenuAdmin
  fecha: string
  actualizado: () => void
}) {
  const [precio, setPrecio] = useState(String(item.precio))
  const [disponible, setDisponible] = useState(item.disponible)
  const [especial, setEspecial] = useState(item.especial)
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  async function guardar(): Promise<void> {
    setError(null)
    const precioNum = Number(precio)
    if (!precio.trim() || Number.isNaN(precioNum) || precioNum < 0) {
      setError('Ingresa un precio válido.')
      return
    }
    setOcupado(true)
    try {
      await api('/api/admin/menu', {
        method: 'PUT',
        body: JSON.stringify({
          fecha,
          platillo_id: item.platillo_id,
          precio: precioNum,
          disponible,
          especial,
        }),
      })
      actualizado()
    } catch (err) {
      setError(mensajeDe(err, 'No se pudieron guardar los cambios.'))
    } finally {
      setOcupado(false)
    }
  }

  async function quitar(): Promise<void> {
    setError(null)
    setOcupado(true)
    try {
      await api(`/api/admin/menu/${item.id}`, { method: 'DELETE' })
      actualizado()
    } catch (err) {
      setError(mensajeDe(err, 'No se pudo quitar del menú.'))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <li className="rounded-md border border-border bg-surface-container-low p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {item.nombre}{' '}
            {!item.activo && (
              <span className="ml-1 rounded bg-destructive/15 px-1.5 py-0.5 text-xs font-semibold text-destructive">
                Platillo desactivado
              </span>
            )}
            {!item.disponible && (
              <span className="ml-1 rounded bg-destructive/15 px-1.5 py-0.5 text-xs font-semibold text-destructive">
                No disponible
              </span>
            )}
            {item.especial && (
              <span className="ml-1 rounded bg-primary/15 px-1.5 py-0.5 text-xs font-semibold text-primary">
                Especial
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground" htmlFor={`precio-${item.id}`}>
            Precio
          </label>
          <Input
            id={`precio-${item.id}`}
            aria-label={`Precio de ${item.nombre}`}
            type="number"
            min={0}
            step={0.5}
            className="h-9 w-24"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              aria-label={`Disponible: ${item.nombre}`}
              checked={disponible}
              onChange={(e) => setDisponible(e.target.checked)}
            />
            Disponible
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              aria-label={`Especial: ${item.nombre}`}
              checked={especial}
              onChange={(e) => setEspecial(e.target.checked)}
            />
            Especial
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={ocupado}
            onClick={() => void guardar()}
          >
            Guardar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={ocupado}
            onClick={() => void quitar()}
          >
            Quitar
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </li>
  )
}
