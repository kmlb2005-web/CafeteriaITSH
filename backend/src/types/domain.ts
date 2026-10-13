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

/** Partida de pedido: precio congelado al momento de crearlo (R4). */
export interface PartidaPedido {
  id: number;
  menu_dia_id: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

/** Pedido con su estado resuelto como nombre (`Pendiente`, `Pagado`, …). */
export interface Pedido {
  id: number;
  numero: string;
  tipo: 'anticipado' | 'mostrador';
  estado: string;
  total: number;
  /** `YYYY-MM-DDTHH:mm` (hora local) en pedidos anticipados. */
  fecha_recoleccion: string | null;
  creado_en: string;
  partidas: PartidaPedido[];
}

/** Pedido de la lista de entregas de caja (Sprint 4, US1.6). */
export interface PedidoOperativo extends Pedido {
  cliente_nombre: string | null;
}

/** Fila del KDS de cocina: sin precios, con su posición en la cola (R5/R6). */
export interface PedidoCocina {
  id: number;
  numero: string;
  tipo: 'anticipado' | 'mostrador';
  estado: string;
  cliente_nombre: string | null;
  /** `YYYY-MM-DDTHH:mm` (hora local) en pedidos anticipados. */
  fecha_recoleccion: string | null;
  creado_en: string;
  /** Posición en la cola de preparación (1 = llegó primero). */
  orden: number;
  partidas: { nombre: string; cantidad: number }[];
}

/** Fila de "mis pedidos": lista liviana con el aviso de listo (Sprint 5). */
export interface PedidoLista {
  id: number;
  numero: string;
  tipo: 'anticipado' | 'mostrador';
  estado: string;
  total: number;
  /** `YYYY-MM-DDTHH:mm` (hora local) en pedidos anticipados. */
  fecha_recoleccion: string | null;
  creado_en: string;
  /** true cuando el pedido está `Listo`: aviso in-app "Listo para recoger". */
  aviso_listo: boolean;
}

/** Pago 1:1 con el pedido; jamás incluye datos de tarjeta (SC-S3-04). */
export interface Pago {
  metodo: 'online' | 'efectivo';
  monto: number;
  /** `null` en cobros de mostrador: no hay pasarela (Sprint 4, R4). */
  referencia: string | null;
  estado: 'pendiente' | 'confirmado' | 'rechazado';
}

/** Ruta de inicio por rol (US1: redirección tras login). */
export const RUTA_POR_ROL: Record<Rol, string> = {
  administrador: '/admin',
  cajero: '/caja',
  cocinero: '/cocina',
  usuario: '/menu',
};
