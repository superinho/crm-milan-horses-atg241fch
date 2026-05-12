import { supabase } from '@/lib/supabase/client'

const db = supabase as any

export type StudbookHorse = {
  id: string
  name: string
  registration?: string | null
  original_registration?: string | null
  ueln?: string | null
  microchip?: string | null
  breed?: string | null
  sex?: string | null
  birth_date?: string | null
  birth_year?: number | null
  age_years?: number | null
  age_band?: string | null
  coat?: string | null
  status?: string | null
  dna?: string | null
  sire_name?: string | null
  dam_name?: string | null
  breeder_name?: string | null
  owner_name?: string | null
  birthplace?: string | null
  source_url?: string | null
  data_quality_score?: number | null
  offspring_count?: number | null
  is_reproductive_mare?: boolean | null
  last_synced_at?: string | null
  updated_at?: string | null
}

export type AuctionCandidateList = {
  id: string
  name: string
  thesis?: string | null
  status?: string | null
  filters?: Record<string, unknown> | null
  notes?: string | null
  created_at?: string | null
  item_count?: number
}

export type StudbookOverview = {
  total: number
  mares: number
  reproductiveMares: number
  owners: number
  breeders: number
  candidateLists: number
  missingBirthDate: number
  missingOwner: number
  withGenealogy: number
}

export type StudbookSortMode =
  | 'updated'
  | 'name'
  | 'age_asc'
  | 'age_desc'
  | 'offspring'
  | 'quality'

export type StudbookFilters = {
  search?: string
  sex?: string
  ageBand?: string
  reproductiveOnly?: boolean
  breederNames?: string[]
  ownerNames?: string[]
  sireNames?: string[]
  damNames?: string[]
  minAge?: number
  maxAge?: number
  includeUnknownAge?: boolean
  minOffspring?: number
  dataQualityMin?: number
  sortBy?: StudbookSortMode
}

export type StudbookFilterOption = {
  value: string
  label: string
  count: number
}

export type StudbookFilterOptions = {
  breeders: StudbookFilterOption[]
  owners: StudbookFilterOption[]
  sires: StudbookFilterOption[]
  dams: StudbookFilterOption[]
  ageMin: number
  ageMax: number
}

const emptyOverview: StudbookOverview = {
  total: 0,
  mares: 0,
  reproductiveMares: 0,
  owners: 0,
  breeders: 0,
  candidateLists: 0,
  missingBirthDate: 0,
  missingOwner: 0,
  withGenealogy: 0,
}

const isMissingTable = (error: any) =>
  error?.code === '42P01' ||
  String(error?.message || '').includes('does not exist')

const searchColumns = [
  'name',
  'registration',
  'original_registration',
  'ueln',
  'microchip',
  'breeder_name',
  'owner_name',
  'sire_name',
  'dam_name',
]

const searchStopwords = new Set([
  'a',
  'as',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'e',
  'em',
  'o',
  'os',
])

const normalizeSearchText = (value: unknown) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const searchTokens = (search?: string) =>
  normalizeSearchText(search)
    .split(' ')
    .filter((token) => {
      if (!token) return false
      if (searchStopwords.has(token)) return false
      return token.length > 1 || /\d/.test(token)
    })
    .slice(0, 8)

const safeSearchToken = (token: string) => token.replace(/[%,()]/g, '').trim()

const applySearchFilter = (query: any, search?: string) => {
  const tokens = searchTokens(search).map(safeSearchToken).filter(Boolean)
  let nextQuery = query

  tokens.forEach((token) => {
    nextQuery = nextQuery.or(
      searchColumns.map((column) => `${column}.ilike.%${token}%`).join(','),
    )
  })

  return nextQuery
}

const applyFemaleFilter = (query: any) =>
  query.or(
    'sex.eq.F,sex.ilike.%femea%,sex.ilike.%fêmea%,sex.ilike.%égua%,sex.ilike.%egua%',
  )

const applyFilters = (query: any, filters: StudbookFilters) => {
  let nextQuery = query

  nextQuery = applySearchFilter(nextQuery, filters.search)

  if (filters.sex && filters.sex !== 'all') {
    if (filters.sex === 'gelding') {
      nextQuery = nextQuery.ilike('sex', '%castrad%')
    } else if (filters.sex === 'female') {
      nextQuery = applyFemaleFilter(nextQuery)
    } else if (filters.sex === 'male') {
      nextQuery = nextQuery.or(
        'sex.eq.M,sex.ilike.%macho%,sex.ilike.%garanhão%,sex.ilike.%garanhao%',
      )
    } else {
      nextQuery = nextQuery.ilike('sex', `%${filters.sex}%`)
    }
  }

  if (filters.ageBand && filters.ageBand !== 'all') {
    nextQuery = nextQuery.eq('age_band', filters.ageBand)
  }

  if (
    filters.includeUnknownAge === false &&
    typeof filters.minAge === 'number'
  ) {
    nextQuery = nextQuery.gte('age_years', filters.minAge)
  }

  if (
    filters.includeUnknownAge === false &&
    typeof filters.maxAge === 'number'
  ) {
    nextQuery = nextQuery.lte('age_years', filters.maxAge)
  }

  if (filters.reproductiveOnly) {
    nextQuery = nextQuery.eq('is_reproductive_mare', true)
  }

  if (filters.breederNames?.length) {
    nextQuery = nextQuery.in('breeder_name', filters.breederNames)
  }

  if (filters.ownerNames?.length) {
    nextQuery = nextQuery.in('owner_name', filters.ownerNames)
  }

  if (filters.sireNames?.length) {
    nextQuery = nextQuery.in('sire_name', filters.sireNames)
  }

  if (filters.damNames?.length) {
    nextQuery = nextQuery.in('dam_name', filters.damNames)
  }

  if (typeof filters.minOffspring === 'number' && filters.minOffspring > 0) {
    nextQuery = nextQuery.gte('offspring_count', filters.minOffspring)
  }

  if (
    typeof filters.dataQualityMin === 'number' &&
    filters.dataQualityMin > 0
  ) {
    nextQuery = nextQuery.gte('data_quality_score', filters.dataQualityMin)
  }

  return nextQuery
}

