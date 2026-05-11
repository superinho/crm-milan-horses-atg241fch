import pb from '@/lib/pocketbase/client'

export type Tag = {
  id: string
  name: string
  color: string
}

export const tagsService = {
  async getTags() {
    const items = await pb.collection('tags').getFullList()
    return items as unknown as Tag[]
  },
}
