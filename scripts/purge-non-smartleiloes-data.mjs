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
  ...process.env,
}

const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_KEY =
  env.SUPABASE_SECRET_KEY ||
  env.SUPABASE_SERVICE_ROLE_KEY ||
  env.SUPABASE_SERVICE_ROLE

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL and a Supabase server key.')
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

const request = async (path, init = {}) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
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
    const page = await request(
      `${path}${separator}limit=${pageSize}&offset=${offset}`,
    )
    rows.push(...(page || []))
    if (!page || page.length < pageSize) break
  }

  return rows
}

const deleteByIds = async (table, ids, chunkSize = 250) => {
  let deleted = 0
  if (!ids.length) return deleted

  for (let index = 0; index < ids.length; index += chunkSize) {
    const chunk = ids.slice(index, index + chunkSize)
    const rows = await request(`${table}?id=in.(${chunk.join(',')})`, {
      method: 'DELETE',
    })
    deleted += rows?.length || 0
  }

  return deleted
}

const count = async (table) => {
  const rows = await request(`${table}?select=id`, {
    method: 'HEAD',
    headers: { Prefer: 'count=exact' },
  }).catch(() => null)
  return rows
}

const nonSmartContacts = await selectAll(
  'contacts?select=id,name,email,origin,smartleiloes_id&or=(origin.is.null,origin.neq.Smart%20Leil%C3%B5es,smartleiloes_id.is.null)',
)
const nonSmartContactIds = nonSmartContacts.map((contact) => contact.id)

const [deals, tasksByContact, interactionsByContact] = await Promise.all([
  nonSmartContactIds.length
    ? selectAll(
        `deals?select=id,contact_id&contact_id=in.(${nonSmartContactIds.join(',')})`,
      )
    : [],
  nonSmartContactIds.length
    ? selectAll(
        `tasks?select=id,contact_id&contact_id=in.(${nonSmartContactIds.join(',')})`,
      )
    : [],
  nonSmartContactIds.length
    ? selectAll(
        `contact_interactions?select=id,contact_id&contact_id=in.(${nonSmartContactIds.join(',')})`,
      )
    : [],
])

const dealIds = deals.map((deal) => deal.id)
const tasksByDeal = dealIds.length
  ? await selectAll(`tasks?select=id,deal_id&deal_id=in.(${dealIds.join(',')})`)
  : []
const interactionByDeal = dealIds.length
  ? await selectAll(
      `contact_interactions?select=id,deal_id&deal_id=in.(${dealIds.join(',')})`,
    )
  : []

const nonSmartPurchaseIds = (
  await selectAll('purchases?select=id,smartleiloes_id&smartleiloes_id=is.null')
).map((purchase) => purchase.id)
const nonSmartBidIds = (
  await selectAll('bids?select=id,smartleiloes_id&smartleiloes_id=is.null')
).map((bid) => bid.id)

const taskIds = [
  ...new Set([...tasksByContact, ...tasksByDeal].map((task) => task.id)),
]
const interactionIds = [
  ...new Set(
    [...interactionsByContact, ...interactionByDeal].map(
      (interaction) => interaction.id,
    ),
  ),
]

const deleted = {
  tasks: await deleteByIds('tasks', taskIds),
  interactions: await deleteByIds('contact_interactions', interactionIds),
  deals: await deleteByIds('deals', dealIds),
  purchasesWithoutSmartId: await deleteByIds('purchases', nonSmartPurchaseIds),
  bidsWithoutSmartId: await deleteByIds('bids', nonSmartBidIds),
  contacts: await deleteByIds('contacts', nonSmartContactIds),
}

const remainingNonSmart = await selectAll(
  'contacts?select=id,name,email,origin,smartleiloes_id&or=(origin.is.null,origin.neq.Smart%20Leil%C3%B5es,smartleiloes_id.is.null)',
)
const [remainingFakePurchases, remainingFakeBids] = await Promise.all([
  selectAll('purchases?select=id&smartleiloes_id=is.null'),
  selectAll('bids?select=id&smartleiloes_id=is.null'),
])

console.log(
  JSON.stringify(
    {
      found: {
        nonSmartContacts: nonSmartContacts.length,
        deals: deals.length,
        tasks: taskIds.length,
        interactions: interactionIds.length,
        purchasesWithoutSmartId: nonSmartPurchaseIds.length,
        bidsWithoutSmartId: nonSmartBidIds.length,
      },
      deleted,
      remaining: {
        nonSmartContacts: remainingNonSmart.length,
        purchasesWithoutSmartId: remainingFakePurchases.length,
        bidsWithoutSmartId: remainingFakeBids.length,
      },
    },
    null,
    2,
  ),
)
