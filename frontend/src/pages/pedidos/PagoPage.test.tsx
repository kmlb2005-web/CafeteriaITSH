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
      </Routes>
    </MemoryRouter>,
  )
}

describe('PagoPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('muestra el folio y el total del pedido', async () => {
    const fetchMock: FetchMock = vi.fn(async () => json(PEDIDO))
    vi.stubGlobal('fetch', fetchMock)
    renderPagina()

    expect(await screen.findByText('PED-261111-AABBCCDD')).toBeInTheDocument()
    expect(screen.getByText('$90.00')).toBeInTheDocument()
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

  it('muestra el mensaje claro del rechazo y permite reintentar (US1.5)', async () => {
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
    await userEvent.click(screen.getByRole('button', { name: /pagar/i }))

    expect(
      await screen.findByText(/no pudo confirmarse/i),
    ).toBeInTheDocument()
    // permanece en la página con el botón habilitado para reintentar
    expect(screen.getByRole('button', { name: /pagar/i })).toBeEnabled()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })
})
