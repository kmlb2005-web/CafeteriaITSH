import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'

/** Placeholder del menú: la pantalla completa llega en el Sprint 2 (US1). */
export default function MenuPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Menú del día</CardTitle>
        <CardDescription>
          La consulta del menú con stock en vivo estará disponible en el
          Sprint 2.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Próximamente: platillos del día, precios y stock restante.
      </CardContent>
    </Card>
  )
}
