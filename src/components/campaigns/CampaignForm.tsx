import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { campaignsService } from '@/services/campaigns'
import { useToast } from '@/hooks/use-toast'
import { DatePicker } from '@/components/ui/date-picker'
import { AudienceSelector } from './AudienceSelector'
import { CampaignScheduler, ScheduleItem } from './CampaignScheduler'

const campaignSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  objective: z.string().optional(),
  dates: z
    .object({
      start: z.date({ required_error: 'Data de início obrigatória' }),
      end: z.date({ required_error: 'Data de fim obrigatória' }),
    })
    .refine((data) => data.end >= data.start, {
      message: 'A data de fim deve ser posterior à data de início',
      path: ['end'],
    }),
  channels: z.array(z.string()).min(1, 'Selecione pelo menos um canal'),
  filters: z.object({
    tags: z.array(z.string()),
    segments: z.array(z.string()),
  }),
})

type CampaignFormValues = z.infer<typeof campaignSchema>

interface CampaignFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CampaignForm({ onSuccess, onCancel }: CampaignFormProps) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      objective: '',
      channels: ['email'],
      filters: {
        tags: [],
        segments: [],
      },
    },
  })

  const selectedChannels = form.watch('channels')
  const filters = form.watch('filters')

  const onSubmit = async (values: CampaignFormValues) => {
    if (
      values.filters.tags.length === 0 &&
      values.filters.segments.length === 0
    ) {
      toast({
        variant: 'info',
        title: 'Atenção',
        description:
          'Você não selecionou nenhum filtro de público. Isso pode resultar em 0 destinatários.',
      })
    }

    if (schedules.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Adicione pelo menos um envio ao cronograma.',
      })
      return
    }

    setIsSubmitting(true)
    try {
      await campaignsService.createCampaign(
        {
          name: values.name,
          objective: values.objective,
          start_date: values.dates.start.toISOString(),
          end_date: values.dates.end.toISOString(),
          status: 'Agendada',
          audience_filters: values.filters,
          channels: values.channels,
        },
        schedules.map((s) => ({
          channel_type: s.channel,
          scheduled_at: new Date(`${s.date}T${s.time}`).toISOString(),
          content: s.content,
        })),
      )

      toast({
        variant: 'success',
        title: 'Sucesso',
        description: 'Campanha criada e agendada com sucesso!',
      })
      onSuccess()
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro ao criar campanha',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">
            Informações Básicas
          </h3>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Campanha</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Leilão de Primavera" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="objective"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Objetivo</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Qual o objetivo desta campanha?"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dates.start"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Início</FormLabel>
                  <DatePicker date={field.value} setDate={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dates.end"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fim</FormLabel>
                  <DatePicker date={field.value} setDate={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Audience */}
        <div className="space-y-4">
          <AudienceSelector
            selectedTags={filters.tags}
            selectedSegments={filters.segments}
            onTagsChange={(tags) => form.setValue('filters.tags', tags)}
            onSegmentsChange={(segs) => form.setValue('filters.segments', segs)}
          />
        </div>

        {/* Channels */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">
            Canais de Comunicação
          </h3>
          <FormField
            control={form.control}
            name="channels"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block mb-2">
                  Selecione os canais
                </FormLabel>
                <FormControl>
                  <ToggleGroup
                    type="multiple"
                    variant="outline"
                    value={field.value}
                    onValueChange={(val) => {
                      if (val.length > 0) field.onChange(val)
                    }}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="email" aria-label="Toggle email">
                      E-mail
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="whatsapp"
                      aria-label="Toggle whatsapp"
                    >
                      WhatsApp
                    </ToggleGroupItem>
                  </ToggleGroup>
                </FormControl>
                <FormDescription>
                  Escolha por onde deseja enviar as mensagens.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Scheduling */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Cronograma</h3>
          <CampaignScheduler
            schedules={schedules}
            setSchedules={setSchedules}
            allowedChannels={selectedChannels}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-primary">
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSubmitting ? 'Criando...' : 'Criar Campanha'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
