---

description: "Task list template for feature implementation"
---

# Tasks: Gestión de Menú y Consulta de Menú (Sprint 2)

**Input**: Design documents from `/specs/003-menu-management/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: Incluidas: el criterio de aceptación exige `npm test` en verde
(SC-S2-05) y `docs/reglas.md` §20 requiere pruebas de autorización.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/` (según plan.md)
- **Sin migraciones nuevas**: esquema baseline (research.md R1)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared pieces needed by both stories

- [x] T001 [P] Activar feature: `.specify/feature.json` → `specs/003-menu-management` + documentar en `migrations/README.md` que el Sprint 2 no requiere migración (R1)
- [x] T002 [P] Extender `backend/src/db/seed.ts` con "menú de hoy" idempotente (`INSERT IGNORE` de los 8 platillos con precios para `CURDATE()`, R6) — verificado: creación y "ya existía"

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types that MUST exist before ANY user story can be implemented

- [x] T003 [P] Tipos de dominio en `backend/src/types/domain.ts`: `Platillo`, `ItemMenu`, `ItemMenuAdmin` (proyecciones de data-model.md) + `decimalNumbers: true` en el pool para precios numéricos

---

## Phase 3: User Story 1 - El administrador publica el menú del día (Priority: P1)

**Goal**: El admin gestiona catálogo y menú del día (precio, disponibilidad, especial) desde `/admin`.

**Independent Test**: Publicar dos platillos con precio y verificar que aparecen en la consulta del cliente; cambiar precio y marcar no disponible → efectos inmediatos en `/menu`; otro rol recibe 403.

### Tests for User Story 1

- [x] T004 [P] [US1] Integration tests `backend/tests/integration/menu-admin.test.ts` (platillos: 201/400/409/200/404; menú: PUT upsert 200, DELETE 204, precio inválido 400, platillo inexistente 404, rol cajero → 403) — 12/12 ✅
- [x] T005 [P] [US1] Component test `frontend/src/pages/admin/MenuDelDiaPage.test.tsx` (agregar con precio, validación de precio, mensaje de éxito/error) — 3/3 ✅

### Implementation for User Story 1

- [x] T006 [P] [US1] Create `backend/src/services/platillos.service.ts` (listar, crear, editar, activar/desactivar; 409 en nombre duplicado)
- [x] T007 [P] [US1] Create `backend/src/services/menu.service.ts` (listar admin por fecha, upsert `INSERT … ON DUPLICATE KEY UPDATE`, eliminar renglón, R3)
- [x] T008 [US1] Create `backend/src/controllers/admin-menu.controller.ts` + `backend/src/routes/admin-menu.routes.ts` (todo tras `requireRole('administrador')`, zod) and mount in `backend/src/app.ts`
- [x] T009 [P] [US1] Create `frontend/src/pages/admin/PlatillosPage.tsx` (lista, alta, edición, activar/desactivar con mensajes claros)
- [x] T010 [US1] Create `frontend/src/pages/admin/MenuDelDiaPage.tsx` (selector de fecha, agregar platillo con precio, editar precio/disponible/especial, quitar del menú)
- [x] T011 [US1] Update `frontend/src/layouts/AdminLayout.tsx` (nav: Usuarios, Platillos, Menú del día) + rutas anidadas en `frontend/src/App.tsx`

---

## Phase 4: User Story 2 - El alumno o docente consulta el menú (Priority: P2)

**Goal**: `/menu` muestra el menú real con precios, disponibilidad y especiales; vacío y errores con mensajes claros.

**Independent Test**: Consultar `/menu` con sesión de cliente: información completa, no disponibles identificados, aviso si no hay menú y reintento si falla la red.

### Tests for User Story 2

- [x] T012 [P] [US2] Integration tests `backend/tests/integration/menu-cliente.test.ts` (401 sin sesión; ítems completos; cambio de precio visible de inmediato SC-S2-01; `disponible:false` visible SC-S2-02; `platillo.activo=FALSE` excluido; fecha sin menú → `items: []`) — 6/6 ✅
- [x] T013 [P] [US2] Component test `frontend/src/pages/menu/MenuPage.test.tsx` (muestra platillos/precios/especial, no disponible identificado, aviso de menú vacío, error de red con Reintentar) — 4/4 ✅

### Implementation for User Story 2

- [x] T014 [US2] Create `backend/src/controllers/menu.controller.ts` + `backend/src/routes/menu.routes.ts` (`GET /api/menu` con `requireAuth`, fecha opcional) and mount in `backend/src/app.ts`
- [x] T015 [US2] Replace placeholder `frontend/src/pages/menu/MenuPage.tsx` (consulta real: cargando, lista responsiva con badges de especial/no disponible, vacío → "Menú no disponible hoy", error → mensaje + Reintentar)

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T016 [P] Documentation: update `backend/README.md` (endpoints de menú) and `frontend/README.md` (rutas /admin/platillos, /admin/menu)
- [x] T017 Validate `quickstart.md` end-to-end (seed → dev → flujo admin→cliente → gates) — seed creación/idempotencia ✓, E2E por proxy: PUT admin → GET cliente ve precio nuevo ✓, UI `/menu` 200 ✓
- [x] T018 Run full gates: `npm test` + `npm run typecheck` + lint en `backend/` y `frontend/` (+ build) — backend 37/37, frontend 16/16, lint+typecheck verdes
- [ ] T019 After demo approval: marcar Sprint 2 completado en `docs/sprints.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (T001-T002) blocks Foundational (T003)
- Foundational (T003) blocks all user stories
- US1 and US2 are independent of each other (backend compartido: T007 servicios se
  usa en ambos; respetar orden T006-T008 antes de T014)

### User Story Dependencies

- US1 (P1): no depende de otras historias
- US2 (P2): usa el servicio de menú de T007 para la consulta

## Parallel Execution Examples

```
# Fase inicial:
T001 + T002 en paralelo

# US1 tests + servicios:
T004 + T005 en paralelo → T006 + T007 en paralelo → T008 → T009 + T010 → T011

# US2:
T012 + T013 en paralelo → T014 → T015
```
