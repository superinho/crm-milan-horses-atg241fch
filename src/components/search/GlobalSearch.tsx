import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Users,
  Briefcase,
  CheckSquare,
  Megaphone,
  Search,
  Loader2,
} from 'lucide-react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { contactsService, Contact } from '@/services/contacts'
import { dealsService, Deal } from '@/services/deals'
import { tasksService, Task } from '@/services/tasks'
import { campaignsService, Campaign } from '@/services/campaigns'

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const [results, setResults] = useState<{
    contacts: Contact[]
    deals: Deal[]
    tasks: Task[]
    campaigns: Campaign[]
  }>({
    contacts: [],
    deals: [],
    tasks: [],
    campaigns: [],
  })

  useEffect(() => {
    const fetchResults = async () => {
      if (!query || query.length < 2) {
        setResults({ contacts: [], deals: [], tasks: [], campaigns: [] })
        return
      }

      setLoading(true)
      try {
        // Run searches in parallel
        const [contactsRes, deals, tasks, campaigns] = await Promise.all([
          // Search contacts via API (paginated/filtered)
          contactsService.getContacts({ search: query, pageSize: 5 }),
          // Fetch others (assuming smaller datasets or client-side filter for now)
          dealsService.getDeals(),
          tasksService.getTasks(),
          campaignsService.getCampaigns(),
        ])

        const filteredDeals = (deals || [])
          .filter(
            (d) =>
              d.title.toLowerCase().includes(query.toLowerCase()) ||
              d.value.toString().includes(query),
          )
          .slice(0, 5)

        const filteredTasks = (tasks || [])
          .filter(
            (t) =>
              t.title.toLowerCase().includes(query.toLowerCase()) ||
              (t.description &&
                t.description.toLowerCase().includes(query.toLowerCase())),
          )
          .slice(0, 5)

        const filteredCampaigns = (campaigns || [])
          .filter(
            (c) =>
              c.name.toLowerCase().includes(query.toLowerCase()) ||
              (c.objective &&
                c.objective.toLowerCase().includes(query.toLowerCase())),
          )
          .slice(0, 5)

        setResults({
          contacts: contactsRes.data || [],
          deals: filteredDeals,
          tasks: filteredTasks,
          campaigns: filteredCampaigns,
        })
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(fetchResults, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (path: string) => {
    navigate(path)
    onOpenChange(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Digite para buscar..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            'Nenhum resultado encontrado.'
          )}
        </CommandEmpty>

        {/* Navigation Group (Static) - Only show if no query or very short */}
        {query.length < 2 && (
          <CommandGroup heading="Navegação Rápida">
            <CommandItem onSelect={() => handleSelect('/')}>
              <Calculator className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/contatos')}>
              <Users className="mr-2 h-4 w-4" />
              <span>Contatos</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/negocios')}>
              <Briefcase className="mr-2 h-4 w-4" />
              <span>Negócios</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/configuracoes')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        )}

        {/* Contacts */}
        {results.contacts.length > 0 && (
          <CommandGroup heading="Contatos">
            {results.contacts.map((contact) => (
              <CommandItem
                key={contact.id}
                onSelect={() => handleSelect(`/contatos/${contact.id}`)}
              >
                <User className="mr-2 h-4 w-4 text-blue-500" />
                <span>{contact.name}</span>
                <span className="ml-2 text-xs text-muted-foreground truncate">
                  {contact.email}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Deals */}
        {results.deals.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Negócios">
              {results.deals.map((deal) => (
                <CommandItem
                  key={deal.id}
                  onSelect={() => handleSelect(`/negocios/${deal.id}`)}
                >
                  <Briefcase className="mr-2 h-4 w-4 text-orange-500" />
                  <span>{deal.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(deal.value)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Tasks */}
        {results.tasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tarefas">
              {results.tasks.map((task) => (
                <CommandItem
                  key={task.id}
                  onSelect={() => handleSelect('/tarefas')}
                >
                  <CheckSquare className="mr-2 h-4 w-4 text-green-500" />
                  <span>{task.title}</span>
                  {task.due_date && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Campaigns */}
        {results.campaigns.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Campanhas">
              {results.campaigns.map((campaign) => (
                <CommandItem
                  key={campaign.id}
                  onSelect={() => handleSelect(`/campanhas/${campaign.id}`)}
                >
                  <Megaphone className="mr-2 h-4 w-4 text-purple-500" />
                  <span>{campaign.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
