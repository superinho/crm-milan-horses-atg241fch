export type ResendAttachment = {
  filename: string
  content?: string
  path?: string
  contentType?: string
  contentId?: string
}

const imageSrcPattern = /<img\b[^>]*\bsrc=(["'])(.*?)\1[^>]*>/gi
const dataImagePattern = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i

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

type UploadDataImage = (image: {
  content: string
  contentType: string
  extension: string
  index: number
}) => Promise<string>

export const replaceDataImagesWithPublicUrls = async (
  html: string,
  uploadDataImage: UploadDataImage,
) => {
  const srcToPublicUrl = new Map<string, string>()
  const parts: string[] = []
  let lastIndex = 0
  let imageIndex = 0

  for (const match of String(html || '').matchAll(imageSrcPattern)) {
    const tag = match[0]
    const quote = match[1]
    const src = match[2]
    const matchIndex = match.index || 0
    const dataImage = src.match(dataImagePattern)

    parts.push(String(html || '').slice(lastIndex, matchIndex))
    lastIndex = matchIndex + tag.length

    if (!dataImage) {
      parts.push(tag)
      continue
    }

    let publicUrl = srcToPublicUrl.get(src)
    if (!publicUrl) {
      const [, contentType, content] = dataImage
      publicUrl = await uploadDataImage({
        content,
        contentType,
        extension: extensionFromContentType(contentType),
        index: imageIndex,
      })
      srcToPublicUrl.set(src, publicUrl)
      imageIndex += 1
    }

    parts.push(
      tag.replace(
        `src=${quote}${src}${quote}`,
        `src=${quote}${publicUrl}${quote}`,
      ),
    )
  }

  parts.push(String(html || '').slice(lastIndex))
  return parts.join('')
}

export const embedRemoteImagesForResend = (
  html: string,
  existingAttachments: ResendAttachment[] = [],
) => {
  return {
    html: String(html || ''),
    attachments: existingAttachments,
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
