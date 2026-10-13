/** Roles del sistema y rutas por rol (espejo de backend/src/types/domain.ts). */
export type Rol = 'administrador' | 'cajero' | 'cocinero' | 'usuario'

export const RUTA_POR_ROL: Record<Rol, string> = {
  administrador: '/admin',
  cajero: '/caja',
  cocinero: '/cocina',
  usuario: '/menu',
}

export const ROL_ETIQUETA: Record<Rol, string> = {
  administrador: 'Administrador',
  cajero: 'Cajero',
  cocinero: 'Cocinero',
  usuario: 'Alumno / Docente',
}
