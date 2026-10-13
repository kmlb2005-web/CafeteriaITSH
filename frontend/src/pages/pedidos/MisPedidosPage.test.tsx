import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import MisPedidosPage from './MisPedidosPage'

type FetchMock = ReturnType<typeof vi.fn>

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const PAGADO = {
  id: 45,
  numero: 'PED-261013-A1B2C3D4',
  tipo: 'anticipado',
  estado: 'Pagado',
  total: 70,
  fecha_recoleccion: '2026-10-13T12:00',
  creado_en: '2026-10-13T10:15:00.000Z',
  aviso_listo: false,
}

const LISTO = {
  id: 46,
  numero: 'PED-261013-E5F6G7H8',
  tipo: 'mostrador',
  estado: 'Listo',
  total: 35,
  fecha_recoleccion: null,
  creado_en: '2026-10-13T09:00:00.000Z',
  aviso_listo: true,
}

const DETALLE = {
  id: 45,
  numero: 'PED-261013-A1B2C3D4',
  estado: 'Pagado',
  total: 70,
  fecha_recoleccion: '2026-10-13T12:00',
  partidas: [
    {
      id: 1,
      menu_dia_id: 11,
      nombre: 'Gordita de chicharrón',
      cantidad: 2,
      precio_unitario: 35,
      subtotal: 70,
    },
  ],
}

function instalarFetch(
  rutas: Array<{ method: string; url: string; respuesta: () => Response }>,
): FetchMock {
  const fetchMock: FetchMock = vi.fn(
    async (url: string, init: RequestInit = {}) => {
      const method = init.method ?? 'GET'
      const ruta = rutas.find((r) => r.url === url && r.method === method)
      if (!ruta) throw new Error(`Llamada inesperada: ${method} ${String(url)}`)
      return ruta.respuesta()
    },
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderizar(): void {
  render(
    <MemoryRouter>
      <MisPedidosPage />
    </MemoryRouter>,
  )
}

describe('MisPedidosPage (cliente)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('lista los pedidos con su estado y destaca el aviso Listo para recoger', async () => {
    instalarFetch([
      {
        method: 'GET',
        url: '/api/pedidos',
        respuesta: () => json({ pedidos: [PAGADO, LISTO] }),
      },
    ])
    renderizar()

    expect(await screen.findByText('PED-261013-A1B2C3D4')).toBeInTheDocument()
    expect(screen.getByText('PED-261013-E5F6G7H8')).toBeInTheDocument()
    expect(screen.getAllByText('Pagado')).toHaveLength(1)
    expect(screen.getAllByText('Listo')).toHaveLength(1)

    // Aviso in-app del pedido listo (US2)
    expect(
      screen.getByText('¡Listo para recoger! Pasa por el mostrador.'),
    ).toBeInTheDocument()
  })

  it('abre el detalle de un pedido con sus partidas y total (US1.2)', async () => {
    const fetchMock = instalarFetch([
      { method: 'GET', url: '/api/pedidos', respuesta: () => json({ pedidos: [PAGADO] }) },
      { method: 'GET', url: '/api/pedidos/45', respuesta: () => json(DETALLE) },
    ])
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Ver detalle' }))

    expect(await screen.findByText(/Gordita de chicharrón/)).toBeInTheDocument()
    expect(screen.getByText('Total pagado')).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(([p]) => p === '/api/pedidos/45'),
    ).toBe(true)
  })

  it('muestra un estado vacío cuando aún no hay pedidos', async () => {
    instalarFetch([
      { method: 'GET', url: '/api/pedidos', respuesta: () => json({ pedidos: [] }) },
    ])
    renderizar()

    expect(
      await screen.findByText('Aún no tienes pedidos. ¡Anímate a pedir!'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver el menú de hoy' })).toBeInTheDocument()
  })

  it('muestra un error con opción de reintentar si la consulta falla', async () => {
    let fallar = true
    instalarFetch([
      {
        method: 'GET',
        url: '/api/pedidos',
        respuesta: () =>
          fallar
            ? json({ error: { code: 'interno', message: 'Fallo interno.' } }, 500)
            : json({ pedidos: [PAGADO] }),
      },
    ])
    renderizar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Fallo interno.')

    fallar = false
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('PED-261013-A1B2C3D4')).toBeInTheDocument()
  })
})
