import { Router } from 'express';
import { obtenerMenu } from '../controllers/menu.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

/** `GET /api/menu` — consulta del menú (cualquier sesión autenticada). */
export const menuRoutes = Router();

menuRoutes.get('/', requireAuth, asyncHandler(obtenerMenu));
