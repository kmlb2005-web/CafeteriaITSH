---

description: "Task list template for feature implementation"
---

# Tasks: Pedido Anticipado y Pago (Sprint 3)

**Input**: Design documents from `/specs/004-advance-orders-payment/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: Incluidas: SC-S3-06 exige `npm test` en verde y `docs/reglas.md`
§20 requiere pruebas de autorización y validación de negocio.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`, `migrations/` (según plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared pieces needed by both stories

- [x] T001 [P] Create `migrations/001_pago_estado.sql` (columna `estado` en `pago`, R1) + aplicar con `cd backend && npm run migrate` + nota en `migrations/README.md`
- [x] T002 [P] Create `backend/src/services/pasarela.ts` — adaptador de pago simulado `cobrar()` sin datos de tarjeta, con `simular_rechazo` (R2)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types and shared client utilities that MUST exist before ANY user story can be implemented

- [x] T003 [P] Tipos de dominio en `backend/src/types/domain.ts`: `Pedido`, `PartidaPedido`, `Pago` (proyecciones de data-model.md)
- [x] T004 [P] Create `frontend/src/lib/carrito.ts` — carrito persistente en `localStorage` (leer/agregar/actualizar/quitar/vaciar/total, R6)

---

## Phase 3: User Story 1 - Pedido anticipado con pago (Priority: P1)

**Goal**: menú → selección con total → pedido ≥10 min → pago confirmado → `Pagado` con folio.

**Independent Test**: Con menú publicado y cliente registrado, crear un pedido con ≥10 minutos, confirmar el pago y verificar estado `Pagado` + folio; intentos <10 min y pagos rechazados no pasan a `Pagado`.

### Tests for User Story 1

- [x] T005 [P] [US1] Integration tests `backend/tests/integration/pedidos.test.ts`: creación 201 (folio, `Pendiente`, total=partidas); <10 min → 400 `anticipacion_insuficiente`; recogida otro día → 400; item no disponible/inactivo → 409; items vacíos → 400; pago OK → 200 `Pagado` + `pago.monto = total` sin campos de tarjeta; rechazo (mock de `pasarela`) → 402 y sigue `Pendiente`; reintento → `Pagado` con **1 solo** `pago`; segundo pago → 409; rol cajero → 403; sin sesión → 401
- [x] T006 [P] [US1] Component test `frontend/src/pages/pedidos/ConfirmarPedidoPage.test.tsx` (partidas y total desde el carrito; hora <10 min → error local sin fetch; éxito → navega a la pantalla de pago)
- [x] T007 [P] [US1] Component test `frontend/src/pages/pedidos/PagoPage.test.tsx` (muestra folio y total; pagar → éxito navega a confirmación; rechazo → mensaje claro y permanece en la página)

### Implementation for User Story 1

- [x] T008 [P] [US1] Create `backend/src/services/pedidos.service.ts` (`crearPedidoAnticipado` transaccional con validaciones de menú/10-min/fecha, folio con reintento; `registrarPago` con `FOR UPDATE` + transición `Pendiente → Pagado` vía `transicion_estado` + historial, R3–R5, R7)
- [x] T009 [US1] Create `backend/src/controllers/pedidos.controller.ts` + `backend/src/routes/pedidos.routes.ts` (`POST /api/pedidos`, `POST /api/pedidos/:id/pago` tras `requireRole('usuario')`, zod) and mount in `backend/src/app.ts`
- [x] T010 [P] [US1] Update `frontend/src/pages/menu/MenuPage.tsx` (cantidad + "Agregar al pedido", badge con total, botón "No disponible" ausente) + test adicional en `MenuPage.test.tsx` (no seleccionable + agregar al carrito)
- [x] T011 [US1] Create `frontend/src/pages/pedidos/ConfirmarPedidoPage.tsx` (partidas editables, total antes de confirmar, hora de recolección con validación local ≥10 min, confirmar → POST y limpiar carrito)
- [x] T012 [US1] Create `frontend/src/pages/pedidos/PagoPage.tsx` (folio + total, pagar con adaptador simulado, "simular rechazo (demo)", reintento sin duplicar)
- [x] T013 [US1] Update `frontend/src/App.tsx`: rutas `/pedido/confirmar`, `/pedido/:id/pago`, `/pedido/:id/confirmacion` dentro del bloque de cliente

---

## Phase 4: User Story 2 - Consulta del recién creado (Priority: P2)

**Goal**: tras pagar, ver detalle (partidas, total) y estado real; pedidos ajenos denegados.

**Independent Test**: Abrir la confirmación del pedido pagado y verificar folio, partidas, total y estado; con otro cliente o estado `Pendiente`, comprobar denegación y `Pendiente` respectivamente.

### Tests for User Story 2

- [x] T014 [P] [US2] Component test `frontend/src/pages/pedidos/ConfirmacionPage.test.tsx` (folio/estado/partidas/total; `Pendiente` muestra botón "Pagar ahora"; error de red → mensaje + Reintentar)

### Implementation for User Story 2

- [x] T015 [US2] `obtenerPedido(id, usuario_id)` en `backend/src/services/pedidos.service.ts` + `GET /api/pedidos/:id` en controller/ruta (404 para pedidos ajenos; estado resuelto como nombre)
- [x] T016 [US2] Create `frontend/src/pages/pedidos/ConfirmacionPage.tsx` (detalle real al montar, badge de estado, pagar si `Pendiente`, folio visible)

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T017 [P] Documentation: update `backend/README.md` (endpoints de pedidos) and `frontend/README.md` (rutas /pedido/*)
- [x] T018 Validate `quickstart.md` end-to-end (migración → flujo <3 min → rechazo → reintento → gates)
- [x] T019 Run full gates: lint + typecheck + test en `backend/` y `frontend/` (+ build)
- [ ] T020 After demo approval: marcar Sprint 3 completado en `docs/sprints.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (T001-T002) and Foundational (T003-T004) bloquean ambas historias
- US1 implementación (T008-T013) antes que T015 (misma capa de servicios)
- US2 depende de la creación de pedidos de US1 para tener datos

### User Story Dependencies

- US1 (P1): no depende de otras historias
- US2 (P2): consulta pedidos creados por US1 (mismo backend)

## Parallel Execution Examples

```
# Fase inicial:
T001 + T002 + T003 + T004 en paralelo

# US1:
T005 + T006 + T007 en paralelo → T008 → T009 → T010 + T011 → T012 → T013

# US2:
T014 (paralelo con US1) → T015 → T016
```
