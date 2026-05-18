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
  FileText,
  Gavel,
  Image,
  Link as LinkIcon,
  Loader2,
  Mail,
  Megaphone,
  MessageSquare,
  MousePointer2,
  PanelTop,
  Paintbrush,
  Rows3,
  Save,
  Send,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { formatCivilDate } from '@/lib/dates'
import { supabase } from '@/lib/supabase/client'
import {
  templatesService,
  type MessageTemplate,
  type TemplateCategory,
  type TemplateInsert,
  type TemplateType,
} from '@/services/templates'
import { smartLeiloesService, type SmartLeilao } from '@/services/smartleiloes'
import { studioGoalsService, type StudioGoal } from '@/services/studio-goals'

type DraftTemplate = TemplateInsert & { id?: string }
type StudioToneId = 'editorial' | 'exclusivo' | 'direto' | 'caloroso'
type StudioVisualId = 'hero' | 'editorial' | 'lote'
type PremiumLayoutId =
  | 'convite-privado'
  | 'curadoria-lotes'
  | 'ultima-chamada'
  | 'pos-leilao'
  | 'alerta-pedigree'
  | 'catalogo-aberto'
  | 'underbidder-concierge'
  | 'aniversario-premium'
  | 'oportunidade-reservada'
  | 'pos-compra'

type WizardState = {
  goal: string
  tone: StudioToneId
  visual: StudioVisualId
  auctionId: string
  auctionName: string
  auctionDate: string
  audience: string
  bannerUrl: string
  bannerAlt: string
  headline: string
  lot: string
  valueRange: string
  ctaLabel: string
  ctaUrl: string
}

type PreviewContext = typeof SAMPLE_CONTEXT

