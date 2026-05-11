import fs from 'node:fs'

const readEnvFile = (file) => {
  if (!fs.existsSync(file)) return {}
  return Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const [key, ...rest] = line.split('=')
        return [key, rest.join('=')]
      }),
  )
}

const env = {
  ...readEnvFile('.env.local'),
  ...readEnvFile('supabase/.env.local'),
  ...process.env,
}

const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_KEY =
  env.SUPABASE_SECRET_KEY ||
  env.SUPABASE_SERVICE_ROLE_KEY ||
  env.SUPABASE_SERVICE_ROLE ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY
const SMARTLEILOES_API_KEY = env.SMARTLEILOES_API_KEY
const SMARTLEILOES_API_SECRET = env.SMARTLEILOES_API_SECRET

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase URL or key.')
}

if (!SMARTLEILOES_API_KEY || !SMARTLEILOES_API_SECRET) {
  throw new Error('Missing Smart Leilões API credentials.')
}

const supabaseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

const normalizeKey = (key) =>
  key
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()

const valueOf = (record, keys) => {
  const normalizedEntries = Object.entries(record || {}).map(([key, value]) => [
    normalizeKey(key),
    value,
  ])

  for (const key of keys) {
    if (record?.[key] !== undefined && record[key] !== null && record[key] !== '') {
      return record[key]
    }

    const normalizedKey = normalizeKey(key)
    const found = normalizedEntries.find(
      ([entryKey, value]) =>
        entryKey === normalizedKey &&
        value !== undefined &&
        value !== null &&
        value !== '',
    )
    if (found) return found[1]
  }

  const fuzzy = normalizedEntries.find(
    ([entryKey, value]) =>
      /(nascimento|nasc|birth|birthday|aniversario)/.test(entryKey) &&
      value !== undefined &&
      value !== null &&
      value !== '',
  )

  return fuzzy?.[1]
}

const dateOnly = (value) => {
  if (!value) return null
  const raw = String(value).trim()
  const brazilianDate = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)

  if (brazilianDate) {
    const [, day, month, year] = brazilianDate
    const numericYear = Number(year)
    const fullYear =
      year.length === 2
        ? numericYear > 30
          ? 1900 + numericYear
          : 2000 + numericYear
        : numericYear
    const date = new Date(Date.UTC(fullYear, Number(month) - 1, Number(day)))
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
  }

  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

const birthDateOf = (client) =>
  dateOnly(
    valueOf(client, [
      'birth_date',
      'birthday',
      'data_nascimento',
      'data_nascimento_cliente',
      'dataNascimento',
      'dataNascimentoCliente',
      'dt_nascimento',
      'dtNascimento',
      'nascimento',
      'nascimentoCliente',
      'data_aniversario',
      'dataAniversario',
      'aniversario',
      'aniversário',
    ]),
  )

const extractItems = (data) => {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []
  return (
    data.data ||
    data.items ||
    data.registros ||
    data.retorno ||
    Object.values(data).find(Array.isArray) ||
    []
  )
}

const authenticateSmartLeiloes = async () => {
  const response = await fetch(
    'https://api.smartleiloes.digital/v1/empresa/auth',
    {
      method: 'POST',
      headers: {
        'api-key': SMARTLEILOES_API_KEY,
        'api-secret': SMARTLEILOES_API_SECRET,
      },
    },
  )
  const data = await response.json()
  const token = data.token || data.access_token || data?.data?.token

  if (!response.ok || !token) {
    throw new Error('Smart Leilões authentication failed.')
  }

  return token
}

const smartRequest = async (path, token) => {
  const response = await fetch(`https://api.smartleiloes.digital/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(`Smart Leilões ${path} ${response.status}: ${text}`)
  }

  return extractItems(data)
}

const supabaseRequest = async (path, init = {}) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...supabaseHeaders,
      Prefer: 'return=representation',
      ...(init.headers || {}),
    },
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(`Supabase ${path} ${response.status}: ${text}`)
  }

  return data
}

const selectAll = async (path, pageSize = 1000) => {
  const rows = []
  const separator = path.includes('?') ? '&' : '?'

  for (let offset = 0; ; offset += pageSize) {
    const page = await supabaseRequest(
      `${path}${separator}limit=${pageSize}&offset=${offset}`,
    )
    rows.push(...(page || []))
    if (!page || page.length < pageSize) break
  }

  return rows
}

const token = await authenticateSmartLeiloes()
const clients = await smartRequest(
  '/empresa/clientes?palavra-chave=&id-cliente=&situacao=99&formato-resultado=1&limite=5000',
  token,
)
const contacts = await selectAll(
  'contacts?select=id,smartleiloes_id,birth_date&origin=eq.Smart%20Leil%C3%B5es',
)
const contactsBySmartId = new Map(
  contacts
    .filter((contact) => contact.smartleiloes_id)
    .map((contact) => [String(contact.smartleiloes_id), contact]),
)

const updates = []
let alreadyFilled = 0
let missingContacts = 0

for (const client of clients) {
  const birthDate = birthDateOf(client)
  if (!birthDate) continue

  const contact = contactsBySmartId.get(String(client.idCliente || ''))
  if (!contact) {
    missingContacts += 1
    continue
  }

  if (contact.birth_date === birthDate) {
    alreadyFilled += 1
    continue
  }

  updates.push({
    id: contact.id,
    birth_date: birthDate,
  })
}

for (const update of updates) {
  const { id, ...body } = update
  await supabaseRequest(`contacts?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

console.log(
  JSON.stringify(
    {
      clientsScanned: clients.length,
      apiBirthdatesFound: updates.length + alreadyFilled + missingContacts,
      updated: updates.length,
      alreadyFilled,
      missingContacts,
    },
    null,
    2,
  ),
)
