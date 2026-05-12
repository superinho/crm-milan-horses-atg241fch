import fs from 'node:fs/promises'

const outDir = new URL('.', import.meta.url)
const logoPath = '/src/assets/editedimage_1769630541473-88067.png'

const nav = [
  'Dashboard',
  'Contatos',
  'Radar VIP',
  'Campanhas',
  'Estúdio',
  'Leilões',
  'Genética',
  'Studbook BH',
  'Relatórios',
  'Configurações',
]

const sections = [
  ['Dashboard', 'snapshot comercial'],
  ['Contatos', 'base e perfil 360'],
  ['Radar VIP', 'segmentos por leilão'],
  ['Campanhas', 'envios e resultados'],
  ['Estúdio', 'criação de mensagens'],
  ['Leilões', 'lotes reais abertos'],
  ['Genética', 'matrizes e lances'],
  ['Studbook BH', 'base secundária'],
  ['Relatórios', 'performance'],
  ['Configurações', 'integrações'],
]

const variants = [
  {
    id: '01-milan-navy',
    title: '01. Milan Navy',
    tag: 'Cores Milan Horses',
    mood: 'Mais fiel à marca atual: branco, azul Milan e ouro discreto.',
    root: {
      bg: '#f7f9fc',
      surface: '#ffffff',
      surfaceSoft: '#f1f5f9',
      ink: '#0b2d63',
      text: '#14233a',
      muted: '#64748b',
      border: 'rgba(11,45,99,.14)',
      accent: '#0b2d63',
      accentText: '#ffffff',
      second: '#b8873c',
      secondText: '#fffaf0',
      sidebar: '#ffffff',
      sidebarText: '#334155',
      sidebarActive: '#0b2d63',
      sidebarActiveText: '#ffffff',
      heroA: '#0b2d63',
      heroB: '#d2b06b',
      shadow: '0 24px 70px rgba(11,45,99,.13)',
    },
  },
  {
    id: '02-champagne-atelier',
    title: '02. Champagne Atelier',
    tag: 'Mais próximo do mock 2',
    mood: 'Editorial, claro e premium, com cara de ateliê de campanha.',
    root: {
      bg: '#efe8d8',
      surface: '#fffaf1',
      surfaceSoft: '#f6eedf',
      ink: '#071b37',
      text: '#1f2f46',
      muted: '#6d7280',
      border: 'rgba(31,47,70,.14)',
      accent: '#071b37',
      accentText: '#fffaf0',
      second: '#a87635',
      secondText: '#fff8e8',
      sidebar: '#f7f1e6',
      sidebarText: '#4b5870',
      sidebarActive: '#071b37',
      sidebarActiveText: '#fffaf0',
      heroA: '#111827',
      heroB: '#b8935b',
      shadow: '0 28px 80px rgba(54,43,25,.16)',
    },
  },
  {
    id: '03-midnight-concierge',
    title: '03. Midnight Concierge',
    tag: 'Luxo noturno',
    mood: 'Mais sofisticado e dramático, bom para marca premium e campanhas VIP.',
    root: {
      bg: '#07111f',
      surface: '#0e1b2f',
      surfaceSoft: '#111f34',
      ink: '#f5f0e6',
      text: '#e6edf7',
      muted: '#97a8bd',
      border: 'rgba(214,235,253,.18)',
      accent: '#f0c878',
      accentText: '#07111f',
      second: '#d6ebfd',
      secondText: '#07111f',
      sidebar: '#081424',
      sidebarText: '#aab8ca',
      sidebarActive: '#f0c878',
      sidebarActiveText: '#07111f',
      heroA: '#050b14',
      heroB: '#7c6337',
      shadow: '0 30px 90px rgba(0,0,0,.38)',
    },
    dark: true,
  },
  {
    id: '04-pearl-editorial',
    title: '04. Pearl Editorial',
    tag: 'Mais limpa e leve',
    mood: 'Luxo silencioso, foco em leitura e menos peso visual no dia a dia.',
    root: {
      bg: '#f4f1ea',
      surface: '#ffffff',
      surfaceSoft: '#ede9df',
      ink: '#172033',
      text: '#243044',
      muted: '#697587',
      border: 'rgba(36,48,68,.13)',
      accent: '#23395d',
      accentText: '#ffffff',
      second: '#8a6d3b',
      secondText: '#fff8e7',
      sidebar: '#fbfaf6',
      sidebarText: '#4d5a6e',
      sidebarActive: '#23395d',
      sidebarActiveText: '#ffffff',
      heroA: '#23395d',
      heroB: '#889b88',
      shadow: '0 24px 70px rgba(36,48,68,.12)',
    },
  },
]

