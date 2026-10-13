-- ============================================================
-- 002_seed_inicial.sql
-- Datos base: roles, estados de pedido, transiciones válidas
-- y un menú de ejemplo para hoy.
-- Ejecutar DESPUÉS de 001_crear_esquema.sql
-- ============================================================

USE cafe_itsh;

-- Asegura que los textos con acentos se guarden correctamente
-- sin importar el cliente que ejecute el script.
SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- Roles
-- INSERT IGNORE: si el registro ya existe (clave única nombre),
-- se omite en lugar de fallar (equivalente a ON CONFLICT DO NOTHING)
-- ------------------------------------------------------------
INSERT IGNORE INTO rol (nombre) VALUES
  ('administrador'),
  ('cajero'),
  ('cocinero'),
  ('usuario');

-- ------------------------------------------------------------
-- Estados de pedido (orden = prioridad de avance)
-- ------------------------------------------------------------
INSERT IGNORE INTO estado_pedido (nombre, orden) VALUES
  ('Pendiente',       1),
  ('Pagado',          2),
  ('En preparación',  3),
  ('Listo',           4),
  ('Entregado',       5),
  ('Cancelado',       0);

-- ------------------------------------------------------------
-- Transiciones válidas del flujo principal + cancelaciones
--   Pendiente → Pagado → En preparación → Listo → Entregado
--   Cualquier estado pre-entrega puede ir a Cancelado
--   (excepto Entregado y Cancelado mismos)
-- ------------------------------------------------------------
INSERT IGNORE INTO transicion_estado (desde_id, hacia_id)
SELECT d.id, h.id
FROM estado_pedido d
JOIN estado_pedido h
WHERE (d.nombre = 'Pendiente'       AND h.nombre = 'Pagado')
   OR (d.nombre = 'Pagado'          AND h.nombre = 'En preparación')
   OR (d.nombre = 'En preparación'  AND h.nombre = 'Listo')
   OR (d.nombre = 'Listo'           AND h.nombre = 'Entregado')
   OR (d.nombre = 'Pendiente'       AND h.nombre = 'Cancelado')
   OR (d.nombre = 'Pagado'          AND h.nombre = 'Cancelado')
   OR (d.nombre = 'En preparación'  AND h.nombre = 'Cancelado')
   OR (d.nombre = 'Listo'           AND h.nombre = 'Cancelado');

-- ------------------------------------------------------------
-- Platillos de ejemplo (catálogo)
-- ------------------------------------------------------------
INSERT IGNORE INTO platillo (nombre, categoria, descripcion) VALUES
  ('Gordita de chicharrón',  'Comida',   'Gordita de maíz con chicharrón prensado'),
  ('Gordita de frijol',      'Comida',   'Gordita de maíz con frijoles refritos'),
  ('Quesadilla de queso',    'Comida',   'Tortilla de maíz con queso Oaxaca'),
  ('Torta de jamón',         'Comida',   'Torta con jamón, queso y aguacate'),
  ('Café de olla',           'Bebida',   'Café de olla con piloncillo y canela'),
  ('Jugo de naranja',        'Bebida',   'Jugo de naranja natural 500 ml'),
  ('Agua de horchata',       'Bebida',   'Agua fresca de horchata 500 ml'),
  ('Pan con huevo',          'Comida',   'Pan dulce con huevo revuelto');

-- ------------------------------------------------------------
-- Menú de hoy (ejemplo) — precios congelados al agregarlo
-- ------------------------------------------------------------
INSERT IGNORE INTO menu_dia (fecha, platillo_id, precio, disponible, especial)
SELECT
  CURRENT_DATE,
  p.id,
  CASE p.nombre
    WHEN 'Gordita de chicharrón' THEN 35.00
    WHEN 'Gordita de frijol'     THEN 30.00
    WHEN 'Quesadilla de queso'   THEN 25.00
    WHEN 'Torta de jamón'        THEN 45.00
    WHEN 'Café de olla'          THEN 20.00
    WHEN 'Jugo de naranja'       THEN 25.00
    WHEN 'Agua de horchata'      THEN 15.00
    WHEN 'Pan con huevo'         THEN 28.00
  END,
  TRUE,
  CASE WHEN p.nombre IN ('Gordita de chicharrón', 'Café de olla') THEN TRUE ELSE FALSE END
FROM platillo p
WHERE p.nombre IN (
  'Gordita de chicharrón',
  'Gordita de frijol',
  'Quesadilla de queso',
  'Torta de jamón',
  'Café de olla',
  'Jugo de naranja',
  'Agua de horchata',
  'Pan con huevo'
);
