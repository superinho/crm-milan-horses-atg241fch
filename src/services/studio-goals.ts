import { supabase } from '@/lib/supabase/client'
import type { TemplateCategory } from './templates'

export type StudioGoal = {
  id: string
  title: string
  category: TemplateCategory
  subject: string
  description: string
  base_text: string
}

const db = supabase as any

export const studioGoalsService = {
  async getGoals(): Promise<StudioGoal[]> {
    const { data, error } = await db
      .from('studio_goals')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  },
  async createGoal(goal: Omit<StudioGoal, 'id'>): Promise<StudioGoal> {
    const { data, error } = await db
      .from('studio_goals')
      .insert(goal)
      .select()
      .single()
    if (error) throw error
    return data
  },
  async updateGoal(id: string, goal: Partial<StudioGoal>): Promise<StudioGoal> {
    const { data, error } = await db
      .from('studio_goals')
      .update(goal)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
  async deleteGoal(id: string): Promise<void> {
    const { error } = await db.from('studio_goals').delete().eq('id', id)
    if (error) throw error
  },
}
