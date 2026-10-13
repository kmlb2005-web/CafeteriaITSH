# Research: Mostrador y Cocina (Sprint 4)

Decisiones técnicas; ninguna requiere dependencias nuevas (reglas §16,
constitución §IV).

## R1 — Sin migración: estados y transiciones ya están en el baseline

`estado_pedido` viene sembrado con los 6 estados (orden 1–6) y
`transicion_estado` con las 8 transiciones válidas (flujo principal +
`* → Cancelado` antes de `Entregado`), verificado en
`docs/002_seed_inicial.sql` líneas 46–53. Lo que sprints.md llama
"migraciones de extensión de estados" ya existe; `migrations/` queda vacío
otra vez. El CHECK de `pedido.tipo` ya admite `'mostrador'` (con
`usuario_id`/`fecha_recoleccion` en NULL) y el CHECK de `pago.metodo` ya
admite `'efectivo'`.

## R2 — Un solo servicio genérico de transición (FR-013 completo)

`transicionarEstado(pedidoId, hacia, cambiadoPor)`:

1. `SELECT … FOR UPDATE` del pedido (dos cocineros actualizando a la vez
   → el segundo ve el estado ya cambiado y la tabla rechaza si ya no es
   legal; nunca estados inconsistentes).
2. Valida `desde → hacia` contra la tabla `transicion_estado` (datos, no
   código). Si no existe → `409 transicion_invalida` con mensaje claro:
   cubre saltos de estado (`Pendiente → Listo`) y estados terminales
   (`Entregado`/`Cancelado` no tienen transiciones salientes → rechazo
   automático, SC-S4-04).
3. Actualiza `pedido.estado_id` + registra en `pedido_estado_historial`.

Cada rol solo puede enviar sus destinos (zod enum en el controller): cajero
→ `Entregado`/`Cancelado`; cocinero → `En preparación`/`Listo`.

## R3 — Captura de mostrador sin regla de 10 minutos

El pedido de mostrador es presencial: valida menú (disponible + activo),
precios y total en servidor (igual que anticipado) pero **sin** validación de
anticipación ni de fecha de recolección (`fecha_recoleccion` NULL, exigido
por el CHECK del tipo). El nombre del cliente es opcional (captura en pocos
pasos, SC-S4-01).

## R4 — Cobro en efectivo: mismo patrón transaccional del Sprint 3

`cobrarEnMostrador`: `FOR UPDATE` + `pago` con `metodo='efectivo'`,
`referencia=NULL` (no hay pasarela), `monto = pedido.total` (nunca valor del
cliente), transición `Pendiente → Pagado` + historial — todo en una
transacción. Rechaza con `409 cobro_no_permitido` si el pedido no está
`Pendiente` o no es de mostrador (los anticipados se pagan en línea). Dos
cobros simultáneos → el `FOR UPDATE` serializa y el segundo cae en 409: sin
cobros duplicados aunque la conexión del cajero sea intermitente.

## R5 — Cocina en vivo con sondeo (polling), no WebSockets

`GET /api/cocina/pedidos` cada **4 segundos** desde el frontend
(`setInterval` + limpieza al desmontar). Cumple SC-S4-03 (< 5 s, sin recarga
manual) con cero dependencias; un servidor EventSource/WebSockets excedería
la complejidad justificable del MVP. La respuesta trae solo los campos de
cocina (sin precios) para que el sondeo sea ligero.

## R6 — Lista de cocina: activos ordenados por llegada

`estado IN ('Pagado', 'En preparación', 'Listo')` ordenado por
`creado_en ASC, id ASC` (SC-S4-03 "ordenados por llegada"; posición
calculada 1..n visible en la tarjeta). `Pendiente` no aparece (sin pago no
va a cocina, criterio del Sprint 3) ni `Entregado`/`Cancelado` (fuera de
flujo). Incluye ambos orígenes (`tipo`) y `cliente_nombre` si existe.

## R7 — Flujo mínimo de la caja en dos acciones

Pantalla única: platillos del menú de hoy con cantidad por teclear →
**"Registrar y cobrar"** ejecuta `POST captura` y luego `POST pago`
(secuenciales). Si el cobro falla, el pedido queda `Pendiente` y la UI ofrece
solo "Cobrar" (reintento sin duplicar el pedido — caso borde de
conectividad). Sección de entregas: pedidos `Listo` con "Entregar" y
"Cancelar" (botones táctiles). Cancelación disponible también tras la
captura.

## R8 — Permisos y pruebas

- `/api/caja` tras `requireAuth + requireRole('cajero')`;
  `/api/cocina` tras `requireRole('cocinero')` (401/403 probados).
- Tests de integración en dos archivos (`caja.test.ts`, `cocina.test.ts`),
  fechas de menú apartadas como en sprints anteriores, limpieza en
  `afterAll` con registros `test-*@example.com`.
- La simultaneidadd (SC-S4-02) se prueba creando un anticipado (cliente) y
  un mostrador (cajero) y verificando que ambos aparecen en cocina.
