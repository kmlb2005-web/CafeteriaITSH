# Data Model: Seguimiento, Notificaciones y Pulido (Sprint 5)

**Sin migraciones nuevas** (research R1): la tabla `notificacion` ya viene en
el baseline.

## Tablas existentes reutilizadas

| Tabla | Uso en el Sprint 5 |
|---|---|
| `pedido` | Lista y detalle de "mis pedidos": estado vigente, partidas y total tal como se registraron (solo `usuario_id` propio). |
| `pedido_detalle` | Detalle de cada pedido (ya congelado al crearlo). |
| `estado_pedido` / `transicion_estado` | Origen del estado mostrado; el cliente solo consulta (nunca transiciona). |
| `notificacion` | Aviso de pedido listo: `tipo='pedido_listo'`, `canal='correo'`, `estado_envio` (`pendiente` → `enviada`/`fallida`), `detalle_error`. Índice `idx_notificacion_pendiente` para el barrido de pendientes. |

## Notificaciones: modelo append-only (audit + reintento)

No existe columna de intentos; **cada intento es una fila**:

```text
pedido 42 → notificacion #1 estado_envio='fallida' (fallo de red)
         → notificacion #2 estado_envio='enviada'  (reintento del cliente)
intentos de "pedido 42" = COUNT(*) = 2  →  cabe un 3er intento si hiciera falta
```

Reglas de `asegurarNotificacionListo(pedidoId)`:

1. Pedido sin `usuario_id` (mostrador) o sin correo → sin notificación.
2. Ya existe `enviada` para el pedido → no se duplica (idempotente).
3. Última `fallida` con intentos ≥ 3 → se conserva la auditoría, sin más.
4. Se crea fila `pendiente` y el adaptador la lleva a `enviada` o `fallida`.

Flujo:

```text
cocina: En preparación → Listo   ──▶ notificaciones.service: crear + enviar
cliente: GET /api/pedidos        ──▶ asegurar notificación de sus Listo
                                     (crear si falta; reintentar si falló)
```

## Proyección nueva (tipo, no tabla)

### `PedidoLista` — fila de "mis pedidos"

`id, numero, tipo, estado, total, fecha_recoleccion, creado_en,
aviso_listo: boolean` — liviana, sin partidas (el detalle usa
`GET /api/pedidos/:id`).

## Índices

No se agregan: `notificacion` ya trae `idx_notificacion_pendiente` y la lista
del cliente filtra por `pedido.usuario_id` sobre un volumen pequeño por
cuenta (constitución §IV).
