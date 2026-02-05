import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Calendar,
  DollarSign,
  StickyNote,
  Activity,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { dealsService, Deal } from '@/services/deals'
import { DealTimeline } from '@/components/deals/DealTimeline'
import { DealTasks } from '@/components/deals/DealTasks'
import { cn } from '@/lib/utils'

export default function DealDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [deal, setDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    if (id) {
      fetchDeal()
    }
  }, [id])

  const fetchDeal = async () => {
    try {
      if (!id) return
      const data = await dealsService.getDealById(id)
      setDeal(data)
      setNotes(data.notes || '')
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o negócio.',
        variant: 'destructive',
      })
      navigate('/negocios')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!deal) return
    setSavingNotes(true)
    try {
      await dealsService.updateDeal(deal.id, { notes })
      toast({
        title: 'Sucesso',
        description: 'Notas atualizadas.',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Falha ao salvar notas.',
        variant: 'destructive',
      })
    } finally {
      setSavingNotes(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!deal) return null

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Lead':
        return 'bg-gray-400'
      case 'Qualificado':
        return 'bg-blue-400'
      case 'Interesse':
        return 'bg-yellow-400'
      case 'Proposta':
        return 'bg-orange-400'
      case 'Fechado':
        return 'bg-green-500'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
      {/* Header Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/negocios')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display text-primary flex items-center gap-3">
            Detalhes do Negócio
          </h1>
          <p className="text-muted-foreground text-sm">
            Gerencie todas as informações desta oportunidade.
          </p>
        </div>
      </div>

      {/* Deal Overview Header */}
      <Card className="shadow-sm border-t-4 border-t-primary">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                Cliente
              </span>
              {deal.contact ? (
                <Link
                  to={`/contatos/${deal.contact.id}`}
                  className="flex items-center gap-3 group"
                >
                  <Avatar className="h-10 w-10 border border-muted group-hover:scale-105 transition-transform">
                    <AvatarImage
                      src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${deal.contact.id}`}
                    />
                    <AvatarFallback>
                      {deal.contact.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-primary group-hover:underline">
                      {deal.contact.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {deal.contact.phone}
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />{' '}
                  <span>Sem contato vinculado</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                Negócio
              </span>
              <p className="font-bold text-lg leading-tight">{deal.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className={cn(
                    'text-white border-0',
                    getStageColor(deal.stage),
                  )}
                >
                  {deal.stage}
                </Badge>
                {deal.probability > 0 && (
                  <span className="text-xs font-medium text-muted-foreground">
                    {deal.probability}% Probabilidade
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                Valor Estimado
              </span>
              <div className="flex items-center gap-2 text-primary">
                <DollarSign className="h-5 w-5" />
                <span className="text-2xl font-bold font-display">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    maximumFractionDigits: 0,
                  }).format(deal.value)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                Previsão de Fechamento
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">
                  {deal.expected_close_date
                    ? format(
                        new Date(deal.expected_close_date),
                        "dd 'de' MMMM, yyyy",
                        { locale: ptBR },
                      )
                    : 'Data não definida'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Timeline */}
        <div className="lg:col-span-2 h-[600px]">
          <DealTimeline dealId={deal.id} contactId={deal.contact_id} />
        </div>

        {/* Right Column: Tasks & Notes */}
        <div className="space-y-6 flex flex-col h-[600px]">
          <div className="flex-1 min-h-0">
            <DealTasks dealId={deal.id} />
          </div>

          <div className="shrink-0">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-primary" />
                  Notas Internas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Escreva estratégias ou observações sobre este negócio..."
                  className="min-h-[120px] resize-none text-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleSaveNotes}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] text-muted-foreground">
                    {savingNotes
                      ? 'Salvando...'
                      : 'Salvo automaticamente ao sair do campo.'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
