import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  DollarSign,
  Trophy,
  Activity,
  User,
  MessageCircle,
  Edit,
  FileText,
  ExternalLink,
  Smartphone,
  Briefcase,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

// Mock Data Generator based on ID
const getContactDetails = (id: string) => {
  const numericId = parseInt(id) || 1

  // Base data to match list view (simulated)
  const baseData = {
    1: { name: 'Roberto Almeida', role: 'Criador' },
    2: { name: 'Fernanda Lima', role: 'Comprador' },
    3: { name: 'Carlos Venturini', role: 'Veterinário' },
    4: { name: 'Haras Pôr do Sol', role: 'Parceiro' },
    5: { name: 'Juliana Paes', role: 'Investidora' },
  }

  const basicInfo = baseData[numericId as keyof typeof baseData] || {
    name: `Contato #${numericId}`,
    role: 'Cliente',
  }

  return {
    id: numericId,
    ...basicInfo,
    email: `${basicInfo.name.toLowerCase().replace(/\s/g, '.')}@email.com`,
    phone: '(11) 99876-5432',
    whatsapp: '(11) 99876-5432',
    birthDate: '15/05/1980',
    cpf: '123.456.789-00',
    address: 'Av. Brasil, 1500 - Jardins, São Paulo - SP',
    tags: ['VIP', 'Ativo'],
    financial: {
      totalInvested: 150000 + numericId * 10000,
      horsesBought: 3 + Math.floor(numericId / 2),
      averageTicket: 45000,
      lastBidDate: '25/10/2023',
    },
    preferences: {
      breeds: ['Lusitano', 'Quarto de Milha'],
      valueRange: 'R$ 50k - R$ 100k',
      modalities: ['Adestramento', 'Lazer'],
    },
    origin: {
      source: numericId % 2 === 0 ? 'Indicação Profissional' : 'Redes Sociais',
      referrer: numericId % 2 === 0 ? 'Dr. Marcelo Ramos' : null,
    },
    notes: [
      {
        id: 1,
        date: '20/10/2023',
        text: 'Cliente demonstrou interesse no lote 45 do próximo leilão.',
      },
    ],
  }
}

