# Feature Specification: Fundamentos y Autenticación (Sprint 1)

**Feature Branch**: `002-foundation-auth`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Sprint 1 — Fundamentos y autenticación: base de
datos, login por rol y esqueleto del frontend (app única con rutas por rol);
el administrador gestiona usuarios operativos; registro de clientes." Fuente:
`docs/sprints.md` (Sprint 1, semanas est. 2026-10-13 → 2026-10-26). Subconjunto
trazable de la spec maestra `specs/001-cafeteria-preorder-system/spec.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acceso con sesión y rol (Priority: P1)

Como alumno, docente, cajero, cocinero o administrador, me registro (los
clientes) o inicio sesión con mi correo electrónico y contraseña, y el
sistema me lleva a la pantalla de mi rol. Si no tengo sesión, o mi rol no
corresponde a esa pantalla, no puedo acceder.

**Why this priority**: Es la base de seguridad del sistema completo: sin
acceso por rol ninguna otra pantalla puede protegerse ni demostrarse.

**Independent Test**: Creando una cuenta por cada rol y verificando que cada
credencial válida entra a su pantalla, y que sin sesión o con otro rol el
acceso se deniega, sin necesidad de menú ni pedidos.

**Acceptance Scenarios**:

1. **Given** credenciales válidas de un rol, **When** el usuario inicia
   sesión, **Then** entra a la pantalla correspondiente a su rol.
2. **Given** credenciales inválidas, **When** el usuario intenta iniciar
   sesión, **Then** ve un mensaje claro que no revela si la cuenta existe.
3. **Given** un usuario sin sesión, **When** intenta acceder a una pantalla
   protegida, **Then** se le redirige al inicio de sesión.
4. **Given** un usuario con sesión de un rol, **When** intenta acceder a la
   pantalla de otro rol, **Then** el acceso se le deniega.
5. **Given** un alumno o docente que completa el registro por cuenta propia,
   **When** usa sus credenciales, **Then** puede iniciar sesión.
6. **Given** una contraseña, **When** se almacena o se transmite, **Then**
   nunca aparece en texto plano visible para el usuario ni en mensajes.

---

### User Story 2 - Gestión de usuarios operativos (Priority: P2)

Como administrador, creo, edito y doy de baja cuentas de cajeros y cocineros
desde mi módulo; los cambios surten efecto de inmediato en el acceso de esos
usuarios.

**Why this priority**: Sin usuarios operativos no hay personal que opere caja
y cocina en los siguientes sprints; el sistema puede demostrarse con el seed
de cuentas mientras se desarrolla esta gestión.

**Independent Test**: Creando un cajero desde el módulo de administración y
verificando que ese cajero puede iniciar sesión, y dándolo de baja y
verificando que se le deniega el acceso.

**Acceptance Scenarios**:

1. **Given** un administrador en sesión, **When** crea un cajero o cocinero
   con su correo, **Then** el nuevo usuario puede iniciar sesión con ese
   rol.
2. **Given** un usuario operativo existente, **When** el administrador edita
   sus datos, **Then** los cambios quedan registrados.
3. **Given** un usuario operativo dado de baja, **When** intenta iniciar
   sesión, **Then** el acceso le es denegado con un mensaje claro.
4. **Given** un correo ya registrado, **When** el administrador intenta crear
   otra cuenta con ese correo, **Then** el sistema rechaza la operación y
   explica el motivo.
5. **Given** un usuario sin sesión o con rol distinto de administrador,
   **When** intenta acceder a la gestión de usuarios, **Then** el acceso se
   le deniega.

---

### User Story 3 - Aplicación única con pantallas por rol (Priority: P3)

Como usuario, dentro de una sola aplicación web encuentro las pantallas de mi
rol (`/login`, `/admin`, `/caja`, `/cocina`, `/menu`, `/mis-pedidos`) con una
navegación clara y sencilla, y en móvil y computadora.

**Why this priority**: Es el andamiaje que hace posible y demostrable las
dos historias anteriores, pero aporta valor visible cuando ya hay acceso.

**Independent Test**: Navegando a cada ruta con la sesión de su rol en un
teléfono y en una computadora, verificando que cada pantalla carga y que la
navegación entre pantallas del mismo rol funciona.

**Acceptance Scenarios**:

1. **Given** un usuario en sesión, **When** navega dentro de su módulo,
   **Then** las pantallas de su rol están disponibles y son utilizables.
2. **Given** un usuario en un teléfono o computadora, **When** usa su
   pantalla de login o su módulo, **Then** la interfaz se adapta al tamaño de
   pantalla.
3. **Given** un usuario de un rol, **When** revisa la navegación, **Then** no
   ve enlaces ni accesos a módulos de otros roles.

---

### Edge Cases

- La sesión expira mientras el usuario usa la aplicación: se le redirige al
  inicio de sesión con un mensaje claro y sin perder una acción ya enviada.
- Intento de inicio de sesión con un correo con formato inválido o contraseña
  vacía: el sistema muestra validación clara sin procesar la solicitud.
- Registro con un correo ya existente: se rechaza con mensaje claro que no
  revela más información de la cuenta.
- Un usuario operativo dado de baja con una sesión abierta: su siguiente
  acción es denegada.
- Falla del servicio durante el inicio de sesión: se muestra un mensaje
  claro de reintento, sin exponer información interna del servidor.
- Contraseña demasiado corta: se valida en el formulario y en el servidor.

## Requirements *(mandatory)*

### Trazabilidad a la spec maestra (001)

| Elemento de 001 | Cobertura en este sprint |
|---|---|
| US5 (parte: gestión de usuarios operativos) | User Story 2 |
| FR-001 … FR-005 | Implementación completa |
| FR-021 … FR-024 | Implementación completa (calidad/seguridad transversal) |
| User Story 1 / User Story 3 de 001 | Fuera de este sprint (pedidos y cocina) |

### Functional Requirements

**Usuarios, roles y acceso**

- **FR-001** *(de 001)*: El sistema MUST permitir el registro e inicio de
  sesión con correo electrónico y contraseña; las contraseñas MUST
  almacenarse de forma que no sean legibles (nunca en texto plano).
- **FR-002** *(de 001)*: Cada usuario MUST tener un rol: administrador,
  cajero, cocinero o alumno/docente.
- **FR-003** *(de 001)*: Cada usuario MUST acceder solo a las funciones y
  pantallas de su rol; un usuario sin un rol MUST NO poder acceder a su
  módulo.
- **FR-004** *(de 001)*: El administrador MUST poder crear, editar y dar de
  baja a los usuarios operativos (cajeros y cocineros).
- **FR-005** *(de 001)*: Los alumnos y docentes MUST poder registrarse por
  cuenta propia y usar la vista de cliente (menú y mis pedidos).

**Calidad y seguridad de la experiencia**

- **FR-021** *(de 001)*: Los datos MUST validarse antes de procesarse y
  almacenarse, tanto en la interfaz como en el servidor; los datos inválidos
  MUST NO llegar a la lógica de negocio.
- **FR-022** *(de 001)*: El sistema MUST mostrar mensajes de error claros al
  usuario y MUST NO exponer trazas de errores ni información interna del
  servidor.
- **FR-023** *(de 001)*: Credenciales, claves secretas y tokens MUST NO
  incluirse en el código fuente ni en el repositorio.
- **FR-024** *(de 001)*: En producción, la comunicación del sistema MUST
  viajar por un canal cifrado de extremo a extremo entre el usuario y el
  sistema.

### Out of Scope (Sprint 1)

- Menú, platillos y especiales del día (Sprint 2).
- Pedidos y pagos (Sprints 3 y 4).
- Notificaciones y "mis pedidos" (Sprint 5).
- El seed inicial de cuentas operativas (admin, cajero, cocinero) es dato de
  arranque, no una funcionalidad de usuario.

### Key Entities

- **Usuario**: persona con cuenta en el sistema; correo, contraseña (no
  legible), nombre, rol y estado (activo/dado de baja); relación: autor de
  pedidos (cliente) o gestor de operaciones (personal).
- **Rol**: administrador, cajero, cocinero o alumno/docente; determina las
  pantallas y funciones accesibles.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-S1-01**: El 100 % de las credenciales válidas por rol ingresa a la
  pantalla de su rol, y el 100 % de los intentos sin sesión o con rol
  equivocado son denegados.
- **SC-S1-02**: Los mensajes de autenticación fallida son idénticos para una
  cuenta existente y una inexistente (0 mensajes que revelen la existencia
  de la cuenta).
- **SC-S1-03**: 0 contraseñas visibles en texto plano en pantallas,
  mensajes, respuestas del sistema o reportes de error.
- **SC-S1-04**: Un administrador crea, edita y da de baja un usuario
  operativo en menos de 2 minutos, y el efecto en el acceso es inmediato.
- **SC-S1-05**: El 100 % de las pruebas automatizadas del sprint pasan antes
  de la demo.

*De la spec maestra, contribución*: SC-007 (usabilidad del personal) se mide
primero en este sprint con el login y la navegación por rol.

## Assumptions

- Los alumnos y docentes se registran por cuenta propia; el administrador
  solo crea y gestiona usuarios operativos (cajeros y cocineros).
- Existe un seed de cuentas operativas iniciales (administrador, cajero,
  cocinero) para poder demostrar el sprint sin dependencias previas.
- Las pantallas de los roles existen como estructura navegable aunque sus
  módulos se completen en sprints posteriores.
- Los datos de usuario se validan con las reglas estándar de correo y
  longitud de contraseña (definidas en la fase de planificación).
- La fecha de este sprint (2026-10-13 → 2026-10-26) es estimada y se ajusta
  al calendario real del plantel.
- Se aplican las suposiciones generales de la spec maestra 001.
