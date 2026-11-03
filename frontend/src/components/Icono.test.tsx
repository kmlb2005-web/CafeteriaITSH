import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Icono, IconoChip } from './Icono'

describe('Icono', () => {
  it('carga el symbol correspondiente de /icons.svg', () => {
    const { container } = render(<Icono id="icon-bebidas" />)

    expect(container.querySelector('use')).toHaveAttribute(
      'href',
      '/icons.svg#icon-bebidas',
    )
  })

  it('es decorativo: queda oculto para lectores de pantalla', () => {
    const { container } = render(<Icono id="icon-buscar" />)

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('permite tamaño y color extra por className', () => {
    const { container } = render(<Icono id="icon-check" className="h-4 w-4" />)

    expect(container.firstElementChild?.getAttribute('class')).toContain('h-4')
  })
})

describe('IconoChip', () => {
  it('envuelve el ícono en un chip con fondo suave de la paleta', () => {
    const { container } = render(<IconoChip id="icon-check" />)

    const chip = container.firstElementChild
    expect(chip).toHaveAttribute('aria-hidden', 'true')
    expect(chip?.className).toContain('bg-primary/10')
    expect(chip?.querySelector('use')).toHaveAttribute(
      'href',
      '/icons.svg#icon-check',
    )
  })

  it('soporta el tono café', () => {
    const { container } = render(<IconoChip id="icon-reloj" tono="cafe" />)

    expect(container.firstElementChild?.className).toContain(
      'bg-secondary/15',
    )
  })
})
