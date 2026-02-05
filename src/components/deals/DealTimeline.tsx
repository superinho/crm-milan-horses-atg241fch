import { useState, useEffect } from 'react'
import {
  Mail,
  MessageCircle,
  Phone,
  FileText,
  CheckCircle2,
  Clock,
  Plus,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { contactsService, Interaction } from '@/services/contacts'

interface DealTimelineProps {
  dealId: string
  contactId: string
}

export function DealTimeline({ dealId, contactId }: DealTimelineProps) {
  const [items, setItems] = useState<Interaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newInteraction, setNewInteraction] = useState({
    type: 'nota adicionada',
    description: '',
    date: new Date().toISOString().slice(0, 16),
  })
  const { toast } = useToast()

  const fetchTimelineData = async () => {
    setIsLoading(true)
    try {
      const interactions = await contactsService.getDealInteractions(dealId)
      setItems(interactions)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o histórico.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (dealId) {
      fetchTimelineData()
    }
  }, [dealId])

  const handleAddInteraction = async () => {
    if (!newInteraction.description) {
      toast({
        title: 'Campo obrigatório',
        description: 'Por favor, insira uma descrição.',
        variant: 'destructive',
      })
      return
    }

    try {
      await contactsService.addInteraction({
        contact_id: contactId,
        deal_id: dealId,
        type: newInteraction.type,
        description: newInteraction.description,
        date: new Date(newInteraction.date).toISOString(),
      })

      toast({
        title: 'Sucesso',
        description: 'Interação registrada.',
      })

      setIsDialogOpen(false)
      setNewInteraction({
        type: 'nota adicionada',
        description: '',
        date: new Date().toISOString().slice(0, 16),
      })
      fetchTimelineData()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Falha ao registrar interação.',
        variant: 'destructive',
      })
    }
  }

  const getIcon = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes('email') || t.includes('e-mail'))
      return <Mail className="h-4 w-4" />
    if (t.includes('whatsapp')) return <MessageCircle className="h-4 w-4" />
    if (t.includes('ligação') || t.includes('call'))
      return <Phone className="h-4 w-4" />
    if (t.includes('nota')) return <FileText className="h-4 w-4" />
    return <CheckCircle2 className="h-4 w-4" />
  }

  const getColorClass = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes('email') || t.includes('e-mail'))
      return 'bg-blue-100 text-blue-600 border-blue-200'
    if (t.includes('whatsapp'))
      return 'bg-green-100 text-green-600 border-green-200'
    if (t.includes('ligação') || t.includes('call'))
      return 'bg-purple-100 text-purple-600 border-purple-200'
    if (t.includes('nota')) return 'bg-gray-100 text-gray-600 border-gray-200'
    return 'bg-gray-100 text-gray-600 border-gray-200'
  }

  return (
    <Card className="shadow-sm h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Timeline do Negócio
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" variant="outline">
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Interação</DialogTitle>
              <DialogDescription>
                Registre uma interação específica para este negócio.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={newInteraction.type}
                  onValueChange={(val) =>
                    setNewInteraction({ ...newInteraction, type: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nota adicionada">Nota</SelectItem>
                    <SelectItem value="ligação realizada">Ligação</SelectItem>
                    <SelectItem value="whatsapp enviado">WhatsApp</SelectItem>
                    <SelectItem value="e-mail enviado">E-mail</SelectItem>
                    <SelectItem value="reunião agendada">Reunião</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Data e Hora</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={newInteraction.date}
                  onChange={(e) =>
                    setNewInteraction({
                      ...newInteraction,
                      date: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Detalhes..."
                  value={newInteraction.description}
                  onChange={(e) =>
                    setNewInteraction({
                      ...newInteraction,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddInteraction}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="relative pl-6 pr-2">
        <div className="absolute left-[37px] top-6 bottom-6 w-[2px] bg-muted/60" />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma interação registrada neste negócio.
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => (
              <div key={item.id} className="relative pl-8 group">
                <div
                  className={cn(
                    'absolute left-[-13px] top-0 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm z-10',
                    getColorClass(item.type),
                  )}
                >
                  {getIcon(item.type)}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground capitalize">
                      {item.type}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {format(new Date(item.date), 'dd MMM yyyy, HH:mm', {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md border border-muted/50 mt-1">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
