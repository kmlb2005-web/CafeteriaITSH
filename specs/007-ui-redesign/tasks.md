# Tasks: Rediseño de Interfaz por Rol (UI/UX)

**Input**: Design documents from `/specs/007-ui-redesign/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Requeridos — la constitución (§Testing) exige pruebas de la lógica
importante y el proyecto ya mantiene un `*.test.tsx` por página/componente;
los tests existentes se actualizarán cuando cambie su pantalla.

**Organization**: Tareas agrupadas por historia de usuario (orden de
prioridad P1 → P4) para implementar y probar cada una de forma
independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: historia de usuario (US1…US4)

---

## Phase 1: Setup (Base compartida)

**Purpose**: confirmar línea base verde antes de tocar código (no hay inicialización de proyecto: la SPA ya existe)

- [X] T001 Verificar línea base sin cambios: `cd frontend && npm run lint && npm run typecheck && npm test` debe pasar antes de empezar

---

## Phase 2: Foundational (Prerrequisitos bloqueantes)

**Purpose**: componentes de navegación compartidos que TODAS las historias necesitan

**⚠️ CRITICAL**: ninguna historia puede comenzar hasta completar esta fase

- [X] T002 [P] Crear componente `AppDrawer` en `frontend/src/components/AppDrawer.tsx` según contrato `specs/007-ui-redesign/contracts/navegacion-ui.md` §1: panel móvil deslizante con overlay + `Escape`, rail fijo en `lg`, `NavLink` con `aria-current`, badge de contador, perfil y `Cerrar sesión` (D1–D6)
- [X] T003 [P] Test de `AppDrawer` en `frontend/src/components/AppDrawer.test.tsx`: apertura/cierre móvil, rail en escritorio, cierre al navegar, badge con contador, perfil + logout
- [X] T004 [P] Adaptar `RoleHeader` en `frontend/src/components/RoleHeader.tsx`: botón hamburguesa ≥44 px con `aria-label="Abrir menú"` (prop `onAbrirMenu`), conservando sesión visible y `Cerrar sesión` (contrato §4)
- [X] T005 [P] Crear componente `BottomBar` en `frontend/src/components/BottomBar.tsx` según contrato §2: `fixed bottom-0`, pestañas ≥56 px, `lg:hidden`, badge pill `status-*` cuando contador > 0, safe-area (B1–B4)
- [X] T006 [P] Test de `BottomBar` en `frontend/src/components/BottomBar.test.tsx`: 2 items, ruta activa resaltada, badge, ocultación en escritorio
- [X] T007 [P] Crear componente `CheckoutBar` en `frontend/src/components/CheckoutBar.tsx` según contrato §3: conteo + total (`font-heading` peso 800, formato `$N.NN`) + CTA ≥48 px, oculta con carrito vacío (C1–C4)
- [X] T008 [P] Test de `CheckoutBar` en `frontend/src/components/CheckoutBar.test.tsx`: oculta con 0 productos, total correcto, CTA invocable

**Checkpoint**: fundamentos listos — las 4 historias pueden empezar (en orden P1 → P4)

---

## Phase 3: User Story 1 — Caja: captura y cobro rápidos con navegación nueva (Priority: P1) 🎯 MVP

**Goal**: drawer + bottom bar (`Caja`/`Entregas` con contador), catálogo con
búsqueda/categorías/stepper, barra flotante, resumen con cobro en un paso y
pantalla de entregas.

**Independent Test**: en `/caja` (móvil y escritorio): navegar entre secciones,
capturar un pedido, cobrarlo y entregar un pedido `Listo` con su contador.

### Implementation for User Story 1

- [X] T009 [US1] Crear `frontend/src/pages/caja/CajaInicioPage.tsx`: encabezado con fecha, CTA primario **Capturar pedido** → `/caja/nuevo`, módulo **Entregas** con contador, área de bienvenida ("¡Buen día!…") y estados de carga/error (FR-008, design §4.2)
- [X] T010 [US1] Rediseñar catálogo en `frontend/src/pages/caja/CajaPage.tsx`: campo "Nombre del cliente (opcional)", búsqueda `Buscar producto...` en vivo, chips de categoría (derivadas del menú), filas ≥56 px con stepper `− 0 +` (0–99, `−` deshabilitado en 0), `CheckoutBar` con conteo y total (FR-005, FR-006)
- [X] T011 [US1] Agregar vista interna de **Resumen de cobro** en `frontend/src/pages/caja/CajaPage.tsx`: desglose con ítems quitar, total destacado, nota "un solo paso", CTA único **Registrar y cobrar**; éxito → folio + badge `Pagado` + **Nuevo pedido** (limpia carrito); fallo → `Pendiente` con **Reintentar cobro**/**Cancelar pedido** (conservar la lógica de `cobrarPedido()` existente, FR-007)
- [X] T012 [US1] Crear `frontend/src/pages/caja/EntregasPage.tsx`: lista por llegada con folio, hora, cliente, partidas, badge `Listo`, CTA **Entregar**/**Cancelar** ≥44 px, estado vacío "¡Todo está al día!" y error con `Reintentar` (FR-008)
- [X] T013 [US1] Reemplazar nav de tabs en `frontend/src/layouts/CajaLayout.tsx`: `AppDrawer` (Inicio, Capturar pedido, Pedidos listos con contador, Cerrar sesión) + `BottomBar` (`Caja`/`Entregas`); el contador proviene de `GET /api/caja/pedidos/listos` elevado al layout; `pb` del contenido para no tapar la barra (FR-001…FR-003)
- [X] T014 [US1] Registrar rutas anidadas en `frontend/src/App.tsx`: `/caja` → `CajaInicioPage`, `/caja/nuevo` → `CajaPage`, `/caja/entregas` → `EntregasPage` dentro de `CajaLayout` (rutas y `ProtectedRoute` por rol sin cambios, FR-004)
- [X] T015 [US1] Actualizar `frontend/src/pages/caja/CajaPage.test.tsx` (+ nuevo test de `EntregasPage` y `CajaInicioPage`): búsqueda/filtros, stepper 0–99, cobro en un paso, estados de entrega vacío/error
- [ ] T016 [US1] **Checkpoint US1**: `npm run lint && npm run typecheck && npm test` en `frontend/` + escenarios V1/V2 de `specs/007-ui-redesign/quickstart.md`

**Checkpoint**: US1 completa y testeable de forma independiente (MVP)

---

## Phase 4: User Story 2 — Cocina: tablero legible y actualizado (Priority: P2)

**Goal**: drawer en cocina + tarjetas KDS con folio grande, chip de origen,
hora de recogida con énfasis, tiempo transcurrido/retrasado, CTA único y
indicador de frescura.

**Independent Test**: en `/cocina` con pedidos pagados: orden de llegada,
avance de estados en un toque, tiempos visibles y "act. hace X s".

### Implementation for User Story 2

- [X] T017 [US2] Reemplazar nav de tabs en `frontend/src/layouts/CocinaLayout.tsx`: `AppDrawer` simple (Pedidos, Cerrar sesión) con `RoleHeader` hamburguesa (FR-001, FR-002)
- [X] T018 [US2] Rediseñar tarjeta en `frontend/src/pages/cocina/CocinaPage.tsx`: folio `#orden` peso 800 verde + `font-mono` del número, badge de estado `status-*`, chip `Anticipado`/`Mostrador`, hora de registro, "recoge HH:MM" con énfasis, partidas `N×` ≥20 px peso 800, CTA único 48 px deshabilitado mientras procesa (`Pagado`→`En preparación`→`Listo`; `Listo` sin CTA) (FR-010)
- [X] T019 [US2] Agregar tiempo transcurrido y marcador **¡Retrasado!** en `frontend/src/pages/cocina/CocinaPage.tsx`: cálculo en cliente desde `creado_en`/`fecha_recoleccion`, `setInterval` de 30 s compartido, retrasado = recogida < ahora en color `error` (research R4)
- [X] T020 [US2] Agregar indicador de frescura en `frontend/src/pages/cocina/CocinaPage.tsx`: `ultimaActualizacion` en cada sondeo exitoso, texto "act. hace X s" (intervalo 1 s), "Sin conexión — reintentando…" tras 2 fallos sin suspender el sondeo; conservar aviso de conflicto + re-sincronización del `catch` existente (FR-011, FR-012, research R3)
- [X] T021 [US2] Estados en `frontend/src/pages/cocina/CocinaPage.tsx`: vacío "¡Todo está al día! No hay pedidos en cocina…", carga y error con `Reintentar` (FR-009, FR-019)
- [X] T022 [US2] Actualizar `frontend/src/pages/cocina/CocinaPage.test.tsx`: orden de llegada, CTA por estado, retrasado, indicador de frescura, vacío/error/conflicto
- [ ] T023 [US2] **Checkpoint US2**: `npm run lint && npm run typecheck && npm test` en `frontend/` + escenarios V1/V3 de `quickstart.md`

