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
const TERM_SET =
  env.ABCCH_TERMS || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ÁÉÍÓÚÂÊÔÃÕÇÜÑ.- '
const DETAIL_LIMIT = Number(env.ABCCH_DETAIL_LIMIT || 0)
const DETAIL_ONLY_MARES = env.ABCCH_DETAIL_ONLY_MARES === 'true'
const BATCH_SIZE = Number(env.ABCCH_BATCH_SIZE || 500)
const PEOPLE_BATCH_SIZE = Number(env.ABCCH_PEOPLE_BATCH_SIZE || 500)
const REQUEST_DELAY_MS = Number(env.ABCCH_REQUEST_DELAY_MS || 150)

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

const createImportRun = async (terms) => {
  const [run] = await supabaseRequest('studbook_import_runs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      status: 'running',
      search_terms: terms,
      notes:
        'Importacao publica ABCCH Studbook por termos de busca, com deduplicacao por CdToken.',
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
  const res = await fetch(`${ABCCH_API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: ABCCH_AUTH,
    },
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} ${path}: ${text}`)
  }
  return text ? JSON.parse(text) : null
}

const searchAnimals = async (term) => {
  const qs = new URLSearchParams({
    tipo: '1',
    ano: '0',
    nome: term,
    limit: '30',
    page: '1',
  })
  const data = await abcchGet(`/animais?${qs.toString()}`)
  return Array.isArray(data?.data) ? data.data : []
}

const fetchDetails = async (token) =>
  abcchGet(`/animais/${encodeURIComponent(token)}`)

