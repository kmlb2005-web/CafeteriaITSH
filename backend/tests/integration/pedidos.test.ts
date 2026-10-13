import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { closePool, execute, query } from '../../src/db/pool.js';
import { env } from '../../src/config/env.js';
import { cobrar } from '../../src/services/pasarela.js';

// Adaptador de pago simulado: controlamos éxito/rechazo por test (R2)
vi.mock('../../src/services/pasarela.js', () => ({
  cobrar: vi.fn(),
}));
const cobrarMock = vi.mocked(cobrar);

const app = crearApp();
const marca = Date.now();
const NOMBRE_A = `test-pedidos-a-${marca}`;
const NOMBRE_B = `test-pedidos-b-${marca}`;
const EMAIL = `test-pedidos-${marca}@example.com`;
const EMAIL_2 = `test-pedidos-2-${marca}@example.com`;
const PASSWORD = 'Cliente123';

const pad = (n: number): string => String(n).padStart(2, '0');
const soloFecha = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const formatearLocal = (d: Date): string =>
  `${soloFecha(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

// Recogida válida: 45 min en el futuro; el menú de prueba va en SU fecha
// (así el test funciona aunque cruce la medianoche).
const HORA_OK = new Date(Date.now() + 45 * 60 * 1000);
const FECHA = soloFecha(HORA_OK);
const RECOLECCION = formatearLocal(HORA_OK);
const RECOLECCION_OTRO_DIA = `${soloFecha(
  new Date(HORA_OK.getTime() + 24 * 60 * 60 * 1000),
)}T09:00`;
const RECOLECCION_MUY_CERCA = formatearLocal(
  new Date(Date.now() + 5 * 60 * 1000),
);

let cookieAdmin = '';
let cookieCliente = '';
let cookieCliente2 = '';
let cookieCajero = '';
let idA = 0;
let idB = 0;
let idMenuA = 0;
let idPedido = 0;
let folio = '';
let totalPedido = 0;
let idPedido2 = 0;

async function login(correo: string, password: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ correo, password });
  expect(res.status).toBe(200);
  const raw = res.headers['set-cookie'];
  const primera = Array.isArray(raw) ? raw[0] : raw;
  if (!primera) throw new Error('sin cookie');
  return primera.split(';')[0] ?? '';
}

async function registrarCliente(correo: string): Promise<string> {
  const res = await request(app).post('/api/auth/register').send({
    nombre: 'Cliente Pedidos',
    correo,
    password: PASSWORD,
  });
  expect(res.status).toBe(201);
  return login(correo, PASSWORD);
}

function crearPedido(cookie: string, extra: Record<string, unknown> = {}) {
  return request(app)
    .post('/api/pedidos')
    .set('Cookie', cookie)
    .send({
      items: [{ menu_dia_id: idMenuA, cantidad: 2 }],
      fecha_recoleccion: RECOLECCION,
      ...extra,
    });
}

beforeAll(async () => {
  cookieAdmin = await login('admin@itsh.mx', env.SEED_ADMIN_PASSWORD);
  cookieCajero = await login('cajero@itsh.mx', env.SEED_CAJERO_PASSWORD);
  cookieCliente = await registrarCliente(EMAIL);
  cookieCliente2 = await registrarCliente(EMAIL_2);

  const a = await request(app)
    .post('/api/admin/platillos')
    .set('Cookie', cookieAdmin)
    .send({ nombre: NOMBRE_A, categoria: 'Comida' });
  expect(a.status).toBe(201);
  idA = a.body.id as number;

  const b = await request(app)
    .post('/api/admin/platillos')
    .set('Cookie', cookieAdmin)
    .send({ nombre: NOMBRE_B, categoria: 'Comida' });
  expect(b.status).toBe(201);
  idB = b.body.id as number;

  const alMenu = await request(app)
    .put('/api/admin/menu')
    .set('Cookie', cookieAdmin)
    .send({ fecha: FECHA, platillo_id: idA, precio: 35 });
  expect(alMenu.status).toBe(200);

  // B entra al menú y queda marcado como no disponible
  await request(app)
    .put('/api/admin/menu')
    .set('Cookie', cookieAdmin)
    .send({ fecha: FECHA, platillo_id: idB, precio: 20, disponible: false });

  const menu = await request(app)
    .get(`/api/admin/menu?fecha=${FECHA}`)
    .set('Cookie', cookieAdmin);
  const itemA = (menu.body.items as Array<{ id: number; platillo_id: number }>).find(
    (i) => i.platillo_id === idA,
  );
  expect(itemA).toBeDefined();
  idMenuA = itemA?.id ?? 0;
});

beforeEach(() => {
  cobrarMock.mockReset();
  cobrarMock.mockResolvedValue({ exitoso: true, referencia: 'REF-TEST-0001' });
});

afterAll(async () => {
  const usuario = `(SELECT id FROM usuario WHERE correo = ?)`;
  await execute(
    `DELETE FROM pago WHERE pedido_id IN (SELECT id FROM pedido WHERE usuario_id = ${usuario})`,
    [EMAIL],
  );
  await execute(`DELETE FROM pedido WHERE usuario_id = ${usuario}`, [EMAIL]);
  await execute('DELETE FROM usuario WHERE correo IN (?, ?)', [EMAIL, EMAIL_2]);
  await execute('DELETE FROM menu_dia WHERE fecha = ? AND platillo_id IN (?, ?)', [
    FECHA,
    idA,
    idB,
  ]);
  await execute('DELETE FROM platillo WHERE nombre IN (?, ?)', [NOMBRE_A, NOMBRE_B]);
  await closePool();
});

describe('POST /api/pedidos — creación anticipada (US1, FR-010/FR-011)', () => {
  it('crea el pedido con folio, estado Pendiente, total y partidas (201)', async () => {
    const res = await crearPedido(cookieCliente);

    expect(res.status).toBe(201);
    expect(res.body.numero).toMatch(/^PED-\d{6}-[0-9A-F]{8}$/);
    expect(res.body).toMatchObject({
      tipo: 'anticipado',
      estado: 'Pendiente',
      fecha_recoleccion: RECOLECCION,
    });
    expect(res.body.partidas).toHaveLength(1);
    expect(res.body.partidas[0]).toMatchObject({
      nombre: NOMBRE_A,
      cantidad: 2,
      precio_unitario: 35,
      subtotal: 70,
    });
    expect(res.body.total).toBe(70);
    folio = res.body.numero as string;
    idPedido = res.body.id as number;
    totalPedido = res.body.total as number;
  });

  it('rechaza menos de 10 minutos de anticipación con mensaje claro (400)', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .set('Cookie', cookieCliente)
      .send({
        items: [{ menu_dia_id: idMenuA, cantidad: 1 }],
        fecha_recoleccion: RECOLECCION_MUY_CERCA,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('anticipacion_insuficiente');
    expect(res.body.error.message).toMatch(/10 minutos/);
  });

  it('rechaza recolección en un día distinto del menú (400)', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .set('Cookie', cookieCliente)
      .send({
        items: [{ menu_dia_id: idMenuA, cantidad: 1 }],
        fecha_recoleccion: RECOLECCION_OTRO_DIA,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('fecha_invalida');
  });

  it('rechaza un platillo marcado como no disponible (409)', async () => {
    const menu = await request(app)
      .get(`/api/admin/menu?fecha=${FECHA}`)
      .set('Cookie', cookieAdmin);
    const itemB = (
      menu.body.items as Array<{ id: number; platillo_id: number }>
    ).find((i) => i.platillo_id === idB);

    const res = await request(app)
      .post('/api/pedidos')
      .set('Cookie', cookieCliente)
      .send({
        items: [{ menu_dia_id: itemB?.id, cantidad: 1 }],
        fecha_recoleccion: RECOLECCION,
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('no_disponible');
    expect(res.body.error.message).toMatch(/disponible/);
  });

  it('rechaza un pedido sin partidas (400)', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .set('Cookie', cookieCliente)
      .send({ items: [], fecha_recoleccion: RECOLECCION });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validacion');
  });
});

describe('POST /api/pedidos/:id/pago — cobro (US1, FR-012/FR-013)', () => {
  it('confirmar el pago deja el pedido Pagado con referencia y monto correctos (200)', async () => {
    const res = await request(app)
      .post(`/api/pedidos/${idPedido}/pago`)
      .set('Cookie', cookieCliente)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.pedido).toMatchObject({
      id: idPedido,
      numero: folio,
      estado: 'Pagado',
      total: totalPedido,
    });
    expect(res.body.pago).toMatchObject({
      metodo: 'online',
      monto: totalPedido,
      estado: 'confirmado',
    });
    expect(res.body.pago.referencia).toMatch(/^REF-/);
    // SC-S3-04: nada de datos de tarjeta en la respuesta
    expect(JSON.stringify(res.body)).not.toMatch(/tarjeta|cvv/i);

    // pago en BD: monto = total, un solo renglón
    const pagos = await query<{ estado: string; monto: number; metodo: string }>(
      'SELECT estado, monto, metodo FROM pago WHERE pedido_id = ?',
      [idPedido],
    );
    expect(pagos).toHaveLength(1);
    expect(pagos[0]).toMatchObject({ estado: 'confirmado', monto: totalPedido, metodo: 'online' });
  });

  it('la consulta refleja el estado Pagado (US2.1)', async () => {
    const res = await request(app)
      .get(`/api/pedidos/${idPedido}`)
      .set('Cookie', cookieCliente);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ numero: folio, estado: 'Pagado', total: totalPedido });
    expect(res.body.partidas).toHaveLength(1);
    expect(res.body.partidas[0].nombre).toBe(NOMBRE_A);
  });

  it('un segundo pago del mismo pedido se rechaza (409, sin doble cobro)', async () => {
    const res = await request(app)
      .post(`/api/pedidos/${idPedido}/pago`)
      .set('Cookie', cookieCliente)
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ya_pagado');
    const pagos = await query<{ n: number }>(
      'SELECT COUNT(*) AS n FROM pago WHERE pedido_id = ?',
      [idPedido],
    );
    expect(pagos[0]?.n).toBe(1);
  });

  it('pago rechazado: 402, el pedido sigue Pendiente y el intento queda registrado', async () => {
    const creacion = await crearPedido(cookieCliente, {
      items: [{ menu_dia_id: idMenuA, cantidad: 1 }],
    });
    expect(creacion.status).toBe(201);
    idPedido2 = creacion.body.id as number;

    cobrarMock.mockResolvedValueOnce({ exitoso: false, referencia: 'REF-RECHAZADA' });

    const res = await request(app)
      .post(`/api/pedidos/${idPedido2}/pago`)
      .set('Cookie', cookieCliente)
      .send({});

    expect(res.status).toBe(402);
    expect(res.body.error.code).toBe('pago_rechazado');
    expect(res.body.error.message).toMatch(/reintentar/i);

    const consulta = await request(app)
      .get(`/api/pedidos/${idPedido2}`)
      .set('Cookie', cookieCliente);
    expect(consulta.body.estado).toBe('Pendiente');

    const pagos = await query<{ estado: string }>(
      'SELECT estado FROM pago WHERE pedido_id = ?',
      [idPedido2],
    );
    expect(pagos[0]?.estado).toBe('rechazado');
  });

  it('reintentar tras el rechazo confirma el pago sin duplicarlo (SC-S3-03)', async () => {
    const res = await request(app)
      .post(`/api/pedidos/${idPedido2}/pago`)
      .set('Cookie', cookieCliente)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.pedido.estado).toBe('Pagado');

    const pagos = await query<{ estado: string }>(
      'SELECT estado FROM pago WHERE pedido_id = ?',
      [idPedido2],
    );
    expect(pagos).toHaveLength(1);
    expect(pagos[0]?.estado).toBe('confirmado');
  });
});

describe('Autorización y aislamiento (US1.5, US2.2)', () => {
  it('otro cliente no puede consultar el pedido (404)', async () => {
    const res = await request(app)
      .get(`/api/pedidos/${idPedido}`)
      .set('Cookie', cookieCliente2);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('no_encontrado');
  });

  it('un rol distinto de cliente no puede crear pedidos (403)', async () => {
    const res = await crearPedido(cookieCajero);
    expect(res.status).toBe(403);
  });

  it('sin sesión no hay creación (401)', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .send({ items: [{ menu_dia_id: idMenuA, cantidad: 1 }], fecha_recoleccion: RECOLECCION });
    expect(res.status).toBe(401);
  });
});
