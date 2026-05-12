import { supabase } from '@/lib/supabase/client'
import { Tag, tagsService } from './tags'

const db = supabase as any

export type Contact = {
  id: string
  name: string
  email: string
  phone: string
  whatsapp?: string | null
  birth_date?: string | null
  cpf?: string | null
  document?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  preferences?: any
  origin?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
  created?: string
  updated?: string
  tags?: Tag[]
  totalInvested?: number
  purchaseCount?: number
  bidCount?: number
  auctionCount?: number
  bidValue?: number
  avgTicket?: number
  lastActivityDate?: string | null
  segment?: string | null
  rfmvScore?: number
}

export type Interaction = {
  id: string
  contact_id: string
  deal_id?: string | null
  type: string
  description: string | null
  date: string
  status?: string | null
  metadata?: any
}

export type Bid = {
  id: string
  contact_id: string | null
  auction_id: string | null
  lot_number: string | null
  value: number
  date: string
  reason?: string | null
}

export type Purchase = {
  id: string
  contact_id: string | null
  auction_id: string | null
  lot_number: string | null
  value: number
  date: string
  description?: string | null
}

export type GetContactsParams = {
  page?: number
  pageSize?: number
  search?: string
  tags?: string[]
  segment?: string | null
  minInvestment?: number
  maxInvestment?: number
  minPurchases?: number
  maxPurchases?: number
  status?: string | null
  breed?: string | null
  location?: string
  hasWhatsapp?: boolean
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  lastContactRange?: any
}

export type ContactOverview = {
  total: number
  buyers: number
  inactive: number
  active: number
  withWhatsapp: number
  totalInvested: number
  avgTicket: number
}

const mapContact = (contact: any): Contact => {
  const tags =
    contact.contact_tags
      ?.map((item: any) => item.tags)
      .filter(Boolean)
      .map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
      })) || []

  return {
    ...contact,
    created: contact.created_at,
    updated: contact.updated_at,
    tags,
    totalInvested: Number(
      contact.monetary_value || contact.total_purchase_value || 0,
    ),
    purchaseCount: Number(contact.purchase_count || 0),
    bidCount: Number(contact.bid_count || 0),
    auctionCount: Number(contact.auction_count || 0),
    bidValue: Number(contact.bid_value || 0),
    avgTicket: Number(contact.avg_ticket || 0),
    lastActivityDate:
      contact.last_activity_date || contact.last_bid_date || null,
    segment: contact.segment || null,
    rfmvScore: Number(contact.rfmv_score || 0),
  }
}

const mergeContactWithRfmv = (contact: Contact, rfmv: any): Contact => ({
  ...contact,
  totalInvested: Number(rfmv?.monetary_value || 0),
  purchaseCount: Number(rfmv?.purchase_count || 0),
  bidCount: Number(rfmv?.bid_count || 0),
  auctionCount: Number(rfmv?.auction_count || 0),
  bidValue: Number(rfmv?.bid_value || 0),
  avgTicket: Number(rfmv?.avg_ticket || 0),
  lastActivityDate: rfmv?.last_activity_date || null,
  segment: rfmv?.segment || null,
  rfmvScore: Number(rfmv?.rfmv_score || 0),
})

const enrichWithRfmv = async (contacts: Contact[]) => {
  const ids = contacts.map((contact) => contact.id)
  if (!ids.length) return contacts

  const { data, error } = await db
    .from('customer_rfmv_view')
    .select(
      'id, purchase_count, monetary_value, avg_ticket, bid_count, auction_count, bid_value, last_activity_date, segment, rfmv_score',
    )
    .in('id', ids)

  if (error) throw error

  const rfmvById = new Map((data || []).map((row: any) => [row.id, row]))
  return contacts.map((contact) => {
    const rfmv = rfmvById.get(contact.id)
    if (!rfmv) return contact

    return mergeContactWithRfmv(contact, rfmv)
  })
}

const tagIdsByNames = async (names: string[]) => {
  if (!names.length) return []
  const { data, error } = await db.from('tags').select('id').in('name', names)
  if (error) throw error
  return (data || []).map((tag: any) => tag.id)
}

