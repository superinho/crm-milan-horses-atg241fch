import supabase from '@/lib/supabase/client'

const db = supabase as any

export type VipRadarAuction = {
  id: string
  smartleiloesId: string
  title: string
  status: string | null
  eventDate: string | null
  eventType: string | null
  value: number
  lotCount: number
  avgLotValue: number
  topLotValue: number
  categories: string[]
}

export type VipRadarSegment =
  | 'VIP ativo'
  | 'Underbidder premium'
  | 'Alto potencial sem compra'
  | 'Reativação VIP'
  | 'Comprador compatível'

export type VipRadarRecommendation = {
  contactId: string
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  city: string | null
  state: string | null
  segment: VipRadarSegment
  score: number
  monetaryValue: number
  avgTicket: number
  purchaseCount: number
  bidCount: number
  bidValue: number
  lastActivityDate: string | null
  reasons: string[]
  recommendedChannel: 'whatsapp' | 'email' | 'phone' | 'manual'
  suggestedMessage: string
}

export type VipRadarData = {
  auctions: VipRadarAuction[]
  selectedAuction: VipRadarAuction | null
  recommendations: VipRadarRecommendation[]
  summary: {
    total: number
    whatsappReady: number
    emailReady: number
    avgScore: number
    bySegment: Record<VipRadarSegment, number>
  }
}

type RfmvRow = {
  id: string
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  city: string | null
  state: string | null
  purchase_count: number
  monetary_value: number
  avg_ticket: number
  bid_count: number
  auction_count: number
  bid_value: number
  last_activity_date: string | null
  rfmv_score: number
  segment: string | null
}

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const numberValue = (value: unknown) => Number(value || 0)

const textValue = (value: unknown) => String(value || '').trim()

const daysSince = (value?: string | null) => {
  if (!value) return 9999
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 9999
  return Math.floor((Date.now() - date.getTime()) / 86_400_000)
}

const contactChannel = (row: RfmvRow): VipRadarRecommendation['recommendedChannel'] => {
  if (row.whatsapp || row.phone) return 'whatsapp'
  if (row.email) return 'email'
  return 'manual'
}

const scoreClamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

const targetValueOf = (auction: VipRadarAuction | null) => {
  if (!auction) return 0
  return auction.avgLotValue || auction.topLotValue || auction.value || 0
}

const valueFitScore = (row: RfmvRow, targetValue: number) => {
  if (!targetValue) return 8

  const customerReference = Math.max(
    numberValue(row.avg_ticket),
    numberValue(row.monetary_value) / Math.max(1, numberValue(row.purchase_count)),
    numberValue(row.bid_value) / Math.max(1, numberValue(row.bid_count)),
  )

  if (!customerReference) return targetValue >= 200_000 ? 2 : 5

  const ratio = customerReference / targetValue
  if (ratio >= 0.8 && ratio <= 1.8) return 18
  if (ratio >= 0.5 && ratio <= 2.5) return 14
  if (ratio >= 0.3 && ratio <= 3.5) return 9
  return 4
}

const segmentOf = (row: RfmvRow, inactiveDays: number): VipRadarSegment => {
  if (row.monetary_value >= 500_000 && inactiveDays <= 180) return 'VIP ativo'
  if (
    row.purchase_count === 0 &&
    (row.bid_count >= 5 || row.bid_value >= 250_000)
  ) {
    return 'Alto potencial sem compra'
  }
  if (
    row.purchase_count > 0 &&
    row.bid_count >= 5 &&
    row.bid_value >= row.monetary_value * 0.35
  ) {
    return 'Underbidder premium'
  }
  if (row.monetary_value >= 250_000 && inactiveDays > 180) return 'Reativação VIP'
  return 'Comprador compatível'
}

const segmentBoost = (segment: VipRadarSegment) => {
  if (segment === 'VIP ativo') return 18
  if (segment === 'Underbidder premium') return 17
  if (segment === 'Alto potencial sem compra') return 15
  if (segment === 'Reativação VIP') return 12
  return 8
}

