# Feature Specification: Base de Aseguramiento de Calidad y CI (Sprint 6)

**Feature Branch**: `008-qa-foundation`

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "Aplicar el aseguramiento de la calidad del
software en el proyecto por fases (rol por rol). Esta primera fase entrega la
base: verificación única de calidad, integración continua en GitHub, cierre
del trabajo de calidad en curso (matriz de calidad y sus defectos) y
documentación actualizada para agentes. Sin funcionalidad nueva y sin
dependencias nuevas."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verificación única y automática (Priority: P1)

Como desarrollador del proyecto, quiero un solo comando que ejecute toda la
verificación de calidad (lint, tipos y pruebas) en ambos paquetes, y que
GitHub la ejecute automáticamente en cada pull request, para detectar
regresiones antes de integrar y no depender de recordar seis comandos
manuales.

**Why this priority**: sin verificación automática, cada sprint de calidad
posterior dependería de que alguien ejecute todo a mano; es la base de todo el
roadmap de aseguramiento.

**Independent Test**: puede probarse sin funcionalidad de negocio: ejecutar el
comando único en una copia limpia del repositorio y observar que corre lint,
typecheck y pruebas de backend y frontend; abrir un PR de prueba en GitHub y
verificar que la ejecución aparece en verde y que falla si se introduce un
error de tipos a propósito.

**Acceptance Scenarios**:

1. **Given** una copia limpia del repositorio con las dependencias
   instaladas, **When** se ejecuta el comando único de verificación, **Then**
   corre lint, typecheck y pruebas de `backend/` y `frontend/`, y termina en
   verde si todo pasa.
2. **Given** el comando único, **When** alguna prueba falla, **Then** el
   comando termina en código distinto de cero y señala el paquete y la fase
   que falló.
3. **Given** un pull request, **When** GitHub Actions lo procesa, **Then**
   corren los dos trabajos (frontend y backend) y el PR queda bloqueado si
   alguno falla.
4. **Given** el trabajo de backend en CI, **When** arranca, **Then** levanta
   una base MySQL, aplica el esquema y las migraciones, y ejecuta las pruebas
   de integración contra esa base.

---

### User Story 2 - Cierre del trabajo de calidad en curso (Priority: P2)

Como patrocinadora del proyecto, quiero que el trabajo de calidad ya
realizado (matriz de calidad y correcciones de pruebas) quede versionado y
que la matriz no tenga defectos abiertos, para poder auditar el estado real
de calidad del MVP.

**Why this priority**: hay correcciones de pruebas y dos documentos de
calidad sin commitear; dejarlos abiertos impediría afirmar que la base de
calidad está cerrada.

**Independent Test**: puede probarse revisando el repositorio: los archivos
están versionados, la matriz lista los defectos D-01, D-02, D-03 y la
observación O-01 con estado cerrado, fecha y solución, y las pruebas
corregidas pasan.

**Acceptance Scenarios**:

1. **Given** las correcciones de pruebas en el árbol de trabajo, **When** se
   ejecuta la verificación, **Then** todas las pruebas pasan (incluidos los
   casos borde de 9 y 11 minutos y los cobros simultáneos).
2. **Given** la matriz de calidad, **When** se revisa, **Then** cada fila
   tiene requisito, criterio, prueba, resultado y evidencia, y no quedan
   defectos en estado abierto.
3. **Given** los documentos de calidad, **When** se clona el repositorio,
   **Then** están versionados y legibles.

---

### User Story 3 - Guía de verificación para agentes y personas (Priority: P3)

Como desarrollador (humano o agente) que retoma el proyecto, quiero que la
documentación de trabajo describa exactamente cómo verificar el proyecto y
cuántas pruebas existen, para no seguir instrucciones obsoletas.

**Why this priority**: `AGENTS.md` hoy dice que existe "un solo test" cuando
hay 29 archivos de prueba; instrucciones obsoletas hacen que se verifique
mal.

**Independent Test**: puede probarse leyendo `AGENTS.md`: los comandos
descritos existen en los `package.json` y el conteo de pruebas coincide con
la ejecución real.

**Acceptance Scenarios**:

1. **Given** `AGENTS.md`, **When** se sigue la secuencia de verificación que
   describe, **Then** los comandos existen y corren sin error.
2. **Given** el conteo de pruebas documentado, **When** se ejecutan las
   pruebas, **Then** coincide con lo reportado.

