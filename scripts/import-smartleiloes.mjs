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

const appEnv = {
  ...readEnvFile('.env.local'),
  ...readEnvFile('supabase/.env.local'),
  ...process.env,
}

const SUPABASE_URL = appEnv.VITE_SUPABASE_URL
const SUPABASE_KEY =
  appEnv.SUPABASE_SECRET_KEY ||
  appEnv.SUPABASE_SERVICE_ROLE_KEY ||
  appEnv.SUPABASE_SERVICE_ROLE ||
  appEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
  appEnv.VITE_SUPABASE_ANON_KEY
const SMARTLEILOES_API_KEY = appEnv.SMARTLEILOES_API_KEY
const SMARTLEILOES_API_SECRET = appEnv.SMARTLEILOES_API_SECRET

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing SUPABASE_URL/VITE_SUPABASE_URL or Supabase key.')
}

if (!SMARTLEILOES_API_KEY || !SMARTLEILOES_API_SECRET) {
  throw new Error('Missing SMARTLEILOES_API_KEY or SMARTLEILOES_API_SECRET.')
}

if (
  !appEnv.SUPABASE_SECRET_KEY &&
  !appEnv.SUPABASE_SERVICE_ROLE_KEY &&
  !appEnv.SUPABASE_SERVICE_ROLE
) {
  console.warn(
    'Warning: SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY is not set. Insert may fail if RLS blocks anon writes.',
  )
}

const supabaseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

const currentYear = new Date().getFullYear()

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

const money = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0

  const raw = String(value ?? '')
    .replace(/[^\d,.-]/g, '')
    .trim()

  if (!raw) return 0

  const lastComma = raw.lastIndexOf(',')
  const lastDot = raw.lastIndexOf('.')

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.'
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ','
    const normalized = raw
      .replaceAll(thousandsSeparator, '')
      .replace(decimalSeparator, '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const normalized = raw.replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const isoDate = (value) =>
  value ? String(value).slice(0, 10) : new Date().toISOString().slice(0, 10)

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

  return undefined
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

const uniqueBy = (items, keyFn) => {
  const seen = new Set()
  const out = []

  for (const item of items) {
    const key = keyFn(item)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }

  return out
}

const isSoldContract = (contract) =>
  String(contract.situacaoComercialContrato || contract.situacao || '')
    .trim()
    .toUpperCase() === 'VENDIDO'

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
    headers: { ...supabaseHeaders, ...(init.headers || {}) },
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(`Supabase ${path} ${response.status}: ${text}`)
  }

  return data
}

const insertChunked = async (table, rows, chunkSize = 250) => {
  const inserted = []

  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize)
    const data = await supabaseRequest(table, {
      method: 'POST',
      body: JSON.stringify(chunk),
    })
    inserted.push(...(data || []))
  }

  return inserted
}

const upsertChunked = async (table, rows, onConflict, chunkSize = 250) => {
  const upserted = []

  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize)
    const data = await supabaseRequest(`${table}?on_conflict=${onConflict}`, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(chunk),
    })
    upserted.push(...(data || []))
  }

  return upserted
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

