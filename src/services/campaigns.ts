import { supabase } from '@/lib/supabase/client'

export type CampaignStatus =
  | 'Agendada'
  | 'Em Andamento'
  | 'Concluída'
  | 'Pausada'
  | 'Rascunho'

export type CampaignFilters = {
  tags: string[]
  segments: string[]
}

export type CampaignSend = {
  id?: string
  campaign_id?: string
  channel: 'email' | 'whatsapp'
  scheduled_at: string
  content: string
  status: 'Pendente' | 'Enviado' | 'Falha'
}

export type Campaign = {
  id: string
  name: string
  objective: string | null
  start_date: string
  end_date: string
  status: CampaignStatus
  filters: CampaignFilters
  channels: string[]
  created_at: string
  updated_at: string
  sends?: CampaignSend[]
  audience_count?: number // Computed field
}

export type CampaignInsert = {
  name: string
  objective?: string
  start_date: string
  end_date: string
  status?: CampaignStatus
  filters: CampaignFilters
  channels: string[]
}

export const campaignsService = {
  async getCampaigns() {
    const { data, error } = await supabase
      .from('campaigns')
      .select(
        `
        *,
        sends:campaign_sends(*)
      `,
      )
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Campaign[]
  },

  async createCampaign(
    campaign: CampaignInsert,
    sends: Omit<CampaignSend, 'id' | 'campaign_id' | 'status'>[],
  ) {
    // 1. Create Campaign
    const { data: newCampaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert(campaign)
      .select()
      .single()

    if (campaignError) throw campaignError

    // 2. Create Sends
    if (sends.length > 0) {
      const sendsToInsert = sends.map((send) => ({
        campaign_id: newCampaign.id,
        channel: send.channel,
        scheduled_at: send.scheduled_at,
        content: send.content,
        status: 'Pendente',
      }))

      const { error: sendsError } = await supabase
        .from('campaign_sends')
        .insert(sendsToInsert)

      if (sendsError) {
        // Optional: Rollback campaign creation or log error
        console.error('Error creating campaign sends:', sendsError)
        // For now, throwing to notify caller
        throw sendsError
      }
    }

    return newCampaign
  },

  async getCampaignById(id: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .select(
        `
        *,
        sends:campaign_sends(*)
      `,
      )
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Campaign
  },
}
