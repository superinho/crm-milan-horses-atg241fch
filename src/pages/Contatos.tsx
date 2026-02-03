import { useState, useMemo } from 'react'
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
  PaginationEllipsis,
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ContactForm } from '@/components/contacts/ContactForm'

// Mock Data
type Tag = 'VIP' | 'Frequente' | 'Ativo' | 'Inativo' | 'Novo Lead'

interface Contact {
  id: number
  name: string
  email: string
  phone: string
  tags: Tag[]
  totalInvested: number
  lastContact: string
}

const MOCK_CONTACTS: Contact[] = [
  {
    id: 1,
    name: 'Roberto Almeida',
    email: 'roberto@fazendaalmeida.com',
    phone: '(11) 99876-5432',
    tags: ['VIP', 'Ativo'],
    totalInvested: 150000,
    lastContact: '2023-10-25',
  },
  {
    id: 2,
    name: 'Fernanda Lima',
    email: 'fernanda.lima@email.com',
    phone: '(21) 98765-4321',
    tags: ['Frequente', 'Ativo'],
    totalInvested: 85000,
    lastContact: '2023-10-24',
  },
  {
    id: 3,
    name: 'Carlos Venturini',
    email: 'carlos.v@vet.com',
    phone: '(31) 91234-5678',
    tags: ['Novo Lead'],
    totalInvested: 0,
    lastContact: '2023-10-23',
  },
  {
    id: 4,
    name: 'Haras Pôr do Sol',
    email: 'contato@haraspordosol.com.br',
    phone: '(19) 3456-7890',
    tags: ['VIP', 'Frequente'],
    totalInvested: 540000,
    lastContact: '2023-10-22',
  },
  {
    id: 5,
    name: 'Juliana Paes',
    email: 'ju.paes@invest.com',
    phone: '(11) 95555-4444',
    tags: ['Ativo'],
    totalInvested: 45000,
    lastContact: '2023-10-21',
  },
  {
    id: 6,
    name: 'Ricardo Souza',
    email: 'ricardo@equestre.com',
    phone: '(41) 98888-7777',
    tags: ['Inativo'],
    totalInvested: 12000,
    lastContact: '2023-09-15',
  },
  {
    id: 7,
    name: 'Mariana Costa',
    email: 'mari.costa@email.com',
    phone: '(51) 99999-1111',
    tags: ['Novo Lead'],
    totalInvested: 0,
    lastContact: '2023-10-19',
  },
  {
    id: 8,
    name: 'Fazenda Santa Fé',
    email: 'adm@santafe.com',
    phone: '(62) 3333-2222',
    tags: ['VIP'],
    totalInvested: 230000,
    lastContact: '2023-10-18',
  },
  {
    id: 9,
    name: 'Pedro Martins',
    email: 'pedro.m@outlook.com',
    phone: '(11) 97777-6666',
    tags: ['Frequente'],
    totalInvested: 67000,
    lastContact: '2023-10-15',
  },
  {
    id: 10,
    name: 'Ana Beatriz',
    email: 'ana.bea@gmail.com',
    phone: '(31) 96666-5555',
    tags: ['Ativo'],
    totalInvested: 25000,
    lastContact: '2023-10-14',
  },
  {
    id: 11,
    name: 'João Silva',
    email: 'joao.silva@uol.com.br',
    phone: '(11) 91111-2222',
    tags: ['Inativo'],
    totalInvested: 5000,
    lastContact: '2023-08-20',
  },
  {
    id: 12,
    name: 'Clube Hípico SP',
    email: 'contato@chsp.com.br',
    phone: '(11) 3333-4444',
    tags: ['VIP', 'Frequente', 'Ativo'],
    totalInvested: 890000,
    lastContact: '2023-10-25',
  },
  {
    id: 13,
    name: 'Dr. Marcelo Ramos',
    email: 'm.ramos@vetcenter.com',
    phone: '(19) 98888-1111',
    tags: ['Novo Lead'],
    totalInvested: 0,
    lastContact: '2023-10-20',
  },
  {
    id: 14,
    name: 'Sofia Oliveira',
    email: 'sofia.o@yahoo.com',
    phone: '(21) 97777-3333',
    tags: ['Ativo'],
    totalInvested: 15000,
    lastContact: '2023-10-12',
  },
  {
    id: 15,
    name: 'Miguel Santos',
    email: 'miguel.santos@gmail.com',
    phone: '(31) 99988-7766',
    tags: ['Novo Lead'],
    totalInvested: 0,
    lastContact: '2023-10-24',
  },
  {
    id: 16,
    name: 'Haras Imperial',
    email: 'contato@harasimperial.com',
    phone: '(15) 3232-4545',
    tags: ['VIP'],
    totalInvested: 345000,
    lastContact: '2023-10-23',
  },
  {
    id: 17,
    name: 'Lucas Ferreira',
    email: 'lucas.ferreira@hotmail.com',
    phone: '(41) 95555-8888',
    tags: ['Inativo'],
    totalInvested: 8000,
    lastContact: '2023-07-10',
  },
  {
    id: 18,
    name: 'Beatriz Costa',
    email: 'bia.costa@gmail.com',
    phone: '(51) 94444-3333',
    tags: ['Frequente', 'Ativo'],
    totalInvested: 56000,
    lastContact: '2023-10-05',
  },
  {
    id: 19,
    name: 'Rancho fundo',
    email: 'vendas@ranchofundo.com',
    phone: '(62) 3456-7890',
    tags: ['Ativo'],
    totalInvested: 32000,
    lastContact: '2023-10-01',
  },
  {
    id: 20,
    name: 'Gabriel Souza',
    email: 'gabriel.s@outlook.com',
    phone: '(11) 92222-1111',
    tags: ['Novo Lead'],
    totalInvested: 0,
    lastContact: '2023-10-25',
  },
  {
    id: 21,
    name: 'Amanda Nunes',
    email: 'amanda.n@gmail.com',
    phone: '(21) 93333-4444',
    tags: ['Ativo'],
    totalInvested: 18000,
    lastContact: '2023-09-28',
  },
  {
    id: 22,
    name: 'Paulo Cesar',
    email: 'pc.invest@gmail.com',
    phone: '(31) 96666-7777',
    tags: ['VIP', 'Inativo'],
    totalInvested: 125000,
    lastContact: '2023-06-15',
  },
]

