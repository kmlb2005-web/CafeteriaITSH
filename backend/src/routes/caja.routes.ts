import { Router } from 'express';
import {
  capturar,
  cobrar,
  cambiarEstado,
  listarListos,
} from '../controllers/caja.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

/**
 * Mostrador: captura, cobro en efectivo y entrega/cancelación — solo cajero.
 * Montada en `/api/caja` (US1, FR-013/FR-015/FR-016).
 */
export const cajaRoutes = Router();

cajaRoutes.use(requireAuth, requireRole('cajero'));

cajaRoutes.post('/pedidos', asyncHandler(capturar));
cajaRoutes.get('/pedidos/listos', asyncHandler(listarListos));
cajaRoutes.post('/pedidos/:id/pago', asyncHandler(cobrar));
cajaRoutes.post('/pedidos/:id/estado', asyncHandler(cambiarEstado));
