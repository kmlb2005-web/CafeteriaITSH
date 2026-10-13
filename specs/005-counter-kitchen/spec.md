# Feature Specification: Mostrador (Cajero) y Cocina (Sprint 4)

**Feature Branch**: `005-counter-kitchen`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Sprint 4 — Mostrador (cajero) y cocina: el
cajero captura y cobra pedidos presenciales y el cocinero procesa todos los
pedidos en pantalla con todos los estados operativos (`En preparación`,
`Listo`, `Entregado`, `Cancelado`)." Fuente: `docs/sprints.md` (Sprint 4,
semanas est. 2026-11-24 → 2026-12-07). Subconjunto trazable de la spec
maestra `specs/001-cafeteria-preorder-system/spec.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Captura y cobro en mostrador (Priority: P1)

Como cajero, capturo un pedido hecho presencialmente en el mostrador en la
menor cantidad de pasos posible y registro su cobro; puedo operar estos
pedidos al mismo tiempo que los pedidos anticipados, sin interrumpir el
servicio actual de mostrador.

**Why this priority**: Es la operación que reemplaza la práctica actual y
debe funcionar desde el primer día del sprint, de forma simultánea con los
pedidos anticipados ya existentes.

**Independent Test**: Capturando un pedido presencial completo y verificando
que quede registrado con su cobro mientras existen pedidos anticipados en
curso.

**Acceptance Scenarios**:

1. **Given** un pedido presencial, **When** el cajero lo captura en el
   sistema, **Then** el pedido queda registrado con sus productos,
   cantidades y total.
2. **Given** un pedido de mostrador registrado, **When** el cajero captura su
   cobro, **Then** el cobro queda asociado al pedido.
3. **Given** pedidos anticipados en curso, **When** el cajero captura un
   pedido de mostrador, **Then** puede hacerlo de forma simultánea y sin
   interrumpir la atención en mostrador.
4. **Given** un pedido de mostrador en `Pendiente`, **When** el cajero
   confirma el pago en mostrador, **Then** el pedido pasa a `Pagado`.
5. **Given** un usuario sin sesión o con rol distinto de cajero, **When**
   intenta acceder a la captura de mostrador, **Then** el acceso se le
   deniega.

---

### User Story 2 - Procesamiento de pedidos en cocina (Priority: P1)

Como cocinero, veo en una sola pantalla todos los pedidos entrantes
(anticipados y de mostrador) con sus productos y cantidades y con el orden
de preparación; la lista se actualiza sola para saber qué preparar sin
recargar; cambio el estado de un pedido a `En preparación` y a `Listo`, y
otros estados del flujo se aplican cuando corresponde.

**Why this priority**: La cocina es el corazón de la operación interna; sin
ella los pedidos anticipados del Sprint 3 no avanzan y no hay demo posible.

**Independent Test**: Creando pedidos de muestra (uno anticipado y uno de
mostrador) y verificando que ambos aparecen ordenados por llegada, que los
cambios de estado se reflejan sin recargar y que las transiciones inválidas
se rechazan.

**Acceptance Scenarios**:

1. **Given** un pedido en estado `Pagado`, **When** el cocinero consulta su
   pantalla, **Then** el pedido aparece con sus productos, cantidades y su
   lugar en el orden de preparación.
2. **Given** pedidos de ambos orígenes, **When** el cocinero consulta la
   pantalla, **Then** los ve en una sola lista ordenados por llegada.
3. **Given** un pedido en `En preparación`, **When** el cocinero lo marca
   como `Listo`, **Then** el estado queda registrado y el pedido continúa su
   flujo hacia `Entregado`.
4. **Given** un pedido `Pendiente`, **When** se intenta cambiarlo
   directamente a `Listo`, **Then** la transición se rechaza por saltarse
   estados.
5. **Given** un pedido `Entregado` o `Cancelado`, **When** se intenta
   cambiar su estado, **Then** la operación se rechaza.
6. **Given** el cocinero con la pantalla abierta, **When** otro usuario crea
   o actualiza un pedido, **Then** la lista se actualiza sin que el cocinero
   recargue la página.

---

### Edge Cases

- Dos cocineros actualizan el mismo pedido casi al mismo tiempo: se conserva
  un estado válido y nunca resultan estados inconsistentes.
- Un pedido anticipado del Sprint 3 llega mientras se captura un pedido de
  mostrador: ambos conviven sin interferirse.
- Cajero sin conexión durante el receso: no se pierden pedidos capturados y
  los reintentos no duplican pedidos ni cobros.
- Personal de cocina sin pantalla conectada: al reconectar, ve el estado
  actual de los pedidos sin necesidad de recargar manualmente.
- Pedido cancelado o entregado: no admite ninguna transición posterior.
- Pedido de mostrador con platillos no disponibles: el sistema rechaza su
  selección con mensaje claro.
- Fallo o caída del sistema durante el receso: la atención en mostrador
  continúa sin interrupción (operación manual) y los pedidos capturados
  después no duplican los anteriores.

## Requirements *(mandatory)*

### Trazabilidad a la spec maestra (001)

| Elemento de 001 | Cobertura en este sprint |
|---|---|
| US4 (pedidos de mostrador) | User Story 1 |
| US2 (parte: preparación en cocina, sin notificación) | User Story 2 |
| FR-015, FR-016, FR-017, FR-018 | Implementación completa |
| FR-013 (completo: flujo de estados y transiciones) | Implementación completa |
| FR-020 (alto contraste y 44 px en caja/cocina) | Implementación completa |
| US2 (parte: notificación de pedido listo) | Sprint 5 |
| US3 (seguimiento del cliente) | Sprint 5 |

### Functional Requirements

**Mostrador (cajero)**

- **FR-015** *(de 001)*: El cajero MUST poder capturar pedidos presenciales
  en la menor cantidad de pasos posible y registrar y gestionar su cobro.
- **FR-016** *(de 001)*: Los pedidos anticipados y los de mostrador MUST
  poder operarse simultáneamente sin interrumpir el servicio actual de
  mostrador.

**Cocina (cocinero)**

- **FR-017** *(de 001)*: La pantalla de cocina MUST mostrar en un solo lugar
  los pedidos entrantes (anticipados y de mostrador) con sus productos,
  cantidades y su orden de preparación, y MUST actualizarse sin que el
  cocinero recargue la página manualmente.
- **FR-018** *(de 001)*: El cocinero MUST poder cambiar el estado de un
  pedido a `En preparación` y a `Listo`, respetando las transiciones de
  FR-013.

**Estados y transiciones**

- **FR-013** *(de 001, completo)*: Todo pedido MUST mantener siempre uno de
  estos estados: `Pendiente`, `Pagado`, `En preparación`, `Listo`,
  `Entregado`, `Cancelado`, con el flujo `Pendiente → Pagado → En
  preparación → Listo → Entregado`; el sistema MUST permitir que un pedido
  pase a `Cancelado` antes de `Entregado`; el sistema MUST rechazar
  transiciones que salten estados o que modifiquen un pedido `Entregado` o
  `Cancelado`.

**Calidad y seguridad de la experiencia**

- **FR-020** *(de 001)*: La interfaz MUST ser responsiva en móvil y
  computadora; las pantallas de caja y cocina MUST usar controles de alto
  contraste con área táctil de al menos 44 px y MUST priorizar rapidez y
  legibilidad en horarios de receso.
- **FR-021** *(de 001)*: Los datos MUST validarse antes de procesarse y
  almacenarse, tanto en la interfaz como en el servidor; los datos inválidos
  MUST NO llegar a la lógica de negocio.
- **FR-022** *(de 001)*: El sistema MUST mostrar mensajes de error claros al
  usuario y MUST NO exponer trazas de errores ni información interna del
  servidor.

*Nota*: la transición `Listo → Entregado` y la cancelación desde caja
pueden operarse en este sprint como parte del flujo; el aviso al cliente al
llegar a `Listo` es responsabilidad del Sprint 5 (FR-019).

### Out of Scope (Sprint 4)

- Notificaciones a clientes (Sprint 5).
- Listado completo de "mis pedidos" (Sprint 5).
- Funcionalidades fuera del alcance del MVP (reseñas, inventario, puntos de
  lealtad).

### Key Entities

- **Pedido**: solicitud de uno o más platillos; tipo (anticipado o de
  mostrador), autor (cliente o cajero), partidas, total, hora programada de
  recogida y estado (flujo completo).
- **Partida de pedido**: platillo y cantidad dentro de un pedido, con el
  precio registrado al momento de crearlo.
- **Pago / Transacción**: en este sprint incluye el cobro de pedidos de
  mostrador; referencia y resultado, sin datos sensibles de tarjeta.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-S4-01**: El cajero captura y cobra un pedido de mostrador en menos de
  1 minuto durante la demo, en el 100 % de los intentos probados.
- **SC-S4-02**: Cajero y pedidos anticipados operan a la vez: 0 interferencias
  en las pruebas simultáneas del sprint.
- **SC-S4-03**: La pantalla de cocina muestra ambos orígenes en una sola
  lista, ordenados por llegada, y se actualiza en menos de 5 segundos sin
  recargas manuales.
- **SC-S4-04**: El 100 % de las transiciones inválidas probadas (saltos de
  estado, cambios sobre `Entregado`/`Cancelado`) se rechazan.
- **SC-S4-05**: El 100 % de los controles de caja y cocina cumplen el área
  táctil mínima de 44 px y contraste alto.
- **SC-S4-06**: El 100 % de las pruebas automatizadas del sprint pasan antes
  de la demo.

*De la spec maestra, contribución*: SC-002 (reducir la espera en caja) y
SC-006 (pedidos registrados en sistema, cero errores verbales) comienzan a
medirse con este sprint.

## Assumptions

- Si el sistema no está disponible durante un receso, la atención en
  mostrador continúa de forma manual y sin interrupción.
- La conectividad a internet dentro del plantel puede ser intermitente; los
  reintentos no deben duplicar pedidos ni cobros.
- El cobro de mostrador se registra en el sistema con la misma noción de
  transacción que el pago anticipado, sin datos sensibles de tarjeta.
- Los pedidos anticipados creados en el Sprint 3 ya existen y son visibles
  en cocina desde el inicio de este sprint.
- La capacitación básica del personal de caja y cocina se realiza en la
  semana de este sprint (meta: 30 minutos o menos, SC-007 de la maestra).
- Las fechas de este sprint (2026-11-24 → 2026-12-07) son estimadas y se
  ajustan al calendario real del plantel.
- Se aplican las suposiciones generales de la spec maestra 001.