const applySort = (query: any, sortBy: StudbookSortMode = 'updated') => {
  if (sortBy === 'name') return query.order('name', { ascending: true })
  if (sortBy === 'age_asc')
    return query.order('age_years', { ascending: true, nullsFirst: false })
  if (sortBy === 'age_desc')
    return query.order('age_years', { ascending: false, nullsFirst: false })
  if (sortBy === 'offspring')
    return query.order('offspring_count', { ascending: false })
  if (sortBy === 'quality')
    return query.order('data_quality_score', { ascending: false })
  return query.order('updated_at', { ascending: false })
}

const searchableText = (horse: StudbookHorse) =>
  normalizeSearchText(
    [
      horse.name,
      horse.registration,
      horse.original_registration,
      horse.ueln,
      horse.microchip,
      horse.breeder_name,
      horse.owner_name,
      horse.sire_name,
      horse.dam_name,
      horse.breed,
      horse.sex,
    ].join(' '),
  )

const scoreSearchResult = (horse: StudbookHorse, search?: string) => {
  const tokens = searchTokens(search)
  if (!tokens.length) return 0

  const allText = searchableText(horse)
  if (!tokens.every((token) => allText.includes(token))) return 0

  const query = normalizeSearchText(search)
  const name = normalizeSearchText(horse.name)
  const registration = normalizeSearchText(registrationLabel(horse))
  const sire = normalizeSearchText(horse.sire_name)
  const dam = normalizeSearchText(horse.dam_name)
  const breeder = normalizeSearchText(horse.breeder_name)
  const owner = normalizeSearchText(horse.owner_name)

  let score = 0

  if (name === query) score += 1200
  if (name.startsWith(query)) score += 700
  if (name.includes(query)) score += 450
  if (registration.includes(query)) score += 420
  if (sire.includes(query) || dam.includes(query)) score += 300
  if (breeder.includes(query) || owner.includes(query)) score += 220

  tokens.forEach((token) => {
    if (name.startsWith(token)) score += 90
    if (name.includes(token)) score += 70
    if (registration.includes(token)) score += 65
    if (sire.includes(token)) score += 50
    if (dam.includes(token)) score += 50
    if (breeder.includes(token)) score += 35
    if (owner.includes(token)) score += 35
  })

  score += Math.min(qualityScore(horse), 100) / 10
  return score
}

const qualityScore = (horse: StudbookHorse) =>
  Number.isFinite(Number(horse.data_quality_score))
    ? Number(horse.data_quality_score)
    : 0

const registrationLabel = (horse: StudbookHorse) =>
  horse.registration ||
  horse.original_registration ||
  horse.ueln ||
  horse.microchip ||
  ''

const compareBySort = (
  a: StudbookHorse,
  b: StudbookHorse,
  sortBy: StudbookSortMode = 'updated',
) => {
  if (sortBy === 'name') return a.name.localeCompare(b.name, 'pt-BR')
  if (sortBy === 'age_asc') return (a.age_years ?? 999) - (b.age_years ?? 999)
  if (sortBy === 'age_desc') return (b.age_years ?? -1) - (a.age_years ?? -1)
  if (sortBy === 'offspring')
    return Number(b.offspring_count || 0) - Number(a.offspring_count || 0)
  if (sortBy === 'quality') return qualityScore(b) - qualityScore(a)
  return (
    new Date(b.updated_at || '').getTime() -
    new Date(a.updated_at || '').getTime()
  )
}

const optionList = (
  rows: StudbookHorse[],
  key: keyof Pick<
    StudbookHorse,
    'breeder_name' | 'owner_name' | 'sire_name' | 'dam_name'
  >,
) => {
  const counts = new Map<string, number>()

  rows.forEach((row) => {
    const value = String(row[key] || '').trim()
    if (!value) return
    counts.set(value, (counts.get(value) || 0) + 1)
  })

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
    .slice(0, 80)
    .map(([value, count]) => ({
      value,
      label: `${value} (${count})`,
      count,
    }))
}

