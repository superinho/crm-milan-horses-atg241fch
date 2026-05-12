import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Loader2,
  Megaphone,
  Radar,
  RefreshCcw,
  Wand2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { dashboardService, DashboardData } from '@/services/dashboard'
import { useRealtime } from '@/hooks/use-realtime'
import { MonetaryDashboard } from '@/components/dashboard/MonetaryDashboard'
import { ExecutiveSnapshot } from '@/components/dashboard/ExecutiveSnapshot'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const cockpitActions = [
  {
    title: 'Radar VIP',
    description: 'Priorize clientes com maior potencial para o próximo leilão.',
    href: '/radar-vip',
    icon: Radar,
  },
  {
    title: 'Criar campanha',
    description: 'Monte o público, escolha uma mensagem e envie testes.',
    href: '/campanhas',
    icon: Megaphone,
  },
  {
    title: 'E-mail premium',
    description: 'Abra o Estúdio já focado em uma peça editorial.',
    href: '/modelos',
    icon: Wand2,
  },
  {
    title: 'Sincronizar base',
    description: 'Atualize contatos e histórico real da Smart Leilões.',
    href: '/contatos',
    icon: RefreshCcw,
  },
]

export default function Index() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const fetchData = useCallback(async () => {
    try {
      const result = await dashboardService.getDashboardData()
      setData(result)
    } catch (error) {
      console.error('Failed to load dashboard data', error)
      toast({
        title: 'Erro de carregamento',
        description: 'Não foi possível atualizar o dashboard.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useRealtime('campaigns', () => fetchData())
  useRealtime('contacts', () => fetchData())

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-display text-primary">
          Bem-vindo ao CRM Milan Horses
        </h1>
        <p className="text-muted-foreground capitalize">{currentDate}</p>
      </div>

      {data && <ExecutiveSnapshot snapshot={data.snapshot} />}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cockpitActions.map((action) => (
          <Card key={action.title} className="border-border/70 shadow-sm">
            <CardContent className="flex h-full flex-col justify-between gap-4 p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <action.icon className="h-4 w-4" />
                  {action.title}
                </div>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </div>
              <Button asChild variant="outline" className="justify-between">
                <Link to={action.href}>
                  Abrir
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <MonetaryDashboard />
    </div>
  )
}
