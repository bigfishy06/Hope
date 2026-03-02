/* ================================================
   DATA DIAMOND — main.js
   Loads players from data/hitters.csv and data/pitchers.csv
   Teams from data/stats.json
================================================ */

const REPO_NAME = 'Hope';
<<<<<<< HEAD
const ROOT = '/Hope/';
=======
const STATS_PATH  = 'data/stats.json';
const HITTERS_PATH  = 'data/hitters.csv';
const PITCHERS_PATH = 'data/pitchers.csv';
>>>>>>> 7236de1a6962071512fa302918958276aed8d417

let DATA = null; // { teams, players, zoneConfig }

// ─── INIT ─────────────────────────────────────────
async function init() {
  DATA = await loadAll();
  if (!DATA) return;

  const page = getCurrentPage();
  if (page === 'index')  initIndex();
  if (page === 'team')   initTeamPage();
  if (page === 'player') initPlayerPage();

  initGlobalSearch();
}

function getCurrentPage() {
  const p = window.location.pathname.split('/').pop() || 'index.html';
  if (p === 'team.html')   return 'team';
  if (p === 'player.html') return 'player';
  return 'index';
}

function getBase() {
<<<<<<< HEAD
  return ROOT;
=======
  const p = window.location.pathname;
  // Find the repo root by looking for /Hope/
  const match = p.match(/^(\/Hope\/)/);
  const root = match ? match[1] : '/Hope/';
  if (p.endsWith('/team.html') || p.endsWith('/player.html')) {
    return root;
  }
  return root;
>>>>>>> 7236de1a6962071512fa302918958276aed8d417
}

// ─── LOAD ALL DATA ────────────────────────────────
async function loadAll() {
  try {
<<<<<<< HEAD
=======
    const base = '/Hope/';
>>>>>>> 7236de1a6962071512fa302918958276aed8d417
    const [statsRes, hittersRes, pitchersRes] = await Promise.all([
      fetch(ROOT + 'data/stats.json'),
      fetch(ROOT + 'data/hitters.csv'),
      fetch(ROOT + 'data/pitchers.csv')
    ]);

    if (!statsRes.ok)    throw new Error('stats.json failed: '    + statsRes.status);
    if (!hittersRes.ok)  throw new Error('hitters.csv failed: '   + hittersRes.status);
    if (!pitchersRes.ok) throw new Error('pitchers.csv failed: '  + pitchersRes.status);

    const stats       = await statsRes.json();
    const hittersCsv  = await hittersRes.text();
    const pitchersCsv = await pitchersRes.text();

    console.log('hitters.csv loaded, rows:', hittersCsv.trim().split('\n').length - 1);
    console.log('pitchers.csv loaded, rows:', pitchersCsv.trim().split('\n').length - 1);

    const hitters  = parseCSV(hittersCsv,  'hitting');
    const pitchers = parseCSV(pitchersCsv, 'pitching');
    const players  = [...hitters, ...pitchers];

    console.log('Total players parsed:', players.length);

    return {
      teams:      stats.teams,
      zoneConfig: stats.zoneConfig,
      players
    };
  } catch (e) {
    console.error('loadAll failed:', e);
    return null;
  }
}

// ─── CSV PARSER ───────────────────────────────────
// Hitter columns:  Player, Season, Team, P, AVG, G, AB, R, H, 2B, 3B, HR, RBI,
//                  BB, HBP, SO, SF, SH, SB, CS, DP, E, OPS, SLG, OBP, PA,
//                  AB/HR, BB/PA, BB/K, SECA, ISOP, RC
// Pitcher columns: id, name, team, position, number, bats, throws,
//                  era, whip, k9, bb9, hr9, fip, xfip, w, l, sv, ip,
//                  h, er, bb, k, gs, cg, sho, war, k_pct, bb_pct

const HITTER_META  = ['Player','Season','Team','P'];
const PITCHER_META = ['id','name','team','position','number','bats','throws'];

