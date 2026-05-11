export const settingsService = {
  async getSettings() {
    return {
      company_name: 'Milan Horses',
      logo_url: null,
      primary_color: '#000000',
      secondary_color: '#ffffff',
      monthly_sales_goal: 100000,
    } as any
  },
  async updateSettings(s: any) {
    return s
  },
}
