export type ResendAttachment = {
  filename: string
  content?: string
  path?: string
  contentType?: string
  contentId?: string
}

const imageSrcPattern = /<img\b[^>]*\bsrc=(["'])(.*?)\1[^>]*>/gi

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
  if (/^(cid|data|blob):/i.test(src)) return false
  if (/^https:\/\/(localhost|127\.0\.0\.1|\[?::1\]?)/i.test(src)) return false
  return /^https:\/\//i.test(src)
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
      if (!isEmbeddableRemoteImage(src)) return tag

      let attachment = srcToAttachment.get(src)
      if (!attachment) {
        const contentId = `milan-image-${srcToAttachment.size + 1}`
        attachment = {
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
