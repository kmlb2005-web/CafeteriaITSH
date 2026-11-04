# Feature Specification: QA del Cliente — Evidencia y Reglas de Rol (Sprint 7)

**Feature Branch**: `009-qa-cliente`

**Created**: 2026-11-03

**Status**: Draft

**Input**: User description: "Aplicar el aseguramiento de la calidad por rol,
empezando por el alumno/cliente: cerrar con pruebas automáticas y evidencia
todo lo que ve y hace el usuario final (menú, carrito, mis pedidos),
verificando las reglas de rol (403 contra rutas internas), el manejo de
errores sin fugas de información y el fallo del aviso de correo (O-02), más el
revisión manual de usabilidad (§19) con capturas. Sin dependencias nuevas y
sin salir del alcance del MVP."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El backend respeta el rol cliente y no filtra errores (Priority: P1)

Como alumno que usa la aplicación, quiero que el servidor me deje únicamente
en las rutas del cliente (menú, pedidos propios, crear pedido), que me responda
con un error claro y sin trazas internas cuando algo falla, y que un fallo
transitorio del aviso de correo nunca destruya mi pedido, para confiar en que
mi pedido queda registrado aunque la notificación falle.

**Why this priority**: es la garantía de seguridad y de integridad de los
pedidos del rol cliente; sin ella, cualquier avance de interfaz se apoya sobre
un servidor que podría exponer rutas de caja/cocina o perder pedidos. Cierra
la observación abierta O-02 de la matriz de calidad.

**Independent Test**: puede probarse sin interfaz: con un JWT de cliente,
llamar a las rutas de caja, cocina y administración y esperar 403; provocar un
error en el envío del aviso (doble simulación del fallo) y comprobar que la
respuesta del pedido sigue siendo `Listo`; forzar un error interno y verificar
que el cuerpo es `{ error: { code, message } }` sin stack trace.

**Acceptance Scenarios**:

1. **Given** una sesión de cliente autenticada, **When** intenta acceder a
   cualquier ruta de caja, cocina o administración, **Then** recibe 403 con el
   formato de error estándar.
2. **Given** un pedido que pasa a `Listo`, **When** el servicio del aviso de
   correo falla, **Then** el pedido permanece en `Listo` y la respuesta no
   incluye detalles internos del fallo.
3. **Given** un error interno no controlado en el servidor, **When** llega la
   respuesta, **Then** el cuerpo tiene exactamente la forma
   `{ error: { code, message } }` y no contiene stack trace ni información de
   base de datos.
4. **Given** un cliente sin sesión, **When** llama a una ruta protegida,
   **Then** recibe 401 con el mismo formato de error.

---

### User Story 2 - El cliente ve estados claros en sus pantallas (Priority: P2)

Como alumno, quiero que el menú y mis pedidos muestren estados vacíos y de
error claros (sin quedarse en blanco ni en carga infinita), que si intento
entrar a una sección con un rol que no me corresponde se me indique con
claridad y se me ofrezca volver a mi sección, y que el total del carrito sea
correcto, para poder pedir sin confusión.

**Why this priority**: son las pantallas que el alumno ve siempre; sin estados
vacíos/errores, un fallo de red se ve como pantalla rota y la fila RF-02 de la
matriz no puede aprobarse.

**Independent Test**: puede probarse con pruebas de componentes: apagar el
servicio (`fetch` simulado a rechazar o devolver lista vacía) en `MenuPage` y
`MisPedidosPage` y verificar los mensajes; montar la app con sesión de caja
intentando entrar a `/menu` y verificar la redirección; agregar partidas al
carrito y verificar el total calculado.

**Acceptance Scenarios**:

1. **Given** el menú sin platillos publicados, **When** carga la página,
   **Then** muestra un estado vacío con mensaje claro.
2. **Given** un fallo de red al cargar, **When** responde el servicio,
   **Then** aparece un mensaje de error claro y una opción de reintentar.
3. **Given** una sesión de caja/cocina, **When** se navega a una ruta de
   cliente (o viceversa), **Then** aparece la pantalla de acceso denegado con
   un enlace que conduce a la sección propia del rol.
4. **Given** un carrito con varias partidas, **When** se agrega o quita una,
   **Then** el total mostrado corresponde a la suma de partidas.

---

### User Story 3 - Evidencia auditable del rol cliente (Priority: P3)

Como patrocinadora del proyecto, quiero que el rol cliente quede aprobado con
evidencia: checklist de usabilidad §19 (áreas táctiles ≥ 44 px, mensajes
claros) revisado, capturas del flujo completo en `docs/evidencias/cliente/` y
las filas RF-01, RF-02 y RF-04 de la matriz de calidad en estado Aprobado, con
O-02 cerrado.

**Why this priority**: sin evidencia documentada no se puede demostrar el
cierre del sprint ante el docente; pero primero deben existir las pruebas que
la respaldan (US1 y US2).

**Independent Test**: puede probarse revisando el repositorio: las capturas
existen y muestran los flujos, el checklist queda respondido y la matriz
registra las tres filas con resultado, fecha y evidencia.

**Acceptance Scenarios**:

1. **Given** el flujo completo del alumno (menú → carrito → confirmar → pago →
   mis pedidos), **When** se ejecuta en el navegador, **Then** queda una
   captura por paso en `docs/evidencias/cliente/`.
