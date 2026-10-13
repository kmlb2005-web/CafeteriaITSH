# Quickstart — Fundamentos y Autenticación (Sprint 1)

**Feature**: `specs/002-foundation-auth` | **Date**: 2026-10-13
Valida el plan de forma local antes de la demo del sprint.

## Requisitos previos

- Node.js LTS (validado con 20.20.2) y npm.
- MySQL 8 corriendo localmente (o instancia accesible).
- Git (el repo se inicializa en la Fase 1 si aún no existe).

## 1. Variables de entorno

```bash
cp backend/.env.example backend/.env
# editar: DATABASE_URL, JWT_SECRET (valor aleatorio fuerte),
#         PORT, NODE_ENV, credenciales de seed
```

`.env` NUNCA se versiona (reglas §21); `.env.example` sí.

## 2. Base de datos

La base `cafe_itsh` con su esquema y seed inicial ya existen (ver
`docs/ejecutar-migraciones.md` para recrearlas desde cero). El runner de
migraciones registra esos scripts como baseline en su primera corrida:

```bash
# aplica migrations/*.sql pendientes (idempotente)
cd backend && npm run migrate

# seed idempotente: asegura los 4 roles + cuentas operativas
# (imprime contraseñas generadas solo si no existían)
npm run seed
```

## 3. Correr en desarrollo

```bash
# backend (puerto 3000 por defecto)
cd backend && npm install && npm run dev

# frontend (puerto 5173, proxy /api → backend)
cd frontend && npm install && npm run dev
```

Abrir `http://localhost:5173/login`.

## 4. Verificación rápida (manual)

1. Login con la cuenta seed de **administrador** → redirige a `/admin`.
2. Login como **cajero** → redirige a `/caja`; intentar abrir `/admin` en la
   barra de direcciones → denegado.
3. Abrir `/menu` sin sesión → redirige a `/login`.
4. Registrar un alumno/docente nuevo → puede entrar a `/menu`.
5. Desde `/admin`, crear un cajero, editarlo y darlo de baja → su login se
   deniega con mensaje claro.
6. Login con contraseña incorrecta → mensaje idéntico al de una cuenta
   inexistente.

## 5. Gates de calidad (criterio del sprint)

```bash
cd backend  && npm test && npm run typecheck && npm run lint
cd frontend && npm test && npm run typecheck && npm run lint
```

Todos los comandos deben terminar en verde antes de la demo.

## 6. Demo del sprint

Validar con la patrocinadora los criterios de `docs/sprints.md` Sprint 1:
login por rol, rutas protegidas, mensajes sin filtrar existencia de cuenta,
contraseñas nunca en texto plano, `npm test` y `npm run typecheck` en verde.
