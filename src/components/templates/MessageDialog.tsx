import { useState, useEffect, useRef } from 'react'
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
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Send, MessageSquare, Mail, Paperclip, X } from 'lucide-react'
import {
  templatesService,
  MessageTemplate,
  TemplateType,
} from '@/services/templates'
import { contactsService, Contact, Bid, Purchase } from '@/services/contacts'
import { dealsService, Deal } from '@/services/deals'
import { RichTextEditor } from '@/components/ui/rich-text-editor'

interface MessageDialogProps {
  contact: Contact
  open: boolean
  onOpenChange: (open: boolean) => void
  onInteractionAdded?: () => void
  initialTab?: 'WhatsApp' | 'E-mail'
}

export function MessageDialog({
  contact,
  open,
  onOpenChange,
  onInteractionAdded,
  initialTab = 'WhatsApp',
}: MessageDialogProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [activeType, setActiveType] = useState<TemplateType>(initialTab)
  const [previewBody, setPreviewBody] = useState('')
  const [previewSubject, setPreviewSubject] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [contextData, setContextData] = useState<{
    deal?: Deal
    bid?: Bid
    purchase?: Purchase
  }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Load Templates and Context Data
  useEffect(() => {
    if (open) {
      setLoading(true)
      setActiveType(initialTab)

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
  }, [open, contact.id, toast, initialTab])

  // Process Variables
  useEffect(() => {
    const template = templates.find((t) => t.id === selectedTemplateId)
    if (!template) {
      // Don't reset if typing manually
      if (selectedTemplateId === 'none') return
      return
    }

    const replaceVariables = (text: string) => {
      let processed = text.replace(/{{nome}}/g, contact.name)

      // Find best context for other variables
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
    }
  }, [selectedTemplateId, templates, contact, contextData])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        // Remove data url prefix (e.g. "data:image/png;base64,")
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const handleSend = async () => {
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

      // Open WhatsApp
      window.open(`https://wa.me/55${phone}?text=${encoded}`, '_blank')

      // Log interaction
      try {
        await contactsService.addInteraction({
          contact_id: contact.id,
          type: 'WhatsApp Enviado',
          description: previewBody,
          date: new Date().toISOString(),
          status: 'sent',
        })
        if (onInteractionAdded) onInteractionAdded()
      } catch (err) {
        console.error('Failed to log whatsapp', err)
      }

      onOpenChange(false)
    } else {
      // Sending Email
      if (!contact.email) {
        toast({
          title: 'Erro',
          description: 'Contato não possui e-mail cadastrado.',
          variant: 'destructive',
        })
        return
      }
      if (!previewSubject) {
        toast({
          title: 'Erro',
          description: 'O assunto do e-mail é obrigatório.',
          variant: 'destructive',
        })
        return
      }

      setSending(true)
      try {
        // Convert attachments to base64
        const processedAttachments = await Promise.all(
          attachments.map(async (file) => ({
            filename: file.name,
            content: await fileToBase64(file),
          })),
        )

        await contactsService.sendEmail(
          contact.id,
          contact.email,
          previewSubject,
          previewBody,
          processedAttachments,
        )

        toast({
          title: 'Sucesso',
          description: 'E-mail enviado com sucesso!',
        })

        if (onInteractionAdded) onInteractionAdded()
        onOpenChange(false)

        // Reset state
        setPreviewBody('')
        setPreviewSubject('')
        setAttachments([])
        setSelectedTemplateId('')
      } catch (error) {
        console.error(error)
        toast({
          title: 'Erro',
          description: 'Falha ao enviar e-mail. Tente novamente.',
          variant: 'destructive',
        })
      } finally {
        setSending(false)
      }
    }
  }

  const filteredTemplates = templates.filter((t) => t.type === activeType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[90vh] sm:h-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>Enviar Mensagem</DialogTitle>
          <DialogDescription>
            Selecione um canal e redija sua mensagem para {contact.name}.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 px-1">
            <Tabs
              defaultValue={initialTab}
              value={activeType}
              onValueChange={(v) => {
                setActiveType(v as TemplateType)
                setSelectedTemplateId('')
                setPreviewBody('')
                setPreviewSubject('')
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label>Destinatário</Label>
                  <Input value={contact.email} disabled className="bg-muted" />
                </div>
              )}
            </div>

            {activeType === 'E-mail' && (
              <div className="space-y-2">
                <Label>Assunto</Label>
                <Input
                  value={previewSubject}
                  onChange={(e) => setPreviewSubject(e.target.value)}
                  placeholder="Assunto do e-mail"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>
                Mensagem {activeType === 'WhatsApp' ? '(Texto)' : '(Rich Text)'}
              </Label>
              {activeType === 'WhatsApp' ? (
                <Textarea
                  value={previewBody}
                  onChange={(e) => setPreviewBody(e.target.value)}
                  className="h-40 font-mono text-sm"
                  placeholder="Digite sua mensagem do WhatsApp..."
                />
              ) : (
                <RichTextEditor
                  value={previewBody}
                  onChange={setPreviewBody}
                  placeholder="Escreva o conteúdo do e-mail..."
                  className="min-h-[200px]"
                />
              )}
            </div>

            {activeType === 'E-mail' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Anexar Arquivos
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    onChange={handleFileChange}
                  />
                  <span className="text-xs text-muted-foreground">
                    {attachments.length > 0
                      ? `${attachments.length} arquivo(s) selecionado(s)`
                      : 'Nenhum arquivo selecionado'}
                  </span>
                </div>

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs"
                      >
                        <span className="truncate max-w-[150px]">
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeAttachment(idx)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 mt-auto border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={
              !previewBody ||
              sending ||
              (activeType === 'E-mail' && !previewSubject)
            }
            className={
              activeType === 'WhatsApp'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar {activeType}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
