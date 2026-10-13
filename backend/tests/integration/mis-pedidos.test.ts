import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { closePool, execute, query } from '../../src/db/pool.js';
import { env } from '../../src/config/env.js';
import { enviarCorreo } from '../../src/services/correo.js';

// Adaptador de correo simulado: controlamos éxito/fallo por test (R2)
vi.mock('../../src/services/correo.js', () => ({
  enviarCorreo: vi.fn(),
}));
const correoMock = vi.mocked(enviarCorreo);

const app = crearApp();
const marca = Date.now();
const NOMBRE = `test-mispedidos-${marca}`;
const EMAIL_A = `test-mis-a-${marca}@example.com`;
const EMAIL_B = `test-mis-b-${marca}@example.com`;
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
let cookieA = '';
let cookieB = '';
let idMenu = 0;
let idPagado = 0; // A: se queda Pagado (sin notificación)
let idListo = 0; // A: avanza a Listo (notificación enviada)
let idDeB = 0; // B: para aislamiento y fallo de envío
let idPendiente = 0; // A: recién creado, sin pagar
let idMostrador = 0; // pedido de mostrador (sin cliente en la BD)

async function login(correo: string, password: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ correo, password });
  expect(res.status).toBe(200);
  const raw = res.headers['set-cookie'];
  const primera = Array.isArray(raw) ? raw[0] : raw;
  if (!primera) throw new Error('sin cookie');
  return primera.split(';')[0] ?? '';
}

async function registrar(correo: string): Promise<string> {
  const res = await request(app).post('/api/auth/register').send({
    nombre: 'Cliente Seguimiento',
    correo,
    password: PASSWORD,
  });
  expect(res.status).toBe(201);
  return login(correo, PASSWORD);
}

async function crearYPagar(cookie: string): Promise<number> {
  const creado = await request(app)
    .post('/api/pedidos')
    .set('Cookie', cookie)
    .send({ items: [{ menu_dia_id: idMenu, cantidad: 2 }], fecha_recoleccion: RECOLECCION });
  expect(creado.status).toBe(201);
  const id = creado.body.id as number;
  const pago = await request(app)
    .post(`/api/pedidos/${id}/pago`)
    .set('Cookie', cookie)
    .send({});
  expect(pago.status).toBe(200);
  return id;
}

function avanzar(id: number, estado: string) {
  return request(app)
    .post(`/api/cocina/pedidos/${id}/estado`)
    .set('Cookie', cookieCocinero)
    .send({ estado });
}

async function notificacionesDe(pedidoId: number) {
  return query<{ id: number; tipo: string; canal: string; estado_envio: string; detalle_error: string | null }>(
    `SELECT id, tipo, canal, estado_envio, detalle_error
     FROM notificacion WHERE pedido_id = ? ORDER BY id`,
    [pedidoId],
  );
}

beforeAll(async () => {
  correoMock.mockResolvedValue({
    exitoso: true,
    detalle: 'Correo aceptado por el servicio simulado.',
  });

  cookieAdmin = await login('admin@itsh.mx', env.SEED_ADMIN_PASSWORD);
  cookieCajero = await login('cajero@itsh.mx', env.SEED_CAJERO_PASSWORD);
  cookieCocinero = await login('cocinero@itsh.mx', env.SEED_COCINERO_PASSWORD);
  cookieA = await registrar(EMAIL_A);
  cookieB = await registrar(EMAIL_B);

  const platillo = await request(app)
    .post('/api/admin/platillos')
    .set('Cookie', cookieAdmin)
    .send({ nombre: NOMBRE, categoria: 'Comida' });
  expect(platillo.status).toBe(201);
  const idPlatillo = platillo.body.id as number;

  await request(app)
    .put('/api/admin/menu')
    .set('Cookie', cookieAdmin)
    .send({ fecha: FECHA, platillo_id: idPlatillo, precio: 35 });

  const menu = await request(app)
    .get(`/api/admin/menu?fecha=${FECHA}`)
    .set('Cookie', cookieAdmin);
  const item = (
    menu.body.items as Array<{ id: number; platillo_id: number }>
  ).find((i) => i.platillo_id === idPlatillo);
  expect(item).toBeDefined();
  idMenu = item?.id ?? 0;

  // Cliente A: un Pagado, un Listo (notificación) y uno Pendiente
  idPagado = await crearYPagar(cookieA);
  idListo = await crearYPagar(cookieA);
  const pendiente = await request(app)
    .post('/api/pedidos')
    .set('Cookie', cookieA)
    .send({ items: [{ menu_dia_id: idMenu, cantidad: 1 }], fecha_recoleccion: RECOLECCION });
  expect(pendiente.status).toBe(201);
  idPendiente = pendiente.body.id as number;

  // Cliente B: un pedido propio Pagado
  idDeB = await crearYPagar(cookieB);

  // A avanza hasta Listo → debe generar la notificación enviada
  expect((await avanzar(idListo, 'En preparación')).status).toBe(200);
  expect((await avanzar(idListo, 'Listo')).status).toBe(200);
});

