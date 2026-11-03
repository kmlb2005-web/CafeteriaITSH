# Feature Specification: Rediseño de Interfaz por Rol (UI/UX)

**Feature Branch**: `007-ui-redesign`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "Rediseñar la interfaz de la aplicación por rol siguiendo los documentos de diseño UI/UX del proyecto (`design/diseño-operativo.md`, `design/diseño-cocina.md`, `design/diseño-cliente.md`): navegación con menú lateral (drawer) y barra inferior (bottom bar) donde corresponda, panel de inicio del admin con acciones rápidas, flujo de caja con catálogo, barra flotante de cobro y entregas, tablero de cocina con tiempo transcurrido y feedback de actualización, y app del cliente con filtros, barra flotante y aviso de pedido listo. Solo interfaz, sin funcionalidad nueva de backend."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Caja: captura y cobro rápidos con navegación nueva (Priority: P1)

Como cajero, quiero navegar la caja con un menú lateral y una barra
inferior de secciones (`Caja` y `Entregas` con contador), y capturar un
pedido de mostrador buscando o filtrando por categoría, ajustando cantidades
con steppers y cobrando desde una barra flotante con el total, para atender
en pocos toques durante el receso.

**Why this priority**: la caja es la pantalla con mayor presión de tiempo
(constitución §V: reducir el tiempo de espera en caja) y concentra el flujo
crítico de captura + cobro que hoy ya existe; el rediseño lo hace más rápido
sin cambiar su alcance.

**Independent Test**: puede probarse completamente en `/caja`: navegar entre
`Caja` y `Entregas` desde la barra inferior y el menú lateral, capturar un
pedido con búsqueda/categorías/stepper, cobrarlo desde la barra flotante y
verificar el folio y el contador de entregas.

**Acceptance Scenarios**:

1. **Given** el cajero está en el catálogo, **When** busca un producto o
   toca una categoría, **Then** la lista muestra solo los productos
   coincidentes y el stepper de cada fila sigue siendo usable.
2. **Given** hay productos con cantidad > 0, **When** observa la barra
   flotante, **Then** muestra el número de platillos y el total, y el botón
   de cobro está habilitado.
3. **Given** un pedido sin productos, **When** intenta entrar al resumen de
   cobro, **Then** se informa que debe agregar al menos un platillo.
4. **Given** el cobro se registra con éxito, **When** termina el proceso,
   **Then** se muestra el folio, el estado Pagado y un botón para un nuevo
   pedido que limpia el carrito.
5. **Given** el cobro falla, **When** se informa el error, **Then** el
   pedido queda Pendiente y se ofrecen `Reintentar cobro` y
   `Cancelar pedido`.
6. **Given** cocina marcó pedidos como Listo, **When** el cajero abre
   `Entregas`, **Then** ve cada pedido con folio, cliente, partidas, badge
   `Listo` y puede entregarlo o cancelarlo; el contador de la barra
   inferior se actualiza.
7. **Given** no hay pedidos listos, **When** abre `Entregas`, **Then** ve
   el estado vacío "¡Todo está al día!".
8. **Given** el cajero está en cualquier pantalla de caja, **When** abre el
   menú lateral, **Then** ve su perfil, Inicio, Capturar pedido, Pedidos
   listos con contador y Cerrar sesión.

---

### User Story 2 - Cocina: tablero de pedidos legible y actualizado (Priority: P2)

Como cocinero, quiero un tablero con una sola pantalla donde cada tarjeta
muestre folio grande, origen, hora de recolección, tiempo transcurrido,
partidas con cantidades destacadas y un botón único de avance, con un
indicador visible de cuándo se actualizó la información, para preparar por
orden de llegada sin confusiones.

**Why this priority**: cocina es el eslabón que conecta pago y entrega;
FR-017 exige una sola pantalla y el valor está en identificar el orden y el
tiempo a un metro de distancia.

**Independent Test**: puede probarse en `/cocina` con pedidos pagados de
ambos orígenes: verificar orden de llegada, tiempos, avance de estados en
un toque y el indicador de actualización.

**Acceptance Scenarios**:

1. **Given** hay pedidos pagados, **When** se carga el tablero, **Then**
   aparecen en orden de llegada, mezclando anticipados y mostrador, cada uno
   con badge de estado y chip de origen.
2. **Given** un pedido anticipado con hora de recolección, **When** se
   muestra la tarjeta, **Then** la hora de recogida es visible con énfasis y
   si ya se pasó se marca como retrasado.
