# Quickstart — Base de Aseguramiento de Calidad y CI (spec 008)

**Fecha**: 2026-11-02 · Guía de validación (sin implementación).

## Prerrequisitos

- Node.js LTS y `npm` en ambos paquetes (`npm ci` en `backend/` y `frontend/`).
- MySQL 8 en vivo para la verificación local del backend (regla existente) con
  `backend/.env` copiado de `.env.example` (ver `docs/ejecutar-migraciones.md`).
- Acceso de escritura al repositorio en GitHub para observar el CI.

## 1. Verificación local completa

```powershell
node scripts/verify.mjs
```

**Esperado**: corre `npm run verify` en `backend/` y `frontend/`; imprime
`backend: OK` y `frontend: OK` y termina con código 0.

**Fallo esperado a propósito**: introduce un error de tipos en cualquier
paquete y repite → el script termina con código ≠ 0 y señala el paquete.

## 2. Verificación por paquete (equivalente al CI)

```powershell
cd backend;  npm run verify   # eslint → tsc → vitest
cd frontend; npm run verify   # eslint → tsc → vitest
```

**Esperado**: 9 archivos/89 pruebas en backend, 20 archivos/89 pruebas en
frontend, todo en verde (conteo de 2026-11-02).

## 3. Chequeo de secretos (equivalente al CI)

```powershell
git ls-files | Select-String -Pattern '(^|/)\.env$'
```

**Esperado**: sin resultados (sólo `.env.example` está versionado).

## 4. CI en GitHub

1. Empujar la rama `spec/008-qa-foundation` y abrir un PR a `main`.
2. Observar los trabajos `chequeo-secretos`, `frontend` y `backend`.
3. **Esperado**: los tres en verde; el `backend` muestra los pasos de
   esquema, migraciones y pruebas contra MySQL.

**Prueba de que el gate bloquea**: abrir un PR con un error de tipos
deliberado → el trabajo correspondiente en rojo.

## 5. Cierre documental

- `docs/Matriz_de_calidad.md`: sin defectos abiertos (D-01…D-03, O-01
  cerrados con fecha).
- `AGENTS.md`: describe `node scripts/verify.mjs` y el conteo real de
  pruebas.
- `docs/sprints.md`: roadmap de QA (sprints 6–11) versionado.

## Referencias

- Contratos: [contracts/verificacion-calidad.md](./contracts/verificacion-calidad.md)
- Modelo de configuración: [data-model.md](./data-model.md)
- Decisiones: [research.md](./research.md)
