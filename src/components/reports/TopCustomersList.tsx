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
import { ReportData } from '@/services/reports'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface TopCustomersListProps {
  data: ReportData['topCustomers']
}

export function TopCustomersList({ data }: TopCustomersListProps) {
  return (
    <Card className="col-span-1 lg:col-span-2 shadow-sm">
      <CardHeader>
        <CardTitle>Top 10 Clientes</CardTitle>
        <CardDescription>
          Clientes com maior volume de investimento no período.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Cliente</TableHead>
              <TableHead className="text-center">Compras</TableHead>
              <TableHead className="text-right">Valor Investido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground h-24"
                >
                  Nenhum dado encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data.map((customer, index) => (
                <TableRow key={customer.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium flex items-center gap-3">
                    <span className="text-muted-foreground font-mono text-xs w-4">
                      {index + 1}
                    </span>
                    <Avatar className="h-8 w-8 border border-muted">
                      <AvatarImage
                        src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${customer.id}`}
                      />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {customer.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-[150px] sm:max-w-none">
                      {customer.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {customer.count}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      maximumFractionDigits: 0,
                    }).format(customer.total)}
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
