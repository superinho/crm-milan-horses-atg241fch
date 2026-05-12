import crypto from 'node:crypto'
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

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const SUPABASE_KEY =
  env.SUPABASE_SECRET_KEY ||
  env.SUPABASE_SERVICE_ROLE_KEY ||
  env.SUPABASE_SERVICE_ROLE
const ABCCH_API_URL = env.ABCCH_API_URL || 'https://api.abcch.com.br'
const ABCCH_AUTH = env.ABCCH_AUTH || 'admin=,user='
const FETCH_CONCURRENCY = Number(env.ABCCH_DETAIL_CONCURRENCY || 6)
const CHUNK_SIZE = Number(env.ABCCH_DETAIL_CHUNK_SIZE || 200)
const BATCH_SIZE = Number(env.ABCCH_BATCH_SIZE || 200)
const REQUEST_DELAY_MS = Number(env.ABCCH_REQUEST_DELAY_MS || 40)
const REQUEST_TIMEOUT_MS = Number(env.ABCCH_REQUEST_TIMEOUT_MS || 12000)
const ONLY_MISSING_DETAILS = env.ABCCH_ONLY_MISSING_DETAILS !== 'false'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    'Missing VITE_SUPABASE_URL/SUPABASE_URL and SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY.',
  )
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()

const textOrNull = (value) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const dateOnly = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

const checksum = (payload) =>
  crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex')

const supabaseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

const supabaseRequest = async (path, init = {}) => {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      ...supabaseHeaders,
      ...(init.headers || {}),
    },
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} ${path}: ${text}`)
  }
  return text ? JSON.parse(text) : null
}

const createImportRun = async () => {
  const [run] = await supabaseRequest('studbook_import_runs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      status: 'running',
      search_terms: ['detail-enrichment'],
      notes:
        'Enriquecimento de detalhes publicos ABCCH: criador, proprietario, raca, pelagem, microchip, DNA, pedigree e progenie em source_payload.',
    }),
  })
  return run
}

const finishImportRun = async (id, payload) => {
  await supabaseRequest(`studbook_import_runs?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      ...payload,
      finished_at: new Date().toISOString(),
    }),
  })
}

const abcchGet = async (path) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const res = await fetch(`${ABCCH_API_URL}${path}`, {
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: ABCCH_AUTH,
    },
  }).finally(() => clearTimeout(timeout))
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} ${path}: ${text}`)
  }
  try {
    return text ? JSON.parse(text) : null
  } catch (error) {
    throw new Error(`Invalid JSON ${path}: ${text.slice(0, 160)}`)
  }
}

const fetchAllTokens = async () => {
  const tokens = []
  const pageSize = 1000
  const detailFilter = ONLY_MISSING_DETAILS
    ? '&or=(breed.is.null,microchip.is.null,abcch_breeder_token.is.null)'
    : ''
  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1
    const rows = await supabaseRequest(
      `studbook_horses?select=abcch_token&abcch_token=not.is.null${detailFilter}&order=abcch_token.asc`,
      {
        headers: {
          Range: `${from}-${to}`,
        },
      },
    )
    if (!rows?.length) break
    tokens.push(...rows.map((row) => row.abcch_token).filter(Boolean))
    if (rows.length < pageSize) break
  }
  return [...new Set(tokens)]
}

const upsertPeople = async (peopleByKey) => {
  const people = [...peopleByKey.values()]
  const idByKey = new Map()
  let changed = 0

  for (let i = 0; i < people.length; i += BATCH_SIZE) {
    const chunk = people.slice(i, i + BATCH_SIZE)
    const data = await supabaseRequest(
      'studbook_people_orgs?on_conflict=normalized_name,role',
      {
        method: 'POST',
        headers: {
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(chunk),
      },
    )
    changed += data?.length || 0
    for (const person of data || []) {
      idByKey.set(`${person.normalized_name}|${person.role}`, person.id)
    }
  }

  return { idByKey, changed }
}

const HORSE_COLUMNS = [
  'abcch_token',
  'name',
  'normalized_name',
  'registration',
  'original_registration',
  'ueln',
  'microchip',
  'breed',
  'sex',
  'birth_date',
  'birth_year',
  'coat',
  'status',
  'dna',
  'breeder_id',
  'owner_id',
  'abcch_owner_token',
  'abcch_breeder_token',
  'birthplace',
  'sire_name',
  'dam_name',
  'source_url',
  'source',
  'source_payload',
  'source_checksum',
  'import_batch_id',
  'data_quality_score',
  'last_synced_at',
  'updated_at',
]

const horsePayload = (horse) =>
  Object.fromEntries(
    HORSE_COLUMNS.map((column) => [column, horse[column] ?? null]),
  )

const detailToHorse = (detail, peopleIds, runId) => {
  const ownerName = textOrNull(detail.NmUserOwner)
  const breederName = textOrNull(detail.NmUserBreeder)
  const ownerKey = ownerName ? `${normalize(ownerName)}|owner` : null
  const breederKey = breederName ? `${normalize(breederName)}|breeder` : null
  const birthDate = dateOnly(detail.DtFoaled)

  return horsePayload({
    abcch_token: textOrNull(detail.CdToken),
    name: textOrNull(detail.NmAnimal) || 'SEM NOME',
    normalized_name: normalize(detail.NmAnimal),
    registration: textOrNull(detail.NrRegistration),
    original_registration: textOrNull(detail.NrRegistrationOriginal),
    ueln: textOrNull(detail.NrUELN),
    microchip: textOrNull(detail.CdMicrochip),
    breed: textOrNull(detail.DsBreed),
    sex: textOrNull(detail.DsGender || detail.CdGender),
    birth_date: birthDate,
    birth_year: birthDate ? Number(birthDate.slice(0, 4)) : null,
    coat: textOrNull(detail.DsCoatColor),
    status: textOrNull(detail.DsStatus),
    dna: textOrNull(detail.DsDNAResult || detail.CdDNALaboratory),
    breeder_id: breederKey ? peopleIds.get(breederKey) || null : null,
    owner_id: ownerKey ? peopleIds.get(ownerKey) || null : null,
    abcch_owner_token: textOrNull(detail.CdTokenOwner),
    abcch_breeder_token: textOrNull(detail.CdTokenBreeder),
    birthplace: textOrNull(detail.DsFoalBirthplace),
    sire_name: textOrNull(detail.NmAnimalSire),
    dam_name: textOrNull(detail.NmAnimalDam),
    source_url: detail.CdToken
      ? `https://abcch.com.br/studbook/animal/${detail.CdToken}`
      : null,
    source: 'ABCCH',
    source_payload: detail,
    source_checksum: checksum(detail),
    import_batch_id: runId,
    data_quality_score: [
      detail.CdToken,
      detail.NmAnimal,
      detail.NrRegistration,
      detail.DtFoaled,
      detail.DsGender || detail.CdGender,
      detail.DsBreed,
      detail.DsCoatColor,
      detail.NmAnimalSire,
      detail.NmAnimalDam,
      detail.NmUserOwner,
      detail.NmUserBreeder,
      detail.DsFoalBirthplace,
      detail.lstPedigree,
    ].filter(Boolean).length,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
}

