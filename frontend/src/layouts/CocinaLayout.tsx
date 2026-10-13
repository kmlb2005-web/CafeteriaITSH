import { NavLink, Outlet } from 'react-router'
import { RoleHeader } from '../components/RoleHeader'

/** Layout del módulo de cocina (esqueleto en Sprint 1; pantalla en Sprint 4). */
export function CocinaLayout() {
  return (
    <div className="min-h-screen">
      <RoleHeader titulo="Cocina" />
      <nav className="border-b border-border bg-surface-container-low">
        <div className="mx-auto flex max-w-5xl gap-1 px-4">
          <NavLink
            to="/cocina"
            end
            className={({ isActive }) =>
              `px-3 py-2 text-sm font-semibold ${
                isActive
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            Pedidos
          </NavLink>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
