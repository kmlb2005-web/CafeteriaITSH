# Tasks: QA del Cliente â€” Evidencia y Reglas de Rol (Sprint 7)

**Input**: Design documents from `/specs/009-qa-cliente/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: La spec los solicita explÃ­citamente (FR-001â€¦FR-006): casi todas las
tareas de esta feature **son** pruebas y evidencia.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/`, `frontend/` en la raÃ­z del repositorio
- Pruebas de integraciÃ³n: `backend/tests/integration/`
- Pruebas de unidad: `backend/tests/unit/`
- Pruebas de componentes: `frontend/src/**/`

---

## Phase 1: Setup

**Purpose**: dejar la base verde y registrar el punto de partida

- [x] T001 Ejecutar `node scripts/verify.mjs` en la rama `spec/009-qa-cliente`
      y confirmar la base verde del Sprint 6 (backend 9/89, frontend 20/89
      archivos/pruebas); anotar el conteo como lÃ­nea base para AGENTS.md
      â€” HECHO 2026-11-03: verde (backend 36.4 s, frontend 36.6 s)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: no hay infraestructura nueva (el gate, el CI y los patrones de
prueba ya existen desde el Sprint 6).

- [x] T002 Confirmar los prerequisitos de ejecuciÃ³n descritos en
      `quickstart.md` Â§1 (MySQL vivo + `backend/.env`) corriendo
      `npx vitest run tests/integration/auth.test.ts` en verde; si falla,
      detener el sprint y resolver el entorno antes de escribir pruebas
      â€” HECHO 2026-11-03: toda la suite de integraciÃ³n corriÃ³ en el gate

**Checkpoint**: entorno operativo â€” pueden empezar las historias

---

## Phase 3: User Story 1 - El backend respeta el rol cliente y no filtra errores (Priority: P1) â€” MVP

**Goal**: 403/401 del rol cliente contra rutas internas, prueba del fallo del
aviso (O-02) y sobre de error sin trazas.

**Independent Test**: `npx vitest run tests/integration/permisos-cliente.test.ts tests/integration/mis-pedidos.test.ts tests/unit/error.test.ts` en verde.

### Tests for User Story 1

- [x] T003 [US1] Crear `backend/tests/integration/permisos-cliente.test.ts`
      con el setup del cliente de prueba (`test-*@example.com`, rol `usuario`,
      cookie de sesiÃ³n, limpieza en `afterAll` â€” patrÃ³n de
      `tests/integration/`) y el caso 401 `no_autorizado` sin cookie en
      `GET /api/caja/pedidos/listos` (contracts `contratos-cliente.md` Â§2)
- [x] T004 [P] [US1] Agregar a `backend/tests/integration/permisos-cliente.test.ts`
      los 5 casos 403 `prohibido` con JWT de cliente: `GET
      /api/caja/pedidos/listos`, `POST /api/caja/pedidos`, `POST
      /api/cocina/pedidos/:id/estado`, `GET /api/admin/platillos`, `GET
      /api/usuarios` â€” verificando ademÃ¡s la forma `{ error: { code, message } }`
      y que ninguna peticiÃ³n modifique datos (FR-001, contracts Â§2)
- [x] T005 [US1] Agregar a `backend/tests/integration/mis-pedidos.test.ts`
      el caso **O-02**: `correoMock.mockRejectedValue(new Error('proveedor
      caÃ­do'))`, llevar un pedido a `Listo` con `avanzar(...)`, esperar
      respuesta **200** y estado `Listo` con `aviso_listo: true`; al final
      restaurar el mock (FR-002, research R1, contracts Â§3)
- [x] T006 [P] [US1] Crear `backend/tests/unit/error.test.ts` que invoca
      `errorHandler` con `ApiError` (403 `prohibido`), `ZodError` (400
      `validacion`), `ER_DUP_ENTRY` (409 `duplicado`) y `Error` con stack
      (500 `interno`), exigiendo `{ error: { code, message } }` exacto y
      ausencia de `stack`, `at `, `node_modules`, `ER_`/`SQL` en la respuesta
      (FR-003, contracts Â§1)
