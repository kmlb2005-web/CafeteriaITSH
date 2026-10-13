import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { execute, closePool } from '../../src/db/pool.js';
import { env } from '../../src/config/env.js';

const app = crearApp();
const marca = Date.now();
const emailNuevo = (alias: string) => `test-${alias}-${marca}@example.com`;
const PASSWORD = 'Secreta123';

/** Extrae la cookie de sesión de una respuesta (tipado estricto). */
function cookieDe(res: request.Response): string {
  const raw = res.headers['set-cookie'];
  const primera = Array.isArray(raw) ? raw[0] : raw;
  if (!primera) throw new Error('No se recibió cookie de sesión');
  return primera.split(';')[0] ?? '';
}

afterAll(async () => {
  await execute('DELETE FROM usuario WHERE correo LIKE ?', [
    'test-%@example.com',
  ]);
  await closePool();
});

describe('POST /api/auth/register', () => {
  it('crea un cliente con rol usuario (US1.5)', async () => {
    const correo = emailNuevo('registro');
    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Alumno de Prueba',
      correo,
      password: PASSWORD,
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      correo,
      rol: 'usuario',
      activo: true,
    });
    expect(res.body.id).toBeTypeOf('number');
    expect(JSON.stringify(res.body)).not.toContain('password');
  });

  it('rechaza correo duplicado con 409 (US2.4)', async () => {
    const correo = emailNuevo('duplicado');
    const payload = { nombre: 'Duplicado', correo, password: PASSWORD };
    await request(app).post('/api/auth/register').send(payload).expect(201);
    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(409);
    expect(res.body.error.message).toBeTypeOf('string');
  });

  it('rechaza datos inválidos con 400 (FR-021)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nombre: '',
      correo: 'no-es-correo',
      password: 'corta',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validacion');
  });
});

describe('POST /api/auth/login', () => {
  it('inicia sesión con credenciales válidas y setea cookie (US1.1)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      correo: 'admin@itsh.mx',
      password: env.SEED_ADMIN_PASSWORD,
    });

    expect(res.status).toBe(200);
    expect(res.body.rol).toBe('administrador');
    const raw = res.headers['set-cookie'];
    const cookie = Array.isArray(raw) ? raw[0] : raw;
    expect(cookie).toMatch(/token=/);
    expect((cookie ?? '').toLowerCase()).toContain('httponly');
  });

  it('rechaza contraseña incorrecta y correo inexistente con el MISMO mensaje (SC-S1-02)', async () => {
    const wrongPass = await request(app).post('/api/auth/login').send({
      correo: 'admin@itsh.mx',
      password: 'contrasena-equivocada',
    });
    const noUser = await request(app).post('/api/auth/login').send({
      correo: `test-noexiste-${marca}@example.com`,
      password: 'cualquiera',
    });

    expect(wrongPass.status).toBe(401);
    expect(noUser.status).toBe(401);
    expect(wrongPass.body.error.message).toBe(noUser.body.error.message);
  });

  it('niega el acceso a una cuenta dada de baja con 403 (US2.3)', async () => {
    const correo = emailNuevo('baja');
    await request(app).post('/api/auth/register').send({
      nombre: 'Dado de Baja',
      correo,
      password: PASSWORD,
    });
    await execute('UPDATE usuario SET activo = FALSE WHERE correo = ?', [
      correo,
    ]);

    const res = await request(app).post('/api/auth/login').send({
      correo,
      password: PASSWORD,
    });
    expect(res.status).toBe(403);
    expect(res.body.error.message).toMatch(/deshabilitad/i);
  });
});

describe('Sesión (me/logout)', () => {
  it('me devuelve el usuario con cookie y 401 sin ella (US1.3)', async () => {
    const login = await request(app).post('/api/auth/login').send({
      correo: 'admin@itsh.mx',
      password: env.SEED_ADMIN_PASSWORD,
    });
    const cookie = cookieDe(login);

    const conCookie = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);
    expect(conCookie.status).toBe(200);
    expect(conCookie.body.correo).toBe('admin@itsh.mx');

    const sinCookie = await request(app).get('/api/auth/me');
    expect(sinCookie.status).toBe(401);
  });

  it('logout responde 204 y un token inválido queda rechazado (US1)', async () => {
    const out = await request(app).post('/api/auth/logout');
    expect(out.status).toBe(204);

    // la cookie sigue siendo el token anterior: al expirar o borrarse en el
    // cliente, me debe devolver 401. Verificamos con token manipulado:
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'token=invalido');
    expect(res.status).toBe(401);
  });
});
