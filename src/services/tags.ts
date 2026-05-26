import { supabase } from '@/lib/supabase/client'

const db = supabase as any

export type Tag = {
  id: string
  name: string
  color: string
}

export const MANUAL_PRIORITY_TAGS = [
  { name: 'OURO', color: '#B8892F' },
  { name: 'PRATA', color: '#8A94A6' },
  { name: 'BRONZE', color: '#A86432' },
] as const

export const BEHAVIOR_TAGS = [
  { name: 'Comprador recente', color: '#0F766E' },
  { name: 'Alto valor', color: '#1D4ED8' },
  { name: 'Licitante ativo', color: '#7C3AED' },
  { name: 'Inativo com potencial', color: '#B45309' },
  { name: 'Engajado em campanhas', color: '#BE185D' },
] as const

export const MILAN_TAGS = [...MANUAL_PRIORITY_TAGS, ...BEHAVIOR_TAGS]

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

  async ensureMilanTags() {
    const { data, error } = await db
      .from('tags')
      .upsert(MILAN_TAGS, { onConflict: 'name' })
      .select()

    if (error) throw error
    return (data || []) as Tag[]
  },
}
