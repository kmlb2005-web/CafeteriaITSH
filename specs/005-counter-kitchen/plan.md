# Implementation Plan: Mostrador (Cajero) y Cocina (Sprint 4)

**Branch**: `005-counter-kitchen` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-counter-kitchen/spec.md`

## Summary

Operación interna: el cajero captura y cobra pedidos presenciales en un par de
pasos (FR-015) mientras los pedidos anticipados siguen operando (FR-016), y
el cocinero ve todos los pedidos entrantes en una sola pantalla ordenados por
llegada con avance de estados en un toque (FR-017, FR-018), respetando el
flujo completo `Pendiente → Pagado → En preparación → Listo → Entregado`
(+ `Cancelado` antes de `Entregado`) validado contra `transicion_estado`
(FR-013). Backend Express + TypeScript sobre las tablas baseline (`pedido`,
`pago`, `transicion_estado`, `pedido_estado_historial`) **sin migración
nueva** — estados y transiciones ya vienen sembrados. Frontend React:
`/caja` y `/cocina` con controles táctiles ≥44 px y alto contraste (FR-020);
la cocina se actualiza sola por sondeo cada 4 s (sin dependencias nuevas).

## Technical Context

**Language/Version**: TypeScript estricto (6.0.3) en ambos paquetes; Node.js LTS.

**Primary Dependencies**: ninguna nueva — express, zod, mysql2 (backend);
react, react-router, tailwindcss (frontend). Dev: vitest, supertest, Testing
Library.

**Storage**: MySQL 8 sin ORM; transacciones con `FOR UPDATE` para transiciones
y cobros concurrentes; bitácora en `pedido_estado_historial`.

**Testing**: Vitest — integración con supertest (captura, cobro, transiciones
válidas/inválidas, permisos por rol) y componentes con Testing Library.

**Performance Goals**: captura + cobro < 1 min (SC-S4-01); cocina actualizada
en < 5 s sin recarga manual (SC-S4-03).

**Constraints**: controles táctiles ≥44 px y alto contraste en caja/cocina
(FR-020, SC-S4-05); mensajes claros sin internals (FR-022); validación zod en
cliente y servidor (FR-021); sin dependencias nuevas (§16).

**Scale/Scope**: ~30 pedidos por receso; 2 pantallas operativas; alcance de 1
sprint (notificaciones y "mis pedidos" quedan para el Sprint 5).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principio (constitución v1.0.0) | Verificación | Estado |
|---|---|---|---|
| I | Alcance del MVP primero (NON-NEGOTIABLE) | Solo FR-015…FR-018, FR-013 (completo), FR-020/021/022; fuera: notificaciones (S5), "mis pedidos" (S5), inventario/puntos | ✅ PASS |
| II | Seguridad de la Información (NON-NEGOTIABLE) | `/api/caja` solo cajero y `/api/cocina` solo cocinero; cobro `efectivo` sin datos de tarjeta; validación zod; errores sin internals; transiciones contra tabla de datos | ✅ PASS |
| III | Aplicación Única con Acceso por Rol (NON-NEGOTIABLE) | Pantallas `/caja` y `/cocina` ya protegidas con `ProtectedRoute` por rol (Sprint 1); API con `requireRole`; sin áreas nuevas fuera del rol | ✅ PASS |
| IV | Simplicidad y Mantenibilidad | Cero dependencias nuevas; un servicio genérico de transición reutiliza `transicion_estado`; sondeo en lugar de WebSockets; sin migración | ✅ PASS |
| V | Fiabilidad y Rendimiento en Receso | `FOR UPDATE` en cobro y transición (sin dobles cobros ni estados inconsistentes), reintentos sin duplicar, sondeo ≤4 s con datos frescos, UI táctil rápida | ✅ PASS |

**Gate result**: PASS — sin violaciones. Re-check tras Phase 1: contratos
limitados a 6 endpoints; sin tablas nuevas.

## Project Structure

### Documentation (this feature)

```text
specs/005-counter-kitchen/
├── plan.md                  # Este archivo
├── research.md              # Phase 0 output (R1…R7)
├── data-model.md            # Phase 1 output
├── quickstart.md            # Phase 1 output
├── contracts/
│   └── caja-cocina-api.md    # Phase 1 output
└── tasks.md                 # Phase 2 output
```

### Source Code (repository root)

```text
migrations/
└── (sin migraciones nuevas — estados y transiciones ya sembrados, R1)

backend/
├── src/
│   ├── app.ts                        # + monta /api/caja y /api/cocina
│   ├── routes/caja.routes.ts         # captura, cobro, entrega/cancelación
│   ├── routes/cocina.routes.ts       # lista + avance de estados
│   ├── controllers/caja.controller.ts
│   ├── controllers/cocina.controller.ts
│   └── services/pedidos.service.ts   # + crearPedidoMostrador, cobrarEnMostrador,
│                                     #   transicionarEstado, listados
└── tests/integration/
    ├── caja.test.ts                  # US1
    └── cocina.test.ts                # US2

frontend/
├── src/
│   ├── pages/caja/CajaPage.tsx       # captura+cobro (reemplaza esqueleto)
│   ├── pages/caja/CajaPage.test.tsx
│   ├── pages/cocina/CocinaPage.tsx   # KDS con sondeo (reemplaza esqueleto)
│   ├── pages/cocina/CocinaPage.test.tsx
│   └── App.tsx                       # (rutas /caja y /cocina ya existen)
└── (layouts CajaLayout/CocinaLayout sin cambios)
```

**Structure Decision**: misma estructura por funcionalidad; el ciclo de vida
del pedido (creación, cobro, transición, listados) vive en un solo servicio
(`pedidos.service.ts`) para que caja, cocina y pagos compartan la misma
lógica. Desviación documentada: sprints.md menciona "migraciones de
estados/transiciones", pero **ya existen sembrados** en
`docs/002_seed_inicial.sql` (research R1) — sin `migrations/NN_*.sql`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones de la constitución; tabla vacía.
