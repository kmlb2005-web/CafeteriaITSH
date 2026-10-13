# Data Model: Pedido Anticipado y Pago (Sprint 3)

**Tablas baseline existentes** (`docs/001_crear_esquema.sql`) + 1 migración.
**Sin tablas nuevas** en este sprint.

## `pedido` — solicitud (anticipada en este sprint)

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | INT PK AI | |
| `numero` | VARCHAR(20) UNIQUE | **folio** visible al cliente: `PED-YYMMDD-XXXXXXXX` (R5) |
| `tipo` | VARCHAR(20) | `anticipado` (Sprint 3); `mostrador` (Sprint 4) |
| `estado_id` | INT FK → `estado_pedido` | `Pendiente` al nacer; `Pagado` solo con pago confirmado |
| `usuario_id` | INT FK → `usuario` | autor (NOT NULL por CHECK del tipo anticipado) |
| `cliente_nombre` | VARCHAR(100) | NULL en pedidos anticipados |
| `fecha_recoleccion` | DATETIME | NOT NULL en anticipados; ≥ ahora + 10 min y fecha = menú (R3) |
| `total` | NUMERIC(10,2) | calculado en servidor (R4) |
| `creado_por` | INT FK → `usuario` | = `usuario_id` (se crea a sí mismo) |

CHECK `chk_pedido_tipo_detalles` exige `usuario_id` y `fecha_recoleccion` en
tipo `anticipado` — el esquema ya lo garantiza.

## `pedido_detalle` — partidas (precio congelado)

| Columna | Tipo | Reglas |
|---|---|---|
| `pedido_id` | INT FK → `pedido` ON DELETE CASCADE | |
| `menu_dia_id` | INT FK → `menu_dia` | platillo del menú del día |
| `cantidad` | INT | `CHECK cantidad > 0` (1–99 por validación zod) |
| `precio_unitario` | NUMERIC(10,2) | congelado al crear (R4) |
| `subtotal` | NUMERIC(10,2) | `precio_unitario × cantidad` |

## `pago` — 1:1 con el pedido (+ migración `001_pago_estado.sql`)

| Columna | Tipo | Reglas |
|---|---|---|
| `pedido_id` | INT **UNIQUE** FK → `pedido` | un solo renglón: sin cobros duplicados |
| `metodo` | VARCHAR(20) | `online` en este sprint |
| `estado` | VARCHAR(20) **(nuevo)** | `pendiente` → `confirmado` \| `rechazado` |
| `monto` | NUMERIC(10,2) | = `pedido.total` en servidor (nunca del cliente) |
| `referencia` | VARCHAR(100) | `REF-XXXXXXXXXXXX` de la pasarela; **sin datos de tarjeta** |
| `registrado_por` | INT FK → `usuario` | el propio cliente |

## `estado_pedido` / `transicion_estado` / `pedido_estado_historial`

Ya sembrados: estados en orden 1…6 y transiciones `Pendiente → Pagado`
(usada aquí) + resto para Sprint 4. Toda transición se valida contra
`transicion_estado` y se registra en `pedido_estado_historial`
(`cambiado_por` = cliente).

## Proyecciones de API (contratos/pedidos-api.md)

```text
PedidoResumen { id, numero, tipo, estado, total, fecha_recoleccion,
                creado_en, partidas: Partida[] }
Partida { id, menu_dia_id, nombre, cantidad, precio_unitario, subtotal }
PagoResumen { metodo, monto, referencia, estado }
```

La consulta (US2) resuelve `estado` como **nombre** (`Pendiente`/`Pagado`) vía
JOIN a `estado_pedido` y solo devuelve partidas del pedido propio.

## Reglas de negocio derivadas

- Crear pedido: validar menú (disponible + activo), ≥10 min, fecha = menú,
  congelar precios, folio, `estado = Pendiente` — en una transacción (R3, R4).
- Pago: si la pasarela confirma → `pago.estado = confirmado` + transición
  `Pendiente → Pagado` + historial, en transacción con `FOR UPDATE`; si
  rechaza → `pago.estado = rechazado` y el pedido sigue `Pendiente` (R2, R7).
- Un pedido `Pagado` no admite un segundo pago (`409`).
- Jamés se almacena nada de tarjeta: la pasarela solo devuelve referencia.
