# Roadmap de Sprints — Sistema de Pedidos Anticipados Cafetería ITSH

**Creado**: 2026-10-11
**Spec maestra**: `specs/001-cafeteria-preorder-system/spec.md`
**Duración**: 5 sprints × 2 semanas (10 semanas)

> **Actualización 2026-11-02**: el MVP (sprints 1–5) está completo. Los
> sprints 6–11 corresponden al **roadmap de aseguramiento de calidad** (ver
> más abajo), en la misma estructura speckit y con la misma cadencia de demo.

Cada sprint es una feature independiente de speckit con su propio directorio
`specs/00N-*/`. La spec maestra (001) define el producto completo; cada spec de
sprint es un subconjunto trazable de ella (historias, FRs y criterios).

## Ciclo speckit por sprint

1. Arrancar la feature del sprint: trabajar sobre `specs/00N-*/spec.md`.
2. Generar el plan: `/speckit.plan` → `plan.md` (+ research, data-model,
   contracts) y **revisarlo** antes de continuar.
3. Generar tareas: `/speckit.tasks` → `tasks.md`.
4. Implementar siguiendo `tasks.md`, con commits pequeños y tests (Vitest).
5. **Demo del sprint**: validar los criterios de aceptación con la patrocinadora.
6. Actualizar este documento marcando el sprint como completado.

## Vista general

| Sprint | Semanas (est.) | Feature speckit | Historias/FRs de 001 | Demo del sprint |
|---|---|---|---|---|
| 1 | 1–2 (2026-10-13 → 10-26) | `specs/002-foundation-auth/` | US5 (usuarios) + FR-001…FR-005 | Login por rol y rutas protegidas |
| 2 | 3–4 (2026-10-27 → 11-09) | `specs/003-menu-management/` | US5 (menú) + US1 (consulta) | Admin publica el menú; alumno lo consulta en el móvil |
| 3 | 5–6 (2026-11-10 → 11-23) | `specs/004-advance-orders-payment/` | US1 | Flujo alumno: menú → pedido → pago anticipado |
| 4 | 7–8 (2026-11-24 → 12-07) | `specs/005-counter-kitchen/` | US4 + US2 (cocina) | Cajero captura mostrador; cocina procesa en pantalla |
| 5 | 9–10 (2026-12-08 → 12-21) | `specs/006-order-tracking-notifications/` | US3 + US2 (notificación) + pulido | Notificación de pedido listo + demo completa |

> Las fechas son estimadas; se ajustan al calendario real del plantel.

---

## Sprint 1 — Fundamentos y autenticación ✅ COMPLETADO (demo aprobada 2026-10-13)

**Feature**: `specs/002-foundation-auth/`

**Objetivo**: base técnica y de seguridad: base de datos, login con JWT, y el
esqueleto del frontend (app única con rutas por rol).

**Entra**:
- Framework de migraciones y esquema inicial de `usuarios` y `roles` en MySQL.
- Backend: `POST /api/auth/login`, `POST /api/auth/register` (solo clientes),
  JWT + bcrypt, middleware de autorización por rol.
- Seed de cuentas operativas iniciales (admin, cajero, cocinero).
- Frontend: scaffold Vite + React + TS, Tailwind + shadcn/ui, React Router con
  `/login` y `/registro` (públicas); `/admin`, `/caja`, `/cocina`, `/menu`,
  `/mis-pedidos` protegidas.
- Pantalla de login y layouts por rol.
- Gestión de usuarios operativos (US5, parte de usuarios): el administrador
  crea, edita y deshabilita cajeros y cocineros desde `/admin`.

**No entra**: menú, pedidos, pagos y notificaciones. El registro de clientes
(alumno/docente) sí entra.

**Criterios de aceptación**:
- Credenciales válidas de cada rol redirigen a su ruta; inválidas muestran
  mensaje claro sin revelar si la cuenta existe.
- Acceder a una ruta sin sesión redirige a `/login`; con otro rol, se deniega.
- Las contraseñas nunca viajan ni se almacenan en texto plano.
- `npm test` y `npm run typecheck` en verde (backend y frontend).

---

