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
  id: string | null
  auction_id: string | null
  contact_id: string | null
  date: string | null
  description?: string | null
  reason?: string | null
  smartleiloes_id: string | null
  smartleiloes_lot_id: string | null
  lot_number: string | null
  value: number | null
  payload: Record<string, any> | null
  contacts?: ContactSummary | ContactSummary[] | null
}

type ContactSummary = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  smartleiloes_id: string | null
}

type GeneticLotMeta = ReturnType<typeof lotMeta>

export type GeneticRankingMode = 'mare' | 'sire'
export type GeneticReproductiveType =
  | 'mare'
  | 'stallion'
  | 'gelding'
  | 'embryo'
  | 'young'
  | 'unknown'

export type GeneticCommercialEntry = {
  id: string
  smartleiloesId: string
  date: string
  value: number
  description: string
  status: string
  participantId: string
  participantName: string
  contact: ContactSummary | null
}

export type GeneticEvidenceLot = {
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
  sourceLabel: string
  bidCount: number
  uniqueBidders: number
  bidValue: number
  salesCount: number
  salesValue: number
  topBid: number
  topSale: number
  bids: GeneticCommercialEntry[]
  purchases: GeneticCommercialEntry[]
}

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
    sourceLabel: string
  } | null
  evidence: GeneticEvidenceLot[]
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
    .replace(/[ºª]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()

const normalizeComparable = (value: string) =>
  normalize(value)
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const clean = (value: string, fallback = 'Não informado') =>
  value ? value.replace(/\s+/g, ' ').trim() : fallback

const hasValue = (value: string) => {
  const normalized = normalizeComparable(value)
  return Boolean(normalized && normalized !== 'NAO INFORMADO')
}

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

const fetchAll = async <T>(
  table: string,
  columns: string,
  orderBy = 'smartleiloes_id',
): Promise<T[]> => {
  const rows: T[] = []
  let from = 0

  while (true) {
    const { data, error } = await db
      .from(table)
      .select(columns)
      .order(orderBy, { ascending: true })
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
    sourceLabel: 'Smart Leilões: pedigree informado no lote',
  }
}

const commercialTitleOf = (row: CommercialRow) =>
  descriptionOf(row)
    .replace(/\s*\|\s*ID\s+contrato.*$/i, '')
    .replace(/\s*\|\s*ID\s+lance.*$/i, '')
    .trim()

const descriptionOf = (row: CommercialRow) =>
  clean(
    row.description ||
      valueOf(row.payload, [
        'descricaoLoteLance',
        'descricaoLoteContrato',
        'descricaoLote',
      ]),
    'Descrição indisponível',
  )

const contactOf = (row: CommercialRow) => {
  if (Array.isArray(row.contacts)) return row.contacts[0] || null
  return row.contacts || null
}

const participantNameOf = (row: CommercialRow, type: 'bid' | 'sale') => {
  const contact = contactOf(row)
  if (contact?.name) return contact.name

  return clean(
    valueOf(
      row.payload,
      type === 'bid'
        ? [
            'nomeLicitanteLance',
            'licitante',
            'nome_licitante',
            'nomeCliente',
            'cliente',
          ]
        : [
            'nomeCompradorContrato',
            'comprador',
            'nome_comprador',
            'nomeCliente',
            'cliente',
          ],
    ),
    type === 'bid'
      ? 'Licitante não identificado'
      : 'Comprador não identificado',
  )
}

const participantIdOf = (row: CommercialRow, type: 'bid' | 'sale') => {
  const contact = contactOf(row)
  if (contact?.id) return contact.id

  return valueOf(
    row.payload,
    type === 'bid'
      ? [
          'idLicitanteLance',
          'id_licitante_lance',
          'id_licitante',
          'licitante_id',
          'nomeLicitanteLance',
        ]
      : [
          'idCompradorContrato',
          'id_comprador_contrato',
          'id_comprador',
          'comprador_id',
          'nomeCompradorContrato',
        ],
  )
}

const bidderIdOf = (row: CommercialRow) =>
  participantIdOf(row, 'bid') ||
  valueOf(row.payload, [
    'idLicitanteLance',
    'nomeLicitanteLance',
    'idCompradorContrato',
    'nomeCompradorContrato',
  ])

const categoryOf = (row: CommercialRow) =>
  clean(
    valueOf(row.payload, [
      'categoriaLoteContrato',
      'categoriaLoteLance',
      'categoriaLote',
      'categoria',
    ]),
    'Sem categoria',
  )

const isClearlyNonHorseLot = (row: CommercialRow) => {
  const category = normalizeComparable(categoryOf(row))
  const title = normalizeComparable(commercialTitleOf(row))

  if (/\b(PALHETA|SEMEN|SEMEM|COBERTURA)\b/.test(category)) return false
  if (category && category !== 'SEM GRUPO DEFINIDO') return false

  return /\b(SELA|CASACA|CAMISA|CAPACETE|CASACO|LUVA|BOTA|ARREIO|MANTA|QUADRO|LIVRO|CINTO|BONE|CHAPEU|HOTEL|VINHO|POLO|COLAR|BRILHANTE)\b/.test(
    title,
  )
}

const createEvidenceLot = (lot: GeneticLotMeta): GeneticEvidenceLot => ({
  id: lot.id,
  title: lot.title,
  lotNumber: lot.lotNumber,
  imageUrl: lot.imageUrl,
  category: lot.category,
  mare: lot.mare,
  sire: lot.sire,
  damSire: lot.damSire,
  breeder: lot.breeder,
  sex: lot.sex,
  reproductiveType: lot.reproductiveType,
  ageYears: lot.ageYears,
  ageLabel: lot.ageLabel,
  ageSource: lot.ageSource,
  commercialStatus: lot.commercialStatus,
  sourceLabel: lot.sourceLabel,
  bidCount: 0,
  uniqueBidders: 0,
  bidValue: 0,
  salesCount: 0,
  salesValue: 0,
  topBid: 0,
  topSale: 0,
  bids: [],
  purchases: [],
})

const commercialEntryOf = (
  row: CommercialRow,
  type: 'bid' | 'sale',
  amount: number,
): GeneticCommercialEntry => ({
  id: clean(String(row.id || row.smartleiloes_id || ''), '-'),
  smartleiloesId: clean(String(row.smartleiloes_id || ''), '-'),
  date: clean(String(row.date || ''), 'Sem data'),
  value: amount,
  description: descriptionOf(row),
  status:
    type === 'bid'
      ? clean(
          row.reason ||
            valueOf(row.payload, ['situacaoLance', 'situacao', 'status']),
          'Lance registrado',
        )
      : clean(
          valueOf(row.payload, [
            'situacaoComercialContrato',
            'situacaoContrato',
            'situacao',
            'status',
          ]),
          'Vendido',
        ),
  participantId: participantIdOf(row, type),
  participantName: participantNameOf(row, type),
  contact: contactOf(row),
})

const createMetric = (
  mode: GeneticRankingMode,
  key: string,
  label: string,
  secondaryLabel: string,
  lot: GeneticLotMeta,
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
  evidence: [],
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
  row.secondaryLabel =
    row.mode === 'sire'
      ? 'Garanhão confirmado no pedigree dos lotes'
      : 'Matriz confirmada no pedigree dos lotes'
  row.evidence = row.evidence.sort(
    (a, b) =>
      b.salesValue +
      b.bidValue +
      b.topBid -
      (a.salesValue + a.bidValue + a.topBid),
  )
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

const addEvidenceActivity = (
  evidenceLot: GeneticEvidenceLot,
  type: 'bid' | 'sale',
  entry: GeneticCommercialEntry,
) => {
  if (type === 'bid') {
    evidenceLot.bids.push(entry)
    evidenceLot.bidCount += 1
    evidenceLot.bidValue += entry.value
    evidenceLot.topBid = Math.max(evidenceLot.topBid, entry.value)
    evidenceLot.uniqueBidders = new Set(
      evidenceLot.bids
        .map((bid) => bid.participantId || bid.participantName)
        .filter(Boolean),
    ).size
    return
  }

  evidenceLot.purchases.push(entry)
  evidenceLot.salesCount += 1
  evidenceLot.salesValue += entry.value
  evidenceLot.topSale = Math.max(evidenceLot.topSale, entry.value)
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
        'id,auction_id,contact_id,date,reason,smartleiloes_id,smartleiloes_lot_id,lot_number,value,payload,contacts(id,name,email,phone,whatsapp,smartleiloes_id)',
      ),
      fetchAll<CommercialRow>(
        'purchases',
        'id,auction_id,contact_id,date,description,smartleiloes_id,smartleiloes_lot_id,lot_number,value,payload,contacts(id,name,email,phone,whatsapp,smartleiloes_id)',
      ),
    ])

    const lotsById = new Map(
      lots.map((lot) => [String(lot.smartleiloes_id), lotMeta(lot)]),
    )
    const pedigreeLotIds = new Set<string>()
    const mareRows = new Map<string, GeneticMetricRow>()
    const sireRows = new Map<string, GeneticMetricRow>()
    const rowLots = new Map<string, Set<string>>()
    const rowSoldLots = new Map<string, Set<string>>()
    const rowBidders = new Map<string, Set<string>>()
    const rowBreeders = new Map<string, Set<string>>()
    const rowReproductiveTypes = new Map<string, Set<GeneticReproductiveType>>()
    const rowAges = new Map<string, number[]>()
    const rowUnknownAges = new Map<string, number>()
    const rowEvidenceLots = new Map<string, Map<string, GeneticEvidenceLot>>()
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
      if (!rowEvidenceLots.has(key)) rowEvidenceLots.set(key, new Map())
    }

    const ensureRow = (
      map: Map<string, GeneticMetricRow>,
      mode: GeneticRankingMode,
      label: string,
      secondaryLabel: string,
      lot: GeneticLotMeta,
    ) => {
      const key = `${mode}:${normalize(label)}`
      if (!map.has(key))
        map.set(key, createMetric(mode, key, label, secondaryLabel, lot))
      ensureSets(key)
      const metric = map.get(key)!
      const lotIds = rowLots.get(key)!
      const isNewLot = !lotIds.has(lot.id)
      lotIds.add(lot.id)
      if (isNewLot) {
        addCategory(metric, lot.category)
        rowBreeders.get(key)?.add(lot.breeder)
        rowReproductiveTypes.get(key)?.add(lot.reproductiveType)
        const evidence = createEvidenceLot(lot)
        rowEvidenceLots.get(key)?.set(lot.id, evidence)
        metric.evidence.push(evidence)
        if (lot.ageYears === null) {
          rowUnknownAges.set(key, (rowUnknownAges.get(key) || 0) + 1)
        } else {
          rowAges.get(key)?.push(lot.ageYears)
        }
      }
      return metric
    }

    const rowsForLot = (lot: GeneticLotMeta) => {
      const rows: GeneticMetricRow[] = []

      if (hasValue(lot.mare)) {
        rows.push(
          ensureRow(
            mareRows,
            'mare',
            lot.mare,
            'Matriz confirmada no pedigree dos lotes',
            lot,
          ),
        )
      }

      if (hasValue(lot.sire)) {
        rows.push(
          ensureRow(
            sireRows,
            'sire',
            lot.sire,
            'Garanhão confirmado no pedigree dos lotes',
            lot,
          ),
        )
      }

      if (rows.length > 0) pedigreeLotIds.add(lot.id)
      return rows
    }

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
      let lot = lotsById.get(lotId)
      const amount =
        Number(row.value || 0) ||
        numberOf(valueOf(row.payload, ['valorLance', 'valorContrato']))

      if (!lot) {
        if (isClearlyNonHorseLot(row)) return

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

      const metricRows = rowsForLot(lot)
      if (metricRows.length === 0) {
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
      const entry = commercialEntryOf(row, type, amount)
      if (type === 'bid') {
        bidCountWithPedigree += 1
      } else {
        salesCountWithPedigree += 1
        salesValueWithPedigree += amount
      }

      for (const metric of metricRows) {
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
        const evidenceLot = rowEvidenceLots.get(metric.key)?.get(lot.id)
        if (evidenceLot) addEvidenceActivity(evidenceLot, type, entry)
      }
    }

    bids.forEach((row) => processCommercial(row, 'bid'))
    purchases.forEach((row) => processCommercial(row, 'sale'))

    for (const row of [...mareRows.values(), ...sireRows.values()]) {
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
        pedigreeLots: pedigreeLotIds.size,
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
      gaps: gaps.sort((a, b) => b.value - a.value),
    }
  },
}
