import { useState, useEffect, useMemo } from 'react'
import { dealsService, Deal, DealStage } from '@/services/deals'
import { DealCard } from './DealCard'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLUMNS: { id: DealStage; title: string; color: string }[] = [
  { id: 'Lead', title: 'Lead', color: 'bg-gray-100 text-gray-800' },
  {
    id: 'Qualificado',
    title: 'Qualificado',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    id: 'Interesse',
    title: 'Interesse',
    color: 'bg-yellow-100 text-yellow-800',
  },
  { id: 'Proposta', title: 'Proposta', color: 'bg-orange-100 text-orange-800' },
  { id: 'Fechado', title: 'Fechado', color: 'bg-green-100 text-green-800' },
]

interface KanbanBoardProps {
  refreshTrigger?: number
}

export function KanbanBoard({ refreshTrigger = 0 }: KanbanBoardProps) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchDeals = async () => {
    try {
      const data = await dealsService.getDeals()
      setDeals(data)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Falha ao carregar negócios.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeals()
  }, [refreshTrigger])

  const groupedDeals = useMemo(() => {
    const groups: Record<string, Deal[]> = {}
    COLUMNS.forEach((col) => {
      groups[col.id] = []
    })
    deals.forEach((deal) => {
      if (groups[deal.stage]) {
        groups[deal.stage].push(deal)
      }
    })
    return groups
  }, [deals])

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('dealId', dealId)
    setDraggedDealId(dealId)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setDragOverColumn(null)
    const dealId = e.dataTransfer.getData('dealId')
    setDraggedDealId(null)

    if (!dealId) return

    const deal = deals.find((d) => d.id === dealId)
    if (deal && deal.stage !== columnId) {
      // Optimistic update
      setDeals((current) =>
        current.map((d) =>
          d.id === dealId
            ? {
                ...d,
                stage: columnId as DealStage,
                updated_at: new Date().toISOString(),
              }
            : d,
        ),
      )

      try {
        await dealsService.updateDealStage(dealId, columnId)
        toast({
          description: `Negócio movido para ${columnId}`,
          duration: 2000,
        })
      } catch (error) {
        console.error(error)
        toast({
          title: 'Erro',
          description: 'Falha ao atualizar o estágio do negócio.',
          variant: 'destructive',
        })
        fetchDeals() // Revert on error
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 w-full whitespace-nowrap rounded-md border bg-muted/20 p-4 h-full min-h-[500px]">
      <div className="flex space-x-4 pb-4 h-full">
        {COLUMNS.map((column) => {
          const columnDeals = groupedDeals[column.id] || []
          const totalValue = columnDeals.reduce(
            (acc, curr) => acc + curr.value,
            0,
          )
          const isOver = dragOverColumn === column.id

          return (
            <div
              key={column.id}
              className={cn(
                'w-80 shrink-0 flex flex-col space-y-4 rounded-lg transition-colors p-2 h-full min-h-[400px]',
                isOver ? 'bg-primary/5 ring-2 ring-primary/20' : '',
              )}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Header */}
              <div className="flex flex-col space-y-2 sticky top-0 bg-muted/20 z-10 pb-2">
                <div className="flex items-center justify-between px-2">
                  <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    {column.title}
                  </span>
                  <Badge variant="outline" className="bg-background">
                    {columnDeals.length}
                  </Badge>
                </div>
                <div
                  className={`h-1 w-full rounded-full ${column.color.split(' ')[0]}`}
                ></div>
                <div className="px-2 text-xs text-muted-foreground font-medium flex justify-between">
                  <span>Total Estimado:</span>
                  <span className="text-foreground">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      notation: 'compact',
                    }).format(totalValue)}
                  </span>
                </div>
              </div>

              {/* Cards Area */}
              <div className="flex flex-col space-y-3 flex-1 overflow-y-auto min-h-[200px]">
                {columnDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    isDragging={draggedDealId === deal.id}
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                  />
                ))}
                {columnDeals.length === 0 && (
                  <div className="flex-1 border-2 border-dashed border-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs p-4 min-h-[100px]">
                    Arraste cards aqui
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