function cssVars(root) {
  return Object.entries(root)
    .map(([k, v]) => `--${k}: ${v};`)
    .join('\n')
}

function appShell(v) {
  const navHtml = nav
    .map((item) => `<div class="nav-item ${item === 'Estúdio' ? 'active' : ''}"><span>${item}</span><i></i></div>`)
    .join('')

  const sectionHtml = sections
    .map(
      ([name, detail], index) =>
        `<div class="section-chip ${name === 'Estúdio' ? 'selected' : ''}"><b>${String(index + 1).padStart(2, '0')}</b><span>${name}</span><small>${detail}</small></div>`,
    )
    .join('')

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${v.title} - CRM Milan</title>
  <style>
    :root { ${cssVars(v.root)} }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: 0;
    }
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      opacity: ${v.dark ? '.14' : '.36'};
      background-image:
        radial-gradient(circle at 12% 12%, color-mix(in srgb, var(--second) 18%, transparent), transparent 28%),
        linear-gradient(color-mix(in srgb, var(--ink) 3%, transparent) 1px, transparent 1px);
      background-size: auto, 100% 8px;
    }
    .screen {
      width: 1440px;
      min-height: 1040px;
      margin: 0 auto;
      overflow: hidden;
      background: var(--bg);
      position: relative;
    }
    .top-strip {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      height: 38px;
      padding: 0 34px;
      border-bottom: 1px solid var(--border);
      color: var(--muted);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10px;
      letter-spacing: .1em;
      text-transform: uppercase;
    }
    .top-strip strong { color: var(--second); }
    .top-strip span:last-child { text-align: right; }
    .layout {
      display: grid;
      grid-template-columns: 264px 1fr;
      min-height: calc(1040px - 38px);
    }
    .sidebar {
      border-right: 1px solid var(--border);
      background: var(--sidebar);
      padding: 22px 20px 24px;
    }
    .logo-panel {
      display: grid;
      place-items: center;
      height: 118px;
      margin-bottom: 20px;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: ${v.dark ? '#fffdf7' : 'rgba(255,255,255,.68)'};
      overflow: hidden;
    }
    .logo-panel img {
      width: 194px;
      height: 92px;
      object-fit: contain;
      mix-blend-mode: ${v.dark ? 'normal' : 'multiply'};
      filter: none;
    }
    .nav-label {
      margin: 18px 8px 8px;
      color: var(--muted);
      font-size: 10px;
      font-weight: 850;
      letter-spacing: .18em;
      text-transform: uppercase;
    }
    .nav {
      display: grid;
      gap: 5px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 38px;
      padding: 0 12px;
      border-radius: ${v.dark ? '6px' : '11px'};
      color: var(--sidebarText);
      font-size: 13px;
      font-weight: 760;
    }
    .nav-item i {
      width: 5px;
      height: 5px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--sidebarText) 32%, transparent);
      opacity: .7;
    }
    .nav-item.active {
      background: var(--sidebarActive);
      color: var(--sidebarActiveText);
      box-shadow: ${v.dark ? 'inset 0 0 0 1px rgba(255,255,255,.12)' : '0 10px 28px rgba(7,27,55,.13)'};
    }
    .nav-item.active i { background: var(--second); opacity: 1; }
    .main {
      padding: 28px 32px 34px;
    }
    .page-head {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 28px;
      align-items: start;
      margin-bottom: 22px;
    }
    .eyebrow {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--second);
      font-size: 11px;
      font-weight: 850;
      letter-spacing: .18em;
      text-transform: uppercase;
    }
    .eyebrow::before { content: ""; width: 24px; height: 1px; background: var(--second); }
    h1 {
      max-width: 720px;
      margin: 8px 0 0;
      color: var(--ink);
      font-family: Georgia, "Times New Roman", serif;
      font-size: 52px;
      font-weight: 500;
      line-height: .97;
      letter-spacing: -.018em;
    }
    .copy {
      max-width: 610px;
      margin: 12px 0 0;
      color: var(--muted);
      font-size: 15px;
      line-height: 1.5;
    }
    .actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 38px;
      padding: 0 14px;
      border: 1px solid var(--border);
      border-radius: ${v.dark ? '6px' : '10px'};
      background: color-mix(in srgb, var(--surface) 84%, transparent);
      color: var(--ink);
      font-size: 13px;
      font-weight: 820;
    }
    .btn.primary {
      border-color: var(--accent);
      background: var(--accent);
      color: var(--accentText);
    }
    .btn.secondary {
      border-color: var(--second);
      background: var(--second);
      color: var(--secondText);
    }
    .section-map {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .section-chip {
      min-height: 62px;
      padding: 10px;
      border: 1px solid var(--border);
      border-radius: ${v.dark ? '6px' : '13px'};
      background: color-mix(in srgb, var(--surface) 78%, transparent);
    }
    .section-chip b {
      color: var(--second);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10px;
    }
    .section-chip span {
      display: block;
      margin-top: 4px;
      color: var(--ink);
      font-size: 13px;
      font-weight: 830;
    }
    .section-chip small {
      display: block;
      margin-top: 3px;
      color: var(--muted);
      font-size: 11px;
    }
    .section-chip.selected {
      background: color-mix(in srgb, var(--accent) 9%, var(--surface));
      border-color: color-mix(in srgb, var(--accent) 32%, var(--border));
    }
    .workspace {
      display: grid;
      grid-template-columns: 260px 1fr 292px;
      gap: 18px;
    }
    .panel {
      overflow: hidden;
      border: 1px solid var(--border);
      border-radius: ${v.dark ? '8px' : '18px'};
      background: color-mix(in srgb, var(--surface) 88%, transparent);
      box-shadow: var(--shadow);
    }
    .panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 52px;
      padding: 0 17px;
      border-bottom: 1px solid var(--border);
      color: var(--ink);
      font-size: 14px;
      font-weight: 850;
    }
    .block-list {
      display: grid;
      gap: 10px;
      padding: 14px;
    }
    .block {
      min-height: 74px;
      padding: 13px;
      border: 1px solid var(--border);
      border-radius: ${v.dark ? '6px' : '13px'};
      background: color-mix(in srgb, var(--surfaceSoft) 70%, transparent);
    }
    .block strong {
      display: block;
      color: var(--ink);
      font-size: 13px;
      line-height: 1.15;
    }
    .block span {
      display: block;
      margin-top: 6px;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.35;
    }
    .email {
      background: var(--surface);
    }
    .hero {
      position: relative;
      min-height: 300px;
      padding: 30px 34px;
      background:
        linear-gradient(90deg, color-mix(in srgb, var(--heroA) 92%, transparent), color-mix(in srgb, var(--heroB) 72%, transparent)),
        repeating-linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.08) 1px, transparent 1px, transparent 24px);
      color: #fffaf0;
    }
    .hero::after {
      content: "";
      position: absolute;
      right: 24px;
      top: 22px;
      width: 168px;
      height: 82px;
      background: url('${logoPath}') center / contain no-repeat;
      opacity: ${v.dark ? '.2' : '.18'};
      filter: brightness(0) invert(1);
    }
    .tag {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 0 11px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--cream, #e9e5dd) 88%, transparent);
      color: #151515;
      font-size: 11px;
      font-weight: 850;
    }
    .hero h2 {
      width: 480px;
      margin: 50px 0 0;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 47px;
      line-height: .98;
      font-weight: 500;
      letter-spacing: -.018em;
    }
    .email-body {
      padding: 28px 38px 34px;
    }
    .email-body p {
      width: 620px;
      margin: 0 0 14px;
      color: var(--text);
      font-size: 15px;
      line-height: 1.55;
    }
    .lots {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 20px;
    }
    .lot {
      min-height: 104px;
      padding: 13px;
      border: 1px solid var(--border);
      border-radius: ${v.dark ? '6px' : '13px'};
      background: var(--surfaceSoft);
    }
    .lot small {
      color: var(--second);
      font-size: 10px;
      font-weight: 900;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    .lot strong {
      display: block;
      margin-top: 8px;
      color: var(--ink);
      font-size: 17px;
      line-height: 1.06;
    }
    .lot span {
      display: block;
      margin-top: 8px;
      color: var(--muted);
      font-size: 12px;
    }
    .quality {
      padding: 18px;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      min-height: 27px;
      padding: 0 10px;
      border: 1px solid color-mix(in srgb, var(--second) 36%, transparent);
      border-radius: 999px;
      background: color-mix(in srgb, var(--second) 13%, transparent);
      color: var(--second);
      font-size: 11px;
      font-weight: 850;
    }
    .rows {
      display: grid;
      margin-top: 18px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border);
      color: var(--muted);
      font-size: 12px;
    }
    .row strong { color: var(--ink); }
    .suggestion {
      margin-top: 22px;
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: ${v.dark ? '6px' : '14px'};
      background: var(--surfaceSoft);
    }
    .suggestion b {
      display: block;
      color: var(--ink);
      font-size: 14px;
      margin-bottom: 8px;
    }
    .suggestion span {
      color: var(--muted);
      font-size: 12px;
      line-height: 1.42;
    }
  </style>
