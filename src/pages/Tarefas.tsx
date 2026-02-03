import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Calendar, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type Task = {
  id: number
  text: string
  completed: boolean
  priority: 'Alta' | 'Média' | 'Baixa'
  date: string
}

const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    text: 'Ligar para Roberto sobre o cavalo Lusitano',
    completed: false,
    priority: 'Alta',
    date: 'Hoje',
  },
  {
    id: 2,
    text: 'Enviar contrato para Haras Pôr do Sol',
    completed: true,
    priority: 'Alta',
    date: 'Ontem',
  },
  {
    id: 3,
    text: 'Atualizar fotos do catálogo no site',
    completed: false,
    priority: 'Média',
    date: 'Amanhã',
  },
  {
    id: 4,
    text: 'Agendar visita veterinária',
    completed: false,
    priority: 'Baixa',
    date: '12 Out',
  },
  {
    id: 5,
    text: 'Reunião de equipe semanal',
    completed: false,
    priority: 'Média',
    date: '15 Out',
  },
]

export default function Tarefas() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [newTask, setNewTask] = useState('')

  const toggleTask = (id: number) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    )
  }

  const addTask = () => {
    if (!newTask.trim()) return
    setTasks([
      {
        id: Date.now(),
        text: newTask,
        completed: false,
        priority: 'Média',
        date: 'Hoje',
      },
      ...tasks,
    ])
    setNewTask('')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta':
        return 'text-red-600 bg-red-100 border-red-200'
      case 'Média':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'Baixa':
        return 'text-green-600 bg-green-100 border-green-200'
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-primary">
            Minhas Tarefas
          </h1>
          <p className="text-muted-foreground">
            Organize seu dia e não perca nenhum compromisso.
          </p>
        </div>
      </div>

      <Card className="border-t-4 border-t-primary shadow-lg">
        <CardHeader>
          <div className="flex gap-4">
            <Input
              placeholder="Adicionar nova tarefa..."
              className="flex-1"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
            />
            <Button
              onClick={addTask}
              className="bg-secondary text-white hover:bg-secondary/90"
            >
              <Plus className="h-4 w-4 mr-2" /> Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${task.completed ? 'bg-muted/50 border-transparent opacity-60' : 'bg-white hover:shadow-sm border-border'}`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span
                    className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                  >
                    {task.text}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className={`border ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority}
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground w-24 justify-end">
                    <Calendar className="h-3 w-3 mr-1" />
                    {task.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
