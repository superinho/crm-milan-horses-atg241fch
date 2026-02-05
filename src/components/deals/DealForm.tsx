import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, Loader2, Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Calendar } from '@/components/ui/calendar'
import { useToast } from '@/hooks/use-toast'
import { dealsService, DealInsert } from '@/services/deals'
import { contactsService, Contact } from '@/services/contacts'

const formSchema = z.object({
  contact_id: z.string({ required_error: 'Selecione um contato.' }),
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  stage: z.enum(['Lead', 'Qualificado', 'Interesse', 'Proposta', 'Fechado']),
  value: z.coerce.number().min(0, 'O valor não pode ser negativo.'),
  probability: z.coerce
    .number()
    .min(0)
    .max(100, 'Probabilidade entre 0 e 100.'),
  expected_close_date: z.date().optional(),
})

interface DealFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

const STAGES = ['Lead', 'Qualificado', 'Interesse', 'Proposta', 'Fechado']

export function DealForm({ onSuccess, onCancel }: DealFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [openCombobox, setOpenCombobox] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      stage: 'Lead',
      value: 0,
      probability: 10,
    },
  })

  useEffect(() => {
    setContactsLoading(true)
    contactsService
      .getContacts({ pageSize: 100 })
      .then((res) => setContacts(res.data))
      .catch((err) => console.error(err))
      .finally(() => setContactsLoading(false))
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    try {
      const dealData: DealInsert = {
        ...values,
        expected_close_date: values.expected_close_date
          ? values.expected_close_date.toISOString()
          : null,
      }

      await dealsService.createDeal(dealData)

      toast({
        title: 'Negócio criado!',
        description: 'Oportunidade adicionada ao pipeline com sucesso.',
      })

      form.reset()
      onSuccess?.()
    } catch (error: any) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro ao criar',
        description: error.message || 'Não foi possível salvar o negócio.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="contact_id"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Contato</FormLabel>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className={cn(
                        'w-full justify-between',
                        !field.value && 'text-muted-foreground',
                      )}
                    >
                      {field.value
                        ? contacts.find((contact) => contact.id === field.value)
                            ?.name
                        : 'Selecione um contato...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar contato..." />
                    <CommandList>
                      <CommandEmpty>Nenhum contato encontrado.</CommandEmpty>
                      <CommandGroup>
                        {contacts.map((contact) => (
                          <CommandItem
                            value={contact.name}
                            key={contact.id}
                            onSelect={() => {
                              form.setValue('contact_id', contact.id)
                              setOpenCombobox(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                contact.id === field.value
                                  ? 'opacity-100'
                                  : 'opacity-0',
                              )}
                            />
                            {contact.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título / Lote</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Lote 10 - Cavalo Lusitano" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Estimado (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="probability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Probabilidade (%)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" max="100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estágio Inicial</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expected_close_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Prevista</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'dd/MM/yyyy')
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Negócio
          </Button>
        </div>
      </form>
    </Form>
  )
}
