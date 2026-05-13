export const digitsOnly = (value?: string | null) =>
  String(value || '').replace(/\D/g, '')

export const normalizeBrazilianPhone = (value?: string | null) => {
  let digits = digitsOnly(value).replace(/^0+/, '')

  if (!digits) return ''

  while (digits.startsWith('5555') && digits.length > 13) {
    digits = digits.slice(2)
  }

  if (digits.startsWith('55') && digits.length >= 12) {
    return digits
  }

  return `55${digits.replace(/^55/, '')}`
}

export const whatsappUrl = (phone?: string | null, message?: string) => {
  const normalizedPhone = normalizeBrazilianPhone(phone)
  if (!normalizedPhone) return ''

  return `https://wa.me/${normalizedPhone}${
    message ? `?text=${encodeURIComponent(message)}` : ''
  }`
}

export const telUrl = (phone?: string | null) => {
  const normalizedPhone = normalizeBrazilianPhone(phone)
  return normalizedPhone ? `tel:+${normalizedPhone}` : ''
}
