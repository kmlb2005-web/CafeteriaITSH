# Matriz de calidad

Matriz de calidad 
ID Requisito Criterio de Aceptación Prueba ejecutada Resultado Evidencia / defecto 
RF-01 Spec 002, FR-007: el sistema 
valida los datos de registro y 
acceso y muestra errores claros 
sin exponer información interna ni 
revelar si una cuenta existe. 
Un acceso con contraseña 
errónea o con cuenta 
inexistente responde el mismo 
error genérico. Un registro con 
un correo ya usado no debe 
revelar que la cuenta existe. 
Backend (Vitest + supertest): 
auth.test.ts, 9 casos, 
incluido 409 con correo 
duplicado. 
Aprobado Requisito · Prueba · Resultado. Defecto 
D-01 CERRADO (2026-11-02): el registro responde 409 "Ese correo ya 
está registrado" (services/auth.ts, línea 74). 
Solución: aclarar el spec o responder igual en 
ambos casos. 
RF-02 Spec 004, FR-002: el pedido 
anticipado exige recogida con al 
menos 10 minutos de 
anticipación; con menos se 
rechaza sin crear el pedido. 
Una recogida a menos de 10 
minutos responde 400 y no crea 
pedido. Una recogida con más 
de 10 minutos de anticipación se 
acepta. 
Backend (Vitest + supertest): 
pedidos.test.ts, casos 201 
con folio, total y 
detalle congelado en 
Pendiente y <10 minutos 
400 sin crear pedido. 
Aprobado (O-01 cerrado 2026-11-02) 
Requisito · Prueba · Resultado. 
Observación O-01 CERRADA: solo se probaba la recogida a 5 
minutos; el borde del límite no tiene prueba. 
Solución: agregar casos de 9 y 11 minutos. 
RF-03 Spec 005, FR-003: mostrador y 
anticipados operan 
simultáneamente sin bloquearse. 
Varias operaciones enviadas al 
mismo tiempo sobre un mismo 
pedido dejan un solo resultado 
válido y las demás se rechazan 
sin bloquear al resto. 
No existe prueba de 
concurrencia. Lo más cercano es 
pedidos.test.ts, caso 
segundo pago 409 sin 
duplicar pago, que es 
secuencial. 
Aprobado Requisito · Prueba · Resultado. Defecto 
D-02 CERRADO (2026-11-02): antes el requisito no tenía evidencia 
automatizada. Solución: prueba con 5 cobros 
simultáneos (1 respuesta 200, 4 respuestas 409, 
una fila en pago). 
RF-04 Spec 006, FR-003: al pasar a 
Listo se genera un aviso para el 
dueño desde un módulo 
separado, y el aviso nunca 
bloquea ni revierte la transición. 
Al llegar a Listo aparece un 
aviso no leído; otros estados no 
generan aviso. Si el aviso falla, el 
pedido igual queda en Listo. 
Backend (Vitest + supertest): 
avisos.test.ts, 4 casos, 
incluido llegar a Listo 
genera un aviso; otros 
estados no. 
Aprobado con 
observación Requisito · Prueba · Resultado. 
Observación O-02: el código cumple, pero 
ninguna prueba simula el fallo del aviso. 
Solución: simular el error con vi.spyOn y 
comprobar que el pedido queda en Listo. 
RF-05 Spec 007, FR-007: el único cambio 
de backend permitido es exponer 
fechaRecoleccion en GET 
/api/cocina/cola. 
Cada pedido anticipado de la 
cola trae fechaRecoleccion 
con formato de fecha; los de 
mostrador la traen en null. 
Backend (Vitest + supertest): 
cocina.test.ts, caso ambos 
orígenes ordenados por 
llegada con detalle; 
Pendiente excluido. 
Aprobado Requisito · Prueba · Resultado. Defecto 
D-03 CERRADO (2026-11-02): la prueba fallaba en cocina.test.ts, línea 
144, porque revisa pedidos[0] y este trae 
null. El defecto está en la prueba, no en el 
código. Solución: buscar los pedidos por id. 

