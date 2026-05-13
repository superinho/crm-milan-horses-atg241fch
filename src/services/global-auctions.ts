import { supabase } from '@/lib/supabase/client'

const db = supabase as any

export type GlobalAuctionOverview = {
  auctions: number
  lots: number
  sold_lots: number
  unsold_or_withdrawn_lots: number
  total_sold_value_eur: number
  average_price_eur: number
  median_price_eur: number
  top_price_eur: number | null
  first_year: number | null
  latest_year: number | null
}

export type GlobalAuctionLot = {
  id: string
  auction_id: string
  lot_number: string | null
  horse_name: string
  birth_year: number | null
  age: number | null
  sex: string | null
  studbook: string | null
  sire_name: string | null
  dam_name: string | null
  dam_sire_name: string | null
  vendor_name: string | null
  buyer_name: string | null
  buyer_country: string | null
  sold_status: string
  hammer_price: number | null
  currency: string
  price_text: string | null
  confidence_score: number | null
  source_url: string | null
  global_auctions?: {
    name: string
    auction_year: number | null
    auction_date: string | null
    category: string | null
    global_auction_houses?: {
      name: string
      country: string | null
    } | null
  } | null
}

export type GlobalAuctionSireRanking = {
  sire_name: string
  lots: number
  sold_lots: number
  total_value_eur: number
  average_price_eur: number
  top_price_eur: number | null
  latest_year: number | null
}

export type GlobalAuctionHouseRanking = {
  house_name: string
  country: string | null
  auctions: number
  lots: number
  sold_lots: number
  total_value_eur: number
  average_price_eur: number
  top_price_eur: number | null
  latest_year: number | null
}

export type GlobalAuctionFilters = {
  search?: string
  period?: string
  years?: number[]
  status?: string
  category?: string
  minPrice?: number
  maxPrice?: number
}

export type GlobalAuctionLotPage = {
  rows: GlobalAuctionLot[]
  total: number
}

export type GlobalAuctionMarketSummary = {
  overview: GlobalAuctionOverview
  sires: GlobalAuctionSireRanking[]
  houses: GlobalAuctionHouseRanking[]
}

const emptyOverview: GlobalAuctionOverview = {
  auctions: 0,
  lots: 0,
  sold_lots: 0,
  unsold_or_withdrawn_lots: 0,
  total_sold_value_eur: 0,
  average_price_eur: 0,
  median_price_eur: 0,
  top_price_eur: null,
  first_year: null,
  latest_year: null,
}

const isMissingMarketSchema = (error: unknown) => {
  const message = String((error as { message?: string })?.message || error)
  return (
    message.includes('global_auction') ||
    message.includes('schema cache') ||
    message.includes('does not exist')
  )
}

const applyLotFilters = (query: any, filters: GlobalAuctionFilters = {}) => {
  let next = query
  const search = filters.search?.trim()

  if (search) {
    const value = search.replace(/[%_]/g, '')
    next = next.or(
      `horse_name.ilike.%${value}%,sire_name.ilike.%${value}%,dam_name.ilike.%${value}%,dam_sire_name.ilike.%${value}%,vendor_name.ilike.%${value}%,buyer_name.ilike.%${value}%`,
    )
  }

  if (filters.status && filters.status !== 'all') {
    next = next.eq('sold_status', filters.status)
  }

  if (filters.category && filters.category !== 'all') {
    next = next.eq('global_auctions.category', filters.category)
  }

  if (filters.years?.length) {
    next = next.in('global_auctions.auction_year', filters.years)
  }

  if (filters.period && !['all', 'years'].includes(filters.period)) {
    const cutoff = periodCutoff(filters.period)
    if (cutoff) {
      next = next.gte('global_auctions.auction_date', cutoff)
    }
  }

  if (typeof filters.minPrice === 'number') {
    next = next.gte('hammer_price', filters.minPrice)
  }

  if (typeof filters.maxPrice === 'number') {
    next = next.lte('hammer_price', filters.maxPrice)
  }

  return next
}

