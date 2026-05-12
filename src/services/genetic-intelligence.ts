import { supabase } from '@/lib/supabase/client'

const db = supabase as any
const pageSize = 1000

type SmartLotRow = {
  smartleiloes_id: string
  title: string | null
  lot_number: string | null
  category: string | null
  value: number | null
  commercial_status: string | null
  payload: Record<string, any> | null
}

type CommercialRow = {
  smartleiloes_id: string | null
  smartleiloes_lot_id: string | null
  lot_number: string | null
  value: number | null
  payload: Record<string, any> | null
}

export type GeneticRankingMode = 'mare' | 'sire' | 'cross'
export type GeneticReproductiveType =
  | 'mare'
  | 'stallion'
  | 'gelding'
  | 'embryo'
  | 'young'
  | 'unknown'

export type GeneticMetricRow = {
  key: string
  label: string
  secondaryLabel: string
  mode: GeneticRankingMode
  lotsOffered: number
  bidCount: number
  uniqueBidders: number
  salesCount: number
  soldLots: number
  salesValue: number
  bidValue: number
  topBid: number
  topSale: number
  avgSale: number
  conversionRate: number
  categories: string[]
  breeders: string[]
  reproductiveTypes: GeneticReproductiveType[]
  age: {
    min: number | null
    max: number | null
    avg: number | null
    knownLots: number
    unknownLots: number
  }
  representativeLot: {
    id: string
    title: string
    lotNumber: string
    imageUrl: string
    category: string
    mare: string
    sire: string
    damSire: string
    breeder: string
    sex: string
    reproductiveType: GeneticReproductiveType
    ageYears: number | null
    ageLabel: string
    ageSource: string
    commercialStatus: string
  } | null
}

export type GeneticGapRow = {
  source: 'Lance' | 'Venda'
  lotId: string
  lotNumber: string
  description: string
  value: number
}

export type GeneticIntelligenceData = {
  summary: {
    pedigreeLots: number
    lotsWithCommercialActivity: number
    bidCountWithPedigree: number
    salesCountWithPedigree: number
    salesValueWithPedigree: number
    unmatchedBidCount: number
    unmatchedSalesCount: number
    unmatchedSalesValue: number
    enrichmentCoverage: number
  }
  mares: GeneticMetricRow[]
  sires: GeneticMetricRow[]
  crosses: GeneticMetricRow[]
  gaps: GeneticGapRow[]
}

const valueOf = (
  record: Record<string, any> | null | undefined,
  keys: string[],
) => {
  if (!record) return ''
  for (const key of keys) {
    const value = record[key]
    if (value !== undefined && value !== null && value !== '') {
      return String(value).trim()
    }
  }
  return ''
}

