import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  Baby,
  BookOpen,
  Building2,
  Calendar,
  Crown,
  Database,
  Download,
  Dna,
  ExternalLink,
  FilterX,
  GitBranch,
  Loader2,
  type LucideIcon,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  Users,
  UserPlus,
  UserRound,
  VenusAndMars,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { MultiSelect } from '@/components/ui/multi-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import {
  studbookService,
  type StudbookFilterOptions,
  type StudbookFilters,
  type StudbookHorse,
  type StudbookCrmContact,
  type StudbookNetworkDetail,
  type StudbookNetworkEntity,
  type StudbookNetworkKind,
  type StudbookNetworkOverview,
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

const completenessScore = (value?: number | null) =>
  Math.round(Number(value || 0))

const ageLabel = (horse: StudbookHorse) =>
  horse.age_years !== null && horse.age_years !== undefined
    ? `${horse.age_years} anos`
    : 'Sem idade'

const registrationLabel = (horse: StudbookHorse) =>
  horse.registration ||
  horse.original_registration ||
  horse.ueln ||
  'Sem registro'

type ExportScope = 'all' | 'filtered'

const studbookExportColumns: Array<{
  label: string
  value: (horse: StudbookHorse) => string | number | boolean | null | undefined
}> = [
  { label: 'Nome', value: (horse) => horse.name },
  { label: 'Registro', value: registrationLabel },
  { label: 'UELN', value: (horse) => horse.ueln },
  { label: 'Microchip', value: (horse) => horse.microchip },
  { label: 'Raça', value: (horse) => horse.breed },
  { label: 'Sexo', value: (horse) => horse.sex },
  { label: 'Nascimento', value: (horse) => horse.birth_date },
  { label: 'Ano nascimento', value: (horse) => horse.birth_year },
  { label: 'Idade', value: (horse) => horse.age_years },
  { label: 'Pai', value: (horse) => horse.sire_name },
  { label: 'Mãe', value: (horse) => horse.dam_name },
  { label: 'Criador', value: (horse) => horse.breeder_name },
  { label: 'Proprietário', value: (horse) => horse.owner_name },
  { label: 'Local nascimento', value: (horse) => horse.birthplace },
  { label: 'Filhos', value: (horse) => horse.offspring_count },
  { label: 'Matriz ativa', value: (horse) => horse.is_reproductive_mare },
  { label: 'Completude', value: (horse) => horse.data_quality_score },
  { label: 'Último sync', value: (horse) => horse.last_synced_at },
  { label: 'Atualizado em', value: (horse) => horse.updated_at },
  { label: 'Fonte', value: (horse) => horse.source_url },
]

