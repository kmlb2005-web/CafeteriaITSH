# AGENTS.md

Proyecto académico: Sistema de Pedidos Anticipados — Cafetería ITSH.
App única con rutas por rol (`/admin`, `/caja`, `/cocina`, `/menu`, `/mis-pedidos`).

## Estructura

- Dos paquetes npm **independentes** (no hay root package.json ni workspaces):
  `backend/` (Express + TS + MySQL) y `frontend/` (React + Vite + Tailwind v4).
  Todos los comandos npm se ejecutan **dentro de la carpeta correspondiente**.
- `migrations/` — SQL nuevo de esquema (vacío a propósito; ver Migraciones).
- `specs/00N-*/` — specs por sprint (speckit). `docs/` — reglas, SQL baseline.
  `design/` — documentos de diseño UI/UX por rol (operativo, cocina, cliente).
- Código, comentarios, mensajes al usuario y docs están **en español**; mantener ese idioma.

## Comandos (por paquete)

| | `backend/` | `frontend/` |
|---|---|---|
| dev | `npm run dev` (puerto 3000) | `npm run dev` (5173, proxy `/api` → 3000) |
| test | `npm test` (`vitest run`) | `npm test` |
| tipos | `npm run typecheck` | `npm run typecheck` |
| lint | `npm run lint` | `npm run lint` |

Verificación antes de dar por terminada una tarea: `npm run lint && npm run typecheck && npm test`
dentro de cada paquete que hayas tocado. No existe CI ni pre-commit; esto es la verificación.

Test único: `npx vitest run tests/integration/auth.test.ts` (backend) o
`npx vitest run src/routes/ProtectedRoute.test.tsx` (frontend).

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

- El esquema baseline (`docs/001_crear_esquema.sql` + `docs/002_seed_inicial.sql`) ya está
  registrado por `backend/scripts/migrate.mjs`; **no recrearlo ni migrarlo a mano**.
- Todo cambio de esquema nuevo: archivo `migrations/NN_nombre_descriptivo.sql` y
  `cd backend && npm run migrate`. Antes leer `migrations/README.md` — varias tablas
  (ej. `platillo`, `menu_dia`) ya existen en el baseline y no requieren migración.

## Flujo speckit (specs)

- Ciclo por sprint documentado en `docs/sprints.md`: spec → `/speckit.plan` →
  `/speckit.tasks` → implementar siguiendo `tasks.md` (checkboxes) con tests.
- Feature activa en `.specify/feature.json` (hoy: `specs/003-menu-management`, Sprint 2).
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
