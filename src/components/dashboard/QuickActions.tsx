import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { UserPlus, Briefcase, CheckSquare, Megaphone } from 'lucide-react'

interface QuickActionsProps {
  onAction: (action: string) => void
}

export function QuickActions({ onAction }: QuickActionsProps) {
  const actions = [
    {
      id: 'contact',
      label: 'Cadastrar Contato',
      icon: UserPlus,
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    },
    {
      id: 'deal',
      label: 'Criar Negócio',
      icon: Briefcase,
      color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
    },
    {
      id: 'task',
      label: 'Adicionar Tarefa',
      icon: CheckSquare,
      color: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
    },
    {
      id: 'campaign',
      label: 'Enviar Campanha',
      icon: Megaphone,
      color: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    },
  ]

  return (
    <Card className="shadow-sm border-t-4 border-t-gray-400">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className={`h-14 justify-start gap-3 border-0 ${action.color} transition-all duration-200 shadow-sm`}
              onClick={() => onAction(action.id)}
            >
              <action.icon className="h-5 w-5" />
              <span className="font-semibold">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
