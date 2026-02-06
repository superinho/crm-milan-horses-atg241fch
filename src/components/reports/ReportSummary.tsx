import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, ShoppingCart, Percent, TrendingUp } from 'lucide-react'
import { ReportData } from '@/services/reports'

interface ReportSummaryProps {
  data: ReportData['metrics']
}

export function ReportSummary({ data }: ReportSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Receita Total
          </CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-display text-primary">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              maximumFractionDigits: 0,
            }).format(data.totalRevenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            No período selecionado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Vendas Realizadas
          </CardTitle>
          <ShoppingCart className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-display">
            {data.totalSales}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total de lotes vendidos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ticket Médio
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-display">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              maximumFractionDigits: 0,
            }).format(data.avgTicket)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Média por venda</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Taxa de Conversão
          </CardTitle>
          <Percent className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-display">
            {data.conversionRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {data.totalCustomers} clientes de {data.totalLeads} leads
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
