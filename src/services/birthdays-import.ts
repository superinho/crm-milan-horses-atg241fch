import { supabase } from '@/lib/supabase/client'

type ContactMatch = {
  id: string
  smartleiloes_id?: string | null
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  document?: string | null
  cpf?: string | null
  birth_date?: string | null
}

export type BirthdayImportSummary = {
  rows: number
  parsedBirthdates: number
  updated: number
  alreadyFilled: number
  conflicts: number
  invalidDates: number
  unmatched: number
}

const db = supabase as any

const normalizeKey = (key: string) =>
  key
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()

const digitsOnly = (value?: string | null) =>
  String(value || '').replace(/\D/g, '')

const cleanEmail = (value?: string | null) =>
  String(value || '')
    .trim()
    .toLowerCase()

const parseCsvLine = (line: string) => {
  const values: string[] = []
  let current = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"' && quoted && next === '"') {
      current += '"'
      index += 1
      continue
    }

    if (char === '"') {
      quoted = !quoted
      continue
    }

    if ((char === ',' || char === ';' || char === '\t') && !quoted) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

const parseCsv = (text: string) => {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map(normalizeKey)
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = values[index] || ''
      return row
    }, {})
  })
}

const firstValue = (row: Record<string, string>, aliases: string[]) => {
  for (const alias of aliases.map(normalizeKey)) {
    const value = row[alias]
    if (value) return value
  }
  return ''
}

const parseBirthDate = (value: string) => {
  const raw = value.trim()
  if (!raw) return null

  const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  const brazilian = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/)
  const match = iso || brazilian
  if (!match) return null

  const year = iso ? Number(match[1]) : Number(match[3])
  const month = iso ? Number(match[2]) : Number(match[2])
  const day = iso ? Number(match[3]) : Number(match[1])
  const fullYear =
    !iso && match[3].length === 2
      ? year > 30
        ? 1900 + year
        : 2000 + year
      : year
  const date = new Date(Date.UTC(fullYear, month - 1, day))

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== fullYear ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  const now = new Date()
  const age = now.getUTCFullYear() - fullYear
  if (date > now || age > 120) return null

  return date.toISOString().slice(0, 10)
}

const fetchAllContacts = async () => {
  const contacts: ContactMatch[] = []

  for (let from = 0; ; from += 1000) {
    const to = from + 999
    const { data, error } = await db
      .from('contacts')
      .select('id,smartleiloes_id,email,phone,whatsapp,document,cpf,birth_date')
      .range(from, to)

    if (error) throw error
    contacts.push(...((data || []) as ContactMatch[]))
    if (!data || data.length < 1000) break
  }

  return contacts
}

const addToMap = (
  map: Map<string, ContactMatch>,
  key: string,
  contact: ContactMatch,
) => {
  if (key && !map.has(key)) map.set(key, contact)
}

export const birthdaysImportService = {
  async importCsv(text: string): Promise<BirthdayImportSummary> {
    const rows = parseCsv(text)
    const contacts = await fetchAllContacts()
    const bySmartId = new Map<string, ContactMatch>()
    const byDocument = new Map<string, ContactMatch>()
    const byEmail = new Map<string, ContactMatch>()
    const byPhone = new Map<string, ContactMatch>()

    contacts.forEach((contact) => {
      addToMap(bySmartId, String(contact.smartleiloes_id || '').trim(), contact)
      addToMap(byDocument, digitsOnly(contact.document || contact.cpf), contact)
      addToMap(byEmail, cleanEmail(contact.email), contact)
      addToMap(byPhone, digitsOnly(contact.whatsapp || contact.phone), contact)
    })

    const summary: BirthdayImportSummary = {
      rows: rows.length,
      parsedBirthdates: 0,
      updated: 0,
      alreadyFilled: 0,
      conflicts: 0,
      invalidDates: 0,
      unmatched: 0,
    }

    const updates = new Map<string, string>()

    for (const row of rows) {
      const birthDate = parseBirthDate(
        firstValue(row, [
          'dataNascimentoCliente',
          'data_nascimento',
          'data nascimento',
          'nascimento',
          'aniversario',
          'aniversário',
          'birth_date',
          'birthday',
        ]),
      )

      if (!birthDate) {
        summary.invalidDates += 1
        continue
      }

      summary.parsedBirthdates += 1

      const contact =
        bySmartId.get(
          firstValue(row, ['idCliente', 'smartleiloes_id', 'id cliente']),
        ) ||
        byDocument.get(
          digitsOnly(
            firstValue(row, [
              'cpfCnpjCliente',
              'cpf_cnpj',
              'cpf/cnpj',
              'documento',
              'cpf',
              'cnpj',
            ]),
          ),
        ) ||
        byEmail.get(
          cleanEmail(
            firstValue(row, [
              'emailCliente01',
              'email',
              'e-mail',
              'email principal',
            ]),
          ),
        ) ||
        byPhone.get(
          digitsOnly(
            firstValue(row, [
              'celularCliente01',
              'whatsapp',
              'telefone',
              'phone',
              'celular',
            ]),
          ),
        )

      if (!contact) {
        summary.unmatched += 1
        continue
      }

      if (contact.birth_date === birthDate) {
        summary.alreadyFilled += 1
        continue
      }

      if (contact.birth_date && contact.birth_date !== birthDate) {
        summary.conflicts += 1
        continue
      }

      updates.set(contact.id, birthDate)
    }

    for (const [id, birthDate] of updates) {
      const { error } = await db
        .from('contacts')
        .update({ birth_date: birthDate })
        .eq('id', id)

      if (error) throw error
      summary.updated += 1
    }

    return summary
  }