import type { Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../middleware/error.js';
import {
  listarPedidosCocina,
  transicionarEstado,
} from '../services/pedidos.service.js';

/**
 * Cocina (US2, FR-017/FR-018): lista de pedidos activos y avance de
 * preparación. El rol del cocinero se asegura en la ruta.
 */

/** El cocinero solo prepara: destino limitado por rol (R2). */
const esquemaEstado = z.object({
  estado: z.enum(['En preparación', 'Listo'], {
    message: 'El estado debe ser En preparación o Listo.',
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

/** US2.1: pedidos activos de ambos orígenes, ordenados por llegada. */
export async function listar(req: Request, res: Response): Promise<void> {
  res.json({ pedidos: await listarPedidosCocina() });
}

/** US2.2: avance En preparación / Listo con validación del flujo. */
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
