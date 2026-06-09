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
  CalendarDays,
  DatabaseZap,
  FilterX,
  Gavel,
  ListFilter,
  PlusCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TrendingUp,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type SortMode =
  | 'recent'
  | 'upcoming'
  | 'revenue'
  | 'lots'
  | 'topLot'
  | 'updated'
  | 'status'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const numberFormatter = new Intl.NumberFormat('pt-BR')

const todayStart = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
}

const currencyInputToNumber = (value: string) => {
  if (!value.trim()) return null
  const normalized = value.replace(/[^\d,.-]/g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const auctionRevenue = (auction: Auction) =>
  Math.max(auction.value || 0, auction.total_lot_value || 0)

const dateKey = (value: string | null) =>
  value ? String(value).slice(0, 10) : ''

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string
  value: string
  helper: string
  icon: typeof Gavel
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 pb-2">
        <div>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="mt-1 text-2xl">{value}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
    </Card>
  )
}

function AuctionTable({
  auctions,
  onCreateDeal,
}: {
  auctions: Auction[]
  onCreateDeal: (auction: Auction) => void
}) {
  if (auctions.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
        Nenhum leilão encontrado com os filtros atuais.
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
            <TableHead className="text-right">Faturamento</TableHead>
            <TableHead className="text-right">Lotes</TableHead>
            <TableHead className="text-right">Top lote</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {auctions.map((auction) => (
            <TableRow key={auction.id}>
              <TableCell className="min-w-[300px] font-medium">
                {auction.title}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>Smart #{auction.external_id}</span>
                  {auction.updated ? (
                    <span>Atualizado {formatCivilDate(auction.updated)}</span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatCivilDate(auction.event_date, 'Sem data')}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{auction.status || 'Sem status'}</Badge>
              </TableCell>
              <TableCell className="max-w-[220px] truncate text-muted-foreground">
                {auction.event_type || '-'}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right font-semibold text-primary">
                {currencyFormatter.format(auctionRevenue(auction))}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right">
                <div className="font-medium">
                  {numberFormatter.format(auction.lot_count || 0)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {numberFormatter.format(auction.sold_lot_count || 0)} com
                  contrato
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-right">
                {currencyFormatter.format(auction.top_lot_value || 0)}
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
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [sortBy, setSortBy] = useState<SortMode>('recent')
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

  const handleSync = async () => {
    try {
      setSyncing(true)
      setLastSyncSummary(null)
      const summary = await smartLeiloesSyncService.syncAll()
      setLastSyncSummary(summary)
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

  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
    setMinValue('')
    setMaxValue('')
    setSortBy('recent')
  }

  useEffect(() => {
    fetchAuctions()
  }, [fetchAuctions])

  useRealtime('smartleiloes_auctions', () => {
    fetchAuctions()
  })

  const statusOptions = useMemo(
    () =>
      [...new Set(auctions.map((auction) => auction.status).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'pt-BR'))
        .slice(0, 30),
    [auctions],
  )

  const filteredAuctions = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    const min = currencyInputToNumber(minValue)
    const max = currencyInputToNumber(maxValue)
    const today = todayStart()

    return auctions
      .filter((auction) => {
        const revenue = auctionRevenue(auction)
        const auctionDate = dateKey(auction.event_date)
        const dateTime = civilDateTime(auction.event_date)

        if (normalizedSearch) {
          const haystack = [
            auction.title,
            auction.status,
            auction.event_type,
            auction.external_id,
            String(auction.lot_count || ''),
          ]
            .join(' ')
            .toLowerCase()
          if (!haystack.includes(normalizedSearch)) return false
        }

        if (statusFilter !== 'all' && auction.status !== statusFilter) {
          return false
        }
        if (dateFrom && (!auctionDate || auctionDate < dateFrom)) return false
        if (dateTo && (!auctionDate || auctionDate > dateTo)) return false
        if (min !== null && revenue < min) return false
        if (max !== null && revenue > max) return false

        if (sortBy === 'upcoming') return dateTime >= today
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'revenue') return auctionRevenue(b) - auctionRevenue(a)
        if (sortBy === 'lots') return (b.lot_count || 0) - (a.lot_count || 0)
        if (sortBy === 'topLot')
          return (b.top_lot_value || 0) - (a.top_lot_value || 0)
        if (sortBy === 'updated')
          return String(b.updated || '').localeCompare(String(a.updated || ''))
        if (sortBy === 'status')
          return String(a.status || '').localeCompare(
            String(b.status || ''),
            'pt-BR',
          )
        if (sortBy === 'upcoming')
          return civilDateTime(a.event_date) - civilDateTime(b.event_date)
        return (
          civilDateTime(b.event_date) - civilDateTime(a.event_date) ||
          String(b.updated || '').localeCompare(String(a.updated || ''))
        )
      })
  }, [
    auctions,
    dateFrom,
    dateTo,
    maxValue,
    minValue,
    searchQuery,
    sortBy,
    statusFilter,
  ])

  const metrics = useMemo(() => {
    const totalRevenue = filteredAuctions.reduce(
      (acc, auction) => acc + auctionRevenue(auction),
      0,
    )
    const totalLots = filteredAuctions.reduce(
      (acc, auction) => acc + (auction.lot_count || 0),
      0,
    )
    const dated = filteredAuctions
      .filter((auction) => auction.event_date)
      .sort((a, b) => civilDateTime(b.event_date) - civilDateTime(a.event_date))

    return {
      totalRevenue,
      totalLots,
      mostRecentDate: dated[0]?.event_date || null,
    }
  }, [filteredAuctions])

  const activeFilterCount =
    (searchQuery.trim() ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (minValue ? 1 : 0) +
    (maxValue ? 1 : 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leilões</h1>
          <p className="mt-1 max-w-3xl text-muted-foreground">
            Consulte toda a base sincronizada da Smart Leilões, encontre eventos
            por nome, data e faturamento, e priorize oportunidades como um
            leiloeiro.
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Leilões no recorte"
          value={numberFormatter.format(filteredAuctions.length)}
          helper={`${numberFormatter.format(auctions.length)} na base completa`}
          icon={Gavel}
        />
        <MetricCard
          label="Faturamento"
          value={currencyFormatter.format(metrics.totalRevenue)}
          helper="Soma do evento ou dos lotes sincronizados"
          icon={TrendingUp}
        />
        <MetricCard
          label="Lotes mapeados"
          value={numberFormatter.format(metrics.totalLots)}
          helper="Volume comercial vinculado aos leilões"
          icon={ListFilter}
        />
        <MetricCard
          label="Mais recente"
          value={formatCivilDate(metrics.mostRecentDate, '-')}
          helper="Data mais nova no recorte atual"
          icon={CalendarDays}
        />
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-primary">
                <SlidersHorizontal className="h-4 w-4" />
                Busca e filtros
              </CardTitle>
              <CardDescription>
                Combine nome, status, janela de data e faixa de faturamento.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <FilterX className="mr-2 h-4 w-4" />
              Limpar
              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.3fr_0.7fr_0.8fr_0.8fr]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nome do leilão, tipo, status ou Smart ID..."
              className="pl-9"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortMode)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="upcoming">Próximos primeiro</SelectItem>
              <SelectItem value="revenue">Maior faturamento</SelectItem>
              <SelectItem value="lots">Mais lotes</SelectItem>
              <SelectItem value="topLot">Maior lote</SelectItem>
              <SelectItem value="updated">Atualizados recentemente</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              min="0"
              placeholder="Valor mín."
              value={minValue}
              onChange={(event) => setMinValue(event.target.value)}
            />
            <Input
              type="number"
              min="0"
              placeholder="Valor máx."
              value={maxValue}
              onChange={(event) => setMaxValue(event.target.value)}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:col-span-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
        </CardContent>
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

      <Card>
        <CardHeader>
          <CardTitle>Todos os leilões</CardTitle>
          <CardDescription>
            {numberFormatter.format(filteredAuctions.length)} resultado(s) no
            recorte atual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <AuctionTable
              auctions={filteredAuctions}
              onCreateDeal={setDealAuction}
            />
          )}
        </CardContent>
      </Card>

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
                value: auctionRevenue(dealAuction),
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
