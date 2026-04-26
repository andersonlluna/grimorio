/* ════════════════════════════════════════════════════════════════
   GRIMÓRIO — JS BASE · v3
   Liga Supertecnicos · Temporada 2026

   Renderiza cards estilo coleção. O grimório agora é um grid
   de cartas com imagem visível; click abre modal com lore.
   ════════════════════════════════════════════════════════════════ */

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
  SS: 'SS · Lendário',
  S:  'S · Épico',
  A:  'A · Raro',
  B:  'B · Incomum',
  C:  'C · Comum'
};
const TIER_ORDER = ['SS', 'S', 'A', 'B', 'C'];

function encFile(f) {
  return f.replace(/ /g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29');
}

let _data = null;
let _cdnBase = '';

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

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModalDirect();
    });
  } catch (err) {
    console.error('Falha ao carregar grimório:', err);
    const root = document.querySelector('.content') || document.body;
    root.innerHTML = `<div style="padding:2rem;color:#ff8888;font-family:monospace;text-align:center;">
      Erro ao carregar dados do grimório.<br><br>${err.message}
    </div>`;
  }
}

function renderHeader() {
  const h = document.getElementById('grimorio-header');
  if (!h) return;
  h.innerHTML = `
    <a href="../index.html" class="back-link">← Grimório Geral</a>
    <a href="../regulamento-fase-alpha.html" class="back-link">Regulamento →</a>
    <div class="header-ornament">
      <span class="header-ornament-icon">✦</span>
    </div>
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

  const grouped = {};
  TIER_ORDER.forEach(t => grouped[t] = []);
  _data.creatures.forEach((c, idx) => {
    if (grouped[c.tier]) grouped[c.tier].push({ creature: c, idx });
  });

  let html = `
    <div class="section-title">O Grimório de ${_data.name}</div>
    <div class="section-intro">${_data.intro}</div>
  `;

  for (const tier of TIER_ORDER) {
    if (grouped[tier].length === 0) continue;
    html += `
      <div class="group-title">
        <span class="group-title-icon">◆</span>
        ${TIER_TITLE[tier]}
        <span class="group-title-icon">◆</span>
      </div>
      <div class="creature-grid">
    `;
    grouped[tier].forEach(({ creature, idx }) => {
      html += renderCreatureCard(creature, idx);
    });
    html += `</div>`;
  }

  sec.innerHTML = html;
}

function renderCreatureCard(c, idx) {
  const tierLow = c.tier.toLowerCase();
  const ssClass = c.tier === 'SS' ? (c.secret ? ' ss-secret' : '') : '';
  const secretBadge = c.secret ? '<div class="card-secret-tag">✦ Secreta</div>' : '';
  const shortName = c.name.split(',')[0].split(' — ')[0];

  return `
    <div class="creature-card t-${tierLow}${ssClass}" onclick="openModal(${idx})">
      ${secretBadge}
      <div class="card-image-wrap">
        <img class="card-image"
             src="${_cdnBase}${encFile(c.file)}"
             alt="${escapeHtml(c.name)}"
             loading="lazy" decoding="async">
        <div class="card-image-shade"></div>
        <div class="card-tier-badge t-${tierLow}">${c.tier}</div>
      </div>
      <div class="card-info">
        <div class="card-name">${escapeHtml(shortName)}</div>
        <div class="card-epithet">${escapeHtml(c.epithet)}</div>
      </div>
    </div>
  `;
}

function renderGaleria() {
  const sec = document.getElementById('s-galeria');
  if (!sec) return;
  let html = `
    <div class="section-title">Galeria</div>
    <div class="section-intro">Visão completa de todas as criaturas de ${_data.region}.</div>
    <div class="grimoire-grid">
  `;
  _data.creatures.forEach((c, i) => {
    const tierColor = `var(--tier-${c.tier.toLowerCase()})`;
    const secretBadge = c.secret ? '<div class="grid-card-secret">✦ Secreta</div>' : '';
    const shortName = c.name.split(',')[0].split(' — ')[0];
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
  const tierColor = `var(--tier-${c.tier.toLowerCase()})`;
  document.getElementById('modal-img').src = _cdnBase + encFile(c.file);
  document.getElementById('modal-tier').innerHTML =
    `<span style="color:${tierColor};font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;">
       ${c.tier} · ${c.secret ? 'Invocação Secreta' : TIER_LABEL[c.tier]}
       ${!c.secret ? ` · Bônus ${TIER_BONUS[c.tier]}` : ''}
     </span>`;
  document.getElementById('modal-name').textContent = c.name;
  document.getElementById('modal-epithet').textContent = c.epithet;

  let loreHtml = escapeHtml(c.lore);
  if (c.secret && c.secretCondition) {
    loreHtml += `<div class="modal-secret-cond">${escapeHtml(c.secretCondition)}</div>`;
  }
  document.getElementById('modal-lore').innerHTML = loreHtml;

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

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
