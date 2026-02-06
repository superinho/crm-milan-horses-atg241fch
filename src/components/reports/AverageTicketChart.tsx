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
  ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ReportData } from '@/services/reports'

interface AverageTicketChartProps {
  data: ReportData['salesByMonth']
}

const chartConfig: ChartConfig = {
  average: {
    label: 'Ticket Médio (R$)',
    color: 'hsl(var(--secondary))',
  },
}

export function AverageTicketChart({ data }: AverageTicketChartProps) {
  return (
    <Card className="col-span-1 shadow-sm">
      <CardHeader>
        <CardTitle>Ticket Médio Mensal</CardTitle>
        <CardDescription>Variação do valor médio por venda.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              className="stroke-muted/50"
            />
            <XAxis
              dataKey="name"
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
            <Bar
              dataKey="average"
              fill="var(--color-average)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
