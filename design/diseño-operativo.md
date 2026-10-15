# Diseño UI/UX — Panel Operativo (Admin + Caja)

Documento de diseño (propuesta, sin implementación) para las pantallas del
personal operativo: `/admin` y `/caja`. Es una de las tres piezas de la
división de diseños por rol:

- **`design/diseño-operativo.md`** (este) — administración y caja
- `design/diseño-cocina.md` — tablero de cocina (KDS)
- `design/diseño-cliente.md` — app del cliente (menú, pedido, mis pedidos)

El sistema de diseño canónico es **`docs/DESIGN.md`** (tokens en
`frontend/src/index.css`). Este documento **no redefine paleta ni tipografía**:
toda referencia a "verde primario", "fondo crema", "badge de estado" o
"tipografía" apunta a ese archivo.

> **Nota de alcance:** implementar este diseño requiere una spec nueva
> (p. ej. `specs/007-ui-redesign`) con aprobación previa (constitución §I).
> Los elementos marcados **[Fuera de alcance]** no deben implementarse sin
> aprobación explícita (§27).

---

## 1. Reglas aplicables a este documento

| Regla | Fuente | Implicación de diseño |
|---|---|---|
| Área táctil ≥ 44 px en caja | FR-020, §19 | Steppers, botones de cobro y entrega de 44–48 px |
| Menor cantidad de pasos posible | §19 | Captura + cobro en un solo botón (SC-S4-01) |
| Alto contraste y legibilidad | §19, DESIGN.md | Fila de caja ≥ 56 px, cifras en peso 700/800 |
| App única con rutas por rol | §2 | Drawer/bottom bar viven dentro de los layouts existentes |
| Sin dependencias nuevas | §22 | Drawer y bottom bar se construyen con Tailwind + React Router |

---

## 2. Navegación propuesta (reemplaza los tabs horizontales)

