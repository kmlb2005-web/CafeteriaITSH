# Requerimientos del MVP — Sistema de Pedidos Anticipados Cafetería ITSH

Documento de requisitos funcionales del MVP, elaborado a partir de la
`docs/Matriz_de_calidad.md`. Cada requisito indica su criterio de aceptación, la
prueba que lo verifica y dónde colocar la captura de pantalla que lo respalda.

Las capturas se guardan en `docs/evidencias/` con el nombre indicado. Para las
capturas de pantalla de la aplicación, se usa la ruta (URL) de la interfaz
indicada con el frontend corriendo en `http://localhost:5173` y el backend en
`http://localhost:3000`. Para las capturas de ejecución de pruebas, se usa el
comando indicado en una terminal abierta en `backend/`.

---

## Tabla resumen de requerimientos

| ID | Requisito | Criterio de aceptación | Prueba | Resultado |
|----|-----------|------------------------|--------|-----------|
| RF-01 | Validación de registro y acceso sin exponer información interna | Un acceso con contraseña errónea o con cuenta inexistente responde el mismo error genérico; un registro con correo ya usado responde con un mensaje claro sin información adicional de la cuenta | Backend (Vitest + supertest): `auth.test.ts`, 8 casos, incluido 409 con correo duplicado | Aprobado |
| RF-02 | Pedido anticipado con al menos 10 minutos de anticipación | Recogida a menos de 10 minutos responde 400 y no crea pedido; con más de 10 minutos se acepta | Backend (Vitest + supertest): `pedidos.test.ts`, casos 201 con folio y total en Pendiente, 400 sin crear pedido y borde 9/11 minutos | Aprobado |
| RF-03 | Mostrador y anticipados operan simultáneamente sin bloquearse | Varias operaciones al mismo tiempo sobre un mismo pedido dejan un solo resultado válido; las demás se rechazan sin bloquear al resto | Backend (Vitest + supertest): `pedidos.test.ts`, cobros simultáneos (1×200, 4×409, un solo pago) con un pedido de mostrador cobrado en paralelo | Aprobado |
| RF-04 | Aviso al dueño al pasar a Listo, sin bloquear la transición | Al llegar a Listo aparece un aviso no leído; otros estados no generan aviso; si el aviso falla, el pedido igual queda en Listo | Backend (Vitest + supertest): `mis-pedidos.test.ts`, 4 casos del bloque de notificación a Listo | Aprobado |
| RF-05 | Único cambio backend permitido: exponer `fecha_recoleccion` en la cola de cocina | Cada pedido anticipado de la cola trae `fecha_recoleccion` con formato `YYYY-MM-DDTHH:mm`; los de mostrador la traen en null | Backend (Vitest + supertest): `cocina.test.ts`, caso ambos orígenes ordenados por llegada, con aserción de `fecha_recoleccion` | Aprobado |

---

## RF-01 — Validación de registro y acceso sin exponer información interna

**Origen:** `specs/002-foundation-auth/spec.md`, FR-021 y FR-022 (líneas
149–154) y el caso borde de registro (líneas 111–112).

**Requisito:** El sistema MUST validar los datos de registro y acceso antes de
procesarlos y MUST mostrar mensajes de error claros sin exponer información
interna del servidor (trazas ni datos de la cuenta). En inicio de sesión, los
mensajes de falla MUST ser idénticos para una cuenta existente y una
inexistente (SC-S1-02); en registro con un correo ya usado, el mensaje MUST
ser claro sin revelar información adicional de la cuenta.

**Criterio de aceptación:** Un acceso con contraseña errónea o con cuenta
inexistente responde el mismo error genérico. Un registro con un correo ya
usado responde con un mensaje claro que no revela información adicional de la
cuenta (el spec no exige ocultar que la cuenta existe).

**Prueba ejecutada:** Backend (Vitest + supertest): `backend/tests/integration/auth.test.ts`,
8 casos, incluido 409 con correo duplicado.

| Caso | Qué comprueba | Resultado |
|------|---------------|-----------|
| Contraseña errónea | Responde 401 (`no_autorizado`) con el mensaje "Correo o contraseña incorrectos." | Aprobado |
| Cuenta inexistente | Responde 401 con el mismo mensaje, igual que con la contraseña errónea (SC-S1-02) | Aprobado |
| Registro con datos inválidos | Responde 400 (`validacion`) | Aprobado |
| Registro con un correo ya usado | Responde 409 (`duplicado`) con "Ya existe una cuenta con ese correo.": rechaza con un mensaje claro que no revela información adicional de la cuenta | Aprobado |

