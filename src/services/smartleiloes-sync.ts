import { supabase } from '@/lib/supabase/client'

export type SmartLeiloesSyncCounter = {
  fetched: number
  saved: number
  failed: number
}

export type SmartLeiloesSyncSummary = Record<string, SmartLeiloesSyncCounter>

export type SmartLeiloesSyncRun = {
  id: string
  status: string
  started_at: string | null
  finished_at: string | null
  summary: SmartLeiloesSyncSummary | null
  error_message: string | null
  created_at: string | null
}

export const smartLeiloesSyncService = {
  async syncAll(scope: 'contacts' | 'auctions' | 'commercial' | 'all' = 'all') {
    const { data, error } = await supabase.functions.invoke<{
      status: string
      summary: SmartLeiloesSyncSummary
      error?: string
    }>('sync-smartleiloes', {
      body: { scope },
    })

    if (error) {
      const response = (error as any).context
      if (response instanceof Response) {
        const payload = await response.json().catch(() => null)
        throw new Error(
          payload?.error ||
            payload?.message ||
            payload?.msg ||
            error.message ||
            'Erro na Edge Function de sincronização.',
        )
      }
      throw error
    }
    if (data?.status === 'error') throw new Error(data.error)

    return data?.summary || {}
  },

  async syncContacts() {
    return this.syncAll('contacts')
  },

  async getLatestRuns(limit = 5): Promise<SmartLeiloesSyncRun[]> {
    const db = supabase as any
    const { data, error } = await db
      .from('smartleiloes_sync_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []) as SmartLeiloesSyncRun[]
  },
}