3. **Given** un pedido en estado Pagado, **When** el cocinero toca la
   acción, **Then** avanza a En preparación; si está En preparación, avanza
   a Listo; el botón es de área táctil ≥ 44 px y está deshabilitado mientras
   procesa.
4. **Given** el tablero está abierto, **When** pasa el ciclo de
   actualización, **Then** el indicador muestra la frescura del dato sin
   recarga manual de la página.
5. **Given** otro operador ya avanzó o canceló un pedido, **When** falla el
   avance, **Then** se muestra el aviso del servidor y el tablero se
   re-sincroniza.
6. **Given** no hay pedidos, **When** se carga el tablero, **Then** aparece
   el estado vacío "¡Todo está al día!".

---

### User Story 3 - Cliente: menú con filtros, pedido guiado y aviso de listo (Priority: P3)

Como alumno o docente, quiero navegar con menú lateral y barra inferior
(`Menú` y `Mis pedidos` con contador), filtrar el menú por categoría o
búsqueda, ver el total en una barra flotante, revisar y confirmar mi pedido
con la regla de 10 minutos visible, pagarlo y ver el aviso "¡Listo para
recoger!" en mis pedidos.

**Why this priority**: es la experiencia del usuario final; el flujo ya
existe y el rediseño mejora la claridad, pero depende de que caja y cocina
estén operativos para que el ciclo completo tenga valor.

**Independent Test**: puede probarse de extremo a extremo en `/menu` →
confirmar → pago → `/mis-pedidos` con un pedido real, incluyendo filtros,
barra flotante, validación de anticipación y estados del pedido.

**Acceptance Scenarios**:

1. **Given** el menú tiene productos de varias categorías, **When** el
   cliente busca o toca una categoría, **Then** la lista se filtra y los no
   disponibles quedan atenuados y no seleccionables.
2. **Given** el carrito tiene productos, **When** aparece la barra
   flotante, **Then** muestra cantidad y total, y conduce a la revisión del
   pedido.
3. **Given** el carrito está vacío, **When** entra a la revisión, **Then**
   ve "Tu carrito está vacío" con acceso de vuelta al menú.
4. **Given** el cliente elige una hora de recolección a menos de 10 minutos,
   **When** intenta continuar, **Then** se muestra el error con la hora
   mínima posible y no avanza.
5. **Given** el pago es rechazado, **When** se informa, **Then** el pedido
   queda Pendiente con opciones de reintentar o cancelar, y la pantalla
   explica que no se capturan datos de tarjeta.
6. **Given** un pedido está Listo, **When** el cliente abre Mis pedidos,
   **Then** ve el aviso destacado "¡Listo para recoger!" con badge de estado
   y el detalle expandible del pedido.
7. **Given** el cliente tiene la barra inferior, **When** toca
   `Mis pedidos`, **Then** llega directamente; el flujo de pedido muestra
   botón de regresar en cada paso.

---

### User Story 4 - Admin: inicio con acciones rápidas y CRUD más claro (Priority: P4)

Como administrador, quiero un panel de inicio con accesos rápidos a
Usuarios, Platillos y Menú del día (con conteos del día), y pantallas de
gestión con listados de filas altas, buscadores/filtros y CTA fijos, para
encontrar y editar información en menos pasos.

**Why this priority**: mejora la operación interna pero no forma parte del
flujo crítico de receso; puede implementarse después de caja/cocina sin
bloquear nada.

**Independent Test**: puede probarse en `/admin`: verificar el inicio con
conteos, entrar a cada sección desde las tarjetas de acción y realizar un
alta/edición completa de usuario, platillo y elemento del menú del día.

**Acceptance Scenarios**:

1. **Given** el administrador entra a su inicio, **When** se carga la
   pantalla, **Then** ve tarjetas de acción con conteos de usuarios,
   platillos y menú de hoy, más el resumen del menú con especiales y no
   disponibles.
2. **Given** la lista de usuarios, **When** busca o filtra, **Then**
   encuentra rapidamente y puede editar o deshabilitar con confirmación.
3. **Given** el catálogo de platillos, **When** usa buscador y chips de
   categoría, **Then** filtra y puede crear o editar platillos.
4. **Given** el menú de una fecha, **When** modifica precio, disponibilidad
   o especial, **Then** los cambios se reflejan de inmediato en la lista y
   el cliente los verá en su menú.
