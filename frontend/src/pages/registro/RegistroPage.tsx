import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError, api } from '../../lib/api'
import { useAuth, type SesionUsuario } from '../../lib/auth'
import { Button } from '../../components/ui/button'
import { IconoChip } from '../../components/Icono'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

interface ErroresCampo {
  nombre?: string
  correo?: string
  password?: string
  repetir?: string
}

function esCorreoValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
}

/**
 * Registro público de alumnos y docentes (FR-005, US1.5): el visitante crea
 * su cuenta con el rol de cliente y queda en sesión para ver el menú.
 */
export default function RegistroPage() {
  const { iniciarSesion } = useAuth()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [repetir, setRepetir] = useState('')
  const [errores, setErrores] = useState<ErroresCampo>({})
  const [errorServidor, setErrorServidor] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function validar(): boolean {
    const nuevos: ErroresCampo = {}
    if (nombre.trim().length < 2) {
      nuevos.nombre = 'Ingresa tu nombre (mínimo 2 letras).'
    }
    if (!esCorreoValido(correo.trim())) {
      nuevos.correo = 'Ingresa un correo electrónico válido.'
    }
    if (password.length < 8) {
      nuevos.password = 'La contraseña debe tener al menos 8 caracteres.'
    }
    if (repetir !== password) {
      nuevos.repetir = 'Las contraseñas no coinciden.'
    }
    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }

  async function onSubmit(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault()
    setErrorServidor(null)
    if (!validar()) return

    setEnviando(true)
    try {
      await api<SesionUsuario>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          nombre: nombre.trim(),
          correo: correo.trim(),
          password,
        }),
      })
      // queda en sesión con las credenciales recién creadas (US1.5)
      await iniciarSesion(correo.trim(), password)
      navigate('/menu', { replace: true })
    } catch (err) {
      setErrorServidor(
        err instanceof ApiError
          ? err.message
          : 'No se pudo completar el registro. Inténtalo de nuevo.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 entrada">
      <Card className="w-full max-w-sm border-primary/20">
        <CardHeader>
          <IconoChip
            id="icon-bebidas"
            tono="solido"
            className="mb-1 h-11 w-11"
          />
          <CardTitle className="text-xl">Crear cuenta</CardTitle>
          <CardDescription>
            Alumnos y docentes: registra tu cuenta para pedir anticipado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                autoComplete="name"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                aria-invalid={Boolean(errores.nombre)}
              />
              {errores.nombre && (
                <p role="alert" className="text-sm text-destructive">
                  {errores.nombre}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="correo">Correo electrónico</Label>
              <Input
                id="correo"
                type="email"
                autoComplete="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                aria-invalid={Boolean(errores.correo)}
              />
              {errores.correo && (
                <p role="alert" className="text-sm text-destructive">
                  {errores.correo}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(errores.password)}
              />
              {errores.password && (
                <p role="alert" className="text-sm text-destructive">
                  {errores.password}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="repetir">Repite la contraseña</Label>
              <Input
                id="repetir"
                type="password"
                autoComplete="new-password"
                value={repetir}
                onChange={(e) => setRepetir(e.target.value)}
                aria-invalid={Boolean(errores.repetir)}
              />
              {errores.repetir && (
                <p role="alert" className="text-sm text-destructive">
                  {errores.repetir}
                </p>
              )}
            </div>

            {errorServidor && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {errorServidor}
              </p>
            )}

            <Button type="submit" disabled={enviando} className="w-full">
              {enviando ? 'Creando cuenta…' : 'Registrarme'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/login"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Inicia sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
