import { supabase } from '@/lib/supabase/client'

export type Contact = {
  id: string
  name: string
  email: string
  phone: string
  whatsapp?: string | null
  birth_date?: string | null
  cpf?: string | null
  address?: string | null
  preferences?: any
  origin?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  tags?: Tag[]
  purchases?: Purchase[]
  interactions?: Interaction[]
}

export type Tag = {
  id: string
  name: string
  color: string
}

export type Purchase = {
  id: string
  value: number
  date: string
  contact_id: string
  auction_id?: string | null
  lot_number?: string | null
  description?: string | null
}

export type Bid = {
  id: string
  contact_id: string
  auction_id?: string | null
  lot_number?: string | null
  value: number
  date: string
  reason?: string | null
  created_at: string
}

export type Interaction = {
  id: string
  contact_id: string
  deal_id?: string | null
  type: string
  description: string | null
  date: string
  created_by?: string | null
  created_at: string
  status?: string | null
  metadata?: any
}

export type SegmentStats = {
  segment: string
  count: number
  percentage: number
}

type GetContactsParams = {
  page?: number
  pageSize?: number
  search?: string
  tags?: string[]
  segment?: string | null
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

type AudienceFilterParams = {
  tags?: string[]
  segments?: string[]
}

export const contactsService = {
  async getContacts({
    page = 1,
    pageSize = 10,
    search = '',
    tags = [],
    segment = null,
    sortBy = 'created_at',
    sortDirection = 'desc',
  }: GetContactsParams) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase.from('contacts').select(
      `
        *,
        contact_tags!left (
          tags (
            id,
            name,
            color
          )
        ),
        purchases (
          value,
          date
        )
      `,
      { count: 'exact' },
    )

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (segment) {
      const { data: segmentedContacts, error: segmentError } = await supabase
        .from('contact_segmentation_view')
        .select('id')
        .eq('segment', segment)

      if (segmentError) throw segmentError

      const ids = segmentedContacts?.map((c) => c.id) || []

      if (ids.length === 0) {
        return { data: [], count: 0, error: null }
      }

      query = query.in('id', ids)
    }

    if (sortBy === 'lastContact') {
      query = query.order('updated_at', { ascending: sortDirection === 'asc' })
    } else if (sortBy === 'totalInvested') {
      query = query.order('name', { ascending: sortDirection === 'asc' })
    } else {
      query = query.order(sortBy as any, { ascending: sortDirection === 'asc' })
    }

    if (tags && tags.length > 0) {
      const { data: taggedContactIds, error: tagError } = await supabase
        .from('contact_tags')
        .select('contact_id, tags!inner(name)')
        .in('tags.name', tags)

      if (tagError) throw tagError

      const ids = taggedContactIds?.map((tc) => tc.contact_id) || []
      if (ids.length > 0) {
        query = query.in('id', ids)
      } else {
        return { data: [], count: 0, error: null }
      }
    }

    query = query.range(from, to)

    const { data, error, count } = await query

    const formattedData = data?.map((contact) => ({
      ...contact,
      tags: contact.contact_tags?.map((ct: any) => ct.tags) || [],
      purchases: contact.purchases || [],
      totalInvested:
        contact.purchases?.reduce(
          (acc: number, curr: any) => acc + Number(curr.value),
          0,
        ) || 0,
      lastContact: contact.updated_at,
    }))

    return { data: formattedData as Contact[], error, count }
  },

  async getAudienceCount({ tags, segments }: AudienceFilterParams) {
    let query = supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })

    if (segments && segments.length > 0) {
      const { data: segmentedContacts, error: segmentError } = await supabase
        .from('contact_segmentation_view')
        .select('id')
        .in('segment', segments)

      if (segmentError) throw segmentError

      const ids = segmentedContacts?.map((c) => c.id) || []

      if (ids.length === 0) {
        return 0
      }

      query = query.in('id', ids)
    }

    if (tags && tags.length > 0) {
      const { data: taggedContactIds, error: tagError } = await supabase
        .from('contact_tags')
        .select('contact_id, tags!inner(name)')
        .in('tags.name', tags)

      if (tagError) throw tagError

      const ids = taggedContactIds?.map((tc) => tc.contact_id) || []

      if (ids.length === 0) {
        return 0
      }

      query = query.in('id', ids)
    }

    const { count, error } = await query
    if (error) throw error
    return count || 0
  },

  async getSegmentationStats() {
    const { data, error } = await supabase
      .from('contact_segmentation_view')
      .select('segment')

    if (error) throw error

    const total = data.length
    const statsMap = data.reduce((acc: any, curr: any) => {
      acc[curr.segment] = (acc[curr.segment] || 0) + 1
      return acc
    }, {})

    const stats: SegmentStats[] = Object.keys(statsMap)
      .filter((key) => key !== 'Sem Segmento')
      .map((segment) => ({
        segment,
        count: statsMap[segment],
        percentage: total > 0 ? (statsMap[segment] / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)

    return stats
  },

  async getContactById(id: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select(
        `
        *,
        contact_tags (
          tags (
            id,
            name,
            color
          )
        ),
        purchases (
          id,
          value,
          date,
          lot_number,
          auction_id,
          description
        ),
        contact_interactions (
           id,
           deal_id,
           type,
           description,
           date,
           created_at,
           status,
           metadata
        )
      `,
      )
      .eq('id', id)
      .single()

    if (error) throw error

    return {
      ...data,
      tags: data.contact_tags?.map((ct: any) => ct.tags) || [],
      purchases: data.purchases || [],
      interactions: data.contact_interactions || [],
    }
  },

  async getPurchasesByContactId(contactId: string) {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('contact_id', contactId)
      .order('date', { ascending: false })

    if (error) throw error

    return data as Purchase[]
  },

  async getBidsByContactId(contactId: string) {
    const { data, error } = await supabase
      .from('bids')
      .select('*')
      .eq('contact_id', contactId)
      .order('date', { ascending: false })

    if (error) throw error

    return data as Bid[]
  },

  async getContactInteractions(contactId: string) {
    const { data, error } = await supabase
      .from('contact_interactions')
      .select('*')
      .eq('contact_id', contactId)
      .order('date', { ascending: false })

    if (error) throw error

    return data as Interaction[]
  },

  async getDealInteractions(dealId: string) {
    const { data, error } = await supabase
      .from('contact_interactions')
      .select('*')
      .eq('deal_id', dealId)
      .order('date', { ascending: false })

    if (error) throw error

    return data as Interaction[]
  },

  async addInteraction(interaction: Partial<Interaction>) {
    const { data, error } = await supabase
      .from('contact_interactions')
      .insert(interaction)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async sendEmail(
    contactId: string,
    to: string,
    subject: string,
    html: string,
    attachments?: { filename: string; content: string }[],
  ) {
    const { data, error } = await supabase.functions.invoke(
      'send-contact-email',
      {
        body: { to: [to], subject, html, attachments },
      },
    )

    if (error) throw error

    await this.addInteraction({
      contact_id: contactId,
      type: 'email',
      description: subject,
      date: new Date().toISOString(),
      status: 'sent',
      metadata: {
        resend_id: data?.id,
        subject,
        body_snippet: html.substring(0, 100) + '...',
      },
    })

    return data
  },

  async createContact(contactData: any) {
    const { tags: tagNames, ...data } = contactData

    const dbData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp,
      birth_date: data.birthDate,
      cpf: data.cpf,
      address: data.address,
      preferences: {
        breeds: data.favoriteBreeds,
        valueRange: data.preferredValueRange,
        modalities: data.modalities,
      },
      origin: data.origin,
      notes: data.notes,
    }

    const { data: newContact, error } = await supabase
      .from('contacts')
      .insert(dbData)
      .select()
      .single()

    if (error) throw error

    if (tagNames && tagNames.length > 0) {
      const { data: existingTags } = await supabase
        .from('tags')
        .select('id, name')
        .in('name', tagNames)

      if (existingTags) {
        const contactTags = existingTags.map((tag) => ({
          contact_id: newContact.id,
          tag_id: tag.id,
        }))

        await supabase.from('contact_tags').insert(contactTags)
      }
    }

    return newContact
  },

  async getTags() {
    const { data, error } = await supabase.from('tags').select('*')
    if (error) throw error
    return data
  },

  async addTagToContact(contactId: string, tagId: string) {
    const { error } = await supabase
      .from('contact_tags')
      .insert({ contact_id: contactId, tag_id: tagId })

    if (error) throw error
  },

  async removeTagFromContact(contactId: string, tagId: string) {
    const { error } = await supabase
      .from('contact_tags')
      .delete()
      .eq('contact_id', contactId)
      .eq('tag_id', tagId)

    if (error) throw error
  },

  async getBirthdays(month: number, day: number) {
    // Note: This is a client-side filter approximation because simple Supabase filters don't support date parts extraction easily without SQL functions.
    // For large databases, this should be an RPC or edge function.
    const { data, error } = await supabase
      .from('contacts')
      .select('id, name, birth_date')
      .not('birth_date', 'is', null)

    if (error) throw error

    return data.filter((contact) => {
      if (!contact.birth_date) return false
      // birth_date format YYYY-MM-DD
      const [_, m, d] = contact.birth_date.split('-').map(Number)
      return m === month && d === day
    })
  },

  async getInactiveContactsCount(daysThreshold: number) {
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold)
    const thresholdStr = thresholdDate.toISOString()

    // Using updated_at as a proxy for activity
    const { count, error } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .lt('updated_at', thresholdStr)

    if (error) throw error
    return count || 0
  },
}