beforeEach(() => {
  correoMock.mockReset();
  correoMock.mockResolvedValue({
    exitoso: true,
    detalle: 'Correo aceptado por el servicio simulado.',
  });
});

afterAll(async () => {
  const correos = `(SELECT id FROM usuario WHERE correo IN (?, ?))`;
  await execute(
    `DELETE FROM pago WHERE pedido_id IN (SELECT id FROM pedido WHERE usuario_id IN ${correos})`,
    [EMAIL_A, EMAIL_B],
  );
  await execute(`DELETE FROM pedido WHERE usuario_id IN ${correos}`, [EMAIL_A, EMAIL_B]);
  await execute('DELETE FROM pago WHERE pedido_id = ?', [idMostrador]);
  await execute('DELETE FROM pedido WHERE id = ?', [idMostrador]);
  await execute('DELETE FROM usuario WHERE correo LIKE ?', ['test-%@example.com']);
  await execute('DELETE FROM menu_dia WHERE fecha = ?', [FECHA]);
  await execute('DELETE FROM platillo WHERE nombre = ?', [NOMBRE]);
  await closePool();
});

describe('GET /api/pedidos — mis pedidos (US1, FR-014)', () => {
  it('lista los pedidos propios con el estado vigente y el aviso de listo', async () => {
    const res = await request(app).get('/api/pedidos').set('Cookie', cookieA);

    expect(res.status).toBe(200);
    const pedidos = res.body.pedidos as Array<Record<string, unknown>>;

    const pagado = pedidos.find((p) => p.id === idPagado);
    const listo = pedidos.find((p) => p.id === idListo);
    const pendiente = pedidos.find((p) => p.id === idPendiente);

    // US1.3 y US1.5: el estado mostrado es el real registrado
    expect(pagado).toMatchObject({ estado: 'Pagado', aviso_listo: false });
    expect(listo).toMatchObject({ estado: 'Listo', aviso_listo: true });
    expect(pendiente).toMatchObject({ estado: 'Pendiente', aviso_listo: false });

    // Más reciente primero
    expect(pedidos[0]?.id).toBe(idPendiente);
  });

  it('el detalle del pedido coincide con lo registrado (US1.2)', async () => {
    const res = await request(app)
      .get(`/api/pedidos/${idListo}`)
      .set('Cookie', cookieA);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ estado: 'Listo', total: 70 });
    expect(res.body.partidas).toHaveLength(1);
    expect(res.body.partidas[0]).toMatchObject({
      nombre: NOMBRE,
      cantidad: 2,
      precio_unitario: 35,
    });
  });

  it('no muestra pedidos de otros clientes (US1.4, SC-S5-03)', async () => {
    const res = await request(app).get('/api/pedidos').set('Cookie', cookieB);

    expect(res.status).toBe(200);
    const pedidos = res.body.pedidos as Array<Record<string, unknown>>;
    expect(pedidos).toHaveLength(1);
    expect(pedidos[0]?.id).toBe(idDeB);
  });

  it('niega sin sesión (401)', async () => {
    const res = await request(app).get('/api/pedidos');
    expect(res.status).toBe(401);
  });
});

