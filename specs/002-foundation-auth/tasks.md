---

description: "Task list template for feature implementation"
---

# Tasks: Fundamentos y Autenticación (Sprint 1)

**Input**: Design documents from `/specs/002-foundation-auth/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: Incluidas: el criterio de aceptación del sprint exige `npm test` en
verde y `docs/reglas.md` §20 requiere pruebas de autenticación y autorización.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`, `migrations/` (según plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Init git repo + create `.gitignore` (node_modules, `.env`, dist, coverage) in repository root
- [x] T002 Backend TypeScript scaffold: `backend/tsconfig.json` (strict), scripts `dev|build|test|typecheck` in `backend/package.json`, install express, mysql2, zod, bcrypt, jsonwebtoken, dotenv, vitest, supertest, tsx, typescript (hecho con `bcryptjs` en lugar de `bcrypt` — sin binarios nativos; types propios)
- [x] T003 Frontend TypeScript migration: rename `frontend/src/*.jsx` → `.tsx`, `frontend/tsconfig.json` (strict), install react-router, tailwindcss, vitest, @testing-library/react
- [x] T004 [P] Lint configs: `backend/eslint.config.js` and keep `frontend/eslint.config.js` aligned (camelCase/PascalCase per reglas §18) (backend creado; revisión de frontend en T036)
- [x] T005 [P] Env config: `backend/.env.example` (DATABASE_URL, JWT_SECRET, NODE_ENV, PORT, SEED_*_PASSWORD) + validation schema in `backend/src/config/env.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Migration runner: create `backend/scripts/migrate.mjs` (applies `migrations/*.sql` in order, records in `schema_migrations`) — ruta ajustada a `backend/scripts/` para resolver dependencias ESM
- [x] T007 Create `migrations/001_roles_usuarios.sql` (tables `roles`, `usuarios`, unique `correo`, FK `rol_id`, seed de 4 roles) per data-model.md — **ADAPTADO**: el esquema ya existe en `docs/001_crear_esquema.sql` + `docs/002_seed_inicial.sql` (tablas `rol`/`usuario` con `password_hash`, `activo`, FK y correo único); el runner los registra como **baseline** y `migrations/README.md` documenta el flujo a partir de aquí
- [x] T008 DB access: create `backend/src/db/pool.ts` (mysql2/promise from env) + idempotent seed in `backend/src/db/seed.ts` (cuentas operativas con contraseñas de entorno)
- [x] T009 [P] Error handling: create `backend/src/middleware/error.ts` (formato `{ error: { code, message } }`, logging sin filtrar detalles, reglas §15)
- [x] T010 App bootstrap: create `backend/src/app.ts` and `backend/src/server.ts` (Express + rutas `/api/*` + error middleware) — smoke `/api/health` → 200
- [x] T011 [P] Frontend API plumbing: configure proxy `/api` in `frontend/vite.config.ts` + fetch wrapper `frontend/src/lib/api.ts` (credentials: include, errores tipados)
- [x] T012 [P] Base UI: copy shadcn/ui components (button, input, label, card) to `frontend/src/components/ui/` with project tokens per reglas §2 (tokens completos de `docs/DESIGN.md` en `frontend/src/index.css`)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Acceso con sesión y rol (Priority: P1) — MVP

**Goal**: Registro de clientes, login/cierre de sesión y navegación protegida por rol.

**Independent Test**: Una cuenta por cada rol ingresa a su pantalla; sin sesión o con otro rol el acceso se deniega; mensajes idénticos con/sin cuenta existente.

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

### Tests for User Story 1

- [x] T013 [P] [US1] Integration tests for register/login/me/logout in `backend/tests/integration/auth.test.ts` (201, 200+cookie, 401 genérico, 409, 403 dado de baja)
- [x] T014 [P] [US1] Unit tests for password hashing in `backend/tests/unit/password.test.ts` (hash no reversible, verify correcto/incorrecto)
- [x] T015 [P] [US1] Component test for login form in `frontend/src/pages/login/LoginPage.test.tsx` (errores claros, envío, redirección por rol)

### Implementation for User Story 1

- [x] T016 [P] [US1] Create `backend/src/utils/password.ts` (bcrypt cost ≥10: `hashPassword`, `verifyPassword`)
- [x] T017 [P] [US1] Create `backend/src/services/auth.service.ts` (register solo `alumno_docente`, login con mensaje genérico, logout, me) per `contracts/auth-api.md` — registro crea rol `usuario` (nombre real en BD)
- [x] T018 [P] [US1] Create `backend/src/middleware/auth.ts` (`requireAuth`, `requireRole`, verifica JWT + `activo`) + type augmentation `backend/src/types/express.d.ts`
- [x] T019 [US1] Create `backend/src/controllers/auth.controller.ts` + `backend/src/routes/auth.routes.ts` (POST register/login/logout, GET me, validación zod) and mount in `backend/src/app.ts`
- [x] T020 [US1] Create `frontend/src/App.tsx` router with `/login` + role-based redirects and `frontend/src/routes/ProtectedRoute.tsx` (guard sesión+rol)
- [x] T021 [US1] Create `frontend/src/pages/login/LoginPage.tsx` (formulario validado, mensaje claro sin revelar cuenta, redirección por rol)
- [x] T022 [US1] Create auth context in `frontend/src/lib/auth.tsx` (carga `me()` al iniciar, estado de sesión, logout)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Gestión de usuarios operativos (Priority: P2)

**Goal**: El administrador crea, edita y da de baja cajeros y cocineros desde `/admin`.

**Independent Test**: Crear un cajero desde `/admin`, loguearse con él, darlo de baja y verificar que se le deniega el acceso.

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

### Tests for User Story 2

- [x] T023 [P] [US2] Integration tests for admin CRUD in `backend/tests/integration/usuarios.test.ts` (POST 201, PATCH 200, estado 200 + login 403, 401/403 sin rol, 409 duplicado, sin `password_hash` en respuestas)

### Implementation for User Story 2

- [x] T024 [P] [US2] Create `backend/src/services/usuarios.service.ts` (listar operativos, crear, editar, estado lógico) per `contracts/usuarios-api.md`
- [x] T025 [US2] Create `backend/src/controllers/usuarios.controller.ts` + `backend/src/routes/usuarios.routes.ts` (all behind `requireRole('administrador')`)
- [x] T026 [US2] Create `frontend/src/pages/admin/UsuariosPage.tsx` (lista, formulario crear/editar, botón baja/reactivar, mensajes de éxito/error)
- [x] T027 [US2] Create `frontend/src/pages/admin/AdminLayout.tsx` (navegación del módulo admin) and wire `UsuariosPage` into `frontend/src/App.tsx` — ruta ajustada a `frontend/src/layouts/AdminLayout.tsx` + `RoleHeader` compartido

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Aplicación única con pantallas por rol (Priority: P3)

**Goal**: Las 6 rutas existen dentro de una sola app, con layouts por rol, responsive y sin enlaces a módulos de otros roles.

**Independent Test**: Navegar cada ruta con la sesión de su rol en móvil y computadora; la navegación solo muestra accesos del propio rol.

### Tests for User Story 3

- [x] T028 [P] [US3] Route guard tests in `frontend/src/routes/ProtectedRoute.test.tsx` (sin sesión → /login, otro rol → denegado, rol correcto → render)

### Implementation for User Story 3

- [x] T029 [P] [US3] Create role layouts: `frontend/src/pages/caja/CajaLayout.tsx`, `frontend/src/pages/cocina/CocinaLayout.tsx`, `frontend/src/pages/clientes/ClienteLayout.tsx` (placeholders navegables con aviso de sprint) — rutas ajustadas a `frontend/src/layouts/` (junto al `AdminLayout` de T027) con `RoleHeader` compartido
- [x] T030 [P] [US3] Create placeholders `frontend/src/pages/clientes/MenuPage.tsx` (aviso: Sprint 2) and `frontend/src/pages/clientes/MisPedidosPage.tsx` (aviso: Sprint 5) — rutas ajustadas a `pages/menu/` y `pages/pedidos/`; además esqueletos responsivos de caja/cocina con objetivos táctiles de 44 px (`size="touch"`) y colores de estado (`pages/caja/CajaPage.tsx`, `pages/cocina/CocinaPage.tsx`)
- [x] T031 [US3] Complete `frontend/src/App.tsx`: all 6 routes (`/login`, `/admin`, `/caja`, `/cocina`, `/menu`, `/mis-pedidos`) with role guards and login redirect map by role
- [x] T032 [US3] Responsive + tokens: setup Tailwind theme from `docs/DESIGN.md` in `frontend/src/index.css`, verify layouts in mobile/desktop, navigation shows only own-role links — tokens completos (colores, fuentes Plus Jakarta Sans/Inter, radios) y navegación por rol en cada layout

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T033 Security hardening: cookie flags (httpOnly/SameSite/Secure), no secrets in repo, uniform 401/403 messages, server-side validation review (FR-021…FR-024) — cookie `token` httpOnly+SameSite=Lax (+Secure en prod), `.env` fuera de git, mensajes 401 idénticos (test SC-S1-02), zod en todos los endpoints
- [x] T034 Validate `quickstart.md` end-to-end (migraciones → seed → dev → gates) — migración idempotente, seed idempotente, proxy `/api` + login 200 end-to-end, quickstart corregido a la realidad (BD `cafe_itsh`, `npm run migrate/seed`, Node LTS)
- [x] T035 Documentation: `backend/README.md` and `frontend/README.md` with commands (dev, test, typecheck)
- [x] T036 Run full gates: `npm test` + `npm run typecheck` + lint in `backend/` and `frontend/` (criterio del sprint) — backend 19/19 + lint/typecheck verdes; frontend 6/6 + lint/typecheck/build verdes
- [ ] T037 After demo approval: mark Sprint 1 completed in `docs/sprints.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 primero (P1); US2 y US3 pueden arrancar en paralelo si hay capacidad
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 (usa `requireRole` y sesión de admin), pero es testeable de forma independiente con su propia suite
- **User Story 3 (P3)**: Depende del router/guard de US1; layouts son archivos independientes

### Within Each User Story

- Tests written FIRST and failing before implementation (T013…T015, T023, T028)
- Utils/services before controllers/routes; guards before pages
- Story complete before moving to next priority

### Parallel Opportunities

- T001, T004, T005 en paralelo (archivos distintos)
- T011 y T012 en paralelo (frontend)
- T013, T014, T015 (tests de US1) en paralelo
- T016, T017, T018 (utils, service, middleware) en paralelo
- T029 y T030 (layouts US3) en paralelo
- Backend y frontend avanzan en paralelo cuando el contrato está definido

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: login por rol + rutas protegidas en verde
5. Demo parcial si está lista

### Incremental Delivery

1. Setup + Foundational → base lista
2. US1 (acceso por rol) → demo "login por rol y rutas protegidas"
3. US2 (gestión de usuarios) → demo "admin crea cajero y baja"
4. US3 (app completa por rol) → demo del sprint completo ante la patrocinadora
5. Polish → `npm test`/`typecheck` en verde → demo aprobada → marcar sprint en `docs/sprints.md`

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Commits pequeños y descriptivos por tarea o grupo lógico (reglas §21)
- Ninguna tarea agrega funcionalidad fuera del alcance del sprint (constitución I)
- Si una tarea revela un cambio de alcance, actualizar primero la spec 001 y `docs/reglas.md` (§27)
