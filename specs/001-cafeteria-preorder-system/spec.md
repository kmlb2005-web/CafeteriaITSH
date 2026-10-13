# Feature Specification: Sistema de Pedidos Anticipados — Cafetería ITSH

**Feature Branch**: `001-cafeteria-preorder-system`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Construir un sistema web de pedidos anticipados
llamado «Sistema de Pedidos Anticipados — Cafetería ITSH» para que alumnos y
docentes del Instituto Tecnológico Superior de Huauchinango consulten el menú,
hagan pedidos y pagos por adelantado, y reciban una notificación cuando su
pedido esté listo, sin interrumpir el servicio actual de mostrador."
Descripción completa de origen: `docs/spec-input.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pedido anticipado con pago (Priority: P1)

Como alumno o docente, consulto el menú del día (platillos, precios,
disponibilidad y especiales del día), selecciono uno o más platillos con sus
cantidades, reviso el total antes de confirmar y registro mi pedido con al
menos 10 minutos de anticipación; el pago en línea forma parte del mismo
flujo y, cuando se confirma, mi pedido queda en estado `Pagado`.

**Why this priority**: Es el valor central del proyecto: adelantar y pagar el
pedido es lo que permite reducir el tiempo de espera en caja durante los
recesos.

**Independent Test**: Puede probarse por completo con un cliente
auto-registrado y un menú ya cargado, creando un pedido con ≥10 minutos de
anticipación y confirmando un pago, sin depender de cocina ni de caja.

**Acceptance Scenarios**:

1. **Given** un menú del día con platillos disponibles, **When** el cliente
   selecciona platillos y cantidades, **Then** ve el total antes de confirmar.
2. **Given** un cliente cuyo pedido se confirmaría con menos de 10 minutos de
   anticipación, **When** intenta confirmar, **Then** el sistema rechaza el
   pedido y explica el motivo de forma clara.
3. **Given** un platillo marcado como no disponible, **When** el cliente arma
   su pedido, **Then** ese platillo no puede seleccionarse.
4. **Given** un pedido confirmado, **When** el pago se confirma, **Then** el
   pedido pasa al estado `Pagado`.
5. **Given** un pago que no se confirma (rechazo o fallo del servicio de
   pago), **When** termina el intento, **Then** el pedido NO queda como
   `Pagado` y el cliente ve un mensaje claro sin información interna.
6. **Given** un platillo eliminado o modificado después de creado un pedido
   en curso, **When** se consulta ese pedido, **Then** conserva sus partidas
   y el total registrado en el momento de la compra.

---

### User Story 2 - Preparación en cocina y aviso de pedido listo (Priority: P2)

Como cocinero, veo en una sola pantalla todos los pedidos entrantes
(anticipados y de mostrador) con sus productos y cantidades y con el orden de
preparación; la lista se actualiza sola para saber qué preparar sin recargar;
cambio el estado de un pedido a `En preparación` y a `Listo`. Cuando un pedido
pasa a `Listo`, el alumno o docente recibe la notificación de que ya puede
recogerlo.

**Why this priority**: Sin preparación y aviso, el pedido anticipado nunca se
completa; este flujo entrega valor de forma independiente porque también
atiende los pedidos de mostrador.

**Independent Test**: Puede probarse creando pedidos de muestra (uno
anticipado y uno de mostrador) y verificando que aparezcan en pantalla, que
los cambios de estado se reflejen sin recargar y que el cambio a `Listo`
genere la notificación al cliente.

**Acceptance Scenarios**:

1. **Given** un pedido en estado `Pagado`, **When** el cocinero consulta su
   pantalla, **Then** el pedido aparece con sus productos, cantidades y su
   lugar en el orden de preparación.
2. **Given** un pedido visible en cocina, **When** el cocinero lo cambia a
   `En preparación`, **Then** el nuevo estado queda registrado y visible para
   el cliente sin recargar manualmente.
3. **Given** un pedido en `En preparación`, **When** el cocinero lo cambia a
   `Listo`, **Then** se envía la notificación de recogida al alumno o docente
   del pedido.
4. **Given** un pedido `Pendiente`, **When** se intenta cambiarlo
   directamente a `Listo`, **Then** la transición se rechaza por saltarse
   estados.
5. **Given** un pedido `Entregado` o `Cancelado`, **When** se intenta cambiar
   su estado, **Then** la operación se rechaza.
6. **Given** el cocinero con la pantalla abierta, **When** otro usuario crea
   o actualiza un pedido, **Then** la lista se actualiza sin que el cocinero
   recargue la página.

---

### User Story 3 - Seguimiento de mis pedidos (Priority: P3)

Como alumno o docente, consulto la lista de mis pedidos con el estado actual
de cada uno y el detalle de cada pedido (platillos, cantidades y total), lo
que me permite saber cuándo recoger y qué pagué.

**Why this priority**: Da confianza y visibilidad al cliente, pero puede
probarse de forma independiente con pedidos ya existentes.

**Independent Test**: Con pedidos creados previamente en distintos estados,
el cliente inicia sesión y verifica que su lista y detalle coincidan con el
estado real de cada pedido.

**Acceptance Scenarios**:

1. **Given** un cliente con pedidos en distintos estados, **When** consulta
   "mis pedidos", **Then** ve cada pedido con su estado actual.
2. **Given** un pedido del cliente, **When** abre su detalle, **Then** ve
   platillos, cantidades y total.
3. **Given** un pedido recién creado y pagado, **When** el cliente consulta
   "mis pedidos", **Then** el pedido aparece como `Pagado`.
4. **Given** un pedido de otro cliente, **When** un cliente consulta su
   lista, **Then** no aparece.

---

### User Story 4 - Pedidos de mostrador (Priority: P4)

Como cajero, capturo un pedido hecho presencialmente en el mostrador en la
menor cantidad de pasos posible y registro su cobro; puedo operar estos
pedidos al mismo tiempo que los pedidos anticipados, sin interrumpir el
servicio actual de mostrador.

**Why this priority**: Sustituye la operación manual actual y evita errores
de interpretación verbal, pero el sistema ya aporta valor con el pedido
anticipado.

**Independent Test**: Capturando un pedido presencial completo y verificando
que quede registrado con su cobro mientras existen pedidos anticipados en
curso.

**Acceptance Scenarios**:

1. **Given** un pedido presencial, **When** el cajero lo captura en el
   sistema, **Then** el pedido queda registrado con sus productos, cantidades
   y total.
2. **Given** un pedido de mostrador registrado, **When** el cajero captura su
   cobro, **Then** el cobro queda asociado al pedido.
3. **Given** pedidos anticipados en curso, **When** el cajero captura un
   pedido de mostrador, **Then** puede hacerlo de forma simultánea y sin
   interrumpir la atención en mostrador.
4. **Given** un pedido de mostrador en `Pendiente`, **When** el cajero
   confirma el pago en mostrador, **Then** el pedido pasa a `Pagado`.

---

### User Story 5 - Administración de menú y usuarios (Priority: P5)

Como administrador, creo y modifico el menú diario, los platillos, los
especiales del día, los precios y la disponibilidad, y gestiono a los
usuarios operativos (cajeros y cocineros); mis cambios se reflejan de
inmediato para los usuarios finales.

**Why this priority**: Es la operación que alimenta al sistema; el sistema
puede demostrarse con datos de ejemplo mientras se desarrolla esta gestión.

**Independent Test**: Modificando un precio o marcando un platillo como no
disponible y verificando de inmediato el efecto en la vista del cliente,
y creando un usuario operativo que puede iniciar sesión y accede solo a su
módulo.

**Acceptance Scenarios**:

1. **Given** un platillo existente, **When** el administrador cambia su
   precio, **Then** los clientes ven el precio nuevo en su siguiente
   consulta del menú.
2. **Given** un platillo disponible, **When** el administrador lo marca como
   no disponible, **Then** los clientes no pueden seleccionarlo en pedidos
   nuevos.
3. **Given** un especial del día, **When** el administrador lo crea o lo
   modifica, **Then** aparece en la consulta del menú del día.
4. **Given** un nuevo cajero o cocinero, **When** el administrador crea su
   cuenta, **Then** ese usuario puede iniciar sesión y accede únicamente a
   su módulo.
5. **Given** un usuario operativo dado de baja, **When** intenta iniciar
   sesión, **Then** el acceso le es denegado.

---

### Edge Cases

- El servicio de pago externo no responde o expira: el pedido no pasa a
  `Pagado`, el cliente ve un mensaje claro y puede reintentar sin duplicar
  el pedido.
- Se cumple la hora límite de 10 minutos mientras el cliente confirma: el
  pedido se rechaza y el carrito conserva la selección para reintentar con
  otro horario.
- Menú sin platillos disponibles o sin menú cargado para el día: el cliente
  ve un aviso y no puede crear un pedido.
- Conexión a internet intermitente dentro del plantel: el sistema no pierde
  ni duplica pedidos ni pagos tras un reintento, y muestra mensajes claros.
- La notificación no puede entregarse: el pedido sigue en `Listo`, la
  información queda visible en "mis pedidos" y se reintenta el envío.
- Dos usuarios intentan actualizar el mismo pedido casi al mismo tiempo: se
  conserva un estado válido y nunca resultan estados inconsistentes.
- Pedido en `Cancelado` o `Entregado`: no admite ninguna transición posterior.
- Personal de cocina sin pantalla conectada: al reconectar, ve el estado
  actual de los pedidos sin necesidad de recargar manualmente.
- Fallo o caída del sistema durante el receso: la atención en mostrador
  continúa sin interrupción (operación manual) y los pedidos capturados
  después no duplican los anteriores.

## Requirements *(mandatory)*

### Functional Requirements

**Usuarios, roles y acceso**

- **FR-001**: El sistema MUST permitir el registro e inicio de sesión con
  correo electrónico y contraseña; las contraseñas MUST almacenarse de forma
  que no sean legibles (nunca en texto plano).
- **FR-002**: Cada usuario MUST tener un rol: administrador, cajero, cocinero
  o alumno/docente.
- **FR-003**: Cada usuario MUST acceder solo a las funciones y pantallas de
  su rol; un usuario sin un rol MUST NO poder acceder a su módulo.
- **FR-004**: El administrador MUST poder crear, editar y dar de baja a los
  usuarios operativos (cajeros y cocineros).
- **FR-005**: Los alumnos y docentes MUST poder registrarse por cuenta
  propia y usar la vista de cliente (menú y mis pedidos).

**Menú**

- **FR-006**: El administrador MUST poder crear y modificar el menú diario,
  los platillos, los especiales del día, los precios y la disponibilidad.
- **FR-007**: Los cambios de menú MUST reflejarse de inmediato para los
  usuarios finales.
- **FR-008**: Un platillo marcado como no disponible MUST NO poder
  seleccionarse en pedidos nuevos.
- **FR-009**: El alumno o docente MUST poder consultar el menú del día con
  platillos, precios, disponibilidad y especiales del día.

**Pedido anticipado y pago**

- **FR-010**: El cliente MUST poder seleccionar uno o más platillos con sus
  cantidades y MUST ver el total del pedido antes de confirmarlo.
- **FR-011**: Un pedido anticipado MUST realizarse con al menos 10 minutos de
  anticipación; el sistema MUST rechazar los intentos con menos de 10
  minutos.
- **FR-012**: El pago en línea MUST formar parte del flujo del pedido; un
  pedido anticipado MUST pasar a `Pagado` solo cuando el pago se confirma, y
  el sistema MUST NO almacenar información sensible de tarjetas bancarias
  (solo la referencia necesaria para identificar y validar la transacción).
- **FR-013**: Todo pedido MUST mantener siempre uno de estos estados:
  `Pendiente`, `Pagado`, `En preparación`, `Listo`, `Entregado`, `Cancelado`,
  con el flujo `Pendiente → Pagado → En preparación → Listo → Entregado`;
  un pedido MUST poder pasar a `Cancelado` antes de `Entregado`; el sistema MUST
  rechazar transiciones que salten estados o que modifiquen un pedido
  `Entregado` o `Cancelado`.
- **FR-014**: El alumno o docente MUST poder consultar la lista de sus
  pedidos con el estado actual y el detalle (platillos, cantidades y total)
  de cada uno, y MUST NO ver pedidos de otros usuarios.

**Mostrador (cajero)**

- **FR-015**: El cajero MUST poder capturar pedidos presenciales en la menor
  cantidad de pasos posible y registrar y gestionar su cobro.
- **FR-016**: Los pedidos anticipados y los de mostrador MUST poder
  operarse simultáneamente sin interrumpir el servicio actual de mostrador.

**Cocina (cocinero)**

- **FR-017**: La pantalla de cocina MUST mostrar en un solo lugar los
  pedidos entrantes (anticipados y de mostrador) con sus productos,
  cantidades y su orden de preparación, y MUST actualizarse sin que el
  cocinero recargue la página manualmente.
- **FR-018**: El cocinero MUST poder cambiar el estado de un pedido a
  `En preparación` y a `Listo`, respetando las transiciones de FR-013.

**Notificaciones**

- **FR-019**: Cuando un pedido pasa a `Listo`, el sistema MUST notificar al
  alumno o docente que ya puede recogerlo; la notificación MUST mantenerse
  separada de la lógica principal de pedidos y MAY apoyarse en un servicio
  externo; si el envío falla, el estado `Listo` MUST quedar visible en "mis
  pedidos".

**Calidad y seguridad de la experiencia**

- **FR-020**: La interfaz MUST ser responsiva en móvil y computadora; las
  pantallas de caja y cocina MUST usar controles de alto contraste con área
  táctil de al menos 44 px y MUST priorizar rapidez y legibilidad en horarios
  de receso.
- **FR-021**: Los datos MUST validarse antes de procesarse y almacenarse,
  tanto en la interfaz como en el servidor; los datos inválidos MUST NO
  llegar a la lógica de negocio.
- **FR-022**: El sistema MUST mostrar mensajes de error claros al usuario y
  MUST NO exponer trazas de errores ni información interna del servidor.
- **FR-023**: Credenciales, claves secretas y tokens MUST NO incluirse en el
  código fuente ni en el repositorio.
- **FR-024**: En producción, la comunicación del sistema MUST viajar por un
  canal cifrado de extremo a extremo entre el usuario y el sistema.
- **FR-025**: El sistema MUST responder adecuadamente en horarios de mayor
  demanda y MUST permitir consultar el menú con rapidez durante los recesos
  (ver SC-003 y SC-005).
- **FR-026**: El sistema MUST poder ejecutarse localmente durante el
  desarrollo y desplegarse con hosting gratuito o de bajo costo, con
  configuraciones separadas de desarrollo y producción.

### Out of Scope

- Aplicación móvil nativa (solo web responsiva).
- Sistema de reseñas, puntos o promociones de lealtad.
- Gestión de inventario ni de proveedores.
- Entrega a domicilio (la recogida es en la cafetería).
- Cualquier funcionalidad fuera del alcance del MVP sin aprobación previa.

### Key Entities

- **Usuario**: persona con cuenta en el sistema; correo, contraseña (no
  legible), nombre y rol (administrador, cajero, cocinero, alumno/docente);
  relación: un usuario puede ser autor de pedidos (cliente) o gestor de
  operaciones (personal).
- **Platillo**: producto ofrecido; nombre, precio, disponibilidad y a qué
  menú pertenece.
- **Menú del día**: conjunto de platillos y especiales ofrecidos en una
  fecha; los cambios aquí se reflejan a los clientes.
- **Pedido**: solicitud de uno o más platillos; tipo (anticipado o de
  mostrador), autor (cliente o cajero), partidas, total, hora programada de
  recogida (≥10 minutos de anticipación en pedidos anticipados) y estado.
- **Partida de pedido**: platillo y cantidad dentro de un pedido, con el
  precio registrado al momento de crearlo.
- **Pago / Transacción**: registro de la intención y resultado del pago de
  un pedido; referencia de la transacción y su estado, sin datos sensibles
  de tarjeta; relación: uno a uno con el pedido.
- **Notificación**: aviso de "pedido listo" dirigido al cliente; destinatario,
  canal y estado de entrega; generada por el cambio de estado a `Listo`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de los pedidos anticipados puede registrarse con al
  menos 10 minutos de anticipación, y el sistema rechaza el 100 % de los
  intentos con menos de 10 minutos.
- **SC-002**: El tiempo de espera en caja se reduce en al menos 50 % durante
  los recesos, comparado con la medición previa al sistema.
- **SC-003**: Un alumno o docente completa el flujo consulta de menú →
  selección → creación del pedido → pago en menos de 3 minutos.
- **SC-004**: El 100 % de los pedidos que llegan al estado `Listo` generan
  una notificación entregada al cliente en menos de 1 minuto.
- **SC-005**: Durante los recesos, el 95 % de las consultas de menú y la
  visualización de nuevos pedidos en cocina se muestran en menos de 2
  segundos, sin recargas manuales.
- **SC-006**: Durante el periodo piloto, al menos el 95 % de los pedidos
  quedan registrados en el sistema y cero pedidos se pierden por
  interpretación verbal (meta: reducir esos errores a cero).
- **SC-007**: El 90 % del personal de caja y cocina completa sus tareas
  habituales sin ayuda tras una capacitación de 30 minutos o menos.

## Assumptions

- Los alumnos y docentes se registran por cuenta propia; el administrador
  solo crea y gestiona usuarios operativos (cajeros y cocineros).
- El canal de notificación por defecto es el estado visible en "mis pedidos"
  más un correo al domicilio electrónico registrado; otros canales (SMS,
  mensajería instantánea) quedan fuera del alcance del MVP.
- El pago se realiza con un proveedor externo de pago en línea que acepte
  tarjetas en México; la selección del proveedor se decide en la fase de
  planificación y el sistema solo registra referencia y resultado de la
  transacción.
- Los precios están expresados en pesos mexicanos (MXN) y ya incluyen
  impuestos; el sistema no calcula impuestos por separado en el MVP.
- Existe un solo menú activo por día, preparado con anticipación por el
  administrador; el sistema no calcula automáticamente el menú.
- La recogida es presencial en la cafetería; no hay entrega a domicilio ni
  reserva de horarios de recogida más allá de la hora programada del pedido.
- La conectividad a internet dentro del plantel puede ser intermitente; los
  reintentos del cliente o del cajero no deben duplicar pedidos ni pagos.
- Si el sistema no está disponible durante un receso, la atención en
  mostrador continúa de forma manual y sin interrupción.
- El sistema se despliega en hosting gratuito o de bajo costo acorde con un
  proyecto académico, y debe poder ejecutarse en equipos locales para
  desarrollo y demostración.
- Los diseños de referencia (tokens de diseño) son una base editable; la
  interfaz final puede ajustarse durante el desarrollo siempre que cumpla
  los requisitos de usabilidad de esta especificación.
