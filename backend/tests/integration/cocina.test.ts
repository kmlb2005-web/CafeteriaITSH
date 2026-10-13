import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { closePool, execute } from '../../src/db/pool.js';
import { env } from '../../src/config/env.js';
import { cobrar } from '../../src/services/pasarela.js';

// Adaptador de pago simulado: el pedido anticipado se paga en línea (R2)
vi.mock('../../src/services/pasarela.js', () => ({
  cobrar: vi.fn(),
}));
const cobrarMock = vi.mocked(cobrar);

const app = crearApp();
const marca = Date.now();
const NOMBRE = `test-cocina-${marca}`;
const EMAIL = `test-cocina-${marca}@example.com`;
const PASSWORD = 'Cliente123';

const pad = (n: number): string => String(n).padStart(2, '0');
const soloFecha = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const formatearLocal = (d: Date): string =>
  `${soloFecha(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

// El menú de prueba va en la fecha de la recolección (patrón de pedidos.test)
const HORA_OK = new Date(Date.now() + 45 * 60 * 1000);
const FECHA = soloFecha(HORA_OK);
const RECOLECCION = formatearLocal(HORA_OK);

let cookieAdmin = '';
let cookieCajero = '';
let cookieCocinero = '';
let cookieCliente = '';
let idPlatillo = 0;
let idMenu = 0;
let idAnticipado = 0; // Pagado en línea (anticipo)
let idMostrador = 0; // Pagado en efectivo (mostrador)
let idPendiente = 0; // Mostrador sin cobro: para saltos y cancelación

async function login(correo: string, password: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ correo, password });
  expect(res.status).toBe(200);
  const raw = res.headers['set-cookie'];
  const primera = Array.isArray(raw) ? raw[0] : raw;
  if (!primera) throw new Error('sin cookie');
  return primera.split(';')[0] ?? '';
}

function avanzar(pedidoId: number, estado: string, cookie = cookieCocinero) {
  return request(app)
    .post(`/api/cocina/pedidos/${pedidoId}/estado`)
    .set('Cookie', cookie)
    .send({ estado });
}

beforeAll(async () => {
  cookieAdmin = await login('admin@itsh.mx', env.SEED_ADMIN_PASSWORD);
  cookieCajero = await login('cajero@itsh.mx', env.SEED_CAJERO_PASSWORD);
  cookieCocinero = await login('cocinero@itsh.mx', env.SEED_COCINERO_PASSWORD);

  const reg = await request(app).post('/api/auth/register').send({
    nombre: 'Cliente Cocina',
    correo: EMAIL,
    password: PASSWORD,
  });
  expect(reg.status).toBe(201);
  cookieCliente = await login(EMAIL, PASSWORD);

  const platillo = await request(app)
    .post('/api/admin/platillos')
    .set('Cookie', cookieAdmin)
    .send({ nombre: NOMBRE, categoria: 'Comida' });
  expect(platillo.status).toBe(201);
  idPlatillo = platillo.body.id as number;

  const alMenu = await request(app)
    .put('/api/admin/menu')
    .set('Cookie', cookieAdmin)
    .send({ fecha: FECHA, platillo_id: idPlatillo, precio: 35 });
  expect(alMenu.status).toBe(200);

  const menu = await request(app)
    .get(`/api/admin/menu?fecha=${FECHA}`)
    .set('Cookie', cookieAdmin);
  const item = (
    menu.body.items as Array<{ id: number; platillo_id: number }>
  ).find((i) => i.platillo_id === idPlatillo);
  expect(item).toBeDefined();
  idMenu = item?.id ?? 0;

  // 1. Pedido anticipado pagado en línea (primero en llegar)
  cobrarMock.mockResolvedValue({ exitoso: true, referencia: 'REF-TEST-K1' });
  const anticipo = await request(app)
    .post('/api/pedidos')
    .set('Cookie', cookieCliente)
    .send({ items: [{ menu_dia_id: idMenu, cantidad: 1 }], fecha_recoleccion: RECOLECCION });
  expect(anticipo.status).toBe(201);
  idAnticipado = anticipo.body.id as number;
  const pagoAnticipo = await request(app)
    .post(`/api/pedidos/${idAnticipado}/pago`)
    .set('Cookie', cookieCliente)
    .send({});
  expect(pagoAnticipo.status).toBe(200);

  // 2. Pedido de mostrador cobrado en efectivo
  const mostrador = await request(app)
    .post('/api/caja/pedidos')
    .set('Cookie', cookieCajero)
    .send({
      cliente_nombre: 'Ana López',
      items: [{ menu_dia_id: idMenu, cantidad: 2 }],
    });
  expect(mostrador.status).toBe(201);
  idMostrador = mostrador.body.id as number;
  const pagoMostrador = await request(app)
    .post(`/api/caja/pedidos/${idMostrador}/pago`)
    .set('Cookie', cookieCajero);
  expect(pagoMostrador.status).toBe(200);

  // 3. Pedido de mostrador sin cobro (queda Pendiente)
  const pendiente = await request(app)
    .post('/api/caja/pedidos')
    .set('Cookie', cookieCajero)
    .send({ items: [{ menu_dia_id: idMenu, cantidad: 1 }] });
  expect(pendiente.status).toBe(201);
  idPendiente = pendiente.body.id as number;
});

beforeEach(() => {
  cobrarMock.mockReset();
  cobrarMock.mockResolvedValue({ exitoso: true, referencia: 'REF-TEST-K1' });
});

afterAll(async () => {
  const ids = [idAnticipado, idMostrador, idPendiente];
  await execute(`DELETE FROM pago WHERE pedido_id IN (${ids.map(() => '?').join(', ')})`, ids);
  await execute(`DELETE FROM pedido WHERE id IN (${ids.map(() => '?').join(', ')})`, ids);
  await execute('DELETE FROM usuario WHERE correo LIKE ?', ['test-%@example.com']);
  await execute('DELETE FROM menu_dia WHERE platillo_id = ?', [idPlatillo]);
  await execute('DELETE FROM platillo WHERE nombre = ?', [NOMBRE]);
  await closePool();
});

describe('GET /api/cocina/pedidos — KDS (US2.1, FR-017, SC-S4-03)', () => {
  it('lista ambos orígenes por llegada, solo activos y sin precios', async () => {
    const res = await request(app).get('/api/cocina/pedidos').set('Cookie', cookieCocinero);

    expect(res.status).toBe(200);
    const pedidos = res.body.pedidos as Array<Record<string, unknown>>;

    const anticipo = pedidos.find((p) => p.id === idAnticipado);
    const mostrador = pedidos.find((p) => p.id === idMostrador);
    expect(anticipo).toMatchObject({
      tipo: 'anticipado',
      estado: 'Pagado',
      cliente_nombre: null,
    });
    expect(mostrador).toMatchObject({
      tipo: 'mostrador',
      estado: 'Pagado',
      cliente_nombre: 'Ana López',
    });

    // Llega primero el anticipado y ambos tienen posición en la cola
    // (las posiciones exactas dependen de pedidos ajenos que haya en la BD)
    const iAnticipo = pedidos.findIndex((p) => p.id === idAnticipado);
    const iMostrador = pedidos.findIndex((p) => p.id === idMostrador);
    expect(iAnticipo).toBeGreaterThanOrEqual(0);
    expect(iMostrador).toBeGreaterThan(iAnticipo);
    expect(Number(anticipo?.orden)).toBeGreaterThan(0);
    expect(Number(anticipo?.orden)).toBeLessThan(Number(mostrador?.orden));

    // Sin cobro no va a cocina (SC del Sprint 3)
    expect(pedidos.some((p) => p.id === idPendiente)).toBe(false);

    // Proyección ligera: partidas sin precios (sondeo barato, R5)
    const partidas = anticipo?.['partidas'] as Array<Record<string, unknown>>;
    expect(partidas).toHaveLength(1);
    expect(partidas[0]).toMatchObject({ nombre: NOMBRE, cantidad: 1 });
    expect(partidas[0]).not.toHaveProperty('precio_unitario');
  });

  it('niega sin sesión (401) y a un rol distinto de cocinero (403)', async () => {
    const sin = await request(app).get('/api/cocina/pedidos');
    expect(sin.status).toBe(401);

    const cajero = await request(app).get('/api/cocina/pedidos').set('Cookie', cookieCajero);
    expect(cajero.status).toBe(403);
  });
});

describe('POST /api/cocina/pedidos/:id/estado — avance (US2.2, FR-018)', () => {
  it('inicia la preparación del pedido anticipado (200 → En preparación)', async () => {
    const res = await avanzar(idAnticipado, 'En preparación');
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('En preparación');
  });

  it('marca el pedido como Listo (200 → Listo)', async () => {
    const res = await avanzar(idAnticipado, 'Listo');
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('Listo');
  });

  it('rechaza un salto de estado Pendiente → Listo (409, SC-S4-04)', async () => {
    const res = await avanzar(idPendiente, 'Listo');

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('transicion_invalida');
    expect(res.body.error.message).toMatch(/no puede pasar directamente/);
  });

  it('rechaza avanzar un pedido Cancelado (409: terminal, SC-S4-04)', async () => {
    // La caja cancela el pedido pendiente (flujo real de mostrador)
    const cancelar = await request(app)
      .post(`/api/caja/pedidos/${idPendiente}/estado`)
      .set('Cookie', cookieCajero)
      .send({ estado: 'Cancelado' });
    expect(cancelar.status).toBe(200);

    const res = await avanzar(idPendiente, 'En preparación');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('transicion_invalida');
  });

  it('rechaza estados fuera del enum del cocinero (400)', async () => {
    const res = await avanzar(idMostrador, 'Entregado');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validacion');
  });

  it('devuelve 404 con id inexistente', async () => {
    const res = await avanzar(99999999, 'En preparación');
    expect(res.status).toBe(404);
  });
});
