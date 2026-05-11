import supabase from '@/lib/supabase/client'
import { Contact } from './contacts'

const db = supabase as any

export type CampaignStatus =
  | 'Agendada'
  | 'Em Andamento'
  | 'Concluída'
  | 'Pausada'
  | 'Rascunho'
  | 'Aguardando aprovação'
  | 'Piloto enviado'

export type CampaignSchedule = {
  id: string
  campaign_id?: string
  scheduled_date: string
  channel_type?: string
  content?: string | null
  status: string
}

export type Campaign = {
  id: string
  name: string
  objective: string | null
  description?: string | null
  status: CampaignStatus
  start_date?: string
  end_date?: string
  audience_filters?: any
  channels?: string[]
  created: string
  updated: string
  created_at?: string
  updated_at?: string
  schedules?: CampaignSchedule[]
  stats?: {
    total_sends: number
    emails_sent: number
    emails_opened: number
    emails_clicked: number
    whatsapp_sent: number
    whatsapp_pending: number
    open_rate: number
    click_rate: number
  }
}

export type CampaignSendLog = {
  id: string
  campaign_id: string
  schedule_id: string | null
  recipient_id: string | null
  channel: string
  status: string
  sent_at?: string | null
  subject?: string | null
  content?: string | null
  error_message?: string | null
  metadata?: any
  contact?: Contact | null
}

const statsFrom = (sends: any[] = []) => {
  const emails = sends.filter((send) => send.channel === 'email')
  const emailSent = emails.filter((send) =>
    ['sent', 'delivered', 'opened', 'clicked'].includes(send.status),
  ).length
  const emailsOpened = emails.filter((send) =>
    ['opened', 'clicked'].includes(send.status),
  ).length
  const emailsClicked = emails.filter(
    (send) => send.status === 'clicked',
  ).length
  const whatsapps = sends.filter((send) => send.channel === 'whatsapp')

  return {
    total_sends: sends.length,
    emails_sent: emailSent,
    emails_opened: emailsOpened,
    emails_clicked: emailsClicked,
    whatsapp_sent: whatsapps.filter((send) =>
      ['sent', 'delivered', 'responded'].includes(send.status),
    ).length,
    whatsapp_pending: whatsapps.filter((send) =>
      ['pending', 'sending'].includes(send.status),
    ).length,
    open_rate: emailSent ? (emailsOpened / emailSent) * 100 : 0,
    click_rate: emailSent ? (emailsClicked / emailSent) * 100 : 0,
  }
}

const mapCampaign = (item: any): Campaign => ({
  id: item.id,
  name: item.name,
  objective: item.objective || item.description || null,
  description: item.description || item.objective || null,
  status: item.status || 'Rascunho',
  start_date: item.start_date,
  end_date: item.end_date,
  audience_filters: {
    segments: [],
    tags: [],
    ...(item.audience_filters || {}),
  },
  channels: item.channels || [],
  created: item.created_at,
  updated: item.updated_at,
  created_at: item.created_at,
  updated_at: item.updated_at,
  schedules: item.campaign_schedules || [],
  stats: statsFrom(item.campaign_sends || []),
})

