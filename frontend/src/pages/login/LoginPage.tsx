import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { RUTA_POR_ROL } from '../../lib/roles'
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

interface ErroresCampo {
  correo?: string
  password?: string
}

function esCorreoValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
}

export default function LoginPage() {
  const { usuario, cargando, iniciarSesion } = useAuth()
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [errores, setErrores] = useState<ErroresCampo>({})
  const [errorServidor, setErrorServidor] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Ya con sesión: a la pantalla del rol
  if (!cargando && usuario) {
    return <Navigate to={RUTA_POR_ROL[usuario.rol]} replace />
  }

  function validar(): boolean {
    const nuevos: ErroresCampo = {}
    if (!correo.trim()) {
      nuevos.correo = 'El correo es requerido.'
    } else if (!esCorreoValido(correo.trim())) {
      nuevos.correo = 'Ingresa un correo electrónico válido.'
    }
    if (!password) {
      nuevos.password = 'La contraseña es requerida.'
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
      const u = await iniciarSesion(correo.trim(), password)
      navigate(RUTA_POR_ROL[u.rol], { replace: true })
    } catch (err) {
      setErrorServidor(
        err instanceof ApiError
          ? err.message
          : 'Ocurrió un error. Inténtalo de nuevo.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 entrada">
      <Card className="w-full max-w-sm border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl">Iniciar sesión</CardTitle>
          <CardDescription>
            Sistema de Pedidos Anticipados — Cafetería ITSH
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate className="grid gap-4">
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
                autoComplete="current-password"
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

            {errorServidor && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {errorServidor}
              </p>
            )}

            <Button type="submit" disabled={enviando} className="w-full">
              {enviando ? 'Entrando…' : 'Iniciar sesión'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link
                to="/registro"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Regístrate
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
