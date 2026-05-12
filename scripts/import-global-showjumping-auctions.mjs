import crypto from 'node:crypto'
import fs from 'node:fs'

const GORESBRIDGE_RESULTS_URL = 'https://goresbridge.com/showjumping/results/'
const USER_AGENT =
  'CRM Milan Horses market research importer (+https://milan.horses)'

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

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const SUPABASE_KEY =
  env.SUPABASE_SECRET_KEY ||
  env.SUPABASE_SERVICE_ROLE_KEY ||
  env.SUPABASE_SERVICE_ROLE

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    'Missing VITE_SUPABASE_URL/SUPABASE_URL and SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY.',
  )
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

const checksum = (value) =>
  crypto.createHash('sha1').update(value).digest('hex')

const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&amp;/g, '&')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()

const decodeHtml = (value) =>
  String(value || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#8217;|&#039;|&rsquo;/g, "'")
    .replace(/&#8211;|&ndash;/g, '-')
    .replace(/&#038;|&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&euro;/g, '€')
    .replace(/\s+/g, ' ')
    .trim()

const textOrNull = (value) => {
  const text = decodeHtml(value)
  return text ? text : null
}

const numberFromPrice = (value) => {
  const text = String(value || '').trim()
  if (!text || /^(n\/s|not sold|withdrawn)$/i.test(text)) return null
  const clean = text.replace(/[€£$(),\s]/g, '')
  const valueNumber = Number(clean)
  return Number.isFinite(valueNumber) ? valueNumber : null
}

const soldStatus = ({ buyer, price }) => {
  const joined = `${buyer || ''} ${price || ''}`.toLowerCase()
  if (joined.includes('withdrawn')) return 'withdrawn'
  if (joined.includes('not sold') || joined.includes('n/s')) return 'not_sold'
  return numberFromPrice(price) ? 'sold' : 'unknown'
}

const yearFromTitle = (title) => {
  const match = String(title || '').match(/\b(20\d{2})\b/)
  return match ? Number(match[1]) : null
}

const categoryFromTitle = (title) => {
  const lower = String(title || '').toLowerCase()
  if (lower.includes('foal')) return 'foal'
  if (lower.includes('3 yr') || lower.includes('3yo')) return '3yo'
  return 'sport_horse'
}

const skipAuctionTitle = (title) => /eventer/i.test(title)

const supabaseRequest = async (path, init = {}) => {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      ...headers,
      ...(init.headers || {}),
    },
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} ${path}: ${text}`)
  }
  return text ? JSON.parse(text) : null
}

const upsertOne = async (path, payload, onConflict) => {
  const data = await supabaseRequest(`${path}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(payload),
  })
  return data?.[0]
}

const createRun = async (sourceId, sourceUrl) => {
  const [run] = await supabaseRequest('global_auction_import_runs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      source_id: sourceId,
      source_url: sourceUrl,
      status: 'running',
      metadata: { importer: 'goresbridge-html-v1' },
    }),
  })
  return run
}

