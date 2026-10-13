# Feature Specification: Seguimiento, Notificaciones y Pulido (Sprint 5)

**Feature Branch**: `006-order-tracking-notifications`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Sprint 5 — Seguimiento, notificaciones y
pulido: el cliente ve el recorrido completo de su pedido en "mis pedidos" y
recibe el aviso de pedido listo; cierre del MVP con pruebas y demo final."
Fuente: `docs/sprints.md` (Sprint 5, semanas est. 2026-12-08 → 2026-12-21).
Subconjunto trazable de la spec maestra
`specs/001-cafeteria-preorder-system/spec.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Seguimiento de mis pedidos (Priority: P1)

Como alumno o docente, consulto la lista de mis pedidos con el estado actual
de cada uno y el detalle de cada pedido (platillos, cantidades y total), lo
que me permite saber cuándo recoger y qué pagué.

**Why this priority**: Es el cierre de la visibilidad para el cliente y
condiciona la demo completa del flujo; el aviso de "pedido listo" se consulta
aquí mismo.

**Independent Test**: Con pedidos creados previamente en distintos estados,
el cliente inicia sesión y verifica que su lista y su detalle coincidan con
el estado real de cada pedido, y que no vea pedidos de otros.

**Acceptance Scenarios**:

1. **Given** un cliente con pedidos en distintos estados, **When** consulta
   "mis pedidos", **Then** ve cada pedido con su estado actual.
2. **Given** un pedido del cliente, **When** abre su detalle, **Then** ve
   platillos, cantidades y total.
3. **Given** un pedido recién creado y pagado, **When** el cliente consulta
   "mis pedidos", **Then** el pedido aparece como `Pagado`.
4. **Given** un pedido de otro cliente, **When** un cliente consulta su
   lista, **Then** no aparece.
5. **Given** un pedido en cualquier estado del flujo, **When** el cliente lo
   consulta, **Then** el estado mostrado es el mismo que el registrado en el
   sistema.

---

### User Story 2 - Aviso de pedido listo (Priority: P1)

Como alumno o docente, recibo la notificación de que mi pedido está listo
para recoger cuando el cocinero lo marca como `Listo`; si el envío falla, la
información queda visible en "mis pedidos" y se reintenta.

**Why this priority**: Sin el aviso, el cliente no sabe cuándo recoger y el
objetivo de reducir la espera pierde su efecto; es el último tramo del flujo
de aceptación.

**Independent Test**: Marcando un pedido como `Listo` desde cocina y
verificando que el cliente recibe el aviso en menos de 1 minuto, y simulando
un fallo de envío para comprobar que el estado sigue visible y se reintenta.

**Acceptance Scenarios**:

1. **Given** un pedido en `En preparación`, **When** el cocinero lo cambia a
   `Listo`, **Then** el alumno o docente recibe la notificación de que ya
   puede recogerlo.
2. **Given** un pedido `Listo`, **When** se consulta "mis pedidos", **Then**
   el cliente ve el pedido como `Listo` con su detalle.
3. **Given** un fallo en el envío de la notificación, **When** el pedido
   está en `Listo`, **Then** el estado sigue visible en "mis pedidos" y el
   sistema reintenta el envío.
4. **Given** un pedido en `Pagado`, **When** aún no ha llegado a `Listo`,
   **Then** NO se envía ninguna notificación de recogida.

---

### User Story 3 - Pulido y cierre del MVP (Priority: P2)

Como patrocinadora del proyecto, recibo una demostración completa del flujo
(menú → selección → pedido → pago → cocina → preparación → listo →
notificación → recogida) con la interfaz pulida y las pruebas críticas
(pagos, estados, permisos) en verde.

**Why this priority**: Es el criterio de aceptación final del MVP; no aporta
funcionalidad nueva sino confianza y calidad del conjunto.

**Independent Test**: Ejecutando el flujo completo en la demo y corriendo
las pruebas críticas, verificando que todas pasan sin intervención.

**Acceptance Scenarios**:

1. **Given** el sistema completo con datos, **When** se ejecuta el flujo de
   aceptación de principio a fin, **Then** termina con la recogida del
   pedido.
2. **Given** las pruebas críticas (pagos, estados, permisos), **When** se
   ejecutan, **Then** todas pasan.
3. **Given** la interfaz final, **When** se usa en móvil y computadora,
   **Then** cumple con los ajustes visuales de referencia y la legibilidad
   en horarios de receso.

---

### Edge Cases

- La notificación no puede entregarse: el pedido sigue en `Listo`, la
  información queda visible en "mis pedidos" y se reintenta el envío.
- Un cliente con muchos pedidos: la lista se mantiene usable y el estado de
  cada uno es claro.
- Pedido cancelado o entregado: su estado en "mis pedidos" no cambia nunca
  más.
- Pedidos de otros clientes: jamás aparecen en la lista del cliente
  (aislamiento entre cuentas).
- El cocinero marca `Listo` sin cliente conectado: el aviso queda pendiente
  de entrega y el estado es consultable al reconectar.
- Fallo del sistema durante la demo: el flujo puede reiniciarse sin
  duplicar pedidos ni cobros.

## Requirements *(mandatory)*

### Trazabilidad a la spec maestra (001)

| Elemento de 001 | Cobertura en este sprint |
|---|---|
| US3 (seguimiento de mis pedidos) | User Story 1 |
| US2 (parte: notificación de pedido listo) | User Story 2 |
| FR-014 (completo: lista de pedidos y detalle) | Implementación completa |
| FR-019 (notificación) | Implementación completa |
| FR-026 (ejecución local y despliegue de bajo costo) | Pulido y cierre |
| SC-004 (notificación en <1 min), SC-006, SC-007 | Criterios de éxito |
| Pulido de UI, pruebas críticas, demo final | User Story 3 |

### Functional Requirements

**Seguimiento del cliente**

- **FR-014** *(de 001, completo)*: El alumno o docente MUST poder consultar
  la lista de sus pedidos con el estado actual y el detalle (platillos,
  cantidades y total) de cada uno, y MUST NO ver pedidos de otros usuarios.

**Notificaciones**

- **FR-019** *(de 001)*: Cuando un pedido pasa a `Listo`, el sistema MUST
  notificar al alumno o docente que ya puede recogerlo; la notificación MUST
  mantenerse separada de la lógica principal de pedidos y MAY apoyarse en un
  servicio externo; si el envío falla, el estado `Listo` MUST quedar visible
  en "mis pedidos".

**Cierre y calidad**

- **FR-020** *(de 001, verificación final)*: La interfaz MUST ser
  responsiva en móvil y computadora; las pantallas de caja y cocina MUST usar
  controles de alto contraste con área táctil de al menos 44 px y MUST
  priorizar rapidez y legibilidad en horarios de receso.
- **FR-026** *(de 001)*: El sistema MUST poder ejecutarse localmente durante
  el desarrollo y desplegarse con hosting gratuito o de bajo costo, con
  configuraciones separadas de desarrollo y producción.

### Out of Scope (Sprint 5)

- Funcionalidades fuera del alcance del MVP sin aprobación previa:
  reseñas, puntos o promociones de lealtad, inventario, proveedores,
  aplicación móvil nativa, entrega a domicilio.
- Nuevos canales de notificación (SMS, mensajería instantánea).

### Key Entities

- **Pedido**: en este sprint se consulta su recorrido completo por el
  cliente (partidas, total, estado vigente) tal como fue registrado.
- **Notificación**: aviso de "pedido listo" dirigido al cliente;
  destinatario, canal y estado de entrega; generada por el cambio de estado
  a `Listo`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-S5-01**: El 100 % de los pedidos que llegan al estado `Listo`
  generan una notificación entregada al cliente en menos de 1 minuto
  (SC-004 de la maestra).
- **SC-S5-02**: Flujo completo demostrable: menú → selección → pedido →
  pago → cocina → preparación → listo → notificación → recogida, sin pasos
  fallidos en la demo final.
- **SC-S5-03**: 0 pedidos de un cliente visibles en la cuenta de otro en
  todas las pruebas de aislamiento.
- **SC-S5-04**: El 100 % de las pruebas críticas (pagos, estados,
  permisos) pasa antes de la demo final.
- **SC-S5-05**: Durante el periodo piloto, al menos el 95 % de los pedidos
  quedan registrados en el sistema y 0 se pierden por interpretación verbal
  (SC-006 de la maestra).
- **SC-S5-06**: El 90 % del personal de caja y cocina completa sus tareas
  habituales sin ayuda tras una capacitación de 30 minutos o menos (SC-007
  de la maestra).

## Assumptions

- El canal de notificación por defecto es el estado visible en "mis pedidos"
  más un correo al domicilio electrónico registrado; otros canales (SMS,
  mensajería instantánea) quedan fuera del alcance del MVP.
- La funcionalidad de notificaciones se mantiene separada de la lógica
  principal de pedidos y puede apoyarse en un servicio externo si está
  disponible.
- El pulido de UI sigue los tokens de referencia de `docs/DESIGN.md` como
  base editable, sin exigir replicación exacta del diseño original.
- La demo final se valida con la patrocinadora del proyecto, quien aprueba
  la aceptación del MVP.
- Las fechas de este sprint (2026-12-08 → 2026-12-21) son estimadas y se
  ajustan al calendario real del plantel.
- Se aplican las suposiciones generales de la spec maestra 001.
