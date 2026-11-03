# Research: Rediseño de Interfaz por Rol (UI/UX)

**Feature**: 007-ui-redesign | **Date**: 2026-10-14
**Input**: `plan.md` (Technical Context) · Fase 0 de `/speckit.plan`

Todos los puntos por aclarar del plan fueron resueltos. Sin dependencias
nuevas: todo se resuelve con el stack existente.

---

## R1 — Construir el drawer (menú lateral) sin librerías nuevas

**Decision**: componente propio `AppDrawer` con Tailwind + React Router:
- Móvil: panel `fixed inset-y-0 left-0 w-64` traducido con
  `translate-x-0/-translate-x-full`, overlay `bg-black/50` que cierra al
  tocar, animación con `transition-transform` (300 ms), cerrado con
  `Escape` y foco al primer enlace.
- Escritorio (breakpoint `lg:`): el mismo contenido como panel lateral
  fijo `lg:static lg:translate-x-0`; el contenido principal usa
  `lg:ps-64` (o grid de dos columnas).
- Estado abierto/cerrado en el layout de cada rol (`useState`); los
  enlaces usan `NavLink` (respaldo de ruta activa) y cierran el drawer en
  móvil.
- Accesibilidad: `aria-label="Abrir menú"` en el botón hamburguesa,
  `role="dialog"`/`aria-modal` solo en móvil, `aria-current="page"` en el
  enlace activo (lo aporta `NavLink`).

**Rationale**: es un componente de presentación simple; Radix no expone un
drawer sin instalar `@radix-ui/react-dialog` (dependencia nueva, §22) y el
proyecto ya copia componentes shadcn personalizándolos a mano.

**Alternatives considered**:
- *Radix Dialog como drawer*: rechazado — dependencia nueva sin justificar.
- *`<details>`/CSS puro*: rechazado — no integra estado de ruta ni cierre
  programático limpio.
- *Mantener tabs horizontales*: rechazado — decisión de diseño aprobada
  (drawer en los 4 roles).

## R2 — Bottom bar con contador en caja y cliente

**Decision**: componente propio `BottomBar` recibe
`items: { to, etiqueta, icono, contador? }[]`, renderiza `NavLink` con
área táctil ≥ 56 px de alto, icono + etiqueta y badge pill (`status-*`)
cuando `contador > 0`. Fijo al fondo (`fixed bottom-0 inset-x-0
z-20`), con `pb-[env(safe-area-inset-bottom)]`. Visible solo en móvil
(`lg:hidden`); en escritorio rige el panel lateral del drawer.
El contenido principal agrega `pb-24` para que la barra no tape el CTA.

**Contadores** (dato ya disponible, sin endpoints nuevos):
- *Caja → Entregas*: longitud de `pedidos` de
  `GET /api/caja/pedidos/listos` que `CajaPage` ya consulta.
- *Cliente → Mis pedidos*: cantidad de pedidos con estado `Listo` de
  `GET /api/pedidos` que `MisPedidosPage` ya consulta; se eleva el estado
  al `ClienteLayout` (o se comparte con un contexto ligero) para que la
  barra lo vea.

**Rationale**: `Button` con `size="touch"` (h-11) + badge satisface ≥44 px;
el contador es UI derivada de datos ya cargados.

**Alternatives considered**:
- *Contexto global de contadores*: rechazado por ahora — solo dos
  consumidores; se eleva estado en el layout. Si en el futuro crece, crear
  contexto.
- *Endpoint nuevo de conteos*: rechazado — innecesario (§22) y sería
  cambio de backend (fuera del alcance de la spec).

## R3 — Indicador de frescura del tablero de cocina

**Decision**: derivar del estado local del sondeo existente
(`CocinaPage` ya llama `recargar()` cada 4 s): guardar
`ultimaActualizacion = new Date()` en cada éxito y renderizar "act. hace X s" con un
`setInterval` de 1 s solo para el texto. Tras 2 fallos consecutivos
mostrar "Sin conexión — reintentando…" en color `error` sin suspender el
sondeo.

**Rationale**: cero llamadas extra; toda la información ya existe en el
estado del componente.

**Alternatives considered**:
- *Timestamp del servidor*: rechazado — requeriría cambio de API.
- *Spinner permanente*: rechazado — ruido visual; el requisito pide
  indicador de frescura, no progreso.

