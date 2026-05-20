import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
  Deno.env.get('SUPABASE_SECRET_KEY')!
const ABCCH_API_URL =
  Deno.env.get('ABCCH_API_URL') || 'https://api.abcch.com.br'
const ABCCH_AUTH = Deno.env.get('ABCCH_AUTH')
const DEFAULT_TERMS =
  Deno.env.get('ABCCH_RECENT_TERMS') || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const REQUEST_DELAY_MS = Number(Deno.env.get('ABCCH_REQUEST_DELAY_MS') || 150)
const DEFAULT_YEARS_BACK = Number(Deno.env.get('ABCCH_RECENT_YEARS_BACK') || 2)
const DEFAULT_LIMIT_PER_SEARCH = Number(
  Deno.env.get('ABCCH_RECENT_LIMIT_PER_SEARCH') || 30,
)
const DEFAULT_DETAIL_LIMIT = Number(
  Deno.env.get('ABCCH_RECENT_DETAIL_LIMIT') || 80,
)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

type ApiRecord = Record<string, any>

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

const textOrNull = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const dateOnly = (value: unknown) => {
  if (!value) return null
  const raw = String(value).trim()
  const date = new Date(raw)
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10)

  const brDate = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (!brDate) return null

  const [, day, month, year] = brDate
  const numericYear = Number(year)
  const fullYear =
    year.length === 2
      ? numericYear > 30
        ? 1900 + numericYear
        : 2000 + numericYear
      : numericYear
  const parsed = new Date(
    Date.UTC(fullYear, Number(month) - 1, Number(day), 12),
  )
  return Number.isNaN(parsed.getTime())
    ? null
    : parsed.toISOString().slice(0, 10)
}

const asTerms = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((term) => String(term || '').trim())
      .filter(Boolean)
      .slice(0, 80)
  }

  return DEFAULT_TERMS.split('')
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 80)
}

const asYears = (body: any) => {
  if (Array.isArray(body?.years)) {
    const years = body.years
      .map((year: unknown) => Number(year))
      .filter((year: number) => Number.isInteger(year) && year > 1990)
      .slice(0, 6)
    if (years.length) return years
  }

  const yearsBack = Math.min(
    5,
    Math.max(0, Number(body?.yearsBack ?? DEFAULT_YEARS_BACK)),
  )
  const currentYear = new Date().getFullYear()
  return Array.from(
    { length: yearsBack + 1 },
    (_, index) => currentYear - index,
  )
}

