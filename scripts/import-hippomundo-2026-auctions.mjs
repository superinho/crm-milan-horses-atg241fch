import crypto from 'node:crypto'
import fs from 'node:fs'

const HIPPOMUNDO_BASE_URL = 'https://www.hippomundo.com'
const DEFAULT_BROWSER_PORT = 9223
const DEFAULT_DELAY_MS = 10000

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

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=')
    return [key, rest.length ? rest.join('=') : 'true']
  }),
)

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

const browserPort = Number(args['browser-port'] || DEFAULT_BROWSER_PORT)
const delayMs = Math.max(1000, Number(args['delay-ms'] || DEFAULT_DELAY_MS))
const year = String(args.year || '2026')
const includeUpcoming = args['include-upcoming'] !== 'false'
const includePastFilters = args['include-past-filters'] !== 'false'
const summaryFile =
  args['summary-file'] || '/tmp/hippomundo-2026-import-summary.json'

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
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

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
      metadata: {
        importer: 'hippomundo-auctions-json-v1',
        year,
        include_upcoming: includeUpcoming,
        delay_ms: delayMs,
      },
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

const connectToHippomundoTab = async () => {
  const tabs = await fetch(`http://127.0.0.1:${browserPort}/json`).then((res) =>
    res.json(),
  )
  const page = tabs.find(
    (tab) => tab.type === 'page' && tab.url.includes('hippomundo.com'),
  )
  if (!page?.webSocketDebuggerUrl) {
    throw new Error(
      `No Hippomundo tab found on Chrome remote debugging port ${browserPort}.`,
    )
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 0
  const pending = new Map()
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message)
      pending.delete(message.id)
    }
  }
  await new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = reject
  })

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const nextId = ++id
      pending.set(nextId, resolve)
      ws.send(JSON.stringify({ id: nextId, method, params }))
    })

  await send('Runtime.enable')

  const evaluate = async (expression) => {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
    if (res.error || res.result?.exceptionDetails) {
      throw new Error(JSON.stringify(res))
    }
    return res.result.result.value
  }

  return { evaluate, close: () => ws.close() }
}

const fetchHippomundoJson = async (browser, query) => {
  const path = `/en/auctions?${query}`
  const response = await browser.evaluate(`
    fetch(${JSON.stringify(path)}, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json'
      }
    }).then(async (res) => ({
      status: res.status,
      contentType: res.headers.get('content-type'),
      text: await res.text()
    }))
  `)

  if (response.status !== 200) {
    throw new Error(`${response.status} fetching ${path}: ${response.text}`)
  }

  return {
    url: `${HIPPOMUNDO_BASE_URL}${path}`,
    text: response.text,
    data: JSON.parse(response.text),
  }
}

const paginationTotal = (snapshot) =>
  Number(snapshot.data.meta?.pagination?.total || 0)

const paginationPageCount = (snapshot, perPage) => {
  const total = paginationTotal(snapshot)
  if (!total) return 1
  return Math.max(1, Math.ceil(total / perPage))
}

const fetchAuctionPages = async ({ browser, coming, perPage = 100 }) => {
  const snapshots = []
  const allItems = []
  const first = await fetchHippomundoJson(
    browser,
    `page=1&per_page=${perPage}&type=auctions&coming=${
      coming ? 1 : 0
    }&year=${year}&auction_id=&sire=&json=1`,
  )

  snapshots.push(first)
  allItems.push(...(first.data.data || []))

  const pageCount = paginationPageCount(first, perPage)
  for (let page = 2; page <= pageCount; page += 1) {
    await sleep(delayMs)
    const next = await fetchHippomundoJson(
      browser,
      `page=${page}&per_page=${perPage}&type=auctions&coming=${
        coming ? 1 : 0
      }&year=${year}&auction_id=&sire=&json=1`,
    )
    snapshots.push(next)
    allItems.push(...(next.data.data || []))
  }

  return {
    first,
    snapshots,
    data: {
      ...first.data,
      data: allItems,
    },
    reportedTotal: paginationTotal(first),
  }
}

const priceNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const statusForHorse = (horse, coming) => {
  if (horse.wd) return 'withdrawn'
  if (horse.ns) return 'not_sold'
  if (coming) return 'upcoming'
  return priceNumber(horse.price) ? 'sold' : 'unknown'
}

const lotSlug = (horse) => {
  const slug = String(horse.horse_slug || '')
  const parts = slug.split('-')
  if (parts[0] === String(horse.horse_id)) parts.shift()
  return parts.join('-') || normalize(horse.horse_name).toLowerCase()
}

const lotUrl = (horse, kind = 'black') =>
  `${HIPPOMUNDO_BASE_URL}/en/auction/lot/${horse.id}-${lotSlug(horse)}/${kind}`

const auctionUrl = (auction, coming) =>
  `${HIPPOMUNDO_BASE_URL}/en/auctions?type=auctions&coming=${
    coming ? 1 : 0
  }&year=${year}&auction_id=${auction.auction?.id || ''}`

const inferCategory = (auction, horses) => {
  const lower =
    `${auction.name || ''} ${auction.auction?.name || ''}`.toLowerCase()
  if (lower.includes('foal')) return 'foal'
  if (lower.includes('embryo')) return 'embryo'
  if (lower.includes('youngster')) return 'youngster'
  if (lower.includes('stallion')) return 'stallion'
  if (
    horses.length &&
    horses.every((horse) => Number(horse.year) === Number(year))
  ) {
    return 'foal'
  }
  return 'mixed_show_jumping'
}

const mapLot = ({
  horse,
  auction,
  dbAuction,
  sourceId,
  coming,
  accessLimited,
}) => {
  const soldStatus = statusForHorse(horse, coming)
  const hammerPrice = soldStatus === 'sold' ? priceNumber(horse.price) : null
  return {
    auction_id: dbAuction.id,
    source_id: sourceId,
    lot_number: horse.sn ? String(horse.sn) : String(horse.id),
    horse_name: horse.horse_name,
    normalized_horse_name: normalize(horse.horse_name),
    birth_year: horse.year || null,
    sex: horse.sex || null,
    studbook: horse.studbook_abbrev || null,
    sire_name: horse.father_name || null,
    dam_name: horse.mother_name || null,
    dam_sire_name: horse.mother_father_name || null,
    breeder_name: horse.breeder_name || null,
    sold_status: soldStatus,
    hammer_price: hammerPrice,
    currency: 'EUR',
    price_text:
      hammerPrice !== null
        ? `€${Number(hammerPrice).toLocaleString('en-US')}`
        : null,
    discipline: 'show_jumping',
    source_url: lotUrl(horse),
    source_payload: {
      importer: 'hippomundo-auctions-json-v1',
      source: 'hippomundo',
      observed_fields_only: true,
      public_access_limited: accessLimited,
      hippomundo_edition_id: auction.id,
      hippomundo_lot_id: horse.id,
      edition_slug: auction.edition_slug,
      price_pedigree_url: lotUrl(horse, 'price'),
      auction_url: auctionUrl(auction, coming),
      raw: horse,
    },
    confidence_score: accessLimited ? 82 : 92,
  }
}

const ensureSourceAndHouse = async (auction) => {
  const source = await upsertOne(
    'global_auction_sources',
    {
      name: 'Hippomundo',
      source_type: 'market_database',
      website_url: `${HIPPOMUNDO_BASE_URL}/en`,
      results_url: `${HIPPOMUNDO_BASE_URL}/en/auctions`,
      discipline_scope: 'show_jumping',
      scrape_strategy: 'browser_json_endpoint',
      access_level: 'public',
      status: 'active',
      notes:
        'Hippomundo Auctions JSON consulted through the public rendered Auctions section. Source URLs are preserved per auction and lot.',
    },
    'name',
  )

  const houseName = auction.auction?.name || 'Hippomundo'
  const house = await upsertOne(
    'global_auction_houses',
    {
      source_id: source.id,
      name: houseName,
      normalized_name: normalize(`Hippomundo ${houseName}`),
      country: auction.auction?.iso_code || null,
      website_url: auction.auction?.url || null,
      notes: auction.auction?.slug
        ? `Hippomundo auction house slug: ${auction.auction.slug}`
        : null,
    },
    'normalized_name',
  )

  return { source, house }
}

