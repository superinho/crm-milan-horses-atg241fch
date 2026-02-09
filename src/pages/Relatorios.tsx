import { useState, useEffect } from 'react'
import { subMonths } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DateRangeFilter } from '@/components/reports/DateRangeFilter'
import { ReportSummary } from '@/components/reports/ReportSummary'
import { SalesEvolutionChart } from '@/components/reports/SalesEvolutionChart'
import { AverageTicketChart } from '@/components/reports/AverageTicketChart'
import { BreedDistributionChart } from '@/components/reports/BreedDistributionChart'
import { TopCustomersList } from '@/components/reports/TopCustomersList'
import { SeasonalityAnalysis } from '@/components/reports/SeasonalityAnalysis'
import { ActivitySummary } from '@/components/reports/ActivitySummary'
import { InteractionsChart } from '@/components/reports/InteractionsChart'
import { EmailOpeningHeatmap } from '@/components/reports/EmailOpeningHeatmap'
import { CampaignPerformanceTable } from '@/components/reports/CampaignPerformanceTable'
import { TopTemplatesList } from '@/components/reports/TopTemplatesList'
import { NewContactsChart } from '@/components/reports/NewContactsChart'
import {
  reportsService,
  ReportData,
  ActivityReportData,
} from '@/services/reports'
import { useToast } from '@/hooks/use-toast'

export default function Relatorios() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 12),
    to: new Date(),
  })
  const [reportType, setReportType] = useState('sales')
  const [teamMember, setTeamMember] = useState('all')

  const [salesData, setSalesData] = useState<ReportData | null>(null)
  const [activityData, setActivityData] = useState<ActivityReportData | null>(
    null,
  )

  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchReports = async () => {
    if (!date?.from || !date?.to) return

    setLoading(true)
    try {
      if (reportType === 'sales') {
        const data = await reportsService.getReportData(date.from, date.to)
        setSalesData(data)
      } else {
        const data = await reportsService.getActivityReportData(
          date.from,
          date.to,
          teamMember,
        )
        setActivityData(data)
      }
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Falha ao carregar relatório.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [date, reportType, teamMember])

  const handleExport = () => {
    window.print()
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold font-display text-primary">
            Relatórios e Análises
          </h1>
          <p className="text-muted-foreground">
            Acompanhe indicadores de vendas e comunicação.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <DateRangeFilter date={date} setDate={setDate} />
          {reportType === 'activity' && (
            <Select value={teamMember} onValueChange={setTeamMember}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Membro da Equipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos da Equipe</SelectItem>
                <SelectItem value="current">Meu Usuário</SelectItem>
                {/* Future users would be mapped here */}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2 bg-white"
          >
            <FileDown className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-8">
        <h1 className="text-2xl font-bold text-black">
          Relatório Gerencial - Milan Horses
        </h1>
        <p className="text-sm text-gray-500">
          Período: {date?.from?.toLocaleDateString()} a{' '}
          {date?.to?.toLocaleDateString()}
        </p>
      </div>

      <Tabs value={reportType} onValueChange={setReportType} className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-6">
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="activity">Atividades</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <TabsContent value="sales" className="space-y-6 animate-fade-in">
              {salesData ? (
                <>
                  <ReportSummary data={salesData.metrics} />

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <SalesEvolutionChart data={salesData.salesByMonth} />
                    <div className="space-y-6 flex flex-col">
                      <SeasonalityAnalysis data={salesData.seasonality} />
                      <div className="flex-1">
                        <BreedDistributionChart data={salesData.salesByBreed} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <TopCustomersList data={salesData.topCustomers} />
                    <AverageTicketChart data={salesData.salesByMonth} />
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  Sem dados disponíveis para o período.
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-6 animate-fade-in">
              {activityData ? (
                <>
                  <ActivitySummary
                    emailResponseRate={activityData.emailResponseRate}
                    totalInteractions={activityData.interactionsOverTime.reduce(
                      (acc, curr) =>
                        acc +
                        curr.email +
                        curr.whatsapp +
                        curr.phone +
                        curr.note,
                      0,
                    )}
                    newContacts={activityData.newContactsGrowth.reduce(
                      (acc, curr) => acc + curr.value,
                      0,
                    )}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <InteractionsChart
                      data={activityData.interactionsOverTime}
                    />
                    <NewContactsChart data={activityData.newContactsGrowth} />
                  </div>

                  <EmailOpeningHeatmap data={activityData.emailOpenHeatmap} />

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <CampaignPerformanceTable
                      data={activityData.campaignPerformance}
                    />
                    <TopTemplatesList data={activityData.topTemplates} />
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  Sem dados de atividade disponíveis.
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
