import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Calendar } from '@/components/ui/calendar'
import { useToast } from '@/hooks/use-toast'
import { MultiSelect } from '@/components/ui/multi-select'
import { contactsService } from '@/services/contacts'

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  phone: z.string().min(14, 'Telefone incompleto (mínimo 10 dígitos).'),
  whatsapp: z
    .string()
    .min(14, 'WhatsApp incompleto.')
    .optional()
    .or(z.literal('')),
  birthDate: z.date().optional(),
  cpf: z.string().min(14, 'CPF inválido.'),
  address: z.string().optional(),
  favoriteBreeds: z.array(z.string()).default([]),
  preferredValueRange: z.string().optional(),
  modalities: z.array(z.string()).default([]),
  origin: z.string({ required_error: 'Selecione a origem do lead.' }),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

const BREEDS = [
  { label: 'Lusitano', value: 'Lusitano' },
  { label: 'Brasileiro de Hipismo', value: 'BH' },
  { label: 'Quarto de Milha', value: 'Quarto de Milha' },
  { label: 'Árabe', value: 'Árabe' },
  { label: 'Manga Larga', value: 'Manga Larga' },
  { label: 'Puro Sangue Inglês', value: 'PSI' },
]

const MODALITIES = [
  { label: 'Salto', value: 'Salto' },
  { label: 'Adestramento', value: 'Adestramento' },
  { label: 'Enduro', value: 'Enduro' },
  { label: 'Lazer', value: 'Lazer' },
  { label: 'Trabalho', value: 'Trabalho' },
]

const ORIGINS = [
  'Indicação Profissional',
  'Redes Sociais',
  'Site',
  'Evento',
  'Outros',
]

import { tagsService } from '@/services/tags'

export function ContactForm({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [availableTags, setAvailableTags] = useState<
    { label: string; value: string }[]
  >([])

  useEffect(() => {
    tagsService
      .getTags()
      .then((tags) => {
        setAvailableTags(tags.map((t) => ({ label: t.name, value: t.name })))
      })
      .catch(console.error)
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      whatsapp: '',
      cpf: '',
      address: '',
      favoriteBreeds: [],
      modalities: [],
      notes: '',
      tags: [],
    },
  })

  // Masks
  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    try {
      await contactsService.createContact(values)
      toast({
        variant: 'success',
        title: 'Sucesso!',
        description: `${values.name} foi cadastrado com sucesso.`,
      })
      form.reset()
      onSuccess?.()
    } catch (error: any) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro ao cadastrar',
        description: error.message || 'Não foi possível salvar o contato.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        {/* Personal Data */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary border-b pb-2">
            Dados Pessoais
          </h3>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo *</FormLabel>
                <FormControl>
                  <Input placeholder="Nome completo ou razão social" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail *</FormLabel>
                  <FormControl>
                    <Input placeholder="E-mail do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="000.000.000-00"
                      {...field}
                      onChange={(e) => field.onChange(maskCPF(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(00) 00000-0000"
                      {...field}
                      onChange={(e) =>
                        field.onChange(maskPhone(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(00) 00000-0000"
                      {...field}
                      onChange={(e) =>
                        field.onChange(maskPhone(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Nascimento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'pl-3 text-left font-normal',
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
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço Completo</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Rua, número, bairro, cidade - UF"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary border-b pb-2">
            Preferências
          </h3>
          <FormField
            control={form.control}
            name="favoriteBreeds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Raças Favoritas</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={BREEDS}
                    selected={field.value}
                    onChange={field.onChange}
                    placeholder="Selecione as raças..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="preferredValueRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Faixa de Valor</FormLabel>
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
                      <SelectItem value="Até R$ 50k">Até R$ 50k</SelectItem>
                      <SelectItem value="R$ 50k - R$ 100k">
                        R$ 50k - R$ 100k
                      </SelectItem>
                      <SelectItem value="R$ 100k - R$ 300k">
                        R$ 100k - R$ 300k
                      </SelectItem>
                      <SelectItem value="Acima de R$ 300k">
                        Acima de R$ 300k
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="modalities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modalidades de Interesse</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={MODALITIES}
                      selected={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione modalidades..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Origin & Notes */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary border-b pb-2">
            Origem & Notas
          </h3>
          <FormField
            control={form.control}
            name="origin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Origem do Lead *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ORIGINS.map((origin) => (
                      <SelectItem key={origin} value={origin}>
                        {origin}
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
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags Iniciais</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={availableTags}
                    selected={field.value}
                    onChange={field.onChange}
                    placeholder="Selecione tags..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas Internas</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Observações importantes sobre o contato..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto min-w-[150px]"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Salvando...' : 'Cadastrar Contato'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
