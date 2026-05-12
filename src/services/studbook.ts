import { supabase } from '@/lib/supabase/client'

const db = supabase as any

export type StudbookHorse = {
  id: string
  name: string
  registration: string
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
  breeder_name?: string | null
  owner_name?: string | null
  birthplace?: string | null
  source_url?: string | null
  data_quality_score?: number | null
  offspring_count?: number | null
  is_reproductive_mare?: boolean | null
  last_synced_at?: string | null
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
}

export type StudbookFilters = {
  search?: string
  sex?: string
  ageBand?: string
  reproductiveOnly?: boolean
}

const emptyOverview: StudbookOverview = {
  total: 0,
  mares: 0,
  reproductiveMares: 0,
  owners: 0,
  breeders: 0,
  candidateLists: 0,
  missingBirthDate: 0,
}

const isMissingTable = (error: any) =>
  error?.code === '42P01' ||
  String(error?.message || '').includes('does not exist')

const applyFilters = (query: any, filters: StudbookFilters) => {
  let nextQuery = query

  if (filters.search?.trim()) {
    const term = filters.search.trim()
    nextQuery = nextQuery.or(
      `name.ilike.%${term}%,registration.ilike.%${term}%,microchip.ilike.%${term}%,breeder_name.ilike.%${term}%,owner_name.ilike.%${term}%`,
    )
  }

  if (filters.sex && filters.sex !== 'all') {
    nextQuery = nextQuery.ilike('sex', `%${filters.sex}%`)
  }

  if (filters.ageBand && filters.ageBand !== 'all') {
    nextQuery = nextQuery.eq('age_band', filters.ageBand)
  }

  if (filters.reproductiveOnly) {
    nextQuery = nextQuery.eq('is_reproductive_mare', true)
  }

  return nextQuery
}

export const studbookService = {
  async getOverview(): Promise<StudbookOverview> {
    try {
      const [horses, owners, breeders, lists] = await Promise.all([
        db
          .from('studbook_horses_enriched')
          .select('sex,is_reproductive_mare,birth_date', { count: 'exact' }),
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

      if (horses.error) throw horses.error
      if (owners.error) throw owners.error
      if (breeders.error) throw breeders.error
      if (lists.error) throw lists.error

      const rows = horses.data || []

      return {
        total: horses.count || rows.length,
        mares: rows.filter((row: StudbookHorse) =>
          String(row.sex || '')
            .toLowerCase()
            .includes('f'),
        ).length,
        reproductiveMares: rows.filter(
          (row: StudbookHorse) => row.is_reproductive_mare,
        ).length,
        owners: owners.count || 0,
        breeders: breeders.count || 0,
        candidateLists: lists.count || 0,
        missingBirthDate: rows.filter((row: StudbookHorse) => !row.birth_date)
          .length,
      }
    } catch (error) {
      if (isMissingTable(error)) return emptyOverview
      throw error
    }
  },

  async getHorses(filters: StudbookFilters = {}): Promise<StudbookHorse[]> {
    try {
      const query = applyFilters(
        db
          .from('studbook_horses_enriched')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(100),
        filters,
      )

      const { data, error } = await query
      if (error) throw error

      return (data || []) as StudbookHorse[]
    } catch (error) {
      if (isMissingTable(error)) return []
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