function parseCSV(text, statType) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const players = [];

  for (let i = 1; i < lines.length; i++) {
    const row = smartSplit(lines[i]);
    if (!row[0] || !row[0].trim()) continue;

    const obj = {};
    headers.forEach((h, idx) => {
      const raw = (row[idx] || '').trim();
      obj[h] = raw;
    });

    if (statType === 'hitting') {
      // Map spreadsheet columns → internal player shape
      const name   = obj['Player'] || '';
      const teamRaw = (obj['Team'] || '').toLowerCase().trim();
      const teamId  = resolveTeamId(teamRaw);
      const season  = obj['Season'] || '';

      if (!name) continue;

      // Auto id from name + team
      const id = `h_${name.replace(/\s+/g,'_').toLowerCase()}_${teamId}`;

      const hitting = {};
      const numCols = ['AVG','G','AB','R','H','2B','3B','HR','RBI','BB','HBP',
                       'SO','SF','SH','SB','CS','DP','E','OPS','SLG','OBP','PA',
                       'AB/HR','BB/PA','BB/K','SECA','ISOP','RC'];
      numCols.forEach(c => {
        const v = parseFloat(obj[c]);
        hitting[c] = isNaN(v) ? null : v;
      });

      players.push({
        id,
        name,
        team:     teamId,
        position: obj['P'] || '',
        season,
        number:   null,
        bats:     '',
        throws:   '',
        hitting,
        strikeZone: { heatmap: [], pitchTypes: {}, scatterPoints: [] }
      });

    } else {
      // Pitcher — real spreadsheet schema
      // Player, Team, G, GS, CG, IP, H, R, ER, BB, SO, W, L, SV, 2B, 3B,
      // ERA, SHO, HR, BAA, WP, HBP, WHIP, STRIKE-BALL RATIO, STRIKE %, PFR,
      // BIPA, K/9, BB/9, ERC, FPS%

      const name    = obj['Player'] || '';
      const teamRaw = (obj['Team'] || '').toLowerCase().trim();
      const teamId  = resolveTeamId(teamRaw);
      const season  = obj['Season'] || '';

      if (!name) continue;

      const id = `p_${name.replace(/\s+/g,'_').toLowerCase()}_${teamId}`;

      const numCols = ['G','GS','CG','IP','H','R','ER','BB','SO','W','L','SV',
                       '2B','3B','ERA','SHO','HR','BAA','WP','HBP','WHIP',
                       'STRIKE-BALL RATIO','STRIKE %','PFR','BIPA',
                       'K/9','BB/9','ERC','FPS%'];

      const pitching = {};
      numCols.forEach(c => {
        const v = parseFloat(obj[c]);
        pitching[c] = isNaN(v) ? null : v;
      });

      players.push({
        id,
        name,
        team:     teamId,
        position: 'P',
        season:   obj['Season'] || '',
        number:   null,
        bats:     '',
        throws:   '',
        pitching,
        strikeZone: { heatmap: [], pitchTypes: {}, scatterPoints: [] }
      });
    }
  }

  return players;
}

// Match team name or abbreviation from spreadsheet to our team id
function resolveTeamId(raw) {
  if (!raw) return '';
  const s = raw.toLowerCase().trim();
  // Direct id match
  if (DATA && DATA.teams) {
    const direct = DATA.teams.find(t => t.id === s);
    if (direct) return direct.id;
    // Abbreviation match
    const abbr = DATA.teams.find(t => t.abbreviation.toLowerCase() === s);
    if (abbr) return abbr.id;
    // Name contains match
    const partial = DATA.teams.find(t =>
      t.name.toLowerCase().includes(s) || s.includes(t.name.toLowerCase())
    );
    if (partial) return partial.id;
  }
  return s; // fallback — keep as-is
}

// Handle quoted CSV values with commas inside
function smartSplit(line) {
  const result = [];
  let cur = '', inQuotes = false;
  for (let c of line) {
    if (c === '"') { inQuotes = !inQuotes; continue; }
    if (c === ',' && !inQuotes) { result.push(cur); cur = ''; continue; }
    cur += c;
  }
  result.push(cur);
  return result;
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
    card.dataset.league   = team.league;
    card.dataset.division = team.division;
    card.dataset.teamId   = team.id;

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
      window.location.href = getBase() + `team.html?team=${team.id}`;
    });

    grid.appendChild(card);
  });
}

