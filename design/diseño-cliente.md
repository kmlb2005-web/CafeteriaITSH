# Diseño UI/UX — App del Cliente (Menú, Pedido, Mis Pedidos)

Documento de diseño (propuesta, sin implementación) para las pantallas del
cliente (`/menu`, flujo de pedido y `/mis-pedidos`). Es una de las tres
piezas de la división de diseños por rol:

- `design/diseño-operativo.md` — administración y caja
- `design/diseño-cocina.md` — tablero de cocina (KDS)
- **`design/diseño-cliente.md`** (este) — app del cliente

Este documento **reescribe el boceto [`diseño-conceptual.md`](diseño-conceptual.md)** para el flujo
real del cliente: reutiliza sus patrones (catálogo con categorías y
stepper, barra flotante, drawer, bottom bar, ilustraciones orgánicas) y
descarta las pantallas de caja, que viven ahora en `diseño-operativo.md`.
El sistema de diseño canónico es **`docs/DESIGN.md`** (paleta y tokens
definidos allí; este documento no los redefine).

> **Nota de alcance:** implementar este diseño requiere una spec nueva
> (p. ej. `specs/007-ui-redesign`) con aprobación previa (constitución §I).
> Los elementos marcados **[Fuera de alcance]** no deben implementarse sin
> aprobación explícita (§27).

---

## 1. Identidad visual y estilo

- **Paleta** (según `DESIGN.md`, no el boceto): verde institucional
  `#1E7A46` en acciones primarias y estados seleccionados; fondo crema
  `#F6F1E9` con tarjetas blancas; acento espresso `#6B3F23` para *Especiales
  del día*; texto `#1C1917`/`#44403C`.
- **Tipografía:** Plus Jakarta Sans en títulos, precios y totales; Inter en
  cuerpo. Precios en peso 700.
- **Motivos orgánicos:** hojas/ondas sutiles en el área de bienvenida y
  estados vacíos, sobre `surface-container` — nunca verde como fondo grande
  (DESIGN.md).
- **Componentes recurrentes:** tarjetas redondeadas (12–16 px), iconografía
  lineal minimalista, badges pill (especial, estados de pedido), controles
  ≥ 44 px.

---

## 2. Navegación propuesta

Reemplaza los tabs actuales (`ClienteLayout`) por **drawer + bottom bar**:

```
┌──────────────────────────────────────────────┐
│ ☰  Cafetería ITSH             👤 María G.   │  header sticky
└──────────────────────────────────────────────┘
                    │ hamburguesa
                    ▼                Móvil — bottom bar:
┌────────────────────────────┐    ┌──────────────────────────┐
│  👤  María G. · Alumno      │    │  [ ☕ Menú ] [ 📋 Mis     ]│
│  ────────────────────────  │    │           pedidos ●      │
│  Menú del día   ← activo   │    └──────────────────────────┘
│  Mis pedidos          (●)  │
│  ────────────────────────  │
│  Cerrar sesión             │
└────────────────────────────┘
```

- **Bottom bar (móvil):** 2 pestañas — **Menú** y **Mis pedidos** — con
  badge cuando hay un pedido `Listo` para recoger (dato de
  `GET /api/pedidos`).
- **Escritorio:** el drawer se muestra como panel lateral fijo de 16rem.
- El flujo de pedido (`/pedido/confirmar`, `/pedido/:id/pago`,
  `/pedido/:id/confirmacion`) es una secuencia **con botón regresar** en el
  encabezado; no aparece en la bottom bar (no es una sección, es un paso).

---

## 3. Pantallas

### 3.1 Flujo

```
   [Menú del día] ──stepper──► [Barra flotante] ──► [Confirmar pedido]
                                                          │
   [Mis pedidos] ◄── [Confirmación] ◄── [Pago] ◄──────────┘
```

### 3.2 Pantalla 1: Menú del día (`/menu`)

- **Encabezado:** nombre de la cafetería + fecha; hamburguesa del drawer.
- **Área de bienvenida:** ilustración de taza con la leyenda *"¡Buen día!
  Tu café, en buenas manos"* sobre formas orgánicas (patrón del boceto,
  opcional en escritorio).
- **Filtros y búsqueda:**
  - barra `Buscar producto...` con filtro en vivo;
  - chips de categoría horizontales con icono: *Bebidas*, *Comida*,
    *Snacks*, *Postres* — derivados de las categorías reales del catálogo
    (no se inventan categorías fijas).
- **Listado de platillos:** tarjetas con nombre, descripción corta, precio
  unitario en peso 700 y stepper `− 0 +` (botones 44 px, `−` deshabilitado
  en 0):
  - badge **Especial** en acento espresso (especial del día);
  - no disponibles: tarjeta atenuada, stepper deshabilitado, badge
    *"No disponible"* (patrón actual);
  - *Imágenes de platillo:* **[Fuera de alcance]** — el catálogo no tiene
    campo de imagen; se usa icono de categoría + tipografía.
- **Barra flotante inferior:** "N productos · $total" + CTA **Ver pedido**
  (a `/pedido/confirmar`); visible solo con carrito no vacío y apilada
  sobre la bottom bar.
- **Estados:** *Menú no disponible hoy* (tarjeta explicativa), vacío de
  filtro ("Sin resultados para ‘X’"), error con `Reintentar`.
- **Persistencia:** el carrito se conserva en el dispositivo (hoy en
  `localStorage`) al navegar entre pantallas.

