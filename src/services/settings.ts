export const defaultSettings = {
  company_name: 'Milan Horses',
  logo_url: null,
  primary_color: '#000000',
  secondary_color: '#ffffff',
  monthly_sales_goal: 100000,
}

export const settingsService = {
  async getSettings() {
    return defaultSettings as any
  },
  async updateSettings(s: any) {
    return s
  },
}
