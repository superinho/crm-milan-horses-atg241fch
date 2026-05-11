import pb from '@/lib/pocketbase/client'

export type Tag = {
  id: string
  name: string
  color: string
}

export const tagsService = {
  async getTags() {
    const data = await pb.collection('tags').getFullList({ sort: 'name' })
    return data as Tag[]
  },

  async createTag(tag: Omit<Tag, 'id'>) {
    const data = await pb.collection('tags').create(tag)
    return data as Tag
  },

  async updateTag(id: string, tag: Partial<Tag>) {
    const data = await pb.collection('tags').update(id, tag)
    return data as Tag
  },

  async deleteTag(id: string) {
    await pb.collection('tags').delete(id)
  },
}
