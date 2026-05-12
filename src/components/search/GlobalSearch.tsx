import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calculator,
  Settings,
  User,
  Users,
  Megaphone,
  Loader2,
  Radar,
  Gavel,
  Wand2,
} from 'lucide-react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import { contactsService, Contact } from '@/services/contacts'
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
    campaigns: Campaign[]
  }>({
    contacts: [],
    campaigns: [],
  })

  useEffect(() => {
    const fetchResults = async () => {
      if (!query || query.length < 2) {
        setResults({ contacts: [], campaigns: [] })
        return
      }

      setLoading(true)
      try {
        const [contactsRes, campaigns] = await Promise.all([
          contactsService.getContacts({ search: query, pageSize: 5 }),
          campaignsService.getCampaigns(),
        ])

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
            <CommandItem onSelect={() => handleSelect('/radar-vip')}>
              <Radar className="mr-2 h-4 w-4" />
              <span>Radar VIP</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/campanhas')}>
              <Megaphone className="mr-2 h-4 w-4" />
              <span>Campanhas</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/modelos')}>
              <Wand2 className="mr-2 h-4 w-4" />
              <span>Estúdio</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/leiloes')}>
              <Gavel className="mr-2 h-4 w-4" />
              <span>Leilões</span>
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
                {contact.phone && (
                  <span className="ml-2 text-xs text-muted-foreground truncate">
                    {contact.phone}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Campaigns */}
        {results.campaigns.length > 0 && (
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
        )}
      </CommandList>
    </CommandDialog>
  )
}
