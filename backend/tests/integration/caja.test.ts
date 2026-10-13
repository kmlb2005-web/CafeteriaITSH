import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { closePool, execute } from '../../src/db/pool.js';
import { env } from '../../src/config/env.js';

const app = crearApp();
const marca = Date.now();
const NOMBRE_A = `test-caja-a-${marca}`;
const NOMBRE_B = `test-caja-b-${marca}`;
const NOMBRE_C = `test-caja-c-${marca}`;
const EMAIL_CLIENTE = `test-caja-${marca}@example.com`;
const PASSWORD = 'Cliente123';

const pad = (n: number): string => String(n).padStart(2, '0');
const soloFecha = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// El mostrador solo vende el menú de hoy (R3): el menú de prueba va en HOY
const HOY = soloFecha(new Date());
const MANANA = soloFecha(new Date(Date.now() + 24 * 60 * 60 * 1000));

let cookieAdmin = '';
let cookieCajero = '';
let cookieCocinero = '';
let idA = 0;
let idB = 0;
let idC = 0;
let idMenuA = 0;
let idMenuB = 0; // no disponible
let idMenuManana = 0; // fuera del menú de hoy
let idAnticipado = 0;
let idPedido = 0; // cobrado y avanzará hasta Entregado
let idSinCobro = 0; // queda Pendiente → Cancelado

async function login(correo: string, password: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ correo, password });
  expect(res.status).toBe(200);
  const raw = res.headers['set-cookie'];
  const primera = Array.isArray(raw) ? raw[0] : raw;
  if (!primera) throw new Error('sin cookie');
  return primera.split(';')[0] ?? '';
}

function capturar(
  items: Array<{ menu_dia_id: number; cantidad: number }>,
  extra: Record<string, unknown> = {},
) {
  return request(app)
    .post('/api/caja/pedidos')
    .set('Cookie', cookieCajero)
    .send({ items, ...extra });
}

async function idMenuDe(fecha: string, platilloId: number): Promise<number> {
  const list = await request(app)
    .get(`/api/admin/menu?fecha=${fecha}`)
    .set('Cookie', cookieAdmin);
  const item = (
    list.body.items as Array<{ id: number; platillo_id: number }>
  ).find((i) => i.platillo_id === platilloId);
  return item?.id ?? 0;
}

beforeAll(async () => {
  cookieAdmin = await login('admin@itsh.mx', env.SEED_ADMIN_PASSWORD);
  cookieCajero = await login('cajero@itsh.mx', env.SEED_CAJERO_PASSWORD);
  cookieCocinero = await login('cocinero@itsh.mx', env.SEED_COCINERO_PASSWORD);

  // Cliente de prueba: dueño del pedido anticipado que la caja no debe cobrar
  const reg = await request(app).post('/api/auth/register').send({
    nombre: 'Cliente Caja',
    correo: EMAIL_CLIENTE,
    password: PASSWORD,
  });
  expect(reg.status).toBe(201);
  await login(EMAIL_CLIENTE, PASSWORD);

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
  const c = await request(app)
    .post('/api/admin/platillos')
    .set('Cookie', cookieAdmin)
    .send({ nombre: NOMBRE_C, categoria: 'Comida' });
  expect(c.status).toBe(201);
  idC = c.body.id as number;

  // Menú de hoy: A disponible ($35) y B no disponible ($20)
  await request(app)
    .put('/api/admin/menu')
    .set('Cookie', cookieAdmin)
    .send({ fecha: HOY, platillo_id: idA, precio: 35 });
  await request(app)
    .put('/api/admin/menu')
    .set('Cookie', cookieAdmin)
    .send({ fecha: HOY, platillo_id: idB, precio: 20, disponible: false });
  // Menú de mañana: C ($30) — probar que el mostrador solo vende hoy
  await request(app)
    .put('/api/admin/menu')
    .set('Cookie', cookieAdmin)
    .send({ fecha: MANANA, platillo_id: idC, precio: 30 });

  idMenuA = await idMenuDe(HOY, idA);
  idMenuB = await idMenuDe(HOY, idB);
  idMenuManana = await idMenuDe(MANANA, idC);
  expect(idMenuA).toBeGreaterThan(0);
  expect(idMenuB).toBeGreaterThan(0);
  expect(idMenuManana).toBeGreaterThan(0);

  // Pedido anticipado de prueba (SQL directo): el cobro de mostrador lo
  // debe rechazar con 409 (los anticipados se pagan en línea).
  const alta = await execute(
    `INSERT INTO pedido
       (numero, tipo, estado_id, usuario_id, fecha_recoleccion, total, creado_por)
     VALUES (?, 'anticipado',
             (SELECT id FROM estado_pedido WHERE nombre = 'Pendiente'),
             (SELECT id FROM usuario WHERE correo = ?), ?, 35,
             (SELECT id FROM usuario WHERE correo = ?))`,
    [`PED-TST-${String(marca).slice(-8)}`, EMAIL_CLIENTE, `${HOY} 23:00`, EMAIL_CLIENTE],
  );
  idAnticipado = alta.insertId;
});

