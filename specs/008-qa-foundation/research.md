# Research — Base de Aseguramiento de Calidad y CI (spec 008)

**Fecha**: 2026-11-02 · **Fase 0** de `/speckit.plan`

Formato: **Decisión → Razón → Alternativas descartadas**.

---

## R1 — Dónde corre la verificación automática

**Decisión**: GitHub Actions en `.github/workflows/ci.yml`, disparado en
`push` a `main` y en todos los `pull_request`.

**Razón**: el repositorio ya está en GitHub
(`kmlb2005-web/CafeteriaITSH`); es la única opción sin infraestructura
propia ni dependencias nuevas. Los flujos de trabajo son gratuitos para
repositorios públicos.

**Alternativas descartadas**:
- *GitLab CI / Jenkins*: requieren otra plataforma o un servidor propio.
- *Sólo hooks pre-commit locales*: depende de que cada persona/agente los
  ejecute; no bloquea PRs y no deja evidencia centralizada.

---

## R2 — Comando único de verificación

**Decisión**: script `"verify"` en cada `package.json`
(`eslint . && tsc --noEmit && vitest run`) más `scripts/verify.mjs` en la
raíz que corre `npm run verify` en `backend/` y `frontend/` en ese orden y
propaga el código de salida. Node sin dependencias, usa `node:child_process`.

**Razón**: respeta la regla de AGENTS.md de que **no existe `package.json`
raíz ni workspaces** (todo corre dentro de cada carpeta); un script de Node
es portable en Windows y Linux, a diferencia de un `Makefile` o de
`npm --prefix` (que no propagaba bien los errores en todas las versiones).

**Alternativas descartadas**:
- *Root `package.json` con workspaces*: cambia la estructura del proyecto y
  contradice AGENTS.md.
- *PowerShell/bash*: no es portable entre Windows (desarrollo) y Linux (CI).
- *`concurrently` u otro paquete*: dependencia nueva innecesaria (§22).

---

## R3 — Cómo ejecuta el CI las pruebas del backend (base de datos)

**Decisión**: servicio `mysql:8` en el workflow con health-check, y el
trabajo ejecuta en orden: crear la base `cafe_itsh`, aplicar
`docs/001_crear_esquema.sql` + `docs/002_seed_inicial.sql`, `npm run migrate`
(idempotente, registra el baseline) y luego `npm test`. Variables
`DATABASE_URL` y `JWT_SECRET` inyectadas desde `env` del workflow (secretos
del repositorio o valores efímeros de prueba sólo si el repo no tiene
secretos configurados; en ningún caso en el repositorio).

**Razón**: las pruebas de integración son 8 de 9 archivos y necesitan el
esquema completo; el runner de GitHub no trae MySQL; un servicio efímero por
trabajo evita interferencias entre ramas y respeta el patrón actual de
limpieza (`test-*@example.com`).

**Alternativas descartadas**:
- *SQLite / mocks*: cambiaría el motor real (mysql2) y la validación de
  SQL existente; riesgo alto para un gate de calidad.
- *Base externa compartida*: acoplamiento, secretos permanentes y datos
  sucios entre ramas.
- *Ejecutar pruebas sin base (omitirlas)*: dejaría el gate incompleto
  (FR-003).

---

## R4 — Chequeo de secretos en CI

**Decisión**: paso shell en el workflow que falla si
`git ls-files | grep -E '(^|/)\.env$'` encuentra un archivo `.env`
versionado (distinto de `.env.example`). Sin dependencias nuevas.

**Razón**: la regla §21 prohíbe versionar `.env`; el chequeo es determinista
y no requiere instalaciones externas.

**Alternativas descartadas**:
- *gitleaks / trufflehog*: herramientas externas con binarios y
  configuración propias; justificable sólo si se busca historial completo
  (aquí el historial ya fue saneado, commit `b26999a`).
- *No chequear*: dejaría la regla sin verificación automática (FR-005).

---

## R5 — Cobertura de pruebas en esta fase

**Decisión**: **fuera de alcance** en el sprint 6. Se mide en el sprint 11
(`specs/013-qa-proceso/`) como reporte sin umbral.

**Razón**: la constitución y `docs/reglas.md` §20 dicen hoy "no se fija
cobertura mínima obligatoria"; agregar `@vitest/coverage-v8` es una
dependencia nueva que requiere justificación explícita, y el valor de esta
fase es tener el gate funcionando primero.

**Alternativas descartadas**:
- *Cobertura con umbral ahora*: exigiría enmendar la constitución en este
  sprint y retrasaría el gate.

---

## R6 — Rama y ciclo speckit

**Decisión**: rama `spec/008-qa-foundation` creada desde
`spec/007-ui-redesign` (que contiene el trabajo de calidad en curso), con
los mismos artefactos speckit (`spec.md`, `plan.md`, `research.md`,
`data-model.md`, `contracts/`, `quickstart.md`, `tasks.md`).

**Razón**: mantiene la convención del proyecto (una rama por spec) y permite
versionar primero las correcciones de pruebas y documentos que están sin
commitear (FR-006), que pertenecen al cierre del trabajo en curso.

**Alternativas descartadas**:
- *Trabajar directo sobre `spec/007-ui-redesign`*: mezclaría el rediseño de
  UI con la base de calidad en el mismo historial.
- *Rama desde `main`*: perdería los fixes de pruebas sin commitear que la
  matriz describe.