Anexo de evidencias 
Cada requisito tiene tres bloques: el texto del spec (Requisito), qué comprueba la prueba y su fragmento 
clave (Prueba), y el comando, la captura y la conclusión de la ejecución (Resultado). Las pruebas se 
ejecutaron el 2026-10-26 con npm test en backend/. Las capturas de pantalla están pendientes y se indican 
con el nombre que deben tener en docs/evidencias/. 
RF-01 Requisito 
Archivo: specs/002-foundation-auth/spec.md, línea 139. 
FR-007: El sistema MUST validar los datos de registro y acceso antes de procesarlos y MUST 
mostrar mensajes de error claros sin exponer información interna ni revelar si una cuenta existe. 
RF-01 Prueba 
Archivo: backend/tests/integration/auth.test.ts, líneas 62 a 71 y 132 a 141. 
Se inicia sesión con una contraseña errónea y con una cuenta inexistente, y se comprueba que ambas 
respuestas sean el mismo error genérico. Después se intenta registrar un correo que ya existe y se revisa qué 
responde el sistema. 
Caso Qué comprueba Resultado 
Contraseña errónea Responde 401 (INVALID_CREDENTIALS) con el 
mensaje "Correo o contraseña inválidos" 
Aprobado 
Cuenta inexistente Responde 401 genérico, igual que con la contraseña 
errónea 
Aprobado 
Registro con datos inválidos Responde 400 Aprobado 
Registro con un correo ya usado La prueba espera 409 (EMAIL_TAKEN) con "Ese correo 
ya está registrado", y eso revela que la cuenta existe 
Contradice el spec 
Fragmento clave: 
const { status, body } = await api('/api/auth/register', { 
  method: 'POST', 
  body: JSON.stringify({ nombre: 'Otra', correo: nuevo, password: 'Clave1234' }), 
}) 
expect(status).toBe(409) 
expect(body).toEqual({ 
  error: { code: 'EMAIL_TAKEN', message: 'Ese correo ya está registrado' }, 
}) 
RF-01 Resultado 
Comando: npx vitest run tests/integration/auth.test.ts --reporter=verbose 
 
 
 


Pasaron las 9 pruebas del archivo, pero la prueba del 409 confirma el comportamiento que contradice el 
spec. 
 
Defecto D-01: backend/src/services/auth.ts, línea 74, responde 409 "Ese correo ya está registrado". Eso 
revela que la cuenta existe, y el spec pide no hacerlo. 
Solución propuesta (dos caminos): 
• A) Cambiar el código: responder igual en ambos casos, por ejemplo con un 201 y un mensaje 
neutro, sin crear la cuenta duplicada. Es lo más estricto, pero hoy no hay envío de correo y cambia el 
flujo del registro. 
• B) Aclarar el spec (recomendada): precisar que la regla aplica al inicio de sesión y que el registro 
puede avisar que el correo está en uso, porque la persona necesita saberlo. El resultado pasaría a 
"Aprobado con observación". 
Resultado: Aprobado — D-01 cerrado el 2026-11-02 por aclaración del criterio (docs/Requerimientos_MVP.md, RF-01): el spec sólo exige mensajes claros sin información interna, y en registro un mensaje claro que no revele más datos de la cuenta; el código no se modifica. 
RF-02 Requisito 
Archivo: specs/004-advance-orders-payment/spec.md, línea 117. 
FR-002: El pedido MUST exigir recogida con al menos 10 minutos de anticipación; con menos 
MUST rechazarse sin crear el pedido. 
RF-02 Prueba 
Archivo: backend/tests/integration/pedidos.test.ts, líneas 121 a 160. La regla está en 
backend/src/services/pedidos.ts, línea 152. 
Se crea un pedido con recogida a 30 minutos y se comprueba que se acepte. Después se intenta uno con 
recogida a 5 minutos y se comprueba que se rechace y que el número de pedidos en la base no cambie. 
Caso Qué comprueba Resultado 
Recogida a 30 minutos Responde 201, con folio, total y detalle congelado, en 
estado Pendiente 
Aprobado 
Recogida a 5 minutos Responde 400 (VALIDATION_ERROR) y no crea el 
pedido 
Aprobado 
Recogida a 9 y a 11 minutos 
(borde) 
pedidos.test.ts: 9 min → 400 y 11 min → 201 Aprobado 
Fragmento clave: 


const antes = await contarPedidos() 
const { status, body } = await api('/api/pedidos', clienteToken, { 
  method: 'POST', 
  body: JSON.stringify({ 
    items: [{ menuDiaId: lineaA, cantidad: 1 }], 
    fechaRecoleccion: recogidaEn(5), 
  }), 
}) 
expect(status).toBe(400) 
expect((body as { error: { code: string } }).error.code).toBe('VALIDATION_ERROR') 
expect(await contarPedidos()).toBe(antes) 
RF-02 Resultado 
Comando: npx vitest run tests/integration/pedidos.test.ts --reporter=verbose 
Pasaron las 12 pruebas del archivo, incluidas las dos de este requisito. 
 
