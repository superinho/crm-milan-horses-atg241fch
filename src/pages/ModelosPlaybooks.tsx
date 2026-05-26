import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  Image as ImageIcon,
  Library,
  Loader2,
  Minus,
  Monitor,
  MousePointerClick,
  PenLine,
  Plus,
  Rocket,
  Save,
  Send,
  Settings2,
  Smartphone,
  Trash2,
  Upload,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  templatesService,
  type MessageTemplate,
  type TemplateCategory,
  type TemplateInsert,
  type TemplateType,
} from '@/services/templates'

type BlockType = 'text' | 'button' | 'image' | 'divider' | 'signature'
type SideTab = 'properties' | 'preview'
type PreviewMode = 'desktop' | 'mobile'
type BlockVariant =
  | 'luxuryHero'
  | 'luxuryIntro'
  | 'luxuryPanel'
  | 'luxuryQuote'
  | 'luxuryMeta'
  | 'luxuryFooter'
  | 'luxuryImage'
type LuxuryTheme = 'navy' | 'ivory' | 'teal' | 'charcoal' | 'burgundy'

type MessageBlock = {
  id: string
  type: BlockType
  content?: string
  label?: string
  href?: string
  src?: string
  alt?: string
  align?: 'left' | 'center' | 'right'
  widthPercent?: ImageWidthPercent
  variant?: BlockVariant
  theme?: LuxuryTheme
  eyebrow?: string
  heading?: string
  caption?: string
}

type ImageWidthPercent = 33 | 50 | 75 | 100

type EditorState = {
  id?: string
  title: string
  type: TemplateType
  category: TemplateCategory
  subject: string
}

type SuperEmailTemplate = {
  id: string
  title: string
  occasion: string
  category: TemplateCategory
  subject: string
  blocks: () => MessageBlock[]
}

const CATEGORY_OPTIONS: TemplateCategory[] = [
  'Convite VIP',
  'Novo Leilão',
  'Radar VIP',
  'Informações de Lote',
  'Underbidder',
  'Reativação de Cliente',
  'Pós-leilão',
  'Follow-up',
  'Boas-vindas',
  'Agradecimento Pós-Compra',
  'Aniversário',
]

const IMAGE_WIDTH_OPTIONS: ImageWidthPercent[] = [100, 75, 50, 33]

const imageWidthPercent = (block: MessageBlock) => block.widthPercent || 100

const normalizeImageWidthPercent = (
  value?: string | number | null,
): ImageWidthPercent => {
  const numeric = Number(String(value || '').replace('%', ''))
  if (numeric <= 40) return 33
  if (numeric <= 62) return 50
  if (numeric <= 87) return 75
  return 100
}

const SAMPLE = {
  nome: 'Mariana',
  leilao: 'Leilão Milan Elite',
  lote: 'Lote 12',
  valor: 'R$ 80 mil',
  curador: 'Equipe Milan',
}

const blockTools: Array<{
  type: BlockType
  label: string
  icon: typeof AlignLeft
  emailOnly?: boolean
}> = [
  { type: 'text', label: 'Texto', icon: AlignLeft },
  { type: 'button', label: 'Botão', icon: MousePointerClick },
  { type: 'image', label: 'Imagem', icon: ImageIcon, emailOnly: true },
  { type: 'divider', label: 'Divisor', icon: Minus, emailOnly: true },
  { type: 'signature', label: 'Assinatura', icon: PenLine },
]

const uid = () => Math.random().toString(36).slice(2, 10)

const safeImageName = (name: string) =>
  name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const imageExtension = (file: File) => {
  const fromName = file.name.split('.').pop()
  if (fromName) return fromName.toLowerCase()
  if (file.type.includes('png')) return 'png'
  if (file.type.includes('webp')) return 'webp'
  if (file.type.includes('gif')) return 'gif'
  return 'jpg'
}

const createBlock = (type: BlockType): MessageBlock => {
  const id = uid()

  if (type === 'button') {
    return {
      id,
      type,
      label: 'Falar com consultor',
      href: '',
      align: 'center',
    }
  }

  if (type === 'image') {
    return {
      id,
      type,
      src: '',
      alt: 'Imagem do leilão',
      align: 'center',
    }
  }

  if (type === 'divider') {
    return { id, type }
  }

  if (type === 'signature') {
    return {
      id,
      type,
      content: '{{curador}}',
    }
  }

  return {
    id,
    type,
    content:
      'Olá, {{nome}}.\n\nSeparei uma oportunidade que pode fazer sentido para você no {{leilao}}.',
  }
}

const defaultBlocks = (): MessageBlock[] => [
  createBlock('text'),
  createBlock('button'),
  createBlock('signature'),
]

const textBlock = (
  content: string,
  options: Partial<MessageBlock> = {},
): MessageBlock => ({
  id: uid(),
  type: 'text',
  content,
  ...options,
})

const buttonBlock = (
  label: string,
  href = '',
  options: Partial<MessageBlock> = {},
): MessageBlock => ({
  id: uid(),
  type: 'button',
  label,
  href,
  align: 'center',
  variant: 'luxuryPanel',
  ...options,
})

const imageBlock = (
  alt: string,
  options: Partial<MessageBlock> = {},
): MessageBlock => ({
  id: uid(),
  type: 'image',
  src: '',
  alt,
  align: 'center',
  widthPercent: 100,
  variant: 'luxuryImage',
  ...options,
})

const dividerBlock = (options: Partial<MessageBlock> = {}): MessageBlock => ({
  id: uid(),
  type: 'divider',
  ...options,
})

const signatureBlock = (
  content = '{{curador}}',
  options: Partial<MessageBlock> = {},
): MessageBlock => ({
  id: uid(),
  type: 'signature',
  content,
  variant: 'luxuryFooter',
  ...options,
})

