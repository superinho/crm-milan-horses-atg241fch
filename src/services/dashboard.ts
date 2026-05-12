import { dealsService } from './deals'
import { tasksService, Task } from './tasks'
import { contactsService } from './contacts'
import { settingsService } from './settings'
import { supabase } from '@/lib/supabase/client'

const db = supabase as any

export interface DashboardData {
  snapshot: {
    totalRevenue: number
    totalCustomers: number
    buyers: number
    withWhatsapp: number
    totalBidsValue: number
    avgTicket: number
    highPotential: number
    upcomingBirthdays: number
    upcomingBirthdayNames: string[]
  }
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

const toMoneyNumber = (value: unknown) => Number(value || 0)

const daysUntilBirthday = (birthDate: string, today: Date) => {
  const [, month, day] = birthDate.split('-').map(Number)
  if (!month || !day) return null

  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )
  let nextBirthday = new Date(today.getFullYear(), month - 1, day)

  if (nextBirthday < startOfToday) {
    nextBirthday = new Date(today.getFullYear() + 1, month - 1, day)
  }

  return Math.ceil(
    (nextBirthday.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  )
}

const fetchAllRows = async (table: string, columns: string, orderBy = 'id') => {
  const pageSize = 1000
  let from = 0
  const rows: any[] = []

  while (true) {
    const { data, error } = await db
      .from(table)
      .select(columns)
      .order(orderBy, { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) throw error

    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
    from += pageSize
  }

  return rows
}

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const now = new Date()

    const [allTasks, allDeals, settings, rfmvData, birthdayData] =
      await Promise.all([
        tasksService.getTasks(),
        dealsService.getDeals(),
        settingsService.getSettings(),
        fetchAllRows(
          'customer_rfmv_view',
          'id,name,purchase_count,monetary_value,bid_value,avg_ticket,whatsapp,segment',
        ),
        fetchAllRows('contacts', 'id,name,birth_date'),
      ])

    const rfmvRows = (rfmvData || []).map((row: any) => ({
      ...row,
      purchase_count: Number(row.purchase_count || 0),
      monetary_value: toMoneyNumber(row.monetary_value),
      bid_value: toMoneyNumber(row.bid_value),
      avg_ticket: toMoneyNumber(row.avg_ticket),
    }))

    const buyers = rfmvRows.filter((row: any) => row.purchase_count > 0)
    const totalRevenue = rfmvRows.reduce(
      (sum: number, row: any) => sum + row.monetary_value,
      0,
    )
    const totalPurchases = buyers.reduce(
      (sum: number, row: any) => sum + row.purchase_count,
      0,
    )
    const upcomingBirthdays = (birthdayData || [])
      .filter((contact: any) => Boolean(contact.birth_date))
      .map((contact: any) => ({
        ...contact,
        daysUntil: contact.birth_date
          ? daysUntilBirthday(contact.birth_date, now)
          : null,
      }))
      .filter(
        (contact: any) =>
          contact.daysUntil !== null &&
          contact.daysUntil >= 0 &&
          contact.daysUntil <= 30,
      )
      .sort((a: any, b: any) => a.daysUntil - b.daysUntil)

    const snapshot = {
      totalRevenue,
      totalCustomers: rfmvRows.length,
      buyers: buyers.length,
      withWhatsapp: rfmvRows.filter(
        (row: any) =>
          String(row.whatsapp || '').replace(/\D/g, '').length >= 10,
      ).length,
      totalBidsValue: rfmvRows.reduce(
        (sum: number, row: any) => sum + row.bid_value,
        0,
      ),
      avgTicket: totalPurchases ? totalRevenue / totalPurchases : 0,
      highPotential: rfmvRows.filter(
        (row: any) => row.segment === 'Alto potencial sem compra',
      ).length,
      upcomingBirthdays: upcomingBirthdays.length,
      upcomingBirthdayNames: upcomingBirthdays
        .slice(0, 3)
        .map((contact: any) => contact.name)
        .filter(Boolean),
    }

    // 1. Goal
    const currentRevenue = allDeals
      .filter((d) => d.stage === 'Fechado')
      .reduce((acc, d) => acc + d.value, 0)
    const targetRevenue = Number(settings.monthly_sales_goal || 0)
    const goal = {
      current: currentRevenue,
      target: targetRevenue,
      percentage: targetRevenue
        ? Math.min((currentRevenue / targetRevenue) * 100, 100)
        : 0,
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

    // 5. Comparison from real Smart Leilões purchases
    const comparisonStart = new Date(
      now.getFullYear() - 1,
      now.getMonth() - 5,
      1,
    )
    const { data: purchases, error: purchasesError } = await db
      .from('purchases')
      .select('value,date')
      .gte('date', comparisonStart.toISOString().slice(0, 10))

    if (purchasesError) throw purchasesError

    const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    const salesComparison = Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date(
        now.getFullYear(),
        now.getMonth() - 5 + index,
        1,
      )
      const previousDate = new Date(
        monthDate.getFullYear() - 1,
        monthDate.getMonth(),
        1,
      )

      const sumFor = (date: Date) =>
        (purchases || [])
          .filter((purchase: any) => {
            const purchaseDate = new Date(`${purchase.date}T00:00:00`)
            return (
              purchaseDate.getFullYear() === date.getFullYear() &&
              purchaseDate.getMonth() === date.getMonth()
            )
          })
          .reduce(
            (sum: number, purchase: any) => sum + Number(purchase.value || 0),
            0,
          )

      return {
        name: monthFormatter.format(monthDate),
        current: sumFor(monthDate),
        previous: sumFor(previousDate),
      }
    })

    return {
      snapshot,
      goal,
      urgentTasks,
      pipeline,
      alerts,
      salesComparison,
    }
  },
}