export const studbookService = {
  async getOverview(): Promise<StudbookOverview> {
    try {
      const [
        total,
        mares,
        reproductiveMares,
        missingBirthDate,
        missingOwner,
        withGenealogy,
        owners,
        breeders,
        lists,
      ] = await Promise.all([
        db
          .from('studbook_horses_enriched')
          .select('id', { count: 'exact', head: true }),
        applyFemaleFilter(
          db
            .from('studbook_horses_enriched')
            .select('id', { count: 'exact', head: true }),
        ),
        db
          .from('studbook_horses_enriched')
          .select('id', { count: 'exact', head: true })
          .eq('is_reproductive_mare', true),
        db
          .from('studbook_horses_enriched')
          .select('id', { count: 'exact', head: true })
          .is('birth_date', null),
        db
          .from('studbook_horses_enriched')
          .select('id', { count: 'exact', head: true })
          .is('owner_name', null),
        db
          .from('studbook_horses_enriched')
          .select('id', { count: 'exact', head: true })
          .not('sire_name', 'is', null)
          .not('dam_name', 'is', null),
        db
          .from('studbook_people_orgs')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'owner'),
        db
          .from('studbook_people_orgs')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'breeder'),
        db
          .from('auction_candidate_lists')
          .select('id', { count: 'exact', head: true }),
      ])

      if (total.error) throw total.error
      if (mares.error) throw mares.error
      if (reproductiveMares.error) throw reproductiveMares.error
      if (missingBirthDate.error) throw missingBirthDate.error
      if (missingOwner.error) throw missingOwner.error
      if (withGenealogy.error) throw withGenealogy.error
      if (owners.error) throw owners.error
      if (breeders.error) throw breeders.error
      if (lists.error) throw lists.error

      return {
        total: total.count || 0,
        mares: mares.count || 0,
        reproductiveMares: reproductiveMares.count || 0,
        owners: owners.count || 0,
        breeders: breeders.count || 0,
        candidateLists: lists.count || 0,
        missingBirthDate: missingBirthDate.count || 0,
        missingOwner: missingOwner.count || 0,
        withGenealogy: withGenealogy.count || 0,
      }
    } catch (error) {
      if (isMissingTable(error)) return emptyOverview
      throw error
    }
  },

  async getHorses(filters: StudbookFilters = {}): Promise<StudbookHorse[]> {
    try {
      const hasSearch = searchTokens(filters.search).length > 0
      const query = applyFilters(
        applySort(
          db.from('studbook_horses_enriched').select('*'),
          filters.sortBy || 'updated',
        ).limit(hasSearch ? 600 : 160),
        filters,
      )

      const { data, error } = await query
      if (error) throw error

      const rows = (data || []) as StudbookHorse[]

      if (!hasSearch) return rows

      return rows
        .map((horse) => ({
          horse,
          score: scoreSearchResult(horse, filters.search),
        }))
        .filter((result) => result.score > 0)
        .sort(
          (a, b) =>
            b.score - a.score ||
            compareBySort(a.horse, b.horse, filters.sortBy || 'updated'),
        )
        .slice(0, 160)
        .map((result) => result.horse)
    } catch (error) {
      if (isMissingTable(error)) return []
      throw error
    }
  },

  async getFilterOptions(): Promise<StudbookFilterOptions> {
    try {
      const { data, error } = await db
        .from('studbook_horses_enriched')
        .select('breeder_name,owner_name,sire_name,dam_name,age_years')
        .limit(2000)

      if (error) throw error

      const rows = (data || []) as StudbookHorse[]
      const ages = rows
        .map((row) => row.age_years)
        .filter((age): age is number => typeof age === 'number')

      return {
        breeders: optionList(rows, 'breeder_name'),
        owners: optionList(rows, 'owner_name'),
        sires: optionList(rows, 'sire_name'),
        dams: optionList(rows, 'dam_name'),
        ageMin: ages.length ? Math.max(0, Math.min(...ages)) : 0,
        ageMax: ages.length ? Math.min(30, Math.max(...ages)) : 25,
      }
    } catch (error) {
      if (isMissingTable(error)) {
        return {
          breeders: [],
          owners: [],
          sires: [],
          dams: [],
          ageMin: 0,
          ageMax: 25,
        }
      }
      throw error
    }
  },

  async getCandidateLists(): Promise<AuctionCandidateList[]> {
    try {
      const { data, error } = await db
        .from('auction_candidate_lists')
        .select('*, auction_candidate_items(id)')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      return (data || []).map((list: any) => ({
        ...list,
        item_count: list.auction_candidate_items?.length || 0,
      }))
    } catch (error) {
      if (isMissingTable(error)) return []
      throw error
    }
  },

  async createCandidateList(name: string, thesis?: string) {
    const { data, error } = await db
      .from('auction_candidate_lists')
      .insert({
        name,
        thesis: thesis || '',
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error
    return data as AuctionCandidateList
  },

  async addHorseToList(listId: string, horseId: string, reason: string) {
    const { error } = await db.from('auction_candidate_items').upsert(
      {
        list_id: listId,
        horse_id: horseId,
        reason,
        potential_score: 0,
      },
      { onConflict: 'list_id,horse_id' },
    )

    if (error) throw error
  },
}
