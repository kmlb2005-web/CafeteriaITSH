# Backend — API del Sistema de Pedidos Anticipados (Cafetería ITSH)

API REST en Express + TypeScript (Node LTS), MySQL 8 sin ORM, sesiones en
cookie httpOnly con JWT y contraseñas con bcrypt.

## Requisitos

- Node.js LTS y npm.
- MySQL 8 accesible (ver `docs/ejecutar-migraciones.md`).
- `backend/.env` copiado desde `backend/.env.example` (nunca se versiona).

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor en desarrollo con recarga (puerto 3000) |
| `npm test` | Tests con Vitest (unitarios + integración) |
| `npm run typecheck` | Chequeo de tipos (`tsc --noEmit`, strict) |
| `npm run lint` | ESLint (flat config) |
| `npm run migrate` | Aplica `migrations/*.sql` pendientes (idempotente) |
| `npm run seed` | Asegura roles y cuentas operativas (idempotente) |
| `npm run build` | Compila a `dist/` |
| `npm start` | Ejecuta la build (`dist/src/server.js`) |

## Estructura

```
src/
  config/env.ts      # variables de entorno validadas con zod
  db/                # pool mysql2 + seed
  services/          # lógica de negocio (auth, usuarios)
  controllers/       # handlers HTTP (validación con zod)
  routes/            # rutas Express montadas en app.ts
  middleware/        # requireAuth/requireRole y manejo de errores
  utils/             # cookies, http, password (bcrypt)
  types/             # tipos de dominio + augmentación de Express
tests/
  unit/              # pruebas de utilidades
  integration/       # pruebas de API con supertest
scripts/migrate.mjs  # runner de migraciones
```

## API (Sprint 1)

- `POST /api/auth/register` — registro de clientes
- `POST /api/auth/login` — inicia sesión (cookie `token` httpOnly)
- `POST /api/auth/logout` — cierra sesión
- `GET  /api/auth/me` — usuario en sesión
- `GET|POST /api/usuarios`, `PATCH /api/usuarios/:id[...]` — gestión
  (solo administrador)
- `GET  /api/health` — salud del servicio

Errores con formato `{ "error": { "code", "message" } }` (reglas §15).
