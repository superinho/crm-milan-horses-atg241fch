import { supabase } from '@/lib/supabase/client'

export interface SmartLeilao {
  id: string | number
  title?: string
  name?: string
  status?: string
  date?: string
  start_date?: string
  description?: string
  [key: string]: any
}

const db = supabase as any

export const smartLeiloesService = {
  async getLeiloes(): Promise<{ data: SmartLeilao[]; error: string | null }> {
    try {
      const { data, error } = await db
        .from('smartleiloes_auctions')
        .select('*')
        .order('event_date', { ascending: false })
        .limit(200)

      if (error) throw error

      return {
        data: (data || []).map((auction: any) => ({
          id: auction.smartleiloes_id,
          title: auction.title,
          name: auction.title,
          status: auction.status,
          date: auction.event_date,
          start_date: auction.event_date,
          value: Number(auction.value || 0),
          description:
            auction.payload?.descricaoEvento || auction.event_type || '',
          ...auction.payload,
        })),
        error: null,
      }
    } catch (error: any) {
      return {
        data: [],
        error: `Não foi possível carregar leilões reais sincronizados: ${error.message}`,
      }
    }
  },

  async getLots(params?: {
    search?: string
    sortBy?: string
    sortDirection?: 'asc' | 'desc'
  }) {
    try {
      let query = db
        .from('smartleiloes_lots')
        .select('*, auction:smartleiloes_auctions(title)')

      if (params?.search) {
        query = query.ilike('title', `%${params.search}%`)
      }

      if (params?.sortBy === 'value') {
        query = query.order('value', {
          ascending: params.sortDirection === 'asc',
          nullsFirst: false,
        })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query.limit(200)
      if (error) throw error

      return { data, error: null }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  },
}
