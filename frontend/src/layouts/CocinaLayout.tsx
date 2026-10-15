import { useState } from 'react'
import { Outlet } from 'react-router'
import { AppDrawer, type ItemDrawer } from '../components/AppDrawer'
import { RoleHeader } from '../components/RoleHeader'

const ITEMS: ItemDrawer[] = [
  { to: '/cocina', etiqueta: 'Pedidos', icono: 'icon-pedidos' },
]

/**
 * Layout de cocina rediseñado (spec 007, FR-001…FR-002): con una sola
 * vista no hay bottom bar; se reemplaza la nav de tabs por `AppDrawer`
 * (rail en escritorio, panel deslizante en móvil). El contador de
 * pedidos y el indicador "act. hace X s" viven en `CocinaPage`, que es
 * quien conoce el sondeo.
 */
export function CocinaLayout() {
  const [abierto, setAbierto] = useState(false)

  return (
    <div className="flex min-h-screen">
      <AppDrawer
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Cocina"
        items={ITEMS}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <RoleHeader titulo="Cocina" onAbrirMenu={() => setAbierto(true)} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
