# Implementation Plan: Rediseño de Interfaz por Rol (UI/UX)

**Branch**: `007-ui-redesign` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-ui-redesign/spec.md`

## Summary

Rediseñar la interfaz de las cuatro interfaces de rol (admin, caja, cocina,
cliente) según los documentos `design/diseño-operativo.md`,
`design/diseño-cocina.md` y `design/diseño-cliente.md`: sustituir la
navegación por pestañas horizontales por un **menú lateral (drawer)** en los
cuatro roles y una **barra inferior** en caja y cliente, más el contenido
rediseñado de cada pantalla (inicio admin con acciones rápidas, catálogo de
caja con búsqueda/categorías/stepper y barra flotante de cobro, tablero KDS
con tiempo transcurrido y frescura de datos, y flujo de cliente con filtros
y aviso de pedido listo). **Es un rediseño de solo interfaz**: se conservan
rutas, roles, reglas de negocio, endpoints y componentes `ui/` existentes.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend React 19)

**Primary Dependencies**: React 19, Vite 8, Tailwind CSS v4 (tokens en
`src/index.css`), react-router v7, Radix `@radix-ui/react-slot` ya presente.
**Sin dependencias nuevas** (§22): drawer y bottom bar se construyen con
Tailwind + React Router.

**Storage**: N/A de datos nuevos; se conserva el carrito persistente en
`localStorage` (`src/lib/carrito.ts`).

**Testing**: Vitest + Testing Library (`npm test` en `frontend/`); tests
junto a cada componente/página (`*.test.tsx`).

**Target Platform**: Web responsiva (móvil y escritorio); navegadores
actuales.

**Project Type**: Web application (SPA única con rutas por rol).

**Performance Goals**: sin regresiones en los objetivos existentes (menú
< 2 s en móvil); el sondeo de cocina sigue a 4 s; la frescura del dato se
deriva del estado local de sondeo (sin llamadas extra).

**Constraints**: área táctil ≥ 44 px en caja/cocina (FR-020); alto
contraste; estados de carga/vacío/error consistentes; solo interfaz — sin
backend nuevo ni fuera de §27; textos en español.

**Scale/Scope**: 4 layouts (`AdminLayout`, `CajaLayout`, `CocinaLayout`,
`ClienteLayout`), ~13 páginas existentes rediseñadas en contenido,
2 componentes de navegación nuevos compartidos (drawer, bottom bar).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / restricción | Estado | Evidencia |
|---|---|---|
| §I Alcance MVP primero | ✅ | FR-021 acota a solo interfaz; nada fuera del alcance aprobado en 001–006 |
| §II Seguridad | ✅ | Sin cambios de auth, tokens ni datos sensibles; sin captura de datos de tarjeta (FR-014) |
| §III App única con rutas por rol | ✅ | Se conservan `/admin`, `/caja`, `/cocina`, `/menu`, `/mis-pedidos` con `ProtectedRoute` |
| §IV Simplicidad y mantenibilidad | ✅ | Sin dependencias nuevas; drawer/bottom bar con Tailwind + React Router; TypeScript estricto |
| §V Fiabilidad y rendimiento en receso | ✅ | Objetivo del rediseño: rapidez en caja/cocina, ≥44 px, regla de 10 min intacta, estados observables |
| §22 Sin dependencias innecesarias | ✅ | Confirmado en Technical Context |
| §19 UI: alto contraste, mínimos pasos | ✅ | FR-007 (cobro en un paso), FR-010 (CTA ≥44 px) |

**Resultado**: sin violaciones; no se llena Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/007-ui-redesign/
├── plan.md              # Este archivo
├── spec.md              # Especificación (creada por /speckit.specify)
├── research.md          # Fase 0 (/speckit.plan)
├── data-model.md        # Fase 1 (/speckit.plan)
├── quickstart.md        # Fase 1 (/speckit.plan)
├── contracts/           # Fase 1 (/speckit.plan)
│   └── navegacion-ui.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit.tasks — NO creado por /speckit.plan)
```

### Source Code (repository root)

```text
frontend/src/
├── components/
│   ├── ui/                  # shadcn existente (button, card, input, label)
│   ├── RoleHeader.tsx       # se adapta (hamburguesa + título)
│   ├── AppDrawer.tsx        # NUEVO: menú lateral compartido
│   └── BottomBar.tsx        # NUEVO: barra inferior (caja y cliente)
├── layouts/
│   ├── AdminLayout.tsx      # tabs → drawer
│   ├── CajaLayout.tsx       # tabs → drawer + bottom bar
│   ├── CocinaLayout.tsx     # tabs → drawer
│   └── ClienteLayout.tsx    # tabs → drawer + bottom bar
├── pages/
│   ├── admin/               # UsuariosPage, PlatillosPage, MenuDelDiaPage + nueva InicioAdminPage
│   ├── caja/                # CajaPage (catálogo, cobro, entregas)
│   ├── cocina/              # CocinaPage (tablero KDS)
│   ├── menu/                # MenuPage
│   └── pedidos/             # Confirmar, Pago, Confirmacion, MisPedidos
└── lib/                     # auth, api, carrito, roles (sin cambios de lógica)

frontend/src/components/*.test.tsx   # tests de AppDrawer y BottomBar
frontend/src/pages/**/*.test.tsx     # tests existentes actualizados + nuevos
```

**Structure Decision**: app única existente (opción web SPA); no se agregan
proyectos ni carpetas raíz nuevas. Los componentes nuevos de navegación
viven en `components/` porque se comparten entre roles; las páginas
rediseñadas permanecen en su carpeta por rol (§17).

## Complexity Tracking

Sin violaciones de la constitución: no se justifica ninguna complejidad
adicional.
