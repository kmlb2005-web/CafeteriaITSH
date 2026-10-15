import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import PlatillosPage from './PlatillosPage'

type FetchMock = ReturnType<typeof vi.fn>

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const PLATILLOS = [
  {
    id: 1,
    nombre: 'Gordita de chicharrón',
    categoria: 'Comida',
    descripcion: 'Con chicharrón',
    activo: true,
  },
  {
    id: 2,
    nombre: 'Café de olla',
    categoria: 'Bebidas',
    descripcion: null,
    activo: false,
  },
]

function mockPlatillos(lista: unknown[] = PLATILLOS): FetchMock {
  const fetchMock: FetchMock = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).includes('/api/admin/platillos')) return json(lista)
    return json({ error: { code: 'not_found' } }, 404)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderPagina(): void {
  render(
    <MemoryRouter>
      <PlatillosPage />
    </MemoryRouter>,
  )
}

describe('PlatillosPage (admin)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('lista el catálogo con badges de categoría y estado (FR-017)', async () => {
    mockPlatillos()
    renderPagina()

    expect(await screen.findByText('Gordita de chicharrón')).toBeInTheDocument()
    // badge de categoría en la fila (el chip homónimo también existe)
    expect(screen.getAllByText('Comida').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nuevo platillo' })).toBeInTheDocument()
  })

  it('buscador y chips de categoría filtran el catálogo', async () => {
    mockPlatillos()
    renderPagina()

    await screen.findByText('Gordita de chicharrón')
    await userEvent.type(
      screen.getByPlaceholderText('Buscar platillo...'),
      'café',
    )
    expect(screen.getByText('Café de olla')).toBeInTheDocument()
    expect(screen.queryByText('Gordita de chicharrón')).not.toBeInTheDocument()

    await userEvent.clear(screen.getByPlaceholderText('Buscar platillo...'))
    await userEvent.click(screen.getByRole('button', { name: 'Comida' }))
    expect(screen.getByText('Gordita de chicharrón')).toBeInTheDocument()
    expect(screen.queryByText('Café de olla')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Comida' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('valida y crea un platillo (CRUD)', async () => {
    const fetchMock = mockPlatillos()
    renderPagina()

    await screen.findByText('Gordita de chicharrón')
    await userEvent.click(screen.getByRole('button', { name: 'Crear platillo' }))
    expect(await screen.findByText(/al menos 2 letras/i)).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Nombre'), 'Quesadilla')
    await userEvent.click(screen.getByRole('button', { name: 'Crear platillo' }))

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([p, i]) =>
            String(p) === '/api/admin/platillos' &&
            (i?.method ?? '').toUpperCase() === 'POST',
        ),
      ).toBe(true)
    })
    expect(
      await screen.findByText('Platillo creado correctamente.'),
    ).toBeInTheDocument()
  })

  it('vacío con CTA y error de carga con Reintentar (SC-006)', async () => {
    let intentos = 0
    const fetchMock: FetchMock = vi.fn(async () => {
      intentos += 1
      if (intentos === 1) throw new TypeError('Failed to fetch')
      return json([])
    })
    vi.stubGlobal('fetch', fetchMock)
    renderPagina()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(
      await screen.findByText('Aún no hay platillos. Crea el primero.'),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Nuevo platillo' }).length,
    ).toBeGreaterThanOrEqual(2)
  })
})
