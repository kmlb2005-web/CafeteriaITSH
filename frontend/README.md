# Frontend — UI del Sistema de Pedidos Anticipados (Cafetería ITSH)

SPA única con rutas por rol (React + TypeScript + Vite), Tailwind CSS v4 con
los tokens de `docs/DESIGN.md` y componentes base al estilo shadcn/ui.

## Requisitos

- Node.js LTS y npm.
- Backend corriendo en `http://localhost:3000` (el dev server hace proxy de
  `/api` hacia allá).

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Dev server Vite (puerto 5173) |
| `npm test` | Tests con Vitest + Testing Library (jsdom) |
| `npm run typecheck` | Chequeo de tipos (`tsc --noEmit`, strict) |
| `npm run lint` | ESLint (JS/TS/TSX, reglas alineadas con backend) |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción |

## Rutas

| Ruta | Rol permitido | Estado |
|------|---------------|--------|
| `/login` | público | Sprint 1 |
| `/registro` | público (clientes) | Sprint 1 |
| `/admin` | administrador | Sprint 1 (gestión de usuarios) |
| `/admin/platillos` | administrador | Sprint 2 (catálogo) |
| `/admin/menu` | administrador | Sprint 2 (menú del día) |
| `/caja` | cajero | Sprint 4 (captura + cobro en efectivo, entregas) |
| `/cocina` | cocinero | Sprint 4 (KDS con sondeo cada 4 s) |
| `/menu` | cliente | Sprint 2–3 (menú + carrito) |
| `/pedido/confirmar` | cliente | Sprint 3 (revisión + total + 10 min) |
| `/pedido/:id/pago` | cliente | Sprint 3 (pago simulado) |
| `/pedido/:id/confirmacion` | cliente | Sprint 3 (folio y estado) |
| `/mis-pedidos` | cliente | placeholder (Sprint 5) |

Sin sesión → redirige a `/login`; rol sin permiso → pantalla de **Acceso
denegado**.

## Estructura

```
src/
  lib/            # api (fetch tipado), auth (contexto), roles, utils (cn)
  components/ui/  # componentes base (button, input, label, card)
  components/     # RoleHeader compartido por layouts
  layouts/        # AdminLayout, CajaLayout, CocinaLayout, ClienteLayout
  pages/          # pantallas por módulo (login, admin, caja, cocina, ...)
  routes/         # ProtectedRoute (guard de sesión + rol) y sus tests
  test/setup.ts   # setup de Testing Library
```
