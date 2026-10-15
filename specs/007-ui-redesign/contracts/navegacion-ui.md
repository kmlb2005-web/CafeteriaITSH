# Contract: Navegación de UI (Drawer + Bottom Bar)

**Feature**: 007-ui-redesign | **Date**: 2026-10-14
**Tipo**: UI contract (interfaces de usuario expuestas por la SPA)
**Consumidores**: layouts por rol (`AdminLayout`, `CajaLayout`,
`CocinaLayout`, `ClienteLayout`) · Fuente de diseño:
`design/diseño-operativo.md` §2, `design/diseño-cocina.md` §2,
`design/diseño-cliente.md` §2

## 1. `AppDrawer` (componente nuevo, compartido)

```ts
interface ItemDrawer {
  to: string            // ruta de la app (relativa al rol, ej. "/caja")
  etiqueta: string      // texto en español, ej. "Capturar pedido"
  icono?: string        // id de icono SVG inline (opcional)
  fin?: boolean         // cierra el drawer al navegar (móvil)
}

interface AppDrawerProps {
  abierto: boolean
  onCerrar: () => void
  titulo: string              // sección activa, ej. "Caja"
  items: ItemDrawer[]         // secciones del rol; respetar este orden
  contador?: Record<string, number>  // ruta → contador a mostrar en badge
  escritorioFijo?: boolean    // en lg se muestra como panel lateral (default true)
}
```

**Comportamiento requerido**:

| # | Condición | Resultado |
|---|---|---|
| D1 | Móvil + `abierto=false` | Panel fuera de pantalla (`-translate-x-full`), overlay oculto |
| D2 | Móvil + `abierto=true` | Panel visible, overlay oscuro cierra al tocar; `Escape` cierra |
| D3 | Escritorio (`lg`) | Panel siempre visible como rail lateral; hamburguesa oculta |
| D4 | Navegación a un item | Ruta activa (NavLink), `aria-current="page"`, cierra en móvil |
| D5 | `contador[ruta] > 0` | Badge pill con el número; `0`/ausente → sin badge |
| D6 | Pie del drawer | Perfil (nombre · rol) arriba; `Cerrar sesión` al final |

## 2. `BottomBar` (componente nuevo, caja y cliente)

```ts
interface ItemBottomBar {
  to: string
  etiqueta: string       // "Caja" | "Entregas" | "Menú" | "Mis pedidos"
  icono: string          // id de icono SVG (obligatorio)
}

interface BottomBarProps {
  items: ItemBottomBar[]          // 2 items exactos por rol
  contador?: Record<string, number>
}
```

**Comportamiento requerido**:

| # | Condición | Resultado |
|---|---|---|
| B1 | Siempre | `fixed bottom-0`, alto ≥ 56 px por pestaña (área táctil ≥ 44 px), `lg:hidden` |
| B2 | Ruta activa | Icono + texto en verde primario (`NavLink`) |
| B3 | Contador > 0 | Badge pill `status-*` sobre el icono |
| B4 | Contenido principal | `pb` suficiente para no tapar la barra ni el CTA |

**Contadores autorizados** (dato ya disponible, sin endpoints nuevos):

- Caja: `GET /api/caja/pedidos/listos` → `pedidos.length` en `Entregas`.
- Cliente: `GET /api/pedidos` → pedidos con `estado === 'Listo'` en
  `Mis pedidos`.

## 3. `CheckoutBar` (barra flotante, caja y cliente)

```ts
interface CheckoutBarProps {
  cantidad: number        // número de productos con cantidad > 0
  total: number           // suma de precio × cantidad
  etiquetaCTA: string     // "Ver cobro" (caja) | "Ver pedido" (cliente)
  onCTA: () => void
  deshabilitado?: boolean // carrito vacío → oculta o deshabilitada
}
```

| # | Condición | Resultado |
|---|---|---|
| C1 | `cantidad === 0` | Barra oculta (caja/cliente) |
| C2 | Móvil | Se apila **encima** de la `BottomBar`; CTA ≥ 48 px |
| C3 | Escritorio | En caja: panel lateral derecho (layout 2 columnas existente); en cliente: parte inferior del contenido |
| C4 | Total | Formato `$N.NN`, peso 800 (`font-heading`) |

## 4. `RoleHeader` (adapta el existente)

```ts
interface RoleHeaderProps {
  titulo: string
  onAbrirMenu?: () => void   // hamburguesa; en escritorio no se muestra
}
```

- Conserva: sesión visible (nombre · rol) y `Cerrar sesión`.
- Agrega: botón hamburguesa ≥ 44 px con `aria-label="Abrir menú"` cuando
  se pasa `onAbrirMenu`.

## 5. Endpoints consumidos (sin cambios)

| Pantalla | Método | Endpoint | Notas |
|---|---|---|---|
| Caja catálogo | GET | `/api/menu` | Solo `disponible` |
| Caja captura | POST | `/api/caja/pedidos` | Crea + cobra en un paso |
| Caja cobro | POST | `/api/caja/pedidos/:id/pago` | Fallo → `Pendiente` |
| Caja entregas | GET | `/api/caja/pedidos/listos` | → bottom bar |
| Caja estado | POST | `/api/caja/pedidos/:id/estado` | `Entregado`/`Cancelado` |
| Cocina | GET | `/api/cocina/pedidos` | Sondeo 4 s |
| Cocina estado | POST | `/api/cocina/pedidos/:id/estado` | `En preparación`/`Listo` |
| Cliente menú | GET | `/api/menu` | Filtros en cliente |
| Cliente pedidos | GET | `/api/pedidos` | → aviso `Listo` + contador |
| Admin | GET | `/api/usuarios`, listados de platillos, `/api/menu` | Conteos del inicio |

Formas de error inmutables: `{ "error": { "code", "message" } }` (§15);
la UI muestra `message` + `Reintentar`, nunca stack traces.
