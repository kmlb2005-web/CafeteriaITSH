# Contract — API de Autenticación (Sprint 1)

**Base**: `specs/002-foundation-auth/spec.md` (FR-001…FR-003, FR-005,
FR-021…FR-024) · **Auth**: cookie JWT `httpOnly` (research R1).

Convenciones:
- JSON en request/response; `Content-Type: application/json`.
- Errores con forma `{ "error": { "code": "...", "message": "..." } }`;
  mensajes claros, sin información interna (FR-022).
- La sesión se transmite en la cookie `token` (`httpOnly`, `SameSite=Lax`,
  `Secure` en producción); el cliente no manipula el token.

## POST /api/auth/register — registro de cliente (alumno/docente)

Solo crea cuentas de rol `alumno_docente` (FR-005). No acepta campo `rol`.

Request:

```json
{ "nombre": "Ana López", "correo": "ana@alumno.itsh.mx", "password": "mínimo 8 caracteres" }
```

Respuesta `201`:

```json
{ "id": 12, "nombre": "Ana López", "correo": "ana@alumno.itsh.mx", "rol": "alumno_docente" }
```

Errores:
- `400` validación (correo inválido, contraseña corta, nombre vacío).
- `409` correo ya registrado (mensaje genérico, sin revelar más datos).

## POST /api/auth/login

Request:

```json
{ "correo": "ana@alumno.itsh.mx", "password": "..." }
```

Respuesta `200` (cookie `token` seteada):

```json
{ "id": 12, "nombre": "Ana López", "correo": "ana@alumno.itsh.mx", "rol": "alumno_docente" }
```

Errores:
- `400` validación.
- `401` credenciales inválidas **con mensaje idéntico** exista o no la
  cuenta (SC-S1-02) y sin revelar el estado de la cuenta.
- `403` cuenta dada de baja (`activo = 0`) — mensaje claro de cuenta
  deshabilitada.

## POST /api/auth/logout

Cierra la sesión (borra la cookie). Respuesta `204`. No requiere
autenticación válida.

## GET /api/auth/me

Devuelve el usuario de la sesión actual; usado por el frontend para conocer
rol y pintar la navegación.

Respuesta `200`:

```json
{ "id": 12, "nombre": "Ana López", "correo": "ana@alumno.itsh.mx", "rol": "alumno_docente", "activo": true }
```

Errores:
- `401` sin sesión o token expirado/inválido (el frontend redirige a
  `/login`).

## Reglas transversales

- Todo cambio de estado de sesión se refleja en la siguiente petición
  (verificación por request del JWT).
- En producción, todo el tráfico va por canal cifrado (FR-024).
- Los datos se validan en servidor con zod (FR-021) además del frontend.
