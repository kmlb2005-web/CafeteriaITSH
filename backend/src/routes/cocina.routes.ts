import { Router } from 'express';
import { cambiarEstado, listar } from '../controllers/cocina.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

/**
 * Cocina (KDS): pedidos activos y avance de preparación — solo cocinero.
 * Montada en `/api/cocina` (US2, FR-017/FR-018).
 */
export const cocinaRoutes = Router();

cocinaRoutes.use(requireAuth, requireRole('cocinero'));

cocinaRoutes.get('/pedidos', asyncHandler(listar));
cocinaRoutes.post('/pedidos/:id/estado', asyncHandler(cambiarEstado));