- [x] T007 [US1] Ejecutar los tres archivos de backend del sprint en verde:
      `cd backend && npx vitest run tests/integration/permisos-cliente.test.ts tests/integration/mis-pedidos.test.ts tests/unit/error.test.ts`

**Checkpoint**: US1 completa â€” servidor con rol cliente verificado y O-02
cerrado funcionalmente

---

## Phase 4: User Story 2 - El cliente ve estados claros en sus pantallas (Priority: P2)

**Goal**: protecciÃ³n por rol con sesiÃ³n equivocada, estados vacÃ­o/error del
menÃº y mis pedidos, y total del carrito correcto.

**Independent Test**: `cd frontend && npx vitest run src/routes/ProtectedRoute.test.tsx src/pages/menu/MenuPage.test.tsx src/pages/pedidos/MisPedidosPage.test.tsx src/components/CheckoutBar.test.tsx` en verde.

### Tests for User Story 2

- [x] T008 [P] [US2] Ampliar `frontend/src/routes/ProtectedRoute.test.tsx`
      con la variante del cliente: sesiÃ³n `cajero` sobre `roles={['usuario']}`
      y sesiÃ³n `usuario` sobre `roles={['cajero']}` â€” esperar pantalla
      "Acceso denegado" y que el enlace "Volver a mi secciÃ³n" apunte a
      `RUTA_POR_ROL` del rol de la sesiÃ³n (FR-005, research R5)
- [x] T009 [P] [US2] Revisar `frontend/src/pages/menu/MenuPage.test.tsx`:
      confirmar que estado vacÃ­o ("cuando no hay menÃº") y error de red con
      reintentar siguen cubiertos (FR-004); si falta alguno, agregarlo con el
      patrÃ³n de `fetch` mockeado del archivo
- [x] T010 [P] [US2] Revisar `frontend/src/pages/pedidos/MisPedidosPage.test.tsx`:
      confirmar estado vacÃ­o y error con reintentar (FR-004); completar si
      falta alguno
- [x] T011 [US2] Ampliar la prueba del total del carrito en
      `frontend/src/pages/menu/MenuPage.test.tsx` (o
      `frontend/src/components/CheckoutBar.test.tsx` si conviene): quitar una
      partida con el stepper y verificar que el total mostrado vuelve a la
      suma correcta (FR-006)
- [x] T012 [US2] Ejecutar los cuatro archivos de frontend del sprint en verde:
      `cd frontend && npx vitest run src/routes/ProtectedRoute.test.tsx src/pages/menu/MenuPage.test.tsx src/pages/pedidos/MisPedidosPage.test.tsx src/components/CheckoutBar.test.tsx`

**Checkpoint**: US2 completa â€” pantallas del cliente con evidencia automatizada

---

## Phase 5: User Story 3 - Evidencia auditable del rol cliente (Priority: P3)

**Goal**: checklist Â§19 respondido, capturas del flujo del alumno y matriz de
calidad cerrada para el rol cliente.

**Independent Test**: revisar el repositorio: capturas existentes, checklist
respondido, matriz sin pÃ¡rrafos "pendiente" del rol cliente.

- [x] T013 [US3] Recorrer el flujo completo del alumno con la app local y
      guardar las capturas en `docs/evidencias/cliente/` con los nombres
      `01-login.png`, `02-menu.png`, `03-carrito-stepper.png`,
      `04-confirmar-pedido.png`, `05-estado-anticipacion-10-min.png`,
      `06-mis-pedidos-listo.png` (sin `.env`, tokens ni datos reales a la
      vista) (FR-008, contracts Â§4)
- [x] T014 [US3] Crear `docs/checklist-usabilidad-cliente.md` con los Ã­tems de
      `docs/reglas.md` Â§19 aplicados a la UI del cliente (Tailwind/shadcn,
      Ã¡rea tÃ¡ctil â‰¥44 px en steppers y CTA, responsiva, navegaciÃ³n sencilla,
      informaciÃ³n clara): casilla, nota y captura de respaldo (FR-007)