5. **Given** una sección sin registros, **When** se carga, **Then** ve el
   estado vacío con CTA para crear el primer elemento.
6. **Given** una falla de red, **When** falla cualquier carga, **Then** ve
   el mensaje de error con `Reintentar`.

---

### Edge Cases

- ¿Qué pasa cuando el menú del día está vacío o todos los platillos están
  no disponibles? (caja y cliente muestran estado vacío explicativo).
- ¿Qué pasa si el cobro falla a mitad del proceso? (pedido Pendiente;
  reintentar o cancelar; nunca duplicar cobro).
- ¿Qué pasa si dos operadores actúan sobre el mismo pedido (cocina o
  entrega)? (conflicto detectado, aviso y re-sincronización).
- ¿Qué pasa si el indicador de frescura del tablero falla? (mensaje de sin
  conexión sin bloquear la vista).
- ¿Qué pasa si el carrito persistente del cliente apunta a un producto que
  ya no está disponible? (se informa y se permite quitarlo antes de pagar).
- ¿Qué pasa en pantalla angosta (móvil) con drawer y barra flotante?
  (drawer entra desde la izquierda; barra flotante se apila sobre la barra
  inferior; nada tapa el CTA principal).
- ¿Qué pasa cuando no hay pedidos listos para entregar/notificar?
  (estados vacíos con ilustración, sin contadores fantasma).

## Requirements *(mandatory)*

### Functional Requirements

**Navegación (aplica a las 4 interfaces):**

- **FR-001**: La aplicación MUST ofrecer navegación por menú lateral
  (drawer) con perfil del usuario, secciones de su rol y cerrar sesión,
  reemplazando la barra de pestañas horizontal actual.
- **FR-002**: El drawer MUST mostrarse como panel lateral fijo en
  escritorio y como panel deslizante sobre fondo oscurecido en móvil.
- **FR-003**: Caja y cliente MUST contar además con una barra inferior de
  secciones en móvil: caja (`Caja`, `Entregas` con contador) y cliente
  (`Menú`, `Mis pedidos` con contador cuando hay pedido Listo).
- **FR-004**: La navegación MUST conservar las rutas por rol existentes
  (`/admin`, `/caja`, `/cocina`, `/menu`, `/mis-pedidos`) y la protección
  por sesión y rol.

**Caja:**

- **FR-005**: El catálogo de caja MUST permitir búsqueda por texto y
  filtrado por categoría, con stepper de cantidades por producto (0 a 99,
  `−` deshabilitado en 0).
- **FR-006**: Una barra flotante MUST mostrar el número de platillos y el
  total mientras haya productos, y conducir al resumen de cobro.
- **FR-007**: El resumen de cobro MUST mostrar el desglose con opción de
  quitar ítems, el total destacado y un CTA único `Registrar y cobrar` que
  registra y cobra en un solo paso (SC-S4-01), mostrando folio y estado al
  éxito, o `Reintentar cobro` y `Cancelar pedido` si el cobro falla.
- **FR-008**: La pantalla de entregas MUST listar pedidos Listo con folio,
  hora, cliente, partidas y badge de estado, con CTA `Entregar` y
  `Cancelar`, contador en la barra inferior y estado vacío
  "¡Todo está al día!".

**Cocina:**

- **FR-009**: El tablero MUST mostrar los pedidos pagados de ambos
  orígenes en una sola pantalla, ordenados por llegada (FR-017).
- **FR-010**: Cada tarjeta MUST mostrar folio grande, badge de estado, chip
  de origen, hora de registro, hora de recolección (si existe) con énfasis,
  tiempo transcurrido — marcado como retrasado cuando se pase la hora de
  recolección —, partidas con cantidades destacadas y un CTA único de avance
  de ≥ 44 px, deshabilitado mientras procesa.
- **FR-011**: El tablero MUST indicar de forma visible la frescura del dato
  (última actualización) sin recarga manual, y ante un fallo de
  sincronización MUST avisarlo sin bloquear la vista.
- **FR-012**: Si el avance de estado falla porque otro operador ya actuó,
  el tablero MUST mostrar el aviso y re-sincronizar.

**Cliente:**

- **FR-013**: El menú del cliente MUST ofrecer búsqueda, chips de
  categoría, stepper por producto, badges `Especial`/`No disponible`
  (los no disponibles, no seleccionables) y barra flotante con cantidad y
  total que conduce a la revisión del pedido.
