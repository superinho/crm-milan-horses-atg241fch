# Guia de skills para QA, UX e debugging

Este guia define quando usar cada skill instalada no Codex para melhorar a qualidade do CRM Milan Horses. A ideia e simples: antes de mexer no codigo, escolher a skill certa para enxergar melhor o problema.

Importante: depois de instalar novas skills, reinicie o Codex para que elas aparecam automaticamente na lista ativa da proxima sessao.

## Rotas rapidas

### Quando um botao ou fluxo falhar

Use esta ordem:

1. `systematic-debugging`: reproduzir o erro, separar sintoma de causa e montar hipoteses.
2. `error-resolver`: usar mensagem de erro, stacktrace, toast ou log para localizar a origem.
3. `api-error-taxonomy`: classificar erros de Edge Function, Supabase, Resend, BotConversa ou Smart Leiloes.
4. `api-request-builder`: criar um teste minimo com `curl`, `fetch` ou chamada Supabase.
5. `code-reviewer`: revisar a correcao antes do commit.

Exemplo Milan: disparo de e-mail retorna `Edge Function returned a non-2xx status code`.

### Quando a tela estiver feia, confusa ou com clutter

Use esta ordem:

1. `frontend-design`: redesenhar a experiencia com foco em clareza, hierarquia e fluxo.
2. `ux-ui-polish`: aplicar acabamento visual, estados vazios, responsividade e microcopy.
3. `css-layout-helper`: corrigir grids, cards, overflow, espacamento e quebras mobile.
4. `accessibility-basic-check`: validar contraste, foco, labels, botoes e navegacao por teclado.
5. `webapp-testing` ou `playwright`: testar a tela real no navegador.

Exemplo Milan: limpar a secao Genetica ou tornar o Estudio simples para usuaria non-tech criar e-mails premium.

### Quando mexer em Supabase

Use esta ordem:

1. `db-migration-reviewer`: revisar tabelas, indices, constraints, RLS e migracoes.
2. `security-compliance`: checar secrets, permissoes, RLS, webhooks e risco de exposicao.
3. `api-request-builder`: testar leitura/escrita com payload real.
4. `webapp-testing`: validar se a tela consome os dados corretamente.

Exemplo Milan: importar Studbook BH, criar tabelas secundarias ou mudar funcoes de envio.

### Antes de subir para GitHub

Use esta ordem:

1. `code-reviewer`: procurar bugs, regressao e falta de testes.
2. `senior-qa`: montar checklist de aceite e risco.
3. `webapp-testing`: rodar fluxos criticos no browser.
4. `ci-failure-triage`: usar se build, lint ou GitHub Actions falharem.

## Skills instaladas

### `systematic-debugging`

Use quando o problema ainda estiver nebuloso. Ela ajuda a criar uma investigacao disciplinada: reproduzir, coletar logs, isolar camada, testar hipoteses e confirmar a causa antes de alterar codigo.

Melhor momento: primeiro passo em bugs recorrentes ou erros que parecem mudar de forma.

### `error-resolver`

Use quando existe uma mensagem concreta: toast, stacktrace, log de Edge Function, erro HTTP ou erro de build. A skill orienta a sair da mensagem ate o ponto exato do codigo.

Melhor momento: logo depois de capturar a mensagem de erro completa.

### `api-error-taxonomy`

Use para erros de API. Ela separa falhas de autenticacao, permissao, validacao, payload, rate limit, dominio nao verificado, 4xx, 5xx e timeout.

Melhor momento: Resend, BotConversa, Smart Leiloes, Supabase Edge Functions e syncs.

### `api-request-builder`

Use para transformar um fluxo do app em uma chamada reproduzivel. Isso evita depender da UI para saber se o backend funciona.

Melhor momento: antes de mexer em uma Edge Function ou webhook.

### `webapp-testing`

Use para validar fluxos completos do CRM no navegador: login, contatos, sync Smart, campanhas, Estudio, Radar VIP, Studbook, Genetica e disparos.

