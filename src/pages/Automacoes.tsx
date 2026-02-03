import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, Clock, UserPlus, Mail, ArrowRight, Plus } from 'lucide-react'

const AUTOMATIONS = [
  {
    id: 1,
    name: 'Boas-vindas novos leads',
    trigger: 'Novo contato adicionado',
    action: 'Enviar email de apresentação',
    active: true,
    icon: UserPlus,
  },
  {
    id: 2,
    name: 'Follow-up pós venda',
    trigger: 'Negócio Fechado',
    action: 'Criar tarefa de contato após 7 dias',
    active: true,
    icon: Clock,
  },
  {
    id: 3,
    name: 'Lembrete de Aniversário',
    trigger: 'Data de aniversário',
    action: 'Enviar SMS promocional',
    active: false,
    icon: Zap,
  },
  {
    id: 4,
    name: 'Reengajamento Lead Frio',
    trigger: 'Sem interação por 30 dias',
    action: 'Enviar email com catálogo',
    active: true,
    icon: Mail,
  },
]

export default function Automacoes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-primary">
            Automações
          </h1>
          <p className="text-muted-foreground">
            Automatize tarefas repetitivas e ganhe produtividade.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="mr-2 h-4 w-4" /> Nova Automação
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {AUTOMATIONS.map((automation) => (
          <Card
            key={automation.id}
            className="relative overflow-hidden group hover:border-primary/50 transition-colors"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
              <div className="p-2 bg-primary/10 rounded-md text-primary">
                <automation.icon className="h-6 w-6" />
              </div>
              <Switch checked={automation.active} />
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <CardTitle className="text-lg leading-tight mb-2">
                  {automation.name}
                </CardTitle>
                <Badge
                  variant={automation.active ? 'default' : 'secondary'}
                  className="text-xs font-normal"
                >
                  {automation.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="p-2 bg-muted rounded border text-muted-foreground">
                  <span className="font-semibold text-foreground block text-xs uppercase mb-1">
                    Gatilho
                  </span>
                  {automation.trigger}
                </div>
                <div className="flex justify-center text-muted-foreground">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="p-2 bg-muted rounded border text-muted-foreground">
                  <span className="font-semibold text-foreground block text-xs uppercase mb-1">
                    Ação
                  </span>
                  {automation.action}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