</head>
<body>
  <main class="screen">
    <div class="top-strip">
      <span>CRM Milan Horses</span>
      <strong>${v.title} / ${v.tag}</strong>
      <span>mesmas seções do CRM atual</span>
    </div>
    <div class="layout">
      <aside class="sidebar">
        <div class="logo-panel"><img src="${logoPath}" alt="Milan Horses" /></div>
        <div class="nav-label">Seções atuais</div>
        <nav class="nav">${navHtml}</nav>
      </aside>
      <section class="main">
        <header class="page-head">
          <div>
            <div class="eyebrow">${v.tag}</div>
            <h1>O mesmo CRM, com uma camada visual de estúdio premium.</h1>
            <p class="copy">${v.mood} A navegação, as telas e os módulos permanecem os mesmos; muda apenas a linguagem visual.</p>
          </div>
          <div class="actions">
            <span class="btn">Prévia CRM</span>
            <span class="btn primary">Aplicar tema</span>
          </div>
        </header>
        <section class="section-map">${sectionHtml}</section>
        <section class="workspace">
          <aside class="panel">
            <div class="panel-head">Blocos do Estúdio</div>
            <div class="block-list">
              <div class="block"><strong>Banner editorial</strong><span>Foto, título, data e CTA.</span></div>
              <div class="block"><strong>Seleção de lotes</strong><span>3 animais por perfil RFMV.</span></div>
              <div class="block"><strong>Genealogia</strong><span>Matriz, garanhão e nota curta.</span></div>
              <div class="block"><strong>WhatsApp CTA</strong><span>Link rastreado BotConversa.</span></div>
              <div class="block"><strong>Assinatura Milan</strong><span>Contato, catálogo e agenda.</span></div>
            </div>
          </aside>
          <article class="panel email">
            <div class="hero">
              <span class="tag">Preview VIP</span>
              <h2>Uma seleção rara para sua próxima temporada</h2>
            </div>
            <div class="email-body">
              <p>Olá, {{primeiro_nome}}. Separamos uma curadoria com animais que combinam com seu histórico de interesse e compras recentes.</p>
              <p>O leilão abre nesta semana com oportunidades de matrizes e potros BH de linhagens competitivas.</p>
              <div class="lots">
                <div class="lot"><small>Lote 07</small><strong>Matriz importada</strong><span>alto valor genético</span></div>
                <div class="lot"><small>Lote 11</small><strong>Potro BH</strong><span>linha de performance</span></div>
                <div class="lot"><small>Lote 18</small><strong>Embrião</strong><span>cross recomendado</span></div>
              </div>
              <div style="margin-top:18px;"><span class="btn primary">Ver catálogo reservado</span></div>
            </div>
          </article>
          <aside class="panel">
            <div class="panel-head">Qualidade</div>
            <div class="quality">
              <span class="pill">Luxo direto</span>
              <div class="rows">
                <div class="row"><span>Segmento</span><strong>VIP matrizes</strong></div>
                <div class="row"><span>Variáveis válidas</span><strong>8 / 8</strong></div>
                <div class="row"><span>Banner</span><strong>1 imagem</strong></div>
                <div class="row"><span>Preview mobile</span><strong>OK</strong></div>
                <div class="row"><span>Score</span><strong>94 / 100</strong></div>
              </div>
              <div class="suggestion"><b>Sem mudar módulos</b><span>Este visual é aplicado sobre o CRM atual: Dashboard, Contatos, Radar VIP, Campanhas, Estúdio, Leilões, Genética, Studbook, Relatórios e Configurações.</span></div>
            </div>
          </aside>
        </section>
      </section>
    </div>
  </main>