const periodCutoff = (period?: string) => {
  const now = new Date()
  const next = new Date(now)

  if (period === '30d') next.setDate(now.getDate() - 30)
  else if (period === '3m') next.setMonth(now.getMonth() - 3)
  else if (period === '1y') next.setFullYear(now.getFullYear() - 1)
  else return null

  return next.toISOString().slice(0, 10)
}

const lotSelect = `
  *,
  global_auctions!inner (
    name,
    auction_year,
    auction_date,
    category,
    global_auction_houses (
      name,
      country
    )
  )
`

const median = (values: number[]) => {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}

const summarizeLots = (
  rows: GlobalAuctionLot[],
): GlobalAuctionMarketSummary => {
  const soldRows = rows.filter(
    (lot) => lot.sold_status === 'sold' && Number(lot.hammer_price || 0) > 0,
  )
  const soldValues = soldRows.map((lot) => Number(lot.hammer_price || 0))
  const auctionIds = new Set(rows.map((lot) => lot.auction_id))
  const years = rows
    .map((lot) => lot.global_auctions?.auction_year)
    .filter((year): year is number => typeof year === 'number')

  const overview: GlobalAuctionOverview = {
    auctions: auctionIds.size,
    lots: rows.length,
    sold_lots: soldRows.length,
    unsold_or_withdrawn_lots: rows.length - soldRows.length,
    total_sold_value_eur: soldValues.reduce((sum, value) => sum + value, 0),
    average_price_eur: soldValues.length
      ? soldValues.reduce((sum, value) => sum + value, 0) / soldValues.length
      : 0,
    median_price_eur: median(soldValues),
    top_price_eur: soldValues.length ? Math.max(...soldValues) : null,
    first_year: years.length ? Math.min(...years) : null,
    latest_year: years.length ? Math.max(...years) : null,
  }

  const sireMap = new Map<string, GlobalAuctionSireRanking>()
  const houseMap = new Map<string, GlobalAuctionHouseRanking>()

  rows.forEach((lot) => {
    const price = Number(lot.hammer_price || 0)
    const isSold = lot.sold_status === 'sold' && price > 0
    const year = lot.global_auctions?.auction_year || null
    const sireName = lot.sire_name?.trim()
    const house = lot.global_auctions?.global_auction_houses
    const houseName = house?.name?.trim()

    if (sireName) {
      const current =
        sireMap.get(sireName) ||
        ({
          sire_name: sireName,
          lots: 0,
          sold_lots: 0,
          total_value_eur: 0,
          average_price_eur: 0,
          top_price_eur: null,
          latest_year: null,
        } satisfies GlobalAuctionSireRanking)
      current.lots += 1
      if (isSold) {
        current.sold_lots += 1
        current.total_value_eur += price
        current.top_price_eur = Math.max(
          Number(current.top_price_eur || 0),
          price,
        )
      }
      if (year)
        current.latest_year = Math.max(Number(current.latest_year || 0), year)
      sireMap.set(sireName, current)
    }

    if (houseName) {
      const current =
        houseMap.get(houseName) ||
        ({
          house_name: houseName,
          country: house?.country || null,
          auctions: 0,
          lots: 0,
          sold_lots: 0,
          total_value_eur: 0,
          average_price_eur: 0,
          top_price_eur: null,
          latest_year: null,
        } satisfies GlobalAuctionHouseRanking)
      current.lots += 1
      if (isSold) {
        current.sold_lots += 1
        current.total_value_eur += price
        current.top_price_eur = Math.max(
          Number(current.top_price_eur || 0),
          price,
        )
      }
      if (year)
        current.latest_year = Math.max(Number(current.latest_year || 0), year)
      houseMap.set(houseName, current)
    }
  })

  const sires = [...sireMap.values()]
    .map((row) => ({
      ...row,
      average_price_eur: row.sold_lots
        ? row.total_value_eur / row.sold_lots
        : 0,
    }))
    .sort((a, b) => b.total_value_eur - a.total_value_eur)
    .slice(0, 8)

  const houseAuctionIds = new Map<string, Set<string>>()
  rows.forEach((lot) => {
    const houseName = lot.global_auctions?.global_auction_houses?.name
    if (!houseName) return
    const set = houseAuctionIds.get(houseName) || new Set<string>()
    set.add(lot.auction_id)
    houseAuctionIds.set(houseName, set)
  })

  const houses = [...houseMap.values()]
    .map((row) => ({
      ...row,
      auctions: houseAuctionIds.get(row.house_name)?.size || 0,
      average_price_eur: row.sold_lots
        ? row.total_value_eur / row.sold_lots
        : 0,
    }))
    .sort((a, b) => b.total_value_eur - a.total_value_eur)
    .slice(0, 8)

  return { overview, sires, houses }
}

