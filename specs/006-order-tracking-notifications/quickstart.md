# Quickstart: Seguimiento, Notificaciones y Pulido (Sprint 5)

Verificación manual (demo final a la patrocinadora) y cadena e2e de la
feature.

## Arranque

```powershell
# Terminal 1
cd backend; npm run dev        # http://localhost:3000

# Terminal 2
cd frontend; npm run dev       # http://localhost:5173 (proxy /api)
```

Requisitos: MySQL 8 local con `cafe_itsh` (docs/ejecutar-migraciones.md),
`npm run migrate` y `npm run seed` ya ejecutados. Sin migraciones nuevas.

## Guion de la demo final (flujo completo, SC-S5-02)

1. **Admin** (`admin@itsh.mx`): publicar el menú de hoy en `/admin/menu`.
2. **Cliente** (`/registro` → `/menu`): elegir platillos, revisar en
   `/pedido/confirmar`, pagar en `/pedido/:id/pago` → folio en
   `/pedido/:id/confirmacion`.
3. **Cliente** (`/mis-pedidos`): el pedido aparece `Pagado` con su detalle
   (US1); abrirlo muestra platillos y total.
4. **Cocina** (`cocinero@itsh.mx`, `/cocina`): "Iniciar preparación" →
   "Marcar listo".
5. **Cliente** (`/mis-pedidos`, sin recargar la lógica): el pedido aparece
   destacado **Listo para recoger** (aviso in-app); en el backend se registró
   y envió la notificación por correo (log de la consola del servidor; en
   producción, adaptador SMTP real).
6. **Caja** (`cajero@itsh.mx`, `/caja`): "Entregar" → el pedido queda
   `Entregado` y en "mis pedidos" su estado no cambia nunca más.
7. **Aislamiento** (SC-S5-03): con un segundo cliente, su lista no muestra
   pedidos del primero.
8. **Fallo de envío** (demo técnica, US2.3): con `SIMULAR_FALLO_CORREO=true`
   en `backend/.env`, marcar un pedido `Listo` → el estado sigue visible en
   "mis pedidos" y el sistema reintenta (auditoría en la tabla
   `notificacion`).

Credenciales seed: `admin@itsh.mx`/`AdminDev!2026`, `cajero@itsh.mx`/
`CajeroDev!2026`, `cocinero@itsh.mx`/`CocineroDev!2026`; clientes se dan de
alta en `/registro`.

## Cadena e2e de verificación (script)

1. Registrar cliente A y cliente B.
2. A crea y paga un pedido anticipado (menú de hoy publicado antes).
3. `GET /api/pedidos` (A) → el pedido aparece `Pagado`; (B) → lista vacía.
4. Cocina avanza hasta `Listo` → fila en `notificacion` con
   `estado_envio='enviada'`, `canal='correo'`.
5. Pedido `Pagado` sin avanzar → sin notificación (US2.4).
6. Con el adaptador en fallo simulado: `Listo` → notificación `fallida` +
   `detalle_error`, el pedido sigue `Listo` y visible; siguiente
   `GET /api/pedidos` reintenta (nueva fila).
7. Cajero entrega → `Entregado`; la lista del cliente lo refleja sin cambios
   posteriores.

## Verificación automatizada

```powershell
cd backend;  npm run lint; npm run typecheck; npm test
cd frontend; npm run lint; npm run typecheck; npm test; npm run build
```
