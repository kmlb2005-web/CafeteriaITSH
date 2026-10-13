/**
 * Carrito persistente del cliente (research.md R6).
 *
 * Se guarda en `localStorage` para no perder la selección si se cae la
 * conexión o el cliente cierra la página. Solo contiene datos de menú
 * (id, nombre, precio, cantidad) — nunca datos sensibles.
 */

export interface LineaCarrito {
  menu_dia_id: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

const CLAVE = 'carrito_v1';

export function leerCarrito(): LineaCarrito[] {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return [];
    const datos: unknown = JSON.parse(crudo);
    if (!Array.isArray(datos)) return [];
    return datos.filter(
      (l): l is LineaCarrito =>
        typeof l === 'object' &&
        l !== null &&
        typeof (l as LineaCarrito).menu_dia_id === 'number' &&
        typeof (l as LineaCarrito).nombre === 'string' &&
        typeof (l as LineaCarrito).precio === 'number' &&
        typeof (l as LineaCarrito).cantidad === 'number',
    );
  } catch {
    return [];
  }
}

export function guardarCarrito(lineas: LineaCarrito[]): void {
  localStorage.setItem(CLAVE, JSON.stringify(lineas));
}

export function agregarAlCarrito(linea: LineaCarrito): LineaCarrito[] {
  const lineas = leerCarrito();
  const existente = lineas.find((l) => l.menu_dia_id === linea.menu_dia_id);
  if (existente) {
    existente.cantidad = Math.min(99, existente.cantidad + linea.cantidad);
  } else {
    lineas.push({ ...linea, cantidad: Math.min(99, linea.cantidad) });
  }
  guardarCarrito(lineas);
  return lineas;
}

export function actualizarCantidad(
  menuDiaId: number,
  cantidad: number,
): LineaCarrito[] {
  const lineas = leerCarrito();
  const indice = lineas.findIndex((l) => l.menu_dia_id === menuDiaId);
  if (indice >= 0) {
    if (cantidad <= 0) {
      lineas.splice(indice, 1);
    } else {
      const linea = lineas[indice];
      if (linea) linea.cantidad = Math.min(99, cantidad);
    }
    guardarCarrito(lineas);
  }
  return lineas;
}

export function quitarDelCarrito(menuDiaId: number): LineaCarrito[] {
  const lineas = leerCarrito().filter((l) => l.menu_dia_id !== menuDiaId);
  guardarCarrito(lineas);
  return lineas;
}

export function vaciarCarrito(): void {
  localStorage.removeItem(CLAVE);
}

export function totalCarrito(lineas: LineaCarrito[]): number {
  return lineas.reduce((suma, l) => suma + l.precio * l.cantidad, 0);
}

export function unidadesCarrito(lineas: LineaCarrito[]): number {
  return lineas.reduce((suma, l) => suma + l.cantidad, 0);
}
