import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ActivityReportData } from '@/services/reports'
import { cn } from '@/lib/utils'

interface CampaignPerformanceTableProps {
  data: ActivityReportData['campaignPerformance']
}

export function CampaignPerformanceTable({
  data,
}: CampaignPerformanceTableProps) {
  return (
    <Card className="col-span-1 lg:col-span-2 shadow-sm">
      <CardHeader>
        <CardTitle>Desempenho de Campanhas</CardTitle>
        <CardDescription>
          Métricas detalhadas das últimas campanhas enviadas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campanha</TableHead>
              <TableHead className="text-center">Destinatários</TableHead>
              <TableHead className="text-center">Abertura</TableHead>
              <TableHead className="text-center">Cliques</TableHead>
              <TableHead className="text-right">Conversões</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground h-24"
                >
                  Nenhuma campanha encontrada no período.
                </TableCell>
              </TableRow>
            ) : (
              data.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="truncate max-w-[200px]">
                        {campaign.name}
                      </span>
                      <span
                        className={cn(
                          'text-xs font-normal',
                          campaign.status === 'Concluída'
                            ? 'text-green-600'
                            : 'text-amber-600',
                        )}
                      >
                        {campaign.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {campaign.recipients}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{campaign.openRate}%</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        'text-sm',
                        campaign.clickRate > 10
                          ? 'text-green-600 font-medium'
                          : '',
                      )}
                    >
                      {campaign.clickRate}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {campaign.conversions}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
