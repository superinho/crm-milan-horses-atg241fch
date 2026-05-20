# Plano Hippomundo para Mercado Global

## Objetivo

Usar Hippomundo como fonte primaria de consulta interna do Mercado Global, sempre preservando o link da fonte original em cada lote, leilao e ranking derivado.

## Fase 1 - Produto e governanca de dados

- Preparar o schema para marcar Hippomundo como fonte primaria.
- Criar uma fila de coleta (`global_auction_crawl_queue`) antes de qualquer crawler.
- Mostrar fonte, confianca e lacunas em cada card de lote.
- Priorizar filtros operacionais: fonte, casa, pais, periodo, status, tipo, faixa de preco, confianca, garanhao e avo materno.
- Remover textos opinativos ou inferencias sem amostra.

## Fase 2 - Descoberta incremental

- Popular a fila com paginas publicas de leiloes e rankings do Hippomundo.
- Processar a fila com `sync-hippomundo-market`, sem execucao paralela agressiva.
- Processar no maximo 1 pagina por vez.
- Usar `crawl_delay_ms` da fonte, inicialmente 10 segundos entre requisicoes.
- Limitar a 6 requisicoes por minuto por padrao.
- Gravar snapshot bruto com checksum antes de normalizar dados.
- Nao rebaixar dados existentes sem checksum diferente.
- Aplicar backoff exponencial em erro 429, 403, 5xx ou timeout.

## Fase 3 - Normalizacao

- Normalizar casas, leiloes, lotes, cavalos, pedigrees e precos.
- Separar campos observados de campos inferidos.
- Calcular `confidence_score` por completude e por origem.
- Manter `source_url` em todos os lotes importados.
- Registrar cada execucao em `global_auction_import_runs`.

## Fase 4 - QA antes de confiar no ranking

- Bloquear rankings com amostra baixa.
- Mostrar percentual com fonte, preco, pedigree e comprador.
- Permitir revisao manual dos registros com baixa confianca.
- Comparar totais por leilao contra a pagina de origem.
- Somente depois disso promover Hippomundo como recorte padrao da tela.

## Regras de coleta

- Coleta lenta, serial e auditavel.
- Sem paralelismo agressivo.
- Sem esconder fonte: todo dado usado precisa linkar para Hippomundo ou para a fonte primaria do lote.
- Sem completar comprador, matriz, preco ou pais por deducao visual.
- Se um campo nao estiver claro na fonte, fica nulo e aparece como lacuna.
