import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Mail,
  MessageSquare,
  Users,
  CheckCircle2,
  MousePointerClick,
  Eye,
  Send,
  Loader2,
  RefreshCcw,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { campaignsService, Campaign } from '@/services/campaigns'
import { WhatsAppSender } from '@/components/campaigns/WhatsAppSender'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function CampaignDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchCampaign = async () => {
    if (!id) return
    try {
      const data = await campaignsService.getCampaignById(id)
      setCampaign(data)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a campanha.',
        variant: 'destructive',
      })
      navigate('/campanhas')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchCampaign()
  }, [id])

  const handleManualProcessing = async () => {
    try {
      setRefreshing(true)
      await campaignsService.triggerProcessing()
      toast({
        title: 'Processamento iniciado',
        description: 'Verificando cronograma e gerando envios...',
      })
      setTimeout(fetchCampaign, 2000) // Delay to allow DB update
    } catch (error) {
      setRefreshing(false)
      toast({
        title: 'Erro',
        description: 'Falha ao processar campanha.',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!campaign) return null

  const stats = campaign.stats || {
    total_sends: 0,
    emails_sent: 0,
    emails_opened: 0,
    emails_clicked: 0,
    whatsapp_sent: 0,
    whatsapp_pending: 0,
    open_rate: 0,
    click_rate: 0,
  }

  const chartData = [
    { name: 'Enviados', value: stats.emails_sent, fill: 'hsl(var(--primary))' },
    {
      name: 'Abertos',
      value: stats.emails_opened,
      fill: 'hsl(var(--blue-500))',
    },
    {
      name: 'Clicados',
      value: stats.emails_clicked,
      fill: 'hsl(var(--green-500))',
    },
  ]

  const chartConfig = {
    value: {
      label: 'Quantidade',
      color: 'hsl(var(--primary))',
    },
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/campanhas')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-display text-primary flex items-center gap-3">
              {campaign.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{campaign.status}</Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(campaign.start_date), "d 'de' MMM", {
                  locale: ptBR,
                })}{' '}
                -{' '}
                {format(new Date(campaign.end_date), "d 'de' MMM, yyyy", {
                  locale: ptBR,
                })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleManualProcessing}
            disabled={refreshing}
          >
            <RefreshCcw
              className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Atualizar / Processar
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Envios
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.total_sends}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Email + WhatsApp
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Abertura (Email)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold flex items-center gap-2">
              {stats.open_rate.toFixed(1)}%
              <Eye className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.emails_opened} aberturas únicas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Cliques (Email)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold flex items-center gap-2">
              {stats.click_rate.toFixed(1)}%
              <MousePointerClick className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.emails_clicked} cliques únicos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold flex items-center gap-2">
              {stats.whatsapp_sent}
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.whatsapp_pending} pendentes de envio
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger
            value="whatsapp"
            disabled={!campaign.channels.includes('whatsapp')}
          >
            Envio WhatsApp{' '}
            {stats.whatsapp_pending > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1">
                {stats.whatsapp_pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="schedules">Cronograma</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engajamento de Email</CardTitle>
                <CardDescription>
                  Funil de interação da campanha
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[300px] w-full"
                >
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis
                      dataKey="name"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações de Público</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Segmentos Alvo
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {campaign.audience_filters.segments.length > 0 ? (
                      campaign.audience_filters.segments.map((seg) => (
                        <Badge key={seg} variant="secondary">
                          {seg}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Todos os segmentos
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Tags Filtradas
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {campaign.audience_filters.tags.length > 0 ? (
                      campaign.audience_filters.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Nenhuma tag específica
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsAppSender campaignId={campaign.id} onRefresh={fetchCampaign} />
        </TabsContent>

        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma de Envios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaign.schedules?.map((schedule, idx) => (
                  <div
                    key={schedule.id || idx}
                    className="flex items-center p-4 border rounded-lg bg-card"
                  >
                    <div
                      className={`p-2 rounded-full mr-4 ${schedule.channel_type === 'email' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}
                    >
                      {schedule.channel_type === 'email' ? (
                        <Mail className="h-5 w-5" />
                      ) : (
                        <MessageSquare className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {format(
                          new Date(schedule.scheduled_at),
                          "dd 'de' MMMM 'às' HH:mm",
                          { locale: ptBR },
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-md">
                        {schedule.content}
                      </p>
                    </div>
                    <div>
                      <Badge
                        variant={
                          schedule.status === 'Processado'
                            ? 'default'
                            : 'outline'
                        }
                      >
                        {schedule.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
