import supabase from '@/lib/supabase/client'

const db = supabase as any

export type TemplateType = 'WhatsApp' | 'E-mail'

export type TemplateCategory =
  | 'Radar VIP'
  | 'Convite VIP'
  | 'Novo Leilão'
  | 'Reativação de Cliente'
  | 'Underbidder'
  | 'Pós-leilão'
  | 'Aniversário'
  | 'Follow-up'
  | 'Boas-vindas'
  | 'Informações de Lote'
  | 'Agradecimento Pós-Compra'

export type MessageTemplate = {
  id: string
  title: string
  category: TemplateCategory
  type: TemplateType
  subject: string | null
  body: string
  variables?: string[] | null
  created_at?: string | null
  updated_at?: string | null
}

export type TemplateInsert = {
  title: string
  category: TemplateCategory
  type: TemplateType
  subject?: string | null
  body: string
  variables?: string[] | null
}

const normalizeTemplate = (row: any): MessageTemplate => ({
  id: row.id,
  title: row.title,
  category: row.category,
  type: row.type,
  subject: row.subject || null,
  body: row.body,
  variables: row.variables || [],
  created_at: row.created_at,
  updated_at: row.updated_at,
})

export const templatesService = {
  async getTemplates() {
    const { data, error } = await db
      .from('message_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(normalizeTemplate)
  },

  async createTemplate(template: TemplateInsert) {
    const { data, error } = await db
      .from('message_templates')
      .insert({
        title: template.title,
        category: template.category,
        type: template.type,
        subject: template.type === 'E-mail' ? template.subject || '' : null,
        body: template.body,
        variables: template.variables || [],
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return normalizeTemplate(data)
  },

  async updateTemplate(id: string, template: TemplateInsert) {
    const { data, error } = await db
      .from('message_templates')
      .update({
        title: template.title,
        category: template.category,
        type: template.type,
        subject: template.type === 'E-mail' ? template.subject || '' : null,
        body: template.body,
        variables: template.variables || [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return normalizeTemplate(data)
  },

  async deleteTemplate(id: string) {
    const { error } = await db.from('message_templates').delete().eq('id', id)
    if (error) throw error
  },
}
