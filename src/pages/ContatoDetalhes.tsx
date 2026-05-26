import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  ExternalLink,
  Smartphone,
  Briefcase,
  X,
  Tag as TagIcon,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { contactsService, type Contact, type Tag } from '@/services/contacts'
import {
  BEHAVIOR_TAGS,
  MANUAL_PRIORITY_TAGS,
  tagsService,
} from '@/services/tags'
import { cn, getContrastColor } from '@/lib/utils'
import { ContactPurchases } from '@/components/ContactPurchases'
import { ContactBids } from '@/components/ContactBids'
import { ContactTimeline } from '@/components/ContactTimeline'
import { TagSelector } from '@/components/tags/TagSelector'
import { MessageDialog } from '@/components/templates/MessageDialog'

export default function ContatoDetalhes() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [contact, setContact] = useState<Contact | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [messageDialogTab, setMessageDialogTab] = useState<
    'WhatsApp' | 'E-mail'
  >('WhatsApp')
  const [timelineRefreshTrigger, setTimelineRefreshTrigger] = useState(0)

  const fetchContact = () => {
    if (id) {
      contactsService
        .getContactById(id)
        .then((data) => setContact(data as Contact))
        .catch((err) => {
          console.error(err)
          toast({
            title: 'Erro',
            description: 'Não foi possível carregar o contato.',
            variant: 'destructive',
          })
        })
        .finally(() => setIsLoading(false))
    }
  }

  useEffect(() => {
    fetchContact()
  }, [id, toast])

  const handleWhatsApp = () => {
    setMessageDialogTab('WhatsApp')
    setIsMessageDialogOpen(true)
  }

  const handleEmail = () => {
    if (contact?.email) {
      setMessageDialogTab('E-mail')
      setIsMessageDialogOpen(true)
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    if (!contact) return
    try {
      await contactsService.removeTagFromContact(contact.id, tagId)
      fetchContact()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a tag.',
        variant: 'destructive',
      })
    }
  }

  const handleTogglePriorityTag = async (tagName: string) => {
    if (!contact) return
    try {
      const tags = await tagsService.ensureMilanTags()
      const tag = tags.find((item) => item.name === tagName)
      if (!tag) throw new Error('Tag não encontrada.')

      const isSelected = contact.tags?.some((item) => item.id === tag.id)
      if (isSelected) {
        await contactsService.removeTagFromContact(contact.id, tag.id)
      } else {
        await contactsService.addTagToContact(contact.id, tag.id)
      }
      fetchContact()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a classificação do contato.',
        variant: 'destructive',
      })
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

  // Calculate financials for the summary card
  const totalInvested =
    contact?.purchases?.reduce((acc, curr) => acc + Number(curr.value), 0) || 0
  const horsesBought = contact?.purchases?.length || 0
  const averageTicket = horsesBought > 0 ? totalInvested / horsesBought : 0
  const lastBidDate =
    contact?.purchases && contact.purchases.length > 0
      ? new Date(
          Math.max(...contact.purchases.map((p) => new Date(p.date).getTime())),
        ).toLocaleDateString('pt-BR')
      : '-'

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
            </h1>
            <p className="text-muted-foreground text-sm">
              Cliente desde {new Date(contact.created_at).getFullYear()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={() => {
              setMessageDialogTab('WhatsApp')
              setIsMessageDialogOpen(true)
            }}
          >
            <Send className="mr-2 h-4 w-4" /> Enviar Mensagem
          </Button>
          <Button
            variant="outline"
            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
            onClick={handleWhatsApp}
            disabled={!contact.whatsapp && !contact.phone}
          >
            <MessageCircle className="mr-2 h-4 w-4" /> Enviar WhatsApp
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-t-4 border-t-primary shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
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
                    <p className="text-sm font-medium">
                      {contact.whatsapp || '-'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Data de Nascimento
                    </p>
                    <p className="text-sm font-medium">
                      {contact.birth_date
                        ? new Date(contact.birth_date).toLocaleDateString(
                            'pt-BR',
                          )
                        : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                  <CreditCard className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      CPF
                    </p>
                    <p className="text-sm font-medium">{contact.cpf || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Endereço
                    </p>
                    <p className="text-sm font-medium leading-tight">
                      {contact.address || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags Section */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-primary" />
                  Tags
                </div>
                <TagSelector
                  contactId={contact.id}
                  currentTags={contact.tags || []}
                  onTagChange={fetchContact}
                  variant="icon"
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Curadoria Milan
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {MANUAL_PRIORITY_TAGS.map((tag) => {
                    const selected = contact.tags?.some(
                      (item) => item.name === tag.name,
                    )
                    return (
                      <Button
                        key={tag.name}
                        type="button"
                        size="sm"
                        variant={selected ? 'default' : 'outline'}
                        className="h-8 text-xs"
                        style={
                          selected
                            ? {
                                backgroundColor: tag.color,
                                color: getContrastColor(tag.color),
                                borderColor: tag.color,
                              }
                            : {}
                        }
                        onClick={() => handleTogglePriorityTag(tag.name)}
                      >
                        {tag.name}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Tags do contato
                </p>
                <div className="flex flex-wrap gap-2">
                  {contact.tags && contact.tags.length > 0 ? (
                    contact.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        className={cn(
                          'font-normal py-1 pr-1 gap-1',
                          !tag.color?.startsWith('#') && tag.color,
                        )}
                        style={getBadgeStyle(tag)}
                      >
                        {tag.name}
                        <button
                          onClick={() => handleRemoveTag(tag.id)}
                          className="rounded-full p-0.5 hover:bg-black/10 focus:outline-none"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Nenhuma tag atribuída.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Comportamento automático
                </p>
                <div className="flex flex-wrap gap-2">
                  {contact.tags?.some((tag) =>
                    BEHAVIOR_TAGS.some((item) => item.name === tag.name),
                  ) ? (
                    contact.tags
                      .filter((tag) =>
                        BEHAVIOR_TAGS.some((item) => item.name === tag.name),
                      )
                      .map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          style={getBadgeStyle(tag)}
                        >
                          {tag.name}
                        </Badge>
                      ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Nenhuma tag comportamental aplicada ainda.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Columns - Financial, Preferences, Origin, Timeline */}
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
                    }).format(totalInvested)}
                  </p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border border-muted">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
                    Cavalos Arrematados
                  </p>
                  <p className="text-xl font-bold text-primary font-display flex items-center gap-2">
                    {horsesBought}{' '}
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
                    }).format(averageTicket)}
                  </p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border border-muted">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
                    Último Lance
                  </p>
                  <p className="text-xl font-bold text-primary font-display flex items-center gap-2">
                    {lastBidDate}{' '}
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
                    {contact.preferences?.breeds?.map((breed: string) => (
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
                    {contact.preferences?.modalities?.map((mod: string) => (
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
                    {contact.preferences?.valueRange || '-'}
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
                    {contact.origin}
                  </p>
                </div>

                {contact.origin === 'Indicação Profissional' && (
                  <div className="bg-secondary/10 p-4 rounded-md border border-secondary/20">
                    <p className="text-xs text-secondary-foreground uppercase tracking-wide mb-1 font-semibold flex items-center gap-1">
                      <User className="h-3 w-3" /> Profissional Indicador
                    </p>
                    <p className="text-lg font-semibold text-secondary-foreground">
                      Dr. Marcelo Ramos (Simulado)
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

                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center justify-between">
                    Notas Gerais
                  </p>
                  <div className="text-sm bg-muted/40 p-3 rounded-md border border-muted/60">
                    <p className="text-foreground">
                      {contact.notes || 'Nenhuma nota.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline Section */}
          <ContactTimeline
            contactId={contact.id}
            refreshTrigger={timelineRefreshTrigger}
          />
        </div>
      </div>

      {/* New Purchase History Section */}
      <Separator className="my-8" />
      <ContactPurchases contactId={contact.id} />

      {/* New Bids Section */}
      <Separator className="my-8" />
      <ContactBids contactId={contact.id} />

      {/* Message Dialog */}
      {contact && (
        <MessageDialog
          contact={contact}
          open={isMessageDialogOpen}
          onOpenChange={setIsMessageDialogOpen}
          onInteractionAdded={() =>
            setTimelineRefreshTrigger((prev) => prev + 1)
          }
          initialTab={messageDialogTab}
        />
      )}
    </div>
  )
}
