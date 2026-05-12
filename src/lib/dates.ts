const isoDateKey = (value?: string | null) => {
  if (!value) return ''
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : ''
}

export const formatCivilDate = (value?: string | null, fallback = '-') => {
  const key = isoDateKey(value)
  if (key) {
    const [year, month, day] = key.split('-')
    return `${day}/${month}/${year}`
  }

  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('pt-BR')
}

export const civilDateTime = (value?: string | null) => {
  const key = isoDateKey(value)
  if (key) {
    const [year, month, day] = key.split('-').map(Number)
    return Date.UTC(year, month - 1, day, 12)
  }

  if (!value) return 0
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}
