import type { RowDataPacket } from 'mysql2/promise';
import { execute, query } from '../db/pool.js';
import { ApiError } from '../middleware/error.js';
import { hashPassword } from '../utils/password.js';
import type { Rol, UsuarioPublico } from '../types/domain.js';

/** Roles que el administrador puede crear/editar (US2.1). */
export const ROLES_OPERATIVOS = ['cajero', 'cocinero'] as const;
export type RolOperativo = (typeof ROLES_OPERATIVOS)[number];

interface UsuarioRow extends RowDataPacket {
  id: number;
  nombre: string;
  correo: string;
  activo: number | boolean;
  rol: Rol;
}

const SELECT_USUARIO = `
  SELECT u.id, u.nombre, u.correo, u.activo, r.nombre AS rol
  FROM usuario u
  JOIN rol r ON r.id = u.rol_id
`;

function aPublico(row: UsuarioRow): UsuarioPublico {
  return {
    id: row.id,
    nombre: row.nombre,
    correo: row.correo,
    rol: row.rol,
    activo: Boolean(row.activo),
  };
}

/** Lista los usuarios operativos (cajeros y cocineros — US2.2). */
export async function listarOperativos(rol?: RolOperativo): Promise<UsuarioPublico[]> {
  const where = rol ? 'WHERE r.nombre = ?' : "WHERE r.nombre IN ('cajero', 'cocinero')";
  const params = rol ? [rol] : [];
  const rows = await query<UsuarioRow>(
    `${SELECT_USUARIO} ${where} ORDER BY r.nombre, u.nombre`,
    params,
  );
  return rows.map(aPublico);
}

/** Crea un usuario operativo con contraseña cifrada (US2.1). */
export async function crearOperativo(datos: {
  nombre: string;
  correo: string;
  password: string;
  rol: RolOperativo;
}): Promise<UsuarioPublico> {
  const hash = await hashPassword(datos.password);
  let resultado;
  try {
    resultado = await execute(
      'INSERT INTO usuario (nombre, correo, password_hash, rol_id) ' +
        'SELECT ?, ?, ?, id FROM rol WHERE nombre = ?',
      [datos.nombre, datos.correo, hash, datos.rol],
    );
  } catch (err) {
    if ((err as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new ApiError(409, 'duplicado', 'Ya existe una cuenta con ese correo.');
    }
    throw err;
  }
  if (resultado.affectedRows === 0) {
    throw new ApiError(500, 'configuracion', `No existe el rol ${datos.rol}; ejecuta el seed.`);
  }

  const rows = await query<UsuarioRow>(`${SELECT_USUARIO} WHERE u.correo = ?`, [
    datos.correo,
  ]);
  const row = rows[0];
  if (!row) throw new ApiError(500, 'interno', 'No se pudo crear el usuario.');
  return aPublico(row);
}

/** Edita nombre y/o correo de un usuario operativo (US2.2). */
export async function editarOperativo(
  id: number,
  datos: { nombre?: string; correo?: string },
): Promise<UsuarioPublico> {
  const campos: string[] = [];
  const params: unknown[] = [];
  if (datos.nombre !== undefined) {
    campos.push('nombre = ?');
    params.push(datos.nombre);
  }
  if (datos.correo !== undefined) {
    campos.push('correo = ?');
    params.push(datos.correo);
  }

  if (campos.length > 0) {
    try {
      const result = await execute(
        `UPDATE usuario SET ${campos.join(', ')} WHERE id = ?`,
        [...params, id],
      );
      if (result.affectedRows === 0) {
        throw new ApiError(404, 'no_encontrado', 'Usuario no encontrado.');
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if ((err as { code?: string }).code === 'ER_DUP_ENTRY') {
        throw new ApiError(409, 'duplicado', 'Ya existe una cuenta con ese correo.');
      }
      throw err;
    }
  }

  const rows = await query<UsuarioRow>(`${SELECT_USUARIO} WHERE u.id = ?`, [id]);
  const row = rows[0];
  if (!row) throw new ApiError(404, 'no_encontrado', 'Usuario no encontrado.');
  return aPublico(row);
}

/** Activa/desactiva un usuario (US2.3): su sesión vigente deja de servir. */
export async function cambiarEstado(
  id: number,
  activo: boolean,
): Promise<UsuarioPublico> {
  const result = await execute('UPDATE usuario SET activo = ? WHERE id = ?', [
    activo,
    id,
  ]);
  if (result.affectedRows === 0) {
    throw new ApiError(404, 'no_encontrado', 'Usuario no encontrado.');
  }
  const rows = await query<UsuarioRow>(`${SELECT_USUARIO} WHERE u.id = ?`, [id]);
  const row = rows[0];
  if (!row) throw new ApiError(404, 'no_encontrado', 'Usuario no encontrado.');
  return aPublico(row);
}
