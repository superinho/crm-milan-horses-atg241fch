import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Target } from 'lucide-react'

interface GoalCardProps {
  current: number
  target: number
  percentage: number
}

export function GoalCard({ current, target, percentage }: GoalCardProps) {
  return (
    <Card className="shadow-sm border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Meta Mensal
          </CardTitle>
          <span className="text-2xl font-bold font-display">
            {percentage.toFixed(0)}%
          </span>
        </div>
        <CardDescription>Progresso de vendas deste mês</CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={percentage} className="h-3 w-full" />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              maximumFractionDigits: 0,
            }).format(current)}
          </span>
          <span>
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              maximumFractionDigits: 0,
            }).format(target)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