**Resultado:** Aprobado. El criterio original exigía no revelar que la cuenta
existe, lo que contradice el spec: este solo pide mensajes claros sin
información interna (FR-022) y, en registro, un mensaje claro que no revele
más información de la cuenta (líneas 111–112); la identidad de mensajes se
exige y cumple únicamente en login (SC-S1-02). D-01 queda cerrado por
aclaración del criterio: el código (`backend/src/services/auth.service.ts`,
línea 53) no se modifica.

### Evidencias de RF-01

| Captura | Dónde ponerla en el documento | Dónde obtenerla |
|---------|-------------------------------|-----------------|
| `docs/evidencias/captura-login-error.png` | Debajo del párrafo "Prueba ejecutada", junto a la tabla de casos | Interfaz: abrir `http://localhost:5173/login`, iniciar sesión con un correo inexistente y contraseña incorrecta, y capturar el mensaje "Correo o contraseña incorrectos." en pantalla |
| `docs/evidencias/captura-registro-correo-duplicado.png` | Junto a la fila "Registro con un correo ya usado" de la tabla | Interfaz: abrir `http://localhost:5173/registro`, registrar un correo ya existente y capturar el mensaje 409 mostrado |
| `docs/evidencias/captura-auth-test.png` | Debajo del párrafo "Resultado", junto a la aclaración del criterio (D-01) | Terminal en `backend/`: `npx vitest run tests/integration/auth.test.ts --reporter=verbose` y capturar la salida completa |

---

## RF-02 — Pedido anticipado con al menos 10 minutos de anticipación

**Origen:** `specs/004-advance-orders-payment/spec.md`, FR-011 (líneas 118–120).

**Requisito:** El pedido MUST exigir recogida con al menos 10 minutos de
anticipación; con menos MUST rechazarse sin crear el pedido.

**Criterio de aceptación:** Una recogida a menos de 10 minutos responde 400 y no
crea pedido. Una recogida con más de 10 minutos de anticipación se acepta.

**Prueba ejecutada:** Backend (Vitest + supertest): `backend/tests/integration/pedidos.test.ts`,
casos 201 con folio, total y detalle congelado en Pendiente, 400 sin crear
pedido y borde del límite a 9 y 11 minutos.

| Caso | Qué comprueba | Resultado |
|------|---------------|-----------|
| Recogida a 45 minutos | Responde 201, con folio, total y detalle congelado, en estado Pendiente | Aprobado |
| Recogida a 5 minutos | Responde 400 (`anticipacion_insuficiente`) y no crea el pedido | Aprobado |
| Recogida a 9 minutos (borde) | Responde 400 (`anticipacion_insuficiente`) y no queda ningún pedido con esa hora | Aprobado |
| Recogida a 11 minutos (borde) | Responde 201 con estado Pendiente y la hora de recogida registrada | Aprobado |

**Resultado:** Aprobado. O-01 resuelta: se agregaron los casos de borde de 9 y
11 minutos; no se prueba exactamente 10 porque el reloj avanza durante la
petición.

### Evidencias de RF-02

| Captura | Dónde ponerla en el documento | Dónde obtenerla |
|---------|-------------------------------|-----------------|
| `docs/evidencias/captura-recogida-10-minutos.png` | Debajo del párrafo "Prueba ejecutada", junto a la tabla de casos | Interfaz: abrir `http://localhost:5173/menu`, agregar un platillo del menú del día, continuar a `http://localhost:5173/pedido/confirmar`, programar la recogida a menos de 10 minutos y capturar el mensaje de rechazo (lo muestra la validación en cliente; el backend responde 400 `anticipacion_insuficiente` con la misma regla) |
| `docs/evidencias/captura-pedido-aceptado.png` | Junto a la fila "Recogida a 45 minutos" | Interfaz: mismo flujo, pero programando la recogida con más de 10 minutos y capturando la confirmación con folio en `http://localhost:5173/pedido/:id/confirmacion` |
| `docs/evidencias/captura-pedidos-test.png` | Debajo del párrafo "Resultado", junto a la aclaración de O-01 | Terminal en `backend/`: `npx vitest run tests/integration/pedidos.test.ts --reporter=verbose` y capturar la salida completa |

---

## RF-03 — Mostrador y anticipados operan simultáneamente sin bloquearse

**Origen:** `specs/005-counter-kitchen/spec.md`, FR-016 (líneas 125–127).

**Requisito:** Mostrador y anticipados MUST operar simultáneamente sin
bloquearse.

**Criterio de aceptación:** Varias operaciones enviadas al mismo tiempo sobre un
mismo pedido dejan un solo resultado válido y las demás se rechazan sin bloquear
al resto.

**Prueba ejecutada:** Backend (Vitest + supertest): `backend/tests/integration/pedidos.test.ts`,
caso segundo pago 409 (secuencial) y caso de cobros simultáneos con
`Promise.all`: 5 peticiones sobre un mismo pedido (1×200, 4×409, una sola fila
en `pago`) más el cobro de un pedido de mostrador ejecutado en paralelo.

