# Feature Specification: Gestión de Menú y Consulta de Menú (Sprint 2)

**Feature Branch**: `003-menu-management`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Sprint 2 — Gestión de menú y consulta de menú:
el administrador publica el menú del día (platillos, precios, disponibilidad,
especiales) y los alumnos/docentes lo consultan en su pantalla, sin esperas
perceptibles en horario de receso." Fuente: `docs/sprints.md` (Sprint 2,
semanas est. 2026-10-27 → 2026-11-09). Subconjunto trazable de la spec
maestra `specs/001-cafeteria-preorder-system/spec.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El administrador publica el menú del día (Priority: P1)

Como administrador, creo y modifico los platillos, el menú del día, los
especiales del día, los precios y la disponibilidad; mis cambios se reflejan
de inmediato para los usuarios finales, y un platillo marcado como no
disponible queda identificado como tal y no puede seleccionarse para pedir.

**Why this priority**: Es la operación que alimenta al sistema; sin menú
publicado el alumno no tiene nada que consultar ni qué pedir en los sprints
posteriores.

**Independent Test**: Publicando un menú con dos platillos y verificando que
aparece en la consulta del cliente; cambiando un precio y marcando un
platillo como no disponible, y verificando de inmediato ambos efectos en la
vista del cliente.

**Acceptance Scenarios**:

1. **Given** el administrador en sesión, **When** crea o edita un platillo
   con nombre y precio, **Then** el platillo queda disponible en el menú.
2. **Given** un platillo existente, **When** el administrador cambia su
   precio, **Then** los clientes ven el precio nuevo en su siguiente
   consulta del menú.
3. **Given** un platillo disponible, **When** el administrador lo marca como
   no disponible, **Then** los clientes lo ven identificado como no
   disponible y no pueden seleccionarlo.
4. **Given** un especial del día, **When** el administrador lo crea o lo
   modifica, **Then** aparece en la consulta del menú del día.
5. **Given** un usuario sin sesión o con rol distinto de administrador,
   **When** intenta acceder a la gestión de menú, **Then** el acceso se le
   deniega.

---

### User Story 2 - El alumno o docente consulta el menú (Priority: P2)

Como alumno o docente, consulto el menú del día con platillos, precios,
disponibilidad y especiales del día en mi pantalla, en el móvil o la
computadora, con rapidez incluso durante el receso.

**Why this priority**: Es la vista que da valor visible al usuario final y
prepara el pedido del Sprint 3; puede probarse con un menú ya publicado.

**Independent Test**: Consultando `/menu` desde un teléfono en horario de
receso con un menú cargado y verificando que la información (precios,
disponibilidad, especiales) se muestra completa y sin esperas perceptibles.

**Acceptance Scenarios**:

1. **Given** un menú publicado para el día, **When** el cliente consulta el
   menú, **Then** ve platillos, precios, disponibilidad y especiales del día.
2. **Given** un platillo marcado como no disponible, **When** el cliente
   consulta el menú, **Then** ve ese platillo identificado como no
   disponible.
3. **Given** un cambio reciente de precio o disponibilidad, **When** el
   cliente vuelve a consultar el menú, **Then** ve la información actualizada
   sin recargar datos obsoletos.
4. **Given** un cliente en un teléfono, **When** consulta el menú durante el
   receso, **Then** la información se muestra sin esperas perceptibles.
5. **Given** un usuario sin sesión, **When** intenta consultar el menú
   protegido, **Then** se le redirige al inicio de sesión.

---

### Edge Cases

- No existe menú cargado para el día: el cliente ve un aviso claro y
  comprendible (por ejemplo, "Menú no disponible hoy").
- Todos los platillos del día están no disponibles: el menú se muestra
  completo pero identificando que nada está disponible para pedir.
- El administrador elimina un platillo que ya pertenece a un menú publicado:
  la consulta del menú no muestra errores ni información interna.
- Dos administradores modifican el mismo precio casi al mismo tiempo: queda
  un solo precio válido y consistente.
- Fallo de conexión durante el receso: el cliente ve un mensaje claro de
  reintento, sin trazas ni información del servidor.
- Platillo creado sin precio o con precio inválido: el sistema lo rechaza
  con validación clara, en la interfaz y en el servidor.

## Requirements *(mandatory)*

### Trazabilidad a la spec maestra (001)

| Elemento de 001 | Cobertura en este sprint |
|---|---|
| US5 (parte: menú, platillos, especiales, precios, disponibilidad) | User Story 1 |
| US1 (parte: consulta del menú y especiales) | User Story 2 |
| FR-006 … FR-009 | Implementación completa |
| FR-020 (responsividad), FR-025 (respuesta en receso) | Aplicados a la consulta del menú |
| FR-010 … FR-019 (pedidos, cocina, notificaciones) | Fuera de este sprint |

### Functional Requirements

**Menú**

- **FR-006** *(de 001)*: El administrador MUST poder crear y modificar el
  menú diario, los platillos, los especiales del día, los precios y la
  disponibilidad.
- **FR-007** *(de 001)*: Los cambios de menú MUST reflejarse de inmediato
  para los usuarios finales.
- **FR-008** *(de 001)*: Un platillo marcado como no disponible MUST NO
  poder seleccionarse en pedidos nuevos.
- **FR-009** *(de 001)*: El alumno o docente MUST poder consultar el menú
  del día con platillos, precios, disponibilidad y especiales del día.

**Calidad y seguridad de la experiencia**

- **FR-020** *(de 001, parcial)*: La interfaz MUST ser responsiva en móvil y
  computadora.
- **FR-025** *(de 001)*: El sistema MUST responder adecuadamente en horarios
  de mayor demanda y MUST permitir consultar el menú con rapidez durante los
  recesos.

*Nota*: en este sprint la indisponibilidad de un platillo se refleja como
información visible en la consulta; la validación de "no seleccionable" al
crear un pedido se verifica de extremo a extremo en el Sprint 3 (FR-010,
FR-011), donde nace el pedido.

### Out of Scope (Sprint 2)

- Carrito, pedidos y pagos (Sprint 3).
- Captura de mostrador y pantalla de cocina (Sprint 4).
- "Mis pedidos" y notificaciones (Sprint 5).
- Funcionalidades fuera del alcance del MVP (reseñas, inventario, puntos de
  lealtad).

### Key Entities

- **Platillo**: producto ofrecido; nombre, precio, disponibilidad y a qué
  menú pertenece.
- **Menú del día**: conjunto de platillos y especiales ofrecidos en una
  fecha; los cambios aquí se reflejan a los clientes.
- **Especial del día**: destacado del menú con la misma información de precio
  y disponibilidad que un platillo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-S2-01**: Los cambios de precio y disponibilidad publicados por el
  administrador son visibles al cliente en menos de 1 minuto en el 100 % de
  los casos probados.
- **SC-S2-02**: El 100 % de los platillos marcados como no disponibles se
  muestran identificados como tales y no son seleccionables para pedir.
- **SC-S2-03**: Durante el receso, el 95 % de las consultas del menú se
  muestran en menos de 2 segundos en un teléfono.
- **SC-S2-04**: El flujo publicar menú → verlo como cliente se completa en
  menos de 3 minutos durante la demo del sprint.
- **SC-S2-05**: El 100 % de las pruebas automatizadas del sprint pasan antes
  de la demo.

*De la spec maestra, contribución*: SC-005 (consultas de menú en menos de
2 segundos) y, parcialmente, SC-002 (menor espera en caja al consultar
antes de ir).

## Assumptions

- Existe un solo menú activo por día, preparado con anticipación por el
  administrador; el sistema no calcula automáticamente el menú.
- Los precios están expresados en pesos mexicanos (MXN) y ya incluyen
  impuestos; el sistema no calcula impuestos por separado en el MVP.
- El catálogo de platillos se crea y se mantiene desde este sprint; su
  contenido inicial se captura manualmente por el administrador.
- El menú del día anterior permanece consultable solo como referencia
  histórica no requerida en este sprint (queda fuera de alcance).
- Las fechas de este sprint (2026-10-27 → 2026-11-09) son estimadas y se
  ajustan al calendario real del plantel.
- Se aplican las suposiciones generales de la spec maestra 001.