export default function ContatoDetalhes() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [contact, setContact] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      if (id) {
        setContact(getContactDetails(id))
      }
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [id])

  const handleAddNote = () => {
    if (!newNote.trim()) return

    const note = {
      id: Date.now(),
      date: new Date().toLocaleDateString('pt-BR'),
      text: newNote,
    }

    setContact((prev: any) => ({
      ...prev,
      notes: [note, ...prev.notes],
    }))

    setNewNote('')
    setIsNoteDialogOpen(false)
    toast({
      title: 'Nota adicionada',
      description: 'A nota foi salva com sucesso no histórico do contato.',
    })
  }

  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/55${contact.whatsapp.replace(/\D/g, '')}`,
      '_blank',
    )
  }

  const handleEmail = () => {
    window.location.href = `mailto:${contact.email}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
        <h2 className="text-2xl font-bold text-muted-foreground">
          Contato não encontrado
        </h2>
        <Button onClick={() => navigate('/contatos')}>Voltar para lista</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/contatos')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-display text-primary flex items-center gap-3">
              {contact.name}
              {contact.tags.map((tag: string) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {tag}
                </Badge>
              ))}
            </h1>
            <p className="text-muted-foreground text-sm">{contact.role}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
          </Button>
          <Button variant="outline" onClick={handleEmail}>
            <Mail className="mr-2 h-4 w-4" /> E-mail
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast({
                title: 'Editar',
                description: 'Funcionalidade de edição em breve.',
              })
            }
          >
            <Edit className="mr-2 h-4 w-4" /> Editar
          </Button>

          <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <FileText className="mr-2 h-4 w-4" /> Adicionar Nota
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nota Interna</DialogTitle>
                <DialogDescription>
                  Esta nota ficará visível apenas para a equipe.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea
                  placeholder="Digite sua observação..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsNoteDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleAddNote}>Salvar Nota</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-t-4 border-t-primary shadow-sm h-full">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage
                    src={`https://img.usecurling.com/ppl/medium?gender=male&seed=${contact.id}`}
                  />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {contact.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-center text-xl">
                Informações Pessoais
              </CardTitle>
              <CardDescription className="text-center">
                Dados cadastrais do cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                  <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-medium text-muted-foreground">
                      E-mail
                    </p>
                    <p
                      className="text-sm font-medium truncate"
                      title={contact.email}
                    >
                      {contact.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                  <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Telefone
                    </p>
                    <p className="text-sm font-medium">{contact.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                  <Smartphone className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      WhatsApp
                    </p>
                    <p className="text-sm font-medium">{contact.whatsapp}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Data de Nascimento
                    </p>
                    <p className="text-sm font-medium">{contact.birthDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                  <CreditCard className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      CPF
                    </p>
                    <p className="text-sm font-medium">{contact.cpf}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Endereço
                    </p>
                    <p className="text-sm font-medium leading-tight">
                      {contact.address}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Columns - Financial, Preferences, Origin */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Summary */}
          <Card className="border-t-4 border-t-secondary shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-secondary" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-muted/30 p-4 rounded-lg border border-muted">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
                    Total Investido
                  </p>
                  <p className="text-xl font-bold text-primary font-display">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      maximumFractionDigits: 0,
                    }).format(contact.financial.totalInvested)}
                  </p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border border-muted">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
                    Cavalos Arrematados
                  </p>
                  <p className="text-xl font-bold text-primary font-display flex items-center gap-2">
                    {contact.financial.horsesBought}{' '}
                    <Trophy className="h-4 w-4 text-secondary opacity-80" />
                  </p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border border-muted">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
                    Ticket Médio
                  </p>
                  <p className="text-xl font-bold text-primary font-display">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      maximumFractionDigits: 0,
                    }).format(contact.financial.averageTicket)}
                  </p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border border-muted">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
                    Último Lance
                  </p>
                  <p className="text-xl font-bold text-primary font-display flex items-center gap-2">
                    {contact.financial.lastBidDate}{' '}
                    <Activity className="h-4 w-4 text-green-600 opacity-80" />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Preferences */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Preferências
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Raças de Interesse
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {contact.preferences.breeds.map((breed: string) => (
                      <Badge
                        key={breed}
                        variant="outline"
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                      >
                        {breed}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Modalidades
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {contact.preferences.modalities.map((mod: string) => (
                      <Badge
                        key={mod}
                        variant="outline"
                        className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                      >
                        {mod}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Faixa de Valor
                  </p>
                  <p className="font-medium text-foreground">
                    {contact.preferences.valueRange}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Origin */}
            <Card className="shadow-sm flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Origem do Lead
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Canal de Aquisição
                  </p>
                  <p className="text-lg font-semibold text-primary">
                    {contact.origin.source}
                  </p>
                </div>

                {contact.origin.source === 'Indicação Profissional' &&
                  contact.origin.referrer && (
                    <div className="bg-secondary/10 p-4 rounded-md border border-secondary/20">
                      <p className="text-xs text-secondary-foreground uppercase tracking-wide mb-1 font-semibold flex items-center gap-1">
                        <User className="h-3 w-3" /> Profissional Indicador
                      </p>
                      <p className="text-lg font-semibold text-secondary-foreground">
                        {contact.origin.referrer}
                      </p>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-secondary-foreground text-xs hover:text-secondary-foreground/80 mt-1"
                      >
                        Ver perfil do profissional{' '}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  )}

                {/* Internal Notes Section inside Origin or Separate? 
                     User story didn't strictly specify Notes Card location, but requested 'Adicionar nota'.
                     I'll display recent notes here for utility.
                 */}
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center justify-between">
                    Últimas Notas
                  </p>
                  <div className="space-y-3">
                    {contact.notes.map((note: any) => (
                      <div
                        key={note.id}
                        className="text-sm bg-muted/40 p-3 rounded-md border border-muted/60"
                      >
                        <p className="text-xs text-muted-foreground mb-1">
                          {note.date}
                        </p>
                        <p className="text-foreground">{note.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
