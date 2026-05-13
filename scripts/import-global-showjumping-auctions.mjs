import crypto from 'node:crypto'
import fs from 'node:fs'

const GORESBRIDGE_RESULTS_URL = 'https://goresbridge.com/showjumping/results/'
const FLANDERS_BASE_URL = 'https://flandersfoalauction.be'
const FLANDERS_AUCTION_URLS = [
  '/en/veiling/Flanders-Foal-Auction-at-Sentower-Park-87',
  '/en/veiling/Flanders-Foal-Auction-at-Sentower-Park-88',
  '/en/veiling/Flanders-Foal-Auction-at-Sentower-Park-89',
  '/en/veiling/Flanders-Foal-Auction-at-Sentower-Park-90',
  '/en/veiling/Flanders-Foal-Auction-at-Hetzel-Stables',
  '/en/veiling/Flanders-Foal-Auction-95',
  '/en/veiling/Flanders-Foal-Auction-1000',
  '/en/veiling/Flanders-Foal-Auction-OpglabbeekAugust2024',
].map((path) => `${FLANDERS_BASE_URL}${path}`)
const ZANGERSHEIDE_BASE_URL = 'https://www.zangersheide.com'
const ZANGERSHEIDE_AUCTION_URLS = [
  '/en/auctions/zangersheide-quality-auction-friday-foals-2',
  '/en/auctions/zangersheide-quality-auction-saturday-foals-2',
].map((path) => `${ZANGERSHEIDE_BASE_URL}${path}`)
const YOUHORSE_BASE_URL = 'https://youhorse.auction'
const YOUHORSE_COLLECTION_IDS = Array.from(
  { length: 44 },
  (_, index) => 50 + index,
)
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
  let clean = text.replace(/[€£$]/g, '').replace(/\s+/g, '').trim()

  if (clean.includes('.') && clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.')
  } else if (clean.includes(',') && /,\d{3}$/.test(clean)) {
    clean = clean.replace(/,/g, '')
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.')
  } else if (clean.includes('.') && /\.\d{3}$/.test(clean)) {
    clean = clean.replace(/\./g, '')
  }

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

const fetchHtml = async (url, attempts = 3) => {
  let lastError

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': USER_AGENT },
        signal: AbortSignal.timeout(20000),
      })
      const html = await res.text()
      return {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        contentType: res.headers.get('content-type'),
        html,
      }
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 750 * attempt))
      }
    }
  }

  throw lastError
}

