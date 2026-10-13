# Research: Pedido Anticipado y Pago (Sprint 3)

Decisiones técnicas; ninguna requiere investigación externa nueva ni
dependencias nuevas (reglas §16, constitución §IV).

## R1 — Esquema: tablas baseline + una migración

`pedido`, `pedido_detalle`, `pedido_estado_historial`, `pago`, `estado_pedido`
y `transicion_estado` ya existen (creadas por `docs/001_crear_esquema.sql`);
el seed ya incluye los 6 estados y las transiciones válidas
(`Pendiente → Pagado → En preparación → …`). Lo único que falta para este
sprint es el **estado del pago**: la entidad "Pago / Transacción" de la spec
maestra es "registro de la intención y resultado … y su estado", y la tabla
`pago` no tiene esa columna. Se crea `migrations/001_pago_estado.sql`:

```sql
ALTER TABLE pago
  ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' AFTER metodo,
  ADD CONSTRAINT chk_pago_estado
    CHECK (estado IN ('pendiente','confirmado','rechazado'));
```

Con `UNIQUE(pedido_id)`: un solo renglón por pedido que registra la intención
(pendiente) y el resultado (confirmado/rechazado) sin duplicar cobros aunque
haya reintentos. Es la primera migración real del runner (además valida el
mecanismo `migrations/NN_*.sql` → `npm run migrate`).

## R2 — Pago simulado con adaptador reemplazable

No hay proveedor de pago contratado ni credenciales (assumption de la spec:
"la selección del proveedor se decide en fase de planificación"). Se implementa
`backend/src/services/pasarela.ts` como **adaptador**:

- `cobrar({ referencia })` → `{ exitoso, referencia }`.
- **No recibe, procesa ni almacena datos de tarjeta** (SC-S3-04 se cumple por
  construcción: la pantalla de pago no pide número de tarjeta).
- En el MVP siempre confirma; la demostración del caso de rechazo (US1.5, caso
  borde) se hace con un flag `simular_rechazo` de la petición, claramente
  etiquetado "modo demo" en la UI.
- Un proveedor real después sustituye solo `pasarela.ts`; el flujo del pedido
  no cambia (FR-012).

Si el pago se rechaza o el servicio falla: respuesta `402` con mensaje claro,
el pedido **no** pasa a `Pagado` (SC-S3-03) y el pago queda `rechazado`.

## R3 — Anticipación de 10 minutos: validada en servidor (y en cliente)

- El cliente envía `fecha_recoleccion` (`datetime-local` → `YYYY-MM-DDTHH:mm`,
  hora local).
- El servidor re-valida **al momento de crear**: `fecha_recoleccion ≥ ahora +
  10 minutos` → si no, `400 anticipacion_insuficiente` con mensaje claro
  (SC-S3-01, FR-011). La validación en cliente es solo comodidad (FR-021:
  ambas capas).
- Además `fecha(fecha_recoleccion)` debe coincidir con la fecha del menú de
  las partidas: los precios y disponibilidad viven en `menu_dia` de un día
  específico; recogida presencial el mismo día del menú (spec: "un solo menú
  activo por día", sin domicilio).
- El caso "se cumple el límite mientras confirma" se resuelve solo: la
  validación corre en el servidor dentro de la petición de creación.

## R4 — Precios y totales: el servidor es la fuente de verdad

Al crear el pedido, el servidor recupera cada `menu_dia_id`, verifica
`disponible = TRUE` y `platillo.activo = TRUE`, congela `precio_unitario` en
`pedido_detalle` y calcula `subtotal` y `total` (SC-S3-05). El monto cobrado es
`pedido.total` (nunca un valor enviado por el cliente). Si el menú cambia
durante la confirmación, manda el precio vigente del servidor; el total
registrado = total cobrado siempre.

## R5 — Folio (`pedido.numero`) con reintento por colisión

`PED-YYMMDD-XXXXXXXX` (hex de `node:crypto`, 19 caracteres ≤ 20). Ante
`ER_DUP_ENTRY` se reintenta la transacción hasta 3 veces. El folio es lo que
ve el cliente como "folio" en la confirmación (US1.4, US2).

## R6 — Carrito persistente en `localStorage`

La selección del cliente se guarda en `localStorage` (clave `carrito`):
solo `menu_dia_id`, nombre, precio y cantidad (ningún dato sensible). Así se
cubren los casos borde de "conexión intermitente" y "cierra la página durante
el pago": la selección no se pierde y los reintentos no crean pedidos
duplicados (la creación es un solo `POST` y el pago opera sobre el `pedido.id`
ya existente).

## R7 — Seguridad, transiciones y concurrencia

- `requireAuth + requireRole('usuario')` en las 3 rutas de `/api/pedidos`;
  un pedido de otro usuario responde **404** (no revela existencia).
- Transición de estado validada contra la tabla `transicion_estado`
  (reutilizable en Sprint 4) e historial en `pedido_estado_historial`.
- Cobro transaccional: `SELECT … FOR UPDATE` del estado dentro de la
  transacción + `UNIQUE(pedido_id)` en `pago` → dos peticiones de pago
  simultáneas no pueden cobrar dos veces (reintentos sin duplicar).
- Errores `{error:{code,message}}` con mensajes claros; jamés trazas (§15).
