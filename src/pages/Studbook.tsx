import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Baby,
  BookOpen,
  Building2,
  Calendar,
  Database,
  Dna,
  ExternalLink,
  FilterX,
  GitBranch,
  Loader2,
  type LucideIcon,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  UserRound,
  VenusAndMars,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { MultiSelect } from '@/components/ui/multi-select'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  studbookService,
  type AuctionCandidateList,
  type StudbookFilterOptions,
  type StudbookFilters,
  type StudbookHorse,
  type StudbookOverview,
  type StudbookSortMode,
} from '@/services/studbook'

const emptyFilterOptions: StudbookFilterOptions = {
  breeders: [],
  owners: [],
  sires: [],
  dams: [],
  ageMin: 0,
  ageMax: 30,
}

const formatDate = (date?: string | null) => {
  if (!date) return 'Sem data'
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR')
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(
    value || 0,
  )

const quality = (value?: number | null) => Math.round(Number(value || 0))

const ageLabel = (horse: StudbookHorse) =>
  horse.age_years !== null && horse.age_years !== undefined
    ? `${horse.age_years} anos`
    : 'Sem idade'

const registrationLabel = (horse: StudbookHorse) =>
  horse.registration ||
  horse.original_registration ||
  horse.ueln ||
  'Sem registro'

function StatCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string
  value: string | number
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

function HorseTable({
  horses,
  lists,
  onAddToList,
}: {
  horses: StudbookHorse[]
  lists: AuctionCandidateList[]
  onAddToList: (horse: StudbookHorse) => void
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-2 border-b pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-base text-primary">
            Registros do Studbook
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {horses.length} registros visíveis para curadoria.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit rounded-md">
          Base secundária
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cavalo</TableHead>
              <TableHead>Genealogia</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Criador e proprietário</TableHead>
              <TableHead>Curadoria</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {horses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  Nenhum registro encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              horses.map((horse) => (
                <TableRow key={horse.id}>
                  <TableCell className="min-w-[260px]">
                    <div className="font-semibold text-foreground">
                      {horse.name}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {registrationLabel(horse)}
                      {horse.microchip ? ` · chip ${horse.microchip}` : ''}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {horse.sex ? (
                        <Badge variant="outline" className="rounded-md">
                          {horse.sex}
                        </Badge>
                      ) : null}
                      {horse.breed ? (
                        <Badge variant="secondary" className="rounded-md">
                          {horse.breed}
                        </Badge>
                      ) : null}
                      {horse.is_reproductive_mare ? (
                        <Badge className="rounded-md">Matriz ativa</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[240px]">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1.5">
                        <GitBranch className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium">
                          {horse.sire_name || 'Pai não informado'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Matriz: {horse.dam_name || 'não informada'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{ageLabel(horse)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(horse.birth_date)}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {horse.offspring_count || 0} filhos registrados
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[220px]">
                    <div className="text-sm">
                      {horse.breeder_name || 'Criador não informado'}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Prop.: {horse.owner_name || 'não informado'}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[170px]">
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span>Qualidade</span>
                      <span className="font-semibold">
                        {quality(horse.data_quality_score)}%
                      </span>
                    </div>
                    <Progress
                      value={quality(horse.data_quality_score)}
                      className="h-2"
                    />
                    {horse.source_url ? (
                      <a
                        href={horse.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Fonte ABCCH
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Sem link de fonte
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!lists.length}
                      onClick={() => onAddToList(horse)}
                    >
                      <Plus className="h-4 w-4" />
                      Lista
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default function Studbook() {
  const [overview, setOverview] = useState<StudbookOverview | null>(null)
  const [filterOptions, setFilterOptions] =
    useState<StudbookFilterOptions>(emptyFilterOptions)
  const [horses, setHorses] = useState<StudbookHorse[]>([])
  const [lists, setLists] = useState<AuctionCandidateList[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sex, setSex] = useState('all')
  const [selectedBreeders, setSelectedBreeders] = useState<string[]>([])
  const [selectedOwners, setSelectedOwners] = useState<string[]>([])
  const [selectedSires, setSelectedSires] = useState<string[]>([])
  const [selectedDams, setSelectedDams] = useState<string[]>([])
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 30])
  const [includeUnknownAge, setIncludeUnknownAge] = useState(true)
  const [reproductiveOnly, setReproductiveOnly] = useState(false)
  const [minOffspring, setMinOffspring] = useState('all')
  const [dataQualityMin, setDataQualityMin] = useState('all')
  const [sortBy, setSortBy] = useState<StudbookSortMode>('updated')
  const { toast } = useToast()

  const filters = useMemo<StudbookFilters>(
    () => ({
      search,
      sex,
      reproductiveOnly,
      breederNames: selectedBreeders,
      ownerNames: selectedOwners,
      sireNames: selectedSires,
      damNames: selectedDams,
      minAge: ageRange[0],
      maxAge: ageRange[1],
      includeUnknownAge,
      minOffspring:
        minOffspring === 'all' ? undefined : Number(minOffspring || 0),
      dataQualityMin:
        dataQualityMin === 'all' ? undefined : Number(dataQualityMin || 0),
      sortBy,
    }),
    [
      search,
      sex,
      reproductiveOnly,
      selectedBreeders,
      selectedOwners,
      selectedSires,
      selectedDams,
      ageRange,
      includeUnknownAge,
      minOffspring,
      dataQualityMin,
      sortBy,
    ],
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [nextOverview, nextHorses, nextLists] = await Promise.all([
        studbookService.getOverview(),
        studbookService.getHorses(filters),
        studbookService.getCandidateLists(),
      ])
      setOverview(nextOverview)
      setHorses(nextHorses)
      setLists(nextLists)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao carregar Studbook',
        description: 'Não foi possível carregar a base secundária agora.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [filters, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    studbookService
      .getFilterOptions()
      .then(setFilterOptions)
      .catch((error) => {
        console.error(error)
        toast({
          title: 'Filtros parciais',
          description: 'Não foi possível carregar todas as opções do Studbook.',
          variant: 'destructive',
        })
      })
  }, [toast])

  const displayedHorses = useMemo(
    () =>
      horses.filter((horse) => {
        if (horse.age_years === null || horse.age_years === undefined) {
          return includeUnknownAge
        }
        return horse.age_years >= ageRange[0] && horse.age_years <= ageRange[1]
      }),
    [horses, ageRange, includeUnknownAge],
  )

  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    (sex !== 'all' ? 1 : 0) +
    selectedBreeders.length +
    selectedOwners.length +
    selectedSires.length +
    selectedDams.length +
    (ageRange[0] !== 0 || ageRange[1] !== 30 ? 1 : 0) +
    (!includeUnknownAge ? 1 : 0) +
    (reproductiveOnly ? 1 : 0) +
    (minOffspring !== 'all' ? 1 : 0) +
    (dataQualityMin !== 'all' ? 1 : 0)

  const resetFilters = () => {
    setSearch('')
    setSex('all')
    setSelectedBreeders([])
    setSelectedOwners([])
    setSelectedSires([])
    setSelectedDams([])
    setAgeRange([0, 30])
    setIncludeUnknownAge(true)
    setReproductiveOnly(false)
    setMinOffspring('all')
    setDataQualityMin('all')
    setSortBy('updated')
  }

  const applyMarePreset = () => {
    setSex('female')
    setAgeRange([3, 18])
    setIncludeUnknownAge(false)
    setReproductiveOnly(false)
    setSortBy('quality')
  }

  const applyProducerPreset = () => {
    setSex('female')
    setAgeRange([4, 18])
    setIncludeUnknownAge(false)
    setMinOffspring('1')
    setSortBy('offspring')
  }

  const applyYoungPreset = () => {
    setSex('all')
    setAgeRange([0, 5])
    setIncludeUnknownAge(false)
    setMinOffspring('all')
    setSortBy('age_asc')
  }

  const createDefaultList = async () => {
    try {
      await studbookService.createCandidateList(
        'Matrizes-alvo',
        'Seleção inicial de matrizes para futuros leilões Milan Horses.',
      )
      toast({
        title: 'Lista criada',
        description: 'Agora você pode adicionar matrizes à lista de leilão.',
        variant: 'success',
      })
      await loadData()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao criar lista',
        description: 'Não foi possível criar a lista agora.',
        variant: 'destructive',
      })
    }
  }

  const addToFirstList = async (horse: StudbookHorse) => {
    const [firstList] = lists
    if (!firstList) return

    try {
      await studbookService.addHorseToList(
        firstList.id,
        horse.id,
        'Selecionado a partir do Banco Genético Studbook BH.',
      )
      toast({
        title: 'Registro adicionado',
        description: `${horse.name} entrou em ${firstList.name}.`,
        variant: 'success',
      })
      await loadData()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao adicionar',
        description: 'Não foi possível adicionar este registro à lista.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            <BookOpen className="h-3.5 w-3.5" />
            Base secundária
          </div>
          <h1 className="font-display text-3xl font-bold text-primary">
            Studbook BH
          </h1>
          <p className="mt-1 max-w-3xl text-muted-foreground">
            Banco separado do CRM de clientes para pesquisar cavalos, linhagens,
            idade, criadores, proprietários e montar listas de futuros leilões.
          </p>
        </div>
        <Button onClick={createDefaultList}>
          <Plus className="h-4 w-4" />
          Criar lista de leilão
        </Button>
      </div>

      <div className="rounded-md border bg-white p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <div className="font-semibold text-primary">
              Separado por desenho
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Estes dados vivem em tabelas `studbook_*` e `auction_candidate_*`.
              Eles não alteram contatos, compradores, campanhas ou RFMV.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Cavalos registrados"
          value={formatNumber(overview?.total || 0)}
          helper="Base ABCCH importada"
          icon={Database}
        />
        <StatCard
          title="Matrizes em janela"
          value={formatNumber(overview?.reproductiveMares || 0)}
          helper={`${formatNumber(overview?.mares || 0)} fêmeas mapeadas`}
          icon={Dna}
        />
        <StatCard
          title="Genealogia completa"
          value={formatNumber(overview?.withGenealogy || 0)}
          helper="Com pai e mãe preenchidos"
          icon={GitBranch}
        />
        <StatCard
          title="Sem proprietário"
          value={formatNumber(overview?.missingOwner || 0)}
          helper="Prioridade de enriquecimento"
          icon={UserRound}
        />
      </div>

      <Card className="border-primary/15 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base text-primary">
              <SlidersHorizontal className="h-4 w-4" />
              Curadoria para montar leilões
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Filtre a base por idade, linhagem, criador, proprietário e
              potencial reprodutivo.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
        <CardContent className="space-y-5 p-5">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome, registro, microchip, criador, proprietário, pai ou mãe..."
                className="bg-white pl-9"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os perfis</SelectItem>
                  <SelectItem value="female">Fêmeas / matrizes</SelectItem>
                  <SelectItem value="male">Machos / garanhões</SelectItem>
                  <SelectItem value="gelding">Castrados</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as StudbookSortMode)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Mais recentes</SelectItem>
                  <SelectItem value="name">Nome A-Z</SelectItem>
                  <SelectItem value="age_asc">Mais jovens</SelectItem>
                  <SelectItem value="age_desc">Mais velhos</SelectItem>
                  <SelectItem value="offspring">Mais filhos</SelectItem>
                  <SelectItem value="quality">Melhor qualidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_1.4fr_0.8fr]">
            <div className="space-y-4">
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      Idade
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {ageRange[0]} a {ageRange[1]} anos
                    </div>
                  </div>
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <Slider
                  value={ageRange}
                  min={0}
                  max={30}
                  step={1}
                  minStepsBetweenThumbs={1}
                  onValueChange={(value) =>
                    setAgeRange([value[0] || 0, value[1] || 30])
                  }
                />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>0 anos</span>
                  <span>30+ anos</span>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={includeUnknownAge}
                  onCheckedChange={(checked) =>
                    setIncludeUnknownAge(checked === true)
                  }
                />
                Incluir registros sem nascimento
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Building2 className="h-4 w-4 text-primary" />
                  Criadores
                </label>
                <MultiSelect
                  options={filterOptions.breeders}
                  selected={selectedBreeders}
                  onChange={setSelectedBreeders}
                  placeholder="Selecionar criadores"
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <UserRound className="h-4 w-4 text-primary" />
                  Proprietários
                </label>
                <MultiSelect
                  options={filterOptions.owners}
                  selected={selectedOwners}
                  onChange={setSelectedOwners}
                  placeholder="Selecionar proprietários"
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Trophy className="h-4 w-4 text-primary" />
                  Pai / garanhão
                </label>
                <MultiSelect
                  options={filterOptions.sires}
                  selected={selectedSires}
                  onChange={setSelectedSires}
                  placeholder="Selecionar garanhões"
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <VenusAndMars className="h-4 w-4 text-primary" />
                  Mãe / matriz
                </label>
                <MultiSelect
                  options={filterOptions.dams}
                  selected={selectedDams}
                  onChange={setSelectedDams}
                  placeholder="Selecionar matrizes"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Select value={minOffspring} onValueChange={setMinOffspring}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer filhos</SelectItem>
                  <SelectItem value="1">Com filhos</SelectItem>
                  <SelectItem value="3">3+ filhos</SelectItem>
                  <SelectItem value="5">5+ filhos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dataQualityMin} onValueChange={setDataQualityMin}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer qualidade</SelectItem>
                  <SelectItem value="50">50%+ completo</SelectItem>
                  <SelectItem value="70">70%+ completo</SelectItem>
                  <SelectItem value="85">85%+ completo</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={reproductiveOnly ? 'default' : 'outline'}
                onClick={() => setReproductiveOnly((current) => !current)}
                className="w-full"
              >
                <Sparkles className="h-4 w-4" />
                Matrizes ativas
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" onClick={applyMarePreset}>
              <Dna className="h-4 w-4" />
              Matrizes 3-18
            </Button>
            <Button variant="outline" onClick={applyProducerPreset}>
              <Baby className="h-4 w-4" />
              Produtoras
            </Button>
            <Button variant="outline" onClick={applyYoungPreset}>
              <Calendar className="h-4 w-4" />
              Jovens promessas
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          {loading ? (
            <div className="flex min-h-72 items-center justify-center rounded-md border bg-white">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <HorseTable
              horses={displayedHorses}
              lists={lists}
              onAddToList={addToFirstList}
            />
          )}
        </div>

        <aside className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base text-primary">
                Tese da seleção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
              <div className="rounded-md border bg-muted/10 p-3">
                <div className="font-semibold text-foreground">
                  {displayedHorses.length} candidatos visíveis
                </div>
                <p className="mt-1 text-xs leading-relaxed">
                  Use a lista para montar um leilão por família materna, por
                  criador ou por perfil de idade. A melhor próxima camada é
                  cruzar essa base com valores reais de arremate.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Com genealogia</span>
                  <strong className="text-foreground">
                    {
                      displayedHorses.filter(
                        (horse) => horse.sire_name && horse.dam_name,
                      ).length
                    }
                  </strong>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Com proprietário</span>
                  <strong className="text-foreground">
                    {displayedHorses.filter((horse) => horse.owner_name).length}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Com filhos</span>
                  <strong className="text-foreground">
                    {
                      displayedHorses.filter(
                        (horse) => Number(horse.offspring_count || 0) > 0,
                      ).length
                    }
                  </strong>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base text-primary">
                Listas de leilão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {lists.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Crie uma lista para começar a separar matrizes e cavalos com
                  potencial comercial.
                </p>
              ) : (
                lists.map((list) => (
                  <div key={list.id} className="rounded-md border p-3">
                    <div className="font-semibold">{list.name}</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {list.thesis || 'Sem tese comercial definida.'}
                    </p>
                    <Badge variant="secondary" className="mt-3 rounded-md">
                      {list.item_count || 0} selecionados
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base text-primary">
                Importação ABCCH
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
              <p>
                O schema já está preparado para download incremental da base
                pública, guardando fonte, payload bruto e data da última
                sincronização.
              </p>
              <p>
                A coleta deve rodar em fila lenta e auditável para manter
                rastreabilidade e não misturar a base de cavalos com o CRM de
                clientes.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
