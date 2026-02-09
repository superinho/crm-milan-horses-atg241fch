import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { ActivityReportData } from '@/services/reports'
import { FileText } from 'lucide-react'

interface TopTemplatesListProps {
  data: ActivityReportData['topTemplates']
}

export function TopTemplatesList({ data }: TopTemplatesListProps) {
  // Find max for progress bar calculation
  const maxCount = Math.max(...data.map((t) => t.count), 1)

  return (
    <Card className="col-span-1 shadow-sm">
      <CardHeader>
        <CardTitle>Templates Mais Utilizados</CardTitle>
        <CardDescription>
          Modelos de comunicação com maior frequência de envio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.map((template, index) => (
          <div key={template.id} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-muted rounded-full">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="font-medium truncate max-w-[150px]">
                  {template.name}
                </span>
              </div>
              <span className="text-muted-foreground">{template.count}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary/80 rounded-full"
                style={{ width: `${(template.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum dado de template disponível.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
