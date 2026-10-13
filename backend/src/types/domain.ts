/** Tipos de dominio compartidos (Sprint 1). */

export const ROLES = [
  'administrador',
  'cajero',
  'cocinero',
  'usuario',
] as const;

export type Rol = (typeof ROLES)[number];

/** Usuario sin información sensible (nunca password_hash). */
export interface UsuarioPublico {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  activo: boolean;
}

/** Usuario autenticado presente en req.user. */
export type AuthUser = Omit<UsuarioPublico, 'activo'>;

/** Ruta de inicio por rol (US1: redirección tras login). */
export const RUTA_POR_ROL: Record<Rol, string> = {
  administrador: '/admin',
  cajero: '/caja',
  cocinero: '/cocina',
  usuario: '/menu',
};