export const contactsService = {
  async getTags() {
    return tagsService.getTags()
  },

  async getContactOverview(): Promise<ContactOverview> {
    const pageSize = 1000
    let from = 0
    const rows: any[] = []

    while (true) {
      const { data, error } = await db
        .from('customer_rfmv_view')
        .select(
          'id, purchase_count, monetary_value, last_activity_date, whatsapp',
        )
        .order('id', { ascending: true })
        .range(from, from + pageSize - 1)

      if (error) throw error

      rows.push(...(data || []))
      if (!data || data.length < pageSize) break
      from += pageSize
    }

    const inactiveThreshold = new Date()
    inactiveThreshold.setDate(inactiveThreshold.getDate() - 180)

    const overview = rows.reduce(
      (acc, row) => {
        const purchaseCount = Number(row.purchase_count || 0)
        const monetaryValue = Number(row.monetary_value || 0)
        const lastActivity = row.last_activity_date
          ? new Date(row.last_activity_date)
          : null
        const whatsappDigits = String(row.whatsapp || '').replace(/\D/g, '')

        acc.total += 1
        acc.totalInvested += monetaryValue
        acc.purchases += purchaseCount

        if (purchaseCount > 0) acc.buyers += 1
        if (whatsappDigits.length >= 10) acc.withWhatsapp += 1
        if (!lastActivity || lastActivity < inactiveThreshold) {
          acc.inactive += 1
        } else {
          acc.active += 1
        }

        return acc
      },
      {
        total: 0,
        buyers: 0,
        inactive: 0,
        active: 0,
        withWhatsapp: 0,
        totalInvested: 0,
        purchases: 0,
      },
    )

    return {
      total: overview.total,
      buyers: overview.buyers,
      inactive: overview.inactive,
      active: overview.active,
      withWhatsapp: overview.withWhatsapp,
      totalInvested: overview.totalInvested,
      avgTicket:
        overview.purchases > 0
          ? overview.totalInvested / overview.purchases
          : 0,
    }
  },

  async getContacts({
    page = 1,
    pageSize = 10,
    search = '',
    tags = [],
    segment = null,
    minInvestment,
    maxInvestment,
    minPurchases,
    maxPurchases,
    status = null,
    breed = null,
    location = '',
    hasWhatsapp = false,
    lastContactRange,
    sortBy = 'lastActivity',
    sortDirection = 'desc',
  }: GetContactsParams = {}) {
    try {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = db.from('customer_rfmv_view').select('*', { count: 'exact' })

      let candidateIds: string[] | null = null
      const applyCandidateIds = (ids: string[]) => {
        const uniqueIds = [...new Set(ids)]
        if (candidateIds === null) {
          candidateIds = uniqueIds
          return
        }

        const nextIds = new Set(uniqueIds)
        candidateIds = candidateIds.filter((id) => nextIds.has(id))
      }

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,whatsapp.ilike.%${search}%`,
        )
      }

      if (location) {
        query = query.or(`city.ilike.%${location}%,state.ilike.%${location}%`)
      }

      if (tags.length > 0) {
        const tagIds = await tagIdsByNames(tags)
        if (tagIds.length === 0) return { data: [], count: 0, error: null }

        const { data: contactTags, error } = await db
          .from('contact_tags')
          .select('contact_id')
          .in('tag_id', tagIds)

        if (error) throw error
        const ids = (contactTags || []).map((t: any) => t.contact_id)
        if (ids.length === 0) return { data: [], count: 0, error: null }
        applyCandidateIds(ids)
      }

      if (segment) {
        query = query.eq('segment', segment)
      }

      if (breed) {
        const { data: breedContacts, error } = await db
          .from('contacts')
          .select('id')
          .contains('preferences', { breeds: [breed] })

        if (error) throw error
        const ids = (breedContacts || []).map((contact: any) => contact.id)
        if (ids.length === 0) return { data: [], count: 0, error: null }
        applyCandidateIds(ids)
      }

      if (candidateIds !== null) {
        if (candidateIds.length === 0)
          return { data: [], count: 0, error: null }
        query = query.in('id', candidateIds)
      }

      if (status === 'active') {
        const threshold = new Date()
        threshold.setDate(threshold.getDate() - 180)
        query = query.gte(
          'last_activity_date',
          threshold.toISOString().slice(0, 10),
        )
      }

      if (status === 'inactive') {
        const threshold = new Date()
        threshold.setDate(threshold.getDate() - 180)
        query = query.or(
          `last_activity_date.lt.${threshold.toISOString().slice(0, 10)},last_activity_date.is.null`,
        )
      }

      if (lastContactRange?.from) {
        query = query.gte(
          'last_activity_date',
          new Date(lastContactRange.from).toISOString().slice(0, 10),
        )
      }

      if (lastContactRange?.to) {
        query = query.lte(
          'last_activity_date',
          new Date(lastContactRange.to).toISOString().slice(0, 10),
        )
      }

      if (minInvestment !== undefined) {
        query = query.gte('monetary_value', minInvestment)
      }

      if (maxInvestment !== undefined) {
        query = query.lte('monetary_value', maxInvestment)
      }

      if (minPurchases !== undefined) {
        query = query.gte('purchase_count', minPurchases)
      }

      if (maxPurchases !== undefined) {
        query = query.lte('purchase_count', maxPurchases)
      }

      if (hasWhatsapp) {
        query = query.not('whatsapp', 'is', null).neq('whatsapp', '')
      }

      const sortColumns: Record<string, string> = {
        created: 'created_at',
        created_at: 'created_at',
        updated_at: 'last_activity_date',
        lastActivity: 'last_activity_date',
        name: 'name',
        totalInvested: 'monetary_value',
        purchaseCount: 'purchase_count',
        bidCount: 'bid_count',
        rfmvScore: 'rfmv_score',
      }
      const sortColumn = sortColumns[sortBy] || sortBy
      const {
        data: rfmvRows,
        count,
        error,
      } = await query
        .order(sortColumn, { ascending: sortDirection === 'asc' })
        .range(from, to)

      if (error) throw error

      const rows = rfmvRows || []
      const ids = rows.map((row: any) => row.id)
      if (ids.length === 0) {
        return { data: [], count: count || 0, error: null }
      }

      const { data: contactRows, error: contactsError } = await db
        .from('contacts')
        .select(
          `
          *,
          contact_tags(tags(id, name, color))
        `,
        )
        .in('id', ids)

      if (contactsError) throw contactsError

      const contactsById = new Map(
        (contactRows || []).map((contact: any) => [
          contact.id,
          mapContact(contact),
        ]),
      )
      const contacts = rows.map((row: any) =>
        mergeContactWithRfmv(contactsById.get(row.id) || mapContact(row), row),
      )

      return {
        data: contacts,
        count: count || 0,
        error: null,
      }
    } catch (error) {
      return { data: [], count: 0, error }
    }
  },

  async getAudienceLists() {
    const { data, error } = await db
      .from('customer_rfmv_view')
      .select('segment')
    if (error) throw error

    return [
      ...new Set(
        (data || [])
          .map((item: any) => item.segment)
          .filter((segment: string | null) => Boolean(segment)),
      ),
    ] as string[]
  },

  async getAudienceCount(filters: { tags?: string[]; segments?: string[] }) {
    const tags = filters.tags || []
    const segments = filters.segments || []

    if (!tags.length && !segments.length) {
      const { count, error } = await db
        .from('customer_rfmv_view')
        .select('id', { count: 'exact', head: true })

      if (error) throw error
      return count || 0
    }

    const ids = new Set<string>()

    if (tags.length) {
      const tagIds = await tagIdsByNames(tags)
      if (tagIds.length) {
        const { data: contactTags, error } = await db
          .from('contact_tags')
          .select('contact_id')
          .in('tag_id', tagIds)

        if (error) throw error
        ;(contactTags || []).forEach((item: any) => ids.add(item.contact_id))
      }
    }

    if (segments.length) {
      const { data: segmented, error } = await db
        .from('customer_rfmv_view')
        .select('id')
        .in('segment', segments)

      if (error) throw error
      ;(segmented || []).forEach((item: any) => ids.add(item.id))
    }

    return ids.size
  },

  async deleteContact(id: string) {
    const { error } = await db.from('contacts').delete().eq('id', id)
    if (error) throw error
  },

  async getContactById(id: string) {
    const { data, error } = await db
      .from('contacts')
      .select(
        `
        *,
        contact_tags(tags(id, name, color))
      `,
      )
      .eq('id', id)
      .single()

    if (error) throw error
    const [contact] = await enrichWithRfmv([mapContact(data)])
    return contact
  },

  async getContactRfmvById(contactId: string) {
    const { data, error } = await db
      .from('customer_rfmv_view')
      .select('*')
      .eq('id', contactId)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async createContact(contactData: any) {
    const { tags: tagNames = [], ...data } = contactData

    const payload = {
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      whatsapp: data.whatsapp || null,
      birth_date: data.birthDate
        ? new Date(data.birthDate).toISOString().slice(0, 10)
        : null,
      cpf: data.cpf || null,
      document: data.cpf || null,
      address: data.address || null,
      preferences: {
        breeds: data.favoriteBreeds || [],
        modalities: data.modalities || [],
        valueRange: data.preferredValueRange || '',
      },
      origin: data.origin || null,
      notes: data.notes || null,
    }

    const { data: contact, error } = await db
      .from('contacts')
      .insert(payload)
      .select()
      .single()

    if (error) throw error

    if (tagNames.length > 0) {
      const tagIds = await tagIdsByNames(tagNames)
      if (tagIds.length > 0) {
        const rows = tagIds.map((tag_id: string) => ({
          contact_id: contact.id,
          tag_id,
        }))
        const { error: tagError } = await db.from('contact_tags').insert(rows)
        if (tagError) throw tagError
      }
    }

    return contact
  },

  async addTagToContact(contactId: string, tagId: string) {
    const { error } = await db
      .from('contact_tags')
      .upsert({ contact_id: contactId, tag_id: tagId })
    if (error) throw error
  },

  async removeTagFromContact(contactId: string, tagId: string) {
    const { error } = await db
      .from('contact_tags')
      .delete()
      .eq('contact_id', contactId)
      .eq('tag_id', tagId)
    if (error) throw error
  },

  async getContactInteractions(contactId: string) {
    const { data, error } = await db
      .from('contact_interactions')
      .select('*')
      .eq('contact_id', contactId)
      .order('date', { ascending: false })

    if (error) throw error
    return data as Interaction[]
  },

  async getDealInteractions(dealId: string) {
    const { data, error } = await db
      .from('contact_interactions')
      .select('*')
      .eq('deal_id', dealId)
      .order('date', { ascending: false })

    if (error) throw error
    return data as Interaction[]
  },

  async addInteraction(interaction: Partial<Interaction>) {
    const { data, error } = await db
      .from('contact_interactions')
      .insert(interaction)
      .select()
      .single()

    if (error) throw error
    return data as Interaction
  },

  async getBidsByContactId(contactId: string) {
    const { data, error } = await db
      .from('bids')
      .select('*')
      .eq('contact_id', contactId)
      .order('date', { ascending: false })

    if (error) throw error
    return data as Bid[]
  },

  async getPurchasesByContactId(contactId: string) {
    const { data, error } = await db
      .from('purchases')
      .select('*')
      .eq('contact_id', contactId)
      .order('date', { ascending: false })

    if (error) throw error
    return data as Purchase[]
  },

  async getBirthdays(month: number, day: number) {
    const { data, error } = await db
      .from('contacts')
      .select('*')
      .not('birth_date', 'is', null)

    if (error) throw error
    return (data || []).filter((contact: any) => {
      const [, birthMonth, birthDay] = String(contact.birth_date || '')
        .split('-')
        .map(Number)

      return birthMonth === month && birthDay === day
    })
  },

  async getInactiveContactsCount(daysThreshold: number) {
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold)

    const { count, error } = await db
      .from('customer_rfmv_view')
      .select('*', { count: 'exact', head: true })
      .or(
        `last_activity_date.lt.${thresholdDate.toISOString().slice(0, 10)},last_activity_date.is.null`,
      )

    if (error) throw error
    return count || 0
  },

  async sendEmail(
    contactId: string,
    to: string,
    subject: string,
    body: string,
    attachments: any[] = [],
  ) {
    const { error } = await supabase.functions.invoke('send-contact-email', {
      body: { to: [to], subject, html: body, attachments },
    })
    if (error) throw error

    await this.addInteraction({
      contact_id: contactId,
      type: 'email',
      description: subject,
      date: new Date().toISOString(),
      status: 'sent',
      metadata: { body_snippet: body.slice(0, 240) },
    })
  },
}
