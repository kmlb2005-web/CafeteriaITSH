# Data Model — Base de Aseguramiento de Calidad y CI (spec 008)

**Fecha**: 2026-11-02 · **Fase 1** de `/speckit.plan`

Esta feature no agrega entidades de negocio ni migraciones. Modela la
**configificación de calidad** que queda versionada.

## Entidades de configuración

### 1. Comando `verify` (por paquete)

| Campo | Valor backend | Valor frontend |
|---|---|---|
| `lint` | `eslint .` | `eslint .` |
| `typecheck` | `tsc --noEmit` | `tsc --noEmit` |
| `test` | `vitest run` | `vitest run` |

- Orden fijo: lint → typecheck → test (falla rápido en la primera fase).
- Invariante: si cualquiera falla, el comando termina con código ≠ 0.

### 2. Gate raíz `scripts/verify.mjs`

| Campo | Descripción |
|---|---|
| `paquetes` | `['backend', 'frontend']` en ese orden |
| `ejecucion` | `npm run verify` dentro de cada paquete |
| `salida` | código ≠ 0 si falla algún paquete; imprime resumen por paquete |

- Invariante: no depende de dependencias externas (sólo `node:*`).

### 3. Workflow `.github/workflows/ci.yml`

| Trabajo | Triggers | Pasos clave |
|---|---|---|
| `frontend` | `push` a `main`, `pull_request` | checkout → Node LTS → `npm ci` → `npm run verify` |
| `chequeo-secretos` | igual | `git ls-files` sin archivos `.env` reales |
| `backend` | igual | checkout → Node LTS → servicio `mysql:8` → crear esquema `docs/001`+`docs/002` → `npm ci` → `npm run migrate` → `npm run verify` |

| Variable (sólo en el workflow) | Uso |
|---|---|
| `DATABASE_URL` | conexión `mysql://` a la base efímera del servicio |
| `JWT_SECRET` | ≥16 caracteres (validado por `env.ts`) |
| `NODE_ENV` | `test` |

- Invariante: ningún valor de estas variables se escribe en el repositorio.

### 4. Filas de `docs/Matriz_de_calidad.md` (cierre)

| ID | Estado final | Evidencia |
|---|---|---|
| D-01 | Cerrado (por aclaración del criterio) | `docs/Requerimientos_MVP.md`, RF-01 |
| D-02 | Cerrado (prueba de cobros simultáneos) | `backend/tests/integration/pedidos.test.ts` |
| D-03 | Cerrado (búsqueda por id en la cola) | `backend/tests/integration/cocina.test.ts` |
| O-01 | Cerrado (casos borde 9 y 11 minutos) | `backend/tests/integration/pedidos.test.ts` |

- Invariante: la matriz queda sin filas en estado *Sin prueba*/*Fallido*
  sin resolver (SC-003).

## Relaciones con entidades existentes

Ninguna: no se tocan tablas, servicios ni rutas. Los artefactos se limitan a
`package.json`, `scripts/`, `.github/workflows/` y documentos.
