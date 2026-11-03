# Quickstart: Validación del Rediseño de Interfaz (007-ui-redesign)

**Feature**: 007-ui-redesign | **Date**: 2026-10-14
**Propósito**: guía de validación ejecutable para comprobar la feature de
extremo a extremo. No incluye implementación (eso vive en `tasks.md`).

## Prerrequisitos

- MySQL 8 corriendo + `backend/.env` (copiar de `.env.example`); ver
  `docs/ejecutar-migraciones.md`.
- Base `cafe_itsh` migrada y sembrada:
  ```powershell
  cd backend
  npm run migrate
  npm run seed
  ```
- Cuentas operativas creadas por el seed (administrador, cajero, cocinero,
  cliente de prueba).

## Arranque

```powershell
# Terminal 1 — API (puerto 3000)
cd backend
npm run dev

# Terminal 2 — SPA (puerto 5173, proxy /api → 3000)
cd frontend
npm run dev
```

Abrir `http://localhost:5173`.

## Verificación automática (obligatoria antes de declarar terminada la feature)

```powershell
cd frontend
npm run lint
npm run typecheck
npm test
```

**Resultado esperado**: sin errores; los tests de `AppDrawer`, `BottomBar`
y los de cada página rediseñada pasan (patrón de `ProtectedRoute.test.tsx`).

## Escenarios manuales de validación

### V1 — Navegación por rol (FR-001…FR-004)

1. Login como **cajero** → `/caja`.
2. **Móvil (o ventana < 1024 px)**: la hamburguesa abre el drawer con
   perfil, Inicio, Capturar pedido, Pedidos listos (contador) y Cerrar
   sesión; el overlay cierra al tocar; no quedan pestañas horizontales.
3. **Escritorio (≥ 1024 px)**: el drawer es un rail lateral fijo; la
   hamburguesa no se muestra.
4. Bottom bar móvil: `Caja` y `Entregas` navegan y resaltan la ruta activa.
5. Repetir el paso 1 para **admin** (`/admin`), **cocinero** (`/cocina`) y
   **cliente** (`/menu`): drawer en los 4; bottom bar solo en caja y
   cliente.
6. Intentar acceder a `/admin` sin sesión/rol → redirige (regresión de
   `ProtectedRoute`).

### V2 — Caja: captura + cobro en un paso (US1 / FR-005…FR-008)

1. En `/caja` → `Caja` (o `Capturar pedido`): escribe en "Buscar" y
   toca chips de categoría → la lista filtra en vivo.
2. Stepper `− 0 +`: `−` deshabilitado en 0; cantidad tope 99.
3. Con productos > 0 aparece la **barra flotante** con conteo y total;
   toca el CTA → resumen con desglose, ítems quitar y total destacado.
4. Sin productos: el resumen informa "agrega al menos un platillo".
5. `Registrar y cobrar` → folio + estado `Pagado` + `Nuevo pedido`
   limpia el carrito. *(Cobro fallido: si el backend rechaza, verificar
   `Pendiente` + `Reintentar cobro` + `Cancelar pedido`.)*
6. Con un pedido `Listo` pendiente (cocinarlo desde `/cocina` o el seed):
   bottom bar `Entregas` muestra badge con el conteo; `Entregar` retira la
   fila y actualiza el contador; vacío → "¡Todo está al día!".

### V3 — Cocina: tablero KDS (US2 / FR-009…FR-012)

1. Con ≥ 2 pedidos pagados (uno anticipado con hora de recolección):
   `/cocina` los muestra en orden de llegada, mezclando orígenes, con
   badge de estado y chip `Anticipado`/`Mostrador`.
2. Tarjeta: folio grande, hora de recolección con énfasis, partidas con
   `N×` destacado y **tiempo transcurrido** visible.
3. CTA único: `Pagado` → `Iniciar preparación` → `Marcar listo`; botón
   deshabilitado mientras procesa; ≥ 44 px.
4. Header: "act. hace X s" se renueva sin recargar la página; si se cae
   el backend, muestra "Sin conexión — reintentando…" sin bloquear.
5. Cancelar un pedido desde caja mientras está en cocina → la tarjeta
   desaparece al re-sincronizar.

### V4 — Cliente: pedido completo (US3 / FR-013…FR-015)

1. `/menu`: buscar/chips filtran; no disponibles atenuados; stepper +
   badge `Especial`; barra flotante con total → `Ver pedido`.
2. Carrito vacío en la revisión → "Tu carrito está vacío" + volver al menú.
3. Elegir recolección a < 10 min → error con la hora mínima; no avanza.
4. Pago: la pantalla explica que no captura datos de tarjeta; rechazo →
   `Pendiente` con reintentar/cancelar.
5. Bottom bar `Mis pedidos`: badge cuando hay `Listo`; aviso destacado
   "¡Listo para recoger!" + detalle expandible.

### V5 — Admin: inicio + CRUD (US4 / FR-016…FR-017)

1. `/admin` → Inicio: tarjetas de Usuarios/Platillos/Menú del día con
   conteos correctos vs. sus listados; resumen del menú con especiales y
   no disponibles.
2. Alta/edición de usuario, platillo y elemento de menú del día: CTA fijo,
   filas altas, buscador/filtro, confirmación de baja.
3. Cerrar sesión desde el drawer → `/login`.

### V6 — Estados y regresión (FR-018…FR-021 / SC-006)

1. Cada pantalla: carga ("Cargando…"), vacío explicativo, error con
   `Reintentar` (simular cayendo el backend).
2. Medir controles táctiles en DevTools (modo móvil): ≥ 44 px en
   caja/cocina.
3. `grep` de regresión: ninguna pantalla debe renderizar la nav de
   pestañas antiguas; no se agregaron dependencias en `frontend/package.json`.

## Criterios de éxito medibles (spec)

| SC | Cómo verificarlo |
|---|---|
| SC-001 | Cronómetro en V2: abrir caja → folio cobrado < 60 s |
| SC-002 | V1: cada cambio de sección en ≤ 2 interacciones |
| SC-003 | V3: folio + tiempo legibles a distancia (prueba visual) |
| SC-004 | V6.2: DevTools confirma ≥ 44 px |
| SC-005 | V4: flujo en 4 pantallas; regla de 10 min visible antes de pagar |
| SC-006 | V6.1: ninguna pantalla en blanco ante fallo de red |
| SC-007 | Evaluador externo: 4 de 5 tareas por rol sin ayuda |
