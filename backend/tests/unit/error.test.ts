import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ApiError, errorHandler, notFound } from '../../src/middleware/error.js';

/**
 * Contrato de respuestas fallidas (spec 009, FR-003; contracts §1 / reglas §15):
 * forma exacta `{ error: { code, message } }` y cero información interna,
 * incluso cuando el error trae stack de JavaScript o detalles de MySQL.
 */

interface RespuestaPrueba {
  codigo: number;
  cuerpo: unknown;
}

/** Response mínimo que captura status/json (el handler sólo usa esos dos). */
function respuesta(): { res: Response; obtener: () => RespuestaPrueba } {
  const estado: RespuestaPrueba = { codigo: 0, cuerpo: undefined };
  const res = {
    status(codigo: number) {
      estado.codigo = codigo;
      return res;
    },
    json(cuerpo: unknown) {
      estado.cuerpo = cuerpo;
      return res;
    },
  } as unknown as Response;
  return { res, obtener: () => estado };
}

const req = {} as Request;
const next = (() => undefined) as NextFunction;

function llamar(err: unknown): RespuestaPrueba {
  const { res, obtener } = respuesta();
  errorHandler(err, req, res, next);
  return obtener();
}

/** Sobre exacto: una sola clave `error` y dentro sólo `code` y `message`. */
function esperarSobre(resultado: RespuestaPrueba, codigo: number, code: string): void {
  expect(resultado.codigo).toBe(codigo);
  const cuerpo = resultado.cuerpo as Record<string, Record<string, unknown>>;
  expect(Object.keys(cuerpo)).toEqual(['error']);
  expect(Object.keys(cuerpo.error ?? {})).toEqual(['code', 'message']);
  expect(cuerpo.error?.code).toBe(code);
  expect(typeof cuerpo.error?.message).toBe('string');
}

beforeAll(() => {
  // El detalle de los errores 500/409 se registra sólo en servidor
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('errorHandler — sobre de error (contracts §1)', () => {
  it('ApiError responde con su status, code y message (403 prohibido)', () => {
    const r = llamar(
      new ApiError(403, 'prohibido', 'No tienes permiso para acceder a este recurso.'),
    );
    esperarSobre(r, 403, 'prohibido');
    expect((r.cuerpo as { error: { message: string } }).error.message).toBe(
      'No tienes permiso para acceder a este recurso.',
    );
  });

  it('ZodError responde 400 validacion con el detalle de los campos', () => {
    const prueba = z
      .object({ correo: z.string().min(8, 'Correo inválido.') })
      .safeParse({ correo: 'ab' });
    expect(prueba.success).toBe(false);
    if (prueba.success) throw new Error('se esperaba un error de validación');
    const r = llamar(prueba.error);
    esperarSobre(r, 400, 'validacion');
    expect((r.cuerpo as { error: { message: string } }).error.message).toContain(
      'Correo inválido.',
    );
  });

  it('clave duplicada de MySQL responde 409 duplicado sin exponer la tabla', () => {
    const r = llamar({ code: 'ER_DUP_ENTRY', errno: 1062, sqlMessage: 'Duplicate entry' });
    esperarSobre(r, 409, 'duplicado');
    const texto = JSON.stringify(r.cuerpo);
    expect(texto).not.toContain('Duplicate');
    expect(texto).not.toContain('ER_DUP_ENTRY');
  });

  it('error no controlado responde 500 interno con mensaje genérico (FR-003)', () => {
    const r = llamar(new Error('SELECT * FROM usuario WHERE password_hash = ... en /ruta/secreta'));
    esperarSobre(r, 500, 'interno');
    expect((r.cuerpo as { error: { message: string } }).error.message).toBe(
      'Ocurrió un error interno. Inténtalo de nuevo.',
    );
  });

  it('jamás filtra stack, código fuente ni SQL hacia el cliente', () => {
    vi.mocked(console.error).mockClear(); // sólo los registros de este caso
    const err = new Error('fallo interno');
    err.stack = `${err.name}: ${err.message}\n    at /archivo/servicio.ts:42:11\n    at node_modules/mysql2/lib/connection.js:1:1`;
    const r = llamar(err);
    const texto = JSON.stringify(r.cuerpo);
    expect(texto).not.toContain('at ');
    expect(texto).not.toContain('.ts:');
    expect(texto).not.toContain('node_modules');
    expect(texto).not.toContain('mysql2');
    expect(texto).not.toContain('fallo interno');
    // el stack sí fue registrado en el servidor (una sola vez)
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('notFound responde 404 not_found con el mismo sobre', () => {
    const { res, obtener } = respuesta();
    notFound(req, res);
    esperarSobre(obtener(), 404, 'not_found');
  });
});
