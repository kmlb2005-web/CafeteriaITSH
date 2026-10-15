# Data Model: Rediseño de Interfaz por Rol (UI/UX)

**Feature**: 007-ui-redesign | **Date**: 2026-10-14
**Input**: `spec.md` (Key Entities) · Fase 1 de `/speckit.plan`

## Entidades de datos nuevas

**Ninguna.** La feature es de solo interfaz: opera sobre las entidades
existentes (usuarios, platillos, menú del día, pedidos, partidas, pagos)
a través de la API actual, sin migraciones ni cambios de esquema.

## Estado de UI que sí se gestiona (no persiste en servidor)

| Estado | Alcance | Persistencia | Derivado de |
|---|---|---|---|
| Drawer abierto/cerrado | Por layout de rol | En memoria (`useState` del layout) | Interacción del usuario |
| Carrito (cantidades + total) | Cliente y caja | `localStorage` (`lib/carrito.ts`, ya existente) | Selección del usuario |
| Contadores de bottom bar | Caja (Entregas), Cliente (Mis pedidos) | En memoria, derivados | `GET /api/caja/pedidos/listos` · `GET /api/pedidos` |
| Última actualización del KDS | Cocina | En memoria (`ultimaActualizacion`) | Éxito del sondeo cada 4 s |
| Tiempo transcurrido / retrasado | Cocina | Cálculo en cliente | `creado_en`, `fecha_recoleccion` |
| Filtro de catálogo (texto/categoría) | Caja y cliente | En memoria | Input del usuario |

## Estados de pedido (sin cambios — contexto de UI)

Se conservan los valores mínimos de la constitución §V; los badges usan
los colores `status-*` de `docs/DESIGN.md`:

```text
Pendiente ──cobro OK──► Pagado ──► En preparación ──► Listo ──► Entregado
    │                                        │           │
    └──► Cancelado ◄─────────────────────────┴───────────┘ (caja/admin)
```

- **Caja** transiciona: cobrar (Pendiente → Pagado), entregar
  (Listo → Entregado), cancelar (→ Cancelado).
- **Cocina** transiciona: Pagado → En preparación → Listo.
- **Cliente** solo observa; aviso destacado cuando estado = `Listo`.

## Transiciones de navegación (nuevo modelo de UI)

```text
Role por rol:
  /admin  : Inicio ─► Usuarios | Platillos | Menú del día      (drawer)
  /caja   : Inicio ─► Capturar pedido ─► Resumen de cobro      (drawer + bottom bar: Caja | Entregas)
  /cocina : Tablero (única sección del drawer)
  /menu   : Menú del día ─► Confirmar ─► Pago ─► Confirmación  (drawer + bottom bar: Menú | Mis pedidos)
            └─► Mis pedidos (con aviso "Listo")
```

Rutas y protecciones por rol (`ProtectedRoute`, `RUTA_POR_ROL`) sin
cambios.

## Reglas de validación que la UI refuerza (sin cambiar)

- Cantidades de stepper: entero 0–99 (límite actual de `CajaPage`).
- Anticipación ≥ 10 minutos: validada en cliente (mensaje con hora
  mínima) **y** en servidor (autoridad).
- Cobro en un paso: crear pedido + cobrar en un solo CTA (SC-S4-01);
  fallo → `Pendiente` con reintento/cancelación (ya implementado).
- No disponible: no seleccionable en caja ni en cliente.
