import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const event = await req.json()

    // Resend webhook payload structure: { type: 'email.opened', data: { ... } }
    // We added tags in send-campaigns: recipient_id, campaign_id, schedule_id

    /* 
       Note: To verify webhook signature in production, we should check 'svix-signature' header.
       Skipping for MVP simplicity.
    */

    const type = event.type
    const emailId = event.data?.email_id || event.data?.id
    // Resend doesn't always pass tags in the top level 'data' depending on event type versions,
    // sometimes we need to match by email_id (provider_id).

    if (!emailId) return new Response('No email ID', { status: 200 })

    let updateData: any = {}

    if (type === 'email.delivered') {
      updateData = {
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      }
    } else if (type === 'email.opened') {
      updateData = { status: 'opened', opened_at: new Date().toISOString() }
    } else if (type === 'email.clicked') {
      updateData = { status: 'clicked', clicked_at: new Date().toISOString() }
    } else if (type === 'email.bounced' || type === 'email.delivery_delayed') {
      updateData = { status: 'failed' }
    }

    if (Object.keys(updateData).length > 0) {
      await supabase
        .from('campaign_sends')
        .update(updateData)
        .eq('provider_id', emailId)

      const { data: outbound } = await supabase
        .from('outbound_messages')
        .select('id, campaign_id, contact_id')
        .eq('provider_message_id', emailId)
        .maybeSingle()

      if (outbound?.id) {
        await supabase
          .from('outbound_messages')
          .update({
            status:
              type === 'email.delivered'
                ? 'delivered'
                : type === 'email.opened'
                  ? 'opened'
                  : type === 'email.clicked'
                    ? 'clicked'
                    : updateData.status || 'sent',
            response_payload: event,
            updated_at: new Date().toISOString(),
          })
          .eq('id', outbound.id)

        await supabase.from('message_events').insert({
          outbound_message_id: outbound.id,
          campaign_id: outbound.campaign_id,
          contact_id: outbound.contact_id,
          provider: 'resend',
          event_type: type,
          payload: event,
        })
      }
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
