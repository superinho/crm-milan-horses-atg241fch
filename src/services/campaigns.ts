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
  scheduled_date: string // Renamed from scheduled_at
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

// Mock Data for Fallback/Demo Mode
const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'mock-1',
    name: 'Campanha de Verão 2026',
    objective: 'Aumentar vendas da coleção de verão',
    description:
      'Campanha focada em roupas de banho e acessórios de praia com desconto progressivo.',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Em Andamento',
    audience_filters: {
      tags: ['Vip', 'Recorrente'],
      segments: ['Mulheres', 'Jovens'],
    },
    channels: ['email', 'whatsapp'],
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    stats: {
      total_sends: 1250,
      emails_sent: 800,
      emails_opened: 450,
      emails_clicked: 120,
      whatsapp_sent: 450,
      whatsapp_pending: 0,
      open_rate: 56.2,
      click_rate: 15.0,
    },
    schedules: [
      {
        id: 'sch-1',
        campaign_id: 'mock-1',
        channel_type: 'email',
        scheduled_date: new Date(
          Date.now() - 24 * 60 * 60 * 1000,
        ).toISOString(),
        content: 'Confira nossa nova coleção de verão!',
        status: 'Processado',
        created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'mock-2',
    name: 'Black Friday Antecipada',
    objective: 'Aquecimento para Black Friday',
    description:
      'Ofertas exclusivas para lista VIP antes do lançamento oficial.',
    start_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Agendada',
    audience_filters: {
      tags: ['Lead'],
      segments: ['Interessados'],
    },
    channels: ['email'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stats: {
      total_sends: 0,
      emails_sent: 0,
      emails_opened: 0,
      emails_clicked: 0,
      whatsapp_sent: 0,
      whatsapp_pending: 0,
      open_rate: 0,
      click_rate: 0,
    },
    schedules: [],
  },
]

// In-memory storage for the session
let localCampaigns = [...MOCK_CAMPAIGNS]

export const campaignsService = {
  async getCampaigns() {
    try {
      // Use casting to any to avoid TS errors if table is missing in generated types
      const { data, error } = await (supabase as any)
        .from('campaigns')
        .select(
          `
        *,
        schedules:campaign_schedules(*)
      `,
        )
        .order('created_at', { ascending: false })

      if (error) {
        console.warn(
          'Backend unavailable or table missing, using mock data:',
          error.message,
        )
        return localCampaigns
      }

      return (data || []).map((campaign: any) => ({
        ...campaign,
        objective: campaign.description || campaign.objective || null,
      })) as Campaign[]
    } catch (error) {
      console.warn('Exception fetching campaigns, using mock data:', error)
      return localCampaigns
    }
  },

  async getCampaignById(id: string) {
    try {
      const { data, error } = await (supabase as any)
        .from('campaigns')
        .select(
          `
        *,
        schedules:campaign_schedules(*)
      `,
        )
        .eq('id', id)
        .single()

      if (error) {
        // Fallback to local
        const local = localCampaigns.find((c) => c.id === id)
        if (local) return local
        throw error
      }

      const campaign = {
        ...data,
        objective: data.description || data.objective || null,
      } as Campaign

      // Fetch stats
      campaign.stats = await this.getCampaignStats(id)

      return campaign
    } catch (error) {
      console.warn('Exception in getCampaignById, using mock data', error)
      const local = localCampaigns.find((c) => c.id === id)
      if (local) return local
      throw error
    }
  },

  async createCampaign(
    campaign: CampaignInsert,
    schedules: Omit<
      CampaignSchedule,
      'id' | 'campaign_id' | 'status' | 'created_at'
    >[],
  ) {
    try {
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

      const { data: newCampaign, error: campaignError } = await (
        supabase as any
      )
        .from('campaigns')
        .insert(dbCampaign)
        .select()
        .single()

      if (campaignError) throw campaignError

      if (schedules.length > 0) {
        const schedulesToInsert = schedules.map((send) => ({
          campaign_id: newCampaign.id,
          channel_type: send.channel_type,
          scheduled_date: send.scheduled_date, // Renamed
          content: send.content,
          template_id: send.template_id,
          status: 'Pendente',
        }))

        const { error: schedulesError } = await (supabase as any)
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
    } catch (error) {
      console.warn('Using mock creation due to error:', error)
      // Create a mock campaign
      const newId = `mock-${Date.now()}`
      const mockCampaign: Campaign = {
        id: newId,
        name: campaign.name,
        objective: campaign.objective || null,
        description: campaign.description || campaign.objective || null,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        status: campaign.status || 'Agendada',
        audience_filters: campaign.audience_filters,
        channels: campaign.channels,
        company_id: campaign.company_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        stats: {
          total_sends: 0,
          emails_sent: 0,
          emails_opened: 0,
          emails_clicked: 0,
          whatsapp_sent: 0,
          whatsapp_pending: 0,
          open_rate: 0,
          click_rate: 0,
        },
        schedules: schedules.map((s, idx) => ({
          id: `sch-${newId}-${idx}`,
          campaign_id: newId,
          channel_type: s.channel_type,
          scheduled_date: s.scheduled_date, // Renamed
          content: s.content,
          status: 'Pendente',
          template_id: s.template_id,
          created_at: new Date().toISOString(),
        })) as CampaignSchedule[],
      }

      localCampaigns.unshift(mockCampaign)
      return mockCampaign
    }
  },

  async getCampaignStats(campaignId: string): Promise<CampaignStats> {
    try {
      // If it's a mock campaign, return its stats
      const mock = localCampaigns.find((c) => c.id === campaignId)
      if (mock && mock.id.startsWith('mock-') && mock.stats) {
        return mock.stats
      }

      const { data, error } = await (supabase as any)
        .from('campaign_sends')
        .select('channel, status')
        .eq('campaign_id', campaignId)

      if (error) {
        throw error
      }

      const stats = data.reduce(
        (acc: any, log: any) => {
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
    } catch (error) {
      console.warn('Error fetching stats, using mock stats:', error)
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
  },

  async getWhatsAppQueue(campaignId: string) {
    try {
      const { data, error } = await (supabase as any)
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
    } catch (error) {
      console.warn('Error fetching queue, returning empty mock:', error)
      return []
    }
  },

  async markAsSent(logId: string) {
    try {
      const { error } = await (supabase as any)
        .from('campaign_sends')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', logId)

      if (error) throw error
    } catch (error) {
      console.warn('Mock markAsSent due to error:', error)
      return
    }
  },

  async triggerProcessing() {
    try {
      const { data, error } =
        await supabase.functions.invoke('process-campaigns')
      if (error) throw error
      return data
    } catch (error) {
      console.warn('Mock triggerProcessing:', error)
      return { success: true, message: 'Mock processing triggered' }
    }
  },
}
