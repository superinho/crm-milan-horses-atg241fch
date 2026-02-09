import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Keyboard } from 'lucide-react'

interface ShortcutsHelpProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], description: 'Abrir busca global' },
  { keys: ['Ctrl', 'N'], description: 'Novo contato' },
  { keys: ['Ctrl', 'D'], description: 'Novo negócio' },
  { keys: ['Ctrl', 'T'], description: 'Nova tarefa' },
  { keys: ['Ctrl', '/'], description: 'Mostrar atalhos' },
  { keys: ['↑', '↓'], description: 'Navegar resultados' },
  { keys: ['Enter'], description: 'Selecionar item' },
  { keys: ['Esc'], description: 'Fechar janelas' },
]

export function ShortcutsHelp({ open, onOpenChange }: ShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" /> Atalhos de Teclado
          </DialogTitle>
          <DialogDescription>
            Agilize sua navegação com os atalhos disponíveis.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Atalho</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SHORTCUTS.map((shortcut, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key) => (
                        <kbd
                          key={key}
                          className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{shortcut.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
