import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { ApiError, api } from '../../lib/api'

/**
 * Pantalla 1 — Inicio de caja (design §4.2, FR-008): acciones rápidas
 * (Capturar pedido, Entregas con contador) y área de bienvenida. Estados
 * de carga y error con `Reintentar`; no hay historial de ventas (fuera de
 * alcance).
 */
export default function CajaInicioPage() {
  const [listos, setListos] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  const cargarContador = useCallback(async () => {
    setError(null)
    try {
      const datos = await api<{ pedidos: unknown[] }>(
        '/api/caja/pedidos/listos',
      )
      setListos(datos.pedidos.length)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo cargar el contador de entregas.',
      )
    }
  }, [])

  useEffect(() => {
    void cargarContador()
  }, [cargarContador])

  useEffect(() => {
    if (intento > 0) void cargarContador()
  }, [intento, cargarContador])

  const fecha = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="grid gap-4 entrada">
      <header className="grid gap-1">
        <p className="text-sm text-muted-foreground">{fecha}</p>
        <h1 className="font-heading text-2xl font-bold">
          Cafetería ITSH · Caja
        </h1>
      </header>

      <section aria-label="Acciones rápidas" className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/caja/nuevo"
          className="acento-superior flex min-h-[72px] items-center gap-3 rounded-xl border border-border bg-surface-container-lowest p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-md"
        >
          <span
            aria-hidden="true"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm shadow-primary/40"
          >
            <svg className="h-5 w-5" focusable="false">
              <use href="/icons.svg#icon-caja" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-heading font-bold">
              Capturar pedido
            </span>
            <span className="block text-xs text-muted-foreground">
              Catálogo y cobro en un solo paso
            </span>
          </span>
        </Link>

        {error ? (
          <div
            role="alert"
            className="flex min-h-[72px] flex-col justify-center gap-2 rounded-lg border border-destructive/40 bg-surface-container-lowest p-4"
          >
            <p className="text-sm font-medium text-destructive">{error}</p>
            <div>
              <Button
                type="button"
                size="touch"
                variant="outline"
                onClick={() => setIntento((n) => n + 1)}
              >
                Reintentar
              </Button>
            </div>
          </div>
        ) : (
          <Link
            to="/caja/entregas"
            className="acento-superior flex min-h-[72px] items-center gap-3 rounded-xl border border-border bg-surface-container-lowest p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-md"
          >
            <span
              aria-hidden="true"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm shadow-primary/40"
            >
              <svg className="h-5 w-5" focusable="false">
                <use href="/icons.svg#icon-entregas" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-heading font-bold">Entregas</span>
              <span className="block text-xs text-muted-foreground">
                Pedidos listos por entregar
              </span>
            </span>
            {listos === null ? (
              <span className="text-xs text-muted-foreground">Cargando…</span>
            ) : (
              <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/40">
                {listos}
              </span>
            )}
          </Link>
        )}
      </section>

      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="flex items-center gap-4 py-6">
          <svg
            className="h-10 w-10 shrink-0 text-primary"
            aria-hidden="true"
            focusable="false"
          >
            <use href="/icons.svg#icon-menu" />
          </svg>
          <p className="font-heading text-lg font-semibold">
            ¡Buen día! Tu café, en buenas manos
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
