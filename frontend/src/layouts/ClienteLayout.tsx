import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { AppDrawer, type ItemDrawer } from '../components/AppDrawer'
import { BottomBar, type ItemBottomBar } from '../components/BottomBar'
import { RoleHeader } from '../components/RoleHeader'
import { api } from '../lib/api'

const ITEMS_DRAWER: ItemDrawer[] = [
  { to: '/menu', etiqueta: 'Menú del día', icono: 'icon-menu' },
  { to: '/mis-pedidos', etiqueta: 'Mis pedidos', icono: 'icon-pedidos' },
]

const ITEMS_BARRA: ItemBottomBar[] = [
  { to: '/menu', etiqueta: 'Menú', icono: 'icon-menu' },
  { to: '/mis-pedidos', etiqueta: 'Mis pedidos', icono: 'icon-pedidos' },
]

interface PedidoLista {
  estado: string
}

/**
 * Layout del cliente (alumno/docente, FR-001…FR-003): reemplaza la nav de
 * tabs por `AppDrawer` + `BottomBar` con sus 2 secciones. El contador de
 * pedidos `Listo` se eleva aquí desde `GET /api/pedidos` (FR-015) y se
 * refresca al navegar; los pasos del flujo de pedido (`/pedido/*`) ocultan
 * la bottom bar —son pasos, no secciones— y conservan su botón regresar.
 */
export function ClienteLayout() {
  const [abierto, setAbierto] = useState(false)
  const [listos, setListos] = useState(0)
  const { pathname } = useLocation()
  const enFlujoPedido = pathname.startsWith('/pedido/')

  const cargarListos = useCallback(async () => {
    try {
      const datos = await api<{ pedidos: PedidoLista[] }>('/api/pedidos')
      setListos(datos.pedidos.filter((p) => p.estado === 'Listo').length)
    } catch {
      // El contador nunca debe bloquear la navegación
    }
  }, [])

  useEffect(() => {
    setAbierto(false)
    if (!enFlujoPedido) void cargarListos()
  }, [pathname, enFlujoPedido, cargarListos])

  const contador = { '/mis-pedidos': listos }

  return (
    <div className="flex min-h-screen">
      <AppDrawer
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Cafetería ITSH"
        items={ITEMS_DRAWER}
        contador={contador}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <RoleHeader
          titulo="Cafetería ITSH"
          onAbrirMenu={() => setAbierto(true)}
        />
        <main
          className={
            enFlujoPedido
              ? 'mx-auto w-full max-w-5xl flex-1 px-4 py-6'
              : 'mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 lg:pb-6'
          }
        >
          <Outlet />
        </main>
        {!enFlujoPedido && <BottomBar items={ITEMS_BARRA} contador={contador} />}
      </div>
    </div>
  )
}