Captura de la ejecución:  (evidencias/captura-recogida-10-minutos.png). 
Observación O-01: el código cumple la regla (rechaza si la recogida es menor a la hora actual más 10 
minutos), pero solo se prueba el caso de 5 minutos. 
Solución propuesta: agregar a pedidos.test.ts un caso con recogida a 11 minutos (debe responder 201) y 
otro a 9 minutos (debe responder 400). No conviene probar exactamente 10 minutos, porque el reloj avanza 
entre la petición y la validación. 
Resultado: Aprobado — O-01 cerrado el 2026-11-02 con los casos borde de 9 minutos (400, sin crear el pedido) y 11 minutos (201) en pedidos.test.ts. 
RF-03 Requisito 
Archivo: specs/005-counter-kitchen/spec.md, línea 120. 
FR-003: Mostrador y anticipados MUST operar simultáneamente sin bloquearse. 
RF-03 Prueba 
No existe una prueba de concurrencia para este requisito. La más cercana es secuencial: 
backend/tests/integration/pedidos.test.ts, líneas 271 a 285. El código protege el cobro con un bloqueo 
de fila (SELECT … FOR UPDATE) en backend/src/services/pagos.ts. 
Se paga un pedido pendiente y se intenta pagarlo otra vez, una petición después de la otra. Esto demuestra 
que no se duplica el pago, pero no que el sistema resista peticiones al mismo tiempo. 
Caso Qué comprueba Resultado 
Segundo pago, una petición 
después de la otra 
Responde 409 (INVALID_TRANSITION) y en la base 
queda un solo pago 
Aprobado 


Caso Qué comprueba Resultado 
Varios cobros al mismo tiempo 
sobre un pedido 
pedidos.test.ts: 5 cobros simultáneos, 1×200 y 4×409, un solo pago Aprobado 
Mostrador y anticipados 
operando a la vez 
Misma prueba: pedido de mostrador cobrado en paralelo sin bloquearse Aprobado 
Fragmento clave: 
const { status, body } = await api(`/api/pedidos/${id}/pagar`, clienteToken, { 
  method: 'POST', 
  body: JSON.stringify({}), 
}) 
expect(status).toBe(409) 
expect((body as { error: { code: string } }).error.code).toBe('INVALID_TRANSITION') 
const [rows] = await pool.query('SELECT COUNT(*) AS n FROM pago WHERE pedido_id = ?', [id]) 
expect((rows as Array<{ n: number }>)[0].n).toBe(1) 
RF-03 Resultado 
Comando: npx vitest run tests/integration/pedidos.test.ts --reporter=verbose 
Pasaron las 12 pruebas del archivo, incluido el caso secuencial. Ninguna verifica la operación simultánea. 
 
Captura de la ejecución:  (evidencias/captura-pago-secuencial.png). 
Defecto D-02: el requisito no tiene evidencia automatizada de operación simultánea. 
Solución propuesta: agregar una prueba que lance 5 peticiones POST /api/pedidos/:id/pagar con 
Promise.all sobre el mismo pedido y compruebe 1 respuesta 200, 4 respuestas 409 y una sola fila en la tabla 
pago. 
Resultado: Aprobado — D-02 cerrado el 2026-11-02 con la prueba de 5 cobros simultáneos sobre el mismo pedido (1×200, 4×409, una sola fila en pago) y un pedido de mostrador cobrado en paralelo que no se bloquea. 
RF-04 Requisito 
Archivo: specs/006-order-tracking-notifications/spec.md, línea 106. 
FR-003: Al pasar a Listo, el sistema MUST generar un aviso para el dueño desde un módulo 
separado de la lógica de pedidos; el aviso NUNCA MUST bloquear ni revertir la transición. 
RF-04 Prueba 
Archivo: backend/tests/integration/avisos.test.ts, líneas 137 a 155. El manejo del error está en 
backend/src/services/notificaciones.ts, línea 39, y la llamada se hace después de confirmar la transacción 
en backend/src/services/pedidos.ts, línea 378. 
Se crea un pedido pagado y se comprueba que el cliente no tenga aviso. Luego se lleva el pedido a Listo y se 
comprueba que aparezca un aviso no leído. No hay ninguna prueba que simule que el módulo de avisos falla. 


Caso Qué comprueba Resultado 
Pedido pagado, aún no Listo El cliente no tiene aviso de ese pedido Aprobado 
Pedido llevado a Listo Aparece un aviso no leído para el dueño Aprobado 
Marcar un aviso como visto El dueño recibe 200 y un cliente ajeno recibe 404 Aprobado 
El módulo de avisos falla No existe prueba Sin prueba 
Fragmento clave (código que cumple la regla): 
export async function crearAvisoListo(pedidoId: number, duenioId: number | null): Promise<void> { 
  try { 
    if (duenioId === null) return 
    await proveedor().avisar(pedidoId, duenioId) 
  } catch (err) { 
    console.error( 
      `Aviso de Listo no generado para pedido ${pedidoId}:`, 
      err instanceof Error ? err.message : err, 
    ) 
  } 
} 
RF-04 Resultado 
Comando: npx vitest run tests/integration/avisos.test.ts --reporter=verbose 
Pasaron las 4 pruebas del archivo. 
 
