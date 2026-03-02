/* ================================================
   DATA DIAMOND — main.js
   Handles: index, team, and player pages
================================================ */

const REPO_NAME = 'BIG-FISHY';
const DATA_PATH = 'data/stats.json';

// ─── STATE ───────────────────────────────────────
let DATA = null;
let currentPage = null;

// ─── INIT ─────────────────────────────────────────
async function init() {
  DATA = await loadData();
  if (!DATA) return;

  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';

  if (page === 'index.html' || page === '' || page === '/') {
    currentPage = 'index';
    initIndex();
  } else if (page === 'team.html') {
    currentPage = 'team';
    initTeamPage();
  } else if (page === 'player.html') {
    currentPage = 'player';
    initPlayerPage();
  }

  initGlobalSearch();
}

async function loadData() {
  try {
    // Compute path relative to where we are in the directory
    const base = getBasePath();
    const res = await fetch(base + DATA_PATH);
    return await res.json();
  } catch (e) {
    console.error('Failed to load data:', e);
    return null;
  }
}

function getBasePath() {
  const path = window.location.pathname;
  if (path.includes('/pages/') || path.endsWith('/team.html') || path.endsWith('/player.html')) {
    return '../';
  }
  return '';
}

function getURL(file, params = {}) {
  const base = getBasePath();
  const qs = new URLSearchParams(params).toString();
  return base + file + (qs ? '?' + qs : '');
}

// ─── INDEX PAGE ───────────────────────────────────
function initIndex() {
  buildTeamsGrid();
  buildFeaturedPlayers();
  buildTicker();
  initFilterTabs();
}

function buildTeamsGrid() {
  const grid = document.getElementById('teams-grid');
  if (!grid) return;

  DATA.teams.forEach((team, i) => {
    const playerCount = DATA.players.filter(p => p.team === team.id).length;
    const card = document.createElement('div');
    card.className = 'team-card fade-up';
    card.style.setProperty('--team-color', team.primaryColor);
    card.style.animationDelay = `${i * 0.025}s`;
    card.dataset.league = team.league;
    card.dataset.division = team.division;
    card.dataset.teamId = team.id;

    card.innerHTML = `
      <div class="team-abbr">${team.abbreviation}</div>
      <div>
        <div class="team-card-name">${team.name}</div>
        <div class="team-card-meta">${team.division}</div>
      </div>
      <div class="team-card-footer">
        <span class="team-player-count">${playerCount} player${playerCount !== 1 ? 's' : ''}</span>
        <svg class="team-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>
    `;

    card.addEventListener('click', () => {
      window.location.href = getURL('team.html', { team: team.id });
    });

    grid.appendChild(card);
  });
}

function buildFeaturedPlayers() {
  const strip = document.getElementById('featured-players');
  if (!strip) return;

  const featured = DATA.players.slice(0, 6);
  featured.forEach((player, i) => {
    const team = DATA.teams.find(t => t.id === player.team);
    const card = buildPlayerCard(player, team);
    card.style.animationDelay = `${i * 0.06}s`;
    card.classList.add('fade-up');
    strip.appendChild(card);
  });
}

function buildPlayerCard(player, team) {
  const card = document.createElement('div');
  card.className = 'player-card';
  const isHitter = !!player.hitting;

  const stats = isHitter
    ? [
        { val: player.hitting.avg.toFixed(3).replace('0.', '.'), lbl: 'AVG' },
        { val: player.hitting.hr, lbl: 'HR' },
        { val: player.hitting.ops.toFixed(3).replace('0.', '.'), lbl: 'OPS' }
      ]
    : [
        { val: player.pitching.era.toFixed(2), lbl: 'ERA' },
        { val: player.pitching.k9.toFixed(1), lbl: 'K/9' },
        { val: player.pitching.whip.toFixed(2), lbl: 'WHIP' }
      ];

  card.innerHTML = `
    <div class="pc-num">${player.number}</div>
    <div class="pc-top">
      <div class="pc-badge">${team ? team.abbreviation : '—'}</div>
      <div class="pc-pos">${player.position}</div>
    </div>
    <div class="pc-name">${player.name}</div>
    <div class="pc-team">${team ? team.name : ''} · ${isHitter ? 'Hitter' : 'Pitcher'}</div>
    <div class="pc-stats">
      ${stats.map(s => `
        <div class="pc-stat">
          <span class="pc-stat-val">${s.val}</span>
          <span class="pc-stat-lbl">${s.lbl}</span>
        </div>
      `).join('')}
    </div>
  `;

  card.addEventListener('click', () => {
    window.location.href = getURL('player.html', { player: player.id });
  });

  return card;
}

