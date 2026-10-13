# Feature Specification: Pedido Anticipado y Pago (Sprint 3)

**Feature Branch**: `004-advance-orders-payment`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Sprint 3 — Pedido anticipado y pago: el
alumno/docente completa el pedido anticipado con pago; nacen los estados de
pedido (`Pendiente` y `Pagado`)." Fuente: `docs/sprints.md` (Sprint 3,
semanas est. 2026-11-10 → 2026-11-23). Subconjunto trazable de la spec
maestra `specs/001-cafeteria-preorder-system/spec.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pedido anticipado con pago (Priority: P1)

Como alumno o docente, selecciono uno o más platillos del menú del día con
sus cantidades, reviso el total antes de confirmar y registro mi pedido con
al menos 10 minutos de anticipación; el pago en línea forma parte del mismo
flujo y, cuando se confirma, mi pedido queda en estado `Pagado` y recibo la
confirmación con su folio y estado.

**Why this priority**: Es el valor central del proyecto y el objetivo de la
demo de este sprint: el flujo completo menú → selección → pedido → pago.

**Independent Test**: Con un menú publicado y un cliente registrado, crear
un pedido con ≥10 minutos de anticipación, confirmar un pago y verificar que
el pedido queda `Pagado` con su folio, sin depender de cocina ni caja.

**Acceptance Scenarios**:

1. **Given** un menú del día con platillos disponibles, **When** el cliente
   selecciona platillos y cantidades, **Then** ve el total antes de
   confirmar.
2. **Given** un cliente cuyo pedido se confirmaría con menos de 10 minutos
   de anticipación, **When** intenta confirmar, **Then** el sistema rechaza
   el pedido y explica el motivo de forma clara.
3. **Given** un platillo marcado como no disponible, **When** el cliente
   arma su pedido, **Then** ese platillo no puede seleccionarse.
4. **Given** un pedido confirmado, **When** el pago se confirma, **Then** el
   pedido pasa al estado `Pagado` y el cliente ve la confirmación con su
   folio.
5. **Given** un pago que no se confirma (rechazo o fallo del servicio de
   pago), **When** termina el intento, **Then** el pedido NO queda como
   `Pagado` y el cliente ve un mensaje claro sin información interna.
6. **Given** un platillo eliminado o modificado después de creado un pedido
   en curso, **When** se consulta ese pedido, **Then** conserva sus partidas
   y el total registrado al momento de la compra.
7. **Given** un pedido `Pagado`, **When** se consulta desde el módulo de
   cocina en el siguiente sprint, **Then** aparece listo para prepararse
   (verificación de llegada del pedido a cocina).

---

### User Story 2 - Consulta del recién creado (Priority: P2)

Como alumno o docente, después de pagar consulto el detalle de mi pedido
recién creado (platillos, cantidades y total) y su estado `Pagado`, para
saber qué pedí y qué pagué.

**Why this priority**: Da confirmación inmediata al cliente; el listado
completo de "mis pedidos" con seguimiento en vivo queda para el Sprint 5.

**Independent Test**: Tras confirmar un pago, abrir la confirmación de ese
pedido y verificar que el detalle y el estado coinciden con lo comprado.

**Acceptance Scenarios**:

1. **Given** un pedido pagado recientemente, **When** el cliente abre su
   confirmación, **Then** ve platillos, cantidades, total y estado `Pagado`.
2. **Given** un pedido de otro cliente, **When** un cliente intenta ver ese
   detalle, **Then** el acceso a ese pedido le es denegado.
3. **Given** un pedido en `Pendiente` (creado sin pago confirmado), **When**
   el cliente lo consulta, **Then** ve el estado `Pendiente` y no `Pagado`.

---

### Edge Cases

- El servicio de pago externo no responde o expira: el pedido no pasa a
  `Pagado`, el cliente ve un mensaje claro y puede reintentar sin duplicar
  el pedido.
- Se cumple la hora límite de 10 minutos mientras el cliente confirma: el
  pedido se rechaza y la selección conserva para reintentar con otro horario.
- Menú sin platillos disponibles: el cliente ve un aviso y no puede crear un
  pedido.
- Conexión a internet intermitente durante el pago: el reintento no duplica
  pedidos ni cobros y el sistema no pierde la selección.
- El cliente cierra la página durante el pago: al volver, ve el estado real
  de su pedido, sin duplicados.
- Pago confirmado pero confirmación no visible (fallo de red): el estado
  `Pagado` es la fuente de verdad al recargar.
- Total con cantidades grandes: el total mostrado antes de confirmar coincide
  con el total registrado y cobrado.

## Requirements *(mandatory)*

### Trazabilidad a la spec maestra (001)

| Elemento de 001 | Cobertura en este sprint |
|---|---|
| US1 (pedido anticipado con pago) | User Story 1 |
| US1 (parte: detalle del pedido recién creado) | User Story 2 |
| FR-010, FR-011, FR-012 | Implementación completa |
| FR-013 (parcial: estados `Pendiente` y `Pagado`, transiciones aplicables) | Implementación parcial; flujo completo en Sprint 4 |
| FR-014 (parcial: detalle del pedido recién creado) | Implementación parcial; lista completa en Sprint 5 |
| SC-001, SC-003 | Criterios de éxito de este sprint |

### Functional Requirements

**Pedido anticipado y pago**

- **FR-010** *(de 001)*: El cliente MUST poder seleccionar uno o más
  platillos con sus cantidades y MUST ver el total del pedido antes de
  confirmarlo.
- **FR-011** *(de 001)*: Un pedido anticipado MUST realizarse con al menos
  10 minutos de anticipación; el sistema MUST rechazar los intentos con
  menos de 10 minutos.
- **FR-012** *(de 001)*: El pago en línea MUST formar parte del flujo del
  pedido; un pedido anticipado MUST pasar a `Pagado` solo cuando el pago se
  confirma, y el sistema MUST NO almacenar información sensible de tarjetas
  bancarias (solo la referencia necesaria para identificar y validar la
  transacción).
- **FR-013** *(de 001, parcial)*: En este sprint el pedido opera con los
  estados `Pendiente` y `Pagado`, siguiendo el flujo de la maestra
  (`Pendiente → Pagado`); el sistema MUST NO marcar como `Pagado` un pedido
  sin pago confirmado. Los estados restantes (`En preparación`, `Listo`,
  `Entregado`, `Cancelado`) se habilitan en el Sprint 4.
- **FR-014** *(de 001, parcial)*: El cliente MUST poder consultar el detalle
  del pedido recién creado (platillos, cantidades, total y estado) y MUST NO
  ver pedidos de otros usuarios; el listado completo de "mis pedidos" se
  entrega en el Sprint 5.
- **FR-021** *(de 001)*: Los datos MUST validarse antes de procesarse y
  almacenarse, tanto en la interfaz como en el servidor; los datos inválidos
  MUST NO llegar a la lógica de negocio.
- **FR-022** *(de 001)*: El sistema MUST mostrar mensajes de error claros al
  usuario y MUST NO exponer trazas de errores ni información interna del
  servidor.

### Out of Scope (Sprint 3)

- Listado completo de "mis pedidos" con seguimiento en vivo (Sprint 5).
- Captura de pedidos de mostrador y pantalla de cocina (Sprint 4).
- Notificación de pedido listo (Sprint 5).
- Funcionalidades fuera del alcance del MVP sin aprobación previa.

### Key Entities

- **Pedido**: solicitud de uno o más platillos; tipo (anticipado), autor
  (cliente), partidas, total, hora programada de recogida (≥10 minutos de
  anticipación) y estado (`Pendiente` o `Pagado` en este sprint).
- **Partida de pedido**: platillo y cantidad dentro de un pedido, con el
  precio registrado al momento de crearlo.
- **Pago / Transacción**: registro de la intención y resultado del pago de un
  pedido; referencia de la transacción y su estado, sin datos sensibles de
  tarjeta; relación: uno a uno con el pedido.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-S3-01**: El 100 % de los pedidos anticipados puede registrarse con al
  menos 10 minutos de anticipación, y el sistema rechaza el 100 % de los
  intentos con menos de 10 minutos (SC-001 de la maestra).
- **SC-S3-02**: Un alumno o docente completa el flujo menú → selección →
  creación del pedido → pago en menos de 3 minutos (SC-003 de la maestra).
- **SC-S3-03**: 0 pedidos sin pago confirmado quedan en estado `Pagado`
  durante todas las pruebas del sprint.
- **SC-S3-04**: 0 datos sensibles de tarjetas almacenados o visibles en el
  sistema (verificado en respuestas y registros).
- **SC-S3-05**: El total mostrado antes de confirmar coincide en el 100 % de
  los casos con el total registrado y cobrado.
- **SC-S3-06**: El 100 % de las pruebas automatizadas del sprint pasan antes
  de la demo.

## Assumptions

- El pago se realiza con un proveedor externo de pago en línea que acepte
  tarjetas en México; la selección del proveedor se decide en la fase de
  planificación y el sistema solo registra referencia y resultado de la
  transacción.
- Los precios están expresados en pesos mexicanos (MXN) y ya incluyen
  impuestos.
- El pedido se envía a cocina en estado `Pagado`; la visualización en cocina
  se habilita en el Sprint 4 (aquí se verifica la llegada del pedido como
  dato disponible para ese módulo).
- La recogida es presencial en la cafetería; no hay entrega a domicilio.
- La conectividad a internet dentro del plantel puede ser intermitente; los
  reintentos no deben duplicar pedidos ni pagos.
- Las fechas de este sprint (2026-11-10 → 2026-11-23) son estimadas y se
  ajustan al calendario real del plantel.
- Se aplican las suposiciones generales de la spec maestra 001.
