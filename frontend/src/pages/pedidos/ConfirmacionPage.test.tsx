import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import ConfirmacionPage from './ConfirmacionPage'

type FetchMock = ReturnType<typeof vi.fn>

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const PAGADO = {
  id: 7,
  numero: 'PED-261111-AABBCCDD',
  tipo: 'anticipado',
  estado: 'Pagado',
  total: 90,
  fecha_recoleccion: '2026-11-11T12:40',
  creado_en: '2026-11-11T12:00:00.000Z',
  partidas: [
    {
      id: 1,
      menu_dia_id: 1,
      nombre: 'Gordita de chicharrón',
      cantidad: 2,
      precio_unitario: 35,
      subtotal: 70,
    },
    {
      id: 2,
      menu_dia_id: 2,
      nombre: 'Café de olla',
      cantidad: 1,
      precio_unitario: 20,
      subtotal: 20,
    },
  ],
}

function renderPagina(): void {
  render(
    <MemoryRouter initialEntries={['/pedido/7/confirmacion']}>
      <Routes>
        <Route path="/pedido/:id/confirmacion" element={<ConfirmacionPage />} />
        <Route path="/pedido/:id/pago" element={<div>pantalla-de-pago</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ConfirmacionPage (US2)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('muestra folio, estado Pagado, partidas y total (US2.1)', async () => {
    const fetchMock: FetchMock = vi.fn(async () => json(PAGADO))
    vi.stubGlobal('fetch', fetchMock)
    renderPagina()

    expect(await screen.findByText('PED-261111-AABBCCDD')).toBeInTheDocument()
    expect(screen.getByText('Pagado')).toBeInTheDocument()
    expect(screen.getByText('Gordita de chicharrón')).toBeInTheDocument()
    expect(screen.getByText('Café de olla')).toBeInTheDocument()
    expect(screen.getByText('$90.00')).toBeInTheDocument()
  })

  it('un pedido Pendiente permite ir a pagar (US2.3)', async () => {
    const fetchMock: FetchMock = vi.fn(async () =>
      json({ ...PAGADO, estado: 'Pendiente' }),
    )
    vi.stubGlobal('fetch', fetchMock)
    renderPagina()

    expect(await screen.findByText('Pendiente')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /pagar ahora/i }),
    ).toHaveAttribute('href', '/pedido/7/pago')
  })

  it('ante un fallo de red muestra mensaje claro y permite reintentar', async () => {
    let llamadas = 0
    const fetchMock: FetchMock = vi.fn(async () => {
      llamadas += 1
      if (llamadas === 1) throw new TypeError('Failed to fetch')
      return json(PAGADO)
    })
    vi.stubGlobal('fetch', fetchMock)
    renderPagina()

    expect(
      await screen.findByText(/no se pudo conectar/i),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /reintentar/i }))

    await waitFor(() => {
      expect(screen.getByText('PED-261111-AABBCCDD')).toBeInTheDocument()
    })
  })
})
