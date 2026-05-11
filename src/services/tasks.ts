import pb from '@/lib/pocketbase/client'

export type Task = {
  id: string
  title: string
  description?: string
  due_date: string
  is_completed: boolean
  created: string
}

export const tasksService = {
  async getTasks() {
    const items = await pb.collection('tasks').getFullList({ sort: 'due_date' })
    return items.map((t) => ({
      ...t,
      is_completed: t.completed,
    })) as unknown as Task[]
  },

  async createTask(task: any) {
    const t = await pb.collection('tasks').create({
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      completed: task.is_completed || false,
    })
    return { ...t, is_completed: t.completed } as unknown as Task
  },

  async updateTask(id: string, updates: any) {
    const payload: any = { ...updates }
    if (updates.is_completed !== undefined) {
      payload.completed = updates.is_completed
    }
    const t = await pb.collection('tasks').update(id, payload)
    return { ...t, is_completed: t.completed } as unknown as Task
  },

  async deleteTask(id: string) {
    await pb.collection('tasks').delete(id)
  },

  async toggleTaskCompletion(id: string, is_completed: boolean) {
    const t = await pb
      .collection('tasks')
      .update(id, { completed: is_completed })
    return { ...t, is_completed: t.completed } as unknown as Task
  },
}
