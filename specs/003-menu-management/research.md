# Research: Gestión de Menú (Sprint 2)

Decisiones técnicas tomadas al planificar; ninguna depende de investigación
externa nueva (se reutiliza lo probado en el Sprint 1).

## R1 — Esquema: sin migración nueva

`platillo` y `menu_dia` ya existen (creadas por `docs/001_crear_esquema.sql`
y registradas como **baseline** por `backend/scripts/migrate.mjs`). El Sprint 2
no necesita migraciones; `migrations/README.md` lo documenta. Cualquier ajuste
futuro de esquema sí iría en `migrations/NN_*.sql`.

## R2 — Precio vive en `menu_dia`, no en `platillo`

El catálogo (`platillo`) no tiene precio; el precio se asigna al agregar el
platillo a una fecha y queda congelado por día (`menu_dia.precio`, con
`CHECK precio >= 0`). Esto satisface "cambiar precio" (FR-006) sin tocar el
catálogo y conserva historial. Unicidad `(fecha, platillo_id)` impide duplicar
renglones.

## R3 — Upsert del menú con `INSERT … ON DUPLICATE KEY UPDATE`

Para el caso "dos administradores modifican el mismo precio casi al mismo
tiempo", la restricción única garantiza **una sola fila consistente**: la
última escritura gana y no puede haber dos precios concurrentes en paralelo.
Un solo endpoint `PUT` crea o actualiza el renglón del día (alta y edición
con el mismo camino → menos código, mismo resultado).

## R4 — Baja lógica del catálogo

No hay borrado físico (FK desde `menu_dia`). `platillo.activo = FALSE` retira
el platillo: la consulta del cliente lo excluye (edge case "elimina un
platillo publicado" → sin errores ni datos internos). La **indisponibilidad
del día** es distinta: `menu_dia.disponible = FALSE` → visible y marcado en la
consulta (SC-S2-02).

## R5 — Cambios visibles de inmediato sin caché intermedia

El endpoint del cliente consulta la BD en cada petición (sin caché de
aplicación); el frontend re-consulta al montar la pantalla. Con
`idx_menu_dia_fecha` la respuesta es directa → SC-S2-01 y SC-S2-03 se cumplen
sin infraestructura extra.

## R6 — Seed del menú de hoy (idempotente)

`docs/002_seed_inicial.sql` sembró el menú con `CURRENT_DATE` del día de la
corrida; para que toda demo arranque con menú cargado, `backend/src/db/seed.ts`
asegura renglones para `CURDATE()` con `INSERT IGNORE` usando los mismos 8
platillos y precios. Es idempotente: si el menú de hoy ya existe, no lo toca
(nunca pisa precios editados por el administrador).

## R7 — Seguridad y validación (reutilizado del Sprint 1)

`requireAuth` + `requireRole('administrador')` en todo `/api/admin/*`; zod en
todos los inputs (nombre ≥ 2, precio numérico 0–9999.99, fecha `YYYY-MM-DD`,
booleanos estrictos); mensajes de error claros sin internals (reglas §15).
