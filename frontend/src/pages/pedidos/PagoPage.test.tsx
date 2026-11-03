import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import PagoPage from './PagoPage'

type FetchMock = ReturnType<typeof vi.fn>

const PEDIDO = {
  id: 7,
  numero: 'PED-261111-AABBCCDD',
  tipo: 'anticipado',
  estado: 'Pendiente',
  total: 90,
  fecha_recoleccion: '2026-11-11T12:40',
  creado_en: '2026-11-11T12:00:00.000Z',
  partidas: [],
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

function renderPagina(): void {
  render(
    <MemoryRouter initialEntries={['/pedido/7/pago']}>
      <Routes>
        <Route path="/pedido/:id/pago" element={<PagoPage />} />
        <Route
          path="/pedido/:id/confirmacion"
          element={<div>pantalla-de-confirmacion</div>}
        />
        <Route path="/mis-pedidos" element={<div>pantalla-de-mis-pedidos</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PagoPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('muestra el folio, el total y el aviso de no capturar tarjeta', async () => {
    const fetchMock: FetchMock = vi.fn(async () => json(PEDIDO))
    vi.stubGlobal('fetch', fetchMock)
    renderPagina()

    expect(await screen.findByText('PED-261111-AABBCCDD')).toBeInTheDocument()
    expect(screen.getByText('$90.00')).toBeInTheDocument()
    expect(
      screen.getByText(/no captura datos de tarjeta/i),
    ).toBeInTheDocument()
  })

  it('al pagar con éxito navega a la confirmación', async () => {
    const fetchMock: FetchMock = vi.fn(async (_input, init) => {
      if ((init?.method ?? 'GET').toUpperCase() === 'POST') {
        return json({
          pedido: { ...PEDIDO, estado: 'Pagado' },
          pago: {
            metodo: 'online',
            monto: 90,
            referencia: 'REF-1A2B3C4D5E6F',
            estado: 'confirmado',
          },
        })
      }
      return json(PEDIDO)
    })
    vi.stubGlobal('fetch', fetchMock)
    renderPagina()

    await screen.findByText('PED-261111-AABBCCDD')
    await userEvent.click(screen.getByRole('button', { name: /pagar/i }))

    expect(await screen.findByText('pantalla-de-confirmacion')).toBeInTheDocument()
  })

  it('tras un rechazo ofrece reintentar o cancelar el pedido (US1.5)', async () => {
    const fetchMock: FetchMock = vi.fn(async (input, init) => {
      if ((init?.method ?? 'GET').toUpperCase() === 'POST') {
        return json(
          {
            error: {
              code: 'pago_rechazado',
              message:
                'El pago no pudo confirmarse. Tu pedido sigue pendiente: puedes reintentar.',
            },
          },
          402,
        )
      }
      return json(PEDIDO)
    })
    vi.stubGlobal('fetch', fetchMock)
    renderPagina()

    await screen.findByText('PED-261111-AABBCCDD')
    await userEvent.click(screen.getByRole('button', { name: 'Pagar ahora' }))

    expect(
      await screen.findByText(/no pudo confirmarse/i),
    ).toBeInTheDocument()
    // el rechazo reemplaza el CTA por el par reintentar/cancelar
    expect(
      screen.queryByRole('button', { name: 'Pagar ahora' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Reintentar pago' }),
    ).toBeEnabled()
    expect(
      screen.getByRole('button', { name: 'Cancelar pedido' }),
    ).toBeEnabled()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it('cancelar tras el rechazo navega a Mis pedidos (spec 007 US3.5)', async () => {
    const fetchMock: FetchMock = vi.fn(async (input, init) => {
      const method = (init?.method ?? 'GET').toUpperCase()
      if (method === 'POST' && String(input).endsWith('/pago')) {
        return json(
          {
            error: {
              code: 'pago_rechazado',
              message: 'El pago no pudo confirmarse. Tu pedido sigue pendiente.',
            },
          },
          402,
        )
      }
      if (method === 'POST' && String(input).endsWith('/cancelar')) {
        return json({ pedido: { ...PEDIDO, estado: 'Cancelado' } })
      }
      return json(PEDIDO)
    })
    vi.stubGlobal('fetch', fetchMock)
    renderPagina()

    await screen.findByText('PED-261111-AABBCCDD')
    await userEvent.click(screen.getByRole('button', { name: 'Pagar ahora' }))
    await screen.findByText(/no pudo confirmarse/i)

    await userEvent.click(
      screen.getByRole('button', { name: 'Cancelar pedido' }),
    )

    expect(
      await screen.findByText('pantalla-de-mis-pedidos'),
    ).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(([p]) => String(p).endsWith('/cancelar')),
    ).toBe(true)
  })
})
