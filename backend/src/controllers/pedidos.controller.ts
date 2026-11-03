import type { Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../middleware/error.js';
import {
  cancelarPedidoPropio,
  crearPedidoAnticipado,
  listarMisPedidos,
  obtenerPedido,
  registrarPago,
} from '../services/pedidos.service.js';
import { asegurarNotificacionListo } from '../services/notificaciones.service.js';

const esquemaCrear = z.object({
  items: z
    .array(
      z.object({
        menu_dia_id: z.number().int().positive('Partida inválida.'),
        cantidad: z
          .number({ message: 'La cantidad debe ser un número.' })
          .int('La cantidad debe ser un número entero.')
          .min(1, 'La cantidad debe ser al menos 1.')
          .max(99, 'La cantidad máxima por platillo es 99.'),
      }),
    )
    .min(1, 'Agrega al menos un platillo a tu pedido.')
    .max(99, 'Tu pedido tiene demasiadas partidas.'),
  fecha_recoleccion: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
      'La hora de recolección no es válida.',
    ),
});

const esquemaPago = z.object({
  simular_rechazo: z.boolean().optional().default(false),
});

const esquemaId = z.coerce.number().int().positive('Id inválido.');

function usuarioActual(req: Request): number {
  const id = req.user?.id;
  if (!id) {
    throw new ApiError(401, 'no_autorizado', 'Debes iniciar sesión para continuar.');
  }
  return id;
}

export async function crear(req: Request, res: Response): Promise<void> {
  const datos = esquemaCrear.parse(req.body);
  const pedido = await crearPedidoAnticipado({
    usuarioId: usuarioActual(req),
    items: datos.items,
    fechaRecoleccion: datos.fecha_recoleccion,
  });
  res.status(201).json(pedido);
}

export async function pagar(req: Request, res: Response): Promise<void> {
  const id = esquemaId.parse(req.params['id']);
  const datos = esquemaPago.parse(req.body ?? {});
  const resultado = await registrarPago({
    pedidoId: id,
    usuarioId: usuarioActual(req),
    simularRechazo: datos.simular_rechazo,
  });
  res.json(resultado);
}

export async function obtener(req: Request, res: Response): Promise<void> {
  const id = esquemaId.parse(req.params['id']);
  res.json(await obtenerPedido(id, usuarioActual(req)));
}

/**
 * Cancelación del propio pedido (spec 007 US3.5): solo el dueño y solo
 * mientras esté `Pendiente` (pago rechazado o sin pagar).
 */
export async function cancelar(req: Request, res: Response): Promise<void> {
  const id = esquemaId.parse(req.params['id']);
  const pedido = await cancelarPedidoPropio({
    pedidoId: id,
    usuarioId: usuarioActual(req),
  });
  res.json({ pedido });
}

/**
 * "Mis pedidos" (FR-014, Sprint 5): lista propia con el estado vigente.
 * Efecto secundario: se asegura la notificación de los pedidos `Listo`
 * (crear si falta, reintentar si el envío falló — research R4).
 */
export async function listar(req: Request, res: Response): Promise<void> {
  const usuarioId = usuarioActual(req);
  const pedidos = await listarMisPedidos(usuarioId);
  for (const pedido of pedidos) {
    if (pedido.aviso_listo) {
      await asegurarNotificacionListo(pedido.id);
    }
  }
  res.json({ pedidos });
}
