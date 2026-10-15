import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { ApiError, api } from '../../lib/api'

interface UsuarioResumen {
  id: number
  nombre: string
  activo: boolean
}

interface PlatilloResumen {
  id: number
  nombre: string
  categoria: string | null
  activo: boolean
}

interface ItemMenu {
  id: number
  nombre: string
  precio: number
  disponible: boolean
  especial: boolean
}

function fechaLarga(): string {
  return new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Inicio del administrador (spec 007 US4, FR-016): landing con tarjetas de
 * acción y conteos derivados de endpoints existentes (`GET /api/usuarios`,
 * listado de platillos, `GET /api/menu`) más el resumen del menú de hoy con
 * badge `Especial` y no disponibles atenuados. **Sin** métricas de negocio:
 * no hay endpoints de estadísticas (FR-021, fuera de alcance).
 */
export default function InicioAdminPage() {
  const [usuarios, setUsuarios] = useState<UsuarioResumen[] | null>(null)
  const [platillos, setPlatillos] = useState<PlatilloResumen[] | null>(null)
  const [items, setItems] = useState<ItemMenu[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  const cargar = useCallback(async () => {
    setError(null)
    try {
      const [u, p, m] = await Promise.all([
        api<UsuarioResumen[]>('/api/usuarios'),
        api<PlatilloResumen[]>('/api/admin/platillos'),
        api<{ items: ItemMenu[] }>('/api/menu'),
      ])
      setUsuarios(u)
      setPlatillos(p)
      setItems(m.items)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo cargar el resumen. Inténtalo de nuevo.',
      )
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar, intento])

  const activos = usuarios?.filter((u) => u.activo).length ?? 0
  const publicados = items?.length ?? 0

  if (error) {
    return (
      <div className="grid justify-items-center gap-4 py-10 text-center">
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIntento((n) => n + 1)}
        >
          Reintentar
        </Button>
      </div>
    )
  }

  if (usuarios === null || platillos === null || items === null) {
    return (
      <p role="status" className="py-10 text-center text-muted-foreground">
        Cargando resumen…
      </p>
    )
  }

  return (
    <div className="grid gap-5 entrada">
      <header className="grid gap-1">
        <p className="text-sm text-muted-foreground">{fechaLarga()}</p>
        <h1 className="font-heading text-2xl font-bold">
          Hola, administración
        </h1>
      </header>

      <ul className="grid gap-3 sm:grid-cols-3">
        <li>
          <Link to="/admin/usuarios" className="block h-full">
            <Card className="acento-superior h-full transition-all duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Usuarios</CardTitle>
                <CardDescription>
                  {activos} {activos === 1 ? 'activo' : 'activos'}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </li>
        <li>
          <Link to="/admin/platillos" className="block h-full">
            <Card className="acento-superior h-full transition-all duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Platillos</CardTitle>
                <CardDescription>{platillos.length} en catálogo</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </li>
        <li>
          <Link to="/admin/menu" className="block h-full">
            <Card className="acento-superior h-full transition-all duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Menú del día</CardTitle>
                <CardDescription>{publicados} publicados hoy</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </li>
      </ul>

      <section aria-labelledby="resumen-hoy" className="grid gap-3">
        <h2 id="resumen-hoy" className="font-heading text-lg font-bold">
          Resumen del menú de hoy
        </h2>

        {items.length === 0 && (
          <div className="grid gap-1">
            <p className="text-sm text-muted-foreground">
              No hay platillos publicados hoy.
            </p>
            <p className="text-sm">
              <Link
                to="/admin/menu"
                className="font-semibold text-primary hover:underline"
              >
                Publica el menú
              </Link>
            </p>
          </div>
        )}

        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={
                item.disponible
                  ? 'flex min-h-14 items-center gap-3 rounded-lg border border-border bg-surface-container-low px-3 py-2 transition-all duration-200 hover:border-primary/50 hover:bg-surface-container-lowest'
                  : 'flex min-h-14 items-center gap-3 rounded-lg border border-border bg-surface-container-low px-3 py-2 opacity-60'
              }
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  ${item.precio.toFixed(2)}
                </p>
              </div>
              {item.especial && (
                <span className="shrink-0 rounded-full bg-[#6B3F23] px-2 py-0.5 text-xs font-bold text-white">
                  Especial
                </span>
              )}
              {!item.disponible && (
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  No disponible
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
