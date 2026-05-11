import { dealsService } from './deals'
import { tasksService, Task } from './tasks'
import { contactsService } from './contacts'
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  getMonth,
  getDate,
} from 'date-fns'

export interface DashboardData {
  goal: {
    current: number
    target: number
    percentage: number
  }
  urgentTasks: Task[]
  pipeline: {
    stage: string
    count: number
    value: number
  }[]
  alerts: {
    birthdays: number
    overdueTasks: number
    inactiveClients: number
    pendingFollowUps: number
  }
  salesComparison: {
    name: string
    current: number
    previous: number
  }[]
}

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const now = new Date()

    const allTasks = await tasksService.getTasks()
    const allDeals = await dealsService.getDeals()

    // 1. Goal
    const currentRevenue = allDeals
      .filter((d) => d.stage === 'Fechado')
      .reduce((acc, d) => acc + d.value, 0)
    const targetRevenue = 100000 // mock goal for now
    const goal = {
      current: currentRevenue,
      target: targetRevenue,
      percentage: Math.min((currentRevenue / targetRevenue) * 100, 100),
    }

    // 2. Urgent Tasks
    const urgentTasks = allTasks
      .filter((t) => !t.is_completed)
      .sort(
        (a, b) =>
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
      )
      .slice(0, 5)

    // 3. Pipeline
    const pipelineMap = new Map<string, { count: number; value: number }>()
    const stages = ['Lead', 'Qualificado', 'Interesse', 'Proposta', 'Fechado']
    stages.forEach((s) => pipelineMap.set(s, { count: 0, value: 0 }))

    allDeals.forEach((deal) => {
      const stageName = deal.stage || 'Lead'
      if (pipelineMap.has(stageName)) {
        const current = pipelineMap.get(stageName)!
        pipelineMap.set(stageName, {
          count: current.count + 1,
          value: current.value + Number(deal.value || 0),
        })
      }
    })

    const pipeline = Array.from(pipelineMap.entries()).map(([stage, data]) => ({
      stage,
      ...data,
    }))

    // 4. Alerts
    const overdueTasksCount = allTasks.filter(
      (t) => !t.is_completed && new Date(t.due_date) < now,
    ).length
    const alerts = {
      birthdays: 0,
      overdueTasks: overdueTasksCount,
      inactiveClients: await contactsService.getInactiveContactsCount(90),
      pendingFollowUps: allTasks.filter(
        (t) => !t.is_completed && new Date(t.due_date) >= now,
      ).length,
    }

    // 5. Comparison (mocked for simplicity due to lack of historical purchases)
    const salesComparison = [
      { name: 'Jan', current: 4000, previous: 2400 },
      { name: 'Fev', current: 3000, previous: 1398 },
      { name: 'Mar', current: 2000, previous: 9800 },
      { name: 'Abr', current: 2780, previous: 3908 },
      { name: 'Mai', current: 1890, previous: 4800 },
      { name: 'Jun', current: 2390, previous: 3800 },
    ]

    return {
      goal,
      urgentTasks,
      pipeline,
      alerts,
      salesComparison,
    }
  },
}
