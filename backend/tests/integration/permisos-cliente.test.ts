import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { closePool, execute, query } from '../../src/db/pool.js';

/**
 * Reglas de rol del cliente (spec 009, FR-001; contracts §2):
 * con JWT/sesión de rol `usuario` todas las rutas internas responden 403
 * `prohibido` antes de llegar a su handler, y sin sesión toda ruta protegida
 * responde 401 `no_autorizado`. Ninguna petición modifica datos.
 */
const app = crearApp();
const marca = Date.now();
const EMAIL_CLIENTE = `test-permisos-${marca}@example.com`;
const PASSWORD = 'Cliente123';

let cookieCliente = '';

async function login(correo: string, password: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ correo, password });
  expect(res.status).toBe(200);
  const raw = res.headers['set-cookie'];
  const primera = Array.isArray(raw) ? raw[0] : raw;
  if (!primera) throw new Error('sin cookie');
  return primera.split(';')[0] ?? '';
}

/** Exige el sobre de error exacto (contracts §1): una sola clave, dos dentro. */
function esperarSobre(res: request.Response, code: string, status: number): void {
  expect(res.status).toBe(status);
  expect(Object.keys(res.body)).toEqual(['error']);
  expect(Object.keys(res.body.error)).toEqual(['code', 'message']);
  expect(res.body.error.code).toBe(code);
  expect(typeof res.body.error.message).toBe('string');
  expect(res.body.error.message.length).toBeGreaterThan(0);
}

async function contarPedidos(): Promise<number> {
  const filas = await query<{ n: number }>('SELECT COUNT(*) AS n FROM pedido');
  return Number(filas[0]?.n ?? 0);
}

beforeAll(async () => {
  const reg = await request(app).post('/api/auth/register').send({
    nombre: 'Cliente Permisos',
    correo: EMAIL_CLIENTE,
    password: PASSWORD,
  });
  expect(reg.status).toBe(201);
  cookieCliente = await login(EMAIL_CLIENTE, PASSWORD);
});

afterAll(async () => {
  await execute('DELETE FROM usuario WHERE correo = ?', [EMAIL_CLIENTE]);
  await closePool();
});

describe('Rol cliente sin sesión (401)', () => {
  it('niega una ruta interna sin cookie con el sobre de error (FR-001)', async () => {
    const res = await request(app).get('/api/caja/pedidos/listos');
    esperarSobre(res, 'no_autorizado', 401);
  });
});

describe('Rol cliente contra rutas de caja, cocina y administración (403)', () => {
  const casos: Array<{ metodo: 'get' | 'post'; ruta: string; etiqueta: string }> = [
    { metodo: 'get', ruta: '/api/caja/pedidos/listos', etiqueta: 'listado de listos de caja' },
    { metodo: 'post', ruta: '/api/caja/pedidos', etiqueta: 'captura de pedido en caja' },
    {
      metodo: 'post',
      ruta: '/api/cocina/pedidos/1/estado',
      etiqueta: 'cambio de estado en cocina',
    },
    { metodo: 'get', ruta: '/api/admin/platillos', etiqueta: 'catálogo de admin' },
    { metodo: 'get', ruta: '/api/usuarios', etiqueta: 'directorio de usuarios' },
  ];

  it('responde 403 `prohibido` con el sobre de error en las 5 rutas (FR-001)', async () => {
    for (const caso of casos) {
      const peticion = request(app)[caso.metodo](caso.ruta).set('Cookie', cookieCliente);
      const res = caso.metodo === 'post' ? await peticion.send({}) : await peticion;
      esperarSobre(res, 'prohibido', 403);
    }
  });

  it('ninguna de esas peticiones modifica datos (contrato §2)', async () => {
    const antes = await contarPedidos();
    for (const caso of casos) {
      const peticion = request(app)[caso.metodo](caso.ruta).set('Cookie', cookieCliente);
      const res = caso.metodo === 'post' ? await peticion.send({}) : await peticion;
      expect(res.status).toBe(403);
    }
    expect(await contarPedidos()).toBe(antes);
  });
});