Hoy los 4 layouts usan `RoleHeader` + nav horizontal de tabs. La propuesta
sustituye esa nav por **drawer lateral** y, en caja, **bottom bar** en móvil
(patrón previsto en `DESIGN.md`: "navegación inferior o barra superior según
el rol").

### 2.1 Drawer lateral (admin y caja)

```
┌──────────────────────────────────────────────┐
│ ☰  Título de sección        Nombre · Rol    │  ← header sticky
└──────────────────────────────────────────────┘
                    │ hamburguesa
                    ▼
┌────────────────────────────┐
│  👤  Cajero Marta López     │   perfil (avatar + rol)
│  ────────────────────────  │
│  Inicio                    │   ← activo en verde primario
│  Capturar pedido           │
│  Pedidos listos      (3)   │   badge con contador
│  ────────────────────────  │
│  Cerrar sesión             │
└────────────────────────────┘
```

- **Móvil:** el drawer entra desde la izquierda sobre un fondo oscurecido.
- **Escritorio:** el mismo listado queda fijo como panel lateral izquierdo de
  16rem; el contenido usa el ancho restante (paneles laterales para caja,
  DESIGN.md).
- El contador del badge de "Pedidos listos" proviene de
  `GET /api/caja/pedidos/listos` (dato ya disponible).

### 2.2 Bottom bar de caja (móvil)

```
┌────────────────────────────────┐
│   [ 🛒 Caja ]   [ ✓ Entregas ●3 ] │
└────────────────────────────────┘
```

- Solo **2 pestañas**: `Caja` (inicio + captura) y `Entregas` (pedidos
  listos). El boceto original incluía `Historial`, que **[Fuera de alcance]**
  (no existe pantalla ni endpoint de historial de ventas).
- El punto/contador indica entregas pendientes.
- Altura de la barra ≥ 56 px; cada pestaña es un área táctil de ≥ 44 px.

---

## 3. Parte A — Panel de administración (`/admin`)

Rediseño de las tres pantallas existentes (`UsuariosPage`, `PlatillosPage`,
`MenuDelDiaPage`) con mejor jerarquía y acciones rápidas. No agrega
funcionalidad: es el mismo CRUD con una estructura más clara.

### 3.1 Pantalla: Inicio (nueva landing del admin)

Sustituye el tabs-bar como punto de entrada. Contenido:

- **Encabezado:** fecha del día y saludo corto; hamburguesa del drawer.
- **Acciones rápidas:** tres tarjetas enlazando a cada sección, con conteo
  derivado de endpoints existentes:
  - *Usuarios* — "N activos" (`GET /api/usuarios`).
  - *Platillos* — "N en catálogo" (listado existente de platillos).
  - *Menú del día* — "N publicados hoy" (`GET /api/menu`).
- **Resumen del menú de hoy:** platillos con badge `Especial` (acento
  espresso) y los no disponibles atenuados, para detectar de un vistazo
  huecos del día.
- **[Fuera de alcance]** Bloque de métricas de negocio (ventas del día,
  pedidos por estado, platillos más vendidos): **no existen endpoints** de
  estadísticas en el backend; requiere aprobación y spec de backend nuevo.

### 3.2 Pantalla: Usuarios

- **Estructura:** lista como filas altas (≥ 56 px) en lugar de tarjetas
  apretadas:
  `Nombre · correo` | badge de rol (pill, `secondary-container`) |
  estado (Activo / Inhabilitado) | acciones por fila (`Editar`,
  `Deshabilitar`).
- **CTA fijo:** botón primario "Nuevo usuario" anclado arriba a la derecha
  (móvil: botón flotante inferior de 48 px).
- **Formulario:** se abre en panel lateral (escritorio) o sheet inferior
  (móvil) con el mismo contenido actual: nombre, correo, contraseña, rol.
  Campos con etiqueta visible arriba, foco verde 2 px (DESIGN.md).
- **Estados:** vacío ("Aún no hay usuarios operativos" + CTA), error con
  `Reintentar`, confirmación de deshabilitar en diálogo con texto claro.

### 3.3 Pantalla: Platillos

- **Encabezado:** "Catálogo de platillos" + buscador por nombre + chips de
  categoría (las que existan en el catálogo) para filtrar.
- **Lista:** tarjetas de platillo con nombre, descripción corta, badge de
  categoría, estado (`Activo`/`Inactivo`) y acciones `Editar` / activar-
  desactivar. Precio solo donde aplique (el precio se asigna en menú del día).
- **CTA fijo:** "Nuevo platillo" (mismo patrón que Usuarios).
- **Estados:** vacío ("El catálogo está vacío" + CTA), vacío de filtro
  ("Sin resultados para ‘X’"), error con `Reintentar`.

### 3.4 Pantalla: Menú del día

- **Selector de fecha** visible en el encabezado (hoy/otra fecha), con
  indicador "Menú de hoy" cuando corresponde.
- **Grid de platillos del día:** cada tarjeta muestra nombre, precio en
  peso 700, y:
  - toggle `Disponible` (área táctil ≥ 44 px),
  - badge `Especial` conmutable (acento espresso),
  - acción `Quitar del menú` con confirmación.
- **Panel "Agregar al menú":** buscador sobre el catálogo + campo de precio
  (escritorio: panel lateral; móvil: parte inferior de la pantalla).
- **Estados:** fecha sin menú ("No hay menú publicado para esta fecha" +
  acción para agregar), error con `Reintentar`.

---

## 4. Parte B — Caja (`/caja`)

Rediseño del flujo actual de `CajaPage` (captura + cobro en efectivo y
entrega de pedidos listos) incorporando los patrones del boceto
`diseño-conceptual.md`: panel de inicio con acciones rápidas, catálogo con
búsqueda/categorías/stepper, barra flotante de cobro y bottom bar.

### 4.1 Flujo

```
   [Drawer / Bottom bar]
           │
           ▼
   [ 1. Inicio ] ──► [ 2. Nuevo pedido ] ──► [ 3. Resumen de cobro ]
        │                                          │
        │                                          ▼
        └──────────► [ 4. Entregas ]        [ Resultado: ✓ folio ]
                                                    │
                                            [ ✗ error → reintento ]
```

### 4.2 Pantalla 1: Inicio (panel de caja)

- **Encabezado:** "Cafetería ITSH · Caja", fecha, avatar del usuario en el
  drawer.
- **Acciones rápidas:**
  - Botón primario destacado: **Capturar pedido** (acceso directo al
    catálogo).
  - Módulo **Entregas** con badge de contador (pedidos `Listo` pendientes).
- **Área de bienvenida:** ilustración de taza con leyenda *"¡Buen día! Tu
  café, en buenas manos"* sobre formas orgánicas sutiles (fondo
  `surface-container`, nunca verde como fondo grande).
- **[Fuera de alcance]** Módulo "Historial de ventas": no existe pantalla ni
  endpoint; fuera del MVP.

### 4.3 Pantalla 2: Nuevo pedido (catálogo y carrito)

- **Encabezado:** botón regresar, título "Nuevo pedido".
- **Nombre del cliente (opcional):** campo con etiqueta visible, para
  identificar el pedido al entregar (ya existe en el flujo actual).
- **Búsqueda y categorías:**
  - barra `Buscar producto...` que filtra en vivo;
  - chips horizontales con icono por categoría (*Bebidas*, *Comida*,
    *Snacks*, *Postres* — las categorías derivadas del catálogo, no se
    inventan categorías fijas).
