import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import InicioAdminPage from './InicioAdminPage'

type FetchMock = ReturnType<typeof vi.fn>

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const USUARIOS = [
  { id: 1, nombre: 'Ana López', activo: true },
  { id: 2, nombre: 'Luis Ruiz', activo: false },
]

const PLATILLOS = [
  { id: 1, nombre: 'Gordita de chicharrón', categoria: 'Comida', activo: true },
  { id: 2, nombre: 'Café de olla', categoria: 'Bebidas', activo: true },
]

const MENU = {
  fecha: '2026-10-27',
  items: [
    {
      id: 10,
      nombre: 'Gordita de chicharrón',
      precio: 35,
      disponible: true,
      especial: true,
    },
    {
      id: 11,
      nombre: 'Café de olla',
      precio: 20,
      disponible: false,
      especial: false,
    },
  ],
}

/** Mock de las 3 consultas paralelas del resumen. */
function mockResumen(menu = MENU): FetchMock {
  const fetchMock: FetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('/api/usuarios')) return json(USUARIOS)
    if (url.includes('/api/admin/platillos')) return json(PLATILLOS)
    if (url.includes('/api/menu')) return json(menu)
    return json({ error: { code: 'not_found' } }, 404)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderPagina(): void {
  render(
    <MemoryRouter>
      <InicioAdminPage />
    </MemoryRouter>,
  )
}

describe('InicioAdminPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('muestra los conteos de las tres tarjetas de acción (FR-016)', async () => {
    mockResumen()
    renderPagina()

    expect(await screen.findByText('1 activo')).toBeInTheDocument()
    expect(screen.getByText('2 en catálogo')).toBeInTheDocument()
    expect(screen.getByText('2 publicados hoy')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /usuarios/i }),
    ).toHaveAttribute('href', '/admin/usuarios')
    expect(
      screen.getByRole('link', { name: /platillos/i }),
    ).toHaveAttribute('href', '/admin/platillos')
    expect(
      screen.getByRole('link', { name: /menú del día/i }),
    ).toHaveAttribute('href', '/admin/menu')
  })

  it('resume el menú de hoy con badge Especial y no disponibles', async () => {
    mockResumen()
    renderPagina()

    await screen.findByText('Resumen del menú de hoy')
    expect(screen.getByText('Especial')).toBeInTheDocument()
    expect(screen.getByText('No disponible')).toBeInTheDocument()
    expect(screen.getAllByText('Gordita de chicharrón').length).toBeGreaterThan(0)
  })

  it('sin menú publicado ofrece el enlace a publicarlo (vacío)', async () => {
    mockResumen({ fecha: '2026-10-27', items: [] })
    renderPagina()

    expect(
      await screen.findByText('No hay platillos publicados hoy.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Publica el menú' })).toBeInTheDocument()
    // sin filas del resumen
    expect(screen.queryByText('Especial')).not.toBeInTheDocument()
  })

  it('ante un fallo ofrece Reintentar y recupera el resumen', async () => {
    let llamadas = 0
    const fetchMock: FetchMock = vi.fn(async (input: RequestInfo | URL) => {
      llamadas += 1
      if (llamadas === 1) throw new TypeError('Failed to fetch')
      const url = String(input)
      if (url.includes('/api/usuarios')) return json(USUARIOS)
      if (url.includes('/api/admin/platillos')) return json(PLATILLOS)
      return json(MENU)
    })
    vi.stubGlobal('fetch', fetchMock)
    renderPagina()

    expect(
      await screen.findByText(/no se pudo conectar con el servidor/i),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    await waitFor(() => {
      expect(screen.getByText('2 publicados hoy')).toBeInTheDocument()
    })
  })
})
