import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  BadgeCheck,
  Brain,
  Building2,
  CalendarDays,
  ChevronRight,
  Database,
  Dna,
  Eye,
  FilterX,
  Gavel,
  Loader2,
  type LucideIcon,
  ReceiptText,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trophy,
  VenusAndMars,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { MultiSelect, type Option } from '@/components/ui/multi-select'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  geneticIntelligenceService,
  type GeneticCommercialEntry,
  type GeneticEvidenceLot,
  type GeneticIntelligenceData,
  type GeneticMetricRow,
  type GeneticRankingMode,
  type GeneticReproductiveType,
} from '@/services/genetic-intelligence'
import { Slider } from '@/components/ui/slider'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value || 0)

const number = (value: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(
    value || 0,
  )

const percent = (value: number) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value || 0)}%`

const rankingLabel: Record<GeneticRankingMode, string> = {
  mare: 'Matrizes',
  sire: 'Garanhões',
}

type SortMode = 'score' | 'sales' | 'bids' | 'conversion' | 'youngest'

const reproductiveTypeLabel: Record<GeneticReproductiveType, string> = {
  mare: 'Matriz/Fêmea',
  stallion: 'Garanhão/Macho',
  gelding: 'Castrado',
  embryo: 'Embrião',
  young: 'Potro/Potra',
  unknown: 'Não informado',
}

const typeOrder: GeneticReproductiveType[] = [
  'mare',
  'stallion',
  'gelding',
  'embryo',
  'young',
  'unknown',
]

const scoreOf = (row: GeneticMetricRow) =>
  row.salesValue * 3 + row.bidCount * 10000 + row.topBid

const ageRangeLabel = (row: GeneticMetricRow) => {
  if (row.age.knownLots === 0) return 'Idade não informada'
  if (row.age.min === row.age.max) return `${row.age.min} anos`
  return `${row.age.min}-${row.age.max} anos`
}

const dateLabel = (value: string) => {
  if (!value || value === 'Sem data') return 'Sem data'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

const evidenceActivityLabel = (row: GeneticMetricRow) => {
  const parts = [
    `${number(row.lotsOffered)} lotes`,
    `${number(row.bidCount)} lances`,
    `${number(row.salesCount)} contratos`,
  ]

  return parts.join(' · ')
}

function EvidenceStat({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper?: string
}) {
  return (
    <div className="rounded-md border bg-white p-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-primary">{value}</div>
      {helper ? (
        <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
      ) : null}
    </div>
  )
}

function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string
  value: string
  helper: string
  icon: LucideIcon
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="mt-2 text-2xl font-bold text-foreground">{value}</div>
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function ContactName({ entry }: { entry: GeneticCommercialEntry }) {
  if (entry.contact?.id) {
    return (
      <Link
        to={`/contatos/${entry.contact.id}`}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {entry.participantName}
      </Link>
    )
  }

  return (
    <span className="font-medium text-foreground">{entry.participantName}</span>
  )
}

function CommercialEntriesTable({
  title,
  icon: Icon,
  entries,
  participantLabel,
  emptyText,
}: {
  title: string
  icon: LucideIcon
  entries: GeneticCommercialEntry[]
  participantLabel: string
  emptyText: string
}) {
  const orderedEntries = [...entries].sort(
    (a, b) => b.value - a.value || b.date.localeCompare(a.date),
  )

  return (
    <div className="rounded-md border bg-white">
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Icon className="h-4 w-4" />
          {title}
        </div>
        <Badge variant="secondary" className="rounded-md">
          {number(entries.length)}
        </Badge>
      </div>
      {entries.length === 0 ? (
        <div className="px-3 py-4 text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{participantLabel}</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderedEntries.map((entry) => (
              <TableRow key={`${entry.id}-${entry.smartleiloesId}`}>
                <TableCell className="min-w-[180px]">
                  <ContactName entry={entry} />
                  <div className="mt-1 text-xs text-muted-foreground">
                    Smart ID {entry.smartleiloesId}
                  </div>
                </TableCell>
                <TableCell>{dateLabel(entry.date)}</TableCell>
                <TableCell className="max-w-[220px]">
                  <span className="line-clamp-2 text-xs text-muted-foreground">
                    {entry.status}
                  </span>
                </TableCell>
                <TableCell className="text-right font-semibold text-primary">
                  {money(entry.value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

function EvidenceLotCard({ lot }: { lot: GeneticEvidenceLot }) {
  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="border-b bg-muted/10 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-3">
            {lot.imageUrl ? (
              <img
                src={lot.imageUrl}
                alt={lot.title}
                className="h-16 w-16 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-md bg-white ring-1 ring-border">
                <Dna className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-md bg-white">
                  Lote {lot.lotNumber}
                </Badge>
                <Badge variant="secondary" className="rounded-md">
                  {reproductiveTypeLabel[lot.reproductiveType]}
                </Badge>
              </div>
              <CardTitle className="mt-2 text-base text-primary">
                {lot.title}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {lot.sourceLabel}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:w-[460px]">
            <EvidenceStat label="Lances" value={number(lot.bidCount)} />
            <EvidenceStat
              label="Licitantes"
              value={number(lot.uniqueBidders)}
            />
            <EvidenceStat label="Contratos" value={number(lot.salesCount)} />
            <EvidenceStat label="Valor contratado" value={money(lot.salesValue)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground">
              Matriz
            </div>
            <div className="mt-1 font-medium text-foreground">{lot.mare}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">
              Garanhão
            </div>
            <div className="mt-1 font-medium text-foreground">{lot.sire}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">
              Criador
            </div>
            <div className="mt-1 font-medium text-foreground">
              {lot.breeder}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">
              Idade
            </div>
            <div className="mt-1 font-medium text-foreground">
              {lot.ageLabel}
            </div>
          </div>
        </div>
        <div className="grid gap-3">
          <CommercialEntriesTable
            title="Lances registrados"
            icon={Gavel}
            entries={lot.bids}
            participantLabel="Licitante"
            emptyText="Nenhum lance vinculado a este lote."
          />
          <CommercialEntriesTable
            title="Contratos registrados"
            icon={ReceiptText}
            entries={lot.purchases}
            participantLabel="Comprador"
            emptyText="Nenhum contrato vinculado a este lote."
          />
        </div>
      </CardContent>
    </Card>
  )
}

function EvidenceSheet({
  row,
  open,
  onOpenChange,
}: {
  row: GeneticMetricRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl lg:max-w-5xl">
        {row ? (
          <div className="space-y-5 pb-6">
            <SheetHeader className="pr-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-md">
                  {rankingLabel[row.mode]}
                </Badge>
                <Badge variant="outline" className="rounded-md">
                  Base rastreável
                </Badge>
              </div>
              <SheetTitle className="text-2xl text-primary">
                {row.label}
              </SheetTitle>
              <SheetDescription>
                {row.secondaryLabel}. Este card lista os lotes, lances,
                licitantes, contratos e compradores que sustentam o ranking.
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <EvidenceStat label="Lotes" value={number(row.lotsOffered)} />
              <EvidenceStat label="Lances" value={number(row.bidCount)} />
              <EvidenceStat
                label="Licitantes"
                value={number(row.uniqueBidders)}
              />
              <EvidenceStat label="Contratos" value={number(row.salesCount)} />
              <EvidenceStat
                label="Valor contratado"
                value={money(row.salesValue)}
                helper={`Top lance ${money(row.topBid)}`}
              />
            </div>

            <div className="flex items-start gap-2 rounded-md border border-primary/15 bg-primary/5 p-3 text-sm text-muted-foreground">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                Garanhões e matrizes são agregados pelo nome confirmado no
                pedigree. Inferências por título foram removidas para evitar
                números sem lastro.
              </span>
            </div>

            {row.evidence.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                Nenhum lote rastreável para este resultado.
              </div>
            ) : (
              <div className="space-y-4">
                {row.evidence.map((lot) => (
                  <EvidenceLotCard key={lot.id} lot={lot} />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function RankingTable({
  rows,
  onSelectRow,
}: {
  rows: GeneticMetricRow[]
  onSelectRow: (row: GeneticMetricRow) => void
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-base text-primary">
          Ranking comercial
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Genética</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Atividade</TableHead>
              <TableHead>Contratos</TableHead>
              <TableHead>Conversão</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-28 text-center text-sm text-muted-foreground"
                >
                  Nenhum resultado com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : null}
            {rows.slice(0, 12).map((row, index) => (
              <TableRow
                key={row.key}
                role="button"
                tabIndex={0}
                className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onSelectRow(row)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelectRow(row)
                  }
                }}
              >
                <TableCell className="min-w-[280px]">
                  <div className="flex items-center gap-3">
                    {row.representativeLot?.imageUrl ? (
                      <img
                        src={row.representativeLot.imageUrl}
                        alt={row.representativeLot.title}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                        <Dna className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span className="font-semibold text-foreground">
                          {row.label}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {row.secondaryLabel}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs font-medium text-primary">
                        <Eye className="h-3.5 w-3.5" />
                        Abrir evidências
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {row.mode === 'sire' ? (
                          <Badge variant="outline" className="rounded-md">
                            {number(row.lotsOffered)} lotes vinculados
                          </Badge>
                        ) : (
                          row.categories.map((category) => (
                            <Badge
                              key={category}
                              variant="outline"
                              className="rounded-md"
                            >
                              {category}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="min-w-[190px]">
                  {row.mode === 'sire' ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Dna className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Pai informado no pedigree</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        <span className="line-clamp-1">
                          {row.breeders.find(
                            (breeder) => breeder !== 'Não informado',
                          ) || 'Criador do lote não informado'}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="rounded-md bg-secondary/20 text-primary"
                      >
                        Garanhão
                      </Badge>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{ageRangeLabel(row)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        <span className="line-clamp-1">
                          {row.breeders.find(
                            (breeder) => breeder !== 'Não informado',
                          ) || 'Criador não informado'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {row.reproductiveTypes.slice(0, 2).map((type) => (
                          <Badge
                            key={type}
                            variant="secondary"
                            className="rounded-md bg-secondary/20 text-primary"
                          >
                            {reproductiveTypeLabel[type]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {number(row.bidCount)} lances
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {number(row.uniqueBidders)} licitantes
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {number(row.salesCount)} contratos
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {number(row.soldLots)} lotes com contrato
                  </div>
                </TableCell>
                <TableCell>
                  <div className="w-28">
                    <div className="mb-1 text-xs font-medium">
                      {percent(row.conversionRate)}
                    </div>
                    <Progress
                      value={Math.min(row.conversionRate, 100)}
                      className="h-2"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-primary">
                    {money(row.salesValue)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Top lance {money(row.topBid)}
                  </div>
                </TableCell>
                <TableCell>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

type GeneticOpportunity = {
  id: string
  title: string
  label: string
  helper: string
  metric: string
  badge: string
  row?: GeneticMetricRow
  breeder?: string
}

function OpportunityBoard({
  opportunities,
  onOpenRow,
  onFocusBreeder,
}: {
  opportunities: GeneticOpportunity[]
  onOpenRow: (row: GeneticMetricRow) => void
  onFocusBreeder: (breeder: string) => void
}) {
  return (
    <Card className="border-primary/20 bg-white shadow-sm">
      <CardHeader className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base text-primary">
            <Target className="h-4 w-4" />
            Radar de oportunidades
          </CardTitle>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Sinais calculados apenas a partir de lances, contratos e pedigree
            rastreáveis no recorte atual.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit rounded-md">
          {opportunities.length} sinais
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-3 p-5 lg:grid-cols-3">
        {opportunities.length === 0 ? (
          <div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground lg:col-span-3">
            Ajuste os filtros para revelar matrizes ou garanhões com atividade
            comercial suficiente.
          </div>
        ) : (
          opportunities.map((opportunity) => (
            <div
              key={opportunity.id}
              className="flex min-h-[210px] flex-col justify-between rounded-md border bg-muted/10 p-4"
            >
              <div>
                <Badge variant="outline" className="rounded-md bg-white">
                  {opportunity.badge}
                </Badge>
                <h3 className="mt-3 text-base font-semibold text-primary">
                  {opportunity.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {opportunity.label}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {opportunity.helper}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-primary">
                  {opportunity.metric}
                </div>
                {opportunity.row ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenRow(opportunity.row!)}
                  >
                    Abrir dados
                  </Button>
                ) : opportunity.breeder ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onFocusBreeder(opportunity.breeder!)}
                  >
                    Filtrar
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export default function Genetica() {
  const [data, setData] = useState<GeneticIntelligenceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<GeneticRankingMode>('mare')
  const [search, setSearch] = useState('')
  const [minActivity, setMinActivity] = useState('all')
  const [selectedBreeders, setSelectedBreeders] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<GeneticReproductiveType[]>(
    [],
  )
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 25])
  const [includeUnknownAge, setIncludeUnknownAge] = useState(true)
  const [sortBy, setSortBy] = useState<SortMode>('score')
  const [selectedRow, setSelectedRow] = useState<GeneticMetricRow | null>(null)
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true

    geneticIntelligenceService
      .getData()
      .then((result) => {
        if (mounted) setData(result)
      })
      .catch((error) => {
        console.error(error)
        toast({
          title: 'Erro ao carregar genética',
          description:
            'Não foi possível montar a análise com os dados sincronizados.',
          variant: 'destructive',
        })
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [toast])

  const sourceRows = useMemo(() => {
    if (!data) return []
    return mode === 'mare' ? data.mares : data.sires
  }, [data, mode])

  const breederOptions = useMemo<Option[]>(() => {
    const counts = new Map<string, number>()
    sourceRows.forEach((row) => {
      row.breeders.forEach((breeder) => {
        counts.set(breeder, (counts.get(breeder) || 0) + 1)
      })
    })

    return [...counts.entries()]
      .sort(([a], [b]) => {
        if (a === 'Não informado') return 1
        if (b === 'Não informado') return -1
        return a.localeCompare(b, 'pt-BR')
      })
      .map(([breeder, count]) => ({
        value: breeder,
        label: `${breeder} (${count})`,
      }))
  }, [sourceRows])

  const typeOptions = useMemo<Option[]>(() => {
    const counts = new Map<GeneticReproductiveType, number>()
    sourceRows.forEach((row) => {
      row.reproductiveTypes.forEach((type) => {
        counts.set(type, (counts.get(type) || 0) + 1)
      })
    })

    return typeOrder
      .filter((type) => counts.has(type))
      .map((type) => ({
        value: type,
        label: `${reproductiveTypeLabel[type]} (${counts.get(type)})`,
      }))
  }, [sourceRows])

  const topBreeders = useMemo(() => {
    const totals = new Map<
      string,
      { breeder: string; rows: number; salesValue: number; bidCount: number }
    >()

    sourceRows.forEach((row) => {
      row.breeders
        .filter((breeder) => breeder !== 'Não informado')
        .forEach((breeder) => {
          const current =
            totals.get(breeder) ||
            ({ breeder, rows: 0, salesValue: 0, bidCount: 0 } as const)
          totals.set(breeder, {
            breeder,
            rows: current.rows + 1,
            salesValue: current.salesValue + row.salesValue,
            bidCount: current.bidCount + row.bidCount,
          })
        })
    })

    return [...totals.values()]
      .sort(
        (a, b) =>
          b.salesValue +
          b.bidCount * 10000 -
          (a.salesValue + a.bidCount * 10000),
      )
      .slice(0, 4)
  }, [sourceRows])

  const activeRows = useMemo(() => {
    if (!data) return []
    const source = mode === 'mare' ? data.mares : data.sires
    const normalizedSearch = search.trim().toLowerCase()

    return source
      .filter((row) => {
        const activity = row.bidCount + row.salesCount
        if (minActivity === 'active' && activity === 0) return false
        if (minActivity === 'sold' && row.salesCount === 0) return false
        if (
          selectedBreeders.length > 0 &&
          !selectedBreeders.some((breeder) => row.breeders.includes(breeder))
        ) {
          return false
        }
        if (
          selectedTypes.length > 0 &&
          !selectedTypes.some((type) => row.reproductiveTypes.includes(type))
        ) {
          return false
        }
        if (row.age.knownLots === 0) {
          if (!includeUnknownAge) return false
        } else if (
          (row.age.max || 0) < ageRange[0] ||
          (row.age.min || 0) > ageRange[1]
        ) {
          return false
        }
        if (!normalizedSearch) return true
        return `${row.label} ${row.secondaryLabel} ${row.categories.join(' ')} ${row.breeders.join(' ')} ${row.reproductiveTypes.map((type) => reproductiveTypeLabel[type]).join(' ')} ${row.representativeLot?.title || ''}`
          .toLowerCase()
          .includes(normalizedSearch)
      })
      .sort((a, b) => {
        if (sortBy === 'sales') return b.salesValue - a.salesValue
        if (sortBy === 'bids') return b.bidCount - a.bidCount
        if (sortBy === 'conversion') return b.conversionRate - a.conversionRate
        if (sortBy === 'youngest')
          return (a.age.avg ?? 999) - (b.age.avg ?? 999)
        return scoreOf(b) - scoreOf(a)
      })
  }, [
    data,
    mode,
    search,
    minActivity,
    selectedBreeders,
    selectedTypes,
    ageRange,
    includeUnknownAge,
    sortBy,
  ])

  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    (minActivity !== 'all' ? 1 : 0) +
    selectedBreeders.length +
    selectedTypes.length +
    (ageRange[0] !== 0 || ageRange[1] !== 25 ? 1 : 0) +
    (!includeUnknownAge ? 1 : 0)

  const resetFilters = () => {
    setSearch('')
    setMinActivity('all')
    setSelectedBreeders([])
    setSelectedTypes([])
    setAgeRange([0, 25])
    setIncludeUnknownAge(true)
    setSortBy('score')
  }

  const chartRows = activeRows.slice(0, 8).map((row) => ({
    name: row.label.length > 18 ? `${row.label.slice(0, 18)}...` : row.label,
    contratos: row.salesValue,
    lances: row.bidCount,
  }))

  const opportunities = useMemo<GeneticOpportunity[]>(() => {
    const rows: GeneticOpportunity[] = []
    const topCommercial = activeRows.find(
      (row) => row.salesValue > 0 || row.bidCount > 0,
    )
    const highDemandNoSale = [...activeRows]
      .filter((row) => row.bidCount > 0 && row.salesCount === 0)
      .sort((a, b) => b.bidCount - a.bidCount || b.topBid - a.topBid)[0]
    const highConversion = [...activeRows]
      .filter((row) => row.soldLots > 0 && row.conversionRate >= 50)
      .sort(
        (a, b) =>
          b.conversionRate - a.conversionRate || b.salesValue - a.salesValue,
      )[0]
    const topBreeder = topBreeders[0]

    if (topCommercial) {
      rows.push({
        id: 'top-commercial',
        title: 'Maior atividade comprovada',
        label: topCommercial.label,
        helper: evidenceActivityLabel(topCommercial),
        metric:
          topCommercial.salesValue > 0
            ? `${money(topCommercial.salesValue)} contratados`
            : `${number(topCommercial.bidCount)} lances`,
        badge: rankingLabel[mode],
        row: topCommercial,
      })
    }

    if (highDemandNoSale) {
      rows.push({
        id: 'demand-no-sale',
        title: 'Lances sem contrato',
        label: highDemandNoSale.label,
        helper:
          'Há lances registrados e nenhum contrato associado neste recorte.',
        metric: `${number(highDemandNoSale.bidCount)} lances`,
        badge: 'Conferir',
        row: highDemandNoSale,
      })
    }

    if (highConversion && highConversion.key !== topCommercial?.key) {
      rows.push({
        id: 'high-conversion',
        title: 'Contratos confirmados',
        label: highConversion.label,
        helper:
          'O card mostra os lotes com contrato, compradores e valores que compõem a conversão.',
        metric: `${percent(highConversion.conversionRate)} conversão`,
        badge: 'Contrato',
        row: highConversion,
      })
    }

    if (topBreeder) {
      rows.push({
        id: 'top-breeder',
        title: 'Criador com registros',
        label: topBreeder.breeder,
        helper:
          'Filtro por criador confirmado nos lotes que aparecem neste recorte.',
        metric: `${number(topBreeder.bidCount)} lances`,
        badge: 'Filtro',
        breeder: topBreeder.breeder,
      })
    }

    return rows.slice(0, 3)
  }, [activeRows, mode, topBreeders])

  const openEvidence = (row: GeneticMetricRow) => {
    setMode(row.mode)
    setSelectedRow(row)
    setEvidenceOpen(true)
  }

  const focusBreeder = (breeder: string) => {
    setSelectedBreeders([breeder])
    setSearch('')
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-md border bg-white p-8 text-center text-muted-foreground">
        Não foi possível carregar a inteligência genética.
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            <Dna className="h-3.5 w-3.5" />
            Inteligência hípica
          </div>
          <h1 className="font-display text-3xl font-bold text-primary">
            Genética Comercial
          </h1>
          <p className="mt-1 max-w-3xl text-muted-foreground">
            Entenda quais matrizes e garanhões geram lances, contratos e valor nos
            leilões Milan Horses, sempre com a base de cálculo aberta.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar matriz, garanhão..."
              className="w-full bg-white pl-9 sm:w-72"
            />
          </div>
          <Select value={minActivity} onValueChange={setMinActivity}>
            <SelectTrigger className="w-full bg-white sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Com lances</SelectItem>
              <SelectItem value="sold">Com contratos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Lotes com pedigree"
          value={number(data.summary.pedigreeLots)}
          helper={`${number(data.summary.lotsWithCommercialActivity)} com atividade comercial`}
          icon={Database}
        />
        <MetricCard
          title="Lances analisados"
          value={number(data.summary.bidCountWithPedigree)}
          helper="Ligados a lote com pedigree confirmado"
          icon={Sparkles}
        />
        <MetricCard
          title="Contratos analisados"
          value={number(data.summary.salesCountWithPedigree)}
          helper={money(data.summary.salesValueWithPedigree)}
          icon={Trophy}
        />
        <MetricCard
          title="Cobertura genética"
          value={percent(data.summary.enrichmentCoverage)}
          helper="Dos registros comerciais analisados"
          icon={Brain}
        />
      </div>

      {data.summary.unmatchedBidCount + data.summary.unmatchedSalesCount > 0 ? (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {number(
              data.summary.unmatchedBidCount + data.summary.unmatchedSalesCount,
            )}{' '}
            registros comerciais ficaram fora dos rankings por falta de vínculo
            confiável com lote ou pedigree.
          </span>
        </div>
      ) : null}

      <Card className="border-primary/15 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base text-primary">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros de seleção genética
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Refine por idade, criador e perfil do animal sem perder a visão
              comercial.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="rounded-md">
                {activeFilterCount} filtros ativos
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <FilterX className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 p-5 xl:grid-cols-[1.05fr_1fr_0.75fr]">
          <div className="space-y-4">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    Idade do animal
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ageRange[0]} a {ageRange[1]} anos
                  </div>
                </div>
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <Slider
                value={ageRange}
                min={0}
                max={25}
                step={1}
                minStepsBetweenThumbs={1}
                onValueChange={(value) =>
                  setAgeRange([value[0] || 0, value[1] || 25])
                }
              />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>0 anos</span>
                <span>25+ anos</span>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={includeUnknownAge}
                onCheckedChange={(checked) =>
                  setIncludeUnknownAge(checked === true)
                }
              />
              Incluir lotes sem data de nascimento informada
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Building2 className="h-4 w-4 text-primary" />
                Criadores
              </label>
              <MultiSelect
                options={breederOptions}
                selected={selectedBreeders}
                onChange={setSelectedBreeders}
                placeholder={
                  breederOptions.length
                    ? 'Selecionar criadores'
                    : 'Criador não veio da Smart'
                }
              />
              {!breederOptions.some(
                (option) => option.value !== 'Não informado',
              ) && (
                <p className="mt-2 text-xs text-muted-foreground">
                  A Smart ainda não trouxe criador nesses lotes. Quando o
                  Studbook for conciliado, este filtro fica muito mais poderoso.
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <VenusAndMars className="h-4 w-4 text-primary" />
                Perfil do lote
              </label>
              <MultiSelect
                options={typeOptions}
                selected={selectedTypes}
                onChange={(value) =>
                  setSelectedTypes(value as GeneticReproductiveType[])
                }
                placeholder="Matriz, garanhão, castrado..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Ordenar por
              </label>
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortMode)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Tração comercial</SelectItem>
                  <SelectItem value="sales">Valor contratado</SelectItem>
                  <SelectItem value="bids">Número de lances</SelectItem>
                  <SelectItem value="conversion">Conversão</SelectItem>
                  <SelectItem value="youngest">Mais jovens</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border bg-muted/10 p-3">
              <div className="text-sm font-semibold text-primary">
                Top criadores
              </div>
              {topBreeders.length ? (
                <div className="mt-2 space-y-2">
                  {topBreeders.map((breeder) => (
                    <button
                      key={breeder.breeder}
                      type="button"
                      onClick={() => focusBreeder(breeder.breeder)}
                      className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="truncate text-foreground">
                        {breeder.breeder}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {money(breeder.salesValue)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Sem criador confirmado nos dados sincronizados.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <OpportunityBoard
        opportunities={opportunities}
        onOpenRow={openEvidence}
        onFocusBreeder={focusBreeder}
      />

      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/80">
        <CardContent className="p-0">
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="p-4 lg:p-5">
              <Tabs
                value={mode}
                onValueChange={(value) => setMode(value as GeneticRankingMode)}
                className="space-y-4"
              >
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="mare">Matrizes</TabsTrigger>
                  <TabsTrigger value="sire">Garanhões</TabsTrigger>
                </TabsList>

                {(['mare', 'sire'] as const).map((tab) => (
                  <TabsContent key={tab} value={tab} className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold text-primary">
                        {rankingLabel[tab]} por tração comercial
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Ranking calculado com valor contratado, lances registrados
                        e maior lance. Clique em uma linha para ver a base.
                      </p>
                    </div>
                    <RankingTable
                      rows={activeRows}
                      onSelectRow={openEvidence}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <aside className="border-t bg-muted/10 p-4 lg:p-5 xl:border-l xl:border-t-0">
              <div className="mb-4">
                <div className="text-sm font-semibold text-primary">
                  Top {rankingLabel[mode].toLowerCase()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor contratado e número de lances entre os primeiros colocados.
                </p>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartRows} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={110}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value, name) =>
                        name === 'contratos'
                          ? [money(Number(value)), 'Contratos']
                          : [number(Number(value)), 'Lances']
                      }
                    />
                    <Bar
                      dataKey="contratos"
                      fill="#0b3a75"
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar
                      dataKey="lances"
                      fill="#b08a4a"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 rounded-md border bg-white p-3">
                <div className="text-sm font-semibold">Leitura recomendada</div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Abra qualquer linha antes de tomar ação comercial. O card
                  mostra os lances, contratos, compradores e valores que sustentam o número
                  exibido.
                </p>
              </div>
            </aside>
          </div>
        </CardContent>
      </Card>

      <EvidenceSheet
        row={selectedRow}
        open={evidenceOpen}
        onOpenChange={(open) => {
          setEvidenceOpen(open)
          if (!open) setSelectedRow(null)
        }}
      />
    </div>
  )
}
