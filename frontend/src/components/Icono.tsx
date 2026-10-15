import { cn } from '../lib/utils'

/** Ids de symbol disponibles en /icons.svg (spec 007). */
export type IconoId =
  | 'icon-inicio'
  | 'icon-caja'
  | 'icon-entregas'
  | 'icon-menu'
  | 'icon-pedidos'
  | 'icon-usuarios'
  | 'icon-platillos'
  | 'icon-bebidas'
  | 'icon-comida'
  | 'icon-snacks'
  | 'icon-postres'
  | 'icon-buscar'
  | 'icon-check'
  | 'icon-reloj'
  | 'icon-alerta'
  | 'icon-info'

export interface IconoProps {
  id: IconoId
  /** Clases extra (tamaño/color heredan de `currentColor`) */
  className?: string
}

/**
 * Ícono decorativo (spec 007): carga un `symbol` de /icons.svg. Siempre
 * `aria-hidden`: la información la aporta el texto cercano, nunca el ícono.
 */
export function Icono({ id, className }: IconoProps) {
  return (
    <svg
      className={cn('h-5 w-5 shrink-0', className)}
      aria-hidden="true"
      focusable="false"
    >
      <use href={`/icons.svg#${id}`} />
    </svg>
  )
}

export interface IconoChipProps extends IconoProps {
  /** Tono del chip; default verde suave de la paleta */
  tono?: 'verde' | 'cafe' | 'solido'
}

/**
 * Chip con fondo suave que resalta un ícono en tarjetas y encabezados;
 * decorativo (aria-hidden) como el `Icono` que envuelve.
 */
export function IconoChip({ id, className, tono = 'verde' }: IconoChipProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
        tono === 'verde' && 'bg-primary/10 text-primary',
        tono === 'cafe' && 'bg-secondary/15 text-secondary',
        tono === 'solido' &&
          'bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm shadow-primary/40',
        className,
      )}
    >
      <Icono id={id} />
    </span>
  )
}
