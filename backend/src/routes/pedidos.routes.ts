import { Router } from 'express';
import { crear, listar, obtener, pagar } from '../controllers/pedidos.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

/**
 * Pedidos anticipados y su pago — solo clientes (rol `usuario`).
 * Montada en `/api/pedidos` (FR-010…FR-014; Sprint 5: lista "mis pedidos").
 */
export const pedidosRoutes = Router();

pedidosRoutes.use(requireAuth, requireRole('usuario'));

pedidosRoutes.get('/', asyncHandler(listar));
pedidosRoutes.post('/', asyncHandler(crear));
pedidosRoutes.get('/:id', asyncHandler(obtener));
pedidosRoutes.post('/:id/pago', asyncHandler(pagar));