const reasonsFor = (
  row: RfmvRow,
  auction: VipRadarAuction | null,
  segment: VipRadarSegment,
  targetValue: number,
) => {
  const reasons: string[] = []
  const inactiveDays = daysSince(row.last_activity_date)

  if (row.monetary_value > 0) {
    reasons.push(`${money(row.monetary_value)} em arremates históricos`)
  }

  if (row.avg_ticket > 0) {
    reasons.push(`ticket médio de ${money(row.avg_ticket)}`)
  }

  if (row.bid_count > 0) {
    reasons.push(`${row.bid_count} lances registrados`)
  }

  if (row.bid_value >= 100_000) {
    reasons.push(`${money(row.bid_value)} em intenção de lance`)
  }

  if (targetValue > 0) {
    reasons.push(`faixa compatível com lote-alvo de ${money(targetValue)}`)
  }

  if (inactiveDays <= 90) {
    reasons.push('atividade recente na base')
  } else if (segment === 'Reativação VIP') {
    reasons.push(`cliente valioso inativo há ${inactiveDays} dias`)
  }

  if (auction?.categories.length) {
    reasons.push(`catálogo com ${auction.categories.slice(0, 2).join(', ')}`)
  }

  return reasons.slice(0, 4)
}

const suggestedMessageFor = (
  row: RfmvRow,
  auction: VipRadarAuction | null,
  segment: VipRadarSegment,
) => {
  const firstName = row.name.split(' ')[0] || row.name
  const auctionTitle = auction?.title || 'o próximo leilão da Milan Horses'

  if (segment === 'Reativação VIP') {
    return `Olá, ${firstName}. Tudo bem? Separei pessoalmente alguns destaques de ${auctionTitle} que combinam com seu histórico na Milan Horses. Posso te mandar uma seleção curta?`
  }

  if (segment === 'Underbidder premium') {
    return `Olá, ${firstName}. Vi que você costuma disputar forte nossos lotes. ${auctionTitle} tem oportunidades que parecem muito alinhadas ao seu perfil. Quer que eu te envie os destaques antes do leilão?`
  }

  return `Olá, ${firstName}. ${auctionTitle} está chegando e selecionei alguns lotes que combinam com seu perfil na Milan Horses. Posso te enviar uma curadoria rápida?`
}

const mapAuction = (auction: any, lots: any[]): VipRadarAuction => {
  const lotValues = lots.map((lot) => numberValue(lot.value)).filter((value) => value > 0)
  const categories = [
    ...new Set(
      lots
        .map((lot) => lot.category || lot.payload?.categoria || lot.payload?.tipoLote)
        .filter(Boolean)
        .map(String),
    ),
  ]

  return {
    id: auction.id,
    smartleiloesId: auction.smartleiloes_id,
    title: auction.title,
    status: auction.status || null,
    eventDate: auction.event_date || null,
    eventType: auction.event_type || null,
    value: numberValue(auction.value),
    lotCount: lots.length,
    avgLotValue: lotValues.length
      ? lotValues.reduce((sum, value) => sum + value, 0) / lotValues.length
      : 0,
    topLotValue: lotValues.length ? Math.max(...lotValues) : 0,
    categories,
  }
}

const isOpenAuction = (auction: any) => {
  const status = [
    auction.status,
    auction.payload?.nomeSituacaoEvento,
    auction.payload?.situacaoEvento,
    auction.payload?.situacao,
  ]
    .map(textValue)
    .join(' ')
    .toLowerCase()

  const situationId = textValue(
    auction.payload?.idSituacaoEvento ||
      auction.payload?.id_situacao_evento ||
      auction.payload?.situacao,
  )
  const eventDate = auction.event_date ? new Date(auction.event_date) : null
  const startsInFuture =
    eventDate && !Number.isNaN(eventDate.getTime())
      ? eventDate >= new Date(Date.now() - 86_400_000)
      : false

  return (
    situationId === '1' ||
    status.includes('abert') ||
    status.includes('ativ') ||
    status.includes('pre lance') ||
    (!status && !situationId && startsInFuture)
  )
}

