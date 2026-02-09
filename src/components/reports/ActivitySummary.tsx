import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  MessageSquare,
  Mail,
  MousePointerClick,
  Users,
  Percent,
} from 'lucide-react'

interface ActivitySummaryProps {
  emailResponseRate: number
  totalInteractions: number
  newContacts: number
}

export function ActivitySummary({
  emailResponseRate,
  totalInteractions,
  newContacts,
}: ActivitySummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Interações
          </CardTitle>
          <MessageSquare className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-display">
            {totalInteractions}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            E-mails, WhatsApp, Ligações
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Novos Contatos
          </CardTitle>
          <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-display">{newContacts}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Cadastrados no período
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Taxa de Resposta de E-mails
          </CardTitle>
          <Mail className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-display">
            {emailResponseRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Engajamento direto
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Engajamento Geral
          </CardTitle>
          <MousePointerClick className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-display">Alto</div>
          <p className="text-xs text-muted-foreground mt-1">
            Baseado em aberturas e cliques
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
