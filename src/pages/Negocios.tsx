import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { KanbanBoard } from '@/components/deals/KanbanBoard'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DealForm } from '@/components/deals/DealForm'

export default function Negocios() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleSuccess = () => {
    setIsDialogOpen(false)
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 animate-fade-in">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-display text-primary">
            Pipeline de Vendas
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas oportunidades de negócio e acompanhe o progresso.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Novo Negócio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Negócio</DialogTitle>
              <DialogDescription>
                Crie uma nova oportunidade de venda associada a um contato.
              </DialogDescription>
            </DialogHeader>
            <DealForm
              onSuccess={handleSuccess}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <KanbanBoard refreshTrigger={refreshTrigger} />
    </div>
  )
}