const SAMPLE_CONTEXT = {
  nome: 'Nome do cliente',
  leilao: 'Leilão selecionado',
  data_leilao: 'Data do leilão',
  ticket_medio: 'histórico do cliente',
  cidade: 'Cidade do cliente',
  segmento: 'Segmento RFMV',
  curador: 'Equipe Milan Horses',
  lote: 'Lote indicado',
  valor: 'Faixa de valor',
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

const DEFAULT_GOALS: Array<
  Omit<StudioGoal, 'id' | 'created_at' | 'updated_at'>
> = [
  {
    title: 'Curadoria de leilão',
    category: 'Radar VIP',
    subject: 'Curadoria Milan Horses para {{leilao}}',
    description: 'Seleção refinada de lotes para clientes com fit claro.',
    base_text:
      'Revendo seu perfil conosco, preparei uma curadoria objetiva e cuidadosamente filtrada. Selecionei alguns destaques que parecem bem alinhados ao seu histórico na Milan Horses.',
  },
  {
    title: 'Convite VIP',
    category: 'Convite VIP',
    subject: 'Acesso reservado: {{leilao}}',
    description: 'Convite privado para clientes de alto valor.',
    base_text:
      'Revendo seu perfil conosco, preparei uma curadoria objetiva e cuidadosamente filtrada. O objetivo é te dar uma visão antecipada de oportunidades compatíveis com seu perfil antes da abertura para a base completa.',
  },
  {
    title: 'Underbidder',
    category: 'Underbidder',
    subject: 'Novas oportunidades alinhadas ao seu histórico',
    description: 'Reengaja quem disputou forte e não comprou.',
    base_text:
      'Revendo seu perfil conosco, preparei uma curadoria objetiva e cuidadosamente filtrada. Como você costuma disputar lotes com intenção clara, há oportunidades em {{leilao}} que merecem atenção antes do fechamento.',
  },
  {
    title: 'Reativação elegante',
    category: 'Reativação de Cliente',
    subject: 'Uma seleção pensada para seu perfil',
    description: 'Retoma conversa com cliente inativo sem pressão.',
    base_text:
      'Revendo seu perfil conosco, preparei uma curadoria objetiva e cuidadosamente filtrada. Faz algum tempo que não nos falamos, mas {{leilao}} trouxe uma seleção que parece próxima do seu momento e do seu padrão de compra.',
  },
  {
    title: 'Última chamada',
    category: 'Novo Leilão',
    subject: 'Última chamada para {{leilao}}',
    description: 'Lembra prazo e cria urgência com sobriedade.',
    base_text:
      'Revendo seu perfil conosco, preparei uma curadoria objetiva e cuidadosamente filtrada. {{leilao}} acontece em {{data_leilao}}, então achei importante te avisar enquanto ainda há tempo para avaliar os lotes com calma.',
  },
  {
    title: 'Pós-leilão',
    category: 'Pós-leilão',
    subject: 'Obrigado pela participação no leilão',
    description: 'Agradece e prepara o próximo relacionamento.',
    base_text:
      'Obrigado pela participação no leilão. Foi um prazer acompanhar seu interesse, e vou seguir atento a oportunidades realmente compatíveis com seu perfil.',
  },
]

const TONE_PRESETS: Array<{
  id: StudioToneId
  title: string
  description: string
}> = [
  {
    id: 'editorial',
    title: 'Editorial',
    description: 'Sofisticado, claro e com ritmo de catálogo premium.',
  },
  {
    id: 'exclusivo',
    title: 'Exclusivo',
    description: 'Mais reservado, pessoal e orientado a clientes VIP.',
  },
  {
    id: 'direto',
    title: 'Direto',
    description: 'Objetivo para quem já demonstrou intenção forte.',
  },
  {
    id: 'caloroso',
    title: 'Caloroso',
    description: 'Mais relacional, bom para reativação e pós-leilão.',
  },
]

const VISUAL_PRESETS: Array<{
  id: StudioVisualId
  title: string
  description: string
}> = [
  {
    id: 'hero',
    title: 'Banner hero',
    description: 'Imagem grande, título forte e CTA elegante.',
  },
  {
    id: 'editorial',
    title: 'Editorial limpo',
    description: 'Cabeçalho de casa de leilão, texto e assinatura.',
  },
  {
    id: 'lote',
    title: 'Lote em destaque',
    description: 'Imagem com legenda e bloco de recomendação.',
  },
]

const PREMIUM_EMAIL_LAYOUTS: Array<{
  id: PremiumLayoutId
  title: string
  badge: string
  category: TemplateCategory
  goal: string
  subject: string
  headline: string
  ctaLabel: string
  description: string
  bestFor: string
}> = [
  {
    id: 'convite-privado',
    title: 'Convite Privado',
    badge: 'VIP',
    category: 'Convite VIP',
    goal: 'convite-vip',
    subject: 'Acesso reservado: {{leilao}}',
    headline: 'Uma seleção reservada para o seu perfil',
    ctaLabel: 'Ver curadoria privada',
    description: 'Abertura sofisticada para clientes de alto valor.',
    bestFor: 'Clientes VIP e compradores recorrentes',
  },
  {
    id: 'curadoria-lotes',
    title: 'Curadoria de Lotes',
    badge: 'Curadoria',
    category: 'Radar VIP',
    goal: 'curadoria',
    subject: 'Curadoria Milan Horses para {{leilao}}',
    headline: 'Três lotes que merecem sua atenção',
    ctaLabel: 'Abrir seleção completa',
    description: 'Recomendação consultiva com destaque de lote e fit.',
    bestFor: 'Radar VIP e compradores quentes',
  },
  {
    id: 'ultima-chamada',
    title: 'Última Chamada Elegante',
    badge: 'Conversão',
    category: 'Novo Leilão',
    goal: 'ultima-chamada',
    subject: 'Última chamada para {{leilao}}',
    headline: 'Ainda há tempo para revisar com calma',
    ctaLabel: 'Revisar lotes indicados',
    description: 'Urgência sem pressão, boa para reta final do leilão.',
    bestFor: 'Clientes engajados antes do fechamento',
  },
  {
    id: 'pos-leilao',
    title: 'Pós-Leilão Premium',
    badge: 'Relação',
    category: 'Pós-leilão',
    goal: 'pos-leilao',
    subject: 'Obrigado pela participação no leilão',
    headline: 'Obrigado pela participação',
    ctaLabel: 'Falar com a equipe Milan',
    description: 'Follow-up elegante para manter o relacionamento vivo.',
    bestFor: 'Participantes e compradores recentes',
  },
  {
    id: 'alerta-pedigree',
    title: 'Alerta de Pedigree',
    badge: 'Genética',
    category: 'Informações de Lote',
    goal: 'curadoria',
    subject: 'Ficha genética selecionada para você',
    headline: 'Uma genealogia que vale olhar com lupa',
    ctaLabel: 'Ver ficha genética',
    description: 'Destaque técnico para matriz, garanhão e valor genético.',
    bestFor: 'Clientes focados em genética e matrizes',
  },
  {
    id: 'catalogo-aberto',
    title: 'Catálogo Aberto',
    badge: 'Leilão',
    category: 'Novo Leilão',
    goal: 'convite-vip',
    subject: 'Catálogo aberto: {{leilao}}',
    headline: '{{leilao}} já está disponível',
    ctaLabel: 'Abrir catálogo',
    description: 'Anúncio editorial para apresentar um leilão novo.',
    bestFor: 'Toda lista qualificada',
  },
  {
    id: 'underbidder-concierge',
    title: 'Underbidder Concierge',
    badge: 'Recuperação',
    category: 'Underbidder',
    goal: 'underbidder',
    subject: 'Uma oportunidade próxima ao seu último lance',
    headline: 'Uma oportunidade próxima ao seu último lance',
    ctaLabel: 'Receber comparação',
    description: 'Retoma clientes que disputaram forte e não compraram.',
    bestFor: 'Underbidders reais',
  },
  {
    id: 'aniversario-premium',
    title: 'Aniversário Premium',
    badge: 'Relacionamento',
    category: 'Aniversário',
    goal: 'reativacao',
    subject: 'Feliz aniversário, {{nome}}',
    headline: 'Um novo ciclo com boas conquistas',
    ctaLabel: 'Responder à equipe Milan',
    description: 'Mensagem pessoal, elegante e com cara de concierge.',
    bestFor: 'Datas de relacionamento',
  },
  {
    id: 'oportunidade-reservada',
    title: 'Oportunidade Reservada',
    badge: 'Private',
    category: 'Convite VIP',
    goal: 'convite-vip',
    subject: 'Oportunidade reservada Milan Horses',
    headline: 'Um lote que preferi te mostrar antes',
    ctaLabel: 'Solicitar detalhes reservados',
    description: 'Peça mais exclusiva para um lote específico.',
    bestFor: 'VIPs com fit claro para um lote',
  },
  {
    id: 'pos-compra',
    title: 'Próximos Passos Pós-Compra',
    badge: 'Comprador',
    category: 'Agradecimento Pós-Compra',
    goal: 'pos-leilao',
    subject: 'Próximos passos da sua compra',
    headline: 'Obrigado pela confiança na Milan Horses',
    ctaLabel: 'Falar sobre próximos passos',
    description: 'Organiza o pós-venda com tom premium e claro.',
    bestFor: 'Compradores confirmados',
  },
]

const emptyWizard: WizardState = {
  goal: '',
  tone: 'editorial',
  visual: 'hero',
  auctionId: '',
  auctionName: 'Leilão selecionado',
  auctionDate: '',
  audience: 'Radar VIP',
  bannerUrl: '',
  bannerAlt: 'Banner Milan Horses',
  headline: 'Curadoria privada Milan Horses',
  lot: '',
  valueRange: '',
  ctaLabel: 'Ver curadoria',
  ctaUrl: 'https://www.milanhorses.com.br',
}

const emptyDraft: DraftTemplate = {
  title: '',
  category: 'Radar VIP',
  type: 'E-mail',
  subject: 'Curadoria Milan Horses: {{leilao}}',
  body: '',
  variables: ['nome', 'leilao'],
}

const renderWithSample = (
  text = '',
  context: PreviewContext = SAMPLE_CONTEXT,
) =>
  Object.entries(context).reduce(
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

const messageLengthHint = (type: TemplateType, body: string) => {
  if (type === 'WhatsApp') return whatsappLengthHint(body)
  const readableLength = body
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ').length
  if (readableLength <= 1200) return 'Bom tamanho para e-mail consultivo'
  return 'E-mail longo; revise para manter a curadoria objetiva'
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

const formatAuctionDate = (value?: string | null) => {
  return value ? formatCivilDate(value, '') : ''
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

const paragraphForGoal = (
  goalId: string,
  goals: StudioGoal[],
  wizard: WizardState,
) => {
  const goal = goals.find((g) => g.id === goalId)
  if (!goal) return ''
  let text = goal.base_text || ''
  if (wizard.lot) {
    text += ` Incluí especialmente o lote <strong>{{lote}}</strong>.`
  }
  return text
}

const buildPremiumEmail = (
  wizard: WizardState,
  context: PreviewContext,
  goalPreset: StudioGoal,
  goals: StudioGoal[],
) => {
  const imageHtml = wizard.bannerUrl
    ? imageBlock({
        src: wizard.bannerUrl,
        alt: wizard.bannerAlt || 'Banner Milan Horses',
        caption:
          wizard.visual === 'lote'
            ? wizard.lot || 'Destaque selecionado pela curadoria Milan Horses.'
            : '',
        variant: wizard.visual === 'lote' ? 'feature' : 'banner',
      })
    : ''

  const intro = paragraphForGoal(wizard.goal, goals, wizard)
  const title =
    wizard.headline.trim() ||
    (goalPreset.title === 'Convite VIP'
      ? 'Acesso reservado Milan Horses'
      : 'Curadoria privada Milan Horses')

  const content = `
${imageHtml}
<div style="margin:0 0 28px;text-align:center;">
  <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:2.2px;text-transform:uppercase;color:#9a7a3f;">${escapeHtml(goalPreset.title)}</div>
  <h2 style="margin:10px 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.15;font-weight:400;color:#12284c;">${escapeHtml(title)}</h2>
  <div style="font-family:Arial,sans-serif;font-size:13px;color:#6c7280;">{{leilao}}${wizard.auctionDate ? ' · {{data_leilao}}' : ''}</div>
</div>
<p>Olá, {{nome}}.</p>
<p>${intro}</p>
<p>Se fizer sentido, posso te enviar uma seleção curta com os principais pontos e próximos passos.</p>
${
  wizard.lot || wizard.valueRange
    ? `<div style="margin:28px 0;padding:18px 20px;background:#fbfaf7;border:1px solid #e5dfd6;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#4f5b6d;">
  <strong style="display:block;color:#12284c;margin-bottom:6px;">Destaque da curadoria</strong>
  ${wizard.lot ? `Lote: {{lote}}<br />` : ''}
  ${wizard.valueRange ? `Faixa de valor: {{valor}}<br />` : ''}
  Perfil: {{segmento}} · {{cidade}}
</div>`
    : ''
}
${ctaBlock(wizard.ctaLabel, wizard.ctaUrl)}
${signatureBlock()}
`

  return emailShell(content)
    .replaceAll('{{leilao}}', wizard.auctionName || context.leilao)
    .replaceAll('{{data_leilao}}', wizard.auctionDate || context.data_leilao)
    .replaceAll('{{lote}}', wizard.lot || context.lote)
    .replaceAll('{{valor}}', wizard.valueRange || context.valor)
}

const premiumLayoutBodyBlock = (
  layoutId: PremiumLayoutId,
  wizard: WizardState,
) => {
  const lot = wizard.lot || '{{lote}}'
  const value = wizard.valueRange || '{{valor}}'

  if (layoutId === 'alerta-pedigree') {
    return `<div style="margin:28px 0;padding:22px;background:#fbfaf7;border:1px solid #e5dfd6;font-family:Arial,sans-serif;color:#4f5b6d;">
  <div style="font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:#9a7a3f;">Leitura genética</div>
  <div style="margin-top:8px;font-size:18px;font-weight:700;color:#12284c;">${escapeHtml(lot)}</div>
  <div style="margin-top:10px;font-size:13px;line-height:1.7;">Potencial técnico, genealogia e encaixe com seu histórico devem ser avaliados juntos. Este destaque foi separado para uma análise mais cuidadosa antes do leilão.</div>
  <div style="margin-top:12px;font-size:13px;">Faixa de referência: <strong style="color:#12284c;">${escapeHtml(value)}</strong></div>
</div>`
  }

  if (layoutId === 'underbidder-concierge') {
    return `<div style="margin:28px 0;padding:20px;border-left:3px solid #9a7a3f;background:#fbfaf7;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#4f5b6d;">
  Você demonstrou intenção clara em disputas recentes. Em vez de mandar o catálogo inteiro, separei uma alternativa próxima ao seu padrão para avaliarmos com calma.
</div>`
  }

  if (layoutId === 'pos-compra') {
    return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0;border-collapse:collapse;font-family:Arial,sans-serif;">
  <tr><td style="padding:14px 0;border-top:1px solid #e5dfd6;"><strong style="color:#12284c;">1. Confirmação</strong><br /><span style="font-size:13px;color:#5f6878;">Validamos os detalhes principais da compra.</span></td></tr>
  <tr><td style="padding:14px 0;border-top:1px solid #e5dfd6;"><strong style="color:#12284c;">2. Próximos documentos</strong><br /><span style="font-size:13px;color:#5f6878;">A equipe acompanha você nos passos operacionais.</span></td></tr>
  <tr><td style="padding:14px 0;border-top:1px solid #e5dfd6;border-bottom:1px solid #e5dfd6;"><strong style="color:#12284c;">3. Curadoria futura</strong><br /><span style="font-size:13px;color:#5f6878;">Seguimos atentos a lotes compatíveis com seu perfil.</span></td></tr>
</table>`
  }

  if (layoutId === 'ultima-chamada') {
    return `<div style="margin:28px 0;text-align:center;font-family:Arial,sans-serif;">
  <div style="display:inline-block;padding:12px 18px;background:#12284c;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">Última janela de avaliação</div>
  <div style="margin-top:12px;font-size:13px;color:#5f6878;">Revise os lotes indicados antes do encerramento.</div>
</div>`
  }

  return `<div style="margin:28px 0;padding:18px 20px;background:#fbfaf7;border:1px solid #e5dfd6;font-family:Arial,sans-serif;font-size:13px;line-height:1.7;color:#4f5b6d;">
  <strong style="display:block;color:#12284c;margin-bottom:6px;">Destaque da curadoria</strong>
  ${wizard.lot ? `Lote: ${escapeHtml(lot)}<br />` : ''}
  ${wizard.valueRange ? `Faixa de valor: ${escapeHtml(value)}<br />` : ''}
  Perfil: {{segmento}} · {{cidade}}
</div>`
}

const buildPremiumLayoutEmail = (
  layout: (typeof PREMIUM_EMAIL_LAYOUTS)[number],
  wizard: WizardState,
  context: PreviewContext,
  goals: StudioGoal[],
) => {
  const banner = wizard.bannerUrl
    ? imageBlock({
        src: wizard.bannerUrl,
        alt: wizard.bannerAlt || layout.title,
        caption: '',
        variant: 'banner',
      })
    : ''
  const bodyCopy = paragraphForGoal(layout.goal, goals, wizard)
  const content = `
${banner}
<div style="margin:0 0 28px;text-align:center;">
  <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:2.2px;text-transform:uppercase;color:#9a7a3f;">${escapeHtml(layout.badge)} · Milan Horses</div>
  <h2 style="margin:10px 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.12;font-weight:400;color:#12284c;">${escapeHtml(wizard.headline || layout.headline)}</h2>
  <div style="font-family:Arial,sans-serif;font-size:13px;color:#6c7280;">{{leilao}}${wizard.auctionDate ? ' · {{data_leilao}}' : ''}</div>
</div>
<p>Olá, {{nome}}.</p>
<p>${bodyCopy}</p>
${premiumLayoutBodyBlock(layout.id, wizard)}
<p>Se fizer sentido, posso te enviar uma seleção curta com os pontos que realmente merecem atenção.</p>
${ctaBlock(wizard.ctaLabel || layout.ctaLabel, wizard.ctaUrl)}
${signatureBlock()}
`

  return emailShell(content)
    .replaceAll('{{leilao}}', wizard.auctionName || context.leilao)
    .replaceAll('{{data_leilao}}', wizard.auctionDate || context.data_leilao)
    .replaceAll('{{lote}}', wizard.lot || context.lote)
    .replaceAll('{{valor}}', wizard.valueRange || context.valor)
}

import { Plus } from 'lucide-react'

export default function Modelos() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [auctions, setAuctions] = useState<SmartLeilao[]>([])
  const [goals, setGoals] = useState<StudioGoal[]>([])
  const [draft, setDraft] = useState<DraftTemplate>(emptyDraft)
  const [wizard, setWizard] = useState<WizardState>(emptyWizard)
  const [selectedChannels, setSelectedChannels] = useState<TemplateType[]>([
    'E-mail',
  ])
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [editGoalForm, setEditGoalForm] = useState<Partial<StudioGoal>>({})
  const [selectedPremiumLayoutId, setSelectedPremiumLayoutId] =
    useState<PremiumLayoutId>('convite-privado')
  const [previewContext, setPreviewContext] =
    useState<PreviewContext>(SAMPLE_CONTEXT)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [auctionsLoading, setAuctionsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [search, setSearch] = useState('')
  const [channel, setChannel] = useState<TemplateType | 'Todos'>('Todos')
  const [category, setCategory] = useState<TemplateCategory | 'Todas'>('Todas')
  const [testTarget, setTestTarget] = useState('')
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

  const loadGoals = useCallback(async () => {
    try {
      const data = await studioGoalsService.getGoals()
      if (data.length === 0) {
        for (const preset of DEFAULT_GOALS) {
          await studioGoalsService.createGoal(preset)
        }
        const newData = await studioGoalsService.getGoals()
        setGoals(newData)
        updateWizard({ goal: newData[0]?.id || '' })
      } else {
        setGoals(data)
        setWizard((curr) => ({ ...curr, goal: curr.goal || data[0]?.id || '' }))
      }
    } catch (error) {
      console.error(error)
    }
  }, [])

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
    loadGoals()
  }, [loadTemplates, loadGoals])

  useEffect(() => {
    let mounted = true

    smartLeiloesService
      .getLeiloes()
      .then(({ data, error }) => {
        if (!mounted) return
        if (error) throw new Error(error)
        setAuctions(data || [])
      })
      .catch((error: any) => {
        toast({
          title: 'Leilões indisponíveis',
          description:
            error?.message ||
            'Não foi possível carregar os leilões sincronizados.',
          variant: 'destructive',
        })
      })
      .finally(() => {
        if (mounted) setAuctionsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [toast])

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

  const previewSubject = renderWithSample(draft.subject || '', previewContext)
  const previewBody = renderWithSample(draft.body, previewContext)
  const variablesInDraft = extractVariables(
    `${draft.subject || ''} ${draft.body}`,
  )

  const updateDraft = (patch: Partial<DraftTemplate>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setVariations([])
  }

  const updateWizard = (patch: Partial<WizardState>) => {
    setWizard((current) => ({ ...current, ...patch }))
  }

  const updatePreviewContext = (patch: Partial<PreviewContext>) => {
    setPreviewContext((current) => ({ ...current, ...patch }))
  }

  const startNew = (type: TemplateType = 'E-mail') => {
    setSelectedId(null)
    setVariations([])
    setSelectedChannels([type])
    setDraft({
      ...emptyDraft,
      type,
      subject: type === 'E-mail' ? 'Curadoria Milan Horses: {{leilao}}' : '',
    })
  }

  const loadTemplate = (template: MessageTemplate) => {
    setSelectedId(template.id)
    setVariations([])
    setSelectedChannels([template.type])
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

  const selectAuction = (auctionId: string) => {
    const auction = auctions.find((item) => String(item.id) === auctionId)
    updateWizard({
      auctionId,
      auctionName: auction?.title || auction?.name || wizard.auctionName,
      auctionDate: formatAuctionDate(auction?.date || auction?.start_date),
    })
  }

  const generatePremiumEmail = () => {
    const goalPreset = goals.find((item) => item.id === wizard.goal) || goals[0]
    if (!goalPreset) return
    const body = buildPremiumEmail(wizard, previewContext, goalPreset, goals)
    const title = `${goalPreset.title} · ${wizard.auctionName || 'Milan Horses'}`
    const subject = (goalPreset.subject || '')
      .replaceAll('{{leilao}}', wizard.auctionName || '{{leilao}}')
      .replaceAll('{{data_leilao}}', wizard.auctionDate || '{{data_leilao}}')

    setSelectedId(null)
    setVariations([])
    setSelectedChannels(['E-mail'])
    setDraft({
      title,
      category: goalPreset.category,
      type: 'E-mail',
      subject,
      body,
      variables: extractVariables(`${subject} ${body}`),
    })
    setAssetUrl(wizard.bannerUrl)
    setAssetAlt(wizard.bannerAlt)
    setAssetCaption(wizard.lot)
    setCtaLabel(wizard.ctaLabel)
    setCtaUrl(wizard.ctaUrl)
    setPreviewContext((current) => ({
      ...current,
      leilao: wizard.auctionName || current.leilao,
      data_leilao: wizard.auctionDate || current.data_leilao,
      lote: wizard.lot || current.lote,
      valor: wizard.valueRange || current.valor,
      segmento: wizard.audience || current.segmento,
    }))

    toast({
      title: 'E-mail premium criado',
      description: 'Revise o preview, envie um teste e salve como modelo.',
      variant: 'success',
    })
  }

  const selectPremiumLayout = (
    layout: (typeof PREMIUM_EMAIL_LAYOUTS)[number],
  ) => {
    setSelectedPremiumLayoutId(layout.id)
    setSelectedChannels(['E-mail'])
    const matchingGoal = goals.find((g) => g.title === layout.title) || goals[0]
    updateWizard({
      goal: matchingGoal?.id || '',
      visual: 'hero',
      headline: layout.headline,
      ctaLabel: layout.ctaLabel,
    })
  }

  const applySelectedPremiumLayout = () => {
    const layout =
      PREMIUM_EMAIL_LAYOUTS.find(
        (item) => item.id === selectedPremiumLayoutId,
      ) || PREMIUM_EMAIL_LAYOUTS[0]
    const matchingGoal = goals.find((g) => g.title === layout.title) || goals[0]
    const nextWizard: WizardState = {
      ...wizard,
      goal: matchingGoal?.id || '',
      visual: 'hero',
      headline: wizard.headline || layout.headline,
      ctaLabel: wizard.ctaLabel || layout.ctaLabel,
    }
    const subject = layout.subject
      .replaceAll('{{leilao}}', nextWizard.auctionName || '{{leilao}}')
      .replaceAll(
        '{{data_leilao}}',
        nextWizard.auctionDate || '{{data_leilao}}',
      )
    const body = buildPremiumLayoutEmail(
      layout,
      nextWizard,
      previewContext,
      goals,
    )

    setSelectedId(null)
    setVariations([])
    setSelectedChannels(['E-mail'])
    setWizard(nextWizard)
    setDraft({
      title: `${layout.title} · ${nextWizard.auctionName || 'Milan Horses'}`,
      category: layout.category,
      type: 'E-mail',
      subject,
      body,
      variables: extractVariables(`${subject} ${body}`),
    })
    setAssetUrl(nextWizard.bannerUrl)
    setAssetAlt(nextWizard.bannerAlt)
    setAssetCaption(nextWizard.lot)
    setCtaLabel(nextWizard.ctaLabel)
    setCtaUrl(nextWizard.ctaUrl)
    setPreviewContext((current) => ({
      ...current,
      leilao: nextWizard.auctionName || current.leilao,
      data_leilao: nextWizard.auctionDate || current.data_leilao,
      lote: nextWizard.lot || current.lote,
      valor: nextWizard.valueRange || current.valor,
      segmento: nextWizard.audience || current.segmento,
    }))

    toast({
      title: 'Layout premium aplicado',
      description: 'O e-mail foi criado no editor com banner, CTA e estrutura.',
      variant: 'success',
    })
  }

  const buildWizardWhatsApp = () => {
    const goalObj = goals.find((g) => g.id === wizard.goal)
    const body = paragraphForGoal(wizard.goal, goals, wizard)
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    const close =
      goalObj?.title === 'Pós-leilão'
        ? 'Quando aparecer algo especial, te aviso por aqui.'
        : 'Posso te enviar uma curadoria curta por aqui?'

    return `Olá, {{nome}}. ${body} ${close}`
      .replaceAll('{{leilao}}', wizard.auctionName || '{{leilao}}')
      .replaceAll('{{data_leilao}}', wizard.auctionDate || '{{data_leilao}}')
      .replaceAll('{{lote}}', wizard.lot || '{{lote}}')
      .replaceAll('{{valor}}', wizard.valueRange || '{{valor}}')
  }

  const generateWizardWhatsApp = () => {
    const goalPreset = goals.find((item) => item.id === wizard.goal) || goals[0]
    if (!goalPreset) return
    const body = buildWizardWhatsApp()
    const title = `${goalPreset.title} · ${wizard.auctionName || 'Milan Horses'}`

    setSelectedId(null)
    setVariations([])
    setSelectedChannels(['WhatsApp'])
    setDraft({
      title,
      category: goalPreset.category,
      type: 'WhatsApp',
      subject: '',
      body,
      variables: extractVariables(body),
    })
    setPreviewContext((current) => ({
      ...current,
      leilao: wizard.auctionName || current.leilao,
      data_leilao: wizard.auctionDate || current.data_leilao,
      lote: wizard.lot || current.lote,
      valor: wizard.valueRange || current.valor,
      segmento: wizard.audience || current.segmento,
    }))

    toast({
      title: 'WhatsApp criado',
      description: 'Revise o texto, envie um teste e salve como modelo.',
      variant: 'success',
    })
  }

  const generateFromWizard = () => {
    if (selectedChannels.includes('WhatsApp')) {
      generateWizardWhatsApp()
    }
    if (selectedChannels.includes('E-mail')) {
      generatePremiumEmail()
    }
  }

  const startEditingGoal = (goal: StudioGoal) => {
    setEditingGoalId(goal.id)
    setEditGoalForm({
      title: goal.title,
      description: goal.description,
      subject: goal.subject,
      base_text: goal.base_text,
    })
  }

  const createNewGoal = () => {
    const newId = 'new-' + Date.now()
    setEditingGoalId(newId)
    setEditGoalForm({
      title: 'Novo Objetivo',
      description: 'Descrição do objetivo',
      subject: 'Assunto do e-mail',
      base_text: 'Escreva o texto base aqui...',
      category: 'Radar VIP',
    })
  }

  const saveGoal = async (id: string) => {
    try {
      if (id.startsWith('new-')) {
        const created = await studioGoalsService.createGoal({
          title: editGoalForm.title || 'Novo',
          description: editGoalForm.description || '',
          subject: editGoalForm.subject || '',
          base_text: editGoalForm.base_text || '',
          category: (editGoalForm.category as TemplateCategory) || 'Radar VIP',
        })
        setGoals([...goals, created])
        updateWizard({ goal: created.id })
      } else {
        const updated = await studioGoalsService.updateGoal(id, editGoalForm)
        setGoals(goals.map((g) => (g.id === id ? updated : g)))
      }
      setEditingGoalId(null)
      toast({ title: 'Objetivo salvo', variant: 'success' })
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar objetivo',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const toggleChannel = (channel: TemplateType) => {
    setSelectedChannels((curr) =>
      curr.includes(channel)
        ? curr.filter((c) => c !== channel)
        : [...curr, channel],
    )
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
      updateWizard({
        bannerUrl: data.publicUrl,
        bannerAlt: file.name.replace(/\.[^/.]+$/, '') || 'Imagem Milan Horses',
      })
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
  const selectedGoal = goals.find((item) => item.id === wizard.goal) || goals[0]
  const selectedTone = TONE_PRESETS.find((item) => item.id === wizard.tone)
  const selectedPremiumLayout =
    PREMIUM_EMAIL_LAYOUTS.find((item) => item.id === selectedPremiumLayoutId) ||
    PREMIUM_EMAIL_LAYOUTS[0]
  const wizardPreviewSubject = (selectedGoal?.subject || '')
    .replaceAll('{{leilao}}', wizard.auctionName || 'Leilão selecionado')
    .replaceAll('{{data_leilao}}', wizard.auctionDate || 'Data do leilão')
  const wizardPreviewMessage = renderWithSample(
    buildWizardWhatsApp(),
    previewContext,
  )
  const readyItems = [
    { label: 'Objetivo definido', done: Boolean(wizard.goal) },
    { label: `Canais selecionados`, done: selectedChannels.length > 0 },
    { label: 'Leilão escolhido', done: Boolean(wizard.auctionName.trim()) },
  ]
  const readyCount = readyItems.filter((item) => item.done).length

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

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground mr-2">
            Canais da campanha:
          </span>
          <Button
            variant={
              selectedChannels.includes('WhatsApp') ? 'default' : 'outline'
            }
            onClick={() => toggleChannel('WhatsApp')}
            className={cn(
              selectedChannels.includes('WhatsApp') &&
                'bg-[#12284c] text-white hover:bg-[#12284c]/90',
            )}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            WhatsApp
          </Button>
          <Button
            variant={
              selectedChannels.includes('E-mail') ? 'default' : 'outline'
            }
            onClick={() => toggleChannel('E-mail')}
            className={cn(
              selectedChannels.includes('E-mail') &&
                'bg-[#12284c] text-white hover:bg-[#12284c]/90',
            )}
          >
            <Mail className="mr-2 h-4 w-4" />
            E-mail
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/80">
        <CardHeader className="border-b bg-white pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Fluxo guiado
              </div>
              <CardTitle className="text-xl text-primary">
                Criador Milan de mensagens premium
              </CardTitle>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Escolha objetivo e canal no mesmo lugar. Depois preencha só os
                detalhes úteis para gerar um WhatsApp ou e-mail editável.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={generateFromWizard}
                size="lg"
                disabled={selectedChannels.length === 0}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Gerar rascunhos editáveis
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-5 p-4 lg:p-5">
              <div className="grid gap-2 md:grid-cols-4">
                {[
                  ['1', 'Objetivo'],
                  ['2', 'Canal'],
                  ['3', 'Detalhes'],
                  ['4', 'Gerar'],
                ].map(([step, label]) => (
                  <div
                    key={step}
                    className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                      {step}
                    </span>
                    <span className="font-medium text-foreground">{label}</span>
                  </div>
                ))}
              </div>

              <section className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileText className="h-4 w-4 text-primary" />
                  1. Escolha o objetivo e o canal
                </div>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {goals.map((goal) => {
                    const isEditing = editingGoalId === goal.id
                    const isSelected = wizard.goal === goal.id

                    return (
                      <div
                        key={goal.id}
                        className={cn(
                          'rounded-md border p-3 transition-colors',
                          isSelected &&
                            !isEditing &&
                            'border-primary bg-primary/5',
                          isEditing &&
                            'border-primary bg-white shadow-sm ring-1 ring-primary/20 xl:col-span-2',
                        )}
                      >
                        {isEditing ? (
                          <div className="space-y-3 animate-in fade-in zoom-in-95">
                            <div>
                              <Label className="text-xs">
                                Título do Objetivo
                              </Label>
                              <Input
                                value={editGoalForm.title}
                                onChange={(e) =>
                                  setEditGoalForm({
                                    ...editGoalForm,
                                    title: e.target.value,
                                  })
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Descrição Curta</Label>
                              <Input
                                value={editGoalForm.description}
                                onChange={(e) =>
                                  setEditGoalForm({
                                    ...editGoalForm,
                                    description: e.target.value,
                                  })
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">
                                Assunto do E-mail
                              </Label>
                              <Input
                                value={editGoalForm.subject}
                                onChange={(e) =>
                                  setEditGoalForm({
                                    ...editGoalForm,
                                    subject: e.target.value,
                                  })
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Texto Base</Label>
                              <Textarea
                                value={editGoalForm.base_text}
                                onChange={(e) =>
                                  setEditGoalForm({
                                    ...editGoalForm,
                                    base_text: e.target.value,
                                  })
                                }
                                className="min-h-[100px] text-sm resize-y"
                              />
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => saveGoal(goal.id)}
                              >
                                Salvar Objetivo
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingGoalId(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer h-full flex flex-col"
                            onClick={() =>
                              updateWizard({
                                goal: goal.id,
                                headline: goal.title,
                              })
                            }
                          >
                            <div className="flex items-start justify-between">
                              <div className="font-semibold">{goal.title}</div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 -mr-1 -mt-1 text-muted-foreground hover:text-primary"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startEditingGoal(goal)
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground flex-1">
                              {goal.description}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {editingGoalId?.startsWith('new-') ? (
                    <div className="rounded-md border p-3 border-primary bg-white shadow-sm ring-1 ring-primary/20 xl:col-span-2">
                      <div className="space-y-3 animate-in fade-in zoom-in-95">
                        <div>
                          <Label className="text-xs">Título do Objetivo</Label>
                          <Input
                            value={editGoalForm.title}
                            onChange={(e) =>
                              setEditGoalForm({
                                ...editGoalForm,
                                title: e.target.value,
                              })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Descrição Curta</Label>
                          <Input
                            value={editGoalForm.description}
                            onChange={(e) =>
                              setEditGoalForm({
                                ...editGoalForm,
                                description: e.target.value,
                              })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Assunto do E-mail</Label>
                          <Input
                            value={editGoalForm.subject}
                            onChange={(e) =>
                              setEditGoalForm({
                                ...editGoalForm,
                                subject: e.target.value,
                              })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Texto Base</Label>
                          <Textarea
                            value={editGoalForm.base_text}
                            onChange={(e) =>
                              setEditGoalForm({
                                ...editGoalForm,
                                base_text: e.target.value,
                              })
                            }
                            className="min-h-[100px] text-sm resize-y"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => saveGoal(editingGoalId)}
                          >
                            Salvar Novo Objetivo
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingGoalId(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="h-auto min-h-[100px] border-dashed text-muted-foreground hover:text-primary flex flex-col items-center justify-center gap-2"
                      onClick={createNewGoal}
                    >
                      <Plus className="h-6 w-6" />
                      Adicionar Novo Objetivo
                    </Button>
                  )}
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-semibold">
                    <Gavel className="h-4 w-4 text-primary" />
                    2. Leilão real
                  </Label>
                  <Select
                    value={wizard.auctionId || 'manual'}
                    onValueChange={(value) => {
                      if (value === 'manual') {
                        updateWizard({ auctionId: '' })
                        return
                      }
                      selectAuction(value)
                    }}
                    disabled={auctionsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          auctionsLoading
                            ? 'Carregando leilões...'
                            : 'Escolha um leilão'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">
                        Preencher manualmente
                      </SelectItem>
                      {auctions.slice(0, 50).map((auction) => (
                        <SelectItem key={auction.id} value={String(auction.id)}>
                          {auction.title || auction.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="grid gap-2 md:grid-cols-[1fr_140px]">
                    <Input
                      value={wizard.auctionName}
                      onChange={(event) =>
                        updateWizard({ auctionName: event.target.value })
                      }
                      placeholder="Nome do leilão"
                    />
                    <Input
                      value={wizard.auctionDate}
                      onChange={(event) =>
                        updateWizard({ auctionDate: event.target.value })
                      }
                      placeholder="Data"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-semibold">
                    <UsersRound className="h-4 w-4 text-primary" />
                    Público e tom
                  </Label>
                  <div className="grid gap-2 md:grid-cols-2">
                    <Select
                      value={wizard.audience}
                      onValueChange={(value) =>
                        updateWizard({ audience: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Radar VIP">Radar VIP</SelectItem>
                        <SelectItem value="VIP ativo">VIP ativo</SelectItem>
                        <SelectItem value="Underbidders">
                          Underbidders
                        </SelectItem>
                        <SelectItem value="Compradores quentes">
                          Compradores quentes
                        </SelectItem>
                        <SelectItem value="Bidders fantasma">
                          Bidders fantasma
                        </SelectItem>
                        <SelectItem value="Compradores">Compradores</SelectItem>
                        <SelectItem value="Inativos valiosos">
                          Inativos valiosos
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={wizard.tone}
                      onValueChange={(value) =>
                        updateWizard({ tone: value as StudioToneId })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONE_PRESETS.map((tone) => (
                          <SelectItem key={tone.id} value={tone.id}>
                            {tone.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedTone?.description || ''}
                  </p>
                </div>
              </section>

              {selectedChannels.includes('E-mail') && (
                <section className="grid gap-4 lg:grid-cols-2 border-t pt-5">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-semibold">
                      <Paintbrush className="h-4 w-4 text-primary" />
                      Personalização E-mail
                    </Label>
                    <div className="grid gap-2 md:grid-cols-3">
                      {VISUAL_PRESETS.map((visual) => (
                        <button
                          key={visual.id}
                          type="button"
                          className={cn(
                            'rounded-md border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5',
                            wizard.visual === visual.id &&
                              'border-primary bg-primary/5',
                          )}
                          onClick={() => updateWizard({ visual: visual.id })}
                        >
                          <div className="text-sm font-medium">
                            {visual.title}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {visual.description}
                          </div>
                        </button>
                      ))}
                    </div>
                    <Input
                      value={wizard.bannerUrl}
                      onChange={(event) =>
                        updateWizard({ bannerUrl: event.target.value })
                      }
                      placeholder="URL pública do banner ou foto"
                    />
                    <Button type="button" variant="outline" asChild>
                      <label className="cursor-pointer">
                        {uploadingAsset ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        Fazer upload do banner
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

                  <div className="space-y-2">
                    <Label className="font-semibold">Texto de destaque</Label>
                    <Input
                      value={wizard.headline}
                      onChange={(event) =>
                        updateWizard({ headline: event.target.value })
                      }
                      placeholder="Título principal do e-mail"
                    />
                    <div className="grid gap-2 md:grid-cols-2">
                      <Input
                        value={wizard.lot}
                        onChange={(event) =>
                          updateWizard({ lot: event.target.value })
                        }
                        placeholder="Lote destacado"
                      />
                      <Input
                        value={wizard.valueRange}
                        onChange={(event) =>
                          updateWizard({ valueRange: event.target.value })
                        }
                        placeholder="Faixa de valor"
                      />
                    </div>
                    <div className="grid gap-2 md:grid-cols-[0.7fr_1fr]">
                      <Input
                        value={wizard.ctaLabel}
                        onChange={(event) =>
                          updateWizard({ ctaLabel: event.target.value })
                        }
                        placeholder="Texto do botão"
                      />
                      <Input
                        value={wizard.ctaUrl}
                        onChange={(event) =>
                          updateWizard({ ctaUrl: event.target.value })
                        }
                        placeholder="Link do botão"
                      />
                    </div>
                  </div>
                </section>
              )}

              {selectedChannels.includes('WhatsApp') && (
                <section className="grid gap-4 lg:grid-cols-2 border-t pt-5">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-semibold">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      Personalização WhatsApp
                    </Label>
                    <Input
                      value={wizard.lot}
                      onChange={(event) =>
                        updateWizard({ lot: event.target.value })
                      }
                      placeholder="Lote ou gancho da conversa"
                    />
                    <Input
                      value={wizard.valueRange}
                      onChange={(event) =>
                        updateWizard({ valueRange: event.target.value })
                      }
                      placeholder="Faixa de valor ou interesse"
                    />
                    <p className="text-xs text-muted-foreground">
                      O texto final fica curto, consultivo e pronto para teste
                      pelo BotConversa.
                    </p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
                    <div className="mb-2 font-semibold text-foreground">
                      Como vai sair
                    </div>
                    A mensagem usa o nome do cliente automaticamente na campanha
                    real. Aqui você só escolhe o objetivo, leilão e gancho da
                    conversa.
                  </div>
                </section>
              )}
            </div>

            <aside className="space-y-4 border-t bg-muted/10 p-4 lg:p-5 xl:border-l xl:border-t-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Eye className="h-4 w-4 text-primary" />
                    Preview em tempo real
                  </div>
                  <Badge variant="secondary" className="border-0">
                    {readyCount}/3 pronto
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                {selectedChannels.includes('E-mail') && (
                  <div className="overflow-hidden rounded-md border bg-white shadow-sm">
                    {wizard.bannerUrl ? (
                      <img
                        src={wizard.bannerUrl}
                        alt={wizard.bannerAlt || 'Banner Milan Horses'}
                        className="aspect-[16/7] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[16/7] items-center justify-center bg-[#f6f3ee] text-center">
                        <div>
                          <Image className="mx-auto h-6 w-6 text-primary/60" />
                          <div className="mt-2 text-xs font-medium text-muted-foreground">
                            Banner ou foto do leilão
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="space-y-3 p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a7a3f]">
                        {selectedGoal?.title}
                      </div>
                      <div className="font-display text-xl leading-tight text-primary">
                        {wizard.headline || 'Curadoria privada Milan Horses'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {wizard.auctionName || 'Leilão selecionado'}
                        {wizard.auctionDate ? ` · ${wizard.auctionDate}` : ''}
                      </div>
                      <div className="rounded-md bg-muted/20 px-2 py-1 text-xs text-muted-foreground">
                        Assunto: {wizardPreviewSubject}
                      </div>
                      <div className="border-t pt-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                        Olá, {previewContext.nome}.{' '}
                        {paragraphForGoal(wizard.goal, goals, wizard)
                          .replace(/<[^>]+>/g, '')
                          .replaceAll('{{leilao}}', wizard.auctionName)
                          .replaceAll('{{data_leilao}}', wizard.auctionDate)
                          .replaceAll(
                            '{{lote}}',
                            wizard.lot || previewContext.lote,
                          )
                          .replaceAll(
                            '{{valor}}',
                            wizard.valueRange || previewContext.valor,
                          )}
                      </div>
                      {wizard.lot || wizard.valueRange ? (
                        <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
                          {wizard.lot ? <div>Lote: {wizard.lot}</div> : null}
                          {wizard.valueRange ? (
                            <div>Faixa: {wizard.valueRange}</div>
                          ) : null}
                        </div>
                      ) : null}
                      <Button size="sm" className="w-full">
                        {wizard.ctaLabel || 'Ver curadoria'}
                      </Button>
                    </div>
                  </div>
                )}

                {selectedChannels.includes('WhatsApp') && (
                  <div className="rounded-md border bg-[#eef8f0] p-4 shadow-sm">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Preview WhatsApp
                    </div>
                    <div className="ml-auto max-w-[92%] rounded-2xl rounded-tr-sm bg-white p-4 text-sm leading-relaxed text-foreground shadow-sm whitespace-pre-wrap">
                      {wizardPreviewMessage}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 rounded-md border bg-white p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <UserRound className="h-4 w-4 text-primary" />
                  Teste com exemplo de cliente
                </div>
                <Input
                  value={previewContext.nome}
                  onChange={(event) =>
                    updatePreviewContext({ nome: event.target.value })
                  }
                  placeholder="Nome do cliente"
                />
                <details className="rounded-md border bg-muted/10 p-3 text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-medium text-foreground">
                    Personalização avançada
                  </summary>
                  <div className="mt-3 space-y-2">
                    <Input
                      value={previewContext.segmento}
                      onChange={(event) =>
                        updatePreviewContext({ segmento: event.target.value })
                      }
                      placeholder="Segmento"
                    />
                    <Input
                      value={previewContext.cidade}
                      onChange={(event) =>
                        updatePreviewContext({ cidade: event.target.value })
                      }
                      placeholder="Cidade"
                    />
                    <Input
                      value={previewContext.ticket_medio}
                      onChange={(event) =>
                        updatePreviewContext({
                          ticket_medio: event.target.value,
                        })
                      }
                      placeholder="Histórico ou ticket"
                    />
                    <p>
                      Na campanha real, o CRM preenche esses dados
                      automaticamente quando existirem no contato.
                    </p>
                  </div>
                </details>
              </div>

              <div className="space-y-2 rounded-md border bg-white p-3">
                <div className="text-sm font-medium">Prontidão</div>
                <div className="space-y-2">
                  {readyItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <Check
                        className={cn(
                          'h-3.5 w-3.5',
                          item.done ? 'text-emerald-700' : 'text-muted',
                        )}
                      />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={generateFromWizard}
                className="w-full"
                size="lg"
                disabled={selectedChannels.length === 0}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Gerar rascunhos editáveis
              </Button>
              <div className="text-center text-xs text-muted-foreground">
                Depois de gerar, você pode editar detalhes, enviar teste, salvar
                e transformar em campanha.
              </div>
            </aside>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/80">
        <CardHeader className="border-b bg-[#fbfaf7]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-900">
                <Crown className="h-3.5 w-3.5" />
                Layouts premium
              </div>
              <CardTitle className="text-xl text-primary">
                Templates nativos de e-mail
              </CardTitle>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Escolha uma peça pronta, adicione o banner do leilão e gere um
                e-mail sofisticado para editar, testar e salvar.
              </p>
            </div>
            <Button onClick={applySelectedPremiumLayout} size="lg">
              <Sparkles className="mr-2 h-4 w-4" />
              Usar template selecionado
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="border-b p-4 lg:border-b-0 lg:border-r lg:p-5">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {PREMIUM_EMAIL_LAYOUTS.map((layout) => (
                  <button
                    key={layout.id}
                    type="button"
                    className={cn(
                      'rounded-md border bg-white p-4 text-left transition-colors hover:border-primary hover:bg-primary/5',
                      selectedPremiumLayoutId === layout.id &&
                        'border-primary bg-primary/5 shadow-sm',
                    )}
                    onClick={() => selectPremiumLayout(layout)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Mail className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="shrink-0 bg-white">
                        {layout.badge}
                      </Badge>
                    </div>
                    <div className="mt-4 font-semibold text-foreground">
                      {layout.title}
                    </div>
                    <p className="mt-1 min-h-[40px] text-sm text-muted-foreground">
                      {layout.description}
                    </p>
                    <div className="mt-3 text-xs font-medium text-primary">
                      {layout.bestFor}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <aside className="space-y-4 bg-white p-4 lg:p-5">
              <div>
                <div className="text-sm font-semibold text-primary">
                  {selectedPremiumLayout.title}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedPremiumLayout.description}
                </p>
              </div>

              <div className="space-y-3 rounded-md border bg-muted/10 p-3">
                <Label className="flex items-center gap-2 font-semibold">
                  <Image className="h-4 w-4 text-primary" />
                  Banner principal do e-mail
                </Label>
                <div className="overflow-hidden rounded-md border bg-white">
                  {wizard.bannerUrl ? (
                    <img
                      src={wizard.bannerUrl}
                      alt={wizard.bannerAlt || 'Banner Milan Horses'}
                      className="aspect-[16/7] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[16/7] items-center justify-center bg-[#f6f3ee] text-center">
                      <div>
                        <Image className="mx-auto h-7 w-7 text-primary/60" />
                        <div className="mt-2 text-xs font-medium text-muted-foreground">
                          Adicione uma foto do lote, banner do leilão ou imagem
                          editorial.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input
                    value={wizard.bannerUrl}
                    onChange={(event) => {
                      setAssetUrl(event.target.value)
                      updateWizard({ bannerUrl: event.target.value })
                    }}
                    placeholder="Cole a URL pública do banner"
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
                <Input
                  value={wizard.bannerAlt}
                  onChange={(event) => {
                    setAssetAlt(event.target.value)
                    updateWizard({ bannerAlt: event.target.value })
                  }}
                  placeholder="Descrição do banner"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Título e botão</Label>
                <Input
                  value={wizard.headline}
                  onChange={(event) =>
                    updateWizard({ headline: event.target.value })
                  }
                  placeholder={selectedPremiumLayout.headline}
                />
                <div className="grid gap-2 sm:grid-cols-[0.8fr_1fr]">
                  <Input
                    value={wizard.ctaLabel}
                    onChange={(event) =>
                      updateWizard({ ctaLabel: event.target.value })
                    }
                    placeholder={selectedPremiumLayout.ctaLabel}
                  />
                  <Input
                    value={wizard.ctaUrl}
                    onChange={(event) =>
                      updateWizard({ ctaUrl: event.target.value })
                    }
                    placeholder="Link do botão"
                  />
                </div>
              </div>

              <div className="rounded-md border bg-[#fbfaf7] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a7a3f]">
                  Preview do layout
                </div>
                <div className="mt-2 font-display text-lg leading-tight text-primary">
                  {wizard.headline || selectedPremiumLayout.headline}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Assunto: {selectedPremiumLayout.subject}
                </p>
                <Button
                  type="button"
                  className="mt-4 w-full"
                  onClick={applySelectedPremiumLayout}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Gerar no editor
                </Button>
              </div>
            </aside>
          </div>
        </CardContent>
      </Card>

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
            <CardTitle>Modelos salvos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Objetivos e canais ficam no criador acima. Aqui aparecem só as
              mensagens já salvas para reutilizar em campanhas.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar modelo salvo..."
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
                  Nenhum modelo salvo encontrado.
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
            <CardTitle className="flex items-center gap-2">
              {channelIcon}
              {draft.type === 'E-mail'
                ? 'Editor de e-mail premium'
                : 'Editor de WhatsApp'}
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
                  onValueChange={(value) => {
                    setSelectedChannels([value as TemplateType])
                    updateDraft({
                      type: value as TemplateType,
                      subject:
                        value === 'E-mail'
                          ? draft.subject ||
                            'Curadoria Milan Horses: {{leilao}}'
                          : '',
                    })
                  }}
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
                  {messageLengthHint(draft.type, draft.body)}
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
              <div className="text-sm font-medium">
                Exemplo de personalização
              </div>
              <div className="rounded-md border p-3 text-sm">
                <div className="font-semibold">{SAMPLE_CONTEXT.nome}</div>
                <div className="text-muted-foreground">
                  Na campanha real, o CRM troca os campos entre chaves pelos
                  dados de cada contato.
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
                  {previewBody ||
                    'Gere uma mensagem acima ou escreva o texto aqui.'}
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
                    __html:
                      previewBody ||
                      'Gere uma mensagem acima ou escreva o texto aqui.',
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
