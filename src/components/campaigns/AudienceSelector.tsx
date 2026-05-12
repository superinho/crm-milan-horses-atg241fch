import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { MultiSelect, Option } from '@/components/ui/multi-select'
import { contactsService } from '@/services/contacts'
import { tagsService } from '@/services/tags'
import { Loader2, Tags, Users } from 'lucide-react'

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
  onTagsChange: (tags: string[]) => void
  onSegmentsChange: (segments: string[]) => void
}

export function AudienceSelector({
  selectedTags,
  selectedSegments,
  onTagsChange,
  onSegmentsChange,
}: AudienceSelectorProps) {
  const [tagOptions, setTagOptions] = useState<Option[]>([])
  const [listOptions, setListOptions] = useState<Option[]>(
    FALLBACK_LIST_OPTIONS,
  )
  const [audienceCount, setAudienceCount] = useState<number | null>(null)
  const [loadingCount, setLoadingCount] = useState(false)

  useEffect(() => {
    tagsService
      .getTags()
      .then((tags) => {
        setTagOptions(tags.map((t) => ({ label: t.name, value: t.name })))
      })
      .catch(console.error)

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
  }, [])

  useEffect(() => {
    const calculate = async () => {
      setLoadingCount(true)
      try {
        const count = await contactsService.getAudienceCount({
          tags: selectedTags,
          segments: selectedSegments,
        })
        setAudienceCount(count)
      } catch (error) {
        console.error('Failed to count audience', error)
      } finally {
        setLoadingCount(false)
      }
    }

    calculate()
  }, [selectedTags, selectedSegments])

  const selectedCount = selectedTags.length + selectedSegments.length

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold">
          <Users className="h-4 w-4 text-primary" />
          Listas e tags de envio
        </h3>
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

      <p className="text-sm text-muted-foreground">
        Selecione uma ou várias listas e/ou tags. A campanha envia para qualquer
        contato que esteja em uma das listas escolhidas ou tenha uma das tags,
        sem duplicar destinatários.
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

      {selectedCount > 0 ? (
        <div className="rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground">
          Público combinado:{' '}
          <span className="font-medium text-foreground">
            {selectedSegments.length} lista(s)
          </span>{' '}
          e{' '}
          <span className="font-medium text-foreground">
            {selectedTags.length} tag(s)
          </span>
          .
        </div>
      ) : null}

      {audienceCount === 0 &&
        (selectedTags.length > 0 || selectedSegments.length > 0) && (
          <p className="mt-2 text-xs text-destructive">
            Atenção: Nenhum contato corresponde aos filtros selecionados. A
            campanha não terá destinatários.
          </p>
        )}
    </div>
  )
}
