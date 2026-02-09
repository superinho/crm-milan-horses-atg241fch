import { useState, useEffect } from 'react'
import { Filter, X, Save, Trash2, Check } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { MultiSelect } from '@/components/ui/multi-select'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'

import { contactsService, Tag } from '@/services/contacts'
import { savedFiltersService, SavedFilter } from '@/services/saved-filters'
import { useToast } from '@/hooks/use-toast'

interface AdvancedFilterProps {
  onFilterChange: (filters: FilterState) => void
  currentFilters: FilterState
}

export interface FilterState {
  tags: string[]
  segment: string | null
  minInvestment: string
  maxInvestment: string
  lastContactRange?: DateRange
  status: 'active' | 'inactive' | null
  breed: string | null
  location: string
}

const BREEDS = [
  { label: 'Lusitano', value: 'Lusitano' },
  { label: 'Brasileiro de Hipismo', value: 'BH' },
  { label: 'Quarto de Milha', value: 'Quarto de Milha' },
  { label: 'Árabe', value: 'Árabe' },
  { label: 'Manga Larga', value: 'Manga Larga' },
  { label: 'PSI', value: 'PSI' },
]

const SEGMENTS = [
  'VIP',
  'Frequentes',
  'Ativos',
  'Novos Leads',
  'Inativos',
  'Sem Segmento',
]

export function AdvancedFilter({
  onFilterChange,
  currentFilters,
}: AdvancedFilterProps) {
  const [open, setOpen] = useState(false)
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [filters, setFilters] = useState<FilterState>(currentFilters)
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [newFilterName, setNewFilterName] = useState('')
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    contactsService
      .getTags()
      .then((tags) => setAvailableTags(tags || []))
      .catch(console.error)
    setSavedFilters(savedFiltersService.getFilters())
  }, [])

  // Sync internal state when props change
  useEffect(() => {
    setFilters(currentFilters)
  }, [currentFilters])

  const handleApply = () => {
    onFilterChange(filters)
    setOpen(false)
  }

  const handleClear = () => {
    const emptyFilters: FilterState = {
      tags: [],
      segment: null,
      minInvestment: '',
      maxInvestment: '',
      lastContactRange: undefined,
      status: null,
      breed: null,
      location: '',
    }
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  const handleSaveFilter = () => {
    if (!newFilterName.trim()) return

    savedFiltersService.saveFilter({
      name: newFilterName,
      criteria: filters,
    })

    setSavedFilters(savedFiltersService.getFilters())
    setNewFilterName('')
    setSaveDialogOpen(false)
    toast({
      title: 'Filtro salvo',
      description: 'Configuração de filtro salva com sucesso.',
    })
  }

  const handleLoadFilter = (saved: SavedFilter) => {
    // Parse date strings back to Date objects if necessary
    const loadedFilters = { ...saved.criteria }
    if (loadedFilters.lastContactRange) {
      loadedFilters.lastContactRange = {
        from: loadedFilters.lastContactRange.from
          ? new Date(loadedFilters.lastContactRange.from)
          : undefined,
        to: loadedFilters.lastContactRange.to
          ? new Date(loadedFilters.lastContactRange.to)
          : undefined,
      }
    }
    setFilters(loadedFilters)
    onFilterChange(loadedFilters)
    toast({
      title: 'Filtro aplicado',
      description: `Filtro "${saved.name}" foi carregado.`,
    })
  }

  const handleDeleteFilter = (id: string) => {
    savedFiltersService.deleteFilter(id)
    setSavedFilters(savedFiltersService.getFilters())
  }

  const tagOptions = availableTags.map((t) => ({
    label: t.name,
    value: t.name,
  }))

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros Avançados
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>Filtros Avançados</SheetTitle>
          <SheetDescription>
            Segmente seus contatos com múltiplos critérios.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4 mt-6">
          <div className="space-y-6 px-1">
            {/* Saved Filters Quick Access */}
            {savedFilters.length > 0 && (
              <div className="space-y-3">
                <Label>Filtros Salvos</Label>
                <div className="flex flex-wrap gap-2">
                  {savedFilters.map((saved) => (
                    <Badge
                      key={saved.id}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80 py-1 px-2 flex items-center gap-1"
                      onClick={() => handleLoadFilter(saved)}
                    >
                      {saved.name}
                      <X
                        className="h-3 w-3 ml-1 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFilter(saved.id)
                        }}
                      />
                    </Badge>
                  ))}
                </div>
                <Separator />
              </div>
            )}

            {/* Criteria Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tags</Label>
                <MultiSelect
                  options={tagOptions}
                  selected={filters.tags}
                  onChange={(val) => setFilters({ ...filters, tags: val })}
                  placeholder="Selecione tags..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Segmento</Label>
                  <Select
                    value={filters.segment || 'all'}
                    onValueChange={(val) =>
                      setFilters({
                        ...filters,
                        segment: val === 'all' ? null : val,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {SEGMENTS.map((seg) => (
                        <SelectItem key={seg} value={seg}>
                          {seg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(val) =>
                      setFilters({
                        ...filters,
                        status: val === 'all' ? null : (val as any),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Investimento Total (R$)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minInvestment}
                    onChange={(e) =>
                      setFilters({ ...filters, minInvestment: e.target.value })
                    }
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxInvestment}
                    onChange={(e) =>
                      setFilters({ ...filters, maxInvestment: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Último Contato</Label>
                <DatePickerWithRange
                  date={filters.lastContactRange}
                  setDate={(date) =>
                    setFilters({ ...filters, lastContactRange: date })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Raça de Interesse</Label>
                  <Select
                    value={filters.breed || 'all'}
                    onValueChange={(val) =>
                      setFilters({
                        ...filters,
                        breed: val === 'all' ? null : val,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Qualquer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer</SelectItem>
                      {BREEDS.map((breed) => (
                        <SelectItem key={breed.value} value={breed.value}>
                          {breed.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Localização</Label>
                  <Input
                    placeholder="Cidade ou Estado"
                    value={filters.location}
                    onChange={(e) =>
                      setFilters({ ...filters, location: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="mt-4 flex-col sm:flex-row gap-2">
          <div className="flex-1 flex justify-start">
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Save className="h-4 w-4" /> Salvar Filtro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Salvar Configuração de Filtro</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Label>Nome do Filtro</Label>
                  <Input
                    placeholder="Ex: Clientes VIP Lusitano"
                    value={newFilterName}
                    onChange={(e) => setNewFilterName(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveFilter}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Button variant="ghost" onClick={handleClear}>
            Limpar
          </Button>
          <Button onClick={handleApply}>Aplicar Filtros</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
