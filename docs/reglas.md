# Reglas del Proyecto

## Sistema de Pedidos Anticipados — Cafetería ITSH

Este proyecto es un sistema web de pedidos anticipados para la cafetería del Instituto Tecnológico Superior de Huauchinango (ITSH), diseñado para permitir a alumnos y docentes consultar el menú, realizar pedidos y pagos anticipados, y recibir notificaciones cuando sus pedidos estén listos.

## Reglas del proyecto

### 1. Lenguaje y runtime

- Utilizar **TypeScript** como lenguaje principal del proyecto.
- Utilizar **Node.js en versión LTS** para el backend.
- Mantener el tipado estático de TypeScript siempre que sea posible.
- Evitar el uso de JavaScript sin tipado en la lógica principal del sistema.

### 2. Frontend

- Utilizar **React con TypeScript**, compilado con **Vite**, para desarrollar la interfaz web.
- El frontend será **una sola aplicación web** organizada en rutas por rol:
  - `/admin` — panel del administrador.
  - `/caja` — módulo del cajero.
  - `/cocina` — pantalla del cocinero.
  - `/menu` — consulta de menú y pedidos de clientes (alumno/docente).
  - `/mis-pedidos` — seguimiento de pedidos de clientes (alumno/docente).
- Las rutas deben estar **protegidas por JWT y rol**: cada una exige sesión activa y el rol correspondiente; un usuario sin el rol no puede acceder.
- Utilizar **Tailwind CSS + shadcn/ui** como framework de diseño: los componentes de shadcn se copian al proyecto y se personalizan con los tokens del proyecto.
- Los tokens de diseño de `.stitch/DESIGN.md` (colores, tipografía, espaciado) son una **base de referencia** para la interfaz; los diseños de Stitch **no son obligatorios al 100 %** y podrán modificarse durante el desarrollo.
- La interfaz debe ser responsiva y funcionar correctamente en dispositivos móviles y computadoras.
- Las interfaces deben ser simples, claras y rápidas.
- Las pantallas utilizadas por cajeros y cocineros deben priorizar la rapidez y facilidad de uso durante los horarios de receso.

### 3. Backend

- Utilizar **Node.js con Express** para desarrollar el backend.
- Implementar una **API REST** para la comunicación entre frontend y backend.
- La API será responsable de gestionar usuarios, roles, menú, platillos, pedidos, pagos, estados de pedidos y notificaciones.
- Mantener una estructura sencilla y organizada.
- No implementar arquitecturas excesivamente complejas que no sean necesarias para el tamaño del proyecto.

### 4. Base de datos

- Utilizar **MySQL** como sistema gestor de base de datos.
- La base de datos debe almacenar como mínimo usuarios, roles, platillos, menú, pedidos, detalles de pedidos, pagos y estados de pedidos.
- Utilizar relaciones entre las entidades para mantener la integridad de los datos.
- No utilizar ORMs innecesarios.
- Las consultas a la base de datos deben realizarse mediante una librería de acceso a datos adecuada.

### 5. Autenticación y autorización

- Implementar autenticación mediante correo electrónico y contraseña.
- Utilizar **JSON Web Tokens (JWT)** para gestionar las sesiones autenticadas.
- Implementar autorización basada en roles.
- Cada usuario debe tener acceso únicamente a las funciones correspondientes a su rol.
- Las contraseñas nunca deben almacenarse en texto plano.
- Las credenciales y claves secretas no deben almacenarse directamente en el código fuente.

### 6. Roles del sistema

El sistema debe contemplar los siguientes roles. Todos los roles operan sobre
**una sola aplicación web** (ver §2); cada uno accede a su módulo a través de
su ruta correspondiente y no puede acceder a las rutas de los demás roles.
Los alumnos y docentes comparten la misma vista de cliente (`/menu` y
`/mis-pedidos`), diferenciados únicamente por su cuenta y rol.

#### Administrador

- Gestionar usuarios operativos.
- Crear y editar el menú.
- Gestionar platillos.
- Gestionar especiales del día.
- Asignar y modificar precios.

#### Cajero

- Capturar pedidos realizados presencialmente.
- Registrar y gestionar cobros de pedidos locales.

#### Cocinero

- Visualizar pedidos entrantes.
- Consultar los productos que deben prepararse.
- Cambiar el estado de los pedidos a preparado o listo.

#### Alumno / Docente

- Consultar el menú del día.
- Realizar pedidos anticipados.
- Realizar pagos anticipados.
- Consultar el estado de sus pedidos.
- Recibir una notificación cuando el pedido esté listo.

### 7. Gestión de pedidos

