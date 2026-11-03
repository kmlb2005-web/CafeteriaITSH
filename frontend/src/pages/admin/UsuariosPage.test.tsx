import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import UsuariosPage from './UsuariosPage'

type FetchMock = ReturnType<typeof vi.fn>

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const USUARIOS = [
  {
    id: 1,
    nombre: 'Ana López',
    correo: 'ana@itsh.mx',
    rol: 'cajero',
    activo: true,
  },
  {
    id: 2,
    nombre: 'Luis Ruiz',
    correo: 'luis@itsh.mx',
    rol: 'cocinero',
    activo: false,
  },
]

function mockUsuarios(lista: unknown[] = USUARIOS): FetchMock {
  const fetchMock: FetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('/api/usuarios')) return json(lista)
    return json({ error: { code: 'not_found' } }, 404)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderPagina(): void {
  render(
    <MemoryRouter>
      <UsuariosPage />
    </MemoryRouter>,
  )
}

describe('UsuariosPage (admin)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('lista filas con nombre/correo, badge de rol y estado (FR-017)', async () => {
    mockUsuarios()
    renderPagina()

    expect(await screen.findByText('Ana López')).toBeInTheDocument()
    expect(screen.getByText('ana@itsh.mx')).toBeInTheDocument()
    // badge de rol en la fila (la opción homónima del select también existe)
    expect(screen.getAllByText('Cajero').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Inhabilitado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nuevo usuario' })).toBeInTheDocument()
  })

  it('el buscador filtra por nombre o correo', async () => {
    mockUsuarios()
    renderPagina()

    await screen.findByText('Ana López')
    await userEvent.type(
      screen.getByPlaceholderText('Buscar usuario...'),
      'luis',
    )
    expect(screen.getByText('Luis Ruiz')).toBeInTheDocument()
    expect(screen.queryByText('Ana López')).not.toBeInTheDocument()

    await userEvent.clear(screen.getByPlaceholderText('Buscar usuario...'))
    expect(screen.getByText('Ana López')).toBeInTheDocument()
  })

  it('dar de baja pide confirmación antes del PATCH (FR-017)', async () => {
    const fetchMock = mockUsuarios()
    renderPagina()

    await screen.findByText('Ana López')
    await userEvent.click(
      screen.getByRole('button', { name: 'Dar de baja a Ana López' }),
    )

    // confirmación en línea: aún no hay llamada de estado
    expect(screen.getByRole('alert')).toHaveTextContent(/dar de baja a/i)
    expect(
      fetchMock.mock.calls.some(([p, i]) =>
        String(p).includes('/estado') && (i?.method ?? '').toUpperCase() === 'PATCH',
      ),
    ).toBe(false)

    await userEvent.click(screen.getByRole('button', { name: 'Sí, dar de baja' }))

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([p, i]) =>
          String(p).includes('/estado') &&
          (i?.method ?? '').toUpperCase() === 'PATCH',
        ),
      ).toBe(true)
    })
  })

  it('valida el formulario y crea un usuario (CRUD)', async () => {
    const fetchMock = mockUsuarios()
    renderPagina()

    await screen.findByText('Ana López')
    await userEvent.click(screen.getByRole('button', { name: 'Crear usuario' }))
    expect(await screen.findByText(/al menos 2 letras/i)).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Nombre'), 'Rosa Díaz')
    await userEvent.type(screen.getByLabelText('Correo'), 'rosa@itsh.mx')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Secreta123')
    await userEvent.click(screen.getByRole('button', { name: 'Crear usuario' }))

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([p, i]) =>
            String(p) === '/api/usuarios' &&
            (i?.method ?? '').toUpperCase() === 'POST',
        ),
      ).toBe(true)
    })
    expect(
      await screen.findByText('Usuario creado correctamente.'),
    ).toBeInTheDocument()
  })

  it('estado vacío con CTA y estado de error con Reintentar (SC-006)', async () => {
    // primer intento: fallo de red; después: lista vacía
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
      await screen.findByText('Aún no hay usuarios operativos. Crea el primero.'),
    ).toBeInTheDocument()
    // CTA fijo + CTA del vacío
    expect(
      screen.getAllByRole('button', { name: 'Nuevo usuario' }).length,
    ).toBeGreaterThanOrEqual(2)
  })
})
