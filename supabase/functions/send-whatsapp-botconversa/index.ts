import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BOTCONVERSA_WEBHOOK_URL = Deno.env.get('BOTCONVERSA_WEBHOOK_URL')
const BOTCONVERSA_API_KEY = Deno.env.get('BOTCONVERSA_API_KEY')
const BOTCONVERSA_DEFAULT_FLOW_ID = Deno.env.get('BOTCONVERSA_DEFAULT_FLOW_ID')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const normalizePhone = (value?: string | null) => {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('55')) return `+${digits}`
  return `+55${digits}`
}

const shouldUseAuthorization = () =>
  Boolean(
    BOTCONVERSA_API_KEY &&
      BOTCONVERSA_WEBHOOK_URL &&
      !BOTCONVERSA_WEBHOOK_URL.includes('/webhooks-automation/catch/'),
  )

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    if (!BOTCONVERSA_WEBHOOK_URL) {
      throw new Error('BOTCONVERSA_WEBHOOK_URL não configurada.')
    }

    let contact = body.contact || null
    if (!contact && body.contactId) {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, email, phone, whatsapp')
        .eq('id', body.contactId)
        .single()
      if (error) throw error
      contact = data
    }

    const phone = normalizePhone(body.phone || contact?.whatsapp || contact?.phone)
    const message = String(body.message || '').trim()
    if (!phone) throw new Error('Telefone/WhatsApp obrigatório.')
    if (!message) throw new Error('Mensagem obrigatória.')

    const payload = {
      phone,
      telefone: phone,
      name: contact?.name || body.name,
      nome: contact?.name || body.name,
      email: contact?.email || body.email,
      message,
      mensagem: message,
      campaign_id: body.campaignId || null,
      contact_id: contact?.id || body.contactId || null,
      flow_id: body.flowId || BOTCONVERSA_DEFAULT_FLOW_ID || undefined,
      metadata: body.metadata || {},
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (shouldUseAuthorization()) {
      headers.Authorization = `Bearer ${BOTCONVERSA_API_KEY}`
    }

    const response = await fetch(BOTCONVERSA_WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    const text = await response.text()
    const responsePayload = text
      ? (() => {
          try {
            return JSON.parse(text)
          } catch {
            return { raw: text }
          }
        })()
      : {}

    if (!response.ok) {
      throw new Error(
        responsePayload?.message ||
          responsePayload?.error ||
          `BotConversa retornou status ${response.status}`,
      )
    }

    return new Response(JSON.stringify({ ok: true, response: responsePayload }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
