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
      // Since we don't have a direct lastContact field in the simple schema, we sort by updated_at or create a computed logic
      // For now, mapping lastContact to updated_at
      query = query.order('updated_at', { ascending: sortDirection === 'asc' })
    } else if (sortBy === 'totalInvested') {
      // Sorting by computed values (sum of purchases) is complex in simple PostgREST
      // We will sort by name as fallback or implement a DB view if strictly needed.
      // For now, let's sort by name if totalInvested is requested to avoid error, or updated_at
      query = query.order('name', { ascending: sortDirection === 'asc' })
    } else {
      query = query.order(sortBy as any, { ascending: sortDirection === 'asc' })
    }

    // Tag filtering needs special handling or inner join
    if (tags && tags.length > 0) {
      // Logic: contacts where contact_tags has tag.name in tags
      // This is complex with simple syntax. We can use !inner on contact_tags
      // But we need to filter by tag name
      // Constructing query:
      // We first find contact IDs that have these tags
      const { data: taggedContactIds, error: tagError } = await supabase
        .from('contact_tags')
        .select('contact_id, tags!inner(name)')
        .in('tags.name', tags)

      if (tagError) throw tagError

      const ids = taggedContactIds?.map((tc) => tc.contact_id) || []
      if (ids.length > 0) {
        query = query.in('id', ids)
      } else {
        // If tags selected but no contacts found, return empty
        return { data: [], count: 0, error: null }
      }
    }

    query = query.range(from, to)

    const { data, error, count } = await query

    // Transform data to match frontend expectations if necessary
    const formattedData = data?.map((contact) => ({
      ...contact,
      tags: contact.contact_tags?.map((ct: any) => ct.tags) || [],
      purchases: contact.purchases || [],
      // Calculated fields for frontend convenience
      totalInvested:
        contact.purchases?.reduce(
          (acc: number, curr: any) => acc + Number(curr.value),
          0,
        ) || 0,
      lastContact: contact.updated_at, // mock mapping
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
          auction_id
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
      // Ensure arrays
      purchases: data.purchases || [],
      interactions: data.contact_interactions || [],
    }
  },

  async createContact(contactData: any) {
    // 1. Insert Contact
    const { tags: tagNames, ...data } = contactData

    // Remove computed/extra fields if any
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

    // 2. Associate Tags
    if (tagNames && tagNames.length > 0) {
      // Fetch tag IDs
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
