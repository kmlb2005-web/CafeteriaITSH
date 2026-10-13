import { Router } from 'express';
import {
  crear,
  editar,
  eliminarMenu,
  guardarMenu,
  listar,
  listarMenu,
} from '../controllers/admin-menu.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

/**
 * Gestión de menú y catálogo — solo administrador (FR-006, US1.5).
 * Montada en `/api/admin`.
 */
export const adminMenuRoutes = Router();

adminMenuRoutes.use(requireAuth, requireRole('administrador'));

adminMenuRoutes.get('/platillos', asyncHandler(listar));
adminMenuRoutes.post('/platillos', asyncHandler(crear));
adminMenuRoutes.patch('/platillos/:id', asyncHandler(editar));

adminMenuRoutes.get('/menu', asyncHandler(listarMenu));
adminMenuRoutes.put('/menu', asyncHandler(guardarMenu));
adminMenuRoutes.delete('/menu/:id', asyncHandler(eliminarMenu));