function buildFeaturedPlayers() {
  const strip = document.getElementById('featured-players');
  if (!strip) return;

  if (DATA.players.length === 0) {
    strip.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">⚾</div>
        <h3>No players yet</h3>
        <p>Add rows to <code>data/hitters.csv</code> or <code>data/pitchers.csv</code> to see players here.</p>
      </div>`;
    return;
  }

  DATA.players.slice(0, 6).forEach((player, i) => {
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
        { val: fmtAvg(player.hitting['AVG']), lbl: 'AVG' },
        { val: player.hitting['HR']  ?? '—',  lbl: 'HR'  },
        { val: fmtAvg(player.hitting['OPS']), lbl: 'OPS' }
      ]
    : [
        { val: fmtDec(player.pitching.era,  2), lbl: 'ERA'  },
        { val: fmtDec(player.pitching.k9,   1), lbl: 'K/9'  },
        { val: fmtDec(player.pitching.whip, 2), lbl: 'WHIP' }
      ];

  card.innerHTML = `
    <div class="pc-num">${player.number || ''}</div>
    <div class="pc-top">
      <div class="pc-badge">${team ? team.abbreviation : '—'}</div>
      <div class="pc-pos">${player.position || ''}</div>
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
    window.location.href = getBase() + `player.html?player=${player.id}`;
  });

  return card;
}

function buildTicker() {
  const track = document.getElementById('stat-ticker');
  if (!track || DATA.players.length === 0) {
    if (track) track.parentElement.style.display = 'none';
    return;
  }

  const items = [];
  DATA.players.forEach(p => {
    if (p.hitting)  {
      items.push({ name: p.name, stat: fmtAvg(p.hitting['OPS']),     label: 'OPS' });
      items.push({ name: p.name, stat: p.hitting['HR'] ?? '—',        label: 'HR'  });
    }
    if (p.pitching) {
      items.push({ name: p.name, stat: fmtDec(p.pitching.era, 2),  label: 'ERA' });
      items.push({ name: p.name, stat: fmtDec(p.pitching.k9,  1),  label: 'K/9' });
    }
  });

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
  const tabs  = document.querySelectorAll('.filter-tab');
  const cards = document.querySelectorAll('.team-card');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.dataset.filter;
      cards.forEach(card => {
        if (filter === 'all') { card.classList.remove('hidden'); return; }
        const match = card.dataset.league === filter || card.dataset.division === filter;
        card.classList.toggle('hidden', !match);
      });
    });
  });
}

