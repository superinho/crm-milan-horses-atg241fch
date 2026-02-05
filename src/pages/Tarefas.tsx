import { useState, useEffect } from 'react'
import { Plus, CheckSquare, Calendar, Loader2 } from 'lucide-react'
import {
  isToday,
  isTomorrow,
  isPast,
  addDays,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
} from 'date-fns'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { tasksService, Task } from '@/services/tasks'
import { TaskForm } from '@/components/tasks/TaskForm'
import { TaskCard } from '@/components/tasks/TaskCard'
import { cn } from '@/lib/utils'

export default function Tarefas() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const data = await tasksService.getTasks()
      setTasks(data || [])
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tarefas.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleTaskComplete = async (task: Task) => {
    try {
      // Optimistic update
      setTasks(tasks.filter((t) => t.id !== task.id))

      await tasksService.toggleTaskCompletion(task.id, true)

      toast({
        title: 'Tarefa concluída!',
        description: `"${task.title}" foi marcada como feita.`,
      })
    } catch (error) {
      console.error(error)
      fetchTasks() // Revert
      toast({
        title: 'Erro',
        description: 'Não foi possível concluir a tarefa.',
        variant: 'destructive',
      })
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    try {
      await tasksService.deleteTask(taskId)
      setTasks(tasks.filter((t) => t.id !== taskId))
      toast({
        title: 'Tarefa excluída',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a tarefa.',
        variant: 'destructive',
      })
    }
  }

  // Group Tasks
  const today = new Date()
  const endOfTodayDate = endOfDay(today)
  const nextWeekStart = addDays(today, 8) // "This week" is next 7 days, so upcoming starts after that

  const todayTasks = tasks.filter((t) => {
    const dueDate = new Date(t.due_date)
    // Include overdue tasks in "Today"
    return (
      !t.is_completed &&
      (isToday(dueDate) || isBefore(dueDate, startOfDay(today)))
    )
  })

  const weekTasks = tasks.filter((t) => {
    const dueDate = new Date(t.due_date)
    return (
      !t.is_completed &&
      isAfter(dueDate, endOfTodayDate) &&
      isBefore(dueDate, nextWeekStart)
    )
  })

  const upcomingTasks = tasks
    .filter((t) => {
      const dueDate = new Date(t.due_date)
      return (
        !t.is_completed &&
        (isAfter(dueDate, nextWeekStart) ||
          (isToday(dueDate) === false &&
            isBefore(dueDate, nextWeekStart) === false &&
            isBefore(dueDate, today) === false))
      )
      // Simplified: Just anything else that is not completed and not in previous groups?
      // Let's be precise: > today+7days
    })
    .filter((t) => {
      // Re-filter specifically to match the "Próximas" criteria strictly if needed, but let's just use the inverse of others
      const dueDate = new Date(t.due_date)
      return !t.is_completed && isAfter(dueDate, addDays(endOfTodayDate, 7))
    })

  // Recalculate weekTasks to match exactly "next 7 days excluding today"
  const weekTasksRefined = tasks.filter((t) => {
    const dueDate = new Date(t.due_date)
    return (
      !t.is_completed &&
      isAfter(dueDate, endOfTodayDate) &&
      !isAfter(dueDate, addDays(endOfTodayDate, 7))
    )
  })

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 animate-fade-in">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-display text-primary flex items-center gap-3">
            <CheckSquare className="h-8 w-8" />
            Minhas Tarefas
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas atividades, organize prioridades e não perca prazos.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
              <DialogDescription>
                Crie um lembrete ou atividade vinculada a um contato.
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              onSuccess={() => {
                setIsDialogOpen(false)
                fetchTasks()
              }}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-6 min-w-[1000px] pb-4">
          {/* Today Column */}
          <div className="flex-1 flex flex-col min-w-[300px] rounded-xl bg-red-50/50 border border-red-100 overflow-hidden">
            <div className="p-4 border-b border-red-100 bg-red-50 flex items-center justify-between sticky top-0">
              <h3 className="font-bold text-red-900 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Hoje
              </h3>
              <span className="bg-red-200 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {todayTasks.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-8 text-red-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : todayTasks.length > 0 ? (
                todayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleTaskComplete}
                    onDelete={handleTaskDelete}
                  />
                ))
              ) : (
                <div className="text-center py-10 text-red-300">
                  <p className="text-sm">Nenhuma tarefa para hoje.</p>
                </div>
              )}
            </div>
          </div>

          {/* This Week Column */}
          <div className="flex-1 flex flex-col min-w-[300px] rounded-xl bg-yellow-50/50 border border-yellow-100 overflow-hidden">
            <div className="p-4 border-b border-yellow-100 bg-yellow-50 flex items-center justify-between sticky top-0">
              <h3 className="font-bold text-yellow-900 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Esta Semana
              </h3>
              <span className="bg-yellow-200 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {weekTasksRefined.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-8 text-yellow-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : weekTasksRefined.length > 0 ? (
                weekTasksRefined.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleTaskComplete}
                    onDelete={handleTaskDelete}
                  />
                ))
              ) : (
                <div className="text-center py-10 text-yellow-300">
                  <p className="text-sm">Tudo limpo para esta semana.</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Column */}
          <div className="flex-1 flex flex-col min-w-[300px] rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between sticky top-0">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Próximas
              </h3>
              <span className="bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {upcomingTasks.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-8 text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleTaskComplete}
                    onDelete={handleTaskDelete}
                  />
                ))
              ) : (
                <div className="text-center py-10 text-gray-300">
                  <p className="text-sm">Sem tarefas futuras agendadas.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
