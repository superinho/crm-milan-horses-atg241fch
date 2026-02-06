import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { MultiSelect, Option } from '@/components/ui/multi-select'
import { contactsService } from '@/services/contacts'
import { tagsService } from '@/services/tags'
import { Loader2, Users } from 'lucide-react'

// Hardcoded segments matching those in Contatos.tsx
const SEGMENT_OPTIONS: Option[] = [
  { label: 'VIP', value: 'VIP' },
  { label: 'Frequentes', value: 'Frequentes' },
  { label: 'Ativos', value: 'Ativos' },
  { label: 'Novos Leads', value: 'Novos Leads' },
  { label: 'Inativos', value: 'Inativos' },
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
  const [audienceCount, setAudienceCount] = useState<number | null>(null)
  const [loadingCount, setLoadingCount] = useState(false)

  // Load tags
  useEffect(() => {
    tagsService
      .getTags()
      .then((tags) => {
        setTagOptions(tags.map((t) => ({ label: t.name, value: t.name })))
      })
      .catch(console.error)
  }, [])

  // Calculate audience
  useEffect(() => {
    // Only calculate if at least one filter is selected, or if we want to show total base when empty
    // Requirement says "based on current filters".
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

  return (
    <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Definição de Público
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Segmentos</Label>
          <MultiSelect
            options={SEGMENT_OPTIONS}
            selected={selectedSegments}
            onChange={onSegmentsChange}
            placeholder="Selecione segmentos..."
          />
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <MultiSelect
            options={tagOptions}
            selected={selectedTags}
            onChange={onTagsChange}
            placeholder="Selecione tags..."
          />
        </div>
      </div>

      {audienceCount === 0 &&
        (selectedTags.length > 0 || selectedSegments.length > 0) && (
          <p className="text-xs text-destructive mt-2">
            Atenção: Nenhum contato corresponde aos filtros selecionados. A
            campanha não terá destinatários.
          </p>
        )}
    </div>
  )
}
