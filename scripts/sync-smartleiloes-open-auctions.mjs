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

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY =
  env.SUPABASE_SECRET_KEY ||
  env.SUPABASE_SERVICE_ROLE_KEY ||
  env.SUPABASE_SERVICE_ROLE ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY
const SMARTLEILOES_API_KEY = env.SMARTLEILOES_API_KEY
const SMARTLEILOES_API_SECRET = env.SMARTLEILOES_API_SECRET
const SMARTLEILOES_BASE_URL = 'https://api.smartleiloes.digital/v1'

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

  return undefined
}

const asString = (value) =>
  value === undefined || value === null ? '' : String(value).trim()

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
    const parsed = Number(
      raw.replaceAll(thousandsSeparator, '').replace(decimalSeparator, '.'),
    )
    return Number.isFinite(parsed) ? parsed : 0
  }

  const parsed = Number(raw.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

const isoDate = (value) => {
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
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }

  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const extractItems = (data) => {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []
  return (
    data.data ||
    data.items ||
    data.result ||
    data.results ||
    data.registros ||
    data.retorno ||
    Object.values(data).find(Array.isArray) ||
    []
  )
}

const authenticateSmartLeiloes = async () => {
  const response = await fetch(`${SMARTLEILOES_BASE_URL}/empresa/auth`, {
    method: 'POST',
    headers: {
      'api-key': SMARTLEILOES_API_KEY,
      'api-secret': SMARTLEILOES_API_SECRET,
    },
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  const token =
    data?.token || data?.access_token || data?.bearer || data?.data?.token

  if (!response.ok || !token) {
    throw new Error(`Smart Leilões authentication failed: ${text}`)
  }

  return token
}

const smartRequest = async (path, token) => {
  const response = await fetch(`${SMARTLEILOES_BASE_URL}${path}`, {
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

const eventIdOf = (event, index) =>
  asString(valueOf(event, ['idEvento', 'id_evento', 'codigoEvento', 'id'])) ||
  `event-${index}`

const lotIdOf = (lot, eventId, index) =>
  asString(
    valueOf(lot, [
      'idLote',
      'id_lote',
      'idLoteEvento',
      'id_lote_evento',
      'codigoLote',
      'id',
    ]),
  ) || `${eventId}-${index}`

const eventDateOf = (event) =>
  isoDate(
    valueOf(event, [
      'dataInicioEvento',
      'data_inicio_evento',
      'dataTransmissaoEvento',
      'data_transmissao_evento',
      'dataHoraInicioPrelanceEvento',
      'data_hora_inicio_prelance_evento',
      'dataTerminoEvento',
      'data_termino_evento',
    ]),
  )

const main = async () => {
  const token = await authenticateSmartLeiloes()
  const currentYear = new Date().getFullYear()
  const eventParams = new URLSearchParams({
    'palavra-chave': '',
    'id-evento': '',
    'data-inicio': `${currentYear - 1}-01-01`,
    'data-fim': `${currentYear + 2}-12-31`,
    situacao: '1',
    'tipo-evento': '99',
    'formato-resultado': '1',
    limite: '5000',
  })
  const openEvents = await smartRequest(`/empresa/eventos?${eventParams}`, token)

  const auctionPayload = openEvents.map((event, index) => {
    const smartleiloesId = eventIdOf(event, index)

    return {
      smartleiloes_id: smartleiloesId,
      title:
        asString(valueOf(event, ['nomeEvento', 'nome_evento', 'descricaoEvento'])) ||
        `Leilão ${smartleiloesId}`,
      status:
        asString(
          valueOf(event, [
            'nomeSituacaoEvento',
            'nome_situacao_evento',
            'idSituacaoEvento',
            'id_situacao_evento',
          ]),
        ) || 'Aberto',
      value: money(
        valueOf(event, [
          'valorTotalFaturamentoEvento',
          'valor_total_faturamento_evento',
          'valorTotalEvento',
          'valor_total',
        ]),
      ),
      event_date: eventDateOf(event),
      event_type:
        asString(
          valueOf(event, [
            'descricaoTipoEvento',
            'descricao_tipo_evento',
            'racaEvento',
            'raca_evento',
          ]),
        ) || null,
      source_url: 'https://api.smartleiloes.digital/',
      payload: event,
      updated_at: new Date().toISOString(),
    }
  })

  const upsertedAuctions = auctionPayload.length
    ? await upsertChunked(
        'smartleiloes_auctions',
        auctionPayload,
        'smartleiloes_id',
      )
    : []
  const auctionIdBySmartId = new Map(
    upsertedAuctions.map((auction) => [
      String(auction.smartleiloes_id),
      auction.id,
    ]),
  )

  const lotGroups = await Promise.all(
    openEvents.map(async (event, eventIndex) => {
      const eventId = eventIdOf(event, eventIndex)
      const lotParams = new URLSearchParams({
        'palavra-chave': '',
        'id-evento': eventId,
        'id-lote': '',
        'id-tipo-lote': '999999',
        'situacao-comercial': '99',
        situacao: '99',
        'formato-resultado': '1',
        ordenacao: '1',
        limite: '5000',
      })

      try {
        const lots = await smartRequest(`/empresa/lotes?${lotParams}`, token)
        return lots.map((lot, lotIndex) => ({
          smartleiloes_id: lotIdOf(lot, eventId, lotIndex),
          auction_id: auctionIdBySmartId.get(eventId) || null,
          auction_smartleiloes_id: eventId,
          lot_number:
            asString(
              valueOf(lot, [
                'numeroLote',
                'numero_lote',
                'numero',
                'lote',
              ]),
            ) || null,
          title:
            asString(
              valueOf(lot, [
                'descricaoLote',
                'descricao_lote',
                'nomeLote',
                'nome_lote',
                'nomeAnimal',
                'nome_animal',
                'descricao',
              ]),
            ) || `Lote ${lotIdOf(lot, eventId, lotIndex)}`,
          category:
            asString(
              valueOf(lot, [
                'categoria',
                'descricaoTipoLote',
                'descricao_tipo_lote',
                'tipoLote',
                'tipo_lote',
                'racaLote',
                'raca_lote',
              ]),
            ) || null,
          commercial_status:
            asString(
              valueOf(lot, [
                'situacaoComercial',
                'situacao_comercial',
                'situacaoComercialLote',
                'situacao_comercial_lote',
                'nomeSituacaoComercialLote',
              ]),
            ) || null,
          value: money(
            valueOf(lot, [
              'valorLote',
              'valor_lote',
              'valorInicialLote',
              'valor_inicial_lote',
              'valor',
              'valorMinimo',
              'valor_minimo',
            ]),
          ),
          payload: lot,
          updated_at: new Date().toISOString(),
        }))
      } catch (error) {
        console.warn(`Could not fetch lots for event ${eventId}: ${error.message}`)
        return []
      }
    }),
  )
  const lotPayload = lotGroups.flat()
  const upsertedLots = lotPayload.length
    ? await upsertChunked('smartleiloes_lots', lotPayload, 'smartleiloes_id')
    : []

  console.log(
    JSON.stringify(
      {
        fetched: {
          openAuctions: openEvents.length,
          lots: lotPayload.length,
        },
        saved: {
          openAuctions: upsertedAuctions.length,
          lots: upsertedLots.length,
        },
        auctions: auctionPayload.map((auction) => ({
          id: auction.smartleiloes_id,
          title: auction.title,
          status: auction.status,
          eventDate: auction.event_date?.slice(0, 10) || null,
        })),
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
