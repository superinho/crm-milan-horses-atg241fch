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

export type CampaignSchedule = {
  id: string
  campaign_id: string
  channel_type: 'email' | 'whatsapp'
  scheduled_at: string
  template_id?: string | null
  content: string
  status: 'Pendente' | 'Processado' | 'Falha'
  created_at: string
}

export type CampaignSendLog = {
  id: string
  campaign_id: string
  schedule_id: string
  recipient_id: string
  channel: 'email' | 'whatsapp'
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed'
  sent_at?: string
  opened_at?: string
  clicked_at?: string
  contact?: {
    name: string
    email: string
    phone: string
    whatsapp?: string
  }
}

export type Campaign = {
  id: string
  name: string
  objective: string | null
  description?: string | null
  start_date: string
  end_date: string
  status: CampaignStatus
  audience_filters: CampaignFilters
  channels: string[]
  company_id?: string | null
  created_at: string
  updated_at: string
  schedules?: CampaignSchedule[]
  stats?: CampaignStats
}

export type CampaignStats = {
  total_sends: number
  emails_sent: number
  emails_opened: number
  emails_clicked: number
  whatsapp_sent: number
  whatsapp_pending: number
  open_rate: number
  click_rate: number
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
    const { data, error } = await supabase
      .from('campaigns')
      .select(
        `
        *,
        schedules:campaign_schedules(*)
      `,
      )
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map((campaign: any) => ({
      ...campaign,
      objective: campaign.description || campaign.objective || null,
    })) as Campaign[]
  },

  async getCampaignById(id: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .select(
        `
        *,
        schedules:campaign_schedules(*)
      `,
      )
      .eq('id', id)
      .single()

    if (error) throw error

    const campaign = {
      ...data,
      objective: data.description || data.objective || null,
    } as Campaign

    // Fetch stats
    campaign.stats = await this.getCampaignStats(id)

    return campaign
  },

  async createCampaign(
    campaign: CampaignInsert,
    schedules: Omit<
      CampaignSchedule,
      'id' | 'campaign_id' | 'status' | 'created_at'
    >[],
  ) {
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

    const { data: newCampaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert(dbCampaign)
      .select()
      .single()

    if (campaignError) throw campaignError

    if (schedules.length > 0) {
      const schedulesToInsert = schedules.map((send) => ({
        campaign_id: newCampaign.id,
        channel_type: send.channel_type,
        scheduled_at: send.scheduled_at,
        content: send.content,
        template_id: send.template_id,
        status: 'Pendente',
      }))

      const { error: schedulesError } = await supabase
        .from('campaign_schedules')
        .insert(schedulesToInsert)

      if (schedulesError) {
        console.error('Error creating campaign schedules:', schedulesError)
        throw schedulesError
      }
    }

    return {
      ...newCampaign,
      objective: newCampaign.description,
    }
  },

  async getCampaignStats(campaignId: string): Promise<CampaignStats> {
    const { data, error } = await supabase
      .from('campaign_sends')
      .select('channel, status')
      .eq('campaign_id', campaignId)

    if (error) {
      console.error('Error fetching stats', error)
      return {
        total_sends: 0,
        emails_sent: 0,
        emails_opened: 0,
        emails_clicked: 0,
        whatsapp_sent: 0,
        whatsapp_pending: 0,
        open_rate: 0,
        click_rate: 0,
      }
    }

    const stats = data.reduce(
      (acc, log) => {
        acc.total_sends++
        if (log.channel === 'email') {
          acc.emails_sent++
          if (['opened', 'clicked'].includes(log.status)) acc.emails_opened++
          if (log.status === 'clicked') acc.emails_clicked++
        } else if (log.channel === 'whatsapp') {
          if (log.status === 'sent') acc.whatsapp_sent++
          if (log.status === 'pending') acc.whatsapp_pending++
        }
        return acc
      },
      {
        total_sends: 0,
        emails_sent: 0,
        emails_opened: 0,
        emails_clicked: 0,
        whatsapp_sent: 0,
        whatsapp_pending: 0,
      },
    )

    return {
      ...stats,
      open_rate:
        stats.emails_sent > 0
          ? (stats.emails_opened / stats.emails_sent) * 100
          : 0,
      click_rate:
        stats.emails_sent > 0
          ? (stats.emails_clicked / stats.emails_sent) * 100
          : 0,
    }
  },

  async getWhatsAppQueue(campaignId: string) {
    const { data, error } = await supabase
      .from('campaign_sends')
      .select(
        `
        *,
        contact:contacts(name, phone, whatsapp, email)
      `,
      )
      .eq('campaign_id', campaignId)
      .eq('channel', 'whatsapp')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as CampaignSendLog[]
  },

  async markAsSent(logId: string) {
    const { error } = await supabase
      .from('campaign_sends')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', logId)

    if (error) throw error
  },

  async triggerProcessing() {
    // This calls the edge function to process schedules
    // In a real app, this is triggered by cron, but we allow manual trigger for demo
    const { data, error } = await supabase.functions.invoke('process-campaigns')
    if (error) throw error
    return data
  },
}
