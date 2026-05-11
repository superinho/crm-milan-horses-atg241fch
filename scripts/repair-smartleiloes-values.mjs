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
  env.SUPABASE_SERVICE_ROLE
const SMARTLEILOES_API_KEY = env.SMARTLEILOES_API_KEY
const SMARTLEILOES_API_SECRET = env.SMARTLEILOES_API_SECRET

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL and a Supabase server key.')
}

if (!SMARTLEILOES_API_KEY || !SMARTLEILOES_API_SECRET) {
  throw new Error('Missing SMARTLEILOES_API_KEY or SMARTLEILOES_API_SECRET.')
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
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

  const parsed = Number(raw.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

const isoDate = (value) =>
  value ? String(value).slice(0, 10) : new Date().toISOString().slice(0, 10)

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
      ...headers,
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

const upsertByIdChunked = async (table, rows, chunkSize = 250) => {
  if (!rows.length) return []

  const upserted = []
  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize)
    const data = await supabaseRequest(`${table}?on_conflict=id`, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(chunk),
    })
    upserted.push(...(data || []))
  }

  return upserted
}

const patchById = (table, id, body) =>
  supabaseRequest(`${table}?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })

const deleteByIdsChunked = async (table, ids, chunkSize = 250) => {
  let deleted = 0

  for (let index = 0; index < ids.length; index += chunkSize) {
    const chunk = ids.slice(index, index + chunkSize)
    const data = await supabaseRequest(`${table}?id=in.(${chunk.join(',')})`, {
      method: 'DELETE',
    })
    deleted += data?.length || 0
  }

  return deleted
}

const isSoldContract = (contract) =>
  String(contract?.situacaoComercialContrato || contract?.situacao || '')
    .trim()
    .toUpperCase() === 'VENDIDO'

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

const currentYear = new Date().getFullYear()
const token = await authenticateSmartLeiloes()

const [contracts, bids, contacts, dbPurchases, dbBids] = await Promise.all([
  smartRequest(
    `/empresa/contratos?palavra-chave=&id-contrato=&id-evento=&id-lote=&id-vendedor=&id-comprador=&data-inicio=${currentYear - 8}-01-01&data-fim=${currentYear + 1}-12-31&situacao=99&situacao-assinatura=99&limite=5000`,
    token,
  ),
  smartRequest(
    '/empresa/lances?id-evento=&id-lote=&id-licitante=999999&limite=5000',
    token,
  ),
  selectAll(
    'contacts?select=id,name,email,phone,preferences,smartleiloes_id,city,state,document&origin=eq.Smart%20Leil%C3%B5es',
  ),
  selectAll(
    'purchases?select=id,value,description,smartleiloes_id&description=ilike.*ID%20contrato*',
  ),
  selectAll(
    'bids?select=id,value,reason,smartleiloes_id&reason=ilike.*Smart%20Leil%C3%B5es%20ID*',
  ),
])

const contractsById = new Map(
  contracts.map((contract) => [String(contract.idContrato), contract]),
)
const bidsById = new Map(bids.map((bid) => [String(bid.idLance), bid]))

const contactUpdates = []
const contactDeletes = []
const contactMerges = []
const purchaseUpdates = []
const purchaseDeletes = []
const bidUpdates = []
let purchasesMissing = 0
let bidsMissing = 0

const contactBySmartId = new Map()
for (const contact of contacts) {
  if (contact.smartleiloes_id) {
    contactBySmartId.set(String(contact.smartleiloes_id), contact)
  }
}

for (const contact of contacts) {
  const smartId = contact.preferences?.smartleiloes_id
  if (!smartId || contact.smartleiloes_id === String(smartId)) continue

  const existing = contactBySmartId.get(String(smartId))
  if (existing && existing.id !== contact.id) {
    contactMerges.push({ from: contact.id, to: existing.id })
    contactDeletes.push(contact.id)
    continue
  }

  contactUpdates.push({
    id: contact.id,
    name: contact.name,
    email: contact.email || '',
    phone: contact.phone || '',
    smartleiloes_id: String(smartId),
    city: contact.preferences?.city || contact.city || null,
    state: contact.preferences?.state || contact.state || null,
    document: contact.preferences?.document || contact.document || null,
  })
}

for (const purchase of dbPurchases) {
  const contractId = purchase.description?.match(/ID contrato\s+(\d+)/i)?.[1]
  const contract = contractId ? contractsById.get(contractId) : null

  if (!contractId || !contract) {
    purchasesMissing += 1
    continue
  }

  if (!isSoldContract(contract)) {
    purchaseDeletes.push(purchase.id)
    continue
  }

  const value = money(contract.valorContrato)
  if (
    Number(purchase.value) === value &&
    purchase.smartleiloes_id === contractId
  ) {
    continue
  }

  purchaseUpdates.push({
    id: purchase.id,
    smartleiloes_id: contractId,
    smartleiloes_lot_id: contract.idLoteContrato
      ? String(contract.idLoteContrato)
      : null,
    smartleiloes_event_id: contract.idEventoContrato
      ? String(contract.idEventoContrato)
      : null,
    lot_number:
      contract.numeroLoteContrato ||
      (contract.idLoteContrato ? String(contract.idLoteContrato) : null),
    value,
    date: isoDate(contract.dataEmissaocontrato),
    payload: contract,
  })
}

for (const dbBid of dbBids) {
  const bidId = dbBid.reason?.match(/Smart Leilões ID\s+(\d+)/i)?.[1]
  const bid = bidId ? bidsById.get(bidId) : null

  if (!bidId || !bid) {
    bidsMissing += 1
    continue
  }

  const value = money(bid.valorLance)
  if (Number(dbBid.value) === value && dbBid.smartleiloes_id === bidId) {
    continue
  }

  bidUpdates.push({
    id: dbBid.id,
    smartleiloes_id: bidId,
    smartleiloes_lot_id: bid.idLoteLance ? String(bid.idLoteLance) : null,
    smartleiloes_event_id: bid.idEventoLance ? String(bid.idEventoLance) : null,
    lot_number:
      bid.numeroLoteLance || (bid.idLoteLance ? String(bid.idLoteLance) : null),
    value,
    date: isoDate(bid.datalance),
    payload: bid,
  })
}

let updatedContacts = []
for (const contact of contactUpdates) {
  const { id, ...body } = contact
  const updated = await patchById('contacts', id, body)
  updatedContacts = updatedContacts.concat(updated || [])
}

let mergedContacts = 0
for (const merge of contactMerges) {
  await Promise.all([
    supabaseRequest(`bids?contact_id=eq.${merge.from}`, {
      method: 'PATCH',
      body: JSON.stringify({ contact_id: merge.to }),
    }),
    supabaseRequest(`purchases?contact_id=eq.${merge.from}`, {
      method: 'PATCH',
      body: JSON.stringify({ contact_id: merge.to }),
    }),
    supabaseRequest(`contact_interactions?contact_id=eq.${merge.from}`, {
      method: 'PATCH',
      body: JSON.stringify({ contact_id: merge.to }),
    }),
    supabaseRequest(`tasks?contact_id=eq.${merge.from}`, {
      method: 'PATCH',
      body: JSON.stringify({ contact_id: merge.to }),
    }),
    supabaseRequest(`deals?contact_id=eq.${merge.from}`, {
      method: 'PATCH',
      body: JSON.stringify({ contact_id: merge.to }),
    }),
  ])
  mergedContacts += 1
}

const [updatedPurchases, updatedBids] = await Promise.all([
  upsertByIdChunked('purchases', purchaseUpdates),
  upsertByIdChunked('bids', bidUpdates),
])
const deletedPurchases = await deleteByIdsChunked('purchases', purchaseDeletes)
const deletedContacts = await deleteByIdsChunked('contacts', contactDeletes)

console.log(
  JSON.stringify(
    {
      api: {
        contracts: contracts.length,
        bids: bids.length,
      },
      database: {
        contacts: contacts.length,
        purchases: dbPurchases.length,
        bids: dbBids.length,
      },
      updated: {
        contacts: updatedContacts.length,
        purchases: updatedPurchases.length,
        bids: updatedBids.length,
      },
      deleted: {
        duplicateContacts: deletedContacts,
        canceledPurchases: deletedPurchases,
      },
      merged: {
        duplicateContacts: mergedContacts,
      },
      missingApiMatch: {
        purchases: purchasesMissing,
        bids: bidsMissing,
      },
    },
    null,
    2,
  ),
)