export const globalAuctionsService = {
  async getOverview(): Promise<GlobalAuctionOverview> {
    try {
      const { data, error } = await db
        .from('global_auction_market_overview')
        .select('*')
        .single()
      if (error) throw error
      return data || emptyOverview
    } catch (error) {
      if (isMissingMarketSchema(error)) return emptyOverview
      throw error
    }
  },

  async getLots(
    filters: GlobalAuctionFilters = {},
    pagination: { page?: number; pageSize?: number } = {},
  ): Promise<GlobalAuctionLotPage> {
    try {
      const page = Math.max(1, pagination.page || 1)
      const pageSize = Math.min(100, Math.max(10, pagination.pageSize || 25))
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const query = applyLotFilters(
        db.from('global_auction_lots').select(lotSelect, { count: 'exact' }),
        filters,
      )
        .order('hammer_price', { ascending: false, nullsFirst: false })
        .range(from, to)

      const { data, error, count } = await query
      if (error) throw error

      return {
        rows: data || [],
        total: count || 0,
      }
    } catch (error) {
      if (isMissingMarketSchema(error)) return { rows: [], total: 0 }
      throw error
    }
  },

  async getMarketSummary(
    filters: GlobalAuctionFilters = {},
  ): Promise<GlobalAuctionMarketSummary> {
    try {
      const pageSize = 1000
      let from = 0
      const rows: GlobalAuctionLot[] = []

      while (true) {
        const query = applyLotFilters(
          db
            .from('global_auction_lots')
            .select(lotSelect)
            .range(from, from + pageSize - 1),
          filters,
        )

        const { data, error } = await query
        if (error) throw error

        rows.push(...((data || []) as GlobalAuctionLot[]))
        if (!data || data.length < pageSize) break
        from += pageSize
      }

      return summarizeLots(rows)
    } catch (error) {
      if (isMissingMarketSchema(error)) {
        return { overview: emptyOverview, sires: [], houses: [] }
      }
      throw error
    }
  },

  async getAvailableYears(): Promise<number[]> {
    try {
      const { data, error } = await db
        .from('global_auctions')
        .select('auction_year')
        .not('auction_year', 'is', null)
        .order('auction_year', { ascending: false })
      if (error) throw error

      return [
        ...new Set(
          (data || [])
            .map((row: { auction_year: number | null }) => row.auction_year)
            .filter((year: number | null): year is number => Boolean(year)),
        ),
      ]
    } catch (error) {
      if (isMissingMarketSchema(error)) return []
      throw error
    }
  },

  async getSireRankings(): Promise<GlobalAuctionSireRanking[]> {
    try {
      const { data, error } = await db
        .from('global_auction_sire_rankings')
        .select('*')
        .order('total_value_eur', { ascending: false })
        .limit(8)
      if (error) throw error
      return data || []
    } catch (error) {
      if (isMissingMarketSchema(error)) return []
      throw error
    }
  },

  async getHouseRankings(): Promise<GlobalAuctionHouseRanking[]> {
    try {
      const { data, error } = await db
        .from('global_auction_house_rankings')
        .select('*')
        .order('total_value_eur', { ascending: false })
        .limit(8)
      if (error) throw error
      return data || []
    } catch (error) {
      if (isMissingMarketSchema(error)) return []
      throw error
    }
  },
}