</body>
</html>`
}

function indexPage() {
  const cards = variants
    .map(
      (v) => `<a href="${v.id}.html"><img src="${v.id}.png" alt="${v.title}" /><strong>${v.title}</strong><span>${v.mood}</span></a>`,
    )
    .join('')

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Variações de Design - CRM Milan</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #efe8d8;
      color: #071b37;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background-image: linear-gradient(rgba(7,27,55,.028) 1px, transparent 1px);
      background-size: 100% 8px;
    }
    main { position: relative; width: 1440px; margin: 0 auto; padding: 42px; }
    header {
      display: grid;
      grid-template-columns: 180px 1fr 390px;
      gap: 34px;
      align-items: end;
      margin-bottom: 28px;
    }
    .logo-box {
      display:grid;
      place-items:center;
      height: 122px;
      border: 1px solid rgba(7,27,55,.16);
      border-radius: 20px;
      background: rgba(255,255,255,.54);
      overflow:hidden;
    }
    .logo-box img { width: 150px; height: 96px; object-fit: contain; mix-blend-mode: multiply; }
    .eyebrow {
      color: #a87635;
      font-size: 11px;
      font-weight: 850;
      letter-spacing: .18em;
      text-transform: uppercase;
    }
    h1 {
      margin: 8px 0 0;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 66px;
      line-height: .96;
      font-weight: 500;
      letter-spacing: -.018em;
    }
    p { margin: 0; color: #40506a; font-size: 16px; line-height: 1.5; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
    a {
      display:block;
      overflow:hidden;
      text-decoration:none;
      border:1px solid rgba(7,27,55,.14);
      border-radius:22px;
      background:#fffaf1;
      box-shadow:0 28px 80px rgba(54,43,25,.14);
      color:#071b37;
    }
    a img { display:block; width:100%; height:410px; object-fit:cover; object-position:top left; border-bottom:1px solid rgba(7,27,55,.12); }
    a strong { display:block; padding:18px 20px 4px; font-size:23px; }
    a span { display:block; padding:0 20px 20px; color:#667085; font-size:14px; }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="logo-box"><img src="${logoPath}" alt="Milan Horses" /></div>
      <div>
        <div class="eyebrow">4 variações mantendo o CRM atual</div>
        <h1>O Estúdio como linguagem visual do produto inteiro.</h1>
      </div>
      <p>Não muda a arquitetura do CRM. As versões abaixo preservam todas as seções atuais e mostram apenas possibilidades de design.</p>
    </header>
    <section class="grid">${cards}</section>
  </main>
</body>
</html>`
}

await Promise.all([
  ...variants.map((variant) => fs.writeFile(new URL(`${variant.id}.html`, outDir), appShell(variant))),
  fs.writeFile(new URL('index.html', outDir), indexPage()),
])

console.log(`Wrote ${variants.length} Milan Estudio variants`)
