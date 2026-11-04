# Data Model — QA del Cliente (Sprint 7)

**Feature**: `specs/009-qa-cliente` | **Fecha**: 2026-11-03

Este sprint **no crea entidades ni cambia el esquema**: modela lo que las
pruebas observan y cómo se trazan sus resultados. Se conserva como referencia
el modelo de `specs/008-qa-foundation/data-model.md`.

## Entidades observadas

### Pedido (estado que el cliente ve)

| Campo | Uso en las pruebas del rol cliente |
|---|---|
| `numero` (folio) | visible en mis pedidos y en los mensajes de aviso |
| `estado` | máquina: `Pendiente → Pagado → En preparación → Listo → Entregado` / `Cancelado` |
| `fechaRecoleccion` | regla de 10 minutos (RF-02, ya aprobada) |
| `total` | suma de partidas; base del total del carrito |
| `usuario_id` | `null` en mostrador → sin notificación (caso ya probado) |

**Transición crítica para O-02**: `En preparación → Listo` dispara
`asegurarNotificacionListo(...)`; si el proveedor de correo **lanza**, la
respuesta del cambio de estado debe seguir siendo **200** y el estado
**`Listo`** (la notificación no bloquea ni revierte).

### Notificación (auditoría del aviso)

| Campo | Valores probados |
|---|---|
| `pedido_id`, `tipo` | `pedido_listo` |
| `canal` | `correo` |
| `estado_envio` | `pendiente → enviada` (éxito) o `fallida` (respuesta negativa); si el adaptador lanza, la fila conserva `pendiente` y el `catch` del servicio sólo registra en servidor |
| `detalle_error` | mensaje corto del proveedor; nunca se devuelve al cliente |

Reglas que las pruebas fijan: idempotencia (un solo envío exitoso por pedido),
máximo 3 intentos, sin filas para pedidos de mostrador.

### Sesión y rol (permisos del cliente)

| Rol (backend) | Rutas que el cliente NO puede usar (403 `prohibido`) |
|---|---|
| `usuario` (cliente) | `/api/caja/*` (`cajero`), `/api/cocina/*` (`cocinero`), `/api/admin/*` y `/api/usuarios` (`administrador`) |
| sin sesión | toda ruta protegida → 401 `no_autorizado` |

La guardia es de **router** (`use(requireAuth, requireRole(...))`), por lo que
el 403 se emite antes de validar cuerpo o consultar la base.

### Sobre de error (contrato de respuestas fallidas)

```text
{ "error": { "code": "<codigo>", "message": "<mensaje apto para el usuario>" } }
```

| code | status | Origen |
|---|---|---|
| `no_autorizado` | 401 | `requireAuth` sin sesión |
| `prohibido` | 403 | `requireRole` con rol distinto |
| `validacion` | 400 | `ZodError` |
| `duplicado` | 409 | `ER_DUP_ENTRY` |
| `not_found` | 404 | `notFound` |
| `interno` | 500 | cualquier error no clasificado (stack sólo en servidor) |

## Modelo de evidencia (documentación que este sprint crea)

| Elemento | Regla |
|---|---|
| Capturas | `docs/evidencias/cliente/NN-descrito-de-paso.png`, en orden del flujo del alumno |
| Checklist | `docs/checklist-usabilidad-cliente.md`: ítem §19 + resultado + captura de respaldo |
| Matriz | una fila por requisito (Requisito · Prueba · Resultado); los defectos y observaciones se cierran con fecha y solución |
| Pruebas | archivos `*.test.ts(x)` existentes o nuevos; usuarios `test-*@example.com` limpiados en `afterAll` |
