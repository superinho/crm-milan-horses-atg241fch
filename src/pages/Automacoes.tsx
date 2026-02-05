import { useState, useEffect } from 'react'
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
import {
  Zap,
  Clock,
  UserPlus,
  Mail,
  Play,
  Loader2,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react'
import { automationsService, AutomationSetting } from '@/services/automations'
import { useToast } from '@/hooks/use-toast'

export default function Automacoes() {
  const [settings, setSettings] = useState<AutomationSetting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const data = await automationsService.getSettings()
      setSettings(data)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleToggle = async (id: string, currentState: boolean) => {
    // Optimistic update
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: !currentState } : s)),
    )

    try {
      await automationsService.updateSetting(id, { is_active: !currentState })
    } catch (error) {
      console.error(error)
      // Revert on error
      setSettings((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: currentState } : s)),
      )
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a configuração.',
        variant: 'destructive',
      })
    }
  }

  const handleRunManually = async () => {
    setIsProcessing(true)
    try {
      const result = await automationsService.triggerAutomationProcess()

      const details = [
        result.birthday > 0 ? `${result.birthday} aniversários` : null,
        result.post_sale > 0 ? `${result.post_sale} pós-vendas` : null,
        result.inactivity > 0 ? `${result.inactivity} inativos` : null,
        result.lost_bid > 0 ? `${result.lost_bid} lances perdidos` : null,
      ]
        .filter(Boolean)
        .join(', ')

      toast({
        title: 'Automação Executada',
        description: details
          ? `Tarefas criadas: ${details}`
          : 'Nenhuma nova tarefa foi necessária.',
      })
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro na Execução',
        description: error.message || 'Falha ao processar automações.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getIcon = (key: string) => {
    switch (key) {
      case 'birthday':
        return <UserPlus className="h-6 w-6" />
      case 'post_sale':
        return <Clock className="h-6 w-6" />
      case 'inactivity':
        return <AlertTriangle className="h-6 w-6" />
      case 'lost_bid':
        return <AlertCircle className="h-6 w-6" />
      default:
        return <Zap className="h-6 w-6" />
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-primary">
            Automações de Tarefas
          </h1>
          <p className="text-muted-foreground">
            Configure regras para geração automática de tarefas e follow-ups.
          </p>
        </div>
        <Button
          onClick={handleRunManually}
          disabled={isProcessing || isLoading}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          {isProcessing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Executar Agora
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {settings.map((setting) => (
            <Card
              key={setting.id}
              className={`relative overflow-hidden transition-all duration-300 ${
                setting.is_active
                  ? 'border-l-4 border-l-primary shadow-md'
                  : 'opacity-80 border-l-4 border-l-muted'
              }`}
            >
              <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                <div
                  className={`p-2 rounded-md ${setting.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                >
                  {getIcon(setting.rule_key)}
                </div>
                <Switch
                  checked={setting.is_active}
                  onCheckedChange={() =>
                    handleToggle(setting.id, setting.is_active)
                  }
                />
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <CardTitle className="text-lg leading-tight mb-2">
                    {setting.name}
                  </CardTitle>
                  <CardDescription className="text-sm min-h-[40px]">
                    {setting.description}
                  </CardDescription>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Badge
                    variant={setting.is_active ? 'default' : 'secondary'}
                    className="text-xs font-normal"
                  >
                    {setting.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    Regra: {setting.rule_key}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}

          {settings.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Nenhuma configuração encontrada. Verifique se as migrações foram
              executadas.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
