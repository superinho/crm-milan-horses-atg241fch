import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  Calendar,
  Database,
  Dna,
  Filter,
  Loader2,
  type LucideIcon,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { useToast } from '@/hooks/use-toast'
import {
  studbookService,
  type AuctionCandidateList,
  type StudbookFilters,
  type StudbookHorse,
  type StudbookOverview,
} from '@/services/studbook'

const ageBands = [
  '0-2 anos',
  '3-5 anos',
  '6-10 anos',
  '11-16 anos',
  '17+ anos',
  'sem data',
]

const formatDate = (date?: string | null) => {
  if (!date) return 'Sem data'
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR')
}

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
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-base text-primary">
          Registros do Studbook
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cavalo</TableHead>
              <TableHead>Idade</TableHead>
              <TableHead>Criador</TableHead>
              <TableHead>Proprietário atual</TableHead>
              <TableHead>Filhos</TableHead>
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
                  A base secundária está pronta. Quando a importação ABCCH
                  começar, os registros aparecem aqui.
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
                      {horse.registration}
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
                  <TableCell>
                    <div className="font-medium">
                      {horse.age_years !== null && horse.age_years !== undefined
                        ? `${horse.age_years} anos`
                        : 'Sem idade'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(horse.birth_date)}
                    </div>
                  </TableCell>
                  <TableCell>{horse.breeder_name || 'Não informado'}</TableCell>
                  <TableCell>{horse.owner_name || 'Não informado'}</TableCell>
                  <TableCell>{horse.offspring_count || 0}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!lists.length}
                      onClick={() => onAddToList(horse)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
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
  const [horses, setHorses] = useState<StudbookHorse[]>([])
  const [lists, setLists] = useState<AuctionCandidateList[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sex, setSex] = useState('all')
  const [ageBand, setAgeBand] = useState('all')
  const [reproductiveOnly, setReproductiveOnly] = useState(false)
  const { toast } = useToast()

  const filters = useMemo<StudbookFilters>(
    () => ({ search, sex, ageBand, reproductiveOnly }),
    [search, sex, ageBand, reproductiveOnly],
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
        title: 'Matriz adicionada',
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
            Banco separado do CRM de clientes para registrar cavalos, idade,
            criador, proprietário atual, genealogia e potenciais matrizes de
            leilão.
          </p>
        </div>
        <Button onClick={createDefaultList}>
          <Plus className="mr-2 h-4 w-4" />
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
          value={overview?.total || 0}
          helper="Base ABCCH importada"
          icon={Database}
        />
        <StatCard
          title="Matrizes"
          value={overview?.mares || 0}
          helper={`${overview?.reproductiveMares || 0} em idade reprodutiva`}
          icon={Dna}
        />
        <StatCard
          title="Criadores"
          value={overview?.breeders || 0}
          helper="Haras e criadores normalizados"
          icon={Users}
        />
        <StatCard
          title="Sem nascimento"
          value={overview?.missingBirthDate || 0}
          helper="Registros para completar idade"
          icon={Calendar}
        />
      </div>

      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, registro, microchip, criador ou proprietário..."
              className="bg-white pl-9"
            />
          </div>
          <Select value={sex} onValueChange={setSex}>
            <SelectTrigger className="bg-white lg:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os sexos</SelectItem>
              <SelectItem value="F">Fêmeas</SelectItem>
              <SelectItem value="M">Machos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ageBand} onValueChange={setAgeBand}>
            <SelectTrigger className="bg-white lg:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas idades</SelectItem>
              {ageBands.map((band) => (
                <SelectItem key={band} value={band}>
                  {band}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={reproductiveOnly ? 'default' : 'outline'}
            onClick={() => setReproductiveOnly((current) => !current)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Matrizes ativas
          </Button>
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
              horses={horses}
              lists={lists}
              onAddToList={addToFirstList}
            />
          )}
        </div>

        <aside className="space-y-4">
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
                A coleta deve rodar em fila lenta e auditável para respeitar a
                origem pública e manter rastreabilidade.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
