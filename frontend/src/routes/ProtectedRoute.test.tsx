import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AuthProvider } from '../lib/auth'
import { ProtectedRoute } from './ProtectedRoute'

type FetchMock = ReturnType<typeof vi.fn>

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

function mockSesion(handler: () => Response): void {
  const fetchMock: FetchMock = vi.fn(async () => handler())
  vi.stubGlobal('fetch', fetchMock)
}

function renderRuta(entrada: '/admin' | '/caja'): void {
  render(
    <MemoryRouter initialEntries={[entrada]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Formulario de login</div>} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['administrador']}>
                <div>Módulo administrador</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/caja"
            element={
              <ProtectedRoute roles={['cajero']}>
                <div>Módulo de caja</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('redirige al login cuando no hay sesión (US1.3)', async () => {
    mockSesion(() => json({}, 401))
    renderRuta('/admin')

    expect(await screen.findByText('Formulario de login')).toBeInTheDocument()
    expect(screen.queryByText('Módulo administrador')).not.toBeInTheDocument()
  })

  it('muestra acceso denegado cuando el rol no corresponde (US1.4)', async () => {
    mockSesion(() =>
      json({
        id: 9,
        nombre: 'Cajero',
        correo: 'cajero@itsh.mx',
        rol: 'cajero',
      }),
    )
    renderRuta('/admin')

    expect(await screen.findByText('Acceso denegado')).toBeInTheDocument()
    expect(screen.queryByText('Módulo administrador')).not.toBeInTheDocument()
  })

  it('permite el paso con el rol correcto', async () => {
    mockSesion(() =>
      json({
        id: 1,
        nombre: 'Admin',
        correo: 'admin@itsh.mx',
        rol: 'administrador',
      }),
    )
    renderRuta('/admin')

    expect(
      await screen.findByText('Módulo administrador'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Acceso denegado')).not.toBeInTheDocument()
  })
})
