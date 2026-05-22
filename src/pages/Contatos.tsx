import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
} from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { Link } from 'react-router-dom'
import {
  Search,
  Plus,
  MoreHorizontal,
  Phone,
  Mail,
  MessageCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  FileDown,
  Loader2,
  X,
  Info,
  Trash2,
  MapPin,
  Upload,
  RefreshCcw,
  Users,
  UserCheck,
  UserX,
  Send,
  Tag as TagIcon,
  ChevronDown,
} from 'lucide-react'
import { cn, getContrastColor } from '@/lib/utils'
import { ContactForm } from '@/components/contacts/ContactForm'
import {
  contactsService,
  type Contact,
  type ContactOverview,
  type Tag,
} from '@/services/contacts'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { TagSelector } from '@/components/tags/TagSelector'
import {
  AdvancedFilter,
  FilterState,
} from '@/components/contacts/AdvancedFilter'
import { ContactProfileSheet } from '@/components/contacts/ContactProfileSheet'
import { supabase } from '@/lib/supabase/client'
import { birthdaysImportService } from '@/services/birthdays-import'
import {
  smartLeiloesSyncService,
  type SmartLeiloesSyncRun,
  type SmartLeiloesSyncSummary,
} from '@/services/smartleiloes-sync'

const initialFilters: FilterState = {
  tags: [],
  segment: null,
  minInvestment: '',
  maxInvestment: '',
  minPurchases: '',
  maxPurchases: '',
  minBids: '',
  maxBids: '',
  status: null,
  breed: null,
  location: '',
  hasWhatsapp: false,
}

const emptyOverview: ContactOverview = {
  total: 0,
  buyers: 0,
  inactive: 0,
  active: 0,
  withWhatsapp: 0,
  totalInvested: 0,
  avgTicket: 0,
}

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)

