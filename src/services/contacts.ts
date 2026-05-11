import pb from '@/lib/pocketbase/client'
import { DateRange } from 'react-day-picker'
import { Tag } from './tags'

export type Contact = {
  id: string
  name: string
  email: string
  phone: string
  created: string
  updated: string
  tags?: Tag[]
}

export type GetContactsParams = {
  page?: number
  pageSize?: number
  search?: string
  tags?: string[]
}

export const contactsService = {
  async getContacts({
    page = 1,
    pageSize = 10,
    search = '',
    tags = [],
  }: GetContactsParams) {
    let filter = ''
    if (search) {
      filter = `name ~ "${search}" || email ~ "${search}" || phone ~ "${search}"`
    }

    // We mock tags filtering for simplicity in this standard list since pocketbase relation search can be tricky without joining in JS
    const result = await pb.collection('contacts').getList(page, pageSize, {
      filter,
      sort: '-created',
      expand: 'tags',
    })

    const data = result.items.map((c) => ({
      ...c,
      tags: c.expand?.tags || [],
    })) as unknown as Contact[]

    // Manual JS side filter if tags are provided
    const filteredData =
      tags.length > 0
        ? data.filter((c) => c.tags?.some((t) => tags.includes(t.name)))
        : data

    return { data: filteredData, count: result.totalItems, error: null }
  },

  async deleteContact(id: string) {
    await pb.collection('contacts').delete(id)
  },

  async getContactById(id: string) {
    const data = await pb.collection('contacts').getOne(id, { expand: 'tags' })
    return {
      ...data,
      tags: data.expand?.tags || [],
    } as unknown as Contact
  },

  async createContact(contactData: any) {
    const { tags: tagNames, ...data } = contactData

    const dbData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
    }

    const newContact = await pb.collection('contacts').create(dbData)

    if (tagNames && tagNames.length > 0) {
      const allTags = await pb.collection('tags').getFullList()
      const selectedTags = allTags.filter((t) => tagNames.includes(t.name))
      if (selectedTags.length > 0) {
        await pb.collection('contacts').update(newContact.id, {
          tags: selectedTags.map((t) => t.id),
        })
      }
    }

    return newContact
  },

  async getBirthdays(month: number, day: number) {
    // Mock for dashboard since schema is simplified
    return []
  },

  async getInactiveContactsCount(daysThreshold: number) {
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold)
    const thresholdStr = thresholdDate.toISOString()

    const result = await pb.collection('contacts').getList(1, 1, {
      filter: `updated < "${thresholdStr}"`,
    })
    return result.totalItems
  },
}
