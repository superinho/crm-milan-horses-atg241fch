import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckSquare, Clock, ArrowRight } from 'lucide-react'
import { Task } from '@/services/tasks'
import { format, isToday, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface UrgentTasksWidgetProps {
  tasks: Task[]
  onComplete: (task: Task) => void
}

export function UrgentTasksWidget({
  tasks,
  onComplete,
}: UrgentTasksWidgetProps) {
  return (
    <Card className="shadow-sm h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" />
              Tarefas Urgentes
            </CardTitle>
            <CardDescription>
              Prioridade alta para conclusão imediata.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <a href="/tarefas" className="text-xs flex items-center">
              Ver todas <ArrowRight className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task) => {
              const dueDate = new Date(task.due_date)
              const isOverdue = isPast(dueDate) && !isToday(dueDate)

              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/10 transition-colors group"
                >
                  <div className="flex flex-col gap-1 min-w-0 flex-1 mr-4">
                    <span
                      className="font-medium text-sm truncate"
                      title={task.title}
                    >
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className={cn(isOverdue && 'text-red-500 font-medium')}
                      >
                        {format(dueDate, 'dd MMM', { locale: ptBR })}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{task.type}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 rounded-full shrink-0 border-dashed border-primary/50 text-primary hover:bg-primary hover:text-white"
                    onClick={() => onComplete(task)}
                    title="Marcar como feito"
                  >
                    <CheckSquare className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-8">
            <CheckSquare className="h-10 w-10 mb-2 opacity-20" />
            <p>Tudo em dia!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
