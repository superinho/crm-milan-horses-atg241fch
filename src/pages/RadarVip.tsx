import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Copy,
  Crown,
  Gem,
  Loader2,
  Mail,
  Megaphone,
  MessageCircle,
  Phone,
  Radar,
  RefreshCw,
  Sparkles,
  Target,
  Flame,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { ContactProfileSheet } from '@/components/contacts/ContactProfileSheet'
import {
  vipRadarService,
  type VipRadarData,
  type VipRadarRecommendation,
  type VipRadarSegment,
} from '@/services/vip-radar'
import { campaignsService } from '@/services/campaigns'
import { cn } from '@/lib/utils'
import { telUrl, whatsappUrl } from '@/lib/phone'

const SEGMENTS: Array<{ value: VipRadarSegment | 'Todos'; label: string }> = [
  { value: 'Todos', label: 'Todos' },
  { value: 'Comprador quente', label: 'Compradores quentes' },
  { value: 'VIP ativo', label: 'VIP ativo' },
  { value: 'Underbidder premium', label: 'Underbidders' },
  { value: 'Bidder fantasma', label: 'Bidders fantasma' },
  { value: 'Reativação VIP', label: 'Reativação VIP' },
  { value: 'Comprador compatível', label: 'Compatíveis' },
]

const ACTION_STORAGE_KEY = 'milan-vip-radar-actions'

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const date = (value?: string | null) =>
  value ? value.slice(0, 10).split('-').reverse().join('/') : '-'

const segmentClassName = (segment: VipRadarSegment) => {
  if (segment === 'VIP ativo')
    return 'bg-amber-100 text-amber-900 border-amber-200'
  if (segment === 'Underbidder premium')
    return 'bg-blue-100 text-blue-900 border-blue-200'
  if (segment === 'Comprador quente')
    return 'bg-orange-100 text-orange-900 border-orange-200'
  if (segment === 'Bidder fantasma')
    return 'bg-slate-100 text-slate-900 border-slate-200'
  if (segment === 'Reativação VIP')
    return 'bg-rose-100 text-rose-900 border-rose-200'
  return 'bg-slate-100 text-slate-800 border-slate-200'
}

type ActionState = Record<string, 'pending' | 'contacted' | 'ignored'>

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: React.ElementType
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-semibold text-primary">
            {value}
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardContent>
    </Card>
  )
}

