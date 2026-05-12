import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const outDir = new URL('.', import.meta.url)

const baseCss = String.raw`
:root {
  --paper: #f1eadb;
  --paper-2: #fbf7ee;
  --paper-3: #e6dcc6;
  --ink: #111827;
  --ink-2: #26364d;
  --muted: #667085;
  --hair: rgba(17, 24, 39, 0.14);
  --navy: #061b3f;
  --bronze: #a87635;
  --bronze-2: #d8b36c;
  --cream: #e9e5dd;
  --coral: #ed6f5c;
  --success: #16784d;
  --warn: #b56b12;
  --danger: #b23b36;
  --space: 8px;
}
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; }
body {
  background: var(--paper);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: 0;
}
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: .42;
  background-image:
    radial-gradient(circle at 12% 18%, rgba(168,118,53,.12), transparent 25%),
    radial-gradient(circle at 84% 8%, rgba(6,27,63,.08), transparent 30%),
    linear-gradient(rgba(17,24,39,.025) 1px, transparent 1px);
  background-size: auto, auto, 100% 7px;
  mix-blend-mode: multiply;
}
.screen {
  position: relative;
  width: 1440px;
  min-height: 1040px;
  margin: 0 auto;
  overflow: hidden;
  background: var(--paper);
}
.meta-bar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: 38px;
  padding: 0 34px;
  border-bottom: 1px solid var(--hair);
  color: #746b5d;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.meta-bar span:nth-child(2) { color: var(--bronze); font-weight: 800; }
.meta-bar span:last-child { text-align: right; }
.app-shell {
  display: grid;
  grid-template-columns: 252px 1fr;
  min-height: calc(1040px - 38px);
}
.sidebar {
  border-right: 1px solid var(--hair);
  background: rgba(251,247,238,.72);
  padding: 28px 22px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 34px;
  color: var(--navy);
  font-weight: 860;
  font-size: 18px;
}
.mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: var(--navy);
  color: var(--bronze-2);
  font-family: Georgia, serif;
  font-size: 19px;
}
.nav-group { margin-bottom: 24px; }
.nav-label {
  margin: 0 0 8px 10px;
  color: #8a8071;
  font-size: 10px;
  font-weight: 850;
  letter-spacing: .16em;
  text-transform: uppercase;
}
.nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  color: #4f5d71;
  font-size: 13px;
  font-weight: 720;
}
.nav-item.active {
  background: var(--navy);
  color: #fffaf0;
}
.nav-count { color: inherit; opacity: .66; font-family: ui-monospace, monospace; font-size: 11px; }
.main { padding: 28px 32px 34px; }
.page-head {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 26px;
  align-items: start;
  margin-bottom: 26px;
}
.eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--bronze);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: .18em;
  text-transform: uppercase;
}
.eyebrow::before { content:""; width: 24px; height: 1px; background: var(--bronze); }
h1 {
  margin: 8px 0 0;
  color: var(--navy);
  font-family: Georgia, "Times New Roman", serif;
  font-size: 54px;
  line-height: .96;
  font-weight: 500;
  letter-spacing: -.018em;
}
.head-copy {
  max-width: 530px;
  margin: 12px 0 0;
  color: #4d5b70;
  font-size: 15px;
  line-height: 1.52;
}
.actions { display: flex; gap: 10px; align-items: center; }
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  padding: 0 15px;
  border: 1px solid rgba(17,24,39,.16);
  border-radius: 10px;
  background: rgba(255,255,255,.48);
  color: var(--navy);
  font-size: 13px;
  font-weight: 800;
}
.btn.primary {
  border-color: var(--navy);
  background: var(--navy);
  color: #fffaf0;
}
.btn.bronze {
  border-color: var(--bronze);
  background: var(--bronze);
  color: #fffaf0;
}
.rule {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  color: #887b67;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  letter-spacing: .09em;
  text-transform: uppercase;
}
.rule::before, .rule::after { content:""; height: 1px; background: var(--hair); }
.card, .panel {
  border: 1px solid rgba(17,24,39,.13);
  border-radius: 18px;
  background: rgba(251,247,238,.82);
  box-shadow: 0 24px 60px rgba(23, 31, 45, .08);
}
.panel-head {
  display:flex;
  align-items:center;
  justify-content:space-between;
  min-height: 52px;
  padding: 0 18px;
  border-bottom: 1px solid var(--hair);
  color: var(--navy);
  font-size: 14px;
  font-weight: 850;
}
.pill {
  display:inline-flex;
  align-items:center;
  min-height: 25px;
  padding: 0 10px;
  border: 1px solid rgba(17,24,39,.11);
  border-radius: 999px;
  background: rgba(255,255,255,.55);
  color: #46576d;
  font-size: 11px;
  font-weight: 780;
}
.pill.gold { border-color: rgba(168,118,53,.34); background: rgba(216,179,108,.22); color: #75501c; }
.pill.green { border-color: rgba(22,120,77,.28); background: rgba(22,120,77,.12); color: #12613e; }
.pill.red { border-color: rgba(178,59,54,.22); background: rgba(178,59,54,.1); color: #8f2e2a; }
.metrics { display:grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
.metric { padding: 16px; min-height: 104px; }
.metric .label {
  color: #758196;
  font-size: 11px;
  font-weight: 820;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.metric .value {
  margin-top: 10px;
  color: var(--navy);
  font-size: 32px;
  line-height: 1;
  font-weight: 880;
  letter-spacing: -.02em;
}
.metric .hint { margin-top: 8px; color:#68758a; font-size: 12px; }
table { width:100%; border-collapse: collapse; table-layout: fixed; }
th, td {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(17,24,39,.09);
  color: #23344f;
  font-size: 13px;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
th {
  color: #7b8798;
  font-size: 10px;
  font-weight: 880;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.person { display:flex; align-items:center; gap:10px; min-width:0; }
.avatar {
  display:grid; place-items:center; flex:0 0 auto;
  width:32px; height:32px; border-radius:50%;
  background:#e5edf7; color:var(--navy);
  font-size:11px; font-weight:900;
}
.sheet {
  padding: 18px;
}
.sheet-title {
  margin: 10px 0 2px;
  color: var(--navy);
  font-size: 25px;
  font-weight: 860;
}
.data-list { margin-top: 18px; display:grid; gap: 0; }
.data-row {
  display:flex; justify-content:space-between; gap:16px;
  padding: 11px 0;
  border-bottom: 1px solid rgba(17,24,39,.1);
  color:#667085; font-size:12px;
}
.data-row strong { color:#1c2e48; }
.ph-img {
  position: relative;
  overflow:hidden;
  background:
    linear-gradient(135deg, rgba(6,27,63,.88), rgba(168,118,53,.5)),
    repeating-linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.08) 1px, transparent 1px, transparent 22px);
}
.ph-img::after {
  content:"Milan Horses / imagem de campanha";
  position:absolute; left:18px; bottom:16px;
  color: rgba(255,255,255,.8);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px; letter-spacing:.12em; text-transform:uppercase;
}
.dark-screen {
  --bg: #0b1120;
  --surface: #111827;
  --surface-2: #162035;
  --border: #1e3a5f;
  --data: #ffb800;
  --cyan: #00d4ff;
  --fg: #e8f0fe;
  --fg-2: #8ba3c7;
  background: var(--bg);
  color: var(--fg);
}
.dark-screen::before { display:none; }
.dark-screen .meta-bar { border-color: var(--border); color: var(--fg-2); background:#070d19; }
.dark-screen .app-shell { grid-template-columns: 238px 1fr; }
.dark-screen .sidebar { background:#08101f; border-color:var(--border); }
.dark-screen .brand { color:var(--fg); }
.dark-screen .mark { background: var(--data); color:#07111f; }
.dark-screen .nav-label { color: #4a6080; }
.dark-screen .nav-item { color:var(--fg-2); border-radius:4px; }
.dark-screen .nav-item.active { background: rgba(255,184,0,.14); color: var(--data); border: 1px solid rgba(255,184,0,.22); }
.dark-screen .eyebrow { color:var(--data); }
.dark-screen .eyebrow::before { background:var(--data); }
.dark-screen h1 { color:var(--fg); font-family: Inter, system-ui, sans-serif; font-size:34px; letter-spacing:0; line-height:1.08; font-weight:800; }
.dark-screen .head-copy { color:var(--fg-2); }
.dark-screen .btn { border-color:var(--border); background:var(--surface); color:var(--fg); border-radius:4px; }
.dark-screen .btn.primary { border-color:rgba(255,184,0,.48); background:var(--data); color:#07111f; }
.dark-screen .rule { color:#4a6080; }
.dark-screen .rule::before, .dark-screen .rule::after { background:var(--border); }
.dark-screen .card, .dark-screen .panel { border-color:var(--border); border-radius:6px; background:var(--surface); box-shadow:none; }
.dark-screen .panel-head { border-color:var(--border); color:var(--fg); }
.dark-screen .metric .label { color:var(--fg-2); }
.dark-screen .metric .value { color:var(--data); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.dark-screen .metric .hint { color:#667fa6; }
.dark-screen th { color:#4a6080; }
.dark-screen td { color:var(--fg); border-color:#162035; }
.dark-screen .pill { background:rgba(139,163,199,.11); color:var(--fg-2); border-color:rgba(139,163,199,.2); border-radius:2px; }
.dark-screen .pill.gold { background:rgba(255,184,0,.13); color:var(--data); border-color:rgba(255,184,0,.3); }
.dark-screen .pill.green { background:rgba(38,222,129,.13); color:#26de81; border-color:rgba(38,222,129,.28); }
.dark-screen .pill.red { background:rgba(255,71,87,.14); color:#ff7b86; border-color:rgba(255,71,87,.28); }
`