// ─── TEAM PAGE ────────────────────────────────────
function initTeamPage() {
  const params = new URLSearchParams(window.location.search);
  const teamId = params.get('team');
  const team   = DATA.teams.find(t => t.id === teamId);
  if (!team) { showError('Team not found.'); return; }

  document.title = `${team.name} — Data Diamond`;
  document.getElementById('team-full-name').textContent  = team.name;
  document.getElementById('team-abbr-display').textContent = team.abbreviation;
  document.getElementById('team-abbr-display').style.color = team.primaryColor;
  document.getElementById('team-division-label').textContent = `${team.division} · ${team.league}`;
  document.getElementById('bc-team-name').textContent    = team.name;

  document.getElementById('team-hero-bg').style.background =
    `radial-gradient(ellipse 80% 60% at 20% 50%, ${hexToRgba(team.primaryColor, 0.15)} 0%, transparent 70%), var(--bg)`;

  const players = DATA.players.filter(p => p.team === teamId);
  const tabs    = document.querySelectorAll('.report-tab');
  const content = document.getElementById('roster-content');

  function renderRoster(type) {
    content.innerHTML = '';

    const filtered = players.filter(p => type === 'hitters' ? !!p.hitting : !!p.pitching);

    // Search bar
    const bar = document.createElement('div');
    bar.className = 'roster-filters';
    bar.innerHTML = `<input class="roster-search" id="roster-search-input" placeholder="Search ${type}…" />`;
    content.appendChild(bar);

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state fade-up';
      empty.innerHTML = `
        <div class="empty-state-icon">⚾</div>
        <h3>No ${type} data yet</h3>
        <p>Add rows with <code>team=${teamId}</code> to <code>data/${type === 'hitters' ? 'hitters' : 'pitchers'}.csv</code>.</p>
      `;
      content.appendChild(empty);
      return;
    }

    const card = document.createElement('div');
    card.className = 'stat-card fade-up';
    card.innerHTML = `
      <div class="stat-card-header">
        <span class="stat-card-title">${type === 'hitters' ? 'Hitting' : 'Pitching'} Stats</span>
        <span class="stat-card-subtitle">${filtered.length} players · Click header to sort</span>
      </div>
      ${type === 'hitters' ? buildHittingTable(filtered) : buildPitchingTable(filtered)}
    `;
    content.appendChild(card);
    initTableSort(card.querySelector('table'));
    initPlayerLinks(card);

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
        <td>${h['G']  ?? '—'}</td>
        <td>${h['PA'] ?? '—'}</td>
        <td>${h['AB'] ?? '—'}</td>
        <td class="highlight-val">${fmtAvg(h['AVG'])}</td>
        <td>${fmtAvg(h['OBP'])}</td>
        <td>${fmtAvg(h['SLG'])}</td>
        <td class="highlight-val">${fmtAvg(h['OPS'])}</td>
        <td>${h['HR']  ?? '—'}</td>
        <td>${h['RBI'] ?? '—'}</td>
        <td>${h['R']   ?? '—'}</td>
        <td>${h['H']   ?? '—'}</td>
        <td>${h['2B']  ?? '—'}</td>
        <td>${h['3B']  ?? '—'}</td>
        <td>${h['SB']  ?? '—'}</td>
        <td>${h['BB']  ?? '—'}</td>
        <td>${h['SO']  ?? '—'}</td>
        <td>${h['HBP'] ?? '—'}</td>
        <td>${fmtAvg(h['ISOP'])}</td>
        <td>${fmtDec(h['RC'], 1)}</td>
      </tr>`;
  }).join('');

  return `
    <table class="stat-table">
      <thead><tr>
        <th>Player</th><th>G</th><th>PA</th><th>AB</th>
        <th>AVG</th><th>OBP</th><th>SLG</th><th>OPS</th>
        <th>HR</th><th>RBI</th><th>R</th><th>H</th>
        <th>2B</th><th>3B</th><th>SB</th>
        <th>BB</th><th>SO</th><th>HBP</th>
        <th>ISO</th><th>RC</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildPitchingTable(players) {
  const rows = players.map(p => {
    const pt = p.pitching;
    return `
      <tr>
        <td><span class="pos-badge">P</span><a class="player-name-cell" data-player="${p.id}">${p.name}</a></td>
        <td>${pt['G']  ?? '—'}</td>
        <td>${pt['GS'] ?? '—'}</td>
        <td>${pt['IP'] ?? '—'}</td>
        <td>${pt['W']  ?? '—'}-${pt['L'] ?? '—'}</td>
        <td>${pt['SV'] ?? '—'}</td>
        <td class="${pt['ERA'] <= 3.0 ? 'good' : pt['ERA'] >= 5.0 ? 'bad' : 'highlight-val'}">${fmtDec(pt['ERA'], 2)}</td>
        <td>${fmtDec(pt['WHIP'], 2)}</td>
        <td class="highlight-val">${fmtDec(pt['K/9'], 1)}</td>
        <td>${fmtDec(pt['BB/9'], 1)}</td>
        <td>${pt['SO'] ?? '—'}</td>
        <td>${pt['BB'] ?? '—'}</td>
        <td>${pt['H']  ?? '—'}</td>
        <td>${pt['HR'] ?? '—'}</td>
        <td>${fmtAvg(pt['BAA'])}</td>
        <td>${fmtDec(pt['STRIKE %'], 1)}${pt['STRIKE %'] != null ? '%' : ''}</td>
        <td>${fmtDec(pt['STRIKE-BALL RATIO'], 2)}</td>
        <td>${fmtDec(pt['FPS%'], 1)}${pt['FPS%'] != null ? '%' : ''}</td>
        <td>${pt['CG'] ?? '—'}</td>
        <td>${pt['SHO'] ?? '—'}</td>
      </tr>`;
  }).join('');

  return `
    <table class="stat-table">
      <thead><tr>
        <th>Player</th><th>G</th><th>GS</th><th>IP</th><th>W-L</th><th>SV</th>
        <th>ERA</th><th>WHIP</th><th>K/9</th><th>BB/9</th>
        <th>SO</th><th>BB</th><th>H</th><th>HR</th>
        <th>BAA</th><th>STR%</th><th>STR/BL</th><th>FPS%</th>
        <th>CG</th><th>SHO</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ─── PLAYER PAGE ──────────────────────────────────
function initPlayerPage() {
  const params   = new URLSearchParams(window.location.search);
  const playerId = params.get('player');
  const player   = DATA.players.find(p => p.id === playerId);
  if (!player) { showError('Player not found.'); return; }

  const team     = DATA.teams.find(t => t.id === player.team);
  const isHitter = !!player.hitting;

  document.title = `${player.name} — Data Diamond`;

  const bcTeam = document.getElementById('bc-team');
  bcTeam.textContent = team ? team.abbreviation : '';
  bcTeam.href = getBase() + `team.html?team=${player.team}`;
  document.getElementById('bc-player').textContent = player.name;

  if (team) {
    document.getElementById('player-hero-bg').style.background =
      `radial-gradient(ellipse 80% 60% at 20% 50%, ${hexToRgba(team.primaryColor, 0.18)} 0%, transparent 70%), var(--bg)`;
  }

  document.getElementById('player-number-display').textContent = player.number ? '#' + player.number : '';
  document.getElementById('player-name').textContent = player.name;
  document.getElementById('player-badges').innerHTML = `
    <span class="badge badge-pos">${player.position || '—'}</span>
    <span class="badge badge-team">${team ? team.abbreviation : '—'}</span>
    <span class="badge badge-team">${isHitter ? 'Hitter' : 'Pitcher'}</span>
  `;
  document.getElementById('player-meta').innerHTML = `
    <span>${team ? team.name : ''}</span>
    <span>·</span>
    <span>${player.number ? '#' + player.number : ''}</span>
    <span>·</span>
    <span>Bats: ${player.bats || '—'} · Throws: ${player.throws || '—'}</span>
  `;

  const headlineEl = document.getElementById('player-headline-stats');
  const headlines = isHitter
    ? [
        { val: fmtAvg(player.hitting['AVG']),     lbl: 'AVG'  },
        { val: fmtAvg(player.hitting['OPS']),     lbl: 'OPS'  },
        { val: player.hitting['HR']  ?? '—',      lbl: 'HR'   },
        { val: player.hitting['RBI'] ?? '—',      lbl: 'RBI'  }
      ]
    : [
        { val: fmtDec(player.pitching['ERA'],  2), lbl: 'ERA'  },
        { val: fmtDec(player.pitching['K/9'],  1), lbl: 'K/9'  },
        { val: fmtDec(player.pitching['WHIP'], 2), lbl: 'WHIP' },
        { val: `${player.pitching['W']??'—'}-${player.pitching['L']??'—'}`, lbl: 'W-L' }
      ];

  headlineEl.innerHTML = headlines.map(h => `
    <div class="phs-stat">
      <span class="phs-val">${h.val}</span>
      <span class="phs-lbl">${h.lbl}</span>
    </div>
  `).join('');

  // Tabs
  const tabs    = document.querySelectorAll('.report-tab');
  const content = document.getElementById('report-content');

  const tabRenderers = {
    overview: () => renderOverview(player, isHitter),
    season:   () => renderSeasonReport(player, isHitter),
    zone:     () => renderZoneEmpty(),
    splits:   () => renderSplitsEmpty()
  };

  function activateTab(name) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    content.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = 'tab-panel active fade-up';
    panel.innerHTML = tabRenderers[name]();
    content.appendChild(panel);
    setTimeout(() => {
      content.querySelectorAll('.sbr-fill, .whiff-bar-fill').forEach(el => {
        if (el.dataset.width) el.style.width = el.dataset.width;
      });
    }, 50);
  }

  tabs.forEach(tab => tab.addEventListener('click', () => activateTab(tab.dataset.tab)));
  activateTab('overview');
}

// ─── OVERVIEW ─────────────────────────────────────
function renderOverview(player, isHitter) {
  if (isHitter) {
    const h = player.hitting;
    const bars = [
      { label: 'AVG',  val: fmtAvg(h['AVG']),  pct: (h['AVG']  || 0) / 0.35  },
      { label: 'OBP',  val: fmtAvg(h['OBP']),  pct: (h['OBP']  || 0) / 0.42  },
      { label: 'SLG',  val: fmtAvg(h['SLG']),  pct: (h['SLG']  || 0) / 0.65  },
      { label: 'OPS',  val: fmtAvg(h['OPS']),  pct: (h['OPS']  || 0) / 1.10  },
      { label: 'ISO',  val: fmtAvg(h['ISOP']), pct: (h['ISOP'] || 0) / 0.30  },
      { label: 'SECA', val: fmtDec(h['SECA'],3),pct: (h['SECA'] || 0) / 0.50  },
    ];
    const counting = [
      ['Home Runs', h['HR']], ['RBI', h['RBI']], ['Runs', h['R']], ['Hits', h['H']],
      ['Doubles', h['2B']], ['Triples', h['3B']], ['Stolen Bases', h['SB']],
      ['Walks', h['BB']], ['Strikeouts', h['SO']], ['HBP', h['HBP']],
      ['RC', fmtDec(h['RC'],1)], ['BB/K', fmtDec(h['BB/K'],2)]
    ];
    return `
      <div class="overview-grid">
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">Rate Stats</span>
            <span class="stat-card-subtitle">${h['PA'] ?? '—'} PA · ${h['G'] ?? '—'} G</span>
          </div>
          <div style="padding:16px 24px">
            ${bars.map(b => `
              <div class="stat-bar-row">
                <div class="sbr-label">${b.label}</div>
                <div class="sbr-bar"><div class="sbr-fill" style="width:0%" data-width="${Math.min((b.pct||0)*100,100).toFixed(1)}%"></div></div>
                <div class="sbr-val">${b.val}</div>
              </div>`).join('')}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">Counting Stats</span>
            <span class="stat-card-subtitle">${h['AB'] ?? '—'} AB</span>
          </div>
          <div style="padding:0">
            <table class="stat-table">
              <tbody>
                ${counting.map(([lbl, val]) => `
                  <tr>
                    <td style="color:var(--text-dim)">${lbl}</td>
                    <td class="highlight-val" style="text-align:right">${val ?? '—'}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  } else {
    const pt = player.pitching;
    const bars = [
      { label: 'ERA',    val: fmtDec(pt['ERA'],  2), pct: Math.max(0, 1 - (pt['ERA']  || 0) / 7)   },
      { label: 'WHIP',   val: fmtDec(pt['WHIP'], 2), pct: Math.max(0, 1 - (pt['WHIP'] || 0) / 2)   },
      { label: 'K/9',    val: fmtDec(pt['K/9'],  1), pct: (pt['K/9']  || 0) / 14                    },
      { label: 'BB/9',   val: fmtDec(pt['BB/9'], 1), pct: Math.max(0, 1 - (pt['BB/9'] || 0) / 6)   },
      { label: 'STR%',   val: fmtDec(pt['STRIKE %'], 1) + (pt['STRIKE %'] != null ? '%' : ''), pct: (pt['STRIKE %'] || 0) / 70 },
      { label: 'BAA',    val: fmtAvg(pt['BAA']),     pct: Math.max(0, 1 - (pt['BAA']  || 0) / 0.35) },
    ];
    const counting = [
      ['Record',       `${pt['W'] ?? '—'}-${pt['L'] ?? '—'}`],
      ['Saves',        pt['SV']],
      ['Innings',      pt['IP']],
      ['Strikeouts',   pt['SO']],
      ['Walks',        pt['BB']],
      ['Hits Allowed', pt['H']],
      ['Home Runs',    pt['HR']],
      ['Earned Runs',  pt['ER']],
      ['HBP',          pt['HBP']],
      ['Wild Pitches', pt['WP']],
      ['CG',           pt['CG']],
      ['Shutouts',     pt['SHO']],
    ];
    return `
      <div class="overview-grid">
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">Pitching Metrics</span>
            <span class="stat-card-subtitle">${pt['GS'] ?? '—'} starts · ${pt['IP'] ?? '—'} IP</span>
          </div>
          <div style="padding:16px 24px">
            ${bars.map(b => `
              <div class="stat-bar-row">
                <div class="sbr-label">${b.label}</div>
                <div class="sbr-bar"><div class="sbr-fill" style="width:0%" data-width="${Math.min((b.pct||0)*100,100).toFixed(1)}%"></div></div>
                <div class="sbr-val">${b.val}</div>
              </div>`).join('')}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">Season Totals</span>
            <span class="stat-card-subtitle">${pt['G'] ?? '—'} appearances</span>
          </div>
          <div style="padding:0">
            <table class="stat-table">
              <tbody>
                ${counting.map(([lbl, val]) => `
                  <tr>
                    <td style="color:var(--text-dim)">${lbl}</td>
                    <td class="highlight-val" style="text-align:right">${val ?? '—'}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  }
}

// ─── SEASON REPORT ────────────────────────────────
function renderSeasonReport(player, isHitter) {
  if (isHitter) {
    const h = player.hitting;
    return `
      <div class="stat-card fade-up">
        <div class="stat-card-header">
          <span class="stat-card-title">Full Season Hitting Report</span>
          <span class="stat-card-subtitle">${player.season ? player.season + ' Season · ' : ''}${h['PA'] ?? '—'} PA · ${h['G'] ?? '—'} games</span>
        </div>
        <div style="overflow-x:auto">
        <table class="stat-table">
          <thead><tr>
            <th>AVG</th><th>OBP</th><th>SLG</th><th>OPS</th><th>ISO</th><th>SECA</th><th>RC</th>
            <th>G</th><th>PA</th><th>AB</th><th>H</th><th>2B</th><th>3B</th><th>HR</th><th>RBI</th>
            <th>R</th><th>BB</th><th>SO</th><th>HBP</th><th>SB</th><th>CS</th>
            <th>SF</th><th>SH</th><th>DP</th><th>E</th>
            <th>AB/HR</th><th>BB/PA</th><th>BB/K</th>
          </tr></thead>
          <tbody><tr>
            <td class="highlight-val">${fmtAvg(h['AVG'])}</td>
            <td>${fmtAvg(h['OBP'])}</td>
            <td>${fmtAvg(h['SLG'])}</td>
            <td class="highlight-val">${fmtAvg(h['OPS'])}</td>
            <td>${fmtAvg(h['ISOP'])}</td>
            <td>${fmtDec(h['SECA'],3)}</td>
            <td>${fmtDec(h['RC'],1)}</td>
            <td>${h['G']??'—'}</td><td>${h['PA']??'—'}</td><td>${h['AB']??'—'}</td>
            <td>${h['H']??'—'}</td><td>${h['2B']??'—'}</td><td>${h['3B']??'—'}</td>
            <td>${h['HR']??'—'}</td><td>${h['RBI']??'—'}</td><td>${h['R']??'—'}</td>
            <td>${h['BB']??'—'}</td><td>${h['SO']??'—'}</td><td>${h['HBP']??'—'}</td>
            <td>${h['SB']??'—'}</td><td>${h['CS']??'—'}</td>
            <td>${h['SF']??'—'}</td><td>${h['SH']??'—'}</td>
            <td>${h['DP']??'—'}</td><td>${h['E']??'—'}</td>
            <td>${fmtDec(h['AB/HR'],1)}</td>
            <td>${fmtDec(h['BB/PA'],3)}</td>
            <td>${fmtDec(h['BB/K'],2)}</td>
          </tr></tbody>
        </table>
        </div>
      </div>`;
  } else {
    const pt = player.pitching;
    return `
      <div class="stat-card fade-up">
        <div class="stat-card-header">
          <span class="stat-card-title">Full Season Pitching Report</span>
          <span class="stat-card-subtitle">${player.season ? player.season + ' Season · ' : ''}${pt['GS'] ?? '—'} starts · ${pt['IP'] ?? '—'} IP</span>
        </div>
        <div style="overflow-x:auto">
        <table class="stat-table">
          <thead><tr>
            <th>ERA</th><th>WHIP</th><th>K/9</th><th>BB/9</th><th>BAA</th>
            <th>STR%</th><th>STR/BL</th><th>FPS%</th><th>BIPA</th><th>ERC</th><th>PFR</th>
            <th>W</th><th>L</th><th>SV</th><th>G</th><th>GS</th><th>CG</th><th>SHO</th>
            <th>IP</th><th>H</th><th>R</th><th>ER</th><th>HR</th>
            <th>BB</th><th>SO</th><th>HBP</th><th>WP</th><th>2B</th><th>3B</th>
          </tr></thead>
          <tbody><tr>
            <td class="${pt['ERA']<=3.0?'good':pt['ERA']>=5.0?'bad':'highlight-val'}">${fmtDec(pt['ERA'],2)}</td>
            <td>${fmtDec(pt['WHIP'],2)}</td>
            <td class="highlight-val">${fmtDec(pt['K/9'],1)}</td>
            <td>${fmtDec(pt['BB/9'],1)}</td>
            <td>${fmtAvg(pt['BAA'])}</td>
            <td>${fmtDec(pt['STRIKE %'],1)}${pt['STRIKE %']!=null?'%':''}</td>
            <td>${fmtDec(pt['STRIKE-BALL RATIO'],2)}</td>
            <td>${fmtDec(pt['FPS%'],1)}${pt['FPS%']!=null?'%':''}</td>
            <td>${fmtDec(pt['BIPA'],3)}</td>
            <td>${fmtDec(pt['ERC'],2)}</td>
            <td>${fmtDec(pt['PFR'],2)}</td>
            <td>${pt['W']??'—'}</td><td>${pt['L']??'—'}</td><td>${pt['SV']??'—'}</td>
            <td>${pt['G']??'—'}</td><td>${pt['GS']??'—'}</td>
            <td>${pt['CG']??'—'}</td><td>${pt['SHO']??'—'}</td>
            <td>${pt['IP']??'—'}</td><td>${pt['H']??'—'}</td>
            <td>${pt['R']??'—'}</td><td>${pt['ER']??'—'}</td><td>${pt['HR']??'—'}</td>
            <td>${pt['BB']??'—'}</td><td>${pt['SO']??'—'}</td>
            <td>${pt['HBP']??'—'}</td><td>${pt['WP']??'—'}</td>
            <td>${pt['2B']??'—'}</td><td>${pt['3B']??'—'}</td>
          </tr></tbody>
        </table>
        </div>
      </div>`;
  }
}

// ─── ZONE — empty state (no CSV pitch data yet) ───
function renderZoneEmpty() {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">🎯</div>
      <h3>Strike Zone coming soon</h3>
      <p>To add pitch location data, include a <code>data/pitches.csv</code> with columns:<br>
      <code>player_id, x, y, result, type, velo</code><br><br>
      x: −1 = left edge, 0 = center, +1 = right edge<br>
      y: 0 = bottom of zone, 1 = top of zone</p>
    </div>`;
}

function renderSplitsEmpty() {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">📊</div>
      <h3>Pitch splits coming soon</h3>
      <p>Pitch type data will appear here once pitch-by-pitch CSV data is added.</p>
    </div>`;
}

// ─── GLOBAL SEARCH ────────────────────────────────
function initGlobalSearch() {
  const input    = document.getElementById('global-search');
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
          <span class="sri-badge">${p.position || '—'}</span>
          <div>
            <div class="sri-name">${p.name}</div>
            <div class="sri-team">${team ? team.name : ''}</div>
          </div>
        </div>`;
    }).join('');

    dropdown.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        window.location.href = getBase() + `player.html?player=${item.dataset.player}`;
      });
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.header-search')) dropdown.classList.add('hidden');
  });
}

