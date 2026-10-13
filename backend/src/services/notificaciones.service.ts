import { execute, query } from '../db/pool.js';
import type { RowDataPacket } from 'mysql2/promise';
import { enviarCorreo } from './correo.js';

/**
 * Módulo de notificaciones (FR-019, research R2/R4): único lugar que
 * conoce la tabla `notificacion`. Está deliberadamente separado de la
 * lógica de pedidos: NUNCA propaga errores ni revierte estados — si el
 * envío falla, el pedido queda `Listo` y visible en "mis pedidos", y el
 * sistema reintenta en la siguiente consulta del cliente.
 *
 * Modelo append-only: cada intento es una fila (`pendiente` → `enviada` o
 * `fallida`); los intentos de un pedido son el COUNT de sus filas (R1).
 */

/** Intentos máximos de envío por pedido antes de dejar la auditoría. */
const MAXIMO_INTENTOS = 3;

interface FilaPedidoNotificar extends RowDataPacket {
  pedido_id: number;
  numero: string;
  usuario_id: number | null;
  correo: string | null;
  estado: string;
}

interface FilaIntentos extends RowDataPacket {
  intentos: number;
}

/** Registra y envía el aviso de pedido listo. Idempotente y jamás lanza. */
export async function asegurarNotificacionListo(pedidoId: number): Promise<void> {
  try {
    const filas = await query<FilaPedidoNotificar>(
      `SELECT p.id AS pedido_id, p.numero, p.usuario_id, u.correo,
              e.nombre AS estado
       FROM pedido p
       JOIN estado_pedido e ON e.id = p.estado_id
       LEFT JOIN usuario u ON u.id = p.usuario_id
       WHERE p.id = ?`,
      [pedidoId],
    );
    const pedido = filas[0];

    // Sin cliente (mostrador) o pedido que no está Listo → nada que avisar
    if (!pedido || pedido.estado !== 'Listo' || !pedido.usuario_id || !pedido.correo) {
      return;
    }

    // Auditoría previa de este pedido: ¿cuántos intentos de aviso hay?
    const previas = await query<FilaIntentos>(
      `SELECT COUNT(*) AS intentos
       FROM notificacion
       WHERE pedido_id = ? AND tipo = 'pedido_listo'`,
      [pedidoId],
    );
    const intentos = Number(previas[0]?.intentos ?? 0);

    // Idempotente: si ya hay un envío exitoso, no se duplica el aviso
    const enviadas = await query<{ n: number }>(
      `SELECT COUNT(*) AS n FROM notificacion
       WHERE pedido_id = ? AND tipo = 'pedido_listo' AND estado_envio = 'enviada'`,
      [pedidoId],
    );
    if (Number(enviadas[0]?.n ?? 0) > 0) return;

    // Acotado: con el máximo de intentos alcanzados se conserva la auditoría
    if (intentos >= MAXIMO_INTENTOS) return;

    // Intento nuevo: fila pendiente que el adaptador lleva a enviada/fallida
    const alta = await execute(
      `INSERT INTO notificacion (pedido_id, tipo, canal, estado_envio)
       VALUES (?, 'pedido_listo', 'correo', 'pendiente')`,
      [pedidoId],
    );

    const resultado = await enviarCorreo({
      para: pedido.correo,
      asunto: `Tu pedido ${pedido.numero} está listo para recoger`,
      mensaje: `¡Hola! Tu pedido ${pedido.numero} de la cafetería ITSH ya está Listo. Pasa por el mostrador para recogerlo.`,
    });

    await execute(
      `UPDATE notificacion SET estado_envio = ?, detalle_error = ? WHERE id = ?`,
      [
        resultado.exitoso ? 'enviada' : 'fallida',
        resultado.exitoso ? null : resultado.detalle,
        alta.insertId,
      ],
    );
  } catch (err) {
    // FR-019: la notificación jamás afecta el flujo del pedido
    console.error(
      `[notificaciones] no se pudo notificar el pedido ${pedidoId}:`,
      err instanceof Error ? err.message : err,
    );
  }
}
