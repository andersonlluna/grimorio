/* ════════════════════════════════════════════════════════════════
   GRIMÓRIO — JS BASE COMPARTILHADO
   Liga Supertecnicos · Temporada 2026

   Uso na página de cada grimório:
     <script src="../assets/grimorio.js"></script>
     <script>initGrimorio('../data/varelitas.json');</script>

   O JSON é a fonte da verdade — toda mudança de carta/lore
   é feita lá, não em HTML.
   ════════════════════════════════════════════════════════════════ */

// Bônus por tier (alinhado ao motor-alpha)
const TIER_BONUS = { SS: '+15', S: '+10', A: '+6', B: '+3', C: '+0' };
const TIER_LIMIAR = {
  SS: '≥ 115 pts ou marco',
  S:  '≥ 100 pts',
  A:  '≥ 90 pts',
  B:  '≥ 80 pts',
  C:  '≥ 65 pts'
};
const TIER_LABEL = { SS: 'Lendário', S: 'Épico', A: 'Raro', B: 'Incomum', C: 'Comum' };
const TIER_TITLE = {
  SS: 'SS · Lendário — ≥ 115 pts ou marco',
  S:  'S · Épico — ≥ 100 pts',
  A:  'A · Raro — ≥ 90 pts',
  B:  'B · Incomum — ≥ 80 pts',
  C:  'C · Comum — ≥ 65 pts'
};
const TIER_ORDER = ['SS', 'S', 'A', 'B', 'C'];

// Encoding seguro de URL (preserva os arquivos com espaços e parênteses)
function encFile(f) {
  return f.replace(/ /g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29');
}

// Estado global (escopo do módulo)
let _data = null;
let _cdnBase = '';

// ═══════════════════════════════════════════
// BOOTSTRAP — carrega o JSON e renderiza tudo
// ═══════════════════════════════════════════
async function initGrimorio(jsonPath) {
  try {
    const res = await fetch(jsonPath);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    _data = await res.json();
    _cdnBase = `https://cdn.jsdelivr.net/gh/andersonlluna/grimorio@main/${_data.slug}/`;

    renderHeader();
    renderStatsBar();
    renderGrimorio();
    renderGaleria();
    renderLore();

    // Acessibilidade: ESC fecha modal
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModalDirect();
    });
  } catch (err) {
    console.error('Falha ao carregar grimório:', err);
    const root = document.querySelector('.content') || document.body;
    root.innerHTML = `<div style="padding:2rem;color:#c87;font-family:monospace;">
      Erro ao carregar dados do grimório.<br>${err.message}
    </div>`;
  }
}

// ═══════════════════════════════════════════
// RENDER — Header, Stats, Sections
// ═══════════════════════════════════════════
function renderHeader() {
  const h = document.getElementById('grimorio-header');
  if (!h) return;
  h.innerHTML = `
    <a href="../index.html" class="back-link">← Grimório Geral</a>
    <a href="../regulamento-fase-alpha.html" class="back-link">Regulamento ←</a>
    <span class="sigil">${_data.sigil}</span>
    <h1>${_data.name}</h1>
    <div class="header-region">${_data.region} · ${_data.tagline}</div>
    <div class="header-lore">${_data.headerLore}</div>
    <div class="header-league">Liga Supertecnicos · Temporada 2026</div>
  `;
}

function renderStatsBar() {
  const sb = document.getElementById('grimorio-stats');
  if (!sb || !_data.stats) return;
  sb.innerHTML = _data.stats
    .map(s => `<div class="stat-item">
      <span class="stat-val">${s.value}</span>
      <div class="stat-label">${s.label}</div>
    </div>`).join('');
}

function renderGrimorio() {
  const sec = document.getElementById('s-grimorio');
  if (!sec) return;

  // Agrupar criaturas por tier
  const grouped = {};
  for (const t of TIER_ORDER) grouped[t] = [];
  _data.creatures.forEach(c => {
    if (grouped[c.tier]) grouped[c.tier].push(c);
  });

  let html = `
    <div class="section-title">O Grimório de ${_data.name}</div>
    <div class="section-intro">${_data.intro}</div>
  `;

  for (const tier of TIER_ORDER) {
    if (grouped[tier].length === 0) continue;
    html += `<div class="group-title">${TIER_TITLE[tier]}</div>`;
    grouped[tier].forEach(c => {
      html += renderCreatureCard(c);
    });
  }

  sec.innerHTML = html;
}