| Caso | Qué comprueba | Resultado |
|------|---------------|-----------|
| Segundo pago, una petición después de la otra | Responde 409 (`ya_pagado`) y en la base queda un solo pago | Aprobado |
| Varios cobros al mismo tiempo sobre un pedido | De 5 simultáneas: 1 responde 200, 4 responden 409 (`ya_pagado`) y queda un solo pago confirmado | Aprobado |
| Mostrador y anticipados operando a la vez | El cobro de un pedido de mostrador corre junto a los del anticipado y ambos quedan con un solo pago (se omite si la corrida cruza la medianoche, porque la caja solo vende el menú de hoy) | Aprobado |

**Resultado:** Aprobado. D-02 resuelto: se agregó la prueba de concurrencia
propuesta (cobros simultáneos) junto con el cobro de mostrador en paralelo. El
código ya lo garantiza con `FOR UPDATE` + `UNIQUE(pedido_id)`
(`backend/src/services/pedidos.service.ts`, líneas 348 y 568).

### Evidencias de RF-03

| Captura | Dónde ponerla en el documento | Dónde obtenerla |
|---------|-------------------------------|-----------------|
| `docs/evidencias/captura-pago-secuencial.png` | Debajo del párrafo "Prueba ejecutada", junto a la tabla de casos | Terminal en `backend/`: `npx vitest run tests/integration/pedidos.test.ts --reporter=verbose` y capturar los casos de segundo pago 409 y de cobros simultáneos |
| `docs/evidencias/captura-caja-nuevo.png` | Junto a la fila "Mostrador y anticipados operando a la vez" | Interfaz: abrir `http://localhost:5173/caja/nuevo` (sesión de cajero) y capturar la pantalla de captura de pedido de mostrador, para documentar el origen mostrador que opera junto a los anticipados |
| `docs/evidencias/captura-caja-entregas.png` | Junto a la fila "Mostrador y anticipados operando a la vez" | Interfaz: abrir `http://localhost:5173/caja/entregas` y capturar la lista de entregas con pedidos de ambos orígenes |

---

## RF-04 — Aviso al dueño al pasar a Listo, sin bloquear la transición

**Origen:** `specs/006-order-tracking-notifications/spec.md`, FR-019 (línea 142).

**Requisito:** Al pasar a Listo, el sistema MUST generar un aviso para el dueño
desde un módulo separado de la lógica de pedidos; el aviso NUNCA MUST bloquear
ni revertir la transición.

**Criterio de aceptación:** Al llegar a Listo aparece un aviso no leído; otros
estados no generan aviso. Si el aviso falla, el pedido igual queda en Listo.

**Prueba ejecutada:** Backend (Vitest + supertest): `backend/tests/integration/mis-pedidos.test.ts`,
bloque "Notificación de pedido listo (US2, FR-019)", 4 casos, incluido "si el
envío falla, el estado Listo sigue visible y se reintenta".

| Caso | Qué comprueba | Resultado |
|------|---------------|-----------|
| Pedido pagado, aún no Listo | El cliente no tiene aviso de ese pedido | Aprobado |
| Pedido llevado a Listo | Aparece un aviso no leído (`aviso_listo`) para el dueño | Aprobado |
| El módulo de avisos falla (envío simulado fallido) | El pedido queda en Listo, el aviso se registra como fallida y se reintenta (hasta 3 intentos) sin bloquear la transición | Aprobado |
| Un pedido de mostrador (sin cuenta) | No genera notificación | Aprobado |

**Resultado:** Aprobado. O-02 resuelta: la prueba de fallo ya existe en
`mis-pedidos.test.ts` (simula el envío fallido y comprueba que el pedido sigue
en Listo mientras el aviso se reintenta); el código además crea el aviso
después del commit y captura su error. Nota: el "aviso no leído" se deriva del
estado Listo (campo `aviso_listo`), no de una bandera de lectura — no existe
endpoint para marcar un aviso como visto y la prueba que lo simulaba se retiró
de la tabla.

### Evidencias de RF-04

| Captura | Dónde ponerla en el documento | Dónde obtenerla |
|---------|-------------------------------|-----------------|
| `docs/evidencias/captura-avisos-listo.png` | Debajo del párrafo "Prueba ejecutada", junto a la tabla de casos | Terminal en `backend/`: `npx vitest run tests/integration/mis-pedidos.test.ts --reporter=verbose` y capturar la salida completa del bloque de notificación |
| `docs/evidencias/captura-cocina-listo.png` | Junto a la fila "Pedido llevado a Listo" | Interfaz: abrir `http://localhost:5173/cocina` (sesión de cocinero), pasar un pedido a Listo con el botón táctil y capturar el cambio de estado |
| `docs/evidencias/captura-mis-pedidos-aviso.png` | Junto a la fila "Pedido llevado a Listo" | Interfaz: abrir `http://localhost:5173/mis-pedidos` (sesión del cliente/dueño) y capturar el aviso no leído del pedido en estado Listo |

