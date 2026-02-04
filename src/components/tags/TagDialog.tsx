import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { tagsService, type Tag } from '@/services/tags'
import { useToast } from '@/hooks/use-toast'

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida (deve ser HEX).'),
})

interface TagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tagToEdit?: Tag | null
  onSuccess?: () => void
}

export function TagDialog({
  open,
  onOpenChange,
  tagToEdit,
  onSuccess,
}: TagDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      color: '#000000',
    },
  })

  useEffect(() => {
    if (tagToEdit) {
      form.reset({
        name: tagToEdit.name,
        color: tagToEdit.color.startsWith('#') ? tagToEdit.color : '#000000',
      })
    } else {
      form.reset({
        name: '',
        color: '#000000',
      })
    }
  }, [tagToEdit, open, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    try {
      if (tagToEdit) {
        await tagsService.updateTag(tagToEdit.id, values)
        toast({
          title: 'Tag atualizada!',
          description: 'A tag foi atualizada com sucesso.',
        })
      } else {
        await tagsService.createTag(values)
        toast({
          title: 'Tag criada!',
          description: 'Nova tag adicionada com sucesso.',
        })
      }
      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível salvar a tag.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{tagToEdit ? 'Editar Tag' : 'Nova Tag'}</DialogTitle>
          <DialogDescription>
            {tagToEdit
              ? 'Edite as informações da tag abaixo.'
              : 'Preencha os dados para criar uma nova tag.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Importante" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <div className="flex gap-3">
                    <FormControl>
                      <Input
                        type="color"
                        className="w-12 h-10 p-1 cursor-pointer"
                        {...field}
                      />
                    </FormControl>
                    <FormControl>
                      <Input
                        placeholder="#000000"
                        className="flex-1 uppercase"
                        {...field}
                        onChange={(e) => {
                          const val = e.target.value
                          if (
                            val.startsWith('#') &&
                            val.length <= 7 &&
                            /^[0-9A-Fa-f#]+$/.test(val)
                          ) {
                            field.onChange(val)
                          }
                        }}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
