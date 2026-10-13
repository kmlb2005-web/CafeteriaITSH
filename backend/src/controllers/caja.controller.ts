import type { Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../middleware/error.js';
import {
  cobrarEnMostrador,
  crearPedidoMostrador,
  listarPedidosListos,
  transicionarEstado,
} from '../services/pedidos.service.js';

/**
 * Mostrador (US1, FR-015…FR-018): captura, cobro en efectivo y
 * entrega/cancelación. El rol del cajero se asegura en la ruta.
 */

const esquemaCaptura = z.object({
  cliente_nombre: z
    .string()
    .trim()
    .max(100, 'El nombre del cliente es demasiado largo.')
    .optional(),
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
    .min(1, 'Agrega al menos un platillo al pedido.')
    .max(99, 'El pedido tiene demasiadas partidas.'),
});

/** El cajero solo puede entregar o cancelar (R2: destino limitado por rol). */
const esquemaEstado = z.object({
  estado: z.enum(['Entregado', 'Cancelado'], {
    message: 'El estado debe ser Entregado o Cancelado.',
  }),
});

const esquemaId = z.coerce.number().int().positive('Id inválido.');

function usuarioActual(req: Request): number {
  const id = req.user?.id;
  if (!id) {
    throw new ApiError(401, 'no_autorizado', 'Debes iniciar sesión para continuar.');
  }
  return id;
}

/** US1.1/US1.2: captura en pocos pasos; sin regla de 10 minutos (R3). */
export async function capturar(req: Request, res: Response): Promise<void> {
  const datos = esquemaCaptura.parse(req.body);
  const pedido = await crearPedidoMostrador({
    creadoPor: usuarioActual(req),
    clienteNombre: datos.cliente_nombre || undefined,
    items: datos.items,
  });
  res.status(201).json(pedido);
}

/** US1.3/US1.4: cobro en efectivo con transición a Pagado. */
export async function cobrar(req: Request, res: Response): Promise<void> {
  const id = esquemaId.parse(req.params['id']);
  res.json(
    await cobrarEnMostrador({ pedidoId: id, cajeroId: usuarioActual(req) }),
  );
}

/** US1.6: pedidos Listo listos para entregar. */
export async function listarListos(req: Request, res: Response): Promise<void> {
  res.json({ pedidos: await listarPedidosListos() });
}

/** US1.6/FR-013: entrega o cancelación con validación por datos. */
export async function cambiarEstado(req: Request, res: Response): Promise<void> {
  const id = esquemaId.parse(req.params['id']);
  const datos = esquemaEstado.parse(req.body);
  res.json(
    await transicionarEstado({
      pedidoId: id,
      hacia: datos.estado,
      cambiadoPor: usuarioActual(req),
    }),
  );
}
