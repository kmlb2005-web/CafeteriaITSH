import bcrypt from 'bcryptjs';

const COSTO = 12;

/** Hash de contraseña — nunca texto plano (FR-001, constitución II). */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COSTO);
}

/** Verifica una contraseña contra su hash. */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
