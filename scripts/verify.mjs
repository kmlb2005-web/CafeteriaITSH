// Gate raíz de verificación de calidad (spec 008-qa-foundation, FR-001/FR-002).
//
// Corre `npm run verify` (lint → typecheck → pruebas) en backend/ y frontend/,
// en ese orden, e imprime un resumen. Termina con código ≠ 0 si algún paquete
// falla. Sin dependencias: sólo Node.js LTS (reglas §22).
//
// Uso: node scripts/verify.mjs [--solo backend|frontend]
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const orden = ['backend', 'frontend'];

const argSolo = process.argv.indexOf('--solo');
const paquetes =
  argSolo !== -1 && process.argv[argSolo + 1]
    ? [process.argv[argSolo + 1]]
    : orden;

const resultados = [];

for (const paquete of paquetes) {
  if (!orden.includes(paquete)) {
    console.error(`Paquete desconocido: ${paquete} (esperado: ${orden.join(' | ')})`);
    process.exit(2);
  }
  console.log(`\n=== verify: ${paquete} ===`);
  const inicio = Date.now();
  const r = spawnSync('npm', ['run', 'verify'], {
    cwd: path.join(raiz, paquete),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
  resultados.push({ paquete, ok: r.status === 0, segundos });
}

console.log('\n=== resumen de verificación ===');
for (const { paquete, ok, segundos } of resultados) {
  console.log(`  ${paquete}: ${ok ? 'OK' : 'FALLÓ'} (${segundos}s)`);
}

const fallos = resultados.filter((r) => !r.ok).length;
if (fallos > 0) {
  console.error(`\nVerificación fallida en ${fallos} paquete(s).`);
  process.exit(1);
}
console.log('\nVerificación completa: todo en verde.');
