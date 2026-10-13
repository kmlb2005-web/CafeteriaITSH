import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'

const ESTADOS = [
  { nombre: 'Pendiente', color: 'bg-status-pending' },
  { nombre: 'Pagado', color: 'bg-status-paid' },
  { nombre: 'En preparación', color: 'bg-status-preparing' },
  { nombre: 'Listo', color: 'bg-status-ready' },
  { nombre: 'Entregado', color: 'bg-status-delivered' },
  { nombre: 'Cancelado', color: 'bg-status-cancelled' },
]

/**
 * Esqueleto de caja (T030): zona de acción con objetivos táctiles de 44 px y
 * leyenda de colores de estado. La pantalla completa llega en el Sprint 4.
 */
export default function CajaPage() {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Captura de pedido</CardTitle>
          <CardDescription>
            Pantalla de caja disponible en el Sprint 4 (captura por cantidad +
            pago).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button size="touch" disabled>
            Nuevo pedido
          </Button>
          <Button size="touch" variant="outline" disabled>
            Cobrar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Colores de estado</CardTitle>
          <CardDescription>
            Catálogo visual compartido con cocina y seguimiento.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {ESTADOS.map((estado) => (
            <span
              key={estado.nombre}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-container-low px-3 py-1.5 text-sm font-medium"
            >
              <span
                aria-hidden="true"
                className={`h-3 w-3 rounded-full ${estado.color}`}
              />
              {estado.nombre}
            </span>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
