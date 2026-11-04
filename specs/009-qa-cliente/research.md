# Research — QA del Cliente (Sprint 7)

**Feature**: `specs/009-qa-cliente` | **Fecha**: 2026-11-03

Investigación sobre el código existente para responder los unknowns del
`plan.md`. No hay dependencias nuevas ni decisiones de tecnología: todo se
resuelve con el stack ya verificado (Vitest + supertest + Testing Library).

## R1 — Cómo simular el fallo del aviso de correo (O-02)

**Decision**: en `backend/tests/integration/mis-pedidos.test.ts` (el archivo
que ya mockea el adaptador) agregar un caso con
`correoMock.mockRejectedValue(new Error('proveedor caído'))`, llevar un pedido
a `Listo` con `avanzar(...)` y comprobar que la respuesta es 200 y el estado
queda `Listo` (más `aviso_listo: true`).

**Rationale**: `notificaciones.service.ts` envuelve todo en `try/catch`
("jamás propaga errores"), pero el único camino hoy probado es
`mockResolvedValue({ exitoso: false, … })` (el proveedor responde fallo). El
camino que la matriz O-02 pide demostrar —el adaptador **lanza** y el `catch`
salva el flujo— no tiene prueba. El patrón `vi.mock` + `vi.mocked` del propio
archivo es el equivalente práctico del `vi.spyOn` que propone la matriz y
mantiene la consistencia con `pedidos.test.ts`/`cocina.test.ts`.

**Alternatives considered**:
- `SIMULAR_FALLO_CORREO=1` (env): afecta a todos los tests del proceso y sólo
  produce `exitoso: false`, no una excepción → descartado.
- `vi.spyOn` sobre el namespace ESM de `correo.js`: con Vitest + NodeNext el
  namespace es inmutable en algunos entornos; `vi.mock` de módulo ya funciona
  en este repo → descartado por fragilidad.

## R2 — La matriz RF-04 cita un archivo de pruebas inexistente

**Hallazgo**: `docs/Matriz_de_calidad.md` (RF-04) dice
`npx vitest run tests/integration/avisos.test.ts` y "pasaron las 4 pruebas
del archivo". El archivo **no existe y nunca existió** (`git log --all` sin
resultados). Sus 4 pruebas de notificaciones viven hoy en
`mis-pedidos.test.ts` (envío al llegar a `Listo`, pedido Pagado sin aviso,
fallo con reintento, pedido de mostrador sin aviso).

**Decision**: corregir la cita en la matriz hacia el archivo real
(`mis-pedidos.test.ts`, sección de notificaciones), sumar la nueva prueba
O-02 al mismo bloque (5 pruebas) y registrar el hallazgo como defecto de
documentación **D-04 — cerrado el 2026-11-03** (cita corregida + evidencia
re-ejecutada), en lugar de crear un archivo sólo para que coincida con el doc.

**Alternatives considered**:
- Crear `avisos.test.ts` moviendo las 4 pruebas: aceptaría un split artificial
  de un archivo que hoy comparte setup con mis pedidos → descartado.
- Ignorar la cita: dejaría la matriz sin evidencia verificable → descartado.

## R3 — Pruebas de 403 del rol cliente contra rutas internas

**Decision**: archivo nuevo `backend/tests/integration/permisos-cliente.test.ts`
con un cliente de prueba (`test-*@example.com`, JWT de rol `usuario`) que llama:

| Ruta | Guardia (app.ts / rutas) | Esperado |
|---|---|---|
| `GET /api/caja/pedidos/listos` | `use(requireAuth, requireRole('cajero'))` | 403 `prohibido` |
| `POST /api/caja/pedidos` | ídem | 403 (la guardia corre antes del body) |
| `POST /api/cocina/pedidos/:id/estado` | `requireRole('cocinero')` | 403 |
| `GET /api/admin/platillos` | `requireRole('administrador')` | 403 |
| `GET /api/usuarios` | `requireRole('administrador')` | 403 |
| cualquier ruta protegida sin cookie | `requireAuth` | 401 `no_autorizado` |

y verifica que el cuerpo sea siempre `{ error: { code, message } }`.

**Rationale**: los 403 actuales sólo prueban el rol equivocado *hacia otro rol*
(cajero→cocina, cocinero→caja…); falta el caso del **cliente** contra todas
las rutas internas (especificado en FR-001). Las guardias están a nivel de
router, así que ninguna ruta llega a su handler.

**Alternatives considered**: agregar los casos a los archivos de caja/cocina
(admin ya tiene 403 de no-admin): agrupa mal el escenario "rol cliente
completo" y repetiría el setup 3 veces → se prefiere un archivo dedicado.

## R4 — Formato de error sin trazas (FR-003)

**Decision**: archivo nuevo `backend/tests/unit/error.test.ts` que invoca
`errorHandler` directamente con: `ApiError` (403 `prohibido`), `ZodError`
(400 `validacion`), `ER_DUP_ENTRY` (409 `duplicado`) y un `Error` genérico con
stack (500 `interno`), exigiendo en todos los casos la forma exacta
`{ error: { code, message } }` y que la respuesta no contenga `stack`,
`at `, `node_modules` ni mensajes crudos de MySQL. Además, en la integración
(del R3 y de mis pedidos) se comprueba el sobre de error en respuestas reales.