const main = async () => {
  const token = await authenticateSmartLeiloes()

  const [clients, bids, contracts] = await Promise.all([
    smartRequest(
      '/empresa/clientes?palavra-chave=&id-cliente=&situacao=99&formato-resultado=1&limite=5000',
      token,
    ),
    smartRequest(
      '/empresa/lances?id-evento=&id-lote=&id-licitante=999999&limite=5000',
      token,
    ),
    smartRequest(
      `/empresa/contratos?palavra-chave=&id-contrato=&id-evento=&id-lote=&id-vendedor=&id-comprador=&data-inicio=${currentYear - 8}-01-01&data-fim=${currentYear + 1}-12-31&situacao=99&situacao-assinatura=99&limite=5000`,
      token,
    ),
  ])

  const clientByExternalId = new Map(
    clients.map((client) => [String(client.idCliente), client]),
  )

  for (const bid of bids) {
    const id = String(bid.idLicitanteLance)
    if (!clientByExternalId.has(id)) {
      clientByExternalId.set(id, {
        idCliente: id,
        nomeRazaoSocialCliente: bid.nomeLicitanteLance,
        cidadeCliente: bid.cidadeLicitanteLance,
        ufCliente: bid.ufLicitanteLance,
      })
    }
  }

  for (const contract of contracts) {
    const buyerId = String(contract.idCompradorContrato)
    if (!clientByExternalId.has(buyerId)) {
      clientByExternalId.set(buyerId, {
        idCliente: buyerId,
        nomeRazaoSocialCliente: contract.nomeCompradorContrato,
      })
    }

    const sellerId = String(contract.idVendedorContrato)
    if (!clientByExternalId.has(sellerId)) {
      clientByExternalId.set(sellerId, {
        idCliente: sellerId,
        nomeRazaoSocialCliente: contract.nomeVendedorContrato,
      })
    }
  }

  const contactsPayload = uniqueBy(
    [...clientByExternalId.values()].map((client) => {
      const birthDate = birthDateOf(client)

      return {
        smartleiloes_id: String(client.idCliente || ''),
        name:
          client.nomeRazaoSocialCliente ||
          client.nomeCliente ||
          `Cliente Smart ${client.idCliente}`,
        email: client.emailCliente01 || client.emailCliente02 || '',
        phone:
          client.celularCliente01 ||
          client.telefoneCliente01 ||
          client.celularCliente02 ||
          client.telefoneCliente02 ||
          '',
        whatsapp: client.celularCliente01 || client.celularCliente02 || null,
        ...(birthDate ? { birth_date: birthDate } : {}),
        cpf: client.cpfCnpjCliente || null,
        document: client.cpfCnpjCliente || null,
        city: client.cidadeCliente || null,
        state: client.ufCliente || null,
        address:
          [
            client.enderecoCliente,
            client.numeroCliente,
            client.bairroCliente,
            client.cidadeCliente,
            client.ufCliente,
            client.cepCliente,
          ]
            .filter(Boolean)
            .join(', ') || null,
        origin: 'Smart Leilões',
        notes: `Importado da Smart Leilões. ID externo: ${
          client.idCliente || ''
        }${
          client.nomeFazendaCliente
            ? `. Fazenda: ${client.nomeFazendaCliente}`
            : ''
        }`,
        preferences: {
          smartleiloes_id: String(client.idCliente || ''),
          city: client.cidadeCliente || null,
          state: client.ufCliente || null,
          status: client.situacaoCliente || null,
          farm: client.nomeFazendaCliente || null,
        },
        source_payload: client,
      }
    }),
    (contact) =>
      contact.preferences.smartleiloes_id || contact.email || contact.name,
  )

  const insertedContacts = await upsertChunked(
    'contacts',
    contactsPayload,
    'smartleiloes_id',
  )
  const contactIdBySmartId = new Map()
  for (const contact of insertedContacts) {
    const smartId = contact.preferences?.smartleiloes_id
    if (smartId) contactIdBySmartId.set(String(smartId), contact.id)
  }

  const bidPayload = uniqueBy(
    bids.map((bid) => ({
      smartleiloes_id: String(bid.idLance),
      smartleiloes_event_id: bid.idEventoLance
        ? String(bid.idEventoLance)
        : null,
      smartleiloes_lot_id: bid.idLoteLance ? String(bid.idLoteLance) : null,
      contact_id: contactIdBySmartId.get(String(bid.idLicitanteLance)) || null,
      auction_id: bid.idEventoLance
        ? String(bid.idEventoLance)
        : bid.nomeEventoLance || null,
      lot_number:
        bid.numeroLoteLance ||
        (bid.idLoteLance ? String(bid.idLoteLance) : null),
      value: money(bid.valorLance),
      date: isoDate(bid.datalance),
      reason:
        `Smart Leilões ID ${bid.idLance}. ${bid.descricaoLoteLance || ''}`.trim(),
      payload: bid,
    })),
    (bid) => `${bid.reason}-${bid.contact_id}`,
  )

  const purchasePayload = uniqueBy(
    contracts.filter(isSoldContract).map((contract) => ({
      smartleiloes_id: String(contract.idContrato),
      smartleiloes_event_id: contract.idEventoContrato
        ? String(contract.idEventoContrato)
        : null,
      smartleiloes_lot_id: contract.idLoteContrato
        ? String(contract.idLoteContrato)
        : null,
      contact_id:
        contactIdBySmartId.get(String(contract.idCompradorContrato)) || null,
      auction_id: contract.idEventoContrato
        ? String(contract.idEventoContrato)
        : null,
      lot_number:
        contract.numeroLoteContrato ||
        (contract.idLoteContrato ? String(contract.idLoteContrato) : null),
      value: money(contract.valorContrato),
      date: isoDate(contract.dataEmissaocontrato),
      description: `${contract.descricaoLoteContrato || 'Contrato Smart Leilões'} | ID contrato ${
        contract.idContrato
      } | ${contract.situacaoComercialContrato || ''}`,
      payload: contract,
    })),
    (purchase) => purchase.description,
  )

  const insertedBids = bidPayload.length
    ? await upsertChunked('bids', bidPayload, 'smartleiloes_id')
    : []
  const insertedPurchases = purchasePayload.length
    ? await upsertChunked('purchases', purchasePayload, 'smartleiloes_id')
    : []

  console.log(
    JSON.stringify(
      {
        smartFetched: {
          clients: clients.length,
          bids: bids.length,
          contracts: contracts.length,
        },
        inserted: {
          contacts: insertedContacts.length,
          bids: insertedBids.length,
          purchases: insertedPurchases.length,
        },
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