const SUPER_EMAIL_TEMPLATES: SuperEmailTemplate[] = [
  {
    id: 'vip-auction',
    title: 'Super Convite VIP',
    occasion: 'Convite para leilão',
    category: 'Convite VIP',
    subject: '{{nome}}, preview privado | {{leilao}}',
    blocks: () => [
      textBlock(
        'Uma seleção reservada para compradores que valorizam curadoria, timing e execução discreta.',
        {
          variant: 'luxuryHero',
          theme: 'navy',
          eyebrow: 'Private Client Preview',
          heading: '{{leilao}}',
        },
      ),
      imageBlock('Imagem editorial do leilão', {
        caption:
          'Substitua por uma imagem horizontal do evento, lote ou seleção.',
      }),
      textBlock(
        'Olá, {{nome}}.\n\nVocê está na lista curta para receber a prévia privada do {{leilao}}. A ideia não é enviar um catálogo inteiro, mas uma seleção com leitura comercial clara: o que merece atenção, por que agora e qual seria o próximo passo.',
        {
          variant: 'luxuryIntro',
          eyebrow: 'Convite Milan',
          heading: 'Uma entrada mais seletiva no leilão',
        },
      ),
      dividerBlock(),
      textBlock(
        'Prioridade da curadoria\n\n- Lotes com tese comercial objetiva\n- Oportunidades com boa relação entre qualidade e liquidez\n- Acompanhamento antes, durante e depois do lance\n- Próxima ação simples, sem ruído',
        {
          variant: 'luxuryPanel',
          theme: 'ivory',
          heading: 'O que olhar primeiro',
        },
      ),
      buttonBlock('Acessar seleção VIP', '', { theme: 'navy' }),
      signatureBlock('Até breve,\n{{curador}}'),
    ],
  },
  {
    id: 'lot-curation',
    title: 'Super Curadoria de Lote',
    occasion: 'Apresentar oportunidade',
    category: 'Informações de Lote',
    subject: 'Curadoria Milan | {{lote}}',
    blocks: () => [
      textBlock('Uma análise curta, visual e decisiva para avaliar {{lote}}.', {
        variant: 'luxuryHero',
        theme: 'teal',
        eyebrow: 'Milan Object Note',
        heading: '{{lote}}',
      }),
      imageBlock('Imagem do lote ou oportunidade', {
        caption: 'Use uma imagem limpa do lote, sem texto por cima.',
      }),
      textBlock(
        'Olá, {{nome}}.\n\nPreparei esta nota porque {{lote}} merece uma leitura de valor, não apenas uma descrição. O ponto principal é entender se a oportunidade combina com objetivo, preço e momento de compra.',
        {
          variant: 'luxuryIntro',
          eyebrow: 'Curadoria',
          heading: 'Leitura antes da decisão',
        },
      ),
      textBlock(
        'Faixa de referência: {{valor}}\nAderência ao perfil: alta se a busca for qualidade com disciplina comercial\nPonto de atenção: confirmar dados do lote, vendedor, histórico e documentação antes de avançar',
        {
          variant: 'luxuryMeta',
          theme: 'ivory',
          heading: 'Resumo executivo',
        },
      ),
      dividerBlock(),
      textBlock(
        'Se fizer sentido, eu te envio uma análise mais completa com pontos fortes, riscos, comparáveis e recomendação objetiva.',
        {
          variant: 'luxuryQuote',
          theme: 'teal',
        },
      ),
      buttonBlock('Receber análise completa'),
      signatureBlock(),
    ],
  },
  {
    id: 'underbidder',
    title: 'Super Underbidder',
    occasion: 'Quem quase comprou',
    category: 'Underbidder',
    subject: '{{nome}}, próximo passo sobre {{lote}}',
    blocks: () => [
      textBlock(
        'Uma resposta privada para transformar quase-compra em próximo passo inteligente.',
        {
          variant: 'luxuryHero',
          theme: 'charcoal',
          eyebrow: 'Private Advisory',
          heading: '{{lote}}',
        },
      ),
      textBlock(
        'Olá, {{nome}}.\n\nVi que você ficou muito perto em {{lote}}. Quando isso acontece, o melhor próximo passo não é insistir automaticamente. É decidir com clareza entre acompanhar negociação, buscar alternativa equivalente ou esperar a próxima janela certa.',
        {
          variant: 'luxuryIntro',
          heading: 'Uma recomendação depois do lance',
        },
      ),
      dividerBlock(),
      textBlock(
        'Caminhos possíveis\n\n- Revisar se ainda existe margem de negociação\n- Mapear alternativa com perfil semelhante\n- Definir teto de compra para o próximo evento\n- Pausar se o valor deixou de fazer sentido',
        {
          variant: 'luxuryPanel',
          theme: 'ivory',
          heading: 'Plano em 24 horas',
        },
      ),
      buttonBlock('Revisar alternativas', '', { theme: 'charcoal' }),
      signatureBlock('Abraço,\n{{curador}}'),
    ],
  },
  {
    id: 'reactivation',
    title: 'Super Reativação',
    occasion: 'Retomar cliente inativo',
    category: 'Reativação de Cliente',
    subject: '{{nome}}, uma curadoria rápida para você',
    blocks: () => [
      textBlock('Uma retomada elegante, curta e sem pressão.', {
        variant: 'luxuryHero',
        theme: 'teal',
        eyebrow: 'Milan Concierge',
        heading: 'Curadoria privada',
      }),
      textBlock(
        'Olá, {{nome}}.\n\nFaz algum tempo que não falamos. Preferi retomar de forma simples: estou organizando uma seleção curta, com poucas oportunidades e contexto suficiente para você decidir se vale olhar agora.',
        {
          variant: 'luxuryIntro',
          heading: 'Poucas opções, melhor contexto',
        },
      ),
      textBlock(
        'A curadoria ideal para esta retomada deve ser breve, visual e objetiva: oportunidade, racional, faixa de valor e recomendação.',
        {
          variant: 'luxuryQuote',
          theme: 'teal',
        },
      ),
      buttonBlock('Receber curadoria'),
      signatureBlock(),
    ],
  },
  {
    id: 'post-auction',
    title: 'Super Pós-leilão',
    occasion: 'Relacionamento pós-evento',
    category: 'Pós-leilão',
    subject: 'Próximos passos | {{leilao}}',
    blocks: () => [
      textBlock(
        'Encerramento elegante, acompanhamento claro e continuidade comercial.',
        {
          variant: 'luxuryHero',
          theme: 'burgundy',
          eyebrow: 'After Sale Care',
          heading: '{{leilao}}',
        },
      ),
      textBlock(
        'Olá, {{nome}}.\n\nObrigado pela participação no {{leilao}}. Estou deixando abaixo um caminho simples para organizar os próximos passos e manter tudo claro.',
        {
          variant: 'luxuryIntro',
          heading: 'Próximos passos sem atrito',
        },
      ),
      dividerBlock(),
      textBlock(
        'Atendimento pós-leilão\n\n- Documentação e acompanhamento\n- Dúvidas sobre pagamento ou retirada\n- Oportunidades relacionadas ao seu interesse\n- Próximos eventos com perfil compatível',
        {
          variant: 'luxuryPanel',
          theme: 'ivory',
          heading: 'Como podemos ajudar',
        },
      ),
      buttonBlock('Abrir atendimento', '', { theme: 'burgundy' }),
      signatureBlock('Conte conosco,\n{{curador}}'),
    ],
  },
]

