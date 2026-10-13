import { Router } from 'express';
import {
  login,
  logout,
  me,
  registrar,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

export const authRoutes = Router();

authRoutes.post('/register', asyncHandler(registrar));
authRoutes.post('/login', asyncHandler(login));
authRoutes.post('/logout', logout);
authRoutes.get('/me', requireAuth, asyncHandler(me));
