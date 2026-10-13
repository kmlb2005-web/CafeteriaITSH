# Implementation Plan: Gestión de Menú y Consulta de Menú (Sprint 2)

**Branch**: `003-menu-management` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-menu-management/spec.md`

## Summary

El administrador publica el menú del día desde `/admin` (catálogo de
platillos + alta/edición de platillos en el menú con precio, disponibilidad y
especial del día) y los alumnos/docentes lo consultan en `/menu` con cambios
visibles de inmediato. Backend Express + TypeScript con SQL directo sobre las
tablas **ya existentes** `platillo` y `menu_dia` (sin migración nueva: el
esquema está en `docs/001_crear_esquema.sql` y registrado como baseline por el
runner del Sprint 1). Frontend React + TypeScript con las mismas bases del
Sprint 1 (fetch tipado, componentes shadcn/ui, Tailwind con tokens de
`docs/DESIGN.md`, Vitest + Testing Library).

## Technical Context

**Language/Version**: TypeScript estricto en backend y frontend (6.0.3
alineado en ambos paquetes); Node.js LTS.

**Primary Dependencies**: ninguna dependencia nueva — express, zod, mysql2
(backend); react, react-router, tailwindcss (frontend). Dev: vitest,
supertest, Testing Library.

**Storage**: MySQL 8 sin ORM; tablas existentes `platillo` (catálogo) y
`menu_dia` (asociación fecha↔platillo con precio, disponible, especial;
única por `(fecha, platillo_id)`).

**Testing**: Vitest — integración de API con supertest (admin y cliente) y
componentes con Testing Library; `tsc --noEmit` + lint como gates.

**Performance Goals**: consulta del menú < 2 s en móvil durante el receso
(SC-S2-03) — índice `idx_menu_dia_fecha` + respuesta sin caché intermedia
(SC-S2-01: cambio visible de inmediato).

**Constraints**: sin secretos en repo; validación zod en cliente y servidor;
endpoints de admin tras `requireRole('administrador')`; mensajes de error
claros sin información interna (reglas §15).

**Scale/Scope**: 8 platillos de ejemplo, ~1 menú por día; 2 páginas de admin
(platillos, menú del día) + 1 pantalla de cliente; alcance de 1 sprint.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principio (constitución v1.0.0) | Verificación | Estado |
|---|---|---|---|
| I | Alcance del MVP primero (NON-NEGOTIABLE) | Solo FR-006…FR-009 + responsividad/rapidez de la consulta; pedidos, pagos, cocina y notificaciones fuera (Out of Scope del spec) | ✅ PASS |
| II | Seguridad de la Información (NON-NEGOTIABLE) | Admin tras `requireRole`, validación zod en todo input, precios con CHECK `>= 0`, mensajes sin filtrar internals, sin secretos | ✅ PASS |
| III | Aplicación Única con Acceso por Rol (NON-NEGOTIABLE) | Gestión dentro de `/admin` (nav por rol ya existente); consulta en `/menu` protegida por sesión; sin rutas nuevas fuera del rol | ✅ PASS |
| IV | Simplicidad y Mantenibilidad | Cero dependencias nuevas; SQL directo sobre tablas existentes; servicios/controllers en la estructura ya establecida | ✅ PASS |
| V | Fiabilidad y Rendimiento en Receso | Consulta ligera con índice de fecha, sin caché que sirva datos obsoletos, UI responsiva y mensajes de reintento claros | ✅ PASS |

**Gate result**: PASS — sin violaciones. Re-check tras Phase 1: data-model
limitado a `platillo`/`menu_dia`; contratos limitados a 7 endpoints.

## Project Structure

### Documentation (this feature)

```text
specs/003-menu-management/
├── plan.md              # Este archivo
├── research.md          # Phase 0 output (R1…R6)
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── menu-api.md      # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── app.ts                     # + montado de rutas de menú
│   ├── db/seed.ts                 # + seed idempotente del menú de hoy (R6)
│   ├── routes/menu.routes.ts      # GET /api/menu (cliente)
│   ├── routes/admin-menu.routes.ts# CRUD platillos + menú (admin)
│   ├── controllers/menu.controller.ts
│   ├── controllers/admin-menu.controller.ts
│   ├── services/platillos.service.ts
│   ├── services/menu.service.ts
│   └── types/domain.ts            # + tipos Platillo/MenuDia
└── tests/integration/
    ├── menu-admin.test.ts         # US1
    └── menu-cliente.test.ts       # US2

frontend/
├── src/
│   ├── pages/admin/
│   │   ├── PlatillosPage.tsx      # catálogo CRUD (nuevo)
│   │   └── MenuDelDiaPage.tsx     # publicar menú (nuevo)
│   ├── pages/menu/MenuPage.tsx    # consulta real (reemplaza placeholder)
│   ├── layouts/AdminLayout.tsx    # + nav: Platillos, Menú del día
│   └── App.tsx                    # + rutas anidadas /admin/*
└── src/pages/menu/MenuPage.test.tsx
    src/pages/admin/MenuDelDiaPage.test.tsx

migrations/
└── (sin migraciones nuevas — esquema baseline, ver migrations/README.md)
```

**Structure Decision**: misma estructura por funcionalidad ya establecida en
el Sprint 1 (services → controllers → routes; pages por módulo en frontend).
Desviación documentada: **no hay migración nueva** porque `platillo` y
`menu_dia` ya existen en el esquema baseline (reglas §4 se cumple con SQL
directo sobre esquema versionado en `docs/001_crear_esquema.sql`).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones de la constitución; tabla vacía.
