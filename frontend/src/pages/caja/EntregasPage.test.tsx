import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EntregasPage from './EntregasPage'

type FetchMock = ReturnType<typeof vi.fn>

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const PEDIDO_LISTO = {
  id: 40,
  numero: 'PED-261013-AAAA1111',
  estado: 'Listo',
  cliente_nombre: 'Ana López',
  creado_en: '2026-10-13T12:00:00.000Z',
  partidas: [{ nombre: 'Gordita', cantidad: 2 }],
}

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

describe('EntregasPage (cajero)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('lista los pedidos Listo con folio, cliente, partidas y badge', async () => {
    instalarFetch([
      {
        method: 'GET',
        url: '/api/caja/pedidos/listos',
        respuesta: () => json({ pedidos: [PEDIDO_LISTO] }),
      },
    ])
    render(<EntregasPage />)

    expect(await screen.findByText('PED-261013-AAAA1111')).toBeInTheDocument()
    expect(screen.getByText('Listo')).toBeInTheDocument()
    expect(screen.getByText(/Ana López/)).toBeInTheDocument()
    expect(screen.getByText(/2× Gordita/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Entregar PED-261013-AAAA1111' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Cancelar PED-261013-AAAA1111' }),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('1 pedidos pendientes'),
    ).toBeInTheDocument()
  })

  it('entrega un pedido: lo retira de la lista y confirma (FR-008)', async () => {
    const fetchMock = instalarFetch([
      {
        method: 'GET',
        url: '/api/caja/pedidos/listos',
        respuesta: () => json({ pedidos: [PEDIDO_LISTO] }),
      },
      {
        method: 'POST',
        url: '/api/caja/pedidos/40/estado',
        respuesta: () => json({ pedido: { ...PEDIDO_LISTO, estado: 'Entregado' } }),
      },
    ])
    render(<EntregasPage />)

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Entregar PED-261013-AAAA1111',
      }),
    )

    expect(await screen.findByText('Pedido entregado.')).toBeInTheDocument()
    expect(
      screen.queryByText('PED-261013-AAAA1111'),
    ).not.toBeInTheDocument()

    const llamada = fetchMock.mock.calls.find(
      ([p, init]) =>
        p === '/api/caja/pedidos/40/estado' &&
        (init as RequestInit | undefined)?.method === 'POST',
    )
    const init = llamada?.[1] as RequestInit | undefined
    expect(JSON.parse(String(init?.body))).toEqual({ estado: 'Entregado' })
  })

  it('muestra el estado vacío "¡Todo está al día!"', async () => {
    instalarFetch([
      {
        method: 'GET',
        url: '/api/caja/pedidos/listos',
        respuesta: () => json({ pedidos: [] }),
      },
    ])
    render(<EntregasPage />)

    expect(await screen.findByText('¡Todo está al día!')).toBeInTheDocument()
    expect(
      screen.getByText('No hay pedidos listos por entregar.'),
    ).toBeInTheDocument()
  })

  it('ante un error de carga ofrece Reintentar (SC-006)', async () => {
    let intento = 0
    instalarFetch([
      {
        method: 'GET',
        url: '/api/caja/pedidos/listos',
        respuesta: () =>
          intento++ === 0
            ? json(
                {
                  error: {
                    code: 'interno',
                    message: 'No se pudieron leer los pedidos.',
                  },
                },
                500,
              )
            : json({ pedidos: [PEDIDO_LISTO] }),
      },
    ])
    render(<EntregasPage />)

    expect(
      await screen.findByText('No se pudieron leer los pedidos.'),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('PED-261013-AAAA1111')).toBeInTheDocument()
  })
})