function page(title, body, extraCss = '') {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>${baseCss}${extraCss}</style>
</head>
<body>${body}</body>
</html>`
}

const crm = page(
  'Mock 01 - CRM Core',
  String.raw`
<main class="screen">
  <div class="meta-bar"><span>Volume CRM / Milan Horses</span><span>Open Design: Application + Atelier</span><span>001 / 004</span></div>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><span class="mark">M</span><span>Milan Horses</span></div>
      <div class="nav-group"><p class="nav-label">CRM</p><div class="nav-item">Dashboard <span class="nav-count">01</span></div><div class="nav-item active">Contatos <span class="nav-count">1837</span></div><div class="nav-item">Negócios <span class="nav-count">42</span></div></div>
      <div class="nav-group"><p class="nav-label">Marketing</p><div class="nav-item">Radar VIP <span class="nav-count">86</span></div><div class="nav-item">Campanhas</div><div class="nav-item">Estúdio</div></div>
      <div class="nav-group"><p class="nav-label">Inteligência</p><div class="nav-item">Leilões</div><div class="nav-item">Genética</div><div class="nav-item">Studbook BH</div></div>
    </aside>
    <section class="main">
      <header class="page-head">
        <div>
          <div class="eyebrow">Base comercial acionável</div>
          <h1>Contatos com contexto de compra, valor e próximo gesto.</h1>
          <p class="head-copy">Tela de trabalho para encontrar compradores, entender potencial e acionar WhatsApp ou email sem sair do perfil do cliente.</p>
        </div>
        <div class="actions"><span class="btn">Filtros salvos</span><span class="btn primary">Sincronizar Smart</span></div>
      </header>
      <div class="rule"><span>I. Contatos</span><span></span><span>Atualizado 12/05 11:03</span></div>
      <section class="metrics">
        <div class="card metric"><div class="label">Contatos gerais</div><div class="value">1.837</div><div class="hint">base Smart Leilões</div></div>
        <div class="card metric"><div class="label">Compradores</div><div class="value">412</div><div class="hint">R$ 136,6 mi em arremates</div></div>
        <div class="card metric"><div class="label">WhatsApp pronto</div><div class="value">1.717</div><div class="hint">93% acionável</div></div>
        <div class="card metric"><div class="label">VIP ativo</div><div class="value">86</div><div class="hint">alto potencial para leilões</div></div>
      </section>
      <section style="display:grid;grid-template-columns:1fr 330px;gap:18px;">
        <div class="panel">
          <div class="panel-head"><span>Clientes</span><span class="pill gold">Ordenação global por valor</span></div>
          <table>
            <thead><tr><th style="width:34%">Cliente</th><th>Contato</th><th>Compras</th><th>Total</th><th>Segmento</th></tr></thead>
            <tbody>
              <tr><td><div class="person"><span class="avatar">CO</span>Comércio Horses</div></td><td>WhatsApp + email</td><td>18</td><td>R$ 4,2 mi</td><td><span class="pill green">VIP matriz</span></td></tr>
              <tr><td><div class="person"><span class="avatar">PE</span>Petronio Cabral</div></td><td>WhatsApp validado</td><td>11</td><td>R$ 2,8 mi</td><td><span class="pill gold">Lote alto</span></td></tr>
              <tr><td><div class="person"><span class="avatar">MS</span>Matheus Souza</div></td><td>Email principal</td><td>7</td><td>R$ 1,6 mi</td><td><span class="pill">Potros BH</span></td></tr>
              <tr><td><div class="person"><span class="avatar">DA</span>Daniel</div></td><td>WhatsApp</td><td>3</td><td>R$ 842 mil</td><td><span class="pill red">Reativar</span></td></tr>
              <tr><td><div class="person"><span class="avatar">AL</span>Aline Prado</div></td><td>Email</td><td>2</td><td>R$ 610 mil</td><td><span class="pill">Interessada</span></td></tr>
              <tr><td><div class="person"><span class="avatar">RF</span>Rafael Ferreira</div></td><td>WhatsApp</td><td>1</td><td>R$ 330 mil</td><td><span class="pill">Novo comprador</span></td></tr>
            </tbody>
          </table>
        </div>
        <aside class="panel sheet">
          <span class="pill green">Perfil 360</span>
          <h2 class="sheet-title">Comércio Horses</h2>
          <div style="color:#667085;font-size:13px;">São Paulo, SP · WhatsApp validado · comprador recorrente</div>
          <div class="data-list">
            <div class="data-row"><span>Ticket médio</span><strong>R$ 233 mil</strong></div>
            <div class="data-row"><span>Última compra</span><strong>Leilão Elite</strong></div>
            <div class="data-row"><span>Preferência</span><strong>Matrizes BH</strong></div>
            <div class="data-row"><span>RFMV</span><strong>94 / 100</strong></div>
            <div class="data-row"><span>Próxima ação</span><strong>Enviar preview VIP</strong></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px;"><span class="btn primary">WhatsApp</span><span class="btn">Email</span></div>
        </aside>
      </section>
    </section>
  </div>
</main>`,
)

const studio = page(
  'Mock 02 - Estudio',
  String.raw`
<main class="screen studio-screen">
  <div class="meta-bar"><span>Volume Marketing / Milan Horses</span><span>Open Design: Resend + Superhuman</span><span>002 / 004</span></div>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><span class="mark">M</span><span>Estúdio</span></div>
      <div class="nav-group"><p class="nav-label">Criar</p><div class="nav-item active">Email premium</div><div class="nav-item">WhatsApp</div><div class="nav-item">Banners</div><div class="nav-item">Variáveis</div></div>
      <div class="nav-group"><p class="nav-label">Publicar</p><div class="nav-item">Campanhas</div><div class="nav-item">Segmentos</div><div class="nav-item">Testes A/B</div></div>
    </aside>
    <section class="main">
      <header class="page-head">
        <div>
          <div class="eyebrow">Atelier de mensagens</div>
          <h1>Emails com curadoria visual, banners e personalização.</h1>
          <p class="head-copy">A usuária escolhe um objetivo, adiciona blocos elegantes e transforma o material em campanha sem mexer em código.</p>
        </div>
        <div class="actions"><span class="btn">Preview mobile</span><span class="btn bronze">Criar campanha</span></div>
      </header>
      <section style="display:grid;grid-template-columns:260px 1fr 290px;gap:18px;">
        <aside class="panel">
          <div class="panel-head">Blocos</div>
          <div style="padding:14px;display:grid;gap:10px;">
            <div class="block"><strong>Banner editorial</strong><span>Foto, título, data e CTA.</span></div>
            <div class="block"><strong>Seleção de lotes</strong><span>3 animais por perfil RFMV.</span></div>
            <div class="block"><strong>Genealogia</strong><span>Matriz, garanhão e nota curta.</span></div>
            <div class="block"><strong>WhatsApp CTA</strong><span>Link rastreado BotConversa.</span></div>
            <div class="block"><strong>Assinatura Milan</strong><span>Contato, catálogo e agenda.</span></div>
          </div>
        </aside>
        <article class="email-preview panel">
          <div class="ph-img hero-image"><div class="hero-copy"><span>Preview VIP</span><h2>Uma seleção rara para sua próxima temporada</h2></div></div>
          <div class="email-copy">
            <p>Olá, {{primeiro_nome}}. Separamos uma curadoria com animais que combinam com seu histórico de interesse e compras recentes.</p>
            <p>O leilão abre nesta semana com oportunidades de matrizes e potros BH de linhagens competitivas.</p>
            <div class="lot-grid">
              <div><span>Lote 07</span><strong>Matriz importada</strong><small>alto valor genético</small></div>
              <div><span>Lote 11</span><strong>Potro BH</strong><small>linha de performance</small></div>
              <div><span>Lote 18</span><strong>Embrião</strong><small>cross recomendado</small></div>
            </div>
            <div style="margin-top:18px;"><span class="btn primary">Ver catálogo reservado</span></div>
          </div>
        </article>
        <aside class="panel">
          <div class="panel-head">Controle de qualidade</div>
          <div class="sheet">
            <span class="pill gold">Luxo direto</span>
            <div class="data-list">
              <div class="data-row"><span>Segmento</span><strong>VIP matrizes</strong></div>
              <div class="data-row"><span>Variáveis válidas</span><strong>8 / 8</strong></div>
              <div class="data-row"><span>Banner</span><strong>1 imagem</strong></div>
              <div class="data-row"><span>Preview mobile</span><strong>OK</strong></div>
              <div class="data-row"><span>Score</span><strong>94 / 100</strong></div>
            </div>
            <div style="margin-top:22px;padding:16px;border:1px solid var(--hair);border-radius:16px;background:#fbf7ee;">
              <div style="font-weight:850;color:var(--navy);font-size:14px;">Sugestão óbvia</div>
              <p style="margin:8px 0 0;color:#667085;font-size:13px;line-height:1.45;">Salvar este email como modelo do próximo leilão de matrizes.</p>
            </div>
          </div>
        </aside>
      </section>
    </section>
  </div>
</main>`,
  String.raw`
.studio-screen { background:#f4efe4; }
.studio-screen .screen, .studio-screen .sidebar { background:#f4efe4; }
.block {
  min-height:78px; padding:14px; border:1px solid var(--hair); border-radius:14px;
  background:rgba(255,255,255,.42); display:grid; gap:4px;
}
.block strong { color:var(--navy); font-size:13px; }
.block span { color:#667085; font-size:12px; line-height:1.35; }
.email-preview { overflow:hidden; background:#fffaf2; }
.hero-image { height:315px; }
.hero-copy { position:absolute; left:34px; bottom:30px; width:470px; color:#fffaf0; }
.hero-copy span { display:inline-flex; padding:7px 10px; border-radius:999px; background:rgba(233,229,221,.92); color:#111827; font-size:11px; font-weight:850; }
.hero-copy h2 { margin:18px 0 0; font-family:Georgia,serif; font-size:48px; line-height:.96; font-weight:500; letter-spacing:-.018em; }
.email-copy { padding:30px 38px 36px; }
.email-copy p { width:620px; margin:0 0 14px; color:#39475e; font-size:16px; line-height:1.55; }
.lot-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:22px; }
.lot-grid div { min-height:112px; padding:14px; border:1px solid var(--hair); border-radius:14px; background:#f7f1de; }
.lot-grid span { color:var(--bronze); font-size:11px; font-weight:850; letter-spacing:.12em; text-transform:uppercase; }
.lot-grid strong { display:block; margin-top:9px; color:var(--navy); font-size:17px; line-height:1.05; }
.lot-grid small { display:block; margin-top:8px; color:#667085; font-size:12px; }
`,
)

const radar = page(
  'Mock 03 - Radar VIP',
  String.raw`
<main class="screen dark-screen">
  <div class="meta-bar"><span>Operations / Milan Horses</span><span>Open Design: Mission Control + Linear</span><span>003 / 004</span></div>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><span class="mark">M</span><span>Radar VIP</span></div>
      <div class="nav-group"><p class="nav-label">Leilão ativo</p><div class="nav-item active">Elite BH</div><div class="nav-item">Lotes abertos</div><div class="nav-item">Segmentos</div><div class="nav-item">Mensagens</div><div class="nav-item">Follow-up</div></div>
      <div class="nav-group"><p class="nav-label">Status</p><div class="nav-item">BotConversa <span class="nav-count">ON</span></div><div class="nav-item">Resend <span class="nav-count">ON</span></div></div>
    </aside>
    <section class="main">
      <header class="page-head">
        <div>
          <div class="eyebrow">Sala de ação</div>
          <h1>Leilão Elite BH: quem deve receber qual lote, agora.</h1>
          <p class="head-copy">Visão operacional para transformar leilões abertos em mensagens priorizadas, com follow-up e score comercial.</p>
        </div>
        <div class="actions"><span class="btn">Atualizar lotes</span><span class="btn primary">Disparar VIP</span></div>
      </header>
      <section class="metrics">
        <div class="card metric"><div class="label">VIPs compatíveis</div><div class="value">086</div><div class="hint">prioridade alta</div></div>
        <div class="card metric"><div class="label">Lotes quentes</div><div class="value">019</div><div class="hint">abertos no site</div></div>
        <div class="card metric"><div class="label">Potencial</div><div class="value">8.7M</div><div class="hint">RFMV estimado</div></div>
        <div class="card metric"><div class="label">Sem contato</div><div class="value">031</div><div class="hint">ação imediata</div></div>
      </section>
      <div class="rule"><span>II. Action lanes</span><span></span><span>T-04 dias para encerramento</span></div>
      <section class="lanes">
        <div class="lane panel"><div class="panel-head">Selecionar <span class="pill gold">31</span></div>
          <div class="vip"><b>Petronio Cabral</b><span>Compra recorrente; interesse em matrizes. Enviar lote 07 e 18.</span><em>R$ 2,8 mi</em></div>
          <div class="vip"><b>Aline Prado</b><span>Interage no WhatsApp, sem compra nos últimos 90 dias.</span><em>RFMV 82</em></div>
          <div class="vip"><b>Rafael Ferreira</b><span>Comprador novo com lances em potros BH.</span><em>1 compra</em></div>
        </div>
        <div class="lane panel"><div class="panel-head">Mensagem pronta <span class="pill green">42</span></div>
          <div class="vip"><b>Comércio Horses</b><span>Email premium aprovado. WhatsApp com CTA para catálogo.</span><em>VIP</em></div>
          <div class="vip"><b>Matheus Souza</b><span>Recomendação baseada em histórico de lances.</span><em>Potro BH</em></div>
          <div class="vip"><b>Daniel</b><span>Copy curta de reativação pronta para envio.</span><em>Reativar</em></div>
        </div>
        <div class="lane panel"><div class="panel-head">Follow-up <span class="pill red">13</span></div>
          <div class="vip"><b>Mariana G.</b><span>Quer vídeo do lote e pedigree materno antes de decidir.</span><em>Respondeu</em></div>
          <div class="vip"><b>Daniel</b><span>Responder amanhã se abrir catálogo e não clicar.</span><em>T+1</em></div>
          <div class="vip"><b>Haras Norte</b><span>Pedir confirmação do melhor horário para ligação.</span><em>Ligação</em></div>
        </div>
      </section>
    </section>
  </div>
</main>`,
  String.raw`
.lanes { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
.lane { min-height:520px; padding-bottom:12px; }
.vip {
  margin:12px; padding:16px; min-height:126px;
  border:1px solid #1e3a5f; border-radius:6px; background:#0c1729;
}
.vip b { display:block; color:#e8f0fe; font-size:15px; line-height:1.12; }
.vip span { display:block; margin-top:10px; color:#8ba3c7; font-size:13px; line-height:1.38; }
.vip em { display:inline-flex; margin-top:14px; padding:4px 8px; border:1px solid rgba(255,184,0,.3); border-radius:2px; color:#ffb800; font-style:normal; font-size:10px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
`,
)

const studbook = page(
  'Mock 04 - Studbook',
  String.raw`
<main class="screen studbook-screen">
  <div class="meta-bar"><span>Arquivo BH / Milan Horses</span><span>Open Design: Atelier Zero + Dashboard</span><span>004 / 004</span></div>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><span class="mark">M</span><span>Studbook BH</span></div>
      <div class="nav-group"><p class="nav-label">Base secundária</p><div class="nav-item active">Cavalos</div><div class="nav-item">Matrizes</div><div class="nav-item">Garanhões</div><div class="nav-item">Haras</div><div class="nav-item">Proprietários</div></div>
      <div class="nav-group"><p class="nav-label">Leilões</p><div class="nav-item">Listas candidatas</div><div class="nav-item">Montar leilão</div><div class="nav-item">Enriquecimento</div></div>
    </aside>
    <section class="main">
      <header class="page-head">
        <div>
          <div class="eyebrow">Arquivo separado do CRM</div>
          <h1>Uma base de cavalos para encontrar matrizes e montar leilões.</h1>
          <p class="head-copy">Studbook fica fora do CRM de clientes: pesquisa de animais, idade, haras criador, proprietário e listas de candidatos para futuros leilões.</p>
        </div>
        <div class="actions"><span class="btn">Importar ABCCH</span><span class="btn primary">Montar leilão</span></div>
      </header>
      <div class="rule"><span>III. Studbook</span><span></span><span>Fonte pública ABCCH</span></div>
      <section class="metrics">
        <div class="card metric"><div class="label">Cavalos</div><div class="value">128k</div><div class="hint">base pública</div></div>
        <div class="card metric"><div class="label">Matrizes</div><div class="value">41k</div><div class="hint">com idade calculada</div></div>
        <div class="card metric"><div class="label">Haras</div><div class="value">2.4k</div><div class="hint">criadores</div></div>
        <div class="card metric"><div class="label">Candidatos</div><div class="value">312</div><div class="hint">listas ativas</div></div>
      </section>
      <section style="display:grid;grid-template-columns:1fr 360px;gap:18px;">
        <div class="panel">
          <div class="panel-head">Matrizes com potencial comercial <span class="pill gold">idade + genealogia</span></div>
          <table>
            <thead><tr><th>Animal</th><th>Sexo</th><th>Idade</th><th>Haras</th><th>Proprietário</th><th>Ação</th></tr></thead>
            <tbody>
              <tr><td>Jolie Van'T Haras</td><td>Fêmea</td><td>12</td><td>Haras Milan</td><td>Atual ABCCH</td><td><span class="pill green">Adicionar</span></td></tr>
              <tr><td>Carisma JMen</td><td>Fêmea</td><td>10</td><td>JMen</td><td>Atual ABCCH</td><td><span class="pill">Pesquisar</span></td></tr>
              <tr><td>Donna Bella BH</td><td>Fêmea</td><td>9</td><td>Haras BH</td><td>Atual ABCCH</td><td><span class="pill gold">Contato</span></td></tr>
              <tr><td>Quinta do Lago</td><td>Fêmea</td><td>15</td><td>Lagoinha</td><td>Atual ABCCH</td><td><span class="pill">Ver linha</span></td></tr>
              <tr><td>Harmonia Joter</td><td>Fêmea</td><td>8</td><td>Joter</td><td>Atual ABCCH</td><td><span class="pill">Adicionar</span></td></tr>
            </tbody>
          </table>
        </div>
        <aside class="panel pedigree">
          <div class="panel-head">Pedigree rápido</div>
          <div class="tree">
            <div class="node main-node">Matriz · 12 anos</div>
            <div class="tree-grid">
              <div class="node">Garanhão A</div><div class="node">Avó materna</div>
              <div class="node">Linha de salto</div><div class="node">Performance</div>
            </div>
          </div>
          <div class="sheet">
            <span class="pill gold">Lista: Matrizes-alvo</span>
            <div class="data-list">
              <div class="data-row"><span>Potencial</span><strong>R$ 1,8 mi</strong></div>
              <div class="data-row"><span>Leilões similares</span><strong>9 vendas</strong></div>
              <div class="data-row"><span>Próximo passo</span><strong>Validar proprietário</strong></div>
            </div>
          </div>
        </aside>
      </section>
    </section>
  </div>
</main>`,
  String.raw`
.studbook-screen .value { font-family: Georgia, serif; font-weight:500; }
.pedigree { overflow:hidden; }
.tree { min-height:258px; padding:18px; background:linear-gradient(90deg,transparent 49%,rgba(17,24,39,.11) 49%,rgba(17,24,39,.11) 51%,transparent 51%); }
.node { padding:12px; border:1px solid var(--hair); border-radius:14px; background:#fbf7ee; color:var(--navy); font-size:13px; font-weight:850; text-align:center; }
.main-node { margin:0 auto 28px; width:190px; background:var(--navy); color:#fffaf0; }
.tree-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px 62px; }
`,
)

const index = page(
  'Open Design Mocks - CRM Milan',
  String.raw`
<main class="index-page">
  <header>
    <div class="eyebrow">CRM Milan Horses / Open Design</div>
    <h1>Quatro direções reais, agora separadas por workflow.</h1>
    <p>As telas foram desenhadas com sistemas do Open Design: Application, Atelier Zero, Resend, Superhuman, Mission Control e Dashboard.</p>
  </header>
  <section class="preview-grid">
    <a href="01-crm-core.html"><img src="01-crm-core.png" alt="Mock CRM Core" /><strong>01. CRM Core</strong><span>Contatos, valor, perfil 360 e sync.</span></a>
    <a href="02-estudio.html"><img src="02-estudio.png" alt="Mock Estudio" /><strong>02. Estúdio</strong><span>Email premium com banners e blocos.</span></a>
    <a href="03-radar-vip.html"><img src="03-radar-vip.png" alt="Mock Radar VIP" /><strong>03. Radar VIP</strong><span>Sala de ação de leilões abertos.</span></a>
    <a href="04-studbook.html"><img src="04-studbook.png" alt="Mock Studbook" /><strong>04. Studbook</strong><span>Base secundária para matrizes e leilões.</span></a>
  </section>
</main>`,
  String.raw`
body { background:#efe7d2; }
.index-page { width:1440px; margin:0 auto; padding:52px 42px 70px; }
.index-page header { display:grid; grid-template-columns:1fr 460px; gap:80px; align-items:end; margin-bottom:34px; }
.index-page h1 { font-size:72px; max-width:760px; }
.index-page p { margin:0; color:#4d5b70; font-size:17px; line-height:1.5; }
.preview-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
.preview-grid a { display:block; color:var(--navy); text-decoration:none; border:1px solid var(--hair); border-radius:22px; overflow:hidden; background:#fbf7ee; box-shadow:0 24px 70px rgba(23,31,45,.12); }
.preview-grid img { display:block; width:100%; height:390px; object-fit:cover; object-position:top left; border-bottom:1px solid var(--hair); }
.preview-grid strong { display:block; padding:18px 20px 4px; font-size:22px; }
.preview-grid span { display:block; padding:0 20px 20px; color:#667085; font-size:14px; }
`,
)

const files = {
  '01-crm-core.html': crm,
  '02-estudio.html': studio,
  '03-radar-vip.html': radar,
  '04-studbook.html': studbook,
  'index.html': index,
}

await Promise.all(
  Object.entries(files).map(([name, contents]) =>
    fs.writeFile(new URL(name, outDir), contents),
  ),
)

console.log(
  `Wrote ${Object.keys(files).length} Open Design mock files to ${fileURLToPath(outDir)}`,
)
