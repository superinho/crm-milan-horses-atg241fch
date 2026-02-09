import { settingsService } from './settings'
import { reportsService } from './reports'
import { contactsService } from './contacts'
import { tasksService, Task } from './tasks'
import { dealsService, Deal } from './deals'
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
    const startCurrentMonth = startOfMonth(now)
    const endCurrentMonth = endOfMonth(now)

    // 1. Goal Performance
    const settings = await settingsService.getSettings()
    const currentMonthSales = await reportsService.getReportData(
      startCurrentMonth,
      endCurrentMonth,
    )
    const currentRevenue = currentMonthSales.metrics.totalRevenue
    const targetRevenue = settings.monthly_sales_goal || 1 // Avoid div by zero

    const goal = {
      current: currentRevenue,
      target: targetRevenue,
      percentage: Math.min((currentRevenue / targetRevenue) * 100, 100),
    }

    // 2. Urgent Tasks (Top 5 earliest due, not completed)
    const allTasks = await tasksService.getTasks()
    const urgentTasks = allTasks
      .filter((t) => !t.is_completed)
      .sort(
        (a, b) =>
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
      )
      .slice(0, 5)

    // 3. Pipeline Overview
    const allDeals = await dealsService.getDeals()
    const pipelineMap = new Map<string, { count: number; value: number }>()

    // Initialize stages to ensure order
    const stages = ['Lead', 'Qualificado', 'Interesse', 'Proposta', 'Fechado']
    stages.forEach((s) => pipelineMap.set(s, { count: 0, value: 0 }))

    allDeals.forEach((deal) => {
      if (pipelineMap.has(deal.stage)) {
        const current = pipelineMap.get(deal.stage)!
        pipelineMap.set(deal.stage, {
          count: current.count + 1,
          value: current.value + Number(deal.value),
        })
      }
    })

    const pipeline = Array.from(pipelineMap.entries()).map(([stage, data]) => ({
      stage,
      ...data,
    }))

    // 4. Alerts
    const birthdays = await contactsService.getBirthdays(
      getMonth(now) + 1,
      getDate(now),
    )
    const inactiveClientsCount =
      await contactsService.getInactiveContactsCount(90)

    const overdueTasksCount = allTasks.filter((t) => {
      return !t.is_completed && new Date(t.due_date) < now
    }).length

    const pendingFollowUpsCount = allTasks.filter((t) => {
      // Assuming pending follow-ups are future incomplete tasks
      return !t.is_completed && new Date(t.due_date) >= now
    }).length

    const alerts = {
      birthdays: birthdays.length,
      overdueTasks: overdueTasksCount,
      inactiveClients: inactiveClientsCount,
      pendingFollowUps: pendingFollowUpsCount,
    }

    // 5. Comparative Sales (Last 6 months vs Previous Year)
    const sixMonthsAgo = subMonths(now, 5) // current month + 5 previous
    const currentPeriodData = await reportsService.getReportData(
      startOfMonth(sixMonthsAgo),
      endCurrentMonth,
    )

    const oneYearAgoStart = subMonths(startOfMonth(sixMonthsAgo), 12)
    const oneYearAgoEnd = subMonths(endCurrentMonth, 12)
    const previousPeriodData = await reportsService.getReportData(
      oneYearAgoStart,
      oneYearAgoEnd,
    )

    // Map by month index to align
    const comparisonMap = new Map<
      number,
      { name: string; current: number; previous: number }
    >()

    // Initialize with current period names
    currentPeriodData.salesByMonth.forEach((item, index) => {
      comparisonMap.set(index, {
        name: item.name.split('/')[0], // Just Month name
        current: item.value,
        previous: 0,
      })
    })

    previousPeriodData.salesByMonth.forEach((item, index) => {
      if (comparisonMap.has(index)) {
        comparisonMap.get(index)!.previous = item.value
      }
    })

    const salesComparison = Array.from(comparisonMap.values())

    return {
      goal,
      urgentTasks,
      pipeline,
      alerts,
      salesComparison,
    }
  },
}
