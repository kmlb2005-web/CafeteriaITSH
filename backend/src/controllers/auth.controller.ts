import type { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import {
  iniciarSesion,
  obtenerUsuario,
  registrarCliente,
} from '../services/auth.service.js';
import { crearToken } from '../middleware/auth.js';
import { cookieSesion } from '../utils/cookies.js';

/** Esquemas de validación en servidor (FR-021). */
export const esquemaRegistro = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 letras.'),
  correo: z
    .string()
    .trim()
    .toLowerCase()
    .email('Ingresa un correo electrónico válido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

export const esquemaLogin = z.object({
  correo: z
    .string()
    .trim()
    .toLowerCase()
    .email('Ingresa un correo electrónico válido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
});

export async function registrar(req: Request, res: Response): Promise<void> {
  const datos = esquemaRegistro.parse(req.body);
  const usuario = await registrarCliente(datos);
  res.status(201).json(usuario);
}

export async function login(req: Request, res: Response): Promise<void> {
  const datos = esquemaLogin.parse(req.body);
  const usuario = await iniciarSesion(datos.correo, datos.password);
  const token = crearToken(usuario);
  res.setHeader(
    'Set-Cookie',
    cookieSesion(token, {
      maxAgeSegundos: env.JWT_EXPIRES_HOURS * 3600,
    }),
  );
  res.json(usuario);
}

export function logout(_req: Request, res: Response): void {
  res.setHeader('Set-Cookie', cookieSesion('', { maxAgeSegundos: 0 }));
  res.status(204).end();
}

export async function me(req: Request, res: Response): Promise<void> {
  const usuario = req.user ? await obtenerUsuario(req.user.id) : null;
  if (!usuario) {
    res.status(401).json({
      error: { code: 'no_autorizado', message: 'No hay sesión activa.' },
    });
    return;
  }
  res.json(usuario);
}
