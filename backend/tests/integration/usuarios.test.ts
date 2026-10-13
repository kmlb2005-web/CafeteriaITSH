import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { closePool, execute, query } from '../../src/db/pool.js';
import { env } from '../../src/config/env.js';

const app = crearApp();
const marca = Date.now();
const emailCajero = `test-cajero-${marca}@example.com`;
const emailCliente = `test-cliente-${marca}@example.com`;
let cookieAdmin = '';
let idCajero = 0;

async function loginAdmin(): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({
    correo: 'admin@itsh.mx',
    password: env.SEED_ADMIN_PASSWORD,
  });
  expect(res.status).toBe(200);
  const raw = res.headers['set-cookie'];
  const primera = Array.isArray(raw) ? raw[0] : raw;
  if (!primera) throw new Error('sin cookie');
  return primera.split(';')[0] ?? '';
}

beforeAll(async () => {
  cookieAdmin = await loginAdmin();
});

afterAll(async () => {
  await execute('DELETE FROM usuario WHERE correo LIKE ?', [
    'test-%@example.com',
  ]);
  await closePool();
});

describe('POST /api/usuarios (admin)', () => {
  it('crea un cajero con rol cajero (US2.1)', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .set('Cookie', cookieAdmin)
      .send({
        nombre: 'Cajero de Prueba',
        correo: emailCajero,
        password: 'Cajero123',
        rol: 'cajero',
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ correo: emailCajero, rol: 'cajero' });
    expect(JSON.stringify(res.body)).not.toContain('password');
    idCajero = res.body.id as number;
  });

  it('rechaza un rol que no sea operativo (400)', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .set('Cookie', cookieAdmin)
      .send({
        nombre: 'No Permitido',
        correo: `test-rol-${marca}@example.com`,
        password: 'Valida123',
        rol: 'administrador',
      });
    expect(res.status).toBe(400);
  });

  it('rechaza correo duplicado con 409 (US2.4)', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .set('Cookie', cookieAdmin)
      .send({
        nombre: 'Duplicado',
        correo: emailCajero,
        password: 'Cajero123',
        rol: 'cajero',
      });
    expect(res.status).toBe(409);
  });

  it('niega el acceso sin sesión (401) y con rol de cliente (403) (US2.5)', async () => {
    const sinSesion = await request(app).post('/api/usuarios').send({
      nombre: 'Intruso',
      correo: `test-intruso-${marca}@example.com`,
      password: 'Valida123',
      rol: 'cajero',
    });
    expect(sinSesion.status).toBe(401);

    const reg = await request(app).post('/api/auth/register').send({
      nombre: 'Cliente Curioso',
      correo: emailCliente,
      password: 'Cliente123',
    });
    expect(reg.status).toBe(201);

    // el cliente inicia sesión para obtener su cookie de rol 'usuario'
    const loginCliente = await request(app)
      .post('/api/auth/login')
      .send({ correo: emailCliente, password: 'Cliente123' });
    expect(loginCliente.status).toBe(200);
    const raw = loginCliente.headers['set-cookie'];
    const cookieCliente = (Array.isArray(raw) ? raw[0] : raw)?.split(';')[0];
    const conRolCliente = await request(app)
      .post('/api/usuarios')
      .set('Cookie', cookieCliente ?? '')
      .send({
        nombre: 'Otro',
        correo: `test-x-${marca}@example.com`,
        password: 'Valida123',
        rol: 'cajero',
      });
    expect(conRolCliente.status).toBe(403);
  });
});

describe('GET/PATCH /api/usuarios (admin)', () => {
  it('lista usuarios operativos sin password_hash', async () => {
    const res = await request(app)
      .get('/api/usuarios')
      .set('Cookie', cookieAdmin);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const creado = (res.body as Array<{ id: number }>).find(
      (u) => u.id === idCajero,
    );
    expect(creado).toBeDefined();
    expect(JSON.stringify(res.body)).not.toContain('password');
  });

  it('edita el nombre del cajero (US2.2)', async () => {
    const res = await request(app)
      .patch(`/api/usuarios/${idCajero}`)
      .set('Cookie', cookieAdmin)
      .send({ nombre: 'Cajero Editado' });

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe('Cajero Editado');
  });

  it('devuelve 404 con id inexistente', async () => {
    const res = await request(app)
      .patch('/api/usuarios/99999999')
      .set('Cookie', cookieAdmin)
      .send({ nombre: 'Nadie' });
    expect(res.status).toBe(404);
  });

  it('dar de baja impide el login del cajero (US2.3)', async () => {
    const ok = await request(app)
      .patch(`/api/usuarios/${idCajero}/estado`)
      .set('Cookie', cookieAdmin)
      .send({ activo: false });
    expect(ok.status).toBe(200);
    expect(ok.body.activo).toBe(false);

    const login = await request(app).post('/api/auth/login').send({
      correo: emailCajero,
      password: 'Cajero123',
    });
    expect(login.status).toBe(403);

    // y su sesión vigente deja de ser válida
    const [fila] = await query<{ rol: string }>(
      `SELECT r.nombre AS rol FROM usuario u JOIN rol r ON r.id = u.rol_id WHERE u.correo = ?`,
      [emailCajero],
    );
    expect(fila?.rol).toBe('cajero');

    // reactivar para el resto de pruebas
    const back = await request(app)
      .patch(`/api/usuarios/${idCajero}/estado`)
      .set('Cookie', cookieAdmin)
      .send({ activo: true });
    expect(back.status).toBe(200);
  });
});
