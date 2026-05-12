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

    const [rfmvData, birthdayData] = await Promise.all([
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

    return {
      snapshot,
    }
  },
}
