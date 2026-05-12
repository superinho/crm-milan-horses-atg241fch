import { useEffect, useState } from 'react'
import {
  DollarSign,
  Trophy,
  Gavel,
  Users,
  Loader2,
  Flame,
  ShieldAlert,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MonetaryDashboardData,
  rfmvService,
  CustomerRfmv,
} from '@/services/rfmv'
import { useToast } from '@/hooks/use-toast'

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value || 0)

function CustomerRow({ customer }: { customer: CustomerRfmv }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{customer.name}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {customer.purchase_count} compras · {customer.bid_count} lances
        </div>
        {customer.heat_score ? (
          <div className="mt-0.5 text-xs font-medium text-orange-700">
            Heat {customer.heat_score} · streak {customer.streak_count || 0}
          </div>
        ) : null}
        {customer.ghost_score ? (
          <div className="mt-0.5 text-xs font-medium text-slate-700">
            Ghost {customer.ghost_score} · sem compra
          </div>
        ) : null}
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold">
          {money(customer.monetary_value)}
        </div>
        <Badge variant="outline" className="mt-1">
          RFMV {customer.rfmv_score}
        </Badge>
      </div>
    </div>
  )
}

export function MonetaryDashboard() {
  const [data, setData] = useState<MonetaryDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    rfmvService
      .getMonetaryDashboard()
      .then(setData)
      .catch((error) => {
        console.error(error)
        toast({
          title: 'Erro no dashboard monetário',
          description: 'Não foi possível carregar os dados de RFMV.',
          variant: 'destructive',
        })
      })
      .finally(() => setLoading(false))
  }, [toast])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-primary">Dashboard monetário</h2>
        <p className="text-sm text-muted-foreground">
          Ranking RFMV e valor dos clientes sincronizados da Smart Leilões.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita total</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money(data.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket médio</CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money(data.avgTicket)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor em lances
            </CardTitle>
            <Gavel className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {money(data.totalBidsValue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCustomers}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Melhores clientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topCustomers.length ? (
              data.topCustomers.map((customer) => (
                <CustomerRow key={customer.id} customer={customer} />
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                Sincronize a Smart Leilões para popular este ranking.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">VIPs inativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.vipInactive.length ? (
              data.vipInactive.map((customer) => (
                <CustomerRow key={customer.id} customer={customer} />
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                Nenhum VIP inativo encontrado.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Compradores quentes
              <Flame className="h-4 w-4 text-orange-700" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.hotBuyers.length ? (
              data.hotBuyers.map((customer) => (
                <CustomerRow key={customer.id} customer={customer} />
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                Nenhum comprador em streak recente.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Bidders fantasma
            <ShieldAlert className="h-4 w-4 text-slate-700" />
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          {data.ghostBidders.length ? (
            data.ghostBidders.map((customer) => (
              <CustomerRow key={customer.id} customer={customer} />
            ))
          ) : (
            <div className="text-sm text-muted-foreground">
              Nenhum bidder fantasma relevante.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
