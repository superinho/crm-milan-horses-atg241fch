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
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
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
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  ArrowUpDown,
  Eye,
  Pencil,
  FileDown,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ContactForm } from '@/components/contacts/ContactForm'
import { contactsService, type Contact, type Tag } from '@/services/contacts'
import { useToast } from '@/hooks/use-toast'

export default function Contatos() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  }>({ key: 'created_at', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [isSheetOpen, setSheetOpen] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const itemsPerPage = 10
  const { toast } = useToast()

  // Fetch Tags
  useEffect(() => {
    contactsService
      .getTags()
      .then((tags) => setAvailableTags(tags || []))
      .catch(console.error)
  }, [])

  // Fetch Contacts
  const fetchContacts = async () => {
    setLoading(true)
    try {
      const { data, count, error } = await contactsService.getContacts({
        page: currentPage,
        pageSize: itemsPerPage,
        search: searchTerm,
        tags: selectedTags,
        sortBy: sortConfig.key,
        sortDirection: sortConfig.direction,
      })
      if (error) throw error
      setContacts(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Falha ao carregar contatos.',
        variant: 'destructive',
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
  }, [currentPage, searchTerm, selectedTags, sortConfig])

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const toggleTag = (tagName: string) => {
    setSelectedTags((current) =>
      current.includes(tagName)
        ? current.filter((t) => t !== tagName)
        : [...current, tagName],
    )
    setCurrentPage(1)
  }

  const getBadgeStyle = (tag: string) => {
    // We will use the color from DB or fallback
    const found = availableTags.find((t) => t.name === tag)
    if (found) return found.color

    // Fallback classes if DB color string is not a valid class (though seed uses classes)
    switch (tag) {
      case 'VIP':
        return 'bg-secondary text-secondary-foreground'
      case 'Novo Lead':
        return 'bg-primary text-primary-foreground'
      default:
        return 'bg-gray-500 text-white'
    }
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
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-medium hidden md:block">
              Lista de Contatos
            </CardTitle>

            <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full md:w-auto ml-auto"
                  >
                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                    Filtrar Tags
                    {selectedTags.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 h-5 px-1.5 rounded-full text-xs"
                      >
                        {selectedTags.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableTags.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag.id}
                      checked={selectedTags.includes(tag.name)}
                      onCheckedChange={() => toggleTag(tag.name)}
                    >
                      {tag.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {selectedTags.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="justify-center text-center font-medium text-destructive cursor-pointer"
                        onClick={() => setSelectedTags([])}
                      >
                        Limpar Filtros
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="icon" className="hidden md:flex">
                <FileDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
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
                    <Button
                      variant="ghost"
                      className="p-0 hover:bg-transparent font-semibold text-foreground flex items-center gap-1"
                      onClick={() => handleSort('totalInvested')}
                    >
                      Valor Investido
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
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
                        <div className="flex flex-wrap gap-1">
                          {contact.tags?.map((tag) => (
                            <Badge
                              key={tag.id}
                              className={cn(
                                'font-normal border-0',
                                tag.color || getBadgeStyle(tag.name),
                              )}
                            >
                              {tag.name}
                            </Badge>
                          ))}
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
                              <DropdownMenuItem className="text-destructive">
                                Excluir Contato
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
                            setSelectedTags([])
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
    </div>
  )
}
