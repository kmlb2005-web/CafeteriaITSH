import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError, api } from '../../lib/api'
import { ROL_ETIQUETA, type Rol } from '../../lib/roles'
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

/**
 * Gestión de usuarios operativos (spec 007 US4, FR-017): filas ≥56 px con
 * nombre/correo, badge de rol (pill) y estado, acciones por fila con
 * **confirmación antes de dar de baja**, buscador, CTA fijo **Nuevo
 * usuario**, estados vacío/error con `Reintentar` (SC-006).
 */
export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioOperativo[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [formulario, setFormulario] = useState<EstadoFormulario>(FORM_VACIO)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setErrorCarga(null)
    try {
      const lista = await api<UsuarioOperativo[]>('/api/usuarios')
      setUsuarios(lista)
    } catch (err) {
      setErrorCarga(
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
  }, [cargar, intento])

  function limpiarMensajes(): void {
    setError(null)
    setExito(null)
  }

  function nuevoUsuario(): void {
    limpiarMensajes()
    setConfirmandoId(null)
    setEditandoId(null)
    setFormulario(FORM_VACIO)
  }

  function comenzarEdicion(u: UsuarioOperativo): void {
    limpiarMensajes()
    setConfirmandoId(null)
    setEditandoId(u.id)
    setFormulario({
      nombre: u.nombre,
      correo: u.correo,
      password: '',
      rol: u.rol as RolOperativo,
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
      let mensaje = ''
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
        mensaje = 'Usuario creado correctamente.'
      } else {
        await api<UsuarioOperativo>(`/api/usuarios/${editandoId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            nombre: formulario.nombre.trim(),
            correo: formulario.correo.trim(),
          }),
        })
        mensaje = 'Usuario actualizado correctamente.'
      }
      // limpiar el formulario primero y el éxito después: cancelar() borra
      // los mensajes, así el aviso no se pierde (defecto detectado en T038)
      cancelar()
      setExito(mensaje)
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
    setConfirmandoId(null)
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

  const texto = busqueda.trim().toLowerCase()
  const visibles = usuarios.filter(
    (u) =>
      texto === '' ||
      u.nombre.toLowerCase().includes(texto) ||
      u.correo.toLowerCase().includes(texto),
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>Usuarios operativos</CardTitle>
            <CardDescription>Cajeros y cocineros del sistema.</CardDescription>
          </div>
          <Button type="button" size="touch" onClick={nuevoUsuario}>
            Nuevo usuario
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3">
          {exito && (
            <p role="status" className="text-sm font-medium text-primary">
              {exito}
            </p>
          )}

          {!cargando && !errorCarga && usuarios.length > 0 && (
            <div className="grid gap-2">
              <label htmlFor="buscar-usuario" className="sr-only">
                Buscar usuario
              </label>
              <Input
                id="buscar-usuario"
                type="search"
                placeholder="Buscar usuario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          )}

          {cargando ? (
            <p role="status" className="text-sm text-muted-foreground">
              Cargando usuarios…
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
          ) : usuarios.length === 0 ? (
            <div className="grid justify-items-start gap-3 py-4">
              <p className="text-sm text-muted-foreground">
                Aún no hay usuarios operativos. Crea el primero.
              </p>
              <Button type="button" size="touch" onClick={nuevoUsuario}>
                Nuevo usuario
              </Button>
            </div>
          ) : visibles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin resultados para “{busqueda.trim()}”.
            </p>
          ) : (
            <ul className="grid gap-2">
              {visibles.map((u) => (
                <li
                  key={u.id}
                  className="grid gap-2 rounded-md border border-border bg-surface-container-low px-3 py-2"
                >
                  <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {u.nombre}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.correo}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                      {ROL_ETIQUETA[u.rol]}
                    </span>
                    <span
                      className={
                        u.activo
                          ? 'shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary'
                          : 'shrink-0 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive'
                      }
                    >
                      {u.activo ? 'Activo' : 'Inhabilitado'}
                    </span>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="touch"
                        onClick={() => comenzarEdicion(u)}
                      >
                        Editar
                      </Button>
                      {u.activo ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="touch"
                          aria-label={`Dar de baja a ${u.nombre}`}
                          onClick={() => {
                            limpiarMensajes()
                            setConfirmandoId(u.id)
                          }}
                        >
                          Dar de baja
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          size="touch"
                          onClick={() => void alternarEstado(u)}
                        >
                          Reactivar
                        </Button>
                      )}
                    </div>
                  </div>

                  {confirmandoId === u.id && (
                    <div
                      role="alert"
                      className="flex flex-wrap items-center gap-2 rounded-md border border-destructive/40 bg-surface-container-low p-2"
                    >
                      <p className="min-w-0 flex-1 text-sm">
                        ¿Dar de baja a <strong>{u.nombre}</strong>? Ya no podrá
                        iniciar sesión.
                      </p>
                      <Button
                        type="button"
                        variant="destructive"
                        size="touch"
                        onClick={() => void alternarEstado(u)}
                      >
                        Sí, dar de baja
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="touch"
                        onClick={() => setConfirmandoId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {editandoId === null ? 'Nuevo usuario' : 'Editar usuario'}
          </CardTitle>
          <CardDescription>
            {editandoId === null
              ? 'Crea una cuenta de cajero o cocinero.'
              : 'Modifica nombre y/o correo.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => void onSubmit(e)}
            noValidate
            className="grid gap-4"
          >
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
              <Button
                type="submit"
                size="touch"
                disabled={enviando}
                className="flex-1"
              >
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
