# Research: Seguimiento, Notificaciones y Pulido (Sprint 5)

Decisiones técnicas; ninguna requiere dependencias nuevas (reglas §16).

## R1 — Sin migración: `notificacion` ya está en el baseline

La tabla existe en `docs/001_crear_esquema.sql` (líneas 225–240) con
`pedido_id` (FK con cascade), `tipo`, `canal` (CHECK: correo/push/sms),
`estado_envio` (CHECK: pendiente/enviada/fallida), `fecha`, `detalle_error` e
**`idx_notificacion_pendiente`** — pensada justamente para reintento y
auditoría. No tiene columna de intentos: se usa el modelo **append-only**,
cada intento es una fila; los intentos de un pedido = `COUNT(*)` de sus
notificaciones del tipo. Sin `migrations/NN_*.sql`.

## R2 — Módulo de notificaciones separado + adaptador de correo

- `backend/src/services/notificaciones.service.ts`: único lugar que conoce
  la tabla `notificacion` (FR-019: separada de la lógica de pedidos).
  Función principal `asegurarNotificacionListo(pedidoId)`:
  1. Carga pedido + correo del cliente (inexistente o sin usuario → no hace
     nada: pedido de mostrador no notifica).
  2. Si ya hay notificación `enviada` → no duplica.
  3. Si hay `fallida` y los intentos ≥ 3 → se queda la auditoría (acotado).
  4. Crea fila `pendiente` y llama al adaptador; éxito → `enviada`, fallo →
     `fallida` + `detalle_error`.
- `backend/src/services/correo.ts` (análogo a `pasarela.ts`): adaptador con
  `enviarCorreo({para, asunto, mensaje, simularFallo})`; en desarrollo
  simula el envío (log en consola) y el flag `simular_fallo` es solo para
  demo/tests; reemplazable por un proveedor SMTP real sin tocar el servicio.

## R3 — Generación al pasar a `Listo`, sin bloquear el flujo

La notificación se dispara desde el **controller** de cocina después de una
transición exitosa a `Listo` (no desde `transicionarEstado`: el servicio de
pedidos no depende de notificaciones). El servicio envuelve sus errores: un
fallo de envío **nunca** revierte ni afecta el estado `Listo` del pedido
(SC-S5-01 y edge "fallo de envío" de la spec). El envío ocurre en el mismo
request (síncrono) → el aviso se entrega en segundos, muy por debajo del
minuto.

## R4 — Reintento pull-based, sin jobs de fondo

`GET /api/pedidos` (mis pedidos) asegura la notificación de cada pedido
`Listo` propio: si no existe (p. ej. transición anterior a este feature) la
crea; si la última quedó `fallida` y hay < 3 intentos, reintenta. Así se
cubre el edge "cocinero marca Listo sin cliente conectado": el estado es
consultable al reconectar y el reintento ocurre entonces. Un cron o cola de
mensajes excedería la complejidad justificable del MVP (constitución §IV).

## R5 — Lista y detalle de "mis pedidos"

- `GET /api/pedidos` (rol `usuario`, ya protegido en la ruta): lista liviana
  (`PedidoLista`: id, numero, tipo, estado, total, fecha_recoleccion,
  creado_en, `aviso_listo`) ordenada por `creado_en DESC`, filtrada por
  `usuario_id` — el aislamiento entre cuentas es el mismo del resto del
  módulo (SC-S5-03).
- Detalle: se reutiliza `GET /api/pedidos/:id` existente (partidas, total,
  estado) — FR-014 cubierto sin endpoints extra.
- `aviso_listo = estado === 'Listo'`: el aviso in-app es el propio estado
  destacado ("Listo para recoger"), coherente con el supuesto de la spec.

## R6 — Pulido y cierre (US3)

- Revisión de UI contra `docs/DESIGN.md`: tokens ya aplicados; el pulido se
  concentra en estados vacíos/error consistentes y responsividad de las
  pantallas nuevas (las existentes ya usan grids responsivos y ≥44 px en
  caja/cocina).
- Pruebas críticas (pagos, estados, permisos): ya verdes desde los sprints
  3–4; este sprint agrega las de seguimiento y notificación (T004/T008).
- FR-026: documentación de configuración dev/prod (`.env.example`,
  `NODE_ENV`, hosting de bajo costo) en los READMEs — sin código nuevo.