const numberOf = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0
  const parsed = Number(value.replace(/[^\d,.-]/g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()

const clean = (value: string, fallback = 'Não informado') =>
  value ? value.replace(/\s+/g, ' ').trim() : fallback

const parseBirthDate = (value: string) => {
  if (!value || value === '0000-00-00') return null
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

const ageFromDate = (birthDate: Date | null) => {
  if (!birthDate) return null
  const today = new Date()
  let years = today.getFullYear() - birthDate.getFullYear()
  const birthdayThisYear = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate(),
  )
  if (today < birthdayThisYear) years -= 1
  return years >= 0 && years <= 40 ? years : null
}

const classifyReproductiveType = ({
  category,
  sex,
  title,
  payload,
}: {
  category: string
  sex: string
  title: string
  payload: Record<string, any>
}): GeneticReproductiveType => {
  const text = normalize(
    `${category} ${sex} ${title} ${valueOf(payload, [
      'observacoesLote',
      'tipoAnimalLote',
      'tipoLote',
    ])}`,
  )

  if (text.includes('EMBRIAO')) return 'embryo'
  if (text.includes('CASTRAD')) return 'gelding'
  if (text.includes('POTRO') || text.includes('POTRA')) return 'young'
  if (text.includes('GARANHAO')) return 'stallion'
  if (text.includes('MATRIZ')) return 'mare'
  if (normalize(sex).includes('MACHO')) return 'stallion'
  if (normalize(sex).includes('FEMEA')) return 'mare'
  return 'unknown'
}

const fetchAll = async <T>(table: string, columns: string): Promise<T[]> => {
  const rows: T[] = []
  let from = 0

  while (true) {
    const { data, error } = await db
      .from(table)
      .select(columns)
      .order('smartleiloes_id', { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) throw error

    rows.push(...((data || []) as T[]))
    if (!data || data.length < pageSize) break
    from += pageSize
  }

  return rows
}

const lotMeta = (lot: SmartLotRow) => {
  const payload = lot.payload || {}
  const mare = clean(valueOf(payload, ['linhagemMaternaLote00']))
  const damSire = clean(valueOf(payload, ['linhagemMaternaLote01']))
  const sire = clean(valueOf(payload, ['linhagemPaternaLote00']))
  const category = clean(
    lot.category ||
      valueOf(payload, ['categoriaLote', 'categoria_lote']) ||
      'Sem categoria',
  )
  const title = clean(lot.title || valueOf(payload, ['descricaoLote']))
  const birthDate = parseBirthDate(
    valueOf(payload, [
      'dataNascimentoAnimal',
      'data_nascimento_animal',
      'nascimentoAnimal',
      'dataNascimentoLote',
    ]),
  )
  const ageYears = ageFromDate(birthDate)
  const sex = clean(
    valueOf(payload, ['sexoLote', 'sexoAnimal']),
    'Não informado',
  )
  const breeder = clean(
    valueOf(payload, [
      'criadorLote',
      'criadorAnimal',
      'nomeCriador',
      'harasCriador',
      'harasOrigem',
      'harasLote',
      'studFarm',
      'breeder',
    ]),
  )
  const reproductiveType = classifyReproductiveType({
    category,
    sex,
    title,
    payload,
  })

  return {
    id: String(lot.smartleiloes_id),
    title,
    lotNumber: clean(lot.lot_number || valueOf(payload, ['numeroLote']), '-'),
    imageUrl: valueOf(payload, ['fotoLote01', 'fotoLote02']),
    category,
    mare,
    sire,
    damSire,
    breeder,
    sex,
    reproductiveType,
    ageYears,
    ageLabel: ageYears === null ? 'Idade não informada' : `${ageYears} anos`,
    ageSource: birthDate ? 'Smart Leilões' : 'Sem data de nascimento',
    commercialStatus: clean(
      lot.commercial_status || valueOf(payload, ['situacaoComercialLote']),
      'Não informado',
    ),
  }
}

const descriptionOf = (row: CommercialRow) =>
  clean(
    valueOf(row.payload, [
      'descricaoLoteLance',
      'descricaoLoteContrato',
      'descricaoLote',
    ]),
    'Descrição indisponível',
  )

const bidderIdOf = (row: CommercialRow) =>
  valueOf(row.payload, [
    'idLicitanteLance',
    'nomeLicitanteLance',
    'idCompradorContrato',
    'nomeCompradorContrato',
  ])

const createMetric = (
  mode: GeneticRankingMode,
  key: string,
  label: string,
  secondaryLabel: string,
  lot: ReturnType<typeof lotMeta>,
): GeneticMetricRow => ({
  key,
  label,
  secondaryLabel,
  mode,
  lotsOffered: 0,
  bidCount: 0,
  uniqueBidders: 0,
  salesCount: 0,
  soldLots: 0,
  salesValue: 0,
  bidValue: 0,
  topBid: 0,
  topSale: 0,
  avgSale: 0,
  conversionRate: 0,
  categories: [],
  breeders: [],
  reproductiveTypes: [],
  age: {
    min: null,
    max: null,
    avg: null,
    knownLots: 0,
    unknownLots: 0,
  },
  representativeLot: lot,
})

const addCategory = (row: GeneticMetricRow, category: string) => {
  if (category && !row.categories.includes(category))
    row.categories.push(category)
}

const average = (values: number[]) =>
  values.length > 0
    ? values.reduce((total, value) => total + value, 0) / values.length
    : null

const finalizeMetric = (
  row: GeneticMetricRow,
  lotIds: Set<string>,
  soldLotIds: Set<string>,
  bidders: Set<string>,
  breeders: Set<string>,
  reproductiveTypes: Set<GeneticReproductiveType>,
  ages: number[],
  unknownAgeLots: number,
) => {
  row.lotsOffered = lotIds.size
  row.soldLots = soldLotIds.size
  row.uniqueBidders = bidders.size
  row.avgSale = row.salesCount > 0 ? row.salesValue / row.salesCount : 0
  row.conversionRate =
    row.lotsOffered > 0 ? (row.soldLots / row.lotsOffered) * 100 : 0
  row.categories = row.categories.slice(0, 3)
  row.breeders = [...breeders].sort()
  row.reproductiveTypes = [...reproductiveTypes].sort()
  row.age = {
    min: ages.length > 0 ? Math.min(...ages) : null,
    max: ages.length > 0 ? Math.max(...ages) : null,
    avg: average(ages),
    knownLots: ages.length,
    unknownLots: unknownAgeLots,
  }
}

const addActivity = (
  row: GeneticMetricRow,
  type: 'bid' | 'sale',
  amount: number,
  bidderId: string,
  lotId: string,
  soldLotIds: Set<string>,
  bidders: Set<string>,
) => {
  if (type === 'bid') {
    row.bidCount += 1
    row.bidValue += amount
    row.topBid = Math.max(row.topBid, amount)
    if (bidderId) bidders.add(bidderId)
    return
  }

  row.salesCount += 1
  row.salesValue += amount
  row.topSale = Math.max(row.topSale, amount)
  if (lotId) soldLotIds.add(lotId)
}

const sortMetrics = (rows: GeneticMetricRow[]) =>
  rows.sort((a, b) => {
    const scoreA = a.salesValue * 3 + a.bidCount * 10000 + a.topBid
    const scoreB = b.salesValue * 3 + b.bidCount * 10000 + b.topBid
    return scoreB - scoreA
  })

export const geneticIntelligenceService = {
  async getData(): Promise<GeneticIntelligenceData> {
    const [lots, bids, purchases] = await Promise.all([
      fetchAll<SmartLotRow>(
        'smartleiloes_lots',
        'smartleiloes_id,title,lot_number,category,value,commercial_status,payload',
      ),
      fetchAll<CommercialRow>(
        'bids',
        'smartleiloes_id,smartleiloes_lot_id,lot_number,value,payload',
      ),
      fetchAll<CommercialRow>(
        'purchases',
        'smartleiloes_id,smartleiloes_lot_id,lot_number,value,payload',
      ),
    ])

    const lotsById = new Map(
      lots.map((lot) => [String(lot.smartleiloes_id), lotMeta(lot)]),
    )
    const mareRows = new Map<string, GeneticMetricRow>()
    const sireRows = new Map<string, GeneticMetricRow>()
    const crossRows = new Map<string, GeneticMetricRow>()
    const rowLots = new Map<string, Set<string>>()
    const rowSoldLots = new Map<string, Set<string>>()
    const rowBidders = new Map<string, Set<string>>()
    const rowBreeders = new Map<string, Set<string>>()
    const rowReproductiveTypes = new Map<string, Set<GeneticReproductiveType>>()
    const rowAges = new Map<string, number[]>()
    const rowUnknownAges = new Map<string, number>()
    const lotsWithActivity = new Set<string>()
    const gaps: GeneticGapRow[] = []

    const ensureSets = (key: string) => {
      if (!rowLots.has(key)) rowLots.set(key, new Set())
      if (!rowSoldLots.has(key)) rowSoldLots.set(key, new Set())
      if (!rowBidders.has(key)) rowBidders.set(key, new Set())
      if (!rowBreeders.has(key)) rowBreeders.set(key, new Set())
      if (!rowReproductiveTypes.has(key))
        rowReproductiveTypes.set(key, new Set())
      if (!rowAges.has(key)) rowAges.set(key, [])
      if (!rowUnknownAges.has(key)) rowUnknownAges.set(key, 0)
    }

    const ensureRow = (
      map: Map<string, GeneticMetricRow>,
      mode: GeneticRankingMode,
      label: string,
      secondaryLabel: string,
      lot: ReturnType<typeof lotMeta>,
    ) => {
      const key = `${mode}:${normalize(label)}:${normalize(secondaryLabel)}`
      if (!map.has(key))
        map.set(key, createMetric(mode, key, label, secondaryLabel, lot))
      ensureSets(key)
      const lotIds = rowLots.get(key)!
      const isNewLot = !lotIds.has(lot.id)
      lotIds.add(lot.id)
      if (isNewLot) {
        addCategory(map.get(key)!, lot.category)
        rowBreeders.get(key)?.add(lot.breeder)
        rowReproductiveTypes.get(key)?.add(lot.reproductiveType)
        if (lot.ageYears === null) {
          rowUnknownAges.set(key, (rowUnknownAges.get(key) || 0) + 1)
        } else {
          rowAges.get(key)?.push(lot.ageYears)
        }
      }
      return map.get(key)!
    }

    const rowsForLot = (lot: ReturnType<typeof lotMeta>) => [
      ensureRow(mareRows, 'mare', lot.mare, `por ${lot.damSire}`, lot),
      ensureRow(sireRows, 'sire', lot.sire, `matriz ${lot.mare}`, lot),
      ensureRow(
        crossRows,
        'cross',
        `${lot.sire} x ${lot.mare}`,
        lot.damSire,
        lot,
      ),
    ]

    for (const lot of lotsById.values()) {
      rowsForLot(lot)
    }

    let bidCountWithPedigree = 0
    let salesCountWithPedigree = 0
    let salesValueWithPedigree = 0
    let unmatchedBidCount = 0
    let unmatchedSalesCount = 0
    let unmatchedSalesValue = 0

    const processCommercial = (row: CommercialRow, type: 'bid' | 'sale') => {
      const lotId = String(row.smartleiloes_lot_id || '')
      const lot = lotsById.get(lotId)
      const amount =
        Number(row.value || 0) ||
        numberOf(valueOf(row.payload, ['valorLance', 'valorContrato']))

      if (!lot) {
        if (type === 'bid') {
          unmatchedBidCount += 1
        } else {
          unmatchedSalesCount += 1
          unmatchedSalesValue += amount
        }

        if (gaps.length < 80) {
          gaps.push({
            source: type === 'bid' ? 'Lance' : 'Venda',
            lotId,
            lotNumber: clean(String(row.lot_number || ''), '-'),
            description: descriptionOf(row),
            value: amount,
          })
        }
        return
      }

      lotsWithActivity.add(lot.id)
      if (type === 'bid') {
        bidCountWithPedigree += 1
      } else {
        salesCountWithPedigree += 1
        salesValueWithPedigree += amount
      }

      for (const metric of rowsForLot(lot)) {
        const bidders = rowBidders.get(metric.key)!
        const soldLotIds = rowSoldLots.get(metric.key)!
        addActivity(
          metric,
          type,
          amount,
          bidderIdOf(row),
          lot.id,
          soldLotIds,
          bidders,
        )
      }
    }

    bids.forEach((row) => processCommercial(row, 'bid'))
    purchases.forEach((row) => processCommercial(row, 'sale'))

    for (const row of [
      ...mareRows.values(),
      ...sireRows.values(),
      ...crossRows.values(),
    ]) {
      finalizeMetric(
        row,
        rowLots.get(row.key) || new Set(),
        rowSoldLots.get(row.key) || new Set(),
        rowBidders.get(row.key) || new Set(),
        rowBreeders.get(row.key) || new Set(),
        rowReproductiveTypes.get(row.key) || new Set(),
        rowAges.get(row.key) || [],
        rowUnknownAges.get(row.key) || 0,
      )
    }

    const totalCommercial =
      bidCountWithPedigree +
      salesCountWithPedigree +
      unmatchedBidCount +
      unmatchedSalesCount

    return {
      summary: {
        pedigreeLots: lots.length,
        lotsWithCommercialActivity: lotsWithActivity.size,
        bidCountWithPedigree,
        salesCountWithPedigree,
        salesValueWithPedigree,
        unmatchedBidCount,
        unmatchedSalesCount,
        unmatchedSalesValue,
        enrichmentCoverage:
          totalCommercial > 0
            ? ((bidCountWithPedigree + salesCountWithPedigree) /
                totalCommercial) *
              100
            : 0,
      },
      mares: sortMetrics([...mareRows.values()]),
      sires: sortMetrics([...sireRows.values()]),
      crosses: sortMetrics([...crossRows.values()]),
      gaps: gaps.sort((a, b) => b.value - a.value),
    }
  },
}