const initialEditor = (): EditorState => ({
  title: 'Novo modelo',
  type: 'E-mail',
  category: 'Follow-up',
  subject: 'Oportunidade Milan para {{nome}}',
})

const escapeHtml = (value = '') =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const stripHtml = (value = '') =>
  value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

const applySample = (value = '') =>
  Object.entries(SAMPLE).reduce(
    (text, [key, sample]) =>
      text.replace(new RegExp(`{{${key}}}`, 'g'), sample),
    value,
  )

const textToHtml = (content = '') =>
  content
    .split(/\n{2,}/)
    .filter(Boolean)
    .map(
      (paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`,
    )
    .join('')

const blockDataAttrs = (block: MessageBlock) =>
  [
    `data-studio-block="${block.type}"`,
    `data-id="${block.id}"`,
    block.variant ? `data-variant="${escapeHtml(block.variant)}"` : '',
    block.theme ? `data-theme="${escapeHtml(block.theme)}"` : '',
    block.eyebrow ? `data-eyebrow="${escapeHtml(block.eyebrow)}"` : '',
    block.heading ? `data-heading="${escapeHtml(block.heading)}"` : '',
    block.caption ? `data-caption="${escapeHtml(block.caption)}"` : '',
    block.type === 'image'
      ? `data-width-percent="${imageWidthPercent(block)}"`
      : '',
  ]
    .filter(Boolean)
    .join(' ')

const luxuryTheme = (theme: LuxuryTheme = 'navy') => {
  const themes: Record<
    LuxuryTheme,
    { bg: string; fg: string; muted: string; accent: string; border: string }
  > = {
    navy: {
      bg: '#071d3f',
      fg: '#ffffff',
      muted: '#d8e1f0',
      accent: '#c7a45a',
      border: '#d8c99a',
    },
    ivory: {
      bg: '#fbf7ee',
      fg: '#0f2137',
      muted: '#5e6a78',
      accent: '#b38a3b',
      border: '#e5d8bd',
    },
    teal: {
      bg: '#eaf7f6',
      fg: '#073b3a',
      muted: '#4d6765',
      accent: '#2b8c88',
      border: '#b9dfdc',
    },
    charcoal: {
      bg: '#191a1d',
      fg: '#ffffff',
      muted: '#d7d2c8',
      accent: '#bca06a',
      border: '#6f6658',
    },
    burgundy: {
      bg: '#44151f',
      fg: '#ffffff',
      muted: '#f0dfe2',
      accent: '#d8b16d',
      border: '#d8b16d',
    },
  }
  return themes[theme]
}

const luxuryParagraphs = (content = '', color = '#263447') =>
  content
    .split(/\n{2,}/)
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px 0;color:${color};font-size:15px;line-height:1.75">${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`,
    )
    .join('')

const renderBlockHtml = (block: MessageBlock) => {
  if (block.type === 'text') {
    const attrs = blockDataAttrs(block)

    if (block.variant === 'luxuryHero') {
      const theme = luxuryTheme(block.theme)
      return `<section ${attrs} style="background:${theme.bg};color:${theme.fg};padding:36px 34px;border-radius:10px;margin:0 0 22px 0"><div style="height:1px;width:72px;background:${theme.accent};margin:0 0 24px 0"></div><div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${theme.muted};font-weight:700;margin-bottom:12px">${escapeHtml(block.eyebrow || 'Private Selection')}</div><h1 style="font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.08;font-weight:400;letter-spacing:0;margin:0 0 18px 0;color:${theme.fg}">${escapeHtml(block.heading || '')}</h1><div style="max-width:520px">${luxuryParagraphs(block.content, theme.muted)}</div></section>`
    }

    if (block.variant === 'luxuryIntro') {
      return `<section ${attrs} style="padding:24px 6px 12px 6px;margin:0 0 10px 0"><div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#a27b32;font-weight:700;margin-bottom:10px">${escapeHtml(block.eyebrow || 'Editorial Note')}</div><h2 style="font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.18;font-weight:400;color:#0b2d63;margin:0 0 16px 0">${escapeHtml(block.heading || '')}</h2>${luxuryParagraphs(block.content)}</section>`
    }

    if (block.variant === 'luxuryPanel') {
      const theme = luxuryTheme(block.theme || 'ivory')
      return `<section ${attrs} style="background:${theme.bg};border:1px solid ${theme.border};padding:24px 24px 20px 24px;margin:20px 0;border-radius:8px"><h3 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.2;font-weight:400;color:${theme.fg};margin:0 0 14px 0">${escapeHtml(block.heading || '')}</h3>${luxuryParagraphs(block.content, theme.fg)}</section>`
    }

    if (block.variant === 'luxuryMeta') {
      const rows = (block.content || '')
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [label, ...rest] = line.split(':')
          const value = rest.join(':').trim()
          return `<tr><td style="padding:12px 12px 12px 0;border-top:1px solid #e5d8bd;color:#8b6b2d;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;white-space:nowrap">${escapeHtml(label.trim())}</td><td style="padding:12px 0;border-top:1px solid #e5d8bd;color:#0f2137;font-size:14px;line-height:1.55">${escapeHtml(value || label.trim())}</td></tr>`
        })
        .join('')
      return `<section ${attrs} style="background:#fbf7ee;border:1px solid #e5d8bd;border-radius:8px;padding:22px 24px;margin:18px 0"><h3 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#0b2d63;margin:0 0 10px 0">${escapeHtml(block.heading || 'Resumo')}</h3><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">${rows}</table></section>`
    }

    if (block.variant === 'luxuryQuote') {
      const theme = luxuryTheme(block.theme || 'teal')
      return `<section ${attrs} style="text-align:center;padding:28px 24px;margin:18px 0;border-top:1px solid ${theme.border};border-bottom:1px solid ${theme.border}"><div style="font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:1.45;color:${theme.fg};font-weight:400">${escapeHtml(block.content || '')}</div></section>`
    }

    return `<div ${attrs}>${textToHtml(block.content)}</div>`
  }

  if (block.type === 'button') {
    const theme = luxuryTheme(block.theme || 'navy')
    return `<p ${blockDataAttrs(block)} style="text-align:${block.align || 'center'};margin:26px 0"><a href="${escapeHtml(block.href || '#')}" style="display:inline-block;background:${theme.bg};color:${theme.fg};text-decoration:none;border-radius:4px;padding:13px 22px;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;font-weight:700">${escapeHtml(block.label || 'Abrir')}</a></p>`
  }

  if (block.type === 'image') {
    const width = imageWidthPercent(block)
    const pixelWidth = Math.round(600 * (width / 100))
    const margin =
      block.align === 'left'
        ? 'margin:0 auto 0 0;'
        : block.align === 'right'
          ? 'margin:0 0 0 auto;'
          : 'margin:0 auto;'
    const caption = block.caption
      ? `<div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#7c8796;margin-top:10px">${escapeHtml(block.caption)}</div>`
      : ''
    return block.src
      ? `<figure ${blockDataAttrs(block)} style="text-align:${block.align || 'center'};margin:18px 0 24px 0"><img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt || '')}" width="${pixelWidth}" style="display:block;width:${width}%;max-width:${width}%;height:auto;${margin}border-radius:8px;border:1px solid #dbe3ef" />${caption}</figure>`
      : `<div ${blockDataAttrs(block)} style="border:1px dashed #c8d3e1;background:#f7f3ea;border-radius:8px;padding:42px 24px;text-align:center;margin:18px 0 24px 0;color:#607089;font-size:13px;letter-spacing:0.08em;text-transform:uppercase">Imagem editorial${caption}</div>`
  }

  if (block.type === 'divider') {
    return `<hr ${blockDataAttrs(block)} style="border:0;border-top:1px solid #d8c99a;margin:28px 0" />`
  }

  return `<div ${blockDataAttrs(block)} style="border-top:1px solid #e5d8bd;margin-top:26px;padding-top:18px;color:#5e6a78;font-size:14px;line-height:1.7">${textToHtml(block.content)}</div>`
}

