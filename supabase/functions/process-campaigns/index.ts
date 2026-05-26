import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  embedRemoteImagesForResend,
  ensureEmailDocument,
  htmlToPlainText,
  replaceDataImagesWithPublicUrls,
} from '../_shared/resend-inline-images.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const RESEND_FROM_EMAIL =
  Deno.env.get('RESEND_FROM_EMAIL') ||
  'Milan Horses Leilões <nicole.vaz@milanleiloes.com.br>'
const RESEND_REPLY_TO_EMAIL = Deno.env.get('RESEND_REPLY_TO_EMAIL')
const BOTCONVERSA_WEBHOOK_URL = Deno.env.get('BOTCONVERSA_WEBHOOK_URL')
const BOTCONVERSA_API_KEY = Deno.env.get('BOTCONVERSA_API_KEY')
const BOTCONVERSA_DEFAULT_FLOW_ID = Deno.env.get('BOTCONVERSA_DEFAULT_FLOW_ID')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const base64ToBlob = (content: string, contentType: string) => {
  const binary = atob(content)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new Blob([bytes], { type: contentType })
}

type Contact = {
  id: string
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
}

type Recipient = {
  id?: string
  contact_id: string
  channel: 'email' | 'whatsapp'
  score?: number
  segment?: string
  email?: string | null
  phone?: string | null
  subject?: string | null
  message: string
  metadata?: Record<string, unknown>
  contact?: Contact
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const renderTemplate = (
  value: string,
  contact: Contact | undefined,
  campaign: any,
) =>
  String(value || '')
    .replaceAll('{{nome}}', contact?.name || '')
    .replaceAll('{{name}}', contact?.name || '')
    .replaceAll(
      '{{leilao}}',
      campaign?.metadata?.auction?.title || campaign?.name || '',
    )
    .replaceAll(
      '{{auction}}',
      campaign?.metadata?.auction?.title || campaign?.name || '',
    )

const normalizePhone = (value?: string | null) => {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('55')) return `+${digits}`
  return `+55${digits}`
}

const shouldUseBotconversaAuthorization = () =>
  Boolean(
    BOTCONVERSA_API_KEY &&
    BOTCONVERSA_WEBHOOK_URL &&
    !BOTCONVERSA_WEBHOOK_URL.includes('/webhooks-automation/catch/'),
  )

const providerIdFrom = (payload: any) =>
  payload?.id ||
  payload?.message_id ||
  payload?.data?.id ||
  payload?.data?.message_id ||
  payload?.data?.[0]?.id ||
  null

const insertEvent = async (
  outboundMessageId: string | null,
  campaignId: string,
  contactId: string | null,
  provider: string,
  eventType: string,
  payload: Record<string, unknown>,
) => {
  await supabase.from('message_events').insert({
    outbound_message_id: outboundMessageId,
    campaign_id: campaignId,
    contact_id: contactId,
    provider,
    event_type: eventType,
    payload,
  })
}

const resolveAudienceFromFilters = async (
  campaign: any,
  channel: 'email' | 'whatsapp',
  fallbackContent: string,
  fallbackSubject: string | null,
) => {
  let query = supabase
    .from('contacts')
    .select('id, email, phone, whatsapp, name')
    .limit(5000)

  if (campaign.audience_filters?.contact_ids?.length) {
    query = query.in('id', campaign.audience_filters.contact_ids)
  } else {
    const audienceIds = new Set<string>()

    if (campaign.audience_filters?.tags?.length) {
      const { data: taggedIds, error: taggedError } = await supabase
        .from('contact_tags')
        .select('contact_id, tags!inner(name)')
        .in('tags.name', campaign.audience_filters.tags)

      if (taggedError) throw taggedError
      taggedIds?.forEach((item: any) => audienceIds.add(item.contact_id))
    }

    if (campaign.audience_filters?.segments?.length) {
      const { data: segmentedIds, error: segmentError } = await supabase
        .from('customer_rfmv_view')
        .select('id')
        .in('segment', campaign.audience_filters.segments)

      if (segmentError) throw segmentError
      segmentedIds?.forEach((item: any) => audienceIds.add(item.id))
    }

    const hasFilters =
      campaign.audience_filters?.tags?.length ||
      campaign.audience_filters?.segments?.length

    if (hasFilters) {
      const ids = [...audienceIds]
      if (!ids.length) return []
      query = query.in('id', ids)
    }
  }

  const { data: contacts, error } = await query
  if (error) throw error

  return ((contacts || []) as Contact[]).map((contact) => ({
    contact_id: contact.id,
    channel,
    email: contact.email,
    phone: contact.whatsapp || contact.phone,
    subject: fallbackSubject,
    message: renderTemplate(fallbackContent, contact, campaign),
    contact,
  }))
}

