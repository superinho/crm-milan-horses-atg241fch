import { useState, useEffect } from 'react'
import { Plus, Check, Search } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { tagsService, type Tag } from '@/services/tags'
import { contactsService } from '@/services/contacts'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface TagSelectorProps {
  contactId: string
  currentTags: Tag[]
  onTagChange: () => void
  variant?: 'icon' | 'button'
}

export function TagSelector({
  contactId,
  currentTags,
  onTagChange,
  variant = 'icon',
}: TagSelectorProps) {
  const [open, setOpen] = useState(false)
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      tagsService
        .getTags()
        .then(setAvailableTags)
        .catch((err) => console.error('Failed to load tags', err))
    }
  }, [open])

  const handleSelectTag = async (tag: Tag) => {
    try {
      const isSelected = currentTags.some((t) => t.id === tag.id)

      if (isSelected) {
        await contactsService.removeTagFromContact(contactId, tag.id)
      } else {
        await contactsService.addTagToContact(contactId, tag.id)
      }
      onTagChange()
      setOpen(false)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar as tags.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === 'icon' ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full hover:bg-muted"
            title="Adicionar Tag"
          >
            <Plus className="h-3 w-3 text-muted-foreground" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Plus className="h-3.5 w-3.5" />
            Gerenciar Tags
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="p-0 w-52" align="start">
        <Command>
          <CommandInput placeholder="Buscar tag..." />
          <CommandList>
            <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
            <CommandGroup>
              {availableTags.map((tag) => {
                const isSelected = currentTags.some((t) => t.id === tag.id)
                return (
                  <CommandItem
                    key={tag.id}
                    onSelect={() => handleSelectTag(tag)}
                    className="gap-2 cursor-pointer"
                  >
                    <div
                      className="h-3 w-3 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="flex-1 truncate">{tag.name}</span>
                    {isSelected && <Check className="h-4 w-4 opacity-100" />}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
