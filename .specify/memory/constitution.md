<!--
Sync Impact Report
==================
- Version change: [CONSTITUTION_VERSION] (scaffold sin ratificar) → 1.0.0
- Modified principles (placeholder → nuevo título):
  - [PRINCIPLE_1_NAME] → I. Alcance del MVP Primero (NON-NEGOTIABLE)
  - [PRINCIPLE_2_NAME] → II. Seguridad de la Información (NON-NEGOTIABLE)
  - [PRINCIPLE_3_NAME] → III. Aplicación Única con Acceso por Rol (NON-NEGOTIABLE)
  - [PRINCIPLE_4_NAME] → IV. Simplicidad y Mantenibilidad
  - [PRINCIPLE_5_NAME] → V. Fiabilidad y Rendimiento en Receso
- Added sections: ninguna; se conservan las secciones del scaffold con nuevo
  contenido:
  - [SECTION_2_NAME] → Restricciones Técnicas
  - [SECTION_3_NAME] → Flujo de Desarrollo y Calidad
- Removed sections: ninguna
- Placeholders rellenados: PROJECT_NAME, PRINCIPLE_1..5_NAME,
  PRINCIPLE_1..5_DESCRIPTION, SECTION_2_NAME, SECTION_2_CONTENT,
  SECTION_3_NAME, SECTION_3_CONTENT, GOVERNANCE_RULES, CONSTITUTION_VERSION,
  RATIFICATION_DATE, LAST_AMENDED_DATE.
- Follow-up TODOs: ninguno. RATIFICATION_DATE = 2026-10-13 (fecha de la primera
  ratificación; el scaffold aún no estaba ratificado). LAST_AMENDED_DATE =
  2026-10-13.
- Fuente de contenido: docs/reglas.md (30 reglas del proyecto), consolidada en
  5 principios + 2 secciones según la estructura del template resuelto.
-->

# Constitución — Sistema de Pedidos Anticipados Cafetería ITSH

Constitución del sistema web de pedidos anticipados para la cafetería del
Instituto Tecnológico Superior de Huauchinango (ITSH): consulta de menú,
pedidos y pagos anticipados, y notificaciones de pedido listo para alumnos y
docentes. Fuente de las reglas originales: `docs/reglas.md`.

## Core Principles

### I. Alcance del MVP Primero (NON-NEGOTIABLE)

- El desarrollo MUST mantenerse dentro del alcance del MVP: gestión de
  usuarios y roles, gestión y consulta de menú, gestión de platillos,
  pedidos anticipados, pedidos de mostrador, pago anticipado, visualización
  de pedidos en cocina, cambio de estados, y notificación de pedido listo.
- Cualquier funcionalidad fuera de ese alcance MUST recibir aprobación previa
  antes de implementarse.
- Toda decisión de desarrollo MUST priorizar, en orden: cumplimiento del
  alcance, seguridad de la información, facilidad de uso, mantenibilidad,
  rendimiento en horarios de mayor demanda, simplicidad de implementación y
  viabilidad económica del MVP.
- El sistema MUST poder ejecutarse localmente en desarrollo y desplegarse en
  hosting gratuito o de bajo costo, respetando el presupuesto del MVP y
  manteniendo separadas las configuraciones de desarrollo y producción.

**Rationale**: es un proyecto académico con presupuesto y tiempos limitados;
el alcance sin control destruye la viabilidad económica y la entrega.

### II. Seguridad de la Información (NON-NEGOTIABLE)

- Las contraseñas MUST codificarse de forma irreversible y MUST ALMACENARSE
  NUNCA en texto plano.
- Credenciales, claves secretas, tokens y claves API MUST vivir en variables
  de entorno; MUST NO incluirse en el código fuente ni en el repositorio, y
  los archivos `.env` MUST NO commitearse.
- La autenticación MUST hacerse por correo y contraseña con JSON Web Tokens
  (JWT), y la autorización MUST ser basada en roles: cada usuario accede
  SOLO a las funciones y rutas de su rol.
- La información sensible de tarjetas bancarias MUST NO almacenarse; solo se
  registra la información necesaria para identificar y validar la transacción.
- En producción MUST usarse HTTPS.
- Los datos recibidos MUST validarse y sanitizarse antes de procesarse o
  almacenarse.

**Rationale**: el sistema maneja cuentas institucionales y pagos; una
filtración afecta a alumnos, docentes y a la credibilidad del proyecto.

### III. Aplicación Única con Acceso por Rol (NON-NEGOTIABLE)

- El frontend MUST ser una sola aplicación web con rutas por rol:
  `/admin`, `/caja`, `/cocina`, `/menu` y `/mis-pedidos`.
