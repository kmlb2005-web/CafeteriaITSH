# Quickstart: Mostrador y Cocina (Sprint 4)

Verificación manual (demo a la patrocinadora) y cadena e2e de la feature.

## Arranque

```powershell
# Terminal 1
cd backend; npm run dev        # http://localhost:3000

# Terminal 2
cd frontend; npm run dev       # http://localhost:5173 (proxy /api)
```

Requisitos: MySQL 8 local con `cafe_itsh` (docs/ejecutar-migraciones.md),
`npm run migrate` y `npm run seed` ya ejecutados. Sin migraciones nuevas en
este sprint.

## Guion de la demo (SC-S4-01…SC-S4-05)

1. **Preparar menú de hoy** (admin): `/admin/menu` → agregar 2–3 platillos
   con precio y disponibles.
2. **Captura en caja** (SC-S4-01): entrar como `cajero@itsh.mx` → `/caja` →
   teclear cantidades → "Registrar y cobrar". Debe quedar en < 1 minuto y
   mostrar el folio con estado `Pagado` en un solo paso.
3. **Simultaneidad** (SC-S4-02): con otra ventana en `/menu` (cliente) crear
   un pedido anticipado pagado; ambos pedidos deben convivir sin
   interferirse.
4. **Cocina** (SC-S4-03): entrar como `cocinero@itsh.mx` → `/cocina` → ver
   ambos orígenes en una sola pantalla, ordenados por llegada, con posición.
   Sin recargar: los pedidos nuevos aparecen solos (≤ 5 s).
5. **Avance de estados** (FR-018): "Iniciar preparación" (`En preparación`) y
   "Marcar listo" (`Listo`) con un toque; botones táctiles ≥ 44 px.
6. **Entrega y cancelación** (FR-013): en `/caja`, sección de entregas →
   "Entregar" (`Entregado`); tras capturar, "Cancelar" (`Cancelado`).
7. **Transiciones inválidas rechazadas** (SC-S4-04): vía API, un salto
   (p. ej. `Pendiente → Listo`) o tocar un `Entregado` responde
   `409 transicion_invalida` con mensaje claro.

Credenciales seed: `admin@itsh.mx`/`AdminDev!2026`, `cajero@itsh.mx`/
`CajeroDev!2026`, `cocinero@itsh.mx`/`CocineroDev!2026`.

## Cadena e2e de verificación (script)

1. Admin crea platillo y lo publica en el menú de hoy (`/admin`).
2. Cajero captura y cobra: `POST /api/caja/pedidos` (201, `Pendiente`) →
   `POST /api/caja/pedidos/:id/pago` (200, `Pagado`, `metodo: efectivo`).
3. Cocina lista: `GET /api/cocina/pedidos` → el pedido aparece con
   `orden: 1`.
4. Cocina avanza: `POST /api/cocina/pedidos/:id/estado`
   `En preparación` → `Listo` (200 en ambos).
5. Cajero entrega: `GET /api/caja/pedidos/listos` lo incluye →
   `POST /api/caja/pedidos/:id/estado` `Entregado` (200).
6. Invalidaciones: cobro doble → 409; salto de estado → 409; cambio sobre
   `Entregado` → 409; rol equivocado (`cocinero` en `/api/caja`) → 403.

## Verificación automatizada

```powershell
cd backend;  npm run lint; npm run typecheck; npm test
cd frontend; npm run lint; npm run typecheck; npm test; npm run build
```
