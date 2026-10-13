# Cómo ejecutar los scripts de migración

Scripts SQL para crear y sembrar la base de datos del **Sistema de Pedidos Anticipados — Cafetería ITSH** en MySQL 8.0.

## Requisitos

- MySQL Server 8.0 instalado y el servicio `MySQL80` corriendo.
- Cliente `mysql` en el PATH (viene con el servidor, en `C:\Program Files\MySQL\MySQL Server 8.0\bin`).
- Base de datos `cafe_itsh` y usuario `cafe_admin` creados (ver abajo si aún no existen).

## Conexión

Los datos de acceso:

| Dato | Valor |
|------|-------|
| Servidor | `127.0.0.1:3306` |
| Base de datos | `cafe_itsh` |
| Usuario | `cafe_admin` |
| Contraseña | `cafeContra` |

## Paso previo: crear la base de datos y el usuario (una sola vez)

Conéctate como `root` y ejecuta:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE IF NOT EXISTS cafe_itsh
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

CREATE USER IF NOT EXISTS 'cafe_admin'@'localhost' IDENTIFIED BY 'cafeContra';
CREATE USER IF NOT EXISTS 'cafe_admin'@'%'         IDENTIFIED BY 'cafeContra';

GRANT ALL PRIVILEGES ON cafe_itsh.* TO 'cafe_admin'@'localhost';
GRANT ALL PRIVILEGES ON cafe_itsh.* TO 'cafe_admin'@'%';

FLUSH PRIVILEGES;
```

## Ejecutar los scripts (en orden)

**Importante:** ejecutar `001` antes que `002`. El `001` crea las tablas; el `002` inserta los datos base (roles, estados, transiciones, platillos y menú de ejemplo).

Siempre usa `--default-character-set=utf8mb4`: el contenido tiene acentos
("En preparación", "Gordita de chicharrón") y así se guardan correctamente.

### Opción A — desde el cliente mysql (funciona igual en PowerShell y CMD)

Conéctate **sin indicar la base de datos** (el `001` la crea y la selecciona
con `CREATE DATABASE IF NOT EXISTS ... ; USE ...`):

```bash
mysql -u cafe_admin -p -h 127.0.0.1 --default-character-set=utf8mb4
```

Dentro del cliente:

```sql
source docs/001_crear_esquema.sql;
source docs/002_seed_inicial.sql;
```

### Opción B — desde CMD

El `001` va **sin** base de datos al final; el `002` sí con `cafe_itsh`
(en la primera ejecución la BD todavía no existe):

```bash
mysql -u cafe_admin -p -h 127.0.0.1 --default-character-set=utf8mb4 < docs\001_crear_esquema.sql
mysql -u cafe_admin -p -h 127.0.0.1 --default-character-set=utf8mb4 cafe_itsh < docs\002_seed_inicial.sql
```

### Opción C — desde PowerShell

En PowerShell el operador `<` no redirige archivos y
`Get-Content ... | mysql` **estropea los acentos** (PowerShell convierte el
texto a la página de consola y MySQL lo guarda como `??`). Usa `cmd /c` para
que el archivo llegue tal cual:

```bash
cmd /c "mysql -u cafe_admin -p -h 127.0.0.1 --default-character-set=utf8mb4 < docs\001_crear_esquema.sql"
cmd /c "mysql -u cafe_admin -p -h 127.0.0.1 --default-character-set=utf8mb4 cafe_itsh < docs\002_seed_inicial.sql"
```

## Ejecutar con DBeaver

1. Abre DBeaver y crea una conexión **MySQL** con los datos de la tabla de arriba (host `127.0.0.1`, puerto `3306`, base `cafe_itsh`, usuario `cafe_admin`, contraseña `cafeContra`).
2. Abre el archivo `docs/001_crear_esquema.sql` en un editor SQL.
3. Selecciona toda la consulta y ejecuta (Ctrl+Enter o botón SQL → Execute SQL script).
4. Repite con `docs/002_seed_inicial.sql`.

## Verificar que todo quedó bien

```bash
mysql -u cafe_admin -p -h 127.0.0.1 -e "SHOW TABLES FROM cafe_itsh;"
```

Debe mostrar 11 tablas: `estado_pedido`, `menu_dia`, `notificacion`, `pago`, `pedido`, `pedido_detalle`, `pedido_estado_historial`, `platillo`, `rol`, `transicion_estado`, `usuario`.

Ver el menú de ejemplo del día:

```bash
mysql -u cafe_admin -p -h 127.0.0.1 --default-character-set=utf8mb4 -e "SELECT md.fecha, p.nombre, md.precio, md.especial FROM cafe_itsh.menu_dia md JOIN cafe_itsh.platillo p ON p.id = md.platillo_id ORDER BY p.nombre;"
```

Verificar los datos base insertados por el `002`:

```bash
mysql -u cafe_admin -p -h 127.0.0.1 --default-character-set=utf8mb4 -e "SELECT (SELECT COUNT(*) FROM cafe_itsh.rol) AS roles, (SELECT COUNT(*) FROM cafe_itsh.estado_pedido) AS estados, (SELECT COUNT(*) FROM cafe_itsh.transicion_estado) AS transiciones, (SELECT COUNT(*) FROM cafe_itsh.platillo) AS platillos, (SELECT COUNT(*) FROM cafe_itsh.menu_dia) AS menu;"
```

Debe dar: `roles = 4`, `estados = 6`, `transiciones = 8`, `platillos = 8`, `menu = 8`.

## Notas

- El `001` se ejecuta **sin indicar base de datos**: él mismo crea `cafe_itsh`
  si no existe y la selecciona con `USE cafe_itsh`.
- Los scripts usan `CREATE DATABASE IF NOT EXISTS` e `INSERT IGNORE`, por lo
  que el `002` es seguro de re-ejecutar (simplemente omite lo que ya existe;
  los conteos no cambian). Sin embargo, `001` usa `CREATE TABLE` normal: si
  las tablas ya existen, fallará con `Error 1050 (42S01): Table '...' already
  exists` (esto es esperado; no re-ejecutes `001` sobre una BD ya poblada sin
  antes limpiar).
- `INSERT IGNORE` funciona gracias a las claves únicas de `rol.nombre`,
  `platillo.nombre`, `estado_pedido.nombre`,
  `transicion_estado(desde_id, hacia_id)` y `menu_dia(fecha, platillo_id)`.
  Es el equivalente MySQL de `ON CONFLICT ... DO NOTHING` de PostgreSQL.
- `platillo.nombre` tiene clave única: un nombre repetido se considera error
  de captura en el catálogo.
- **Ojo con PowerShell**: no uses `Get-Content ... | mysql` ni `< archivo`;
  PowerShell re codifica el texto a la página de consola y los acentos quedan
  guardados como `??`. Usa `source` dentro del cliente o `cmd /c` (ver arriba).
  Siempre con `--default-character-set=utf8mb4`.
- Los campos `actualizado_en` de `usuario`, `platillo` y `pedido` se actualizan solos gracias a `ON UPDATE CURRENT_TIMESTAMP`; no se usan triggers.
- MySQL 8.0 valida las restricciones `CHECK` (precio ≥ 0, cantidad > 0, monto > 0, tipos de pedido/pago/notificación), por lo que datos inválidos se rechazan desde la base.
- El menú de ejemplo se inserta con la fecha actual (`CURRENT_DATE`). Para tener menú en otro día, ejecuta un `INSERT` manual en `menu_dia` con la fecha deseada.
- Para el backend, la variable de entorno será:
  `DATABASE_URL=mysql://cafe_admin:cafeContra@127.0.0.1:3306/cafe_itsh`
