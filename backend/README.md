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

## API

- `POST /api/auth/register` — registro de clientes
- `POST /api/auth/login` — inicia sesión (cookie `token` httpOnly)
- `POST /api/auth/logout` — cierra sesión
- `GET  /api/auth/me` — usuario en sesión
- `GET|POST /api/usuarios`, `PATCH /api/usuarios/:id[...]` — gestión
  (solo administrador)
- `GET  /api/menu?fecha=` — consulta del menú del día (cualquier sesión)
- `POST /api/pedidos` — crear pedido anticipado ≥10 min (rol `usuario`)
- `GET  /api/pedidos` — mis pedidos con el estado vigente (Sprint 5;
  reintentan el aviso de pedido listo los pedidos `Listo`)
- `GET  /api/pedidos/:id` — detalle del pedido propio (ajeno → 404)
- `POST /api/pedidos/:id/pago` — confirmar pago (adaptador simulado, sin
  datos de tarjeta; `Pendiente → Pagado` solo con pago confirmado)
- `GET|POST /api/admin/platillos`, `PATCH /api/admin/platillos/:id` —
  catálogo (solo administrador)
- `GET|PUT /api/admin/menu`, `DELETE /api/admin/menu/:id` — publicar el
  menú del día: alta/edición (upsert) y quitar renglones (solo administrador)
- `POST /api/caja/pedidos` — capturar pedido de mostrador (solo cajero;
  sin regla de 10 minutos, solo menú de hoy)
- `POST /api/caja/pedidos/:id/pago` — cobrar en efectivo (`FOR UPDATE`, un
  solo cobro por pedido)
- `GET  /api/caja/pedidos/listos` — pedidos `Listo` para entregar
- `POST /api/caja/pedidos/:id/estado` — entregar (`Entregado`) o cancelar
  (`Cancelado`), validado contra `transicion_estado`
- `GET  /api/cocina/pedidos` — KDS: pedidos activos (`Pagado`, `En
  preparación`, `Listo`) de ambos orígenes ordenados por llegada (solo
  cocinero)
- `POST /api/cocina/pedidos/:id/estado` — `En preparación` / `Listo` con
  bitácora en `pedido_estado_historial`
- `GET  /api/health` — salud del servicio

Los cambios de estado se validan contra la tabla `transicion_estado` (flujo
`Pendiente → Pagado → En preparación → Listo → Entregado` + cancelaciones);
los terminales (`Entregado`, `Cancelado`) no tienen transiciones salientes y
responden `409 transicion_invalida`. Errores con formato
`{ "error": { "code", "message" } }` (reglas §15).

## Despliegue y configuración por entorno (FR-026)

Configuraciones **separadas de desarrollo y producción**; las variables se
declaran en `src/config/env.ts` (zod) y su plantilla es `.env.example`:

- **Desarrollo**: `backend/.env` con `NODE_ENV=development` y
  `npm run dev`. Los adaptadores de pago (`services/pasarela.ts`) y de correo
  (`services/correo.ts`) están **simulados** (sin red real);
  `SIMULAR_FALLO_CORREO=true` solo sirve para demostrar el fallo y reintento
  del aviso de pedido listo.
- **Producción**: variables en el hosting con `NODE_ENV=production` y valores
  propios de cada entorno:
  - `JWT_SECRET` aleatorio y fuerte, distinto al de desarrollo.
  - `DATABASE_URL` de una instancia MySQL 8 administrada (p. ej. Railway,
    Aiven o Clever Cloud); aplicar `npm run migrate && npm run seed` una vez.
  - `SIMULAR_FALLO_CORREO=false`; al contratar proveedores reales se
    sustituyen `services/pasarela.ts` y `services/correo.ts` sin tocar el
    resto de la lógica.
- Hosting de bajo costo con Node LTS (Railway, Render, Fly.io): arranque con
  `npm run build && npm start`. HTTPS obligatorio en producción (reglas §13)
  y `.env` jamás se versiona (§21).
- Salud: `GET /api/health` para el chequeo del hosting.
