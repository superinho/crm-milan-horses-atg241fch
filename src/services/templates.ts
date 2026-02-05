import { supabase } from '@/lib/supabase/client'

export type TemplateCategory =
  | 'Boas-vindas'
  | 'Novo Leilão'
  | 'Informações de Lote'
  | 'Agradecimento Pós-Compra'
  | 'Reativação de Cliente'
  | 'Aniversário'
  | 'Follow-up'

export type TemplateType = 'WhatsApp' | 'E-mail'

export type MessageTemplate = {
  id: string
  title: string
  category: TemplateCategory
  type: TemplateType
  subject?: string | null
  body: string
  created_at: string
}

export type TemplateInsert = Omit<MessageTemplate, 'id' | 'created_at'>
export type TemplateUpdate = Partial<TemplateInsert>

export const templatesService = {
  async getTemplates() {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .order('category', { ascending: true })
      .order('title', { ascending: true })

    if (error) throw error
    return data as MessageTemplate[]
  },

  async createTemplate(template: TemplateInsert) {
    const { data, error } = await supabase
      .from('message_templates')
      .insert(template)
      .select()
      .single()

    if (error) throw error
    return data as MessageTemplate
  },

  async updateTemplate(id: string, updates: TemplateUpdate) {
    const { data, error } = await supabase
      .from('message_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as MessageTemplate
  },

  async deleteTemplate(id: string) {
    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