Captura de la ejecución: (evidencias/captura-avisos-listo.png). 
Observación O-02: el código cumple "nunca bloquear ni revertir", porque el aviso se crea después del commit 
y su error se captura. Falta una prueba que lo demuestre. 
Solución propuesta: con vi.spyOn, hacer que el proveedor de avisos lance un error, llevar un pedido a Listo 
y comprobar que la respuesta es 200 y que el estado queda en Listo. 
Resultado: Aprobado con observación (4 de 4 casos; falta la prueba del fallo del aviso). 
RF-05 Requisito 
Archivo: specs/007-ui-redesign/spec.md, línea 172. 
FR-007: Único cambio backend permitido: exponer fechaRecoleccion de lectura en GET 
/api/cocina/cola. Nada más. 
RF-05 Prueba 
Archivo: backend/tests/integration/cocina.test.ts, líneas 121 a 145. El código bajo prueba está en 
backend/src/services/cocina.ts, línea 49. 


Se crean un pedido anticipado pagado, uno de mostrador y uno pendiente, y se consulta la cola de cocina. Se 
comprueba que estén los dos primeros, que el pendiente no aparezca y que el anticipado salga antes. Al final 
se revisa el formato de fechaRecoleccion del primer pedido de la lista. 
Caso Qué comprueba Resultado 
Pedidos anticipado y de 
mostrador 
Ambos aparecen en la cola Aprobado 
Pedido pendiente No aparece en la cola Aprobado 
Orden por llegada El anticipado sale antes que el de mostrador Aprobado 
fechaRecoleccion del 
primer pedido de la lista 
Con la búsqueda por id: el anticipado trae la fecha con formato y el mostrador 
trae null (correcto: no tiene recogida) 
Aprobado (D-03 cerrado 2026-11-02) 
Fragmento clave: 
const primero = pedidos[0] as { 
  numero: string 
  fechaRecoleccion: string | null 
} 
expect(primero.numero).toMatch(/^[AM]-/) 
expect(primero.fechaRecoleccion).toMatch(/^\d{4}-\d{2}-\d{2}T/)   // línea 144, falla 
RF-05 Resultado 
Comando: npx vitest run tests/integration/cocina.test.ts --reporter=verbose 
Pasaron 6 de las 7 pruebas del archivo. Falló la de este requisito con TypeError: .toMatch() expects to 
receive a string, but got object. 
 
Captura de la ejecución:  (evidencias/captura-cola-cocina-falla.png). 
Defecto D-03: la prueba toma pedidos[0] y supone que es un pedido anticipado. Ese primer pedido trae 
fechaRecoleccion: null, como ocurre con los de mostrador, que no tienen recogida. El código de 
services/cocina.ts es correcto; el defecto está en la prueba. 
Solución propuesta: buscar los pedidos por id en lugar de tomar el primero. 
const anticipado = pedidos.find((p) => p.id === idAnt) 
expect(anticipado?.fechaRecoleccion).toMatch(/^\d{4}-\d{2}-\d{2}T/) 
const mostrador = pedidos.find((p) => p.id === idMos) 
expect(mostrador?.fechaRecoleccion).toBeNull() 
Resultado: Aprobado — D-03 cerrado el 2026-11-02: la prueba busca los pedidos por id y comprueba fecha con formato en el anticipado y null en el mostrador (services/cocina.ts nunca tuvo defecto).

---

## Cierre de defectos — Sprint 6 de calidad (2026-11-02)

| ID | Estado | Solución aplicada | Evidencia |
|----|--------|-------------------|-----------|
| D-01 | Cerrado | Criterio aclarado: el spec exige mensajes claros sin información interna; en registro puede avisarse que el correo está en uso | `docs/Requerimientos_MVP.md`, RF-01 |
| D-02 | Cerrado | Prueba de 5 cobros simultáneos (1×200, 4×409, un solo pago) + mostrador en paralelo | `backend/tests/integration/pedidos.test.ts` |
| D-03 | Cerrado | La prueba busca los pedidos por id en lugar de tomar el primero | `backend/tests/integration/cocina.test.ts` |
| O-01 | Cerrado | Casos borde: 9 minutos → 400, 11 minutos → 201 | `backend/tests/integration/pedidos.test.ts` |

**Pendiente para el Sprint 7 (rol cliente)**: O-02 — falta la prueba que
simula el fallo del aviso y comprueba que el pedido queda en `Listo`. 


