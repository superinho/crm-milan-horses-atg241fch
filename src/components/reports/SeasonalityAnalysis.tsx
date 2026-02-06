import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Calendar, AlertCircle } from 'lucide-react'
import { ReportData } from '@/services/reports'

interface SeasonalityAnalysisProps {
  data: ReportData['seasonality']
}

export function SeasonalityAnalysis({ data }: SeasonalityAnalysisProps) {
  return (
    <Card className="bg-primary/5 border-primary/20 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary text-lg">
          <TrendingUp className="h-5 w-5" />
          Análise de Sazonalidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground/80 leading-relaxed">
          {data.analysis}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg border shadow-sm">
            <div className="p-2 bg-green-100 text-green-700 rounded-full shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-muted-foreground truncate">
                Melhor Mês
              </p>
              <p className="font-bold text-lg text-green-700 truncate">
                {data.peakMonth}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-background rounded-lg border shadow-sm">
            <div className="p-2 bg-red-100 text-red-700 rounded-full shrink-0">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-muted-foreground truncate">
                Menor Desempenho
              </p>
              <p className="font-bold text-lg text-red-700 truncate">
                {data.lowMonth}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