- El sistema debe permitir realizar pedidos anticipados.
- Los pedidos deben realizarse con al menos **10 minutos de anticipación**.
- Cada pedido debe mantener un estado que permita conocer su progreso.
- Los estados mínimos serán:
  - `Pendiente`
  - `Pagado`
  - `En preparación`
  - `Listo`
  - `Entregado`
  - `Cancelado`
- El sistema debe permitir operar simultáneamente pedidos anticipados y pedidos realizados en mostrador.
- El sistema debe evitar errores derivados de la interpretación verbal de los pedidos.

### 8. Pagos

- Implementar un servicio de pago en línea para los pedidos anticipados.
- No almacenar directamente información sensible de tarjetas bancarias.
- Registrar únicamente la información necesaria para identificar y validar una transacción.
- El pago debe formar parte del flujo de realización del pedido.

### 9. Gestión del menú

- El administrador debe poder crear y modificar el menú diario.
- El administrador debe poder gestionar los platillos disponibles.
- El administrador debe poder modificar los precios.
- Los cambios realizados en el menú deben reflejarse para los usuarios finales.
- Los platillos no disponibles no deben poder seleccionarse para nuevos pedidos.

### 10. Operación de caja

- El cajero debe poder registrar pedidos realizados directamente en mostrador.
- El sistema debe permitir gestionar los cobros correspondientes.
- La operación de pedidos anticipados no debe impedir la atención de pedidos presenciales.
- El sistema no debe interrumpir el servicio actual de mostrador.

### 11. Operación de cocina

- Los pedidos deben visualizarse en la interfaz de cocina.
- Los pedidos deben actualizarse de manera que el personal pueda conocer cuáles deben prepararse.
- El cocinero debe poder cambiar el estado del pedido.
- El sistema debe facilitar la identificación del orden de preparación de los pedidos.

### 12. Notificaciones

- El sistema debe notificar al alumno o docente cuando su pedido esté listo para recoger.
- La funcionalidad de notificaciones debe mantenerse separada de la lógica principal de pedidos.
- El servicio de notificaciones podrá utilizar un servicio externo cuando sea necesario.

### 13. API REST

Todas las operaciones entre frontend y backend deben realizarse mediante una API REST.

Utilizar los métodos HTTP de acuerdo con su propósito:

- `GET` para consultas.
- `POST` para creación.
- `PUT` o `PATCH` para modificaciones.
- `DELETE` para eliminaciones cuando corresponda.

Las respuestas de la API deben utilizar códigos HTTP apropiados.

### 14. Validación

- Validar los datos recibidos tanto en frontend como en backend.
- No confiar únicamente en las validaciones realizadas por el cliente.
- Validar los datos antes de almacenarlos en la base de datos.
- Evitar que datos inválidos o incompletos lleguen a la lógica de negocio.

### 15. Manejo de errores

- Nunca mostrar stack traces al usuario.
- No mostrar información interna del servidor.
- Mostrar mensajes claros y comprensibles.
- Utilizar códigos HTTP apropiados.
- Registrar los errores necesarios para facilitar el mantenimiento del sistema sin exponer información sensible al usuario.

### 16. Seguridad

- Utilizar variables de entorno para almacenar información sensible.
- No incluir contraseñas, tokens, claves API o credenciales directamente en el código.
- Implementar autorización basada en roles.
- Validar y sanitizar los datos recibidos.
- Utilizar HTTPS en producción.
- No almacenar información sensible de tarjetas bancarias.

### 17. Estructura del proyecto

Mantener una estructura sencilla y organizada por funcionalidad.

La estructura general debe contemplar:

```text
frontend/
backend/
database/
tests/
```

El frontend corresponde a la aplicación única (ver §2) y se organiza así:

```text
frontend/src/pages/admin/
frontend/src/pages/caja/
frontend/src/pages/cocina/
frontend/src/pages/clientes/
frontend/src/components/ui/   ← componentes de shadcn/ui
frontend/src/lib/
```

Dentro del backend se podrán organizar los recursos relacionados con:

```text
routes/
controllers/
services/
middlewares/
utils/
```

No implementar capas innecesarias ni una arquitectura excesivamente compleja para el tamaño del sistema.

### 18. Estilo de código

- Utilizar `camelCase` para variables y funciones.
- Utilizar `PascalCase` para componentes, tipos e interfaces.
- Utilizar nombres descriptivos.
- Preferir funciones pequeñas y reutilizables.
- Evitar código duplicado.
- Mantener responsabilidades claras entre los diferentes módulos.
- Utilizar TypeScript de manera estrictamente tipada siempre que sea posible.

### 19. Interfaz de usuario

