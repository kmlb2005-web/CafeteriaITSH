import type { RowDataPacket } from 'mysql2/promise';
import { execute, query } from '../db/pool.js';
import { ApiError } from '../middleware/error.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import type { Rol, UsuarioPublico } from '../types/domain.js';

interface UsuarioRow extends RowDataPacket {
  id: number;
  nombre: string;
  correo: string;
  password_hash: string;
  activo: number | boolean;
  rol: Rol;
}

/** Mensaje idéntico con cuenta existente o no (SC-S1-02). */
const MSJ_CREDENCIALES = 'Correo o contraseña incorrectos.';

const SELECT_USUARIO = `
  SELECT u.id, u.nombre, u.correo, u.password_hash, u.activo, r.nombre AS rol
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

/** Registro de clientes (alumno/docente — rol `usuario`, FR-005). */
export async function registrarCliente(datos: {
  nombre: string;
  correo: string;
  password: string;
}): Promise<UsuarioPublico> {
  const hash = await hashPassword(datos.password);
  let resultado;
  try {
    resultado = await execute(
      `INSERT INTO usuario (nombre, correo, password_hash, rol_id)
       SELECT ?, ?, ?, id FROM rol WHERE nombre = 'usuario'`,
      [datos.nombre, datos.correo, hash],
    );
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'ER_DUP_ENTRY') {
      throw new ApiError(
        409,
        'duplicado',
        'Ya existe una cuenta con ese correo.',
      );
    }
    throw err;
  }

  if (resultado.affectedRows === 0) {
    throw new ApiError(
      500,
      'configuracion',
      'No existe el rol de cliente; ejecuta el seed inicial.',
    );
  }

  const rows = await query<UsuarioRow>(
    `${SELECT_USUARIO} WHERE u.correo = ?`,
    [datos.correo],
  );
  const row = rows[0];
  if (!row) {
    throw new ApiError(500, 'interno', 'No se pudo crear la cuenta.');
  }
  return aPublico(row);
}

/** Inicio de sesión: credenciales válidas + cuenta activa (FR-001). */
export async function iniciarSesion(
  correo: string,
  password: string,
): Promise<UsuarioPublico> {
  const rows = await query<UsuarioRow>(
    `${SELECT_USUARIO} WHERE u.correo = ?`,
    [correo],
  );
  const row = rows[0];

  // Sin usuario → mismo mensaje que contraseña incorrecta (SC-S1-02)
  if (!row) throw new ApiError(401, 'no_autorizado', MSJ_CREDENCIALES);

  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) throw new ApiError(401, 'no_autorizado', MSJ_CREDENCIALES);

  // Baja lógica: solo después de validar la contraseña (US2.3)
  if (!row.activo) {
    throw new ApiError(
      403,
      'cuenta_deshabilitada',
      'La cuenta está deshabilitada. Contacta al administrador.',
    );
  }

  return aPublico(row);
}

/** Usuario por id (para me y para verificar sesiones vigentes). */
export async function obtenerUsuario(
  id: number,
): Promise<UsuarioPublico | null> {
  const rows = await query<UsuarioRow>(
    `${SELECT_USUARIO} WHERE u.id = ?`,
    [id],
  );
  const row = rows[0];
  return row ? aPublico(row) : null;
}
