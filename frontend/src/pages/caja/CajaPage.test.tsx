import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import CajaPage from './CajaPage'

type FetchMock = ReturnType<typeof vi.fn>

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const ITEM = {
  id: 11,
  platillo_id: 1,
  nombre: 'Gordita de chicharrón',
  categoria: 'Comida',
  descripcion: null,
  precio: 35,
  disponible: true,
  especial: false,
}

const ITEM_BEBIDA = {
  id: 12,
  platillo_id: 2,
  nombre: 'Agua de horchata',
  categoria: 'Bebidas',
  descripcion: null,
  precio: 25,
  disponible: true,
  especial: false,
}

const PEDIDO_PENDIENTE = {
  id: 50,
  numero: 'PED-261013-ABCDEF12',
  tipo: 'mostrador',
  estado: 'Pendiente',
  total: 70,
  fecha_recoleccion: null,
  creado_en: '2026-10-13T10:15:00.000Z',
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

const PEDIDO_PAGADO = { ...PEDIDO_PENDIENTE, estado: 'Pagado' }

const RUTAS_BASE = [
  {
    method: 'GET',
    url: '/api/menu',
    respuesta: () =>
      json({ fecha: '2026-10-13', items: [ITEM, ITEM_BEBIDA] }),
  },
]

interface Ruta {
  method: string
  url: string
  respuesta: () => Response
}

function instalarFetch(rutas: Ruta[]): FetchMock {
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

function renderPagina(): void {
  render(
    <MemoryRouter initialEntries={['/caja/nuevo']}>
      <CajaPage />
    </MemoryRouter>,
  )
}

function cuerpoEnviado(
  fetchMock: FetchMock,
  url: string,
  method: string,
): Record<string, unknown> {
  const llamada = fetchMock.mock.calls.find(
    ([p, init]) =>
      p === url &&
      ((init as RequestInit | undefined)?.method ?? 'GET') === method,
  )
  const init = llamada?.[1] as RequestInit | undefined
  return JSON.parse(String(init?.body)) as Record<string, unknown>
}

function contarPost(fetchMock: FetchMock, url: string): number {
  return fetchMock.mock.calls.filter(
    ([p, init]) =>
      p === url && (init as RequestInit | undefined)?.method === 'POST',
  ).length
}

describe('CajaPage (cajero)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('cobra en un paso: Ver cobro → Registrar y cobrar (SC-S4-01)', async () => {
    const fetchMock = instalarFetch([
      ...RUTAS_BASE,
      { method: 'POST', url: '/api/caja/pedidos', respuesta: () => json(PEDIDO_PENDIENTE, 201) },
      {
        method: 'POST',
        url: '/api/caja/pedidos/50/pago',
        respuesta: () =>
          json({
            pedido: PEDIDO_PAGADO,
            pago: { metodo: 'efectivo', monto: 70, referencia: null, estado: 'confirmado' },
          }),
      },
    ])
    renderPagina()

    await screen.findByText('Gordita de chicharrón')
    const agregar = screen.getByRole('button', {
      name: 'Agregar uno de Gordita de chicharrón',
    })
    await userEvent.click(agregar)
    await userEvent.click(agregar)
    await userEvent.type(
      screen.getByLabelText('Nombre del cliente (opcional)'),
      'Ana López',
    )

    // La CheckoutBar muestra conteo y total, y abre el resumen
    expect(screen.getByText('2 platillos')).toBeInTheDocument()
    expect(screen.getAllByText('$70.00').length).toBeGreaterThan(0)
    await userEvent.click(screen.getByRole('button', { name: 'Ver cobro' }))

    // Resumen con desglose
    expect(screen.getByText('2× Gordita de chicharrón')).toBeInTheDocument()
    expect(
      screen.getByText('El pedido se registra y cobra en un solo paso.'),
    ).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: 'Registrar y cobrar' }),
    )

    // Resultado con folio y estado cobrado
    expect((await screen.findAllByText(/PED-261013-ABCDEF12/)).length).toBeGreaterThan(0)
    expect(screen.getByText(/Cobro confirmado/)).toBeInTheDocument()
    expect(screen.getByText('Pagado')).toBeInTheDocument()

    // La captura envía nombre e items con cantidad al servidor
    expect(cuerpoEnviado(fetchMock, '/api/caja/pedidos', 'POST')).toMatchObject({
      cliente_nombre: 'Ana López',
      items: [{ menu_dia_id: 11, cantidad: 2 }],
    })
  })

  it('sin platillos seleccionados muestra error local sin llamar a la API', async () => {
    const fetchMock = instalarFetch([...RUTAS_BASE])
    renderPagina()

    await screen.findByText('Gordita de chicharrón')
    await userEvent.click(
      screen.getByRole('button', { name: 'Registrar y cobrar' }),
    )

    expect(
      await screen.findByText('Agrega al menos un platillo al pedido.'),
    ).toBeInTheDocument()
    expect(contarPost(fetchMock, '/api/caja/pedidos')).toBe(0)
  })

  it('si el cobro falla, ofrece reintentar sin duplicar el pedido', async () => {
    let pagoOk = false
    const fetchMock = instalarFetch([
      ...RUTAS_BASE,
      { method: 'POST', url: '/api/caja/pedidos', respuesta: () => json(PEDIDO_PENDIENTE, 201) },
      {
        method: 'POST',
        url: '/api/caja/pedidos/50/pago',
        respuesta: () =>
          pagoOk
            ? json({ pedido: PEDIDO_PAGADO })
            : json(
                { error: { code: 'interno', message: 'El cobro no pudo completarse.' } },
                500,
              ),
      },
    ])
    renderPagina()

    await screen.findByText('Gordita de chicharrón')
    await userEvent.click(
      screen.getByRole('button', { name: 'Agregar uno de Gordita de chicharrón' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Ver cobro' }))
    await userEvent.click(
      screen.getByRole('button', { name: 'Registrar y cobrar' }),
    )

    // El pedido quedó capturado (Pendiente) y se ofrece solo reintentar el cobro
    expect(await screen.findByText(/quedó Pendiente/)).toBeInTheDocument()

    pagoOk = true
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar cobro' }))
    expect(await screen.findByText(/Cobro confirmado/)).toBeInTheDocument()

    // Un solo POST de captura: el reintento no duplica el pedido
    expect(contarPost(fetchMock, '/api/caja/pedidos')).toBe(1)
  })

  it('la búsqueda filtra el catálogo en vivo', async () => {
    instalarFetch([...RUTAS_BASE])
    renderPagina()

    await screen.findByText('Gordita de chicharrón')
    await userEvent.type(
      screen.getByPlaceholderText('Buscar producto...'),
      'horchata',
    )

    expect(screen.getByText('Agua de horchata')).toBeInTheDocument()
    expect(screen.queryByText('Gordita de chicharrón')).not.toBeInTheDocument()

    await userEvent.clear(screen.getByPlaceholderText('Buscar producto...'))
    await userEvent.type(
      screen.getByPlaceholderText('Buscar producto...'),
      'zzz',
    )
    expect(screen.getByText('Sin resultados para tu búsqueda.')).toBeInTheDocument()
  })

  it('los chips de categoría filtran por categoría', async () => {
    instalarFetch([...RUTAS_BASE])
    renderPagina()

    await screen.findByText('Gordita de chicharrón')
    const chipBebidas = screen.getByRole('button', { name: 'Bebidas' })
    expect(chipBebidas).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(chipBebidas)

    expect(chipBebidas).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Agua de horchata')).toBeInTheDocument()
    expect(screen.queryByText('Gordita de chicharrón')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Todas' }))
    expect(screen.getByText('Gordita de chicharrón')).toBeInTheDocument()
  })

  it('el stepper va de 0 a 99 con − deshabilitado en 0', async () => {
    instalarFetch([...RUTAS_BASE])
    renderPagina()

    await screen.findByText('Gordita de chicharrón')
    const agregar = screen.getByRole('button', {
      name: 'Agregar uno de Gordita de chicharrón',
    })
    const quitar = screen.getByRole('button', {
      name: 'Quitar uno de Gordita de chicharrón',
    })
    const cantidad = screen.getByLabelText('Cantidad de Gordita de chicharrón')

    // En 0 el botón − está deshabilitado
    expect(quitar).toBeDisabled()

    // Tope 99: 100 toques no pasan de 99
    for (let i = 0; i < 100; i += 1) fireEvent.click(agregar)
    expect(cantidad).toHaveTextContent('99')

    // Baja y vuelve a deshabilitarse en 0
    fireEvent.click(quitar)
    expect(cantidad).toHaveTextContent('98')
    for (let i = 0; i < 98; i += 1) fireEvent.click(quitar)
    expect(cantidad).toHaveTextContent('0')
    expect(quitar).toBeDisabled()
  })
})