function buildTicker() {
  const track = document.getElementById('stat-ticker');
  if (!track) return;

  const items = [];
  DATA.players.forEach(p => {
    if (p.hitting) {
      items.push({ name: p.name, stat: p.hitting.ops.toFixed(3), label: 'OPS' });
      items.push({ name: p.name, stat: p.hitting.hr, label: 'HR' });
    }
    if (p.pitching) {
      items.push({ name: p.name, stat: p.pitching.era.toFixed(2), label: 'ERA' });
      items.push({ name: p.name, stat: p.pitching.k9.toFixed(1), label: 'K/9' });
    }
  });

  // Duplicate for infinite scroll
  const all = [...items, ...items];
  track.innerHTML = all.map(item => `
    <div class="ticker-item">
      <span class="ticker-name">${item.name}</span>
      <span class="ticker-stat">${item.stat}</span>
      <span class="ticker-label">${item.label}</span>
    </div>
  `).join('');
}

function initFilterTabs() {
  const tabs = document.querySelectorAll('.filter-tab');
  const cards = document.querySelectorAll('.team-card');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.dataset.filter;
      cards.forEach(card => {
        if (filter === 'all') {
          card.classList.remove('hidden');
        } else if (filter === 'AL' || filter === 'NL') {
          card.classList.toggle('hidden', card.dataset.league !== filter);
        } else {
          card.classList.toggle('hidden', card.dataset.division !== filter);
        }
      });
    });
  });
}

// ─── TEAM PAGE ────────────────────────────────────
function initTeamPage() {
  const params = new URLSearchParams(window.location.search);
  const teamId = params.get('team');
  const team = DATA.teams.find(t => t.id === teamId);
  if (!team) { showError('Team not found.'); return; }

  // Set team color CSS var
  document.documentElement.style.setProperty('--team-primary', team.primaryColor);

  // Hero
  document.title = `${team.name} — Data Diamond`;
  document.getElementById('team-full-name').textContent = team.name;
  document.getElementById('team-abbr-display').textContent = team.abbreviation;
  document.getElementById('team-abbr-display').style.color = team.primaryColor;
  document.getElementById('team-division-label').textContent = team.division + ' · ' + team.league;
  document.getElementById('bc-team-name').textContent = team.name;

  const heroBg = document.getElementById('team-hero-bg');
  heroBg.style.background = `radial-gradient(ellipse 80% 60% at 20% 50%, ${hexToRgba(team.primaryColor, 0.15)} 0%, transparent 70%), var(--bg)`;

  const players = DATA.players.filter(p => p.team === teamId);

  // Roster tabs
  const tabs = document.querySelectorAll('.report-tab');
  const content = document.getElementById('roster-content');

  function renderRoster(type) {
    const filtered = players.filter(p => type === 'hitters' ? !!p.hitting : !!p.pitching);
    content.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'stat-card fade-up';

    const filterBar = document.createElement('div');
    filterBar.className = 'roster-filters';
    filterBar.innerHTML = `
      <input class="roster-search" placeholder="Search ${type}…" id="roster-search-input" />
    `;
    content.appendChild(filterBar);

    if (filtered.length === 0) {
      content.innerHTML += `
        <div class="empty-state">
          <div class="empty-state-icon">⚾</div>
          <h3>No ${type} data yet</h3>
          <p>Add players to data/stats.json to populate this roster.</p>
        </div>
      `;
      return;
    }

    if (type === 'hitters') {
      card.innerHTML = `
        <div class="stat-card-header">
          <span class="stat-card-title">Hitting Stats</span>
          <span class="stat-card-subtitle">${filtered.length} players · Click header to sort</span>
        </div>
        ${buildHittingTable(filtered)}
      `;
    } else {
      card.innerHTML = `
        <div class="stat-card-header">
          <span class="stat-card-title">Pitching Stats</span>
          <span class="stat-card-subtitle">${filtered.length} players · Click header to sort</span>
        </div>
        ${buildPitchingTable(filtered)}
      `;
    }

    content.appendChild(card);
    initTableSort(card.querySelector('table'));
    initPlayerLinks(card);

    // Search
    document.getElementById('roster-search-input').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      card.querySelectorAll('tbody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderRoster(tab.dataset.tab);
    });
  });

  renderRoster('hitters');
}

