import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

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
  env.SUPABASE_SERVICE_ROLE

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL and service role key.')
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
})

const pageSize = 1000

const fetchAll = async (table, columns, orderColumn = 'id') => {
  const rows = []
  let from = 0

  while (true) {
    const { data, error } = await db
      .from(table)
      .select(columns)
      .order(orderColumn, { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
    from += pageSize
  }

  return rows
}

const valueOf = (record, keys) => {
  if (!record) return ''
  const normalizedEntries = Object.entries(record).map(([key, value]) => [
    normalizeKey(key),
    value,
  ])

  for (const key of keys) {
    const direct = record[key]
    if (direct !== undefined && direct !== null && direct !== '') {
      return String(direct).trim()
    }

    const normalizedKey = normalizeKey(key)
    const found = normalizedEntries.find(
      ([entryKey, value]) =>
        entryKey === normalizedKey &&
        value !== undefined &&
        value !== null &&
        value !== '',
    )
    if (found) return String(found[1]).trim()
  }

  return ''
}

const normalizeKey = (key) =>
  String(key)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()

const normalizeComparable = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ºª]/g, '')
    .replace(/[^A-Z0-9 ]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()

const clean = (value, fallback = '') =>
  value ? String(value).replace(/\s+/g, ' ').trim() : fallback

const numberOf = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const raw = String(value || '')
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

const titleOf = (row) =>
  clean(
    valueOf(row.payload, [
      'descricaoLoteContrato',
      'descricaoLoteLance',
      'descricaoLote',
    ]),
    row.description || '',
  )
    .replace(/\s*\|\s*ID\s+contrato.*$/i, '')
    .replace(/\s*\|\s*ID\s+lance.*$/i, '')
    .trim()

const categoryOf = (row) =>
  clean(
    valueOf(row.payload, [
      'categoriaLoteContrato',
      'categoriaLoteLance',
      'categoriaLote',
      'categoria',
    ]),
    'Sem categoria',
  )

const isClearlyNonHorseLot = (row) => {
  const category = normalizeComparable(categoryOf(row))
  const title = normalizeComparable(titleOf(row))

  if (/\b(PALHETA|SEMEN|SEMEM|COBERTURA)\b/.test(category)) return false
  if (category && category !== 'SEM GRUPO DEFINIDO') return false

  return /\b(SELA|CASACA|CAMISA|CAPACETE|CASACO|LUVA|BOTA|ARREIO|MANTA|QUADRO|LIVRO|CINTO|BONE|CHAPEU|HOTEL|VINHO|POLO|COLAR|BRILHANTE)\b/.test(
    title,
  )
}

const isSemenOrCover = (row) =>
  /\b(PALHETA|SEMEN|SEMEM|COBERTURA)\b/.test(
    normalizeComparable(`${categoryOf(row)} ${titleOf(row)}`),
  )

const horseSearchTitleOf = (row) => {
  let title = titleOf(row)
    .replace(/\bLOTE\s+EXTRA!?\b/gi, '')
    .replace(/\bLOTE\s+SOLID[ÁA]RIO:?\b/gi, '')
    .replace(/^[\s:.-]+|[\s:.-]+$/g, '')
    .trim()

  if (isSemenOrCover(row)) {
    title = title
      .replace(/\bKIT\s+(?:COM\s+)?\d+\s+PALHETAS?\b/gi, '')
      .replace(/\b\d+\s+(?:CORTE\s+DE\s+)?PALHETAS?\b/gi, '')
      .replace(/\bI\s+CORTE\s+DE\s+PALHETA\b/gi, '')
      .replace(/\bFREE\s+ICSI\b/gi, '')
      .replace(/\bPALHETAS?\b/gi, '')
      .replace(/\bLOTE\s+EXTRA!!?\b/gi, '')
      .replace(/^[\s:.-]+|[\s:.-]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  return title
}

const horseAliases = (name) => {
  const aliases = new Set()
  const base = normalizeComparable(name)
  if (!base) return []

  aliases.add(base)
  const tokens = base.split(' ')
  const suffixes = new Set(['TE', 'FIV', 'IA', 'IATF', 'ET', 'ETR', 'Z'])

  while (tokens.length > 1 && suffixes.has(tokens[tokens.length - 1])) {
    tokens.pop()
    aliases.add(tokens.join(' '))
  }

  return [...aliases]
}

const qualityOf = (horse) =>
  Number.isFinite(Number(horse.data_quality_score))
    ? Number(horse.data_quality_score)
    : 0

const buildHorseIndex = (horses) => {
  const index = new Map()

  for (const horse of horses) {
    for (const alias of horseAliases(horse.name)) {
      const current = index.get(alias) || []
      current.push(horse)
      current.sort((a, b) => qualityOf(b) - qualityOf(a))
      index.set(alias, current.slice(0, 5))
    }
  }

  return index
}

const findHorse = (index, name) => {
  for (const alias of horseAliases(name)) {
    const matches = index.get(alias)
    if (matches?.length) return matches[0]
  }
  return null
}

const sexIsFemale = (horse) =>
  normalizeComparable(horse?.sex || '').includes('F')

const sexIsMale = (horse) => {
  const sex = normalizeComparable(horse?.sex || '')
  return sex.includes('M') || sex.includes('GARANHAO')
}

const birthDateOf = (horse) =>
  horse?.birth_date || (horse?.birth_year ? `${horse.birth_year}-07-01` : null)

const damSireFor = (horseIndex, damName) =>
  findHorse(horseIndex, damName)?.sire_name || ''

const payloadFromHorse = (row, horse, horseIndex) => {
  const semenOrCover = isSemenOrCover(row)
  const damName = semenOrCover ? '' : horse.dam_name || ''
  const sireName = semenOrCover ? horse.name || '' : horse.sire_name || ''

  return {
    syntheticGeneticMatch: true,
    pedigreeSource: 'Studbook BH',
    pedigreeMatchType: semenOrCover ? 'semen_or_cover_stallion' : 'horse_name',
    originalSmartPayload: row.payload || {},
    descricaoLote: titleOf(row),
    descricaoLoteContrato: valueOf(row.payload, ['descricaoLoteContrato']),
    numeroLote: row.lot_number || valueOf(row.payload, ['numeroLoteContrato']),
    categoriaLote: categoryOf(row),
    sexoLote: horse.sex || null,
    registroAnimalLote: horse.registration || null,
    dataNascimentoAnimal: birthDateOf(horse),
    criadorLote: horse.breeder_name || null,
    proprietarioStudbook: horse.owner_name || null,
    linhagemMaternaLote00: damName || null,
    linhagemMaternaLote01: damName ? damSireFor(horseIndex, damName) : null,
    linhagemPaternaLote00: sireName || null,
  }
}

const cleanCrossName = (value) =>
  String(value || '')
    .replace(/\([^)]*\)/g, '')
    .replace(
      /\b(EMBRIAO|EMBRYON|COBERTURA|PRENHEZ|PALHETA|SEMEN|SEMEM)\b/gi,
      '',
    )
    .replace(/^[\s:.-]+|[\s:.-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const payloadFromCross = (row, horseIndex) => {
  const title = titleOf(row)
  const damSireHint = title.match(/\(([^)]+)\)/)?.[1] || ''
  const text = title
    .replace(/\([^)]*\)/g, '')
    .replace(
      /\b(EMBRIAO|EMBRYON|COBERTURA|PRENHEZ|PALHETA|SEMEN|SEMEM)\b/gi,
      '',
    )
    .replace(/^[\s:.-]+|[\s:.-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  let left = ''
  let right = ''
  let relation = null
  const onMatch = text.match(/^(.+?)\s+(?:NA|NO|EM)\s+(.+)$/i)
  const xMatch = text.match(/^(.+?)\s+X\s+(.+)$/i)

  if (onMatch) {
    left = cleanCrossName(onMatch[1])
    right = cleanCrossName(onMatch[2])
    relation = 'on'
  } else if (xMatch) {
    left = cleanCrossName(xMatch[1])
    right = cleanCrossName(xMatch[2])
    relation = 'x'
  }

  if (!left || !right || !relation) return null

  const leftHorse = findHorse(horseIndex, left)
  const rightHorse = findHorse(horseIndex, right)
  let sire = left
  let mare = right

  if (
    relation === 'x' &&
    (sexIsFemale(leftHorse) || (sexIsMale(rightHorse) && !sexIsMale(leftHorse)))
  ) {
    sire = right
    mare = left
  }

  const mareHorse = findHorse(horseIndex, mare)

  return {
    syntheticGeneticMatch: true,
    pedigreeSource: 'Descrição Smart Leilões + Studbook BH',
    pedigreeMatchType: 'cross_description',
    originalSmartPayload: row.payload || {},
    descricaoLote: title,
    descricaoLoteContrato: valueOf(row.payload, ['descricaoLoteContrato']),
    numeroLote: row.lot_number || valueOf(row.payload, ['numeroLoteContrato']),
    categoriaLote: categoryOf(row),
    sexoLote: null,
    registroAnimalLote: null,
    dataNascimentoAnimal: null,
    criadorLote: mareHorse?.breeder_name || null,
    linhagemMaternaLote00: mare || null,
    linhagemMaternaLote01: damSireHint || mareHorse?.sire_name || null,
    linhagemPaternaLote00: sire || null,
  }
}

const geneticPayloadFor = (row, horseIndex) => {
  if (isClearlyNonHorseLot(row)) return null

  const directHorse = findHorse(horseIndex, horseSearchTitleOf(row))
  if (directHorse) return payloadFromHorse(row, directHorse, horseIndex)

  return payloadFromCross(row, horseIndex)
}

const upsertRows = async (rows) => {
  let saved = 0

  for (let index = 0; index < rows.length; index += 250) {
    const chunk = rows.slice(index, index + 250)
    const { error } = await db
      .from('smartleiloes_lots')
      .upsert(chunk, { onConflict: 'smartleiloes_id' })

    if (error) throw error
    saved += chunk.length
  }

  return saved
}

const main = async () => {
  const [existingLots, purchases, bids, horses] = await Promise.all([
    fetchAll('smartleiloes_lots', 'smartleiloes_id,payload', 'smartleiloes_id'),
    fetchAll(
      'purchases',
      'smartleiloes_id,smartleiloes_lot_id,lot_number,value,description,payload',
      'smartleiloes_id',
    ),
    fetchAll(
      'bids',
      'smartleiloes_id,smartleiloes_lot_id,lot_number,value,payload',
      'smartleiloes_id',
    ),
    fetchAll(
      'studbook_horses_enriched',
      'id,name,registration,sex,birth_date,birth_year,sire_name,dam_name,breeder_name,owner_name,data_quality_score',
      'name',
    ),
  ])

  const existingRealLotIds = new Set(
    existingLots
      .filter((lot) => !lot.payload?.syntheticGeneticMatch)
      .map((lot) => String(lot.smartleiloes_id)),
  )
  const horseIndex = buildHorseIndex(horses)
  const rowsByLotId = new Map()
  const stats = {
    purchases: purchases.length,
    bids: bids.length,
    existingLots: existingLots.length,
    directStudbook: 0,
    crosses: 0,
    skippedRealLots: 0,
    skippedNonHorse: 0,
    unmatched: 0,
  }

  const collect = (row, source) => {
    const lotId = String(row.smartleiloes_lot_id || '')
    if (!lotId) return
    if (existingRealLotIds.has(lotId)) {
      stats.skippedRealLots += 1
      return
    }
    if (isClearlyNonHorseLot(row)) {
      stats.skippedNonHorse += 1
      return
    }

    const payload = geneticPayloadFor(row, horseIndex)
    if (!payload) {
      stats.unmatched += 1
      return
    }

    if (payload.pedigreeMatchType === 'cross_description') stats.crosses += 1
    else stats.directStudbook += 1

    const current = rowsByLotId.get(lotId)
    const value =
      Number(row.value || 0) ||
      numberOf(valueOf(row.payload, ['valorContrato', 'valorLance']))

    if (current) {
      current.value = Math.max(Number(current.value || 0), value)
      current.payload.sourceRows.push({
        source,
        smartleiloes_id: row.smartleiloes_id,
        value,
      })
      if (source === 'purchase') current.commercial_status = 'VENDIDO'
      return
    }

    rowsByLotId.set(lotId, {
      smartleiloes_id: lotId,
      auction_id: null,
      auction_smartleiloes_id:
        valueOf(row.payload, [
          'idEventoContrato',
          'idEventoLance',
          'idEvento',
        ]) || null,
      lot_number: row.lot_number || payload.numeroLote || null,
      title: payload.descricaoLote || titleOf(row) || `Lote ${lotId}`,
      category: payload.categoriaLote || categoryOf(row),
      commercial_status: source === 'purchase' ? 'VENDIDO' : 'COM LANCE',
      value,
      payload: {
        ...payload,
        sourceRows: [
          {
            source,
            smartleiloes_id: row.smartleiloes_id,
            value,
          },
        ],
      },
      updated_at: new Date().toISOString(),
    })
  }

  purchases.forEach((row) => collect(row, 'purchase'))
  bids.forEach((row) => collect(row, 'bid'))

  const rows = [...rowsByLotId.values()]
  const saved = await upsertRows(rows)

  console.log(
    JSON.stringify(
      {
        ...stats,
        matchedUniqueLots: rows.length,
        saved,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
