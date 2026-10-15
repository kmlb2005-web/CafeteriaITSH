import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { BottomBar, type ItemBottomBar } from './BottomBar'

const ITEMS: ItemBottomBar[] = [
  { to: '/caja', etiqueta: 'Caja', icono: 'icon-caja' },
  { to: '/caja/entregas', etiqueta: 'Entregas', icono: 'icon-entregas' },
]

function renderBar(contador?: Record<string, number>): void {
  render(
    <MemoryRouter initialEntries={['/caja']}>
      <Routes>
        <Route path="/caja" element={<div>Caja</div>} />
        <Route path="/caja/entregas" element={<div>Entregas</div>} />
      </Routes>
      <BottomBar items={ITEMS} contador={contador} />
    </MemoryRouter>,
  )
}

describe('BottomBar', () => {
  it('muestra las dos pestañas del rol (B1)', () => {
    renderBar()

    expect(screen.getByRole('link', { name: 'Caja' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Entregas' }),
    ).toBeInTheDocument()
  })

  it('resalta la ruta activa (B2)', () => {
    renderBar()

    const caja = screen.getByRole('link', { name: 'Caja' })
    expect(caja).toHaveAttribute('aria-current', 'page')
    expect(caja.className).toContain('text-primary')
    expect(
      screen.getByRole('link', { name: 'Entregas' }).className,
    ).not.toContain('text-primary')
  })

  it('muestra el badge pill cuando hay contador (B3)', () => {
    renderBar({ '/caja/entregas': 2 })

    expect(
      screen.getByRole('link', { name: /Entregas/ }),
    ).toHaveTextContent('2')
  })

  it('sin contador no muestra badge (B3)', () => {
    renderBar()

    expect(
      screen.getByRole('link', { name: 'Entregas' }),
    ).not.toHaveTextContent('0')
  })

  it('la barra está oculta en escritorio (lg:hidden) y fija al fondo (B1)', () => {
    renderBar()

    const barra = screen.getByRole('navigation', { name: 'Secciones' })
    expect(barra.className).toContain('fixed')
    expect(barra.className).toContain('bottom-0')
    expect(barra.className).toContain('lg:hidden')
  })
})
