import pb from '@/lib/pocketbase/client'
import { Contact } from './contacts'

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
  created: string
  updated: string
  contact?: Contact
}

const stageToDb = (stage: string) => {
  if (stage === 'Lead') return 'lead'
  if (stage === 'Qualificado') return 'qualified'
  if (stage === 'Interesse') return 'negotiation'
  if (stage === 'Proposta') return 'proposal'
  if (stage === 'Fechado') return 'closed_won'
  return 'lead'
}

const dbToStage = (stage: string): DealStage => {
  if (stage === 'lead') return 'Lead'
  if (stage === 'qualified') return 'Qualificado'
  if (stage === 'negotiation') return 'Interesse'
  if (stage === 'proposal') return 'Proposta'
  if (stage === 'closed_won') return 'Fechado'
  if (stage === 'closed_lost') return 'Fechado'
  return 'Lead'
}

export const dealsService = {
  async getDeals() {
    const items = await pb
      .collection('deals')
      .getFullList({ expand: 'contact', sort: '-created' })
    return items.map((d) => ({
      id: d.id,
      contact_id: d.contact,
      title: d.title,
      value: d.value,
      stage: dbToStage(d.stage),
      created: d.created,
      updated: d.updated,
      contact: d.expand?.contact as unknown as Contact,
    })) as Deal[]
  },

  async getDealById(id: string) {
    const d = await pb.collection('deals').getOne(id, { expand: 'contact' })
    return {
      id: d.id,
      contact_id: d.contact,
      title: d.title,
      value: d.value,
      stage: dbToStage(d.stage),
      created: d.created,
      updated: d.updated,
      contact: d.expand?.contact as unknown as Contact,
    } as Deal
  },

  async createDeal(deal: any) {
    const d = await pb.collection('deals').create({
      title: deal.title,
      value: deal.value || 0,
      stage: stageToDb(deal.stage),
      contact: deal.contact_id,
    })
    return { ...d, stage: dbToStage(d.stage) } as unknown as Deal
  },

  async updateDeal(id: string, updates: any) {
    const payload: any = { ...updates }
    if (updates.stage) payload.stage = stageToDb(updates.stage)

    const d = await pb.collection('deals').update(id, payload)
    return { ...d, stage: dbToStage(d.stage) } as unknown as Deal
  },

  async updateDealStage(id: string, stage: string) {
    const d = await pb
      .collection('deals')
      .update(id, { stage: stageToDb(stage) })
    return { ...d, stage: dbToStage(d.stage) } as unknown as Deal
  },

  async deleteDeal(id: string) {
    await pb.collection('deals').delete(id)
  },
}
