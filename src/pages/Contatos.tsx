import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Search,
  Plus,
  MoreHorizontal,
  Phone,
  Mail,
  ArrowUpDown,
  Eye,
  FileDown,
  Loader2,
  X,
  Info,
  Trash2,
} from 'lucide-react'
import { cn, getContrastColor } from '@/lib/utils'
import { ContactForm } from '@/components/contacts/ContactForm'
import { contactsService, type Contact, type Tag } from '@/services/contacts'
import { useToast } from '@/hooks/use-toast'
import { TagSelector } from '@/components/tags/TagSelector'
import {
  AdvancedFilter,
  FilterState,
} from '@/components/contacts/AdvancedFilter'

export default function Contatos() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    tags: [],
    segment: null,
    minInvestment: '',
    maxInvestment: '',
    status: null,
    breed: null,
    location: '',
  })

  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  }>({ key: 'created_at', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [isSheetOpen, setSheetOpen] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const itemsPerPage = 10
  const { toast } = useToast()

  // Fetch Contacts
  const fetchContacts = async () => {
    setLoading(true)
    try {
      const { data, count, error } = await contactsService.getContacts({
        page: currentPage,
        pageSize: itemsPerPage,
        search: searchTerm,
        tags: filters.tags,
        segment: filters.segment,
        minInvestment: filters.minInvestment
          ? Number(filters.minInvestment)
          : undefined,
        maxInvestment: filters.maxInvestment
          ? Number(filters.maxInvestment)
          : undefined,
        lastContactRange: filters.lastContactRange,
        status: filters.status,
        breed: filters.breed,
        location: filters.location,
        sortBy: sortConfig.key,
        sortDirection: sortConfig.direction,
      })
      if (error) throw error
      setContacts(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar contatos.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchContacts()
    }, 500)
    return () => clearTimeout(timer)
  }, [currentPage, searchTerm, filters, sortConfig])

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleRemoveTag = async (contactId: string, tagId: string) => {
    try {
      await contactsService.removeTagFromContact(contactId, tagId)
      fetchContacts()
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível remover a tag.',
      })
    }
  }

  const confirmDelete = (contact: Contact) => {
    setContactToDelete(contact)
    setDeleteDialogOpen(true)
  }

  const handleDeleteContact = async () => {
    if (!contactToDelete) return
    setIsDeleting(true)
    try {
      await contactsService.deleteContact(contactToDelete.id)
      toast({
        variant: 'success',
        title: 'Contato excluído',
        description: `O contato ${contactToDelete.name} foi removido.`,
      })
      fetchContacts()
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível excluir o contato.',
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setContactToDelete(null)
    }
  }

  const getBadgeStyle = (tag: Tag) => {
    if (tag.color && tag.color.startsWith('#')) {
      return {
        backgroundColor: tag.color,
        color: getContrastColor(tag.color),
        border: 'none',
      }
    }
    return {}
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-primary">
            Contatos
          </h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus clientes e leads em um só lugar.
          </p>
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Adicionar novo contato
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Novo Contato</SheetTitle>
              <SheetDescription>
                Preencha as informações abaixo para adicionar um novo cliente ou
                lead.
              </SheetDescription>
            </SheetHeader>
            <ContactForm
              onSuccess={() => {
                setSheetOpen(false)
                fetchContacts()
              }}
            />
          </SheetContent>
        </Sheet>
      </div>

      <Card className="border-t-4 border-t-primary shadow-sm">
        <CardHeader className="pb-3 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-medium hidden md:block">
              Lista de Contatos
            </CardTitle>

            <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <AdvancedFilter
                onFilterChange={handleFilterChange}
                currentFilters={filters}
              />

              <Button variant="outline" size="icon" className="hidden md:flex">
                <FileDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.tags.length > 0 ||
            filters.segment ||
            filters.status ||
            filters.breed ||
            filters.location ||
            filters.minInvestment ||
            filters.lastContactRange) && (
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-sm text-muted-foreground self-center mr-1">
                Filtros ativos:
              </span>
              {filters.tags.map((t) => (
                <Badge
                  key={`tag-${t}`}
                  variant="secondary"
                  className="px-2 py-1 text-xs"
                >
                  Tag: {t}
                </Badge>
              ))}
              {filters.segment && (
                <Badge variant="secondary" className="px-2 py-1 text-xs">
                  Segmento: {filters.segment}
                </Badge>
              )}
              {filters.status && (
                <Badge variant="secondary" className="px-2 py-1 text-xs">
                  Status: {filters.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              )}
              {filters.breed && (
                <Badge variant="secondary" className="px-2 py-1 text-xs">
                  Raça: {filters.breed}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[300px]">
                    <Button
                      variant="ghost"
                      className="p-0 hover:bg-transparent font-semibold text-foreground flex items-center gap-1"
                      onClick={() => handleSort('name')}
                    >
                      Nome
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        className="p-0 hover:bg-transparent font-semibold text-foreground flex items-center gap-1"
                        onClick={() => handleSort('totalInvested')}
                      >
                        Valor Investido
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Soma total de todas as compras realizadas</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="p-0 hover:bg-transparent font-semibold text-foreground flex items-center gap-1"
                      onClick={() => handleSort('updated_at')}
                    >
                      Último Contato
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : contacts.length > 0 ? (
                  contacts.map((contact) => (
                    <TableRow
                      key={contact.id}
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-muted">
                            <AvatarImage
                              src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${contact.id}`}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {contact.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <Link
                              to={`/contatos/${contact.id}`}
                              className="font-semibold text-foreground hover:text-primary transition-colors"
                            >
                              {contact.name}
                            </Link>
                            {contact.address && (
                              <span
                                className="text-xs text-muted-foreground truncate max-w-[150px]"
                                title={contact.address}
                              >
                                {contact.address}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-muted-foreground text-sm">
                          <Mail className="mr-2 h-3 w-3 opacity-70" />
                          {contact.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-muted-foreground text-sm whitespace-nowrap">
                          <Phone className="mr-2 h-3 w-3 opacity-70" />
                          {contact.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          {contact.tags?.map((tag) => (
                            <Badge
                              key={tag.id}
                              className={cn(
                                'font-normal group/tag pr-1',
                                !tag.color?.startsWith('#') && tag.color,
                              )}
                              style={getBadgeStyle(tag)}
                            >
                              {tag.name}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()
                                  handleRemoveTag(contact.id, tag.id)
                                }}
                                className="ml-1 rounded-full p-0.5 hover:bg-black/10 focus:outline-none"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                          <TagSelector
                            contactId={contact.id}
                            currentTags={contact.tags || []}
                            onTagChange={fetchContacts}
                            variant="icon"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format((contact as any).totalInvested)}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(contact.updated_at).toLocaleDateString(
                          'pt-BR',
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                          >
                            <Link
                              to={`/contatos/${contact.id}`}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground"
                              >
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem>Enviar E-mail</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => confirmDelete(contact)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                Contato
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Search className="h-8 w-8 mb-2 opacity-50" />
                        <p>Nenhum contato encontrado com os filtros atuais.</p>
                        <Button
                          variant="link"
                          onClick={() => {
                            setSearchTerm('')
                            setFilters({
                              tags: [],
                              segment: null,
                              minInvestment: '',
                              maxInvestment: '',
                              lastContactRange: undefined,
                              status: null,
                              breed: null,
                              location: '',
                            })
                          }}
                          className="mt-2 text-primary"
                        >
                          Limpar todos os filtros
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }}
                      className={
                        currentPage === 1
                          ? 'pointer-events-none opacity-50'
                          : ''
                      }
                    />
                  </PaginationItem>

                  <span className="text-sm text-muted-foreground mx-4">
                    Página {currentPage} de {totalPages}
                  </span>

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }}
                      className={
                        currentPage === totalPages
                          ? 'pointer-events-none opacity-50'
                          : ''
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o
              contato
              <span className="font-semibold"> {contactToDelete?.name} </span>e
              todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
