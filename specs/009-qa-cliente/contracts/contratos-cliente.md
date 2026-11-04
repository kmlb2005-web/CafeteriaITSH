# Contracts — QA del Cliente (Sprint 7)

**Feature**: `specs/009-qa-cliente`

Contratos que las pruebas de este sprint verifican. No son interfaces nuevas:
formalizan el comportamiento existente para que el cumplimiento sea medible.

## 1. Contrato: respuestas de error (`errores-api.md`)

**Ámbito**: todas las respuestas fallidas del backend (reglas §15, FR-003).

- Forma exacta (sin claves extra):
  ```json
  { "error": { "code": "prohibido", "message": "No tienes permiso para acceder a este recurso." } }
  ```
- `code` ∈ { `no_autorizado`, `prohibido`, `validacion`, `duplicado`,
  `not_found`, `interno` }.
- `message` apta para el usuario, en español, sin datos internos.
- **Prohibido** en el cuerpo: `stack`, `at `, rutas de archivo,
  `node_modules`, mensajes crudos de MySQL (`ER_`, `SQL`, tablas) o variables
  de entorno. El detalle sólo se registra en el servidor (`console.error`).

**Verificación**: `backend/tests/unit/error.test.ts` (manejador central con
los 4 caminos) + comprobación del sobre en las respuestas reales de
`permisos-cliente.test.ts` y `mis-pedidos.test.ts`.

## 2. Contrato: permisos del rol cliente (`permisos-cliente.md`)

**Ámbito**: `GET/POST` autenticados con JWT de rol `usuario` (cliente).

| Petición | Esperado |
|---|---|
| `GET /api/caja/pedidos/listos` | 403 `prohibido` |
| `POST /api/caja/pedidos` | 403 `prohibido` (guardia antes del body) |
| `POST /api/cocina/pedidos/:id/estado` | 403 `prohibido` |
| `GET /api/admin/platillos` | 403 `prohibido` |
| `GET /api/usuarios` | 403 `prohibido` |
| cualquier ruta protegida sin cookie | 401 `no_autorizado` |

Invariante: ninguna de estas peticiones modifica datos (el rol cliente no
tiene escritura en caja, cocina ni administración).

## 3. Contrato: aviso de pedido listo sin bloquear (`aviso-listo.md`)

**Ámbito**: `POST /api/pedidos/:id/estado` hacia `Listo` con adaptador de
correo defectuoso (O-02).

- El cambio de estado responde **200**.
- El pedido consultable por el cliente queda en **`Listo`** con
  `aviso_listo: true`.
- El servicio de notificaciones **jamás lanza** hacia arriba (`try/catch`
  propio); un `throw` del adaptador queda en servidor.
- Si el adaptador sólo responde `{ exitoso: false }`, la fila queda `fallida`
  y se reintenta en la siguiente consulta (camino ya cubierto).

**Verificación**: `backend/tests/integration/mis-pedidos.test.ts`
(`correoMock.mockRejectedValue`).

## 4. Contrato: evidencia del rol cliente (`evidencia-cliente.md`)

**Ámbito**: `docs/` del repositorio.

- Capturas en `docs/evidencias/cliente/` con nombres
  `NN-descrito-de-paso.png` en el orden del flujo del alumno (login → menú →
  carrito → confirmación → regla de 10 minutos → mis pedidos).
- Checklist en `docs/checklist-usabilidad-cliente.md`: por cada ítem de §19,
  casilla de cumplimiento, nota y referencia a la captura.
- `docs/Matriz_de_calidad.md`: RF-01, RF-02 y RF-04 en **Aprobado**; O-02 y
  D-04 en **Cerrado** con fecha y solución; sin párrafos "pendiente" del
  rol cliente.
- Ningún archivo .env, token, cookie o credencial visible en evidencias.
