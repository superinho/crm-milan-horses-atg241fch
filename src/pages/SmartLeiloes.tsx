import { useCallback, useEffect, useMemo, useState } from 'react'
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
  CalendarClock,
  DatabaseZap,
  History,
  PlusCircle,
  RefreshCw,
  Search,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { DealForm } from '@/components/deals/DealForm'
import { civilDateTime, formatCivilDate } from '@/lib/dates'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const todayStart = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
}

const sortUpcoming = (a: Auction, b: Auction) =>
  civilDateTime(a.event_date) - civilDateTime(b.event_date)

const sortPast = (a: Auction, b: Auction) =>
  civilDateTime(b.event_date) - civilDateTime(a.event_date)

function AuctionTable({
  auctions,
  emptyMessage,
  onCreateDeal,
}: {
  auctions: Auction[]
  emptyMessage: string
  onCreateDeal: (auction: Auction) => void
}) {
  if (auctions.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Leilão</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {auctions.map((auction) => (
            <TableRow key={auction.id}>
              <TableCell className="min-w-[280px] font-medium">
                {auction.title}
                {auction.external_id && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Smart Leilões #{auction.external_id}
                  </div>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatCivilDate(auction.event_date, 'Sem data')}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {auction.status || 'Sem status'}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[220px] truncate text-muted-foreground">
                {auction.event_type || '-'}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {currencyFormatter.format(auction.value || 0)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onCreateDeal(auction)}
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
  )
}

export default function SmartLeiloes() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncSummary, setLastSyncSummary] =
    useState<SmartLeiloesSyncSummary | null>(null)
  const [dealAuction, setDealAuction] = useState<Auction | null>(null)
  const { toast } = useToast()

  const fetchAuctions = useCallback(async () => {
    try {
      setLoading(true)
      const data = await auctionsService.getAuctions()
      setAuctions(data)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar leilões',
        description:
          err?.message || 'Não foi possível buscar os leilões sincronizados.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const handleSearch = async (event?: React.FormEvent) => {
    event?.preventDefault()

    if (!searchQuery.trim()) {
      await fetchAuctions()
      return
    }

    try {
      setIsSearching(true)
      const data = await auctionsService.searchAuctions(searchQuery.trim())
      setAuctions(data)
    } catch (err: any) {
      toast({
        title: 'Erro na busca',
        description: err?.message || 'Não foi possível buscar leilões.',
        variant: 'destructive',
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      setLastSyncSummary(null)
      const summary = await smartLeiloesSyncService.syncAll()
      setLastSyncSummary(summary)
      setSearchQuery('')
      const data = await auctionsService.getAuctions()
      setAuctions(data)

      const auctionSummary = summary.event || summary.auctions
      const saved =
        auctionSummary?.saved ??
        Object.values(summary).reduce((acc, item) => acc + item.saved, 0)

      toast({
        title: 'Sync concluído',
        description: `${saved} registros foram atualizados da Smart Leilões.`,
        variant: 'success',
      })
    } catch (err: any) {
      toast({
        title: 'Erro no Sync',
        description:
          err?.message ||
          'Não foi possível sincronizar os dados da Smart Leilões.',
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    fetchAuctions()
  }, [fetchAuctions])

  useRealtime('smartleiloes_auctions', () => {
    if (!searchQuery.trim()) {
      fetchAuctions()
    }
  })

  const { upcomingAuctions, pastAuctions, undatedAuctions } = useMemo(() => {
    const startOfToday = todayStart()
    const upcoming: Auction[] = []
    const past: Auction[] = []
    const undated: Auction[] = []

    for (const auction of auctions) {
      const dateTime = civilDateTime(auction.event_date)
      if (!dateTime) {
        undated.push(auction)
      } else if (dateTime >= startOfToday) {
        upcoming.push(auction)
      } else {
        past.push(auction)
      }
    }

    return {
      upcomingAuctions: upcoming.sort(sortUpcoming),
      pastAuctions: past.sort(sortPast),
      undatedAuctions: undated,
    }
  }, [auctions])

  const shownPastAuctions = [...pastAuctions, ...undatedAuctions]
  const totalSynced = auctions.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leilões</h1>
          <p className="mt-1 text-muted-foreground">
            Acompanhe os próximos eventos da Smart Leilões e consulte o
            histórico já sincronizado no CRM.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={fetchAuctions} disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Atualizar
          </Button>
          <Button onClick={handleSync} disabled={syncing}>
            <DatabaseZap
              className={`mr-2 h-4 w-4 ${syncing ? 'animate-pulse' : ''}`}
            />
            {syncing ? 'Sincronizando...' : 'Sync Smart Leilões'}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Próximos</CardDescription>
            <CardTitle className="text-2xl">
              {upcomingAuctions.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Passados</CardDescription>
            <CardTitle className="text-2xl">{pastAuctions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total sincronizado</CardDescription>
            <CardTitle className="text-2xl">{totalSynced}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4 pb-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Base Smart Leilões</CardTitle>
            <CardDescription>
              Use o Sync para buscar os dados mais recentes e reorganizar os
              eventos por data.
            </CardDescription>
          </div>
          <form
            onSubmit={handleSearch}
            className="flex w-full items-center gap-2 md:w-auto"
          >
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por leilão, status ou tipo..."
                className="pl-9"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={isSearching} variant="secondary">
              {isSearching ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                'Buscar'
              )}
            </Button>
          </form>
        </CardHeader>
      </Card>

      {lastSyncSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Último Sync</CardTitle>
            <CardDescription>
              Resultado da importação mais recente da Smart Leilões.
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

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                <CardTitle>Próximos Leilões</CardTitle>
              </div>
              <CardDescription>
                Eventos de hoje em diante, ordenados pelo leilão mais próximo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuctionTable
                auctions={upcomingAuctions}
                emptyMessage="Nenhum próximo leilão encontrado. Rode o Sync para buscar atualizações."
                onCreateDeal={setDealAuction}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <CardTitle>Leilões Passados</CardTitle>
              </div>
              <CardDescription>
                Histórico sincronizado, com os eventos mais recentes primeiro.
                {undatedAuctions.length > 0
                  ? ` ${undatedAuctions.length} registro(s) sem data aparecem no fim da lista.`
                  : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuctionTable
                auctions={shownPastAuctions}
                emptyMessage="Nenhum leilão passado encontrado."
                onCreateDeal={setDealAuction}
              />
            </CardContent>
          </Card>
        </>
      )}

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
              onSuccess={() => setDealAuction(null)}
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
