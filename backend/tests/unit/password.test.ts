import { describe, expect, it } from 'vitest';
import {
  hashPassword,
  verifyPassword,
} from '../../src/utils/password.js';

describe('password utils', () => {
  it('genera un hash no reversible (nunca texto plano — FR-001)', async () => {
    const hash = await hashPassword('Secreta123');
    expect(hash).not.toBe('Secreta123');
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('verifica correctamente la contraseña original', async () => {
    const hash = await hashPassword('Secreta123');
    await expect(verifyPassword('Secreta123', hash)).resolves.toBe(true);
  });

  it('rechaza una contraseña distinta', async () => {
    const hash = await hashPassword('Secreta123');
    await expect(verifyPassword('otra-cosa', hash)).resolves.toBe(false);
  });
});
