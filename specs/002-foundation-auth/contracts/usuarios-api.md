# Contract — API de Gestión de Usuarios (Sprint 1)

**Base**: `specs/002-foundation-auth/spec.md` (FR-002…FR-004, FR-021…FR-022)
· **Acceso**: solo sesión con rol `administrador` (FR-003).

Convenciones: mismo formato de errores que
[auth-api.md](./auth-api.md) (`{ "error": { "code", "message" } }`).

## GET /api/usuarios?rol=cajero,cocinero

Lista usuarios operativos del sistema (cajeros y cocineros; opcionalmente
filtrada por rol). Nunca expone `password_hash`.

Respuesta `200`:

```json
[
  { "id": 3, "nombre": "Luis Pérez", "correo": "luis@itsh.mx",
    "rol": "cajero", "activo": true },
  { "id": 4, "nombre": "María Ruiz", "correo": "maria@itsh.mx",
    "rol": "cocinero", "activo": false }
]
```

Errores: `401` sin sesión · `403` rol distinto de administrador.

## POST /api/usuarios

Crea un usuario operativo (solo `rol` ∈ {`cajero`, `cocinero`}; un
administrador no se crea por esta vía).

Request:

```json
{ "nombre": "Luis Pérez", "correo": "luis@itsh.mx",
  "password": "...", "rol": "cajero" }
```

Respuesta `201`: objeto del usuario creado (sin `password_hash`).
Errores: `400` validación (rol no permitido incluido) · `401` · `403` ·
`409` correo duplicado.

## PATCH /api/usuarios/:id

Edita `nombre` y/o `correo` de un usuario operativo.

Request (parcial): `{ "nombre": "Luis P.", "correo": "luis.nuevo@itsh.mx" }`
Respuesta `200`: usuario actualizado.
Errores: `400` · `401` · `403` · `404` id inexistente · `409` correo tomado.

## PATCH /api/usuarios/:id/estado

Baja o reactivación lógica (FR-004).

Request: `{ "activo": false }`
Respuesta `200`: `{ "id": 3, "activo": false }`

Efecto: con `activo = false`, el siguiente intento de login de ese usuario
recibe `403` y sus sesiones vigentes dejan de ser válidas (verificación por
request incluye `activo`).

Errores: `400` · `401` · `403` (rol) · `404`.

## Escenarios de aceptación cubiertos

- US2.1 → `POST /api/usuarios` + login del nuevo usuario.
- US2.2 → `PATCH /api/usuarios/:id`.
- US2.3 → `PATCH /api/usuarios/:id/estado` + login `403`.
- US2.4 → `409` en `POST`.
- US2.5 → `401/403` en todos los endpoints sin sesión o sin rol admin.