**Checkpoint**: US1 + US2 funcionan de forma independiente

---

## Phase 5: User Story 3 — Cliente: menú con filtros, pedido guiado y aviso de listo (Priority: P3)

**Goal**: drawer + bottom bar (`Menú`/`Mis pedidos` con contador de `Listo`),
menú con filtros y `CheckoutBar`, flujo de pedido con regla de 10 min
visible y aviso "¡Listo para recoger!".

**Independent Test**: flujo completo `/menu` → confirmar → pago →
`/mis-pedidos` con contadores y estados.

### Implementation for User Story 3

- [X] T024 [US3] Reemplazar nav de tabs en `frontend/src/layouts/ClienteLayout.tsx`: `AppDrawer` (Menú del día, Mis pedidos con contador, Cerrar sesión) + `BottomBar` (`Menú`/`Mis pedidos`); contador de pedidos `Listo` desde `GET /api/pedidos` elevado al layout y refrescado al navegar; `BottomBar` oculta en los pasos `/pedido/*` (se mantiene el botón regresar) (FR-001…FR-003)
- [X] T025 [US3] Rediseñar `frontend/src/pages/menu/MenuPage.tsx`: encabezado con fecha, área de bienvenida opcional, búsqueda `Buscar producto...`, chips de categoría con icono, tarjetas con badge `Especial` (espresso) y `No disponible` (atenuada, no seleccionable), stepper conservado y `CheckoutBar` → `/pedido/confirmar` (FR-013)
- [X] T026 [US3] Ajustar `frontend/src/pages/pedidos/ConfirmarPedidoPage.tsx`: partidas con quitar, total grande, validación de 10 min con mensaje que incluye la hora mínima (conservar la existente), CTA **Continuar al pago**, vacío "Tu carrito está vacío" + volver al menú (FR-014)
- [X] T027 [US3] Ajustar `frontend/src/pages/pedidos/PagoPage.tsx`: monto destacado, texto visible "no se capturan datos de tarjeta", estado procesando, rechazo → `Pendiente` + **Reintentar pago**/**Cancelar pedido**, "Este pedido ya está pagado" (FR-014)
- [X] T028 [US3] Ajustar `frontend/src/pages/pedidos/ConfirmacionPage.tsx`: folio grande `font-mono` 24 px+, badge de estado, recolección/total/cliente, CTAs **Ver mis pedidos**/**Volver al menú**, error de consulta con `Reintentar` (FR-019)
- [X] T029 [US3] Ajustar `frontend/src/pages/pedidos/MisPedidosPage.tsx`: badge de estado por pedido, aviso destacado "¡Listo para recoger!" (borde `status-ready`) cuando estado = `Listo`, detalle expandible, vacío + CTA **Nuevo pedido**, contador del bottom bar (FR-015)
- [X] T030 [US3] Actualizar tests de cliente: `frontend/src/pages/menu/MenuPage.test.tsx`, `frontend/src/pages/pedidos/ConfirmarPedidoPage.test.tsx`, `frontend/src/pages/pedidos/PagoPage.test.tsx`, `frontend/src/pages/pedidos/ConfirmacionPage.test.tsx`, `frontend/src/pages/pedidos/MisPedidosPage.test.tsx` (filtros, barra flotante, 10 min, aviso listo, estados)
- [ ] T031 [US3] **Checkpoint US3**: `npm run lint && npm run typecheck && npm test` en `frontend/` + escenarios V1/V4 de `quickstart.md`

