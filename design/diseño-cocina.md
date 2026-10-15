# Diseño UI/UX — Pantalla de Cocina (KDS)

Documento de diseño (propuesta, sin implementación) para la pantalla
`/cocina`. Es una de las tres piezas de la división de diseños por rol:

- `design/diseño-operativo.md` — administración y caja
- **`design/diseño-cocina.md`** (este) — tablero de cocina (KDS)
- `design/diseño-cliente.md` — app del cliente (menú, pedido, mis pedidos)

El sistema de diseño canónico es **`docs/DESIGN.md`**. Este documento no
redefine paleta ni tipografía; usa sus tokens (`status-*`, `font-heading`,
regla de 8px) y sus componentes descritos: *Kitchen/Cashier panels*.

> **Nota de alcance:** implementar este diseño requiere una spec nueva
> (p. ej. `specs/007-ui-redesign`) con aprobación previa (constitución §I).

---

## 1. Reglas aplicables a esta pantalla

| Regla | Fuente | Implicación de diseño |
|---|---|---|
| Una sola pantalla de cocina | FR-017 | Sin sub-vistas ni filtros que obliguen a navegar |
| Área táctil ≥ 44 px, alto contraste | FR-020, §19 | CTA por tarjeta de 48 px, filas altas |
| Mínimos pasos | §19 | Un toque = un avance de estado (Pagado → En preparación → Listo) |
| Actualización sin recarga manual | FR-017, SC-S4-03 | Sondeo cada 4 s con feedback visible |
| Rapidez en horario de receso | §2, §19 | Orden por llegada, folio y cantidades legibles de un vistazo |

---

## 2. Navegación propuesta

Hoy: `RoleHeader` + un solo tab "Pedidos". Con una única vista, la bottom bar
no aporta; se propone **header con menú hamburguesa + drawer** (mismo patrón
que admin/caja):

```
┌─────────────────────────────────────────────────────┐
│ ☰  Cocina        ● 5 pedidos  ·  act. hace 2 s   │  header sticky
└─────────────────────────────────────────────────────┘
                    │ hamburguesa
                    ▼
┌────────────────────────────┐
│  👤  Cocinero Juan Pérez    │
│  ────────────────────────  │
│  Pedidos      ← activo     │
│  ────────────────────────  │
│  Cerrar sesión             │
└────────────────────────────┘
```

- En escritorio el listado del drawer queda como panel lateral fijo
  (DESIGN.md: "paneles laterales para caja y cocina").
- El contador "N pedidos" y "act. hace X s" provienen del mismo sondeo
  existente (`GET /api/cocina/pedidos`, cada 4 s): el estado local ya sabe
  cuándo se actualizó por última vez.

---

## 3. Pantalla: Tablero de cocina

### 3.1 Estructura general

```
┌──────────────────────────────────────────────────────────────┐
│  Encabezado: título + contadores + "act. hace 2 s"           │
│  ──────────────────────────────────────────────────────────  │
│  Grid de tarjetas de pedido (1 col móvil / 2 sm / 3 lg)      │
│  ordenadas por llegada (orden del servidor)                  │
└──────────────────────────────────────────────────────────────┘
```

- Se conserva el **grid responsivo actual** (móvil 1 columna, `sm` 2, `lg`
  3) y el orden por llegada de ambos orígenes (anticipado y mostrador) en
  una sola vista (FR-017).
- **[Opcional escritorio]** Agrupar en dos columnas por estado: *Por
  preparar (Pagado)* y *En preparación*, manteniendo el orden de llegada
  dentro de cada columna. En móvil, una sola lista con badges de estado.

### 3.2 Tarjeta de pedido (panel KDS)

Diseño por defecto de DESIGN.md: *"folio grande, tiempo transcurrido y CTA
de acción claro"*.

```
┌─────────────────────────────────────────┐
│ #47                      [ En preparación ]  ← badge pill status-*
│ A-1024                    ● Anticipado       ← chip de origen
│ Marta López · 11:05 · recoge 11:30           ← hora y recolección
│─────────────────────────────────────────│
│  2×  Café americano                      │  cantidades en
│  1×  Concha verde                        │  ≥20 px peso 800
│─────────────────────────────────────────│
│  [      Iniciar preparación / Marcar listo     ]  ← CTA 48 px
└─────────────────────────────────────────┘
```

Detalle:

- **Folio de orden** (`#47`) en `font-heading` peso 800, verde primario;
  **número de pedido** (`A-1024`) en `font-mono` 20 px+.
- **Badge de estado** pill con color `status-*` y texto blanco:
  `Pagado` (verde #1E7A46), `En preparación` (#B45309), `Listo` (#0369A1).
- **Chip de origen:** "Anticipado" / "Mostrador" en `secondary-container`.
- **Hora de registro** y, si existe, **"recoge HH:MM"** destacada en peso
  700 (es la hora comprometida con el cliente).
- **Tiempo transcurrido** calculado en cliente desde `creado_en` (sin cambio
  de backend): texto `caption` con hora; si la hora de recolección ya pasó,
  cambia a color `error` con texto "¡Retrasado!".
- **Partidas:** `N×` en peso 800 ≥ 20 px + nombre; máximo contraste.
- **CTA único por tarjeta** (área táctil 48 px, ancho completo):
  - `Pagado` → **Iniciar preparación** (primario verde)
  - `En preparación` → **Marcar listo** (primario verde)
  - `Listo` → sin CTA: badge "Listo — en espera de caja" en texto
    secundario (el siguiente paso es de caja, no de cocina)
- El CTA se deshabilita mientras se procesa la tarjeta
  (`ocupado === pedido.id`) manteniendo el feedback actual.

### 3.3 Estados de la pantalla

- **Cargando:** "Cargando pedidos…" (texto `caption`, sin spinner pesado).
- **Vacío:** tarjeta centrada con ilustración ligera y texto
  *"¡Todo está al día! No hay pedidos en cocina. Los pedidos pagados
  aparecen aquí solos."*
- **Error:** mensaje + botón `Reintentar`; el sondeo continúa.
- **Conflicto** (otro operador ya avanzó o el pedido se canceló): aviso
  `role="alert"` arriba con el mensaje del servidor y recarga automática
  (comportamiento actual del `catch` → `recargar`).
- **Feedback de sondeo:** indicador "act. hace X s" en el header; si fallan
  2 sondeos consecutivos, cambia a "Sin conexión — reintentando…" en color
  `error` sin bloquear la vista.

---

## 4. Fuera de alcance en cocina

- **Filtros avanzados** (por tipo, hora o platillo) y **búsqueda**: el
  principio de "una sola pantalla y mínimos pasos" (FR-017, §19) los
  desaconseja; además agregarlos cambiaría el alcance aprobado.
- **Sonido/vibración** al entrar un pedido: requeriría permisos de
  navegador y spec aparte.
- **Impresión de tickets:** no existe infraestructura ni endpoint.
- **Historial de pedidos terminados** en cocina: no aplica (la fuente es
  `/api/cocina/pedidos`, solo activos).

---

## 5. Checklist de cumplimiento

- [ ] Una sola pantalla, sin navegación para ver pedidos (FR-017).
- [ ] CTA ≥ 44 px (48 px propuestos) y alto contraste (FR-020).
- [ ] Un toque por avance de estado; sin formularios intermedios (§19).
- [ ] Folio, cantidades y horas legibles de un vistazo a ≥1 metro
      (tipografía ≥ 20 px peso 700/800 en cifras).
- [ ] Estados vacíos/carga/error/conflicto definidos.
- [ ] Sondeo cada 4 s con feedback visible y sin recarga manual.
