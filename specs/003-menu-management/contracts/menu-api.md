# Contrato: API de Menú (Sprint 2)

Todas las respuestas de error usan `{ "error": { "code", "message" } }`
(reglas §15). Todas requieren sesión (cookie `token`) salvo que se indique.

## Cliente

### `GET /api/menu?fecha=YYYY-MM-DD`

`fecha` opcional (por defecto: hoy). Requiere cualquier sesión autenticada.

**200**

```json
{
  "fecha": "2026-10-27",
  "items": [
    {
      "id": 1,
      "platillo_id": 3,
      "nombre": "Quesadilla de queso",
      "categoria": "Comida",
      "descripcion": "Tortilla de maíz con queso Oaxaca",
      "precio": 25.0,
      "disponible": true,
      "especial": false
    }
  ]
}
```

- `items` solo incluye platillos con `activo = TRUE` (R4).
- Sin menú para esa fecha → `items: []` (la UI muestra el aviso).
- **401** sin sesión.

## Administrador (`requireRole('administrador')`; 403 si otro rol)

### `GET /api/admin/platillos`

**200**: `[{ "id", "nombre", "categoria", "descripcion", "activo" }]`

### `POST /api/admin/platillos`

**Body**: `{ "nombre": string(≥2), "categoria"?: string, "descripcion"?: string }`

- **201** → objeto `Platillo`.
- **400** validación (`code: "validacion"`).
- **409** nombre duplicado.
- **403** rol no administrador.

### `PATCH /api/admin/platillos/:id`

**Body** (al menos un campo): `{ "nombre"?, "categoria"?, "descripcion"?, "activo"? }`

- **200** → `Platillo` actualizado.
- **404** id inexistente · **409** nombre duplicado · **400** validación.

### `GET /api/admin/menu?fecha=YYYY-MM-DD`

**200**: `{ "fecha": "…", "items": [ItemMenuAdmin] }` (incluye `activo`).

### `PUT /api/admin/menu`

**Body**: `{ "fecha": "YYYY-MM-DD", "platillo_id": number, "precio": number(0–9999.99), "disponible"?: boolean, "especial"?: boolean }`

Upsert: crea el renglón del día o actualiza precio/disponibilidad/especial.

- **200** → `{ "id", "fecha", "platillo_id", "precio", "disponible", "especial" }`
- **400** validación (precio negativo/cero no numérico, fecha inválida).
- **404** platillo inexistente.
- **409** nunca (upsert) — el duplicado se resuelve actualizando.

### `DELETE /api/admin/menu/:id`

Quita un renglón del menú de esa fecha.

- **204** sin cuerpo · **404** id inexistente.

## Casos de éxito cubiertos

| Criterio | Endpoint(s) |
|---|---|
| SC-S2-01 cambio visible de inmediato | `PUT /api/admin/menu` → `GET /api/menu` |
| SC-S2-02 no disponible identificado | `PUT` con `disponible:false` → `GET` |
| FR-006 CRUD admin | `platillos` + `PUT/DELETE menu` |
| FR-007 reflejo inmediato | sin caché entre BD y `GET /api/menu` |
| FR-009 consulta completa | `GET /api/menu` |