export const vipRadarService = {
  async getRadarData(auctionId?: string | null): Promise<VipRadarData> {
    const [
      { data: auctionRows, error: auctionsError },
      { data: lotRows, error: lotsError },
    ] = await Promise.all([
        db
          .from('smartleiloes_auctions')
          .select('*')
          .order('event_date', { ascending: false })
          .limit(200),
        db.from('smartleiloes_lots').select('*'),
      ])

    if (auctionsError) throw auctionsError
    if (lotsError) throw lotsError

    const lotsByAuctionId = new Map<string, any[]>()
    ;(lotRows || []).forEach((lot: any) => {
      const key = lot.auction_id || lot.auction_smartleiloes_id
      if (!key) return
      lotsByAuctionId.set(key, [...(lotsByAuctionId.get(key) || []), lot])
    })

    const normalizedAuctions = (auctionRows || [])
      .filter(isOpenAuction)
      .map((auction: any) =>
        mapAuction(auction, [
          ...(lotsByAuctionId.get(auction.id) || []),
          ...(lotsByAuctionId.get(auction.smartleiloes_id) || []),
        ]),
      )
    const now = Date.now()
    const auctions = normalizedAuctions.sort((a, b) => {
      const aDate = a.eventDate ? new Date(a.eventDate).getTime() : 0
      const bDate = b.eventDate ? new Date(b.eventDate).getTime() : 0
      const aIsUpcoming = aDate >= now
      const bIsUpcoming = bDate >= now

      if (aIsUpcoming !== bIsUpcoming) return aIsUpcoming ? -1 : 1
      return aIsUpcoming ? aDate - bDate : bDate - aDate
    })

    const selectedAuction =
      auctions.find(
        (auction) =>
          auction.id === auctionId || auction.smartleiloesId === auctionId,
      ) ||
      auctions.find((auction) => {
        if (!auction.eventDate) return false
        return new Date(auction.eventDate) >= new Date()
      }) ||
      auctions[0] ||
      null

    const { data: rfmvRows, error: rfmvError } = await db
      .from('customer_rfmv_view')
      .select('*')
      .order('rfmv_score', { ascending: false })

    if (rfmvError) throw rfmvError

    const targetValue = targetValueOf(selectedAuction)
    const recommendations = ((rfmvRows || []) as RfmvRow[])
      .map((rawRow) => {
        const row: RfmvRow = {
          ...rawRow,
          purchase_count: numberValue(rawRow.purchase_count),
          monetary_value: numberValue(rawRow.monetary_value),
          avg_ticket: numberValue(rawRow.avg_ticket),
          bid_count: numberValue(rawRow.bid_count),
          auction_count: numberValue(rawRow.auction_count),
          bid_value: numberValue(rawRow.bid_value),
          rfmv_score: numberValue(rawRow.rfmv_score),
        }
        const inactiveDays = daysSince(row.last_activity_date)
        const segment = segmentOf(row, inactiveDays)
        const channel = contactChannel(row)
        const recency = inactiveDays <= 30 ? 14 : inactiveDays <= 90 ? 10 : inactiveDays <= 180 ? 6 : 2
        const channelScore = channel === 'manual' ? 0 : 5
        const score = scoreClamp(
          row.rfmv_score * 2.2 +
            valueFitScore(row, targetValue) +
            segmentBoost(segment) +
            recency +
            channelScore,
        )

        return {
          contactId: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          whatsapp: row.whatsapp,
          city: row.city,
          state: row.state,
          segment,
          score,
          monetaryValue: row.monetary_value,
          avgTicket: row.avg_ticket,
          purchaseCount: row.purchase_count,
          bidCount: row.bid_count,
          bidValue: row.bid_value,
          lastActivityDate: row.last_activity_date,
          reasons: reasonsFor(row, selectedAuction, segment, targetValue),
          recommendedChannel: channel,
          suggestedMessage: suggestedMessageFor(row, selectedAuction, segment),
        } satisfies VipRadarRecommendation
      })
      .filter(
        (item) =>
          item.score >= 45 &&
          (item.purchaseCount > 0 || item.bidCount > 0 || item.monetaryValue > 0),
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 200)

    const bySegment = recommendations.reduce(
      (acc, item) => {
        acc[item.segment] = (acc[item.segment] || 0) + 1
        return acc
      },
      {
        'VIP ativo': 0,
        'Underbidder premium': 0,
        'Alto potencial sem compra': 0,
        'Reativação VIP': 0,
        'Comprador compatível': 0,
      } as Record<VipRadarSegment, number>,
    )

    return {
      auctions,
      selectedAuction,
      recommendations,
      summary: {
        total: recommendations.length,
        whatsappReady: recommendations.filter((item) => item.recommendedChannel === 'whatsapp').length,
        emailReady: recommendations.filter((item) => item.recommendedChannel === 'email').length,
        avgScore: recommendations.length
          ? Math.round(
              recommendations.reduce((sum, item) => sum + item.score, 0) /
                recommendations.length,
            )
          : 0,
        bySegment,
      },
    }
  },
}