### 3.3 Pantalla 2: Confirmar pedido (`/pedido/confirmar`)

- **Encabezado:** botón regresar + "Revisa tu pedido".
- **Desglose:** partidas con cantidad × nombre, precio calculado e icono
  para quitar; total grande (`stat-lg`, verde primario).
- **Hora de recolección:** selector con la **regla de 10 minutos de
  anticipación** validada en cliente (FR-011/FR-021): si la hora elegida es
  a menos de 10 min, mensaje inline en color `error` con la hora mínima
  posible.
- **CTA: Continuar al pago** (primario, 48 px).
- **Estado vacío:** *"Tu carrito está vacío"* + CTA **Volver al menú**.
- **Nota:** "Recogida presencial en la cafetería." (el cliente no paga
  aquí).

### 3.4 Pantalla 3: Pago (`/pedido/:id/pago`)

- **Encabezado:** "Pagar pedido" + monto total en peso 800.
- **Concepto:** adaptador de pago **simulado** — la pantalla no solicita
  datos de tarjeta (FR-012; la UI debe decirlo explícitamente, como hoy:
  *"Este proceso no captura datos de tarjeta"*).
- **CTA: Pagar** (primario, 48 px); durante la petición, botón deshabilitado
  con texto "Procesando…".
- **Estados:**
  - *Rechazo:* pedido queda `Pendiente` → mensaje de error + **Reintentar
    pago** (primario) y **Cancelar pedido** (outline);
  - *"Este pedido ya está pagado"* (recarga de una página ya liquidada) con
    CTA a confirmación/mis pedidos;
  - error de red con `Reintentar`.
- **[Fuera de alcance]:** métodos de pago (tarjeta/transferencia), monedero
  o saldo: el MVP usa el adaptador simulado único (SC-S3-04).

### 3.5 Pantalla 4: Confirmación (`/pedido/:id/pago → /confirmacion`)

- **Encabezado:** "Confirmación de pedido".
- **Folio** grande (`font-mono` 24 px+), estado en badge pill (`Pagado`
  verde) y desglose: fecha/hora de recolección, total, cliente.
- **CTA:** **Ver mis pedidos** (primario) y **Volver al menú** (outline).
- La fuente de verdad es el servidor: el estado se consulta al montar la
  pantalla; si falla la consulta, mensaje de error con `Reintentar` (caso
  borde actual: confirmación no visible tras fallo de red).

### 3.6 Pantalla 5: Mis pedidos (`/mis-pedidos`)

- **Encabezado:** "Mis pedidos" + badge con el total de pedidos activos.
- **Lista** de más reciente a más antiguo; cada tarjeta:
  - folio + badge de estado pill (colores `status-*`: Pendiente, Pagado,
    En preparación, Listo, Entregado, Cancelado);
  - fecha y hora de recolección, total;
  - **aviso destacado "¡Listo para recoger!"** cuando el estado es `Listo`
    (tarjeta con borde `status-ready` y sombra sutil) — aviso in-app US2;
  - detalle expandible con partidas (cantidad × nombre).
- **CTA flotante:** **Nuevo pedido** (regresa al menú) cuando no hay
  pedidos activos.
- **Estados:** vacío (*"Aún no has hecho pedidos"* + CTA a menú), error con
  `Reintentar`.

---

## 4. Fuera de alcance en la app del cliente

| Elemento | Motivo |
|---|---|
| Fotos de platillo | El catálogo no tiene campo de imagen (requiere backend nuevo) |
| Notificaciones push / SMS | El aviso de pedido listo es in-app hoy (US2); push requiere spec y permisos |
| Favoritos, valoraciones, reseñas | Fuera del alcance MVP (§I, §27) |
| Métodos de pago con tarjeta/transferencia | Adaptador simulado único (SC-S3-04); sin datos de tarjeta (seguridad §6) |
| Descuentos y promociones | No existen en el modelo de datos |
| Historial de pagos/facturación | No existe pantalla ni endpoint |

---

## 5. Deviaciones respecto al boceto original

1. **Paleta:** se usa la de `DESIGN.md` (`#1E7A46`, `#F6F1E9`), no
   `#1E4632` / `#DCECE1` / `#F7F9F7`.
2. **Pantallas de caja** (Capturar pedido, Cobro, Pedidos listos, Cobrar
   pedido, detalle con métodos de pago): se movieron al documento operativo
   (`design/diseño-operativo.md`), porque pertenecen al rol cajero.
3. **Historial de ventas / Configuración en el drawer:** fuera de alcance;
   el drawer del cliente solo tiene Menú, Mis pedidos y Cerrar sesión.
4. **Imágenes de producto:** sustituidas por icono de categoría +
   tipografía (la BD no tiene campo de imagen).

---

## 6. Checklist de cumplimiento

- [ ] Controles ≥ 44 px; CTA primarios de 48 px (FR-020).
- [ ] Regla de 10 min validada y explicada en cliente (FR-011/FR-021).
- [ ] Sin captura de datos de tarjeta en ninguna pantalla (FR-012).
- [ ] Estados de pedido con badges pill y colores de `DESIGN.md`.
- [ ] Estados vacíos/carga/error consistentes con `Reintentar`.
- [ ] Carrito persistente entre pantallas (FR-010).
- [ ] Nada marcado **[Fuera de alcance]** aparece como implementable sin
      aprobación (§27).
