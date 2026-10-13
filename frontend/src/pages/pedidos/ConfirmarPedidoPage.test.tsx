import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import ConfirmarPedidoPage from './ConfirmarPedidoPage'
import { guardarCarrito, leerCarrito } from '../../lib/carrito'

const CARRITO_EJEMPLO = [
  { menu_dia_id: 1, nombre: 'Gordita de chicharrón', precio: 35, cantidad: 2 },
  { menu_dia_id: 2, nombre: 'Café de olla', precio: 20, cantidad: 1 },
]

const pad = (n: number): string => String(n).padStart(2, '0')
const formatear = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`

type FetchMock = ReturnType<typeof vi.fn>

function renderPagina(): void {
  render(
    <MemoryRouter initialEntries={['/pedido/confirmar']}>
      <Routes>
        <Route path="/pedido/confirmar" element={<ConfirmarPedidoPage />} />
        <Route path="/pedido/:id/pago" element={<div>pantalla-de-pago</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ConfirmarPedidoPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('muestra partidas y total antes de confirmar (FR-010)', async () => {
    guardarCarrito(CARRITO_EJEMPLO)
    renderPagina()

    expect(await screen.findByText('Gordita de chicharrón')).toBeInTheDocument()
    expect(screen.getByText('Café de olla')).toBeInTheDocument()
    // 35×2 + 20×1
    expect(screen.getByText('$90.00')).toBeInTheDocument()
  })

  it('rechaza localmente una hora a menos de 10 minutos, sin llamar al servidor (FR-011)', async () => {
    guardarCarrito(CARRITO_EJEMPLO)
    const fetchMock: FetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderPagina()

    await screen.findByText('Gordita de chicharrón')
    const hora = screen.getByLabelText(/hora de recolección/i)
    fireEvent.change(hora, {
      target: { value: formatear(new Date(Date.now() + 5 * 60 * 1000)) },
    })
    await userEvent.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    expect(
      await screen.findByText(/al menos 10 minutos/i),
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('crea el pedido, vacía el carrito y navega al pago', async () => {
    guardarCarrito(CARRITO_EJEMPLO)
    const fetchMock: FetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          id: 7,
          numero: 'PED-261111-AABBCCDD',
          tipo: 'anticipado',
          estado: 'Pendiente',
          total: 90,
          fecha_recoleccion: '2026-11-11T12:40',
          creado_en: '2026-11-11T12:00:00.000Z',
          partidas: [],
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    renderPagina()

    await screen.findByText('Gordita de chicharrón')
    await userEvent.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    expect(await screen.findByText('pantalla-de-pago')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(leerCarrito()).toEqual([])
  })
})