---

### Edge Cases

- ¿Qué pasa si la base MySQL de CI no está disponible o tarda en estar
  sana? (el trabajo falla de forma visible con reintento manual; no se
  ejecutan pruebas contra una base incompleta).
- ¿Qué pasa si las migraciones fallan en CI? (el trabajo se detiene antes de
  las pruebas y reporta el error).
- ¿Qué pasa si alguien intenta versionar `backend/.env`? (el chequeo de
  secretos del CI falla y el PR queda bloqueado).
- ¿Qué pasa si sólo falla un paquete? (el trabajo correspondiente falla; el
  otro informa de forma independiente para localizar rápido).
- ¿Qué pasa si el árbol de trabajo tiene cambios sin commitear? (la
  verificación local sigue corriendo sobre ellos; el CI sólo evalúa lo
  versionado).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada paquete (`backend/` y `frontend/`) MUST exponer un único
  comando de verificación que ejecute en orden lint, typecheck y pruebas, y
  que termine en error si cualquiera falla.
- **FR-002**: El repositorio MUST exponer un comando raíz que ejecute la
  verificación de ambos paquetes en una sola pasada.
- **FR-003**: GitHub Actions MUST ejecutar en cada pull request dos
  trabajos independientes: uno para `frontend/` (lint, typecheck, pruebas) y
  otro para `backend/` (lint, typecheck, pruebas contra una base MySQL
  efímera con el esquema y las migraciones aplicados).
- **FR-004**: El trabajo de backend en CI MUST obtener la configuración de
  base y de JWT exclusivamente de secretos del repositorio o variables del
  workflow; MUST NO existir ningún archivo de entorno real versionado.
- **FR-005**: CI MUST incluir un chequeo que falle si `backend/.env` (u
  otro archivo de entorno real) aparece trackeado en git.
- **FR-006**: El trabajo de calidad en curso MUST quedar versionado: las
  correcciones de pruebas (casos borde 9/11 minutos, cobros simultáneos,
  búsqueda por id en la cola) y los documentos `docs/Matriz_de_calidad.md` y
  `docs/Requerimientos_MVP.md`.
- **FR-007**: `docs/Matriz_de_calidad.md` MUST quedar sin defectos abiertos:
  D-01, D-02, D-03 y O-01 con estado, fecha y solución registrados.
- **FR-008**: `AGENTS.md` MUST describir la secuencia real de verificación
  (comandos que existen) y el conteo real de archivos y pruebas.
- **FR-009**: Esta feature MUST agregar sólo herramientas de verificación ya
  disponibles en los paquetes: MUST NO agregarse dependencias nuevas
  (reglas §22) ni funcionalidad de negocio (§27).

### Key Entities

Esta feature no incorpora entidades de datos: opera sobre la configuración de
los paquetes, el workflow de CI y la documentación del proyecto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un solo comando verifica el proyecto completo en local y su
  resultado coincide con el del CI (mismo orden de fases, mismo alcance).
- **SC-002**: El 100 % de los pull requests ejecuta automáticamente lint,
  typecheck y pruebas de ambos paquetes antes de poder integrarse.
- **SC-003**: La matriz de calidad reporta 0 defectos abiertos y 0
  requisitos sin prueba asociada.
- **SC-004**: `AGENTS.md` no contiene comandos inexistentes ni conteos de
  pruebas desactualizados (verificable comparando contra la ejecución real).
- **SC-005**: No se agrega ninguna dependencia nueva a los `package.json`.

## Assumptions

- El repositorio en GitHub (`kmlb2005-web/CafeteriaITSH`) permite workflows
  de GitHub Actions gratuitos para repositorios públicos.
- Las pruebas de integración del backend corren en serie y comparten la base
  del workflow (patrón actual `fileParallelism: false`); una base efímera por
  trabajo evita interferencias entre ramas.
- La semilla de cuentas operativas no es necesaria para las pruebas actuales
  (las pruebas crean sus propios datos con correo `test-*@example.com` y los
  limpian).
- La verificación local completa sigue requiriendo MySQL en vivo para el
  backend (regla existente del proyecto); el CI lo resuelve con un servicio.
- El cierre de D-01 es por aclaración del criterio (como quedó registrado en
  `docs/Requerimientos_MVP.md`), no por cambio de código.
