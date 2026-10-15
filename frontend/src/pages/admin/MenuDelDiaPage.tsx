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

/** Fecha `YYYY-MM-DD` en texto largo en español (p. ej. "lunes, 14 de octubre"). */
function fechaLegible(fecha: string): string {
  const partes = fecha.split('-').map(Number)
  const [año, mes, dia] = partes
  if (!año || !mes || !dia) return fecha
  return new Date(año, mes - 1, dia).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/** Publica el menú del día: agregar, editar precio/disponibilidad/especial. */
export default function MenuDelDiaPage() {
  const [fecha, setFecha] = useState(fechaHoy())
  const [items, setItems] = useState<ItemMenuAdmin[]>([])
  const [catalogo, setCatalogo] = useState<Platillo[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [platilloNuevo, setPlatilloNuevo] = useState('')
  const [precioNuevo, setPrecioNuevo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setErrorCarga(null)
    try {
      const [menu, platillos] = await Promise.all([
        api<RespuestaAdmin>(`/api/admin/menu?fecha=${fecha}`),
        api<Platillo[]>('/api/admin/platillos'),
      ])
      setItems(menu.items)
      setCatalogo(platillos)
    } catch (err) {
      setErrorCarga(mensajeDe(err, 'No se pudo cargar el menú.'))
    } finally {
      setCargando(false)
    }
  }, [fecha])

  useEffect(() => {
    void cargar()
  }, [cargar, intento])

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
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] entrada">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>Menú del día</CardTitle>
            <CardDescription>
              Los cambios se reflejan de inmediato en la consulta de los
              clientes.
            </CardDescription>
          </div>
          <div className="grid w-44 gap-2">
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
          {exito && (
            <p role="status" className="text-sm font-medium text-primary">
              {exito}
            </p>
          )}
          {cargando ? (
            <p role="status" className="text-sm text-muted-foreground">
              Cargando menú…
            </p>
          ) : errorCarga ? (
            <div className="grid justify-items-start gap-3 py-4">
              <p role="alert" className="text-sm font-medium text-destructive">
                {errorCarga}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIntento((n) => n + 1)}
              >
                Reintentar
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="grid gap-1 py-4">
              <p className="font-semibold">Sin menú para este día</p>
              <p className="text-sm text-muted-foreground">
                No hay platillos publicados el {fechaLegible(fecha)}. Agrégalos
                desde el panel «Agregar al menú».
              </p>
            </div>
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

            <Button type="submit" size="touch" disabled={enviando}>
              {enviando ? 'Agregando…' : 'Agregar al menú'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Tarjeta editable del menú (spec 007 US4, FR-017): precio editable,
 * toggle **Disponible** ≥44 px, badge **Especial** conmutable (los dos se
 * guardan de inmediato) y **Quitar** con confirmación en línea.
 */
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
  const [confirmarQuitar, setConfirmarQuitar] = useState(false)

  async function guardar(cambios?: {
    disponible?: boolean
    especial?: boolean
  }): Promise<boolean> {
    setError(null)
    const precioNum = Number(precio)
    if (!precio.trim() || Number.isNaN(precioNum) || precioNum < 0) {
      setError('Ingresa un precio válido.')
      return false
    }
    setOcupado(true)
    try {
      await api('/api/admin/menu', {
        method: 'PUT',
        body: JSON.stringify({
          fecha,
          platillo_id: item.platillo_id,
          precio: precioNum,
          disponible: cambios?.disponible ?? disponible,
          especial: cambios?.especial ?? especial,
        }),
      })
      actualizado()
      return true
    } catch (err) {
      setError(mensajeDe(err, 'No se pudieron guardar los cambios.'))
      return false
    } finally {
      setOcupado(false)
    }
  }

  async function alternarDisponible(): Promise<void> {
    const nuevo = !disponible
    setDisponible(nuevo)
    if (!(await guardar({ disponible: nuevo }))) setDisponible(!nuevo)
  }

  async function alternarEspecial(): Promise<void> {
    const nuevo = !especial
    setEspecial(nuevo)
    if (!(await guardar({ especial: nuevo }))) setEspecial(!nuevo)
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
      setConfirmarQuitar(false)
    }
  }

  return (
    <li className="grid gap-3 rounded-md border border-border bg-surface-container-low p-3">
      <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{item.nombre}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {!item.activo && (
              <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-xs font-semibold text-destructive">
                Platillo desactivado
              </span>
            )}
            <span
              className={
                disponible
                  ? 'rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary'
                  : 'rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground'
              }
            >
              {disponible ? 'Disponible' : 'No disponible'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label
              className="text-xs text-muted-foreground"
              htmlFor={`precio-${item.id}`}
            >
              Precio
            </label>
            <Input
              id={`precio-${item.id}`}
              aria-label={`Precio de ${item.nombre}`}
              type="number"
              min={0}
              step={0.5}
              className="h-11 w-24"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
            />
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={disponible}
            aria-label={`Disponible: ${item.nombre}`}
            disabled={ocupado}
            onClick={() => void alternarDisponible()}
            className={
              disponible
                ? 'inline-flex min-h-11 items-center gap-2 rounded-md border border-primary bg-primary/10 px-3 text-sm font-semibold text-primary'
                : 'inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-semibold text-muted-foreground'
            }
          >
            <span
              aria-hidden="true"
              className={
                disponible
                  ? 'h-3.5 w-3.5 rounded-full bg-primary'
                  : 'h-3.5 w-3.5 rounded-full bg-muted-foreground/40'
              }
            />
            Disponible
          </button>

          <button
            type="button"
            aria-pressed={especial}
            aria-label={`Especial: ${item.nombre}`}
            disabled={ocupado}
            onClick={() => void alternarEspecial()}
            className={
              especial
                ? 'min-h-11 rounded-full bg-[#6B3F23] px-3 text-xs font-bold text-white'
                : 'min-h-11 rounded-full border border-dashed border-border bg-surface px-3 text-xs font-bold text-muted-foreground'
            }
          >
            Especial
          </button>

          <Button
            type="button"
            size="touch"
            variant="outline"
            disabled={ocupado}
            onClick={() => void guardar()}
          >
            Guardar
          </Button>

          {confirmarQuitar ? (
            <div
              role="alert"
              className="flex flex-wrap items-center gap-2 rounded-md border border-destructive/40 bg-surface-container p-2"
            >
              <p className="min-w-0 text-sm">
                ¿Quitar <strong>{item.nombre}</strong> del menú?
              </p>
              <Button
                type="button"
                size="touch"
                variant="destructive"
                disabled={ocupado}
                onClick={() => void quitar()}
              >
                Sí, quitar
              </Button>
              <Button
                type="button"
                size="touch"
                variant="ghost"
                onClick={() => setConfirmarQuitar(false)}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="touch"
              variant="destructive"
              disabled={ocupado}
              onClick={() => setConfirmarQuitar(true)}
            >
              Quitar
            </Button>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </li>
  )
}
