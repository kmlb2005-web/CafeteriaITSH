import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { closePool, execute } from '../../src/db/pool.js';
import { env } from '../../src/config/env.js';

const app = crearApp();
const marca = Date.now();
const NOMBRE_A = `test-menu-a-${marca}`;
const NOMBRE_B = `test-menu-b-${marca}`;
const EMAIL_CLIENTE = `test-cliente-menu-${marca}@example.com`;
// fechas de prueba apartadas para no tocar el menú de hoy
const FECHA = '2099-06-02';
const FECHA_VACIA = '2099-12-31';

let cookieAdmin = '';
let cookieCliente = '';
let idA = 0;
let idB = 0;

async function login(correo: string, password: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ correo, password });
  expect(res.status).toBe(200);
  const raw = res.headers['set-cookie'];
  const primera = Array.isArray(raw) ? raw[0] : raw;
  if (!primera) throw new Error('sin cookie');
  return primera.split(';')[0] ?? '';
}

beforeAll(async () => {
  cookieAdmin = await login('admin@itsh.mx', env.SEED_ADMIN_PASSWORD);

  const cliente = await request(app).post('/api/auth/register').send({
    nombre: 'Cliente Menú',
    correo: EMAIL_CLIENTE,
    password: 'Cliente123',
  });
  expect(cliente.status).toBe(201);
  cookieCliente = await login(EMAIL_CLIENTE, 'Cliente123');

  const platilloA = await request(app)
    .post('/api/admin/platillos')
    .set('Cookie', cookieAdmin)
    .send({ nombre: NOMBRE_A, categoria: 'Comida', descripcion: 'Platillo A' });
  expect(platilloA.status).toBe(201);
  idA = platilloA.body.id as number;

  const platilloB = await request(app)
    .post('/api/admin/platillos')
    .set('Cookie', cookieAdmin)
    .send({ nombre: NOMBRE_B, categoria: 'Bebida' });
  expect(platilloB.status).toBe(201);
  idB = platilloB.body.id as number;

  const alMenu = await request(app)
    .put('/api/admin/menu')
    .set('Cookie', cookieAdmin)
    .send({ fecha: FECHA, platillo_id: idA, precio: 42.5, especial: true });
  expect(alMenu.status).toBe(200);
});

afterAll(async () => {
  await execute('DELETE FROM menu_dia WHERE fecha IN (?, ?)', [FECHA, FECHA_VACIA]);
  await execute('DELETE FROM usuario WHERE correo LIKE ?', ['test-%@example.com']);
  await execute('DELETE FROM platillo WHERE nombre IN (?, ?)', [NOMBRE_A, NOMBRE_B]);
  await closePool();
});

describe('GET /api/menu (US2)', () => {
  it('niega la consulta sin sesión (401)', async () => {
    const res = await request(app).get('/api/menu');
    expect(res.status).toBe(401);
  });

  it('devuelve platillos con precio, disponibilidad y especial (FR-009)', async () => {
    const res = await request(app)
      .get(`/api/menu?fecha=${FECHA}`)
      .set('Cookie', cookieCliente);

    expect(res.status).toBe(200);
    expect(res.body.fecha).toBe(FECHA);
    const items = res.body.items as Array<Record<string, unknown>>;
    const item = items.find((i) => i.platillo_id === idA);
    expect(item).toMatchObject({
      nombre: NOMBRE_A,
      categoria: 'Comida',
      descripcion: 'Platillo A',
      precio: 42.5,
      disponible: true,
      especial: true,
    });
    // proyección del cliente: sin columnas internas
    expect(item).not.toHaveProperty('activo');
  });

  it('refleja de inmediato el cambio de precio y disponibilidad (SC-S2-01/02)', async () => {
    const cambio = await request(app)
      .put('/api/admin/menu')
      .set('Cookie', cookieAdmin)
      .send({ fecha: FECHA, platillo_id: idA, precio: 55, disponible: false });
    expect(cambio.status).toBe(200);

    const res = await request(app)
      .get(`/api/menu?fecha=${FECHA}`)
      .set('Cookie', cookieCliente);
    const item = (res.body.items as Array<Record<string, unknown>>).find(
      (i) => i.platillo_id === idA,
    );
    expect(item).toMatchObject({ precio: 55, disponible: false });
  });

  it('excluye el platillo desactivado del catálogo sin errores (R4)', async () => {
    // B entra al menú y luego se desactiva el catálogo
    await request(app)
      .put('/api/admin/menu')
      .set('Cookie', cookieAdmin)
      .send({ fecha: FECHA, platillo_id: idB, precio: 30 });
    const off = await request(app)
      .patch(`/api/admin/platillos/${idB}`)
      .set('Cookie', cookieAdmin)
      .send({ activo: false });
    expect(off.status).toBe(200);

    const cliente = await request(app)
      .get(`/api/menu?fecha=${FECHA}`)
      .set('Cookie', cookieCliente);
    expect(cliente.status).toBe(200);
    expect(
      (cliente.body.items as Array<Record<string, unknown>>).some(
        (i) => i.platillo_id === idB,
      ),
    ).toBe(false);

    // el admin sí lo ve (con activo = false) para diagnóstico
    const admin = await request(app)
      .get(`/api/admin/menu?fecha=${FECHA}`)
      .set('Cookie', cookieAdmin);
    const itemB = (admin.body.items as Array<Record<string, unknown>>).find(
      (i) => i.platillo_id === idB,
    );
    expect(itemB).toMatchObject({ activo: false });
  });

  it('devuelve lista vacía cuando no hay menú (caso borde)', async () => {
    const res = await request(app)
      .get(`/api/menu?fecha=${FECHA_VACIA}`)
      .set('Cookie', cookieCliente);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('rechaza una fecha inválida (400)', async () => {
    const res = await request(app)
      .get('/api/menu?fecha=ayer')
      .set('Cookie', cookieCliente);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validacion');
  });
});
