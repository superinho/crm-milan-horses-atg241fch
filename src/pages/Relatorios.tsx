import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
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
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
} from 'recharts'

const revenueData = [
  { month: 'Jan', receita: 120000, despesa: 45000 },
  { month: 'Fev', receita: 180000, despesa: 55000 },
  { month: 'Mar', receita: 150000, despesa: 48000 },
  { month: 'Abr', receita: 240000, despesa: 70000 },
  { month: 'Mai', receita: 320000, despesa: 90000 },
  { month: 'Jun', receita: 450000, despesa: 110000 },
]

const sourceData = [
  { name: 'Instagram', value: 400, color: 'hsl(var(--chart-1))' },
  { name: 'Indicação', value: 300, color: 'hsl(var(--chart-2))' },
  { name: 'Google Ads', value: 200, color: 'hsl(var(--chart-3))' },
  { name: 'Eventos', value: 150, color: 'hsl(var(--chart-4))' },
]

const chartConfig = {
  receita: { label: 'Receita', color: 'hsl(var(--primary))' },
  despesa: { label: 'Despesa', color: 'hsl(var(--destructive))' },
  instagram: { label: 'Instagram', color: 'hsl(var(--chart-1))' },
  indicacao: { label: 'Indicação', color: 'hsl(var(--chart-2))' },
  google: { label: 'Google Ads', color: 'hsl(var(--chart-3))' },
  eventos: { label: 'Eventos', color: 'hsl(var(--chart-4))' },
}

export default function Relatorios() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-display text-primary">
          Relatórios e Análises
        </h1>
        <p className="text-muted-foreground">
          Visão detalhada do desempenho do seu negócio.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-primary">
              Receita vs Despesas
            </CardTitle>
            <CardDescription>
              Comparativo financeiro mensal do último semestre.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={revenueData}>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  className="stroke-muted"
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  tickFormatter={(val) => `R$${val / 1000}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="receita"
                  fill="var(--color-receita)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="despesa"
                  fill="var(--color-despesa)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-primary">
              Origem dos Leads
            </CardTitle>
            <CardDescription>
              Principais canais de aquisição de clientes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="h-[300px] w-full mx-auto"
            >
              <PieChart>
                <Pie
                  data={sourceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {sourceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
