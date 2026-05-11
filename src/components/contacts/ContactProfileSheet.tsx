import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ExternalLink,
  Gavel,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShoppingBag,
  Star,
  Trophy,
  UserRound,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  contactsService,
  type Bid,
  type Contact,
  type Purchase,
} from '@/services/contacts'

type ContactProfileSheetProps = {
  contactId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ProfileState = {
  contact: Contact
  purchases: Purchase[]
  bids: Bid[]
  rfmv: any
}

const money = (value: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const date = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('pt-BR') : '-'

const digitsOnly = (value?: string | null) =>
  String(value || '').replace(/\D/g, '')

function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: React.ElementType
}) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{label}</span>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="mt-1 truncate text-base font-semibold">{value}</div>
    </div>
  )
}

function ActivityItem({
  title,
  subtitle,
  value,
  icon: Icon,
}: {
  title: string
  subtitle: string
  value: string
  icon: React.ElementType
}) {
  return (
    <div className="flex gap-3 rounded-md border px-3 py-2">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <div className="shrink-0 text-sm font-semibold">{value}</div>
    </div>
  )
}

export function ContactProfileSheet({
  contactId,
  open,
  onOpenChange,
}: ContactProfileSheetProps) {
  const [state, setState] = useState<ProfileState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !contactId) return

    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      contactsService.getContactById(contactId),
      contactsService.getPurchasesByContactId(contactId),
      contactsService.getBidsByContactId(contactId),
      contactsService.getContactRfmvById(contactId),
    ])
      .then(([contact, purchases, bids, rfmv]) => {
        if (!cancelled) setState({ contact, purchases, bids, rfmv })
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setError('Não foi possível carregar este cliente.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [contactId, open])

  const contact = state?.contact
  const phoneDigits = digitsOnly(contact?.whatsapp || contact?.phone)
  const whatsappHref = phoneDigits ? `https://wa.me/55${phoneDigits}` : ''
  const telHref = phoneDigits ? `tel:+55${phoneDigits}` : ''
  const mailHref = contact?.email ? `mailto:${contact.email}` : ''

  const preferredInfo = useMemo(() => {
    const preferences = contact?.preferences || {}
    return [
      preferences.farm ? `Fazenda: ${preferences.farm}` : null,
      preferences.breeds?.length
        ? `Raças: ${preferences.breeds.join(', ')}`
        : null,
      preferences.modalities?.length
        ? `Modalidades: ${preferences.modalities.join(', ')}`
        : null,
      preferences.valueRange ? `Faixa: ${preferences.valueRange}` : null,
    ].filter(Boolean)
  }, [contact])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-hidden p-0 sm:max-w-2xl">
        <ScrollArea className="h-full">
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                <SheetHeader className="pr-8">
                  <SheetTitle>Carregando cliente</SheetTitle>
                  <SheetDescription>
                    Buscando dados de contato, RFMV e histórico.
                  </SheetDescription>
                </SheetHeader>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : error ? (
              <EmptyLine>{error}</EmptyLine>
            ) : contact ? (
              <div className="space-y-5">
                <SheetHeader className="pr-8">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 border">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {contact.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <SheetTitle className="truncate text-xl">
                        {contact.name}
                      </SheetTitle>
                      <SheetDescription>
                        {contact.origin || 'CRM Milan Horses'}
                      </SheetDescription>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {contact.segment && (
                          <Badge variant="secondary">{contact.segment}</Badge>
                        )}
                        {contact.rfmvScore ? (
                          <Badge variant="outline">
                            RFMV {contact.rfmvScore}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </SheetHeader>

                <div className="grid grid-cols-3 gap-2">
                  <Button asChild disabled={!whatsappHref}>
                    <a
                      href={whatsappHref || undefined}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </a>
                  </Button>
                  <Button asChild variant="outline" disabled={!telHref}>
                    <a href={telHref || undefined}>
                      <Phone className="mr-2 h-4 w-4" />
                      Ligar
                    </a>
                  </Button>
                  <Button asChild variant="outline" disabled={!mailHref}>
                    <a href={mailHref || undefined}>
                      <Mail className="mr-2 h-4 w-4" />
                      E-mail
                    </a>
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <Stat
                    label="Arremates"
                    value={state.purchases.length}
                    icon={ShoppingBag}
                  />
                  <Stat
                    label="Valor total"
                    value={money(contact.totalInvested)}
                    icon={Trophy}
                  />
                  <Stat
                    label="Ticket médio"
                    value={money(contact.avgTicket)}
                    icon={Star}
                  />
                  <Stat label="Lances" value={state.bids.length} icon={Gavel} />
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Dados do cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          E-mail
                        </div>
                        <div className="truncate font-medium">
                          {contact.email || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Telefone
                        </div>
                        <div className="font-medium">
                          {contact.whatsapp || contact.phone || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          CPF/CNPJ
                        </div>
                        <div className="font-medium">
                          {contact.document || contact.cpf || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Data de nascimento
                        </div>
                        <div className="font-medium">
                          {date(contact.birth_date)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Última atividade
                        </div>
                        <div className="font-medium">
                          {date(contact.lastActivityDate)}
                        </div>
                      </div>
                    </div>

                    {(contact.city || contact.state || contact.address) && (
                      <>
                        <Separator />
                        <div className="flex gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {[contact.city, contact.state]
                                .filter(Boolean)
                                .join(', ') || '-'}
                            </div>
                            {contact.address && (
                              <div className="text-muted-foreground">
                                {contact.address}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {preferredInfo.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-1">
                          {preferredInfo.map((info) => (
                            <div key={info} className="text-muted-foreground">
                              {info}
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {contact.notes && (
                      <>
                        <Separator />
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Notas
                          </div>
                          <div className="mt-1 text-muted-foreground">
                            {contact.notes}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Tabs defaultValue="compras" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="compras">Compras</TabsTrigger>
                    <TabsTrigger value="lances">Lances</TabsTrigger>
                  </TabsList>

                  <TabsContent value="compras" className="space-y-2">
                    {state.purchases.length ? (
                      state.purchases
                        .slice(0, 8)
                        .map((purchase) => (
                          <ActivityItem
                            key={purchase.id}
                            icon={ShoppingBag}
                            title={
                              purchase.description ||
                              `Lote ${purchase.lot_number || '-'}`
                            }
                            subtitle={`${date(purchase.date)} · Lote ${purchase.lot_number || '-'}`}
                            value={money(purchase.value)}
                          />
                        ))
                    ) : (
                      <EmptyLine>Nenhuma compra registrada.</EmptyLine>
                    )}
                  </TabsContent>

                  <TabsContent value="lances" className="space-y-2">
                    {state.bids.length ? (
                      state.bids
                        .slice(0, 8)
                        .map((bid) => (
                          <ActivityItem
                            key={bid.id}
                            icon={Gavel}
                            title={
                              bid.reason || `Lote ${bid.lot_number || '-'}`
                            }
                            subtitle={`${date(bid.date)} · Lote ${bid.lot_number || '-'}`}
                            value={money(bid.value)}
                          />
                        ))
                    ) : (
                      <EmptyLine>Nenhum lance registrado.</EmptyLine>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end">
                  <Button asChild variant="outline">
                    <Link to={`/contatos/${contact.id}`}>
                      <UserRound className="mr-2 h-4 w-4" />
                      Abrir ficha completa
                      <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
