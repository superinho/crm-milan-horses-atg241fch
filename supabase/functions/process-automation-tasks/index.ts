import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { data: settings, error: settingsError } = await supabase
      .from('automation_settings')
      .select('*')

    if (settingsError) throw settingsError

    const results = {
      birthday: 0,
      post_sale: 0,
      inactivity: 0,
      lost_bid: 0,
      errors: [] as string[],
    }

    const today = new Date()

    // 1. Birthday Automation
    const birthdayRule = settings.find((s) => s.rule_key === 'birthday')
    if (birthdayRule?.is_active) {
      try {
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const month = tomorrow.getMonth() + 1
        const day = tomorrow.getDate()

        // Note: Supabase/Postgres doesn't support easy month/day extraction in filter builder directly without raw sql usually,
        // but we can fetch potential contacts or use a view. For simplicity/performance in edge function, we might query raw.
        // Or fetch contacts and filter in JS if list is small, but better to use RPC or filter.
        // Let's use a broader fetch and filter in JS for this specific task due to library constraints,
        // assuming standard contacts table size manageable or using raw query.

        // Using raw query for efficiency
        // Need to cast birth_date to date to extract month/day
        const { data: contacts, error: contactsError } = await supabase.rpc(
          'get_contacts_with_birthday',
          { p_month: month, p_day: day },
        )

        // Since we can't create RPC easily here without migration, let's fetch contacts with birth_date NOT NULL
        // and filter in memory (acceptable for MVP/smaller datasets).
        const { data: allContacts } = await supabase
          .from('contacts')
          .select('id, name, birth_date')
          .not('birth_date', 'is', null)

        const birthdayContacts = (allContacts || []).filter((c) => {
          const bd = new Date(c.birth_date)
          // Fix timezone issues by treating date string as UTC or local specific
          // Assuming YYYY-MM-DD string
          const parts = c.birth_date.split('-')
          return parseInt(parts[1]) === month && parseInt(parts[2]) === day
        })

        for (const contact of birthdayContacts) {
          const title = `Aniversário do Cliente: ${contact.name}`
          const dueDate = tomorrow.toISOString()

          // Check existence
          const { data: existing } = await supabase
            .from('tasks')
            .select('id')
            .eq('contact_id', contact.id)
            .eq('title', title)
            .gte(
              'created_at',
              new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
              ).toISOString(),
            ) // Created today?
            .limit(1)

          if (!existing || existing.length === 0) {
            await supabase.from('tasks').insert({
              title,
              type: 'Outro',
              contact_id: contact.id,
              due_date: dueDate,
              description:
                'Gerado automaticamente pela automação de aniversários.',
              is_completed: false,
            })
            results.birthday++
          }
        }
      } catch (e: any) {
        results.errors.push(`Birthday Error: ${e.message}`)
      }
    }

    // 2. Post-Sale Follow-up
    const postSaleRule = settings.find((s) => s.rule_key === 'post_sale')
    if (postSaleRule?.is_active) {
      try {
        const checkPoints = [7, 30, 60]

        for (const days of checkPoints) {
          const targetDate = new Date(today)
          targetDate.setDate(targetDate.getDate() - days)
          const dateStr = targetDate.toISOString().split('T')[0]

          const { data: purchases } = await supabase
            .from('purchases')
            .select('id, contact_id, date, contacts(name)')
            .eq('date', dateStr)

          for (const purchase of purchases || []) {
            if (!purchase.contacts) continue

            const contactName = Array.isArray(purchase.contacts)
              ? purchase.contacts[0].name
              : purchase.contacts.name
            const title = `Follow-up Pós-venda (${days} dias): ${contactName}`

            // Check existence
            const { data: existing } = await supabase
              .from('tasks')
              .select('id')
              .eq('contact_id', purchase.contact_id)
              .eq('title', title)
              .limit(1)

            if (!existing || existing.length === 0) {
              await supabase.from('tasks').insert({
                title,
                type: 'Ligação',
                contact_id: purchase.contact_id,
                due_date: new Date().toISOString(), // Due today
                description: `Follow-up referente à compra realizada em ${purchase.date}.`,
                is_completed: false,
              })
              results.post_sale++
            }
          }
        }
      } catch (e: any) {
        results.errors.push(`Post-Sale Error: ${e.message}`)
      }
    }

    // 3. Inactivity Alerts
    const inactivityRule = settings.find((s) => s.rule_key === 'inactivity')
    if (inactivityRule?.is_active) {
      try {
        const ninetyDaysAgo = new Date(today)
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        // We need contacts where last_bid_date < 90 days ago OR (last_bid_date is null AND created_at < 90 days ago)
        // Using the view created in migrations
        const { data: inactiveContacts } = await supabase
          .from('contact_segmentation_view')
          .select('id, name, last_bid_date, created_at')
          .or(
            `last_bid_date.lt.${ninetyDaysAgo.toISOString()},and(last_bid_date.is.null,created_at.lt.${ninetyDaysAgo.toISOString()})`,
          )

        for (const contact of inactiveContacts || []) {
          const title = `Cliente Inativo (90 dias): ${contact.name}`

          // Check for any OPEN task with this title to avoid spamming every day
          const { data: existing } = await supabase
            .from('tasks')
            .select('id')
            .eq('contact_id', contact.id)
            .eq('title', title)
            .eq('is_completed', false)
            .limit(1)

          if (!existing || existing.length === 0) {
            await supabase.from('tasks').insert({
              title,
              type: 'Outro',
              contact_id: contact.id,
              due_date: new Date().toISOString(),
              description:
                'Cliente sem lances há mais de 90 dias. Tentar reengajamento.',
              is_completed: false,
            })
            results.inactivity++
          }
        }
      } catch (e: any) {
        results.errors.push(`Inactivity Error: ${e.message}`)
      }
    }

    // 4. Lost Bid Follow-up
    const lostBidRule = settings.find((s) => s.rule_key === 'lost_bid')
    if (lostBidRule?.is_active) {
      try {
        const threeDaysAgo = new Date(today)
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
        const dateStr = threeDaysAgo.toISOString().split('T')[0]

        const { data: bids } = await supabase
          .from('bids')
          .select(
            'id, contact_id, auction_id, lot_number, date, contacts(name)',
          )
          .eq('date', dateStr)

        for (const bid of bids || []) {
          if (!bid.contact_id) continue

          // Check if this bid resulted in a purchase
          const { data: purchase } = await supabase
            .from('purchases')
            .select('id')
            .eq('contact_id', bid.contact_id)
            .eq('auction_id', bid.auction_id)
            .eq('lot_number', bid.lot_number)
            .limit(1)

          if (!purchase || purchase.length === 0) {
            const contactName = Array.isArray(bid.contacts)
              ? bid.contacts[0].name
              : bid.contacts.name
            const title = `Follow-up: Lance não arrematado - ${contactName}`

            // Check existence
            const { data: existing } = await supabase
              .from('tasks')
              .select('id')
              .eq('contact_id', bid.contact_id)
              .eq('title', title)
              .limit(1)

            if (!existing || existing.length === 0) {
              await supabase.from('tasks').insert({
                title,
                type: 'WhatsApp',
                contact_id: bid.contact_id,
                due_date: new Date().toISOString(),
                description: `O cliente deu lance no lote ${bid.lot_number} (${bid.auction_id}) mas não arrematou.`,
                is_completed: false,
              })
              results.lost_bid++
            }
          }
        }
      } catch (e: any) {
        results.errors.push(`Lost Bid Error: ${e.message}`)
      }
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
