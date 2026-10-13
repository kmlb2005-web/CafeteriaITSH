# Tasks: Mostrador (Cajero) y Cocina (Sprint 4)

**Protocols**: test-first for US1/US2 (red → green), small commits, gates
`lint && typecheck && test` por paquete antes de cerrar cada tarea.

**Legend**: [P] Pair-friendly · [US1] Captura y cobro en mostrador ·
[US2] KDS de cocina · [CMP] Componente · [INT] Integración

## Phase 1: Setup

- [x] T001 [P] Nota en `migrations/README.md`: estados y transiciones ya
  sembrados en baseline; sin migración en Sprint 4 (R1).

## Phase 2: Foundational (blocking)

- [x] T002 [P] Refactor en `backend/src/services/pedidos.service.ts`:
  extraer helpers privados `cargarItemsMenu` (valida activo/disponible) y
  `ejecutarAltaConReintento` (transacción + reintento de folio) reutilizados
  por el alta anticipada existente (sin cambio de comportamiento: los 50
  tests actuales deben seguir verdes).
- [x] T003 [P] Tipos de dominio en `backend/src/types/domain.ts`:
  `PedidoOperativo` (Pedido + `cliente_nombre`) y `PedidoCocina` (proyección
  del KDS sin precios, con `orden`). Ajustar `Pago.referencia` a
  `string | null` (el cobro en efectivo no tiene referencia).

## Phase 3: User Story 1 — Captura y cobro en mostrador (US1) [P]

**Tests primero: T004 (INT) y T005 (CMP) en rojo.**

- [x] T004 [P] [US1] [INT] `backend/tests/integration/caja.test.ts`:
  captura 201 (`mostrador`, `Pendiente`, nombre opcional, sin regla de 10
  minutos, total en servidor); platillo no disponible 409; cobro 200
  (`Pagado`, `metodo: efectivo`); doble cobro 409; cobro de anticipado 409;
  401/403 por rol; entregar desde `Listo` 200; cancelar 200; transición
  inválida 409.
- [x] T005 [P] [US1] [CMP] `frontend/src/pages/caja/CajaPage.test.tsx`:
  "Registrar y cobro en un solo paso" (captura + pago secuenciales con
  folio); vacío → error local sin llamadas; cobro fallido → botón "Cobrar"
  que reintenta sin duplicar el pedido.
- [x] T006 [P] [US1] Servicios en `pedidos.service.ts`:
  `crearPedidoMostrador` (sin anticipación/fecha, `cliente_nombre` opcional,
  solo menú de hoy) y `cobrarEnMostrador` (`FOR UPDATE`, `efectivo`,
  transición `Pendiente → Pagado` + historial).
- [x] T007 [US1] `backend/src/controllers/caja.controller.ts` +
  `backend/src/routes/caja.routes.ts` (zod: items, nombre ≤100, enum
  `Entregado|Cancelado`) tras `requireRole('cajero')`; montar `/api/caja` en
  `app.ts`.
- [x] T008 [US1] [CMP] `frontend/src/pages/caja/CajaPage.tsx` real:
  captura desde el menú de hoy (pasos de cantidad con botones ≥44 px),
  nombre opcional, "Registrar y cobrar", tarjeta de resultado con folio,
  reintento de cobro, sección de entregas ("Entregar"/"Cancelar") y estados
  de carga/vacío/error.

## Phase 4: User Story 2 — KDS de cocina (US2) [P]

**Tests primero: T009 (INT) y T010 (CMP) en rojo.**

- [x] T009 [P] [US2] [INT] `backend/tests/integration/cocina.test.ts`:
  lista ambos orígenes (`anticipado` + `mostrador`) ordenados por llegada y
  solo estados activos; `En preparación` y `Listo` 200; salto
  `Pendiente → Listo` 409; cambio sobre `Entregado`/`Cancelado` 409; destino
  fuera del enum del cocinero 400; 401/403 por rol; cajero no entra a
  `/api/cocina`.
- [x] T010 [P] [US2] [CMP] `frontend/src/pages/cocina/CocinaPage.test.tsx`:
  render ordenado con posiciones y estados; "Iniciar preparación" → POST +
  lista refrescada; rechazo 409 → mensaje claro.
- [x] T011 [P] [US2] Servicios en `pedidos.service.ts`: `transicionarEstado`
  genérico validado contra `transicion_estado` + historial (sobre T002/T003),
  `listarPedidosCocina` (activos ordenados por llegada con posición) y
  `listarPedidosListos` (entregas de caja).
- [x] T012 [US2] `backend/src/controllers/cocina.controller.ts` +
  `backend/src/routes/cocina.routes.ts` (enum `En preparación|Listo`) tras
  `requireRole('cocinero')`; montar `/api/cocina` en `app.ts`.
- [x] T013 [US2] [CMP] `frontend/src/pages/cocina/CocinaPage.tsx` real: KDS
  con sondeo cada 4 s (sin recarga manual), posiciones, colores de estado,
  botones táctiles "Iniciar preparación"/"Marcar listo" y vacío/error.

## Phase 5: Polish & Security

- [x] T014 [P] Docs: `backend/README.md` y `frontend/README.md` (endpoints y
  pantallas del Sprint 4).
- [x] T015 Quickstart e2e: cadena cajero → cocina → entrega según
  `specs/005-counter-kitchen/quickstart.md` (incluye 409s por transición y
  permisos).
- [x] T016 [P] Gates completos en ambos paquetes:
  `npm run lint && npm run typecheck && npm test` (+ `npm run build` en
  frontend).
- [ ] T017 Demo aprobada por la patrocinadora → marcar Sprint 4 completado
  en `docs/sprints.md`.

