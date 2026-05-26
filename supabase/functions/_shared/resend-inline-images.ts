export type ResendAttachment = {
  filename: string
  content?: string
  path?: string
  contentType?: string
  contentId?: string
}

const imageSrcPattern = /<img\b[^>]*\bsrc=(["'])(.*?)\1[^>]*>/gi
const dataImagePattern = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i

const filenameFromUrl = (src: string, index: number) => {
  try {
    const url = new URL(src)
    const filename = decodeURIComponent(url.pathname.split('/').pop() || '')
      .replace(/[^\w.-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    if (filename && filename.includes('.')) return filename
  } catch {
    // Fall through to a safe generated filename.
  }

  return `milan-email-image-${index + 1}.jpg`
}

const isEmbeddableRemoteImage = (src: string) => {
  if (!src) return false
  if (/^(cid|blob):/i.test(src)) return false
  if (/^https:\/\/(localhost|127\.0\.0\.1|\[?::1\]?)/i.test(src)) return false
  return /^https:\/\//i.test(src)
}

const extensionFromContentType = (contentType: string) => {
  if (/png/i.test(contentType)) return 'png'
  if (/webp/i.test(contentType)) return 'webp'
  if (/gif/i.test(contentType)) return 'gif'
  if (/svg/i.test(contentType)) return 'svg'
  return 'jpg'
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const dataImageAttachment = (
  src: string,
  contentId: string,
  index: number,
): ResendAttachment | null => {
  const match = src.match(dataImagePattern)
  if (!match) return null

  const [, contentType, content] = match
  return {
    content,
    filename: `milan-email-image-${index + 1}.${extensionFromContentType(
      contentType,
    )}`,
    contentType,
    contentId,
  }
}

export const embedRemoteImagesForResend = (
  html: string,
  existingAttachments: ResendAttachment[] = [],
) => {
  const srcToAttachment = new Map<string, ResendAttachment>()

  const nextHtml = String(html || '').replace(
    imageSrcPattern,
    (tag, quote, src) => {
      console.log(`[Email Image Auditor] Detected image src: ${src}`)
      if (!isEmbeddableRemoteImage(src) && !dataImagePattern.test(src)) {
        return tag
      }

      let attachment = srcToAttachment.get(src)
      if (!attachment) {
        const contentId = `milan-image-${srcToAttachment.size + 1}`
        attachment =
          dataImageAttachment(src, contentId, srcToAttachment.size) || {
            path: src,
            filename: filenameFromUrl(src, srcToAttachment.size),
            contentId,
          }
        srcToAttachment.set(src, attachment)
      }

      return tag.replace(
        `src=${quote}${src}${quote}`,
        `src=${quote}cid:${attachment.contentId}${quote}`,
      )
    },
  )

  return {
    html: nextHtml,
    attachments: [...existingAttachments, ...srcToAttachment.values()],
  }
}

export const htmlToPlainText = (html: string) =>
  String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|tr|table|h1|h2|h3|li)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()

export const ensureEmailDocument = (html: string) => {
  const content = String(html || '').trim()
  if (!content || /<html[\s>]/i.test(content)) return content

  const preheader =
    htmlToPlainText(content).slice(0, 140) ||
    'Curadoria Milan Horses preparada para voce.'

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Milan Horses</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f3ee;color:#14213a;font-family:Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;background:#f6f3ee;">
      <tr>
        <td align="center" style="padding:28px 14px;">
          <table role="presentation" width="680" cellspacing="0" cellpadding="0" style="width:100%;max-width:680px;border-collapse:collapse;background:#ffffff;border:1px solid #e0d7c8;">
            <tr>
              <td style="padding:30px 34px;">
                ${content}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