const ALL_TAGS: Tag[] = ['VIP', 'Frequente', 'Ativo', 'Inativo', 'Novo Lead']

export default function Contatos() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Contact
    direction: 'asc' | 'desc'
  }>({ key: 'lastContact', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [isSheetOpen, setSheetOpen] = useState(false)
  const itemsPerPage = 10

  // Filter and Sort Logic
  const filteredAndSortedContacts = useMemo(() => {
    let result = [...MOCK_CONTACTS]

    // Filtering
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      result = result.filter(
        (contact) =>
          contact.name.toLowerCase().includes(lowerSearch) ||
          contact.email.toLowerCase().includes(lowerSearch),
      )
    }

    if (selectedTags.length > 0) {
      result = result.filter((contact) =>
        contact.tags.some((tag) => selectedTags.includes(tag)),
      )
    }

    // Sorting
    result.sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [searchTerm, selectedTags, sortConfig])

  // Pagination Logic
  const totalPages = Math.ceil(filteredAndSortedContacts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedContacts = filteredAndSortedContacts.slice(
    startIndex,
    startIndex + itemsPerPage,
  )

  const handleSort = (key: keyof Contact) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const toggleTag = (tag: Tag) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag],
    )
    setCurrentPage(1) // Reset to first page on filter change
  }

  const getBadgeStyle = (tag: Tag) => {
    switch (tag) {
      case 'VIP':
        return 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      case 'Novo Lead':
        return 'bg-primary text-primary-foreground hover:bg-primary/90'
      case 'Frequente':
        return 'bg-blue-500 text-white hover:bg-blue-600'
      case 'Ativo':
        return 'bg-green-600 text-white hover:bg-green-700'
      case 'Inativo':
        return 'bg-gray-500 text-white hover:bg-gray-600'
      default:
        return 'bg-primary text-primary-foreground'
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
            <ContactForm onSuccess={() => setSheetOpen(false)} />
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
                  {ALL_TAGS.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={() => toggleTag(tag)}
                    >
                      {tag}
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
                      onClick={() => handleSort('lastContact')}
                    >
                      Último Contato
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedContacts.length > 0 ? (
                  paginatedContacts.map((contact) => (
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
                          {contact.tags.map((tag) => (
                            <Badge
                              key={tag}
                              className={cn(
                                'font-normal border-0',
                                getBadgeStyle(tag),
                              )}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(contact.totalInvested)}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(contact.lastContact).toLocaleDateString(
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-secondary"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
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
                              <DropdownMenuItem>
                                Agendar Reunião
                              </DropdownMenuItem>
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

                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1
                    if (
                      totalPages > 7 &&
                      page > 2 &&
                      page < totalPages - 1 &&
                      Math.abs(page - currentPage) > 1
                    ) {
                      if (
                        page === currentPage + 2 ||
                        page === currentPage - 2
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )
                      }
                      return null
                    }

                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(page)
                          }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

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
