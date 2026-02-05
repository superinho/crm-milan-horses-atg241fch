import { useState, useEffect } from 'react'
import {
  MessageTemplate,
  TemplateInsert,
  TemplateCategory,
  TemplateType,
} from '@/services/templates'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { templatesService } from '@/services/templates'
import { Loader2 } from 'lucide-react'

interface TemplateFormProps {
  initialData?: MessageTemplate | null
  onSuccess: () => void
  onCancel: () => void
}

const CATEGORIES: TemplateCategory[] = [
  'Boas-vindas',
  'Novo Leilão',
  'Informações de Lote',
  'Agradecimento Pós-Compra',
  'Reativação de Cliente',
  'Aniversário',
  'Follow-up',
]

const VARIABLES = [
  { key: '{{nome}}', desc: 'Nome do contato' },
  { key: '{{lote}}', desc: 'Número do lote' },
  { key: '{{leilao}}', desc: 'Nome do leilão' },
  { key: '{{valor}}', desc: 'Valor do lance/compra' },
]

export function TemplateForm({
  initialData,
  onSuccess,
  onCancel,
}: TemplateFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<TemplateInsert>({
    title: '',
    category: 'Boas-vindas',
    type: 'WhatsApp',
    subject: '',
    body: '',
  })
  const { toast } = useToast()

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        category: initialData.category,
        type: initialData.type,
        subject: initialData.subject || '',
        body: initialData.body,
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (initialData) {
        await templatesService.updateTemplate(initialData.id, formData)
        toast({
          title: 'Template atualizado',
          description: 'O modelo de mensagem foi salvo com sucesso.',
        })
      } else {
        await templatesService.createTemplate(formData)
        toast({
          title: 'Template criado',
          description: 'Novo modelo de mensagem adicionado.',
        })
      }
      onSuccess()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Falha ao salvar o template.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const insertVariable = (variable: string) => {
    setFormData((prev) => ({
      ...prev,
      body: prev.body + ' ' + variable,
    }))
  }

  // Highlight variables in preview
  const renderPreview = (text: string) => {
    if (!text) return <span className="text-muted-foreground">Prévia...</span>

    const parts = text.split(/(\{\{.*?\}\})/)
    return parts.map((part, index) => {
      if (part.match(/^\{\{.*?\}\}$/)) {
        return (
          <span
            key={index}
            className="bg-primary/20 text-primary px-1 rounded font-mono text-sm"
          >
            {part}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ex: Boas-vindas Cliente VIP"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(val) =>
                setFormData({ ...formData, category: val as TemplateCategory })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Tipo de Mensagem</Label>
          <RadioGroup
            value={formData.type}
            onValueChange={(val) =>
              setFormData({ ...formData, type: val as TemplateType })
            }
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="WhatsApp" id="type-whatsapp" />
              <Label htmlFor="type-whatsapp">WhatsApp</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="E-mail" id="type-email" />
              <Label htmlFor="type-email">E-mail</Label>
            </div>
          </RadioGroup>
        </div>

        {formData.type === 'E-mail' && (
          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="subject">Assunto</Label>
            <Input
              id="subject"
              value={formData.subject || ''}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              placeholder="Assunto do e-mail"
              required={formData.type === 'E-mail'}
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="body">Corpo da Mensagem</Label>
            <div className="flex gap-1">
              {VARIABLES.map((v) => (
                <Badge
                  key={v.key}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => insertVariable(v.key)}
                  title={v.desc}
                >
                  {v.key}
                </Badge>
              ))}
            </div>
          </div>
          <Textarea
            id="body"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            placeholder="Digite sua mensagem aqui..."
            className="h-32 font-mono text-sm"
            required
          />
        </div>

        {/* Live Preview */}
        <div className="space-y-2">
          <Label>Visualização (Preview)</Label>
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-4 space-y-2">
              {formData.type === 'E-mail' && (
                <div className="border-b pb-2 mb-2 text-sm">
                  <span className="font-semibold text-muted-foreground">
                    Assunto:
                  </span>{' '}
                  {renderPreview(formData.subject || '')}
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {renderPreview(formData.body)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Salvar Alterações' : 'Criar Template'}
          </Button>
        </div>
      </form>
    </div>
  )
}
