import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Calendar,
  ExternalLink,
  FilterX,
  Gavel,
  Globe2,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
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
  type GlobalAuctionDamSireRanking,
  type GlobalAuctionFilters,
  type GlobalAuctionHouseRanking,
  type GlobalAuctionLot,
  type GlobalAuctionOverview,
  type GlobalAuctionRankingMetrics,
  type GlobalAuctionSireRanking,
  type GlobalAuctionVendorRanking,
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

const periodOptions = [
  { value: 'all', label: 'Tudo' },
  { value: '30d', label: '30 dias' },
  { value: '3m', label: '3 meses' },
  { value: '1y', label: '1 ano' },
]

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

type MarketRankingRow = GlobalAuctionRankingMetrics & {
  name: string
  detail?: string
}

function RankingList({
  title,
  subtitle,
  rows,
  icon: Icon,
  onSelect,
}: {
  title: string
  subtitle: string
  rows: MarketRankingRow[]
  icon: typeof Globe2
  onSelect?: (name: string) => void
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-primary">
              <Icon className="h-4 w-4" />
              {title}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <Badge variant="outline" className="rounded-md">
            Top {rows.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            Sem dados suficientes para esta seleção.
          </div>
        ) : (
          rows.map((row, index) => {
            const content = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-foreground">
                        {row.name}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatNumber(row.sold_lots)} vendidos de{' '}
                        {formatNumber(row.lots)} ·{' '}
                        {formatNumber(row.sell_through_rate * 100)}% venda ·{' '}
                        {row.latest_year || 'sem ano'}
                      </div>
                      {row.detail ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {row.detail}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold text-primary">
                      {formatCurrency(row.total_value_eur)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      med. {formatCurrency(row.median_price_eur)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                  <div className="rounded-md bg-muted/40 px-2 py-1">
                    média {formatCurrency(row.average_price_eur)}
                  </div>
                  <div className="rounded-md bg-muted/40 px-2 py-1">
                    top {formatCurrency(row.top_price_eur)}
                  </div>
                  <div className="rounded-md bg-muted/40 px-2 py-1">
                    {formatNumber(row.premium_lots)} premium
                  </div>
                </div>
              </>
            )

            return onSelect ? (
              <button
                key={`${title}-${row.name}`}
                type="button"
                onClick={() => onSelect(row.name)}
                className="w-full rounded-md border bg-white p-3 text-left transition hover:border-primary/40 hover:bg-primary/5"
              >
                {content}
              </button>
            ) : (
              <div
                key={`${title}-${row.name}`}
                className="w-full rounded-md border bg-white p-3 text-left"
              >
                {content}
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
  const [damSires, setDamSires] = useState<GlobalAuctionDamSireRanking[]>([])
  const [vendors, setVendors] = useState<GlobalAuctionVendorRanking[]>([])
  const [houses, setHouses] = useState<GlobalAuctionHouseRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('all')
  const [selectedYears, setSelectedYears] = useState<number[]>([])
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [selectedLot, setSelectedLot] = useState<GlobalAuctionLot | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const pageSize = 25

  const filters = useMemo<GlobalAuctionFilters>(
    () => ({
      search,
      period: selectedYears.length ? 'years' : period,
      years: selectedYears,
      status,
      category,
    }),
    [search, period, selectedYears, status, category],
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [nextOverview, lotPage] = await Promise.all([
        globalAuctionsService.getMarketSummary(filters),
        globalAuctionsService.getLots(filters, { page, pageSize }),
      ])

      setOverview(nextOverview.overview)
      setLots(lotPage.rows)
      setTotal(lotPage.total)
      setSires(nextOverview.sires)
      setDamSires(nextOverview.damSires)
      setVendors(nextOverview.vendors)
      setHouses(nextOverview.houses)
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
    globalAuctionsService
      .getAvailableYears()
      .then((years) =>
        setAvailableYears(
          years.length ? years : [2026, 2025, 2024, 2023, 2022],
        ),
      )
      .catch((error) => {
        console.error(error)
        setAvailableYears([2026, 2025, 2024, 2023, 2022])
      })
  }, [])

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
    setPeriod('all')
    setSelectedYears([])
    setStatus('all')
    setCategory('all')
  }

  const selectPeriod = (nextPeriod: string) => {
    setPeriod(nextPeriod)
    setSelectedYears([])
  }

  const toggleYear = (year: number) => {
    setSelectedYears((current) =>
      current.includes(year)
        ? current.filter((item) => item !== year)
        : [...current, year].sort((a, b) => b - a),
    )
    setPeriod('years')
  }

  const focusSearch = (name: string) => {
    setSearch(name)
    setPage(1)
  }

  const sireRows = useMemo<MarketRankingRow[]>(
    () =>
      sires.map((row) => ({
        ...row,
        name: row.sire_name,
      })),
    [sires],
  )

  const damSireRows = useMemo<MarketRankingRow[]>(
    () =>
      damSires.map((row) => ({
        ...row,
        name: row.dam_sire_name,
      })),
    [damSires],
  )

  const vendorRows = useMemo<MarketRankingRow[]>(
    () =>
      vendors.map((row) => ({
        ...row,
        name: row.vendor_name,
      })),
    [vendors],
  )

  const houseRows = useMemo<MarketRankingRow[]>(
    () =>
      houses.map((row) => ({
        ...row,
        name: row.house_name,
        detail: `${formatNumber(row.auctions)} leilões${row.country ? ` · ${row.country}` : ''}`,
      })),
    [houses],
  )

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

      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Calendar className="h-4 w-4" />
            Filtros de mercado
          </div>
          <div className="grid gap-3 xl:grid-cols-[1.3fr_1fr_1fr_auto]">
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Período rápido
              </div>
              <div className="flex flex-wrap gap-2">
                {periodOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={
                      period === option.value && !selectedYears.length
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                    onClick={() => selectPeriod(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Anos individuais
              </div>
              <div className="flex flex-wrap gap-2">
                {availableYears.map((yearOption) => (
                  <Button
                    key={yearOption}
                    type="button"
                    variant={
                      selectedYears.includes(yearOption) ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => toggleYear(yearOption)}
                  >
                    {yearOption}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Status
                </div>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="sold">Vendidos</SelectItem>
                    <SelectItem value="not_sold">Não vendidos</SelectItem>
                    <SelectItem value="withdrawn">Retirados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Tipo
                </div>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="foal">Foals</SelectItem>
                    <SelectItem value="3yo">3 anos</SelectItem>
                    <SelectItem value="sport_horse">Sport horse</SelectItem>
                    <SelectItem value="mixed_show_jumping">
                      Misto salto
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                <FilterX className="h-4 w-4" />
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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

      <div className="rounded-md border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              Inteligência de seleção
            </div>
            <h2 className="mt-1 text-2xl font-bold text-primary">
              Quem está em alta no recorte escolhido
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Rankings recalculados pelos filtros acima. Use para escolher
              garanhões, famílias maternas, vendedores e casas que merecem
              prospecção, convites ou comparação de reserva.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Base atual: {formatNumber(overview.sold_lots)} vendas ·{' '}
            {formatCurrency(overview.total_sold_value_eur)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankingList
          title="Garanhões em alta"
          subtitle="Valor vendido, liquidez e top price por pai."
          rows={sireRows}
          icon={Trophy}
          onSelect={focusSearch}
        />
        <RankingList
          title="Famílias maternas"
          subtitle="Avôs maternos que aparecem nos melhores tickets."
          rows={damSireRows}
          icon={ShieldCheck}
          onSelect={focusSearch}
        />
        <RankingList
          title="Haras e vendedores"
          subtitle="Origem comercial dos lotes com maior conversão."
          rows={vendorRows}
          icon={Users}
          onSelect={focusSearch}
        />
        <RankingList
          title="Casas de leilão"
          subtitle="Fontes com mais volume e maior ticket no período."
          rows={houseRows}
          icon={Gavel}
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
