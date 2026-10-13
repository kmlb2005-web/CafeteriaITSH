import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../db/pool.js';
import { ApiError } from './error.js';
import { parseCookies } from '../utils/cookies.js';
import type { Rol } from '../types/domain.js';
import type { UsuarioRowAuth } from '../services/auth.types.js';

/** Firma el JWT de sesión (research R1). */
export function crearToken(usuario: {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
}): string {
  return jwt.sign(
    { nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
    env.JWT_SECRET,
    { subject: String(usuario.id), expiresIn: `${env.JWT_EXPIRES_HOURS}h` },
  );
}

/**
 * Exige sesión válida: lee la cookie, verifica el JWT y comprueba en base de
 * datos que el usuario exista y esté activo (las bajas invalidan la sesión
 * vigente — US2.3).
 */
export const requireAuth: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies['token'];
    if (!token) {
      throw new ApiError(
        401,
        'no_autorizado',
        'Debes iniciar sesión para continuar.',
      );
    }

    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    } catch {
      throw new ApiError(
        401,
        'no_autorizado',
        'Tu sesión expiró o no es válida. Inicia sesión de nuevo.',
      );
    }

    const id = Number(payload.sub);
    const rows = await query<UsuarioRowAuth>(
      `SELECT u.id, u.nombre, u.correo, u.activo, r.nombre AS rol
       FROM usuario u JOIN rol r ON r.id = u.rol_id
       WHERE u.id = ?`,
      [id],
    );
    const row = rows[0];
    if (!row || !row.activo) {
      throw new ApiError(
        401,
        'no_autorizado',
        'Tu sesión ya no es válida. Inicia sesión de nuevo.',
      );
    }

    req.user = {
      id: row.id,
      nombre: row.nombre,
      correo: row.correo,
      rol: row.rol,
    };
    next();
  } catch (err) {
    next(err);
  }
};

/** Exige uno de los roles indicados (FR-003). */
export function requireRole(...roles: Rol[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(
        new ApiError(
          401,
          'no_autorizado',
          'Debes iniciar sesión para continuar.',
        ),
      );
      return;
    }
    if (!roles.includes(req.user.rol)) {
      next(
        new ApiError(
          403,
          'prohibido',
          'No tienes permiso para acceder a este recurso.',
        ),
      );
      return;
    }
    next();
  };
}
