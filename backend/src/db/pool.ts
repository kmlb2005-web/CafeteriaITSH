import mysql from 'mysql2/promise';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { env } from '../config/env.js';

/** Pool compartido de conexiones MySQL (docs/reglas.md §4 — sin ORM). */
export const pool: Pool = mysql.createPool({
  uri: env.DATABASE_URL,
  connectionLimit: 10,
  waitForConnections: true,
  // NUMERIC/DECIMAL (p. ej. precios) llegan como número, no como string
  decimalNumbers: true,
});

/** Consulta simple que devuelve filas tipadas. */
export async function query<T = RowDataPacket[]>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const [rows] = (await pool.query(sql, params)) as [T[], unknown];
  return rows;
}

/** Ejecuta un INSERT/UPDATE y devuelve metadatos. */
export async function execute(
  sql: string,
  params: unknown[] = [],
): Promise<mysql.OkPacket> {
  const [result] = (await pool.query(sql, params)) as [mysql.OkPacket, unknown];
  return result;
}

/** Cierra el pool (usado por seeds y tests). */
export async function closePool(): Promise<void> {
  await pool.end();
}
