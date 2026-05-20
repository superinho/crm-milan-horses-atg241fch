import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
  Deno.env.get('SUPABASE_SECRET_KEY')!
const USER_AGENT =
  Deno.env.get('HIPPOMUNDO_USER_AGENT') ||
  'MilanHorsesCRM/1.0 internal research; source links preserved'
const DEFAULT_LIMIT = Number(Deno.env.get('HIPPOMUNDO_SYNC_LIMIT') || 1)
const MAX_LIMIT = Number(Deno.env.get('HIPPOMUNDO_SYNC_MAX_LIMIT') || 3)
const DEFAULT_DELAY_MS = Number(Deno.env.get('HIPPOMUNDO_DELAY_MS') || 10000)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

type QueueItem = {
  id: string
  source_id: string
  source_url: string
  entity_kind: string
  attempts: number
  max_attempts: number
  metadata?: Record<string, unknown> | null
}

type SourceRecord = {
  id: string
  name: string
  crawl_delay_ms?: number | null
}

type ParsedLot = {
  lotNumber: string
  horseName: string
  sireName: string | null
  hammerPrice: number | null
  currency: string
  priceText: string | null
  sourceUrl: string
  confidenceScore: number
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

const normalize = (value: unknown) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const decodeHtml = (value: string) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&euro;/g, '€')

const textOf = (html: string) =>
  decodeHtml(
    html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  )

