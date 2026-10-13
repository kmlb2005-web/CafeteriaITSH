import type { RowDataPacket } from 'mysql2/promise';
import type { Rol } from '../types/domain.js';

/** Fila mínima para verificar sesiones vigentes en el middleware. */
export interface UsuarioRowAuth extends RowDataPacket {
  id: number;
  nombre: string;
  correo: string;
  activo: number | boolean;
  rol: Rol;
}
