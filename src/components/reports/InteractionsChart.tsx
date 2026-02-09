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
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import { ActivityReportData } from '@/services/reports'

interface InteractionsChartProps {
  data: ActivityReportData['interactionsOverTime']
}

const chartConfig: ChartConfig = {
  email: {
    label: 'E-mail',
    color: 'hsl(var(--chart-1))',
  },
  whatsapp: {
    label: 'WhatsApp',
    color: 'hsl(var(--chart-2))',
  },
  phone: {
    label: 'Ligação',
    color: 'hsl(var(--chart-3))',
  },
  note: {
    label: 'Nota',
    color: 'hsl(var(--chart-4))',
  },
}

export function InteractionsChart({ data }: InteractionsChartProps) {
  return (
    <Card className="col-span-1 lg:col-span-2 shadow-sm">
      <CardHeader>
        <CardTitle>Visão Geral de Interações</CardTitle>
        <CardDescription>
          Volume diário de interações por canal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            className="w-full"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              className="text-xs text-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              className="text-xs text-muted-foreground"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="email"
              stackId="a"
              fill="var(--color-email)"
              radius={[0, 0, 4, 4]}
            />
            <Bar dataKey="whatsapp" stackId="a" fill="var(--color-whatsapp)" />
            <Bar dataKey="phone" stackId="a" fill="var(--color-phone)" />
            <Bar
              dataKey="note"
              stackId="a"
              fill="var(--color-note)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
