# Tasks: Seguimiento, Notificaciones y Pulido (Sprint 5)

**Protocols**: test-first for US1/US2 (red → green), small commits, gates
`lint && typecheck && test` por paquete antes de cerrar cada tarea.

**Legend**: [P] Pair-friendly · [US1] Mis pedidos · [US2] Aviso de listo ·
[US3] Pulido y cierre

## Phase 1: Setup

- [ ] T001 [P] Nota en `migrations/README.md`: `notificacion` ya existe en
  baseline; sin migración en Sprint 5 (R1).

## Phase 2: Foundational (blocking)

- [ ] T002 [P] Adaptador `backend/src/services/correo.ts` (análogo a
  `pasarela.ts`): `enviarCorreo` simulado en dev, flag `simular_fallo` solo
  demo/tests, reemplazable por proveedor real. Nueva variable
  `SIMULAR_FALLO_CORREO` en `src/config/env.ts` + `.env.example`.
- [ ] T003 [P] Módulo `backend/src/services/notificaciones.service.ts`:
  `asegurarNotificacionListo` (idempotente, append-only, ≤3 intentos,
  jamás propaga errores) + tipo `PedidoLista` en `types/domain.ts`.

## Phase 3: User Story 1 — Seguimiento de mis pedidos (US1) [P]

**Tests primero: T004 (INT) y T005 (CMP) en rojo.**

- [ ] T004 [P] [US1] [INT] `backend/tests/integration/mis-pedidos.test.ts`
  (describe US1): lista con estados reales; pedido recién pagado aparece
  `Pagado`; detalle coincide (partidas/total); pedidos de otro cliente no
  aparecen (SC-S5-03); 401 sin sesión.
- [ ] T005 [P] [US1] [CMP]
  `frontend/src/pages/pedidos/MisPedidosPage.test.tsx`: lista con estados,
  vacío y error con mensaje claro, detalle al abrir un pedido.
- [ ] T006 [P] [US1] `listarMisPedidos` en `pedidos.service.ts` (orden
  `creado_en DESC`, `aviso_listo`) + `GET /api/pedidos` en
  `pedidos.controller.ts`/`pedidos.routes.ts`.
- [ ] T007 [US1] [CMP] `frontend/src/pages/pedidos/MisPedidosPage.tsx`
  real (reemplaza placeholder): lista con badges de estado, destacado
  "Listo para recoger", detalle expandible (partidas y total), vacíos,
  error y carga.

## Phase 4: User Story 2 — Aviso de pedido listo (US2) [P]

**Tests primero: T008 (INT) en rojo (con `vi.mock` del adaptador).**

- [ ] T008 [P] [US2] [INT] describe US2 en `mis-pedidos.test.ts`:
  `Listo` genera notificación `enviada` (canal correo); `Pagado` no genera
  nada (US2.4); fallo simulado → notificación `fallida` + pedido `Listo`
  visible; siguiente consulta reintenta (≤3 intentos).
- [ ] T009 [US2] Integración en `cocina.controller.ts`: tras transición
  exitosa a `Listo`, llamar `asegurarNotificacionListo` (R3; errores
  tragados por el servicio).
- [ ] T010 [US2] Reintento pull-based en `GET /api/pedidos` (R4): asegurar
  notificación de los pedidos `Listo` propios de la lista.

## Phase 5: Polish & Security (US3)

- [ ] T011 [P] [US3] Pulido UI contra `docs/DESIGN.md`: estados
  vacíos/error consistentes en pantallas nuevas y revisión de
  responsividad (móvil y computadora, FR-020).
- [ ] T012 [P] [US3] Docs FR-026: sección de despliegue en
  `backend/README.md` y `frontend/README.md` (`.env.example`, `NODE_ENV`,
  hosting de bajo costo); README de la feature si existe.
- [ ] T013 [US3] Cadena e2e del flujo completo según
  `specs/006-order-tracking-notifications/quickstart.md` (incluye fallo y
  reintento de notificación, y aislamiento entre clientes).
- [ ] T014 [P] Gates completos en ambos paquetes: `npm run lint &&
  npm run typecheck && npm test` (+ `npm run build` en frontend).
- [ ] T015 Demo final aprobada por la patrocinadora → marcar Sprint 5
  completado en `docs/sprints.md` (cierre del MVP).
