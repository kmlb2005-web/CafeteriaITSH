import 'dotenv/config';
import { z } from 'zod';

/**
 * Variables de entorno validadas (docs/reglas.md §23).
 * El servidor NO arranca si falta una variable requerida.
 */
const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL es requerida')
    .regex(/^mysql:\/\//, 'DATABASE_URL debe ser una URL mysql://'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  JWT_EXPIRES_HOURS: z.coerce.number().int().positive().max(720).default(8),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  SEED_ADMIN_PASSWORD: z.string().default(''),
  SEED_CAJERO_PASSWORD: z.string().default(''),
  SEED_COCINERO_PASSWORD: z.string().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const detail = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  console.error(`Error en las variables de entorno:\n${detail}`);
  console.error('Copia backend/.env.example a backend/.env y complétalo.');
  process.exit(1);
}

export const env = parsed.data;
