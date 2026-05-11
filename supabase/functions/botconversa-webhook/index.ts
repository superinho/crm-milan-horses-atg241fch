import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BOTCONVERSA_WEBHOOK_SECRET = Deno.env.get('BOTCONVERSA_WEBHOOK_SECRET')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    if (BOTCONVERSA_WEBHOOK_SECRET) {
      const provided = req.headers.get('x-botconversa-secret')
      if (provided !== BOTCONVERSA_WEBHOOK_SECRET) {
        return new Response('Unauthorized', { status: 401 })
      }
    }

    const payload = await req.json()
    const campaignId = payload.campaign_id || payload.campaignId || null
    const contactId = payload.contact_id || payload.contactId || null
    const providerMessageId =
      payload.message_id || payload.messageId || payload.id || payload.provider_id || null
    const eventType =
      payload.event ||
      payload.event_type ||
      payload.status ||
      (payload.message ? 'message_received' : 'webhook')

    let outboundMessageId = null
    if (providerMessageId) {
      const { data } = await supabase
        .from('outbound_messages')
        .select('id')
        .eq('provider_message_id', providerMessageId)
        .maybeSingle()
      outboundMessageId = data?.id || null
    }

    await supabase.from('message_events').insert({
      outbound_message_id: outboundMessageId,
      campaign_id: campaignId,
      contact_id: contactId,
      provider: 'botconversa',
      event_type: eventType,
      payload,
    })

    if (campaignId && contactId && ['responded', 'message_received', 'respondeu'].includes(String(eventType).toLowerCase())) {
      await supabase
        .from('campaign_sends')
        .update({
          status: 'responded',
          interacted_at: new Date().toISOString(),
          metadata: payload,
        })
        .eq('campaign_id', campaignId)
        .eq('recipient_id', contactId)
        .eq('channel', 'whatsapp')
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
