import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import MenuDelDiaPage from './MenuDelDiaPage'

type FetchMock = ReturnType<typeof vi.fn>

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const CATALOGO = [
  { id: 1, nombre: 'Gordita de chicharrón', categoria: 'Comida', descripcion: null, activo: true },
  { id: 2, nombre: 'Café de olla', categoria: 'Bebida', descripcion: null, activo: true },
]

function mockApi(putStatus = 200): void {
  const fetchMock: FetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const metodo = (init?.method ?? 'GET').toUpperCase()
      if (url.includes('admin/menu') && metodo === 'GET') {
        return json({ fecha: '2026-10-27', items: [] })
      }
      if (url.includes('admin/menu') && metodo === 'PUT') {
        return json({ ok: true }, putStatus)
      }
      if (url.includes('admin/platillos')) {
        return json(CATALOGO)
      }
      return json({ error: { code: 'not_found' } }, 404)
    },
  )
  vi.stubGlobal('fetch', fetchMock)
}

const ITEM_MENU = {
  id: 100,
  platillo_id: 1,
  nombre: 'Gordita de chicharrón',
  categoria: 'Comida',
  descripcion: null,
  precio: 35,
  disponible: true,
  especial: false,
  activo: true,
}

/** Como mockApi pero con un platillo ya publicado en el menú. */
function mockApiConItems(): FetchMock {
  const fetchMock: FetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const metodo = (init?.method ?? 'GET').toUpperCase()
      if (url.includes('admin/menu') && metodo === 'GET') {
        return json({ fecha: '2026-10-27', items: [ITEM_MENU] })
      }
      if (
        url.includes('admin/menu') &&
        (metodo === 'PUT' || metodo === 'DELETE')
      ) {
        return json({ ok: true })
      }
      if (url.includes('admin/platillos')) {
        return json(CATALOGO)
      }
      return json({ error: { code: 'not_found' } }, 404)
    },
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderPagina(): void {
  render(
    <MemoryRouter>
      <MenuDelDiaPage />
    </MemoryRouter>,
  )
}

describe('MenuDelDiaPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('lista el menú de la fecha y el catálogo disponible', async () => {
    mockApi()
    renderPagina()

    expect(await screen.findByText('Gordita de chicharrón')).toBeInTheDocument()
    expect(screen.getByText('Café de olla')).toBeInTheDocument()
  })

  it('valida el precio antes de agregar al menú (FR-021)', async () => {
    mockApi()
    renderPagina()

    await screen.findByText('Gordita de chicharrón')
    await userEvent.click(screen.getByRole('button', { name: /agregar al menú/i }))

    expect(
      await screen.findByText(/ingresa un precio/i),
    ).toBeInTheDocument()
  })

  it('agrega un platillo con precio y muestra éxito', async () => {
    mockApi()
    renderPagina()

    await screen.findByText('Gordita de chicharrón')
    await userEvent.selectOptions(
      screen.getByLabelText(/platillo/i),
      'Gordita de chicharrón',
    )
    await userEvent.type(screen.getByLabelText(/precio/i), '35')
    await userEvent.click(screen.getByRole('button', { name: /agregar al menú/i }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/agregado/i)
    })
  })

  it('el toggle Disponible guarda de inmediato (role=switch, ≥44 px)', async () => {
    const fetchMock = mockApiConItems()
    renderPagina()

    const toggle = await screen.findByRole('switch', {
      name: 'Disponible: Gordita de chicharrón',
    })
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    await userEvent.click(toggle)

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([p, i]) =>
            String(p).includes('admin/menu') &&
            (i?.method ?? '').toUpperCase() === 'PUT',
        ),
      ).toBe(true)
    })
  })

  it('el badge Especial es conmutable y persiste', async () => {
    const fetchMock = mockApiConItems()
    renderPagina()

    const badge = await screen.findByRole('button', {
      name: 'Especial: Gordita de chicharrón',
    })
    expect(badge).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(badge)

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([p, i]) =>
            String(p).includes('admin/menu') &&
            (i?.method ?? '').toUpperCase() === 'PUT',
        ),
      ).toBe(true)
    })
    expect(
      screen.getByRole('button', { name: 'Especial: Gordita de chicharrón' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('quitar pide confirmación antes del DELETE', async () => {
    const fetchMock = mockApiConItems()
    renderPagina()

    await screen.findByRole('switch', {
      name: 'Disponible: Gordita de chicharrón',
    })
    await userEvent.click(screen.getByRole('button', { name: 'Quitar' }))

    // sin confirmación no hay DELETE
    expect(screen.getByRole('alert')).toHaveTextContent(/quitar/i)
    expect(
      fetchMock.mock.calls.some(
        ([, i]) => (i?.method ?? '').toUpperCase() === 'DELETE',
      ),
    ).toBe(false)

    await userEvent.click(screen.getByRole('button', { name: 'Sí, quitar' }))

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([, i]) => (i?.method ?? '').toUpperCase() === 'DELETE',
        ),
      ).toBe(true)
    })
  })
})
