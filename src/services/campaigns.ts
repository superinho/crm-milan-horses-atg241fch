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
  channel_type: 'email' | 'whatsapp'
  scheduled_at: string
  template_id?: string | null
  content: string
  status: 'Pendente' | 'Enviado' | 'Falha'
}

export type Campaign = {
  id: string
  name: string
  objective: string | null // Mapped from description for UI compatibility
  description?: string | null
  start_date: string
  end_date: string
  status: CampaignStatus
  audience_filters: CampaignFilters
  channels: string[]
  company_id?: string | null
  created_at: string
  updated_at: string
  sends?: CampaignSend[]
  audience_count?: number // Computed field
}

export type CampaignInsert = {
  name: string
  objective?: string
  description?: string
  start_date: string
  end_date: string
  status?: CampaignStatus
  audience_filters: CampaignFilters
  channels: string[]
  company_id?: string | null
}

export const campaignsService = {
  async getCampaigns() {
    // We use 'as any' for the table name to avoid type errors if the types definition is not yet updated
    const { data, error } = await supabase
      .from('campaigns' as any)
      .select(
        `
        *,
        sends:campaign_sends(*)
      `,
      )
      .order('created_at', { ascending: false })

    if (error) throw error

    // Map description to objective for UI compatibility
    return (data || []).map((campaign: any) => ({
      ...campaign,
      objective: campaign.description || campaign.objective || null,
    })) as Campaign[]
  },

  async createCampaign(
    campaign: CampaignInsert,
    sends: Omit<CampaignSend, 'id' | 'campaign_id' | 'status'>[],
  ) {
    // Map objective to description for DB persistence
    const dbCampaign = {
      name: campaign.name,
      description: campaign.objective || campaign.description,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      status: campaign.status || 'Agendada',
      audience_filters: campaign.audience_filters,
      channels: campaign.channels,
      company_id: campaign.company_id,
    }

    // 1. Create Campaign
    const { data: newCampaign, error: campaignError } = await supabase
      .from('campaigns' as any)
      .insert(dbCampaign)
      .select()
      .single()

    if (campaignError) throw campaignError

    // 2. Create Sends
    if (sends.length > 0) {
      const sendsToInsert = sends.map((send) => ({
        campaign_id: newCampaign.id,
        channel_type: send.channel_type,
        scheduled_at: send.scheduled_at,
        content: send.content,
        template_id: send.template_id,
        status: 'Pendente',
      }))

      const { error: sendsError } = await supabase
        .from('campaign_sends' as any)
        .insert(sendsToInsert)

      if (sendsError) {
        // Optional: Rollback campaign creation or log error
        console.error('Error creating campaign sends:', sendsError)
        // For now, throwing to notify caller
        throw sendsError
      }
    }

    return {
      ...newCampaign,
      objective: newCampaign.description,
    }
  },

  async getCampaignById(id: string) {
    const { data, error } = await supabase
      .from('campaigns' as any)
      .select(
        `
        *,
        sends:campaign_sends(*)
      `,
      )
      .eq('id', id)
      .single()

    if (error) throw error

    return {
      ...data,
      objective: data.description || data.objective || null,
    } as Campaign
  },
}
