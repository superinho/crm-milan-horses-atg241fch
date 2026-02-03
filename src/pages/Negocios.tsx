import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, MoreVertical, DollarSign, Calendar } from 'lucide-react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

type Deal = {
  id: number
  title: string
  client: string
  value: number
  date: string
  columnId: string
}

const INITIAL_DEALS: Deal[] = [
  {
    id: 1,
    title: 'Cavalo Lusitano Puro',
    client: 'Roberto Almeida',
    value: 150000,
    date: '12 Out',
    columnId: 'prospeccao',
  },
  {
    id: 2,
    title: 'Potro Manga Larga',
    client: 'Haras Pôr do Sol',
    value: 45000,
    date: '15 Out',
    columnId: 'qualificacao',
  },
  {
    id: 3,
    title: 'Égua Crioula',
    client: 'Fernanda Lima',
    value: 85000,
    date: '10 Out',
    columnId: 'proposta',
  },
  {
    id: 4,
    title: 'Garanhão Árabe',
    client: 'Investidor Dubai',
    value: 450000,
    date: '20 Out',
    columnId: 'negociacao',
  },
  {
    id: 5,
    title: 'Venda Coletiva Leilão',
    client: 'Associação BR',
    value: 1200000,
    date: '01 Out',
    columnId: 'fechado',
  },
  {
    id: 6,
    title: 'Ponei Shetland',
    client: 'Escola Infantil',
    value: 12000,
    date: '22 Out',
    columnId: 'prospeccao',
  },
]

const COLUMNS = [
  { id: 'prospeccao', title: 'Prospecção', color: 'bg-blue-100 text-blue-800' },
  {
    id: 'qualificacao',
    title: 'Qualificação',
    color: 'bg-yellow-100 text-yellow-800',
  },
  { id: 'proposta', title: 'Proposta', color: 'bg-orange-100 text-orange-800' },
  {
    id: 'negociacao',
    title: 'Negociação',
    color: 'bg-purple-100 text-purple-800',
  },
  { id: 'fechado', title: 'Fechado', color: 'bg-green-100 text-green-800' },
]

export default function Negocios() {
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS)

  const getDealsByColumn = (columnId: string) =>
    deals.filter((deal) => deal.columnId === columnId)

  // Simulation of moving a deal to the next column
  const moveDealNext = (dealId: number, currentColumnId: string) => {
    const columnIndex = COLUMNS.findIndex((c) => c.id === currentColumnId)
    if (columnIndex < COLUMNS.length - 1) {
      const nextColumn = COLUMNS[columnIndex + 1].id
      setDeals(
        deals.map((d) =>
          d.id === dealId ? { ...d, columnId: nextColumn } : d,
        ),
      )
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-display text-primary">
            Pipeline de Vendas
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o progresso das suas negociações.
          </p>
        </div>
        <Button className="bg-secondary hover:bg-secondary/90 text-white">
          <Plus className="mr-2 h-4 w-4" /> Novo Negócio
        </Button>
      </div>

      <ScrollArea className="flex-1 w-full whitespace-nowrap rounded-md border bg-muted/20 p-4">
        <div className="flex space-x-4 pb-4">
          {COLUMNS.map((column) => {
            const columnDeals = getDealsByColumn(column.id)
            const totalValue = columnDeals.reduce(
              (acc, curr) => acc + curr.value,
              0,
            )

            return (
              <div
                key={column.id}
                className="w-80 shrink-0 flex flex-col space-y-4"
              >
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between px-2">
                    <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                      {column.title}
                    </span>
                    <Badge variant="outline" className="bg-white">
                      {columnDeals.length}
                    </Badge>
                  </div>
                  <div
                    className={`h-1 w-full rounded-full ${column.color.split(' ')[0].replace('bg-', 'bg-')}`}
                  ></div>
                  <div className="px-2 text-xs text-muted-foreground font-medium">
                    Total:{' '}
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(totalValue)}
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  {columnDeals.map((deal) => (
                    <Card
                      key={deal.id}
                      className="cursor-pointer hover:shadow-md transition-all active:scale-95 border-l-4 border-l-transparent hover:border-l-primary"
                      onClick={() => moveDealNext(deal.id, deal.columnId)}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-semibold text-primary truncate pr-2">
                            {deal.title}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -mr-2 -mt-2"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Avatar className="h-5 w-5 mr-2">
                              <AvatarFallback className="text-[10px] bg-secondary text-white">
                                {deal.client.substring(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-[100px]">
                              {deal.client}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t flex items-center justify-between">
                          <Badge
                            variant="secondary"
                            className="font-normal text-xs px-1.5 py-0 h-5"
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            {new Intl.NumberFormat('pt-BR', {
                              notation: 'compact',
                              compactDisplay: 'short',
                              currency: 'BRL',
                              style: 'currency',
                            }).format(deal.value)}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Calendar className="h-3 w-3 mr-1" /> {deal.date}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground border border-dashed border-border hover:border-primary hover:text-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Adicionar
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
