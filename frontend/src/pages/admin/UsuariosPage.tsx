import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError, api } from '../../lib/api'
import type { Rol } from '../../lib/roles'
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

interface UsuarioOperativo {
  id: number
  nombre: string
  correo: string
  rol: Rol
  activo: boolean
}

type RolOperativo = 'cajero' | 'cocinero'

interface EstadoFormulario {
  nombre: string
  correo: string
  password: string
  rol: RolOperativo
}

const FORM_VACIO: EstadoFormulario = {
  nombre: '',
  correo: '',
  password: '',
  rol: 'cajero',
}

function esCorreoValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
}

/** Gestión de usuarios operativos del administrador (US2). */
export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioOperativo[]>([])
  const [cargando, setCargando] = useState(true)
  const [formulario, setFormulario] = useState<EstadoFormulario>(FORM_VACIO)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const lista = await api<UsuarioOperativo[]>('/api/usuarios')
      setUsuarios(lista)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo cargar la lista de usuarios.',
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

  function comenzarEdicion(u: UsuarioOperativo): void {
    limpiarMensajes()
    setEditandoId(u.id)
    setFormulario({ nombre: u.nombre, correo: u.correo, password: '', rol: u.rol as RolOperativo })
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
    if (!esCorreoValido(formulario.correo.trim())) {
      setError('Ingresa un correo electrónico válido.')
      return
    }
    if (editandoId === null && formulario.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setEnviando(true)
    try {
      if (editandoId === null) {
        await api<UsuarioOperativo>('/api/usuarios', {
          method: 'POST',
          body: JSON.stringify({
            nombre: formulario.nombre.trim(),
            correo: formulario.correo.trim(),
            password: formulario.password,
            rol: formulario.rol,
          }),
        })
        setExito('Usuario creado correctamente.')
      } else {
        await api<UsuarioOperativo>(`/api/usuarios/${editandoId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            nombre: formulario.nombre.trim(),
            correo: formulario.correo.trim(),
          }),
        })
        setExito('Usuario actualizado correctamente.')
      }
      cancelar()
      await cargar()
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No se pudo guardar el usuario.',
      )
    } finally {
      setEnviando(false)
    }
  }

  async function alternarEstado(u: UsuarioOperativo): Promise<void> {
    limpiarMensajes()
    try {
      await api<UsuarioOperativo>(`/api/usuarios/${u.id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ activo: !u.activo }),
      })
      setExito(
        u.activo
          ? `${u.nombre} fue dado de baja; ya no podrá iniciar sesión.`
          : `${u.nombre} fue reactivado.`,
      )
      await cargar()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo cambiar el estado del usuario.',
      )
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card>
        <CardHeader>
          <CardTitle>Usuarios operativos</CardTitle>
          <CardDescription>Cajeros y cocineros del sistema.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {exito && (
            <p role="status" className="text-sm font-medium text-primary">
              {exito}
            </p>
          )}
          {cargando ? (
            <p className="text-sm text-muted-foreground">Cargando usuarios…</p>
          ) : usuarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay usuarios operativos. Crea el primero con el formulario.
            </p>
          ) : (
            <ul className="grid gap-2">
              {usuarios.map((u) => (
                <li
                  key={u.id}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface-container-low px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {u.nombre}{' '}
                      <span
                        className={`ml-1 rounded px-1.5 py-0.5 text-xs font-semibold ${
                          u.activo
                            ? 'bg-primary/15 text-primary'
                            : 'bg-destructive/15 text-destructive'
                        }`}
                      >
                        {u.activo ? 'Activo' : 'De baja'}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.correo} · {u.rol}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => comenzarEdicion(u)}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant={u.activo ? 'destructive' : 'secondary'}
                      size="sm"
                      onClick={() => void alternarEstado(u)}
                    >
                      {u.activo ? 'Dar de baja' : 'Reactivar'}
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
          <CardTitle>{editandoId === null ? 'Nuevo usuario' : 'Editar usuario'}</CardTitle>
          <CardDescription>
            {editandoId === null
              ? 'Crea una cuenta de cajero o cocinero.'
              : 'Modifica nombre y/o correo.'}
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
              <Label htmlFor="correo">Correo</Label>
              <Input
                id="correo"
                type="email"
                value={formulario.correo}
                onChange={(e) =>
                  setFormulario((f) => ({ ...f, correo: e.target.value }))
                }
              />
            </div>
            {editandoId === null && (
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={formulario.password}
                  onChange={(e) =>
                    setFormulario((f) => ({ ...f, password: e.target.value }))
                  }
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="rol">Rol</Label>
              <select
                id="rol"
                className="flex h-10 w-full rounded-md border border-input bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                value={formulario.rol}
                disabled={editandoId !== null}
                onChange={(e) =>
                  setFormulario((f) => ({
                    ...f,
                    rol: e.target.value as RolOperativo,
                  }))
                }
              >
                <option value="cajero">Cajero</option>
                <option value="cocinero">Cocinero</option>
              </select>
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
                    ? 'Crear usuario'
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
