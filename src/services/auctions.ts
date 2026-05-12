import { supabase } from '@/lib/supabase/client'

const db = supabase as any

export type Auction = {
  id: string
  external_id: string
  title: string
  value: number
  status: string
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
  source_url: auction.source_url || 'https://api.smartleiloes.digital/',
  created: auction.created_at,
  updated: auction.updated_at,
})

export const auctionsService = {
  async getAuctions() {
    const { data, error } = await db
      .from('smartleiloes_auctions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(mapAuction)
  },

  async searchAuctions(query: string) {
    const { data, error } = await db
      .from('smartleiloes_auctions')
      .select('*')
      .or(`title.ilike.%${query}%,status.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(25)

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