const createImportRun = async (terms: string[], years: number[]) => {
  const { data, error } = await supabase
    .from('studbook_import_runs')
    .insert({
      status: 'running',
      search_terms: { terms, years },
      notes:
        'Sync recente ABCCH Studbook via Edge Function, com upsert por CdToken.',
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

const finishImportRun = async (
  id: string,
  payload: Record<string, unknown>,
) => {
  await supabase
    .from('studbook_import_runs')
    .update({
      ...payload,
      finished_at: new Date().toISOString(),
    })
    .eq('id', id)
}

const abcchGet = async (path: string) => {
  if (!ABCCH_AUTH) {
    throw new Error('ABCCH_AUTH is required to run the Studbook crawler.')
  }

  const response = await fetch(`${ABCCH_API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: ABCCH_AUTH,
    },
  })
  const text = await response.text()

  if (!response.ok) {
    throw new Error(
      `${response.status} ${response.statusText} ${path}: ${text}`,
    )
  }

  return text ? JSON.parse(text) : null
}

const searchAnimals = async (
  term: string,
  year: number,
  limitPerSearch: number,
) => {
  const params = new URLSearchParams({
    tipo: '1',
    ano: String(year),
    nome: term,
    limit: String(limitPerSearch),
    page: '1',
  })
  const data = await abcchGet(`/animais?${params.toString()}`)
  return Array.isArray(data?.data) ? (data.data as ApiRecord[]) : []
}

const fetchDetails = async (token: string) =>
  abcchGet(`/animais/${encodeURIComponent(token)}`) as Promise<ApiRecord>

const peoplePayloads = (records: ApiRecord[], details: ApiRecord[]) => {
  const people = new Map<string, Record<string, unknown>>()

  for (const record of [...records, ...details]) {
    const ownerName = textOrNull(record.NmUserOwner)
    if (ownerName) {
      people.set(`${normalize(ownerName)}|owner`, {
        name: ownerName,
        normalized_name: normalize(ownerName),
        role: 'owner',
        source: 'ABCCH',
        source_payload: record,
        updated_at: new Date().toISOString(),
      })
    }

    const breederName = textOrNull(record.NmUserBreeder)
    if (breederName) {
      people.set(`${normalize(breederName)}|breeder`, {
        name: breederName,
        normalized_name: normalize(breederName),
        role: 'breeder',
        source: 'ABCCH',
        source_payload: record,
        updated_at: new Date().toISOString(),
      })
    }
  }

  return [...people.values()]
}

const upsertPeople = async (records: ApiRecord[], details: ApiRecord[]) => {
  const people = peoplePayloads(records, details)
  if (!people.length) return new Map<string, string>()

  const { data, error } = await supabase
    .from('studbook_people_orgs')
    .upsert(people, { onConflict: 'normalized_name,role' })
    .select('id,normalized_name,role')

  if (error) throw error

  const ids = new Map<string, string>()
  for (const person of data || []) {
    ids.set(`${person.normalized_name}|${person.role}`, person.id)
  }
  return ids
}

const horsePayload = (
  record: ApiRecord,
  detail: ApiRecord | undefined,
  peopleIds: Map<string, string>,
  runId: string,
) => {
  const source = detail || record
  const ownerName = textOrNull(source.NmUserOwner)
  const breederName = textOrNull(source.NmUserBreeder)
  const birthDate = dateOnly(source.DtFoaled)
  const token = textOrNull(source.CdToken || record.CdToken)
  const ownerKey = ownerName ? `${normalize(ownerName)}|owner` : null
  const breederKey = breederName ? `${normalize(breederName)}|breeder` : null

  return {
    abcch_token: token,
    name:
      textOrNull(source.NmAnimal) || textOrNull(record.NmAnimal) || 'SEM NOME',
    normalized_name: normalize(source.NmAnimal || record.NmAnimal),
    registration: textOrNull(source.NrRegistration),
    original_registration: textOrNull(source.NrRegistrationOriginal),
    ueln: textOrNull(source.NrUELN),
    microchip: textOrNull(source.CdMicrochip),
    breed: textOrNull(source.DsBreed),
    sex: textOrNull(source.DsGender || source.NmGender || source.CdGender),
    birth_date: birthDate,
    birth_year: birthDate ? Number(birthDate.slice(0, 4)) : null,
    coat: textOrNull(source.DsCoatColor),
    status: textOrNull(source.DsStatus),
    dna: textOrNull(source.DsDNAResult || source.CdDNALaboratory),
    breeder_id: breederKey ? peopleIds.get(breederKey) || null : null,
    owner_id: ownerKey ? peopleIds.get(ownerKey) || null : null,
    abcch_owner_token: textOrNull(source.CdTokenOwner),
    abcch_breeder_token: textOrNull(source.CdTokenBreeder),
    birthplace: textOrNull(source.DsFoalBirthplace),
    sire_name: textOrNull(source.NmAnimalSire),
    dam_name: textOrNull(source.NmAnimalDam),
    source_url: token ? `https://abcch.com.br/studbook/animal/${token}` : null,
    source: 'ABCCH',
    source_payload: source,
    import_batch_id: runId,
    data_quality_score: [
      token,
      source.NmAnimal,
      source.NrRegistration,
      source.DtFoaled,
      source.DsGender || source.NmGender || source.CdGender,
      source.NmAnimalSire,
      source.NmAnimalDam,
      ownerName,
      breederName,
      source.DsBreed,
      source.CdMicrochip,
    ].filter(Boolean).length,
    abcch_detail_synced_at: detail ? new Date().toISOString() : null,
    abcch_detail_sync_status: detail ? 'success' : 'pending',
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders })

  if (!ABCCH_AUTH) {
    return jsonResponse(
      {
        error: 'ABCCH_AUTH is not configured.',
        message:
          'Configure ABCCH_AUTH in the Supabase Edge Function environment before running Studbook sync.',
      },
      400,
    )
  }

  const body = await req.json().catch(() => ({}))
  const terms = asTerms(body?.terms)
  const years = asYears(body)
  const limitPerSearch = Math.min(
    100,
    Math.max(1, Number(body?.limitPerSearch ?? DEFAULT_LIMIT_PER_SEARCH)),
  )
  const detailLimit = Math.min(
    500,
    Math.max(0, Number(body?.detailLimit ?? DEFAULT_DETAIL_LIMIT)),
  )
  const errors: Array<Record<string, unknown>> = []
  const run = await createImportRun(terms, years)

  try {
    const recordsByToken = new Map<string, ApiRecord>()
    let totalSourceRows = 0

    for (const year of years) {
      for (const term of terms) {
        try {
          const rows = await searchAnimals(term, year, limitPerSearch)
          totalSourceRows += rows.length
          for (const row of rows) {
            const token = textOrNull(row.CdToken)
            if (token) recordsByToken.set(token, row)
          }
        } catch (error) {
          errors.push({
            stage: 'search',
            term,
            year,
            message: error instanceof Error ? error.message : String(error),
          })
        }
        await sleep(REQUEST_DELAY_MS)
      }
    }

    const detailsByToken = new Map<string, ApiRecord>()
    for (const token of [...recordsByToken.keys()].slice(0, detailLimit)) {
      try {
        detailsByToken.set(token, await fetchDetails(token))
      } catch (error) {
        errors.push({
          stage: 'detail',
          token,
          message: error instanceof Error ? error.message : String(error),
        })
      }
      await sleep(REQUEST_DELAY_MS)
    }

    const records = [...recordsByToken.values()]
    const details = [...detailsByToken.values()]
    const peopleIds = await upsertPeople(records, details)
    const horses = records.map((record) =>
      horsePayload(
        record,
        detailsByToken.get(String(record.CdToken || '')),
        peopleIds,
        run.id,
      ),
    )

    const { data: upsertedHorses, error: horseError } = horses.length
      ? await supabase
          .from('studbook_horses')
          .upsert(horses, { onConflict: 'abcch_token' })
          .select('id')
      : { data: [], error: null }

    if (horseError) throw horseError

    const status = errors.length ? 'completed_with_errors' : 'completed'
    await finishImportRun(run.id, {
      status,
      total_source_rows: totalSourceRows,
      unique_tokens: recordsByToken.size,
      inserted_or_updated_horses: upsertedHorses?.length || 0,
      inserted_or_updated_people: peopleIds.size,
      errors,
    })

    return jsonResponse({
      status,
      runId: run.id,
      years,
      terms: terms.length,
      totalSourceRows,
      uniqueTokens: recordsByToken.size,
      insertedOrUpdatedHorses: upsertedHorses?.length || 0,
      insertedOrUpdatedPeople: peopleIds.size,
      errors,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await finishImportRun(run.id, {
      status: 'failed',
      errors: [...errors, { stage: 'fatal', message }],
    })
    return jsonResponse({ error: message, runId: run.id }, 500)
  }
})
