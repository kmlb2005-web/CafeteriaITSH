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

/** Catálogo de platillos (tabla `platillo`). */
export interface Platillo {
  id: number;
  nombre: string;
  categoria: string | null;
  descripcion: string | null;
  activo: boolean;
}

/** Renglón del menú del día — proyección del cliente (FR-009). */
export interface ItemMenu {
  id: number;
  platillo_id: number;
  nombre: string;
  categoria: string | null;
  descripcion: string | null;
  precio: number;
  disponible: boolean;
  especial: boolean;
}

/** Renglón del menú — proyección del administrador (incluye `activo`). */
export interface ItemMenuAdmin extends ItemMenu {
  activo: boolean;
}

/** Ruta de inicio por rol (US1: redirección tras login). */
export const RUTA_POR_ROL: Record<Rol, string> = {
  administrador: '/admin',
  cajero: '/caja',
  cocinero: '/cocina',
  usuario: '/menu',
};
