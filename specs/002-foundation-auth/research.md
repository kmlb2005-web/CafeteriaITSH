# Phase 0 — Research: Fundamentos y Autenticación (Sprint 1)

**Feature**: `specs/002-foundation-auth` | **Date**: 2026-10-13
**Base**: constitución v1.0.0 y `docs/reglas.md`.

## R1 — Mecanismo de sesión (JWT)

**Contexto**: reglas §5 exige JWT para sesiones; la app es una sola web con
6 rutas protegidas y el token debe permitir verificar rol en cada
navegación.

**Decisión**: JWT firmado (HS256) con `JWT_SECRET` de entorno, expiración de
8 h, entregado al iniciar sesión y almacenado en **cookie `httpOnly`,
`SameSite=Lax`, `Secure` en producción**. El frontend obtiene el rol vía
`GET /api/auth/me`; el backend lo lee en middleware.

**Alternativas descartadas**:
- *Bearer en localStorage*: simple de leer desde JS pero expuesto a XSS;
  descartado por el principio de seguridad (II).
- *Sesiones propias en tabla*: requiere consultas por request y no cumple
  "utilizar JWT" (reglas §5).

**Consecuencias**: en desarrollo, el proxy de Vite evita problemas de
cross-origin (misma origen). Si en el futuro hubiera app móvil, se pasaría a
Bearer; fuera del alcance (spec: solo web).

## R2 — Hash de contraseñas

**Decisión**: **bcrypt** con costo ≥ 10 en Node (`bcrypt` o `bcryptjs` puro
JS). Comparación solo con `bcrypt.compare`; nunca `JSON.stringify` de la
contraseña; mensajes de login fallido idénticos con/sin cuenta existente
(SC-S1-02).

**Alternativas descartadas**: argon2id (mejor en teoría pero requiere
compilación nativa, complicando el despliegue gratuito); hash propio/SHA-256
(inseguro, descartado por constitución II).

## R3 — Acceso a MySQL sin ORM

**Decisión**: pool `mysql2/promise` + SQL parametrizado en repositorios
ligeros dentro de `services/` (reglas §4: "no utilizar ORMs innecesarios",
"librería de acceso adecuada").

**Alternativas descartadas**: Prisma/TypeORM/Sequelize (over-engineering
para 2 tablas, constitución IV); `mysql` (sin promesas/parametrizado
moderno).

## R4 — Migraciones

**Decisión**: archivos SQL numerados (`migrations/001_roles_usuarios.sql`) +
runner mínimo `scripts/migrate.mjs` que aplica pendientes en orden y registra
en una tabla `schema_migrations`.

**Alternativas descartadas**: Knex (mantiene DSL y roza el ORM), db-migrate
(dependencia poco mantenida y extra para 1 migración en este sprint).
Si el esquema crece más allá de ~10 migraciones, reconsiderar una
herramienta dedicada (queda documentado; no es el caso del MVP).

## R5 — Validación de entradas

**Decisión**: **zod** en el servidor (schemas compartibles) para login,
registro y gestión de usuarios; en el frontend, los mismos mensajes de
validación en formulario. Saneamiento de correo y longitudes.

**Alternativas descartadas**: `express-validator` (otra dependencia y estilo
distinto), validación manual (propensa a olvidos; reglas §14 exige validar
antes de persistir).

## R6 — Frontend: TypeScript + Tailwind + shadcn/ui + router

**Decisión**:
- Migrar el scaffold `.jsx` existente a **TypeScript estricto** (reglas §1).
- **React Router** (modo librería) con rutas anidadas por rol y un guard
  `ProtectedRoute` (rol requerido como prop).
- **Tailwind CSS** con Vite y componentes **shadcn/ui** copiados a
  `src/components/ui/` y personalizados (reglas §2); tokens de
  `docs/DESIGN.md` como base editable.
- Proxy `/api` en `vite.config.ts` para desarrollo sin CORS.

**Alternativas descartadas**: Next.js (SSR innecesario, otra arquitectura),
estado global (Redux/Zustand): el estado de sesión alcanza con el contexto
de React.

## R7 — Manejo de errores y respuestas

**Decisión**: middleware de error centralizado; errores con formato
`{ error: { code, message } }`, mensajes claros al usuario, logging en
servidor sin exponer detalles (reglas §15); códigos HTTP apropiados
(400 validación, 401 auth, 403 rol, 404, 409 conflicto de correo, 500
genérico).

## R8 — Estrategia de pruebas (sprint 1)

**Decisión**: **Vitest** en ambos proyectos (reglas §20). Backend:
integración con `supertest` (login/registro/autorización/gestión de
usuarios) + unitarias de hash. Frontend: componente de login y guard de
rutas con Testing Library. Gate: `npm test` y `npm run typecheck` en verde
(criterio del sprint). Cobertura mínima no exigida (reglas §20), pero las
rutas críticas de auth quedan cubiertas.

## R9 — Configuración y secretos

**Decisión**: `dotenv` solo en desarrollo; `config/env.ts` valida con zod la
presencia de `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`, `PORT` (reglas §23) y
falla al arrancar si faltan. `.env.example` versionado; `.env` en
`.gitignore` (reglas §21). `JWT_SECRET` con valor aleatorio fuerte en cada
entorno.

## R10 — Control de versiones

**Contexto**: el repositorio aún **no está inicializado como git** (verificado
2026-10-13), y reglas §21 exige Git con commits pequeños.

**Decisión**: `git init` en la Fase 1, `.gitignore` que excluye `.env`,
`node_modules/` y artefactos; commits por tarea/grupo de tareas. Repositorio
remoto: pendiente de definir con el equipo (no bloquea el sprint).

## R11 — Seed de cuentas operativas

**Decisión**: `backend/src/db/seed.ts` idempotente: inserta los 4 roles y
cuentas operativas iniciales (admin, cajero, cocinero) con contraseñas
definidas solo en variables de entorno o generadas en primera ejecución e
impresas una sola vez; jamás contraseñas hardcodeadas en el código.

## Resumen de dependencias resultantes

| Paquete | Lado | Justificación |
|---|---|---|
| express | backend | API REST exigida (reglas §3) |
| mysql2 | backend | acceso a MySQL (R3) |
| bcrypt | backend | hash de contraseñas (R2) |
| zod | backend (+mensajes en frontend) | validación (R5) |
| jsonwebtoken | backend | sesiones JWT (R1) |
| dotenv | backend | variables de entorno (R9) |
| react-router | frontend | rutas por rol (R6) |
| tailwindcss + shadcn/ui | frontend | diseño (reglas §2, R6) |
| vitest, supertest, @testing-library/react | dev | pruebas (R8) |
| typescript, tsx, eslint | dev | tipado estricto y lint (reglas §1, §18) |

Todas las dependencias son necesarias para el alcance del sprint; ninguna
duplica funcionalidad existente (constitución IV).
