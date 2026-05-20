import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Calendar,
  Database,
  ExternalLink,
  FilterX,
  Gavel,
  Globe2,
  Link as LinkIcon,
  Search,
  ShieldCheck,
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
  type GlobalAuctionDataQuality,
  type GlobalAuctionFilterOptions,
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

const emptyQuality: GlobalAuctionDataQuality = {
  lots: 0,
  with_source_url: 0,
  with_price: 0,
  with_pedigree: 0,
  with_buyer: 0,
  high_confidence: 0,
  hippomundo_lots: 0,
  primary_source_lots: 0,
  sources: [],
}

const emptyFilterOptions: GlobalAuctionFilterOptions = {
  years: [],
  sources: [],
  houses: [],
  countries: [],
  categories: [],
  sires: [],
  damSires: [],
  priceMin: null,
  priceMax: null,
}

const periodOptions = [
  { value: 'all', label: 'Tudo' },
  { value: '30d', label: '30 dias' },
  { value: '3m', label: '3 meses' },
  { value: '1y', label: '1 ano' },
]

const priceBandOptions = [
  { value: 'all', label: 'Todos os preços' },
  { value: '0-10000', label: 'Até €10k', min: 0, max: 10000 },
  { value: '10000-25000', label: '€10k-€25k', min: 10000, max: 25000 },
  { value: '25000-50000', label: '€25k-€50k', min: 25000, max: 50000 },
  { value: '50000-100000', label: '€50k-€100k', min: 50000, max: 100000 },
  { value: '100000+', label: '€100k+', min: 100000 },
]

const confidenceOptions = [
  { value: 'all', label: 'Qualquer confiança' },
  { value: '70', label: '70%+' },
  { value: '80', label: '80%+' },
  { value: '90', label: '90%+' },
]

const sourceNameOf = (lot: GlobalAuctionLot) =>
  lot.global_auction_sources?.name ||
  lot.global_auctions?.global_auction_sources?.name ||
  (lot.source_url?.includes('hippomundo.com') ? 'Hippomundo' : null) ||
  (lot.global_auctions?.source_url?.includes('hippomundo.com')
    ? 'Hippomundo'
    : null) ||
  'Fonte não identificada'

const sourceUrlOf = (lot: GlobalAuctionLot) =>
  lot.source_url ||
  lot.global_auctions?.source_url ||
  lot.global_auction_sources?.results_url ||
  lot.global_auctions?.global_auction_sources?.results_url ||
  lot.global_auction_sources?.website_url ||
  lot.global_auctions?.global_auction_sources?.website_url ||
  null

const confidenceClass = (score?: number | null) => {
  const value = Number(score || 0)
  if (value >= 85) return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (value >= 70) return 'border-blue-200 bg-blue-50 text-blue-800'
  return 'border-amber-200 bg-amber-50 text-amber-800'
}

const percentage = (value: number, total: number) =>
  total ? Math.round((value / total) * 100) : 0

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

