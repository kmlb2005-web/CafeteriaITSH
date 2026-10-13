/speckit.specify Construir un sistema web de pedidos anticipados llamado "Sistema de Pedidos Anticipados — Cafetería ITSH" para que alumnos y docentes del Instituto Tecnológico Superior de Huauchinango consulten el menú, hagan pedidos y pagos por adelantado, y reciban una notificación cuando su pedido esté listo, sin interrumpir el servicio actual de mostrador.

## Objetivos del proyecto
- Reducir el tiempo de espera en caja en al menos 50 % durante los recesos
- Permitir que el 100 % de los pedidos anticipados se realicen con al menos 10 minutos de anticipación
- Reducir los errores derivados de la comunicación verbal de los pedidos

## Roles del sistema
- Administrador
- Cajero
- Cocinero
- Alumno / Docente

## Arquitectura de la aplicación
- Una sola aplicación web de frontend (React + TypeScript, compilada con Vite) organizada en rutas por rol:
  - `/admin` — administrador
  - `/caja` — cajero
  - `/cocina` — cocinero
  - `/menu` y `/mis-pedidos` — clientes (alumno/docente)
- Rutas protegidas por JWT y rol: cada ruta exige sesión activa y el rol correspondiente.
- Framework de diseño del frontend: **Tailwind CSS + shadcn/ui** (componentes copiados al proyecto y personalizados con los tokens del proyecto).
- Los diseños de Stitch (`.stitch/DESIGN.md`) son una base de referencia; no se replican al 100 % y podrán modificarse durante el desarrollo.
- Un backend único (Node.js LTS + Express, API REST) atiende a todos los roles.

## Features principales

### Gestión de usuarios y roles
- Registro e inicio de sesión con correo electrónico y contraseña
- Cada usuario tiene un rol asignado: administrador, cajero, cocinero o alumno/docente
- Cada usuario solo puede acceder a las funciones correspondientes a su rol
- El administrador puede crear, editar y gestionar a los usuarios operativos (cajeros y cocineros)

### Gestión del menú (Administrador)
- Crear y modificar el menú diario
- Crear, editar y gestionar los platillos disponibles
- Gestionar los especiales del día
- Asignar y modificar precios
- Marcar platillos como no disponibles
- Los platillos no disponibles NO se pueden seleccionar en nuevos pedidos
- Los cambios en el menú se reflejan de inmediato para los usuarios finales

### Consultar el menú (Alumno / Docente)
- Ver el menú del día con platillos, precios y disponibilidad
- Ver los especiales del día
- La consulta debe ser rápida, incluso en horarios de receso

### Realizar un pedido anticipado (Alumno / Docente)
- Seleccionar uno o más platillos del menú del día y sus cantidades
- Ver el total del pedido antes de confirmar
- El pedido debe hacerse con al menos 10 minutos de anticipación
- No se permite crear pedidos con menos de 10 minutos de anticipación
- No se permite incluir platillos no disponibles
- El pago forma parte del flujo de realización del pedido

### Pago anticipado
- Pago en línea del pedido anticipado mediante un servicio de pago externo
- El sistema NO almacena datos sensibles de tarjetas bancarias
- Solo se registra la información necesaria para identificar y validar la transacción
- Un pedido anticipado pasa a "Pagado" cuando el pago se confirma

### Consultar el estado de mis pedidos (Alumno / Docente)
- Ver la lista de mis pedidos y el estado actual de cada uno
- Ver el detalle de cada pedido (platillos, cantidades, total)

### Estados de un pedido
- Estados válidos: Pendiente, Pagado, En preparación, Listo, Entregado, Cancelado
- Cada pedido tiene siempre un estado que permite conocer su progreso
- Flujo principal:
  - Pendiente → Pagado
  - Pagado → En preparación
  - En preparación → Listo
  - Listo → Entregado
- Un pedido puede pasar a Cancelado antes de ser entregado
- Transiciones NO válidas:
  - Saltarse estados del flujo principal (por ejemplo, Pendiente → Listo)
  - Cambiar el estado de un pedido Entregado o Cancelado

### Pedidos de mostrador (Cajero)
- Capturar pedidos hechos presencialmente en el mostrador
- Registrar y gestionar el cobro de los pedidos locales
- Los pedidos de mostrador y los anticipados se operan al mismo tiempo
- El flujo debe requerir la menor cantidad de pasos posible
- Los pedidos capturados en sistema evitan errores por interpretación verbal

### Visualización de pedidos en cocina (Cocinero)
- Ver los pedidos entrantes (anticipados y de mostrador) en una sola pantalla
- Ver los productos y cantidades que deben prepararse
- Identificar fácilmente el orden de preparación de los pedidos
- La lista se actualiza para que el personal sepa qué debe prepararse sin recargar manualmente
- Cambiar el estado del pedido a "En preparación" y a "Listo"

### Notificaciones de pedido listo
- Cuando un pedido pasa a "Listo", se notifica al alumno o docente que ya puede recogerlo
- La funcionalidad de notificaciones está separada de la lógica principal de pedidos
- Puede apoyarse en un servicio externo

## Flujo principal de aceptación
Consulta del menú → Selección de productos → Creación del pedido → Pago → Recepción del pedido en cocina → Preparación → Pedido listo → Notificación al usuario → Recogida / entrega

## Requisitos no funcionales
- Interfaz responsiva: funciona en móviles y computadoras
- Interfaces simples, claras y rápidas
- Pantallas de caja y cocina optimizadas para rapidez y legibilidad en horarios de receso
- Debe responder bien en horarios de mayor demanda y manejar pedidos anticipados y de mostrador a la vez
- Datos validados antes de procesarse y almacenarse
- Mensajes de error claros para el usuario, sin exponer información interna del servidor
- Contraseñas y credenciales nunca almacenadas en texto plano ni en el código
- Debe considerar la dependencia de internet dentro del plantel
- Debe considerar la disponibilidad limitada del personal para capacitación (uso intuitivo)
- Debe poder correr localmente y desplegarse con hosting gratuito o de bajo costo

## Lo que NO se va a construir
- No se debe interrumpir ni reemplazar el servicio actual de mostrador
- No se almacenará información sensible de tarjetas bancarias
- No se agregarán funcionalidades fuera del alcance del MVP sin aprobación previa
- No habrá aplicación móvil nativa (solo web responsiva)
- No habrá sistema de reseñas, puntos o promociones de lealtad
- No habrá gestión de inventario ni de proveedores
