import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, Cake, AlertCircle, UserX, CalendarClock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SmartAlertsProps {
  alerts: {
    birthdays: number
    overdueTasks: number
    inactiveClients: number
    pendingFollowUps: number
  }
}

export function SmartAlerts({ alerts }: SmartAlertsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-l-4 border-l-pink-500 shadow-sm hover:-translate-y-1 transition-transform cursor-default">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Aniversariantes
          </CardTitle>
          <Cake className="h-4 w-4 text-pink-500" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{alerts.birthdays}</span>
            {alerts.birthdays > 0 && (
              <Badge
                variant="secondary"
                className="bg-pink-100 text-pink-700 border-0"
              >
                Hoje
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-red-500 shadow-sm hover:-translate-y-1 transition-transform cursor-default">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Atrasadas
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{alerts.overdueTasks}</span>
            <Badge
              variant="secondary"
              className="bg-red-100 text-red-700 border-0"
            >
              Tarefas
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-gray-500 shadow-sm hover:-translate-y-1 transition-transform cursor-default">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Inativos (90d+)
          </CardTitle>
          <UserX className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{alerts.inactiveClients}</span>
            <Badge
              variant="secondary"
              className="bg-gray-100 text-gray-700 border-0"
            >
              Clientes
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500 shadow-sm hover:-translate-y-1 transition-transform cursor-default">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Follow-ups
          </CardTitle>
          <CalendarClock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              {alerts.pendingFollowUps}
            </span>
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 border-0"
            >
              Pendentes
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
