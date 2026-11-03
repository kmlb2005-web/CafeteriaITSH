# Implementation Plan: Base de Aseguramiento de Calidad y CI (Sprint 6)

**Branch**: `008-qa-foundation` | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-qa-foundation/spec.md`

## Summary

Entregar la base del aseguramiento de calidad: un comando único de
verificación por paquete y uno raíz que corren lint + typecheck + pruebas;
GitHub Actions que ejecuta esos trabajos en cada PR (backend con MySQL
efímera + migraciones), un chequeo que impide versionar archivos de entorno
reales, el cierre versionado del trabajo de calidad en curso (fixes de
pruebas + matriz de calidad sin defectos abiertos) y `AGENTS.md` actualizado.
Sin dependencias nuevas y sin funcionalidad de negocio.

## Technical Context

**Language/Version**: TypeScript 6 (backend ESM `NodeNext`, frontend React 19 + Vite 8)

**Primary Dependencies**: ya existentes — ESLint 10, `typescript-eslint`, Vitest 4,
supertest (backend), Testing Library (frontend). CI: GitHub Actions con
`mysql:8` como servicio. **Sin dependencias nuevas** (reglas §22).

**Storage**: MySQL 8 (sólo para las pruebas de integración del backend; el CI
levanta una instancia efímera por trabajo).

**Testing**: Vitest (`backend/tests/integration|unit`, `frontend/src/**/*.test.tsx`);
verificación completa `lint && typecheck && test` por paquete.

**Target Platform**: Linux (runners de GitHub Actions) y Windows (desarrollo
local); Node.js LTS.

**Project Type**: Web application (paquetes `backend/` y `frontend/` en un mismo
repositorio, sin workspaces).

**Performance Goals**: la verificación local completa debe terminar en unos
pocos minutos (hoy: backend ~28 s, frontend ~21 s de pruebas); el CI completo
por PR por debajo de ~5 minutos.

**Constraints**: los secretos (`DATABASE_URL`, `JWT_SECRET`) viven sólo en el
workflow o en `backend/.env` local nunca versionado; las pruebas de
integración corren en serie (`fileParallelism: false`) y crean/borran sus
propios datos (`test-*@example.com`).

**Scale/Scope**: 2 paquetes, 29 archivos de prueba (178 pruebas), 1 workflow
con 2 trabajos, 1 script raíz, 4 documentos tocados (`AGENTS.md`,
`docs/Matriz_de_calidad.md`, `docs/Requerimientos_MVP.md`, `docs/sprints.md`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Requisito (constitución / reglas) | Estado | Notas |
|---|---|---|
| §I Alcance MVP cerrado — nada fuera de alcance | ✅ | Sólo aseguramiento; cero funcionalidad nueva (FR-009) |
| §II Seguridad — secretos sólo en `.env`, jamás commiteados | ✅ | FR-004 y FR-005 refuerzan la regla con chequeo en CI |
| §III Frontend única app + rutas protegidas | ✅ | No se toca código de la app |
| §IV Calidad: Vitest, pruebas de lógica crítica | ✅ | El gate ejecuta exactamente esas pruebas |
| §V Operación/UX | ⚪ | No aplica a esta feature |
| §22 Dependencias — no agregar sin justificar | ✅ | FR-009: ninguna dependencia nueva (el CI usa servicios oficiales) |
| §27 Alcance — sin funcionalidad nueva | ✅ | Sólo scripts, workflow y docs |

**Gate**: PASS — sin violaciones que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/008-qa-foundation/
├── plan.md              # Este archivo (/speckit.plan)
├── research.md          # Fase 0
├── data-model.md        # Fase 1 (entidades de configuración)
├── quickstart.md        # Fase 1 (guía de validación)
├── contracts/           # Fase 1 (contrato del comando verify + del workflow)
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit.tasks
```

### Source Code (repository root)

```text
scripts/
└── verify.mjs                 # gate raíz (lint+typecheck+test de ambos paquetes)

backend/
├── package.json               # + script "verify"
└── (sin cambios de código)

frontend/
├── package.json               # + script "verify"
└── (sin cambios de código)

.github/
└── workflows/
    └── ci.yml                 # trabajos frontend y backend + chequeo de .env

AGENTS.md                      # secuencia de verificación real
docs/sprints.md                # roadmap de QA (sprints 6–11)
docs/Matriz_de_calidad.md      # cierre de D-01…D-03, O-01
docs/Requerimientos_MVP.md     # ya cerrado en el árbol de trabajo
```

**Structure Decision**: se conserva la estructura de dos paquetes
independientes (sin root `package.json`, por regla de AGENTS.md); el gate
raíz es un script de Node sin dependencias que invoca `npm run verify` en
cada paquete.

## Complexity Tracking

Sin violaciones de la constitución: no se justifica nada en esta tabla.
