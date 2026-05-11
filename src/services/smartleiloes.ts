export interface SmartLeilao {
  id: string | number
  title?: string
  name?: string
  status?: string
  date?: string
  start_date?: string
  description?: string
  [key: string]: any
}

const MOCK_LEILOES: SmartLeilao[] = [
  {
    id: 'SL-001',
    title: 'Leilão Virtual Elite QM 2026',
    status: 'Aberto',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Os melhores animais da raça Quarto de Milha.',
  },
  {
    id: 'SL-002',
    title: 'Leilão Haras Primavera',
    status: 'Agendado',
    date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Genética de ponta para trabalho e corrida.',
  },
  {
    id: 'SL-003',
    title: 'Liquidação de Plantel São José',
    status: 'Encerrado',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Oportunidade única de arrematar matrizes premiadas.',
  },
]

export const smartLeiloesService = {
  async getLeiloes(): Promise<{ data: SmartLeilao[]; error: string | null }> {
    try {
      const res = await fetch('https://api.smartleiloes.digital/')
      if (!res.ok) {
        return {
          data: MOCK_LEILOES,
          error: `Falha na comunicação com a API externa (Status: ${res.status}). Exibindo dados de demonstração.`,
        }
      }
      const text = await res.text()
      if (!text) {
        return {
          data: MOCK_LEILOES,
          error: 'A API não retornou dados. Exibindo dados de demonstração.',
        }
      }
      const data = JSON.parse(text)
      const parsedData = Array.isArray(data)
        ? data
        : data.data || data.items || []

      if (parsedData.length === 0) {
        return {
          data: MOCK_LEILOES,
          error:
            'A API não possui leilões ativos no momento. Exibindo dados de demonstração.',
        }
      }

      return { data: parsedData, error: null }
    } catch (error: any) {
      return {
        data: MOCK_LEILOES,
        error: `Erro ao conectar com API externa: ${error.message}. Exibindo dados de demonstração.`,
      }
    }
  },
}
