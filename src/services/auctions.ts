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
  source_url: string
  created: string
  updated: string
}

const mapAuction = (auction: any): Auction => ({
  id: auction.id,
  external_id: auction.smartleiloes_id,
  title: auction.title,
  value: Number(auction.value || 0),
  status: auction.status || 'Importado',
  event_date: auction.event_date,
  event_type: auction.event_type,
  source_url: auction.source_url || 'https://api.smartleiloes.digital/',
  created: auction.created_at,
  updated: auction.updated_at,
})

export const auctionsService = {
  async getAuctions() {
    const { data, error } = await db
      .from('smartleiloes_auctions')
      .select('*')
      .order('event_date', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false })

    if (error) throw error
    return (data || []).map(mapAuction)
  },

  async searchAuctions(query: string) {
    const { data, error } = await db
      .from('smartleiloes_auctions')
      .select('*')
      .or(
        `title.ilike.%${query}%,status.ilike.%${query}%,event_type.ilike.%${query}%`,
      )
      .order('event_date', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return (data || []).map(mapAuction)
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
