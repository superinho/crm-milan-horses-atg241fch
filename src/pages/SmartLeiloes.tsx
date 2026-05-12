import { useEffect, useState } from 'react'
import { smartLeiloesService, SmartLeilao } from '@/services/smartleiloes'
import { auctionsService, Auction } from '@/services/auctions'
import {
  smartLeiloesSyncService,
  SmartLeiloesSyncSummary,
} from '@/services/smartleiloes-sync'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
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
import {
  Download,
  RefreshCw,
  AlertCircle,
  Search,
  PlusCircle,
  DatabaseZap,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { DealForm } from '@/components/deals/DealForm'
import { formatCivilDate } from '@/lib/dates'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function SmartLeiloes() {
  const [liveLeiloes, setLiveLeiloes] = useState<SmartLeilao[]>([])
  const [savedAuctions, setSavedAuctions] = useState<Auction[]>([])

  const [loadingLive, setLoadingLive] = useState(true)
  const [loadingSaved, setLoadingSaved] = useState(true)
  const [errorLive, setErrorLive] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [importingId, setImportingId] = useState<string | number | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncSummary, setLastSyncSummary] =
    useState<SmartLeiloesSyncSummary | null>(null)

  const [dealAuction, setDealAuction] = useState<Auction | null>(null)
  const { toast } = useToast()

  const fetchLiveLeiloes = async () => {
    try {
      setLoadingLive(true)
      setErrorLive(null)
      const result = await smartLeiloesService.getLeiloes()
      setLiveLeiloes(result.data)
      if (result.error) {
        setErrorLive(result.error)
      }
    } catch (err: any) {
      setErrorLive('Erro inesperado ao carregar dados.')
    } finally {
      setLoadingLive(false)
    }
  }

  const fetchSavedAuctions = async () => {
    try {
      setLoadingSaved(true)
      const data = await auctionsService.getAuctions()
      setSavedAuctions(data)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoadingSaved(false)
    }
  }

  const handleSemanticSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) {
      fetchSavedAuctions()
      return
    }
    try {
      setIsSearching(true)
      const data = await auctionsService.searchAuctions(searchQuery)
      setSavedAuctions(data || [])
    } catch (err: any) {
      toast({
        title: 'Erro na busca',
        description: 'Não foi possível realizar a busca semântica.',
        variant: 'destructive',
      })
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    fetchLiveLeiloes()
    fetchSavedAuctions()
  }, [])

  useRealtime('smartleiloes_auctions', () => {
    if (!searchQuery.trim()) {
      fetchSavedAuctions()
    }
  })

  const handleImport = async (leilao: SmartLeilao) => {
    try {
      setImportingId(leilao.id)
      const name =
        leilao.title || leilao.name || `Leilão Importado ${leilao.id}`
      const value = typeof leilao.value === 'number' ? leilao.value : 0

      await auctionsService.saveAuction({
        external_id: String(leilao.id),
        title: name,
        value: value,
        status: leilao.status || 'Importado',
        source_url: 'https://api.smartleiloes.digital/',
      })

      toast({
        title: 'Leilão Salvo',
        description: `${name} foi importado com sucesso para o banco de dados.`,
        variant: 'success',
      })
    } catch (err: any) {
      toast({
        title: 'Erro na Importação',
        description: err.message || 'Não foi possível converter o leilão.',
        variant: 'destructive',
      })
    } finally {
      setImportingId(null)
    }
  }

  const handleDealSuccess = () => {
    setDealAuction(null)
  }

  const handleSyncAll = async () => {
    try {
      setSyncing(true)
      setLastSyncSummary(null)
      const summary = await smartLeiloesSyncService.syncAll()
      setLastSyncSummary(summary)
      await fetchSavedAuctions()

      const totalSaved = Object.values(summary).reduce(
        (acc, item) => acc + item.saved,
        0,
      )

      toast({
        title: 'Sincronização concluída',
        description: `${totalSaved} registros foram salvos no Supabase.`,
        variant: 'success',
      })
    } catch (err: any) {
      toast({
        title: 'Erro na sincronização',
        description:
          err?.message ||
          'Não foi possível sincronizar os dados da Smart Leilões.',
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Leilões (SmartLeilões)
          </h1>
          <p className="text-muted-foreground mt-1">
            Navegue pelos eventos externos e salve-os no seu CRM.
          </p>
        </div>
        <Button onClick={handleSyncAll} disabled={syncing}>
          <DatabaseZap
            className={`mr-2 h-4 w-4 ${syncing ? 'animate-pulse' : ''}`}
          />
          {syncing ? 'Sincronizando...' : 'Sincronizar Smart Leilões'}
        </Button>
      </div>

      {lastSyncSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Última sincronização</CardTitle>
            <CardDescription>
              Dados importados da Smart Leilões para o Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(lastSyncSummary).map(([key, item]) => (
                <div key={key} className="rounded-md border p-3">
                  <div className="text-sm font-medium capitalize">{key}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {item.saved} salvos de {item.fetched} recebidos
                    {item.failed > 0 ? `, ${item.failed} falharam` : ''}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="live">Leilões ao Vivo (API)</TabsTrigger>
          <TabsTrigger value="saved">Leilões Salvos (CRM)</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={fetchLiveLeiloes}
              disabled={loadingLive}
              variant="outline"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loadingLive ? 'animate-spin' : ''}`}
              />
              Atualizar da API
            </Button>
          </div>

          {errorLive && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Aviso de Integração</AlertTitle>
              <AlertDescription>{errorLive}</AlertDescription>
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
              {loadingLive ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : liveLeiloes.length === 0 ? (
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
                      {liveLeiloes.map((leilao) => (
                        <TableRow key={leilao.id}>
                          <TableCell className="font-medium">
                            {leilao.title ||
                              leilao.name ||
                              `Leilão #${leilao.id}`}
                            {leilao.description && (
                              <div className="text-xs text-muted-foreground truncate max-w-xs mt-1">
                                {leilao.description}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {leilao.date || leilao.start_date
                              ? formatCivilDate(
                                  leilao.date || leilao.start_date,
                                )
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                leilao.status === 'Aberto'
                                  ? 'default'
                                  : 'secondary'
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
                              Salvar no CRM
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
        </TabsContent>

        <TabsContent value="saved" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3 space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Leilões Salvos</CardTitle>
                  <CardDescription>
                    Eventos já importados para sua base.
                  </CardDescription>
                </div>

                <form
                  onSubmit={handleSemanticSearch}
                  className="flex items-center gap-2 w-full md:w-auto"
                >
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Busca Semântica..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSearching}
                    variant="secondary"
                  >
                    {isSearching ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Buscar'
                    )}
                  </Button>
                </form>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSaved ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : savedAuctions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Nenhum leilão salvo encontrado.
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {savedAuctions.map((auction) => (
                        <TableRow key={auction.id}>
                          <TableCell className="font-medium">
                            {auction.title}
                            {(auction as any)._distance !== undefined && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-[10px]"
                              >
                                Match:{' '}
                                {Math.max(
                                  0,
                                  100 - (auction as any)._distance * 100,
                                ).toFixed(1)}
                                %
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{auction.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(auction.value || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => setDealAuction(auction)}
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Criar Negócio
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
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!dealAuction}
        onOpenChange={(open) => !open && setDealAuction(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Criar Negócio: {dealAuction?.title}</DialogTitle>
          </DialogHeader>
          {dealAuction && (
            <DealForm
              onSuccess={handleDealSuccess}
              onCancel={() => setDealAuction(null)}
              initialData={{
                title: dealAuction.title,
                value: dealAuction.value,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
