import { useEffect, useState } from 'react'
import { Download, Trophy, DollarSign, Calculator } from 'lucide-react'
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
import { contactsService, type Purchase } from '@/services/contacts'
import { useToast } from '@/hooks/use-toast'

interface ContactPurchasesProps {
  contactId: string
}

export function ContactPurchases({ contactId }: ContactPurchasesProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (contactId) {
      contactsService
        .getPurchasesByContactId(contactId)
        .then((data) => setPurchases(data))
        .catch((err) => {
          console.error(err)
          toast({
            title: 'Erro',
            description: 'Não foi possível carregar o histórico de compras.',
            variant: 'destructive',
          })
        })
        .finally(() => setIsLoading(false))
    }
  }, [contactId, toast])

  const handleExport = () => {
    if (!purchases || purchases.length === 0) {
      toast({
        title: 'Exportação',
        description: 'Não há dados para exportar.',
      })
      return
    }

    try {
      // Create CSV content
      const headers = ['Data', 'Leilão', 'Lote', 'Descrição', 'Valor']
      const csvRows = [
        headers.join(','),
        ...purchases.map((p) => {
          const date = new Date(p.date).toLocaleDateString('pt-BR')
          const auction = p.auction_id ? p.auction_id.replace(/"/g, '""') : ''
          const lot = p.lot_number ? p.lot_number.replace(/"/g, '""') : ''
          const description = p.description
            ? p.description.replace(/"/g, '""')
            : ''
          const value = p.value.toFixed(2)
          return `"${date}","${auction}","${lot}","${description}","${value}"`
        }),
      ]

      const csvContent = '\uFEFF' + csvRows.join('\n') // Add BOM for Excel utf-8 compatibility
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `historico_compras_${contactId}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Sucesso',
        description: 'Histórico exportado com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao exportar arquivo.',
        variant: 'destructive',
      })
    }
  }

  // Calculations
  const totalInvested = purchases.reduce(
    (acc, curr) => acc + Number(curr.value),
    0,
  )
  const horsesBought = purchases.length
  const averageTicket = horsesBought > 0 ? totalInvested / horsesBought : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          Histórico de Compras
        </h2>
        <Button
          onClick={handleExport}
          variant="outline"
          className="border-primary/20 text-primary hover:bg-primary/5"
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar Histórico
        </Button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-t-4 border-t-primary shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Total Investido
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary font-display">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(totalInvested)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor acumulado em compras
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-secondary shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Quantidade de Cavalos
            </CardTitle>
            <Trophy className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary font-display">
              {horsesBought}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de lotes arrematados
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Ticket Médio
            </CardTitle>
            <Calculator className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary font-display">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(averageTicket)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média por animal adquirido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Table */}
      <Card className="shadow-sm border-0 md:border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[120px]">Data</TableHead>
                <TableHead>Leilão</TableHead>
                <TableHead className="w-[120px]">Lote</TableHead>
                <TableHead className="min-w-[200px]">
                  Descrição do Cavalo
                </TableHead>
                <TableHead className="text-right">Valor Pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhuma compra registrada.
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">
                      {new Date(purchase.date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{purchase.auction_id || '-'}</TableCell>
                    <TableCell>{purchase.lot_number || '-'}</TableCell>
                    <TableCell>{purchase.description || '-'}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(purchase.value)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
