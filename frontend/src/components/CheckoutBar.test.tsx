import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CheckoutBar } from './CheckoutBar'

describe('CheckoutBar', () => {
  it('no se muestra con carrito vacío (C1)', () => {
    const { container } = render(
      <CheckoutBar
        cantidad={0}
        total={0}
        etiquetaCTA="Ver cobro"
        onCTA={() => {}}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('muestra conteo, total y CTA con productos (C4)', () => {
    render(
      <CheckoutBar
        cantidad={2}
        total={55}
        etiquetaCTA="Ver cobro"
        onCTA={() => {}}
      />,
    )

    expect(screen.getByText('2 platillos')).toBeInTheDocument()
    expect(screen.getByText('$55.00')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Ver cobro' }),
    ).toBeInTheDocument()
  })

  it('usa singular cuando hay un producto', () => {
    render(
      <CheckoutBar
        cantidad={1}
        total={27.5}
        etiquetaCTA="Ver pedido"
        onCTA={() => {}}
      />,
    )

    expect(screen.getByText('1 platillo')).toBeInTheDocument()
    expect(screen.getByText('$27.50')).toBeInTheDocument()
  })

  it('invoca onCTA al tocar el botón (C4)', async () => {
    const onCTA = vi.fn()
    render(
      <CheckoutBar
        cantidad={3}
        total={81}
        etiquetaCTA="Ver cobro"
        onCTA={onCTA}
      />,
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'Ver cobro' }),
    )

    expect(onCTA).toHaveBeenCalledTimes(1)
  })

  it('la barra flotante va encima de la bottom bar en móvil (C2)', () => {
    render(
      <CheckoutBar
        cantidad={2}
        total={55}
        etiquetaCTA="Ver cobro"
        onCTA={() => {}}
      />,
    )

    // bottom-14 = 56 px = altura de la BottomBar; CTA con min 48 px
    expect(screen.getByText('$55.00').parentElement?.parentElement)
      .toHaveClass('bottom-14')
    expect(
      screen.getByRole('button', { name: 'Ver cobro' }).className,
    ).toContain('min-h-12')
  })
})
