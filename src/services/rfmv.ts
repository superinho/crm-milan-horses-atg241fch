import supabase from '@/lib/supabase/client'

const db = supabase as any

export type CustomerRfmv = {
  id: string
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  city: string | null
  state: string | null
  purchase_count: number
  monetary_value: number
  avg_ticket: number
  bid_count: number
  auction_count: number
  bid_value: number
  last_activity_date: string
  recency_score: number
  frequency_score: number
  monetary_score: number
  variety_score: number
  rfmv_score: number
  segment: string
}

export type MonetaryDashboardData = {
  totalRevenue: number
  totalCustomers: number
  avgTicket: number
  totalBidsValue: number
  topCustomers: CustomerRfmv[]
  vipInactive: CustomerRfmv[]
  highPotential: CustomerRfmv[]
}

export const rfmvService = {
  async getMonetaryDashboard(): Promise<MonetaryDashboardData> {
    const { data, error } = await db
      .from('customer_rfmv_view')
      .select('*')
      .order('monetary_value', { ascending: false })

    if (error) throw error

    const rows = (data || []).map((row: any) => ({
      ...row,
      purchase_count: Number(row.purchase_count || 0),
      monetary_value: Number(row.monetary_value || 0),
      avg_ticket: Number(row.avg_ticket || 0),
      bid_count: Number(row.bid_count || 0),
      auction_count: Number(row.auction_count || 0),
      bid_value: Number(row.bid_value || 0),
      recency_score: Number(row.recency_score || 0),
      frequency_score: Number(row.frequency_score || 0),
      monetary_score: Number(row.monetary_score || 0),
      variety_score: Number(row.variety_score || 0),
      rfmv_score: Number(row.rfmv_score || 0),
    })) as CustomerRfmv[]

    const totalRevenue = rows.reduce(
      (sum, row) => sum + row.monetary_value,
      0,
    )
    const buyers = rows.filter((row) => row.purchase_count > 0)
    const totalPurchases = buyers.reduce(
      (sum, row) => sum + row.purchase_count,
      0,
    )

    return {
      totalRevenue,
      totalCustomers: rows.length,
      avgTicket: totalPurchases ? totalRevenue / totalPurchases : 0,
      totalBidsValue: rows.reduce((sum, row) => sum + row.bid_value, 0),
      topCustomers: rows.slice(0, 8),
      vipInactive: rows
        .filter((row) => row.segment === 'VIP inativo')
        .sort((a, b) => b.monetary_value - a.monetary_value)
        .slice(0, 5),
      highPotential: rows
        .filter((row) => row.segment === 'Alto potencial sem compra')
        .sort((a, b) => b.bid_value - a.bid_value)
        .slice(0, 5),
    }
  },
}
