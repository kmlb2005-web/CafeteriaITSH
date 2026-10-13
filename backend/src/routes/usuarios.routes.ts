import { Router } from 'express';
import {
  crear,
  editar,
  estado,
  listar,
} from '../controllers/usuarios.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

/** Solo el administrador gestiona usuarios operativos (FR-003, US2). */
export const usuariosRoutes = Router();

usuariosRoutes.use(requireAuth, requireRole('administrador'));

usuariosRoutes.get('/', asyncHandler(listar));
usuariosRoutes.post('/', asyncHandler(crear));
usuariosRoutes.patch('/:id', asyncHandler(editar));
usuariosRoutes.patch('/:id/estado', asyncHandler(estado));
