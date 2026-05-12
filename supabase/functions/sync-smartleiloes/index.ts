import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
  Deno.env.get('SUPABASE_SECRET_KEY')!
const SMARTLEILOES_API_KEY = Deno.env.get('SMARTLEILOES_API_KEY')
const SMARTLEILOES_API_SECRET = Deno.env.get('SMARTLEILOES_API_SECRET')

const SMARTLEILOES_BASE_URL = 'https://api.smartleiloes.digital/v1'
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

type ApiRecord = Record<string, any>
type SyncCounter = { fetched: number; saved: number; failed: number }
type SyncSummary = Record<string, SyncCounter>

const currentYear = new Date().getFullYear()
const BATCH_SIZE = 100

const endpoints = [
  {
    key: 'clients',
    type: 'client',
    path: '/empresa/clientes?palavra-chave=&id-cliente=&situacao=99&formato-resultado=1&limite=5000',
  },
  {
    key: 'events',
    type: 'event',
    path: `/empresa/eventos?palavra-chave=&id-evento=&data-inicio=${currentYear - 1}-01-01&data-fim=${currentYear + 2}-12-31&situacao=1&tipo-evento=99&formato-resultado=1&limite=5000`,
  },
  {
    key: 'lots',
    type: 'lot',
    path: '/empresa/lotes?palavra-chave=&id-evento=&id-lote=&id-tipo-lote=999999&situacao-comercial=99&situacao=99&formato-resultado=1&ordenacao=1',
  },
  {
    key: 'bids',
    type: 'bid',
    path: '/empresa/lances?id-evento=&id-lote=&id-licitante=999999&limite=5000',
  },
  {
    key: 'contracts',
    type: 'contract',
    path: `/empresa/contratos?palavra-chave=&id-contrato=&id-evento=&id-lote=&id-vendedor=&id-comprador=&data-inicio=${currentYear - 8}-01-01&data-fim=${currentYear + 1}-12-31&situacao=99&situacao-assinatura=99&limite=5000`,
  },
  {
    key: 'revenues',
    type: 'revenue',
    path: `/empresa/receitas-eventos?palavra-chave=&id-evento=&id-cliente=&id-tipo-data=1&data-inicio=${currentYear - 8}-01-01&data-fim=${currentYear + 1}-12-31&situacao=99&ordenacao=1&limite=5000`,
  },
] as const

type EndpointKey = (typeof endpoints)[number]['key']

const endpointScopes: Record<string, EndpointKey[]> = {
  contacts: ['clients'],
  auctions: ['events', 'lots'],
  commercial: ['bids', 'contracts'],
  all: endpoints.map((endpoint) => endpoint.key),
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const normalizeKey = (key: string) =>
  key
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()

const valueOf = (record: ApiRecord, keys: string[]) => {
  const normalizedEntries = Object.entries(record).map(([key, value]) => [
    normalizeKey(key),
    value,
  ])

  for (const key of keys) {
    const direct = record[key]
    if (direct !== undefined && direct !== null && direct !== '') return direct

    const normalizedKey = normalizeKey(key)
    const found = normalizedEntries.find(
      ([entryKey, value]) =>
        entryKey === normalizedKey &&
        value !== undefined &&
        value !== null &&
        value !== '',
    )
    if (found) return found[1]
  }

  return undefined
}

const asString = (value: unknown) =>
  value === undefined || value === null ? '' : String(value).trim()

const asNumber = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0

  const raw = value.replace(/[^\d,.-]/g, '').trim()
  if (!raw) return 0

  const lastComma = raw.lastIndexOf(',')
  const lastDot = raw.lastIndexOf('.')

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.'
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ','
    const normalized = raw
      .replaceAll(thousandsSeparator, '')
      .replace(decimalSeparator, '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const parsed = Number(raw.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

const asDate = (value: unknown) => {
  if (!value) return null
  const raw = String(value).trim()
  const brazilianDate = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  const isoDateOnly = raw.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T]00:00(?::00)?(?:\.000)?(?:Z|[+-]\d{2}:?\d{2})?)?$/,
  )

  if (brazilianDate) {
    const [, day, month, year] = brazilianDate
    const numericYear = Number(year)
    const fullYear =
      year.length === 2
        ? numericYear > 30
          ? 1900 + numericYear
          : 2000 + numericYear
        : numericYear
    const date = new Date(
      Date.UTC(fullYear, Number(month) - 1, Number(day), 12),
    )

    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }

  if (isoDateOnly) {
    const [, year, month, day] = isoDateOnly
    const date = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day), 12),
    )

    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }

  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const asDateOnly = (value: unknown) => {
  const date = asDate(value)
  return date ? date.slice(0, 10) : null
}