const blocksToHtml = (blocks: MessageBlock[]) =>
  `<div style="font-family:Inter,Arial,sans-serif;color:#0f172a;font-size:15px;line-height:1.65">${blocks
    .map(renderBlockHtml)
    .join('')}</div>`

const blocksToPlainText = (blocks: MessageBlock[]) =>
  blocks
    .map((block) => {
      if (block.type === 'text' || block.type === 'signature') {
        return block.content || ''
      }
      if (block.type === 'button') {
        return [block.label, block.href].filter(Boolean).join(': ')
      }
      if (block.type === 'image') return block.src || ''
      return ''
    })
    .filter(Boolean)
    .join('\n\n')

const extractVariables = (content: string) =>
  Array.from(new Set(content.match(/\{\{[a-zA-Z0-9_]+\}\}/g) || []))

const parseTemplateBlocks = (template: MessageTemplate): MessageBlock[] => {
  if (template.type === 'WhatsApp') {
    return [
      {
        id: uid(),
        type: 'text',
        content: template.body || '',
      },
    ]
  }

  if (typeof window === 'undefined') {
    return [{ id: uid(), type: 'text', content: stripHtml(template.body) }]
  }

  const document = new DOMParser().parseFromString(template.body, 'text/html')
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>('[data-studio-block]'),
  )

  if (!nodes.length) {
    return [{ id: uid(), type: 'text', content: stripHtml(template.body) }]
  }

  return nodes.map((node) => {
    const type = node.dataset.studioBlock as BlockType
    const block: MessageBlock = {
      id: uid(),
      type,
      variant: node.dataset.variant as BlockVariant | undefined,
      theme: node.dataset.theme as LuxuryTheme | undefined,
      eyebrow: node.dataset.eyebrow || undefined,
      heading: node.dataset.heading || undefined,
      caption: node.dataset.caption || undefined,
    }

    if (type === 'button') {
      const link = node.querySelector('a')
      return {
        ...block,
        label: link?.textContent?.trim() || 'Abrir',
        href: link?.getAttribute('href') || '',
        align:
          node.style.textAlign === 'left'
            ? 'left'
            : node.style.textAlign === 'right'
              ? 'right'
              : 'center',
      }
    }

    if (type === 'image') {
      const image = node.querySelector('img')
      const styleWidth = image?.style.width || image?.style.maxWidth
      return {
        ...block,
        src: image?.getAttribute('src') || '',
        alt: image?.getAttribute('alt') || '',
        align:
          node.style.textAlign === 'left'
            ? 'left'
            : node.style.textAlign === 'right'
              ? 'right'
              : 'center',
        widthPercent: normalizeImageWidthPercent(
          node.dataset.widthPercent || styleWidth,
        ),
      }
    }

    if (type === 'divider') return block

    return {
      ...block,
      content: stripHtml(node.innerHTML),
    }
  })
}

