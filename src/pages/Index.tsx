import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { dashboardService, DashboardData } from '@/services/dashboard'
import { tasksService, Task } from '@/services/tasks'
import { useRealtime } from '@/hooks/use-realtime'

// Components
import { GoalCard } from '@/components/dashboard/GoalCard'
import { UrgentTasksWidget } from '@/components/dashboard/UrgentTasksWidget'
import { PipelineOverview } from '@/components/dashboard/PipelineOverview'
import { SmartAlerts } from '@/components/dashboard/SmartAlerts'
import { SalesComparisonChart } from '@/components/dashboard/SalesComparisonChart'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { MonetaryDashboard } from '@/components/dashboard/MonetaryDashboard'

// Dialogs
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ContactForm } from '@/components/contacts/ContactForm'
import { DealForm } from '@/components/deals/DealForm'
import { TaskForm } from '@/components/tasks/TaskForm'
import { CampaignForm } from '@/components/campaigns/CampaignForm'

export default function Index() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeDialog, setActiveDialog] = useState<string | null>(null)
  const { toast } = useToast()

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const fetchData = async () => {
    try {
      const result = await dashboardService.getDashboardData()
      setData(result)
    } catch (error) {
      console.error('Failed to load dashboard data', error)
      toast({
        title: 'Erro de carregamento',
        description: 'Não foi possível atualizar o dashboard.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useRealtime('campaigns', () => fetchData())
  useRealtime('deals', () => fetchData())
  useRealtime('tasks', () => fetchData())

  const handleTaskComplete = async (task: Task) => {
    try {
      // Optimistic update
      if (data) {
        setData({
          ...data,
          urgentTasks: data.urgentTasks.filter((t) => t.id !== task.id),
        })
      }

      await tasksService.toggleTaskCompletion(task.id, true)

      toast({
        variant: 'success',
        title: 'Tarefa concluída',
        description: 'A tarefa foi marcada como feita.',
      })

      // Refresh to get new top 5
      fetchData()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível concluir a tarefa.',
        variant: 'destructive',
      })
      fetchData() // Revert state
    }
  }

  const handleQuickAction = (action: string) => {
    setActiveDialog(action)
  }

  const closeDialog = () => {
    setActiveDialog(null)
    // Refresh data as action might have changed stats
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-display text-primary">
          Bem-vindo ao CRM Milan Horses
        </h1>
        <p className="text-muted-foreground capitalize">{currentDate}</p>
      </div>

      {/* Smart Alerts */}
      {data && <SmartAlerts alerts={data.alerts} />}

      <MonetaryDashboard />

      {/* Goal & Quick Actions Row */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {data && (
          <GoalCard
            current={data.goal.current}
            target={data.goal.target}
            percentage={data.goal.percentage}
          />
        )}
        <QuickActions onAction={handleQuickAction} />
      </div>

      {/* Main Grid: Comparison, Pipeline, Urgent Tasks */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        {/* Sales Chart */}
        <div className="col-span-1 lg:col-span-4">
          {data && <SalesComparisonChart data={data.salesComparison} />}
        </div>

        {/* Pipeline & Tasks Column */}
        <div className="col-span-1 lg:col-span-3 space-y-6 flex flex-col">
          <div className="flex-1">
            {data && <PipelineOverview data={data.pipeline} />}
          </div>
          <div className="flex-1">
            {data && (
              <UrgentTasksWidget
                tasks={data.urgentTasks}
                onComplete={handleTaskComplete}
              />
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Modals */}

      {/* Contact Sheet */}
      <Sheet
        open={activeDialog === 'contact'}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo Contato</SheetTitle>
            <SheetDescription>
              Adicione um novo cliente ou lead.
            </SheetDescription>
          </SheetHeader>
          <ContactForm onSuccess={closeDialog} />
        </SheetContent>
      </Sheet>

      {/* Deal Dialog */}
      <Dialog
        open={activeDialog === 'deal'}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Negócio</DialogTitle>
          </DialogHeader>
          <DealForm onSuccess={closeDialog} onCancel={closeDialog} />
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog
        open={activeDialog === 'task'}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
          </DialogHeader>
          <TaskForm onSuccess={closeDialog} onCancel={closeDialog} />
        </DialogContent>
      </Dialog>

      {/* Campaign Dialog */}
      <Dialog
        open={activeDialog === 'campaign'}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Campanha</DialogTitle>
          </DialogHeader>
          <CampaignForm onSuccess={closeDialog} onCancel={closeDialog} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
