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

type GetContactsParams = {
  page?: number
  pageSize?: number
  search?: string
  tags?: string[]
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

export const contactsService = {
  async getContacts({
    page = 1,
    pageSize = 10,
    search = '',
    tags = [],
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

    // Sorting
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
           type,
           description,
           date
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
}