- [x] T015 [US3] Actualizar `docs/Matriz_de_calidad.md`: RF-01 y RF-02 en
      **Aprobado** con evidencia re-ejecutada 2026-11-03; RF-04 en
      **Aprobado** corrigiendo la cita `avisos.test.ts` â†’ `mis-pedidos.test.ts`
      (5 casos); cerrar **O-02** (prueba del fallo del aviso, T005) y registrar
      **D-04** cerrado (cita a archivo inexistente); eliminar el pÃ¡rrafo
      "Pendiente para el Sprint 7" (FR-009, research R2/R7)
- [x] T016 [US3] Actualizar `AGENTS.md` con el conteo final de archivos y
      pruebas si cambiÃ³ respecto de la lÃ­nea base de T001

**Checkpoint**: US3 completa â€” evidencia y matriz listas para demo

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: verificaciÃ³n global, CI y cierre del sprint

- [x] T017 Ejecutar el gate completo `node scripts/verify.mjs` y confirmar
      verde en ambos paquetes
- [x] T018 Hacer push de la rama `spec/009-qa-cliente` y confirmar los 3
      trabajos del CI en verde en GitHub (runner `cafeteria-itsh-win`,
      quickstart Â§4)
- [x] T019 Actualizar `docs/sprints.md` con el cierre técnico del Sprint 7,
      fecha y demo (gate + CI verde + evidencia)
- [x] T020 Abrir el PR a `main`, verificarlo en verde y hacer merge (demo del
      sprint) — PR #3 integrado el 2026-11-04 (3/3 jobs en verde)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias
- **Foundational (Phase 2)**: depende de Phase 1 (entorno comprobado)
- **US1 (Phase 3)**: depende de Phase 2 (backend operativo)
- **US2 (Phase 4)**: depende de Phase 2; puede correr **en paralelo** con US1
  (sÃ³lo toca `frontend/`)
- **US3 (Phase 5)**: depende de US1 (O-02 y la matriz citan sus pruebas) y de
  US2 (las capturas incluyen sus pantallas)
- **Polish (Phase 6)**: depende de US1 + US2 + US3

### User Story Dependencies

- **US1 (P1)**: arranca tras Phase 2; sin dependencias de otras historias
- **US2 (P2)**: arranca tras Phase 2; independiente de US1
- **US3 (P3)**: requiere las pruebas de US1 y US2 (la evidencia las referencia)

### Parallel Opportunities

- T004 y T006 en paralelo (archivos distintos de backend)
- T008, T009 y T010 en paralelo (archivos distintos de frontend)
- US1 y US2 en paralelo mientras no se toquen los mismos archivos

---

## Parallel Example: User Story 1

```bash
# T004 (permisos 403) y T006 (error unitario) pueden ejecutarse juntas:
Task: "403 de cliente en backend/tests/integration/permisos-cliente.test.ts"
Task: "error handler en backend/tests/unit/error.test.ts"
# T005 va despuÃ©s de confirmar el setup de mis-pedidos.test.ts (mismo archivo)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 y Phase 2 (base verde + entorno)
2. Phase 3 completa: US1
3. **PARAR Y VALIDAR**: los 3 archivos backend en verde â†’ O-02 cerrado
4. Demo posible: servidor con rol cliente verificado

### Incremental Delivery

1. Setup + Foundational â†’ entorno listo
2. US1 â†’ backend verificado â†’ demo
3. US2 â†’ frontend verificado â†’ demo
4. US3 â†’ evidencia + matriz â†’ cierre del sprint (gate + CI + PR)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Commit despuÃ©s de cada tarea o grupo lÃ³gico (mensajes en espaÃ±ol)
- Las pruebas comparten la BD: usuarios `test-*@example.com` y limpieza en
  `afterAll`; no paralelizar integraciÃ³n a mano
- Si T002 falla: detener el sprint (problema de entorno, no del alcance)
