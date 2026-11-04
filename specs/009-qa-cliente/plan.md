# Implementation Plan: QA del Cliente — Evidencia y Reglas de Rol (Sprint 7)

**Branch**: `009-qa-cliente` | **Date**: 2026-11-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-qa-cliente/spec.md`

## Summary

Cerrar la calidad del rol cliente con pruebas automáticas y evidencia: en
backend, pruebas de 403/401 para el rol cliente contra rutas de caja, cocina y
administración, la prueba que simula el fallo del aviso de correo y comprueba
que el pedido queda `Listo` (cierra O-02) y la verificación del formato de
error `{ error: { code, message } }` sin trazas; en frontend, pruebas de
estados vacíos y de error con reintento en `MenuPage` y `MisPedidosPage`, de
redirección por sesión de otro rol y del total del carrito; y la evidencia
manual (checklist §19 + capturas del flujo en `docs/evidencias/cliente/`) con
las filas RF-01, RF-02 y RF-04 aprobadas y O-02 cerrado en la matriz. Sin
dependencias nuevas y sin cambios de funcionalidad (el código ya cumple).

## Technical Context

**Language/Version**: TypeScript 6 (backend ESM `NodeNext`, frontend React 19 +
Vite 8)

**Primary Dependencies**: ya existentes — Vitest 4, supertest (backend),
Testing Library (frontend), `vi.spyOn` del propio Vitest para simular el fallo
del aviso. **Sin dependencias nuevas** (reglas §22).

**Storage**: MySQL 8 vivo local (pruebas de integración del backend, patrón
actual `fileParallelism: false` con datos `test-*@example.com`); sin cambios de
esquema.

**Testing**: Vitest — `backend/tests/integration/*.test.ts` y
`frontend/src/**/*.test.tsx`; gate `node scripts/verify.mjs` (lint + typecheck
+ pruebas de ambos paquetes).

**Target Platform**: Windows (desarrollo local y runner self-hosted
`cafeteria-itsh-win` del Sprint 6); Node.js 20 (versión con la que el proyecto
está verificado).

**Project Type**: Web application (paquetes `backend/` y `frontend/`, sin
workspaces).

**Performance Goals**: gate local en unos minutos (hoy: backend ~28 s,
frontend ~21 s de pruebas); el CI completo por push/PR por debajo de ~6 min
(runner en serie).

**Constraints**: secretos sólo en `backend/.env` y `runner/.env` nunca
versionados (§21); respuestas de error exactamente
`{ error: { code, message } }` sin información interna (§15); pruebas de
integración en serie con limpieza en `afterAll`.

**Scale/Scope**: 2 paquetes; ~4–6 archivos de prueba nuevos o ampliados (2
backend, 2–3 frontend), 1 checklist de usabilidad, 1 carpeta de capturas
(`docs/evidencias/cliente/`), 3 documentos de calidad (`Matriz_de_calidad.md`,
`sprints.md`, `Requerimientos_MVP.md` sólo si aplica). Conteo actual de
referencia: 29 archivos / 178 pruebas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Requisito (constitución / reglas) | Estado | Notas |
|---|---|---|
| §I Alcance MVP cerrado — nada fuera de alcance | ✅ | Sólo pruebas, evidencia y docs; ninguna funcionalidad nueva (FR-010) |
| §II Seguridad — secretos sólo en `.env`, jamás commiteados | ✅ | Las pruebas verifican además 401/403 y ausencia de trazas; capturas sin credenciales reales |
| §III Frontend única app + rutas protegidas por sesión y rol | ✅ | FR-005 refuerza con pruebas la protección existente (sin tocarla) |
| §IV Calidad: Vitest, pruebas de lógica crítica | ✅ | Este sprint es exactamente eso: pruebas del rol cliente |
| §V Operación/UX: botones táctiles ≥44 px, mensajes claros | ✅ | FR-007 lo verifica con checklist §19 y capturas |
| §22 Dependencias — no agregar sin justificar | ✅ | FR-010: ninguna dependencia nueva |
| §27 Alcance — sin funcionalidad nueva sin aprobación | ✅ | La única posibilidad de cambio backend (O-02) no la requiere: el código ya cumple |

**Gate**: PASS — sin violaciones que justificar. *Re-check post-diseño* (tras
`research.md`, `data-model.md`, `contracts/` y `quickstart.md`): PASS — el
diseño sólo documenta contratos existentes y pruebas; sin código de producto
nuevo, sin dependencias y sin secretos en el repo. Único ajuste de spec:
FR-005 se alinea al comportamiento real (pantalla de acceso denegado con
enlace de vuelta) en lugar de pedir una redirección automática que sería
funcionalidad nueva (R5).

## Project Structure

### Documentation (this feature)

```text
specs/009-qa-cliente/
├── plan.md              # Este archivo (/speckit.plan)
├── research.md          # Fase 0 (dónde y cómo probar cada regla)
├── data-model.md        # Fase 1 (estados y entidades que se observan)
├── quickstart.md        # Fase 1 (guía de validación del sprint)
├── contracts/           # Fase 1 (contrato de errores de API + evidencia)
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit.tasks
```

### Source Code (repository root)

```text
backend/tests/integration/
├── permisos-cliente.test.ts   # NUEVO: 403 caja/cocina/admin + 401 sin sesión
├── mis-pedidos.test.ts        # AMPLIAR: O-02 — fallo del aviso → pedido en Listo
└── errores.test.ts            # NUEVO: formato { error: { code, message } } sin trazas

frontend/src/
├── pages/menu/MenuPage.test.tsx          # AMPLIAR: estado vacío y error con reintento
├── pages/pedidos/MisPedidosPage.test.tsx # AMPLIAR: estado vacío y error con reintento
├── routes/ProtectedRoute.test.tsx        # AMPLIAR: redirección con sesión de otro rol
└── components/CheckoutBar.test.tsx       # AMPLIAR: total del carrito al agregar/quitar

docs/
├── evidencias/cliente/        # NUEVO: capturas PNG del flujo del alumno
├── checklist-usabilidad-cliente.md  # NUEVO: checklist §19 respondido
├── Matriz_de_calidad.md       # AMPLIAR: RF-01/RF-02/RF-04 → Aprobado, O-02 cerrado
└── sprints.md                 # AMPLIAR: Sprint 7 completado con fecha y demo
```

**Structure Decision**: se conserva la estructura de dos paquetes
independientes; las pruebas se agregan en los archivos ya existentes del patrón
actual (una prueba por comportamiento observable, con `test-*@example.com` y
limpieza en `afterAll`), salvo los dos archivos nuevos de backend que aislan
las reglas de rol y de formato de error.

## Complexity Tracking

Sin violaciones de la constitución: no se justifica nada en esta tabla.
