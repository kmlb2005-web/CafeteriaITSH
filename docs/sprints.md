# Roadmap de Sprints — Sistema de Pedidos Anticipados Cafetería ITSH

**Creado**: 2026-10-11
**Spec maestra**: `specs/001-cafeteria-preorder-system/spec.md`
**Duración**: 5 sprints × 2 semanas (10 semanas)

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

## Sprint 1 — Fundamentos y autenticación

**Feature**: `specs/002-foundation-auth/`

**Objetivo**: base técnica y de seguridad: base de datos, login con JWT, y el
esqueleto del frontend (app única con rutas por rol).

**Entra**:
- Framework de migraciones y esquema inicial de `usuarios` y `roles` en MySQL.
- Backend: `POST /api/auth/login`, `POST /api/auth/register` (solo clientes),
  JWT + bcrypt, middleware de autorización por rol.
- Seed de cuentas operativas iniciales (admin, cajero, cocinero).
- Frontend: scaffold Vite + React + TS, Tailwind + shadcn/ui, React Router con
  `/login`, `/admin`, `/caja`, `/cocina`, `/menu`, `/mis-pedidos` protegidas.
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

## Sprint 2 — Gestión de menú y consulta de menú

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

## Sprint 3 — Pedido anticipado y pago

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

## Sprint 4 — Mostrador (cajero) y cocina

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

## Sprint 5 — Seguimiento, notificaciones y pulido

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

## Reglas de trazabilidad

- Cada spec de sprint referencia las user stories y FRs de la spec maestra 001;
  no se agregan funcionalidades nuevas sin actualizar primero la spec maestra y
  `docs/reglas.md` (§27 Alcance).
- Un sprint no arranca hasta que el anterior tenga su demo aprobada.
- Los sprints son la unidad de planificación; la constitución
  (`.specify/memory/constitution.md`) gana en cualquier conflicto.
