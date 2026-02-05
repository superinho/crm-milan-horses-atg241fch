import { supabase } from '@/lib/supabase/client'

export type AutomationSetting = {
  id: string
  rule_key: string
  name: string
  description: string
  is_active: boolean
  config?: any
  updated_at: string
}

export const automationsService = {
  async getSettings() {
    const { data, error } = await supabase
      .from('automation_settings')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data as AutomationSetting[]
  },

  async updateSetting(id: string, updates: Partial<AutomationSetting>) {
    const { data, error } = await supabase
      .from('automation_settings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as AutomationSetting
  },

  async triggerAutomationProcess() {
    const { data, error } = await supabase.functions.invoke(
      'process-automation-tasks',
    )
    if (error) throw error
    return data
  },
}