const sha256 = async (text: string) => {
  const data = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

const absoluteUrl = (href: string, baseUrl: string) => {
  try {
    return new URL(decodeHtml(href), baseUrl).toString().split('#')[0]
  } catch {
    return null
  }
}

const extractLotLinks = (html: string, baseUrl: string) => {
  const links = new Set<string>()
  const regex =
    /href=["']([^"']*\/(?:en|nl|fr|de)\/auction\/lot\/\d+-[^"']+)["']/gi

  for (const match of html.matchAll(regex)) {
    const url = absoluteUrl(match[1], baseUrl)
    if (url?.includes('hippomundo.com/')) links.add(url)
  }

  return [...links]
}

const parseEuro = (value: string) => {
  const cleaned = value.replace(/[^\d,.-]/g, '').trim()
  if (!cleaned) return null
  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')
  const decimal = lastComma > lastDot ? ',' : '.'
  const thousands = decimal === ',' ? '.' : ','
  const normalized = cleaned.replaceAll(thousands, '').replace(decimal, '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const parseLotPage = (html: string, sourceUrl: string): ParsedLot | null => {
  const title = textOf(
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '',
  )
  const h1 = textOf(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '')
  const sourceText = `${title} ${h1}`
  const lotNumber = sourceUrl.match(/\/lot\/(\d+)-/i)?.[1] || ''
  const titleMatch = sourceText.match(/Lot\s+(.+?)\s+-\s+Horse auction/i)
  const horseName = titleMatch?.[1]?.trim()
  const sireName =
    sourceText.match(/sired by\s+(.+?)\s+-\s+Hippomundo/i)?.[1]?.trim() || null
  const priceText =
    html.match(/(?:€|&euro;)\s?[\d.,]+/i)?.[0]?.replace('&euro;', '€') || null
  const hammerPrice = priceText ? parseEuro(priceText) : null

  if (!lotNumber || !horseName) return null

  const confidenceScore = Math.min(
    95,
    55 + (sireName ? 20 : 0) + (hammerPrice ? 15 : 0) + (sourceUrl ? 5 : 0),
  )

  return {
    lotNumber,
    horseName,
    sireName,
    hammerPrice,
    currency: 'EUR',
    priceText,
    sourceUrl,
    confidenceScore,
  }
}

const ensureHippomundoSource = async (): Promise<SourceRecord> => {
  const { data, error } = await supabase
    .from('global_auction_sources')
    .upsert(
      {
        name: 'Hippomundo',
        source_type: 'market_database',
        website_url: 'https://www.hippomundo.com/en',
        results_url: 'https://www.hippomundo.com/en/auctions',
        discipline_scope: 'show_jumping',
        scrape_strategy: 'incremental_html_with_snapshot',
        access_level: 'public',
        status: 'active',
        primary_source: true,
        rate_limit_per_minute: 6,
        crawl_delay_ms: DEFAULT_DELAY_MS,
        notes:
          'Fonte primaria para consulta interna do Mercado Global, com snapshots e links preservados.',
      },
      { onConflict: 'name' },
    )
    .select('id,name,crawl_delay_ms')
    .single()

  if (error) throw error
  return data as SourceRecord
}

const enqueueUrls = async (
  sourceId: string,
  urls: string[],
  entityKind = 'lot',
) => {
  if (!urls.length) return 0

  const { data, error } = await supabase
    .from('global_auction_crawl_queue')
    .upsert(
      urls.map((url) => ({
        source_id: sourceId,
        source_url: url,
        entity_kind: entityKind,
        status: 'queued',
        priority: entityKind === 'lot' ? 50 : 100,
        metadata: { source: 'hippomundo' },
      })),
      { onConflict: 'source_url,entity_kind', ignoreDuplicates: true },
    )
    .select('id')

  if (error) throw error
  return data?.length || 0
}

const nextQueueItems = async (
  sourceId: string,
  limit: number,
): Promise<QueueItem[]> => {
  const { data, error } = await supabase
    .from('global_auction_crawl_queue')
    .select(
      'id,source_id,source_url,entity_kind,attempts,max_attempts,metadata',
    )
    .eq('source_id', sourceId)
    .eq('status', 'queued')
    .lte('scheduled_at', new Date().toISOString())
    .order('priority', { ascending: true })
    .order('scheduled_at', { ascending: true })
    .limit(limit)

  if (error) throw error
  return (data || []) as QueueItem[]
}

const createRun = async (sourceId: string, sourceUrl: string) => {
  const { data, error } = await supabase
    .from('global_auction_import_runs')
    .insert({
      source_id: sourceId,
      source_url: sourceUrl,
      status: 'running',
      extraction_phase: 'hippomundo_incremental',
      rate_limit_ms: DEFAULT_DELAY_MS,
      metadata: { mode: 'queue' },
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}

const finishRun = async (
  id: string,
  status: string,
  payload: Record<string, unknown>,
) => {
  await supabase
    .from('global_auction_import_runs')
    .update({
      status,
      ...payload,
      finished_at: new Date().toISOString(),
    })
    .eq('id', id)
}

const saveSnapshot = async (
  sourceId: string,
  runId: string,
  sourceUrl: string,
  html: string,
) => {
  const checksum = await sha256(html)
  const { error } = await supabase
    .from('global_auction_source_snapshots')
    .upsert(
      {
        source_id: sourceId,
        import_run_id: runId,
        source_url: sourceUrl,
        content_type: 'text/html',
        checksum,
        metadata: {
          bytes: html.length,
          captured_by: 'sync-hippomundo-market',
        },
      },
      { onConflict: 'source_url,checksum', ignoreDuplicates: true },
    )
  if (error) throw error
  return checksum
}

const ensureAuction = async (sourceId: string) => {
  const houseName = 'Hippomundo'
  const normalizedHouse = normalize(houseName)
  const { data: house, error: houseError } = await supabase
    .from('global_auction_houses')
    .upsert(
      {
        source_id: sourceId,
        name: houseName,
        normalized_name: normalizedHouse,
        website_url: 'https://www.hippomundo.com/en',
        notes:
          'Casa tecnica usada para lotes publicos Hippomundo sem leilao identificado.',
      },
      { onConflict: 'normalized_name' },
    )
    .select('id')
    .single()
  if (houseError) throw houseError

  const normalizedAuction = 'hippomundo-public-auction-lots'
  const { data: existing, error: existingError } = await supabase
    .from('global_auctions')
    .select('id')
    .eq('source_id', sourceId)
    .eq('normalized_name', normalizedAuction)
    .maybeSingle()
  if (existingError) throw existingError
  if (existing?.id) return existing.id as string

  const { data: auction, error: auctionError } = await supabase
    .from('global_auctions')
    .insert({
      source_id: sourceId,
      house_id: house.id,
      name: 'Hippomundo public auction lots',
      normalized_name: normalizedAuction,
      discipline: 'show_jumping',
      category: 'mixed_show_jumping',
      source_url: 'https://www.hippomundo.com/en/auctions',
      source_payload: { source: 'hippomundo_incremental' },
    })
    .select('id')
    .single()
  if (auctionError) throw auctionError
  return auction.id as string
}

const saveParsedLot = async (sourceId: string, lot: ParsedLot) => {
  const auctionId = await ensureAuction(sourceId)
  const { error } = await supabase.from('global_auction_lots').upsert(
    {
      auction_id: auctionId,
      source_id: sourceId,
      lot_number: lot.lotNumber,
      horse_name: lot.horseName,
      normalized_horse_name: normalize(lot.horseName),
      sire_name: lot.sireName,
      sold_status: lot.hammerPrice ? 'sold' : 'unknown',
      hammer_price: lot.hammerPrice,
      currency: lot.currency,
      price_text: lot.priceText,
      discipline: 'show_jumping',
      source_url: lot.sourceUrl,
      source_payload: {
        parser: 'hippomundo_lot_title_v1',
        observed_fields_only: true,
      },
      confidence_score: lot.confidenceScore,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'auction_id,lot_number,normalized_horse_name' },
  )

  if (error) throw error
}

const processItem = async (source: SourceRecord, item: QueueItem) => {
  const runId = await createRun(source.id, item.source_url)
  await supabase
    .from('global_auction_crawl_queue')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
      attempts: item.attempts + 1,
    })
    .eq('id', item.id)

  try {
    const response = await fetch(item.source_url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    const html = await response.text()

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`)
    }

    await saveSnapshot(source.id, runId, item.source_url, html)
    const childLinks = extractLotLinks(html, item.source_url)
    const queuedLinks = await enqueueUrls(source.id, childLinks, 'lot')
    const parsedLot = parseLotPage(html, item.source_url)
    let importedLots = 0

    if (parsedLot) {
      await saveParsedLot(source.id, parsedLot)
      importedLots = 1
    }

    await finishRun(runId, 'completed', {
      rows_seen: parsedLot ? 1 : childLinks.length,
      rows_imported: importedLots,
      rows_skipped: parsedLot ? 0 : 1,
      metadata: {
        queued_links: queuedLinks,
        parsed_lot: Boolean(parsedLot),
      },
    })
    await supabase
      .from('global_auction_crawl_queue')
      .update({
        status: 'completed',
        finished_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('id', item.id)

    return { itemId: item.id, importedLots, queuedLinks }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const exhausted = item.attempts + 1 >= item.max_attempts
    await finishRun(runId, 'failed', {
      rows_seen: 0,
      rows_imported: 0,
      rows_skipped: 1,
      error_message: message,
    })
    await supabase
      .from('global_auction_crawl_queue')
      .update({
        status: exhausted ? 'failed' : 'queued',
        scheduled_at: new Date(Date.now() + DEFAULT_DELAY_MS * 6).toISOString(),
        last_error: message,
        finished_at: new Date().toISOString(),
      })
      .eq('id', item.id)

    return { itemId: item.id, error: message }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders })

  const body = await req.json().catch(() => ({}))
  const source = await ensureHippomundoSource()
  const seedUrls = Array.isArray(body?.seedUrls)
    ? body.seedUrls
        .map((url: unknown) => String(url || '').trim())
        .filter((url: string) => url.startsWith('https://www.hippomundo.com/'))
        .slice(0, 20)
    : []
  const seeded = await enqueueUrls(
    source.id,
    seedUrls,
    body?.entityKind || 'auction',
  )
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(body?.limit ?? DEFAULT_LIMIT)),
  )
  const items = await nextQueueItems(source.id, limit)
  const delayMs = Number(source.crawl_delay_ms || DEFAULT_DELAY_MS)
  const results = []

  for (const item of items) {
    results.push(await processItem(source, item))
    await sleep(delayMs)
  }

  return jsonResponse({
    source: source.name,
    seeded,
    processed: results.length,
    delayMs,
    results,
  })
})
