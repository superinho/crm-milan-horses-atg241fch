import { useEffect, useState } from 'react'
import {
  Plus,
  Trash2,
  Calendar,
  Mail,
  MessageSquare,
  Wand2,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { MessageTemplate } from '@/services/templates'

export type ScheduleItem = {
  id: string // Temp id for UI list
  date: string // YYYY-MM-DD
  time: string // HH:mm
  channel: 'email' | 'whatsapp'
  templateId?: string | null
  subject?: string | null
  content: string
}

interface CampaignSchedulerProps {
  schedules: ScheduleItem[]
  setSchedules: (schedules: ScheduleItem[]) => void
  allowedChannels: string[]
  templates?: MessageTemplate[]
  selectedTemplateId?: string
}

export function CampaignScheduler({
  schedules,
  setSchedules,
  allowedChannels,
  templates = [],
  selectedTemplateId,
}: CampaignSchedulerProps) {
  // New item state
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('09:00')
  const [newChannel, setNewChannel] = useState<'email' | 'whatsapp'>('email')
  const [newTemplateId, setNewTemplateId] = useState<string>('manual')
  const [newSubject, setNewSubject] = useState('')
  const [newContent, setNewContent] = useState('')

  const compatibleTemplates = templates.filter((template) =>
    newChannel === 'email'
      ? template.type === 'E-mail'
      : template.type === 'WhatsApp',
  )

  useEffect(() => {
    if (!allowedChannels.includes(newChannel)) {
      setNewChannel(allowedChannels.includes('email') ? 'email' : 'whatsapp')
    }
  }, [allowedChannels, newChannel])

  useEffect(() => {
    if (!selectedTemplateId) return
    const template = templates.find((item) => item.id === selectedTemplateId)
    if (!template) return

    setNewTemplateId(template.id)
    setNewChannel(template.type === 'E-mail' ? 'email' : 'whatsapp')
    setNewSubject(template.subject || '')
    setNewContent(template.body)
  }, [selectedTemplateId, templates])

  const applyTemplate = (templateId: string) => {
    setNewTemplateId(templateId)
    if (templateId === 'manual') return

    const template = templates.find((item) => item.id === templateId)
    if (!template) return

    setNewChannel(template.type === 'E-mail' ? 'email' : 'whatsapp')
    setNewSubject(template.subject || '')
    setNewContent(template.body)
  }

  const handleAdd = () => {
    if (!newDate || !newTime || !newContent) return

    const newItem: ScheduleItem = {
      id: Math.random().toString(36).substring(7),
      date: newDate,
      time: newTime,
      channel: newChannel,
      templateId: newTemplateId === 'manual' ? null : newTemplateId,
      subject: newChannel === 'email' ? newSubject : null,
      content: newContent,
    }

    setSchedules(
      [...schedules, newItem].sort((a, b) => {
        return (
          new Date(`${a.date}T${a.time}`).getTime() -
          new Date(`${b.date}T${b.time}`).getTime()
        )
      }),
    )

    // Reset form
    setNewContent('')
    setNewSubject('')
    setNewTemplateId('manual')
  }

  const handleRemove = (id: string) => {
    setSchedules(schedules.filter((s) => s.id !== id))
  }

  const isAddDisabled =
    !newDate || !newTime || !newContent || !allowedChannels.includes(newChannel)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Cronograma de Envios</h3>
        <Badge variant="outline">{schedules.length} envios programados</Badge>
      </div>

      <div className="grid gap-4 p-4 border rounded-md bg-muted/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Data</Label>
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="space-y-2">
            <Label>Horário</Label>
            <Input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Canal</Label>
            <Select
              value={newChannel}
              onValueChange={(v: any) => setNewChannel(v)}
              disabled={allowedChannels.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="email"
                  disabled={!allowedChannels.includes('email')}
                >
                  E-mail
                </SelectItem>
                <SelectItem
                  value="whatsapp"
                  disabled={!allowedChannels.includes('whatsapp')}
                >
                  WhatsApp
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              onClick={handleAdd}
              disabled={isAddDisabled}
              type="button"
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Modelo do Estúdio</Label>
          <Select value={newTemplateId} onValueChange={applyTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um modelo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Escrever manualmente</SelectItem>
              {compatibleTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.title} · {template.category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {newChannel === 'email' ? (
          <div className="space-y-2">
            <Label>Assunto do e-mail</Label>
            <Input
              value={newSubject}
              onChange={(event) => setNewSubject(event.target.value)}
              placeholder="Assunto da campanha"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>Conteúdo da Mensagem</Label>
          <Textarea
            placeholder="Digite o conteúdo ou selecione um modelo do Estúdio..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={4}
          />
        </div>
      </div>

      <div className="space-y-3">
        {schedules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 italic">
            Nenhum envio programado. Adicione eventos acima.
          </p>
        ) : (
          schedules.map((schedule) => (
            <Card key={schedule.id} className="relative overflow-hidden group">
              <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div
                  className={`p-2 rounded-full shrink-0 ${schedule.channel === 'email' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}
                >
                  {schedule.channel === 'email' ? (
                    <Mail className="h-5 w-5" />
                  ) : (
                    <MessageSquare className="h-5 w-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm capitalize">
                      {schedule.channel}
                    </span>
                    {schedule.templateId ? (
                      <Badge variant="outline" className="gap-1">
                        <Wand2 className="h-3 w-3" />
                        Estúdio
                      </Badge>
                    ) : null}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(
                        new Date(`${schedule.date}T${schedule.time}`),
                        "dd 'de' MMMM 'às' HH:mm",
                        { locale: ptBR },
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {schedule.content}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(schedule.id)}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
