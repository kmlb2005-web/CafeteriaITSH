import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { RowDataPacket } from 'mysql2/promise';
import { env } from '../config/env.js';
import { closePool, query, execute } from './pool.js';

/**
 * Seed idempotente (data-model.md): asegura los 4 roles del catálogo y crea
 * las cuentas operativas iniciales si no existen. Las contraseñas salen de
 * variables de entorno o se generan aleatoriamente e IMPRIMEN UNA SOLA VEZ
 * (nunca quedan en el código — docs/reglas.md §21, §23).
 */
const ROLES = ['administrador', 'cajero', 'cocinero', 'usuario'] as const;

const CUENTAS = [
  {
    rol: 'administrador',
    nombre: 'Administrador',
    correo: 'admin@itsh.mx',
    password: env.SEED_ADMIN_PASSWORD,
  },
  {
    rol: 'cajero',
    nombre: 'Cajero',
    correo: 'cajero@itsh.mx',
    password: env.SEED_CAJERO_PASSWORD,
  },
  {
    rol: 'cocinero',
    nombre: 'Cocinero',
    correo: 'cocinero@itsh.mx',
    password: env.SEED_COCINERO_PASSWORD,
  },
] as const;

function passwordAleatoria(): string {
  return randomBytes(9).toString('base64url');
}

/** Menú de ejemplo para la fecha actual (R6): idempotente con INSERT IGNORE. */
const MENU_DE_HOY: ReadonlyArray<{
  nombre: string;
  precio: number;
  especial: boolean;
}> = [
  { nombre: 'Gordita de chicharrón', precio: 35, especial: true },
  { nombre: 'Gordita de frijol', precio: 30, especial: false },
  { nombre: 'Quesadilla de queso', precio: 25, especial: false },
  { nombre: 'Torta de jamón', precio: 45, especial: false },
  { nombre: 'Café de olla', precio: 20, especial: true },
  { nombre: 'Jugo de naranja', precio: 25, especial: false },
  { nombre: 'Agua de horchata', precio: 15, especial: false },
  { nombre: 'Pan con huevo', precio: 28, especial: false },
];

async function main(): Promise<void> {
  // Roles (INSERT IGNORE por clave única nombre)
  await execute('INSERT IGNORE INTO rol (nombre) VALUES ?', [
    ROLES.map((nombre) => [nombre]),
  ]);
  console.log(`Roles asegurados: ${ROLES.join(', ')}`);

  for (const cuenta of CUENTAS) {
    const existentes = await query<RowDataPacket>(
      'SELECT id FROM usuario WHERE correo = ?',
      [cuenta.correo],
    );
    if (existentes.length > 0) {
      console.log(`Ya existía: ${cuenta.correo} (${cuenta.rol})`);
      continue;
    }

    const password = cuenta.password || passwordAleatoria();
    const hash = await bcrypt.hash(password, 12);
    await execute(
      `INSERT INTO usuario (nombre, correo, password_hash, rol_id)
       SELECT ?, ?, ?, id FROM rol WHERE nombre = ?`,
      [cuenta.nombre, cuenta.correo, hash, cuenta.rol],
    );
    console.log(
      `Creada cuenta ${cuenta.rol}: ${cuenta.correo} / ${password}` +
        (cuenta.password
          ? ''
          : '  ← generada; guarda este valor (no se repetirá)'),
    );
  }

  // Menú de hoy (R6): solo lo crea si falta; nunca pisa precios editados
  let creados = 0;
  for (const item of MENU_DE_HOY) {
    const resultado = await execute(
      `INSERT IGNORE INTO menu_dia (fecha, platillo_id, precio, disponible, especial)
       SELECT CURDATE(), id, ?, TRUE, ? FROM platillo WHERE nombre = ?`,
      [item.precio, item.especial, item.nombre],
    );
    creados += resultado.affectedRows;
  }
  console.log(
    creados > 0
      ? `Menú de hoy creado con ${creados} platillos.`
      : 'Menú de hoy ya existía (sin cambios).',
  );

  await closePool();
}

main().catch((err: unknown) => {
  console.error('Error en el seed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
