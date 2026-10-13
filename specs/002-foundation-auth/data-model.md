# Phase 1 — Data Model: Fundamentos y Autenticación (Sprint 1)

**Feature**: `specs/002-foundation-auth` | **Date**: 2026-10-13
**Alcance**: solo entidades de este sprint (Usuario y Rol); Platillo, Menú,
Pedido, Pago y Notificación se modelan en sus sprints correspondientes.

## Diagrama de entidades (texto)

```text
roles 1 ──── N usuarios
```

## Tablas

### `roles`

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INT AUTO_INCREMENT | PK | Identificador del rol |
| `nombre` | VARCHAR(30) | UNIQUE NOT NULL | `administrador`, `cajero`, `cocinero`, `alumno_docente` |

Semilla: 4 filas (los valores son fijos; no se crean ni borran en runtime).

### `usuarios`

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INT AUTO_INCREMENT | PK | Identificador del usuario |
| `nombre` | VARCHAR(100) | NOT NULL | Nombre completo |
| `correo` | VARCHAR(160) | UNIQUE NOT NULL | Correo en minúsculas; usado como identificador de login |
| `password_hash` | VARCHAR(255) | NOT NULL | Hash bcrypt; jamás texto plano (constitución II) |
| `rol_id` | INT | NOT NULL, FK → roles.id | Rol del usuario |
| `activo` | TINYINT(1) | NOT NULL DEFAULT 1 | Baja lógica: `0` = dado de baja, no puede iniciar sesión |
| `creado_en` | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Alta |
| `actualizado_en` | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Última modificación |

Índices/unicidad:
- `UNIQUE(correo)` — evita cuentas duplicadas (US2, escenario 4).
- `INDEX(rol_id)` — filtrado por rol del administrador.

## Reglas de negocio aplicadas al modelo

- **Baja lógica, no borrado**: un usuario dado de baja conserva sus datos y
  solo se le deniega el login (`activo = 0`); cumpliendo FR-004 sin perder
  historial (los sprints siguientes lo referenciarán como autor de pedidos).
- **Clientes también son `usuarios`**: el registro propio (FR-005) crea
  filas con `rol_id = alumno_docente`; la API de registro no acepta rol
  desde el cliente (no puede auto-asignarse rol operativo) — refuerzo de
  FR-003.
- **Correo normalizado**: se guarda y compara en minúsculas para evitar
  duplicados por mayúsculas.
- **Sin campos de sesión**: la sesión vive en la cookie JWT (research R1); no
  hay tabla de sesiones en este sprint.

## Seed (idempotente)

Ejecutado por `backend/src/db/seed.ts`:

1. `roles`: 4 filas (`administrador`, `cajero`, `cocinero`, `alumno_docente`).
2. Cuentas operativas iniciales (solo si no existen): administrador, cajero
   y cocinero. Las contraseñas provienen de variables de entorno
   (`SEED_ADMIN_PASSWORD`, `SEED_CAJERO_PASSWORD`, `SEED_COCINERO_PASSWORD`)
   o se generan aleatoriamente y se imprimen una sola vez en consola — nunca
   en el código (reglas §21, §23).

## Migración 1

`migrations/001_roles_usuarios.sql`: crea `roles`, `usuarios`, índices y
semilla de roles. Aplicada por `scripts/migrate.mjs` en orden numérico y
registrada en `schema_migrations` (research R4).

## Decisiones pendientes fuera de este sprint

- Entidades de menú/pedidos/pagos/notificaciones (Sprints 2–5).
- Tabla de auditoría de usuarios (no requerida por la spec; se evaluaría si
  el alcance lo pide).
