# API Contract: Mostrador (Cajero) y Cocina (Sprint 4)

Base: `/api`. Sesión por cookie `httpOnly` (igual que el resto). Errores con
formato exacto `{ "error": { "code", "message" } }` (reglas §15).

## Módulo caja — solo rol `cajero` (401 sin sesión, 403 otro rol)

### `POST /api/caja/pedidos` — captura de pedido presencial (US1.1/US1.2)

Request:

```json
{
  "cliente_nombre": "Ana López",        // opcional, ≤100 caracteres
  "items": [{ "menu_dia_id": 12, "cantidad": 2 }]
}
```

Response `201` — pedido con estado `Pendiente`, tipo `mostrador`, folio:

```json
{
  "id": 45, "numero": "PED-261013-A1B2C3D4", "tipo": "mostrador",
  "estado": "Pendiente", "total": 70, "fecha_recoleccion": null,
  "creado_en": "2026-10-13T10:15:00.000Z",
  "partidas": [
    { "id": 90, "menu_dia_id": 12, "nombre": "Gordita",
      "cantidad": 2, "precio_unitario": 35, "subtotal": 70 }
  ]
}
```

Reglas del servidor (research R3):

- Precios y total se calculan **siempre** en servidor.
- Sin regla de 10 minutos (es presencial); `fecha_recoleccion` queda NULL.
- El menú pedido debe ser el de hoy, activo y disponible.

Errores: `400 validacion` (items vacíos/cantidades), `409 no_disponible`
(platillo inactivo, no disponible o fuera del menú de hoy).

### `POST /api/caja/pedidos/:id/pago` — cobro en efectivo (US1.3/US1.4)

Sin body. El pedido debe ser de mostrador y estar `Pendiente`.

Response `200`:

```json
{
  "pedido": { "...": "Pedido completo en estado Pagado" },
  "pago": { "metodo": "efectivo", "monto": 70, "referencia": null,
            "estado": "confirmado" }
}
```

Regla transaccional (research R4): `FOR UPDATE` + `UNIQUE(pedido_id)` → dos
cobros simultáneos nunca cobran dos veces; el segundo recibe `409`.

Errores: `404 no_encontrado`, `409 cobro_no_permitido` (no es mostrador o ya
no está `Pendiente`).

### `GET /api/caja/pedidos/listos` — pedidos Listo para entregar (US1.6)

Response `200`:

```json
{ "pedidos": [ { "...": "PedidoOperativo (Pedido + cliente_nombre), estado Listo", "partidas": ["..."] } ] }
```

### `POST /api/caja/pedidos/:id/estado` — entrega o cancelación (US1.6, FR-013)

Request: `{ "estado": "Entregado" }` o `{ "estado": "Cancelado" }`
(enum limitado por rol; la legalidad la decide `transicion_estado`).

Response `200` — pedido completo en el nuevo estado.

Errores: `404 no_encontrado`, `400 validacion` (estado fuera del enum del
cajero), `409 transicion_invalida` (incluye estados terminales y saltos).

## Módulo cocina — solo rol `cocinero` (401/403)

### `GET /api/cocina/pedidos` — KDS: pedidos activos (US2.1, FR-017)

Pedidos con estado `Pagado`, `En preparación` o `Listo` — ambos orígenes —
ordenados por llegada (`creado_en ASC`, SC-S4-03). Sin precios.

Response `200`:

```json
{
  "pedidos": [
    {
      "id": 44, "numero": "PED-261013-0F1E2D3C", "tipo": "anticipado",
      "estado": "Pagado", "cliente_nombre": null,
      "fecha_recoleccion": "2026-10-13T12:00", "creado_en": "2026-10-13T10:02:00.000Z",
      "orden": 1,
      "partidas": [ { "nombre": "Gordita", "cantidad": 2 } ]
    }
  ]
}
```

`Pendiente` no aparece (sin pago no va a cocina) ni `Entregado`/`Cancelado`
(ya salieron del flujo).

### `POST /api/cocina/pedidos/:id/estado` — avance de preparación (US2.2, FR-018)

Request: `{ "estado": "En preparación" }` o `{ "estado": "Listo" }`.

Response `200` — pedido completo en el nuevo estado.

Errores: `404 no_encontrado`, `400 validacion` (fuera del enum del cocinero),
`409 transicion_invalida` (saltos como `Pendiente → Listo` o cambios de
terminales, SC-S4-04).

## Nota de diseño (research R5)

La cocina se actualiza con **sondeo cada 4 s** desde el frontend; las
respuestas de lista son ligeras (sin precios) para que el sondeo sea barato.
Sin WebSockets ni dependencias nuevas.
