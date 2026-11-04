# Quickstart — QA del Cliente (Sprint 7)

Guía de validación del cierre del sprint. Todo se ejecuta en local con MySQL 8
vivo y `backend/.env` (nunca versionado).

## §1 Requisitos

- MySQL 8 corriendo y `backend/.env` con `DATABASE_URL`, `JWT_SECRET` y
  `SEED_*_PASSWORD` (copiar de `.env.example` si no existe).
- Node 20 (versión con la que el proyecto está verificado).
- En la raíz: `node scripts/verify.mjs` debe estar en verde antes de empezar
  (base del Sprint 6).

## §2 Pruebas nuevas del sprint (una a una)

```bash
# Backend — desde backend/
npx vitest run tests/integration/permisos-cliente.test.ts   # 403/401 del rol cliente
npx vitest run tests/integration/mis-pedidos.test.ts        # incluye O-02 (fallo del aviso)
npx vitest run tests/unit/error.test.ts                     # sobre { error: { code, message } } sin trazas

# Frontend — desde frontend/
npx vitest run src/routes/ProtectedRoute.test.tsx           # sesión de otro rol → denegado + enlace
npx vitest run src/pages/menu/MenuPage.test.tsx             # vacío / error con reintento
npx vitest run src/pages/pedidos/MisPedidosPage.test.tsx    # vacío / error con reintento
npx vitest run src/components/CheckoutBar.test.tsx          # total del carrito
```

**Resultado esperado**: todos en verde, sin tests pendientes ni omitidos.

## §3 Gate completo

```bash
node scripts/verify.mjs
```

**Resultado esperado**: verde en `backend/` (pruebas > 89 actuales) y
`frontend/` (pruebas ≥ 89 actuales); conteo final registrado en `AGENTS.md`.

## §4 CI en GitHub

```bash
git push -u origin spec/009-qa-cliente
```

**Resultado esperado**: los 3 trabajos del workflow en verde en
https://github.com/kmlb2005-web/CafeteriaITSH/actions (runner local
`cafeteria-itsh-win`; ver `AGENTS.md` §CI).

## §5 Evidencia y cierre

1. Recorrer el flujo completo del alumno con la app local y capturar los pasos
   en `docs/evidencias/cliente/` (nombres `NN-descrito-de-paso.png`, ver
   `contracts/contratos-cliente.md` §4).
2. Responder `docs/checklist-usabilidad-cliente.md` (§19) enlazando cada
   ítem con su captura.
3. Actualizar `docs/Matriz_de_calidad.md`: RF-01, RF-02 y RF-04 en Aprobado;
   O-02 y D-04 cerrados con fecha y solución; sin párrafos "pendiente" del
   rol cliente.
4. Marcar el Sprint 7 completado en `docs/sprints.md` con fecha y demo.
5. Re-ejecutar `node scripts/verify.mjs` y confirmar el CI verde del PR.

**Resultado esperado**: matriz sin pendientes del rol cliente, evidencia en el
repo, `verify` y CI en verde → sprint cerrable.
