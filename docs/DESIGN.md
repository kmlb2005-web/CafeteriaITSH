---
name: Cafetería ITSH
colors:
  surface: '#F6F1E9'
  surface-dim: '#E4DDD2'
  surface-bright: '#FBF8F3'
  surface-container-lowest: '#FFFFFF'
  surface-container-low: '#FBF8F3'
  surface-container: '#F1ECE3'
  surface-container-high: '#EAE4DA'
  surface-container-highest: '#E4DDD2'
  on-surface: '#1C1917'
  on-surface-variant: '#44403C'
  outline: '#78716C'
  outline-variant: '#D6D0C5'
  primary: '#1E7A46'
  on-primary: '#FFFFFF'
  primary-container: '#CCEBD9'
  on-primary-container: '#0B3D22'
  secondary: '#8A6A4F'
  on-secondary: '#FFFFFF'
  secondary-container: '#F3E7DA'
  on-secondary-container: '#3D2A17'
  tertiary: '#6B3F23'
  on-tertiary: '#FFFFFF'
  tertiary-container: '#F2E1D0'
  on-tertiary-container: '#2C1608'
  error: '#B91C1C'
  on-error: '#FFFFFF'
  error-container: '#FEE2E2'
  on-error-container: '#7F1D1D'
  background: '#F6F1E9'
  on-background: '#1C1917'
  status-pending: '#9A3412'
  status-paid: '#1E7A46'
  status-preparing: '#B45309'
  status-ready: '#0369A1'
  status-delivered: '#166534'
  status-cancelled: '#B91C1C'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: 0
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: 0
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0
  body-bold:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  stat-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
rounded:
  sm: 4px
  DEFAULT: 8px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

Diseño cálido, limpio e institucional para el Sistema de Pedidos Anticipados de
la Cafetería del Instituto Tecnológico Superior de Huauchinango. La prioridad es
la **legibilidad y rapidez**: el personal y los usuarios operan en horarios de
receso con pocos segundos por interacción y, con frecuencia, desde un teléfono.

La atmósfera combina el carácter acogedor de una cafetería (tonos crema y
espresso) con la seriedad de un sistema institucional (verde institucional para
toda acción principal). Superficies planas, sombras muy sutiles y jerarquía por
tamaño tipográfico más que por decoración.

## Colors

- **Institutional Green** (#1E7A46): color primario. Botones principales,
  enlaces, estados activos y el badge "Pagado". Nunca se usa como fondo grande.
- **Espresso** (#6B3F23): acento cálido. Especiales del día, iconos de
  cafetería, énfasis secundario en tarjetas de platillo.
- **Warm Cream** (#F6F1E9): fondo de la aplicación. Las tarjetas son blancas
  (#FFFFFF) para máximo contraste.
- **Charcoal** (#1C1917): texto principal; **Stone** (#44403C): texto secundario.
- Colores de estado de pedido (badges con texto blanco):
  Pendiente #9A3412, Pagado #1E7A46, En preparación #B45309, Listo #0369A1,
  Entregado #166534, Cancelado #B91C1C.

## Typography

**Plus Jakarta Sans** (700/800) para títulos, cifras y totales; **Inter**
(400/500/600) para cuerpo, tablas y etiquetas. Los pesos son firmes y los
tamaños generosos: en cocina y caja los números (cantidades, totales, folios)
usan 20px o más con peso 700/800 para leerse de un vistazo.

## Layout & Spacing

Ritmo de 8px. Móvil-first con navegación inferior o barra superior según el
rol; escritorio con disposición de tarjetas en grid y paneles laterales para caja y
cocina. Área táctil mínima de 44px. Las pantallas de caja y cocina priorizan
densidad controlada: filas altas (56px+), contraste alto y CTA fijos.

## Shapes

Esquinas sutilmente redondeadas (8px por defecto, 12-16px en tarjetas y
modales). Los badges de estado y los chips de cantidad usan formas pill.
Botones con altura de 44-48px y esquinas de 8px.

## Components

- **Buttons**: primario en verde sólido con texto blanco; secundario con borde
  de 1px en verde y fondo transparente; deshabilitado en gris con contraste
  reducido pero legible.
- **Cards**: fondo blanco, borde 1px outline-variant, sombra muy sutil. Platillo
  = nombre + descripción corta + precio en peso 700 + control de cantidad.
- **Status badges**: pill con fondo del color de estado y texto blanco.
- **Inputs**: fondo blanco, borde 1px, foco en verde de 2px, etiqueta siempre
  visible arriba, mensaje de error en línea debajo en color error.
- **Tables**: encabezado en surface-container, filas alternas sutiles, números
  alineados a la derecha en peso 700.
- **Kitchen/Cashier panels**: tarjetas de pedido de alto contraste con folio
  grande, tiempo transcurrido y CTA de acción claro ("Iniciar preparación",
  "Marcar listo").