const resolveRecipients = async (campaign: any, schedule: any) => {
  const channel = schedule.channel_type as 'email' | 'whatsapp'
  const { data: queuedRecipients, error } = await supabase
    .from('campaign_recipients')
    .select('*, contact:contacts(id, name, email, phone, whatsapp)')
    .eq('campaign_id', campaign.id)
    .eq('channel', channel)
    .is('opted_out_at', null)
    .in('status', ['queued', 'failed'])
    .limit(5000)

  if (error) throw error
  if (queuedRecipients?.length) return queuedRecipients as Recipient[]

  return resolveAudienceFromFilters(
    campaign,
    channel,
    schedule.content || '',
    schedule.subject || null,
  )
}

const insertOutbound = async (payload: Record<string, unknown>) => {
  const { data, error } = await supabase
    .from('outbound_messages')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

const updateRecipient = async (
  campaignRecipientId: string | undefined,
  status: string,
) => {
  if (!campaignRecipientId) return
  await supabase
    .from('campaign_recipients')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', campaignRecipientId)
}

const sendEmail = async (
  campaign: any,
  schedule: any,
  recipient: Recipient,
) => {
  const contact = recipient.contact
  const to = recipient.email || contact?.email
  if (!to) throw new Error('Contato sem e-mail válido.')
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY não configurada.')

  const subject = renderTemplate(
    recipient.subject ||
      schedule.subject ||
      `Curadoria Milan Horses: ${campaign.name}`,
    contact,
    campaign,
  )
  const html = renderTemplate(
    recipient.message || schedule.content,
    contact,
    campaign,
  )
  console.log(
    `[process-campaigns] Processing email body for images for recipient: ${to}`,
  )
  let emailHtml = ensureEmailDocument(html)
  if (emailHtml.includes('data:image/')) {
    emailHtml = await replaceDataImagesWithPublicUrls(
      emailHtml,
      async ({ content, contentType, extension, index }) => {
        const path = `studio/email-${Date.now()}-${index}-${crypto.randomUUID()}.${extension}`
        const { error } = await supabase.storage
          .from('email-assets')
          .upload(path, base64ToBlob(content, contentType), {
            cacheControl: '31536000',
            contentType,
            upsert: false,
          })

        if (error) throw error
        return supabase.storage.from('email-assets').getPublicUrl(path).data
          .publicUrl
      },
    )
  }

  const preparedEmail = embedRemoteImagesForResend(emailHtml)
  const payload: Record<string, unknown> = {
    from: RESEND_FROM_EMAIL,
    to: [to],
    subject,
    html: preparedEmail.html,
    text: htmlToPlainText(emailHtml),
    tags: [
      { name: 'campaign_id', value: campaign.id },
      { name: 'recipient_id', value: recipient.contact_id },
      { name: 'schedule_id', value: schedule.id },
    ],
  }

  if (RESEND_REPLY_TO_EMAIL) payload.reply_to = RESEND_REPLY_TO_EMAIL
  if (preparedEmail.attachments.length) {
    payload.attachments = preparedEmail.attachments
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const responsePayload = await response.json().catch(() => ({}))

  if (!response.ok) {
    console.error(
      `[process-campaigns] Resend API error (${response.status}):`,
      JSON.stringify(responsePayload, null, 2),
    )
    throw new Error(
      responsePayload?.message ||
        responsePayload?.error?.message ||
        responsePayload?.error ||
        `Resend retornou status ${response.status}`,
    )
  }

  return {
    provider: 'resend',
    to,
    subject,
    body: preparedEmail.html,
    requestPayload: payload,
    responsePayload,
    providerId: providerIdFrom(responsePayload),
  }
}

const sendWhatsApp = async (
  campaign: any,
  schedule: any,
  recipient: Recipient,
) => {
  const contact = recipient.contact
  const phone = normalizePhone(
    recipient.phone || contact?.whatsapp || contact?.phone,
  )
  if (!phone) throw new Error('Contato sem WhatsApp válido.')
  if (!BOTCONVERSA_WEBHOOK_URL) {
    throw new Error('BOTCONVERSA_WEBHOOK_URL não configurada.')
  }

  const message = renderTemplate(
    recipient.message || schedule.content,
    contact,
    campaign,
  )
  const payload = {
    phone,
    telefone: phone,
    name: contact?.name,
    nome: contact?.name,
    email: contact?.email,
    message,
    mensagem: message,
    campaign_id: campaign.id,
    contact_id: recipient.contact_id,
    flow_id: BOTCONVERSA_DEFAULT_FLOW_ID || undefined,
    metadata: {
      source: 'milan-crm-radar-vip',
      auction: campaign.metadata?.auction || null,
      segment: recipient.segment || null,
      score: recipient.score || null,
    },
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (shouldUseBotconversaAuthorization()) {
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

  return {
    provider: 'botconversa',
    to: phone,
    subject: null,
    body: message,
    requestPayload: payload,
    responsePayload,
    providerId: providerIdFrom(responsePayload),
  }
}

const processRecipient = async (
  campaign: any,
  schedule: any,
  recipient: Recipient,
) => {
  const channel = schedule.channel_type as 'email' | 'whatsapp'
  const now = new Date().toISOString()
  const { data: sendLog, error: sendLogError } = await supabase
    .from('campaign_sends')
    .insert({
      campaign_id: campaign.id,
      schedule_id: schedule.id,
      recipient_id: recipient.contact_id,
      campaign_recipient_id: recipient.id || null,
      channel,
      status: 'sending',
      subject: recipient.subject || schedule.subject || null,
      content: recipient.message || schedule.content || '',
      metadata: recipient.metadata || {},
    })
    .select()
    .single()

  if (sendLogError) throw sendLogError

  try {
    const sent =
      channel === 'email'
        ? await sendEmail(campaign, schedule, recipient)
        : await sendWhatsApp(campaign, schedule, recipient)
    const outbound = await insertOutbound({
      campaign_id: campaign.id,
      campaign_recipient_id: recipient.id || null,
      campaign_send_id: sendLog.id,
      contact_id: recipient.contact_id,
      provider: sent.provider,
      channel,
      to_address: sent.to,
      subject: sent.subject,
      body: sent.body,
      status: 'sent',
      provider_message_id: sent.providerId,
      request_payload: sent.requestPayload,
      response_payload: sent.responsePayload,
      sent_at: now,
      updated_at: now,
    })

    await supabase
      .from('campaign_sends')
      .update({
        status: 'sent',
        provider_id: sent.providerId,
        sent_at: now,
        metadata: {
          ...(recipient.metadata || {}),
          outbound_message_id: outbound.id,
          response: sent.responsePayload,
        },
      })
      .eq('id', sendLog.id)
    await updateRecipient(recipient.id, 'sent')
    await insertEvent(
      outbound.id,
      campaign.id,
      recipient.contact_id,
      sent.provider,
      'sent',
      sent.responsePayload,
    )

    return { status: 'sent', provider: sent.provider }
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido'
    const outbound = await insertOutbound({
      campaign_id: campaign.id,
      campaign_recipient_id: recipient.id || null,
      campaign_send_id: sendLog.id,
      contact_id: recipient.contact_id,
      provider: channel === 'email' ? 'resend' : 'botconversa',
      channel,
      to_address:
        channel === 'email'
          ? recipient.email || recipient.contact?.email || ''
          : normalizePhone(
              recipient.phone ||
                recipient.contact?.whatsapp ||
                recipient.contact?.phone,
            ),
      subject: recipient.subject || schedule.subject || null,
      body: recipient.message || schedule.content || '',
      status: 'failed',
      error_message: errorMessage,
      updated_at: now,
    })

    await supabase
      .from('campaign_sends')
      .update({
        status: 'failed',
        error_message: errorMessage,
        failed_at: now,
        metadata: {
          ...(recipient.metadata || {}),
          outbound_message_id: outbound.id,
        },
      })
      .eq('id', sendLog.id)
    await updateRecipient(recipient.id, 'failed')
    await insertEvent(
      outbound.id,
      campaign.id,
      recipient.contact_id,
      channel === 'email' ? 'resend' : 'botconversa',
      'failed',
      { error: errorMessage },
    )

    return { status: 'failed', error: errorMessage }
  }
}

const processSchedule = async (
  schedule: any,
  options: { limit?: number; mode?: 'pilot' | 'full' } = {},
) => {
  const campaign = schedule.campaign
  const recipients = await resolveRecipients(campaign, schedule)
  const selectedRecipients = options.limit
    ? recipients.slice(0, Math.max(0, Number(options.limit)))
    : recipients
  const results = {
    scheduleId: schedule.id,
    channel: schedule.channel_type,
    recipients: selectedRecipients.length,
    remaining: Math.max(0, recipients.length - selectedRecipients.length),
    sent: 0,
    failed: 0,
    errors: [] as string[],
  }

  for (const recipient of selectedRecipients) {
    const result = await processRecipient(campaign, schedule, recipient)
    if (result.status === 'sent') results.sent += 1
    else {
      results.failed += 1
      if (result.error) results.errors.push(result.error)
    }
  }

  await supabase
    .from('campaign_schedules')
    .update({
      status: results.remaining > 0 ? 'Piloto enviado' : 'Processado',
      processed_at:
        results.remaining > 0
          ? schedule.processed_at
          : new Date().toISOString(),
    })
    .eq('id', schedule.id)

  await supabase
    .from('campaigns')
    .update({
      status:
        results.failed && !results.sent
          ? 'Pausada'
          : results.remaining > 0 || options.mode === 'pilot'
            ? 'Piloto enviado'
            : 'Em Andamento',
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaign.id)

  return results
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    const now = new Date().toISOString()
    let query = supabase
      .from('campaign_schedules')
      .select('*, campaign:campaigns(*)')
      .in(
        'status',
        body?.campaignId
          ? ['Aguardando aprovação', 'Pendente', 'Piloto enviado']
          : ['Pendente'],
      )
      .lte('scheduled_date', now)
      .limit(20)

    if (body?.campaignId) query = query.eq('campaign_id', body.campaignId)
    if (body?.scheduleId) query = query.eq('id', body.scheduleId)
    if (body?.channel) query = query.eq('channel_type', body.channel)

    const { data: schedules, error } = await query
    if (error) throw error

    const results = []
    for (const schedule of schedules || []) {
      if (!schedule.campaign) continue
      results.push(
        await processSchedule(schedule, {
          limit: body?.limit ? Number(body.limit) : undefined,
          mode: body?.mode,
        }),
      )
    }

    return jsonResponse({
      processed: results.length,
      results,
      configuration: {
        resend: Boolean(RESEND_API_KEY),
        botconversa: Boolean(BOTCONVERSA_WEBHOOK_URL),
      },
    })
  } catch (error: any) {
    return jsonResponse({ error: error?.message || 'Erro desconhecido' }, 500)
  }
})
