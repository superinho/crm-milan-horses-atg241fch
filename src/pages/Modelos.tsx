import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  Copy,
  Crown,
  Edit,
  Eye,
  Image,
  Link as LinkIcon,
  Loader2,
  Mail,
  Megaphone,
  MessageSquare,
  MousePointer2,
  PanelTop,
  Rows3,
  Save,
  Send,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import {
  templatesService,
  type MessageTemplate,
  type TemplateCategory,
  type TemplateInsert,
  type TemplateType,
} from '@/services/templates'

type DraftTemplate = TemplateInsert & { id?: string }

type Recipe = {
  title: string
  category: TemplateCategory
  type: TemplateType
  objective: string
  tone: string
  subject?: string
  body: string
}

const SAMPLE_CONTEXT = {
  nome: 'Guilherme',
  leilao: 'LEILÃO QUATTRO BLOODLINES',
  data_leilao: '19/05/2026',
  ticket_medio: 'R$ 250.000',
  cidade: 'São Paulo',
  segmento: 'VIP ativo',
  curador: 'Equipe Milan Horses',
  lote: '12',
  valor: 'R$ 280.000',
}

const VARIABLES = [
  { key: '{{nome}}', label: 'Nome' },
  { key: '{{leilao}}', label: 'Leilão' },
  { key: '{{data_leilao}}', label: 'Data' },
  { key: '{{ticket_medio}}', label: 'Ticket' },
  { key: '{{cidade}}', label: 'Cidade' },
  { key: '{{segmento}}', label: 'Segmento' },
  { key: '{{curador}}', label: 'Curador' },
  { key: '{{lote}}', label: 'Lote' },
  { key: '{{valor}}', label: 'Valor' },
]

const CATEGORIES: TemplateCategory[] = [
  'Radar VIP',
  'Convite VIP',
  'Novo Leilão',
  'Reativação de Cliente',
  'Underbidder',
  'Pós-leilão',
  'Aniversário',
  'Follow-up',
  'Boas-vindas',
  'Informações de Lote',
  'Agradecimento Pós-Compra',
]

const RECIPES: Recipe[] = [
  {
    title: 'Convite VIP discreto',
    category: 'Convite VIP',
    type: 'WhatsApp',
    objective: 'Convidar cliente de alto valor',
    tone: 'Pessoal e exclusivo',
    body: 'Olá, {{nome}}. Tudo bem? Separei alguns destaques de {{leilao}} que combinam bastante com seu histórico na Milan Horses. Posso te mandar uma curadoria curta antes do leilão?',
  },
  {
    title: 'E-mail curadoria premium',
    category: 'Radar VIP',
    type: 'E-mail',
    objective: 'Apresentar seleção de lotes',
    tone: 'Elegante e consultivo',
    subject: 'Curadoria Milan Horses para {{leilao}}',
    body: '<p>Olá, {{nome}}.</p><p>Revendo seu histórico conosco, selecionei alguns destaques de <strong>{{leilao}}</strong> que parecem especialmente alinhados ao seu perfil.</p><p>Se fizer sentido, posso te enviar uma seleção objetiva com os principais pontos de cada lote.</p><p>{{curador}}</p>',
  },
  {
    title: 'Underbidder premium',
    category: 'Underbidder',
    type: 'WhatsApp',
    objective: 'Reativar quem disputou forte',
    tone: 'Direto e oportuno',
    body: 'Olá, {{nome}}. Vi que você costuma disputar forte nossos lotes. {{leilao}} tem oportunidades bem próximas do seu perfil de compra. Quer que eu te envie os destaques antes da abertura?',
  },
  {
    title: 'Reativação elegante',
    category: 'Reativação de Cliente',
    type: 'WhatsApp',
    objective: 'Retomar conversa sem pressão',
    tone: 'Leve e pessoal',
    body: 'Olá, {{nome}}. Faz tempo que não nos falamos, mas o catálogo de {{leilao}} me lembrou seu perfil na Milan Horses. Posso te mandar 2 ou 3 destaques para você avaliar com calma?',
  },
  {
    title: 'Última chamada sem exagero',
    category: 'Novo Leilão',
    type: 'WhatsApp',
    objective: 'Lembrar prazo do leilão',
    tone: 'Urgente com sobriedade',
    body: 'Olá, {{nome}}. Passando só para te lembrar que {{leilao}} acontece em {{data_leilao}}. Há alguns lotes compatíveis com seu perfil e achei que valia te avisar antes do fechamento.',
  },
  {
    title: 'Cliente top - acesso antecipado',
    category: 'Convite VIP',
    type: 'E-mail',
    objective: 'Dar tratamento prioritário',
    tone: 'Exclusivo e refinado',
    subject: 'Acesso antecipado à curadoria de {{leilao}}',
    body: '<p>Olá, {{nome}}.</p><p>Antes de ampliarmos a comunicação sobre <strong>{{leilao}}</strong>, queria te mostrar uma seleção antecipada de lotes que dialogam com seu histórico e ticket médio.</p><p>Posso te encaminhar a curadoria completa?</p>',
  },
  {
    title: 'Pós-leilão comprador',
    category: 'Pós-leilão',
    type: 'WhatsApp',
    objective: 'Agradecer e abrir próximo contato',
    tone: 'Atencioso',
    body: 'Olá, {{nome}}. Obrigado pela participação no leilão. Foi um prazer acompanhar sua compra. Vou seguir atento a oportunidades compatíveis com seu perfil e te aviso quando aparecer algo especial.',
  },
  {
    title: 'Aniversário premium',
    category: 'Aniversário',
    type: 'WhatsApp',
    objective: 'Relacionamento',
    tone: 'Caloroso e breve',
    body: 'Olá, {{nome}}. Passando para desejar um feliz aniversário em nome da Milan Horses. Que seja um novo ciclo excelente, com boas conquistas dentro e fora das pistas.',
  },
]