export const campaignsService = {
  async getCampaigns() {
    const { data, error } = await db
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(mapCampaign)
  },

  async getCampaignById(id: string) {
    const { data, error } = await db
      .from('campaigns')
      .select('*, campaign_schedules(*), campaign_sends(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return mapCampaign(data)
  },

  async createCampaign(campaign: any, schedules: any[]) {
    const { data: newCampaign, error } = await db
      .from('campaigns')
      .insert({
        name: campaign.name,
        description: campaign.objective || campaign.description || '',
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        status: campaign.status || 'Agendada',
        audience_filters: campaign.audience_filters || {},
        channels: campaign.channels || [],
      })
      .select()
      .single()

    if (error) throw error

    if (schedules?.length > 0) {
      const rows = schedules.map((schedule) => ({
        campaign_id: newCampaign.id,
        channel_type: schedule.channel_type,
        scheduled_date: schedule.scheduled_date,
        content: schedule.content || '',
        status: 'Pendente',
      }))
      const { error: scheduleError } = await db
        .from('campaign_schedules')
        .insert(rows)
      if (scheduleError) throw scheduleError
    }

    return mapCampaign(newCampaign)
  },

  async createVipRadarCampaign({
    auction,
    recommendations,
    channels,
    segment,
  }: {
    auction: any
    recommendations: any[]
    channels: Array<'email' | 'whatsapp'>
    segment?: string
  }) {
    const now = new Date()
    const endDate = auction?.eventDate ? new Date(auction.eventDate) : now
    const selectedRecommendations = recommendations.slice(0, 200)
    const { data: campaign, error } = await db
      .from('campaigns')
      .insert({
        name: `Radar VIP - ${auction?.title || 'Leilão Milan Horses'}`,
        description:
          'Campanha criada pelo Radar VIP com clientes priorizados por RFMV, lances e compatibilidade de ticket.',
        start_date: now.toISOString().slice(0, 10),
        end_date: Number.isNaN(endDate.getTime())
          ? now.toISOString().slice(0, 10)
          : endDate.toISOString().slice(0, 10),
        status: 'Aguardando aprovação',
        audience_filters: {
          source: 'radar-vip',
          auction_id: auction?.id,
          auction_smartleiloes_id: auction?.smartleiloesId,
          segments: segment && segment !== 'Todos' ? [segment] : [],
          contact_ids: selectedRecommendations.map((item) => item.contactId),
        },
        channels,
        metadata: {
          source: 'radar-vip',
          auction,
        },
      })
      .select()
      .single()

    if (error) throw error

    const schedules = channels.map((channel) => ({
      campaign_id: campaign.id,
      channel_type: channel,
      scheduled_date: now.toISOString(),
      subject:
        channel === 'email'
          ? `Curadoria Milan Horses: ${auction?.title || 'próximo leilão'}`
          : null,
      content:
        channel === 'email'
          ? '<p>Olá {{nome}}, tudo bem?</p><p>Separei uma curadoria rápida do leilão <strong>{{leilao}}</strong> porque seu histórico na Milan Horses indica alta compatibilidade com os lotes.</p><p>Posso te enviar os destaques antes do leilão?</p>'
          : 'Olá {{nome}}. {{leilao}} está chegando e selecionei alguns lotes que combinam com seu perfil na Milan Horses. Posso te enviar uma curadoria rápida?',
      status: 'Aguardando aprovação',
    }))

    const { error: scheduleError } = await db
      .from('campaign_schedules')
      .insert(schedules)
    if (scheduleError) throw scheduleError

    const recipientRows = selectedRecommendations.flatMap((item) =>
      channels
        .map((channel) => {
          const toAddress =
            channel === 'email' ? item.email : item.whatsapp || item.phone
          if (!toAddress) return null

          return {
            campaign_id: campaign.id,
            contact_id: item.contactId,
            channel,
            score: item.score,
            segment: item.segment,
            email: item.email,
            phone: item.whatsapp || item.phone,
            subject:
              channel === 'email'
                ? `Curadoria Milan Horses: ${auction?.title || 'próximo leilão'}`
                : null,
            message:
              channel === 'email'
                ? `<p>${item.suggestedMessage}</p>`
                : item.suggestedMessage,
            metadata: {
              reasons: item.reasons,
              monetaryValue: item.monetaryValue,
              avgTicket: item.avgTicket,
              purchaseCount: item.purchaseCount,
              bidCount: item.bidCount,
              recommendedChannel: item.recommendedChannel,
            },
          }
        })
        .filter(Boolean),
    )

    if (recipientRows.length) {
      const { error: recipientsError } = await db
        .from('campaign_recipients')
        .upsert(recipientRows, {
          onConflict: 'campaign_id,contact_id,channel',
        })
      if (recipientsError) throw recipientsError
    }

    return mapCampaign(campaign)
  },

  async triggerProcessing() {
    const { data, error } = await supabase.functions.invoke('process-campaigns')
    if (error) throw error
    return data
  },

  async processCampaign(
    campaignId: string,
    options: { limit?: number; mode?: 'pilot' | 'full' } = {},
  ) {
    const { data, error } = await supabase.functions.invoke(
      'process-campaigns',
      {
        body: { campaignId, ...options },
      },
    )
    if (error) throw error
    return data
  },

  async sendWhatsAppTest(campaignId: string, phone: string) {
    const { data: campaign, error } = await db
      .from('campaigns')
      .select(
        '*, campaign_schedules(*), campaign_recipients(*, contact:contacts(id, name, email, phone, whatsapp))',
      )
      .eq('id', campaignId)
      .single()

    if (error) throw error

    const sampleRecipient =
      campaign.campaign_recipients?.find(
        (item: any) => item.channel === 'whatsapp',
      ) || campaign.campaign_recipients?.[0]
    const schedule =
      campaign.campaign_schedules?.find(
        (item: any) => item.channel_type === 'whatsapp',
      ) || campaign.campaign_schedules?.[0]
    const message =
      sampleRecipient?.message ||
      schedule?.content ||
      `Teste de campanha ${campaign.name}`

    const { data, error: invokeError } = await supabase.functions.invoke(
      'send-whatsapp-botconversa',
      {
        body: {
          phone,
          name: 'Teste CRM Milan',
          message: `[TESTE CRM Milan] ${message}`,
          campaignId,
          metadata: {
            source: 'campaign-test',
            campaign_id: campaignId,
          },
        },
      },
    )

    if (invokeError) throw invokeError
    return data
  },

  async getWhatsAppQueue(campaignId: string) {
    const { data, error } = await db
      .from('campaign_sends')
      .select('*, contact:contacts(*)')
      .eq('campaign_id', campaignId)
      .eq('channel', 'whatsapp')
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []).map((item: any) => ({
      ...item,
      contact: item.contact,
    })) as CampaignSendLog[]
  },

  async markAsSent(sendLogId: string) {
    const { error } = await db
      .from('campaign_sends')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', sendLogId)

    if (error) throw error
  },
}