function renderCreatureCard(c) {
  const ssClass = c.tier === 'SS' ? (c.secret ? ' ss-secret' : ' ss-card') : '';
  const lockHTML = c.secret && c.secretCondition
    ? `<div class="secret-lock">✦ ${c.secretCondition}</div>`
    : '';
  const limiar = c.secret
    ? ''
    : `<div class="creature-stat">Limiar <span>${TIER_LIMIAR[c.tier]}</span></div>`;

  return `
    <div class="creature-card${ssClass}" onclick="toggleCard(this)">
      <div class="creature-header">
        <div class="tier-badge t-${c.tier.toLowerCase()}">${c.tier}</div>
        <div class="creature-meta">
          <div class="creature-name">${escapeHtml(c.name)}</div>
          <div class="creature-epithet">${escapeHtml(c.epithet)}</div>
        </div>
        <div class="creature-toggle">▾</div>
      </div>
      <div class="creature-body">
        <img class="creature-image"
             src="${_cdnBase}${encFile(c.file)}"
             alt="${escapeHtml(c.name)}"
             loading="lazy" decoding="async">
        <div class="creature-details">
          <div class="creature-lore">${escapeHtml(c.lore)}</div>
          <div class="creature-stats">
            <div class="creature-stat">Tier <span>${c.tier}</span></div>
            <div class="creature-stat">Bônus <span>${TIER_BONUS[c.tier]}</span></div>
            ${limiar}
          </div>
          ${lockHTML}
        </div>
      </div>
    </div>
  `;
}

function renderGaleria() {
  const sec = document.getElementById('s-galeria');
  if (!sec) return;
  let html = `
    <div class="section-title">Galeria do Grimório</div>
    <div class="section-intro">Todas as criaturas de ${_data.region}. Toque para ver detalhes.</div>
    <div class="grimoire-grid">
  `;
  _data.creatures.forEach((c, i) => {
    const tierColor = `var(--tier-${c.tier.toLowerCase()})`;
    const secretBadge = c.secret ? '<div class="grid-card-secret">✦ SECRETA</div>' : '';
    const shortName = c.name.split(',')[0];
    html += `
      <div class="grid-card" onclick="openModal(${i})">
        ${secretBadge}
        <img src="${_cdnBase}${encFile(c.file)}"
             alt="${escapeHtml(c.name)}"
             loading="lazy" decoding="async">
        <div class="grid-card-info">
          <div class="grid-card-tier" style="color:${tierColor}">${c.tier}</div>
          <div class="grid-card-name">${escapeHtml(shortName)}</div>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  sec.innerHTML = html;
}

function renderLore() {
  const sec = document.getElementById('s-lore');
  if (!sec) return;
  let html = `
    <div class="section-title">A Região de ${_data.region}</div>
    <div class="section-intro">${_data.headerLore}</div>
  `;
  (_data.lore || []).forEach(b => {
    const klass = b.secret ? ' secret' : '';
    html += `
      <div class="lore-block${klass}">
        <h3>${escapeHtml(b.title)}</h3>
        <p>${b.content}</p>
      </div>`;
  });
  if (_data.endNote) {
    html += `<div class="note">${_data.endNote}</div>`;
  }
  sec.innerHTML = html;
}

// ═══════════════════════════════════════════
// INTERAÇÕES — toggle, nav, modal
// ═══════════════════════════════════════════
function toggleCard(el) {
  el.classList.toggle('expanded');
}

function show(id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('s-' + id).classList.add('active');
  btn.classList.add('active');
  const nav = document.querySelector('.nav');
  if (nav) window.scrollTo({ top: nav.offsetTop, behavior: 'smooth' });
}

function openModal(i) {
  const c = _data.creatures[i];
  if (!c) return;
  document.getElementById('modal-img').src = _cdnBase + encFile(c.file);
  const tierColor = `var(--tier-${c.tier.toLowerCase()})`;
  document.getElementById('modal-tier').innerHTML =
    `<span style="color:${tierColor};font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:2px;">
       ${c.tier} · ${c.secret ? 'INVOCAÇÃO SECRETA' : TIER_LABEL[c.tier]}
     </span>`;
  document.getElementById('modal-name').textContent = c.name;
  document.getElementById('modal-epithet').textContent = c.epithet;
  document.getElementById('modal-lore').textContent = c.lore;
  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  if (e.target === document.getElementById('modal')) closeModalDirect();
}
function closeModalDirect() {
  const m = document.getElementById('modal');
  if (m) m.classList.remove('open');
  document.body.style.overflow = '';
}

// ═══════════════════════════════════════════
// UTIL
// ═══════════════════════════════════════════
function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
