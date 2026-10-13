import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

/** Error de API con código y mensaje apto para el usuario (reglas §15). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** 404 para rutas no encontradas. */
export function notFound(_req: Request, res: Response): void {
  res.status(404).json({
    error: { code: 'not_found', message: 'Recurso no encontrado.' },
  });
}

/** Manejador centralizado de errores: claro para el usuario, detallado en el
 *  servidor. Nunca expone trazas ni información interna (FR-022). */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'validacion',
        message: 'Datos inválidos: ' + err.issues.map((i) => i.message).join('; '),
      },
    });
    return;
  }

  // Clave duplicada de MySQL (correo único)
  const anyErr = err as { code?: string; errno?: number };
  if (anyErr?.code === 'ER_DUP_ENTRY' || anyErr?.errno === 1062) {
    res.status(409).json({
      error: {
        code: 'duplicado',
        message: 'Ya existe un registro con esos datos.',
      },
    });
    return;
  }

  // Resto: log en servidor, respuesta genérica al usuario
  console.error('[error]', err instanceof Error ? err.stack ?? err.message : err);
  res.status(500).json({
    error: {
      code: 'interno',
      message: 'Ocurrió un error interno. Inténtalo de nuevo.',
    },
  });
}
