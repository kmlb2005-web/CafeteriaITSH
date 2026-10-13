import { NavLink, Outlet } from 'react-router'
import { RoleHeader } from '../components/RoleHeader'

/**
 * Layout del cliente (alumno/docente): navegación solo con sus módulos
 * (menú y seguimiento) — FR-003, US3.3.
 */
export function ClienteLayout() {
  const links = [
    { a: '/menu', texto: 'Menú del día' },
    { a: '/mis-pedidos', texto: 'Mis pedidos' },
  ]

  return (
    <div className="min-h-screen">
      <RoleHeader titulo="Cafetería ITSH" />
      <nav className="border-b border-border bg-surface-container-low">
        <div className="mx-auto flex max-w-5xl gap-1 px-4">
          {links.map((link) => (
            <NavLink
              key={link.a}
              to={link.a}
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-semibold ${
                  isActive
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              {link.texto}
            </NavLink>
          ))}
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
