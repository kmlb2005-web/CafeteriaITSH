# Contratos — Base de Aseguramiento de Calidad y CI (spec 008)

**Fecha**: 2026-11-02 · **Fase 1** de `/speckit.plan`

## C1 — Contrato del comando `verify` (por paquete)

**Entrada**: ninguna.
**Ejecución** (en orden, deteniéndose en el primero que falla):

| Paso | Comando | Qué valida |
|---|---|---|
| 1 | `npm run lint` | reglas ESLint del paquete |
| 2 | `npm run typecheck` | `tsc --noEmit` (tipos) |
| 3 | `npm test` | `vitest run` (pruebas) |

**Salida**:
- `0` → toda la verificación del paquete pasó.
- `≠ 0` → falló el paso indicado en la salida estándar.

## C2 — Contrato del gate raíz `scripts/verify.mjs`

**Entrada**: ninguna (opcional `--solo backend|frontend` como apoyo).
**Ejecución**: `npm run verify` en `backend/` y luego en `frontend/`.
**Salida**:
- `0` → ambos paquetes pasaron; imprime resumen `backend: OK / frontend: OK`.
- `≠ 0` → al menos un paquete falló; imprime cuál falló y en qué fase.
**Garantía**: no instala ni requiere dependencias (sólo Node.js LTS).

## C3 — Contrato del workflow `.github/workflows/ci.yml`

| Disparadores | `push` a `main`, `pull_request` |
|---|---|
| Trabajo `chequeo-secretos` | falla si `git ls-files` contiene un `.env` real (`.env.example` permitido) |
| Trabajo `frontend` | Node LTS → `npm ci` → `npm run verify` en `frontend/` |
| Trabajo `backend` | servicio `mysql:8` sano → esquema `docs/001`+`docs/002` → `npm ci` → `npm run migrate` → `npm run verify` en `backend/` |
| Variables | `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=test` sólo declaradas en el workflow |
| Semántica de fallo | cualquier trabajo rojo bloquea el PR |

## C4 — Contrato de cierre de la matriz de calidad

`docs/Matriz_de_calidad.md` debe cumplir al cerrar el sprint:

1. Toda fila RF-0x tiene: requisito, criterio de aceptación, prueba
   ejecutada, resultado y evidencia.
2. Ninguna fila en estado `Fallido` o `Sin prueba` sin defecto/observación
   asociado en estado **Cerrado** (con fecha y solución).
3. Los IDs D-01, D-02, D-03 y O-01 figuran como cerrados.

## Fuera de contrato

- Sin cambios en rutas, servicios, esquema o interfaz de usuario.
- Sin cobertura de código (sprint 11) ni E2E (fuera de alcance).