const upsertPeople = async (peopleByKey) => {
  const people = [...peopleByKey.values()]
  const idByKey = new Map()
  let changed = 0

  for (let i = 0; i < people.length; i += PEOPLE_BATCH_SIZE) {
    const chunk = people.slice(i, i + PEOPLE_BATCH_SIZE)
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

const listRecordToHorse = (record, peopleIds, runId) => {
  const ownerName = textOrNull(record.NmUserOwner)
  const ownerKey = ownerName ? `${normalize(ownerName)}|owner` : null
  const birthDate = dateOnly(record.DtFoaled)

  return horsePayload({
    abcch_token: textOrNull(record.CdToken),
    name: textOrNull(record.NmAnimal) || 'SEM NOME',
    normalized_name: normalize(record.NmAnimal),
    registration: textOrNull(record.NrRegistration),
    sex: textOrNull(record.NmGender || record.DsGender || record.CdGender),
    birth_date: birthDate,
    birth_year: birthDate ? Number(birthDate.slice(0, 4)) : null,
    owner_id: ownerKey ? peopleIds.get(ownerKey) || null : null,
    sire_name: textOrNull(record.NmAnimalSire),
    dam_name: textOrNull(record.NmAnimalDam),
    source_url: record.CdToken
      ? `https://abcch.com.br/studbook/animal/${record.CdToken}`
      : null,
    source: 'ABCCH',
    source_payload: record,
    source_checksum: checksum(record),
    import_batch_id: runId,
    data_quality_score: [
      record.CdToken,
      record.NmAnimal,
      record.NrRegistration,
      record.DtFoaled,
      record.NmGender || record.CdGender,
      record.NmAnimalSire,
      record.NmAnimalDam,
      record.NmUserOwner,
    ].filter(Boolean).length,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
}

const detailToPatch = (detail, peopleIds, runId) => {
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
    ].filter(Boolean).length,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
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
    console.log(
      `  Supabase: ${Math.min(i + BATCH_SIZE, horses.length)}/${horses.length} cavalos gravados`,
    )
  }
  return changed
}

const collectPeopleFromList = (records) => {
  const people = new Map()
  for (const record of records) {
    const ownerName = textOrNull(record.NmUserOwner)
    if (ownerName) {
      people.set(`${normalize(ownerName)}|owner`, {
        name: ownerName,
        normalized_name: normalize(ownerName),
        role: 'owner',
        source: 'ABCCH',
        source_payload: { sourceField: 'NmUserOwner' },
        updated_at: new Date().toISOString(),
      })
    }
  }
  return people
}

const addPeopleFromDetails = (people, details) => {
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
}

const main = async () => {
  const terms = [...new Set([...TERM_SET].filter((term) => term.trim()))]
  const run = await createImportRun(terms)
  const recordsByToken = new Map()
  const errors = []
  let totalSourceRows = 0

  console.log(`Import run ${run.id}`)
  console.log(`Buscando ABCCH por ${terms.length} termos...`)

  for (const term of terms) {
    try {
      const rows = await searchAnimals(term)
      totalSourceRows += rows.length
      for (const row of rows) {
        if (row?.CdToken) recordsByToken.set(row.CdToken, row)
      }
      console.log(
        `  termo "${term}": ${rows.length} linhas, ${recordsByToken.size} unicos`,
      )
      await sleep(REQUEST_DELAY_MS)
    } catch (error) {
      errors.push({ scope: 'search', term, message: error.message })
      console.error(`  erro no termo "${term}": ${error.message}`)
    }
  }

  const listRecords = [...recordsByToken.values()]
  const detailCandidates = DETAIL_ONLY_MARES
    ? listRecords.filter((record) =>
        String(record.NmGender || record.CdGender || '')
          .toLowerCase()
          .includes('f'),
      )
    : listRecords
  const selectedForDetails =
    DETAIL_LIMIT > 0 ? detailCandidates.slice(0, DETAIL_LIMIT) : []
  const details = []

  if (selectedForDetails.length) {
    console.log(`Buscando detalhes de ${selectedForDetails.length} cavalos...`)
  }

  for (const [index, record] of selectedForDetails.entries()) {
    try {
      details.push(await fetchDetails(record.CdToken))
      if ((index + 1) % 50 === 0) {
        console.log(`  detalhes: ${index + 1}/${selectedForDetails.length}`)
      }
      await sleep(REQUEST_DELAY_MS)
    } catch (error) {
      errors.push({
        scope: 'detail',
        token: record.CdToken,
        registration: record.NrRegistration,
        message: error.message,
      })
    }
  }

  const people = collectPeopleFromList(listRecords)
  addPeopleFromDetails(people, details)
  console.log(`Gravando ${people.size} pessoas/organizacoes...`)
  const { idByKey, changed: peopleChanged } = await upsertPeople(people)

  const horsesByToken = new Map(
    listRecords.map((record) => [
      record.CdToken,
      listRecordToHorse(record, idByKey, run.id),
    ]),
  )

  for (const detail of details) {
    if (detail?.CdToken) {
      horsesByToken.set(detail.CdToken, detailToPatch(detail, idByKey, run.id))
    }
  }

  const horses = [...horsesByToken.values()].filter(
    (horse) => horse.abcch_token,
  )
  console.log(`Gravando ${horses.length} cavalos no Supabase...`)
  const horsesChanged = await upsertHorses(horses)

  await finishImportRun(run.id, {
    status: errors.length ? 'completed_with_warnings' : 'completed',
    total_source_rows: totalSourceRows,
    unique_tokens: recordsByToken.size,
    inserted_or_updated_horses: horsesChanged,
    inserted_or_updated_people: peopleChanged,
    errors,
  })

  console.log('\nResumo')
  console.log(`  Linhas fonte: ${totalSourceRows}`)
  console.log(`  Cavalos unicos: ${recordsByToken.size}`)
  console.log(`  Cavalos gravados: ${horsesChanged}`)
  console.log(`  Pessoas/organizacoes gravadas: ${peopleChanged}`)
  console.log(`  Detalhes enriquecidos: ${details.length}`)
  console.log(`  Avisos/erros: ${errors.length}`)
}

main().catch(async (error) => {
  console.error(error)
  process.exitCode = 1
})
