# Data Model: Gestión de Menú (Sprint 2)

**Tablas existentes** (esquema baseline, `docs/001_crear_esquema.sql`).
**Sin tablas nuevas** en este sprint.

## `platillo` — catálogo de productos

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | INT PK AI | |
| `nombre` | VARCHAR(100) NOT NULL | **UNIQUE** (duplicado → 409) |
| `categoria` | VARCHAR(50) | p. ej. `Comida`, `Bebida` |
| `descripcion` | TEXT | opcional |
| `activo` | BOOLEAN DEFAULT TRUE | baja lógica (R4) |
| `creado_en` / `actualizado_en` | DATETIME | automáticos |

## `menu_dia` — menú del día (fecha ↔ platillo)

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | INT PK AI | id del renglón del menú (lo edita el admin) |
| `fecha` | DATE NOT NULL | INDEX `idx_menu_dia_fecha` |
| `platillo_id` | INT NOT NULL FK → `platillo.id` | |
| `precio` | NUMERIC(10,2) NOT NULL | `CHECK precio >= 0`; MXN con impuestos incluidos |
| `disponible` | BOOLEAN DEFAULT TRUE | `FALSE` = identificado como no disponible (SC-S2-02) |
| `especial` | BOOLEAN DEFAULT FALSE | especial del día |
| — | **UNIQUE (fecha, platillo_id)** | un solo renglón por platillo y fecha (R3) |

## Proyecciones

**Cliente — `GET /api/menu`** (solo `platillo.activo = TRUE`):

```text
ItemMenu { id, platillo_id, nombre, categoria, descripcion,
           precio, disponible, especial }
```

**Admin — `GET /api/admin/menu`** (incluye platillos inactivos, para
diagnóstico, marcados con `activo`):

```text
ItemMenuAdmin { id, platillo_id, nombre, categoria, precio,
                disponible, especial, activo }
```

**Catálogo — `GET /api/admin/platillos`**:

```text
Platillo { id, nombre, categoria, descripcion, activo }
```

## Reglas de negocio derivadas

- Agregar al menú = upsert del `(fecha, platillo_id)` (R3).
- Precio cambiado por el admin → visible al cliente en la siguiente consulta
  (SC-S2-01).
- `disponible = FALSE` → el cliente lo ve marcado y no seleccionable
  (FR-008 se valida de extremo a extremo en Sprint 3).
- `platillo.activo = FALSE` → desaparece de la consulta del cliente sin
  errores (edge case del spec).
- Fecha por defecto: fecha actual del servidor; acepta `?fecha=YYYY-MM-DD`
  para consultas/ediciones puntuales.
