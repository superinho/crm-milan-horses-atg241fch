import { useState, useEffect } from 'react'
import { Plus, CheckCircle2, Circle, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { dealsService, DealTask } from '@/services/deals'
import { cn } from '@/lib/utils'

interface DealTasksProps {
  dealId: string
}

export function DealTasks({ dealId }: DealTasksProps) {
  const [tasks, setTasks] = useState<DealTask[]>([])
  const [newTask, setNewTask] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const { toast } = useToast()

  const fetchTasks = async () => {
    try {
      const data = await dealsService.getDealTasks(dealId)
      setTasks(data)
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
    if (dealId) {
      fetchTasks()
    }
  }, [dealId])

  const handleAddTask = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!newTask.trim()) return

    setIsAdding(true)
    try {
      const task = await dealsService.addDealTask(dealId, newTask.trim())
      setTasks([...tasks, task])
      setNewTask('')
      toast({
        title: 'Sucesso',
        description: 'Tarefa adicionada.',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a tarefa.',
        variant: 'destructive',
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleTask = async (task: DealTask) => {
    // Optimistic update
    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, is_completed: !t.is_completed } : t,
    )
    setTasks(updatedTasks)

    try {
      await dealsService.updateDealTask(task.id, {
        is_completed: !task.is_completed,
      })
    } catch (error) {
      console.error(error)
      // Revert on error
      fetchTasks()
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a tarefa.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteTask = async (id: string) => {
    try {
      await dealsService.deleteDealTask(id)
      setTasks(tasks.filter((t) => t.id !== id))
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a tarefa.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center justify-between">
          <span>Próximas Ações</span>
          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {tasks.filter((t) => t.is_completed).length}/{tasks.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-muted"
              >
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                  <button
                    onClick={() => handleToggleTask(task)}
                    className={cn(
                      'shrink-0 transition-colors focus:outline-none',
                      task.is_completed
                        ? 'text-green-600'
                        : 'text-muted-foreground hover:text-primary',
                    )}
                  >
                    {task.is_completed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  <span
                    className={cn(
                      'text-sm truncate transition-all',
                      task.is_completed &&
                        'text-muted-foreground line-through decoration-muted-foreground/50',
                    )}
                  >
                    {task.description}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
                  title="Excluir tarefa"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4 italic">
                Nenhuma tarefa pendente.
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleAddTask} className="flex gap-2 pt-2 border-t">
          <Input
            placeholder="Adicionar nova tarefa..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="h-9 text-sm"
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            className="h-9 w-9 p-0 shrink-0"
            disabled={isAdding || !newTask.trim()}
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
