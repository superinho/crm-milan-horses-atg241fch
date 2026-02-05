import { useState } from 'react'
import { format, isPast, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Calendar,
  Clock,
  User,
  Briefcase,
  CheckCircle2,
  Circle,
  AlertCircle,
  Phone,
  Mail,
  MessageCircle,
  MoreHorizontal,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Task, TaskType } from '@/services/tasks'

interface TaskCardProps {
  task: Task
  onComplete: (task: Task) => void
  onDelete: (taskId: string) => void
}

export function TaskCard({ task, onComplete, onDelete }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const isOverdue =
    isPast(new Date(task.due_date)) &&
    !isToday(new Date(task.due_date)) &&
    !task.is_completed

  const getTypeIcon = (type: TaskType) => {
    switch (type) {
      case 'Ligação':
        return <Phone className="h-3.5 w-3.5" />
      case 'E-mail':
        return <Mail className="h-3.5 w-3.5" />
      case 'WhatsApp':
        return <MessageCircle className="h-3.5 w-3.5" />
      default:
        return <MoreHorizontal className="h-3.5 w-3.5" />
    }
  }

  const getTypeColor = (type: TaskType) => {
    switch (type) {
      case 'Ligação':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'E-mail':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'WhatsApp':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-md border-l-4',
        isOverdue ? 'border-l-destructive' : 'border-l-primary',
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'shrink-0 h-6 w-6 mt-0.5 rounded-full',
              task.is_completed
                ? 'text-green-600'
                : 'text-muted-foreground hover:text-primary hover:bg-primary/10',
            )}
            onClick={() => onComplete(task)}
          >
            {task.is_completed ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </Button>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4
                  className={cn(
                    'font-semibold text-sm leading-none mb-1.5',
                    task.is_completed && 'line-through text-muted-foreground',
                  )}
                >
                  {task.title}
                </h4>
                {task.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                    {task.description}
                  </p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mr-2 text-muted-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(task.id)}
                  >
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn('gap-1.5 font-normal', getTypeColor(task.type))}
              >
                {getTypeIcon(task.type)}
                {task.type}
              </Badge>

              {task.contact && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                  <User className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">
                    {task.contact.name}
                  </span>
                </div>
              )}

              {task.deal && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                  <Briefcase className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">
                    {task.deal.title}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs pt-1">
              <div
                className={cn(
                  'flex items-center gap-1.5 font-medium',
                  isOverdue ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {isOverdue ? (
                  <AlertCircle className="h-3.5 w-3.5" />
                ) : (
                  <Calendar className="h-3.5 w-3.5" />
                )}
                <span>
                  {format(new Date(task.due_date), 'dd MMM', { locale: ptBR })}
                  {isOverdue && ' (Atrasada)'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{format(new Date(task.due_date), 'HH:mm')}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