function CanvasTextPreview({ block }: { block: MessageBlock }) {
  if (block.variant === 'luxuryHero') {
    const theme = block.theme || 'navy'
    return (
      <div
        className={cn(
          'rounded-lg p-6 pr-24',
          theme === 'teal'
            ? 'bg-[#eaf7f6] text-[#073b3a]'
            : theme === 'charcoal'
              ? 'bg-[#191a1d] text-white'
              : theme === 'burgundy'
                ? 'bg-[#44151f] text-white'
                : 'bg-primary text-primary-foreground',
        )}
      >
        <div className="mb-4 h-px w-16 bg-[#c7a45a]" />
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">
          {block.eyebrow || 'Private Selection'}
        </div>
        <div className="mt-3 font-display text-3xl font-normal leading-tight">
          {block.heading}
        </div>
        <div className="mt-4 max-w-lg whitespace-pre-line text-sm leading-7 opacity-85">
          {block.content}
        </div>
      </div>
    )
  }

  if (block.variant === 'luxuryIntro') {
    return (
      <div className="pr-24">
        {block.eyebrow ? (
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a7a3f]">
            {block.eyebrow}
          </div>
        ) : null}
        <div className="mt-2 font-display text-2xl font-normal leading-tight text-primary">
          {block.heading}
        </div>
        <div className="mt-4 whitespace-pre-line text-sm leading-7 text-foreground">
          {block.content}
        </div>
      </div>
    )
  }

  if (block.variant === 'luxuryPanel' || block.variant === 'luxuryMeta') {
    return (
      <div className="rounded-lg border border-[#e5d8bd] bg-[#fbf7ee] p-5 pr-24">
        <div className="font-display text-xl font-normal text-primary">
          {block.heading}
        </div>
        <div className="mt-3 whitespace-pre-line text-sm leading-7 text-foreground">
          {block.content}
        </div>
      </div>
    )
  }

  if (block.variant === 'luxuryQuote') {
    return (
      <div className="border-y border-[#b9dfdc] px-6 py-6 pr-24 text-center font-display text-xl font-normal leading-relaxed text-[#073b3a]">
        {block.content}
      </div>
    )
  }

  return (
    <div className="whitespace-pre-line pr-24 text-sm leading-7 text-foreground">
      {block.content || 'Texto vazio'}
    </div>
  )
}

