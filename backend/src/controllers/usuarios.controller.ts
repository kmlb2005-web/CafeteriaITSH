import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  ROLES_OPERATIVOS,
  cambiarEstado,
  crearOperativo,
  editarOperativo,
  listarOperativos,
} from '../services/usuarios.service.js';

const esquemaCrear = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 letras.'),
  correo: z
    .string()
    .trim()
    .toLowerCase()
    .email('Ingresa un correo electrónico válido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  rol: z.enum(ROLES_OPERATIVOS, {
    message: 'El rol debe ser cajero o cocinero.',
  }),
});

const esquemaEditar = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 letras.')
      .optional(),
    correo: z
      .string()
      .trim()
      .toLowerCase()
      .email('Ingresa un correo electrónico válido.')
      .optional(),
  })
  .refine((datos) => datos.nombre !== undefined || datos.correo !== undefined, {
    message: 'Indica al menos un campo para editar.',
  });

const esquemaEstado = z.object({
  activo: z.boolean({ message: 'activo debe ser true o false.' }),
});

const esquemaId = z.coerce.number().int().positive('Id inválido.');

export async function listar(req: Request, res: Response): Promise<void> {
  const rolQuery = req.query['rol'];
  const rol =
    typeof rolQuery === 'string'
      ? z.enum(ROLES_OPERATIVOS).parse(rolQuery)
      : undefined;
  res.json(await listarOperativos(rol));
}

export async function crear(req: Request, res: Response): Promise<void> {
  const datos = esquemaCrear.parse(req.body);
  res.status(201).json(await crearOperativo(datos));
}

export async function editar(req: Request, res: Response): Promise<void> {
  const id = esquemaId.parse(req.params['id']);
  const datos = esquemaEditar.parse(req.body);
  res.json(await editarOperativo(id, datos));
}

export async function estado(req: Request, res: Response): Promise<void> {
  const id = esquemaId.parse(req.params['id']);
  const datos = esquemaEstado.parse(req.body);
  res.json(await cambiarEstado(id, datos.activo));
}
