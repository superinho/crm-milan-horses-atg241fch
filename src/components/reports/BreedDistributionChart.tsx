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
  ChartConfig,
} from '@/components/ui/chart'
import { Pie, PieChart, Cell } from 'recharts'
import { ReportData } from '@/services/reports'

interface BreedDistributionChartProps {
  data: ReportData['salesByBreed']
}

// Fixed colors for top breeds
const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export function BreedDistributionChart({ data }: BreedDistributionChartProps) {
  const chartConfig: ChartConfig = data.reduce((acc, curr, index) => {
    acc[curr.name] = {
      label: curr.name,
      color: COLORS[index % COLORS.length],
    }
    return acc
  }, {} as ChartConfig)

  return (
    <Card className="col-span-1 shadow-sm h-full">
      <CardHeader>
        <CardTitle>Vendas por Raça</CardTitle>
        <CardDescription>
          Distribuição do volume de vendas por raça.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="h-[300px] w-full mx-auto"
          >
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    strokeWidth={0}
                  />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend
                content={<ChartLegendContent />}
                className="flex-wrap gap-2 text-xs"
              />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
            Sem dados de raça disponíveis.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
