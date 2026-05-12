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

type SmartLeiloesSyncScope = 'contacts' | 'auctions' | 'commercial' | 'all'

const invokeSmartLeiloesSync = async (
  scope: Exclude<SmartLeiloesSyncScope, 'all'>,
) => {
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
}

export const smartLeiloesSyncService = {
  async syncAll(scope: SmartLeiloesSyncScope = 'all') {
    if (scope !== 'all') return invokeSmartLeiloesSync(scope)

    const combined: SmartLeiloesSyncSummary = {}

    for (const nextScope of ['contacts', 'auctions', 'commercial'] as const) {
      Object.assign(combined, await invokeSmartLeiloesSync(nextScope))
    }

    return combined
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