const upsertOne = async (path, payload, onConflict) => {
  const data = await supabaseRequest(`${path}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(payload),
  })
  return data?.[0]
}

const createRun = async (sourceId, sourceUrl, importer) => {
  const [run] = await supabaseRequest('global_auction_import_runs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      source_id: sourceId,
      source_url: sourceUrl,
      status: 'running',
      metadata: { importer },
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

const textBetween = (html, regex) => {
  const match = String(html || '').match(regex)
  return match ? textOrNull(match[1]) : null
}

const inferFlandersYear = ({ html, title, url }) => {
  const whenText = decodeHtml(
    String(html || '').match(/When:[\s\S]{0,800}/i)?.[0] || '',
  )
  const directMatch = `${title || ''} ${whenText} ${url || ''}`.match(
    /\b(202[0-9])\b/,
  )
  if (directMatch) return Number(directMatch[1])

  const imageYearMatch = String(html || '').match(
    /paard[^"']*?(202[0-9])-\d{2}-\d{2}/i,
  )
  if (imageYearMatch) return Number(imageYearMatch[1])

  if (url.includes('Sentower-Park-87')) return 2023
  if (url.includes('Sentower-Park-88')) return 2025
  if (url.includes('Sentower-Park-89')) return 2025
  if (url.includes('Sentower-Park-90')) return 2025
  if (url.includes('Flanders-Foal-Auction-at-Hetzel-Stables')) return 2025
  if (url.includes('Flanders-Foal-Auction-95')) return 2024
  if (url.includes('Flanders-Foal-Auction-1000')) return 2024
  if (url.includes('OpglabbeekAugust2024')) return 2024
  return null
}

const inferZangersheideYear = (html) => {
  const endedMatch = String(html || '').match(
    /Auction ended on[\s\S]*?(\d{2})\/(\d{2})\/(\d{2})/i,
  )
  if (endedMatch) return 2000 + Number(endedMatch[3])
  return yearFromTitle(html) || 2025
}

const yearFromEndedText = (value) => {
  const text = decodeHtml(value)
  const direct = text.match(/\b(20\d{2})\b/)
  if (direct) return Number(direct[1])

  const shortDate = text.match(/\b\d{1,2}\/\d{1,2}\/(\d{2})\b/)
  if (shortDate) return 2000 + Number(shortDate[1])

  return null
}

const parseFlandersCards = (html) =>
  [
    ...html.matchAll(
      /<div class="single-item collectie-single-item[\s\S]*?<\/a>\s*<\/div>\s*<\/div>/gi,
    ),
  ]
    .map((match) => match[0])
    .map((card) => {
      const href = textBetween(card, /<a href="([^"]+)"/i)
      const lotNumber = textBetween(
        card,
        /<p class="catnr[^"]*">([\s\S]*?)<\/p>/i,
      )
      const horseName = textBetween(
        card,
        /<h3 class="paard_naam">([\s\S]*?)<\/h3>/i,
      )
      const slogan = textBetween(
        card,
        /<p class="text-slogan[^"]*">([\s\S]*?)<\/p>/i,
      )
      const pedigree = textBetween(
        card,
        /<p class="font-weight-600 paard_pedigree">([\s\S]*?)<\/p>/i,
      )
      const sex = textBetween(card, /<p class="mb-0"><b>([\s\S]*?)<\/b><\/p>/i)
      const priceText =
        textBetween(card, /<b>Selling price:<\/b>\s*([\s\S]*?)<\/p>/i) ||
        (card.match(/Not sold/i) ? 'Not sold' : null)
      const [sireName, damSireName] = String(pedigree || '')
        .split(/\s+x\s+/i)
        .map((part) => part.trim())

      return {
        href,
        lotNumber,
        horseName,
        slogan,
        pedigree,
        sex,
        sireName: sireName || null,
        damSireName: damSireName || null,
        priceText,
      }
    })
    .filter((lot) => lot.horseName)

const importFlandersFoalAuctions = async () => {
  const source = await upsertOne(
    'global_auction_sources',
    {
      name: 'Flanders Foal Auction',
      source_type: 'auction_house',
      country: 'Belgium',
      website_url: FLANDERS_BASE_URL,
      results_url: `${FLANDERS_BASE_URL}/en/veilingen`,
      discipline_scope: 'show_jumping',
      scrape_strategy: 'html_cards',
      access_level: 'public',
      status: 'active',
      notes:
        'Public Flanders foal auction pages with lot cards, pedigree and selling price.',
    },
    'name',
  )

  const house = await upsertOne(
    'global_auction_houses',
    {
      source_id: source.id,
      name: 'Flanders Foal Auction',
      normalized_name: normalize('Flanders Foal Auction'),
      country: 'Belgium',
      website_url: FLANDERS_BASE_URL,
    },
    'normalized_name',
  )

  const run = await createRun(
    source.id,
    FLANDERS_BASE_URL,
    'flanders-foal-html-v1',
  )

  try {
    let rowsSeen = 0
    let rowsSkipped = 0
    let rowsImported = 0
    let auctionsImported = 0

    for (const sourceUrl of FLANDERS_AUCTION_URLS) {
      let page
      try {
        page = await fetchHtml(sourceUrl)
      } catch {
        rowsSkipped += 1
        continue
      }
      const html = page.html
      if (!page.ok) {
        rowsSkipped += 1
        continue
      }

      await upsertOne(
        'global_auction_source_snapshots',
        {
          source_id: source.id,
          import_run_id: run.id,
          source_url: sourceUrl,
          content_type: page.contentType,
          checksum: checksum(html),
          metadata: { bytes: html.length },
        },
        'source_url,checksum',
      )

      const headings = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
        .map((match) => textOrNull(match[1]))
        .filter(Boolean)
      const title = headings[0] || headings[1] || 'Flanders Foal Auction'
      const year = inferFlandersYear({ html, title, url: sourceUrl })
      const lots = parseFlandersCards(html)
      rowsSeen += lots.length

      if (!lots.length) continue

      const auction = await upsertOne(
        'global_auctions',
        {
          house_id: house.id,
          source_id: source.id,
          name: title,
          normalized_name: normalize(`${title} ${sourceUrl.split('/').pop()}`),
          auction_year: year,
          country: 'Belgium',
          discipline: 'show_jumping',
          category: 'foal',
          source_url: sourceUrl,
          source_payload: {
            importer: 'flanders-foal-html-v1',
            headings,
          },
        },
        'source_id,normalized_name,auction_year',
      )
      auctionsImported += 1

      const payload = lots
        .map((lot) => {
          const status = soldStatus({ buyer: null, price: lot.priceText })
          return {
            auction_id: auction.id,
            source_id: source.id,
            lot_number: lot.lotNumber,
            horse_name: lot.horseName,
            normalized_horse_name: normalize(lot.horseName),
            birth_year: year,
            age: year ? 0 : null,
            sex: lot.sex,
            sire_name: lot.sireName,
            dam_sire_name: lot.damSireName,
            sold_status: status,
            hammer_price:
              status === 'sold' ? numberFromPrice(lot.priceText) : null,
            currency: 'EUR',
            price_text: lot.priceText,
            discipline: 'show_jumping',
            source_url: lot.href?.startsWith('http')
              ? lot.href
              : `${FLANDERS_BASE_URL}${lot.href || ''}`,
            source_payload: {
              importer: 'flanders-foal-html-v1',
              pedigree: lot.pedigree,
              slogan: lot.slogan,
              auction_url: sourceUrl,
            },
            confidence_score: 78,
          }
        })
        .filter((lot) => lot.horse_name)

      const imported = await supabaseRequest(
        'global_auction_lots?on_conflict=auction_id,lot_number,normalized_horse_name',
        {
          method: 'POST',
          headers: {
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify(payload),
        },
      )
      rowsImported += imported?.length || 0
      rowsSkipped += lots.length - payload.length
    }

    await finishRun(run.id, {
      status: 'finished',
      rows_seen: rowsSeen,
      rows_imported: rowsImported,
      rows_skipped: rowsSkipped,
      metadata: { auctions_imported: auctionsImported },
    })

    return {
      source: source.name,
      status: 'finished',
      auctionsImported,
      rowsSeen,
      rowsImported,
      rowsSkipped,
    }
  } catch (error) {
    await finishRun(run.id, {
      status: 'failed',
      error_message: error.message,
    })
    throw error
  }
}

const parseZangersheideTiles = (html) =>
  [
    ...String(html).matchAll(
      /<div\s+data-price="[^"]*"[\s\S]*?(?=<div\s+data-price="[^"]*"|$)/gi,
    ),
  ]
    .map((match) => match[0])
    .map((tile) => {
      const itemJson = tile.match(
        /data-datalayer--action-event-data-value="([^"]+)"/i,
      )?.[1]
      const decodedJson = itemJson
        ? decodeHtml(itemJson)
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
        : null
      let itemName = null
      try {
        itemName = decodedJson
          ? JSON.parse(decodedJson)?.items?.[0]?.item_name
          : null
      } catch {
        itemName = null
      }

      const title =
        itemName ||
        textBetween(tile, /<h3[\s\S]*?title="([^"]+)"/i) ||
        textBetween(tile, /<h3[\s\S]*?>([\s\S]*?)<\/h3>/i)?.replace(
          /^\d+\.\s*/,
          '',
        )
      const lotNumber = textBetween(tile, /<h3[\s\S]*?>\s*[\s\S]*?(\d+)\.\s*/i)
      const pedigree = textBetween(
        tile,
        /<span\s+class="text-skin-base[^"]*">[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i,
      )
      const [sireName, damSireName] = String(pedigree || '')
        .split(/\s+-\s+/)
        .map((part) => part.trim())
      const sex = textBetween(
        tile,
        /<h5[\s\S]*?<span>\s*([A-Za-z]+)\s*<\/span>/i,
      )
      const birthYear = Number(
        textBetween(tile, /°<span[^>]*>\s*(20\d{2})\s*<\/span>/i),
      )
      const priceText = textBetween(
        tile,
        /Selling price[\s\S]*?<span\s+class="">\s*([^<]+)\s*<\/span>/i,
      )
      const soldTo = textBetween(tile, /Sold to[\s\S]*?title="([^"]+)"/i)
      const notAuctioned = /Not auctioned/i.test(tile)
      const status = notAuctioned
        ? 'withdrawn'
        : soldStatus({ buyer: soldTo, price: priceText })

      return {
        lotNumber,
        horseName: title,
        birthYear: Number.isFinite(birthYear) ? birthYear : null,
        sex,
        sireName: sireName || null,
        damSireName: damSireName || null,
        priceText,
        soldTo,
        status,
      }
    })
    .filter((lot) => lot.horseName)

const importZangersheideAuctions = async () => {
  const source = await upsertOne(
    'global_auction_sources',
    {
      name: 'Zangersheide Auctions',
      source_type: 'studbook_auction',
      country: 'Belgium',
      website_url: ZANGERSHEIDE_BASE_URL,
      results_url: `${ZANGERSHEIDE_BASE_URL}/en/auctions`,
      discipline_scope: 'show_jumping',
      scrape_strategy: 'html_cards',
      access_level: 'public',
      status: 'active',
      notes:
        'Public Zangersheide auction pages with selling price, pedigree and buyer country.',
    },
    'name',
  )

  const house = await upsertOne(
    'global_auction_houses',
    {
      source_id: source.id,
      name: 'Zangersheide Auctions',
      normalized_name: normalize('Zangersheide Auctions'),
      country: 'Belgium',
      website_url: ZANGERSHEIDE_BASE_URL,
    },
    'normalized_name',
  )

  const run = await createRun(
    source.id,
    ZANGERSHEIDE_BASE_URL,
    'zangersheide-auction-html-v1',
  )

  try {
    let rowsSeen = 0
    let rowsSkipped = 0
    let rowsImported = 0
    let auctionsImported = 0

    for (const sourceUrl of ZANGERSHEIDE_AUCTION_URLS) {
      let page
      try {
        page = await fetchHtml(sourceUrl)
      } catch {
        rowsSkipped += 1
        continue
      }
      const html = page.html
      if (!page.ok) {
        rowsSkipped += 1
        continue
      }

      await upsertOne(
        'global_auction_source_snapshots',
        {
          source_id: source.id,
          import_run_id: run.id,
          source_url: sourceUrl,
          content_type: page.contentType,
          checksum: checksum(html),
          metadata: { bytes: html.length },
        },
        'source_url,checksum',
      )

      const pageTitle =
        textBetween(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
        textBetween(html, /<title[^>]*>([\s\S]*?)<\/title>/i) ||
        sourceUrl.split('/').pop()
      const lots = parseZangersheideTiles(html)
      rowsSeen += lots.length

      if (!lots.length) continue

      const auction = await upsertOne(
        'global_auctions',
        {
          house_id: house.id,
          source_id: source.id,
          name: pageTitle,
          normalized_name: normalize(pageTitle),
          auction_year: inferZangersheideYear(html),
          country: 'Belgium',
          discipline: 'show_jumping',
          category: 'foal',
          source_url: sourceUrl,
          source_payload: { importer: 'zangersheide-auction-html-v1' },
        },
        'source_id,normalized_name,auction_year',
      )
      auctionsImported += 1

      const payload = lots.map((lot) => ({
        auction_id: auction.id,
        source_id: source.id,
        lot_number: lot.lotNumber,
        horse_name: lot.horseName,
        normalized_horse_name: normalize(lot.horseName),
        birth_year: lot.birthYear,
        age: lot.birthYear ? 0 : null,
        sex: lot.sex,
        studbook: 'Zangersheide',
        sire_name: lot.sireName,
        dam_sire_name: lot.damSireName,
        buyer_country: lot.soldTo,
        sold_status: lot.status,
        hammer_price:
          lot.status === 'sold' ? numberFromPrice(lot.priceText) : null,
        currency: 'EUR',
        price_text: lot.priceText,
        discipline: 'show_jumping',
        source_url: sourceUrl,
        source_payload: {
          importer: 'zangersheide-auction-html-v1',
        },
        confidence_score: 80,
      }))

      const imported = await supabaseRequest(
        'global_auction_lots?on_conflict=auction_id,lot_number,normalized_horse_name',
        {
          method: 'POST',
          headers: {
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify(payload),
        },
      )
      rowsImported += imported?.length || 0
    }

    await finishRun(run.id, {
      status: 'finished',
      rows_seen: rowsSeen,
      rows_imported: rowsImported,
      rows_skipped: rowsSkipped,
      metadata: { auctions_imported: auctionsImported },
    })

    return {
      source: source.name,
      status: 'finished',
      auctionsImported,
      rowsSeen,
      rowsImported,
      rowsSkipped,
    }
  } catch (error) {
    await finishRun(run.id, {
      status: 'failed',
      error_message: error.message,
    })
    throw error
  }
}

const skipPwebCategory = (category) =>
  /dressage|pony|hunter|equitation|embryo/i.test(category || '')

const parsePwebCards = (html) =>
  String(html || '')
    .split('<div class="card card-collection')
    .slice(1)
    .map((part) => `<div class="card card-collection${part}`)
    .map((card) => {
      const horseNameRaw = textBetween(
        card,
        /<p class="card-text horsename[^"]*">([\s\S]*?)<\/p>/i,
      )
      const lotMatch = String(horseNameRaw || '').match(/^(\d+)\.\s*(.+)$/)
      const lotNumber = lotMatch?.[1] || null
      const horseName = lotMatch?.[2] || horseNameRaw
      const pedigree = textBetween(
        card,
        /<p class="card-text horsepedigree">([\s\S]*?)<\/p>/i,
      )
      const [sireName, damSireName] = String(pedigree || '')
        .split(/\s+x\s+/i)
        .map((part) => part.trim())
      const info = textBetween(
        card,
        /<p class="card-text text-uppercase horseinfo">([\s\S]*?)<\/p>/i,
      )
      const infoParts = String(info || '')
        .split('•')
        .map((part) => part.replace(/^°/, '').trim())
        .filter(Boolean)
      const birthYear = Number(infoParts[0])
      const sex = infoParts[1] || null
      const category = infoParts[2] || null
      const priceText = textBetween(
        card,
        /id="auction-price-[^"]*">([\s\S]*?)<\/span>/i,
      )
      const bidCount = Number(
        textBetween(card, /id="bid-count-[^"]*">([\s\S]*?)<\/span>/i) || 0,
      )
      const buyerCountry = textBetween(
        card,
        /id="horse-[^"]*-bidcountry"[^>]*title="([^"]+)"/i,
      )
      const notAuctionedVisible =
        /auction-not-auctioned"[^>]*style="display:\s*block/i.test(card)
      const href = textBetween(
        card,
        /<a href=([^ >]+)[^>]*class="stretched-link/i,
      )
      const slogan = textBetween(
        card,
        /<p class="card-slogan horseslogan">([\s\S]*?)<\/p>/i,
      )

      return {
        lotNumber,
        horseName,
        slogan,
        pedigree,
        birthYear: Number.isFinite(birthYear) ? birthYear : null,
        sex,
        category,
        sireName: sireName || null,
        damSireName: damSireName || null,
        priceText,
        bidCount,
        buyerCountry,
        notAuctionedVisible,
        href,
      }
    })
    .filter((lot) => lot.horseName)

const importYouhorseAuctions = async () => {
  const source = await upsertOne(
    'global_auction_sources',
    {
      name: 'Youhorse Auction',
      source_type: 'auction_house',
      country: 'Netherlands',
      website_url: YOUHORSE_BASE_URL,
      results_url: `${YOUHORSE_BASE_URL}/en/collection-ended`,
      discipline_scope: 'show_jumping',
      scrape_strategy: 'html_cards',
      access_level: 'public',
      status: 'active',
      notes:
        'Public ended Youhorse collections. Filtered to jumping-compatible horse categories.',
    },
    'name',
  )

  const house = await upsertOne(
    'global_auction_houses',
    {
      source_id: source.id,
      name: 'Youhorse Auction',
      normalized_name: normalize('Youhorse Auction'),
      country: 'Netherlands',
      website_url: YOUHORSE_BASE_URL,
    },
    'normalized_name',
  )

  const run = await createRun(
    source.id,
    `${YOUHORSE_BASE_URL}/en/collection-ended`,
    'youhorse-pweb-html-v1',
  )

  try {
    let rowsSeen = 0
    let rowsSkipped = 0
    let rowsImported = 0
    let auctionsImported = 0

    for (const id of YOUHORSE_COLLECTION_IDS) {
      const sourceUrl = `${YOUHORSE_BASE_URL}/en/collection-ended/${id}`
      let page
      try {
        page = await fetchHtml(sourceUrl)
      } catch {
        rowsSkipped += 1
        continue
      }
      const html = page.html
      if (!page.ok) {
        rowsSkipped += 1
        continue
      }

      const cards = parsePwebCards(html)
      if (cards.length < 5) continue

      await upsertOne(
        'global_auction_source_snapshots',
        {
          source_id: source.id,
          import_run_id: run.id,
          source_url: sourceUrl,
          content_type: page.contentType,
          checksum: checksum(html),
          metadata: { bytes: html.length },
        },
        'source_url,checksum',
      )

      const title =
        [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)]
          .map((match) => textOrNull(match[1]))
          .find(
            (heading) =>
              heading &&
              !/Ended auctions|Select|Conditions|Status/i.test(heading),
          ) || `Youhorse Auction ${id}`
      const endedText = decodeHtml(
        html.match(/Ended on[\s\S]{0,180}/i)?.[0] || '',
      )
      const year = yearFromEndedText(endedText) || yearFromTitle(title)
      rowsSeen += cards.length

      const auction = await upsertOne(
        'global_auctions',
        {
          house_id: house.id,
          source_id: source.id,
          name: title,
          normalized_name: normalize(`${title} ${id}`),
          auction_year: year,
          auction_date: null,
          country: 'Netherlands',
          discipline: 'show_jumping',
          category: 'mixed_show_jumping',
          source_url: sourceUrl,
          source_payload: {
            importer: 'youhorse-pweb-html-v1',
            ended_text: endedText,
            collection_id: id,
          },
        },
        'source_id,normalized_name,auction_year',
      )
      auctionsImported += 1

      const payload = cards
        .filter((lot) => !skipPwebCategory(lot.category))
        .map((lot) => {
          const status =
            lot.notAuctionedVisible || lot.bidCount <= 0 ? 'not_sold' : 'sold'
          return {
            auction_id: auction.id,
            source_id: source.id,
            lot_number: lot.lotNumber,
            horse_name: lot.horseName,
            normalized_horse_name: normalize(lot.horseName),
            birth_year: lot.birthYear,
            age: lot.birthYear && year ? year - lot.birthYear : null,
            sex: lot.sex,
            sire_name: lot.sireName,
            dam_sire_name: lot.damSireName,
            buyer_country: lot.buyerCountry,
            sold_status: status,
            hammer_price:
              status === 'sold' ? numberFromPrice(lot.priceText) : null,
            currency: 'EUR',
            price_text: lot.priceText,
            discipline: 'show_jumping',
            source_url: lot.href?.startsWith('http')
              ? lot.href
              : `${YOUHORSE_BASE_URL}${lot.href || ''}`,
            source_payload: {
              importer: 'youhorse-pweb-html-v1',
              category: lot.category,
              slogan: lot.slogan,
              pedigree: lot.pedigree,
              bid_count: lot.bidCount,
              collection_id: id,
            },
            confidence_score: 70,
          }
        })
        .filter((lot) => lot.horse_name)

      rowsSkipped += cards.length - payload.length
      if (!payload.length) continue

      const imported = await supabaseRequest(
        'global_auction_lots?on_conflict=auction_id,lot_number,normalized_horse_name',
        {
          method: 'POST',
          headers: {
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify(payload),
        },
      )
      rowsImported += imported?.length || 0
    }

    await finishRun(run.id, {
      status: 'finished',
      rows_seen: rowsSeen,
      rows_imported: rowsImported,
      rows_skipped: rowsSkipped,
      metadata: { auctions_imported: auctionsImported },
    })

    return {
      source: source.name,
      status: 'finished',
      auctionsImported,
      rowsSeen,
      rowsImported,
      rowsSkipped,
    }
  } catch (error) {
    await finishRun(run.id, {
      status: 'failed',
      error_message: error.message,
    })
    throw error
  }
}

const importGoresbridge = async () => {
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

  const run = await createRun(
    source.id,
    GORESBRIDGE_RESULTS_URL,
    'goresbridge-html-v1',
  )

  try {
    const page = await fetchHtml(GORESBRIDGE_RESULTS_URL)
    const html = page.html
    if (!page.ok) {
      throw new Error(
        `${page.status} ${page.statusText}: ${html.slice(0, 300)}`,
      )
    }

    await upsertOne(
      'global_auction_source_snapshots',
      {
        source_id: source.id,
        import_run_id: run.id,
        source_url: GORESBRIDGE_RESULTS_URL,
        content_type: page.contentType,
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

    return {
      source: source.name,
      status: 'finished',
      rowsSeen,
      rowsImported,
      rowsSkipped,
    }
  } catch (error) {
    await finishRun(run.id, {
      status: 'failed',
      error_message: error.message,
    })
    throw error
  }
}

const main = async () => {
  const summaries = []
  summaries.push(await importGoresbridge())
  summaries.push(await importFlandersFoalAuctions())
  summaries.push(await importZangersheideAuctions())
  summaries.push(await importYouhorseAuctions())

  console.log(
    JSON.stringify(
      {
        status: 'finished',
        summaries,
      },
      null,
      2,
    ),
  )
}

await main()