Melhor momento: depois de implementar uma correcao ou antes de declarar uma feature pronta.

### `playwright`

Use para testes automatizados de navegador, screenshots e validacao objetiva de interacoes.

Melhor momento: fluxos que quebram facil e precisam virar regressao automatica.

### `playwright-interactive`

Use quando precisa investigar o comportamento visual no browser, passo a passo, clicando e observando.

Melhor momento: telas com estado complexo, modais, filtros, tabelas paginadas e falhas que aparecem so na UI.

### `senior-qa`

Use para pensar como QA senior: cobertura, casos limite, dados ruins, regressao e aceite.

Melhor momento: antes de chamar uma etapa de "pronta para testar".

### `code-reviewer`

Use para revisao tecnica focada em bugs, riscos e regressao. Priorize achados por severidade.

Melhor momento: antes de commit/push ou depois de uma mudanca grande.

### `test-driven-development`

Use quando a regra de negocio e importante e facil de quebrar: RFMV, rankings, segmentacao VIP, agregacoes de leiloes, deduplicacao e normalizacao de contatos.

Melhor momento: antes de implementar calculos ou transformacoes de dados.

### `frontend-design`

Use para tomar decisoes de produto e layout: o que entra, o que sai, hierarquia visual, densidade, fluxo e simplicidade.

Melhor momento: quando a tela existe, mas ainda nao parece uma ferramenta elegante.

### `ux-ui-polish`

Use para acabamento fino: tipografia, espacamento, responsividade, estados vazios, loading, erros, consistencia de botoes e cards.

Melhor momento: depois que a funcao ja funciona.

### `css-layout-helper`

Use para bugs de layout: overflow, scroll estranho, cards desalinhados, tabelas quebradas, filtros pulando e botoes com texto cortado.

Melhor momento: quando a tela esta funcional, mas visualmente instavel.

### `accessibility-basic-check`

Use para validar se uma usuaria consegue operar a tela sem esforco: contraste, tamanho de alvo, foco, labels, aria, ordem de tab e textos de erro.

Melhor momento: antes de entregar paginas usadas diariamente.

### `react-best-practices`

Use quando mexer em estado, hooks, efeitos, memoizacao, componentes grandes ou renderizacao lenta.

Melhor momento: filtros de listas grandes, cards clicaveis, dashboards e formularios.

### `db-migration-reviewer`

Use antes de criar ou alterar schema no Supabase. Ajuda a revisar modelagem, indices, chaves, constraints, RLS e impacto em dados existentes.

Melhor momento: tabelas de Studbook, Genetica Global, campanhas, logs de envio e listas.

### `security-compliance`

Use em qualquer fluxo com login, secrets, API keys, RLS, webhooks, envio em massa ou dados de clientes.

Melhor momento: antes de publicar integracoes com Resend, BotConversa e Smart Leiloes.

### `ci-failure-triage`

Use quando GitHub Actions, build, lint, deploy ou preview falharem.

Melhor momento: depois de um push com erro no GitHub ou goskip.dev.

### `observability-setup`

Use quando precisamos parar de adivinhar. Ajuda a criar logs, eventos e trilhas de auditoria para saber o que aconteceu.

Melhor momento: disparos de e-mail/WhatsApp, sync Smart, importacoes longas e jobs de enriquecimento.

## Skill opcional para depois

### `frontend-visualqa`

Nao foi instalada agora porque exige setup adicional externo. Pode ser util depois para comparacao visual automatizada mais forte, principalmente se quisermos capturar screenshots, comparar versoes e detectar regressao visual de forma mais sistematica.

## Checklist operacional Milan

Use este checklist antes de entregar mudancas importantes:

1. A tela foi testada com dados reais?
2. O erro aparece em logs claros quando algo falha?
3. O fluxo principal foi testado no navegador?
4. Existem estados de loading, vazio e erro?
5. A mudanca nao expoe secrets, tokens ou dados sensiveis?
6. Build e lint passam?
7. A feature melhora o CRM sem adicionar clutter?
