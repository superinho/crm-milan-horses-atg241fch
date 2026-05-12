import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  ExternalLink,
  FilterX,
  Gavel,
  Globe2,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  globalAuctionsService,
  type GlobalAuctionFilters,
  type GlobalAuctionHouseRanking,
  type GlobalAuctionLot,
  type GlobalAuctionOverview,
  type GlobalAuctionSireRanking,
} from '@/services/global-auctions'

const formatNumber = (value: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(
    Number(value || 0),
  )

const formatCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const statusCopy: Record<string, { label: string; className: string }> = {
  sold: {
    label: 'Vendido',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  not_sold: {
    label: 'Não vendido',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  withdrawn: {
    label: 'Retirado',
    className: 'border-slate-200 bg-slate-50 text-slate-700',
  },
  unknown: {
    label: 'Revisar',
    className: 'border-blue-200 bg-blue-50 text-blue-800',
  },
}

const emptyOverview: GlobalAuctionOverview = {
  auctions: 0,
  lots: 0,
  sold_lots: 0,
  unsold_or_withdrawn_lots: 0,
  total_sold_value_eur: 0,
  average_price_eur: 0,
  median_price_eur: 0,
  top_price_eur: 0,
  first_year: null,
  latest_year: null,
}

function MarketMetric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string
  detail: string
  icon: typeof Globe2
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-bold text-foreground">{value}</div>
          <div className="mt-1 text-sm text-muted-foreground">{detail}</div>
        </div>
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function LotCard({
  lot,
  onOpen,
}: {
  lot: GlobalAuctionLot
  onOpen: (lot: GlobalAuctionLot) => void
}) {
  const status = statusCopy[lot.sold_status] || statusCopy.unknown
  const auction = lot.global_auctions
  const house = auction?.global_auction_houses

  return (
    <button
      type="button"
      onClick={() => onOpen(lot)}
      className="group rounded-md border bg-white p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-base font-semibold text-foreground">
              {lot.horse_name}
            </div>
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Lote {lot.lot_number || 'sem número'} · {house?.name || 'Leilão'} ·{' '}
            {auction?.auction_year || 'ano não informado'}
          </div>
        </div>
        <div className="text-left md:text-right">
          <div className="text-lg font-bold text-primary">
            {lot.hammer_price
              ? formatCurrency(lot.hammer_price)
              : lot.price_text || '-'}
          </div>
          <div className="text-xs text-muted-foreground">
            {auction?.category || 'categoria'} · {lot.currency}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        <div>
          <div className="text-xs text-muted-foreground">Pai</div>
          <div className="font-medium">{lot.sire_name || 'Não informado'}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Mãe / Avô materno</div>
          <div className="font-medium">
            {lot.dam_name || 'Mãe não informada'}
          </div>
          <div className="text-xs text-muted-foreground">
            {lot.dam_sire_name || 'Avô materno não informado'}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">
            Vendedor / Comprador
          </div>
          <div className="font-medium">
            {lot.vendor_name || 'Não informado'}
          </div>
          <div className="text-xs text-muted-foreground">
            {lot.buyer_name || 'Comprador não informado'}
          </div>
        </div>
      </div>
    </button>
  )
}

function LotDialog({
  lot,
  open,
  onOpenChange,
}: {
  lot: GlobalAuctionLot | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!lot) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent />
      </Dialog>
    )
  }

  const auction = lot.global_auctions
  const house = auction?.global_auction_houses
  const status = statusCopy[lot.sold_status] || statusCopy.unknown

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
            {auction?.category ? (
              <Badge variant="secondary" className="rounded-md">
                {auction.category}
              </Badge>
            ) : null}
          </div>
          <DialogTitle className="text-2xl text-primary">
            {lot.horse_name}
          </DialogTitle>
          <DialogDescription>
            {house?.name || 'Casa não informada'} · {auction?.name || 'Leilão'}{' '}
            · {auction?.auction_year || 'ano não informado'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border bg-muted/10 p-3">
            <div className="text-xs text-muted-foreground">Preço</div>
            <div className="mt-1 font-semibold">
              {lot.hammer_price
                ? formatCurrency(lot.hammer_price)
                : lot.price_text || '-'}
            </div>
          </div>
          <div className="rounded-md border bg-muted/10 p-3">
            <div className="text-xs text-muted-foreground">Lote</div>
            <div className="mt-1 font-semibold">{lot.lot_number || '-'}</div>
          </div>
          <div className="rounded-md border bg-muted/10 p-3">
            <div className="text-xs text-muted-foreground">Confiança</div>
            <div className="mt-1 font-semibold">
              {formatNumber(lot.confidence_score || 0)}%
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border p-4">
            <div className="font-semibold text-primary">Pedigree</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Pai: {lot.sire_name || 'não informado'}
            </div>
            <div className="text-sm text-muted-foreground">
              Mãe: {lot.dam_name || 'não informada'}
            </div>
            <div className="text-sm text-muted-foreground">
              Avô materno: {lot.dam_sire_name || 'não informado'}
            </div>
          </div>
          <div className="rounded-md border p-4">
            <div className="font-semibold text-primary">Mercado</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Vendedor: {lot.vendor_name || 'não informado'}
            </div>
            <div className="text-sm text-muted-foreground">
              Comprador: {lot.buyer_name || 'não informado'}
            </div>
            <div className="text-sm text-muted-foreground">
              País comprador: {lot.buyer_country || 'não informado'}
            </div>
          </div>
        </div>

        {lot.source_url ? (
          <DialogFooter>
            <Button variant="outline" asChild>
              <a href={lot.source_url} target="_blank" rel="noreferrer">
                Fonte original
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function RankingList({
  title,
  rows,
  type,
}: {
  title: string
  rows: GlobalAuctionSireRanking[] | GlobalAuctionHouseRanking[]
  type: 'sire' | 'house'
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            Importe uma primeira fonte para gerar este ranking.
          </div>
        ) : (
          rows.map((row, index) => {
            const name =
              type === 'sire'
                ? (row as GlobalAuctionSireRanking).sire_name
                : (row as GlobalAuctionHouseRanking).house_name
            return (
              <div
                key={`${type}-${name}`}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatNumber(row.sold_lots)} vendidos ·{' '}
                      {row.latest_year || 'sem ano'}
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm font-semibold text-primary">
                  {formatCurrency(row.total_value_eur)}
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

export default function MercadoGlobal() {
  const [overview, setOverview] = useState<GlobalAuctionOverview>(emptyOverview)
  const [lots, setLots] = useState<GlobalAuctionLot[]>([])
  const [total, setTotal] = useState(0)
  const [sires, setSires] = useState<GlobalAuctionSireRanking[]>([])
  const [houses, setHouses] = useState<GlobalAuctionHouseRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [year, setYear] = useState('all')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [selectedLot, setSelectedLot] = useState<GlobalAuctionLot | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const pageSize = 25

  const filters = useMemo<GlobalAuctionFilters>(
    () => ({ search, year, status, category }),
    [search, year, status, category],
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [nextOverview, lotPage, nextSires, nextHouses] = await Promise.all([
        globalAuctionsService.getOverview(),
        globalAuctionsService.getLots(filters, { page, pageSize }),
        globalAuctionsService.getSireRankings(),
        globalAuctionsService.getHouseRankings(),
      ])

      setOverview(nextOverview)
      setLots(lotPage.rows)
      setTotal(lotPage.total)
      setSires(nextSires)
      setHouses(nextHouses)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao carregar Mercado Global',
        description: 'Não foi possível ler a base de leilões internacionais.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [filters, page, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPage(1)
  }, [filters])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const openLot = (lot: GlobalAuctionLot) => {
    setSelectedLot(lot)
    setDialogOpen(true)
  }

  const clearFilters = () => {
    setSearch('')
    setYear('all')
    setStatus('all')
    setCategory('all')
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <LotDialog
        lot={selectedLot}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Globe2 className="h-4 w-4" />
            Base secundária
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-primary">
            Mercado Global de Salto
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Leilões internacionais de show jumping para comparar preços,
            pedigrees e casas vendedoras antes de montar campanhas ou reservas.
          </p>
        </div>
        <Button variant="outline" asChild>
          <a
            href="https://goresbridge.com/showjumping/results/"
            target="_blank"
            rel="noreferrer"
          >
            Primeira fonte
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MarketMetric
          label="Leilões"
          value={formatNumber(overview.auctions)}
          detail={`${overview.first_year || '-'} até ${overview.latest_year || '-'}`}
          icon={Gavel}
        />
        <MarketMetric
          label="Lotes"
          value={formatNumber(overview.lots)}
          detail={`${formatNumber(overview.sold_lots)} vendidos`}
          icon={ShieldCheck}
        />
        <MarketMetric
          label="Volume vendido"
          value={formatCurrency(overview.total_sold_value_eur)}
          detail={`mediana ${formatCurrency(overview.median_price_eur)}`}
          icon={BarChart3}
        />
        <MarketMetric
          label="Top price"
          value={formatCurrency(overview.top_price_eur)}
          detail={`média ${formatCurrency(overview.average_price_eur)}`}
          icon={Trophy}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankingList
          title="Garanhões por valor vendido"
          rows={sires}
          type="sire"
        />
        <RankingList
          title="Casas por volume vendido"
          rows={houses}
          type="house"
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-xl text-primary">
              Lotes importados
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatNumber(total)} lotes encontrados. Página {page} de{' '}
              {totalPages}.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <div className="relative md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cavalo, pai, mãe, vendedor..."
                className="pl-9"
              />
            </div>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="md:w-36">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="sold">Vendidos</SelectItem>
                <SelectItem value="not_sold">Não vendidos</SelectItem>
                <SelectItem value="withdrawn">Retirados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="md:w-36">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="foal">Foals</SelectItem>
                <SelectItem value="3yo">3 anos</SelectItem>
                <SelectItem value="sport_horse">Sport horse</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={clearFilters}>
              <FilterX className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="rounded-md border border-dashed p-10 text-center text-muted-foreground">
              Carregando mercado global...
            </div>
          ) : lots.length === 0 ? (
            <div className="rounded-md border border-dashed p-10 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-primary" />
              <div className="mt-3 font-semibold text-primary">
                Ainda sem lotes nessa seleção
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Rode o importador ou limpe os filtros para ver a base.
              </div>
            </div>
          ) : (
            lots.map((lot) => (
              <LotCard key={lot.id} lot={lot} onOpen={openLot} />
            ))
          )}
          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {formatNumber(lots.length)} itens nesta página
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Próxima
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
