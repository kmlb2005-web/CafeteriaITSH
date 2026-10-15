/**
 * Eventos del navegador que sincronizan la UI sin dependencias nuevas
 * (spec 007, T013): cuando una página cambia el estado de un pedido,
 * avisa al layout para refrescar el contador del badge/drawer.
 */
export const EVENTO_PEDIDOS_ACTUALIZADOS = 'pedidos:actualizados'
