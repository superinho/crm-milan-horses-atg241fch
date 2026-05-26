import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  embedRemoteImagesForResend,
  ensureEmailDocument,
  htmlToPlainText,
  replaceDataImagesWithPublicUrls,
  type ResendAttachment,
} from '../_shared/resend-inline-images.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const RESEND_FROM_EMAIL =
  Deno.env.get('RESEND_FROM_EMAIL') ||
  'Milan Horses Leilões <contato@milanhorses.com.br>'

interface EmailRequest {
  to: string[]
  subject: string
  html: string
  text?: string
  attachments?: ResendAttachment[]
}

const base64ToBlob = (content: string, contentType: string) => {
  const binary = atob(content)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new Blob([bytes], { type: contentType })
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text, attachments }: EmailRequest =
      await req.json()

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

    let emailHtml = ensureEmailDocument(html)
    if (emailHtml.includes('data:image/')) {
      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Supabase storage is not configured for email images.')
      }

      const storage = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      emailHtml = await replaceDataImagesWithPublicUrls(
        emailHtml,
        async ({ content, contentType, extension, index }) => {
          const path = `studio/email-${Date.now()}-${index}-${crypto.randomUUID()}.${extension}`
          const { error } = await storage.storage
            .from('email-assets')
            .upload(path, base64ToBlob(content, contentType), {
              cacheControl: '31536000',
              contentType,
              upsert: false,
            })

          if (error) throw error
          return storage.storage.from('email-assets').getPublicUrl(path).data
            .publicUrl
        },
      )
    }

    const plainText = text || htmlToPlainText(emailHtml)

    console.log(`[send-contact-email] Processing email body for images...`)
    const preparedEmail = embedRemoteImagesForResend(
      emailHtml,
      attachments || [],
    )

    // Construct Resend payload
    const payload: any = {
      from: RESEND_FROM_EMAIL,
      to: to,
      subject: subject,
      html: preparedEmail.html,
      text: plainText,
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
