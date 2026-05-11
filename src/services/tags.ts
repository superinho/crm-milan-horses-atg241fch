import supabase from '@/lib/supabase/client'

const db = supabase as any

export type Tag = {
  id: string
  name: string
  color: string
}

export const tagsService = {
  async getTags() {
    const { data, error } = await db
      .from('tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return (data || []) as Tag[]
  },

  async createTag(tag: Omit<Tag, 'id'>) {
    const { data, error } = await db.from('tags').insert(tag).select().single()

    if (error) throw error
    return data as Tag
  },

  async updateTag(id: string, updates: Partial<Tag>) {
    const { data, error } = await db
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Tag
  },

  async deleteTag(id: string) {
    const { error } = await db.from('tags').delete().eq('id', id)
    if (error) throw error
  },
}
