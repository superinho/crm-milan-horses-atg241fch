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
  year?: string
  status?: string
  category?: string
  minPrice?: number
  maxPrice?: number
}

export type GlobalAuctionLotPage = {
  rows: GlobalAuctionLot[]
  total: number
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

  if (filters.year && filters.year !== 'all') {
    next = next.eq('global_auctions.auction_year', Number(filters.year))
  }

  if (typeof filters.minPrice === 'number') {
    next = next.gte('hammer_price', filters.minPrice)
  }

  if (typeof filters.maxPrice === 'number') {
    next = next.lte('hammer_price', filters.maxPrice)
  }

  return next
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
        db.from('global_auction_lots').select(
          `
              *,
              global_auctions!inner (
                name,
                auction_year,
                category,
                global_auction_houses (
                  name,
                  country
                )
              )
            `,
          { count: 'exact' },
        ),
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
