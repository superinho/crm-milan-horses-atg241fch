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

export type GlobalAuctionSource = {
  id?: string
  name: string
  source_type?: string | null
  website_url?: string | null
  results_url?: string | null
  access_level?: string | null
  primary_source?: boolean | null
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
  breeder_name: string | null
  vendor_name: string | null
  buyer_name: string | null
  buyer_country: string | null
  sold_status: string
  hammer_price: number | null
  currency: string
  price_text: string | null
  confidence_score: number | null
  source_url: string | null
  global_auction_sources?: GlobalAuctionSource | null
  global_auctions?: {
    name: string
    auction_year: number | null
    auction_date: string | null
    category: string | null
    country?: string | null
    source_url?: string | null
    global_auction_sources?: GlobalAuctionSource | null
    global_auction_houses?: {
      name: string
      country: string | null
    } | null
  } | null
}

export type GlobalAuctionRankingMetrics = {
  lots: number
  sold_lots: number
  total_value_eur: number
  average_price_eur: number
  median_price_eur: number
  top_price_eur: number | null
  latest_year: number | null
  sell_through_rate: number
  premium_lots: number
}

export type GlobalAuctionSireRanking = GlobalAuctionRankingMetrics & {
  sire_name: string
}

export type GlobalAuctionDamSireRanking = GlobalAuctionRankingMetrics & {
  dam_sire_name: string
}

export type GlobalAuctionVendorRanking = GlobalAuctionRankingMetrics & {
  vendor_name: string
}

export type GlobalAuctionHouseRanking = GlobalAuctionRankingMetrics & {
  house_name: string
  country: string | null
  auctions: number
}

export type GlobalAuctionFilters = {
  search?: string
  period?: string
  years?: number[]
  status?: string
  category?: string
  house?: string
  country?: string
  source?: string
  sire?: string
  damSire?: string
  minConfidence?: number
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
  damSires: GlobalAuctionDamSireRanking[]
  vendors: GlobalAuctionVendorRanking[]
  houses: GlobalAuctionHouseRanking[]
  quality: GlobalAuctionDataQuality
}

export type GlobalAuctionDataQuality = {
  lots: number
  with_source_url: number
  with_price: number
  with_pedigree: number
  with_buyer: number
  high_confidence: number
  hippomundo_lots: number
  primary_source_lots: number
  sources: Array<{ name: string; lots: number }>
}