function RecommendationRow({
  item,
  action,
  onOpenContact,
  onSetAction,
  onCopyMessage,
}: {
  item: VipRadarRecommendation
  action: ActionState[string] | undefined
  onOpenContact: (id: string) => void
  onSetAction: (id: string, action: ActionState[string]) => void
  onCopyMessage: (message: string) => void
}) {
  const preferredPhone = item.whatsapp || item.phone
  const whatsappHref = whatsappUrl(preferredPhone, item.suggestedMessage)
  const phoneHref = telUrl(preferredPhone)
  const mailUrl = item.email
    ? `mailto:${item.email}?subject=${encodeURIComponent('Curadoria Milan Horses')}&body=${encodeURIComponent(item.suggestedMessage)}`
    : ''

  return (
    <TableRow className={cn(action === 'ignored' && 'opacity-50')}>
      <TableCell className="min-w-[260px]">
        <button
          type="button"
          className="text-left font-semibold text-foreground hover:text-primary"
          onClick={() => onOpenContact(item.contactId)}
        >
          {item.name}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            {[item.city, item.state].filter(Boolean).join(', ') || 'Sem praça'}
          </span>
          <span>Última: {date(item.lastActivityDate)}</span>
        </div>
      </TableCell>

      <TableCell>
        <Badge
          className={cn('border font-medium', segmentClassName(item.segment))}
        >
          {item.segment}
        </Badge>
      </TableCell>

      <TableCell className="min-w-[140px]">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">{item.score}</span>
          <Progress value={item.score} className="h-2 w-20" />
        </div>
      </TableCell>

      <TableCell className="min-w-[210px]">
        <div className="font-medium">{money(item.monetaryValue)}</div>
        <div className="text-xs text-muted-foreground">
          {item.purchaseCount} compras · {item.bidCount} lances
        </div>
        {item.segment === 'Comprador quente' ? (
          <div className="mt-1 text-xs font-medium text-orange-700">
            Heat {item.heatScore} · streak {item.streakCount}
          </div>
        ) : null}
        {item.segment === 'Bidder fantasma' ? (
          <div className="mt-1 text-xs font-medium text-slate-700">
            Ghost {item.ghostScore} · validar intenção
          </div>
        ) : null}
      </TableCell>

      <TableCell className="min-w-[320px]">
        <div className="space-y-1">
          {item.reasons.map((reason) => (
            <div key={reason} className="flex items-start gap-2 text-xs">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              <span className="text-muted-foreground">{reason}</span>
            </div>
          ))}
        </div>
      </TableCell>

      <TableCell className="min-w-[220px]">
        <div className="flex items-center gap-1">
          {whatsappHref ? (
            <Button
              variant="ghost"
              size="icon"
              asChild
              title="Chamar no WhatsApp"
            >
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" />
              </a>
            </Button>
          ) : null}
          {mailUrl ? (
            <Button variant="ghost" size="icon" asChild title="Enviar e-mail">
              <a href={mailUrl}>
                <Mail className="h-4 w-4" />
              </a>
            </Button>
          ) : null}
          {phoneHref ? (
            <Button variant="ghost" size="icon" asChild title="Ligar">
              <a href={phoneHref}>
                <Phone className="h-4 w-4" />
              </a>
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            title="Copiar mensagem"
            onClick={() => onCopyMessage(item.suggestedMessage)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-1 flex gap-1">
          <Button
            variant={action === 'contacted' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSetAction(item.contactId, 'contacted')}
          >
            Avisado
          </Button>
          <Button
            variant={action === 'ignored' ? 'destructive' : 'ghost'}
            size="sm"
            onClick={() => onSetAction(item.contactId, 'ignored')}
          >
            Ignorar
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function RadarVip() {
  const navigate = useNavigate()
  const [data, setData] = useState<VipRadarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [creatingCampaign, setCreatingCampaign] = useState<
    'email' | 'whatsapp' | 'multi' | null
  >(null)
  const [selectedAuctionId, setSelectedAuctionId] = useState('')
  const [selectedSegment, setSelectedSegment] = useState<
    VipRadarSegment | 'Todos'
  >('Todos')
  const [actions, setActions] = useState<ActionState>(() => {
    try {
      return JSON.parse(localStorage.getItem(ACTION_STORAGE_KEY) || '{}')
    } catch {
      return {}
    }
  })
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null,
  )
  const [profileOpen, setProfileOpen] = useState(false)
  const { toast } = useToast()

  const loadRadar = async (auctionId = selectedAuctionId) => {
    setLoading(true)
    try {
      const result = await vipRadarService.getRadarData(auctionId)
      setData(result)
      setSelectedAuctionId(result.selectedAuction?.id || '')
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro no Radar VIP',
        description:
          error?.message ||
          'Não foi possível calcular os segmentos de alto potencial.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRadar()
  }, [])

  useEffect(() => {
    localStorage.setItem(ACTION_STORAGE_KEY, JSON.stringify(actions))
  }, [actions])

  const filteredRecommendations = useMemo(() => {
    const rows = data?.recommendations || []
    if (selectedSegment === 'Todos') return rows
    return rows.filter((item) => item.segment === selectedSegment)
  }, [data, selectedSegment])

  const contactedCount = filteredRecommendations.filter(
    (item) => actions[item.contactId] === 'contacted',
  ).length

  const setAction = (contactId: string, action: ActionState[string]) => {
    setActions((current) => ({ ...current, [contactId]: action }))
  }

  const copyMessage = async (message: string) => {
    await navigator.clipboard.writeText(message)
    toast({ title: 'Mensagem copiada', variant: 'success' })
  }

  const openContact = (contactId: string) => {
    setSelectedContactId(contactId)
    setProfileOpen(true)
  }

  const createCampaign = async (channels: Array<'email' | 'whatsapp'>) => {
    if (!data?.selectedAuction) {
      toast({
        title: 'Selecione um leilão real',
        description:
          'O Radar precisa de um leilão aberto para criar a campanha.',
        variant: 'destructive',
      })
      return
    }

    if (!filteredRecommendations.length) {
      toast({
        title: 'Sem destinatários',
        description: 'A lista filtrada não possui clientes para campanha.',
        variant: 'destructive',
      })
      return
    }

    const mode =
      channels.length > 1
        ? 'multi'
        : channels[0] === 'email'
          ? 'email'
          : 'whatsapp'
    setCreatingCampaign(mode)

    try {
      const campaign = await campaignsService.createVipRadarCampaign({
        auction: data.selectedAuction,
        recommendations: filteredRecommendations,
        channels,
        segment: selectedSegment,
      })

      toast({
        title: 'Campanha criada',
        description:
          'Revise e processe os envios na tela da campanha antes do disparo.',
        variant: 'success',
      })
      navigate(`/campanhas/${campaign.id}`)
    } catch (error: any) {
      toast({
        title: 'Erro ao criar campanha',
        description:
          error?.message ||
          'Não foi possível transformar o Radar VIP em campanha.',
        variant: 'destructive',
      })
    } finally {
      setCreatingCampaign(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-primary/10 px-2 py-1 text-sm font-medium text-primary">
            <Radar className="h-4 w-4" />
            Copilot comercial
          </div>
          <h1 className="text-3xl font-bold font-display text-primary">
            Radar VIP
          </h1>
          <p className="max-w-3xl text-muted-foreground">
            Recomenda clientes com maior propensão para cada leilão, priorizando
            convite pessoal, timing e histórico real de compras e lances.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={selectedAuctionId}
            onValueChange={(value) => {
              setSelectedAuctionId(value)
              loadRadar(value)
            }}
          >
            <SelectTrigger className="w-full sm:w-[340px]">
              <SelectValue placeholder="Selecione um leilão" />
            </SelectTrigger>
            <SelectContent>
              {(data?.auctions || []).map((auction) => (
                <SelectItem key={auction.id} value={auction.id}>
                  {auction.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => loadRadar()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Recalcular
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex h-72 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : data ? (
        <>
          <Card className="border-t-4 border-t-primary">
            <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.2fr_2fr]">
              <div>
                <div className="text-sm text-muted-foreground">Leilão alvo</div>
                <div className="mt-1 text-xl font-semibold text-primary">
                  {data.selectedAuction?.title || 'Nenhum leilão selecionado'}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    {date(data.selectedAuction?.eventDate)}
                  </span>
                  <span>{data.selectedAuction?.lotCount || 0} lotes</span>
                  <span>
                    Ticket alvo {money(data.selectedAuction?.avgLotValue || 0)}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Recomendados"
                  value={data.summary.total}
                  icon={Users}
                />
                <StatCard
                  label="Prontos p/ WhatsApp"
                  value={data.summary.whatsappReady}
                  icon={MessageCircle}
                />
                <StatCard
                  label="Score médio"
                  value={data.summary.avgScore}
                  icon={Target}
                />
                <StatCard
                  label="Avisados"
                  value={contactedCount}
                  icon={UserCheck}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card
              className={cn(
                'cursor-pointer transition-colors hover:border-primary/50 hover:bg-slate-50/50',
                selectedSegment === 'VIP ativo' &&
                  'border-primary ring-1 ring-primary',
              )}
              onClick={() => setSelectedSegment('VIP ativo')}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Crown className="h-4 w-4 text-amber-700" />
                  VIP ativo
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {data.summary.bySegment['VIP ativo']}
              </CardContent>
            </Card>
            <Card
              className={cn(
                'cursor-pointer transition-colors hover:border-primary/50 hover:bg-slate-50/50',
                selectedSegment === 'Comprador quente' &&
                  'border-primary ring-1 ring-primary',
              )}
              onClick={() => setSelectedSegment('Comprador quente')}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Flame className="h-4 w-4 text-orange-700" />
                  Compradores quentes
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {data.summary.bySegment['Comprador quente']}
              </CardContent>
            </Card>
            <Card
              className={cn(
                'cursor-pointer transition-colors hover:border-primary/50 hover:bg-slate-50/50',
                selectedSegment === 'Underbidder premium' &&
                  'border-primary ring-1 ring-primary',
              )}
              onClick={() => setSelectedSegment('Underbidder premium')}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gem className="h-4 w-4 text-blue-700" />
                  Underbidders
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {data.summary.bySegment['Underbidder premium']}
              </CardContent>
            </Card>
            <Card
              className={cn(
                'cursor-pointer transition-colors hover:border-primary/50 hover:bg-slate-50/50',
                selectedSegment === 'Bidder fantasma' &&
                  'border-primary ring-1 ring-primary',
              )}
              onClick={() => setSelectedSegment('Bidder fantasma')}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldAlert className="h-4 w-4 text-slate-700" />
                  Bidders fantasma
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {data.summary.bySegment['Bidder fantasma']}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Lista de convite prioritário</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Use esta lista como fila de atendimento consultivo antes do
                    disparo em massa.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => createCampaign(['email'])}
                    disabled={Boolean(creatingCampaign)}
                  >
                    {creatingCampaign === 'email' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    Campanha e-mail
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => createCampaign(['whatsapp'])}
                    disabled={Boolean(creatingCampaign)}
                  >
                    {creatingCampaign === 'whatsapp' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <MessageCircle className="mr-2 h-4 w-4" />
                    )}
                    Campanha WhatsApp
                  </Button>
                  <Button
                    onClick={() => createCampaign(['email', 'whatsapp'])}
                    disabled={Boolean(creatingCampaign)}
                  >
                    {creatingCampaign === 'multi' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Megaphone className="mr-2 h-4 w-4" />
                    )}
                    Multicanal
                  </Button>
                </div>
              </div>

              <Tabs
                value={selectedSegment}
                onValueChange={(value) =>
                  setSelectedSegment(value as VipRadarSegment | 'Todos')
                }
              >
                <TabsList className="flex h-auto flex-wrap justify-start">
                  {SEGMENTS.map((segment) => (
                    <TabsTrigger key={segment.value} value={segment.value}>
                      {segment.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value={selectedSegment} className="mt-4">
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Segmento</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Histórico</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecommendations.length ? (
                          filteredRecommendations.map((item) => (
                            <RecommendationRow
                              key={item.contactId}
                              item={item}
                              action={actions[item.contactId]}
                              onOpenContact={openContact}
                              onSetAction={setAction}
                              onCopyMessage={copyMessage}
                            />
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center">
                              Nenhum cliente encontrado para este segmento.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </>
      ) : null}

      <ContactProfileSheet
        contactId={selectedContactId}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </div>
  )
}