const formatDateTime = (date?: string | null) => {
  if (!date) return 'Ainda não sincronizado'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

const getSyncSavedCount = (summary?: SmartLeiloesSyncSummary | null) =>
  Object.values(summary || {}).reduce(
    (total, counter) => total + Number(counter?.saved || 0),
    0,
  )

export default function Contatos() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<FilterState>(initialFilters)

  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  }>({ key: 'lastActivity', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [isSheetOpen, setSheetOpen] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<ContactOverview>(emptyOverview)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [syncingSmartLeiloes, setSyncingSmartLeiloes] = useState(false)
  const [latestSyncRun, setLatestSyncRun] =
    useState<SmartLeiloesSyncRun | null>(null)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null,
  )
  const [profileOpen, setProfileOpen] = useState(false)
  const [importingBirthdays, setImportingBirthdays] = useState(false)
  const birthdayFileInputRef = useRef<HTMLInputElement>(null)

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulking, setIsBulking] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(0)
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const { toast } = useToast()

  const openProfile = (contact: Contact) => {
    setSelectedContactId(contact.id)
    setProfileOpen(true)
  }

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true)
    try {
      setOverview(await contactsService.getContactOverview())
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar visão geral de contatos.',
      })
    } finally {
      setOverviewLoading(false)
    }
  }, [toast])

  const fetchLatestSyncRun = useCallback(async () => {
    try {
      const [latestRun] = await smartLeiloesSyncService.getLatestRuns(1)
      setLatestSyncRun(latestRun || null)
    } catch (error) {
      console.error(error)
    }
  }, [])

  // Fetch Contacts
  const fetchContacts = useCallback(async () => {
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
        minPurchases: filters.minPurchases
          ? Number(filters.minPurchases)
          : undefined,
        maxPurchases: filters.maxPurchases
          ? Number(filters.maxPurchases)
          : undefined,
        minBids: filters.minBids ? Number(filters.minBids) : undefined,
        maxBids: filters.maxBids ? Number(filters.maxBids) : undefined,
        lastContactRange: filters.lastContactRange,
        status: filters.status,
        breed: filters.breed,
        location: filters.location,
        hasWhatsapp: filters.hasWhatsapp,
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
  }, [currentPage, itemsPerPage, filters, searchTerm, sortConfig, toast])

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchContacts()
    }, 500)
    return () => clearTimeout(timer)
  }, [fetchContacts])

  useEffect(() => {
    fetchOverview()
    fetchLatestSyncRun()
    contactsService.getTags().then(setAvailableTags).catch(console.error)
  }, [fetchOverview, fetchLatestSyncRun])

  useRealtime('contacts', () => {
    fetchContacts()
    fetchOverview()
  })

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === 'asc' ? (
        <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowDown className="h-3 w-3" />
      )
    }
    return <ArrowUpDown className="h-3 w-3 opacity-50" />
  }

  const handleSort = (key: string) => {
    const defaultDescKeys = new Set([
      'lastActivity',
      'totalInvested',
      'purchaseCount',
      'bidCount',
      'rfmvScore',
    ])

    setSortConfig((current) => ({
      key,
      direction:
        current.key === key
          ? current.direction === 'asc'
            ? 'desc'
            : 'asc'
          : defaultDescKeys.has(key)
            ? 'desc'
            : 'asc',
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
      fetchOverview()
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

  const applyQuickFilter = (nextFilters: Partial<FilterState>) => {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
    }))
    setCurrentPage(1)
  }

  const applyOverviewFilter = (nextFilters: Partial<FilterState>) => {
    setSearchTerm('')
    setFilters({
      ...initialFilters,
      ...nextFilters,
    })
    setCurrentPage(1)
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setFilters({ ...initialFilters })
    setCurrentPage(1)
  }

  const handleBulkAddTag = async (tagId: string) => {
    if (selectedIds.size === 0) return
    setIsBulking(true)
    setBulkProgress(0)
    try {
      const contactIds = Array.from(selectedIds)
      const chunkSize = 500

      for (let i = 0; i < contactIds.length; i += chunkSize) {
        const chunk = contactIds.slice(i, i + chunkSize)
        const { error } = await supabase.rpc('bulk_add_tag_to_contacts', {
          p_contact_ids: chunk,
          p_tag_id: tagId,
        })
        if (error) throw error
        setBulkProgress(
          Math.round(((i + chunk.length) / contactIds.length) * 100),
        )
      }

      toast({
        variant: 'success',
        title: 'Tags adicionadas',
        description: `A tag foi adicionada a ${selectedIds.size} contato(s) com sucesso.`,
      })
      setSelectedIds(new Set())
      fetchContacts()
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro na operação em lote',
        description:
          'Ocorreu um erro ao adicionar as tags a alguns contatos. Por favor, tente novamente.',
      })
    } finally {
      setIsBulking(false)
      setBulkProgress(0)
    }
  }

  const exportContacts = async () => {
    try {
      toast({ title: 'Iniciando exportação...' })
      let allData: Contact[] = []
      let page = 1
      let hasMore = true

      while (hasMore) {
        const { data } = await contactsService.getContacts({
          page,
          pageSize: 1000,
          search: searchTerm,
          tags: filters.tags,
          segment: filters.segment,
          minInvestment: filters.minInvestment
            ? Number(filters.minInvestment)
            : undefined,
          maxInvestment: filters.maxInvestment
            ? Number(filters.maxInvestment)
            : undefined,
          minPurchases: filters.minPurchases
            ? Number(filters.minPurchases)
            : undefined,
          maxPurchases: filters.maxPurchases
            ? Number(filters.maxPurchases)
            : undefined,
          minBids: filters.minBids ? Number(filters.minBids) : undefined,
          maxBids: filters.maxBids ? Number(filters.maxBids) : undefined,
          lastContactRange: filters.lastContactRange,
          status: filters.status,
          breed: filters.breed,
          location: filters.location,
          hasWhatsapp: filters.hasWhatsapp,
          sortBy: sortConfig.key,
          sortDirection: sortConfig.direction,
        })

        if (!data || data.length === 0) {
          hasMore = false
        } else {
          allData.push(...data)
          if (data.length < 1000) hasMore = false
          page++
        }
      }

      if (allData.length === 0) {
        toast({ title: 'Nenhum dado para exportar' })
        return
      }

      const headers = [
        'Nome',
        'Email',
        'Telefone',
        'CPF/Documento',
        'Cidade',
        'Estado',
        'Qtd Compras',
        'Tags',
      ]
      const rows = allData.map((c) => [
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${(c.phone || c.whatsapp || '').replace(/"/g, '""')}"`,
        `"${(c.cpf || c.document || '').replace(/"/g, '""')}"`,
        `"${(c.city || '').replace(/"/g, '""')}"`,
        `"${(c.state || '').replace(/"/g, '""')}"`,
        c.purchaseCount || 0,
        `"${(c.tags || [])
          .map((t) => t.name)
          .join(', ')
          .replace(/"/g, '""')}"`,
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map((r) => r.join(',')),
      ].join('\n')
      const blob = new Blob(['\ufeff' + csvContent], {
        type: 'text/csv;charset=utf-8;',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute(
        'download',
        `Contatos_${new Date().toISOString().slice(0, 10)}.csv`,
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        variant: 'success',
        title: 'Exportação concluída',
        description: `Arquivo com ${allData.length} contatos foi baixado.`,
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro na exportação',
        description: 'Não foi possível gerar o arquivo.',
      })
    }
  }

  const handleSmartLeiloesSync = async () => {
    setSyncingSmartLeiloes(true)
    try {
      const summary = await smartLeiloesSyncService.syncContacts()
      const savedCount = getSyncSavedCount(summary)

      toast({
        title: 'Smart Leilões sincronizado',
        description: `${formatCompactNumber(savedCount)} registros foram criados ou atualizados na base.`,
        variant: 'success',
      })

      await Promise.all([
        fetchContacts(),
        fetchOverview(),
        fetchLatestSyncRun(),
      ])
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro ao sincronizar Smart Leilões',
        description:
          error?.message || 'Não foi possível concluir a sincronização agora.',
        variant: 'destructive',
      })
    } finally {
      setSyncingSmartLeiloes(false)
    }
  }

  const handleBirthdayCsvImport = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportingBirthdays(true)
    try {
      const text = await file.text()
      const summary = await birthdaysImportService.importCsv(text)

      toast({
        title: 'Aniversários importados',
        description: `${summary.updated} contatos atualizados. ${summary.unmatched} sem match e ${summary.invalidDates} linhas sem data válida.`,
        variant: 'success',
      })
      fetchContacts()
      fetchOverview()
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro ao importar aniversários',
        description:
          error?.message ||
          'Confira se o arquivo tem CPF/e-mail/telefone e uma coluna de nascimento.',
        variant: 'destructive',
      })
    } finally {
      setImportingBirthdays(false)
      event.target.value = ''
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

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            ref={birthdayFileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleBirthdayCsvImport}
          />
          <Button
            type="button"
            onClick={handleSmartLeiloesSync}
            disabled={syncingSmartLeiloes}
            className="bg-primary text-white shadow-md hover:bg-primary/90"
          >
            <RefreshCcw
              className={cn(
                'mr-2 h-4 w-4',
                syncingSmartLeiloes && 'animate-spin',
              )}
            />
            {syncingSmartLeiloes ? 'Sincronizando' : 'Sincronizar Smart'}
          </Button>
          <Button
            variant="outline"
            onClick={() => birthdayFileInputRef.current?.click()}
            disabled={importingBirthdays}
          >
            {importingBirthdays ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Importar aniversários
          </Button>

          <Button variant="outline" asChild>
            <Link to="/tags">
              <TagIcon className="mr-2 h-4 w-4" />
              Gerenciar Tags
            </Link>
          </Button>

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
                  Preencha as informações abaixo para adicionar um novo cliente
                  ou lead.
                </SheetDescription>
              </SheetHeader>
              <ContactForm
                onSuccess={() => {
                  setSheetOpen(false)
                  fetchContacts()
                  fetchOverview()
                }}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Contatos gerais
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {overviewLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    formatCompactNumber(overview.total)
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Último sync: {formatDateTime(latestSyncRun?.finished_at)}
                </p>
              </div>
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-4 h-8 px-0 text-primary hover:bg-transparent hover:text-primary/80"
              onClick={clearAllFilters}
            >
              Ver base completa
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Compradores
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {overviewLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    formatCompactNumber(overview.buyers)
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Valor total {formatCurrency(overview.totalInvested)}
                </p>
              </div>
              <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-700">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-4 h-8 px-0 text-primary hover:bg-transparent hover:text-primary/80"
              onClick={() =>
                applyOverviewFilter({ minPurchases: '1', maxPurchases: '' })
              }
            >
              Filtrar compradores
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Inativos
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {overviewLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    formatCompactNumber(overview.inactive)
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Sem atividade nos últimos 180 dias
                </p>
              </div>
              <div className="rounded-full bg-amber-500/10 p-2 text-amber-700">
                <UserX className="h-5 w-5" />
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-4 h-8 px-0 text-primary hover:bg-transparent hover:text-primary/80"
              onClick={() => applyOverviewFilter({ status: 'inactive' })}
            >
              Reativar público
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Prontos para WhatsApp
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {overviewLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    formatCompactNumber(overview.withWhatsapp)
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Ticket médio {formatCurrency(overview.avgTicket)}
                </p>
              </div>
              <div className="rounded-full bg-sky-500/10 p-2 text-sky-700">
                <Send className="h-5 w-5" />
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-4 h-8 px-0 text-primary hover:bg-transparent hover:text-primary/80"
              onClick={() => applyOverviewFilter({ hasWhatsapp: true })}
            >
              Ver contatos acionáveis
            </Button>
          </CardContent>
        </Card>
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
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>

              <AdvancedFilter
                onFilterChange={handleFilterChange}
                currentFilters={filters}
              />

              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
                  Mostrar:
                </span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(val) => {
                    setItemsPerPage(Number(val))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[100px] h-10 bg-background">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                    <SelectItem value="10000">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="icon"
                className="hidden md:flex h-10 w-10 shrink-0"
                onClick={exportContacts}
                title="Exportar para Excel/CSV"
              >
                <FileDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Atalhos:</span>
            <Button
              type="button"
              variant={
                filters.minPurchases === '1' && filters.maxPurchases === ''
                  ? 'secondary'
                  : 'outline'
              }
              size="sm"
              onClick={() =>
                applyQuickFilter(
                  filters.minPurchases === '1' && filters.maxPurchases === ''
                    ? { minPurchases: '', maxPurchases: '' }
                    : { minPurchases: '1', maxPurchases: '' },
                )
              }
            >
              Compradores
            </Button>
            <Button
              type="button"
              variant={
                filters.minPurchases === '0' && filters.maxPurchases === '0'
                  ? 'secondary'
                  : 'outline'
              }
              size="sm"
              onClick={() =>
                applyQuickFilter(
                  filters.minPurchases === '0' && filters.maxPurchases === '0'
                    ? { minPurchases: '', maxPurchases: '' }
                    : { minPurchases: '0', maxPurchases: '0' },
                )
              }
            >
              Sem compras
            </Button>
            <Button
              type="button"
              variant={
                filters.minBids === '0' && filters.maxBids === '0'
                  ? 'secondary'
                  : 'outline'
              }
              size="sm"
              onClick={() =>
                applyQuickFilter(
                  filters.minBids === '0' && filters.maxBids === '0'
                    ? { minBids: '', maxBids: '' }
                    : { minBids: '0', maxBids: '0' },
                )
              }
            >
              Sem lances
            </Button>
            <Button
              type="button"
              variant={filters.hasWhatsapp ? 'secondary' : 'outline'}
              size="sm"
              onClick={() =>
                applyQuickFilter({ hasWhatsapp: !filters.hasWhatsapp })
              }
            >
              Com WhatsApp
            </Button>
            <Button
              type="button"
              variant={
                filters.segment === 'VIP ativo' ? 'secondary' : 'outline'
              }
              size="sm"
              onClick={() =>
                applyQuickFilter({
                  segment: filters.segment === 'VIP ativo' ? null : 'VIP ativo',
                })
              }
            >
              VIP ativo
            </Button>
          </div>

          {/* Active Filters Display */}
          {(filters.tags.length > 0 ||
            filters.segment ||
            filters.status ||
            filters.breed ||
            filters.location ||
            filters.minInvestment ||
            filters.maxInvestment ||
            filters.minPurchases ||
            filters.maxPurchases ||
            filters.hasWhatsapp ||
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
              {filters.location && (
                <Badge variant="secondary" className="px-2 py-1 text-xs">
                  Local: {filters.location}
                </Badge>
              )}
              {(filters.minInvestment || filters.maxInvestment) && (
                <Badge variant="secondary" className="px-2 py-1 text-xs">
                  Investimento: {filters.minInvestment || '0'} -{' '}
                  {filters.maxInvestment || 'sem limite'}
                </Badge>
              )}
              {(filters.minPurchases || filters.maxPurchases) && (
                <Badge variant="secondary" className="px-2 py-1 text-xs">
                  Compras: {filters.minPurchases || '0'} -{' '}
                  {filters.maxPurchases || 'sem limite'}
                </Badge>
              )}
              {(filters.minBids || filters.maxBids) && (
                <Badge variant="secondary" className="px-2 py-1 text-xs">
                  Lances: {filters.minBids || '0'} -{' '}
                  {filters.maxBids || 'sem limite'}
                </Badge>
              )}
              {filters.hasWhatsapp && (
                <Badge variant="secondary" className="px-2 py-1 text-xs">
                  Com WhatsApp
                </Badge>
              )}
            </div>
          )}

          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-popover text-popover-foreground border shadow-xl rounded-full px-5 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-10">
              <span className="text-sm font-medium whitespace-nowrap">
                {selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="default"
                    className="shadow-none rounded-full h-8 px-4"
                    disabled={isBulking}
                  >
                    {isBulking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {bulkProgress > 0 ? `${bulkProgress}% ` : ''}
                        Adicionando...
                      </>
                    ) : (
                      'Adicionar Tag'
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  className="w-48 max-h-[300px] overflow-y-auto"
                >
                  <DropdownMenuLabel>Selecionar Tag</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableTags.map((tag) => (
                    <DropdownMenuItem
                      key={tag.id}
                      onClick={() => handleBulkAddTag(tag.id)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tag.color || '#ccc' }}
                        />
                        {tag.name}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  {availableTags.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nenhuma tag cadastrada
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="w-px h-4 bg-border"></div>

              <Button
                size="sm"
                variant="ghost"
                className="rounded-full h-8 px-3 text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedIds(new Set())}
                disabled={isBulking}
              >
                Cancelar
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={
                        contacts.length > 0 &&
                        selectedIds.size === contacts.length
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedIds(new Set(contacts.map((c) => c.id)))
                        } else {
                          setSelectedIds(new Set())
                        }
                      }}
                      aria-label="Selecionar todos os contatos da página"
                    />
                  </TableHead>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead className="w-[300px]">
                    <Button
                      variant="ghost"
                      className={cn(
                        'p-0 hover:bg-transparent font-semibold flex items-center gap-1',
                        sortConfig.key === 'name'
                          ? 'text-primary'
                          : 'text-foreground',
                      )}
                      onClick={() => handleSort('name')}
                    >
                      Nome
                      {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className={cn(
                        'p-0 hover:bg-transparent font-semibold flex items-center gap-1',
                        sortConfig.key === 'purchaseCount'
                          ? 'text-primary'
                          : 'text-foreground',
                      )}
                      onClick={() => handleSort('purchaseCount')}
                    >
                      Compras
                      {getSortIcon('purchaseCount')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className={cn(
                        'p-0 hover:bg-transparent font-semibold flex items-center gap-1',
                        sortConfig.key === 'bidCount'
                          ? 'text-primary'
                          : 'text-foreground',
                      )}
                      onClick={() => handleSort('bidCount')}
                    >
                      Lances
                      {getSortIcon('bidCount')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        className={cn(
                          'p-0 hover:bg-transparent font-semibold flex items-center gap-1',
                          sortConfig.key === 'totalInvested'
                            ? 'text-primary'
                            : 'text-foreground',
                        )}
                        onClick={() => handleSort('totalInvested')}
                      >
                        Valor Investido
                        {getSortIcon('totalInvested')}
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
                      className={cn(
                        'p-0 hover:bg-transparent font-semibold flex items-center gap-1',
                        sortConfig.key === 'lastActivity'
                          ? 'text-primary'
                          : 'text-foreground',
                      )}
                      onClick={() => handleSort('lastActivity')}
                    >
                      Última atividade
                      {getSortIcon('lastActivity')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : contacts.length > 0 ? (
                  contacts.map((contact, index) => (
                    <TableRow
                      key={contact.id}
                      className="group cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => openProfile(contact)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(contact.id)}
                          onCheckedChange={(checked) => {
                            const next = new Set(selectedIds)
                            if (checked) next.add(contact.id)
                            else next.delete(contact.id)
                            setSelectedIds(next)
                          }}
                          aria-label={`Selecionar ${contact.name}`}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-muted">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {contact.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              className="text-left font-semibold text-foreground transition-colors hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation()
                                openProfile(contact)
                              }}
                            >
                              {contact.name}
                            </button>
                            {contact.segment && (
                              <span
                                className="text-xs text-muted-foreground truncate max-w-[150px]"
                                title={contact.segment}
                              >
                                {contact.segment}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Mail className="mr-2 h-3 w-3 opacity-70" />
                            <span className="max-w-[190px] truncate">
                              {contact.email || '-'}
                            </span>
                          </div>
                          <div className="flex items-center whitespace-nowrap">
                            <Phone className="mr-2 h-3 w-3 opacity-70" />
                            {contact.whatsapp || contact.phone || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-muted-foreground text-sm">
                          <MapPin className="mr-2 h-3 w-3 opacity-70" />
                          <span className="max-w-[160px] truncate">
                            {[contact.city, contact.state]
                              .filter(Boolean)
                              .join(', ') ||
                              contact.address ||
                              '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {contact.segment && (
                              <Badge variant="secondary">
                                {contact.segment}
                              </Badge>
                            )}
                            {contact.rfmvScore ? (
                              <Badge variant="outline">
                                RFMV {contact.rfmvScore}
                              </Badge>
                            ) : null}
                          </div>
                          <div
                            className="flex flex-wrap items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {contact.tags?.slice(0, 2).map((tag) => (
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
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-foreground">
                          {contact.purchaseCount || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">
                          {contact.bidCount || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            maximumFractionDigits: 0,
                          }).format(contact.totalInvested || 0)}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          Ticket médio{' '}
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            maximumFractionDigits: 0,
                          }).format(contact.avgTicket || 0)}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {contact.lastActivityDate
                          ? new Date(
                              contact.lastActivityDate,
                            ).toLocaleDateString('pt-BR')
                          : contact.updated_at
                            ? new Date(contact.updated_at).toLocaleDateString(
                                'pt-BR',
                              )
                            : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {contact.whatsapp || contact.phone ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                            >
                              <a
                                href={`https://wa.me/55${String(
                                  contact.whatsapp || contact.phone,
                                ).replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Chamar no WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </a>
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => openProfile(contact)}
                          >
                            <Eye className="h-4 w-4" />
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
                    <TableCell colSpan={11} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Search className="h-8 w-8 mb-2 opacity-50" />
                        <p>Nenhum contato encontrado com os filtros atuais.</p>
                        <Button
                          variant="link"
                          onClick={clearAllFilters}
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
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Mostrando{' '}
              {totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount}{' '}
              contatos
            </div>

            <div className="flex items-center gap-4">
              {totalPages > 1 && (
                <Pagination className="w-auto mx-0">
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

                    <span className="text-sm text-muted-foreground mx-4 hidden md:block">
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
              )}
            </div>
          </div>
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

      <ContactProfileSheet
        contactId={selectedContactId}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </div>
  )
}