function CanvasBlock({
  block,
  selected,
  onSelect,
  onMove,
  onDuplicate,
  onRemove,
  isFirst,
  isLast,
}: {
  block: MessageBlock
  selected: boolean
  onSelect: () => void
  onMove: (direction: -1 | 1) => void
  onDuplicate: () => void
  onRemove: () => void
  isFirst: boolean
  isLast: boolean
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onSelect()
      }}
      className={cn(
        'group relative rounded-lg border p-4 text-left transition',
        selected
          ? 'border-primary bg-primary/[0.03] ring-2 ring-primary/10'
          : 'border-transparent hover:border-border hover:bg-muted/20',
      )}
    >
      <div
        className={cn(
          'absolute right-2 top-2 gap-1',
          selected ? 'flex' : 'hidden group-hover:flex',
        )}
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 bg-background"
          disabled={isFirst}
          onClick={(event) => {
            event.stopPropagation()
            onMove(-1)
          }}
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 bg-background"
          disabled={isLast}
          onClick={(event) => {
            event.stopPropagation()
            onMove(1)
          }}
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 bg-background"
          onClick={(event) => {
            event.stopPropagation()
            onDuplicate()
          }}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 bg-background text-destructive"
          onClick={(event) => {
            event.stopPropagation()
            onRemove()
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {block.type === 'text' ? <CanvasTextPreview block={block} /> : null}

      {block.type === 'button' ? (
        <div
          className={cn(
            'pr-24',
            block.align === 'left'
              ? 'text-left'
              : block.align === 'right'
                ? 'text-right'
                : 'text-center',
          )}
        >
          <span className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            {block.label || 'Botão'}
          </span>
        </div>
      ) : null}

      {block.type === 'image' ? (
        <div
          className={cn(
            'pr-24',
            block.align === 'left'
              ? 'text-left'
              : block.align === 'right'
                ? 'text-right'
                : 'text-center',
          )}
        >
          {block.src ? (
            <>
              <img
                src={block.src}
                alt={block.alt || ''}
                className="inline-block max-h-64 max-w-full rounded-lg border object-cover"
                style={{ width: `${imageWidthPercent(block)}%` }}
              />
              {block.caption ? (
                <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {block.caption}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div
                className="inline-flex h-36 max-w-md items-center justify-center rounded-lg border border-dashed bg-[#f7f3ea] text-sm text-muted-foreground"
                style={{ width: `${imageWidthPercent(block)}%` }}
              >
                Imagem editorial
              </div>
              {block.caption ? (
                <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {block.caption}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {block.type === 'divider' ? (
        <div className="pr-24">
          <div className="h-px w-full bg-border" />
        </div>
      ) : null}

      {block.type === 'signature' ? (
        <div className="whitespace-pre-line pr-24 text-sm leading-7 text-muted-foreground">
          {block.content || 'Assinatura'}
        </div>
      ) : null}
    </div>
  )
}

function Preview({
  editor,
  blocks,
  mode,
}: {
  editor: EditorState
  blocks: MessageBlock[]
  mode: PreviewMode
}) {
  const subject = applySample(editor.subject)

  if (editor.type === 'WhatsApp') {
    return (
      <div className="rounded-lg bg-[#f3eadf] p-3">
        <div
          className={cn(
            'ml-auto rounded-lg bg-[#d9fdd3] px-3 py-2 text-sm leading-6 text-[#102015]',
            mode === 'mobile' ? 'max-w-[82%]' : 'max-w-[70%]',
          )}
        >
          <div className="whitespace-pre-line">
            {applySample(blocksToPlainText(blocks)) || 'Mensagem vazia'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'mx-auto overflow-hidden rounded-lg border bg-white',
        mode === 'mobile' ? 'max-w-[340px]' : 'max-w-full',
      )}
    >
      <div className="border-b bg-muted/40 px-4 py-3">
        <p className="text-xs text-muted-foreground">Assunto</p>
        <p className="text-sm font-semibold text-foreground">
          {subject || 'Sem assunto'}
        </p>
      </div>
      <div
        className="px-5 py-5 text-sm leading-7 text-foreground"
        dangerouslySetInnerHTML={{
          __html: applySample(blocksToHtml(blocks)),
        }}
      />
    </div>
  )
}

export default function ModelosPlaybooks() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [editor, setEditor] = useState<EditorState>(() => initialEditor())
  const [blocks, setBlocks] = useState<MessageBlock[]>(() => defaultBlocks())
  const [selectedBlockId, setSelectedBlockId] = useState(blocks[0]?.id || '')
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [testTarget, setTestTarget] = useState('')
  const [sideTab, setSideTab] = useState<SideTab>('properties')
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')
  const [showSuperModels, setShowSuperModels] = useState(false)

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) || blocks[0],
    [blocks, selectedBlockId],
  )

  const body = useMemo(
    () =>
      editor.type === 'E-mail'
        ? blocksToHtml(blocks)
        : blocksToPlainText(blocks),
    [blocks, editor.type],
  )

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true)
    try {
      const data = await templatesService.getTemplates()
      setTemplates(data)
    } catch (error: any) {
      toast({
        title: 'Não foi possível carregar os modelos',
        description: error.message || 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setLoadingTemplates(false)
    }
  }, [toast])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const updateEditor = (updates: Partial<EditorState>) =>
    setEditor((current) => ({ ...current, ...updates }))

  const updateSelectedBlock = (updates: Partial<MessageBlock>) => {
    if (!selectedBlock) return
    setBlocks((current) =>
      current.map((block) =>
        block.id === selectedBlock.id ? { ...block, ...updates } : block,
      ),
    )
  }

  const addBlock = (type: BlockType) => {
    const block = createBlock(type)
    setBlocks((current) => [...current, block])
    setSelectedBlockId(block.id)
    setSideTab('properties')
  }

  const moveBlock = (id: string, direction: -1 | 1) => {
    setBlocks((current) => {
      const index = current.findIndex((block) => block.id === id)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current
      }
      const next = [...current]
      const [block] = next.splice(index, 1)
      next.splice(nextIndex, 0, block)
      return next
    })
  }

  const duplicateBlock = (block: MessageBlock) => {
    const copyBlock = { ...block, id: uid() }
    setBlocks((current) => {
      const index = current.findIndex((item) => item.id === block.id)
      const next = [...current]
      next.splice(index + 1, 0, copyBlock)
      return next
    })
    setSelectedBlockId(copyBlock.id)
  }

  const removeBlock = (id: string) => {
    setBlocks((current) => {
      const next = current.filter((block) => block.id !== id)
      if (!next.length) {
        const fallback = createBlock('text')
        setSelectedBlockId(fallback.id)
        return [fallback]
      }
      setSelectedBlockId(next[0].id)
      return next
    })
  }

  const newTemplate = () => {
    const nextEditor = initialEditor()
    const nextBlocks = defaultBlocks()
    setEditor(nextEditor)
    setBlocks(nextBlocks)
    setSelectedBlockId(nextBlocks[0].id)
    setSideTab('properties')
    setTestTarget('')
  }

  const loadTemplate = (template: MessageTemplate) => {
    const nextBlocks = parseTemplateBlocks(template)
    setEditor({
      id: template.id,
      title: template.title,
      type: template.type,
      category: template.category,
      subject: template.subject || '',
    })
    setBlocks(nextBlocks)
    setSelectedBlockId(nextBlocks[0]?.id || '')
    setSideTab('properties')
  }

  const loadSuperTemplate = (template: SuperEmailTemplate) => {
    const nextBlocks = template.blocks()
    setEditor({
      title: template.title,
      type: 'E-mail',
      category: template.category,
      subject: template.subject,
    })
    setBlocks(nextBlocks)
    setSelectedBlockId(nextBlocks[0]?.id || '')
    setSideTab('preview')
    setPreviewMode('desktop')
  }

  const handleImageUpload = async (file?: File) => {
    if (!file || selectedBlock?.type !== 'image') return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Envie uma imagem em PNG, JPG ou WebP.',
        variant: 'destructive',
      })
      return
    }

    setUploadingImage(true)
    try {
      const filename = safeImageName(file.name) || 'imagem'
      const path = `studio/${Date.now()}-${filename}.${imageExtension(file)}`

      const { error } = await supabase.storage
        .from('email-assets')
        .upload(path, file, {
          cacheControl: '31536000',
          contentType: file.type,
          upsert: false,
        })

      if (error) throw error

      const { data } = supabase.storage.from('email-assets').getPublicUrl(path)
      updateSelectedBlock({
        src: data.publicUrl,
        alt: selectedBlock.alt || file.name,
      })
      toast({
        title: 'Imagem pronta',
        description:
          'O arquivo foi salvo como URL pública para envio por e-mail.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível salvar a imagem.',
        variant: 'destructive',
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const saveTemplate = async () => {
    if (!editor.title.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Dê um nome para o modelo antes de salvar.',
        variant: 'destructive',
      })
      return null
    }

    if (!body.trim()) {
      toast({
        title: 'Mensagem vazia',
        description: 'Adicione ao menos um bloco com conteúdo.',
        variant: 'destructive',
      })
      return null
    }

    setSaving(true)
    try {
      const payload: TemplateInsert = {
        title: editor.title,
        type: editor.type,
        category: editor.category,
        subject: editor.type === 'E-mail' ? editor.subject : null,
        body,
        variables: extractVariables(`${editor.subject} ${body}`),
      }

      const saved = editor.id
        ? await templatesService.updateTemplate(editor.id, payload)
        : await templatesService.createTemplate(payload)

      setEditor((current) => ({ ...current, id: saved.id }))
      await loadTemplates()
      toast({
        title: 'Modelo salvo',
        description: 'A biblioteca foi atualizada.',
      })
      return saved
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      })
      return null
    } finally {
      setSaving(false)
    }
  }

  const copyMessage = async () => {
    const text =
      editor.type === 'E-mail'
        ? `Assunto: ${editor.subject}\n\n${stripHtml(body)}`
        : body
    await navigator.clipboard.writeText(text)
    toast({
      title: 'Copiado',
      description: 'A mensagem foi copiada.',
    })
  }

  const sendTest = async () => {
    if (!testTarget.trim()) {
      toast({
        title: 'Informe o destino de teste',
        description:
          editor.type === 'E-mail'
            ? 'Use um e-mail válido.'
            : 'Use um WhatsApp com DDD.',
        variant: 'destructive',
      })
      return
    }

    setTesting(true)
    try {
      if (editor.type === 'WhatsApp') {
        const { error } = await supabase.functions.invoke(
          'send-whatsapp-botconversa',
          {
            body: {
              phone: testTarget,
              name: 'Teste Milan',
              message: applySample(body),
              metadata: { source: 'message-block-editor' },
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
              subject: applySample(editor.subject),
              html: applySample(body),
            },
          },
        )
        if (error) throw error
      }

      toast({
        title: 'Teste enviado',
        description: 'Confira o recebimento antes de usar em campanha.',
      })
    } catch (error: any) {
      toast({
        title: 'Falha no teste',
        description: error.message || 'Não foi possível enviar agora.',
        variant: 'destructive',
      })
    } finally {
      setTesting(false)
    }
  }

  const createCampaign = async () => {
    const saved = editor.id ? { id: editor.id } : await saveTemplate()
    if (!saved?.id) return
    navigate(`/campanhas?template=${saved.id}`)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-0 pb-8 pt-2 md:px-4">
      <header className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-primary md:text-3xl">
            Editor de Mensagens
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monte o modelo com blocos, revise no preview e salve.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={newTemplate}>
            <Plus className="h-4 w-4" />
            Novo
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={copyMessage}
            disabled={!body.trim()}
          >
            <Copy className="h-4 w-4" />
            Copiar
          </Button>
          <Button
            type="button"
            onClick={saveTemplate}
            disabled={saving || !body.trim()}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </header>

      <section className="grid min-h-[calc(100vh-190px)] gap-4 xl:grid-cols-[260px_minmax(0,1fr)_360px]">
        <aside className="rounded-lg border bg-card">
          <div className="border-b p-3">
            <h2 className="text-sm font-semibold text-foreground">Blocos</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3 xl:grid-cols-1">
            {blockTools
              .filter((tool) => editor.type === 'E-mail' || !tool.emailOnly)
              .map((tool) => {
                const Icon = tool.icon
                return (
                  <button
                    key={tool.type}
                    type="button"
                    onClick={() => addBlock(tool.type)}
                    className="flex h-11 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    {tool.label}
                  </button>
                )
              })}
          </div>

          <div className="border-t p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Library className="h-4 w-4 text-primary" />
                Modelos
              </div>
            </div>
            <div className="mb-3 flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
              <Label
                htmlFor="super-models"
                className="cursor-pointer text-xs font-medium leading-5 text-foreground"
              >
                Super modelos de e-mail
                <span className="block font-normal text-muted-foreground">
                  5 estruturas prontas
                </span>
              </Label>
              <Switch
                id="super-models"
                checked={showSuperModels}
                onCheckedChange={setShowSuperModels}
              />
            </div>
            <ScrollArea className="h-[240px] pr-2 xl:h-[330px]">
              {showSuperModels ? (
                <div className="space-y-2">
                  {SUPER_EMAIL_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => loadSuperTemplate(template)}
                      className={cn(
                        'w-full rounded-lg border bg-background p-3 text-left transition hover:border-primary/35 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        editor.title === template.title &&
                          !editor.id &&
                          'border-primary/60 bg-primary/[0.03]',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="line-clamp-2 text-sm font-semibold">
                          {template.title}
                        </span>
                        <Badge className="shrink-0 bg-primary/10 text-primary hover:bg-primary/10">
                          Super
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {template.occasion}
                      </p>
                    </button>
                  ))}
                </div>
              ) : loadingTemplates ? (
                <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando
                </div>
              ) : templates.length ? (
                <div className="space-y-2">
                  {templates.slice(0, 30).map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => loadTemplate(template)}
                      className={cn(
                        'w-full rounded-lg border bg-background p-3 text-left transition hover:border-primary/35 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        editor.id === template.id &&
                          'border-primary/60 bg-primary/[0.03]',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="line-clamp-1 text-sm font-medium">
                          {template.title}
                        </span>
                        <Badge variant="outline" className="shrink-0">
                          {template.type}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {stripHtml(template.body)}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  Nenhum modelo salvo.
                </p>
              )}
            </ScrollArea>
          </div>
        </aside>

        <main className="rounded-lg border bg-card">
          <div className="grid gap-3 border-b p-3 md:grid-cols-[minmax(0,1fr)_150px_180px]">
            <div className="space-y-1">
              <Label htmlFor="templateTitle">Nome</Label>
              <Input
                id="templateTitle"
                value={editor.title}
                onChange={(event) =>
                  updateEditor({ title: event.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Canal</Label>
              <Select
                value={editor.type}
                onValueChange={(value) => {
                  updateEditor({
                    type: value as TemplateType,
                    subject:
                      value === 'E-mail'
                        ? editor.subject || 'Oportunidade Milan para {{nome}}'
                        : '',
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="E-mail">E-mail</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select
                value={editor.category}
                onValueChange={(value) =>
                  updateEditor({ category: value as TemplateCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {editor.type === 'E-mail' ? (
            <div className="border-b p-3">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                value={editor.subject}
                onChange={(event) =>
                  updateEditor({ subject: event.target.value })
                }
                className="mt-1"
              />
            </div>
          ) : null}

          <ScrollArea className="h-[calc(100vh-350px)] min-h-[520px]">
            <div className="bg-muted/30 p-4 md:p-6">
              <div
                className={cn(
                  'mx-auto min-h-[520px] rounded-lg border bg-white p-4 shadow-sm md:p-6',
                  editor.type === 'WhatsApp'
                    ? 'max-w-[520px]'
                    : 'max-w-[720px]',
                )}
              >
                {blocks.map((block, index) => (
                  <CanvasBlock
                    key={block.id}
                    block={block}
                    selected={block.id === selectedBlock?.id}
                    onSelect={() => setSelectedBlockId(block.id)}
                    onMove={(direction) => moveBlock(block.id, direction)}
                    onDuplicate={() => duplicateBlock(block)}
                    onRemove={() => removeBlock(block.id)}
                    isFirst={index === 0}
                    isLast={index === blocks.length - 1}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => addBlock('text')}
                  className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar texto
                </button>
              </div>
            </div>
          </ScrollArea>
        </main>

        <aside className="rounded-lg border bg-card">
          <Tabs
            value={sideTab}
            onValueChange={(value) => setSideTab(value as SideTab)}
            className="h-full"
          >
            <div className="border-b p-3">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="properties">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Editar
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="properties" className="m-0">
              <ScrollArea className="h-[calc(100vh-330px)] min-h-[480px]">
                <div className="space-y-4 p-4">
                  {selectedBlock ? (
                    <>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {blockTools.find(
                            (tool) => tool.type === selectedBlock.type,
                          )?.label || 'Bloco'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Edite o bloco selecionado.
                        </p>
                      </div>

                      {selectedBlock.type === 'text' ||
                      selectedBlock.type === 'signature' ? (
                        <div className="space-y-4">
                          {selectedBlock.type === 'text' &&
                          selectedBlock.variant ? (
                            <>
                              <div className="space-y-2">
                                <Label>Eyebrow</Label>
                                <Input
                                  value={selectedBlock.eyebrow || ''}
                                  onChange={(event) =>
                                    updateSelectedBlock({
                                      eyebrow: event.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Título editorial</Label>
                                <Input
                                  value={selectedBlock.heading || ''}
                                  onChange={(event) =>
                                    updateSelectedBlock({
                                      heading: event.target.value,
                                    })
                                  }
                                />
                              </div>
                            </>
                          ) : null}
                          <div className="space-y-2">
                            <Label>Texto</Label>
                            <Textarea
                              value={selectedBlock.content || ''}
                              onChange={(event) =>
                                updateSelectedBlock({
                                  content: event.target.value,
                                })
                              }
                              className="min-h-[220px] resize-none"
                            />
                          </div>
                        </div>
                      ) : null}

                      {selectedBlock.type === 'button' ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Texto do botão</Label>
                            <Input
                              value={selectedBlock.label || ''}
                              onChange={(event) =>
                                updateSelectedBlock({
                                  label: event.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Link</Label>
                            <Input
                              value={selectedBlock.href || ''}
                              onChange={(event) =>
                                updateSelectedBlock({
                                  href: event.target.value,
                                })
                              }
                              placeholder="https://..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Alinhamento</Label>
                            <Select
                              value={selectedBlock.align || 'center'}
                              onValueChange={(value) =>
                                updateSelectedBlock({
                                  align: value as MessageBlock['align'],
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="center">Centro</SelectItem>
                                <SelectItem value="left">Esquerda</SelectItem>
                                <SelectItem value="right">Direita</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ) : null}

                      {selectedBlock.type === 'image' ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>URL da imagem</Label>
                            <Input
                              value={selectedBlock.src || ''}
                              onChange={(event) =>
                                updateSelectedBlock({ src: event.target.value })
                              }
                              placeholder="https://..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="imageUpload"
                              className="flex items-center gap-2"
                            >
                              {uploadingImage ? (
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              ) : (
                                <Upload className="h-4 w-4 text-primary" />
                              )}
                              {uploadingImage
                                ? 'Salvando imagem...'
                                : 'Upload da imagem'}
                            </Label>
                            <Input
                              id="imageUpload"
                              type="file"
                              accept="image/*"
                              className="cursor-pointer"
                              disabled={uploadingImage}
                              onChange={(event) => {
                                handleImageUpload(event.target.files?.[0])
                                event.currentTarget.value = ''
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <Label>Tamanho</Label>
                              <span className="text-xs font-medium text-muted-foreground">
                                {imageWidthPercent(selectedBlock)}%
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {IMAGE_WIDTH_OPTIONS.map((width) => (
                                <Button
                                  key={width}
                                  type="button"
                                  variant={
                                    imageWidthPercent(selectedBlock) === width
                                      ? 'default'
                                      : 'outline'
                                  }
                                  size="sm"
                                  className="h-9 px-2 text-xs"
                                  onClick={() =>
                                    updateSelectedBlock({
                                      widthPercent: width,
                                    })
                                  }
                                >
                                  {width}%
                                </Button>
                              ))}
                            </div>
                            <p className="text-xs leading-5 text-muted-foreground">
                              Use 100% para banner e 50% ou 33% para fotos
                              menores, logos e selos.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>Alinhamento</Label>
                            <Select
                              value={selectedBlock.align || 'center'}
                              onValueChange={(value) =>
                                updateSelectedBlock({
                                  align: value as MessageBlock['align'],
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="center">Centro</SelectItem>
                                <SelectItem value="left">Esquerda</SelectItem>
                                <SelectItem value="right">Direita</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Texto alternativo</Label>
                            <Input
                              value={selectedBlock.alt || ''}
                              onChange={(event) =>
                                updateSelectedBlock({ alt: event.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Legenda</Label>
                            <Input
                              value={selectedBlock.caption || ''}
                              onChange={(event) =>
                                updateSelectedBlock({
                                  caption: event.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      ) : null}

                      {selectedBlock.type === 'divider' ? (
                        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                          Divisor simples entre seções.
                        </p>
                      ) : null}

                      <div className="flex gap-2 border-t pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => duplicateBlock(selectedBlock)}
                        >
                          <Copy className="h-4 w-4" />
                          Duplicar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 text-destructive"
                          onClick={() => removeBlock(selectedBlock.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                      Selecione um bloco.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="preview" className="m-0">
              <div className="space-y-4 p-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={previewMode === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                    className="flex-1"
                  >
                    <Monitor className="h-4 w-4" />
                    Desktop
                  </Button>
                  <Button
                    type="button"
                    variant={previewMode === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                    className="flex-1"
                  >
                    <Smartphone className="h-4 w-4" />
                    Mobile
                  </Button>
                </div>

                <Preview editor={editor} blocks={blocks} mode={previewMode} />

                <div className="space-y-2 border-t pt-4">
                  <Label htmlFor="testTarget">
                    Teste ({editor.type === 'E-mail' ? 'e-mail' : 'WhatsApp'})
                  </Label>
                  <Input
                    id="testTarget"
                    value={testTarget}
                    onChange={(event) => setTestTarget(event.target.value)}
                    placeholder={
                      editor.type === 'E-mail'
                        ? 'nome@exemplo.com'
                        : '+55 11 99999-9999'
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={sendTest}
                    disabled={testing || !body.trim()}
                  >
                    {testing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Enviar teste
                  </Button>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={createCampaign}
                    disabled={!body.trim()}
                  >
                    <Rocket className="h-4 w-4" />
                    Criar campanha
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </section>
    </div>
  )
}
