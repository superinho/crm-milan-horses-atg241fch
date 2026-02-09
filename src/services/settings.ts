import { supabase } from '@/lib/supabase/client'

export interface CompanySettings {
  id?: string
  company_name: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  contact_email: string | null
  contact_phone: string | null
  contact_whatsapp: string | null
  website: string | null
  address: string | null
  email_signature: string | null
  alerts_overdue_tasks: boolean
  alerts_new_leads: boolean
  alerts_birthdays: boolean
  monthly_sales_goal: number
  monthly_new_contacts_goal: number
  conversion_rate_goal: number
  auction_default_location: string | null
  auction_default_time: string | null
  auction_default_fees: string | null
  updated_at?: string
}

export const defaultSettings: CompanySettings = {
  company_name: 'Minha Empresa',
  logo_url: null,
  primary_color: '#000000',
  secondary_color: '#ffffff',
  contact_email: '',
  contact_phone: '',
  contact_whatsapp: '',
  website: '',
  address: '',
  email_signature: '',
  alerts_overdue_tasks: true,
  alerts_new_leads: true,
  alerts_birthdays: true,
  monthly_sales_goal: 0,
  monthly_new_contacts_goal: 0,
  conversion_rate_goal: 0,
  auction_default_location: '',
  auction_default_time: '',
  auction_default_fees: '',
}

export const settingsService = {
  async getSettings() {
    // Attempt to fetch the first record
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      // If table doesn't exist or other error, log it but return default for now to avoid breaking UI
      console.error('Error fetching settings:', error)
      // Return default settings if table doesn't exist yet to allow UI to render
      return defaultSettings
    }

    return (data as CompanySettings) || defaultSettings
  },

  async updateSettings(settings: Partial<CompanySettings>) {
    // Check if record exists
    const { data: existing } = await supabase
      .from('company_settings')
      .select('id')
      .limit(1)
      .maybeSingle()

    let result
    if (existing?.id) {
      result = await supabase
        .from('company_settings')
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from('company_settings')
        .insert({ ...settings, updated_at: new Date().toISOString() })
        .select()
        .single()
    }

    if (result.error) throw result.error
    return result.data as CompanySettings
  },
}