- Los componentes visuales deben construirse con **Tailwind CSS + shadcn/ui** (ver §2), personalizados con los tokens del proyecto.
- Las pantallas de cocina y caja deben usar botones de alto contraste con área táctil de al menos **44 px**.
- La interfaz debe ser responsiva.
- La navegación debe ser sencilla e intuitiva.
- La información de menú, pedidos y estados debe presentarse de manera clara.
- Las operaciones de caja y cocina deben requerir la menor cantidad de pasos posible.
- Evitar elementos visuales innecesarios que dificulten las operaciones.
- Priorizar la legibilidad durante los horarios de mayor demanda.

### 20. Testing

- Utilizar **Vitest** para las pruebas unitarias.
- Toda lógica de negocio importante debe contar con pruebas.
- Probar como mínimo:
  - Autenticación.
  - Autorización.
  - Gestión de usuarios.
  - Gestión del menú.
  - Creación de pedidos.
  - Validación de pedidos.
  - Cálculo de totales.
  - Cambios de estado.
  - Control de permisos por rol.
- No se establece una cobertura mínima obligatoria.
- Las funcionalidades críticas deben contar con pruebas.

### 21. Control de versiones

- Utilizar **Git** para el control de versiones.
- Mantener el código fuente en un repositorio remoto.
- Realizar commits pequeños y descriptivos.
- No almacenar archivos `.env` en el repositorio.
- No almacenar credenciales ni claves secretas en el repositorio.

### 22. Gestión de dependencias

- No agregar dependencias innecesarias.
- Antes de incorporar una librería, verificar si la funcionalidad puede resolverse de forma sencilla con las herramientas existentes.
- Mantener las dependencias compatibles con la versión LTS de Node.js.
- Evitar librerías que dupliquen funcionalidades ya disponibles en el proyecto.

### 23. Variables de entorno

Las configuraciones sensibles y específicas del entorno deben mantenerse mediante variables de entorno.

Como mínimo podrán contemplarse:

```text
DATABASE_URL
JWT_SECRET
PAYMENT_API_KEY
NOTIFICATION_API_KEY
NODE_ENV
PORT
```

Los valores reales de estas variables nunca deben incluirse directamente en el código fuente.

### 24. Despliegue

- El sistema debe poder ejecutarse localmente durante el desarrollo.
- El MVP debe poder desplegarse utilizando servicios de hosting gratuitos o de bajo costo.
- El despliegue debe considerar las restricciones presupuestarias del proyecto académico.
- Las configuraciones de desarrollo y producción deben mantenerse separadas.

### 25. Rendimiento

- El sistema debe responder adecuadamente durante los horarios de mayor demanda.
- Las consultas del menú deben estar optimizadas.
- La gestión de pedidos debe evitar retrasos innecesarios.
- El sistema debe permitir manejar simultáneamente pedidos anticipados y pedidos de mostrador.
- Se debe priorizar la reducción del tiempo de espera en caja.

### 26. Objetivos de rendimiento

El sistema debe contribuir a alcanzar los siguientes objetivos definidos para el proyecto:

- Reducir el tiempo de espera en caja en al menos **50 % durante los recesos**.
- Permitir que el **100 % de los pedidos anticipados** puedan realizarse con al menos **10 minutos de anticipación**.
- Reducir los errores derivados de la comunicación verbal de los pedidos.

### 27. Alcance

El desarrollo debe mantenerse dentro del alcance establecido para el MVP.

Las funcionalidades principales serán:

- Gestión de usuarios y roles.
- Gestión del menú.
- Consulta del menú.
- Gestión de platillos.
- Pedidos anticipados.
- Pedidos de mostrador.
- Pago anticipado.
- Visualización de pedidos en cocina.
- Actualización del estado de pedidos.
- Notificaciones de pedido listo.

No deben agregarse funcionalidades fuera del alcance sin una aprobación previa.

### 28. Restricciones

- El sistema no debe interrumpir el servicio actual de mostrador.
- Debe considerarse la dependencia de la conectividad a internet dentro del plantel.
- La solución debe considerar la disponibilidad limitada del personal para capacitación.
- El proyecto debe mantenerse dentro del presupuesto establecido para el MVP.

### 29. Criterio de aceptación

El sistema será considerado funcional cuando permita completar el flujo principal:

```text
Consulta del menú
        ↓
Selección de productos
        ↓
Creación del pedido
        ↓
Pago
        ↓
Recepción del pedido en cocina
        ↓
Preparación
        ↓
Pedido listo
        ↓
Notificación al usuario
        ↓
Recogida / entrega
```

La aceptación final estará sujeta a una demostración funcional y a la validación de la patrocinadora del proyecto.

### 30. Principio general

Todas las decisiones de desarrollo deben priorizar:

1. Cumplimiento del alcance del proyecto.
2. Seguridad de la información.
3. Facilidad de uso.
4. Mantenibilidad del código.
5. Rendimiento durante los horarios de mayor demanda.
6. Simplicidad de implementación.
7. Viabilidad económica del MVP.
