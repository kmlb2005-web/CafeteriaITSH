import type { RowDataPacket } from 'mysql2/promise';
import { execute, query } from '../db/pool.js';
import { ApiError } from '../middleware/error.js';
import type { ItemMenu, ItemMenuAdmin } from '../types/domain.js';

interface RenglonRow extends RowDataPacket {
  id: number;
  platillo_id: number;
  nombre: string;
  categoria: string | null;
  descripcion: string | null;
  precio: number;
  disponible: number | boolean;
  especial: number | boolean;
  activo?: number | boolean;
}

const SELECT_RENGLON = `
  SELECT m.id, m.platillo_id, p.nombre, p.categoria, p.descripcion,
         m.precio, m.disponible, m.especial, p.activo
  FROM menu_dia m
  JOIN platillo p ON p.id = m.platillo_id
`;

/** Fecha local en `YYYY-MM-DD` (default de las consultas de menú). */
export function fechaHoy(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

function aAdmin(row: RenglonRow): ItemMenuAdmin {
  return {
    id: row.id,
    platillo_id: row.platillo_id,
    nombre: row.nombre,
    categoria: row.categoria,
    descripcion: row.descripcion,
    precio: row.precio,
    disponible: Boolean(row.disponible),
    especial: Boolean(row.especial),
    activo: Boolean(row.activo),
  };
}

/** Menú del día — vista del administrador (incluye platillos inactivos). */
export async function obtenerMenuAdmin(
  fecha: string,
): Promise<{ fecha: string; items: ItemMenuAdmin[] }> {
  const rows = await query<RenglonRow>(
    `${SELECT_RENGLON} WHERE m.fecha = ? ORDER BY p.nombre`,
    [fecha],
  );
  return { fecha, items: rows.map(aAdmin) };
}

/** Menú del día — vista del cliente: solo platillos activos (R4, FR-009). */
export async function obtenerMenuCliente(
  fecha: string,
): Promise<{ fecha: string; items: ItemMenu[] }> {
  const rows = await query<RenglonRow>(
    `${SELECT_RENGLON} WHERE m.fecha = ? AND p.activo = TRUE ORDER BY p.nombre`,
    [fecha],
  );
  return {
    fecha,
    items: rows.map(({ activo: _activo, ...resto }) => ({
      ...resto,
      disponible: Boolean(resto.disponible),
      especial: Boolean(resto.especial),
    })),
  };
}

/**
 * Alta o edición del renglón del día (upsert por unicidad fecha+platillo,
 * R3): una sola fila consistente aunque dos admins editen a la vez.
 */
export async function guardarRenglon(datos: {
  fecha: string;
  platillo_id: number;
  precio: number;
  disponible: boolean;
  especial: boolean;
}): Promise<ItemMenu & { id: number }> {
  const existe = await query<RowDataPacket>(
    'SELECT id FROM platillo WHERE id = ?',
    [datos.platillo_id],
  );
  if (existe.length === 0) {
    throw new ApiError(404, 'no_encontrado', 'Platillo no encontrado.');
  }

  await execute(
    `INSERT INTO menu_dia (fecha, platillo_id, precio, disponible, especial)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       precio = VALUES(precio),
       disponible = VALUES(disponible),
       especial = VALUES(especial)`,
    [datos.fecha, datos.platillo_id, datos.precio, datos.disponible, datos.especial],
  );

  const rows = await query<RenglonRow>(
    `${SELECT_RENGLON} WHERE m.fecha = ? AND m.platillo_id = ?`,
    [datos.fecha, datos.platillo_id],
  );
  const row = rows[0];
  if (!row) {
    throw new ApiError(500, 'interno', 'No se pudo guardar el menú.');
  }
  const { activo: _activo, ...item } = aAdmin(row);
  return { ...item, disponible: Boolean(item.disponible), especial: Boolean(item.especial) };
}

/** Quita un renglón del menú de la fecha. */
export async function eliminarRenglon(id: number): Promise<void> {
  const result = await execute('DELETE FROM menu_dia WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    throw new ApiError(404, 'no_encontrado', 'Renglón de menú no encontrado.');
  }
}
