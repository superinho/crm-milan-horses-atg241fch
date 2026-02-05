import { useState, useEffect, useMemo } from 'react'
import { dealsService, Deal, DealStage } from '@/services/deals'
import { DealCard } from './DealCard'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLUMNS: {
  id: DealStage
  title: string
  description: string
  color: string
}[] = [
  {
    id: 'Lead',
    title: 'Lead',
    description: 'Primeiro contato/interesse demonstrado',
    color: 'bg-gray-400',
  },
  {
    id: 'Qualificado',
    title: 'Qualificado',
    description: 'Lead validado, tem perfil comprador',
    color: 'bg-blue-400',
  },
  {
    id: 'Interesse',
    title: 'Interesse',
    description: 'Demonstrou interesse em lote específico',
    color: 'bg-yellow-400',
  },
  {
    id: 'Proposta',
    title: 'Proposta',
    description: 'Proposta enviada/negociação em andamento',
    color: 'bg-orange-400',
  },
  {
    id: 'Fechado',
    title: 'Fechado',
    description: 'Negócio concluído/venda realizada',
    color: 'bg-green-500',
  },
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
      // Handle potential legacy or unknown stages gracefully
      const stage = COLUMNS.find((c) => c.id === deal.stage)
        ? deal.stage
        : 'Lead'
      if (groups[stage]) {
        groups[stage].push(deal)
      }
    })
    return groups
  }, [deals])

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('dealId', dealId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedDealId(dealId)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
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
    <ScrollArea className="flex-1 w-full whitespace-nowrap rounded-md border bg-gray-50/50 p-4 h-full min-h-[500px]">
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
                'w-80 shrink-0 flex flex-col space-y-4 rounded-lg transition-colors p-2 h-full min-h-[400px] bg-gray-100/50 border border-transparent',
                isOver
                  ? 'bg-primary/5 ring-2 ring-primary/20 border-primary/20'
                  : '',
              )}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Header */}
              <div className="flex flex-col space-y-2 sticky top-0 bg-gray-100/50 backdrop-blur-sm z-10 pb-2 rounded-t-lg">
                <div className="flex items-center justify-between px-2 pt-2">
                  <span className="font-bold text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
                    {column.title}
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-white text-xs shadow-sm"
                  >
                    {columnDeals.length}
                  </Badge>
                </div>

                {/* Description */}
                <p className="px-2 text-xs text-muted-foreground leading-tight h-8 line-clamp-2 whitespace-normal">
                  {column.description}
                </p>

                <div
                  className={cn(
                    'h-1 w-full rounded-full opacity-60',
                    column.color,
                  )}
                ></div>

                <div className="px-2 text-xs text-muted-foreground font-medium flex justify-between items-center">
                  <span>Total Estimado:</span>
                  <span className="text-foreground font-bold text-sm">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      notation: 'compact',
                    }).format(totalValue)}
                  </span>
                </div>
              </div>

              {/* Cards Area */}
              <div className="flex flex-col space-y-3 flex-1 overflow-y-auto min-h-[200px] px-1 pb-2">
                {columnDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    isDragging={draggedDealId === deal.id}
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                  />
                ))}
                {columnDeals.length === 0 && (
                  <div className="flex-1 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-muted-foreground text-xs p-4 min-h-[100px] bg-white/50">
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
