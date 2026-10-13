import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AuthProvider } from '../../lib/auth'
import RegistroPage from './RegistroPage'

type FetchMock = ReturnType<typeof vi.fn>

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

function mockFetch(handlers: Record<string, () => Response>): void {
  const fetchMock: FetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    for (const [clave, handler] of Object.entries(handlers)) {
      if (url.includes(clave)) return handler()
    }
    return json({ error: { code: 'not_found' } }, 404)
  })
  vi.stubGlobal('fetch', fetchMock)
}

function renderRegistro(): void {
  render(
    <MemoryRouter initialEntries={['/registro']}>
      <AuthProvider>
        <Routes>
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="/menu" element={<div>Menú del día listo</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

const USUARIO = {
  id: 77,
  nombre: 'Alumno Nuevo',
  correo: 'alumno@example.com',
  rol: 'usuario',
  activo: true,
}

describe('RegistroPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('muestra validación cuando el formulario está vacío (FR-021)', async () => {
    mockFetch({ me: () => json({}, 401) })
    renderRegistro()

    await userEvent.click(screen.getByRole('button', { name: /registrarme/i }))

    expect(
      await screen.findByText('Ingresa tu nombre (mínimo 2 letras).'),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
  })

  it('avisa si las contraseñas no coinciden', async () => {
    mockFetch({ me: () => json({}, 401) })
    renderRegistro()

    await userEvent.type(screen.getByLabelText(/nombre/i), 'Alumno Nuevo')
    await userEvent.type(screen.getByLabelText(/correo/i), 'alumno@example.com')
    await userEvent.type(screen.getByLabelText(/^contraseña/i), 'Secreta123')
    await userEvent.type(
      screen.getByLabelText(/repite la contraseña/i),
      'Distinta123',
    )
    await userEvent.click(screen.getByRole('button', { name: /registrarme/i }))

    expect(
      await screen.findByText(/las contraseñas no coinciden/i),
    ).toBeInTheDocument()
  })

  it('registra al alumno y lo deja en su sesión (US1.5)', async () => {
    mockFetch({
      me: () => json({}, 401),
      register: () => json(USUARIO, 201),
      login: () => json(USUARIO),
    })
    renderRegistro()

    await userEvent.type(screen.getByLabelText(/nombre/i), 'Alumno Nuevo')
    await userEvent.type(screen.getByLabelText(/correo/i), 'alumno@example.com')
    await userEvent.type(screen.getByLabelText(/^contraseña/i), 'Secreta123')
    await userEvent.type(
      screen.getByLabelText(/repite la contraseña/i),
      'Secreta123',
    )
    await userEvent.click(screen.getByRole('button', { name: /registrarme/i }))

    await waitFor(() => {
      expect(screen.getByText('Menú del día listo')).toBeInTheDocument()
    })
  })
})