- **Listado de productos:** filas altas (≥ 56 px) con nombre, precio c/u en
  peso 700 y **stepper** `− 0 +`:
  - botones de 44 px, deshabilitado `−` en 0;
  - cantidad máxima 99 (límite actual);
  - solo platillos `disponible` del menú de hoy.
- **Barra flotante inferior (checkout bar):** resumen persistente sobre la
  bottom bar: "N platillos" + total en `font-heading` + botón **Ver cobro**.
  Visible solo con carrito no vacío. Compite en altura con la bottom bar: en
  móvil apila justo encima de ella.
- **Estados:** cargando ("Cargando menú…"), error + `Reintentar`, vacío
  ("No hay platillos disponibles en el menú de hoy").

### 4.4 Pantalla 3: Resumen de cobro

- **Encabezado:** "Cobro" con botón regresar al catálogo.
- **Desglose:** tarjeta con los ítems seleccionados: cantidad × nombre,
  precio calculado, icono `×` para quitar (regresa la cantidad a 0).
  *Sin imágenes de platillo:* el catálogo no tiene campo de imagen
  **[Fuera de alcance]**; se usa el nombre en negrita e icono de categoría.
- **Total** grande (`stat-lg`, verde primario).
- **Nota informativa:** "El pedido se registra y cobra en un solo paso."
- **CTA único: Registrar y cobrar.** Captura y cobro siguen siendo un solo
  paso (FR-015, SC-S4-01): la revisión no separa ambas acciones.

**Resultado — éxito:**

- Tarjeta con folio (`font-mono`, 20 px+), estado `Pagado` en badge verde,
  mensaje "Cobro confirmado: folio #X" y CTA **Nuevo pedido** que limpia el
  carrito y regresa al catálogo.

**Resultado — cobro fallido:**

- El pedido queda `Pendiente`; tarjeta de error con el folio y dos CTA:
  **Reintentar cobro** (primario) y **Cancelar pedido** (outline). Este
  comportamiento ya existe hoy y se conserva tal cual.

### 4.5 Pantalla 4: Entregas (pedidos listos)

- **Encabezado:** "Pedidos listos" + contador de pendientes (badge).
- **Lista por orden de llegada**, cada fila con:
  - folio grande (`font-mono` 20 px+), hora de registro, nombre del cliente
    (o "Sin nombre");
  - partidas `N× Nombre` y badge **Listo** (pill azul `status-ready`);
  - CTA **Entregar** (primario, 44 px) y **Cancelar** (outline, 44 px).
- **Estado vacío:** ilustración + *"¡Todo está al día! No hay pedidos
  listos por entregar."*
- **Confirmación:** al entregar, mensaje efímero "Pedido entregado." y la
  fila desaparece; el contador del badge y de la bottom bar se actualiza.

### 4.6 Menú lateral de caja (drawer)

Perfil (avatar + "Cajero · Nombre"), opciones: **Inicio**, **Capturar
pedido**, **Pedidos listos** (con contador activo), **Cerrar sesión**.
*Historial de ventas* y *Configuración* del boceto quedan **[Fuera de
alcance]**: no existen en el MVP.

---

## 5. Deviaciones respecto al boceto original

El boceto `diseño-conceptual.md` se adaptó así (ver index en ese archivo):

1. **Paleta:** se usa la de `DESIGN.md` (`#1E7A46`, fondo `#F6F1E9`), no
   `#1E4632` / `#F7F9F7`.
2. **Cobrar pedido (detalle con métodos de pago):** eliminado. La caja solo
   cobra en **efectivo** (alcance actual); efectivo/tarjeta/transferencia y
   **descuentos** son **[Fuera de alcance]**.
3. **Historial de ventas y Configuración:** **[Fuera de alcance]**, no se
   diseñan pantallas ni bottom bar para ellos.
4. **Imágenes de producto:** el catálogo no tiene campo de imagen
   **[Fuera de alcance]**; se sustituyen por tipografía + icono de categoría.
5. **Bottom bar de 3 pestañas → 2** (`Caja`, `Entregas`).
6. **Cobro rápido:** el boceto separaba resumen y cobro en dos pantallas; aquí
   `Ver cobro` → resumen → `Registrar y cobrar` mantiene el cobro en un solo
   paso efectivo.

---

## 6. Checklist de cumplimiento

- [ ] Todo control interactivo ≥ 44 px en caja (FR-020).
- [ ] Captura + cobro en un solo botón (SC-S4-01) — sin pasos extra.
- [ ] Cifras (total, folios, cantidades) en `font-heading` peso 700/800.
- [ ] Badges de estado pill con texto blanco (colores de `DESIGN.md`).
- [ ] Estados vacíos/carga/error consistentes en cada pantalla, con
      `Reintentar` donde haya llamada a la API.
- [ ] Ninguna pantalla propuesta fuera de alcance está marcada como
      implementable sin aprobación (§27).
