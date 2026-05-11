import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Loader2,
  MessageSquare,
  Send,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import { campaignsService, CampaignSendLog } from '@/services/campaigns'
import { useToast } from '@/hooks/use-toast'

interface WhatsAppSenderProps {
  campaignId: string
  onRefresh: () => void
}

export function WhatsAppSender({ campaignId, onRefresh }: WhatsAppSenderProps) {
  const [queue, setQueue] = useState<CampaignSendLog[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchQueue = async () => {
    setLoading(true)
    try {
      const data = await campaignsService.getWhatsAppQueue(campaignId)
      setQueue(data)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a fila de envio.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [campaignId])

  const handleSend = async (item: CampaignSendLog) => {
    // 1. Prepare Link
    const phone = item.contact?.whatsapp || item.contact?.phone
    if (!phone) {
      toast({
        title: 'Erro',
        description: 'Contato sem número de telefone.',
        variant: 'destructive',
      })
      return
    }

    const cleanPhone = phone.replace(/\D/g, '')
    const message = item.content || item.metadata?.message || ''
    const url = `https://wa.me/55${cleanPhone.replace(/^55/, '')}${
      message ? `?text=${encodeURIComponent(message)}` : ''
    }`

    window.open(url, '_blank')
    setProcessingId(item.id)

    // 2. Mark as Sent in DB
    try {
      await campaignsService.markAsSent(item.id)

      // Remove from local queue visually
      setQueue((prev) => prev.filter((q) => q.id !== item.id))

      toast({
        title: 'Enviado',
        description: 'Marcado como enviado com sucesso.',
      })
      onRefresh() // Update parent stats
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status.',
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  Fila de Envio Manual
                </CardTitle>
                <CardDescription>
                  {queue.length} mensagens registradas nesta campanha
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={fetchQueue}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
              ) : queue.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 text-green-100 mb-4" />
                  <p>Todos os envios foram concluídos!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {queue.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-mono text-xs">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {item.contact?.name || 'Contato Sem Nome'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.contact?.whatsapp || item.contact?.phone}
                          </p>
                          {item.error_message ? (
                            <p className="mt-1 max-w-md text-xs text-destructive">
                              {item.error_message}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.status === 'sent' ? 'default' : 'outline'}>
                          {item.status}
                        </Badge>
                        {item.status !== 'sent' ? (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleSend(item)}
                            disabled={!!processingId}
                          >
                            {processingId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="mr-2 h-4 w-4" /> Abrir
                              </>
                            )}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Instruções</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              Com o BotConversa configurado, os envios são disparados pela
              função de campanha. Esta fila também permite fallback manual via
              WhatsApp Web para mensagens que falharem.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>
                Clique em "Abrir" para abrir a conversa no WhatsApp
                Web/Desktop.
              </li>
              <li>A mensagem (se configurada) já estará digitada.</li>
              <li>Aperte Enter no WhatsApp para enviar.</li>
              <li>
                O sistema marcará automaticamente como "Enviado" e passará para
                o próximo.
              </li>
            </ol>
            <div className="bg-yellow-50 p-3 rounded border border-yellow-100 text-yellow-800 text-xs mt-4">
              <strong>Dica:</strong> Mantenha o WhatsApp Web aberto em outra aba
              para agilizar o processo.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
