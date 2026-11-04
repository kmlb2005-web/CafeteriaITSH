# Checklist de usabilidad — Rol cliente (§19 Interfaz de usuario)

**Spec**: `specs/009-qa-cliente` (FR-007) · **Fecha de revisión**: 2026-11-03
**Ámbito**: pantallas del alumno/docente (`/login`, `/registro`, `/menu`,
carrito, `/confirmar-pedido`, `/pago`, `/mis-pedidos`).

Fuente: `docs/reglas.md` §19. Cada ítem indica cumplimiento, cómo se verificó
y la captura de respaldo en `docs/evidencias/cliente/`.

| # | Ítem de §19 | Cumple | Verificación | Evidencia |
|---|---|---|---|---|
| 1 | Componentes con **Tailwind CSS + shadcn/ui** (tokens del proyecto) | ✅ | El flujo usa los componentes `Button`, `Card`, `Badge` de `src/components/ui/` y clases con tokens (`bg-surface`, `text-foreground`, `bg-primary`); sin estilos inline fuera de tokens | `02-menu.png` |
| 2 | **Área táctil ≥ 44 px** en los controles | ✅ | Steppers del menú con `size="touch"` → `h-11 min-h-11` (44 px) en `src/pages/menu/MenuPage.tsx`; CTA de la barra de pedido con `min-h-12` (48 px) en `src/components/CheckoutBar.tsx`; chips de categoría con `min-h-11` | `03-carrito-stepper.png` |
| 3 | **Responsiva** (móvil primero) | ✅ | Barra de pedido `fixed inset-x-0 bottom-14` con alternativa `lg:static`; menú en grilla con cortes `sm:`/`lg:`; cajón lateral en móvil (`AppDrawer`) | `02-menu.png`, `06-mis-pedidos-listo.png` |
| 4 | **Navegación sencilla e intuitiva** (una sola pantalla, mínimos pasos) | ✅ | Menú → barra "Ver pedido" → confirmación → pago → mis pedidos: 4 toques desde el catálogo; barra inferior (`BottomBar`) y menú lateral siempre accesibles | `04-confirmar-pedido.png` |
| 5 | **Información clara** de menú, pedidos y estados | ✅ | Precios y badge "Especial" visibles; estados `Pendiente/Pagado/En preparación/Listo` con etiquetas legibles y aviso "Listo para recoger"; estados vacíos y de error con mensajes claros y reintentar (pruebas `MenuPage` y `MisPedidosPage`) | `02-menu.png`, `06-mis-pedidos-listo.png` |
| 6 | Regla de recogida anticipada comunicada antes de confirmar (§MVP / RF-02) | ✅ | `ConfirmarPedidoPage` rechaza localmente menos de 10 minutos y el backend responde 400 sin crear el pedido (prueba de integración) | `05-estado-anticipacion-10-min.png` |

## Resultado

**Aprobado**: 6 de 6 ítems cumplidos. Los ítems 2, 4 y 5 se respaldan además
con pruebas automatizadas (`MenuPage.test.tsx`, `CheckoutBar.test.tsx`,
`MisPedidosPage.test.tsx`, `ProtectedRoute.test.tsx`).

**Nota**: las capturas se toman con la aplicación local y las cuentas seed;
no deben verse archivos `.env`, tokens ni datos de personas reales.
