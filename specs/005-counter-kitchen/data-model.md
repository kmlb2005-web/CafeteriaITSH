# Data Model: Mostrador y Cocina (Sprint 4)

**Sin migraciones nuevas** (research R1): todo se apoya en tablas baseline
ya sembradas. `migrations/` sigue vacío.

## Tablas existentes reutilizadas

| Tabla | Uso en el Sprint 4 |
|---|---|
| `pedido` | Altas de tipo `'mostrador'` (el CHECK del baseline ya lo admite). `usuario_id` y `fecha_recoleccion` en NULL (exigido por el CHECK del tipo). `cliente_nombre` opcional (VARCHAR(100), ya existe en el esquema). `creado_por` = cajero que capturó. |
| `pedido_detalle` | Igual que en anticipados: precios congelados al momento de capturar. |
| `pago` | Cobro de mostrador: `metodo='efectivo'` (CHECK ya lo admite), `referencia` NULL (no hay pasarela), `estado='confirmado'` (columna creada en el Sprint 3). `UNIQUE(pedido_id)` → un cobro por pedido. |
| `estado_pedido` | Los 6 estados sembrados (orden 1–6). |
| `transicion_estado` | Las 8 transiciones sembradas (ver `docs/002_seed_inicial.sql`): flujo principal + `Pendiente/Pagado/En preparación/Listo → Cancelado`. |
| `pedido_estado_historial` | Auditoría de cada transición: `cambiado_por` = cajero o cocinero. |

## Flujo de estados (FR-013 completo)

```text
Pendiente ─▶ Pagado ─▶ En preparación ─▶ Listo ─▶ Entregado
     │           │            │              │
     └───────────┴────────────┴──────────────┴──▶ Cancelado
```

- El flujo y las cancelaciones se validan contra la **tabla de datos**
  `transicion_estado` (nunca hardcodeado).
- `Entregado` y `Cancelado` son terminales: no tienen transiciones salientes
  sembradas, por lo que cualquier intento de cambiarlos responde
  `409 transicion_invalida` automáticamente (SC-S4-04).

## Quién puede aplicar qué (permisos)

| Rol | Módulo API | Transiciones permitidas (enum de controller) |
|---|---|---|
| cajero | `/api/caja` | Cobro: `Pendiente → Pagado` (efectivo). Estado: `Entregado` (desde `Listo`), `Cancelado` (desde cualquier pre-entrega). |
| cocinero | `/api/cocina` | `En preparación` (desde `Pagado`), `Listo` (desde `En preparación`). |

La validación es doble: el enum del controller limita el destino por rol y la
tabla `transicion_estado` valida la legalidad desde el estado actual.

## Proyecciones nuevas (tipos de dominio, no tablas)

### `PedidoOperativo` — lista de entregas de caja

`Pedido` + `cliente_nombre: string | null`.

### `PedidoCocina` — fila del KDS (sin precios, sondeo ligero)

```text
id, numero, tipo ('anticipado' | 'mostrador'), estado, cliente_nombre,
fecha_recoleccion, creado_en, orden (posición 1..n en la cola),
partidas: [{ nombre, cantidad }]
```

## Índices

No se agregan. Los listados filtran por estado y ordenan por `creado_en` sobre
un volumen máximo de ~30 pedidos por receso; `pedido` ya tiene PK y las
consultas son por JOIN con `estado_pedido`. Un índice extra no está justificado
(constitución §IV, simplicidad).
