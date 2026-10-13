import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  crearPlatillo,
  editarPlatillo,
  listarPlatillos,
} from '../services/platillos.service.js';
import {
  eliminarRenglon,
  fechaHoy,
  guardarRenglon,
  obtenerMenuAdmin,
} from '../services/menu.service.js';

/** Fecha `YYYY-MM-DD` con fecha real (no permite basura en la URL). */
export const esquemaFecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD.')
  .refine((f) => !Number.isNaN(Date.parse(f)), 'Fecha inválida.');

export const esquemaPlatilloCrear = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 letras.')
    .max(100, 'El nombre es demasiado largo.'),
  categoria: z.string().trim().max(50, 'La categoría es demasiado larga.').optional(),
  descripcion: z.string().trim().max(500, 'La descripción es demasiado larga.').optional(),
});

export const esquemaPlatilloEditar = z
  .object({
    nombre: esquemaPlatilloCrear.shape.nombre.optional(),
    categoria: esquemaPlatilloCrear.shape.categoria,
    descripcion: esquemaPlatilloCrear.shape.descripcion,
    activo: z.boolean().optional(),
  })
  .refine((datos) => Object.values(datos).some((v) => v !== undefined), {
    message: 'Indica al menos un campo para editar.',
  });

export const esquemaMenuGuardar = z.object({
  fecha: esquemaFecha,
  platillo_id: z.number().int().positive('Id de platillo inválido.'),
  precio: z
    .number({ message: 'Ingresa un precio válido.' })
    .min(0, 'El precio no puede ser negativo.')
    .max(9999.99, 'El precio es demasiado alto.'),
  disponible: z.boolean().default(true),
  especial: z.boolean().default(false),
});

const esquemaId = z.coerce.number().int().positive('Id inválido.');

export async function listar(_req: Request, res: Response): Promise<void> {
  res.json(await listarPlatillos());
}

export async function crear(req: Request, res: Response): Promise<void> {
  const datos = esquemaPlatilloCrear.parse(req.body);
  res.status(201).json(await crearPlatillo(datos));
}

export async function editar(req: Request, res: Response): Promise<void> {
  const id = esquemaId.parse(req.params['id']);
  const datos = esquemaPlatilloEditar.parse(req.body);
  res.json(await editarPlatillo(id, datos));
}

export async function listarMenu(req: Request, res: Response): Promise<void> {
  const raw = req.query['fecha'];
  const fecha = raw === undefined ? fechaHoy() : esquemaFecha.parse(raw);
  res.json(await obtenerMenuAdmin(fecha));
}

export async function guardarMenu(req: Request, res: Response): Promise<void> {
  const datos = esquemaMenuGuardar.parse(req.body);
  res.json(await guardarRenglon(datos));
}

export async function eliminarMenu(req: Request, res: Response): Promise<void> {
  const id = esquemaId.parse(req.params['id']);
  await eliminarRenglon(id);
  res.status(204).end();
}
