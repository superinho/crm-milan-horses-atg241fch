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
}
