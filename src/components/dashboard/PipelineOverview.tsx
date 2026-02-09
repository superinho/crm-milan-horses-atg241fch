import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Briefcase } from 'lucide-react'

interface PipelineOverviewProps {
  data: {
    stage: string
    count: number
    value: number
  }[]
}

const STAGE_COLORS: Record<string, string> = {
  Lead: 'bg-gray-200 text-gray-700',
  Qualificado: 'bg-blue-100 text-blue-700',
  Interesse: 'bg-yellow-100 text-yellow-700',
  Proposta: 'bg-orange-100 text-orange-700',
  Fechado: 'bg-green-100 text-green-700',
}

export function PipelineOverview({ data }: PipelineOverviewProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Pipeline de Vendas
        </CardTitle>
        <CardDescription>Resumo de oportunidades por estágio.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => (
            <div
              key={item.stage}
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium min-w-[80px] text-center ${STAGE_COLORS[item.stage] || 'bg-gray-100'}`}
                >
                  {item.stage}
                </span>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.count} {item.count === 1 ? 'negócio' : 'negócios'}
                </span>
              </div>
              <span className="text-sm font-semibold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  maximumFractionDigits: 0,
                }).format(item.value)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