- **FR-014**: La revisión MUST validar en cliente la regla de 10 minutos de
  anticipación con mensaje que incluya la hora mínima posible, y el pago
  MUST explicar que no se capturan datos de tarjeta, conservando los
  estados rechazado → Pendiente → reintentar/cancelar.
- **FR-015**: Mis pedidos MUST mostrar cada pedido con badge de estado,
  detalle expandible y aviso destacado "¡Listo para recoger!" cuando esté
  Listo; con estado vacío y CTA a un nuevo pedido.

**Admin:**

- **FR-016**: El inicio del admin MUST mostrar tarjetas de acción a
  Usuarios, Platillos y Menú del día con conteos, más un resumen del menú
  de hoy (especiales y no disponibles).
- **FR-017**: Las secciones de gestión MUST conservar su alcance actual de
  CRUD, presentando listados de filas altas con buscador/filtro, CTA fijo
  de alta y estados vacío/error con `Reintentar`.

**Transversal:**

- **FR-018**: Todos los controles interactivos de caja y cocina MUST tener
  área táctil ≥ 44 px y alto contraste (FR-020); la interfaz MUST ser
  responsiva en móvil y computadora.
- **FR-019**: Cada pantalla MUST definir estados de carga, vacío y error
  (con `Reintentar` donde haya llamadas), consistentes con el resto de la
  app.
- **FR-020**: El rediseño MUST usar el sistema de diseño canónico
  `docs/DESIGN.md` (paleta, tipografía y componentes) sin redefinirlo.
- **FR-021**: El rediseño MUST ser solo de interfaz: MUST NO agregarse
  funcionalidad fuera del alcance MVP (§27) — sin métodos de pago con
  tarjeta/transferencia, descuentos, historial de ventas, configuración,
  imágenes de platillo, notificaciones push ni métricas de negocio — y sin
  dependencias nuevas de UI sin justificación (§22).

### Key Entities

Esta feature no incorpora entidades de datos nuevas: opera sobre los
existentes (usuarios, platillos, menú del día, pedidos, partidas, pagos) a
través de la API actual.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El cajero puede pasar de abrir la caja a tener un pedido
  cobrado con folio en menos de 60 segundos, sin salir de la pantalla de
  captura más que para revisar el cobro.
- **SC-002**: Navegar a cualquier sección del rol cajero o cliente toma
  como máximo 2 interacciones (abrir drawer/barra + tocar la sección).
- **SC-003**: El cocinero puede identificar el pedido más antiguo y su
  tiempo transcurrido en menos de 2 segundos de mirar el tablero (folio y
  cifras legibles a distancia).
- **SC-004**: El 100 % de los controles interactivos de caja y cocina
  cumplen el mínimo táctil de 44 px, verificable en móvil y escritorio.
- **SC-005**: El cliente completa un pedido anticipado (menú → revisión →
  pago → confirmación) en no más de 4 pasos de pantalla, y el 100 % de las
  pantallas del flujo muestran la regla de 10 minutos antes de pagar.
- **SC-006**: El 100 % de las pantallas rediseñadas muestran estados de
  carga, vacío y error con acción de reintento donde aplica; ninguna
  pantalla queda en blanco ante un fallo de red.
- **SC-007**: Cualquier persona evaluadora, dada una tarea por rol
  (cobrar, avanzar un pedido, consultar estado), la completa sin ayuda en
  el primer intento en al menos 4 de 5 tareas.

## Assumptions

- El rediseño no requiere cambios de backend: se consumen los endpoints
  existentes; los conteos del admin provienen de los listados actuales.
  **Excepción aprobada (2026-10-14)**: `POST /api/pedidos/:id/cancelar`
  (solo el dueño, solo estado `Pendiente`) para el botón *Cancelar pedido*
  del rechazo de pago del cliente; route + controller + service + test de
  integración, sin dependencias nuevas ni cambios de esquema.
- La fuente de verdad de diseño es `docs/DESIGN.md`; los documentos
  `design/*.md` definen pantallas, flujos y navegación.
- Se conservan las rutas, roles, reglas de negocio y estados de pedido
  actuales; ningún comportamiento aprobado en specs 001–006 cambia.
- El carrito del cliente y la persistencia local actuales se conservan.
- La validación de 10 minutos se mantiene tanto en cliente como en
  servidor (el servidor sigue siendo la autoridad).
- La barra inferior aplica en móvil; en escritorio rige el panel lateral.
- Los textos de interfaz se mantienen en español (regla del proyecto).
