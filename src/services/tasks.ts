import supabase from '@/lib/supabase/client'

const db = supabase as any

export type Task = {
  id: string
  title: string
  description?: string
  type?: string
  contact_id?: string | null
  deal_id?: string | null
  due_date: string
  is_completed: boolean
  has_reminder?: boolean
  created_at?: string
  created: string
}

const mapTask = (task: any): Task => ({
  ...task,
  is_completed: Boolean(task.is_completed),
  created: task.created_at,
})

export const tasksService = {
  async getTasks() {
    const { data, error } = await db
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true })

    if (error) throw error
    return (data || []).map(mapTask)
  },

  async createTask(task: any) {
    const payload = {
      title: task.title,
      description: task.description || null,
      type: task.type || 'Outro',
      contact_id: task.contact_id || null,
      deal_id: task.deal_id || null,
      due_date: task.due_date,
      is_completed: task.is_completed || false,
      has_reminder: task.has_reminder || false,
    }

    const { data, error } = await db
      .from('tasks')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return mapTask(data)
  },

  async updateTask(id: string, updates: any) {
    const { data, error } = await db
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapTask(data)
  },

  async deleteTask(id: string) {
    const { error } = await db.from('tasks').delete().eq('id', id)
    if (error) throw error
  },

  async toggleTaskCompletion(id: string, is_completed: boolean) {
    return this.updateTask(id, { is_completed })
  },
}