const emptyDraft: DraftTemplate = {
  title: '',
  category: 'Radar VIP',
  type: 'WhatsApp',
  subject: '',
  body: '',
  variables: ['nome', 'leilao'],
}

const renderWithSample = (text = '') =>
  Object.entries(SAMPLE_CONTEXT).reduce(
    (current, [key, value]) => current.replaceAll(`{{${key}}}`, value),
    text,
  )

const extractVariables = (text: string) => [
  ...new Set([...text.matchAll(/\{\{(.*?)\}\}/g)].map((match) => match[1])),
]

const whatsappLengthHint = (body: string) => {
  if (body.length <= 280) return 'Ideal para WhatsApp'
  if (body.length <= 520) return 'Funciona, mas vale encurtar'
  return 'Longa demais para WhatsApp consultivo'
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const emailShell = (content: string) => {
  if (content.includes('data-milan-email="true"')) return content

  return `<div data-milan-email="true" style="margin:0;background:#f6f3ee;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;color:#1f2f46;">
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;">Curadoria Milan Horses preparada para {{nome}}.</div>
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5dfd6;">
    <div style="padding:28px 34px 18px;text-align:center;border-bottom:1px solid #e5dfd6;">
      <div style="font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:#9a7a3f;">Milan Horses Leilões</div>
      <div style="margin-top:8px;font-size:22px;line-height:1.2;color:#12284c;">Curadoria privada</div>
    </div>
    <div style="padding:32px 34px;font-size:16px;line-height:1.65;color:#26364f;">
      ${content || '<p>Olá, {{nome}}.</p><p>Preparei uma curadoria especial para você.</p>'}
    </div>
    <div style="padding:22px 34px;border-top:1px solid #e5dfd6;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#6c7280;">
      Milan Horses Leilões<br />
      Atendimento consultivo para leilões de cavalos de hipismo.
    </div>
  </div>
</div>`
}

const editorialHeaderBlock =
  () => `<div style="margin:0 0 28px;text-align:center;">
  <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:2.2px;text-transform:uppercase;color:#9a7a3f;">Seleção editorial</div>
  <h2 style="margin:10px 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.15;font-weight:400;color:#12284c;">{{leilao}}</h2>
  <div style="font-family:Arial,sans-serif;font-size:13px;color:#6c7280;">{{data_leilao}} · Curadoria Milan Horses</div>
</div>`

const dividerBlock = () =>
  '<div style="height:1px;background:#e5dfd6;margin:30px 0;"></div>'

const ctaBlock = (
  label: string,
  url: string,
) => `<div style="margin:30px 0;text-align:center;">
  <a href="${escapeHtml(url || 'https://www.milanhorses.com.br')}" style="display:inline-block;background:#12284c;color:#ffffff;text-decoration:none;padding:13px 24px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">${escapeHtml(label || 'Ver curadoria')}</a>
</div>`

const signatureBlock =
  () => `<div style="margin-top:32px;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#4f5b6d;">
  <p style="margin:0 0 10px;">Fico à disposição para te enviar uma seleção objetiva dos lotes mais alinhados ao seu perfil.</p>
  <p style="margin:0;"><strong style="color:#12284c;">{{curador}}</strong><br />Milan Horses Leilões</p>
</div>`

const imageBlock = ({
  src,
  alt,
  caption,
  variant,
}: {
  src: string
  alt: string
  caption: string
  variant: 'banner' | 'photo' | 'feature'
}) => {
  if (variant === 'feature') {
    return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0;border:1px solid #e5dfd6;border-collapse:collapse;">
  <tr>
    <td style="padding:0;">
      <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" width="100%" style="display:block;width:100%;max-width:100%;height:auto;border:0;" />
    </td>
  </tr>
  <tr>
    <td style="padding:18px 20px;background:#fbfaf7;font-family:Arial,sans-serif;font-size:13px;line-height:1.55;color:#5f6878;">${escapeHtml(caption || 'Imagem selecionada pela curadoria Milan Horses.')}</td>
  </tr>
</table>`
  }

  return `<figure style="margin:${variant === 'banner' ? '0 0 30px' : '28px 0'};">
  <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" width="100%" style="display:block;width:100%;max-width:100%;height:auto;border:0;${variant === 'photo' ? 'border:1px solid #e5dfd6;' : ''}" />
  ${
    caption
      ? `<figcaption style="margin-top:10px;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#6c7280;">${escapeHtml(caption)}</figcaption>`
      : ''
  }
</figure>`
}

export default function Modelos() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [draft, setDraft] = useState<DraftTemplate>(emptyDraft)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [search, setSearch] = useState('')
  const [channel, setChannel] = useState<TemplateType | 'Todos'>('Todos')
  const [category, setCategory] = useState<TemplateCategory | 'Todas'>('Todas')
  const [testTarget, setTestTarget] = useState('11999427752')
  const [variations, setVariations] = useState<string[]>([])
  const [assetUrl, setAssetUrl] = useState('')
  const [assetAlt, setAssetAlt] = useState('Imagem Milan Horses')
  const [assetCaption, setAssetCaption] = useState('')
  const [ctaLabel, setCtaLabel] = useState('Ver curadoria')
  const [ctaUrl, setCtaUrl] = useState('https://www.milanhorses.com.br')
  const [assetVariant, setAssetVariant] = useState<
    'banner' | 'photo' | 'feature'
  >('banner')
  const [uploadingAsset, setUploadingAsset] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const loadTemplates = useCallback(async () => {
    setLoading(true)
    try {
      setTemplates(await templatesService.getTemplates())
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar modelos',
        description: error?.message || 'Não foi possível buscar os modelos.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const filteredTemplates = useMemo(() => {
    const term = search.toLowerCase()
    return templates.filter((template) => {
      const matchesSearch =
        !term ||
        template.title.toLowerCase().includes(term) ||
        template.body.toLowerCase().includes(term) ||
        template.category.toLowerCase().includes(term)
      const matchesChannel = channel === 'Todos' || template.type === channel
      const matchesCategory =
        category === 'Todas' || template.category === category
      return matchesSearch && matchesChannel && matchesCategory
    })
  }, [templates, search, channel, category])

  const previewSubject = renderWithSample(draft.subject || '')
  const previewBody = renderWithSample(draft.body)
  const variablesInDraft = extractVariables(
    `${draft.subject || ''} ${draft.body}`,
  )

  const updateDraft = (patch: Partial<DraftTemplate>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setVariations([])
  }

  const startNew = (type: TemplateType = 'WhatsApp') => {
    setSelectedId(null)
    setVariations([])
    setDraft({
      ...emptyDraft,
      type,
      subject: type === 'E-mail' ? 'Curadoria Milan Horses: {{leilao}}' : '',
    })
  }

  const loadTemplate = (template: MessageTemplate) => {
    setSelectedId(template.id)
    setVariations([])
    setDraft({
      id: template.id,
      title: template.title,
      category: template.category,
      type: template.type,
      subject: template.subject || '',
      body: template.body,
      variables: template.variables || extractVariables(template.body),
    })
  }

  const loadRecipe = (recipe: Recipe) => {
    setSelectedId(null)
    setVariations([])
    setDraft({
      title: recipe.title,
      category: recipe.category,
      type: recipe.type,
      subject: recipe.subject || '',
      body: recipe.body,
      variables: extractVariables(`${recipe.subject || ''} ${recipe.body}`),
    })
  }

  const insertVariable = (variable: string) => {
    updateDraft({
      body: `${draft.body}${draft.body.endsWith(' ') || !draft.body ? '' : ' '}${variable}`,
    })
  }

  const ensureEmailDraft = () => {
    if (draft.type === 'E-mail') return true
    toast({
      title: 'Blocos visuais são para e-mail',
      description: 'Troque o canal para E-mail para usar banners e fotos.',
      variant: 'destructive',
    })
    return false
  }

  const appendEmailBlock = (html: string) => {
    if (!ensureEmailDraft()) return
    updateDraft({
      body: `${draft.body ? `${draft.body}\n\n` : ''}${html}`,
    })
  }

  const applyPremiumLayout = () => {
    if (!ensureEmailDraft()) return
    updateDraft({ body: emailShell(draft.body) })
    toast({
      title: 'Layout premium aplicado',
      description: 'O e-mail ganhou estrutura editorial e footer de marca.',
      variant: 'success',
    })
  }

  const insertImageAsset = () => {
    if (!ensureEmailDraft()) return
    if (!assetUrl.trim()) {
      toast({
        title: 'Adicione uma imagem',
        description: 'Faça upload ou cole uma URL pública da imagem.',
        variant: 'destructive',
      })
      return
    }

    appendEmailBlock(
      imageBlock({
        src: assetUrl.trim(),
        alt: assetAlt || 'Imagem Milan Horses',
        caption: assetCaption,
        variant: assetVariant,
      }),
    )
  }

  const uploadEmailAsset = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Envie apenas imagens para banners e fotos.',
        variant: 'destructive',
      })
      return
    }

    setUploadingAsset(true)
    try {
      const extension = file.name.split('.').pop() || 'jpg'
      const safeName = file.name
        .replace(/\.[^/.]+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      const path = `studio/${Date.now()}-${safeName || 'imagem'}.${extension}`

      const { error } = await supabase.storage
        .from('email-assets')
        .upload(path, file, { cacheControl: '31536000', upsert: false })

      if (error) throw error

      const { data } = supabase.storage.from('email-assets').getPublicUrl(path)
      setAssetUrl(data.publicUrl)
      setAssetAlt(file.name.replace(/\.[^/.]+$/, '') || 'Imagem Milan Horses')
      toast({
        title: 'Imagem pronta',
        description: 'Agora você pode inserir a imagem no corpo do e-mail.',
        variant: 'success',
      })
    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error?.message || 'Não foi possível enviar a imagem.',
        variant: 'destructive',
      })
    } finally {
      setUploadingAsset(false)
      event.target.value = ''
    }
  }

  const saveTemplate = async (): Promise<MessageTemplate | null> => {
    if (!draft.title.trim() || !draft.body.trim()) {
      toast({
        title: 'Complete o modelo',
        description: 'Título e mensagem são obrigatórios.',
        variant: 'destructive',
      })
      return null
    }

    if (draft.type === 'E-mail' && !draft.subject?.trim()) {
      toast({
        title: 'Assunto obrigatório',
        description: 'E-mails precisam de assunto.',
        variant: 'destructive',
      })
      return null
    }

    setSaving(true)
    try {
      const payload = {
        ...draft,
        variables: extractVariables(`${draft.subject || ''} ${draft.body}`),
      }

      const saved = selectedId
        ? await templatesService.updateTemplate(selectedId, payload)
        : await templatesService.createTemplate(payload)

      setSelectedId(saved.id)
      setDraft({ ...payload, id: saved.id })
      await loadTemplates()
      toast({
        title: selectedId ? 'Modelo atualizado' : 'Modelo salvo',
        description: 'A mensagem já pode ser usada em campanhas e contatos.',
        variant: 'success',
      })
      return saved
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error?.message || 'Não foi possível salvar o modelo.',
        variant: 'destructive',
      })
      return null
    } finally {
      setSaving(false)
    }
  }

  const createCampaignFromTemplate = async () => {
    const saved = await saveTemplate()
    if (!saved) return
    navigate(`/campanhas?template=${saved.id}`)
  }

  const deleteTemplate = async () => {
    if (!selectedId) return
    if (
      !window.confirm('Excluir este modelo? Esta ação não pode ser desfeita.')
    ) {
      return
    }

    try {
      await templatesService.deleteTemplate(selectedId)
      await loadTemplates()
      startNew(draft.type)
      toast({ title: 'Modelo excluído', variant: 'success' })
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error?.message || 'Não foi possível excluir o modelo.',
        variant: 'destructive',
      })
    }
  }

  const copyPreview = async () => {
    const content =
      draft.type === 'E-mail'
        ? `Assunto: ${previewSubject}\n\n${previewBody.replace(/<[^>]+>/g, '')}`
        : previewBody
    await navigator.clipboard.writeText(content)
    toast({ title: 'Mensagem copiada', variant: 'success' })
  }

  const sendTest = async () => {
    if (!testTarget.trim()) return
    setTesting(true)
    try {
      if (draft.type === 'WhatsApp') {
        const { error } = await supabase.functions.invoke(
          'send-whatsapp-botconversa',
          {
            body: {
              phone: testTarget,
              name: 'Teste CRM Milan',
              message: previewBody,
              metadata: { source: 'message-studio-test' },
            },
          },
        )
        if (error) throw error
      } else {
        const { error } = await supabase.functions.invoke(
          'send-contact-email',
          {
            body: {
              to: [testTarget],
              subject: previewSubject,
              html: previewBody,
            },
          },
        )
        if (error) throw error
      }

      toast({
        title: 'Teste enviado',
        description:
          draft.type === 'WhatsApp'
            ? 'Mensagem enviada pelo BotConversa.'
            : 'E-mail enviado pela Resend.',
        variant: 'success',
      })
    } catch (error: any) {
      toast({
        title: 'Erro no teste',
        description: error?.message || 'Não foi possível enviar o teste.',
        variant: 'destructive',
      })
    } finally {
      setTesting(false)
    }
  }

  const refine = (
    mode: 'short' | 'elegant' | 'personal' | 'urgent' | 'exclusive',
  ) => {
    const firstSentence = draft.body.split(/[.!?]/)[0]?.trim()
    const base =
      firstSentence && firstSentence.length > 25
        ? `${firstSentence}.`
        : draft.body

    const next = {
      short: `${base} Posso te enviar uma curadoria rápida?`,
      elegant: `Olá, {{nome}}. Revendo seu perfil na Milan Horses, selecionei alguns destaques de {{leilao}} que merecem sua atenção. Posso te encaminhar uma curadoria objetiva?`,
      personal: `Olá, {{nome}}. Lembrei do seu perfil ao revisar {{leilao}} e achei alguns pontos bem alinhados ao seu histórico. Quer que eu te mande uma seleção curta?`,
      urgent: `Olá, {{nome}}. {{leilao}} acontece em {{data_leilao}} e há lotes compatíveis com seu perfil. Achei importante te avisar antes do fechamento.`,
      exclusive: `Olá, {{nome}}. Antes de ampliarmos a comunicação de {{leilao}}, queria te mostrar uma seleção mais reservada para clientes com perfil como o seu. Posso te enviar?`,
    }[mode]

    updateDraft({ body: next })
  }

  const createVariations = () => {
    setVariations([
      `Olá, {{nome}}. Separei alguns destaques de {{leilao}} que combinam com seu perfil na Milan Horses. Posso te mandar uma curadoria curta?`,
      `{{nome}}, revisando {{leilao}}, encontrei lotes em uma faixa próxima ao seu histórico. Quer que eu envie os principais pontos?`,
      `Olá, {{nome}}. Antes do leilão {{leilao}}, achei válido te mostrar uma seleção objetiva e bem alinhada ao seu perfil. Posso enviar?`,
    ])
  }

  const channelIcon =
    draft.type === 'WhatsApp' ? (
      <MessageSquare className="h-4 w-4" />
    ) : (
      <Mail className="h-4 w-4" />
    )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-primary/10 px-2 py-1 text-sm font-medium text-primary">
            <Wand2 className="h-4 w-4" />
            Comunicação premium
          </div>
          <h1 className="text-3xl font-bold font-display text-primary">
            Estúdio de Mensagens
          </h1>
          <p className="max-w-3xl text-muted-foreground">
            Crie WhatsApps e e-mails elegantes para convites VIP, reativação,
            underbidders e campanhas de leilões reais.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => startNew('WhatsApp')}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Novo WhatsApp
          </Button>
          <Button onClick={() => startNew('E-mail')}>
            <Mail className="mr-2 h-4 w-4" />
            Novo e-mail
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Modelos salvos</div>
            <div className="mt-1 text-2xl font-semibold text-primary">
              {templates.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">WhatsApp</div>
            <div className="mt-1 text-2xl font-semibold text-primary">
              {templates.filter((item) => item.type === 'WhatsApp').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">E-mails</div>
            <div className="mt-1 text-2xl font-semibold text-primary">
              {templates.filter((item) => item.type === 'E-mail').length}
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-3 xl:col-span-2">
          <CardContent className="flex h-full items-center gap-3 p-4 text-sm text-muted-foreground">
            <Crown className="h-5 w-5 text-amber-700" />
            Escreva como consultoria de luxo: curto, pessoal, oportuno e sempre
            conectado ao histórico do cliente.
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)_380px]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Biblioteca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar modelo ou receita..."
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={channel}
                onValueChange={(value) =>
                  setChannel(value as TemplateType | 'Todos')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos canais</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="E-mail">E-mail</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={category}
                onValueChange={(value) =>
                  setCategory(value as TemplateCategory | 'Todas')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Categorias</SelectItem>
                  {CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="recipes">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recipes">Receitas</TabsTrigger>
                <TabsTrigger value="saved">Salvos</TabsTrigger>
              </TabsList>

              <TabsContent value="recipes" className="mt-3">
                <ScrollArea className="h-[560px] pr-3">
                  <div className="space-y-2">
                    {RECIPES.filter((recipe) => {
                      const term = search.toLowerCase()
                      const matchesSearch =
                        !term ||
                        recipe.title.toLowerCase().includes(term) ||
                        recipe.objective.toLowerCase().includes(term)
                      const matchesChannel =
                        channel === 'Todos' || recipe.type === channel
                      const matchesCategory =
                        category === 'Todas' || recipe.category === category
                      return matchesSearch && matchesChannel && matchesCategory
                    }).map((recipe) => (
                      <button
                        key={`${recipe.title}-${recipe.type}`}
                        type="button"
                        className="w-full rounded-md border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
                        onClick={() => loadRecipe(recipe)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-medium">{recipe.title}</div>
                          <Badge variant="outline" className="shrink-0">
                            {recipe.type}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {recipe.objective}
                        </div>
                        <div className="mt-2 text-xs text-primary">
                          {recipe.tone}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="saved" className="mt-3">
                <ScrollArea className="h-[560px] pr-3">
                  {loading ? (
                    <div className="flex h-40 items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : filteredTemplates.length ? (
                    <div className="space-y-2">
                      {filteredTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          className={cn(
                            'w-full rounded-md border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5',
                            selectedId === template.id &&
                              'border-primary bg-primary/5',
                          )}
                          onClick={() => loadTemplate(template)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium">{template.title}</div>
                            <Badge variant="outline" className="shrink-0">
                              {template.type}
                            </Badge>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {template.category}
                          </div>
                          <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                            {template.body.replace(/<[^>]+>/g, '')}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Nenhum modelo encontrado.
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
            <CardTitle className="flex items-center gap-2">
              {channelIcon}
              Editor
            </CardTitle>
            <div className="flex gap-2">
              {selectedId ? (
                <Button variant="ghost" size="icon" onClick={deleteTemplate}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
              <Button variant="outline" onClick={copyPreview}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </Button>
              <Button
                variant="outline"
                onClick={createCampaignFromTemplate}
                disabled={saving || !draft.body}
              >
                <Megaphone className="mr-2 h-4 w-4" />
                Criar campanha
              </Button>
              <Button onClick={saveTemplate} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
              <div className="space-y-2">
                <Label htmlFor="title">Nome do modelo</Label>
                <Input
                  id="title"
                  value={draft.title}
                  onChange={(event) =>
                    updateDraft({ title: event.target.value })
                  }
                  placeholder="Ex: Convite VIP discreto"
                />
              </div>
              <div className="space-y-2">
                <Label>Canal</Label>
                <Select
                  value={draft.type}
                  onValueChange={(value) =>
                    updateDraft({
                      type: value as TemplateType,
                      subject:
                        value === 'E-mail'
                          ? draft.subject ||
                            'Curadoria Milan Horses: {{leilao}}'
                          : '',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="E-mail">E-mail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={draft.category}
                  onValueChange={(value) =>
                    updateDraft({ category: value as TemplateCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {draft.type === 'E-mail' ? (
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  value={draft.subject || ''}
                  onChange={(event) =>
                    updateDraft({ subject: event.target.value })
                  }
                  placeholder="Curadoria Milan Horses: {{leilao}}"
                />
              </div>
            ) : null}

            {draft.type === 'E-mail' ? (
              <div className="space-y-4 rounded-md border bg-muted/10 p-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Image className="h-4 w-4 text-primary" />
                      Blocos editoriais
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Monte e-mails visuais com imagens públicas, layout de casa
                      de leilão e CTAs.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyPremiumLayout}
                  >
                    <PanelTop className="mr-2 h-4 w-4" />
                    Aplicar layout premium
                  </Button>
                </div>

                <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-3">
                    <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                      <Input
                        value={assetUrl}
                        onChange={(event) => setAssetUrl(event.target.value)}
                        placeholder="URL pública da imagem ou banner"
                      />
                      <Button type="button" variant="outline" asChild>
                        <label className="cursor-pointer">
                          {uploadingAsset ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          Upload
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            className="hidden"
                            onChange={uploadEmailAsset}
                            disabled={uploadingAsset}
                          />
                        </label>
                      </Button>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      <Input
                        value={assetAlt}
                        onChange={(event) => setAssetAlt(event.target.value)}
                        placeholder="Texto alternativo"
                      />
                      <Input
                        value={assetCaption}
                        onChange={(event) =>
                          setAssetCaption(event.target.value)
                        }
                        placeholder="Legenda opcional"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Select
                      value={assetVariant}
                      onValueChange={(value) =>
                        setAssetVariant(value as 'banner' | 'photo' | 'feature')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="banner">
                          Banner full width
                        </SelectItem>
                        <SelectItem value="photo">Foto com legenda</SelectItem>
                        <SelectItem value="feature">
                          Imagem editorial
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      className="w-full"
                      onClick={insertImageAsset}
                    >
                      <Image className="mr-2 h-4 w-4" />
                      Inserir imagem
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendEmailBlock(editorialHeaderBlock())}
                  >
                    <PanelTop className="mr-2 h-4 w-4" />
                    Cabeçalho
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendEmailBlock(dividerBlock())}
                  >
                    <Rows3 className="mr-2 h-4 w-4" />
                    Divisor
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendEmailBlock(signatureBlock())}
                  >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Assinatura
                  </Button>
                </div>

                <div className="grid gap-2 lg:grid-cols-[0.7fr_1fr_auto]">
                  <Input
                    value={ctaLabel}
                    onChange={(event) => setCtaLabel(event.target.value)}
                    placeholder="Texto do CTA"
                  />
                  <Input
                    value={ctaUrl}
                    onChange={(event) => setCtaUrl(event.target.value)}
                    placeholder="Link do CTA"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendEmailBlock(ctaBlock(ctaLabel, ctaUrl))}
                  >
                    <MousePointer2 className="mr-2 h-4 w-4" />
                    Inserir CTA
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <Label htmlFor="body">Mensagem</Label>
                <div className="flex flex-wrap gap-1">
                  {VARIABLES.map((variable) => (
                    <Button
                      key={variable.key}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(variable.key)}
                      title={variable.label}
                    >
                      {variable.key}
                    </Button>
                  ))}
                </div>
              </div>
              <Textarea
                id="body"
                value={draft.body}
                onChange={(event) => updateDraft({ body: event.target.value })}
                placeholder="Escreva uma mensagem pessoal, curta e alinhada ao histórico do cliente..."
                className="min-h-[260px] resize-y font-mono text-sm leading-relaxed"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {draft.body.length} caracteres ·{' '}
                  {whatsappLengthHint(draft.body)}
                </span>
                <span>
                  Variáveis:{' '}
                  {variablesInDraft.length
                    ? variablesInDraft.join(', ')
                    : 'nenhuma'}
                </span>
              </div>
            </div>

            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-primary" />
                Assistente de copy
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refine('elegant')}
                >
                  Mais elegante
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refine('short')}
                >
                  Mais curta
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refine('personal')}
                >
                  Mais pessoal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refine('urgent')}
                >
                  Mais urgente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refine('exclusive')}
                >
                  Mais exclusiva
                </Button>
                <Button variant="outline" size="sm" onClick={createVariations}>
                  Criar 3 variações
                </Button>
              </div>
              {variations.length ? (
                <div className="grid gap-2">
                  {variations.map((variation, index) => (
                    <button
                      key={variation}
                      type="button"
                      className="rounded-md border p-3 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5"
                      onClick={() => updateDraft({ body: variation })}
                    >
                      <span className="font-medium">
                        Variação {index + 1}:{' '}
                      </span>
                      {variation}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 2xl:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview e teste
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Cliente de exemplo</div>
              <div className="rounded-md border p-3 text-sm">
                <div className="font-semibold">{SAMPLE_CONTEXT.nome}</div>
                <div className="text-muted-foreground">
                  {SAMPLE_CONTEXT.segmento} · {SAMPLE_CONTEXT.cidade}
                </div>
                <div className="text-muted-foreground">
                  Ticket médio {SAMPLE_CONTEXT.ticket_medio}
                </div>
              </div>
            </div>

            {draft.type === 'WhatsApp' ? (
              <div className="rounded-md border bg-emerald-50 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-900">
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </div>
                <div className="rounded-md bg-white p-3 text-sm leading-relaxed shadow-sm">
                  {previewBody || 'Sua mensagem aparecerá aqui.'}
                </div>
              </div>
            ) : (
              <div className="rounded-md border p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-4 w-4 text-blue-700" />
                  E-mail
                </div>
                <div className="border-b pb-2 text-sm">
                  <span className="text-muted-foreground">Assunto: </span>
                  <span className="font-medium">
                    {previewSubject || 'Assunto do e-mail'}
                  </span>
                </div>
                <div
                  className="prose prose-sm mt-3 max-w-none text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: previewBody || 'Sua mensagem aparecerá aqui.',
                  }}
                />
              </div>
            )}

            <div className="space-y-2 rounded-md border p-3">
              <div className="text-sm font-medium">Enviar teste</div>
              <Input
                value={testTarget}
                onChange={(event) => setTestTarget(event.target.value)}
                placeholder={
                  draft.type === 'WhatsApp'
                    ? 'WhatsApp com DDD'
                    : 'email@dominio.com'
                }
              />
              <Button
                className="w-full"
                onClick={sendTest}
                disabled={testing || !draft.body || !testTarget}
              >
                {testing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar teste
              </Button>
            </div>

            <div className="space-y-2 rounded-md border p-3 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <Check className="h-4 w-4 text-emerald-700" />
                Checklist premium
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li>Mensagem pessoal e curta.</li>
                <li>Contexto claro do leilão.</li>
                <li>Convite com próxima ação simples.</li>
                <li>Sem pressão excessiva para cliente VIP.</li>
              </ul>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                window.location.href = '/radar-vip'
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Usar no Radar VIP
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