const birthDateOf = (record: ApiRecord) =>
  asDateOnly(
    valueOf(record, [
      'birth_date',
      'birthday',
      'data_nascimento',
      'data_nascimento_cliente',
      'dataNascimento',
      'dataNascimentoCliente',
      'dt_nascimento',
      'dtNascimento',
      'nascimento',
      'nascimentoCliente',
      'data_aniversario',
      'dataAniversario',
      'aniversario',
      'aniversário',
    ]),
  )

const extractItems = (data: any): ApiRecord[] => {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []

  const candidates = [
    data.data,
    data.items,
    data.result,
    data.results,
    data.registros,
    data.retorno,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }

  for (const value of Object.values(data)) {
    if (Array.isArray(value)) return value as ApiRecord[]
  }

  return [data]
}

const externalId = (record: ApiRecord, type: string, index: number) => {
  const value = valueOf(record, [
    'id',
    'id_cliente',
    'id_evento',
    'id_lote',
    'id_lance',
    'id_contrato',
    'id_receita',
    'codigo',
    'key',
  ])

  if (value !== undefined) return asString(value)
  return `${type}-${index}-${JSON.stringify(record).slice(0, 80)}`
}

const titleOf = (record: ApiRecord, fallback: string) =>
  asString(
    valueOf(record, [
      'nome',
      'nomeCliente',
      'nome_cliente',
      'nomeRazaoSocialCliente',
      'nome_razao_social_cliente',
      'razao_social',
      'razão social',
      'nome_evento',
      'nomeEvento',
      'titulo',
      'título',
      'descricao',
      'descrição',
      'descricao_lote_contrato',
      'descricao_lote_lance',
      'evento',
      'nome_evento',
      'lote',
      'nome_lote',
    ]),
  ) || fallback

const amountOf = (record: ApiRecord) =>
  asNumber(
    valueOf(record, [
      'valor',
      'valor_total',
      'valor_total_faturamento_evento',
      'valorTotalFaturamentoEvento',
      'valor_lance',
      'valor_arremate',
      'valor_contrato',
      'total',
      'preco',
      'preço',
    ]),
  )

const recordDateOf = (record: ApiRecord) =>
  asDate(
    valueOf(record, [
      'data',
      'data_evento',
      'data_inicio_evento',
      'dataInicioEvento',
      'data_termino_evento',
      'dataTerminoEvento',
      'data_transmissao_evento',
      'dataTransmissaoEvento',
      'data_hora_inicio_prelance_evento',
      'dataHoraInicioPrelanceEvento',
      'data_lance',
      'datalance',
      'data_contrato',
      'data_emissao_contrato',
      'data_vencimento',
      'created_at',
    ]),
  )

const eventExternalIdOf = (record: ApiRecord) =>
  asString(
    valueOf(record, [
      'id_evento',
      'id_evento_lance',
      'id_evento_contrato',
      'evento_id',
      'evento',
    ]),
  )

