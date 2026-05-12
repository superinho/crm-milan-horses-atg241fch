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
  Brain,
  Database,
  Dna,
  Download,
  ExternalLink,
  Loader2,
  type LucideIcon,
  Search,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  type GeneticGapRow,
  type GeneticIntelligenceData,
  type GeneticMetricRow,
  type GeneticRankingMode,
} from '@/services/genetic-intelligence'

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
  cross: 'Cruzamentos',
}

const csvEscape = (value: unknown) =>
  `"${String(value ?? '').replaceAll('"', '""')}"`

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

function RankingTable({ rows }: { rows: GeneticMetricRow[] }) {
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
              <TableHead>Atividade</TableHead>
              <TableHead>Vendas</TableHead>
              <TableHead>Conversão</TableHead>
              <TableHead>Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 12).map((row, index) => (
              <TableRow key={row.key}>
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
                      <div className="mt-2 flex flex-wrap gap-1">
                        {row.categories.map((category) => (
                          <Badge
                            key={category}
                            variant="outline"
                            className="rounded-md"
                          >
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
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
                    {number(row.salesCount)} vendas
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {number(row.soldLots)} lotes vendidos
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function EnrichmentTable({
  gaps,
  onExport,
}: {
  gaps: GeneticGapRow[]
  onExport: () => void
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base text-primary">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Fila de enriquecimento externo
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Lotes com lance ou venda, mas sem genealogia confirmada no lote
            salvo da Smart.
          </p>
        </div>
        <Button variant="outline" onClick={onExport} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Origem</TableHead>
              <TableHead>Lote</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gaps.slice(0, 10).map((gap, index) => (
              <TableRow key={`${gap.source}-${gap.lotId}-${index}`}>
                <TableCell>
                  <Badge
                    variant={gap.source === 'Venda' ? 'default' : 'secondary'}
                    className="rounded-md"
                  >
                    {gap.source}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{gap.lotNumber}</div>
                  <div className="text-xs text-muted-foreground">
                    ID {gap.lotId || 'sem ID'}
                  </div>
                </TableCell>
                <TableCell className="max-w-[420px]">
                  <div className="truncate">{gap.description}</div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {money(gap.value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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

  const activeRows = useMemo(() => {
    if (!data) return []
    const source =
      mode === 'mare' ? data.mares : mode === 'sire' ? data.sires : data.crosses
    const normalizedSearch = search.trim().toLowerCase()

    return source.filter((row) => {
      const activity = row.bidCount + row.salesCount
      if (minActivity === 'active' && activity === 0) return false
      if (minActivity === 'sold' && row.salesCount === 0) return false
      if (!normalizedSearch) return true
      return `${row.label} ${row.secondaryLabel} ${row.categories.join(' ')}`
        .toLowerCase()
        .includes(normalizedSearch)
    })
  }, [data, mode, search, minActivity])

  const chartRows = activeRows.slice(0, 8).map((row) => ({
    name: row.label.length > 18 ? `${row.label.slice(0, 18)}...` : row.label,
    vendas: row.salesValue,
    lances: row.bidCount,
  }))

  const exportGaps = () => {
    if (!data?.gaps.length) return
    const header = ['origem', 'id_lote', 'numero_lote', 'descricao', 'valor']
    const rows = data.gaps.map((gap) => [
      gap.source,
      gap.lotId,
      gap.lotNumber,
      gap.description,
      gap.value,
    ])
    const csv = [header, ...rows]
      .map((row) => row.map(csvEscape).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'milan-horses-enriquecimento-genetico.csv'
    link.click()
    URL.revokeObjectURL(url)
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
            Entenda quais matrizes, garanhões e cruzamentos geram lances, vendas
            e valor nos leilões Milan Horses.
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
              <SelectItem value="sold">Com vendas</SelectItem>
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
          helper="Ligados a lote com matriz confirmada"
          icon={Sparkles}
        />
        <MetricCard
          title="Vendas analisadas"
          value={number(data.summary.salesCountWithPedigree)}
          helper={money(data.summary.salesValueWithPedigree)}
          icon={Trophy}
        />
        <MetricCard
          title="Cobertura genética"
          value={percent(data.summary.enrichmentCoverage)}
          helper={`${number(data.summary.unmatchedSalesCount + data.summary.unmatchedBidCount)} registros para enriquecer`}
          icon={Brain}
        />
      </div>

      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/80">
        <CardContent className="p-0">
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="p-4 lg:p-5">
              <Tabs
                value={mode}
                onValueChange={(value) => setMode(value as GeneticRankingMode)}
                className="space-y-4"
              >
                <TabsList className="grid w-full max-w-xl grid-cols-3">
                  <TabsTrigger value="mare">Matrizes</TabsTrigger>
                  <TabsTrigger value="sire">Garanhões</TabsTrigger>
                  <TabsTrigger value="cross">Cruzamentos</TabsTrigger>
                </TabsList>

                {(['mare', 'sire', 'cross'] as const).map((tab) => (
                  <TabsContent key={tab} value={tab} className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold text-primary">
                        {rankingLabel[tab]} por tração comercial
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Ranking combina valor vendido, intensidade de lances e
                        maior lance registrado.
                      </p>
                    </div>
                    <RankingTable rows={activeRows} />
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
                  Valor vendido e número de lances entre os primeiros colocados.
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
                        name === 'vendas'
                          ? [money(Number(value)), 'Vendas']
                          : [number(Number(value)), 'Lances']
                      }
                    />
                    <Bar
                      dataKey="vendas"
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
                  Use a aba Matrizes para decidir alertas de clientes. Use
                  Cruzamentos para identificar combinações que merecem campanha
                  própria quando um lote parecido entrar.
                </p>
              </div>
            </aside>
          </div>
        </CardContent>
      </Card>

      <EnrichmentTable gaps={data.gaps} onExport={exportGaps} />

      <Card className="border-primary/20 bg-white shadow-sm">
        <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-secondary/20 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              <Brain className="h-3.5 w-3.5" />
              Próximo salto de qualidade
            </div>
            <h2 className="text-lg font-semibold text-primary">
              Enriquecer o histórico com pedigree externo
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              A Smart já entrega pedigree para lotes atuais. Para o histórico, o
              CRM deve usar a fila acima como lista de pesquisa em bases como
              Hippomundo e HorseTelex.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                title: '1. Confirmar lote',
                text: 'Validar nome, registro, UELN ou descrição do lote antes de enriquecer.',
              },
              {
                title: '2. Completar família',
                text: 'Adicionar matriz, garanhão, pai da matriz e link da fonte externa.',
              },
              {
                title: '3. Ativar CRM',
                text: 'Criar alertas para clientes que disputam a mesma matriz ou cruzamento.',
              },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-md border bg-muted/10 p-3"
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  {step.title}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
