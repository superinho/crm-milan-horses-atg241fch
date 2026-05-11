import { useEffect, useState } from 'react'
import { smartLeiloesService, SmartLeilao } from '@/services/smartleiloes'
import { campaignsService } from '@/services/campaigns'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Download, RefreshCw, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function SmartLeiloes() {
  const [leiloes, setLeiloes] = useState<SmartLeilao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [importingId, setImportingId] = useState<string | number | null>(null)
  const { toast } = useToast()

  const fetchLeiloes = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await smartLeiloesService.getLeiloes()
      setLeiloes(result.data)
      if (result.error) {
        setError(result.error)
      }
    } catch (err: any) {
      setError('Erro inesperado ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeiloes()
  }, [])

  const handleImport = async (leilao: SmartLeilao) => {
    try {
      setImportingId(leilao.id)
      const name =
        leilao.title || leilao.name || `Leilão Importado ${leilao.id}`
      const startDate =
        leilao.date || leilao.start_date || new Date().toISOString()
      const endDate = new Date(
        new Date(startDate).getTime() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString()

      await campaignsService.createCampaign(
        {
          name,
          objective:
            leilao.description || `Campanha baseada no leilão ${leilao.id}`,
          start_date: startDate,
          end_date: endDate,
          status: 'Rascunho',
          audience_filters: { tags: [], segments: [] },
          channels: ['email', 'whatsapp'],
        },
        [],
      )

      toast({
        title: 'Campanha Criada',
        description: `${name} foi importado com sucesso como rascunho.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro na Importação',
        description:
          err.message || 'Não foi possível converter o leilão em campanha.',
        variant: 'destructive',
      })
    } finally {
      setImportingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Integração SmartLeilões
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize os eventos da API externa e importe-os como campanhas no
            seu CRM.
          </p>
        </div>
        <Button onClick={fetchLeiloes} disabled={loading} variant="outline">
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          />
          Atualizar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aviso de Integração</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Leilões Disponíveis</CardTitle>
          <CardDescription>
            Eventos listados em api.smartleiloes.digital
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : leiloes.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhum leilão encontrado na API no momento.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome / Título</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leiloes.map((leilao) => (
                    <TableRow key={leilao.id}>
                      <TableCell className="font-medium">
                        {leilao.title || leilao.name || `Leilão #${leilao.id}`}
                        {leilao.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-xs mt-1">
                            {leilao.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {leilao.date || leilao.start_date
                          ? new Date(
                              leilao.date || leilao.start_date!,
                            ).toLocaleDateString('pt-BR')
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            leilao.status === 'Aberto' ? 'default' : 'secondary'
                          }
                        >
                          {leilao.status || 'Desconhecido'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleImport(leilao)}
                          disabled={importingId === leilao.id}
                        >
                          {importingId === leilao.id ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          Importar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
