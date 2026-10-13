# Contrato: API de Pedidos Anticipados (Sprint 3)

Todas las respuestas de error usan `{ "error": { "code", "message" } }`
(reglas §15). Las 3 rutas requieren sesión con rol **`usuario`**
(`401` sin sesión, `403` con otro rol). Cuerpos validados con zod.

## 1. `POST /api/pedidos` — crear pedido anticipado (US1)

**Body**

```json
{
  "items": [ { "menu_dia_id": 12, "cantidad": 2 } ],
  "fecha_recoleccion": "2026-11-11T12:40"
}
```

- `items`: 1–99 partidas; `cantidad` entera 1–99. No puede venir vacío.
- `fecha_recoleccion`: `YYYY-MM-DDTHH:mm` (hora local).

**201**

```json
{
  "id": 7,
  "numero": "PED-261111-A1B2C3D4",
  "tipo": "anticipado",
  "estado": "Pendiente",
  "total": 95.00,
  "fecha_recoleccion": "2026-11-11T12:40",
  "creado_en": "…",
  "partidas": [
    { "id": 1, "menu_dia_id": 12, "nombre": "Gordita de chicharrón",
      "cantidad": 2, "precio_unitario": 35.00, "subtotal": 70.00 },
    { "id": 2, "menu_dia_id": 15, "nombre": "Café de olla",
      "cantidad": 1, "precio_unitario": 25.00, "subtotal": 25.00 }
  ]
}
```

**Errores**

| Estado | code | Condición |
|---|---|---|
| 400 | `validacion` | cuerpo inválido (items vacíos, cantidades, formato de fecha) |
| 400 | `anticipacion_insuficiente` | `fecha_recoleccion` a menos de 10 minutos (FR-011) |
| 400 | `fecha_invalida` | la recogida no es del día del menú seleccionado |
| 409 | `no_disponible` | `menu_dia_id` inexistente, platillo inactivo o marcado no disponible |
| 403/401 | `acceso_denegado` / `no_autorizado` | rol distinto / sin sesión |

Los precios y el total **los calcula el servidor** (SC-S3-05); el total de la
respuesta es el que se cobrará.

## 2. `POST /api/pedidos/:id/pago` — confirmar pago (US1)

**Body** (opcional)

```json
{ "simular_rechazo": false }
```

Solo demo/test: fuerza el rechazo del adaptador simulado (modo demo, R2).

**200 — pago confirmado**

```json
{
  "pedido": { "…": "PedidoResumen", "estado": "Pagado" },
  "pago": { "metodo": "online", "monto": 95.00,
            "referencia": "REF-1A2B3C4D5E6F", "estado": "confirmado" }
}
```

Nunca aparece información de tarjeta (SC-S3-04).

**Errores**

| Estado | code | Condición |
|---|---|---|
| 402 | `pago_rechazado` | la pasarela no confirmó → el pedido **sigue `Pendiente`** (mensaje claro + reintento) |
| 404 | `no_encontrado` | pedido inexistente **o de otro usuario** |
| 409 | `ya_pagado` | ya tiene pago confirmado (no se cobra dos veces) |
| 400 | `validacion` | id inválido |

## 3. `GET /api/pedidos/:id` — detalle del pedido (US2)

**200**: `PedidoResumen` (mismo objeto de la creación) con `estado` real
consultado en el momento — la fuente de verdad al recargar (caso borde:
"pago confirmado pero confirmación no visible").

**Errores**: `404 no_encontrado` si el pedido no existe **o pertenece a otro
cliente** (US2.2); `401/403` por rol.

## Criterios cubiertos

| Criterio | Dónde |
|---|---|
| SC-S3-01: 100 % con ≥10 min / rechazo total <10 min | validación servidor en `POST /api/pedidos` |
| SC-S3-02: flujo <3 min | 3 pasos: carrito → 1 POST → 1 POST de pago |
| SC-S3-03: 0 `Pagado` sin pago confirmado | transición solo dentro del cobro exitoso |
| SC-S3-04: 0 datos de tarjeta | adaptador sin tarjeta; respuesta solo `referencia` |
| SC-S3-05: total mostrado = registrado = cobrado | total y `monto` calculados en servidor |
| US2.2: pedido de otro → denegado | `404` en `GET /api/pedidos/:id` |
