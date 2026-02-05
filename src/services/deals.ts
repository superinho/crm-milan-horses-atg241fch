import { supabase } from '@/lib/supabase/client'
import { Contact } from './contacts'

export type DealStage =
  | 'Lead'
  | 'Qualificado'
  | 'Interesse'
  | 'Proposta'
  | 'Fechado'

export type Deal = {
  id: string
  contact_id: string
  title: string
  stage: DealStage
  value: number
  probability: number
  expected_close_date: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  contact?: Contact
}

export type DealTask = {
  id: string
  deal_id: string
  description: string
  is_completed: boolean
  created_at: string
}

export type DealInsert = Omit<
  Deal,
  'id' | 'created_at' | 'updated_at' | 'contact'
>
export type DealUpdate = Partial<DealInsert>

export const dealsService = {
  async getDeals() {
    const { data, error } = await supabase
      .from('deals')
      .select(
        `
        *,
        contact:contacts(*)
      `,
      )
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Deal[]
  },

  async getDealById(id: string) {
    const { data, error } = await supabase
      .from('deals')
      .select(
        `
        *,
        contact:contacts(*)
      `,
      )
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Deal
  },

  async getDealsByContactId(contactId: string) {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Deal[]
  },

  async createDeal(deal: DealInsert) {
    const { data, error } = await supabase
      .from('deals')
      .insert(deal)
      .select()
      .single()

    if (error) throw error
    return data as Deal
  },

  async updateDeal(id: string, updates: DealUpdate | { notes: string }) {
    const { data, error } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Deal
  },

  async updateDealStage(id: string, stage: string) {
    const { data, error } = await supabase
      .from('deals')
      .update({ stage })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Deal
  },

  async deleteDeal(id: string) {
    const { error } = await supabase.from('deals').delete().eq('id', id)

    if (error) throw error
  },

  // Task methods
  async getDealTasks(dealId: string) {
    const { data, error } = await supabase
      .from('deal_tasks')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as DealTask[]
  },

  async addDealTask(dealId: string, description: string) {
    const { data, error } = await supabase
      .from('deal_tasks')
      .insert({ deal_id: dealId, description })
      .select()
      .single()

    if (error) throw error
    return data as DealTask
  },

  async updateDealTask(id: string, updates: Partial<DealTask>) {
    const { data, error } = await supabase
      .from('deal_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as DealTask
  },

  async deleteDealTask(id: string) {
    const { error } = await supabase.from('deal_tasks').delete().eq('id', id)

    if (error) throw error
  },
}