const importAuction = async ({
  source,
  house,
  auction,
  coming,
  accessLimited,
}) => {
  const horses = Array.isArray(auction.horses) ? auction.horses : []
  const dbAuction = await upsertOne(
    'global_auctions',
    {
      house_id: house.id,
      source_id: source.id,
      name: `${auction.auction?.name || 'Hippomundo'} ${auction.name}`,
      normalized_name: normalize(`hippomundo ${auction.id} ${auction.name}`),
      auction_year: Number(year),
      auction_date: auction.date || null,
      country: auction.auction?.iso_code || null,
      discipline: 'show_jumping',
      category: inferCategory(auction, horses),
      source_url: auctionUrl(auction, coming),
      source_payload: {
        importer: 'hippomundo-auctions-json-v1',
        source: 'hippomundo',
        observed_fields_only: true,
        public_access_limited: accessLimited,
        hippomundo_edition_id: auction.id,
        edition_slug: auction.edition_slug,
        status: coming ? 'upcoming' : 'past',
        number_of_horses: auction.number_of_horses || horses.length,
        public_horses_returned: horses.length,
        raw_auction: {
          id: auction.id,
          name: auction.name,
          date: auction.date,
          auction: auction.auction,
          created_at: auction.created_at,
          updated_at: auction.updated_at,
        },
      },
    },
    'source_id,normalized_name,auction_year',
  )

  const lots = horses
    .filter((horse) => horse?.horse_name)
    .map((horse) =>
      mapLot({
        horse,
        auction,
        dbAuction,
        sourceId: source.id,
        coming,
        accessLimited,
      }),
    )

  const uniqueLots = Array.from(
    new Map(
      lots.map((lot) => [
        `${lot.auction_id}|${lot.lot_number}|${lot.normalized_horse_name}`,
        lot,
      ]),
    ).values(),
  )

  if (uniqueLots.length) {
    await supabaseRequest(
      'global_auction_lots?on_conflict=auction_id,lot_number,normalized_horse_name',
      {
        method: 'POST',
        headers: {
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(uniqueLots),
      },
    )
  }

  return {
    auction: dbAuction,
    lotsImported: uniqueLots.length,
    lotsSkippedAsDuplicates: lots.length - uniqueLots.length,
  }
}

const dedupeAuctions = (items) => {
  const seen = new Set()
  const out = []
  for (const item of items) {
    const key = String(item.id)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

const main = async () => {
  const browser = await connectToHippomundoTab()
  let run = null

  try {
    const upcomingPages = includeUpcoming
      ? await fetchAuctionPages({
          browser,
          coming: true,
          perPage: 100,
        })
      : {
          first: null,
          snapshots: [],
          data: { data: [] },
          reportedTotal: 0,
        }

    const snapshots = [...upcomingPages.snapshots]
    const upcoming = upcomingPages.data

    if (includeUpcoming) {
      await sleep(delayMs)
    }

    const pastPages = await fetchAuctionPages({
      browser,
      coming: false,
      perPage: 100,
    })
    snapshots.push(...pastPages.snapshots)
    const past = pastPages.data
    const { source } = await ensureSourceAndHouse(
      upcoming.data?.[0] || past.data?.[0] || {},
    )
    run = await createRun(
      source.id,
      upcomingPages.first?.url || pastPages.first.url,
    )

    const metaAuctionIds = (past.meta?.auctions || [])
      .map((auction) => auction.id)
      .filter(Boolean)
    const pastFiltered = []

    if (includePastFilters) {
      for (const auctionId of metaAuctionIds) {
        await sleep(delayMs)
        const filtered = await fetchHippomundoJson(
          browser,
          `page=1&per_page=100&type=auctions&coming=0&year=${year}&auction_id=${auctionId}&sire=&json=1`,
        )
        snapshots.push(filtered)
        pastFiltered.push(...(filtered.data.data || []))
      }
    }

    for (const snapshot of snapshots) {
      await upsertOne(
        'global_auction_source_snapshots',
        {
          source_id: source.id,
          import_run_id: run.id,
          source_url: snapshot.url,
          content_type: 'application/json',
          checksum: checksum(snapshot.text),
          metadata: {
            bytes: snapshot.text.length,
            importer: 'hippomundo-auctions-json-v1',
            captured_at: new Date().toISOString(),
          },
        },
        'source_url,checksum',
      )
    }

    const upcomingAuctions = dedupeAuctions(upcoming.data || [])
    const pastPublicAuctions = dedupeAuctions([
      ...(past.data || []),
      ...pastFiltered,
    ])
    const allAuctions = [
      ...upcomingAuctions.map((auction) => ({
        auction,
        coming: true,
        accessLimited: false,
      })),
      ...pastPublicAuctions.map((auction) => ({
        auction,
        coming: false,
        accessLimited:
          Number(auction.number_of_horses || 0) >
          Number((auction.horses || []).length),
      })),
    ]

    let rowsSeen = 0
    let rowsImported = 0
    let rowsSkipped = 0
    let auctionsImported = 0
    const importedAuctions = []

    for (const item of allAuctions) {
      const { source: auctionSource, house } = await ensureSourceAndHouse(
        item.auction,
      )
      const result = await importAuction({
        source: auctionSource,
        house,
        auction: item.auction,
        coming: item.coming,
        accessLimited: item.accessLimited,
      })
      rowsSeen += item.auction.horses?.length || 0
      rowsImported += result.lotsImported
      rowsSkipped += result.lotsSkippedAsDuplicates || 0
      auctionsImported += 1
      importedAuctions.push({
        id: item.auction.id,
        name: `${item.auction.auction?.name || ''} ${item.auction.name}`.trim(),
        date: item.auction.date,
        status: item.coming ? 'upcoming' : 'past',
        horses_public: item.auction.horses?.length || 0,
        horses_reported: item.auction.number_of_horses || null,
        access_limited: item.accessLimited,
      })
    }

    const pastReported = Number(pastPages.reportedTotal || 0)
    const pastImported = pastPublicAuctions.length
    const missingPastAuctions = Math.max(0, pastReported - pastImported)

    const summary = {
      status: missingPastAuctions ? 'partial_access_limited' : 'finished',
      year,
      source: 'Hippomundo',
      delay_ms: delayMs,
      upcoming_reported: upcomingPages.reportedTotal || upcomingAuctions.length,
      upcoming_imported: upcomingAuctions.length,
      past_reported: pastReported,
      past_public_imported: pastImported,
      missing_past_auctions: missingPastAuctions,
      auctions_imported: auctionsImported,
      lots_seen: rowsSeen,
      lots_imported: rowsImported,
      lots_skipped_as_duplicate_payload_rows: rowsSkipped,
      imported_auctions: importedAuctions,
    }

    await finishRun(run.id, {
      status: missingPastAuctions ? 'completed_with_warnings' : 'finished',
      rows_seen: rowsSeen,
      rows_imported: rowsImported,
      rows_skipped: rowsSkipped,
      error_message: missingPastAuctions
        ? `Public logged-out endpoint reported ${pastReported} past ${year} auctions but returned ${pastImported}. Login/subscription may be required for full past coverage.`
        : null,
      metadata: summary,
    })

    fs.writeFileSync(summaryFile, `${JSON.stringify(summary, null, 2)}\n`)
    console.log(JSON.stringify(summary, null, 2))

    if (missingPastAuctions && args['require-complete'] === 'true') {
      process.exitCode = 2
    }
  } catch (error) {
    if (run?.id) {
      await finishRun(run.id, {
        status: 'failed',
        error_message: error.message,
      })
    }
    throw error
  } finally {
    browser.close()
  }
}

await main()