const clientExternalIdOf = (record: ApiRecord) =>
  asString(
    valueOf(record, [
      'id_cliente',
      'cliente_id',
      'id_licitante',
      'id_licitante_lance',
      'id_comprador',
      'id_comprador_contrato',
      'id_vendedor',
      'id_vendedor_contrato',
    ]),
  )

const lotExternalIdOf = (record: ApiRecord) =>
  asString(
    valueOf(record, [
      'id_lote',
      'id_lote_lance',
      'id_lote_contrato',
      'lote_id',
      'lote',
    ]),
  )

const commercialStatusOf = (record: ApiRecord) =>
  asString(
    valueOf(record, [
      'situacao_comercial_contrato',
      'situacao_comercial',
      'situação_comercial',
      'situacao',
      'situação',
      'status',
    ]),
  )

const requestSmart = async (path: string, init: RequestInit = {}) => {
  const response = await fetch(`${SMARTLEILOES_BASE_URL}${path}`, init)
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.erro ||
        data?.error ||
        `Smart Leilões retornou status ${response.status}`,
    )
  }

  return data
}

const authenticateSmartLeiloes = async () => {
  if (!SMARTLEILOES_API_KEY || !SMARTLEILOES_API_SECRET) {
    throw new Error(
      'Secrets SMARTLEILOES_API_KEY e SMARTLEILOES_API_SECRET não configurados.',
    )
  }

  const data = await requestSmart('/empresa/auth', {
    method: 'POST',
    headers: {
      'api-key': SMARTLEILOES_API_KEY,
      'api-secret': SMARTLEILOES_API_SECRET,
    },
  })

  const token =
    data?.token ||
    data?.access_token ||
    data?.bearer ||
    data?.data?.token ||
    data?.data?.access_token

  if (!token) {
    throw new Error('Autenticação Smart Leilões não retornou token.')
  }

  return String(token)
}