afterAll(async () => {
  const cajero = `(SELECT id FROM usuario WHERE correo = 'cajero@itsh.mx')`;
  await execute(
    `DELETE FROM pago WHERE pedido_id IN
       (SELECT id FROM pedido WHERE creado_por = ${cajero} AND tipo = 'mostrador')`,
  );
  await execute(
    `DELETE FROM pedido WHERE creado_por = ${cajero} AND tipo = 'mostrador'`,
  );
  await execute('DELETE FROM pago WHERE pedido_id = ?', [idAnticipado]);
  await execute('DELETE FROM pedido WHERE id = ?', [idAnticipado]);
  await execute('DELETE FROM usuario WHERE correo LIKE ?', ['test-%@example.com']);
  await execute('DELETE FROM menu_dia WHERE platillo_id IN (?, ?, ?)', [
    idA,
    idB,
    idC,
  ]);
  await execute('DELETE FROM platillo WHERE nombre IN (?, ?, ?)', [
    NOMBRE_A,
    NOMBRE_B,
    NOMBRE_C,
  ]);
  await closePool();
});

describe('POST /api/caja/pedidos — captura de mostrador (US1.1/US1.2, FR-015)', () => {
  it('captura en Pendiente con nombre opcional, total del servidor y sin regla de 10 minutos (201)', async () => {
    const res = await capturar([{ menu_dia_id: idMenuA, cantidad: 2 }], {
      cliente_nombre: 'Ana López',
    });

    expect(res.status).toBe(201);
    expect(res.body.numero).toMatch(/^PED-\d{6}-[0-9A-F]{8}$/);
    expect(res.body).toMatchObject({
      tipo: 'mostrador',
      estado: 'Pendiente',
      total: 70,
      fecha_recoleccion: null,
    });
    expect(res.body.partidas).toHaveLength(1);
    expect(res.body.partidas[0]).toMatchObject({
      nombre: NOMBRE_A,
      cantidad: 2,
      precio_unitario: 35,
      subtotal: 70,
    });
    idPedido = res.body.id as number;
  });

  it('captura sin nombre de cliente (el nombre es opcional)', async () => {
    const res = await capturar([{ menu_dia_id: idMenuA, cantidad: 1 }]);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ estado: 'Pendiente', total: 35 });
    idSinCobro = res.body.id as number;
  });

  it('rechaza un platillo no disponible del menú (409 con mensaje claro)', async () => {
    const res = await capturar([{ menu_dia_id: idMenuB, cantidad: 1 }]);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('no_disponible');
    expect(res.body.error.message).toMatch(/no está disponible/);
  });

  it('rechaza un platillo fuera del menú de hoy (409)', async () => {
    const res = await capturar([{ menu_dia_id: idMenuManana, cantidad: 1 }]);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('no_disponible');
    expect(res.body.error.message).toMatch(/menú de hoy/);
  });

  it('rechaza un pedido vacío (400)', async () => {
    const res = await capturar([]);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validacion');
  });

  it('niega sin sesión (401) y a un rol distinto de cajero (403)', async () => {
    const sin = await request(app)
      .post('/api/caja/pedidos')
      .send({ items: [{ menu_dia_id: idMenuA, cantidad: 1 }] });
    expect(sin.status).toBe(401);

    const cocinero = await request(app)
      .post('/api/caja/pedidos')
      .set('Cookie', cookieCocinero)
      .send({ items: [{ menu_dia_id: idMenuA, cantidad: 1 }] });
    expect(cocinero.status).toBe(403);
  });
});