export type GlobalAuctionFilterOptions = {
  years: number[]
  sources: string[]
  houses: string[]
  countries: string[]
  categories: string[]
  sires: string[]
  damSires: string[]
  priceMin: number | null
  priceMax: number | null
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

const emptyQuality: GlobalAuctionDataQuality = {
  lots: 0,
  with_source_url: 0,
  with_price: 0,
  with_pedigree: 0,
  with_buyer: 0,
  high_confidence: 0,
  hippomundo_lots: 0,
  primary_source_lots: 0,
  sources: [],
}

const isMissingMarketSchema = (error: unknown) => {
  const message = String((error as { message?: string })?.message || error)
  return (
    message.includes('global_auction') ||
    message.includes('schema cache') ||
    message.includes('does not exist')
  )
}

const resolveAuctionIdsForFilters = async (
  filters: GlobalAuctionFilters = {},
) => {
  const shouldFilterAuctions =
    (filters.category && filters.category !== 'all') ||
    (filters.house && filters.house !== 'all') ||
    (filters.country && filters.country !== 'all') ||
    (filters.source && filters.source !== 'all') ||
    Boolean(filters.years?.length) ||
    Boolean(filters.period && !['all', 'years'].includes(filters.period))

  if (!shouldFilterAuctions) return null

  const { data, error } = await db.from('global_auctions').select(`
    id,
    category,
    auction_year,
    auction_date,
    country,
    global_auction_sources ( name ),
    global_auction_houses ( name, country )
  `)
  if (error) throw error

  const cutoff =
    filters.period && !['all', 'years'].includes(filters.period)
      ? periodCutoff(filters.period)
      : null

  return (data || [])
    .filter((row: any) => {
      const house = row.global_auction_houses
      const source = row.global_auction_sources
      const country = row.country || house?.country || null

      if (
        filters.category &&
        filters.category !== 'all' &&
        row.category !== filters.category
      ) {
        return false
      }
      if (filters.years?.length && !filters.years.includes(row.auction_year)) {
        return false
      }
      if (cutoff && (!row.auction_date || row.auction_date < cutoff)) {
        return false
      }
      if (
        filters.house &&
        filters.house !== 'all' &&
        house?.name !== filters.house
      ) {
        return false
      }
      if (
        filters.country &&
        filters.country !== 'all' &&
        country !== filters.country
      ) {
        return false
      }
      if (
        filters.source &&
        filters.source !== 'all' &&
        source?.name !== filters.source
      ) {
        return false
      }
      return true
    })
    .map((row: { id: string }) => row.id)
}

const applyLotFilters = (
  query: any,
  filters: GlobalAuctionFilters = {},
  auctionIds: string[] | null = null,
) => {
  let next = query
  const search = filters.search?.trim()

  if (search) {
    const value = search.replace(/[%_]/g, '')
    next = next.or(
      `horse_name.ilike.%${value}%,sire_name.ilike.%${value}%,dam_name.ilike.%${value}%,dam_sire_name.ilike.%${value}%,vendor_name.ilike.%${value}%,breeder_name.ilike.%${value}%,buyer_name.ilike.%${value}%`,
    )
  }

  if (filters.status && filters.status !== 'all') {
    next = next.eq('sold_status', filters.status)
  }

  if (filters.sire && filters.sire !== 'all') {
    next = next.eq('sire_name', filters.sire)
  }

  if (filters.damSire && filters.damSire !== 'all') {
    next = next.eq('dam_sire_name', filters.damSire)
  }

  if (auctionIds) {
    next = auctionIds.length
      ? next.in('auction_id', auctionIds)
      : next.in('auction_id', ['00000000-0000-0000-0000-000000000000'])
  }

  if (typeof filters.minPrice === 'number') {
    next = next.gte('hammer_price', filters.minPrice)
  }

  if (typeof filters.maxPrice === 'number') {
    next = next.lte('hammer_price', filters.maxPrice)
  }

  if (typeof filters.minConfidence === 'number') {
    next = next.gte('confidence_score', filters.minConfidence)
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
  global_auction_sources (
    name,
    source_type,
    website_url,
    results_url,
    access_level
  ),
  global_auctions!inner (
    name,
    auction_year,
    auction_date,
    country,
    category,
    source_url,
    global_auction_sources (
      name,
      source_type,
      website_url,
      results_url,
      access_level
    ),
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

type RankingAccumulator = GlobalAuctionRankingMetrics & {
  displayName: string
  prices: number[]
}

const premiumLotThreshold = 50000

const normalizeRankingKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toUpperCase()

const createRankingAccumulator = (displayName: string): RankingAccumulator => ({
  displayName,
  lots: 0,
  sold_lots: 0,
  total_value_eur: 0,
  average_price_eur: 0,
  median_price_eur: 0,
  top_price_eur: null,
  latest_year: null,
  sell_through_rate: 0,
  premium_lots: 0,
  prices: [],
})

const addRankingLot = (
  map: Map<string, RankingAccumulator>,
  rawName: string | null | undefined,
  lot: GlobalAuctionLot,
) => {
  const displayName = rawName?.trim()
  if (!displayName) return

  const key = normalizeRankingKey(displayName)
  if (!key) return

  const current = map.get(key) || createRankingAccumulator(displayName)
  const price = Number(lot.hammer_price || 0)
  const isSold = lot.sold_status === 'sold' && price > 0
  const year = lot.global_auctions?.auction_year || null

  current.lots += 1
  if (isSold) {
    current.sold_lots += 1
    current.total_value_eur += price
    current.prices.push(price)
    current.top_price_eur = Math.max(Number(current.top_price_eur || 0), price)
    if (price >= premiumLotThreshold) current.premium_lots += 1
  }

  if (year) {
    current.latest_year = Math.max(Number(current.latest_year || 0), year)
  }

  map.set(key, current)
}

const sourceNameOf = (lot: GlobalAuctionLot) =>
  lot.global_auction_sources?.name ||
  lot.global_auctions?.global_auction_sources?.name ||
  (lot.source_url?.includes('hippomundo.com') ? 'Hippomundo' : null) ||
  (lot.global_auctions?.source_url?.includes('hippomundo.com')
    ? 'Hippomundo'
    : null) ||
  'Fonte não identificada'

const sourceKeyOf = (value: string) => normalizeRankingKey(value)

const finalizeRanking = <T extends GlobalAuctionRankingMetrics>(
  map: Map<string, RankingAccumulator>,
  createRow: (name: string, metrics: GlobalAuctionRankingMetrics) => T,
  limit = 8,
) =>
  [...map.values()]
    .map((row) => {
      const metrics: GlobalAuctionRankingMetrics = {
        lots: row.lots,
        sold_lots: row.sold_lots,
        total_value_eur: row.total_value_eur,
        average_price_eur: row.sold_lots
          ? row.total_value_eur / row.sold_lots
          : 0,
        median_price_eur: median(row.prices),
        top_price_eur: row.top_price_eur,
        latest_year: row.latest_year,
        sell_through_rate: row.lots ? row.sold_lots / row.lots : 0,
        premium_lots: row.premium_lots,
      }
      return createRow(row.displayName, metrics)
    })
    .sort(
      (a, b) =>
        b.total_value_eur - a.total_value_eur ||
        b.sold_lots - a.sold_lots ||
        Number(b.top_price_eur || 0) - Number(a.top_price_eur || 0),
    )
    .slice(0, limit)

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

  const sireMap = new Map<string, RankingAccumulator>()
  const damSireMap = new Map<string, RankingAccumulator>()
  const vendorMap = new Map<string, RankingAccumulator>()
  const houseMap = new Map<string, RankingAccumulator>()
  const houseCountries = new Map<string, string | null>()
  const houseAuctionIds = new Map<string, Set<string>>()
  const sourceCounts = new Map<string, { name: string; lots: number }>()

  rows.forEach((lot) => {
    const house = lot.global_auctions?.global_auction_houses
    const houseName = house?.name?.trim()
    const sourceName = sourceNameOf(lot)
    const sourceKey = sourceKeyOf(sourceName)

    addRankingLot(sireMap, lot.sire_name, lot)
    addRankingLot(damSireMap, lot.dam_sire_name, lot)
    addRankingLot(vendorMap, lot.vendor_name || lot.breeder_name, lot)
    sourceCounts.set(sourceKey, {
      name: sourceName,
      lots: (sourceCounts.get(sourceKey)?.lots || 0) + 1,
    })

    if (houseName) {
      const key = normalizeRankingKey(houseName)
      addRankingLot(houseMap, houseName, lot)
      houseCountries.set(key, house?.country || null)
      const set = houseAuctionIds.get(key) || new Set<string>()
      set.add(lot.auction_id)
      houseAuctionIds.set(key, set)
    }
  })

  const sires = finalizeRanking<GlobalAuctionSireRanking>(
    sireMap,
    (name, metrics) => ({ sire_name: name, ...metrics }),
  )

  const damSires = finalizeRanking<GlobalAuctionDamSireRanking>(
    damSireMap,
    (name, metrics) => ({ dam_sire_name: name, ...metrics }),
  )

  const vendors = finalizeRanking<GlobalAuctionVendorRanking>(
    vendorMap,
    (name, metrics) => ({ vendor_name: name, ...metrics }),
  )

  const houses = finalizeRanking<GlobalAuctionHouseRanking>(
    houseMap,
    (name, metrics) => {
      const key = normalizeRankingKey(name)
      return {
        house_name: name,
        country: houseCountries.get(key) || null,
        auctions: houseAuctionIds.get(key)?.size || 0,
        ...metrics,
      }
    },
  )

  const quality: GlobalAuctionDataQuality = {
    lots: rows.length,
    with_source_url: rows.filter(
      (lot) => lot.source_url || lot.global_auctions?.source_url,
    ).length,
    with_price: soldRows.length,
    with_pedigree: rows.filter(
      (lot) => lot.sire_name && (lot.dam_name || lot.dam_sire_name),
    ).length,
    with_buyer: rows.filter((lot) => lot.buyer_name).length,
    high_confidence: rows.filter(
      (lot) => Number(lot.confidence_score || 0) >= 80,
    ).length,
    hippomundo_lots: rows.filter((lot) =>
      sourceNameOf(lot).toLowerCase().includes('hippomundo'),
    ).length,
    primary_source_lots: rows.filter(
      (lot) =>
        lot.global_auction_sources?.primary_source ||
        lot.global_auctions?.global_auction_sources?.primary_source ||
        sourceNameOf(lot).toLowerCase().includes('hippomundo'),
    ).length,
    sources: [...sourceCounts.values()]
      .sort((a, b) => b.lots - a.lots)
      .slice(0, 5),
  }

  return { overview, sires, damSires, vendors, houses, quality }
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
      const auctionIds = await resolveAuctionIdsForFilters(filters)

      const query = applyLotFilters(
        db.from('global_auction_lots').select(lotSelect, { count: 'exact' }),
        filters,
        auctionIds,
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
      const auctionIds = await resolveAuctionIdsForFilters(filters)

      while (true) {
        const query = applyLotFilters(
          db
            .from('global_auction_lots')
            .select(lotSelect)
            .range(from, from + pageSize - 1),
          filters,
          auctionIds,
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
        return {
          overview: emptyOverview,
          sires: [],
          damSires: [],
          vendors: [],
          houses: [],
          quality: emptyQuality,
        }
      }
      throw error
    }
  },

  async getFilterOptions(): Promise<GlobalAuctionFilterOptions> {
    try {
      const { data, error } = await db
        .from('global_auction_lots')
        .select(
          `
          sire_name,
          dam_sire_name,
          hammer_price,
          global_auction_sources ( name ),
          global_auctions (
            auction_year,
            category,
            country,
            global_auction_sources ( name ),
            global_auction_houses ( name, country )
          )
        `,
        )
        .limit(5000)

      if (error) throw error

      const rows = (data || []) as GlobalAuctionLot[]
      const prices = rows
        .map((row) => Number(row.hammer_price || 0))
        .filter((price) => price > 0)

      const values = (items: Array<string | null | undefined>) =>
        [
          ...new Set(
            items.map((item) => item?.trim()).filter(Boolean) as string[],
          ),
        ]
          .sort((a, b) => a.localeCompare(b, 'pt-BR'))
          .slice(0, 200)

      return {
        years: [
          ...new Set(
            rows
              .map((row) => row.global_auctions?.auction_year)
              .filter((year): year is number => typeof year === 'number'),
          ),
        ].sort((a, b) => b - a),
        sources: values(rows.map((row) => sourceNameOf(row))),
        houses: values(
          rows.map((row) => row.global_auctions?.global_auction_houses?.name),
        ),
        countries: values(
          rows.map(
            (row) =>
              row.global_auctions?.country ||
              row.global_auctions?.global_auction_houses?.country,
          ),
        ),
        categories: values(rows.map((row) => row.global_auctions?.category)),
        sires: values(rows.map((row) => row.sire_name)),
        damSires: values(rows.map((row) => row.dam_sire_name)),
        priceMin: prices.length ? Math.min(...prices) : null,
        priceMax: prices.length ? Math.max(...prices) : null,
      }
    } catch (error) {
      if (isMissingMarketSchema(error)) {
        return {
          years: [],
          sources: [],
          houses: [],
          countries: [],
          categories: [],
          sires: [],
          damSires: [],
          priceMin: null,
          priceMax: null,
        }
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
