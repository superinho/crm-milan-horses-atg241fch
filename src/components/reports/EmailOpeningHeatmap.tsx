import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { ActivityReportData } from '@/services/reports'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface EmailOpeningHeatmapProps {
  data: ActivityReportData['emailOpenHeatmap']
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const HOURS = [
  '00',
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
  '21',
  '22',
  '23',
]

export function EmailOpeningHeatmap({ data }: EmailOpeningHeatmapProps) {
  // Find max value for normalization
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  const getColorClass = (value: number) => {
    const intensity = value / maxValue
    if (value === 0) return 'bg-muted/30'
    if (intensity < 0.2) return 'bg-blue-100 dark:bg-blue-900/30'
    if (intensity < 0.4) return 'bg-blue-300 dark:bg-blue-800/50'
    if (intensity < 0.6) return 'bg-blue-500 dark:bg-blue-700'
    if (intensity < 0.8) return 'bg-blue-700 dark:bg-blue-600'
    return 'bg-blue-900 dark:bg-blue-500'
  }

  return (
    <Card className="col-span-1 lg:col-span-3 shadow-sm">
      <CardHeader>
        <CardTitle>Heatmap de Abertura de E-mails</CardTitle>
        <CardDescription>
          Melhores horários e dias de engajamento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[auto_1fr] gap-2">
              {/* Days Y-Axis */}
              <div className="flex flex-col justify-between pt-6 pb-2 pr-2">
                {DAYS.map((day) => (
                  <span
                    key={day}
                    className="text-xs font-medium text-muted-foreground h-8 flex items-center"
                  >
                    {day}
                  </span>
                ))}
              </div>

              <div>
                {/* Hours X-Axis */}
                <div className="grid grid-cols-24 gap-1 mb-2">
                  {HOURS.map((hour) => (
                    <span
                      key={hour}
                      className="text-[10px] text-center text-muted-foreground"
                    >
                      {hour}
                    </span>
                  ))}
                </div>

                {/* Grid */}
                <div className="grid grid-rows-7 gap-1">
                  {DAYS.map((_, dayIndex) => (
                    <div key={dayIndex} className="grid grid-cols-24 gap-1 h-8">
                      {HOURS.map((_, hourIndex) => {
                        const cellData = data.find(
                          (d) => d.day === dayIndex && d.hour === hourIndex,
                        )
                        const value = cellData?.value || 0
                        return (
                          <Tooltip key={`${dayIndex}-${hourIndex}`}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  'w-full h-full rounded-sm transition-colors',
                                  getColorClass(value),
                                )}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                {DAYS[dayIndex]} às {hourIndex}:00 - {value}{' '}
                                aberturas
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
