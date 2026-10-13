# Implementation Plan: Seguimiento, Notificaciones y Pulido (Sprint 5)

**Branch**: `006-order-tracking-notifications` | **Date**: 2026-10-13 |
**Spec**: [spec.md](./spec.md)

**Input**: Feature specification from
`/specs/006-order-tracking-notifications/spec.md`

## Summary

Cierre del MVP: el cliente consulta "mis pedidos" con el estado actual y el
detalle de cada uno (FR-014 completo, aislamiento por cuenta), recibe el aviso
de pedido listo (FR-019) mediante un módulo de notificaciones separado de la
lógica de pedidos — generado al pasar a `Listo`, con adaptador de correo
simulado reemplazable y reintento si el envío falla (el estado `Listo`
siempre queda visible) — más el pulido de UI, las pruebas críticas y la
documentación de despliegue (FR-020/FR-026) para la demo final. Backend
Express + TypeScript existente; frontend React con `/mis-pedidos`. **Sin
migraciones**: la tabla `notificacion` (con índice de pendientes) ya viene en
el baseline.

## Technical Context

**Language/Version**: TypeScript estricto (6.0.3) en ambos paquetes; Node.js LTS.

**Primary Dependencies**: ninguna nueva — express, zod, mysql2 (backend);
react, react-router, tailwindcss (frontend). Dev: vitest, supertest, Testing
Library.

**Storage**: MySQL 8 sin ORM; tabla `notificacion` baseline (audit append-only:
cada intento es una fila); consulta de lista con reintento en el mismo request
(sin jobs de fondo).

**Testing**: Vitest — integración con supertest (lista propia, aislamiento,
detalle, generación de notificación al `Listo`, fallo y reintento con
`vi.mock` del adaptador) y componentes con Testing Library.

**Performance Goals**: aviso de listo en < 1 min (SC-S5-01); lista de
pedidos liviana y usable en receso.

**Constraints**: notificación separada de la lógica de pedidos (FR-019);
canal por defecto = estado visible + correo registrado (suposición de la
spec); sin dependencias nuevas (§16); sin funcionalidades fuera del MVP
(§27).

**Scale/Scope**: decenas de pedidos por día de un plantel; alcance de 1
sprint de cierre.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principio (constitución v1.0.0) | Verificación | Estado |
|---|---|---|---|
| I | Alcance del MVP primero (NON-NEGOTIABLE) | Solo FR-014 (completo), FR-019, FR-020/FR-026 de cierre; fuera: SMS/push, reseñas, lealtad, inventario, app nativa | ✅ PASS |
| II | Seguridad de la Información (NON-NEGOTIABLE) | Lista y detalle solo del propio usuario (`usuario_id`); correo desde BD, nunca datos sensibles en la notificación; validación zod; errores sin internals | ✅ PASS |
| III | Aplicación Única con Acceso por Rol (NON-NEGOTIABLE) | `/mis-pedidos` es una ruta más de la SPA existente tras `ProtectedRoute`; API tras `requireRole('usuario')`; sin áreas nuevas | ✅ PASS |
| IV | Simplicidad y Mantenibilidad | Cero dependencias; módulo de notificaciones aislado con adaptador (análogo a `pasarela.ts`); reintento pull-based sin colas ni cron; sin migración | ✅ PASS |
| V | Fiabilidad y Rendimiento en Receso | La notificación jamás bloquea ni revierte el estado `Listo`; audit append-only; reintento acotado (3 intentos); lista liviana | ✅ PASS |

**Gate result**: PASS — sin violaciones. Re-check tras Phase 1: sin endpoints
nuevos salvo `GET /api/pedidos`; sin tablas nuevas.

## Project Structure

### Documentation (this feature)

```text
specs/006-order-tracking-notifications/
├── plan.md                  # Este archivo
├── research.md              # Phase 0 output (R1…R6)
├── data-model.md            # Phase 1 output
├── quickstart.md            # Phase 1 output
├── contracts/
│   └── mis-pedidos-api.md    # Phase 1 output
└── tasks.md                 # Phase 2 output
```

### Source Code (repository root)

```text
migrations/
└── (sin migraciones nuevas — `notificacion` ya existe en baseline, R1)

backend/
├── src/
│   ├── app.ts                        # (sin cambios: /api/pedidos ya montada)
│   ├── routes/pedidos.routes.ts       # + GET / (lista propia)
│   ├── controllers/pedidos.controller.ts  # + listar
│   ├── services/pedidos.service.ts    # + listarMisPedidos
│   ├── services/notificaciones.service.ts  # módulo separado (FR-019)
│   └── services/correo.ts             # adaptador de envío simulado
└── tests/integration/
    └── mis-pedidos.test.ts            # US1 + US2

frontend/
├── src/
│   ├── pages/pedidos/MisPedidosPage.tsx     # reemplaza el placeholder
│   ├── pages/pedidos/MisPedidosPage.test.tsx
│   └── App.tsx                       # (/mis-pedidos ya existe)
└── (README: sección de despliegue FR-026)
```

**Structure Decision**: misma estructura por funcionalidad. Desviación
documentada: sprints.md menciona "notificación en-app como mínimo"; la spec
006 (supuestos) define el canal por defecto como **estado visible en "mis
pedidos" + correo**, por lo que no hay canales nuevos ni cola de mensajes: el
aviso in-app es el estado `Listo` destacado en la propia lista.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones de la constitución; tabla vacía.
