# Implementation Plan: Fundamentos y Autenticación (Sprint 1)

**Branch**: `002-foundation-auth` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-foundation-auth/spec.md`

## Summary

Construir la base del sistema: esquema inicial de `roles` y `usuarios` en
MySQL con migraciones, API de autenticación (registro de clientes, inicio y
cierre de sesión) y autorización por rol, más el esqueleto de la aplicación
web única con pantallas protegidas por rol (`/login`, `/admin`, `/caja`,
`/cocina`, `/menu`, `/mis-pedidos`) y la gestión de usuarios operativos por
el administrador (US2). Enfoque técnico: backend Express en TypeScript con
acceso directo a MySQL (sin ORM), JWT de sesión en cookie `httpOnly`,
hash de contraseñas con bcrypt, validación con zod en servidor; frontend
React + TypeScript (Vite) con React Router, Tailwind CSS + shadcn/ui y
pruebas con Vitest (reglas §1, §2, §4, §5, §16, §20).

## Technical Context

**Language/Version**: TypeScript 5.x (tipado estricto en backend y frontend);
Node.js LTS (24.x) para backend.

**Primary Dependencies**: express, zod, bcrypt, mysql2, dotenv (backend);
react-router, tailwindcss + componentes shadcn/ui copiados (frontend).
Dev: typescript, tsx, vitest, supertest, eslint.

**Storage**: MySQL (reglas §4) vía pool `mysql2/promise` con SQL directo y
archivos de migración numerados en `migrations/`; sin ORM.

**Testing**: Vitest en backend (integración con supertest + unitarias) y
frontend (componentes con Testing Library); `tsc --noEmit` como gate de tipos.

**Target Platform**: Aplicación web responsiva (móvil y computadora) +
servidor Node; despliegue final en hosting gratuito/bajo costo.

**Project Type**: Web application (`backend/` + `frontend/`).

**Performance Goals**: login y consultas de autenticación sin esperas
perceptibles (p95 < 300 ms en local); mensajes de error inmediatos.

**Constraints**: sin secretos en el repositorio (`.env` ignorado, `.env.example`
publicado); contraseñas jamás en texto plano; validación en cliente y
servidor; comunicación cifrada en producción; rutas y API protegidas por rol.

**Scale/Scope**: 4 roles, decenas de usuarios operativos y cientos de
clientes (proyecto académico); 6 rutas de pantalla; alcance de 1 sprint
(2 semanas): solo auth, roles y gestión de usuarios operativos.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principio (constitución v1.0.0) | Verificación | Estado |
|---|---|---|---|
| I | Alcance del MVP primero (NON-NEGOTIABLE) | Solo auth, roles, layouts por rol y gestión de usuarios operativos; menú/pedidos/pagos/notificaciones fuera de este sprint (Out of Scope del spec) | ✅ PASS |
| II | Seguridad de la Información (NON-NEGOTIABLE) | bcrypt (nunca texto plano), secretos en variables de entorno y fuera del repo, HTTPS en producción, validación y sanitización de datos, mensajes sin filtrar información interna | ✅ PASS |
| III | Aplicación Única con Acceso por Rol (NON-NEGOTIABLE) | Una sola app con las 6 rutas protegidas; redirección y denegación por rol verificable en la spec (US1, US3) | ✅ PASS |
| IV | Simplicidad y Mantenibilidad | TypeScript estricto, sin ORM ni capas extras, dependencias mínimas justificadas (research.md R2, R3, R6), `camelCase`/`PascalCase`, estructura por funcionalidad | ✅ PASS |
| V | Fiabilidad y Rendimiento en Receso | Responsividad incluida desde el inicio; 44 px de área táctil aplica a caja/cocina (sprints 4); validación y mensajes claros desde la base | ✅ PASS |

**Gate result**: PASS — sin violaciones que justificar. Re-check tras Phase 1
(diseño): sin cambios de alcance; data-model y contratos limitados a
`roles`/`usuarios` y a los endpoints de auth/usuarios del spec.

## Project Structure

### Documentation (this feature)

```text
specs/002-foundation-auth/
├── plan.md              # Este archivo (/speckit.plan)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── auth-api.md
│   └── usuarios-api.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── server.ts              # entry point (http)
│   ├── app.ts                 # Express app + montado de rutas
│   ├── config/env.ts          # carga y valida variables de entorno
│   ├── db/pool.ts             # pool mysql2/promise
│   ├── db/seed.ts             # seed de roles + cuentas operativas
│   ├── middleware/auth.ts     # requireAuth / requireRole
│   ├── middleware/error.ts    # manejo centralizado de errores
│   ├── routes/auth.routes.ts
│   ├── routes/usuarios.routes.ts
│   ├── controllers/auth.controller.ts
│   ├── controllers/usuarios.controller.ts
│   ├── services/auth.service.ts
│   ├── services/usuarios.service.ts
│   ├── utils/password.ts      # hash/verify (bcrypt)
│   └── types/express.d.ts     # augmento: req.user
├── tests/
│   ├── unit/password.test.ts
│   └── integration/
│       ├── auth.test.ts
│       └── usuarios.test.ts
├── tsconfig.json
├── vitest.config.ts
└── .env.example

frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx                    # React Router: rutas por rol
│   ├── routes/ProtectedRoute.tsx  # guard de sesión + rol
│   ├── lib/api.ts                 # fetch wrapper (credentials: include)
│   ├── lib/utils.ts               # cn() para clases
│   ├── components/ui/             # componentes shadcn/ui copiados
│   ├── pages/login/LoginPage.tsx
│   ├── pages/admin/AdminLayout.tsx
│   ├── pages/admin/UsuariosPage.tsx
│   ├── pages/caja/CajaLayout.tsx
│   ├── pages/cocina/CocinaLayout.tsx
│   ├── pages/clientes/ClienteLayout.tsx
│   ├── pages/clientes/MenuPage.tsx        # placeholder hasta Sprint 2
│   └── pages/clientes/MisPedidosPage.tsx  # placeholder hasta Sprint 5
├── src/pages/login/LoginPage.test.tsx
├── vite.config.ts               # proxy /api → backend local
├── tsconfig.json
└── index.html

migrations/
└── 001_roles_usuarios.sql       # esquema inicial (migración 1)

scripts/                         # (si se necesita runner de migraciones)
└── migrate.mjs                  # aplica migrations/*.sql en orden
```

**Structure Decision**: Web application (opción 2 del template): separación
`backend/` + `frontend/` ya existente en el repo y exigida por reglas §17.
Desviaciones menores documentadas: (a) las migraciones viven en `migrations/`
(raíz, carpeta ya existente y vacía) en lugar de `database/`, con un runner
ligero `scripts/migrate.mjs`; (b) las pruebas viven dentro de cada proyecto
(`backend/tests/`, `frontend/src/**`) para que `npm test` funcione por
paquete como exige el criterio de aceptación del sprint. Frontend actual
(`.jsx`) se migra a TypeScript estricto en la Fase 1.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones de la constitución; tabla vacía.