**Rationale**: provocar un 500 real en integración obligaría a romper un
módulo de servicio con `vi.mock` parcial (frágil y acoplado a la ruta); el
manejador central (`src/middleware/error.ts`) es el único punto que redacta
las respuestas, y probarlo en unidad cubre exactamente la regla §15/FR-022.

**Alternatives considered**: `vi.mock` parcial de un servicio + ruta real →
cubre lo mismo con más acoplamiento; se descarta por frágil.

## R5 — Redirección por rol y estados de pantalla en frontend

**Decision**:

- `ProtectedRoute.test.tsx` ya prueba "sin sesión → /login" y "rol no
  permitido → Acceso denegado". Se agrega la variante del cliente: sesión de
  `cajero` sobre una ruta con `roles={['usuario']}` (y viceversa), verificando
  el texto de denegado **y** que el enlace "Volver a mi sección" apunta a la
  ruta propia (`RUTA_POR_ROL`), que es el mecanismo real de "vuelta al rol"
  del producto.
- `MenuPage.test.tsx` y `MisPedidosPage.test.tsx` **ya cubren** estado vacío y
  error con reintento (verificado: 1 prueba de vacío + 1 de error en cada
  uno); sólo se verifican al correr el gate y se documentan como evidencia.
- Total del carrito: `MenuPage` (stepper + barra) y `CheckoutBar` (conteo y
  total) ya tienen pruebas; se agrega el caso de **quitar** partida si no está
  cubierto, para completar "agregar/quitar → total correcto" (FR-006).

**Rationale**: la spec no puede inventar comportamiento (§27): el producto
muestra pantalla de "Acceso denegado" con enlace de vuelta, no una redirección
automática, así que la prueba documenta el comportamiento real. Los estados
vacíos ya existen: el sprint sólo aporta la evidencia y los huecos puntuales.

**Alternatives considered**: cambiar `ProtectedRoute` para redirigir
automáticamente → sería funcionalidad nueva fuera de alcance → descartado
(la spec FR-005 se ajusta al comportamiento existente, no al revés).

## R6 — Evidencia manual: checklist §19 y capturas

**Decision**:

- Capturas PNG en `docs/evidencias/cliente/` con nombres descriptivos del
  paso: `01-login.png`, `02-menu.png`, `03-carrito-stepper.png`,
  `04-confirmar-pedido.png`, `05-estado-anticipacion-10-min.png`,
  `06-mis-pedidos-listo.png` (flujo completo del alumno). Se toman con la app
  local (`backend` + `frontend`) usando las cuentas seed; nunca con `.env` a
  la vista ni datos de personas reales.
- Checklist respondido en `docs/checklist-usabilidad-cliente.md` (§19:
  Tailwind/shadcn, área táctil ≥44 px en steppers y CTA, responsiva,
  navegación sencilla, información clara), con casilla, resultado y
  referencia a la captura que lo respalda.

**Rationale**: el sprint exige evidencia auditable en el repo; los nombres
fijos por adelantado evitan capturas huérfanas y hacen referenciable la
evidencia desde la matriz.

**Alternatives considered**: sólo capturas sin checklist → no cubre §19;
checklist sin capturas → débil ante auditoría → se hacen ambos.

## R7 — Cierre de la matriz y del sprint

**Decision**: en `docs/Matriz_de_calidad.md`:

- RF-01 y RF-02 pasan de "Aprobado (con O-01)" a **Aprobado** con la
  evidencia re-ejecutada el 2026-11-03 (el gate verde del sprint la respalda).
- RF-04 queda **Aprobado** (5/5 casos) con O-02 **cerrado**: cita corregida al
  archivo real + nueva prueba del fallo del aviso (R1, R2).
- Nuevos defectos cerrados: D-04 (cita rota RF-04) y, si la evidencia manual
  descubre un hueco, se registra en la misma corrida.
- Se elimina el párrafo "Pendiente para el Sprint 7 (rol cliente): O-02".

**Rationale**: es el mecanismo de cierre ya usado en el Sprint 6 (D-01…O-01);
mantiene una sola matriz de calidad (decisión del roadmap).

**Alternatives considered**: segunda matriz por rol → rompe "una sola matriz"
→ descartado.

## R8 — CI y entorno de verificación

**Decision**: sin cambios de workflow. El cierre se verifica con
`node scripts/verify.mjs` en local y con el runner self-hosted
`cafeteria-itsh-win` (Node 20, `runner/.env` con credenciales fuera del repo).
El push de la rama `spec/009-qa-cliente` dispara el CI (disparadores
`spec/**`).

**Rationale**: la base del Sprint 6 ya está operativa; este sprint sólo
agrega pruebas que el gate existente ejecutará.

**Alternatives considered**: nueva job o workflow → innecesario → descartado.

## Unknowns resueltos

| Unknown del plan | Resuelto en |
|---|---|
| Cómo simular el fallo del aviso sin proveedor real | R1 |
| Evidencia verificable de RF-04 | R2, R7 |
| Cómo probar 403 de cliente sin duplicar setups | R3 |
| Cómo demostrar ausencia de trazas en un 500 | R4 |
| Qué comportamiento probar en "sesión de otro rol" | R5 |
| Formato y ubicación de la evidencia manual | R6 |
| Cómo queda la matriz al cerrar | R7 |