const finishRun = async (id, payload) => {
  await supabaseRequest(`global_auction_import_runs?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      ...payload,
      finished_at: new Date().toISOString(),
    }),
  })
}

const parseTables = (html) => {
  const titles = [
    ...html.matchAll(
      /<div[^>]+class="[^"]*elementor-tab-title[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    ),
  ]
    .map((match) => textOrNull(match[1]))
    .filter(Boolean)
  const uniqueTitles = [...new Set(titles)]
  const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)].map(
    (match) => match[0],
  )

  return tables.map((tableHtml, index) => ({
    title:
      uniqueTitles[index] || `Goresbridge Showjumping Results ${index + 1}`,
    tableHtml,
  }))
}

const parseTableRows = (tableHtml) => {
  const headers = [...tableHtml.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map(
    (match) => normalize(decodeHtml(match[1])),
  )
  const rowMatches = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]

  return rowMatches
    .map((rowMatch) => {
      const cells = [
        ...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi),
      ].map((match) => textOrNull(match[1]) || '')
      if (!cells.length) return null
      return Object.fromEntries(
        cells.map((cell, index) => [
          headers[index] || `COL_${index + 1}`,
          cell,
        ]),
      )
    })
    .filter(Boolean)
}

const pick = (row, names) => {
  for (const name of names) {
    const key = normalize(name)
    if (row[key]) return row[key]
  }
  return null
}

const rowToLot = ({ row, auction, sourceId, sourceUrl }) => {
  const horseName =
    pick(row, ['Horse Name', 'Name']) ||
    (auction.category === 'foal' ? 'Unnamed foal' : null)
  if (!horseName) return null

  const buyer = pick(row, ['Buyer', 'Purchaser'])
  const priceText = pick(row, ['Euro', 'EUR', 'Price'])
  const status = soldStatus({ buyer, price: priceText })

  return {
    auction_id: auction.id,
    source_id: sourceId,
    lot_number: pick(row, ['Lot']),
    horse_name: horseName,
    normalized_horse_name: normalize(horseName),
    sex: pick(row, ['Sex', 'Gender']),
    color: pick(row, ['Colour', 'Color']),
    sire_name: pick(row, ['Sire']),
    dam_name: pick(row, ['Dam']),
    dam_sire_name: pick(row, ['Damsire', 'Dam Sire']),
    vendor_name: pick(row, ['Vendor']),
    buyer_name: /not sold|withdrawn|n\/s/i.test(buyer || '') ? null : buyer,
    sold_status: status,
    hammer_price: status === 'sold' ? numberFromPrice(priceText) : null,
    currency: 'EUR',
    price_text: priceText,
    discipline: 'show_jumping',
    source_url: sourceUrl,
    source_payload: {
      raw: row,
      importer: 'goresbridge-html-v1',
      auction_title: auction.name,
    },
    confidence_score: auction.category === 'foal' ? 72 : 82,
  }
}

const main = async () => {
  const source = await upsertOne(
    'global_auction_sources',
    {
      name: 'Goresbridge Showjumping',
      source_type: 'auction_house',
      country: 'Ireland',
      website_url: 'https://goresbridge.com',
      results_url: GORESBRIDGE_RESULTS_URL,
      discipline_scope: 'show_jumping',
      scrape_strategy: 'html_table',
      access_level: 'public',
      status: 'active',
      notes:
        'Public showjumping auction result tables. Imported with rate-limited HTML parsing.',
    },
    'name',
  )

  const house = await upsertOne(
    'global_auction_houses',
    {
      source_id: source.id,
      name: 'Goresbridge',
      normalized_name: normalize('Goresbridge'),
      country: 'Ireland',
      website_url: 'https://goresbridge.com',
    },
    'normalized_name',
  )

  const run = await createRun(source.id, GORESBRIDGE_RESULTS_URL)

  try {
    const res = await fetch(GORESBRIDGE_RESULTS_URL, {
      headers: { 'user-agent': USER_AGENT },
    })
    const html = await res.text()
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}: ${html.slice(0, 300)}`)
    }

    await upsertOne(
      'global_auction_source_snapshots',
      {
        source_id: source.id,
        import_run_id: run.id,
        source_url: GORESBRIDGE_RESULTS_URL,
        content_type: res.headers.get('content-type'),
        checksum: checksum(html),
        metadata: { bytes: html.length },
      },
      'source_url,checksum',
    )

    let rowsSeen = 0
    let rowsSkipped = 0
    let rowsImported = 0

    for (const { title, tableHtml } of parseTables(html)) {
      if (skipAuctionTitle(title)) {
        rowsSkipped += parseTableRows(tableHtml).length
        continue
      }

      const auction = await upsertOne(
        'global_auctions',
        {
          house_id: house.id,
          source_id: source.id,
          name: title,
          normalized_name: normalize(title),
          auction_year: yearFromTitle(title),
          country: 'Ireland',
          discipline: 'show_jumping',
          category: categoryFromTitle(title),
          source_url: GORESBRIDGE_RESULTS_URL,
          source_payload: { importer: 'goresbridge-html-v1' },
        },
        'source_id,normalized_name,auction_year',
      )

      const rows = parseTableRows(tableHtml)
      rowsSeen += rows.length
      const lots = rows
        .map((row) =>
          rowToLot({
            row,
            auction,
            sourceId: source.id,
            sourceUrl: GORESBRIDGE_RESULTS_URL,
          }),
        )
        .filter(Boolean)

      if (!lots.length) continue

      const imported = await supabaseRequest(
        'global_auction_lots?on_conflict=auction_id,lot_number,normalized_horse_name',
        {
          method: 'POST',
          headers: {
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify(lots),
        },
      )
      rowsImported += imported?.length || 0
      rowsSkipped += rows.length - lots.length
    }

    await finishRun(run.id, {
      status: 'finished',
      rows_seen: rowsSeen,
      rows_imported: rowsImported,
      rows_skipped: rowsSkipped,
    })

    console.log(
      JSON.stringify(
        {
          source: source.name,
          status: 'finished',
          rowsSeen,
          rowsImported,
          rowsSkipped,
        },
        null,
        2,
      ),
    )
  } catch (error) {
    await finishRun(run.id, {
      status: 'failed',
      error_message: error.message,
    })
    throw error
  }
}

await main()