const chunk = <T>(items: T[], size = BATCH_SIZE) => {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

const uniqueBy = <T>(items: T[], keyOf: (item: T) => string) => {
  const map = new Map<string, T>()
  for (const item of items) {
    const key = keyOf(item)
    if (key) map.set(key, item)
  }
  return [...map.values()]
}

const upsertRows = async (
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
) => {
  if (!rows.length) return

  for (const rowsChunk of chunk(rows)) {
    const { error } = await supabase
      .from(table)
      .upsert(rowsChunk, { onConflict })

    if (error) throw error
  }
}

const deleteRowsByIds = async (
  table: string,
  column: string,
  ids: string[],
) => {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  if (!uniqueIds.length) return

  for (const idsChunk of chunk(uniqueIds)) {
    const { error } = await supabase.from(table).delete().in(column, idsChunk)
    if (error) throw error
  }
}

const fetchIdMap = async (
  table: string,
  externalIds: string[],
): Promise<Map<string, string>> => {
  const map = new Map<string, string>()
  const uniqueExternalIds = [...new Set(externalIds.filter(Boolean))]
  if (!uniqueExternalIds.length) return map

  for (const idsChunk of chunk(uniqueExternalIds)) {
    const { data, error } = await supabase
      .from(table)
      .select('id, smartleiloes_id')
      .in('smartleiloes_id', idsChunk)

    if (error) throw error
    for (const row of data || []) {
      if (row.smartleiloes_id) map.set(row.smartleiloes_id, row.id)
    }
  }

  return map
}

const rawRowsFor = (type: string, records: ApiRecord[]) =>
  uniqueBy(
    records.map((record, index) => {
      const id = externalId(record, type, index)
      return {
        record_type: type,
        external_id: id,
        title: titleOf(record, `Smart Leilões ${type}`),
        amount: amountOf(record),
        record_date: recordDateOf(record),
        related_event_id: eventExternalIdOf(record) || null,
        related_client_id: clientExternalIdOf(record) || null,
        payload: record,
        updated_at: new Date().toISOString(),
      }
    }),
    (row) => `${row.record_type}:${row.external_id}`,
  )

const contactRowsFor = (records: ApiRecord[]) =>
  uniqueBy(
    records.map((record, index) => {
      const smartleiloesId = externalId(record, 'client', index)
      const email = asString(
        valueOf(record, [
          'email',
          'e-mail',
          'email_cliente',
          'emailCliente01',
          'emailCliente02',
        ]),
      )
      const phone = asString(
        valueOf(record, [
          'telefone',
          'celular',
          'fone',
          'phone',
          'telefoneCliente01',
          'telefoneCliente02',
          'celularCliente01',
          'celularCliente02',
        ]),
      )
      const whatsapp = asString(
        valueOf(record, [
          'whatsapp',
          'celular_whatsapp',
          'celularCliente01',
          'celularCliente02',
        ]),
      )
      const document = asString(
        valueOf(record, [
          'cpf_cnpj',
          'cpf-cnpj',
          'cpfCnpjCliente',
          'documento',
          'cpf',
          'cnpj',
        ]),
      )
      const birthDate = birthDateOf(record)

      return {
        smartleiloes_id: smartleiloesId,
        name: titleOf(record, `Cliente ${smartleiloesId}`),
        email,
        phone: phone || whatsapp,
        whatsapp: whatsapp || phone,
        ...(birthDate ? { birth_date: birthDate } : {}),
        cpf: document,
        document,
        address: asString(
          valueOf(record, [
            'endereco',
            'endereço',
            'enderecoCliente',
            'address',
          ]),
        ),
        city: asString(valueOf(record, ['cidade', 'cidadeCliente', 'city'])),
        state: asString(
          valueOf(record, ['uf', 'ufCliente', 'estado', 'state']),
        ),
        origin: 'Smart Leilões',
        source_payload: record,
        updated_at: new Date().toISOString(),
      }
    }),
    (row) => row.smartleiloes_id,
  )

const eventRowsFor = (records: ApiRecord[]) =>
  uniqueBy(
    records.map((record, index) => {
      const smartleiloesId = externalId(record, 'event', index)
      return {
        smartleiloes_id: smartleiloesId,
        title: titleOf(record, `Leilão ${smartleiloesId}`),
        status: asString(
          valueOf(record, [
            'nome_situacao_evento',
            'nomeSituacaoEvento',
            'situacao_evento',
            'situacaoEvento',
            'id_situacao_evento',
            'idSituacaoEvento',
            'situacao',
            'situação',
            'status',
          ]),
        ),
        value: amountOf(record),
        event_date: recordDateOf(record),
        event_type: asString(
          valueOf(record, [
            'descricao_tipo_evento',
            'descricaoTipoEvento',
            'raca_evento',
            'racaEvento',
            'tipo_evento',
            'tipo',
            'type',
          ]),
        ),
        source_url: 'https://api.smartleiloes.digital/',
        payload: record,
        updated_at: new Date().toISOString(),
      }
    }),
    (row) => row.smartleiloes_id,
  )

const lotRowsFor = (
  records: ApiRecord[],
  auctionIdsBySmartId: Map<string, string>,
) =>
  uniqueBy(
    records.map((record, index) => {
      const smartleiloesId = externalId(record, 'lot', index)
      const auctionSmartleiloesId = eventExternalIdOf(record)

      return {
        smartleiloes_id: smartleiloesId,
        auction_id: auctionIdsBySmartId.get(auctionSmartleiloesId) || null,
        auction_smartleiloes_id: auctionSmartleiloesId || null,
        lot_number: asString(
          valueOf(record, ['numero', 'número', 'numero_lote', 'lote']),
        ),
        title: titleOf(record, `Lote ${smartleiloesId}`),
        category: asString(
          valueOf(record, ['categoria', 'id_tipo_lote', 'tipo_lote']),
        ),
        commercial_status: asString(
          valueOf(record, ['situacao_comercial', 'situação_comercial']),
        ),
        value: amountOf(record),
        payload: record,
        updated_at: new Date().toISOString(),
      }
    }),
    (row) => row.smartleiloes_id,
  )

const bidRowsFor = (
  records: ApiRecord[],
  contactIdsBySmartId: Map<string, string>,
) =>
  uniqueBy(
    records.map((record, index) => {
      const smartleiloesId = externalId(record, 'bid', index)
      const eventExternalId = eventExternalIdOf(record)
      const lotExternalId = lotExternalIdOf(record)

      return {
        smartleiloes_id: smartleiloesId,
        smartleiloes_event_id: eventExternalId || null,
        smartleiloes_lot_id: lotExternalId || null,
        contact_id: contactIdsBySmartId.get(clientExternalIdOf(record)) || null,
        auction_id: eventExternalId || null,
        lot_number:
          asString(
            valueOf(record, [
              'numero_lote',
              'numero_lote_lance',
              'número_lote',
              'lote',
            ]),
          ) ||
          lotExternalId ||
          null,
        value: amountOf(record),
        date: asDateOnly(
          valueOf(record, ['data_lance', 'datalance', 'data', 'created_at']),
        ),
        reason: asString(valueOf(record, ['situacao', 'status', 'motivo'])),
        payload: record,
      }
    }),
    (row) => row.smartleiloes_id,
  )

const contractRowsFor = (
  records: ApiRecord[],
  contactIdsBySmartId: Map<string, string>,
) => {
  const soldRows: Record<string, unknown>[] = []
  const unsoldIds: string[] = []

  records.forEach((record, index) => {
    const smartleiloesId = externalId(record, 'contract', index)
    const eventExternalId = eventExternalIdOf(record)
    const lotExternalId = lotExternalIdOf(record)
    const status = commercialStatusOf(record)

    if (status && status.toUpperCase() !== 'VENDIDO') {
      unsoldIds.push(smartleiloesId)
      return
    }

    const buyerId = asString(
      valueOf(record, [
        'id_comprador',
        'id_comprador_contrato',
        'comprador_id',
      ]),
    )
    const contactId = contactIdsBySmartId.get(
      buyerId || clientExternalIdOf(record),
    )

    soldRows.push({
      smartleiloes_id: smartleiloesId,
      smartleiloes_event_id: eventExternalId || null,
      smartleiloes_lot_id: lotExternalId || null,
      contact_id: contactId || null,
      auction_id: eventExternalId || null,
      lot_number:
        asString(
          valueOf(record, [
            'numero_lote',
            'numero_lote_contrato',
            'número_lote',
            'lote',
          ]),
        ) ||
        lotExternalId ||
        null,
      value: amountOf(record),
      date: asDateOnly(
        valueOf(record, [
          'data_contrato',
          'data_emissao_contrato',
          'data',
          'data_venda',
          'created_at',
        ]),
      ),
      description: `${titleOf(record, `Contrato ${smartleiloesId}`)} | ID contrato ${smartleiloesId} | ${status}`,
      payload: record,
    })
  })

  return {
    soldRows: uniqueBy(soldRows, (row) => String(row.smartleiloes_id || '')),
    unsoldIds,
  }
}

const syncEndpointRows = async (
  type: string,
  records: ApiRecord[],
): Promise<number> => {
  let saved = 0

  for (const recordsChunk of chunk(records)) {
    await upsertRows(
      'smartleiloes_raw_records',
      rawRowsFor(type, recordsChunk),
      ['record_type', 'external_id'].join(','),
    )

    if (type === 'client') {
      const rows = contactRowsFor(recordsChunk)
      await upsertRows('contacts', rows, 'smartleiloes_id')
      saved += recordsChunk.length
      continue
    }

    if (type === 'event') {
      const rows = eventRowsFor(recordsChunk)
      await upsertRows('smartleiloes_auctions', rows, 'smartleiloes_id')
      saved += recordsChunk.length
      continue
    }

    if (type === 'lot') {
      const auctionIdsBySmartId = await fetchIdMap(
        'smartleiloes_auctions',
        recordsChunk.map(eventExternalIdOf),
      )
      const rows = lotRowsFor(recordsChunk, auctionIdsBySmartId)
      await upsertRows('smartleiloes_lots', rows, 'smartleiloes_id')
      saved += recordsChunk.length
      continue
    }

    if (type === 'bid') {
      const contactIdsBySmartId = await fetchIdMap(
        'contacts',
        recordsChunk.map(clientExternalIdOf),
      )
      const rows = bidRowsFor(recordsChunk, contactIdsBySmartId)
      await upsertRows('bids', rows, 'smartleiloes_id')
      saved += recordsChunk.length
      continue
    }

    if (type === 'contract') {
      const contactIdsBySmartId = await fetchIdMap(
        'contacts',
        recordsChunk.map((record) => {
          const buyerId = asString(
            valueOf(record, [
              'id_comprador',
              'id_comprador_contrato',
              'comprador_id',
            ]),
          )
          return buyerId || clientExternalIdOf(record)
        }),
      )
      const { soldRows, unsoldIds } = contractRowsFor(
        recordsChunk,
        contactIdsBySmartId,
      )
      await deleteRowsByIds('purchases', 'smartleiloes_id', unsoldIds)
      await upsertRows('purchases', soldRows, 'smartleiloes_id')
      saved += recordsChunk.length
    }
  }

  return saved
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders })

  const body = await req.json().catch(() => ({}))
  const requestedEndpoints = Array.isArray(body?.endpoints)
    ? body.endpoints
    : endpointScopes[String(body?.scope || 'all')] || endpointScopes.all
  const selectedEndpointKeys = new Set<EndpointKey>(
    requestedEndpoints.filter((key: string): key is EndpointKey =>
      endpoints.some((endpoint) => endpoint.key === key),
    ),
  )
  const endpointsToSync = endpoints.filter((endpoint) =>
    selectedEndpointKeys.has(endpoint.key),
  )

  if (!endpointsToSync.length) {
    return jsonResponse(
      {
        status: 'error',
        error: 'Nenhum endpoint válido informado para sincronização.',
      },
      400,
    )
  }

  const startedAt = new Date().toISOString()
  const { data: run, error: runError } = await supabase
    .from('smartleiloes_sync_runs')
    .insert({ status: 'running', started_at: startedAt })
    .select()
    .single()

  if (runError) return jsonResponse({ error: runError.message }, 500)

  const summary: SyncSummary = {}

  try {
    const token = await authenticateSmartLeiloes()

    for (const endpoint of endpointsToSync) {
      const counter: SyncCounter = { fetched: 0, saved: 0, failed: 0 }
      summary[endpoint.key] = counter

      const data = await requestSmart(endpoint.path, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      const items = extractItems(data)
      counter.fetched = items.length

      try {
        counter.saved = await syncEndpointRows(endpoint.type, items)
        counter.failed = Math.max(counter.fetched - counter.saved, 0)
      } catch (error) {
        console.error(`Failed to sync ${endpoint.type}`, error)
        counter.failed = counter.fetched
        throw error
      }
    }

    await supabase
      .from('smartleiloes_sync_runs')
      .update({
        status: 'success',
        finished_at: new Date().toISOString(),
        summary,
      })
      .eq('id', run.id)

    return jsonResponse({ status: 'success', summary })
  } catch (error: any) {
    await supabase
      .from('smartleiloes_sync_runs')
      .update({
        status: 'error',
        finished_at: new Date().toISOString(),
        summary,
        error_message: error?.message || 'Erro desconhecido',
      })
      .eq('id', run.id)

    return jsonResponse(
      {
        status: 'error',
        error: error?.message || 'Erro desconhecido',
        summary,
      },
      500,
    )
  }
})
