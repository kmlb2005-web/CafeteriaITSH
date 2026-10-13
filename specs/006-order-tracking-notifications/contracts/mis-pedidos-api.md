# API Contract: Seguimiento y Notificaciones (Sprint 5)

Base: `/api`. Sesión por cookie `httpOnly`. Errores con formato
`{ "error": { "code", "message" } }` (reglas §15).

## Módulo de seguimiento — solo rol `usuario` (401 sin sesión, 403 otro rol)

### `GET /api/pedidos` — mis pedidos (US1, FR-014)

Lista liviana con el estado vigente de cada pedido **propio**, ordenada por
más reciente. Efecto secundario: se asegura la notificación de los pedidos
`Listo` (crear si falta; reintentar si el último envío falló — research R4).

Response `200`:

```json
{
  "pedidos": [
    {
      "id": 45,
      "numero": "PED-261013-A1B2C3D4",
      "tipo": "anticipado",
      "estado": "Listo",
      "total": 70,
      "fecha_recoleccion": "2026-10-13T12:00",
      "creado_en": "2026-10-13T10:15:00.000Z",
      "aviso_listo": true
    }
  ]
}
```

`aviso_listo` es `true` cuando el estado es `Listo` (el aviso in-app de la
spec: "Listo para recoger"). Los pedidos de otros usuarios jamás aparecen
(SC-S5-03).

### `GET /api/pedidos/:id` — detalle (ya existente desde el Sprint 3)

Pedido completo propio con partidas (nombre, cantidad, precio congelado) y
total; ajeno → `404 no_encontrado`.

## Notificaciones (internas, sin endpoint nuevo)

- **Generación** (US2, FR-019): al confirmar una transición a `Listo` en
  `POST /api/cocina/pedidos/:id/estado`, el controller llama al módulo
  `notificaciones.service` que registra y envía el correo al cliente. Un
  fallo de envío deja la notificación `fallida` con `detalle_error` y **no**
  afecta el estado del pedido (el `Listo` queda visible).
- **Reintento**: ocurre al consultar `GET /api/pedidos` (máximo 3 intentos;
  auditoría append-only). No hay jobs de fondo ni colas.

Errores del flujo interno nunca se filtran al cliente: la lista responde
`200` con los estados correctos aunque el envío haya fallado.

## Sin cambios en otros módulos

`/api/caja`, `/api/cocina`, `/api/admin` y `/api/menu` quedan intactos; los
permisos existentes (401/403) se reutilizan tal cual.
