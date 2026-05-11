import { dealsService } from './deals'
import supabase from '@/lib/supabase/client'

const db = supabase as any

export type ReportData = {
  salesByMonth: {
    name: string
    value: number
    count: number
    average: number
  }[]
  topCustomers: {
    id: string
    name: string
    total: number
    count: number
  }[]
  salesByBreed: {
    name: string
    value: number
  }[]
  metrics: {
    totalRevenue: number
    totalSales: number
    avgTicket: number
    totalLeads: number
    totalCustomers: number
    conversionRate: number
  }
  seasonality: {
    peakMonth: string
    lowMonth: string
    analysis: string
  }
}

export type ActivityReportData = {
  interactionsOverTime: {
    date: string
    count: number
  }[]
  emailResponseRate: number
  emailOpenHeatmap: {
    day: string
    hour: string
    value: number
  }[]
  campaignPerformance: {
    name: string
    sent: number
    opened: number
    clicked: number
  }[]
  topTemplates: {
    name: string
    uses: number
    responseRate: number
  }[]
  newContactsGrowth: {
    name: string
    value: number
  }[]
}

export const reportsService = {
  async getReportData(startDate: Date, endDate: Date): Promise<ReportData> {
    const deals = await dealsService.getDeals()
    const { data: purchases, error } = await db
      .from('purchases')
      .select('id,value,date,contact_id,contacts(id,name)')
      .gte('date', startDate.toISOString().slice(0, 10))
      .lte('date', endDate.toISOString().slice(0, 10))

    if (error) throw error

    const wonDeals = deals.filter((d) => d.stage === 'Fechado')
    const purchaseRows = purchases || []
    const totalRevenue = purchaseRows.reduce(
      (acc: number, purchase: any) => acc + Number(purchase.value || 0),
      0,
    )
    const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
      month: 'short',
      year: '2-digit',
    })
    const monthMap = new Map<string, { value: number; count: number }>()
    const customerMap = new Map<
      string,
      { id: string; name: string; total: number; count: number }
    >()

    for (const purchase of purchaseRows) {
      const purchaseDate = new Date(`${purchase.date}T00:00:00`)
      const month = monthFormatter.format(purchaseDate)
      const currentMonth = monthMap.get(month) || { value: 0, count: 0 }
      currentMonth.value += Number(purchase.value || 0)
      currentMonth.count += 1
      monthMap.set(month, currentMonth)

      const contact = Array.isArray(purchase.contacts)
        ? purchase.contacts[0]
        : purchase.contacts
      const contactId = purchase.contact_id || 'sem-contato'
      const currentCustomer = customerMap.get(contactId) || {
        id: contactId,
        name: contact?.name || 'Sem contato vinculado',
        total: 0,
        count: 0,
      }
      currentCustomer.total += Number(purchase.value || 0)
      currentCustomer.count += 1
      customerMap.set(contactId, currentCustomer)
    }

    const salesByMonth = Array.from(monthMap.entries()).map(([name, item]) => ({
      name,
      value: item.value,
      count: item.count,
      average: item.count ? item.value / item.count : 0,
    }))
    const topCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
    const peak = [...salesByMonth].sort((a, b) => b.value - a.value)[0]
    const low = [...salesByMonth]
      .filter((item) => item.value > 0)
      .sort((a, b) => a.value - b.value)[0]

    return {
      salesByMonth,
      topCustomers,
      salesByBreed: [],
      metrics: {
        totalRevenue,
        totalSales: purchaseRows.length,
        avgTicket:
          purchaseRows.length > 0 ? totalRevenue / purchaseRows.length : 0,
        totalLeads: deals.length,
        totalCustomers: customerMap.size,
        conversionRate:
          deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0,
      },
      seasonality: {
        peakMonth: peak?.name || 'N/A',
        lowMonth: low?.name || 'N/A',
        analysis:
          salesByMonth.length > 0
            ? 'Análise calculada somente a partir das compras reais sincronizadas da Smart Leilões.'
            : 'Sem compras reais no período selecionado.',
      },
    }
  },

  async getActivityReportData(): Promise<ActivityReportData> {
    return {
      interactionsOverTime: [],
      emailResponseRate: 0,
      emailOpenHeatmap: [],
      campaignPerformance: [],
      topTemplates: [],
      newContactsGrowth: [],
    }
  },
}
