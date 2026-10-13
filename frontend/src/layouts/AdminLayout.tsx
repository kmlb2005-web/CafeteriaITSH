import { NavLink, Outlet } from 'react-router'
import { RoleHeader } from '../components/RoleHeader'

/** Layout del módulo de administración (US2, Sprint 1 + menú, Sprint 2). */
const navClass = ({ isActive }: { isActive: boolean }): string =>
  `px-3 py-2 text-sm font-semibold ${
    isActive
      ? 'border-b-2 border-primary text-primary'
      : 'text-muted-foreground hover:text-foreground'
  }`

export function AdminLayout() {
  return (
    <div className="min-h-screen">
      <RoleHeader titulo="Administración" />
      <nav className="border-b border-border bg-surface-container-low">
        <div className="mx-auto flex max-w-5xl gap-1 px-4">
          <NavLink
            to="/admin"
            end
            className={navClass}
          >
            Usuarios
          </NavLink>
          <NavLink to="/admin/platillos" className={navClass}>
            Platillos
          </NavLink>
          <NavLink to="/admin/menu" className={navClass}>
            Menú del día
          </NavLink>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
