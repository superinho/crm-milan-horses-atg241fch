import { useEffect, useState } from 'react'
import { Gavel, AlertCircle, Send, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { contactsService, type Bid } from '@/services/contacts'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ContactBidsProps {
  contactId: string
}

export function ContactBids({ contactId }: ContactBidsProps) {
  const [bids, setBids] = useState<Bid[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (contactId) {
      contactsService
        .getBidsByContactId(contactId)
        .then((data) => setBids(data))
        .catch((err) => {
          console.error(err)
          toast({
            title: 'Erro',
            description: 'Não foi possível carregar o histórico de lances.',
            variant: 'destructive',
          })
        })
        .finally(() => setIsLoading(false))
    }
  }, [contactId, toast])

  const handleSendSimilarLot = (bid: Bid) => {
    toast({
      title: 'Ação Iniciada',
      description: `Iniciando envio de lote similar ao ${bid.lot_number} para o cliente.`,
      action: (
        <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-5 w-5 text-white" />
        </div>
      ),
    })
  }

  const isRecent = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 30
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (bids.length === 0) {
    return (
      <Card className="shadow-sm border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <div className="bg-muted p-4 rounded-full mb-4">
            <Gavel className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            Sem lances perdidos
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Este contato não possui histórico de lances malsucedidos
            registrados.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Gavel className="h-5 w-5" />
          Lances Não Arrematados
        </h2>
        <Badge variant="outline" className="ml-2">
          {bids.length}
        </Badge>
      </div>

      <Card className="shadow-sm border border-border">
        <CardHeader className="bg-muted/10 pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            Histórico de Oportunidades
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[120px]">Data</TableHead>
                <TableHead>Leilão</TableHead>
                <TableHead className="w-[100px]">Lote</TableHead>
                <TableHead>Valor do Lance</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bids.map((bid) => {
                const recent = isRecent(bid.date)
                return (
                  <TableRow
                    key={bid.id}
                    className={cn(
                      recent
                        ? 'bg-amber-50/40 hover:bg-amber-50/60 dark:bg-amber-950/10 dark:hover:bg-amber-950/20'
                        : '',
                    )}
                  >
                    <TableCell className="font-medium relative">
                      {new Date(bid.date).toLocaleDateString('pt-BR')}
                      {recent && (
                        <span
                          className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 rounded-l-md"
                          title="Lance Recente"
                        ></span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className="block truncate max-w-[180px]"
                        title={bid.auction_id || ''}
                      >
                        {bid.auction_id || '-'}
                      </span>
                    </TableCell>
                    <TableCell>{bid.lot_number || '-'}</TableCell>
                    <TableCell className="font-semibold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(bid.value)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {bid.reason || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={recent ? 'default' : 'outline'}
                        className={cn(
                          'gap-2 h-8',
                          recent
                            ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                            : '',
                        )}
                        onClick={() => handleSendSimilarLot(bid)}
                      >
                        <Send className="h-3 w-3" />
                        Enviar lote similar
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded border border-amber-100 dark:border-amber-900 w-fit">
        <AlertCircle className="h-3 w-3 text-amber-500" />
        <span>
          Lances nos últimos 30 dias são destacados como oportunidades de
          reengajamento.
        </span>
      </div>
    </div>
  )
}
