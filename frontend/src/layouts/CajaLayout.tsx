import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { AppDrawer, type ItemDrawer } from '../components/AppDrawer'
import { BottomBar, type ItemBottomBar } from '../components/BottomBar'
import { RoleHeader } from '../components/RoleHeader'
import { api } from '../lib/api'
import { EVENTO_PEDIDOS_ACTUALIZADOS } from '../lib/eventos'

const ITEMS_DRAWER: ItemDrawer[] = [
  { to: '/caja', etiqueta: 'Inicio', icono: 'icon-inicio' },
  { to: '/caja/nuevo', etiqueta: 'Capturar pedido', icono: 'icon-caja' },
  { to: '/caja/entregas', etiqueta: 'Pedidos listos', icono: 'icon-entregas' },
]

/**
 * Layout de caja rediseñado (spec 007, FR-001…FR-003): reemplaza la nav
 * de tabs por `AppDrawer` (rail en escritorio, panel deslizante en móvil)
 * + `BottomBar` con 2 pestañas. El contador de pedidos `Listo` se eleva
 * aquí desde `GET /api/caja/pedidos/listos` y alimenta el badge del
 * drawer, de la bottom bar y del panel de Inicio.
 */
export function CajaLayout() {
  const [abierto, setAbierto] = useState(false)
  const [listos, setListos] = useState(0)
  const { pathname } = useLocation()

  const cargarListos = useCallback(async () => {
    try {
      const datos = await api<{ pedidos: unknown[] }>(
        '/api/caja/pedidos/listos',
      )
      setListos(datos.pedidos.length)
    } catch {
      // El contador nunca debe bloquear la navegación
    }
  }, [])

  // Refresca el contador al cambiar de sección y cuando una página avisa
  // que un pedido cambió de estado (entrega desde EntregasPage).
  useEffect(() => {
    setAbierto(false)
    void cargarListos()
    const actualizar = (): void => void cargarListos()
    window.addEventListener(EVENTO_PEDIDOS_ACTUALIZADOS, actualizar)
    return () => {
      window.removeEventListener(EVENTO_PEDIDOS_ACTUALIZADOS, actualizar)
    }
  }, [pathname, cargarListos])

  // En captura, la pestaña "Caja" conserva la ruta actual para no perder
  // el carrito con un toque accidental.
  const itemsBarra: ItemBottomBar[] = [
    {
      to: pathname === '/caja/nuevo' ? '/caja/nuevo' : '/caja',
      etiqueta: 'Caja',
      icono: 'icon-caja',
    },
    { to: '/caja/entregas', etiqueta: 'Entregas', icono: 'icon-entregas' },
  ]
  const contador = { '/caja/entregas': listos }

  return (
    <div className="flex min-h-screen">
      <AppDrawer
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Caja"
        items={ITEMS_DRAWER}
        contador={contador}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <RoleHeader titulo="Caja" onAbrirMenu={() => setAbierto(true)} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
        <BottomBar items={itemsBarra} contador={contador} />
      </div>
    </div>
  )
}
