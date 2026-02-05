import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Users,
  TrendingUp,
  Trophy,
  ArrowUp,
  ArrowDown,
  DollarSign,
  PieChart as PieChartIcon,
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
} from 'recharts'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { contactsService, type SegmentStats } from '@/services/contacts'

const chartData = [
  { month: 'Janeiro', vendas: 120000, leads: 45 },
  { month: 'Fevereiro', vendas: 180000, leads: 52 },
  { month: 'Março', vendas: 150000, leads: 48 },
  { month: 'Abril', vendas: 240000, leads: 61 },
  { month: 'Maio', vendas: 320000, leads: 75 },
  { month: 'Junho', vendas: 450000, leads: 90 },
]

const chartConfig = {
  vendas: {
    label: 'Vendas (R$)',
    color: 'hsl(var(--primary))',
  },
  leads: {
    label: 'Novos Leads',
    color: 'hsl(var(--secondary))',
  },
}

const segmentColors: Record<string, string> = {
  VIP: '#EAB308', // Yellow-500
  Frequentes: '#2563EB', // Blue-600
  Ativos: '#16A34A', // Green-600
  Inativos: '#6B7280', // Gray-500
  'Novos Leads': '#9333EA', // Purple-600
  'Sem Segmento': '#E5E7EB', // Gray-200
}

const recentContacts = [
  {
    id: 1,
    name: 'Roberto Almeida',
    role: 'Criador',
    date: 'Hoje, 10:30',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=10',
  },
  {
    id: 2,
    name: 'Fernanda Lima',
    role: 'Comprador',
    date: 'Ontem, 16:45',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=12',
  },
  {
    id: 3,
    name: 'Carlos Venturini',
    role: 'Veterinário',
    date: '02 Fev, 09:15',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=15',
  },
  {
    id: 4,
    name: 'Haras Pôr do Sol',
    role: 'Parceiro',
    date: '01 Fev, 14:20',
    avatar: null,
  },
  {
    id: 5,
    name: 'Juliana Paes',
    role: 'Investidora',
    date: '30 Jan, 11:00',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=22',
  },
]

export default function Index() {
  const [segmentStats, setSegmentStats] = useState<SegmentStats[]>([])

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  useEffect(() => {
    contactsService
      .getSegmentationStats()
      .then(setSegmentStats)
      .catch((err) => console.error('Failed to load segmentation stats', err))
  }, [])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-display text-primary">
          Bem-vindo ao CRM Milan Horses
        </h1>
        <p className="text-muted-foreground capitalize">{currentDate}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-subtle hover:-translate-y-1 hover:shadow-elevation transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Contatos
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">1,248</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <span className="text-green-600 flex items-center mr-1">
                <ArrowUp className="h-3 w-3 mr-0.5" /> +12%
              </span>{' '}
              mês passado
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary shadow-subtle hover:-translate-y-1 hover:shadow-elevation transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cavalos Vendidos
            </CardTitle>
            <Trophy className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">24</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <span className="text-green-600 flex items-center mr-1">
                <ArrowUp className="h-3 w-3 mr-0.5" /> +4
              </span>{' '}
              mês passado
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary shadow-subtle hover:-translate-y-1 hover:shadow-elevation transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento (Mês)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">R$ 450k</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <span className="text-green-600 flex items-center mr-1">
                <ArrowUp className="h-3 w-3 mr-0.5" /> +18.2%
              </span>{' '}
              mês passado
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary shadow-subtle hover:-translate-y-1 hover:shadow-elevation transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">4.5%</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <span className="text-red-500 flex items-center mr-1">
                <ArrowDown className="h-3 w-3 mr-0.5" /> -0.5%
              </span>{' '}
              mês passado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Segmentation */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Chart Area */}
        <Card className="col-span-7 lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-display text-primary">
              Desempenho de Vendas
            </CardTitle>
            <CardDescription>
              Resumo de vendas e novos leads no primeiro semestre.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-vendas)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-vendas)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-leads)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-leads)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  className="stroke-muted"
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs text-muted-foreground"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="text-xs text-muted-foreground"
                  tickFormatter={(value) => `R$${value / 1000}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="vendas"
                  stroke="var(--color-vendas)"
                  fillOpacity={1}
                  fill="url(#fillVendas)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Segmentation Chart */}
        <Card className="col-span-7 lg:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-display text-primary flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Distribuição por Segmento
            </CardTitle>
            <CardDescription>
              Classificação automática da base de contatos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {segmentStats.length > 0 ? (
              <ChartContainer
                config={Object.keys(segmentColors).reduce((acc, key) => {
                  acc[key] = { label: key, color: segmentColors[key] }
                  return acc
                }, {} as any)}
                className="h-[300px] w-full mx-auto"
              >
                <PieChart>
                  <Pie
                    data={segmentStats}
                    dataKey="count"
                    nameKey="segment"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {segmentStats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          segmentColors[entry.segment] ||
                          segmentColors['Sem Segmento']
                        }
                        strokeWidth={0}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent hideLabel />}
                    formatter={(value, name, item) => (
                      <div className="flex gap-2 min-w-[150px]">
                        <span className="font-medium">
                          {item.payload.segment}:
                        </span>
                        <span className="ml-auto">
                          {value} ({item.payload.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    )}
                  />
                  <ChartLegend
                    content={<ChartLegendContent />}
                    className="flex-wrap gap-2 text-[10px]"
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Carregando dados...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Contacts */}
        <Card className="col-span-7 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-display text-primary">
              Contatos Recentes
            </CardTitle>
            <CardDescription>
              Últimos contatos adicionados à plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10 border border-muted transition-transform group-hover:scale-105">
                      <AvatarImage src={contact.avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {contact.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                        {contact.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {contact.role}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {contact.date}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t text-center">
              <a
                href="/contatos"
                className="text-sm font-medium text-primary hover:underline hover:text-primary/80"
              >
                Ver todos os contatos
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
