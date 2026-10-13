import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'

/** Placeholder de seguimiento: pantalla completa en el Sprint 5 (US1). */
export default function MisPedidosPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis pedidos</CardTitle>
        <CardDescription>
          El seguimiento en tiempo real de tus pedidos estará disponible en el
          Sprint 5.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Próximamente: historial, estados y notificaciones.
      </CardContent>
    </Card>
  )
}