function buildHittingTable(players) {
  const rows = players.map(p => {
    const h = p.hitting;
    return `
      <tr>
        <td><span class="pos-badge">${p.position}</span><a class="player-name-cell" data-player="${p.id}">${p.name}</a></td>
        <td class="highlight-val">${h.avg.toFixed(3).replace('0.','.')}</td>
        <td>${h.obp.toFixed(3).replace('0.','.')}</td>
        <td>${h.slg.toFixed(3).replace('0.','.')}</td>
        <td class="highlight-val">${h.ops.toFixed(3).replace('0.','.')}</td>
        <td>${h.hr}</td>
        <td>${h.rbi}</td>
        <td>${h.r}</td>
        <td>${h.h}</td>
        <td>${h['2b']}</td>
        <td>${h.sb}</td>
        <td>${h.bb}</td>
        <td>${h.k}</td>
        <td class="${h.wRC_plus >= 130 ? 'good' : h.wRC_plus >= 100 ? '' : 'bad'}">${h.wRC_plus}</td>
      </tr>
    `;
  }).join('');

  return `
    <table class="stat-table">
      <thead><tr>
        <th>Player</th><th>AVG</th><th>OBP</th><th>SLG</th><th>OPS</th>
        <th>HR</th><th>RBI</th><th>R</th><th>H</th><th>2B</th>
        <th>SB</th><th>BB</th><th>K</th><th>wRC+</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function buildPitchingTable(players) {
  const rows = players.map(p => {
    const pt = p.pitching;
    return `
      <tr>
        <td><span class="pos-badge">${p.position}</span><a class="player-name-cell" data-player="${p.id}">${p.name}</a></td>
        <td class="${pt.era <= 3.0 ? 'good' : pt.era >= 4.5 ? 'bad' : 'highlight-val'}">${pt.era.toFixed(2)}</td>
        <td>${pt.whip.toFixed(2)}</td>
        <td class="highlight-val">${pt.k9.toFixed(1)}</td>
        <td>${pt.bb9.toFixed(1)}</td>
        <td>${pt.fip.toFixed(2)}</td>
        <td>${pt.w}-${pt.l}</td>
        <td>${pt.ip}</td>
        <td>${pt.k}</td>
        <td>${pt.bb}</td>
        <td>${(pt.k_pct * 100).toFixed(1)}%</td>
        <td>${(pt.bb_pct * 100).toFixed(1)}%</td>
        <td class="${pt.war >= 5 ? 'good' : pt.war >= 3 ? '' : 'bad'}">${pt.war.toFixed(1)}</td>
      </tr>
    `;
  }).join('');

  return `
    <table class="stat-table">
      <thead><tr>
        <th>Player</th><th>ERA</th><th>WHIP</th><th>K/9</th><th>BB/9</th><th>FIP</th>
        <th>W-L</th><th>IP</th><th>K</th><th>BB</th><th>K%</th><th>BB%</th><th>WAR</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ─── PLAYER PAGE ──────────────────────────────────
function initPlayerPage() {
  const params = new URLSearchParams(window.location.search);
  const playerId = params.get('player');
  const player = DATA.players.find(p => p.id === playerId);
  if (!player) { showError('Player not found.'); return; }

  const team = DATA.teams.find(t => t.id === player.team);
  const isHitter = !!player.hitting;

  document.title = `${player.name} — Data Diamond`;

  // Breadcrumb
  const bcTeam = document.getElementById('bc-team');
  bcTeam.textContent = team ? team.abbreviation : '';
  bcTeam.href = getURL('team.html', { team: player.team });
  document.getElementById('bc-player').textContent = player.name;

  // Hero BG
  if (team) {
    document.getElementById('player-hero-bg').style.background =
      `radial-gradient(ellipse 80% 60% at 20% 50%, ${hexToRgba(team.primaryColor, 0.18)} 0%, transparent 70%), var(--bg)`;
  }

  // Hero content
  document.getElementById('player-number-display').textContent = '#' + player.number;
  document.getElementById('player-name').textContent = player.name;
  document.getElementById('player-badges').innerHTML = `
    <span class="badge badge-pos">${player.position}</span>
    <span class="badge badge-team">${team ? team.abbreviation : '—'} · ${player.bats === player.throws ? player.bats + '/' + player.throws : 'B:' + player.bats + ' T:' + player.throws}</span>
    <span class="badge badge-team">${isHitter ? 'Hitter' : 'Pitcher'}</span>
  `;
  document.getElementById('player-meta').innerHTML = `
    <span>${team ? team.name : ''}</span>
    <span>·</span>
    <span>#${player.number}</span>
    <span>·</span>
    <span>${player.bats === 'R' ? 'Right-handed' : player.bats === 'L' ? 'Left-handed' : 'Switch hitter'}</span>
  `;

  // Headline stats
  const headlineEl = document.getElementById('player-headline-stats');
  const headlines = isHitter
    ? [
        { val: player.hitting.avg.toFixed(3).replace('0.', '.'), lbl: 'AVG' },
        { val: player.hitting.ops.toFixed(3).replace('0.', '.'), lbl: 'OPS' },
        { val: player.hitting.hr, lbl: 'HR' },
        { val: player.hitting.rbi, lbl: 'RBI' }
      ]
    : [
        { val: player.pitching.era.toFixed(2), lbl: 'ERA' },
        { val: player.pitching.k9.toFixed(1), lbl: 'K/9' },
        { val: player.pitching.whip.toFixed(2), lbl: 'WHIP' },
        { val: player.pitching.war.toFixed(1), lbl: 'WAR' }
      ];

  headlineEl.innerHTML = headlines.map(h => `
    <div class="phs-stat">
      <span class="phs-val">${h.val}</span>
      <span class="phs-lbl">${h.lbl}</span>
    </div>
  `).join('');

  // Tabs
  const tabs = document.querySelectorAll('.report-tab');
  const content = document.getElementById('report-content');

  const tabRenderers = {
    overview: () => renderOverview(player, isHitter),
    season: () => renderSeasonReport(player, isHitter),
    zone: () => renderZone(player, isHitter),
    splits: () => renderSplits(player, isHitter)
  };

  function activateTab(tabName) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    content.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = 'tab-panel active fade-up';
    panel.innerHTML = tabRenderers[tabName](player, isHitter);
    content.appendChild(panel);
    // Trigger bar animations after render
    setTimeout(() => {
      content.querySelectorAll('.sbr-fill, .whiff-bar-fill').forEach(el => {
        const w = el.dataset.width;
        if (w) el.style.width = w;
      });
    }, 50);
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab.dataset.tab));
  });

  activateTab('overview');
}

