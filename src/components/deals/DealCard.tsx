import {
  MoreHorizontal,
  DollarSign,
  User,
  Calendar,
  AlertTriangle,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { format, isPast, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Deal } from '@/services/deals'

interface DealCardProps {
  deal: Deal
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDelete?: (deal: Deal) => void
}

export function DealCard({
  deal,
  isDragging,
  onDragStart,
  onDelete,
}: DealCardProps) {
  const isOverdue =
    deal.expected_close_date &&
    isPast(new Date(deal.expected_close_date)) &&
    !isToday(new Date(deal.expected_close_date))

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        'touch-none transition-all duration-200 ease-in-out',
        isDragging
          ? 'opacity-50 scale-95 rotate-2'
          : 'opacity-100 hover:scale-[1.02]',
      )}
    >
      <Card className="cursor-grab active:cursor-grabbing border-l-4 border-l-primary shadow-sm hover:shadow-md">
        <CardContent className="p-3 pb-2 space-y-3">
          <div className="flex justify-between items-start">
            <Link
              to={`/negocios/${deal.id}`}
              className="font-semibold text-sm hover:underline line-clamp-2 leading-tight flex-1"
              title={deal.title}
            >
              {deal.title}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 -mr-2 -mt-1 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to={`/negocios/${deal.id}`}>Ver Detalhes</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete?.(deal)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center justify-between">
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] font-normal px-1.5 py-0.5',
                deal.probability > 70
                  ? 'bg-green-100 text-green-700'
                  : deal.probability > 30
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700',
              )}
            >
              {deal.probability}% Prob.
            </Badge>
            <span className="font-bold text-sm text-primary">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                notation: 'compact',
              }).format(deal.value)}
            </span>
          </div>

          {deal.contact && (
            <div className="flex items-center gap-2 pt-1">
              <Avatar className="h-5 w-5">
                <AvatarImage
                  src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${deal.contact.id}`}
                />
                <AvatarFallback className="text-[8px]">
                  {deal.contact.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                {deal.contact.name}
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-2 pt-0 flex justify-between items-center text-xs text-muted-foreground border-t bg-gray-50/50 rounded-b-lg">
          {deal.expected_close_date ? (
            <div
              className={cn(
                'flex items-center gap-1',
                isOverdue ? 'text-red-500 font-medium' : '',
              )}
            >
              {isOverdue ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <Calendar className="h-3 w-3" />
              )}
              {format(new Date(deal.expected_close_date), 'dd MMM', {
                locale: ptBR,
              })}
            </div>
          ) : (
            <span>Sem data</span>
          )}
          <span>{format(new Date(deal.created_at), 'HH:mm')}</span>
        </CardFooter>
      </Card>
    </div>
  )
}
