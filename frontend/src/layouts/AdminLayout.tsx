import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { AppDrawer, type ItemDrawer } from '../components/AppDrawer'
import { RoleHeader } from '../components/RoleHeader'

const ITEMS: ItemDrawer[] = [
  { to: '/admin', etiqueta: 'Inicio', icono: 'icon-inicio' },
  { to: '/admin/usuarios', etiqueta: 'Usuarios', icono: 'icon-usuarios' },
  { to: '/admin/platillos', etiqueta: 'Platillos', icono: 'icon-platillos' },
  { to: '/admin/menu', etiqueta: 'Menú del día', icono: 'icon-menu' },
]

/**
 * Layout de administración rediseñado (spec 007, FR-001…FR-003): reemplaza
 * la nav de tabs por `AppDrawer` con sus 4 secciones; el cierre de sesión
 * vive en el pie del drawer. El admin no usa bottom bar (T032).
 */
export function AdminLayout() {
  const [abierto, setAbierto] = useState(false)
  const { pathname } = useLocation()

  // Al navegar de sección se cierra el panel deslizante (M7).
  useEffect(() => {
    setAbierto(false)
  }, [pathname])

  return (
    <div className="flex min-h-screen">
      <AppDrawer
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Administración"
        items={ITEMS}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <RoleHeader
          titulo="Administración"
          onAbrirMenu={() => setAbierto(true)}
        />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