function renderOverview(player, isHitter) {
  if (isHitter) {
    const h = player.hitting;
    const bars = [
      { label: 'AVG', val: h.avg.toFixed(3).replace('0.','.'), pct: h.avg / 0.35 },
      { label: 'OBP', val: h.obp.toFixed(3).replace('0.','.'), pct: h.obp / 0.42 },
      { label: 'SLG', val: h.slg.toFixed(3).replace('0.','.'), pct: h.slg / 0.65 },
      { label: 'OPS', val: h.ops.toFixed(3).replace('0.','.'), pct: h.ops / 1.0 },
      { label: 'ISO', val: h.iso.toFixed(3).replace('0.','.'), pct: h.iso / 0.30 },
      { label: 'BABIP', val: h.babip.toFixed(3).replace('0.','.'), pct: h.babip / 0.38 },
    ];
    const counting = [
      { label: 'Home Runs', val: h.hr }, { label: 'RBI', val: h.rbi },
      { label: 'Runs', val: h.r }, { label: 'Hits', val: h.h },
      { label: 'Doubles', val: h['2b'] }, { label: 'Steals', val: h.sb },
      { label: 'Walks', val: h.bb }, { label: 'Strikeouts', val: h.k },
    ];
    return `
      <div class="overview-grid">
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">Rate Stats</span>
            <span class="stat-card-subtitle">wRC+ ${h.wRC_plus}</span>
          </div>
          <div style="padding:16px 24px">
            ${bars.map(b => `
              <div class="stat-bar-row">
                <div class="sbr-label">${b.label}</div>
                <div class="sbr-bar"><div class="sbr-fill" style="width:0%" data-width="${Math.min(b.pct*100,100)}%"></div></div>
                <div class="sbr-val">${b.val}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header"><span class="stat-card-title">Counting Stats</span><span class="stat-card-subtitle">${h.pa} PA · ${h.ab} AB</span></div>
          <div style="padding:0">
            <table class="stat-table">
              <tbody>
                ${counting.map(c => `<tr><td style="color:var(--text-dim)">${c.label}</td><td class="highlight-val" style="text-align:right">${c.val}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } else {
    const pt = player.pitching;
    const bars = [
      { label: 'ERA', val: pt.era.toFixed(2), pct: 1 - (pt.era / 6), invert: true },
      { label: 'FIP', val: pt.fip.toFixed(2), pct: 1 - (pt.fip / 6), invert: true },
      { label: 'WHIP', val: pt.whip.toFixed(2), pct: 1 - (pt.whip / 1.8), invert: true },
      { label: 'K/9', val: pt.k9.toFixed(1), pct: pt.k9 / 14 },
      { label: 'BB/9', val: pt.bb9.toFixed(1), pct: 1 - (pt.bb9 / 6), invert: true },
      { label: 'K%', val: (pt.k_pct*100).toFixed(1)+'%', pct: pt.k_pct / 0.40 },
    ];
    const counting = [
      { label: 'Record', val: `${pt.w}-${pt.l}` }, { label: 'Innings', val: pt.ip },
      { label: 'Strikeouts', val: pt.k }, { label: 'Walks', val: pt.bb },
      { label: 'Hits Allowed', val: pt.h }, { label: 'Earned Runs', val: pt.er },
      { label: 'WAR', val: pt.war.toFixed(1) }, { label: 'GS', val: pt.gs },
    ];
    return `
      <div class="overview-grid">
        <div class="stat-card">
          <div class="stat-card-header"><span class="stat-card-title">Pitching Metrics</span><span class="stat-card-subtitle">xFIP ${pt.xfip.toFixed(2)}</span></div>
          <div style="padding:16px 24px">
            ${bars.map(b => `
              <div class="stat-bar-row">
                <div class="sbr-label">${b.label}</div>
                <div class="sbr-bar"><div class="sbr-fill" style="width:0%" data-width="${Math.max(0,Math.min(b.pct*100,100)).toFixed(1)}%"></div></div>
                <div class="sbr-val">${b.val}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header"><span class="stat-card-title">Season Totals</span><span class="stat-card-subtitle">${pt.gs} starts</span></div>
          <div style="padding:0">
            <table class="stat-table">
              <tbody>
                ${counting.map(c => `<tr><td style="color:var(--text-dim)">${c.label}</td><td class="highlight-val" style="text-align:right">${c.val}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
}

function renderSeasonReport(player, isHitter) {
  if (isHitter) {
    const h = player.hitting;
    return `
      <div class="stat-card fade-up">
        <div class="stat-card-header">
          <span class="stat-card-title">Full Season Hitting Report</span>
          <span class="stat-card-subtitle">2025 Season · ${h.pa} plate appearances</span>
        </div>
        <table class="stat-table">
          <thead><tr>
            <th>AVG</th><th>OBP</th><th>SLG</th><th>OPS</th><th>wRC+</th>
            <th>BABIP</th><th>ISO</th><th>HR</th><th>RBI</th><th>R</th>
            <th>H</th><th>2B</th><th>3B</th><th>SB</th><th>BB</th><th>K</th><th>PA</th><th>AB</th>
          </tr></thead>
          <tbody><tr>
            <td class="highlight-val">${h.avg.toFixed(3).replace('0.','.')}</td>
            <td>${h.obp.toFixed(3).replace('0.','.')}</td>
            <td>${h.slg.toFixed(3).replace('0.','.')}</td>
            <td class="highlight-val">${h.ops.toFixed(3).replace('0.','.')}</td>
            <td class="${h.wRC_plus>=130?'good':h.wRC_plus>=100?'':'bad'}">${h.wRC_plus}</td>
            <td>${h.babip.toFixed(3).replace('0.','.')}</td>
            <td>${h.iso.toFixed(3).replace('0.','.')}</td>
            <td>${h.hr}</td><td>${h.rbi}</td><td>${h.r}</td>
            <td>${h.h}</td><td>${h['2b']}</td><td>${h['3b']}</td>
            <td>${h.sb}</td><td>${h.bb}</td><td>${h.k}</td>
            <td>${h.pa}</td><td>${h.ab}</td>
          </tr></tbody>
        </table>
      </div>
      <div style="margin-top:24px">
        ${renderZone(player, isHitter)}
      </div>
    `;
  } else {
    const pt = player.pitching;
    return `
      <div class="stat-card fade-up">
        <div class="stat-card-header">
          <span class="stat-card-title">Full Season Pitching Report</span>
          <span class="stat-card-subtitle">2025 Season · ${pt.gs} starts · ${pt.ip} IP</span>
        </div>
        <table class="stat-table">
          <thead><tr>
            <th>ERA</th><th>FIP</th><th>xFIP</th><th>WHIP</th><th>K/9</th><th>BB/9</th><th>HR/9</th>
            <th>W</th><th>L</th><th>IP</th><th>K</th><th>BB</th><th>H</th><th>ER</th>
            <th>K%</th><th>BB%</th><th>WAR</th>
          </tr></thead>
          <tbody><tr>
            <td class="${pt.era<=3.0?'good':pt.era>=4.5?'bad':'highlight-val'}">${pt.era.toFixed(2)}</td>
            <td>${pt.fip.toFixed(2)}</td><td>${pt.xfip.toFixed(2)}</td>
            <td>${pt.whip.toFixed(2)}</td>
            <td class="highlight-val">${pt.k9.toFixed(1)}</td>
            <td>${pt.bb9.toFixed(1)}</td><td>${pt.hr9.toFixed(1)}</td>
            <td>${pt.w}</td><td>${pt.l}</td><td>${pt.ip}</td>
            <td>${pt.k}</td><td>${pt.bb}</td><td>${pt.h}</td><td>${pt.er}</td>
            <td>${(pt.k_pct*100).toFixed(1)}%</td>
            <td>${(pt.bb_pct*100).toFixed(1)}%</td>
            <td class="${pt.war>=5?'good':pt.war>=3?'':'bad'}">${pt.war.toFixed(1)}</td>
          </tr></tbody>
        </table>
      </div>
      <div style="margin-top:24px">
        ${renderZone(player, isHitter)}
      </div>
    `;
  }
}

function renderZone(player, isHitter) {
  const sz = player.strikeZone;

  // Build heatmap HTML
  const heatmapCells = sz.heatmap.flat().map((val, i) => {
    const r = Math.round(val * 255);
    const g = Math.round(val * 100);
    const a = 0.2 + val * 0.8;
    const color = `rgba(${r},${g},20,${a})`;
    const pct = (val * 100).toFixed(0);
    return `<div class="heatmap-cell" style="background:${color}" title="${pct}%"></div>`;
  }).join('');

  // Build scatter HTML
  const dots = sz.scatterPoints.map(pt => {
    return `<div class="scatter-dot ${pt.result}" style="left:${pt.x*100}%;top:${(1-pt.y)*100}%" title="${pt.result}"></div>`;
  }).join('');

  // Build zone breakdown
  const locations = ['HI', 'IN', 'UP', 'IN', 'OUT', 'MID', 'MID', 'MID', 'MID', 'MID', 'LO', 'IN', 'DN', 'IN', 'OUT', 'OB', 'OB', 'OB', 'OB', 'OB', 'OB', 'OB', 'OB', 'OB', 'OB'];
  const breakdownCells = sz.heatmap.flat().map((val, i) => {
    const pct = (val * 100).toFixed(0);
    const colorVal = Math.round(val * 255);
    const textColor = val > 0.4 ? '#E8C84A' : val > 0.25 ? 'var(--text)' : 'var(--text-dim)';
    return `
      <div class="zone-cell" style="border-color:rgba(${colorVal},${Math.round(val*80)},10,0.6)">
        <span class="zone-pct" style="color:${textColor}">${pct}%</span>
        <span class="zone-loc">${locations[i] || ''}</span>
      </div>
    `;
  }).join('');

  const legendItems = isHitter
    ? [
        {cls:'hit',lbl:'Hit',color:'var(--green)'},
        {cls:'hr',lbl:'HR',color:'var(--gold)'},
        {cls:'out',lbl:'Out',color:'var(--red)'},
        {cls:'whiff',lbl:'Whiff',color:'rgba(255,255,255,0.3)'}
      ]
    : [
        {cls:'strike',lbl:'Strike',color:'var(--green)'},
        {cls:'ball',lbl:'Ball',color:'rgba(255,255,255,0.2)'},
      ];

  return `
    <div class="zone-section">
      <div class="zone-panel">
        <div class="zone-panel-title">Heat Map</div>
        <div style="padding-top:28px">
          <div class="heatmap-grid">${heatmapCells}</div>
          <div class="zone-labels">
            <span>Away</span><span>← Inside →</span><span>Away</span>
          </div>
        </div>
      </div>
      <div class="zone-panel">
        <div class="zone-panel-title">Pitch Location Plot</div>
        <div class="scatter-container">
          <div class="scatter-zone-box"></div>
          ${dots}
        </div>
        <div class="scatter-legend">
          ${legendItems.map(l => `
            <div class="sl-item">
              <div class="sl-dot" style="background:${l.color}"></div>
              <span>${l.lbl}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    <div class="zone-panel" style="margin-top:0">
      <div class="zone-panel-title">Zone Percentage Breakdown</div>
      <div class="zone-breakdown-grid">${breakdownCells}</div>
      <p style="font-size:11px;color:var(--text-dim);font-family:var(--font-mono);margin-top:12px">
        Percentage represents ${isHitter ? 'contact/swing rate' : 'strike rate'} per zone
      </p>
    </div>
  `;
}

function renderSplits(player, isHitter) {
  const pitchTypes = player.strikeZone.pitchTypes;

  const cards = Object.entries(pitchTypes).map(([name, data]) => {
    const isHitterData = 'avg' in data;
    const displayName = {
      fastball: 'Fastball', slider: 'Slider', curveball: 'Curveball',
      changeup: 'Changeup', splitter: 'Splitter', cutter: 'Cutter',
      '4seam': '4-Seam', sinker: 'Sinker'
    }[name] || name;

    if (isHitterData) {
      return `
        <div class="pitch-card">
          <div class="pitch-name">${displayName}</div>
          <div class="pitch-stats-grid">
            <div class="pitch-stat-item">
              <span class="pitch-stat-val">${data.avg.toFixed(3).replace('0.','.')}</span>
              <span class="pitch-stat-lbl">AVG vs</span>
            </div>
            <div class="pitch-stat-item">
              <span class="pitch-stat-val">${data.slg.toFixed(3).replace('0.','.')}</span>
              <span class="pitch-stat-lbl">SLG vs</span>
            </div>
          </div>
          <div class="whiff-bar">
            <div class="whiff-bar-label">
              <span>Whiff Rate</span>
              <span>${(data.whiff*100).toFixed(0)}%</span>
            </div>
            <div class="whiff-bar-track">
              <div class="whiff-bar-fill" style="width:0%" data-width="${(data.whiff*100).toFixed(0)}%"></div>
            </div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="pitch-card">
          <div class="pitch-name">
            ${displayName}
            <span class="pitch-velo">${data.velo.toFixed(1)} mph</span>
          </div>
          <div class="pitch-stats-grid">
            <div class="pitch-stat-item">
              <span class="pitch-stat-val">${(data.k_pct*100).toFixed(0)}%</span>
              <span class="pitch-stat-lbl">K Rate</span>
            </div>
            <div class="pitch-stat-item">
              <span class="pitch-stat-val">${data.spin.toLocaleString()}</span>
              <span class="pitch-stat-lbl">Spin RPM</span>
            </div>
          </div>
          <div class="whiff-bar">
            <div class="whiff-bar-label">
              <span>Whiff Rate</span>
              <span>${(data.whiff*100).toFixed(0)}%</span>
            </div>
            <div class="whiff-bar-track">
              <div class="whiff-bar-fill" style="width:0%" data-width="${(data.whiff*100).toFixed(0)}%"></div>
            </div>
          </div>
        </div>
      `;
    }
  }).join('');

  return `
    <h3 style="font-family:var(--font-display);font-size:28px;letter-spacing:0.04em;margin-bottom:24px">Pitch Type Splits</h3>
    <div class="pitch-splits-grid">${cards}</div>
  `;
}

// ─── GLOBAL SEARCH ────────────────────────────────
function initGlobalSearch() {
  const input = document.getElementById('global-search');
  const dropdown = document.getElementById('search-dropdown');
  if (!input || !dropdown) return;

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    if (!q || q.length < 2) { dropdown.classList.add('hidden'); return; }

    const results = DATA.players.filter(p =>
      p.name.toLowerCase().includes(q)
    ).slice(0, 8);

    if (!results.length) { dropdown.classList.add('hidden'); return; }

    dropdown.classList.remove('hidden');
    dropdown.innerHTML = results.map(p => {
      const team = DATA.teams.find(t => t.id === p.team);
      return `
        <div class="search-result-item" data-player="${p.id}">
          <span class="sri-badge">${p.position}</span>
          <div>
            <div class="sri-name">${p.name}</div>
            <div class="sri-team">${team ? team.name : ''}</div>
          </div>
        </div>
      `;
    }).join('');

    dropdown.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        window.location.href = getURL('player.html', { player: item.dataset.player });
      });
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.header-search')) dropdown.classList.add('hidden');
  });
}

// ─── HELPERS ──────────────────────────────────────
function initTableSort(table) {
  if (!table) return;
  const headers = table.querySelectorAll('th');
  let sortCol = -1, sortAsc = true;

  headers.forEach((th, i) => {
    th.addEventListener('click', () => {
      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      const asc = sortCol === i ? !sortAsc : true;

      rows.sort((a, b) => {
        const av = a.cells[i]?.textContent.trim().replace(/[^0-9.\-]/g,'') || '';
        const bv = b.cells[i]?.textContent.trim().replace(/[^0-9.\-]/g,'') || '';
        const an = parseFloat(av); const bn = parseFloat(bv);
        if (!isNaN(an) && !isNaN(bn)) return asc ? an - bn : bn - an;
        return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      });

      rows.forEach(r => tbody.appendChild(r));
      headers.forEach(h => h.classList.remove('sorted'));
      th.classList.add('sorted');
      sortCol = i; sortAsc = asc;
    });
  });
}

function initPlayerLinks(container) {
  container.querySelectorAll('[data-player]').forEach(el => {
    el.addEventListener('click', () => {
      window.location.href = getURL('player.html', { player: el.dataset.player });
    });
  });
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function showError(msg) {
  document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:var(--font-display);font-size:32px;color:var(--text-dim)">${msg}</div>`;
}

// ─── START ────────────────────────────────────────
init();
