import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Send, MessageSquare, Mail } from 'lucide-react'
import {
  templatesService,
  MessageTemplate,
  TemplateType,
} from '@/services/templates'
import { contactsService, Contact, Bid, Purchase } from '@/services/contacts'
import { dealsService, Deal } from '@/services/deals'

interface MessageDialogProps {
  contact: Contact
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MessageDialog({
  contact,
  open,
  onOpenChange,
}: MessageDialogProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [activeType, setActiveType] = useState<TemplateType>('WhatsApp')
  const [previewBody, setPreviewBody] = useState('')
  const [previewSubject, setPreviewSubject] = useState('')
  const [contextData, setContextData] = useState<{
    deal?: Deal
    bid?: Bid
    purchase?: Purchase
  }>({})
  const { toast } = useToast()

  // Load Templates and Context Data
  useEffect(() => {
    if (open) {
      setLoading(true)
      const fetchData = async () => {
        try {
          // Fetch templates
          const tpls = await templatesService.getTemplates()
          setTemplates(tpls)

          // Fetch context data (latest bid, purchase, deal)
          const [bids, purchases, deals] = await Promise.all([
            contactsService.getBidsByContactId(contact.id),
            contactsService.getPurchasesByContactId(contact.id),
            dealsService.getDealsByContactId(contact.id),
          ])

          setContextData({
            bid: bids[0], // Latest bid
            purchase: purchases[0], // Latest purchase
            deal: deals[0], // Latest deal
          })
        } catch (error) {
          console.error(error)
          toast({
            title: 'Erro',
            description: 'Falha ao carregar dados.',
            variant: 'destructive',
          })
        } finally {
          setLoading(false)
        }
      }
      fetchData()
    }
  }, [open, contact.id, toast])

  // Process Variables
  useEffect(() => {
    const template = templates.find((t) => t.id === selectedTemplateId)
    if (!template) {
      setPreviewBody('')
      setPreviewSubject('')
      return
    }

    const replaceVariables = (text: string) => {
      let processed = text.replace(/{{nome}}/g, contact.name)

      // Find best context for other variables
      // Priority: Purchase > Bid > Deal (or based on what's available)
      const purchase = contextData.purchase
      const bid = contextData.bid
      const deal = contextData.deal

      // Lote
      const lote =
        purchase?.lot_number ||
        bid?.lot_number ||
        (deal ? 'N/A' : '[Lote não encontrado]')
      processed = processed.replace(/{{lote}}/g, lote)

      // Leilão
      const leilao =
        purchase?.auction_id ||
        bid?.auction_id ||
        (deal ? deal.title : '[Leilão não encontrado]')
      processed = processed.replace(/{{leilao}}/g, leilao)

      // Valor
      const valorRaw = purchase?.value || bid?.value || deal?.value
      const valor = valorRaw
        ? new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(valorRaw)
        : '[Valor não encontrado]'
      processed = processed.replace(/{{valor}}/g, valor)

      return processed
    }

    setPreviewBody(replaceVariables(template.body))
    if (template.subject) {
      setPreviewSubject(replaceVariables(template.subject))
    } else {
      setPreviewSubject('')
    }
    setActiveType(template.type)
  }, [selectedTemplateId, templates, contact, contextData])

  const handleSend = () => {
    if (!previewBody) return

    if (activeType === 'WhatsApp') {
      if (!contact.phone && !contact.whatsapp) {
        toast({
          title: 'Erro',
          description: 'Contato não possui telefone cadastrado.',
          variant: 'destructive',
        })
        return
      }
      const phone = (contact.whatsapp || contact.phone).replace(/\D/g, '')
      const encoded = encodeURIComponent(previewBody)
      window.open(`https://wa.me/55${phone}?text=${encoded}`, '_blank')
    } else {
      if (!contact.email) {
        toast({
          title: 'Erro',
          description: 'Contato não possui e-mail cadastrado.',
          variant: 'destructive',
        })
        return
      }
      const subject = encodeURIComponent(previewSubject)
      const body = encodeURIComponent(previewBody)
      window.open(
        `mailto:${contact.email}?subject=${subject}&body=${body}`,
        '_blank',
      )
    }
    onOpenChange(false)
    toast({
      title: 'Redirecionado',
      description: `Abrindo aplicativo de ${activeType}...`,
    })
  }

  const filteredTemplates = templates.filter((t) => t.type === activeType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Enviar Mensagem</DialogTitle>
          <DialogDescription>
            Selecione um modelo para enviar para {contact.name}.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs
              defaultValue="WhatsApp"
              value={activeType}
              onValueChange={(v) => {
                setActiveType(v as TemplateType)
                setSelectedTemplateId('')
                setPreviewBody('')
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="WhatsApp">
                  <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
                </TabsTrigger>
                <TabsTrigger value="E-mail">
                  <Mail className="mr-2 h-4 w-4" /> E-mail
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <Label>Modelo</Label>
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredTemplates.length > 0 ? (
                    filteredTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title} ({t.category})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      Nenhum template encontrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {activeType === 'E-mail' && (
              <div className="space-y-2">
                <Label>Assunto</Label>
                <div className="p-2 border rounded-md bg-muted/20 text-sm">
                  {previewSubject || (
                    <span className="text-muted-foreground italic">
                      Selecione um template...
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Mensagem (Prévia editável)</Label>
              <Textarea
                value={previewBody}
                onChange={(e) => setPreviewBody(e.target.value)}
                className="h-40 font-mono text-sm"
                placeholder="O conteúdo da mensagem aparecerá aqui..."
              />
              <p className="text-xs text-muted-foreground">
                Variáveis como <code>{`{{nome}}`}</code> foram substituídas
                automaticamente.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSend}
                disabled={!previewBody}
                className={
                  activeType === 'WhatsApp'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }
              >
                <Send className="mr-2 h-4 w-4" />
                Enviar {activeType}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
