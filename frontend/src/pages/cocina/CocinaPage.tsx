import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'

const COLUMNAS = [
  { nombre: 'Pendiente', color: 'bg-status-pending' },
  { nombre: 'En preparación', color: 'bg-status-preparing' },
  { nombre: 'Listo', color: 'bg-status-ready' },
]

/**
 * Esqueleto de cocina (T030): columnas por estado con códigos de color
 * accesibles además del texto. La pantalla completa llega en el Sprint 4.
 */
export default function CocinaPage() {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Tablero de pedidos</CardTitle>
          <CardDescription>
            Vista de cocina disponible en el Sprint 4 (avance de estados con
            un toque).
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {COLUMNAS.map((columna) => (
          <Card key={columna.nombre}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <span
                  aria-hidden="true"
                  className={`h-3 w-3 rounded-full ${columna.color}`}
                />
                {columna.nombre}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Sin pedidos todavía.
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
