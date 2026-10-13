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
| `/caja` | cajero | esqueleto (pantalla en Sprint 4) |
| `/cocina` | cocinero | esqueleto (pantalla en Sprint 4) |
| `/menu` | cliente | placeholder (Sprint 2) |
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
