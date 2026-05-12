import { Link } from 'react-router-dom'
import {
  CircleDollarSign,
  Gift,
  MessageCircle,
  TrendingUp,
  UserCheck,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { DashboardData } from '@/services/dashboard'

type ExecutiveSnapshotProps = {
  snapshot: DashboardData['snapshot']
}

const compact = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value || 0)

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value || 0)

export function ExecutiveSnapshot({ snapshot }: ExecutiveSnapshotProps) {
  const opportunity =
    snapshot.upcomingBirthdays > 0
      ? {
          title: 'Aniversários próximos',
          value: compact(snapshot.upcomingBirthdays),
          detail:
            snapshot.upcomingBirthdayNames.join(', ') ||
            'Clientes com data real nos próximos 30 dias',
          badge: '30 dias',
          href: '/contatos',
          icon: Gift,
          tone: 'text-pink-700 bg-pink-500/10',
        }
      : snapshot.highPotential > 0
        ? {
            title: 'Alto potencial',
            value: compact(snapshot.highPotential),
            detail: 'Lançadores fortes sem compra registrada',
            badge: 'Ativar',
            href: '/radar-vip',
            icon: TrendingUp,
            tone: 'text-amber-700 bg-amber-500/10',
          }
        : {
            title: 'Valor em lances',
            value: money(snapshot.totalBidsValue),
            detail: 'Demanda declarada nos leilões',
            badge: 'Radar',
            href: '/radar-vip',
            icon: TrendingUp,
            tone: 'text-amber-700 bg-amber-500/10',
          }

  const cards = [
    {
      title: 'Receita registrada',
      value: money(snapshot.totalRevenue),
      detail: `${compact(snapshot.totalCustomers)} contatos sincronizados`,
      badge: 'Smart Leilões',
      href: '/contatos',
      icon: CircleDollarSign,
      tone: 'text-primary bg-primary/10',
    },
    {
      title: 'Compradores',
      value: compact(snapshot.buyers),
      detail: `Ticket médio ${money(snapshot.avgTicket)}`,
      badge: 'Base quente',
      href: '/contatos',
      icon: UserCheck,
      tone: 'text-emerald-700 bg-emerald-500/10',
    },
    {
      title: 'WhatsApp acionável',
      value: compact(snapshot.withWhatsapp),
      detail: 'Contatos prontos para campanha',
      badge: 'Disparo',
      href: '/campanhas',
      icon: MessageCircle,
      tone: 'text-sky-700 bg-sky-500/10',
    },
    opportunity,
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Link key={card.title} to={card.href} className="group block">
          <Card className="h-full border-border/70 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/20">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground sm:text-3xl">
                    {card.value}
                  </p>
                  <p className="line-clamp-2 min-h-[2rem] text-xs text-muted-foreground">
                    {card.detail}
                  </p>
                </div>
                <div className={`rounded-full p-2 ${card.tone}`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
              <Badge variant="secondary" className="mt-4 border-0">
                {card.badge}
              </Badge>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
