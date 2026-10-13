import type { RowDataPacket } from 'mysql2/promise';
import { execute, query } from '../db/pool.js';
import { ApiError } from '../middleware/error.js';
import type { Platillo } from '../types/domain.js';

interface PlatilloRow extends RowDataPacket {
  id: number;
  nombre: string;
  categoria: string | null;
  descripcion: string | null;
  activo: number | boolean;
}

const SELECT_PLATILLO =
  'SELECT id, nombre, categoria, descripcion, activo FROM platillo';

function aPublico(row: PlatilloRow): Platillo {
  return {
    id: row.id,
    nombre: row.nombre,
    categoria: row.categoria,
    descripcion: row.descripcion,
    activo: Boolean(row.activo),
  };
}

/** Catálogo completo para el admin (FR-006). */
export async function listarPlatillos(): Promise<Platillo[]> {
  const rows = await query<PlatilloRow>(
    `${SELECT_PLATILLO} ORDER BY activo DESC, nombre`,
  );
  return rows.map(aPublico);
}

/** Crea un platillo del catálogo (nombre único). */
export async function crearPlatillo(datos: {
  nombre: string;
  categoria?: string;
  descripcion?: string;
}): Promise<Platillo> {
  let id: number;
  try {
    const result = await execute(
      'INSERT INTO platillo (nombre, categoria, descripcion) VALUES (?, ?, ?)',
      [datos.nombre, datos.categoria ?? null, datos.descripcion ?? null],
    );
    id = result.insertId;
  } catch (err) {
    if ((err as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new ApiError(
        409,
        'duplicado',
        'Ya existe un platillo con ese nombre.',
      );
    }
    throw err;
  }

  const rows = await query<PlatilloRow>(`${SELECT_PLATILLO} WHERE id = ?`, [id]);
  const row = rows[0];
  if (!row) throw new ApiError(500, 'interno', 'No se pudo crear el platillo.');
  return aPublico(row);
}

/** Edita campos del catálogo y activa/desactiva platillos (baja lógica R4). */
export async function editarPlatillo(
  id: number,
  datos: {
    nombre?: string;
    categoria?: string;
    descripcion?: string;
    activo?: boolean;
  },
): Promise<Platillo> {
  const campos: string[] = [];
  const params: unknown[] = [];
  if (datos.nombre !== undefined) {
    campos.push('nombre = ?');
    params.push(datos.nombre);
  }
  if (datos.categoria !== undefined) {
    campos.push('categoria = ?');
    params.push(datos.categoria || null);
  }
  if (datos.descripcion !== undefined) {
    campos.push('descripcion = ?');
    params.push(datos.descripcion || null);
  }
  if (datos.activo !== undefined) {
    campos.push('activo = ?');
    params.push(datos.activo);
  }

  if (campos.length > 0) {
    try {
      const result = await execute(
        `UPDATE platillo SET ${campos.join(', ')} WHERE id = ?`,
        [...params, id],
      );
      if (result.affectedRows === 0) {
        throw new ApiError(404, 'no_encontrado', 'Platillo no encontrado.');
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if ((err as { code?: string }).code === 'ER_DUP_ENTRY') {
        throw new ApiError(
          409,
          'duplicado',
          'Ya existe un platillo con ese nombre.',
        );
      }
      throw err;
    }
  }

  const rows = await query<PlatilloRow>(`${SELECT_PLATILLO} WHERE id = ?`, [id]);
  const row = rows[0];
  if (!row) throw new ApiError(404, 'no_encontrado', 'Platillo no encontrado.');
  return aPublico(row);
}
