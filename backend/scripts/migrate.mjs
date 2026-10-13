// Runner de migraciones (research.md R4): aplica migrations/*.sql en orden
// numérico y registra cada una en schema_migrations. En la primera ejecución
// detecta el esquema preexistente (docs/001 + docs/002) y lo registra como
// baseline para no duplicarlo.
//
// Uso: cd backend && npm run migrate
import 'dotenv/config';
import { readdirSync, readFile } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import mysql from 'mysql2/promise';

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../migrations',
);
const BASELINE = ['docs/001_crear_esquema.sql', 'docs/002_seed_inicial.sql'];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('Falta DATABASE_URL (backend/.env). Ver backend/.env.example');
    process.exit(1);
  }

  const conn = await mysql.createConnection({
    uri: url,
    multipleStatements: true,
  });

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        nombre      VARCHAR(191) NOT NULL PRIMARY KEY,
        aplicado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    const [appliedRows] = await conn.query(
      'SELECT nombre FROM schema_migrations',
    );
    const applied = new Set(appliedRows.map((r) => r.nombre));

    // Baseline: si el esquema ya existe pero nada está registrado, registrar
    // los scripts de docs/ como aplicados.
    if (applied.size === 0) {
      const [tables] = await conn.query(
        "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'usuario'",
      );
      if (tables[0].n > 0) {
        for (const name of BASELINE) {
          await conn.query(
            'INSERT INTO schema_migrations (nombre) VALUES (?)',
            [name],
          );
          applied.add(name);
        }
        console.log(`Baseline registrado: ${BASELINE.join(', ')}`);
      }
    }

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let pending = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      const content = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`Aplicando ${file}...`);
      await conn.query(content);
      await conn.query('INSERT INTO schema_migrations (nombre) VALUES (?)', [
        file,
      ]);
      pending += 1;
    }

    console.log(
      pending === 0
        ? 'Migraciones al día (sin pendientes).'
        : `${pending} migración(es) aplicada(s).`,
    );
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Error aplicando migraciones:', err.message);
  process.exit(1);
});
