import { dealsService } from './deals'
import { contactsService } from './contacts'

export const reportsService = {
  async getReportData(startDate: Date, endDate: Date) {
    const deals = await dealsService.getDeals()

    const wonDeals = deals.filter((d) => d.stage === 'Fechado')
    const totalRevenue = wonDeals.reduce((acc, d) => acc + (d.value || 0), 0)

    return {
      salesByMonth: [
        {
          name: 'Mês Atual',
          value: totalRevenue,
          count: wonDeals.length,
          average: totalRevenue / (wonDeals.length || 1),
        },
      ],
      topCustomers: [],
      salesByBreed: [],
      metrics: {
        totalRevenue,
        totalSales: wonDeals.length,
        avgTicket: wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0,
        totalLeads: deals.length,
        totalCustomers: wonDeals.length,
        conversionRate:
          deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0,
      },
      seasonality: {
        peakMonth: 'N/A',
        lowMonth: 'N/A',
        analysis:
          'Dados de sazonalidade baseados no histórico de vendas (mocked).',
      },
    }
  },

  async getActivityReportData() {
    return {
      interactionsOverTime: [],
      emailResponseRate: 0,
      emailOpenHeatmap: [],
      campaignPerformance: [],
      topTemplates: [],
      newContactsGrowth: [],
    }
  },
}