## Sprint 2 — Gestión de menú y consulta de menú ✅ COMPLETADO (demo aprobada 2026-10-13)

**Feature**: `specs/003-menu-management/`

**Objetivo**: el admin publica el menú del día y los alumnos/docentes lo
consultan.

**Entra**:
- Migraciones: tablas `platillos`, `menu_del_dia`, especiales del día.
- Backend CRUD: platillos, menú del día, especiales, precios, disponibilidad.
- Frontend admin (`/admin`): gestión de platillos y menú del día.
- Frontend clientes (`/menu`): consulta del menú con precios, disponibilidad y
  especiales del día.

**No entra**: pedidos, carrito, pagos.

**Criterios de aceptación**:
- Un platillo marcado no disponible aparece identificado como tal y no se puede
  seleccionar para pedir.
- Los cambios de precio/disponibilidad se reflejan de inmediato en `/menu`.
- El menú se consulta sin esperas perceptibles en horario de receso (móvil).

---

## Sprint 3 — Pedido anticipado y pago ✅ COMPLETADO (demo aprobada 2026-10-13)

**Feature**: `specs/004-advance-orders-payment/`

**Objetivo**: el alumno/docente completa el pedido anticipado con pago; nacen
los estados de pedido.

**Entra**:
- Migraciones: `pedidos`, `detalle_pedidos`, `pagos`; estados `Pendiente` y
  `Pagado`.
- Backend: creación de pedido anticipado (validación de 10 minutos, platillos
  disponibles, total), integración de pago externo (sin datos de tarjeta),
  detalle del pedido creado.
- Frontend clientes: carrito/confirmación, flujo de pago, confirmación con
  folio y estado del pedido.

**No entra**: listado completo de "mis pedidos" con seguimiento en vivo (sprint
5), mostrador, cocina.

**Criterios de aceptación**:
- No se admite un pedido con menos de 10 minutos de anticipación (mensaje claro).
- Un pedido sin pago confirmado no pasa a `Pagado`.
- El pedido registrado se envía a cocina en estado `Pagado`.

---

## Sprint 4 — Mostrador (cajero) y cocina ✅ COMPLETADO (demo aprobada 2026-10-13)

**Feature**: `specs/005-counter-kitchen/`

**Objetivo**: operación interna: captura de mostrador y pantalla de cocina con
todos los estados operativos.

**Entra**:
- Migraciones: extensión de estados (`En preparación`, `Listo`, `Entregado`,
  `Cancelado`) y flujo de transiciones.
- Backend: pedidos de mostrador (captura + cobro), transiciones de estado con
  validación del flujo, lista de pedidos para cocina.
- Frontend cajero (`/caja`): captura rápida de pedidos presenciales y cobro.
- Frontend cocina (`/cocina`): KDS con pedidos entrantes (anticipados y de
  mostrador), orden de preparación, botones "Iniciar preparación" y "Marcar
  listo", actualización sin recarga manual.

**No entra**: notificaciones a clientes, listado "mis pedidos".

**Criterios de aceptación**:
- Cajero y pedidos anticipados operan a la vez sin interferirse.
- Cocina ve ambos orígenes en una sola pantalla, ordenados por llegada.
- Transiciones inválidas (saltos de estado, cambiar Entregado/Cancelado) se
  rechazan.

---

## Sprint 5 — Seguimiento, notificaciones y pulido ✅ COMPLETADO (demo final aprobada 2026-10-13)

**Feature**: `specs/006-order-tracking-notifications/`

**Objetivo**: el cliente ve el recorrido completo de su pedido y recibe el aviso
de listo; cierre del MVP con pruebas y demo final.

**Entra**:
- Frontend clientes (`/mis-pedidos`): lista de pedidos con estado y detalle.
- Notificación de pedido listo (módulo separado de la lógica de pedidos; en-app
  como mínimo, servicio externo si está disponible).
- Pulido de UI según DESIGN.md, pruebas críticas pendientes (pagos, estados,
  permisos), preparación de la demo final ante la patrocinadora.

**No entra**: funcionalidades fuera del alcance del MVP (reseñas, inventario,
puntos de lealtad).

