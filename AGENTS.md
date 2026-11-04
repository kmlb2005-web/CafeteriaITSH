# AGENTS.md

Proyecto académico: Sistema de Pedidos Anticipados — Cafetería ITSH.
App única con rutas por rol (`/admin`, `/caja`, `/cocina`, `/menu`, `/mis-pedidos`).

## Estructura

- Dos paquetes npm **independentes** (no hay root package.json ni workspaces):
  `backend/` (Express + TS + MySQL) y `frontend/` (React + Vite + Tailwind v4).
  Todos los comandos npm se ejecutan **dentro de la carpeta correspondiente**.
- `migrations/` — SQL de esquema y baseline (001 esquema, 002 seed, 001 pago).
  `specs/00N-*/` — specs por sprint (speckit). `docs/` — reglas, evidencias de calidad
  (`Matriz_de_calidad.md`, `Requerimientos_MVP.md`).
  `design/` — documentos de diseño UI/UX por rol (operativo, cocina, cliente).
- Código, comentarios, mensajes al usuario y docs están **en español**; mantener ese idioma.

## Comandos (por paquete)

| | `backend/` | `frontend/` |
|---|---|---|
| dev | `npm run dev` (puerto 3000) | `npm run dev` (5173, proxy `/api` → 3000) |
| test | `npm test` (`vitest run`) | `npm test` |
| tipos | `npm run typecheck` | `npm run typecheck` |
| lint | `npm run lint` | `npm run lint` |

**Verificación de calidad (obligatoria antes de dar por terminada una tarea)**:

- Gate único en la raíz: `node scripts/verify.mjs` — corre `npm run verify`
  (lint → typecheck → pruebas) en `backend/` y `frontend/` y falla si alguno falla.
- Por paquete: `cd <paquete> && npm run verify`.
- **CI**: `.github/workflows/ci.yml` corre en cada PR y en cada push a `main`
  y a `spec/**` (3 jobs: chequeo de `.env` versionado, frontend, backend con
  migrate + seed). Un PR no debe integrarse con el CI en rojo.
  Mientras la cuenta de GitHub esté bloqueada por facturación, el CI corre en
  el runner self-hosted local `cafeteria-itsh-win`
  (`C:\Users\tsssb\cafeteria-runner`, arrancarlo con `iniciar-runner.ps1`;
  usa MySQL de la máquina y las variables de `runner/.env`, nunca del repo).
- Conteo a 2026-11-03: **31 archivos de prueba / 191 pruebas** (backend 11/99,
  frontend 20/92). Prueba aislada: `npx vitest run tests/integration/auth.test.ts`
  (backend) o `npx vitest run src/routes/ProtectedRoute.test.tsx` (frontend).
- Estado de requisitos y defectos: `docs/Matriz_de_calidad.md`; roadmap de
  calidad por rol en `docs/sprints.md` (sprints 6–11).

## Backend — gotchas

- **Requiere MySQL 8 vivo + `backend/.env`** (copiar de `.env.example`). Sin él, `env.ts`
  hace `process.exit(1)` al importar: los tests de integración y `npm run dev` fallan en el arranque.
- Setup de BD: `docs/ejecutar-migraciones.md` (DB `cafe_itsh`, usuario `cafe_admin`).
  Después: `npm run migrate` (idempotente) y `npm run seed` (roles/cuentas operativas).
- Tests de integración comparten la BD y corren **en serie** (`fileParallelism: false`,
  timeout 20 s): no paralelizarlos a mano ni dejar datos sucios. Crea registros con
  correo `test-*@example.com` y bórralos en `afterAll` (patrón de `tests/integration/`).
- ESM con `module: NodeNext`: los imports TS entre sí llevan extensión **`.js`**
  (`import { crearApp } from './app.js'`). `tsconfig` es strict + `noUncheckedIndexedAccess`.
- Estructura por capas: `routes/ → controllers/ → services/`, validación con **zod** en
  controllers, autorización con `requireAuth`/`requireRole` en `middleware/`. Enrutar en
  `src/app.ts`. Sin ORM (mysql2 query directa).
- Respuestas de error con formato exacto `{ "error": { "code", "message" } }`; nunca
  exponer stack traces ni info interna (reglas §15). Nuevas variables de entorno →
  agregar a `src/config/env.ts` (zod) y a `.env.example`.

## Migraciones

- El esquema baseline (`migrations/001_crear_esquema.sql` + `migrations/002_seed_inicial.sql`)
  se aplica con `npm run migrate` (idempotente); **no recrearlo ni migrarlo a mano**.
- Todo cambio de esquema nuevo: archivo `migrations/NN_nombre_descriptivo.sql` y
  `cd backend && npm run migrate`. Antes leer `migrations/README.md` — varias tablas
  (ej. `platillo`, `menu_dia`) ya existen en el baseline y no requieren migración.

## Flujo speckit (specs)

- Ciclo por sprint documentado en `docs/sprints.md`: spec → `/speckit.plan` →
  `/speckit.tasks` → implementar siguiendo `tasks.md` (checkboxes) con tests.
- Feature activa en `.specify/feature.json` (hoy: `specs/008-qa-foundation`, Sprint 6).
  Comandos speckit en `.opencode/commands/speckit.*.md`.
- Al implementar, seguir el `tasks.md` de la feature activa: sus IDs (T001, US1, R1…)
  son la referencia de trazabilidad con `plan.md`, `research.md` y `contracts/`.

## Reglas del proyecto (no negociables)

Fuente: `docs/reglas.md` (30 reglas) consolidada en `.specify/memory/constitution.md`.
Lo esencial que un agente rompería sin leer:

- **Alcance MVP cerrado**: nada fuera del alcance sin aprobación previa (constitución §I).
- Seguridad: contraseñas solo bcrypt, secretos solo en `.env` (nunca commiteados),
  JWT + roles, HTTPS en producción, sin datos de tarjetas.
- Frontend: una sola app (no múltiples apps), rutas protegidas por sesión+rol en UI y API,
  Tailwind + componentes estilo shadcn/ui, botones táctiles ≥44 px en caja/cocina.
- Sin ORM ni dependencias nuevas sin justificar; preferir soluciones con lo existente.
- Pedidos anticipados: mínimo **10 minutos** de anticipación; estados mínimos
  `Pendiente, Pagado, En preparación, Listo, Entregado, Cancelado`.