describe('POST /api/caja/pedidos/:id/pago — cobro en efectivo (US1.3/US1.4)', () => {
  it('cobra el pedido de mostrador → Pagado con monto del servidor (200)', async () => {
    const res = await request(app)
      .post(`/api/caja/pedidos/${idPedido}/pago`)
      .set('Cookie', cookieCajero);

    expect(res.status).toBe(200);
    expect(res.body.pedido).toMatchObject({ estado: 'Pagado', total: 70 });
    expect(res.body.pago).toMatchObject({
      metodo: 'efectivo',
      monto: 70,
      referencia: null,
      estado: 'confirmado',
    });
  });

  it('rechaza el doble cobro (409, sin cobros duplicados)', async () => {
    const res = await request(app)
      .post(`/api/caja/pedidos/${idPedido}/pago`)
      .set('Cookie', cookieCajero);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('cobro_no_permitido');
  });

  it('rechaza cobrar un pedido anticipado (409: se paga en línea)', async () => {
    const res = await request(app)
      .post(`/api/caja/pedidos/${idAnticipado}/pago`)
      .set('Cookie', cookieCajero);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('cobro_no_permitido');
  });

  it('devuelve 404 con id inexistente', async () => {
    const res = await request(app)
      .post('/api/caja/pedidos/99999999/pago')
      .set('Cookie', cookieCajero);
    expect(res.status).toBe(404);
  });
});

describe('Entrega y cancelación en caja (US1.6, FR-013)', () => {
  it('la cocina avanza el pedido pagado hasta Listo (En preparación → Listo)', async () => {
    const prep = await request(app)
      .post(`/api/cocina/pedidos/${idPedido}/estado`)
      .set('Cookie', cookieCocinero)
      .send({ estado: 'En preparación' });
    expect(prep.status).toBe(200);

    const listo = await request(app)
      .post(`/api/cocina/pedidos/${idPedido}/estado`)
      .set('Cookie', cookieCocinero)
      .send({ estado: 'Listo' });
    expect(listo.status).toBe(200);
  });

  it('lista los pedidos Listo con el nombre del cliente (200)', async () => {
    const res = await request(app)
      .get('/api/caja/pedidos/listos')
      .set('Cookie', cookieCajero);

    expect(res.status).toBe(200);
    const pedido = (res.body.pedidos as Array<Record<string, unknown>>).find(
      (p) => p.id === idPedido,
    );
    expect(pedido).toMatchObject({ estado: 'Listo', cliente_nombre: 'Ana López' });
  });

  it('entrega el pedido listo (200 → Entregado)', async () => {
    const res = await request(app)
      .post(`/api/caja/pedidos/${idPedido}/estado`)
      .set('Cookie', cookieCajero)
      .send({ estado: 'Entregado' });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('Entregado');
  });

  it('rechaza cambiar un pedido Entregado (409: estado terminal, SC-S4-04)', async () => {
    const res = await request(app)
      .post(`/api/caja/pedidos/${idPedido}/estado`)
      .set('Cookie', cookieCajero)
      .send({ estado: 'Cancelado' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('transicion_invalida');
  });

  it('cancela un pedido Pendiente sin cobrar (200 → Cancelado)', async () => {
    const res = await request(app)
      .post(`/api/caja/pedidos/${idSinCobro}/estado`)
      .set('Cookie', cookieCajero)
      .send({ estado: 'Cancelado' });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('Cancelado');
  });

  it('rechaza estados fuera del enum del cajero (400)', async () => {
    const res = await request(app)
      .post(`/api/caja/pedidos/${idSinCobro}/estado`)
      .set('Cookie', cookieCajero)
      .send({ estado: 'En preparación' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validacion');
  });
});
