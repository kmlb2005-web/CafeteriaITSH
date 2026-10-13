# Implementation Plan: Pedido Anticipado y Pago (Sprint 3)

**Branch**: `004-advance-orders-payment` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-advance-orders-payment/spec.md`

## Summary

El cliente arma su pedido desde el menú (cantidades + total visible antes de
confirmar), lo registra con al menos 10 minutos de anticipación y completa el
pago; su pedido nace en `Pendiente` y solo pasa a `Pagado` cuando el pago se
confirma, recibiendo confirmación con folio y detalle (US1 y US2). Backend
Express + TypeScript con SQL directo sobre las tablas baseline **ya existentes**
`pedido`, `pedido_detalle`, `pago`, `estado_pedido`, `transicion_estado` e
`historial`; única migración nueva: columna `pago.estado` (intención y
resultado, según la entidad Pago de la spec maestra). Pago vía adaptador
simulado sin datos de tarjeta (sin dependencias nuevas). Frontend React +
TypeScript: carrito persistente en localStorage, pantallas de confirmación,
pago y confirmación de pedido.

## Technical Context

**Language/Version**: TypeScript estricto en backend y frontend (6.0.3 en
ambos paquetes); Node.js LTS.

**Primary Dependencies**: ninguna nueva — express, zod, mysql2 (backend);
react, react-router, tailwindcss (frontend). Dev: vitest, supertest, Testing
Library. Pago: módulo nativo `node:crypto` (referencias/folios).

**Storage**: MySQL 8 sin ORM, con transacciones en la creación del pedido y en
el cobro. Migración: `migrations/001_pago_estado.sql` (runner propio ya
probado con baseline).

**Testing**: Vitest — integración con supertest (incluye rechazo de pago con
`vi.mock` de la pasarela) y componentes con Testing Library; `tsc --noEmit` +
lint como gates.

**Performance Goals**: flujo menú → selección → pedido → pago en < 3 minutos
(SC-S3-02); validación de anticipación en servidor en la misma petición de
creación (SC-S3-01).

**Constraints**: 0 datos sensibles de tarjeta (SC-S3-04); mensajes claros sin
internals (FR-022); validación zod en cliente y servidor (FR-021); solo rol
`usuario` puede crear/consultar sus pedidos.

**Scale/Scope**: cientos de pedidos/día; 3 pantallas nuevas de cliente; alcance
de 1 sprint (listado completo y cocina quedan fuera).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principio (constitución v1.0.0) | Verificación | Estado |
|---|---|---|---|
| I | Alcance del MVP primero (NON-NEGOTIABLE) | Solo FR-010…FR-014 (parcial), FR-021, FR-022; fuera: listado "mis pedidos" (S5), cocina/caja (S4), notificaciones (S5) | ✅ PASS |
| II | Seguridad de la Información (NON-NEGOTIABLE) | Sin datos de tarjeta (adaptador simulado solo devuelve referencia), montos calculados en servidor, pedidos ajenos → 404, rol `usuario` en API, zod en todo input, errores sin internals | ✅ PASS |
| III | Aplicación Única con Acceso por Rol (NON-NEGOTIABLE) | Nuevas rutas `/pedido/*` dentro del área de cliente ya protegida (`ProtectedRoute roles=['usuario']`); API tras `requireRole('usuario')`; sin áreas nuevas | ✅ PASS |
| IV | Simplicidad y Mantenibilidad | Cero dependencias nuevas; adaptador de pago propio reemplazable; reutiliza tablas baseline y patrones de servicios/controllers ya establecidos; una sola migración de 2 líneas | ✅ PASS |
| V | Fiabilidad y Rendimiento en Receso | Reintentos sin duplicar pedidos ni cobros (UNIQUE + transacción con `FOR UPDATE`), carrito persistido (no se pierde la selección), mensajes de error claros con reintento, totales calculados en servidor | ✅ PASS |

**Gate result**: PASS — sin violaciones. Re-check tras Phase 1: contratos
limitados a 3 endpoints; migración acotada a `pago.estado`.

## Project Structure

### Documentation (this feature)

```text
specs/004-advance-orders-payment/
├── plan.md                 # Este archivo
├── research.md             # Phase 0 output (R1…R7)
├── data-model.md           # Phase 1 output
├── quickstart.md           # Phase 1 output
├── contracts/
│   └── pedidos-api.md       # Phase 1 output
└── tasks.md                # Phase 2 output
```

### Source Code (repository root)

```text
migrations/
└── 001_pago_estado.sql      # pago.estado: pendiente|confirmado|rechazado

backend/
├── src/
│   ├── app.ts                        # + monta /api/pedidos
│   ├── routes/pedidos.routes.ts      # POST /, GET /:id, POST /:id/pago
│   ├── controllers/pedidos.controller.ts
│   ├── services/pedidos.service.ts   # crear, cobrar, consultar (transaccional)
│   ├── services/pasarela.ts          # adaptador de pago simulado (R2)
│   └── types/domain.ts               # + Pedido, PartidaPedido, Pago
└── tests/integration/
    └── pedidos.test.ts               # US1 + US2 (servidor)

frontend/
├── src/
│   ├── lib/carrito.ts                # carrito persistente en localStorage (R6)
│   ├── pages/menu/MenuPage.tsx       # + agregar al pedido (cantidad)
│   ├── pages/pedidos/
│   │   ├── ConfirmarPedidoPage.tsx   # revisión + hora de recolección
│   │   ├── PagoPage.tsx              # pago simulado (folio + total)
│   │   ├── ConfirmacionPage.tsx      # detalle/estado del pedido (US2)
│   │   └── *.test.tsx
│   └── App.tsx                       # + rutas /pedido/*
└── (MisPedidosPage sigue como placeholder — Sprint 5)
```

**Structure Decision**: misma estructura por funcionalidad (services →
controllers → routes; pages por módulo). Desviación documentada: sprints.md
menciona "migraciones: pedidos, detalle_pedidos, pagos", pero esas tablas
**ya existen** en el baseline (`docs/001_crear_esquema.sql`); la única
migración nueva es `001_pago_estado.sql` (research R1).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones de la constitución; tabla vacía.
