import type { Request, Response } from 'express';
import {
  fechaHoy,
  obtenerMenuCliente,
} from '../services/menu.service.js';
import { esquemaFecha } from './admin-menu.controller.js';

/** Consulta del menú del día para clientes (FR-009). */
export async function obtenerMenu(req: Request, res: Response): Promise<void> {
  const raw = req.query['fecha'];
  const fecha = raw === undefined ? fechaHoy() : esquemaFecha.parse(String(raw));
  res.json(await obtenerMenuCliente(fecha));
}
