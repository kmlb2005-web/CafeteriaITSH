# Diseño UI/UX — Cafetería ITSH (índice)

> **Este documento fue dividido en tres.** El boceto original de 6 pantallas
> se redistribuyó por rol y se actualizó para usar el sistema de diseño
> canónico (`docs/DESIGN.md`).

| Documento | Rol / rutas | Contenido |
|---|---|---|
| [`diseño-operativo.md`](diseño-operativo.md) | Admin (`/admin`) y Caja (`/caja`) | Rediseño de las pantallas del personal operativo: inicio con acciones rápidas, CRUD de usuarios/platillos/menú, captura de pedido con catálogo + stepper + barra flotante, resumen de cobro y entregas. Drawer + bottom bar. |
| [`diseño-cocina.md`](diseño-cocina.md) | Cocina (`/cocina`) | Tablero KDS: una sola pantalla, tarjetas con folio grande, tiempo transcurrido, CTA de un toque, sondeo con feedback y estados vacío/error/conflicto. |
| [`diseño-cliente.md`](diseño-cliente.md) | Cliente (`/menu`, `/pedido/*`, `/mis-pedidos`) | App del cliente: menú con filtros y stepper, barra flotante, confirmación con regla de 10 min, pago simulado, confirmación y mis pedidos con aviso "Listo para recoger". |

## Decisiones tomadas al dividir

- **Paleta:** manda `docs/DESIGN.md` (`#1E7A46`, fondo `#F6F1E9`); la paleta
  del boceto original (`#1E4632`, `#DCECE1`, `#F7F9F7`) quedó descartada.
- **Navegación:** los tres documentos proponen **drawer lateral** (y bottom
  bar en caja y cliente) en lugar de los tabs horizontales actuales.
- **Fuera de alcance MVP** (marcado en los documentos, requiere aprobación
  §27): métodos de pago con tarjeta/transferencia, descuentos, historial de
  ventas, configuración, imágenes de platillo, notificaciones push y
  métricas de negocio para admin (no hay endpoints de estadísticas).
- **Implementación:** los documentos son propuesta de diseño; implementarlos
  requiere una spec nueva (p. ej. `specs/007-ui-redesign`) siguiendo el
  flujo speckit.

## Flujo original del boceto (referencia histórica)

```
       [Menú Lateral]
             │
      ┌──────┴──────┐
      ▼             ▼
[ 1. Inicio ] ──► [ 2. Nuevo Pedido ] ──► [ 3. Cobro Rápid. ]
      │
      ├───────────► [ 4. Pedidos Listos ]
      │
      └───────────► [ 5. Cobrar Pedido (Detalle) ]
```

Las pantallas 1, 2, 4 y 6 (inicio, nuevo pedido, pedidos listos y menú
lateral) se conservaron —adaptadas— en `diseño-operativo.md` para caja; la
pantalla 5 (detalle de cobro con métodos de pago) y el "cobro rápido" como
pantalla separada se descartaron por alcance: la caja cobra en efectivo y en
un solo paso.
