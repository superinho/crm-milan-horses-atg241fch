import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Megaphone,
  Mail,
  MessageSquare,
  Plus,
  BarChart2,
  PauseCircle,
  PlayCircle,
} from 'lucide-react'

const CAMPAIGNS = [
  {
    id: 1,
    name: 'Leilão de Verão - Convite VIP',
    type: 'Email',
    status: 'Ativa',
    sent: 1250,
    openRate: 45,
    clickRate: 12,
  },
  {
    id: 2,
    name: 'Oferta Especial: Lusitanos',
    type: 'WhatsApp',
    status: 'Pausada',
    sent: 500,
    openRate: 88,
    clickRate: 35,
  },
  {
    id: 3,
    name: 'Newsletter Mensal - Outubro',
    type: 'Email',
    status: 'Concluída',
    sent: 3400,
    openRate: 32,
    clickRate: 5,
  },
  {
    id: 4,
    name: 'Lançamento Coleção Selas',
    type: 'SMS',
    status: 'Rascunho',
    sent: 0,
    openRate: 0,
    clickRate: 0,
  },
]

export default function Campanhas() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativa':
        return 'bg-green-500 hover:bg-green-600'
      case 'Pausada':
        return 'bg-yellow-500 hover:bg-yellow-600'
      case 'Concluída':
        return 'bg-blue-500 hover:bg-blue-600'
      default:
        return 'bg-gray-400 hover:bg-gray-500'
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'Email':
        return <Mail className="h-5 w-5 text-blue-500" />
      case 'WhatsApp':
        return <MessageSquare className="h-5 w-5 text-green-500" />
      default:
        return <Megaphone className="h-5 w-5 text-primary" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-primary">
            Campanhas de Marketing
          </h1>
          <p className="text-muted-foreground">
            Engaje sua audiência com campanhas segmentadas.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="mr-2 h-4 w-4" /> Nova Campanha
        </Button>
      </div>

      <div className="grid gap-6">
        {CAMPAIGNS.map((campaign) => (
          <Card key={campaign.id} className="transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="p-4 bg-muted/30 rounded-full shrink-0">
                  {getIcon(campaign.type)}
                </div>

                <div className="flex-1 space-y-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <h3 className="font-semibold text-lg">{campaign.name}</h3>
                    <Badge
                      className={`${getStatusColor(campaign.status)} text-white border-0`}
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                    <span>Tipo: {campaign.type}</span> •{' '}
                    <span>Enviados: {campaign.sent}</span>
                  </p>
                </div>

                <div className="flex flex-row gap-8 w-full md:w-auto justify-center md:justify-end">
                  {campaign.status !== 'Rascunho' && (
                    <>
                      <div className="flex flex-col items-center w-24">
                        <span className="text-2xl font-bold font-display text-primary">
                          {campaign.openRate}%
                        </span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                          Abertura
                        </span>
                        <Progress
                          value={campaign.openRate}
                          className="h-1 mt-2 w-full"
                        />
                      </div>
                      <div className="flex flex-col items-center w-24">
                        <span className="text-2xl font-bold font-display text-secondary">
                          {campaign.clickRate}%
                        </span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                          Cliques
                        </span>
                        <Progress
                          value={campaign.clickRate}
                          className="h-1 mt-2 w-full [&>div]:bg-secondary"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="icon" title="Ver Relatório">
                    <BarChart2 className="h-4 w-4" />
                  </Button>
                  {campaign.status === 'Ativa' ? (
                    <Button variant="outline" size="icon" title="Pausar">
                      <PauseCircle className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      title="Iniciar/Retomar"
                    >
                      <PlayCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
