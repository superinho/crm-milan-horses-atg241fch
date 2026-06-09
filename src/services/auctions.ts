import { supabase } from '@/lib/supabase/client'

const db = supabase as any

export type Auction = {
  id: string
  external_id: string
  title: string
  value: number
  status: string
  event_date: string | null
  event_type: string | null
  lot_count: number
  sold_lot_count: number
  total_lot_value: number
  top_lot_value: number
  source_url: string
  created: string
  updated: string
}

type LotAggregate = {
  lot_count: number
  sold_lot_count: number
  total_lot_value: number
  top_lot_value: number
}

const emptyAggregate: LotAggregate = {
  lot_count: 0,
  sold_lot_count: 0,
  total_lot_value: 0,
  top_lot_value: 0,
}

const mapAuction = (auction: any, aggregate = emptyAggregate): Auction => ({
  id: auction.id,
  external_id: auction.smartleiloes_id,
  title: auction.title,
  value: Number(auction.value || 0),
  status: auction.status || 'Importado',
  event_date: auction.event_date,
  event_type: auction.event_type,
  lot_count: aggregate.lot_count,
  sold_lot_count: aggregate.sold_lot_count,
  total_lot_value: aggregate.total_lot_value,
  top_lot_value: aggregate.top_lot_value,
  source_url: auction.source_url || 'https://api.smartleiloes.digital/',
  created: auction.created_at,
  updated: auction.updated_at,
})

const fetchAllRows = async (table: string, columns: string) => {
  const rows: any[] = []
  const pageSize = 1000

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db
      .from(table)
      .select(columns)
      .range(from, from + pageSize - 1)

    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
  }

  return rows
}

const lotAggregatesByAuction = async () => {
  const lots = await fetchAllRows(
    'smartleiloes_lots',
    'auction_id,auction_smartleiloes_id,value,commercial_status',
  )
  const byAuction = new Map<string, LotAggregate>()

  for (const lot of lots) {
    const keys = [lot.auction_id, lot.auction_smartleiloes_id].filter(Boolean)
    const value = Number(lot.value || 0)
    const status = String(lot.commercial_status || '').toLowerCase()
    const isSold =
      status.includes('vend') ||
      status.includes('contrat') ||
      status.includes('arremat')

    for (const key of keys) {
      const current = byAuction.get(String(key)) || { ...emptyAggregate }
      byAuction.set(String(key), {
        lot_count: current.lot_count + 1,
        sold_lot_count: current.sold_lot_count + (isSold ? 1 : 0),
        total_lot_value: current.total_lot_value + value,
        top_lot_value: Math.max(current.top_lot_value, value),
      })
    }
  }

  return byAuction
}

export const auctionsService = {
  async getAuctions() {
    const [auctions, aggregates] = await Promise.all([
      fetchAllRows('smartleiloes_auctions', '*'),
      lotAggregatesByAuction(),
    ])

    return auctions
      .map((auction) => {
        const aggregate =
          aggregates.get(String(auction.id)) ||
          aggregates.get(String(auction.smartleiloes_id)) ||
          emptyAggregate
        return mapAuction(auction, aggregate)
      })
      .sort(
        (a, b) =>
          String(b.event_date || '').localeCompare(String(a.event_date || '')) ||
          String(b.updated || '').localeCompare(String(a.updated || '')),
      )
  },

  async searchAuctions(query: string) {
    const normalized = query.trim().toLowerCase()
    const auctions = await this.getAuctions()
    if (!normalized) return auctions

    return auctions.filter((auction) =>
      [
        auction.title,
        auction.status,
        auction.event_type,
        auction.external_id,
        formatCurrencySearch(auction.value),
        formatCurrencySearch(auction.total_lot_value),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    )
  },

  async saveAuction(data: Omit<Auction, 'id' | 'created' | 'updated'>) {
    const { data: auction, error } = await db
      .from('smartleiloes_auctions')
      .upsert(
        {
          smartleiloes_id: data.external_id,
          title: data.title,
          value: data.value || 0,
          status: data.status || 'Importado',
          event_date: data.event_date,
          event_type: data.event_type,
          source_url: data.source_url || 'https://api.smartleiloes.digital/',
          payload: data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'smartleiloes_id' },
      )
      .select()
      .single()

    if (error) throw error
    return mapAuction(auction)
  },
}

const formatCurrencySearch = (value: number) =>
  Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