- Cada ruta MUST exigir sesión activa (JWT) y el rol correspondiente; un
  usuario sin el rol MUST NO poder acceder ni por UI ni por API.
- Los cuatro roles (administrador, cajero, cocinero, alumno/docente) operan
  sobre esa única aplicación; alumnos y docentes comparten la vista de
  cliente (`/menu`, `/mis-pedidos`), diferenciados solo por cuenta y rol.
- El sistema MUST operar de forma simultánea los pedidos anticipados y los de
  mostrador, sin interrumpir el servicio actual de mostrador.

**Rationale**: una sola app con rutas protegidas evita duplicación de
interfaces y garantiza un control de acceso único y verificable.

### IV. Simplicidad y Mantenibilidad

- Se MUST utilizar TypeScript con tipado estático en toda la lógica
  principal; MUST NO introducirse JavaScript sin tipado en esa lógica.
- La arquitectura MUST mantenerse sencilla: MUST NO implementarse capas ni
  arquitecturas excesivamente complejas para el tamaño del sistema.
- Antes de agregar una dependencia MUST verificarse si la funcionalidad se
  resuelve con lo existente; MUST NO agregarse librerías innecesarias ni que
  dupliquen funcionalidades ya disponibles, y MUST mantenerse compatibles
  con Node.js LTS.
- Código MUST seguir `camelCase` en variables y funciones, `PascalCase` en
  componentes/tipos/interfases, nombres descriptivos, funciones pequeñas y
  reutilizables, sin duplicación, con responsabilidades claras por módulo.

**Rationale**: con un equipo pequeño y capacidad de capacitación limitada, el
código legible y sin innecesidad es lo que sostiene el mantenimiento.

### V. Fiabilidad y Rendimiento en Receso

- Los pedidos anticipados MUST realizarse con al menos **10 minutos de
  anticipación**, y el sistema MUST permitir que el 100 % de ellos cumpla
  ese requisito.
- El sistema MUST responder adecuadamente en horarios de mayor demanda:
  consultas de menú optimizadas, gestión de pedidos sin retrasos
  innecesarios y prioridad a la reducción del tiempo de espera en caja
  (meta: al menos **50 % durante los recesos**).
- Todo pedido MUST mantener un estado observable con los valores mínimos:
  `Pendiente`, `Pagado`, `En preparación`, `Listo`, `Entregado`,
  `Cancelado`.
- La interfaz MUST ser simple, clara y rápida; las pantallas de caja y
  cocina MUST priorizar la rapidez, con botones de alto contraste y área
  táctil de al menos **44 px**, y deben ser responsivas en móvil y
  computadora.
- El sistema MUST reducir los errores derivados de la interpretación verbal
  de los pedidos.

**Rationale**: el valor del sistema se mide en los recesos; si caja o cocina
se ralentizan o el pedido se transmite mal, el proyecto incumple su propósito.

## Restricciones Técnicas

Stack obligatorio:

- **Lenguaje/runtime**: TypeScript como lenguaje principal; Node.js en
  versión LTS para el backend.
- **Frontend**: React con TypeScript compilado con Vite; Tailwind CSS +
  shadcn/ui como framework de diseño (los componentes se copian al proyecto
  y se personalizan con sus tokens). Los tokens de `docs/DESIGN.md`
  (originalmente `.stitch/DESIGN.md`) son base de referencia; los diseños de
  Stitch no son obligatorios al 100 % y podrán ajustarse durante el
  desarrollo.
- **Backend**: Node.js con Express exponiendo una API REST que gestione
  usuarios, roles, menú, platillos, pedidos, detalles de pedidos, pagos,
  estados y notificaciones.
- **Base de datos**: MySQL con relaciones entre entidades para mantener la
  integridad; consultas mediante una librería de acceso a datos adecuada;
  ORMs innecesarios MUST NO usarse.
- **Pagos**: servicio de pago en línea integrado en el flujo del pedido,
  sin almacenar datos sensibles de tarjetas.
- **Notificaciones**: el aviso de pedido listo MUST mantenerse separado de
  la lógica principal de pedidos; podrá usar un servicio externo cuando sea
  necesario.
- **Variables de entorno**: como mínimo `DATABASE_URL`, `JWT_SECRET`,
  `PAYMENT_API_KEY`, `NOTIFICATION_API_KEY`, `NODE_ENV`, `PORT`; sus valores
  reales MUST NO incluirse en el código fuente.

API REST:

- Todas las operaciones frontend ↔ backend MUST realizarse por API REST.
- Métodos según propósito: `GET` consultas, `POST` creación,
  `PUT`/`PATCH` modificaciones, `DELETE` eliminaciones cuando corresponda.
