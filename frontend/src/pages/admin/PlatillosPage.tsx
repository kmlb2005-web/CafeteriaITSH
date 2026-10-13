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
  const [formulario, setFormulario] = useState<EstadoFormulario>(FORM_VACIO)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const cargar = useCallback(async () => {
    try {
      setPlatillos(await api<Platillo[]>('/api/admin/platillos'))
    } catch (err) {
      setError(
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
  }, [cargar])

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

  async function onSubmit(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault()
    limpiarMensajes()

    if (formulario.nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 letras.')
      return
    }

    setEnviando(true)
    try {
      if (editandoId === null) {
        await api<Platillo>('/api/admin/platillos', {
          method: 'POST',
          body: JSON.stringify({
            nombre: formulario.nombre.trim(),
            categoria: formulario.categoria.trim() || undefined,
            descripcion: formulario.descripcion.trim() || undefined,
          }),
        })
        setExito('Platillo creado correctamente.')
      } else {
        await api<Platillo>(`/api/admin/platillos/${editandoId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            nombre: formulario.nombre.trim(),
            categoria: formulario.categoria.trim(),
            descripcion: formulario.descripcion.trim(),
          }),
        })
        setExito('Platillo actualizado correctamente.')
      }
      cancelar()
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

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card>
        <CardHeader>
          <CardTitle>Catálogo de platillos</CardTitle>
          <CardDescription>
            Productos disponibles para armar el menú del día.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {exito && (
            <p role="status" className="text-sm font-medium text-primary">
              {exito}
            </p>
          )}
          {cargando ? (
            <p className="text-sm text-muted-foreground">Cargando catálogo…</p>
          ) : platillos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay platillos. Crea el primero con el formulario.
            </p>
          ) : (
            <ul className="grid gap-2">
              {platillos.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface-container-low px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {p.nombre}{' '}
                      <span
                        className={`ml-1 rounded px-1.5 py-0.5 text-xs font-semibold ${
                          p.activo
                            ? 'bg-primary/15 text-primary'
                            : 'bg-destructive/15 text-destructive'
                        }`}
                      >
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.categoria ?? 'Sin categoría'}
                      {p.descripcion ? ` · ${p.descripcion}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => comenzarEdicion(p)}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant={p.activo ? 'destructive' : 'secondary'}
                      size="sm"
                      onClick={() => void alternarActivo(p)}
                    >
                      {p.activo ? 'Desactivar' : 'Activar'}
                    </Button>
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