**Checkpoint**: US1–US3 funcionan de forma independiente

---

## Phase 6: User Story 4 — Admin: inicio con acciones rápidas y CRUD más claro (Priority: P4)

**Goal**: drawer en admin, landing con conteos y resumen del menú, y
listados de filas altas con buscadores y CTA fijos.

**Independent Test**: `/admin` con tarjetas de acción → alta/edición completa
en las tres secciones.

### Implementation for User Story 4

- [X] T032 [US4] Reemplazar nav de tabs en `frontend/src/layouts/AdminLayout.tsx`: `AppDrawer` (Inicio, Usuarios, Platillos, Menú del día, Cerrar sesión) (FR-001, FR-002)
- [X] T033 [US4] Crear `frontend/src/pages/admin/InicioAdminPage.tsx`: tarjetas de acción con conteos (`GET /api/usuarios`, listado de platillos, `GET /api/menu`), resumen del menú de hoy con badges `Especial`/no disponibles, estados vacío/error con `Reintentar`; **sin** métricas de negocio (FR-016, FR-021)
- [X] T034 [US4] Re-rutas en `frontend/src/App.tsx`: `/admin` → `InicioAdminPage`, `/admin/usuarios` → `UsuariosPage`; conservar `/admin/platillos` y `/admin/menu`; verificar `RUTA_POR_ROL.admin = '/admin'` en `frontend/src/lib/roles.ts` sigue siendo válido (FR-004)
- [X] T035 [US4] Rediseñar `frontend/src/pages/admin/UsuariosPage.tsx`: filas ≥56 px con nombre/correo, badge de rol, estado, acciones por fila; CTA fijo **Nuevo usuario**; buscador; confirmación de deshabilitar; vacío con CTA y error con `Reintentar` (FR-017)
- [X] T036 [US4] Rediseñar `frontend/src/pages/admin/PlatillosPage.tsx`: buscador + chips de categoría, tarjetas con estado, CTA fijo **Nuevo platillo**, vacío de filtro y error con `Reintentar` (FR-017)
- [X] T037 [US4] Rediseñar `frontend/src/pages/admin/MenuDelDiaPage.tsx`: selector de fecha visible, grid con precio editable, toggle `Disponible` ≥44 px, badge `Especial` conmutable, quitar con confirmación, panel "Agregar al menú", vacío de fecha sin menú (FR-017)
- [X] T038 [US4] Actualizar tests de admin: `frontend/src/pages/admin/UsuariosPage.test.tsx`, `frontend/src/pages/admin/PlatillosPage.test.tsx`, `frontend/src/pages/admin/MenuDelDiaPage.test.tsx` + nuevo `frontend/src/pages/admin/InicioAdminPage.test.tsx` (conteos, CRUD, estados)
- [ ] T039 [US4] **Checkpoint US4**: `npm run lint && npm run typecheck && npm test` en `frontend/` + escenario V5 de `quickstart.md`

