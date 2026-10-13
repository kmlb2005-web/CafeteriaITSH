import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Los tests de integración comparten la BD: correr en serie
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
