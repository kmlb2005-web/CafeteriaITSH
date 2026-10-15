import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
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

interface Platillo {
  id: number
  nombre: string
  categoria: string | null
  descripcion: string | null
  activo: boolean
}

interface EstadoFormulario {
  nombre: string
  categoria: string
  descripcion: string
}

const FORM_VACIO: EstadoFormulario = {
  nombre: '',
  categoria: '',
  descripcion: '',
}

/** Catálogo de platillos del administrador (FR-006). */
export default function PlatillosPage() {
  const [platillos, setPlatillos] = useState<Platillo[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [formulario, setFormulario] = useState<EstadoFormulario>(FORM_VACIO)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setErrorCarga(null)
    try {
      setPlatillos(await api<Platillo[]>('/api/admin/platillos'))
    } catch (err) {
      setErrorCarga(
        err instanceof ApiError
          ? err.message
          : 'No se pudo cargar el catálogo.',
      )
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar, intento])

  function limpiarMensajes(): void {
    setError(null)
    setExito(null)
  }

  function comenzarEdicion(p: Platillo): void {
    limpiarMensajes()
    setEditandoId(p.id)
    setFormulario({
      nombre: p.nombre,
      categoria: p.categoria ?? '',
      descripcion: p.descripcion ?? '',
    })
  }

  function cancelar(): void {
    limpiarMensajes()
    setEditandoId(null)
    setFormulario(FORM_VACIO)
  }

  function nuevoPlatillo(): void {
    limpiarMensajes()
    setEditandoId(null)
    setFormulario(FORM_VACIO)
  }

  async function onSubmit(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault()
    limpiarMensajes()

    if (formulario.nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 letras.')
      return
    }

    setEnviando(true)
    try {
      let mensaje = ''
      if (editandoId === null) {
        await api<Platillo>('/api/admin/platillos', {
          method: 'POST',
          body: JSON.stringify({
            nombre: formulario.nombre.trim(),
            categoria: formulario.categoria.trim() || undefined,
            descripcion: formulario.descripcion.trim() || undefined,
          }),
        })
        mensaje = 'Platillo creado correctamente.'
      } else {
        await api<Platillo>(`/api/admin/platillos/${editandoId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            nombre: formulario.nombre.trim(),
            categoria: formulario.categoria.trim(),
            descripcion: formulario.descripcion.trim(),
          }),
        })
        mensaje = 'Platillo actualizado correctamente.'
      }
      // limpiar el formulario primero y el éxito después: cancelar() borra
      // los mensajes, así el aviso no se pierde (defecto detectado en T038)
      cancelar()
      setExito(mensaje)
      await cargar()
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No se pudo guardar el platillo.',
      )
    } finally {
      setEnviando(false)
    }
  }

  async function alternarActivo(p: Platillo): Promise<void> {
    limpiarMensajes()
    try {
      await api<Platillo>(`/api/admin/platillos/${p.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ activo: !p.activo }),
      })
      setExito(
        p.activo
          ? `${p.nombre} fue desactivado; no aparecerá en nuevas consultas.`
          : `${p.nombre} fue reactivado.`,
      )
      await cargar()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo cambiar el estado del platillo.',
      )
    }
  }

  const categorias = useMemo(
    () => [
      ...new Set(
        platillos
          .map((p) => p.categoria)
          .filter((c): c is string => typeof c === 'string' && c.length > 0),
      ),
    ],
    [platillos],
  )

  const texto = busqueda.trim().toLowerCase()
  const visibles = platillos.filter(
    (p) =>
      (categoria === null || p.categoria === categoria) &&
      (texto === '' ||
        p.nombre.toLowerCase().includes(texto) ||
        (p.descripcion ?? '').toLowerCase().includes(texto)),
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>Catálogo de platillos</CardTitle>
            <CardDescription>
              Productos disponibles para armar el menú del día.
            </CardDescription>
          </div>
          <Button type="button" size="touch" onClick={nuevoPlatillo}>
            Nuevo platillo
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3">
          {exito && (
            <p role="status" className="text-sm font-medium text-primary">
              {exito}
            </p>
          )}

          {!cargando && !errorCarga && platillos.length > 0 && (
            <div className="grid gap-2">
              <label htmlFor="buscar-platillo" className="sr-only">
                Buscar platillo
              </label>
              <Input
                id="buscar-platillo"
                type="search"
                placeholder="Buscar platillo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          )}

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
                      ? 'inline-flex min-h-11 items-center rounded-full border border-primary bg-primary/10 px-4 text-sm font-semibold text-primary'
                      : 'inline-flex min-h-11 items-center rounded-full border border-border bg-surface-container-low px-4 text-sm font-semibold text-foreground hover:bg-muted'
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {cargando ? (
            <p role="status" className="text-sm text-muted-foreground">
              Cargando catálogo…
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
          ) : platillos.length === 0 ? (
            <div className="grid justify-items-start gap-3 py-4">
              <p className="text-sm text-muted-foreground">
                Aún no hay platillos. Crea el primero.
              </p>
              <Button type="button" size="touch" onClick={nuevoPlatillo}>
                Nuevo platillo
              </Button>
            </div>
          ) : visibles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {texto === ''
                ? 'Sin platillos en esta categoría.'
                : `Sin resultados para “${busqueda.trim()}”.`}
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {visibles.map((p) => (
                <li
                  key={p.id}
                  className="grid gap-2 rounded-md border border-border bg-surface-container-low px-3 py-2"
                >
                  <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {p.nombre}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.descripcion ?? 'Sin descripción'}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                      {p.categoria ?? 'Sin categoría'}
                    </span>
                    <span
                      className={
                        p.activo
                          ? 'shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary'
                          : 'shrink-0 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive'
                      }
                    >
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="touch"
                        onClick={() => comenzarEdicion(p)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant={p.activo ? 'destructive' : 'secondary'}
                        size="touch"
                        onClick={() => void alternarActivo(p)}
                      >
                        {p.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {editandoId === null ? 'Nuevo platillo' : 'Editar platillo'}
          </CardTitle>
          <CardDescription>
            {editandoId === null
              ? 'Agrégalo al catálogo con su categoría.'
              : 'Modifica nombre, categoría o descripción.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void onSubmit(e)} noValidate className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={formulario.nombre}
                onChange={(e) =>
                  setFormulario((f) => ({ ...f, nombre: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Input
                id="categoria"
                placeholder="Comida, Bebida…"
                value={formulario.categoria}
                onChange={(e) =>
                  setFormulario((f) => ({ ...f, categoria: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                value={formulario.descripcion}
                onChange={(e) =>
                  setFormulario((f) => ({ ...f, descripcion: e.target.value }))
                }
              />
            </div>

            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={enviando} className="flex-1">
                {enviando
                  ? 'Guardando…'
                  : editandoId === null
                    ? 'Crear platillo'
                    : 'Guardar cambios'}
              </Button>
              {editandoId !== null && (
                <Button type="button" variant="ghost" onClick={cancelar}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
