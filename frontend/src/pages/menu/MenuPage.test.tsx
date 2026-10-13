import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import MenuPage from './MenuPage'

type FetchMock = ReturnType<typeof vi.fn>

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

function mockMenu(respuesta: () => Response | Promise<Response>): void {
  const fetchMock: FetchMock = vi.fn(async () => respuesta())
  vi.stubGlobal('fetch', fetchMock)
}

const ITEM_OK = {
  id: 1,
  platillo_id: 1,
  nombre: 'Gordita de chicharrón',
  categoria: 'Comida',
  descripcion: 'Gordita de maíz con chicharrón',
  precio: 35,
  disponible: true,
  especial: true,
}

const ITEM_NO_DISPONIBLE = {
  id: 2,
  platillo_id: 2,
  nombre: 'Torta de jamón',
  categoria: 'Comida',
  descripcion: null,
  precio: 45,
  disponible: false,
  especial: false,
}

function renderMenu(): void {
  render(
    <MemoryRouter>
      <MenuPage />
    </MemoryRouter>,
  )
}

describe('MenuPage (cliente)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('muestra platillos, precios y el especial del día (FR-009)', async () => {
    mockMenu(() => json({ fecha: '2026-10-27', items: [ITEM_OK, ITEM_NO_DISPONIBLE] }))
    renderMenu()

    expect(await screen.findByText('Gordita de chicharrón')).toBeInTheDocument()
    expect(screen.getByText('Especial del día')).toBeInTheDocument()
    expect(screen.getByText('$35.00')).toBeInTheDocument()
    expect(screen.getByText('Torta de jamón')).toBeInTheDocument()
  })

  it('identifica un platillo como no disponible (SC-S2-02)', async () => {
    mockMenu(() => json({ fecha: '2026-10-27', items: [ITEM_NO_DISPONIBLE] }))
    renderMenu()

    expect(await screen.findByText('Torta de jamón')).toBeInTheDocument()
    expect(screen.getByText('No disponible')).toBeInTheDocument()
  })

  it('muestra un aviso claro cuando no hay menú (caso borde)', async () => {
    mockMenu(() => json({ fecha: '2026-10-27', items: [] }))
    renderMenu()

    expect(
      await screen.findByText('Menú no disponible hoy'),
    ).toBeInTheDocument()
  })

  it('ante un fallo de red muestra mensaje claro y permite reintentar', async () => {
    let llamadas = 0
    const fetchMock: FetchMock = vi.fn(async () => {
      llamadas += 1
      if (llamadas === 1) throw new TypeError('Failed to fetch')
      return json({ fecha: '2026-10-27', items: [ITEM_OK] })
    })
    vi.stubGlobal('fetch', fetchMock)
    renderMenu()

    expect(
      await screen.findByText(/no se pudo conectar/i),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /reintentar/i }))

    await waitFor(() => {
      expect(screen.getByText('Gordita de chicharrón')).toBeInTheDocument()
    })
  })
})
