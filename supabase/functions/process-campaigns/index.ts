import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const now = new Date().toISOString()

    // 1. Fetch Due Schedules
    const { data: schedules, error: scheduleError } = await supabase
      .from('campaign_schedules')
      .select(
        `
        *,
        campaign:campaigns(*)
      `,
      )
      .eq('status', 'Pendente')
      .lte('scheduled_at', now)

    if (scheduleError) throw scheduleError

    const results = {
      processed: 0,
      emails: 0,
      whatsapp: 0,
      errors: [] as string[],
    }

    if (!schedules || schedules.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No schedules due', results }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Process each schedule
    for (const schedule of schedules) {
      const campaign = schedule.campaign
      if (!campaign) continue

      // 2. Resolve Audience
      // Complex filter logic usually requires dynamic query or RPC.
      // For MVP, we fetch all contacts and filter in memory, or handle simple tag filters.

      let query = supabase
        .from('contacts')
        .select('id, email, phone, whatsapp, name')

      // Apply Tags Filter
      if (campaign.audience_filters?.tags?.length > 0) {
        const { data: taggedIds } = await supabase
          .from('contact_tags')
          .select('contact_id, tags!inner(name)')
          .in('tags.name', campaign.audience_filters.tags)

        const ids = taggedIds?.map((t: any) => t.contact_id) || []
        if (ids.length > 0) query = query.in('id', ids)
        else {
          // No contacts match tags, skip
          await supabase
            .from('campaign_schedules')
            .update({ status: 'Processado' })
            .eq('id', schedule.id)
          continue
        }
      }

      // Apply Segments (Basic implementation assuming View logic similar to contactsService)
      if (campaign.audience_filters?.segments?.length > 0) {
        const { data: segmentedContacts } = await supabase
          .from('contact_segmentation_view')
          .select('id')
          .in('segment', campaign.audience_filters.segments)

        const ids = segmentedContacts?.map((c: any) => c.id) || []
        if (ids.length > 0) query = query.in('id', ids)
        else {
          // No contacts match segments
          await supabase
            .from('campaign_schedules')
            .update({ status: 'Processado' })
            .eq('id', schedule.id)
          continue
        }
      }

      const { data: contacts } = await query

      if (!contacts || contacts.length === 0) {
        await supabase
          .from('campaign_schedules')
          .update({ status: 'Processado' })
          .eq('id', schedule.id)
        continue
      }

      // 3. Process Channel Logic
      if (schedule.channel_type === 'email') {
        if (RESEND_API_KEY) {
          // Batch sending with Resend (Free tier limit is 100/day, be careful. Batch limit is 100 emails per request)
          // We'll loop in chunks of 50
          const validContacts = contacts.filter((c: any) => c.email)

          for (let i = 0; i < validContacts.length; i += 50) {
            const chunk = validContacts.slice(i, i + 50)
            const batch = chunk.map((contact: any) => ({
              from: 'Milan Horses <contato@milanhorses.com.br>',
              to: [contact.email],
              subject: `Nova mensagem de Milan Horses`, // Should ideally come from Template/Schedule
              html: schedule.content.replace('{{nome}}', contact.name),
              // Tracking tags for Resend Webhook
              tags: [
                { name: 'campaign_id', value: campaign.id },
                { name: 'recipient_id', value: contact.id },
                { name: 'schedule_id', value: schedule.id },
              ],
            }))

            try {
              const res = await fetch('https://api.resend.com/emails/batch', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${RESEND_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(batch),
              })

              if (!res.ok) {
                const err = await res.json()
                console.error('Resend Error', err)
                results.errors.push(
                  `Resend batch error: ${JSON.stringify(err)}`,
                )
              } else {
                const data = await res.json()
                // Insert Logs
                const logs = chunk.map((c: any, idx: number) => ({
                  campaign_id: campaign.id,
                  schedule_id: schedule.id,
                  recipient_id: c.id,
                  channel: 'email',
                  status: 'sent',
                  provider_id: data.data?.[idx]?.id,
                  sent_at: new Date().toISOString(),
                }))

                await supabase.from('campaign_sends').insert(logs)
                results.emails += chunk.length
              }
            } catch (e: any) {
              results.errors.push(e.message)
            }
          }
        } else {
          results.errors.push('RESEND_API_KEY missing')
        }
      } else if (schedule.channel_type === 'whatsapp') {
        // Just populate the logs as "Pending" for manual sending UI
        const validContacts = contacts.filter((c: any) => c.phone || c.whatsapp)

        const logs = validContacts.map((c: any) => ({
          campaign_id: campaign.id,
          schedule_id: schedule.id,
          recipient_id: c.id,
          channel: 'whatsapp',
          status: 'pending',
        }))

        if (logs.length > 0) {
          await supabase.from('campaign_sends').insert(logs)
          results.whatsapp += logs.length
        }
      }

      // 4. Mark Schedule as Processed
      await supabase
        .from('campaign_schedules')
        .update({
          status: 'Processado',
          processed_at: new Date().toISOString(),
        })
        .eq('id', schedule.id)

      results.processed++
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