// ─── HELPERS ──────────────────────────────────────
function fmtAvg(val) {
  if (val === undefined || val === null || val === '' || isNaN(val)) return '—';
  return parseFloat(val).toFixed(3).replace('0.', '.');
}

function fmtDec(val, decimals) {
  if (val === undefined || val === null || val === '' || isNaN(val)) return '—';
  return parseFloat(val).toFixed(decimals);
}

function initTableSort(table) {
  if (!table) return;
  const headers = table.querySelectorAll('th');
  let sortCol = -1, sortAsc = true;

  headers.forEach((th, i) => {
    th.addEventListener('click', () => {
      const tbody = table.querySelector('tbody');
      const rows  = Array.from(tbody.querySelectorAll('tr'));
      const asc   = sortCol === i ? !sortAsc : true;

      rows.sort((a, b) => {
        const av = a.cells[i]?.textContent.trim().replace(/[^0-9.\-]/g,'');
        const bv = b.cells[i]?.textContent.trim().replace(/[^0-9.\-]/g,'');
        const an = parseFloat(av), bn = parseFloat(bv);
        if (!isNaN(an) && !isNaN(bn)) return asc ? an - bn : bn - an;
        return asc ? (av||'').localeCompare(bv||'') : (bv||'').localeCompare(av||'');
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
      window.location.href = getBase() + `player.html?player=${el.dataset.player}`;
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
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:var(--font-display);font-size:32px;color:var(--text-dim)">
      ${msg}
    </div>`;
}

// ─── START ────────────────────────────────────────
init();
