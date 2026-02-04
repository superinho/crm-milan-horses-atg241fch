import { supabase } from '@/lib/supabase/client'

export type Tag = {
  id: string
  name: string
  color: string
}

export const tagsService = {
  async getTags() {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name')

    if (error) throw error
    return data as Tag[]
  },

  async createTag(tag: Omit<Tag, 'id'>) {
    const { data, error } = await supabase
      .from('tags')
      .insert(tag)
      .select()
      .single()

    if (error) throw error
    return data as Tag
  },

  async updateTag(id: string, tag: Partial<Tag>) {
    const { data, error } = await supabase
      .from('tags')
      .update(tag)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Tag
  },

  async deleteTag(id: string) {
    const { error } = await supabase.from('tags').delete().eq('id', id)

    if (error) throw error
  },
}
