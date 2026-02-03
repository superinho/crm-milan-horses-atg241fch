import { useState } from 'react'
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
import { Search, Plus, Filter, MoreHorizontal, Phone, Mail } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Mock Data
const CONTACTS_DATA = [
  {
    id: 1,
    name: 'Roberto Almeida',
    email: 'roberto@fazendaalmeida.com',
    phone: '(11) 99876-5432',
    type: 'Criador',
    lastContact: '2023-10-25',
  },
  {
    id: 2,
    name: 'Fernanda Lima',
    email: 'fernanda.lima@email.com',
    phone: '(21) 98765-4321',
    type: 'Comprador',
    lastContact: '2023-10-24',
  },
  {
    id: 3,
    name: 'Carlos Venturini',
    email: 'carlos.v@vet.com',
    phone: '(31) 91234-5678',
    type: 'Veterinário',
    lastContact: '2023-10-23',
  },
  {
    id: 4,
    name: 'Haras Pôr do Sol',
    email: 'contato@haraspordosol.com.br',
    phone: '(19) 3456-7890',
    type: 'Parceiro',
    lastContact: '2023-10-22',
  },
  {
    id: 5,
    name: 'Juliana Paes',
    email: 'ju.paes@invest.com',
    phone: '(11) 95555-4444',
    type: 'Investidora',
    lastContact: '2023-10-21',
  },
  {
    id: 6,
    name: 'Ricardo Souza',
    email: 'ricardo@equestre.com',
    phone: '(41) 98888-7777',
    type: 'Treinador',
    lastContact: '2023-10-20',
  },
  {
    id: 7,
    name: 'Mariana Costa',
    email: 'mari.costa@email.com',
    phone: '(51) 99999-1111',
    type: 'Comprador',
    lastContact: '2023-10-19',
  },
  {
    id: 8,
    name: 'Fazenda Santa Fé',
    email: 'adm@santafe.com',
    phone: '(62) 3333-2222',
    type: 'Criador',
    lastContact: '2023-10-18',
  },
]

export default function Contatos() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredContacts = CONTACTS_DATA.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'Comprador':
        return 'default' // primary
      case 'Criador':
        return 'secondary' // secondary
      case 'Veterinário':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-primary">
            Contatos
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes, parceiros e leads.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="mr-2 h-4 w-4" /> Novo Contato
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">
              Lista de Contatos
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou tipo..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Último Contato</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="group hover:bg-muted/30"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${contact.id}`}
                          />
                          <AvatarFallback>
                            {contact.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{contact.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-muted-foreground">
                        <Mail className="mr-2 h-3 w-3" />
                        {contact.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-muted-foreground">
                        <Phone className="mr-2 h-3 w-3" />
                        {contact.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(contact.type) as any}>
                        {contact.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(contact.lastContact).toLocaleDateString(
                        'pt-BR',
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                          <DropdownMenuItem>Editar contato</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhum contato encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
