import { differenceInDays } from 'date-fns'
import { Deal } from '@/services/deals'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DealCardProps {
  deal: Deal
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void
}

export function DealCard({ deal, isDragging, onDragStart }: DealCardProps) {
  const daysInStage = differenceInDays(new Date(), new Date(deal.updated_at))

  return (
    <Card
      className={cn(
        'cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 border-l-4',
        isDragging ? 'opacity-50' : 'opacity-100',
        deal.stage === 'Fechado' ? 'border-l-green-500' : 'border-l-primary',
      )}
      draggable
      onDragStart={onDragStart}
    >
      <CardContent className="p-3 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-semibold text-sm line-clamp-2 text-primary leading-tight">
            {deal.title}
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {deal.contact ? (
            <>
              <Avatar className="h-5 w-5 border border-muted">
                <AvatarImage
                  src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${deal.contact.id}`}
                />
                <AvatarFallback className="text-[9px]">
                  {deal.contact.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                {deal.contact.name}
              </span>
            </>
          ) : (
            <>
              <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground italic">
                Sem contato
              </span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-dashed">
          <Badge variant="secondary" className="font-bold text-sm px-2">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              maximumFractionDigits: 0,
            }).format(deal.value)}
          </Badge>

          <div
            className="flex items-center gap-1 text-[10px] text-muted-foreground"
            title={`${daysInStage} dias neste estágio`}
          >
            <Clock className="h-3 w-3" />
            <span>{daysInStage}d</span>
          </div>
        </div>

        {deal.probability > 0 && deal.stage !== 'Fechado' && (
          <div
            className="w-full bg-gray-100 h-1 rounded-full overflow-hidden mt-1"
            title={`Probabilidade: ${deal.probability}%`}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                deal.probability >= 70
                  ? 'bg-green-500'
                  : deal.probability >= 40
                    ? 'bg-yellow-500'
                    : 'bg-red-500',
              )}
              style={{ width: `${deal.probability}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