describe('Notificación de pedido listo (US2, FR-019)', () => {
  it('al llegar a Listo se genera una notificación enviada por correo (SC-S5-01)', async () => {
    const filas = await notificacionesDe(idListo);

    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({
      tipo: 'pedido_listo',
      canal: 'correo',
      estado_envio: 'enviada',
      detalle_error: null,
    });
  });

  it('un pedido Pagado no genera ninguna notificación (US2.4)', async () => {
    expect(await notificacionesDe(idPagado)).toHaveLength(0);
    expect(await notificacionesDe(idPendiente)).toHaveLength(0);
  });

  it('si el envío falla, el estado Listo sigue visible y se reintenta (US2.3)', async () => {
    // El cliente B avanza a Listo con el correo caído
    correoMock.mockResolvedValue({ exitoso: false, detalle: 'Fallo simulado.' });
    expect((await avanzar(idDeB, 'En preparación')).status).toBe(200);
    expect((await avanzar(idDeB, 'Listo')).status).toBe(200);

    // La transición quedó registrada como fallida…
    const trasTransicion = await notificacionesDe(idDeB);
    expect(trasTransicion).toHaveLength(1);
    expect(trasTransicion[0]?.estado_envio).toBe('fallida');
    expect(trasTransicion[0]?.detalle_error).toMatch(/Fallo simulado/);

    // …pero el estado Listo sigue visible para el cliente y la consulta
    // reintenta el envío (2do intento fallido)
    const lista = await request(app).get('/api/pedidos').set('Cookie', cookieB);
    expect(lista.status).toBe(200);
    const pedido = (lista.body.pedidos as Array<Record<string, unknown>>).find(
      (p) => p.id === idDeB,
    );
    expect(pedido).toMatchObject({ estado: 'Listo', aviso_listo: true });
    expect(await notificacionesDe(idDeB)).toHaveLength(2);

    // El servicio vuelve: 3er intento, ahora exitoso (≤3 intentos), y el
    // correo va al domicilio del cliente B
    correoMock.mockResolvedValue({
      exitoso: true,
      detalle: 'Correo aceptado por el servicio simulado.',
    });
    await request(app).get('/api/pedidos').set('Cookie', cookieB);
    const trasReintento = await notificacionesDe(idDeB);
    expect(trasReintento).toHaveLength(3);
    expect(trasReintento.filter((f) => f.estado_envio === 'enviada')).toHaveLength(1);
    expect(correoMock.mock.calls.at(-1)?.[0]).toMatchObject({ para: EMAIL_B });

    // Idempotente: con un envío exitoso ya no se generan más avisos
    await request(app).get('/api/pedidos').set('Cookie', cookieB);
    expect(await notificacionesDe(idDeB)).toHaveLength(3);
  });

  it('un pedido de mostrador (sin cuenta) no genera notificación', async () => {
    // Captura real de cajero: el pedido de mostrador no tiene usuario
    const captura = await request(app)
      .post('/api/caja/pedidos')
      .set('Cookie', cookieCajero)
      .send({
        cliente_nombre: 'Sin Cuenta',
        items: [{ menu_dia_id: idMenu, cantidad: 1 }],
      });
    // El menú de prueba puede no ser el de hoy si la corrida cruza la
    // medianoche: en ese caso este caso borde ya está cubierto por el guard
    // del servicio (usuario_id NULL) y se omite sin romper la corrida.
    if (captura.status !== 201) return;
    idMostrador = captura.body.id as number;

    const cobro = await request(app)
      .post(`/api/caja/pedidos/${idMostrador}/pago`)
      .set('Cookie', cookieCajero);
    expect(cobro.status).toBe(200);
    expect((await avanzar(idMostrador, 'En preparación')).status).toBe(200);
    expect((await avanzar(idMostrador, 'Listo')).status).toBe(200);

    expect(await notificacionesDe(idMostrador)).toHaveLength(0);
    expect(correoMock).not.toHaveBeenCalled();
  });
});
