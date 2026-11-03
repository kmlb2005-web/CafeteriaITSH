# Tasks: Base de Aseguramiento de Calidad y CI (spec 008)

**Input**: Design documents from `/specs/008-qa-foundation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Tests**: las pruebas del producto ya existen (178); esta feature las
verifica, no las agrega. Sólo se pide validar la ejecución real.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (base del sprint)

**Purpose**: dejar versionado el trabajo de calidad en curso antes de
construir el gate.

- [ ] T001 Crear la rama `spec/008-qa-foundation` desde `spec/007-ui-redesign`
- [ ] T002 [P] [US2] Commitear las correcciones de pruebas:
      `backend/tests/integration/pedidos.test.ts` (borde 9/11 min, cobros
      simultáneos) y `backend/tests/integration/cocina.test.ts` (búsqueda por id)
- [ ] T003 [P] [US2] Commitear `docs/Matriz_de_calidad.md` y
      `docs/Requerimientos_MVP.md`
- [ ] T004 [P] [US1] Commitear el roadmap de QA en `docs/sprints.md`
      (sprints 6–11)

**Checkpoint**: árbol de trabajo limpio; el gate se construye sobre versión
final.

---

## Phase 2: Foundational (bloquea las user stories)

**Purpose**: comando único de verificación — sin él, el CI no tiene qué
ejecutar.

- [ ] T005 Agregar `"verify": "npm run lint && npm run typecheck && npm test"`
      a `backend/package.json`
- [ ] T006 [P] Agregar `"verify"` equivalente a `frontend/package.json`
- [ ] T007 Crear `scripts/verify.mjs` (gate raíz, Node sin dependencias:
      corre `npm run verify` en `backend/` y `frontend/`, imprime resumen y
      propaga código de salida)

**Checkpoint**: `node scripts/verify.mjs` en verde local (quickstart §1).

---

## Phase 3: User Story 1 - Verificación única y automática (Priority: P1)

**Goal**: lint + typecheck + pruebas en cada PR, backend con MySQL efímera.
**Independent Test**: PR de GitHub con los tres trabajos en verde; PR con
error de tipos → trabajos en rojo.

### Implementation for User Story 1

- [ ] T008 [US1] Crear `.github/workflows/ci.yml` con disparadores
      `push: main` y `pull_request` (contrato C3)
- [ ] T009 [US1] Trabajo `chequeo-secretos`: fallar si `git ls-files`
      contiene un `.env` real (`.env.example` permitido) — FR-005
- [ ] T010 [US1] Trabajo `frontend`: Node LTS → `npm ci` →
      `npm run verify` en `frontend/`
- [ ] T011 [US1] Trabajo `backend`: servicio `mysql:8` con health-check,
      crear base `cafe_itsh`, aplicar `docs/001_crear_esquema.sql` +
      `docs/002_seed_inicial.sql`, `npm ci`, `npm run migrate`,
      `npm run verify` — variables `DATABASE_URL`, `JWT_SECRET`,
      `NODE_ENV=test` sólo en el workflow (FR-004)
- [ ] T012 [US1] Verificar que ninguna variable del workflow está escrita en
      el repositorio (revisión manual + chequeo T009)

**Checkpoint**: CI verde en un PR real (quickstart §4).

---

## Phase 4: User Story 2 - Cierre del trabajo de calidad en curso (Priority: P2)

**Goal**: matriz sin defectos abiertos y evidencia versionada.
**Independent Test**: leer `docs/Matriz_de_calidad.md` → sin filas en estado
abierto; `npm test` en verde con los casos nuevos.

### Implementation for User Story 2

- [ ] T013 [US2] Actualizar `docs/Matriz_de_calidad.md`: D-01 cerrado por
      aclaración (ref. `docs/Requerimientos_MVP.md` RF-01), D-02 cerrado
      (prueba de cobros simultáneos), D-03 cerrado (búsqueda por id), O-01
      cerrado (casos borde 9/11 min); con fecha 2026-11-02 y estado final
- [ ] T014 [US2] Ejecutar `cd backend && npm run verify` y confirmar que las
      pruebas corregidas pasan (89 pruebas)
- [ ] T015 [P] [US2] Commitear los cierres de la matriz

**Checkpoint**: SC-003 — 0 defectos abiertos, 0 requisitos sin prueba.

---

## Phase 5: User Story 3 - Guía de verificación para agentes (Priority: P3)

**Goal**: `AGENTS.md` con comandos reales y conteo real de pruebas.
**Independent Test**: seguir la secuencia de `AGENTS.md` → comandos existen
y corren; conteo coincide con la ejecución.

### Implementation for User Story 3

- [ ] T016 [US3] Actualizar `AGENTS.md`: sección de verificación con
      `node scripts/verify.mjs`, scripts `verify` por paquete y conteo real
      (29 archivos, 178 pruebas a 2026-11-02); eliminar/ajustar la mención
      de "test único"
- [ ] T017 [US3] Commitear la actualización de `AGENTS.md`

**Checkpoint**: SC-004 — sin comandos inexistentes ni conteos
desactualizados.

---

## Phase 6: Polish & Cross-Cutting

- [ ] T018 [P] Corregir erratas en artefactos speckit de esta spec
      (`data-model.md`: "configificación" → "configuración")
- [ ] T019 Ejecutar la validación completa del quickstart (§1–§5)
- [ ] T020 Actualizar `docs/sprints.md` marcando el sprint 6 como completado
      con fecha y demo (PR verde)
- [ ] T021 Merge del PR a `main` (demo del sprint: PR en verde)

---

## Dependencies & Execution Order

- **Phase 1** → sin dependencias (primero versionar lo existente).
- **Phase 2** → depende de Phase 1 (gate sobre versión final).
- **Phase 3 (US1)** → depende de Phase 2 (`verify` es lo que corre el CI).
- **Phase 4 (US2)** → puede paralelizarse con Phase 3 (distintos archivos).
- **Phase 5 (US3)** → depende de Phase 2 (describe los comandos creados).
- **Phase 6** → depende de todas.

**Oportunidades de paralelismo**: T002/T003/T004 entre sí; T005/T006 entre
sí; T008–T011 del workflow; US2 y US1 en paralelo.

## Notes

- Commits pequeños y descriptivos (regla §21); nada de secretos en ellos.
- Cada tarea deja el gate en verde antes de pasar a la siguiente.
- Sin dependencias nuevas: el CI usa sólo servicios oficiales de GitHub
  Actions (research R2, R4).
