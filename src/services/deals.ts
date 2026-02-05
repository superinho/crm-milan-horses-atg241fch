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
  created_at: string
  updated_at: string
  contact?: Contact
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

  async createDeal(deal: DealInsert) {
    const { data, error } = await supabase
      .from('deals')
      .insert(deal)
      .select()
      .single()

    if (error) throw error
    return data as Deal
  },

  async updateDeal(id: string, updates: DealUpdate) {
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
}
