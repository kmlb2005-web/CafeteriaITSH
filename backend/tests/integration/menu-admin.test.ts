import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { closePool, execute } from '../../src/db/pool.js';
import { env } from '../../src/config/env.js';

const app = crearApp();
const marca = Date.now();
const NOMBRE_PLATILLO = `test-platillo-${marca}`;
// fecha de prueba apartada para no tocar el menú de hoy
const FECHA = '2099-06-01';

let cookieAdmin = '';
let cookieCajero = '';
let idPlatillo = 0;

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
  cookieCajero = await login('cajero@itsh.mx', env.SEED_CAJERO_PASSWORD);
});

afterAll(async () => {
  await execute('DELETE FROM menu_dia WHERE fecha = ?', [FECHA]);
  await execute('DELETE FROM usuario WHERE correo LIKE ?', ['test-%@example.com']);
  await execute('DELETE FROM platillo WHERE nombre = ?', [NOMBRE_PLATILLO]);
  await closePool();
});

describe('POST/PATCH /api/admin/platillos (US1)', () => {
  it('crea un platillo del catálogo (201)', async () => {
    const res = await request(app)
      .post('/api/admin/platillos')
      .set('Cookie', cookieAdmin)
      .send({ nombre: NOMBRE_PLATILLO, categoria: 'Comida', descripcion: 'Para pruebas' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ nombre: NOMBRE_PLATILLO, activo: true });
    idPlatillo = res.body.id as number;
  });

  it('rechaza datos inválidos (400)', async () => {
    const res = await request(app)
      .post('/api/admin/platillos')
      .set('Cookie', cookieAdmin)
      .send({ nombre: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validacion');
  });

  it('rechaza nombre duplicado (409)', async () => {
    const res = await request(app)
      .post('/api/admin/platillos')
      .set('Cookie', cookieAdmin)
      .send({ nombre: NOMBRE_PLATILLO });
    expect(res.status).toBe(409);
  });

  it('edita el platillo y lo desactiva (200)', async () => {
    const res = await request(app)
      .patch(`/api/admin/platillos/${idPlatillo}`)
      .set('Cookie', cookieAdmin)
      .send({ descripcion: 'Editado en prueba', activo: false });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      descripcion: 'Editado en prueba',
      activo: false,
    });
  });

  it('devuelve 404 con id inexistente', async () => {
    const res = await request(app)
      .patch('/api/admin/platillos/99999999')
      .set('Cookie', cookieAdmin)
      .send({ nombre: 'Nadie' });
    expect(res.status).toBe(404);
  });
});

describe('PUT/GET/DELETE /api/admin/menu (US1)', () => {
  it('agrega el platillo al menú con precio (upsert 200)', async () => {
    const res = await request(app)
      .put('/api/admin/menu')
      .set('Cookie', cookieAdmin)
      .send({ fecha: FECHA, platillo_id: idPlatillo, precio: 42.5 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ precio: 42.5, disponible: true, especial: false });
  });

  it('actualizar el mismo renglón no duplica (consistencia, R3)', async () => {
    await request(app)
      .put('/api/admin/menu')
      .set('Cookie', cookieAdmin)
      .send({ fecha: FECHA, platillo_id: idPlatillo, precio: 50, disponible: false });

    const list = await request(app)
      .get(`/api/admin/menu?fecha=${FECHA}`)
      .set('Cookie', cookieAdmin);

    expect(list.status).toBe(200);
    const items = list.body.items as Array<Record<string, unknown>>;
    const delPlatillo = items.filter((i) => i.platillo_id === idPlatillo);
    expect(delPlatillo).toHaveLength(1);
    expect(delPlatillo[0]).toMatchObject({ precio: 50, disponible: false });
    expect(delPlatillo[0]).toHaveProperty('activo');
  });

  it('rechaza precio inválido (400)', async () => {
    const res = await request(app)
      .put('/api/admin/menu')
      .set('Cookie', cookieAdmin)
      .send({ fecha: FECHA, platillo_id: idPlatillo, precio: -5 });
    expect(res.status).toBe(400);
  });

  it('rechaza platillo inexistente (404)', async () => {
    const res = await request(app)
      .put('/api/admin/menu')
      .set('Cookie', cookieAdmin)
      .send({ fecha: FECHA, platillo_id: 99999999, precio: 30 });
    expect(res.status).toBe(404);
  });

  it('elimina el renglón del menú (204 y ya no aparece)', async () => {
    const list = await request(app)
      .get(`/api/admin/menu?fecha=${FECHA}`)
      .set('Cookie', cookieAdmin);
    const item = (list.body.items as Array<Record<string, unknown>>).find(
      (i) => i.platillo_id === idPlatillo,
    );
    expect(item).toBeDefined();

    const del = await request(app)
      .delete(`/api/admin/menu/${item?.['id']}`)
      .set('Cookie', cookieAdmin);
    expect(del.status).toBe(204);

    const tras = await request(app)
      .get(`/api/admin/menu?fecha=${FECHA}`)
      .set('Cookie', cookieAdmin);
    expect(
      (tras.body.items as Array<Record<string, unknown>>).some(
        (i) => i.platillo_id === idPlatillo,
      ),
    ).toBe(false);
  });
});

describe('Autorización /api/admin (FR-003, US1.5)', () => {
  it('niega sin sesión (401)', async () => {
    const res = await request(app).get('/api/admin/platillos');
    expect(res.status).toBe(401);
  });

  it('niega a un rol distinto de administrador (403)', async () => {
    const list = await request(app)
      .get('/api/admin/platillos')
      .set('Cookie', cookieCajero);
    expect(list.status).toBe(403);

    const put = await request(app)
      .put('/api/admin/menu')
      .set('Cookie', cookieCajero)
      .send({ fecha: FECHA, platillo_id: idPlatillo, precio: 10 });
    expect(put.status).toBe(403);
  });
});
