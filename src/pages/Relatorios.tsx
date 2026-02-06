import { useState, useEffect } from 'react'
import { subMonths } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DateRangeFilter } from '@/components/reports/DateRangeFilter'
import { ReportSummary } from '@/components/reports/ReportSummary'
import { SalesEvolutionChart } from '@/components/reports/SalesEvolutionChart'
import { AverageTicketChart } from '@/components/reports/AverageTicketChart'
import { BreedDistributionChart } from '@/components/reports/BreedDistributionChart'
import { TopCustomersList } from '@/components/reports/TopCustomersList'
import { SeasonalityAnalysis } from '@/components/reports/SeasonalityAnalysis'
import { reportsService, ReportData } from '@/services/reports'
import { useToast } from '@/hooks/use-toast'

export default function Relatorios() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 12),
    to: new Date(),
  })
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchReports = async () => {
    if (!date?.from || !date?.to) return

    setLoading(true)
    try {
      const reportData = await reportsService.getReportData(date.from, date.to)
      setData(reportData)
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
  }, [date])

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
            Acompanhe o desempenho de vendas e indicadores estratégicos.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <DateRangeFilter date={date} setDate={setDate} />
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

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          <ReportSummary data={data.metrics} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SalesEvolutionChart data={data.salesByMonth} />
            <div className="space-y-6 flex flex-col">
              <SeasonalityAnalysis data={data.seasonality} />
              <div className="flex-1">
                <BreedDistributionChart data={data.salesByBreed} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TopCustomersList data={data.topCustomers} />
            <AverageTicketChart data={data.salesByMonth} />
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          Selecione um período para visualizar os dados.
        </div>
      )}
    </div>
  )
}