**Checkpoint**: las 4 historias funcionan de forma independiente

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: verificación transversal de la feature completa

- [ ] T040 [P] Verificar área táctil ≥44 px y responsividad móvil/escritorio en todos los controles nuevos de caja/cocina (FR-018, SC-004) con DevTools
- [X] T041 [P] Regresión de navegación: confirmar que ninguna pantalla renderiza la nav de pestañas antigua (grep de `border-b-2 border-primary` en layouts) y que `frontend/package.json` no agregó dependencias (§22)
- [ ] T042 Ejecutar la validación completa de `specs/007-ui-redesign/quickstart.md`: verificación automática (lint/typecheck/test) + escenarios manuales V1–V6 y criterios SC-001…SC-007
- [X] T043 Revisión final de consistencia: estados vacío/carga/error idénticos entre roles, textos en español, badges con colores `status-*` de `docs/DESIGN.md` (FR-019, FR-020)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias — empezar de inmediato
- **Foundational (Fase 2)**: depende de Setup — **bloquea las 4 historias**
- **US1 (P1)**: requiere Fase 2 → después US2 → US3 → US4 en orden de prioridad
- **US2 (P2)**: requiere Fase 2 (independiente de US1)
- **US3 (P3)**: requiere Fase 2; reutiliza `CheckoutBar` (T007)
- **US4 (P4)**: requiere Fase 2
- **Polish (Fase 7)**: depende de las historias que se quieran entregar

### Within Each User Story

1. Componentes/páginas nuevos primero
2. Luego layout de navegación del rol (cambio atómico: sin tabs ni drawer a la vez)
3. Luego rutas en `App.tsx`
4. Luego tests del rol
5. Checkpoint con lint + typecheck + test

### Parallel Opportunities

- T002–T008 (componentes fundamentales): todos en archivos distintos → paralelizables
- Tras la Fase 2, US1–US4 son independientes entre sí (archivos por rol separados)
- Dentro de cada US, los tasks de páginas distintas son `[P]` cuando no comparten archivo

## Implementation Strategy

### MVP First (solo US1)

1. Fase 1 + Fase 2 (fundamentos)
2. Fase 3 (US1 — caja) → **PARAR y VALIDAR** (V1/V2)
3. Demo: caja completa con navegación nueva

### Incremental Delivery

1. Fundamentos → 2. US1 (MVP) → 3. US2 (cocina) → 4. US3 (cliente) →
5. US4 (admin) → 6. Polish + quickstart

## Notes

- [P] = archivos distintos sin dependencias; [Story] = trazabilidad con la spec
- Commits pequeños y descriptivos por tarea o grupo lógico
- Español en código, mensajes y docs (regla del proyecto)
- Sin dependencias nuevas (§22) y sin cambios de backend (FR-021)