---

## RF-05 — Único cambio backend permitido: exponer `fecha_recoleccion` en la cola de cocina

**Origen:** `specs/007-ui-redesign/spec.md`, FR-010 (líneas 230–234, hora de
recolección visible en la tarjeta de cocina) y FR-021 (líneas 274–278, sin
funcionalidad nueva de backend).

**Requisito:** Único cambio backend permitido: exponer `fecha_recoleccion` de
lectura en `GET /api/cocina/pedidos`. Nada más.

**Criterio de aceptación:** Cada pedido anticipado de la cola trae
`fecha_recoleccion` con formato `YYYY-MM-DDTHH:mm`; los de mostrador la traen
en null.

**Prueba ejecutada:** Backend (Vitest + supertest): `backend/tests/integration/cocina.test.ts`,
caso "lista ambos orígenes por llegada, solo activos y sin precios", con
búsqueda de los pedidos por id y aserción del formato de `fecha_recoleccion`.

| Caso | Qué comprueba | Resultado |
|------|---------------|-----------|
| Pedidos anticipado y de mostrador | Ambos aparecen en la cola | Aprobado |
| Pedido pendiente | No aparece en la cola | Aprobado |
| Orden por llegada | El anticipado sale antes que el de mostrador | Aprobado |
| `fecha_recoleccion` de cada pedido | El anticipado trae `YYYY-MM-DDTHH:mm` y el mostrador trae null (los pedidos se buscan por id) | Aprobado |

**Resultado:** Aprobado. D-03 resuelto: la prueba ya busca los pedidos por id
(en lugar de tomar `pedidos[0]`) y se restauró la aserción del formato de
`fecha_recoleccion` que se había perdido. El código está en
`backend/src/services/pedidos.service.ts` (`listarPedidosCocina`, líneas
895–897); no existe `services/cocina.ts`.

### Evidencias de RF-05

| Captura | Dónde ponerla en el documento | Dónde obtenerla |
|---------|-------------------------------|-----------------|
| `docs/evidencias/captura-cola-cocina-ui.png` | Junto a la fila "Pedidos anticipado y de mostrador" | Interfaz: abrir `http://localhost:5173/cocina` (sesión de cocinero) con un pedido anticipado y uno de mostrador pagados, y capturar la cola mostrando la hora de recogida del anticipado |
| `docs/evidencias/captura-cola-cocina-corregida.png` | Debajo del párrafo "Resultado", junto a la resolución de D-03 | Terminal en `backend/`: `npx vitest run tests/integration/cocina.test.ts --reporter=verbose` y capturar las 8 pruebas en verde, incluida la aserción de `fecha_recoleccion` |

---

## Anexo — Rutas de la interfaz para las capturas

| Ruta (URL) | Pantalla | Rol de sesión requerido |
|------------|----------|-------------------------|
| `http://localhost:5173/login` | Inicio de sesión | Ninguno |
| `http://localhost:5173/registro` | Registro de cliente | Ninguno |
| `http://localhost:5173/menu` | Menú del día (cliente) | usuario |
| `http://localhost:5173/pedido/confirmar` | Confirmación de pedido anticipado | usuario |
| `http://localhost:5173/pedido/:id/pago` | Pago del pedido | usuario |
| `http://localhost:5173/pedido/:id/confirmacion` | Confirmación con folio | usuario |
| `http://localhost:5173/mis-pedidos` | Pedidos del cliente y avisos | usuario |
| `http://localhost:5173/caja` | Pantalla de caja | cajero |
| `http://localhost:5173/caja/nuevo` | Pedido de mostrador | cajero |
| `http://localhost:5173/caja/entregas` | Entregas | cajero |
| `http://localhost:5173/cocina` | Cola de cocina | cocinero |
| `http://localhost:5173/admin` | Panel de administración | administrador |

## Anexo — Comandos para las capturas de ejecución de pruebas

Ejecutados en una terminal dentro de `backend/` con el backend y MySQL corriendo:

```bash
npx vitest run tests/integration/auth.test.ts --reporter=verbose          # RF-01
npx vitest run tests/integration/pedidos.test.ts --reporter=verbose       # RF-02, RF-03
npx vitest run tests/integration/mis-pedidos.test.ts --reporter=verbose   # RF-04
npx vitest run tests/integration/cocina.test.ts --reporter=verbose        # RF-05
```

Todas las capturas se guardan en `docs/evidencias/` con los nombres indicados en
las tablas de cada requisito, y se insertan en el documento justo debajo del
bloque (Prueba o Resultado) al que respaldan.
