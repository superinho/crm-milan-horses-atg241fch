import { supabase } from '@/lib/supabase/client'

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
  heat_score?: number
  streak_count?: number
  ghost_score?: number
}

export type MonetaryDashboardData = {
  totalRevenue: number
  totalCustomers: number
  avgTicket: number
  totalBidsValue: number
  topCustomers: CustomerRfmv[]
  vipInactive: CustomerRfmv[]
  hotBuyers: CustomerRfmv[]
  ghostBidders: CustomerRfmv[]
}

const fetchAllCustomerRfmvRows = async () => {
  const pageSize = 1000
  let from = 0
  const rows: any[] = []

  while (true) {
    const { data, error } = await db
      .from('customer_rfmv_view')
      .select('*')
      .order('monetary_value', { ascending: false })
      .range(from, from + pageSize - 1)

    if (error) throw error

    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
    from += pageSize
  }

  return rows
}

export const rfmvService = {
  async getMonetaryDashboard(): Promise<MonetaryDashboardData> {
    const [data, purchasesData] = await Promise.all([
      fetchAllCustomerRfmvRows(),
      db
        .from('purchases')
        .select(
          'contact_id,date,smartleiloes_event_id,auction_id,value,payload',
        )
        .order('date', { ascending: false })
        .limit(5000),
    ])

    const purchaseProfiles = buildPurchaseProfiles(purchasesData.data || [])

    const rows = (data || []).map((row: any) => {
      const purchaseCount = Number(row.purchase_count || 0)
      const bidCount = Number(row.bid_count || 0)
      const bidValue = Number(row.bid_value || 0)
      const ghostScore =
        purchaseCount === 0 && bidCount > 0
          ? Math.min(
              100,
              Math.round(
                bidCount * 1.4 +
                  Math.min(45, bidValue / 8_000) +
                  Math.min(20, Number(row.auction_count || 0) * 4),
              ),
            )
          : 0

      return {
        ...row,
        purchase_count: purchaseCount,
        monetary_value: Number(row.monetary_value || 0),
        avg_ticket: Number(row.avg_ticket || 0),
        bid_count: bidCount,
        auction_count: Number(row.auction_count || 0),
        bid_value: bidValue,
        recency_score: Number(row.recency_score || 0),
        frequency_score: Number(row.frequency_score || 0),
        monetary_score: Number(row.monetary_score || 0),
        variety_score: Number(row.variety_score || 0),
        rfmv_score: Number(row.rfmv_score || 0),
        ghost_score: ghostScore,
        ...purchaseProfiles.get(row.id),
      }
    }) as CustomerRfmv[]

    const totalRevenue = rows.reduce((sum, row) => sum + row.monetary_value, 0)
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
      hotBuyers: rows
        .filter((row) => row.purchase_count > 0)
        .sort((a, b) => Number(b.heat_score || 0) - Number(a.heat_score || 0))
        .slice(0, 5),
      ghostBidders: rows
        .filter((row) => row.purchase_count === 0 && row.bid_count >= 5)
        .sort((a, b) => Number(b.ghost_score || 0) - Number(a.ghost_score || 0))
        .slice(0, 5),
    }
  },
}

const daysSince = (value?: string | null) => {
  if (!value) return 9999
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 9999
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000))
}

const eventKeyOf = (row: any) =>
  String(
    row.smartleiloes_event_id ||
      row.auction_id ||
      row.payload?.idEventoContrato ||
      row.payload?.idEvento ||
      row.date ||
      '',
  )

const buildPurchaseProfiles = (purchases: any[]) => {
  const byContact = new Map<
    string,
    {
      dates: string[]
      events: string[]
      recentValue: number
    }
  >()

  purchases.forEach((purchase) => {
    if (!purchase.contact_id) return
    const current = byContact.get(purchase.contact_id) || {
      dates: [],
      events: [],
      recentValue: 0,
    }
    const date = String(purchase.date || '')
    current.dates.push(date)

    const eventKey = eventKeyOf(purchase)
    if (eventKey && !current.events.includes(eventKey)) {
      current.events.push(eventKey)
    }

    if (daysSince(date) <= 180) {
      current.recentValue += Number(purchase.value || 0)
    }

    byContact.set(purchase.contact_id, current)
  })

  const profiles = new Map<
    string,
    { heat_score: number; streak_count: number; recent_purchase_value: number }
  >()

  byContact.forEach((profile, contactId) => {
    const uniqueDates = [...new Set(profile.dates.filter(Boolean))].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    )
    const lastDate = uniqueDates[0] || null
    const lastDays = daysSince(lastDate)
    const purchasesIn90 = uniqueDates.filter((date) => daysSince(date) <= 90)
    const purchasesIn180 = uniqueDates.filter((date) => daysSince(date) <= 180)
    const activeEvents = new Set(
      profile.events.filter((event) =>
        profile.dates.some((date) => daysSince(date) <= 180 && event),
      ),
    )
    const streakCount = Math.max(
      purchasesIn90.length,
      Math.min(purchasesIn180.length, activeEvents.size),
    )
    const recencyScore =
      lastDays <= 15
        ? 45
        : lastDays <= 30
          ? 38
          : lastDays <= 60
            ? 28
            : lastDays <= 90
              ? 20
              : lastDays <= 180
                ? 10
                : 0
    const streakScore = Math.min(30, streakCount * 8)
    const valueScore = Math.min(25, Math.round(profile.recentValue / 40_000))

    profiles.set(contactId, {
      heat_score: Math.min(100, recencyScore + streakScore + valueScore),
      streak_count: streakCount,
      recent_purchase_value: profile.recentValue,
    })
  })

  return profiles
}