## R4 — Tiempo transcurrido y "retrasado" en tarjetas de cocina

**Decision**: calcular en cliente desde `creado_en` (ISO ya disponible) y
`fecha_recoleccion` (si existe), re-renderizando cada 30 s con un
`setInterval` compartido. `retrasado = fecha_recoleccion < ahora` → texto
en color `error` con etiqueta "¡Retrasado!" junto a la hora de recogida.

**Rationale**: sin backend; cálculo de fechas trivial y barato.

**Alternatives considered**:
- *Contador por segundo por tarjeta*: rechazado — innecesario y más
  re-renders; 30 s basta para "minutos:segundos" de contexto.

## R5 — Conteos del inicio de administrador

**Decision**: derivar de endpoints existentes que el admin ya consume:
usuarios de `GET /api/usuarios`, platillos del catálogo de
`GET /api/admin/platillos` (listado CRUD actual) y elementos de
`GET /api/menu` (menú del día). Mostrar también especiales/no disponibles
del menú de hoy. **No** se muestran ventas/pedidos del día: no existen
endpoints de estadísticas → fuera de alcance (FR-021); se deja la puerta
documentada en `design/diseño-operativo.md`.

**Rationale**: cero backend; los conteos son `length` de listados ya
consultados por las páginas de CRUD.

**Alternatives considered**:
- *Endpoint `/api/admin/stats`*: rechazado — backend nuevo, fuera de
  alcance sin aprobación (§27).

## R6 — Barra flotante de cobro (caja) y de pedido (cliente)

**Decision**: ambos usan el mismo patrón: `fixed bottom-0 lg:static`
(variante `BottomBar`-like, componente interno `CheckoutBar`) con resumen
(cantidad + total en `font-heading` peso 800) y CTA. En móvil se apila
**encima** de la `BottomBar` (`bottom-14`) para no taparla; el CTA
principal mantiene ≥ 48 px. La `BottomBar` y la barra flotante nunca
coinciden en escritorio (allí el resumen va en panel lateral, ya actual en
`CajaPage` con `lg:grid-cols-[1fr_24rem]`).

**Rationale**: reutiliza el layout de 2 columnas existente en caja; en
cliente, el carrito vive en `localStorage` y ya está centralizado en
`lib/carrito.ts`.

**Alternatives considered**:
- *Resumen en header sticky*: rechazado — poco espacio en móvil para total
  + CTA visible.

## R7 — Estados vacío/carga/error consistentes

**Decision**: patrón ya usado en la app, formalizado como regla: texto
`caption`/`sm` en `muted-foreground` para carga; tarjeta con ilustración
ligera (SVG inline propio, sin librería de iconos) + texto explicativo para
vacío; mensaje `role="alert"` en `destructive` + botón `Reintentar`
(`size="sm" variant="outline"`) para error. Cada pantalla nueva/rediseñada
incorpora los tres.

**Rationale**: consistencia visual sin dependencias; los tests ya existentes
usan estos patrones (ej. `MenuPage`, `CocinaPage`).

**Alternatives considered**:
- *Librería de iconos (lucide, heroicons)*: rechazada — dependencia nueva
  (§22); se usan SVG inline o los `icons.svg` existentes en `public/`.

## R8 — Orden de implementación y aislamiento de pruebas

**Decision**: implementar por rol en el orden de prioridad de la spec:
navegación compartida (drawer + bottom bar + `RoleHeader` adaptado) →
caja (P1) → cocina (P2) → cliente (P3) → admin (P4), dejando los tabs
antiguos activos hasta que el rol tenga su navegación completa (cambio
atómico por rol: se reemplaza la nav del layout en el mismo commit que la
pantalla). Tests por componente/página; `npm run lint && npm run typecheck
&& npm test` al cierre de cada rol.

**Rationale**: cada rol es una User Story independiente y testeable; cambio
atómico evita navegación duplicada (tabs + drawer) a media implementación.

**Alternatives considered**:
- *Big bang al final*: rechazado — riesgo alto sin demo intermedia.
- *Migrar rol por rol dejando tabs de respaldo*: rechazado — duplicaría
  navegación (confuso para el evaluador).