- Las respuestas MUST usar códigos HTTP apropiados.

Estructura del proyecto:

```text
frontend/
backend/
database/
tests/
```

- Frontend (app única): `src/pages/admin/`, `src/pages/caja/`,
  `src/pages/cocina/`, `src/pages/clientes/`, `src/components/ui/`
  (componentes de shadcn/ui), `src/lib/`.
- Backend organizado por recursos: `routes/`, `controllers/`, `services/`,
  `middlewares/`, `utils/`.

Operación por rol (detalle de los principios I y III):

- **Administrador**: gestiona usuarios operativos, crea/edita menú y
  platillos, gestiona especiales del día y asigna precios; los cambios en el
  menú MUST reflejarse para los usuarios finales y los platillos no
  disponibles MUST NO poder seleccionarse en pedidos nuevos.
- **Cajero**: captura pedidos presenciales y registra cobros; la operación
  de pedidos anticipados MUST NO impedir la atención en mostrador.
- **Cocinero**: visualiza pedidos entrantes y productos a preparar, cambia
  estados a preparado o listo, y MUST poder identificar el orden de
  preparación.
- **Alumno/Docente**: consulta el menú del día, realiza pedidos y pagos
  anticipados, consulta el estado de sus pedidos y recibe notificación
  cuando el pedido está listo.

## Flujo de Desarrollo y Calidad

Validación y errores:

- Los datos MUST validarse en frontend y en backend; MUST NO confiarse solo
  en las validaciones del cliente, y MUST validarse antes de almacenarlos
  para que datos inválidos o incompletos no lleguen a la lógica de negocio.
- Al usuario MUST mostrarse mensajes claros; MUST NO mostrarse stack traces
  ni información interna del servidor. Los errores se registran para
  mantenimiento sin exponer información sensible.

Testing:

- **Vitest** es el framework de pruebas unitarias.
- Toda lógica de negocio importante MUST contar con pruebas; como mínimo:
  autenticación, autorización, gestión de usuarios, gestión de menú,
  creación y validación de pedidos, cálculo de totales, cambios de estado y
  control de permisos por rol.
- Las funcionalidades críticas MUST tener pruebas; no se fija cobertura
  mínima obligatoria.

Control de versiones y despliegue:

- **Git** con repositorio remoto, commits pequeños y descriptivos.
- Los archivos `.env` y cualquier credencial MUST NO almacenarse en el
  repositorio.
- El sistema MUST poder ejecutarse localmente y desplegarse en servicios
  gratuitos o de bajo costo, con entornos de desarrollo y producción
  separados.

Criterio de aceptación — el sistema es funcional cuando completa el flujo:

```text
Consulta del menú → Selección de productos → Creación del pedido → Pago
→ Recepción en cocina → Preparación → Pedido listo → Notificación al
usuario → Recogida / entrega
```

La aceptación final está sujeta a una demostración funcional y a la
validación de la patrocinadora del proyecto.

Restricciones operativas:

- El sistema MUST NO interrumpir el servicio actual de mostrador.
- Se MUST considerar la conectividad a internet limitada dentro del plantel,
  la disponibilidad limitada del personal para capacitación y el presupuesto
  establecido para el MVP.

## Governance

Procedimiento de enmienda:

1. Toda modificación a esta constitución MUST proponerse por escrito
   describiendo el cambio, su justificación y su plan de migración.
2. La enmienda MUST recibir aprobación del responsable del proyecto antes de
   aplicarse.
3. Tras la aprobación, se actualiza esta versión, se documenta la fecha de
   la última enmienda y se revisa la coherencia con `docs/reglas.md`.
4. La constitución prevalece sobre prácticas informales de desarrollo; en
   conflicto entre esta constitución y otros documentos, prevalece la
   constitución.

Política de versionado:

- Versionado semántico `MAJOR.MINOR.PATCH`:
  - **MAJOR**: eliminación o redefinición incompatible de principios.
  - **MINOR**: adición o expansión material de un principio o sección.
  - **PATCH**: aclaraciones, correcciones de redacción y refinamientos no
    semánticos.

Revisión de cumplimiento:

- Toda revisión de código y toda entrega MUST verificar el cumplimiento de
  los principios y restricciones aquí documentados.
- Cualquier complejidad añadida MUST justificarse frente al principio de
  simplicidad.
- Las guías de desarrollo en tiempo de ejecución (`docs/reglas.md`,
  `docs/plan.md` si existe) MUST mantenerse alineadas con esta constitución.
- Revisión de cumplimiento: al menos al cierre de cada sprint y antes de la
  demostración de aceptación final.

**Version**: 1.0.0 | **Ratified**: 2026-10-13 | **Last Amended**: 2026-10-13