const csvCell = (value: string | number | boolean | null | undefined) => {
  const normalized =
    value === null || value === undefined ? '' : String(value).trim()
  if (/[;"\n\r]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`
  }
  return normalized
}

const buildStudbookCsv = (rows: StudbookHorse[]) =>
  [
    studbookExportColumns.map((column) => csvCell(column.label)).join(';'),
    ...rows.map((horse) =>
      studbookExportColumns
        .map((column) => csvCell(column.value(horse)))
        .join(';'),
    ),
  ].join('\n')

const downloadCsvFile = (filename: string, csv: string) => {
  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const networkKindCopy: Record<
  StudbookNetworkKind,
  { label: string; plural: string; icon: LucideIcon; description: string }
> = {
  breeder: {
    label: 'Criador',
    plural: 'Criadores',
    icon: Building2,
    description:
      'Registros agrupados pelo criador informado na base Studbook BH.',
  },
  owner: {
    label: 'Proprietário',
    plural: 'Proprietários',
    icon: UserRound,
    description:
      'Registros agrupados pelo proprietário informado na base Studbook BH.',
  },
  sire: {
    label: 'Garanhão',
    plural: 'Garanhões',
    icon: Trophy,
    description: 'Registros agrupados pelo pai/garanhão informado no pedigree.',
  },
  dam: {
    label: 'Matriz',
    plural: 'Matrizes',
    icon: VenusAndMars,
    description: 'Registros agrupados pela mãe/matriz informada no pedigree.',
  },
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

function NetworkEntityRow({
  entity,
  rank,
  onOpen,
}: {
  entity: StudbookNetworkEntity
  rank: number
  onOpen: (entity: StudbookNetworkEntity) => void
}) {
  const copy = networkKindCopy[entity.entity_kind]
  const Icon = copy.icon

  return (
    <button
      type="button"
      onClick={() => onOpen(entity)}
      className="group flex w-full items-center gap-3 rounded-md border bg-white p-3 text-left transition hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
        {rank}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-foreground">
          {entity.name}
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
          <span>{formatNumber(entity.horse_count)} registros</span>
          <span>·</span>
          <span>{formatNumber(entity.female_count)} fêmeas</span>
          <span>·</span>
          <span>{formatNumber(entity.recent_horse_count || 0)} recentes</span>
          {entity.latest_birth_year ? (
            <>
              <span>·</span>
              <span>até {entity.latest_birth_year}</span>
            </>
          ) : null}
        </div>
      </div>
      <Icon className="h-4 w-4 shrink-0 text-primary/70" />
    </button>
  )
}

function NetworkPanel({
  kind,
  entities,
  total,
  onOpen,
}: {
  kind: StudbookNetworkKind
  entities: StudbookNetworkEntity[]
  total: number
  onOpen: (entity: StudbookNetworkEntity) => void
}) {
  const copy = networkKindCopy[kind]
  const Icon = copy.icon

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base text-primary">
              <Icon className="h-4 w-4" />
              {copy.plural}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatNumber(total)} nomes mapeados
            </p>
          </div>
          <Badge variant="secondary" className="rounded-md">
            Top {entities.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-3">
        {entities.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Sem dados suficientes para este ranking.
          </div>
        ) : (
          entities.map((entity, index) => (
            <NetworkEntityRow
              key={`${kind}-${entity.name}`}
              entity={entity}
              rank={index + 1}
              onOpen={onOpen}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}

function CrmContactPill({ contact }: { contact: StudbookCrmContact }) {
  return (
    <div className="rounded-md border bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-semibold text-foreground">
            {contact.name}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {[contact.email, contact.whatsapp || contact.phone]
              .filter(Boolean)
              .join(' · ') || 'Contato sem email/telefone'}
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0 rounded-md">
          CRM
        </Badge>
      </div>
      {contact.tags?.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {contact.tags.map((tag) => (
            <Badge key={tag.id} variant="outline" className="rounded-md">
              {tag.name}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function NetworkDetailDialog({
  open,
  detail,
  loading,
  onOpenChange,
  onApplyFilter,
  onCreateCrmContact,
  onDetailPageChange,
}: {
  open: boolean
  detail: StudbookNetworkDetail | null
  loading: boolean
  onOpenChange: (open: boolean) => void
  onApplyFilter: (entity: StudbookNetworkEntity) => void
  onCreateCrmContact: (entity: StudbookNetworkEntity) => void
  onDetailPageChange: (page: number) => void
}) {
  const entity = detail?.entity
  const copy = entity ? networkKindCopy[entity.entity_kind] : null
  const Icon = copy?.icon || Crown
  const detailTotalPages = detail
    ? Math.max(1, Math.ceil(detail.horseTotal / detail.pageSize))
    : 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        {loading || !entity || !copy ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-primary">
                Carregando card
              </DialogTitle>
              <DialogDescription>
                Buscando registros conectados no Studbook.
              </DialogDescription>
            </DialogHeader>
            <div className="flex min-h-72 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="mb-2 flex items-center gap-2">
                <Badge className="rounded-md">{copy.label}</Badge>
                <Badge variant="secondary" className="rounded-md">
                  Rede Hípica
                </Badge>
              </div>
              <DialogTitle className="pr-8 text-2xl text-primary">
                {entity.name}
              </DialogTitle>
              <DialogDescription>{copy.description}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-md border bg-muted/10 p-3">
                <div className="text-xs text-muted-foreground">Registros</div>
                <div className="mt-1 text-xl font-bold">
                  {formatNumber(entity.horse_count)}
                </div>
              </div>
              <div className="rounded-md border bg-muted/10 p-3">
                <div className="text-xs text-muted-foreground">Fêmeas</div>
                <div className="mt-1 text-xl font-bold">
                  {formatNumber(entity.female_count)}
                </div>
              </div>
              <div className="rounded-md border bg-muted/10 p-3">
                <div className="text-xs text-muted-foreground">Recentes</div>
                <div className="mt-1 text-xl font-bold">
                  {formatNumber(entity.recent_horse_count || 0)}
                </div>
              </div>
              <div className="rounded-md border bg-muted/10 p-3">
                <div className="text-xs text-muted-foreground">No CRM</div>
                <div className="mt-1 text-xl font-bold">
                  {formatNumber(entity.crm_contact_count || 0)}
                </div>
              </div>
            </div>

            <div className="rounded-md border bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold text-primary">
                    Base deste card
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Os números refletem apenas registros do Studbook BH que
                    batem com os filtros atuais. Abra os cavalos abaixo para
                    revisar genealogia, registro, criador, proprietário e fonte.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr]">
              <div className="rounded-md border bg-muted/10 p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  Cruzamento com CRM
                </div>
                {(detail?.crmContacts || []).length ? (
                  <div className="space-y-2">
                    {detail?.crmContacts.map((contact) => (
                      <CrmContactPill key={contact.id} contact={contact} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum contato com o mesmo nome ainda. Crie um contato de
                    prospecção e aplique a tag automaticamente.
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-foreground">
                    Registros conectados
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Amostra dos animais ligados a este card
                  </div>
                </div>
                <Badge variant="outline" className="rounded-md">
                  {formatNumber(detail?.horseTotal || 0)} conectados
                </Badge>
              </div>
              <div className="max-h-72 overflow-y-auto rounded-md border">
                {(detail?.horses || []).length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    Nenhum registro conectado encontrado.
                  </div>
                ) : (
                  detail?.horses.map((horse) => (
                    <div
                      key={horse.id}
                      className="grid gap-3 border-b p-3 last:border-b-0 md:grid-cols-[1fr_1fr_0.7fr]"
                    >
                      <div>
                        <div className="font-semibold">{horse.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {registrationLabel(horse)}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>Pai: {horse.sire_name || 'não informado'}</div>
                        <div>Mãe: {horse.dam_name || 'não informada'}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>{ageLabel(horse)}</div>
                        <div>{horse.owner_name || 'Sem proprietário'}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {detailTotalPages > 1 ? (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    Página {detail?.page || 1} de {detailTotalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!detail || detail.page <= 1 || loading}
                      onClick={() =>
                        detail ? onDetailPageChange(detail.page - 1) : null
                      }
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        !detail || detail.page >= detailTotalPages || loading
                      }
                      onClick={() =>
                        detail ? onDetailPageChange(detail.page + 1) : null
                      }
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <DialogFooter className="gap-2 sm:space-x-0">
              <Button
                variant="outline"
                onClick={() => onCreateCrmContact(entity)}
              >
                <UserPlus className="h-4 w-4" />
                Criar/tag CRM
              </Button>
              <Button variant="outline" onClick={() => onApplyFilter(entity)}>
                Filtrar na base
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function HorseDetailDialog({
  horse,
  open,
  onOpenChange,
}: {
  horse: StudbookHorse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        {!horse ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-primary">Registro</DialogTitle>
              <DialogDescription>Selecione um cavalo.</DialogDescription>
            </DialogHeader>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="mb-2 flex flex-wrap gap-2">
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
              <DialogTitle className="text-2xl text-primary">
                {horse.name}
              </DialogTitle>
              <DialogDescription>{registrationLabel(horse)}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-md border bg-muted/10 p-3">
                <div className="text-xs text-muted-foreground">Idade</div>
                <div className="mt-1 font-semibold">{ageLabel(horse)}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(horse.birth_date)}
                </div>
              </div>
              <div className="rounded-md border bg-muted/10 p-3">
                <div className="text-xs text-muted-foreground">Filhos</div>
                <div className="mt-1 font-semibold">
                  {formatNumber(horse.offspring_count || 0)}
                </div>
              </div>
              <div className="rounded-md border bg-muted/10 p-3">
                <div className="text-xs text-muted-foreground">Completude</div>
                <div className="mt-1 font-semibold">
                  {completenessScore(horse.data_quality_score)}%
                </div>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border p-4">
                <div className="font-semibold text-primary">Genealogia</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Pai: {horse.sire_name || 'não informado'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Mãe: {horse.dam_name || 'não informada'}
                </div>
              </div>
              <div className="rounded-md border p-4">
                <div className="font-semibold text-primary">
                  Origem comercial
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Criador: {horse.breeder_name || 'não informado'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Proprietário: {horse.owner_name || 'não informado'}
                </div>
              </div>
            </div>
            {horse.source_url ? (
              <DialogFooter>
                <Button variant="outline" asChild>
                  <a href={horse.source_url} target="_blank" rel="noreferrer">
                    Fonte ABCCH
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </DialogFooter>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function HorseRecordCard({
  horse,
  onOpen,
}: {
  horse: StudbookHorse
  onOpen: (horse: StudbookHorse) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(horse)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen(horse)
        }
      }}
      className="group rounded-md border bg-white p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-semibold text-foreground">
            {horse.name}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {registrationLabel(horse)}
            {horse.microchip ? ` · chip ${horse.microchip}` : ''}
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 rounded-md">
          {ageLabel(horse)}
        </Badge>
      </div>
      <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
        <div>
          <div className="flex items-center gap-1.5 font-medium">
            <GitBranch className="h-3.5 w-3.5 text-primary" />
            {horse.sire_name || 'Pai não informado'}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Matriz: {horse.dam_name || 'não informada'}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          <div>Criador: {horse.breeder_name || 'não informado'}</div>
          <div>Prop.: {horse.owner_name || 'não informado'}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
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
    </div>
  )
}

function HorseTable({
  horses,
  total,
  page,
  pageSize,
  onPageChange,
  onOpenHorse,
}: {
  horses: StudbookHorse[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onOpenHorse: (horse: StudbookHorse) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-2 border-b pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-base text-primary">
            Registros do Studbook
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatNumber(total)} registros encontrados. Exibindo {from}-{to}.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit rounded-md">
          Página {page} de {totalPages}
        </Badge>
      </CardHeader>
      <CardContent className="p-4">
        {horses.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
            Nenhum registro encontrado com os filtros atuais.
          </div>
        ) : (
          <div className="grid gap-3">
            {horses.map((horse) => (
              <HorseRecordCard
                key={horse.id}
                horse={horse}
                onOpen={onOpenHorse}
              />
            ))}
          </div>
        )}
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {formatNumber(horses.length)} itens nesta página
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Studbook() {
  const [overview, setOverview] = useState<StudbookOverview | null>(null)
  const [networkOverview, setNetworkOverview] =
    useState<StudbookNetworkOverview | null>(null)
  const [networkLoading, setNetworkLoading] = useState(true)
  const [networkDialogOpen, setNetworkDialogOpen] = useState(false)
  const [selectedNetworkEntity, setSelectedNetworkEntity] =
    useState<StudbookNetworkEntity | null>(null)
  const [networkDetail, setNetworkDetail] =
    useState<StudbookNetworkDetail | null>(null)
  const [networkDetailLoading, setNetworkDetailLoading] = useState(false)
  const [filterOptions, setFilterOptions] =
    useState<StudbookFilterOptions>(emptyFilterOptions)
  const [horses, setHorses] = useState<StudbookHorse[]>([])
  const [horseTotal, setHorseTotal] = useState(0)
  const [selectedHorse, setSelectedHorse] = useState<StudbookHorse | null>(null)
  const [horseDialogOpen, setHorseDialogOpen] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 50
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<ExportScope | null>(null)
  const [syncingRecent, setSyncingRecent] = useState(false)
  const dataRequestRef = useRef(0)
  const networkRequestRef = useRef(0)
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
  const [recentYears, setRecentYears] = useState('all')
  const [rankMode, setRankMode] = useState<'volume' | 'recent'>('volume')
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
      recentYears: recentYears === 'all' ? undefined : Number(recentYears || 0),
      rankMode,
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
      recentYears,
      rankMode,
      sortBy,
    ],
  )

  const loadData = useCallback(async () => {
    const requestId = dataRequestRef.current + 1
    dataRequestRef.current = requestId
    setLoading(true)
    try {
      const [nextOverview, nextHorses] = await Promise.all([
        studbookService.getOverview(),
        studbookService.getHorses(filters, { page, pageSize }),
      ])
      if (requestId !== dataRequestRef.current) return
      setOverview(nextOverview)
      setHorses(nextHorses.rows)
      setHorseTotal(nextHorses.total)
    } catch (error) {
      if (requestId !== dataRequestRef.current) return
      console.error(error)
      toast({
        title: 'Erro ao carregar Studbook',
        description: 'Não foi possível carregar a base secundária agora.',
        variant: 'destructive',
      })
    } finally {
      if (requestId === dataRequestRef.current) setLoading(false)
    }
  }, [filters, page, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const loadNetwork = useCallback(async () => {
    const requestId = networkRequestRef.current + 1
    networkRequestRef.current = requestId
    setNetworkLoading(true)
    try {
      const nextNetworkOverview =
        await studbookService.getNetworkOverview(filters)
      if (requestId !== networkRequestRef.current) return
      setNetworkOverview(nextNetworkOverview)
    } catch (error) {
      if (requestId !== networkRequestRef.current) return
      console.error(error)
      toast({
        title: 'Erro ao carregar Rede Hípica',
        description: 'Não foi possível calcular os rankings agora.',
        variant: 'destructive',
      })
    } finally {
      if (requestId === networkRequestRef.current) setNetworkLoading(false)
    }
  }, [filters, toast])

  useEffect(() => {
    loadNetwork()
  }, [loadNetwork])

  useEffect(() => {
    setPage(1)
  }, [filters])

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
    (dataQualityMin !== 'all' ? 1 : 0) +
    (recentYears !== 'all' ? 1 : 0) +
    (rankMode !== 'volume' ? 1 : 0)

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
    setRecentYears('all')
    setRankMode('volume')
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
    setRecentYears('5')
    setRankMode('recent')
    setSortBy('age_asc')
  }

  const exportStudbook = async (scope: ExportScope) => {
    setExporting(scope)
    try {
      const rows = await studbookService.exportHorses(
        scope === 'filtered' ? filters : {},
      )
      const today = new Date().toISOString().slice(0, 10)
      downloadCsvFile(
        `studbook-bh-${scope === 'filtered' ? 'filtros' : 'base-completa'}-${today}.csv`,
        buildStudbookCsv(rows),
      )
      toast({
        title: 'Exportação pronta',
        description: `${formatNumber(rows.length)} registros exportados em CSV.`,
        variant: 'success',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível gerar o CSV do Studbook agora.',
        variant: 'destructive',
      })
    } finally {
      setExporting(null)
    }
  }

  const syncRecentChanges = async () => {
    setSyncingRecent(true)
    try {
      const result = await studbookService.syncRecentChanges()
      const changed = Number(result?.insertedOrUpdatedHorses || 0)
      toast({
        title: 'Sync solicitado',
        description: `${formatNumber(changed)} registros recebidos do crawler recente.`,
        variant: 'success',
      })
      await Promise.all([loadData(), loadNetwork()])
    } catch (error) {
      console.error(error)
      toast({
        title: 'Sync ainda não configurado',
        description:
          'O botão está conectado à função sync-studbook-recent. Falta deployar/configurar o crawler para executar a coleta.',
        variant: 'destructive',
      })
    } finally {
      setSyncingRecent(false)
    }
  }

  const openHorse = (horse: StudbookHorse) => {
    setSelectedHorse(horse)
    setHorseDialogOpen(true)
  }

  const openNetworkEntity = async (
    entity: StudbookNetworkEntity,
    detailPage = 1,
  ) => {
    setSelectedNetworkEntity(entity)
    setNetworkDialogOpen(true)
    if (detailPage === 1) setNetworkDetail(null)
    setNetworkDetailLoading(true)
    try {
      const detail = await studbookService.getNetworkDetail(
        entity.entity_kind,
        entity.name,
        filters,
        entity,
        { page: detailPage, pageSize: 12 },
      )
      setNetworkDetail(detail)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao abrir card',
        description: 'Não foi possível carregar os registros conectados.',
        variant: 'destructive',
      })
      setNetworkDialogOpen(false)
    } finally {
      setNetworkDetailLoading(false)
    }
  }

  const changeNetworkDetailPage = async (nextPage: number) => {
    if (!selectedNetworkEntity) return
    await openNetworkEntity(selectedNetworkEntity, nextPage)
  }

  const createOrTagCrmContact = async (entity: StudbookNetworkEntity) => {
    try {
      const { contact, tag } =
        await studbookService.createOrTagCrmContactFromEntity(entity)
      toast({
        title: 'CRM atualizado',
        description: `${contact.name} recebeu a tag ${tag.name}.`,
        variant: 'success',
      })
      const detail = await studbookService.getNetworkDetail(
        entity.entity_kind,
        entity.name,
        filters,
        entity,
        { page: networkDetail?.page || 1, pageSize: 12 },
      )
      setNetworkDetail(detail)
      await loadNetwork()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao atualizar CRM',
        description: 'Não foi possível criar ou taguear este contato agora.',
        variant: 'destructive',
      })
    }
  }

  const applyNetworkFilter = (entity: StudbookNetworkEntity) => {
    setSearch('')
    setSex('all')
    setSelectedBreeders(entity.entity_kind === 'breeder' ? [entity.name] : [])
    setSelectedOwners(entity.entity_kind === 'owner' ? [entity.name] : [])
    setSelectedSires(entity.entity_kind === 'sire' ? [entity.name] : [])
    setSelectedDams(entity.entity_kind === 'dam' ? [entity.name] : [])
    setAgeRange([0, 30])
    setIncludeUnknownAge(true)
    setReproductiveOnly(false)
    setMinOffspring('all')
    setDataQualityMin('all')
    setRecentYears('all')
    setRankMode('volume')
    setSortBy('quality')
    setPage(1)
    setNetworkDialogOpen(false)
    toast({
      title: 'Filtro aplicado',
      description: `${networkKindCopy[entity.entity_kind].label}: ${entity.name}`,
      variant: 'success',
    })
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <NetworkDetailDialog
        open={networkDialogOpen}
        detail={networkDetail}
        loading={networkDetailLoading}
        onOpenChange={setNetworkDialogOpen}
        onApplyFilter={applyNetworkFilter}
        onCreateCrmContact={createOrTagCrmContact}
        onDetailPageChange={changeNetworkDetailPage}
      />
      <HorseDetailDialog
        horse={selectedHorse}
        open={horseDialogOpen}
        onOpenChange={setHorseDialogOpen}
      />

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
            idade, criadores, proprietários e origem dos registros.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => exportStudbook('all')}
            disabled={exporting !== null}
          >
            <Download className="h-4 w-4" />
            {exporting === 'all' ? 'Exportando...' : 'Exportar tudo'}
          </Button>
          <Button
            variant="outline"
            onClick={() => exportStudbook('filtered')}
            disabled={exporting !== null}
          >
            <Download className="h-4 w-4" />
            {exporting === 'filtered' ? 'Exportando...' : 'Exportar filtros'}
          </Button>
          <Button onClick={syncRecentChanges} disabled={syncingRecent}>
            <RefreshCw
              className={`h-4 w-4 ${syncingRecent ? 'animate-spin' : ''}`}
            />
            Sync recentes
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-white p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <div className="font-semibold text-primary">
              Separado por desenho
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Estes dados vivem em tabelas `studbook_*`. Eles não alteram
              contatos, compradores, campanhas ou RFMV.
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
              Pesquisa da base Studbook
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Filtre a base por idade, linhagem, criador, proprietário e
              qualidade dos dados disponíveis.
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
                  <SelectItem value="quality">Maior completude</SelectItem>
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
                  <SelectItem value="all">Qualquer completude</SelectItem>
                  <SelectItem value="50">50%+ preenchido</SelectItem>
                  <SelectItem value="70">70%+ preenchido</SelectItem>
                  <SelectItem value="85">85%+ preenchido</SelectItem>
                </SelectContent>
              </Select>
              <Select value={recentYears} onValueChange={setRecentYears}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer recência</SelectItem>
                  <SelectItem value="1">Ano atual</SelectItem>
                  <SelectItem value="3">Últimos 3 anos</SelectItem>
                  <SelectItem value="5">Últimos 5 anos</SelectItem>
                  <SelectItem value="10">Últimos 10 anos</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={rankMode}
                onValueChange={(value) =>
                  setRankMode(value as 'volume' | 'recent')
                }
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volume">Rankear por volume</SelectItem>
                  <SelectItem value="recent">Rankear por recência</SelectItem>
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

      <Card className="border-primary/15 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base text-primary">
              <Users className="h-4 w-4" />
              Rede Hípica
            </CardTitle>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Rankings recalculados pelos filtros acima. Use para encontrar quem
              está criando, comprando ou influenciando o Studbook agora.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
            <Badge variant="outline" className="justify-center rounded-md">
              {formatNumber(networkOverview?.stats.breeders || 0)} criadores
            </Badge>
            <Badge variant="outline" className="justify-center rounded-md">
              {formatNumber(networkOverview?.stats.owners || 0)} proprietários
            </Badge>
            <Badge variant="outline" className="justify-center rounded-md">
              {formatNumber(networkOverview?.stats.sires || 0)} garanhões
            </Badge>
            <Badge variant="outline" className="justify-center rounded-md">
              {formatNumber(networkOverview?.stats.dams || 0)} matrizes
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border bg-muted/10 p-3">
              <div className="text-xs text-muted-foreground">Base filtrada</div>
              <div className="mt-1 text-xl font-bold">
                {formatNumber(horseTotal)}
              </div>
            </div>
            <div className="rounded-md border bg-muted/10 p-3">
              <div className="text-xs text-muted-foreground">
                Recência usada
              </div>
              <div className="mt-1 text-xl font-bold">
                {recentYears === 'all' ? 'Todas' : `${recentYears} anos`}
              </div>
            </div>
            <div className="rounded-md border bg-muted/10 p-3">
              <div className="text-xs text-muted-foreground">
                Ordenação da rede
              </div>
              <div className="mt-1 text-xl font-bold">
                {rankMode === 'recent' ? 'Recência' : 'Volume'}
              </div>
            </div>
          </div>
          {networkLoading ? (
            <div className="flex min-h-48 items-center justify-center rounded-md border bg-muted/10">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              <NetworkPanel
                kind="breeder"
                entities={networkOverview?.breeders || []}
                total={networkOverview?.stats.breeders || 0}
                onOpen={openNetworkEntity}
              />
              <NetworkPanel
                kind="owner"
                entities={networkOverview?.owners || []}
                total={networkOverview?.stats.owners || 0}
                onOpen={openNetworkEntity}
              />
              <NetworkPanel
                kind="sire"
                entities={networkOverview?.sires || []}
                total={networkOverview?.stats.sires || 0}
                onOpen={openNetworkEntity}
              />
              <NetworkPanel
                kind="dam"
                entities={networkOverview?.dams || []}
                total={networkOverview?.stats.dams || 0}
                onOpen={openNetworkEntity}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        {loading ? (
          <div className="flex min-h-72 items-center justify-center rounded-md border bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <HorseTable
            horses={horses}
            total={horseTotal}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onOpenHorse={openHorse}
          />
        )}
      </div>
    </div>
  )
}
