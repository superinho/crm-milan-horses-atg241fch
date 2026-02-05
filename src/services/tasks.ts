import { supabase } from '@/lib/supabase/client'
import { Contact } from './contacts'

export type TaskType = 'Ligação' | 'E-mail' | 'WhatsApp' | 'Outro'

export type Task = {
  id: string
  title: string
  description?: string | null
  type: TaskType
  contact_id?: string | null
  deal_id?: string | null
  due_date: string
  is_completed: boolean
  has_reminder: boolean
  created_at: string
  contact?: Contact
  deal?: {
    id: string
    title: string
  }
}

export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'contact' | 'deal'>
export type TaskUpdate = Partial<TaskInsert>

export const tasksService = {
  async getTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select(
        `
        *,
        contact:contacts(*),
        deal:deals(id, title)
      `,
      )
      .order('due_date', { ascending: true })

    if (error) throw error
    return data as Task[]
  },

  async createTask(task: TaskInsert) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single()

    if (error) throw error
    return data as Task
  },

  async updateTask(id: string, updates: TaskUpdate) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Task
  },

  async deleteTask(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (error) throw error
  },

  async toggleTaskCompletion(id: string, is_completed: boolean) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ is_completed })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Task
  },
}