function QualityMetric({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-md border bg-white p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-bold text-primary">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
    </div>
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
  const sourceName = sourceNameOf(lot)

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
            <Badge variant="outline" className="rounded-md">
              {sourceName}
            </Badge>
            <Badge
              variant="outline"
              className={`rounded-md ${confidenceClass(lot.confidence_score)}`}
            >
              {formatNumber(lot.confidence_score || 0)}%
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
  const sourceName = sourceNameOf(lot)
  const sourceUrl = sourceUrlOf(lot)
  const missingFields = [
    !sourceUrl ? 'fonte' : null,
    !lot.hammer_price ? 'preço' : null,
    !lot.sire_name ? 'pai' : null,
    !lot.dam_name && !lot.dam_sire_name ? 'linha materna' : null,
    !lot.buyer_name ? 'comprador' : null,
  ].filter(Boolean)

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
            <Badge variant="outline" className="rounded-md">
              {sourceName}
            </Badge>
          </div>
          <DialogTitle className="text-2xl text-primary">
            {lot.horse_name}
          </DialogTitle>
          <DialogDescription>
            {house?.name || 'Casa não informada'} · {auction?.name || 'Leilão'}{' '}
            · {auction?.auction_year || 'ano não informado'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-4">
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
          <div className="rounded-md border bg-muted/10 p-3">
            <div className="text-xs text-muted-foreground">Fonte</div>
            <div className="mt-1 truncate font-semibold">{sourceName}</div>
          </div>
        </div>

        <div className="rounded-md border bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <LinkIcon className="mt-0.5 h-5 w-5 text-primary" />
            <div className="min-w-0">
              <div className="font-semibold text-primary">
                Evidência vinculada
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Registro importado com URL de origem preservada para auditoria.
              </p>
              {missingFields.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {missingFields.map((field) => (
                    <Badge key={field} variant="outline" className="rounded-md">
                      Falta {field}
                    </Badge>
                  ))}
                </div>
              ) : null}
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

        {sourceUrl ? (
          <DialogFooter>
            <Button variant="outline" asChild>
              <a href={sourceUrl} target="_blank" rel="noreferrer">
                Abrir fonte
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
  const [quality, setQuality] = useState<GlobalAuctionDataQuality>(emptyQuality)
  const [filterOptions, setFilterOptions] =
    useState<GlobalAuctionFilterOptions>(emptyFilterOptions)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('all')
  const [selectedYears, setSelectedYears] = useState<number[]>([])
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [source, setSource] = useState('all')
  const [house, setHouse] = useState('all')
  const [country, setCountry] = useState('all')
  const [sire, setSire] = useState('all')
  const [damSire, setDamSire] = useState('all')
  const [priceBand, setPriceBand] = useState('all')
  const [minConfidence, setMinConfidence] = useState('all')
  const [selectedLot, setSelectedLot] = useState<GlobalAuctionLot | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const pageSize = 25

  const filters = useMemo<GlobalAuctionFilters>(() => {
    const band = priceBandOptions.find((option) => option.value === priceBand)
    return {
      search,
      period: selectedYears.length ? 'years' : period,
      years: selectedYears,
      status,
      category,
      source,
      house,
      country,
      sire,
      damSire,
      minConfidence:
        minConfidence === 'all' ? undefined : Number(minConfidence),
      minPrice: band && 'min' in band ? band.min : undefined,
      maxPrice: band && 'max' in band ? band.max : undefined,
    }
  }, [
    search,
    period,
    selectedYears,
    status,
    category,
    source,
    house,
    country,
    sire,
    damSire,
    priceBand,
    minConfidence,
  ])

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
      setQuality(nextOverview.quality)
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
      .getFilterOptions()
      .then((options) => {
        setFilterOptions(options)
        setAvailableYears(
          options.years.length ? options.years : [2026, 2025, 2024, 2023, 2022],
        )
      })
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
    setSource('all')
    setHouse('all')
    setCountry('all')
    setSire('all')
    setDamSire('all')
    setPriceBand('all')
    setMinConfidence('all')
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

  const focusSire = (name: string) => {
    setSire(name)
    setPage(1)
  }

  const focusDamSire = (name: string) => {
    setDamSire(name)
    setPage(1)
  }

  const focusHouse = (name: string) => {
    setHouse(name)
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
            Base interna de consulta para preços, pedigree e liquidez de lotes
            internacionais, com fonte preservada em cada resultado.
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base text-primary">
            <Calendar className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_1fr_1fr_1fr]">
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Busca
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cavalo, pai, mãe, vendedor, comprador..."
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Fonte
              </div>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Fonte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as fontes</SelectItem>
                  {filterOptions.sources.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Casa
              </div>
              <Select value={house} onValueChange={setHouse}>
                <SelectTrigger>
                  <SelectValue placeholder="Casa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as casas</SelectItem>
                  {filterOptions.houses.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                País
              </div>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="País" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os países</SelectItem>
                  {filterOptions.countries.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1.4fr]">
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
                    {(filterOptions.categories.length
                      ? filterOptions.categories
                      : ['foal', '3yo', 'sport_horse', 'mixed_show_jumping']
                    ).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Faixa
                </div>
                <Select value={priceBand} onValueChange={setPriceBand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Preço" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceBandOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Confiança
                </div>
                <Select value={minConfidence} onValueChange={setMinConfidence}>
                  <SelectTrigger>
                    <SelectValue placeholder="Confiança" />
                  </SelectTrigger>
                  <SelectContent>
                    {confidenceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Select value={sire} onValueChange={setSire}>
              <SelectTrigger>
                <SelectValue placeholder="Garanhão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os garanhões</SelectItem>
                {filterOptions.sires.slice(0, 80).map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={damSire} onValueChange={setDamSire}>
              <SelectTrigger>
                <SelectValue placeholder="Avô materno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os avôs maternos</SelectItem>
                {filterOptions.damSires.slice(0, 80).map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <Database className="h-4 w-4" />
              Qualidade da base
            </div>
            <h2 className="mt-1 text-2xl font-bold text-primary">
              Evidência antes de ranking
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Recorte atual com fonte, preço, pedigree e lacunas mapeadas.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {quality.sources[0]?.name || 'Fonte não identificada'} ·{' '}
            {formatNumber(quality.lots)} lotes
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <QualityMetric
            label="Com link de fonte"
            value={`${percentage(quality.with_source_url, quality.lots)}%`}
            detail={`${formatNumber(quality.with_source_url)} de ${formatNumber(quality.lots)}`}
          />
          <QualityMetric
            label="Com preço vendido"
            value={`${percentage(quality.with_price, quality.lots)}%`}
            detail={`${formatNumber(quality.with_price)} registros`}
          />
          <QualityMetric
            label="Com pedigree"
            value={`${percentage(quality.with_pedigree, quality.lots)}%`}
            detail="Pai e linha materna preenchidos"
          />
          <QualityMetric
            label="Alta confiança"
            value={`${percentage(quality.high_confidence, quality.lots)}%`}
            detail={`${formatNumber(quality.high_confidence)} registros 80%+`}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankingList
          title="Garanhões por venda"
          subtitle="Valor vendido, lotes vendidos e top price por pai."
          rows={sireRows}
          icon={Trophy}
          onSelect={focusSire}
        />
        <RankingList
          title="Avôs maternos"
          subtitle="Valor vendido e mediana por avô materno."
          rows={damSireRows}
          icon={ShieldCheck}
          onSelect={focusDamSire}
        />
        <RankingList
          title="Vendedores"
          subtitle="Origem comercial informada nos lotes vendidos."
          rows={vendorRows}
          icon={Users}
          onSelect={focusSearch}
        />
        <RankingList
          title="Casas"
          subtitle="Volume, conversão e ticket por casa de leilão."
          rows={houseRows}
          icon={Gavel}
          onSelect={focusHouse}
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-xl text-primary">Lotes</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatNumber(total)} lotes encontrados. Página {page} de{' '}
              {totalPages}.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="rounded-md border border-dashed p-10 text-center text-muted-foreground">
              Carregando mercado global...
            </div>
          ) : lots.length === 0 ? (
            <div className="rounded-md border border-dashed p-10 text-center">
              <Database className="mx-auto h-8 w-8 text-primary" />
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