const peopleFromDetails = (details) => {
  const people = new Map()
  for (const detail of details) {
    for (const [role, name, tokenField] of [
      ['owner', detail.NmUserOwner, 'CdTokenOwner'],
      ['breeder', detail.NmUserBreeder, 'CdTokenBreeder'],
    ]) {
      const cleanName = textOrNull(name)
      if (!cleanName) continue
      people.set(`${normalize(cleanName)}|${role}`, {
        name: cleanName,
        normalized_name: normalize(cleanName),
        role,
        source: 'ABCCH',
        source_payload: {
          abcch_token: textOrNull(detail[tokenField]),
          sourceField: role === 'owner' ? 'NmUserOwner' : 'NmUserBreeder',
        },
        updated_at: new Date().toISOString(),
      })
    }
  }
  return people
}

const upsertHorses = async (horses) => {
  let changed = 0
  for (let i = 0; i < horses.length; i += BATCH_SIZE) {
    const chunk = horses.slice(i, i + BATCH_SIZE)
    const data = await supabaseRequest(
      'studbook_horses?on_conflict=abcch_token',
      {
        method: 'POST',
        headers: {
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(chunk),
      },
    )
    changed += data?.length || 0
  }
  return changed
}

const fetchDetailsChunk = async (tokens) => {
  const details = []
  const errors = []
  let cursor = 0

  const worker = async () => {
    while (cursor < tokens.length) {
      const token = tokens[cursor]
      cursor += 1
      try {
        details.push(await abcchGet(`/animais/${encodeURIComponent(token)}`))
      } catch (error) {
        errors.push({ token, message: error.message })
      }
      if (REQUEST_DELAY_MS > 0) await sleep(REQUEST_DELAY_MS)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(FETCH_CONCURRENCY, tokens.length) }, worker),
  )

  return { details, errors }
}

const main = async () => {
  const run = await createImportRun()
  const tokens = await fetchAllTokens()
  const errors = []
  let peopleChanged = 0
  let horsesChanged = 0
  let detailCount = 0

  console.log(`Import run ${run.id}`)
  console.log(`Enriquecendo ${tokens.length} fichas ABCCH...`)

  for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
    const chunk = tokens.slice(i, i + CHUNK_SIZE)
    const { details, errors: chunkErrors } = await fetchDetailsChunk(chunk)
    errors.push(...chunkErrors.map((error) => ({ scope: 'detail', ...error })))
    detailCount += details.length

    const people = peopleFromDetails(details)
    const { idByKey, changed: peopleUpserts } = await upsertPeople(people)
    peopleChanged += peopleUpserts

    const horses = details
      .map((detail) => detailToHorse(detail, idByKey, run.id))
      .filter((horse) => horse.abcch_token)
    horsesChanged += await upsertHorses(horses)

    console.log(
      `  ${Math.min(i + CHUNK_SIZE, tokens.length)}/${tokens.length}: ${details.length} detalhes, ${chunkErrors.length} avisos`,
    )
  }

  await finishImportRun(run.id, {
    status: errors.length ? 'completed_with_warnings' : 'completed',
    total_source_rows: tokens.length,
    unique_tokens: tokens.length,
    inserted_or_updated_horses: horsesChanged,
    inserted_or_updated_people: peopleChanged,
    errors,
  })

  console.log('\nResumo')
  console.log(`  Tokens: ${tokens.length}`)
  console.log(`  Detalhes enriquecidos: ${detailCount}`)
  console.log(`  Cavalos atualizados: ${horsesChanged}`)
  console.log(`  Pessoas/organizacoes atualizadas: ${peopleChanged}`)
  console.log(`  Avisos/erros: ${errors.length}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
