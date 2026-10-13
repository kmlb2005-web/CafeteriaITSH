# Quickstart — Pedido Anticipado y Pago (Sprint 3)

**Feature**: `specs/004-advance-orders-payment` | **Date**: 2026-10-13
Valida el plan de forma local antes de la demo del sprint.

## Requisitos previos

- Sprints 1–2 operativos: `.env` configurado, BD `cafe_itsh`, cuentas seed,
  menú de hoy cargado (ver `specs/003-menu-management/quickstart.md`).
- Node.js LTS y MySQL 8.

## 1. Migración, seed y servidores

```bash
cd backend
npm run migrate   # aplica migrations/001_pago_estado.sql (pago.estado)
npm run seed      # idempotente (asegura menú de hoy)
npm run dev       # :3000
cd ../frontend && npm run dev   # :5173
```

## 2. Verificación manual (objetivo: < 3 minutos, SC-S3-02)

**Como cliente** (registrarse en `/registro` si hace falta):

1. `/menu` → agregar 2 platillos con cantidades (los **No disponibles** no
   muestran botón de agregar) → badge del carrito con total → **Revisar
   pedido**.
2. `/pedido/confirmar` → ver partidas y **total antes de confirmar**
   (FR-010); elegir hora de recolección a < 10 min → error claro **sin** llamada
   al servidor; elegir hora válida → **Confirmar pedido** → folio `PED-…`.
3. `/pedido/:id/pago` → **Pagar** (pago simulado, sin tarjeta) → quedar en
   confirmación con estado **Pagado** y referencia `REF-…`.
4. Caso borde: activar **Simular rechazo (demo)** → mensaje claro, el pedido
   queda **Pendiente**; reintentar → **Pagado** sin cobro duplicado.
5. Recargar la confirmación → el estado mostrado sigue siendo el real (US2).
6. Intentar abrir la confirmación de un pedido de otra cuenta → 404/acceso
   denegado (US2.2).

**Como administrador** (para el paso 7): en `/admin/menu` marcar un platillo
como **No disponible** → el cliente ya no puede seleccionarlo (US1.3).

## 3. Casos borde adicionales

- Poco antes de la hora límite: confirmar de nuevo → el servidor rechaza
  (`anticipacion_insuficiente`) y la selección del carrito sigue intacta.
- Menú vacío → aviso y no se puede crear pedido.
- Apagar el backend durante el pago → mensaje de reintento; al volver, el
  estado real del pedido (sin duplicados).

## 4. Gates de calidad

```bash
cd backend  && npm run lint && npm run typecheck && npm test
cd frontend && npm run lint && npm run typecheck && npm test
```

Todos en verde antes de la demo.

## 5. Demo del sprint

Criterios de `docs/sprints.md` Sprint 3: sin pedido con <10 minutos; sin
`Pagado` sin pago confirmado; el pedido pagado queda disponible para cocina
(estado `Pagado` en BD, listo para el Sprint 4).
