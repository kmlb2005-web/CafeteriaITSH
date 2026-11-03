import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import CajaInicioPage from './CajaInicioPage'

type FetchMock = ReturnType<typeof vi.fn>

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

function instalarFetch(): FetchMock {
  const fetchMock: FetchMock = vi.fn(async () => json({ pedidos: [] }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderPagina(): void {
  render(
    <MemoryRouter>
      <CajaInicioPage />
    </MemoryRouter>,
  )
}

describe('CajaInicioPage (cajero)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('muestra encabezado, acciones rápidas y bienvenida (design §4.2)', async () => {
    instalarFetch()
    renderPagina()

    expect(
      await screen.findByRole('heading', {
        name: 'Cafetería ITSH · Caja',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('¡Buen día! Tu café, en buenas manos'),
    ).toBeInTheDocument()

    const capturar = screen.getByRole('link', { name: /Capturar pedido/ })
    expect(capturar).toHaveAttribute('href', '/caja/nuevo')
    const entregas = screen.getByRole('link', { name: /Entregas/ })
    expect(entregas).toHaveAttribute('href', '/caja/entregas')
    // Contador de pedidos Listo en el módulo de Entregas
    expect(await screen.findByText('0')).toBeInTheDocument()
  })

  it('ante un error del contador ofrece Reintentar (SC-006)', async () => {
    let intento = 0
    const fetchMock: FetchMock = vi.fn(async () =>
      intento++ === 0
        ? json(
            { error: { code: 'interno', message: 'No se pudo leer la lista.' } },
            500,
          )
        : json({ pedidos: [{ id: 1 }, { id: 2 }] }),
    )
    vi.stubGlobal('fetch', fetchMock)
    renderPagina()

    expect(
      await screen.findByText('No se pudo leer la lista.'),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('2')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Entregas/ }),
    ).toBeInTheDocument()
  })
})
