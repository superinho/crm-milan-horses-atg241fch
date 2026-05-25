import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import {
  embedRemoteImagesForResend,
  type ResendAttachment,
} from '../_shared/resend-inline-images.ts'

interface EmailRequest {
  to: string[]
  subject: string
  html: string
  attachments?: ResendAttachment[]
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, attachments }: EmailRequest = await req.json()

    // Validate required fields
    if (!to || !to.length || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    console.log(`[send-contact-email] Processing email body for images...`)
    const preparedEmail = embedRemoteImagesForResend(html, attachments || [])

    // Construct Resend payload
    const payload: any = {
      from: 'Milan Horses Leilões <nicole.vaz@milanleiloes.com.br>',
      to: to,
      subject: subject,
      html: preparedEmail.html,
    }

    if (preparedEmail.attachments.length > 0) {
      payload.attachments = preparedEmail.attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
        path: att.path,
        contentType: att.contentType,
        contentId: att.contentId,
      }))
    }

    console.log(
      `[send-contact-email] Sending to Resend with payload:`,
      JSON.stringify(payload, null, 2),
    )

    // Call Resend API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error(
        `[send-contact-email] Resend API error (${res.status}):`,
        JSON.stringify(data, null, 2),
      )
      return new Response(JSON.stringify({ error: data }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[send-contact-email] Email sent successfully:`, data.id)
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error(`[send-contact-email] Internal error:`, error)
    return new Response(JSON.stringify({ error: { message: error.message } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
