import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AuthProvider } from '../lib/auth'
import { AppDrawer, type ItemDrawer } from './AppDrawer'

type FetchMock = ReturnType<typeof vi.fn>

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

function mockSesion(): FetchMock {
  const fetchMock: FetchMock = vi.fn(async (url: string) => {
    if (url === '/api/auth/logout') return json({})
    return json({
      id: 1,
      nombre: 'Marta López',
      correo: 'caja@itsh.mx',
      rol: 'cajero',
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const ITEMS: ItemDrawer[] = [
  { to: '/caja', etiqueta: 'Inicio' },
  { to: '/caja/nuevo', etiqueta: 'Capturar pedido' },
  { to: '/caja/entregas', etiqueta: 'Pedidos listos' },
]

function renderDrawer(
  props: Partial<Omit<AppDrawerProps, 'items'>> & { items?: ItemDrawer[] } = {},
): { onCerrar: ReturnType<typeof vi.fn> } {
  const onCerrar = vi.fn()
  const { items = ITEMS, ...resto } = props
  render(
    <MemoryRouter initialEntries={['/caja']}>
      <AuthProvider>
        <Routes>
          <Route path="/caja" element={<div>Pantalla de caja</div>} />
          <Route path="/caja/nuevo" element={<div>Nuevo pedido</div>} />
        </Routes>
        <AppDrawer
          abierto
          onCerrar={onCerrar}
          titulo="Caja"
          items={items}
          {...resto}
        />
      </AuthProvider>
    </MemoryRouter>,
  )
  return { onCerrar }
}

type AppDrawerProps = Parameters<typeof AppDrawer>[0]

describe('AppDrawer', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('muestra perfil, secciones y cerrar sesión (D4, D6)', async () => {
    mockSesion()
    renderDrawer()

    expect(
      await screen.findByText('Marta López'),
    ).toBeInTheDocument()
    expect(screen.getByText('Cajero · Caja')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Inicio' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Capturar pedido' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Cerrar sesión' }),
    ).toBeInTheDocument()
  })

  it('marca la ruta activa con aria-current (D4)', async () => {
    mockSesion()
    renderDrawer()

    const inicio = await screen.findByRole('link', { name: 'Inicio' })
    expect(inicio).toHaveAttribute('aria-current', 'page')
    expect(
      screen.getByRole('link', { name: 'Capturar pedido' }),
    ).not.toHaveAttribute('aria-current')
  })

  it('muestra el badge del contador cuando es mayor a 0 (D5)', async () => {
    mockSesion()
    renderDrawer({ contador: { '/caja/entregas': 3 } })

    expect(await screen.findByText('Marta López')).toBeInTheDocument()
    const listos = screen.getByRole('link', { name: /Pedidos listos/ })
    expect(listos).toHaveTextContent('3')
  })

  it('no muestra badge cuando el contador es 0 (D5)', async () => {
    mockSesion()
    renderDrawer({ contador: { '/caja/entregas': 0 } })

    expect(await screen.findByText('Marta López')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Pedidos listos' }),
    ).not.toHaveTextContent('0')
  })

  it('cierra el drawer al navegar a una sección (D4)', async () => {
    mockSesion()
    const { onCerrar } = renderDrawer()

    await userEvent.click(
      await screen.findByRole('link', { name: 'Capturar pedido' }),
    )

    expect(onCerrar).toHaveBeenCalled()
    expect(await screen.findByText('Nuevo pedido')).toBeInTheDocument()
  })

  it('cierra el drawer con Escape (D2)', async () => {
    mockSesion()
    const { onCerrar } = renderDrawer()

    await screen.findByText('Marta López')
    await userEvent.keyboard('{Escape}')

    expect(onCerrar).toHaveBeenCalled()
  })

  it('no cierra al navegar cuando el item marca fin=false', async () => {
    mockSesion()
    const { onCerrar } = renderDrawer({
      items: [{ to: '/caja/nuevo', etiqueta: 'Capturar pedido', fin: false }],
    })

    await userEvent.click(
      await screen.findByRole('link', { name: 'Capturar pedido' }),
    )

    expect(onCerrar).not.toHaveBeenCalled()
  })
})
