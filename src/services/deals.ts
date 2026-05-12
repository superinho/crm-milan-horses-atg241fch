import { supabase } from '@/lib/supabase/client'
import { Contact } from './contacts'

const db = supabase as any

export type DealStage =
  | 'Lead'
  | 'Qualificado'
  | 'Interesse'
  | 'Proposta'
  | 'Fechado'

export type Deal = {
  id: string
  contact_id?: string
  title: string
  stage: DealStage
  value: number
  probability?: number
  expected_close_date?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
  created: string
  updated: string
  contact?: Contact
}

export type DealTask = {
  id: string
  deal_id: string
  description: string
  is_completed: boolean
  created_at: string
}

const normalizeStage = (stage: string): DealStage => {
  const map: Record<string, DealStage> = {
    lead: 'Lead',
    qualified: 'Qualificado',
    negotiation: 'Interesse',
    proposal: 'Proposta',
    closed_won: 'Fechado',
    closed_lost: 'Fechado',
    Lead: 'Lead',
    Qualificado: 'Qualificado',
    Interesse: 'Interesse',
    Proposta: 'Proposta',
    Fechado: 'Fechado',
  }

  return map[stage] || 'Lead'
}

const mapDeal = (deal: any): Deal => ({
  id: deal.id,
  contact_id: deal.contact_id,
  title: deal.title,
  value: Number(deal.value || 0),
  probability: Number(deal.probability || 0),
  expected_close_date: deal.expected_close_date,
  notes: deal.notes,
  stage: normalizeStage(deal.stage),
  created_at: deal.created_at,
  updated_at: deal.updated_at,
  created: deal.created_at,
  updated: deal.updated_at,
  contact: deal.contacts as Contact | undefined,
})

export const dealsService = {
  async getDeals() {
    const { data, error } = await db
      .from('deals')
      .select('*, contacts(*)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(mapDeal)
  },

  async getDealsByContactId(contactId: string) {
    const { data, error } = await db
      .from('deals')
      .select('*, contacts(*)')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(mapDeal)
  },

  async getDealById(id: string) {
    const { data, error } = await db
      .from('deals')
      .select('*, contacts(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return mapDeal(data)
  },

  async createDeal(deal: any) {
    const payload = {
      title: deal.title,
      value: deal.value || 0,
      stage: deal.stage || 'Lead',
      contact_id: deal.contact_id || null,
      probability: deal.probability || 0,
      expected_close_date: deal.expected_close_date || null,
      notes: deal.notes || null,
    }

    const { data, error } = await db
      .from('deals')
      .insert(payload)
      .select('*, contacts(*)')
      .single()

    if (error) throw error
    return mapDeal(data)
  },

  async updateDeal(id: string, updates: any) {
    const payload = {
      ...updates,
      stage: updates.stage ? normalizeStage(updates.stage) : undefined,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await db
      .from('deals')
      .update(payload)
      .eq('id', id)
      .select('*, contacts(*)')
      .single()

    if (error) throw error
    return mapDeal(data)
  },

  async updateDealStage(id: string, stage: string) {
    return this.updateDeal(id, { stage })
  },

  async deleteDeal(id: string) {
    const { error } = await db.from('deals').delete().eq('id', id)
    if (error) throw error
  },

  async getDealTasks(dealId: string) {
    const { data, error } = await db
      .from('deal_tasks')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as DealTask[]
  },

  async addDealTask(dealId: string, description: string) {
    const { data, error } = await db
      .from('deal_tasks')
      .insert({ deal_id: dealId, description, is_completed: false })
      .select()
      .single()

    if (error) throw error
    return data as DealTask
  },

  async updateDealTask(id: string, updates: Partial<DealTask>) {
    const { data, error } = await db
      .from('deal_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as DealTask
  },

  async deleteDealTask(id: string) {
    const { error } = await db.from('deal_tasks').delete().eq('id', id)
    if (error) throw error
  },
}
