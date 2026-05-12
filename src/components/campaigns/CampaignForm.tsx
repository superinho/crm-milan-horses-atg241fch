import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, Wand2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { campaignsService, type Campaign } from '@/services/campaigns'
import {
  templatesService,
  type MessageTemplate,
  type TemplateType,
} from '@/services/templates'
import { useToast } from '@/hooks/use-toast'
import { DatePicker } from '@/components/ui/date-picker'
import { AudienceSelector } from './AudienceSelector'
import { CampaignScheduler, ScheduleItem } from './CampaignScheduler'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  initialTemplateId?: string | null
  campaign?: Campaign | null
}

const templateChannel = (type: TemplateType) =>
  type === 'E-mail' ? 'email' : 'whatsapp'

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, ' ')

export function CampaignForm({
  onSuccess,
  onCancel,
  initialTemplateId,
  campaign,
}: CampaignFormProps) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialTemplateId || 'none',
  )
  const { toast } = useToast()

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: campaign?.name || '',
      objective: campaign?.objective || '',
      channels: campaign?.channels?.length ? campaign.channels : ['email'],
      dates: {
        start: campaign?.start_date
          ? new Date(campaign.start_date)
          : new Date(),
        end: campaign?.end_date ? new Date(campaign.end_date) : new Date(),
      },
      filters: {
        tags: campaign?.audience_filters?.tags || [],
        segments: campaign?.audience_filters?.segments || [],
      },
    },
  })

  const selectedChannels = form.watch('channels')
  const filters = form.watch('filters')
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId, templates],
  )

  const applyTemplateToCampaign = useCallback(
    (template: MessageTemplate) => {
      const channel = templateChannel(template.type)
      setSelectedTemplateId(template.id)
      form.setValue('channels', [channel])

      if (!form.getValues('name')) {
        form.setValue('name', template.title)
      }

      if (!form.getValues('objective')) {
        form.setValue(
          'objective',
          `${template.category}: campanha criada a partir do Estúdio de Mensagens.`,
        )
      }
    },
    [form],
  )

  useEffect(() => {
    let mounted = true

    templatesService
      .getTemplates()
      .then((items) => {
        if (!mounted) return
        setTemplates(items)
        const template = initialTemplateId
          ? items.find((item) => item.id === initialTemplateId)
          : null
        if (template) applyTemplateToCampaign(template)
      })
      .catch((error) => {
        console.error(error)
        toast({
          title: 'Erro ao carregar modelos',
          description: 'Não foi possível buscar os modelos do Estúdio.',
          variant: 'destructive',
        })
      })
      .finally(() => {
        if (mounted) setTemplatesLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [applyTemplateToCampaign, initialTemplateId, toast])

  useEffect(() => {
    if (!campaign?.schedules?.length) return

    setSchedules(
      campaign.schedules.map((schedule) => {
        const date = new Date(schedule.scheduled_date)
        return {
          id: schedule.id || Math.random().toString(36).substring(7),
          date: Number.isNaN(date.getTime())
            ? new Date().toISOString().split('T')[0]
            : date.toISOString().split('T')[0],
          time: Number.isNaN(date.getTime())
            ? '09:00'
            : date.toTimeString().slice(0, 5),
          channel: schedule.channel_type === 'whatsapp' ? 'whatsapp' : 'email',
          templateId: schedule.template_id || null,
          subject: schedule.subject || null,
          content: schedule.content || '',
        }
      }),
    )
  }, [campaign])

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
      const payload = {
        name: values.name,
        objective: values.objective,
        start_date: values.dates.start.toISOString(),
        end_date: values.dates.end.toISOString(),
        status: campaign?.status || 'Agendada',
        audience_filters: values.filters,
        channels: values.channels,
      }
      const schedulePayload = schedules.map((s) => ({
        channel_type: s.channel,
        scheduled_date: new Date(`${s.date}T${s.time}`).toISOString(),
        template_id: s.templateId,
        subject: s.subject,
        content: s.content,
      }))

      if (campaign?.id) {
        await campaignsService.updateCampaign(
          campaign.id,
          payload,
          schedulePayload,
        )
      } else {
        await campaignsService.createCampaign(payload, schedulePayload)
      }

      toast({
        variant: 'success',
        title: campaign?.id ? 'Campanha atualizada' : 'Sucesso',
        description: campaign?.id
          ? 'As alterações foram salvas com sucesso.'
          : 'Campanha criada e agendada com sucesso!',
      })
      onSuccess()
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: campaign?.id
          ? 'Erro ao editar campanha'
          : 'Erro ao criar campanha',
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
          <h3 className="text-lg font-semibold border-b pb-2">
            Mensagem do Estúdio
          </h3>
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-2">
              <FormLabel>Modelo base</FormLabel>
              <Select
                value={selectedTemplateId}
                onValueChange={(value) => {
                  setSelectedTemplateId(value)
                  const template = templates.find((item) => item.id === value)
                  if (template) applyTemplateToCampaign(template)
                }}
                disabled={templatesLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      templatesLoading
                        ? 'Carregando modelos...'
                        : 'Selecione um modelo'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Escolher no cronograma</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.title} · {template.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                O modelo selecionado define canal, assunto e texto inicial dos
                envios.
              </FormDescription>
            </div>

            <Card className="bg-muted/20">
              <CardContent className="space-y-2 p-4">
                {selectedTemplate ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <Wand2 className="h-3 w-3" />
                        {selectedTemplate.type}
                      </Badge>
                      <Badge variant="secondary">
                        {selectedTemplate.category}
                      </Badge>
                    </div>
                    <div className="font-medium">{selectedTemplate.title}</div>
                    {selectedTemplate.subject ? (
                      <div className="text-sm text-muted-foreground">
                        Assunto: {selectedTemplate.subject}
                      </div>
                    ) : null}
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {stripHtml(selectedTemplate.body)}
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Selecione um modelo salvo no Estúdio ou escreva a mensagem
                    manualmente no cronograma.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Cronograma</h3>
          <CampaignScheduler
            schedules={schedules}
            setSchedules={setSchedules}
            allowedChannels={selectedChannels}
            templates={templates}
            selectedTemplateId={
              selectedTemplateId === 'none' ? undefined : selectedTemplateId
            }
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
            {isSubmitting
              ? campaign?.id
                ? 'Salvando...'
                : 'Criando...'
              : campaign?.id
                ? 'Salvar Campanha'
                : 'Criar Campanha'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
