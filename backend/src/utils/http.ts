import type { NextFunction, Request, RequestHandler, Response } from 'express';

type Handler = (req: Request, res: Response, next: NextFunction) => unknown;

/**
 * Envuelve handlers async para que sus rechazos lleguen al middleware de
 * errores (compatible con Express 4 y 5).
 */
export function asyncHandler(fn: Handler): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}
