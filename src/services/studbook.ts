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
  recentYears?: number
  rankMode?: 'volume' | 'recent'
  sortBy?: StudbookSortMode
}

export type StudbookPagination = {
  page?: number
  pageSize?: number
}

export type StudbookHorsePage = {
  rows: StudbookHorse[]
  total: number
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

export type StudbookNetworkKind = 'breeder' | 'owner' | 'sire' | 'dam'

export type StudbookNetworkEntity = {
  entity_id?: string | null
  entity_kind: StudbookNetworkKind
  name: string
  horse_count: number
  female_count: number
  young_count: number
  active_mare_count: number
  connected_owner_count: number
  avg_quality?: number | null
  latest_birth_year?: number | null
  recent_horse_count?: number | null
  crm_contact_count?: number | null
  total_entities?: number | null
}

export type StudbookNetworkOverview = {
  breeders: StudbookNetworkEntity[]
  owners: StudbookNetworkEntity[]
  sires: StudbookNetworkEntity[]
  dams: StudbookNetworkEntity[]
  stats: {
    breeders: number
    owners: number
    sires: number
    dams: number
  }
}

export type StudbookNetworkDetail = {
  entity: StudbookNetworkEntity
  horses: StudbookHorse[]
  horseTotal: number
  page: number
  pageSize: number
  crmContacts: StudbookCrmContact[]
}

export type StudbookCrmContact = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  city?: string | null
  state?: string | null
  tags?: Array<{ id: string; name: string; color: string }>
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

const horseListColumns = [
  'id',
  'name',
  'registration',
  'original_registration',
  'ueln',
  'microchip',
  'breed',
  'sex',
  'birth_date',
  'birth_year',
  'age_years',
  'age_band',
  'coat',
  'status',
  'dna',
  'sire_name',
  'dam_name',
  'breeder_name',
  'owner_name',
  'birthplace',
  'source_url',
  'data_quality_score',
  'offspring_count',
  'is_reproductive_mare',
  'last_synced_at',
  'updated_at',
].join(',')

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

  if (typeof filters.recentYears === 'number' && filters.recentYears > 0) {
    const cutoffYear = new Date().getFullYear() - filters.recentYears + 1
    nextQuery = nextQuery.gte('birth_year', cutoffYear)
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

const hasActiveHorseFilters = (filters: StudbookFilters) =>
  searchTokens(filters.search).length > 0 ||
  Boolean(filters.sex && filters.sex !== 'all') ||
  Boolean(filters.ageBand && filters.ageBand !== 'all') ||
  filters.includeUnknownAge === false ||
  Boolean(filters.reproductiveOnly) ||
  Boolean(filters.breederNames?.length) ||
  Boolean(filters.ownerNames?.length) ||
  Boolean(filters.sireNames?.length) ||
  Boolean(filters.damNames?.length) ||
  Boolean(filters.minOffspring && filters.minOffspring > 0) ||
  Boolean(filters.dataQualityMin && filters.dataQualityMin > 0) ||
  Boolean(filters.recentYears && filters.recentYears > 0)

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

const emptyNetworkOverview: StudbookNetworkOverview = {
  breeders: [],
  owners: [],
  sires: [],
  dams: [],
  stats: {
    breeders: 0,
    owners: 0,
    sires: 0,
    dams: 0,
  },
}

const entityNameColumnByKind: Record<StudbookNetworkKind, keyof StudbookHorse> =
  {
    breeder: 'breeder_name',
    owner: 'owner_name',
    sire: 'sire_name',
    dam: 'dam_name',
  }

const legacyRankingQueries = async () => {
  const [
    breederRows,
    ownerRows,
    sireRows,
    damRows,
    breederCount,
    ownerCount,
    sireCount,
    damCount,
  ] = await Promise.all([
    db
      .from('studbook_breeder_rankings')
      .select('*')
      .order('horse_count', { ascending: false })
      .limit(6),
    db
      .from('studbook_owner_rankings')
      .select('*')
      .order('horse_count', { ascending: false })
      .limit(6),
    db
      .from('studbook_sire_rankings')
      .select('*')
      .order('horse_count', { ascending: false })
      .limit(6),
    db
      .from('studbook_dam_rankings')
      .select('*')
      .order('horse_count', { ascending: false })
      .limit(6),
    db
      .from('studbook_breeder_rankings')
      .select('entity_id', { count: 'exact', head: true }),
    db
      .from('studbook_owner_rankings')
      .select('entity_id', { count: 'exact', head: true }),
    db
      .from('studbook_sire_rankings')
      .select('entity_id', { count: 'exact', head: true }),
    db
      .from('studbook_dam_rankings')
      .select('entity_id', { count: 'exact', head: true }),
  ])

  const results = [
    breederRows,
    ownerRows,
    sireRows,
    damRows,
    breederCount,
    ownerCount,
    sireCount,
    damCount,
  ]
  const failed = results.find((result) => result.error)
  if (failed?.error) throw failed.error

  return {
    breeders: (breederRows.data || []) as StudbookNetworkEntity[],
    owners: (ownerRows.data || []) as StudbookNetworkEntity[],
    sires: (sireRows.data || []) as StudbookNetworkEntity[],
    dams: (damRows.data || []) as StudbookNetworkEntity[],
    stats: {
      breeders: breederCount.count || 0,
      owners: ownerCount.count || 0,
      sires: sireCount.count || 0,
      dams: damCount.count || 0,
    },
  }
}

const networkRowsToOverview = (
  rows: StudbookNetworkEntity[],
): StudbookNetworkOverview => {
  const grouped = {
    breeders: rows.filter((row) => row.entity_kind === 'breeder'),
    owners: rows.filter((row) => row.entity_kind === 'owner'),
    sires: rows.filter((row) => row.entity_kind === 'sire'),
    dams: rows.filter((row) => row.entity_kind === 'dam'),
  }

  return {
    ...grouped,
    stats: {
      breeders: grouped.breeders[0]?.total_entities || grouped.breeders.length,
      owners: grouped.owners[0]?.total_entities || grouped.owners.length,
      sires: grouped.sires[0]?.total_entities || grouped.sires.length,
      dams: grouped.dams[0]?.total_entities || grouped.dams.length,
    },
  }
}

const networkRpcPayload = (filters: StudbookFilters = {}) => ({
  p_search: filters.search?.trim() || null,
  p_sex: filters.sex || 'all',
  p_min_age: filters.includeUnknownAge === false ? filters.minAge : null,
  p_max_age: filters.includeUnknownAge === false ? filters.maxAge : null,
  p_include_unknown_age: filters.includeUnknownAge !== false,
  p_reproductive_only: Boolean(filters.reproductiveOnly),
  p_breeder_names: filters.breederNames?.length ? filters.breederNames : null,
  p_owner_names: filters.ownerNames?.length ? filters.ownerNames : null,
  p_sire_names: filters.sireNames?.length ? filters.sireNames : null,
  p_dam_names: filters.damNames?.length ? filters.damNames : null,
  p_min_offspring: filters.minOffspring || null,
  p_data_quality_min: filters.dataQualityMin || null,
  p_recent_years: filters.recentYears || null,
  p_rank_mode: filters.rankMode || 'volume',
  p_limit: 6,
})

const normalizeName = (value: unknown) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const entityTagName = (entity: StudbookNetworkEntity) =>
  entity.entity_kind === 'owner'
    ? 'Studbook Proprietário'
    : entity.entity_kind === 'breeder'
      ? 'Studbook Criador'
      : 'Studbook Linhagem'

const prospectingThesis = (entity: StudbookNetworkEntity) => {
  if (entity.entity_kind === 'breeder') {
    return `${entity.name} aparece como criador relevante no Studbook BH, com ${entity.horse_count} animais registrados. Tese: iniciar relacionamento para convites de leilão, captação de lotes e acesso a famílias maternas.`
  }

  if (entity.entity_kind === 'owner') {
    return `${entity.name} aparece como proprietário relevante no Studbook BH, com ${entity.horse_count} animais registrados. Tese: transformar proprietário em comprador, vendedor ou convidado VIP dos próximos leilões Milan Horses.`
  }

  if (entity.entity_kind === 'sire') {
    return `${entity.name} concentra ${entity.horse_count} descendentes mapeados. Tese: usar a influência do garanhão para criar campanha de convite por linhagem e identificar criadores/proprietários conectados.`
  }

  return `${entity.name} concentra ${entity.horse_count} descendentes mapeados como matriz. Tese: usar a força da família materna para selecionar convidados, fornecedores e potenciais lotes para leilões premium.`
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

  async getHorses(
    filters: StudbookFilters = {},
    pagination: StudbookPagination = {},
  ): Promise<StudbookHorsePage> {
    try {
      const hasSearch = searchTokens(filters.search).length > 0
      const hasFilters = hasActiveHorseFilters(filters)
      const page = Math.max(1, pagination.page || 1)
      const pageSize = Math.min(100, Math.max(10, pagination.pageSize || 50))
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const query = applyFilters(
        applySort(
          db.from('studbook_horses_enriched').select(horseListColumns),
          filters.sortBy || 'updated',
        ).range(from, to),
        filters,
      )

      const { data, error } = await query
      if (error) throw error

      const rows = (data || []) as StudbookHorse[]
      let total = rows.length

      if (!hasFilters) {
        const countResult = await db
          .from('studbook_horses')
          .select('id', { count: 'exact', head: true })
        if (countResult.error) throw countResult.error
        total = countResult.count || 0
      } else {
        const countResult = await applyFilters(
          db
            .from('studbook_horses_enriched')
            .select('id', { count: 'exact', head: true }),
          filters,
        )
        if (!countResult.error) total = countResult.count || rows.length
      }

      if (!hasSearch) {
        return {
          rows,
          total,
        }
      }

      const scoredRows = rows
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
        .map((result) => result.horse)

      return {
        rows: scoredRows,
        total,
      }
    } catch (error) {
      if (isMissingTable(error)) return { rows: [], total: 0 }
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

  async getNetworkOverview(
    filters: StudbookFilters = {},
  ): Promise<StudbookNetworkOverview> {
    try {
      const { data, error } = await db.rpc(
        'get_studbook_network_rankings',
        networkRpcPayload(filters),
      )

      if (error) throw error

      return networkRowsToOverview((data || []) as StudbookNetworkEntity[])
    } catch (error) {
      console.warn(
        'Filtered Studbook rankings unavailable, using fallback.',
        error,
      )
      try {
        return await legacyRankingQueries()
      } catch (fallbackError) {
        if (isMissingTable(fallbackError)) return emptyNetworkOverview
        throw fallbackError
      }
    }
  },

  async getNetworkDetail(
    kind: StudbookNetworkKind,
    name: string,
    filters: StudbookFilters = {},
    seedEntity?: StudbookNetworkEntity,
    pagination: StudbookPagination = {},
  ): Promise<StudbookNetworkDetail | null> {
    try {
      const nameColumn = entityNameColumnByKind[kind]
      const page = Math.max(1, pagination.page || 1)
      const pageSize = Math.min(50, Math.max(8, pagination.pageSize || 12))
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const entity =
        seedEntity ||
        ({
          entity_kind: kind,
          name,
          horse_count: 0,
          female_count: 0,
          young_count: 0,
          active_mare_count: 0,
          connected_owner_count: 0,
          recent_horse_count: 0,
          crm_contact_count: 0,
        } satisfies StudbookNetworkEntity)

      const horseQuery = applyFilters(
        db
          .from('studbook_horses_enriched')
          .select(horseListColumns)
          .eq(nameColumn, name)
          .order('birth_year', { ascending: false, nullsFirst: false })
          .order('data_quality_score', { ascending: false })
          .range(from, to),
        filters,
      )

      const [{ data: horses, error: horsesError }, crmContacts] =
        await Promise.all([horseQuery, this.findCrmContactsByName(name)])

      if (horsesError) throw horsesError

      return {
        entity: entity as StudbookNetworkEntity,
        horses: (horses || []) as StudbookHorse[],
        horseTotal: entity.horse_count || (horses || []).length,
        page,
        pageSize,
        crmContacts,
      }
    } catch (error) {
      if (isMissingTable(error)) return null
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

  async createProspectingListFromEntity(entity: StudbookNetworkEntity) {
    const { data, error } = await db
      .from('auction_candidate_lists')
      .insert({
        name: `Prospecção - ${entity.name}`.slice(0, 90),
        thesis: prospectingThesis(entity),
        status: 'draft',
        filters: {
          source: 'studbook_network',
          kind: entity.entity_kind,
          name: entity.name,
          horse_count: entity.horse_count,
        },
      })
      .select()
      .single()

    if (error) throw error
    return data as AuctionCandidateList
  },

  async findCrmContactsByName(name: string): Promise<StudbookCrmContact[]> {
    const token = name.split(/\s+/).find((part) => part.length > 3) || name
    const { data, error } = await db
      .from('contacts')
      .select(
        'id,name,email,phone,whatsapp,city,state,contact_tags(tags(id,name,color))',
      )
      .ilike('name', `%${token}%`)
      .limit(20)

    if (error) throw error

    const normalized = normalizeName(name)
    return ((data || []) as any[])
      .filter((contact) => normalizeName(contact.name) === normalized)
      .map((contact) => ({
        ...contact,
        tags:
          contact.contact_tags?.map((item: any) => item.tags).filter(Boolean) ||
          [],
      }))
  },

  async createOrTagCrmContactFromEntity(entity: StudbookNetworkEntity) {
    const tagName = entityTagName(entity)
    const existingContacts = await this.findCrmContactsByName(entity.name)
    let [contact] = existingContacts

    if (!contact) {
      const { data, error } = await db
        .from('contacts')
        .insert({
          name: entity.name,
          email: '',
          phone: '',
          whatsapp: null,
          origin: 'Studbook ABCCH',
          notes: prospectingThesis(entity),
          preferences: {
            source: 'studbook_network',
            kind: entity.entity_kind,
            horse_count: entity.horse_count,
            recent_horse_count: entity.recent_horse_count || 0,
          },
        })
        .select('id,name,email,phone,whatsapp,city,state')
        .single()

      if (error) throw error
      contact = data as StudbookCrmContact
    }

    let { data: tag, error: tagError } = await db
      .from('tags')
      .select('id,name,color')
      .eq('name', tagName)
      .maybeSingle()

    if (tagError) throw tagError

    if (!tag) {
      const created = await db
        .from('tags')
        .insert({
          name: tagName,
          color: 'bg-primary text-primary-foreground hover:bg-primary/90',
        })
        .select('id,name,color')
        .single()

      if (created.error) throw created.error
      tag = created.data
    }

    const { error: contactTagError } = await db
      .from('contact_tags')
      .upsert({ contact_id: contact.id, tag_id: tag.id })

    if (contactTagError) throw contactTagError

    return { contact, tag }
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