2. **Given** la checklist de usabilidad §19, **When** se revisa la UI del
   cliente, **Then** queda respondida con resultado por ítem.
3. **Given** la matriz de calidad, **When** se revisa, **Then** RF-01, RF-02 y
   RF-04 están en Aprobado con fecha y evidencia, y O-02 figura cerrado.

---

### Edge Cases

- ¿Qué pasa si el fallo del aviso ocurre en un pedido de mostrador en lugar
  de uno anticipado? (la misma regla aplica: nunca bloquear ni revertir; la
  prueba cubre el caso anticipado de la observación O-02).
- ¿Qué pasa si el menú está vacío *y* además falla la red? (prevalece el
  mensaje de error con reintento; no se muestra vacío engañoso).
- ¿Qué pasa si el cliente guarda un enlace directo a una ruta de otro rol?
  (la protección de ruta muestra acceso denegado con enlace a su sección; la
  API responde 403 aunque la llamada llegue).
- ¿Qué pasa si el total del carrito incluye platillos no disponibles
  agregados previamente? (el total se calcula sólo con partidas válidas y la
  interfaz impide agregar las no disponibles).
- ¿Qué pasa si la sesión expira en `MisPedidosPage`? (la API responde 401 con
  formato estándar y la app devuelve al inicio de sesión sin pantalla rota).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Las pruebas de integración del backend MUST cubrir que un JWT
  de cliente recibe 403 en rutas de caja, cocina y administración, y que un
  cliente sin sesión recibe 401.
- **FR-002**: MUST existir una prueba que simule el fallo del aviso de correo
  (`vi.spyOn` sobre el servicio del aviso) y compruebe que el pedido queda en
  `Listo` (cierra O-02).
- **FR-003**: Las respuestas de error del backend MUST tener exactamente la
  forma `{ error: { code, message } }` y MUST NO incluir stack trace ni
  información interna; una prueba MUST verificarlo para un error no
  controlado.
- **FR-004**: `MenuPage` y `MisPedidosPage` MUST tener pruebas de componente
  para estado vacío y para error de red con reintento.
- **FR-005**: MUST existir prueba de protección por rol en la interfaz: con
  sesión de otro rol en una ruta del cliente (y viceversa) se muestra la
  pantalla de acceso denegado con el enlace "Volver a mi sección" que apunta a
  la ruta propia del rol.
- **FR-006**: MUST existir prueba del total del carrito (suma de partidas al
  agregar/quitar) en el flujo de compra del cliente.
- **FR-007**: El checklist manual de usabilidad §19 (área táctil ≥ 44 px,
  mensajes claros, navegación sencilla) MUST quedar respondido para la UI del
  cliente.
- **FR-008**: MUST existir capturas del flujo completo del alumno en
  `docs/evidencias/cliente/` (menú, carrito, confirmación, estado del pedido).
- **FR-009**: `docs/Matriz_de_calidad.md` MUST quedar con RF-01, RF-02 y RF-04
  en Aprobado y O-02 cerrado con fecha, solución y evidencia.
- **FR-010**: Esta feature MUST limitarse a pruebas, evidencia y documentación:
  MUST NO agregar dependencias nuevas (§22), MUST NO cambiar el alcance del
  MVP (§I de la constitución) y la única permitida de backend es la exigida
  por O-02 si el código lo requiere.

### Key Entities

Esta feature no incorpora entidades de datos: opera sobre pruebas existentes
de los paquetes, documentación de calidad y capturas de evidencia. Los
conceptos sobre los que versa (pedido, carrito, menú, sesión y rol) ya están
definidos en las specs del producto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `node scripts/verify.mjs` termina en verde con las pruebas
  nuevas incluidas (0 fallos).
- **SC-002**: 0 observaciones abiertas relacionadas con el rol cliente en la
  matriz (O-02 cerrado) y 0 defectos abiertos en general.
- **SC-003**: Las 3 filas del rol cliente (RF-01, RF-02, RF-04) quedan en
  Aprobado con fecha y evidencia referenciada.
- **SC-004**: El flujo completo del alumno tiene capturas en el repositorio:
  al menos una por paso (menú, carrito, confirmación, resultado).
- **SC-005**: El 100 % de los escenarios de las user stories tiene al menos
  una prueba automatizada o evidencia manual identificable en la matriz.
- **SC-006**: No se agrega ninguna dependencia nueva a los `package.json`.

## Assumptions

- La verificación y el CI del Sprint 6 ya están operativos (gate `verify` y
  workflow en verde), por lo que este sprint sólo agrega pruebas y evidencia.
- El "fallo del aviso" (O-02) se simula en la capa de servicio con
  `vi.spyOn`, sin depender de un servidor de correo real.
- Las pruebas de frontend usan el entorno existente (jsdom + Testing Library);
  las capturas manuales se toman en local con la app corriendo y se guardan en
  formato PNG en `docs/evidencias/cliente/`.
- El checklist §19 se responde sobre la UI del cliente; los criterios de 44 px
  aplican a los controles táctiles del flujo de compra (steppers, CTA).
- La cuenta de GitHub puede seguir bloqueada: el CI corre en el runner
  self-hosted local del Sprint 6; esto no cambia los criterios de cierre.
- Las credenciales del runner viven en `runner/.env` fuera del repositorio
  (reglas §21); las evidencias y capturas sí se versionan.