**Criterios de aceptación**:
- El 100 % de los pedidos que llegan a `Listo` genera el aviso al usuario.
- Flujo completo demostrable: menú → selección → pedido → pago → cocina →
  preparación → listo → notificación → recogida.
- Pruebas de estados, pagos y permisos en verde (Vitest).

---

## Roadmap de Aseguramiento de Calidad — sprints 6–11

**Creado**: 2026-11-02 · **Specs**: `specs/008` a `specs/013` · **Duración estimada**: 6 sprints × 1 semana

Cada sprint de calidad sigue el mismo ciclo speckit (spec → plan → tasks →
implementar → demo → actualizar este documento) y aporta **evidencia** a
`docs/Matriz_de_calidad.md` (una sola matriz para todo el proyecto). No se
agrega funcionalidad nueva: sólo aseguramiento, verificación y proceso.

| Sprint | Semanas (est.) | Feature speckit | Alcance | Demo del sprint |
|---|---|---|---|---|
| 6 | 1 (2026-11-02 → 11-08) | `specs/008-qa-foundation/` | Gate de verificación + CI | PR verde en GitHub Actions |
| 7 | 2 (2026-11-09 → 11-15) | `specs/009-qa-cliente/` | Rol cliente | Flujo cliente con matriz aprobada |
| 8 | 3 (2026-11-16 → 11-22) | `specs/010-qa-caja/` | Rol cajero | Cobro concurrente + evidencia |
| 9 | 4 (2026-11-23 → 11-29) | `specs/011-qa-cocina/` | Rol cocinero | KDS verificado + evidencia |
| 10 | 5 (2026-11-30 → 12-06) | `specs/012-qa-admin/` | Rol administrador | CRUD validado + evidencia |
| 11 | 6 (2026-12-07 → 12-13) | `specs/013-qa-proceso/` | Cobertura + proceso permanente | `docs/calidad.md` vigente |

**Gate de cierre de cada sprint de calidad**: `node scripts/verify.mjs` en
verde (ambos paquetes) + CI verde + fila de la matriz con estado y evidencia +
commit de este documento.

---

## Sprint 6 — Base de calidad y CI (spec 008)

**Estado**: ✅ COMPLETADO el 2026-11-03 — demo: gate `verify` en verde local
(backend 89 + frontend 89 pruebas) y CI en verde (run 41771104295, 3/3 jobs).

**Feature**: `specs/008-qa-foundation/`

**Objetivo**: que la verificación sea automática y única; cerrar el trabajo de
calidad en curso.

**Entra**:
- Commitear el trabajo en curso: fixes de `pedidos.test.ts` (borde 9/11
  minutos, cobros simultáneos), `cocina.test.ts` (búsqueda por id) y los docs
  `Matriz_de_calidad.md` + `Requerimientos_MVP.md`.
- Cerrar en la matriz: D-01 (por aclaración), D-02, D-03 y O-01.
- Script `verify` en `backend/package.json` y `frontend/package.json` +
  `scripts/verify.mjs` raíz que corre ambos paquetes.
- `.github/workflows/ci.yml`: job `frontend` (lint + typecheck + test) y job
  `backend` (migrate + seed + verify); chequeo de secretos no trackeados
  (reglas §21). Corre en el runner self-hosted local `cafeteria-itsh-win`
  (Windows + MySQL de la máquina vía `runner/.env`) mientras la cuenta de
  GitHub esté bloqueada por facturación; al desbloquearla volver a
  `ubuntu-latest` con servicio `mysql:8` (comentario al inicio del workflow).
- Actualizar `AGENTS.md`: secuencia `verify` y conteo real de pruebas.

**No entra**: pruebas nuevas por rol, cobertura de código.

**Criterios de aceptación**:
- `node scripts/verify.mjs` en verde local (backend y frontend).
- CI verde en un PR real de GitHub.
- Matriz sin defectos abiertos (D-01…D-03 y O-01 cerrados con fecha).

---

## Sprint 7 — QA del cliente (spec 009)

**Estado**: ✅ COMPLETADO el 2026-11-04 — PR #3 integrado a `main`; demo:
gate y CI en verde (3/3 jobs) y seis capturas verificadas en
`docs/evidencias/cliente/`.

