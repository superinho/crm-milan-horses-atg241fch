import { useState, useEffect } from 'react'
import {
  Mail,
  MessageCircle,
  Phone,
  FileText,
  Gavel,
  ShoppingBag,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  ExternalLink,
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
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  contactsService,
  type Interaction,
  type Purchase,
  type Bid,
} from '@/services/contacts'

interface ContactTimelineProps {
  contactId: string
  refreshTrigger?: number
}

type TimelineItem = {
  id: string
  type:
    | 'interaction'
    | 'bid'
    | 'purchase'
    | 'email'
    | 'whatsapp'
    | 'call'
    | 'note'
  subType?: string
  date: Date
  title: string
  description: string | null
  value?: number
  status?: string | null
  metadata?: any
}

export function ContactTimeline({
  contactId,
  refreshTrigger = 0,
}: ContactTimelineProps) {
  const [items, setItems] = useState<TimelineItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newInteraction, setNewInteraction] = useState({
    type: 'nota adicionada',
    description: '',
    date: new Date().toISOString().slice(0, 16), // Format for datetime-local
  })
  const { toast } = useToast()

  const fetchTimelineData = async () => {
    setIsLoading(true)
    try {
      const [interactions, bids, purchases] = await Promise.all([
        contactsService.getContactInteractions(contactId),
        contactsService.getBidsByContactId(contactId),
        contactsService.getPurchasesByContactId(contactId),
      ])

      const timelineItems: TimelineItem[] = []

      // Map Interactions
      interactions.forEach((i: Interaction) => {
        let type: TimelineItem['type'] = 'interaction'
        if (
          i.type.toLowerCase() === 'email' ||
          i.type.toLowerCase().includes('email') ||
          i.type.toLowerCase().includes('e-mail')
        )
          type = 'email'
        else if (i.type.toLowerCase().includes('whatsapp')) type = 'whatsapp'
        else if (
          i.type.toLowerCase().includes('ligação') ||
          i.type.toLowerCase().includes('call')
        )
          type = 'call'
        else if (i.type.toLowerCase().includes('nota')) type = 'note'

        timelineItems.push({
          id: `int-${i.id}`,
          type,
          subType: i.type,
          date: new Date(i.date),
          title:
            i.type === 'email'
              ? i.description || 'E-mail Enviado'
              : i.type.charAt(0).toUpperCase() + i.type.slice(1),
          description:
            i.type === 'email' && i.metadata?.body_snippet
              ? i.metadata.body_snippet
              : i.description,
          status: i.status,
          metadata: i.metadata,
        })
      })

      // Map Bids
      bids.forEach((b: Bid) => {
        timelineItems.push({
          id: `bid-${b.id}`,
          type: 'bid',
          date: new Date(b.date),
          title: 'Lance dado',
          description: `${b.auction_id || 'Leilão desconhecido'} - Lote ${b.lot_number || '?'}`,
          value: b.value,
        })
      })

      // Map Purchases
      purchases.forEach((p: Purchase) => {
        timelineItems.push({
          id: `pur-${p.id}`,
          type: 'purchase',
          date: new Date(p.date),
          title: 'Compra realizada',
          description: `${p.auction_id || 'Venda direta'} - ${p.description || 'Cavalo'}`,
          value: p.value,
        })
      })

      // Sort by Date Descending
      timelineItems.sort((a, b) => b.date.getTime() - a.date.getTime())

      setItems(timelineItems)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o histórico de interações.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (contactId) {
      fetchTimelineData()
    }
  }, [contactId, refreshTrigger])

  const handleAddInteraction = async () => {
    if (!newInteraction.description) {
      toast({
        title: 'Campo obrigatório',
        description: 'Por favor, insira uma descrição para a interação.',
        variant: 'destructive',
      })
      return
    }

    try {
      await contactsService.addInteraction({
        contact_id: contactId,
        type: newInteraction.type,
        description: newInteraction.description,
        date: new Date(newInteraction.date).toISOString(),
      })

      toast({
        title: 'Sucesso',
        description: 'Interação registrada com sucesso.',
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
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4" />
      case 'call':
        return <Phone className="h-4 w-4" />
      case 'note':
        return <FileText className="h-4 w-4" />
      case 'bid':
        return <Gavel className="h-4 w-4" />
      case 'purchase':
        return <ShoppingBag className="h-4 w-4" />
      default:
        return <CheckCircle2 className="h-4 w-4" />
    }
  }

  const getColorClass = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-600 border-blue-200'
      case 'whatsapp':
        return 'bg-green-100 text-green-600 border-green-200'
      case 'call':
        return 'bg-purple-100 text-purple-600 border-purple-200'
      case 'note':
        return 'bg-gray-100 text-gray-600 border-gray-200'
      case 'bid':
        return 'bg-amber-100 text-amber-600 border-amber-200'
      case 'purchase':
        return 'bg-rose-100 text-rose-600 border-rose-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge
            variant="secondary"
            className="text-[10px] h-5 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
          >
            Enviado
          </Badge>
        )
      case 'delivered':
        return (
          <Badge
            variant="secondary"
            className="text-[10px] h-5 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
          >
            Entregue
          </Badge>
        )
      case 'opened':
        return (
          <Badge
            variant="secondary"
            className="text-[10px] h-5 bg-green-100 text-green-800 hover:bg-green-200 border-green-300"
          >
            Aberto
          </Badge>
        )
      case 'clicked':
        return (
          <Badge
            variant="secondary"
            className="text-[10px] h-5 bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
          >
            Clicado
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <Card className="shadow-sm h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Linha do Tempo
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-3.5 w-3.5" />
              Adicionar Interação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Interação</DialogTitle>
              <DialogDescription>
                Registre um novo ponto de contato com este cliente.
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
                    <SelectItem value="e-mail enviado">
                      E-mail Enviado
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Data e Hora</Label>
                <div className="relative">
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
                    className="pl-10"
                  />
                  <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Detalhes sobre a interação..."
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
        {/* Vertical Line */}
        <div className="absolute left-[37px] top-6 bottom-6 w-[2px] bg-muted/60" />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma interação registrada.
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => (
              <div key={item.id} className="relative pl-8 group">
                {/* Icon */}
                <div
                  className={cn(
                    'absolute left-[-13px] top-0 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm z-10',
                    getColorClass(item.type),
                  )}
                >
                  {getIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {item.title}
                      </span>
                      {item.status && getStatusBadge(item.status)}
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {format(item.date, "dd MMM yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  {item.description && (
                    <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md border border-muted/50 mt-1">
                      {item.type === 'email' ? (
                        <div
                          dangerouslySetInnerHTML={{ __html: item.description }}
                        />
                      ) : (
                        item.description
                      )}
                    </div>
                  )}
                  {item.value !== undefined && (
                    <p className="text-sm font-medium text-primary mt-1">
                      Valor:{' '}
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(item.value)}
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
