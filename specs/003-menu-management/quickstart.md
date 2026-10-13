# Quickstart — Gestión de Menú (Sprint 2)

**Feature**: `specs/003-menu-management` | **Date**: 2026-10-13
Valida el plan de forma local antes de la demo del sprint.

## Requisitos previos

- Sprint 1 operativo: `.env` configurado, BD `cafe_itsh`, cuentas seed.
- Node.js LTS y MySQL 8 (ver `specs/002-foundation-auth/quickstart.md`).

## 1. Base de datos y seed

```bash
cd backend
npm run migrate   # sin pendientes: esquema baseline ya registrado
npm run seed      # asegura roles, cuentas y el MENÚ DE HOY (idempotente)
```

## 2. Correr en desarrollo

```bash
cd backend && npm run dev    # :3000
cd frontend && npm run dev   # :5173 (proxy /api)
```

## 3. Verificación manual

**Como administrador** (`admin@itsh.mx` / `AdminDev!2026`):

1. Ir a **Admin → Platillos**: crear un platillo nuevo, editarlo, desactivarlo.
2. Ir a **Admin → Menú del día** (fecha de hoy): agregar un platillo con
   precio; cambiarle el precio; marcarlo **no disponible** y marcar otro como
   **especial del día**; quitar uno del menú.
3. Intentar abrir un endpoint `/api/admin/...` con otro rol (o en ventana
   anónima) → 403 / acceso denegado.

**Como cliente** (registrarse desde "Regístrate"):

4. Ir a `/menu`: ver platillos, precios, badge de **Especial del día** y los
   **No disponibles** identificados.
5. Volver desde el admin tras un cambio de precio → el cliente ve el precio
   nuevo al recargar la pantalla (cambio inmediato, sin recargar datos
   obsoletos).
6. En móvil (o ventana estrecha): el menú se ve completo y legible.

**Casos borde**:

7. Borrar el menú del día (quitar todos los platillos) → el cliente ve
   "Menú no disponible hoy".
8. Apagar el backend → el cliente ve mensaje claro de reintento con botón
   Reintentar (sin trazas).

## 4. Gates de calidad

```bash
cd backend  && npm test && npm run typecheck && npm run lint
cd frontend && npm test && npm run typecheck && npm run lint
```

Todos en verde antes de la demo.

## 5. Demo del sprint

Criterios de `docs/sprints.md` Sprint 2: platillo no disponible identificado y
no seleccionable; cambios de precio/disponibilidad reflejados de inmediato en
`/menu`; consulta sin esperas perceptibles en móvil.