**Feature**: `specs/009-qa-cliente/`

**Objetivo**: cerrar con evidencia todo lo que ve y hace el alumno/docente.

**Entra**:
- Backend: prueba del fallo del aviso (el pedido queda en `Listo`, O-02);
  403 del cliente contra rutas de caja, cocina y administración; respuestas de
  error con formato `{ error: { code, message } }` sin trazas.
- Frontend: estados vacíos/error de `MenuPage` y `MisPedidosPage`;
  redirección por rol con sesión equivocada; total del carrito.
- Checklist manual §19 (áreas táctiles ≥44 px, mensajes claros) y capturas en
  `docs/evidencias/cliente/`.
- Filas RF-01, RF-02 y RF-04 de la matriz → **Aprobado**.

**Criterios de aceptación**: `verify` en verde, O-02 cerrado, capturas del
flujo completo, matriz del rol aprobada.

---

## Sprint 8 — QA del cajero (spec 010)

**Feature**: `specs/010-qa-caja/`

**Objetivo**: verificar cobro, entregas y permisos del mostrador.

**Entra**:
- Backend: 409 por cobro repetido, pedido cancelado o ya entregado; 400 por
  monto inválido; 403 a no-cajeros; transiciones inválidas.
- Frontend: manejo de 409/400 en `CajaPage` y `EntregasPage`.
- Capturas en `docs/evidencias/caja/`; fila RF-03 con la evidencia de la
  concurrencia.

**Criterios de aceptación**: pruebas de concurrencia y permisos en verde,
evidencia completa, matriz aprobada.

---

## Sprint 9 — QA del cocinero (spec 011)

**Feature**: `specs/011-qa-cocina/`

**Objetivo**: verificar la cola de cocina y sus permisos.

**Entra**:
- Backend: cola con `fecha_recoleccion` (RF-05), 409 en transiciones
  inválidas, 403 a no-cocineros, orden por llegada y exclusión de `Pendiente`.
- Frontend: `CocinaPage` — cola, estados vacíos, áreas táctiles.
- Capturas en `docs/evidencias/cocina/`; RF-05 → **Aprobado**.

**Criterios de aceptación**: cola verificada con ambos orígenes, matriz
aprobada.

---

## Sprint 10 — QA del administrador (spec 012)

**Feature**: `specs/012-qa-admin/`

**Objetivo**: verificar CRUD de platillos, menú y usuarios con permisos.

**Entra**:
- Backend: platillo/menú duplicado → 409; campos inválidos → 400 (zod); rol
  inválido → 400; 403 a no-administradores; publicación de menú.
- Frontend: validación de formularios, estados vacíos, confirmación de
  borrado.
- Capturas en `docs/evidencias/admin/`.

**Criterios de aceptación**: CRUD cubierto con permisos, matriz aprobada.

---

## Sprint 11 — Proceso QA permanente (spec 013)

**Feature**: `specs/013-qa-proceso/`

**Objetivo**: que la calidad siga midiéndose y verificándose después del MVP.

**Entra**:
- `@vitest/coverage-v8` en ambos paquetes → **reporte en CI sin umbral**
  (dependencia dev justificada; `docs/reglas.md` §20 sólo se amplía para decir
  que la cobertura se *reporta*).
- `docs/calidad.md`: Definición de Terminado, checklist por tarea y ciclo de
  la matriz por sprint.
- Actualizar `AGENTS.md` con el flujo de calidad vigente.

**Criterios de aceptación**: reporte de cobertura visible en CI,
`docs/calidad.md` aprobado por la patrocinadora, sin requisitos sin evidencia.

---

## Reglas de trazabilidad

- Cada spec de sprint referencia las user stories y FRs de la spec maestra 001;
  no se agregan funcionalidades nuevas sin actualizar primero la spec maestra y
  `docs/reglas.md` (§27 Alcance).
- Un sprint no arranca hasta que el anterior tenga su demo aprobada.
- Los sprints son la unidad de planificación; la constitución
  (`.specify/memory/constitution.md`) gana en cualquier conflicto.
