import pb from '@/lib/pocketbase/client'

export type CampaignStatus =
  | 'Agendada'
  | 'Em Andamento'
  | 'Concluída'
  | 'Pausada'
  | 'Rascunho'

export type CampaignSchedule = {
  id: string
  campaign: string
  scheduled_date: string
  status: string
}

export type Campaign = {
  id: string
  name: string
  objective: string | null
  description?: string | null
  status: CampaignStatus
  created: string
  updated: string
  schedules?: CampaignSchedule[]
}

const statusToDb = (status: string) => {
  if (status === 'Rascunho') return 'draft'
  if (status === 'Agendada') return 'paused'
  if (status === 'Em Andamento') return 'active'
  if (status === 'Pausada') return 'paused'
  if (status === 'Concluída') return 'completed'
  return 'draft'
}

const dbToStatus = (status: string) => {
  if (status === 'draft') return 'Rascunho'
  if (status === 'active') return 'Em Andamento'
  if (status === 'paused') return 'Pausada'
  if (status === 'completed') return 'Concluída'
  return 'Rascunho'
}

export const campaignsService = {
  async getCampaigns() {
    const items = await pb.collection('campaigns').getFullList({
      sort: '-created',
    })

    return items.map((item) => ({
      id: item.id,
      name: item.title,
      description: item.description,
      objective: item.description,
      status: dbToStatus(item.status),
      created: item.created,
      updated: item.updated,
    })) as Campaign[]
  },

  async getCampaignById(id: string) {
    const item = await pb.collection('campaigns').getOne(id)
    const schedules = await pb
      .collection('campaign_schedules')
      .getFullList({ filter: `campaign = "${id}"` })

    return {
      id: item.id,
      name: item.title,
      description: item.description,
      objective: item.description,
      status: dbToStatus(item.status),
      created: item.created,
      updated: item.updated,
      schedules: schedules as unknown as CampaignSchedule[],
    } as Campaign
  },

  async createCampaign(campaign: any, schedules: any[]) {
    const newItem = await pb.collection('campaigns').create({
      title: campaign.name,
      description: campaign.objective || campaign.description || '',
      status: statusToDb(campaign.status || 'Agendada'),
    })

    if (schedules && schedules.length > 0) {
      for (const s of schedules) {
        await pb.collection('campaign_schedules').create({
          campaign: newItem.id,
          scheduled_date: s.scheduled_date,
          status: 'pending',
        })
      }
    }

    return {
      id: newItem.id,
      name: newItem.title,
      description: newItem.description,
      status: dbToStatus(newItem.status),
    }
  },
}
