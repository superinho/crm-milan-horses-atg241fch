import { supabase } from '@/lib/supabase/client'
import { eachMonthOfInterval, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface ReportData {
  salesByMonth: {
    name: string
    value: number
    count: number
    average: number
  }[]
  topCustomers: { id: string; name: string; total: number; count: number }[]
  salesByBreed: { name: string; value: number }[]
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

export const reportsService = {
  async getReportData(startDate: Date, endDate: Date): Promise<ReportData> {
    const startStr = startDate.toISOString().split('T')[0]
    const endStr = endDate.toISOString().split('T')[0]

    // Fetch Purchases
    const { data: purchases, error: purchError } = await supabase
      .from('purchases')
      .select('*, contacts(name)')
      .gte('date', startStr)
      .lte('date', endStr)

    if (purchError) throw purchError

    // Fetch Total Contacts (Current snapshot)
    const { count: totalContacts, error: countError } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })

    if (countError) throw countError

    // --- Process Data ---

    // 1. Sales by Month & Seasonality
    const salesMap = new Map<string, { value: number; count: number }>()

    // Initialize all months in range
    const months = eachMonthOfInterval({ start: startDate, end: endDate })
    months.forEach((date) => {
      const key = format(date, 'MMM/yy', { locale: ptBR })
      // Capitalize first letter (e.g., "jan/24" -> "Jan/24")
      const formattedKey = key.charAt(0).toUpperCase() + key.slice(1)
      salesMap.set(formattedKey, { value: 0, count: 0 })
    })

    purchases?.forEach((p) => {
      const date = parseISO(p.date)
      // Check if date is within range (Supabase filter handles it, but ensures consistency)
      if (date >= startDate && date <= endDate) {
        const key = format(date, 'MMM/yy', { locale: ptBR })
        const formattedKey = key.charAt(0).toUpperCase() + key.slice(1)

        const current = salesMap.get(formattedKey) || { value: 0, count: 0 }
        salesMap.set(formattedKey, {
          value: current.value + Number(p.value),
          count: current.count + 1,
        })
      }
    })

    const salesByMonth = Array.from(salesMap.entries()).map(([name, data]) => ({
      name,
      value: data.value,
      count: data.count,
      average: data.count > 0 ? data.value / data.count : 0,
    }))

    // Seasonality Analysis
    const sortedByValue = [...salesByMonth].sort((a, b) => b.value - a.value)
    const peakMonth = sortedByValue[0]?.name || '-'
    const lowMonth = sortedByValue[sortedByValue.length - 1]?.name || '-'
    const analysis = `O período apresentou pico de vendas em ${peakMonth}, enquanto ${lowMonth} teve o menor desempenho.`

    // 2. Top Customers
    const customerMap = new Map<
      string,
      { name: string; total: number; count: number }
    >()
    purchases?.forEach((p) => {
      if (p.contact_id) {
        const current = customerMap.get(p.contact_id) || {
          name: (p.contacts as any)?.name || 'Desconhecido',
          total: 0,
          count: 0,
        }
        customerMap.set(p.contact_id, {
          name: current.name,
          total: current.total + Number(p.value),
          count: current.count + 1,
        })
      }
    })

    const topCustomers = Array.from(customerMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    // 3. Sales by Breed
    const breedMap = new Map<string, number>()
    purchases?.forEach((p) => {
      const desc = (p.description || '').toLowerCase()
      let breed = 'Outros'
      if (desc.includes('lusitano')) breed = 'Lusitano'
      else if (desc.includes('quarto de milha')) breed = 'Quarto de Milha'
      else if (desc.includes('árabe') || desc.includes('arabe')) breed = 'Árabe'
      else if (desc.includes('mangalarga')) breed = 'Mangalarga'
      else if (desc.includes('crioulo')) breed = 'Crioulo'
      else if (desc.includes('campolina')) breed = 'Campolina'
      else if (desc.includes('holandês')) breed = 'Holandês'
      else if (desc.includes('pampa')) breed = 'Pampa'

      breedMap.set(breed, (breedMap.get(breed) || 0) + Number(p.value))
    })

    const salesByBreed = Array.from(breedMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // 4. Metrics
    const totalRevenue =
      purchases?.reduce((acc, p) => acc + Number(p.value), 0) || 0
    const totalSales = purchases?.length || 0
    const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0
    const uniqueCustomers = customerMap.size
    const conversionRate = totalContacts
      ? (uniqueCustomers / totalContacts) * 100
      : 0

    return {
      salesByMonth,
      topCustomers,
      salesByBreed,
      metrics: {
        totalRevenue,
        totalSales,
        avgTicket,
        totalLeads: totalContacts || 0,
        totalCustomers: uniqueCustomers,
        conversionRate,
      },
      seasonality: {
        peakMonth,
        lowMonth,
        analysis,
      },
    }
  },
}
