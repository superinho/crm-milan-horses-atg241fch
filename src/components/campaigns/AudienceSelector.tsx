import { useCallback, useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MultiSelect, Option } from '@/components/ui/multi-select'
import { contactsService } from '@/services/contacts'
import { tagsService } from '@/services/tags'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Search, Tags, UserPlus, Users, X } from 'lucide-react'

const FALLBACK_LIST_OPTIONS: Option[] = [
  { label: 'VIP ativo', value: 'VIP ativo' },
  { label: 'VIP inativo', value: 'VIP inativo' },
  { label: 'Compradores', value: 'Comprador' },
  { label: 'Interessados', value: 'Interessado' },
  { label: 'Leads', value: 'Lead' },
  { label: 'Reativação', value: 'Reativação' },
  { label: 'Alto potencial sem compra', value: 'Alto potencial sem compra' },
]

interface AudienceSelectorProps {
  selectedTags: string[]
  selectedSegments: string[]
  selectedContactIds: string[]
  selectedExcludedContactIds: string[]
  onTagsChange: (tags: string[]) => void
  onSegmentsChange: (segments: string[]) => void
  onContactIdsChange: (contactIds: string[]) => void
  onExcludedContactIdsChange: (contactIds: string[]) => void
}

export function AudienceSelector({
  selectedTags,
  selectedSegments,
  selectedContactIds,
  selectedExcludedContactIds,
  onTagsChange,
  onSegmentsChange,
  onContactIdsChange,
  onExcludedContactIdsChange,
}: AudienceSelectorProps) {
  const [tagOptions, setTagOptions] = useState<Option[]>([])
  const [listOptions, setListOptions] = useState<Option[]>(
    FALLBACK_LIST_OPTIONS,
  )
  const [audienceCount, setAudienceCount] = useState<number | null>(null)
  const [loadingCount, setLoadingCount] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [contactResults, setContactResults] = useState<any[]>([])
  const [selectedContacts, setSelectedContacts] = useState<any[]>([])
  const [exclusionSearch, setExclusionSearch] = useState('')
  const [exclusionResults, setExclusionResults] = useState<any[]>([])
  const [excludedContacts, setExcludedContacts] = useState<any[]>([])
  const [searchingContacts, setSearchingContacts] = useState(false)
  const [searchingExclusions, setSearchingExclusions] = useState(false)
  const [syncingTags, setSyncingTags] = useState(false)
  const { toast } = useToast()

  const refreshTagOptions = useCallback(
    () =>
      tagsService
        .ensureMilanTags()
        .then((tags) => {
          setTagOptions(tags.map((t) => ({ label: t.name, value: t.name })))
        })
        .catch(console.error),
    [],
  )

  useEffect(() => {
    refreshTagOptions()

    contactsService
      .getAudienceLists()
      .then((lists) => {
        if (!lists.length) return
        setListOptions(
          lists.map((list) => ({
            label:
              list === 'Comprador'
                ? 'Compradores'
                : list === 'Interessado'
                  ? 'Interessados'
                  : list,
            value: list,
          })),
        )
      })
      .catch(console.error)
  }, [refreshTagOptions])

  const handleSyncBehaviorTags = async () => {
    setSyncingTags(true)
    try {
      const result = await contactsService.syncBehaviorTags()
      await refreshTagOptions()
      toast({
        title: 'Tags comportamentais atualizadas',
        description: `${result.tagged} classificações aplicadas em ${result.contacts} contatos.`,
        variant: 'success',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar tags',
        description:
          error?.message || 'Não foi possível recalcular as tags agora.',
        variant: 'destructive',
      })
    } finally {
      setSyncingTags(false)
    }
  }

  useEffect(() => {
    contactsService
      .getContactsByIds(selectedContactIds)
      .then(setSelectedContacts)
      .catch(console.error)
  }, [selectedContactIds])

  useEffect(() => {
    contactsService
      .getContactsByIds(selectedExcludedContactIds)
      .then(setExcludedContacts)
      .catch(console.error)
  }, [selectedExcludedContactIds])

  useEffect(() => {
    const calculate = async () => {
      setLoadingCount(true)
      try {
        const count = await contactsService.getAudienceCount({
          tags: selectedTags,
          segments: selectedSegments,
          contactIds: selectedContactIds,
          excludedContactIds: selectedExcludedContactIds,
        })
        setAudienceCount(count)
      } catch (error) {
        console.error('Failed to count audience', error)
      } finally {
        setLoadingCount(false)
      }
    }

    calculate()
  }, [
    selectedTags,
    selectedSegments,
    selectedContactIds,
    selectedExcludedContactIds,
  ])

  useEffect(() => {
    const term = contactSearch.trim()
    if (term.length < 2) {
      setContactResults([])
      return
    }

    let active = true
    setSearchingContacts(true)
    contactsService
      .searchContactsForCampaign(term)
      .then((items) => {
        if (active) setContactResults(items)
      })
      .catch(console.error)
      .finally(() => {
        if (active) setSearchingContacts(false)
      })

    return () => {
      active = false
    }
  }, [contactSearch])

  useEffect(() => {
    const term = exclusionSearch.trim()
    if (term.length < 2) {
      setExclusionResults([])
      return
    }

    let active = true
    setSearchingExclusions(true)
    contactsService
      .searchContactsForCampaign(term)
      .then((items) => {
        if (active) setExclusionResults(items)
      })
      .catch(console.error)
      .finally(() => {
        if (active) setSearchingExclusions(false)
      })

    return () => {
      active = false
    }
  }, [exclusionSearch])

  const selectedCount =
    selectedTags.length + selectedSegments.length + selectedContactIds.length

  const addManualContact = (contact: any) => {
    if (selectedContactIds.includes(contact.id)) return
    onContactIdsChange([...selectedContactIds, contact.id])
    setContactSearch('')
    setContactResults([])
  }

  const removeManualContact = (contactId: string) => {
    onContactIdsChange(selectedContactIds.filter((id) => id !== contactId))
  }

  const addExcludedContact = (contact: any) => {
    if (selectedExcludedContactIds.includes(contact.id)) return
    onExcludedContactIdsChange([...selectedExcludedContactIds, contact.id])
    setExclusionSearch('')
    setExclusionResults([])
  }

  const removeExcludedContact = (contactId: string) => {
    onExcludedContactIdsChange(
      selectedExcludedContactIds.filter((id) => id !== contactId),
    )
  }

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold">
          <Users className="h-4 w-4 text-primary" />
          Listas e tags de envio
        </h3>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={handleSyncBehaviorTags}
            disabled={syncingTags}
          >
            {syncingTags ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Tags className="mr-2 h-3.5 w-3.5" />
            )}
            Atualizar tags
          </Button>
          <div className="text-sm font-medium">
            {loadingCount ? (
              <span className="flex items-center text-muted-foreground">
                <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Calculando...
              </span>
            ) : (
              <span
                className={
                  audienceCount === 0 ? 'text-destructive' : 'text-primary'
                }
              >
                {audienceCount} destinatários encontrados
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Selecione uma ou várias listas e/ou tags. A campanha envia para qualquer
        contato que esteja em uma das listas escolhidas ou tenha uma das tags,
        sem duplicar destinatários. Se nada for selecionado, a campanha fica sem
        público e pode ser usada apenas para rascunho/teste.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-primary" />
            Listas
          </Label>
          <MultiSelect
            options={listOptions}
            selected={selectedSegments}
            onChange={onSegmentsChange}
            placeholder="Selecione uma ou várias listas..."
            searchPlaceholder="Buscar listas..."
            emptyMessage="Nenhuma lista encontrada."
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Tags className="h-3.5 w-3.5 text-primary" />
            Tags
          </Label>
          <MultiSelect
            options={tagOptions}
            selected={selectedTags}
            onChange={onTagsChange}
            placeholder="Selecione uma ou várias tags..."
            searchPlaceholder="Buscar tags..."
            emptyMessage="Nenhuma tag encontrada."
          />
        </div>
      </div>

      <div className="space-y-3 rounded-md border bg-background p-3">
        <div className="flex items-center justify-between gap-3">
          <Label className="flex items-center gap-2">
            <UserPlus className="h-3.5 w-3.5 text-primary" />
            Adicionar contatos manualmente
          </Label>
          <span className="text-xs font-medium text-muted-foreground">
            {selectedContactIds.length} selecionado(s)
          </span>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={contactSearch}
            onChange={(event) => setContactSearch(event.target.value)}
            className="pl-9"
            placeholder="Buscar por nome, e-mail, telefone ou WhatsApp..."
          />
        </div>

        {contactSearch.trim().length >= 2 ? (
          <div className="max-h-48 overflow-auto rounded-md border">
            {searchingContacts ? (
              <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando contatos...
              </div>
            ) : contactResults.length ? (
              contactResults.map((contact) => {
                const alreadySelected = selectedContactIds.includes(contact.id)
                return (
                  <button
                    key={contact.id}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-muted/50"
                    onClick={() => addManualContact(contact)}
                    disabled={alreadySelected}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {contact.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {contact.email || contact.whatsapp || contact.phone}
                      </span>
                    </span>
                    <Badge variant={alreadySelected ? 'secondary' : 'outline'}>
                      {alreadySelected ? 'Adicionado' : 'Adicionar'}
                    </Badge>
                  </button>
                )
              })
            ) : (
              <div className="p-3 text-sm text-muted-foreground">
                Nenhum contato encontrado.
              </div>
            )}
          </div>
        ) : null}

        {selectedContacts.length ? (
          <div className="flex flex-wrap gap-2">
            {selectedContacts.map((contact) => (
              <Badge
                key={contact.id}
                variant="secondary"
                className="max-w-full gap-1 py-1"
              >
                <span className="max-w-44 truncate">{contact.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 rounded-full p-0 hover:bg-background/80"
                  onClick={() => removeManualContact(contact.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Use esta área para incluir compradores estratégicos que não entraram
            por lista ou tag.
          </p>
        )}
      </div>

      <div className="space-y-3 rounded-md border bg-background p-3">
        <div className="flex items-center justify-between gap-3">
          <Label className="flex items-center gap-2">
            <X className="h-3.5 w-3.5 text-destructive" />
            Excluir contatos específicos
          </Label>
          <span className="text-xs font-medium text-muted-foreground">
            {selectedExcludedContactIds.length} excluído(s)
          </span>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={exclusionSearch}
            onChange={(event) => setExclusionSearch(event.target.value)}
            className="pl-9"
            placeholder="Buscar contato para remover da audiência..."
          />
        </div>

        {exclusionSearch.trim().length >= 2 ? (
          <div className="max-h-48 overflow-auto rounded-md border">
            {searchingExclusions ? (
              <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando contatos...
              </div>
            ) : exclusionResults.length ? (
              exclusionResults.map((contact) => {
                const alreadyExcluded = selectedExcludedContactIds.includes(
                  contact.id,
                )
                return (
                  <button
                    key={contact.id}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-muted/50"
                    onClick={() => addExcludedContact(contact)}
                    disabled={alreadyExcluded}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {contact.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {contact.email || contact.whatsapp || contact.phone}
                      </span>
                    </span>
                    <Badge variant={alreadyExcluded ? 'secondary' : 'outline'}>
                      {alreadyExcluded ? 'Excluído' : 'Excluir'}
                    </Badge>
                  </button>
                )
              })
            ) : (
              <div className="p-3 text-sm text-muted-foreground">
                Nenhum contato encontrado.
              </div>
            )}
          </div>
        ) : null}

        {excludedContacts.length ? (
          <div className="flex flex-wrap gap-2">
            {excludedContacts.map((contact) => (
              <Badge
                key={contact.id}
                variant="outline"
                className="max-w-full gap-1 border-destructive/30 py-1 text-destructive"
              >
                <span className="max-w-44 truncate">{contact.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 rounded-full p-0 hover:bg-destructive/10"
                  onClick={() => removeExcludedContact(contact.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Use esta área para retirar alguém que entrou por lista ou tag, sem
            precisar alterar a segmentação principal.
          </p>
        )}
      </div>

      {selectedCount > 0 ? (
        <div className="rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground">
          Público combinado:{' '}
          <span className="font-medium text-foreground">
            {selectedSegments.length} lista(s)
          </span>{' '}
          e{' '}
          <span className="font-medium text-foreground">
            {selectedTags.length} tag(s)
          </span>{' '}
          e{' '}
          <span className="font-medium text-foreground">
            {selectedContactIds.length} contato(s) manual(is)
          </span>
          {selectedExcludedContactIds.length ? (
            <>
              {' '}
              menos{' '}
              <span className="font-medium text-destructive">
                {selectedExcludedContactIds.length} exclusão(ões)
              </span>
            </>
          ) : null}
          .
        </div>
      ) : (
        <div className="rounded-md border bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Nenhuma audiência selecionada. Você pode salvar como rascunho e enviar
          testes, mas o disparo real ficará bloqueado.
        </div>
      )}

      {audienceCount === 0 &&
        (selectedTags.length > 0 ||
          selectedSegments.length > 0 ||
          selectedContactIds.length > 0) && (
          <p className="mt-2 text-xs text-destructive">
            Atenção: Nenhum contato corresponde aos filtros selecionados. A
            campanha não terá destinatários.
          </p>
        )}
    </div>
  )
}
