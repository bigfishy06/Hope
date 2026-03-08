/* ================================================
   DATA DIAMOND — main.js v6
   Powered by summary.json + pitches.json
================================================ */

function getBase() { return 'https://bigfishy06.github.io/data-diamond/'; }

const TEAMS = [
  { id: 'bar', name: 'Barrie Baycats',             abbreviation: 'BAR', primaryColor: '#C8102E' },
  { id: 'bra', name: 'Brantford Red Sox',           abbreviation: 'BRA', primaryColor: '#BD3039' },
  { id: 'ckb', name: 'Chatham-Kent Barnstormers',   abbreviation: 'CKB', primaryColor: '#E87722' },
  { id: 'gue', name: 'Guelph Royals',               abbreviation: 'GUE', primaryColor: '#003DA5' },
  { id: 'ham', name: 'Hamilton Cardinals',           abbreviation: 'HAM', primaryColor: '#C8102E' },
  { id: 'kit', name: 'Kitchener Panthers',           abbreviation: 'KIT', primaryColor: '#000000' },
  { id: 'lon', name: 'London Majors',                abbreviation: 'LON', primaryColor: '#003DA5' },
  { id: 'tor', name: 'Toronto Maple Leafs',          abbreviation: 'TOR', primaryColor: '#134A8E' },
  { id: 'wel', name: 'Welland Jackfish',             abbreviation: 'WEL', primaryColor: '#00703C' }
];

function resolveTeam(rawName) {
  if (!rawName) return null;
  const s = rawName.trim().toLowerCase();
  return TEAMS.find(function(t) {
    return t.name.toLowerCase() === s ||
           t.abbreviation.toLowerCase() === s ||
           t.id === s ||
           t.name.toLowerCase().includes(s.split(' ')[0]);
  }) || null;
}

let DATA = { summary: [], pitches: [] };

// ── INIT ──────────────────────────────────────────
async function init() {
  await loadAll();
  buildTicker();
  initGlobalSearch();

  const path = window.location.pathname.split('/').pop() || 'index.html';
  if (path === 'index.html' || path === '')  initHomePage();
  if (path === 'league.html')                initLeaguePage();
  if (path === 'teams.html')                 initTeamsPage();
  if (path === 'players.html')               initPlayersPage();
}

async function loadAll() {
  try {
    const base = getBase();
    const [sumRes, pitRes] = await Promise.all([
      fetch(base + 'data/summary.json'),
      fetch(base + 'data/pitches.json')
    ]);
    if (sumRes.ok)  DATA.summary = await sumRes.json();
    if (pitRes.ok)  DATA.pitches = await pitRes.json();
    console.log('summary players:', DATA.summary.length);
    console.log('pitches players:', DATA.pitches.length);
  } catch(e) {
    console.error('loadAll failed:', e.message);
  }
}

// ── HELPERS ───────────────────────────────────────
function fmt3(v) {
  if (v == null || isNaN(v)) return '—';
  return parseFloat(v).toFixed(3).replace('0.', '.');
}
function fmt2(v) {
  if (v == null || isNaN(v)) return '—';
  return parseFloat(v).toFixed(2);
}
function fmt1(v) {
  if (v == null || isNaN(v)) return '—';
  return parseFloat(v).toFixed(1);
}
function fmtN(v) {
  if (v == null || isNaN(v)) return '—';
  return Math.round(v);
}
function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return 'rgba('+r+','+g+','+b+','+a+')';
}
function navigate(url) { window.location.href = getBase() + url; }

function getPitchPlayer(name) {
  return DATA.pitches.find(function(p) { return p.batter === name; }) || null;
}
function getSummaryPlayer(name) {
  return DATA.summary.find(function(p) { return p.batter === name; }) || null;
}
function getPitcherScatter(name) {
  var pts = [];
  DATA.pitches.forEach(function(bp) {
    if (!bp.scatter) return;
    bp.scatter.forEach(function(s) { if (s.pitcher === name) pts.push(s); });
  });
  return pts;
}
function getAllBatters() {
  const names = new Set();
  DATA.summary.forEach(function(p) { names.add(p.batter); });
  DATA.pitches.forEach(function(p) { names.add(p.batter); });
  return Array.from(names).sort();
}
function getAllPitchers() {
  const names = new Set();
  DATA.pitches.forEach(function(p) {
    if (p.scatter) p.scatter.forEach(function(s) { if (s.pitcher) names.add(s.pitcher); });
  });
  return Array.from(names).sort();
}

// ── TICKER ────────────────────────────────────────
function buildTicker() {
  const track = document.getElementById('stat-ticker');
  if (!track) return;
  const items = [];
  DATA.summary.slice(0, 20).forEach(function(p) {
    items.push({ name: p.batter, stat: fmt3(p.AVG),  lbl: 'AVG'  });
    items.push({ name: p.batter, stat: fmtN(p.HR),   lbl: 'HR'   });
    items.push({ name: p.batter, stat: fmt3(p.OPS),  lbl: 'OPS'  });
  });
  if (!items.length) { track.parentElement.style.display = 'none'; return; }
  const all = items.concat(items);
  track.innerHTML = all.map(function(i) {
    return '<div class="ticker-item">' +
      '<span class="ticker-name">' + i.name + '</span>' +
      '<span class="ticker-stat">' + i.stat + '</span>' +
      '<span class="ticker-label">' + i.lbl + '</span>' +
      '</div>';
  }).join('');
}

// ── GLOBAL SEARCH ─────────────────────────────────
function initGlobalSearch() {
  const input    = document.getElementById('global-search');
  const dropdown = document.getElementById('search-dropdown');
  if (!input || !dropdown) return;
  input.addEventListener('input', function() {
    const q = input.value.toLowerCase().trim();
    if (!q || q.length < 1) { dropdown.classList.add('hidden'); return; }
    const batters  = getAllBatters().filter(function(n) { return n.toLowerCase().includes(q); });
    const pitchers = getAllPitchers().filter(function(n) { return n.toLowerCase().includes(q); });
    const results  = [
      ...batters.map(function(n)  { return { name: n, type: 'batter'  }; }),
      ...pitchers.map(function(n) { return { name: n, type: 'pitcher' }; })
    ].slice(0, 8);
    if (!results.length) { dropdown.classList.add('hidden'); return; }
    dropdown.classList.remove('hidden');
    dropdown.innerHTML = results.map(function(r) {
      const sum  = getSummaryPlayer(r.name);
      const team = sum ? resolveTeam(sum.batter_team) : null;
      return '<div class="search-result-item" data-name="' + r.name + '" data-type="' + r.type + '">' +
        '<span class="sri-badge">' + (r.type === 'pitcher' ? 'P' : 'H') + '</span>' +
        '<div><div class="sri-name">' + r.name + '</div>' +
        '<div class="sri-team">' + (team ? team.name : r.type) + '</div></div></div>';
    }).join('');
    dropdown.querySelectorAll('.search-result-item').forEach(function(el) {
      el.addEventListener('click', function() {
        navigate('players.html?player=' + encodeURIComponent(el.dataset.name) + '&type=' + el.dataset.type);
      });
    });
  });
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.header-search')) dropdown.classList.add('hidden');
  });
}

// ══════════════════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════════════════
function initHomePage() {
  buildHomeTeamsGrid();
}

function buildHomeTeamsGrid() {
  const grid = document.getElementById('teams-grid');
  if (!grid) return;
  TEAMS.forEach(function(team, i) {
    const batterCount = DATA.summary.filter(function(p) {
      const t = resolveTeam(p.batter_team);
      return t && t.id === team.id;
    }).length;
    // Count pitchers: those who faced batters from OTHER teams
    const pitcherNames = new Set();
    DATA.pitches.forEach(function(bp) {
      if (!bp.scatter) return;
      const bSum = getSummaryPlayer(bp.batter);
      if (!bSum) return;
      const bt = resolveTeam(bSum.batter_team);
      if (!bt || bt.id === team.id) return; // batter is on this team, skip
      bp.scatter.forEach(function(s) { if (s.pitcher) pitcherNames.add(s.pitcher); });
    });
    const playerCount = batterCount + pitcherNames.size;
    const card = document.createElement('div');
    card.className = 'team-card fade-up';
    card.style.setProperty('--team-color', team.primaryColor);
    card.style.animationDelay = (i * 0.04) + 's';
    card.innerHTML =
      '<div class="team-abbr">' + team.abbreviation + '</div>' +
      '<div class="team-name">' + team.name + '</div>' +
      '<div class="team-footer">' +
      '<span class="team-player-count">' + playerCount + ' player' + (playerCount !== 1 ? 's' : '') + '</span>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:var(--text-dim)"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
      '</div>';
    card.addEventListener('click', function() { navigate('teams.html?team=' + team.id); });
    grid.appendChild(card);
  });

  // Filter buttons
  const filterBtns = document.querySelectorAll('#team-filters .zone-filter-btn');
  filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      filterBtns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });
}

// ══════════════════════════════════════════════════
// LEAGUE PAGE
// ══════════════════════════════════════════════════
function initLeaguePage() {
  const content = document.getElementById('tab-content');
  const tabs    = document.querySelectorAll('.tab-btn');

  function renderTab(tab) {
    tabs.forEach(function(t) { t.classList.toggle('active', t.dataset.tab === tab); });
    content.innerHTML = '';
    if (tab === 'hitting') renderHittingLeaderboards(content);
    else                   renderPitchingLeaderboards(content);
  }

  tabs.forEach(function(t) { t.addEventListener('click', function() { renderTab(t.dataset.tab); }); });
  renderTab('hitting');
}

function renderHittingLeaderboards(container) {
  const players = DATA.summary.filter(function(p) { return p.AB > 0; });
  if (!players.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚾</div><h3>No data yet</h3></div>';
    return;
  }

  const boards = [
    { title: 'AVG',  key: 'AVG',  fmt: fmt3, desc: true  },
    { title: 'OPS',  key: 'OPS',  fmt: fmt3, desc: true  },
    { title: 'OBP',  key: 'OBP',  fmt: fmt3, desc: true  },
    { title: 'SLG',  key: 'SLG',  fmt: fmt3, desc: true  },
    { title: 'HR',   key: 'HR',   fmt: fmtN, desc: true  },
    { title: 'H',    key: 'H',    fmt: fmtN, desc: true  },
    { title: 'BB',   key: 'BB',   fmt: fmtN, desc: true  },
    { title: 'K',    key: 'K',    fmt: fmtN, desc: false }
  ];

  const grid = document.createElement('div');
  grid.className = 'leaderboard-grid fade-up';

  boards.forEach(function(board) {
    const sorted = players.slice().sort(function(a, b) {
      const av = a[board.key] != null ? a[board.key] : (board.desc ? -Infinity : Infinity);
      const bv = b[board.key] != null ? b[board.key] : (board.desc ? -Infinity : Infinity);
      return board.desc ? bv - av : av - bv;
    }).slice(0, 5);

    const card = document.createElement('div');
    card.className = 'leader-card';
    card.innerHTML = '<div class="leader-card-header">' + board.title + '</div>' +
      sorted.map(function(p, i) {
        const team = resolveTeam(p.batter_team);
        const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        return '<div class="leader-row" data-name="' + p.batter + '" data-type="batter">' +
          '<span class="leader-rank ' + rankClass + '">' + (i+1) + '</span>' +
          '<span class="leader-name">' + p.batter + '</span>' +
          '<span class="leader-team">' + (team ? team.abbreviation : '') + '</span>' +
          '<span class="leader-val">' + board.fmt(p[board.key]) + '</span>' +
          '</div>';
      }).join('');
    card.querySelectorAll('.leader-row').forEach(function(row) {
      row.addEventListener('click', function() {
        navigate('players.html?player=' + encodeURIComponent(row.dataset.name) + '&type=batter');
      });
    });
    grid.appendChild(card);
  });

  container.appendChild(grid);

  // Full table
  const tableCard = document.createElement('div');
  tableCard.className = 'stat-card fade-up';
  tableCard.style.marginTop = '20px';
  tableCard.innerHTML = '<div class="stat-card-header"><span class="stat-card-title">All Hitters</span>' +
    '<span class="stat-card-subtitle">' + players.length + ' players</span></div>' +
    buildHittingTable(players);
  container.appendChild(tableCard);
  initTableSort(tableCard.querySelector('table'));
  initPlayerLinks(tableCard, 'batter');
}

function renderPitchingLeaderboards(container) {
  // Build pitcher stats from pitch data
  const pitcherMap = {};
  DATA.pitches.forEach(function(bp) {
    if (!bp.scatter) return;
    bp.scatter.forEach(function(s) {
      if (!s.pitcher) return;
      if (!pitcherMap[s.pitcher]) {
        pitcherMap[s.pitcher] = { name: s.pitcher, pitches: 0, k: 0, bb: 0, hits: 0, strikes: 0, balls: 0, team: '' };
      }
      const p = pitcherMap[s.pitcher];
      p.pitches++;
      if (s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking') p.k++;
      if (s.outcome === 'Walk' || s.outcome === 'Intentional Walk') p.bb++;
      if (['Single','Double','Triple','Home Run'].includes(s.outcome)) p.hits++;
      if (['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome)) p.strikes++;
      if (s.outcome === 'Ball') p.balls++;
    });
  });

  const pitchers = Object.values(pitcherMap).map(function(p) {
    p.k_pct    = p.pitches > 0 ? Math.round(p.k / p.pitches * 1000) / 10 : null;
    p.bb_pct   = p.pitches > 0 ? Math.round(p.bb / p.pitches * 1000) / 10 : null;
    p.str_pct  = p.pitches > 0 ? Math.round(p.strikes / p.pitches * 1000) / 10 : null;
    return p;
  });

  if (!pitchers.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚾</div><h3>No pitcher data</h3></div>';
    return;
  }

  const boards = [
    { title: 'K%',     key: 'k_pct',   fmt: function(v) { return fmt1(v) + '%'; }, desc: true  },
    { title: 'STR%',   key: 'str_pct', fmt: function(v) { return fmt1(v) + '%'; }, desc: true  },
    { title: 'BB%',    key: 'bb_pct',  fmt: function(v) { return fmt1(v) + '%'; }, desc: false },
    { title: 'PITCHES',key: 'pitches', fmt: fmtN, desc: true }
  ];

  const grid = document.createElement('div');
  grid.className = 'leaderboard-grid fade-up';

  boards.forEach(function(board) {
    const sorted = pitchers.slice().sort(function(a,b) {
      const av = a[board.key] != null ? a[board.key] : (board.desc ? -Infinity : Infinity);
      const bv = b[board.key] != null ? b[board.key] : (board.desc ? -Infinity : Infinity);
      return board.desc ? bv - av : av - bv;
    }).slice(0, 5);

    const card = document.createElement('div');
    card.className = 'leader-card';
    card.innerHTML = '<div class="leader-card-header">' + board.title + '</div>' +
      sorted.map(function(p, i) {
        const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        return '<div class="leader-row" data-name="' + p.name + '" data-type="pitcher">' +
          '<span class="leader-rank ' + rankClass + '">' + (i+1) + '</span>' +
          '<span class="leader-name">' + p.name + '</span>' +
          '<span class="leader-team"></span>' +
          '<span class="leader-val">' + board.fmt(p[board.key]) + '</span>' +
          '</div>';
      }).join('');
    card.querySelectorAll('.leader-row').forEach(function(row) {
      row.addEventListener('click', function() {
        navigate('players.html?player=' + encodeURIComponent(row.dataset.name) + '&type=pitcher');
      });
    });
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

// ══════════════════════════════════════════════════
// TEAMS PAGE
// ══════════════════════════════════════════════════
function initTeamsPage() {
  const params = new URLSearchParams(window.location.search);
  const teamId = params.get('team');
  const content = document.getElementById('page-content');

  if (teamId) {
    renderTeamDetail(teamId, content);
  } else {
    renderTeamGrid(content);
  }
}

function renderTeamGrid(content) {
  content.innerHTML = '<section class="page-hero"><div class="hero-bg"></div><div class="container">' +
    '<p class="hero-eyebrow">Canadian Baseball League</p>' +
    '<h1 class="hero-title">TEAM<br><span>STATS</span></h1></div></section>' +
    '<div class="container" style="padding-top:40px;padding-bottom:80px">' +
    '<div class="teams-grid" id="teams-grid"></div></div>';

  const grid = document.getElementById('teams-grid');
  TEAMS.forEach(function(team, i) {
    const teamPlayers = DATA.summary.filter(function(p) {
      const t = resolveTeam(p.batter_team);
      return t && t.id === team.id;
    });
    const card = document.createElement('div');
    card.className = 'team-card fade-up';
    card.style.setProperty('--team-color', team.primaryColor);
    card.style.animationDelay = (i * 0.04) + 's';
    card.innerHTML =
      '<div class="team-abbr">' + team.abbreviation + '</div>' +
      '<div class="team-name">' + team.name + '</div>' +
      '<div class="team-meta">' + team.id.toUpperCase() + '</div>' +
      '<div class="team-footer">' +
      '<span class="team-player-count">' + teamPlayers.length + ' player' + (teamPlayers.length !== 1 ? 's' : '') + '</span>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:var(--text-dim)"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
      '</div>';
    card.addEventListener('click', function() { navigate('teams.html?team=' + team.id); });
    grid.appendChild(card);
  });
}

function renderTeamDetail(teamId, content) {
  const team = TEAMS.find(function(t) { return t.id === teamId; });
  if (!team) { content.innerHTML = '<div class="container"><div class="empty-state"><h3>Team not found</h3></div></div>'; return; }

  const players = DATA.summary.filter(function(p) {
    const t = resolveTeam(p.batter_team);
    return t && t.id === teamId;
  });

  content.innerHTML =
    '<section class="player-hero" style="position:relative;padding:48px 0 40px;overflow:hidden">' +
    '<div class="player-hero-bg" style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 20% 50%,' + hexToRgba(team.primaryColor, 0.15) + ' 0%,transparent 70%)"></div>' +
    '<div class="container">' +
    '<div class="breadcrumb"><a href="teams.html">Teams</a><span>/</span><span>' + team.name + '</span></div>' +
    '<div style="font-family:var(--font-display);font-size:72px;letter-spacing:4px;color:' + team.primaryColor + ';line-height:1;filter:drop-shadow(0 0 16px ' + hexToRgba(team.primaryColor, 0.4) + ')">' + team.abbreviation + '</div>' +
    '<h1 style="font-family:var(--font-display);font-size:clamp(36px,6vw,72px);letter-spacing:4px;color:var(--text);margin-top:8px">' + team.name.toUpperCase() + '</h1>' +
    '<p style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);margin-top:8px;letter-spacing:1px">' + players.length + ' PLAYERS WITH DATA</p>' +
    '</div></section>' +
    '<div class="container" style="padding-top:32px;padding-bottom:80px">' +
    '<div class="tabs-bar"><div class="tabs">' +
    '<button class="tab-btn active" data-tab="hitters">Hitters</button>' +
    '<button class="tab-btn" data-tab="pitchers">Pitchers</button>' +
    '</div></div>' +
    '<div id="team-roster-content"></div></div>';

  const rosterContent = document.getElementById('team-roster-content');
  const tabs = content.querySelectorAll('.tab-btn');

  function renderRoster(type) {
    tabs.forEach(function(t) { t.classList.toggle('active', t.dataset.tab === type); });
    rosterContent.innerHTML = '';
    if (type === 'hitters') {
      if (!players.length) {
        rosterContent.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚾</div><h3>No hitter data</h3></div>';
        return;
      }
      const card = document.createElement('div');
      card.className = 'stat-card fade-up';
      card.innerHTML = '<div class="stat-card-header"><span class="stat-card-title">Hitting</span>' +
        '<span class="stat-card-subtitle">' + players.length + ' players</span></div>' +
        buildHittingTable(players);
      rosterContent.appendChild(card);
      initTableSort(card.querySelector('table'));
      initPlayerLinks(card, 'batter');
    } else {
      // Pitchers for this team — from pitch scatter data
      const pitcherSet = new Set();
      DATA.pitches.forEach(function(bp) {
        if (!bp.scatter) return;
        bp.scatter.forEach(function(s) {
          if (!s.pitcher) return;
          // Find pitches thrown against this team
          const bSum = getSummaryPlayer(bp.batter);
          if (bSum) {
            const bt = resolveTeam(bSum.batter_team);
            // pitcher belongs to the opposing team of the batter
            // so to find THIS team's pitchers, find pitchers who
            // faced batters from OTHER teams
            if (bt && bt.id !== teamId) pitcherSet.add(s.pitcher);
          }
        });
      });
      if (!pitcherSet.size) {
        rosterContent.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚾</div><h3>No pitcher data for this team</h3></div>';
        return;
      }
      const card = document.createElement('div');
      card.className = 'stat-card fade-up';
      card.innerHTML = '<div class="stat-card-header"><span class="stat-card-title">Pitchers</span>' +
        '<span class="stat-card-subtitle">' + pitcherSet.size + ' pitchers</span></div>' +
        buildPitcherListTable(Array.from(pitcherSet));
      rosterContent.appendChild(card);
      initPlayerLinks(card, 'pitcher');
    }
  }

  tabs.forEach(function(t) { t.addEventListener('click', function() { renderRoster(t.dataset.tab); }); });
  renderRoster('hitters');
}

// ══════════════════════════════════════════════════
// PLAYERS PAGE
// ══════════════════════════════════════════════════
function initPlayersPage() {
  const params     = new URLSearchParams(window.location.search);
  const playerName = params.get('player');
  const playerType = params.get('type') || 'batter';
  const content    = document.getElementById('page-content');

  if (playerName) {
    renderPlayerDetail(decodeURIComponent(playerName), playerType, content);
  } else {
    renderPlayerList(content);
  }
}

function renderPlayerList(content) {
  const batters  = getAllBatters();
  const pitchers = getAllPitchers();

  content.innerHTML =
    '<section class="page-hero"><div class="hero-bg"></div><div class="container">' +
    '<p class="hero-eyebrow">Canadian Baseball League</p>' +
    '<h1 class="hero-title">PLAYER<br><span>STATS</span></h1></div></section>' +
    '<div class="container" style="padding-top:40px;padding-bottom:80px">' +
    '<div class="tabs-bar"><div class="tabs">' +
    '<button class="tab-btn active" data-tab="batters">Batters</button>' +
    '<button class="tab-btn" data-tab="pitchers">Pitchers</button>' +
    '</div></div>' +
    '<div id="player-list-content"></div></div>';

  const listContent = document.getElementById('player-list-content');
  const tabs = content.querySelectorAll('.tab-btn');

  function renderList(type) {
    tabs.forEach(function(t) { t.classList.toggle('active', t.dataset.tab === type); });
    listContent.innerHTML = '';

    if (type === 'batters') {
      const players = DATA.summary.filter(function(p) { return p.AB > 0; });
      const card = document.createElement('div');
      card.className = 'stat-card fade-up';
      card.innerHTML = '<div class="stat-card-header"><span class="stat-card-title">All Batters</span>' +
        '<span class="stat-card-subtitle">' + players.length + ' players</span></div>' +
        '<div style="padding:16px 24px 0">' +
        '<input class="roster-search" id="player-search" placeholder="Search batters..." /></div>' +
        buildHittingTable(players);
      listContent.appendChild(card);
      initTableSort(card.querySelector('table'));
      initPlayerLinks(card, 'batter');
      document.getElementById('player-search').addEventListener('input', function(e) {
        const q = e.target.value.toLowerCase();
        card.querySelectorAll('tbody tr').forEach(function(row) {
          row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      });
    } else {
      const names = getAllPitchers();
      const card  = document.createElement('div');
      card.className = 'stat-card fade-up';
      card.innerHTML = '<div class="stat-card-header"><span class="stat-card-title">All Pitchers</span>' +
        '<span class="stat-card-subtitle">' + names.length + ' pitchers</span></div>' +
        '<div style="padding:16px 24px 0">' +
        '<input class="roster-search" id="pitcher-search" placeholder="Search pitchers..." /></div>' +
        buildPitcherListTable(names);
      listContent.appendChild(card);
      initPlayerLinks(card, 'pitcher');
      document.getElementById('pitcher-search').addEventListener('input', function(e) {
        const q = e.target.value.toLowerCase();
        card.querySelectorAll('tbody tr').forEach(function(row) {
          row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      });
    }
  }

  tabs.forEach(function(t) { t.addEventListener('click', function() { renderList(t.dataset.tab); }); });
  renderList('batters');
}

function renderPlayerDetail(name, type, content) {
  const sum   = getSummaryPlayer(name);
  const pitch = getPitchPlayer(name);

  // For pitchers, build scatter from all batters data
  let pitchData = pitch;
  if (type === 'pitcher') {
    const pts = [];
    DATA.pitches.forEach(function(bp) {
      if (!bp.scatter) return;
      bp.scatter.forEach(function(s) { if (s.pitcher === name) pts.push(s); });
    });
    pitchData = pts.length ? { batter: name, scatter: pts } : null;
  }

  // Resolve team: for batters use summary, for pitchers use pitcher_team from scatter
  let team = sum ? resolveTeam(sum.batter_team) : null;
  if (!team && type === 'pitcher' && pitchData && pitchData.scatter && pitchData.scatter.length) {
    const pt = pitchData.scatter[0].pitcher_team;
    if (pt) team = resolveTeam(pt);
  }

  document.title = name + ' — Data Diamond';

  content.innerHTML =
    '<section class="player-hero">' +
    '<div class="player-hero-bg" id="player-hero-bg"></div>' +
    '<div class="container">' +
    '<div class="breadcrumb">' +
    '<a href="players.html">Players</a><span>/</span>' +
    (team ? '<a href="teams.html?team=' + team.id + '">' + team.abbreviation + '</a><span>/</span>' : '') +
    '<span>' + name + '</span></div>' +
    '<div class="player-badges">' +
    '<span class="badge badge-pos">' + (type === 'pitcher' ? 'P' : 'H') + '</span>' +
    (team ? '<span class="badge badge-team">' + team.abbreviation + '</span>' : '') +
    '</div>' +
    '<h1 class="player-name-hero">' + name.toUpperCase() + '</h1>' +
    (team ? '<p class="player-meta"><span>' + team.name + '</span></p>' : '') +
    '<div class="headline-stats" id="headline-stats"></div>' +
    '</div></section>' +
    '<div class="tabs-bar" style="margin-top:0"><div class="container"><div class="tabs">' +
    '<button class="tab-btn active" data-tab="overview">Overview</button>' +
    '<button class="tab-btn" data-tab="season">Season Stats</button>' +
    '<button class="tab-btn" data-tab="zone">Strike Zone</button>' +
    '<button class="tab-btn" data-tab="splits">Pitch Splits</button>' +
    '</div></div></div>' +
    '<div class="container" style="padding-top:32px;padding-bottom:80px"><div id="player-tab-content"></div></div>';

  if (team) {
    document.getElementById('player-hero-bg').style.background =
      'radial-gradient(ellipse 80% 60% at 20% 50%, ' + hexToRgba(team.primaryColor, 0.18) + ' 0%, transparent 70%)';
  }

  // Headline stats
  const hl = document.getElementById('headline-stats');
  if (type === 'batter' && sum) {
    [['AVG', fmt3(sum.AVG)], ['OPS', fmt3(sum.OPS)], ['HR', fmtN(sum.HR)], ['K', fmtN(sum.K)]].forEach(function(s) {
      hl.innerHTML += '<div class="hs-stat"><span class="hs-val">' + s[1] + '</span><span class="hs-lbl">' + s[0] + '</span></div>';
    });
  } else if (type === 'pitcher' && pitchData && pitchData.scatter) {
    const sc  = pitchData.scatter;
    const tot = sc.length;
    const ks  = sc.filter(function(s) { return s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking'; }).length;
    const bbs = sc.filter(function(s) { return s.outcome === 'Walk' || s.outcome === 'Intentional Walk'; }).length;
    const strPct = tot > 0 ? Math.round(sc.filter(function(s) { return ['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome); }).length / tot * 100) : 0;
    [['PITCHES', tot], ['K', ks], ['BB', bbs], ['STR%', strPct + '%']].forEach(function(s) {
      hl.innerHTML += '<div class="hs-stat"><span class="hs-val">' + s[1] + '</span><span class="hs-lbl">' + s[0] + '</span></div>';
    });
  }

  // Tabs
  const tabContent = document.getElementById('player-tab-content');
  const tabs = content.querySelectorAll('.tab-btn');

  function activateTab(t) {
    tabs.forEach(function(tb) { tb.classList.toggle('active', tb.dataset.tab === t); });
    tabContent.innerHTML = '';
    var panel = document.createElement('div');
    panel.className = 'fade-up';
    if (t === 'overview') panel.innerHTML = renderOverview(name, type, sum, pitchData);
    if (t === 'season')   panel.innerHTML = renderSeasonStats(name, type, sum, pitchData);
    if (t === 'splits')   panel.innerHTML = renderSplits(name, type, pitchData);
    tabContent.appendChild(panel);
    if (t === 'zone')     renderZone(name, type, pitchData, panel);
    setTimeout(function() {
      panel.querySelectorAll('.sbr-fill').forEach(function(el) {
        if (el.dataset.width) el.style.width = el.dataset.width;
      });
    }, 60);
  }

  tabs.forEach(function(tb) { tb.addEventListener('click', function() { activateTab(tb.dataset.tab); }); });
  activateTab('overview');
}

// ── OVERVIEW TAB ──────────────────────────────────
function renderOverview(name, type, sum, pitch) {
  if (type === 'batter' && sum) {
    const bars = [
      { lbl: 'AVG',  val: fmt3(sum.AVG),  pct: (sum.AVG  || 0) / 0.35 },
      { lbl: 'OBP',  val: fmt3(sum.OBP),  pct: (sum.OBP  || 0) / 0.42 },
      { lbl: 'SLG',  val: fmt3(sum.SLG),  pct: (sum.SLG  || 0) / 0.65 },
      { lbl: 'OPS',  val: fmt3(sum.OPS),  pct: (sum.OPS  || 0) / 1.10 }
    ];
    const counting = [
      ['AB', sum.AB], ['H', sum.H], ['2B', sum['2B']], ['3B', sum['3B']],
      ['HR', sum.HR], ['BB', sum.BB], ['K', sum.K]
    ];
    return '<div class="overview-grid">' +
      '<div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Rate Stats</span>' +
      '<span class="stat-card-subtitle">' + fmtN(sum.AB) + ' AB</span></div>' +
      '<div style="padding:16px 24px">' +
      bars.map(function(b) {
        return '<div class="stat-bar-row"><div class="sbr-label">' + b.lbl + '</div>' +
          '<div class="sbr-bar"><div class="sbr-fill" style="width:0%" data-width="' + Math.min((b.pct||0)*100,100).toFixed(1) + '%"></div></div>' +
          '<div class="sbr-val">' + b.val + '</div></div>';
      }).join('') + '</div></div>' +
      '<div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Counting Stats</span></div>' +
      '<div style="padding:0"><table class="stat-table"><tbody>' +
      counting.map(function(c) {
        return '<tr><td style="color:var(--text-dim)">' + c[0] + '</td>' +
          '<td class="highlight-val" style="text-align:right">' + (c[1] != null ? c[1] : '—') + '</td></tr>';
      }).join('') + '</tbody></table></div></div></div>';
  }

  if (type === 'pitcher' && pitch && pitch.scatter) {
    const sc  = pitch.scatter;
    const tot = sc.length;
    const ks  = sc.filter(function(s) { return s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking'; }).length;
    const bbs = sc.filter(function(s) { return s.outcome === 'Walk' || s.outcome === 'Intentional Walk'; }).length;
    const str = sc.filter(function(s) { return ['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome); }).length;
    const inZone = sc.filter(function(s) { return s.x >= -1 && s.x <= 1 && s.y >= 0 && s.y <= 1; }).length;
    const bars = [
      { lbl: 'K%',   val: fmt1(ks/tot*100) + '%',   pct: ks/tot },
      { lbl: 'BB%',  val: fmt1(bbs/tot*100) + '%',  pct: 1 - bbs/tot },
      { lbl: 'STR%', val: fmt1(str/tot*100) + '%',  pct: str/tot },
      { lbl: 'ZN%',  val: fmt1(inZone/tot*100) + '%', pct: inZone/tot }
    ];
    const counting = [['Pitches', tot], ['K', ks], ['BB', bbs], ['Strikes', str], ['Zone Pitches', inZone]];
    return '<div class="overview-grid">' +
      '<div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Pitch Metrics</span>' +
      '<span class="stat-card-subtitle">' + tot + ' pitches</span></div>' +
      '<div style="padding:16px 24px">' +
      bars.map(function(b) {
        return '<div class="stat-bar-row"><div class="sbr-label">' + b.lbl + '</div>' +
          '<div class="sbr-bar"><div class="sbr-fill" style="width:0%" data-width="' + Math.min((b.pct||0)*100,100).toFixed(1) + '%"></div></div>' +
          '<div class="sbr-val">' + b.val + '</div></div>';
      }).join('') + '</div></div>' +
      '<div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Totals</span></div>' +
      '<div style="padding:0"><table class="stat-table"><tbody>' +
      counting.map(function(c) {
        return '<tr><td style="color:var(--text-dim)">' + c[0] + '</td>' +
          '<td class="highlight-val" style="text-align:right">' + c[1] + '</td></tr>';
      }).join('') + '</tbody></table></div></div></div>';
  }

  return '<div class="empty-state"><div class="empty-state-icon">📊</div><h3>No data available</h3></div>';
}

// ── SEASON STATS TAB ──────────────────────────────
function renderSeasonStats(name, type, sum, pitch) {
  if (type === 'batter' && sum) {
    return '<div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Full Season Hitting</span></div>' +
      '<div class="table-wrap"><table class="stat-table"><thead><tr>' +
      '<th>AVG</th><th>OBP</th><th>SLG</th><th>OPS</th><th>AB</th><th>H</th><th>1B</th><th>2B</th><th>3B</th><th>HR</th><th>BB</th><th>K</th>' +
      '</tr></thead><tbody><tr>' +
      '<td class="highlight-val">' + fmt3(sum.AVG) + '</td>' +
      '<td>' + fmt3(sum.OBP) + '</td>' +
      '<td>' + fmt3(sum.SLG) + '</td>' +
      '<td class="highlight-val">' + fmt3(sum.OPS) + '</td>' +
      '<td>' + fmtN(sum.AB) + '</td>' +
      '<td>' + fmtN(sum.H) + '</td>' +
      '<td>' + fmtN(sum['1B']) + '</td>' +
      '<td>' + fmtN(sum['2B']) + '</td>' +
      '<td>' + fmtN(sum['3B']) + '</td>' +
      '<td>' + fmtN(sum.HR) + '</td>' +
      '<td>' + fmtN(sum.BB) + '</td>' +
      '<td>' + fmtN(sum.K) + '</td>' +
      '</tr></tbody></table></div></div>';
  }

  if (type === 'pitcher' && pitch && pitch.scatter) {
    const sc  = pitch.scatter;
    const tot = sc.length;
    const ks  = sc.filter(function(s) { return s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking'; }).length;
    const bbs = sc.filter(function(s) { return s.outcome === 'Walk' || s.outcome === 'Intentional Walk'; }).length;
    const str = sc.filter(function(s) { return ['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome); }).length;
    const swStr = sc.filter(function(s) { return s.outcome === 'Swinging Strike'; }).length;
    const calStr = sc.filter(function(s) { return s.outcome === 'Called Strike'; }).length;
    const inZone = sc.filter(function(s) { return s.x >= -1 && s.x <= 1 && s.y >= 0 && s.y <= 1; }).length;
    return '<div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Full Season Pitching</span></div>' +
      '<div class="table-wrap"><table class="stat-table"><thead><tr>' +
      '<th>PITCHES</th><th>K</th><th>BB</th><th>K%</th><th>BB%</th><th>STR%</th><th>ZN%</th><th>SW-STR</th><th>CL-STR</th>' +
      '</tr></thead><tbody><tr>' +
      '<td class="highlight-val">' + tot + '</td>' +
      '<td>' + ks + '</td>' +
      '<td>' + bbs + '</td>' +
      '<td class="highlight-val">' + fmt1(ks/tot*100) + '%</td>' +
      '<td>' + fmt1(bbs/tot*100) + '%</td>' +
      '<td>' + fmt1(str/tot*100) + '%</td>' +
      '<td>' + fmt1(inZone/tot*100) + '%</td>' +
      '<td>' + swStr + '</td>' +
      '<td>' + calStr + '</td>' +
      '</tr></tbody></table></div></div>';
  }

  return '<div class="empty-state"><div class="empty-state-icon">📊</div><h3>No data available</h3></div>';
}

// ── STRIKE ZONE TAB ───────────────────────────────
function renderZone(name, type, pitch, container) {
  // Collect scatter points
  var points = [];
  if (type === 'batter' && pitch && pitch.scatter) {
    points = pitch.scatter.filter(function(s) { return s.x != null && s.y != null; });
  } else if (type === 'pitcher') {
    DATA.pitches.forEach(function(bp) {
      if (!bp.scatter) return;
      bp.scatter.forEach(function(s) {
        if (s.pitcher === name && s.x != null && s.y != null) points.push(s);
      });
    });
  }

  if (!points.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#127919;</div><h3>No pitch location data</h3></div>';
    return;
  }

  // Pitch type colors
  var PITCH_COLORS = {
    'Fastball':     '#f87171',
    'Breaking Ball':'#60a5fa',
    'Offspeed':     '#a78bfa',
    'Changeup':     '#34d399',
    'Curveball':    '#fb923c',
    'Slider':       '#facc15',
    'Cutter':       '#f472b6',
    'Sinker':       '#22d3ee'
  };
  var FALLBACK_COLORS = ['#f87171','#60a5fa','#a78bfa','#34d399','#fb923c','#facc15','#f472b6','#22d3ee'];
  var typeSet = [];
  points.forEach(function(s) {
    var t = s.pitch_type || s.type || 'Unknown';
    if (!typeSet.includes(t)) typeSet.push(t);
  });
  typeSet.sort();
  var typeColorMap = {};
  typeSet.forEach(function(t, i) {
    typeColorMap[t] = PITCH_COLORS[t] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
  });
  function dotColor(s) {
    var t = s.pitch_type || s.type || 'Unknown';
    return typeColorMap[t] || '#6b7a9a';
  }

  // Outcome filters
  var RESULT_FILTERS = [
    { lbl: 'All',        val: 'all'       },
    { lbl: 'Hits',       val: 'hit'       },
    { lbl: 'Outs',       val: 'out'       },
    { lbl: 'Strikeouts', val: 'strikeout' },
    { lbl: 'Walks',      val: 'walk'      },
    { lbl: 'Balls',      val: 'ball'      },
    { lbl: 'Strikes',    val: 'strike'    }
  ];
  function resultMatch(s, filter) {
    if (filter === 'all') return true;
    var o = s.outcome || '';
    if (filter === 'hit')       return ['Single','Double','Triple','Home Run'].includes(o);
    if (filter === 'strikeout') return o === 'Strikeout Swinging' || o === 'Strikeout Looking';
    if (filter === 'ball')      return o === 'Ball';
    if (filter === 'walk')      return o === 'Walk' || o === 'Intentional Walk' || o === 'Hit By Pitch';
    if (filter === 'strike')    return ['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(o);
    if (filter === 'out')       return ['Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Caught Stealing','Sacrifice Fly','Sacrifice Bunt'].includes(o);
    return true;
  }

  // Stats
  var totalPts = points.length;
  var inZone   = points.filter(function(s){ return s.x>=-1&&s.x<=1&&s.y>=0&&s.y<=1; }).length;
  var ks       = points.filter(function(s){ return s.outcome==='Strikeout Swinging'||s.outcome==='Strikeout Looking'; }).length;
  var hits     = points.filter(function(s){ return ['Single','Double','Triple','Home Run'].includes(s.outcome); }).length;
  var swStr    = points.filter(function(s){ return s.outcome==='Swinging Strike'; }).length;
  var chases   = points.filter(function(s){ return (s.x<-1||s.x>1||s.y<0||s.y>1)&&(s.outcome==='Swinging Strike'||s.outcome==='Foul'); }).length;

  var legendHTML = typeSet.map(function(t) {
    return '<div class="legend-item"><div class="legend-dot" style="background:' + typeColorMap[t] + '"></div>' + t + '</div>';
  }).join('');

  container.innerHTML =
    '<div class="stat-card">' +
    '<div class="stat-card-header"><span class="stat-card-title">Strike Zone</span>' +
    '<span class="stat-card-subtitle">' + totalPts + ' pitches plotted</span></div>' +
    '<div class="zone-container">' +

    // View mode toggles
    '<div style="margin-bottom:16px">' +
    '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">View</div>' +
    '<div class="zone-controls" id="zone-view-btns">' +
    '<button class="zone-filter-btn active" data-view="scatter">Scatter</button>' +
    '<button class="zone-filter-btn" data-view="grid">Zone Grid</button>' +
    '<button class="zone-filter-btn" data-view="heatmap">Heat Map</button>' +
    '</div></div>' +

    // Outcome filters
    '<div style="margin-bottom:16px">' +
    '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Filter by Outcome</div>' +
    '<div class="zone-controls" id="zone-result-filters">' +
    RESULT_FILTERS.map(function(r) {
      return '<button class="zone-filter-btn' + (r.val==='all'?' active':'') + '" data-result="' + r.val + '">' + r.lbl + '</button>';
    }).join('') + '</div></div>' +

    // Pitch type filter
    '<div style="margin-bottom:16px">' +
    '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Filter by Pitch Type</div>' +
    '<div class="zone-controls" id="zone-type-filters">' +
    '<button class="zone-filter-btn active" data-ptype="all">All</button>' +
    typeSet.map(function(t) {
      return '<button class="zone-filter-btn" data-ptype="' + t + '">' + t + '</button>';
    }).join('') + '</div></div>' +

    // Batter handedness filter
    '<div style="margin-bottom:20px">' +
    '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Filter by Batter Hand</div>' +
    '<div class="zone-controls" id="zone-hand-filters">' +
    '<button class="zone-filter-btn active" data-hand="all">All</button>' +
    '<button class="zone-filter-btn" data-hand="R">Right (R)</button>' +
    '<button class="zone-filter-btn" data-hand="L">Left (L)</button>' +
    '</div></div>' +

    // Canvas + sidebar
    '<div class="zone-wrap">' +
    '<div class="zone-canvas-wrap" style="position:relative">' +
    '<canvas id="zone-canvas" width="480" height="480" style="width:360px;height:360px"></canvas>' +
    '<div id="zone-tooltip" class="zone-tooltip hidden"></div>' +
    '</div>' +
    '<div style="flex:1;min-width:160px">' +
    '<div class="zone-legend" id="zone-legend" style="margin-bottom:20px">' +
    '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">Pitch Type</div>' +
    legendHTML + '</div>' +
    '<div class="zone-stats-grid">' +
    '<div class="zone-stat-box"><div class="zone-stat-val" id="zs-pitches">' + totalPts + '</div><div class="zone-stat-lbl">Pitches</div></div>' +
    '<div class="zone-stat-box"><div class="zone-stat-val" id="zs-zone">' + fmt1(inZone/totalPts*100) + '%</div><div class="zone-stat-lbl">Zone%</div></div>' +
    '<div class="zone-stat-box"><div class="zone-stat-val" id="zs-ks">' + ks + '</div><div class="zone-stat-lbl">Strikeouts</div></div>' +
    '<div class="zone-stat-box"><div class="zone-stat-val" id="zs-hits">' + hits + '</div><div class="zone-stat-lbl">Hits</div></div>' +
    '<div class="zone-stat-box"><div class="zone-stat-val" id="zs-swk">' + swStr + '</div><div class="zone-stat-lbl">Swinging K</div></div>' +
    '<div class="zone-stat-box"><div class="zone-stat-val" id="zs-chases">' + chases + '</div><div class="zone-stat-lbl">Chases</div></div>' +
    '</div></div></div></div></div>';

  // ── Canvas setup ──────────────────────────────
  var activeResult = 'all';
  var activeView   = 'scatter';
  var activeType   = 'all';  // pitch type filter
  var activeHand   = 'all';  // batter handedness filter

  // Coordinate ranges: scatter shows full field, grid/heatmap zooms to zone
  var SCATTER_BOUNDS = { xMin:-2.5, xMax:2.5,  yMin:-0.8, yMax:1.5  };
  var CLEAN_BOUNDS   = { xMin:-1.85, xMax:1.85, yMin:-0.65, yMax:1.65 };
  var X_MIN = SCATTER_BOUNDS.xMin, X_MAX = SCATTER_BOUNDS.xMax;
  var Y_MIN = SCATTER_BOUNDS.yMin, Y_MAX = SCATTER_BOUNDS.yMax;

  var canvas = document.getElementById('zone-canvas');
  var ctx    = canvas.getContext('2d');

  // Hi-DPI: canvas internal size vs CSS size
  var DPR = window.devicePixelRatio || 1;
  var CSS_W = 360, CSS_H = 360;
  canvas.width  = CSS_W * DPR;
  canvas.height = CSS_H * DPR;
  canvas.style.width  = CSS_W + 'px';
  canvas.style.height = CSS_H + 'px';
  ctx.scale(DPR, DPR);

  var W = CSS_W, H = CSS_H;
  var PAD_L = 32, PAD_R = 12, PAD_T = 12, PAD_B = 32;
  var PW = W - PAD_L - PAD_R;
  var PH = H - PAD_T - PAD_B;

  function setBounds(xMin, xMax, yMin, yMax) {
    X_MIN = xMin; X_MAX = xMax; Y_MIN = yMin; Y_MAX = yMax;
  }

  function toCanvasX(x) { return PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PW; }
  function toCanvasY(y) { return PAD_T + PH - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * PH; }
  function fromCanvasX(cx) { return X_MIN + ((cx - PAD_L) / PW) * (X_MAX - X_MIN); }
  function fromCanvasY(cy) { return Y_MIN + (PH - (cy - PAD_T)) / PH * (Y_MAX - Y_MIN); }

  // ── Shared background ─────────────────────────
  function drawBackground(opts) {
    opts = opts || {};
    ctx.fillStyle = '#0e1525';
    ctx.fillRect(0, 0, W, H);

    if (!opts.clean) {
      // Subtle grid lines (scatter only)
      ctx.strokeStyle = 'rgba(255,184,28,0.05)';
      ctx.lineWidth = 1;
      [-2,-1,0,1,2].forEach(function(xv) {
        var cx = toCanvasX(xv);
        ctx.beginPath(); ctx.moveTo(cx, PAD_T); ctx.lineTo(cx, PAD_T+PH); ctx.stroke();
      });
      [-0.5,0,0.5,1.0].forEach(function(yv) {
        var cy = toCanvasY(yv);
        ctx.beginPath(); ctx.moveTo(PAD_L, cy); ctx.lineTo(PAD_L+PW, cy); ctx.stroke();
      });

      // Home plate
      var plateCx = toCanvasX(0), plateY = toCanvasY(Y_MIN+0.05);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.moveTo(plateCx, plateY-4);
      ctx.lineTo(plateCx-8, plateY+4);
      ctx.lineTo(plateCx+8, plateY+4);
      ctx.closePath(); ctx.fill();
    }
  }

  // ── Strike zone box — always uses CLEAN_BOUNDS so size is identical on all views ──
  function drawStrikeZone() {
    // Compute pixel coords using CLEAN_BOUNDS regardless of current X_MIN/X_MAX
    var cb = CLEAN_BOUNDS;
    function czx(x) { return PAD_L + ((x - cb.xMin) / (cb.xMax - cb.xMin)) * PW; }
    function czy(y) { return PAD_T + PH - ((y - cb.yMin) / (cb.yMax - cb.yMin)) * PH; }
    var zx1=czx(-1), zx2=czx(1), zy1=czy(1), zy2=czy(0);
    ctx.fillStyle = 'rgba(255,184,28,0.03)';
    ctx.fillRect(zx1, zy1, zx2-zx1, zy2-zy1);
    ctx.strokeStyle = 'rgba(255,184,28,0.85)';
    ctx.lineWidth = 2;
    ctx.strokeRect(zx1, zy1, zx2-zx1, zy2-zy1);
    // Inner 3x3 dividers
    ctx.strokeStyle = 'rgba(255,184,28,0.25)';
    ctx.lineWidth = 0.8;
    for (var i=1; i<3; i++) {
      var xi=zx1+(i/3)*(zx2-zx1), yi=zy1+(i/3)*(zy2-zy1);
      ctx.beginPath(); ctx.moveTo(xi,zy1); ctx.lineTo(xi,zy2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(zx1,yi); ctx.lineTo(zx2,yi); ctx.stroke();
    }
  }

  // ── Scatter draw ───────────────────────────────
  function drawScatter(filtered) {
    filtered.forEach(function(s) {
      var cx=toCanvasX(s.x), cy=toCanvasY(s.y), color=dotColor(s);
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI*2);
      ctx.fillStyle = color+'bb';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });
  }

  // ── Zone Grid: Savant-style 13 zones ─────────────────────────────
  function drawGrid(filtered) {
    var total = filtered.length;

    // Strike zone boundaries
    var ZX1=-1, ZX2=1, ZY1=0, ZY2=1;
    var cW = (ZX2-ZX1)/3, cH = (ZY2-ZY1)/3; // inner cell size

    // ── 9 inner cells (data coords) ──
    var inner = [];
    for (var row=0; row<3; row++) {
      for (var col=0; col<3; col++) {
        inner.push({
          x1: ZX1+col*cW,     x2: ZX1+(col+1)*cW,
          y1: ZY2-(row+1)*cH, y2: ZY2-row*cH,  // top row first
          outer: false
        });
      }
    }

    // ── Count inner cells ──
    inner.forEach(function(z) {
      z.count = 0;
      filtered.forEach(function(s) {
        if (s.x >= z.x1 && s.x < z.x2 && s.y >= z.y1 && s.y < z.y2) z.count++;
      });
      z.pct = total > 0 ? z.count/total*100 : 0;
    });

    // ── 4 outer zones: every non-inner pitch assigned by quadrant ──
    // Split at x=ZX1/ZX2 and y midpoint of zone
    var yMid = (ZY1+ZY2)/2; // 0.5
    var outer = [
      { label:'TL', count:0 }, // left of zone, upper half
      { label:'TR', count:0 }, // right of zone, upper half
      { label:'BL', count:0 }, // left of zone, lower half
      { label:'BR', count:0 }  // right of zone, lower half
    ];
    filtered.forEach(function(s) {
      var inInner = inner.some(function(z) {
        return s.x >= z.x1 && s.x < z.x2 && s.y >= z.y1 && s.y < z.y2;
      });
      if (inInner) return;
      // Assign to quadrant based on which side of zone and vertical midpoint
      var isLeft = s.x < ZX1 || (s.x < ZX2 && s.x < (ZX1+ZX2)/2);
      var isTop  = s.y >= yMid;
      // Simpler: just use x<0 and y>=0.5 since zone is symmetric around those
      isLeft = s.x < 0;
      isTop  = s.y >= yMid;
      if      ( isLeft &&  isTop) outer[0].count++;
      else if (!isLeft &&  isTop) outer[1].count++;
      else if ( isLeft && !isTop) outer[2].count++;
      else                        outer[3].count++;
    });
    outer.forEach(function(z) { z.pct = total > 0 ? z.count/total*100 : 0; });

    var maxInner = 0, maxOuter = 0;
    inner.forEach(function(z) { if (z.count > maxInner) maxInner = z.count; });
    outer.forEach(function(z) { if (z.count > maxOuter) maxOuter = z.count; });

    // ── Canvas coords for the strike zone box ──
    var SX1 = toCanvasX(ZX1), SX2 = toCanvasX(ZX2);
    var SY1 = toCanvasY(ZY2), SY2 = toCanvasY(ZY1); // note: Y is flipped
    var SMidY = toCanvasY(yMid);
    // Left/right strip widths and canvas edges
    var CX1 = toCanvasX(X_MIN), CX2 = toCanvasX(X_MAX);
    var CY1 = toCanvasY(Y_MAX), CY2 = toCanvasY(Y_MIN);
    var GAP = 4; // px gap between outer rect and zone box

    // Outer render rects (pixel coords):
    // TL: left strip, top half   | TR: right strip, top half
    // BL: left strip, bottom half| BR: right strip, bottom half
    // Each outer zone fills the full canvas height on its side (top to bottom)
    // 4 equal corner squares, same size as one inner cell
    // Positioned at the 4 diagonal corners of the strike zone
    var cellPxW = SX2 - SX1;  // full zone width in pixels
    var cellPxH = SY2 - SY1;  // full zone height in pixels
    var sqW = (cellPxW / 3);  // one inner cell width
    var sqH = (cellPxH / 3);  // one inner cell height
    outer[0].px = { x:SX1-GAP-sqW, y:SY1-GAP-sqH, w:sqW, h:sqH }; // TL
    outer[1].px = { x:SX2+GAP,     y:SY1-GAP-sqH, w:sqW, h:sqH }; // TR
    outer[2].px = { x:SX1-GAP-sqW, y:SY2+GAP,     w:sqW, h:sqH }; // BL
    outer[3].px = { x:SX2+GAP,     y:SY2+GAP,     w:sqW, h:sqH }; // BR

    // Merge BL into TL and BR into TR so we only draw 2 outer rects
    outer[0].count += outer[2].count; outer[0].pct += outer[2].pct;
    outer[1].count += outer[3].count; outer[1].pct += outer[3].pct;
    outer[2].skip = true; outer[3].skip = true;
    outer[0].intensity = maxOuter > 0 ? outer[0].count/maxOuter : 0;
    outer[1].intensity = maxOuter > 0 ? outer[1].count/maxOuter : 0;

    // ── Draw outer zones ──
    outer.forEach(function(z) {
      if (z.skip) return;
      var p = z.px;
      if (p.w <= 0 || p.h <= 0) return;
      var intensity = z.intensity !== undefined ? z.intensity : (maxOuter > 0 ? z.count/maxOuter : 0);
      ctx.fillStyle = z.count === 0
        ? 'rgba(96,165,250,0.12)'
        : 'rgba(96,165,250,'+(0.1+0.55*intensity)+')';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = 'rgba(96,165,250,0.55)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      // Always show percentage (including 0%)
      ctx.save();
      ctx.beginPath(); ctx.rect(p.x+1, p.y+1, p.w-2, p.h-2); ctx.clip();
      ctx.fillStyle = intensity > 0.55 ? '#fff' : 'rgba(255,255,255,0.75)';
      ctx.font = 'bold 12px DM Mono, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(z.pct.toFixed(1)+'%', p.x+p.w/2, p.y+p.h/2);
      ctx.textBaseline = 'alphabetic';
      ctx.restore();
    });

    // ── Draw inner cells ──
    inner.forEach(function(z) {
      var cx1=toCanvasX(z.x1), cx2=toCanvasX(z.x2);
      var cy1=toCanvasY(z.y2), cy2=toCanvasY(z.y1);
      var cw=cx2-cx1, ch=cy2-cy1;
      var intensity = maxInner > 0 ? z.count/maxInner : 0;
      if (z.count === 0) {
        ctx.fillStyle = 'rgba(255,184,28,0.05)';
      } else {
        var r=Math.round(96+(255-96)*intensity);
        var g=Math.round(165+(184-165)*intensity);
        var b=Math.round(250+(28-250)*intensity);
        ctx.fillStyle = 'rgba('+r+','+g+','+b+','+(0.3+0.65*intensity)+')';
      }
      ctx.fillRect(cx1, cy1, cw, ch);
      ctx.strokeStyle = 'rgba(255,184,28,0.5)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx1, cy1, cw, ch);
      ctx.save();
      ctx.beginPath(); ctx.rect(cx1+1, cy1+1, cw-2, ch-2); ctx.clip();
      ctx.fillStyle = intensity > 0.55 ? '#fff' : 'rgba(255,255,255,0.75)';
      ctx.font = 'bold 13px DM Mono, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(z.pct.toFixed(1)+'%', cx1+cw/2, cy1+ch/2);
      ctx.textBaseline = 'alphabetic';
      ctx.restore();
    });
  }

  // ── Heat map draw ────────────────────────────────
  function drawHeatmap(filtered) {
    if (!filtered.length) return;

    // Low-res density grid (coordinates match data space)
    var GW = 64, GH = 64;
    var density = new Float32Array(GW * GH);
    var SIGMA = 5.0; // in grid cells — with 64 cells over ~3.4 units, 1 cell ≈ 0.053 units, sigma≈0.27 units

    filtered.forEach(function(s) {
      var gx = ((s.x - X_MIN) / (X_MAX - X_MIN)) * GW;
      var gy = GH - ((s.y - Y_MIN) / (Y_MAX - Y_MIN)) * GH;
      var radius = Math.ceil(SIGMA * 3);
      for (var dy = -radius; dy <= radius; dy++) {
        for (var dx = -radius; dx <= radius; dx++) {
          var px = Math.round(gx + dx);
          var py = Math.round(gy + dy);
          if (px < 0 || px >= GW || py < 0 || py >= GH) continue;
          density[py * GW + px] += Math.exp(-(dx*dx + dy*dy) / (2*SIGMA*SIGMA));
        }
      }
    });

    var maxD = 0;
    for (var i = 0; i < density.length; i++) if (density[i] > maxD) maxD = density[i];
    if (maxD === 0) return;

    // Build small imageData then drawImage it scaled to full CSS canvas size
    // This avoids DPR issues — we draw in CSS pixel space via drawImage
    var offscreen = document.createElement('canvas');
    offscreen.width  = GW;
    offscreen.height = GH;
    var octx = offscreen.getContext('2d');
    var imgData = octx.createImageData(GW, GH);

    for (var py = 0; py < GH; py++) {
      for (var px = 0; px < GW; px++) {
        var val = density[py * GW + px] / maxD;
        if (val < 0.01) continue;
        var r, g, b;
        if (val < 0.25) {
          var t=val/0.25; r=0; g=Math.round(t*120); b=Math.round(180+t*75);
        } else if (val < 0.5) {
          var t=(val-0.25)/0.25; r=0; g=Math.round(120+t*135); b=Math.round(255-t*255);
        } else if (val < 0.75) {
          var t=(val-0.5)/0.25; r=Math.round(t*255); g=255; b=0;
        } else {
          var t=(val-0.75)/0.25; r=255; g=Math.round(255-t*255); b=0;
        }
        var idx = (py * GW + px) * 4;
        imgData.data[idx]   = r;
        imgData.data[idx+1] = g;
        imgData.data[idx+2] = b;
        imgData.data[idx+3] = Math.round((0.2 + val*0.75)*255);
      }
    }
    octx.putImageData(imgData, 0, 0);

    // Scale the tiny blurred grid up to fill the full CSS canvas smoothly
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(offscreen, 0, 0, W, H);
    ctx.restore();

    // Color scale legend
    var scaleX=PAD_L+PW+4, scaleH=PH*0.6, scaleY=PAD_T+PH*0.2;
    var grad=ctx.createLinearGradient(0,scaleY,0,scaleY+scaleH);
    grad.addColorStop(0,'#ff0000'); grad.addColorStop(0.33,'#ffff00');
    grad.addColorStop(0.66,'#00ff78'); grad.addColorStop(1,'#0000b4');
    ctx.fillStyle=grad; ctx.fillRect(scaleX,scaleY,7,scaleH);
    ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=0.5;
    ctx.strokeRect(scaleX,scaleY,7,scaleH);
    ctx.fillStyle='rgba(255,255,255,0.45)'; ctx.font='8px DM Mono,monospace';
    ctx.textAlign='left';
    ctx.fillText('HI',scaleX+10,scaleY+8);
    ctx.fillText('LO',scaleX+10,scaleY+scaleH);
  }
  // ── Update reactive stat boxes ─────────────────
  function updateStats(f) {
    var n    = f.length;
    var iz   = f.filter(function(s){ return s.x>=-1&&s.x<=1&&s.y>=0&&s.y<=1; }).length;
    var fks  = f.filter(function(s){ return s.outcome==='Strikeout Swinging'||s.outcome==='Strikeout Looking'; }).length;
    var fh   = f.filter(function(s){ return ['Single','Double','Triple','Home Run'].includes(s.outcome); }).length;
    var fsw  = f.filter(function(s){ return s.outcome==='Swinging Strike'; }).length;
    var fch  = f.filter(function(s){ return (s.x<-1||s.x>1||s.y<0||s.y>1)&&(s.outcome==='Swinging Strike'||s.outcome==='Foul'); }).length;
    var el;
    if ((el=document.getElementById('zs-pitches'))) el.textContent = n;
    if ((el=document.getElementById('zs-zone')))    el.textContent = n>0 ? fmt1(iz/n*100)+'%' : '—';
    if ((el=document.getElementById('zs-ks')))      el.textContent = fks;
    if ((el=document.getElementById('zs-hits')))    el.textContent = fh;
    if ((el=document.getElementById('zs-swk')))     el.textContent = fsw;
    if ((el=document.getElementById('zs-chases')))  el.textContent = fch;
    var sub = document.querySelector('.stat-card-subtitle');
    if (sub) sub.textContent = n + ' pitches plotted';
  }

  // ── Main draw ──────────────────────────────────
  function drawZone() {
    ctx.clearRect(0, 0, W * DPR, H * DPR);
    var clean = (activeView === 'grid' || activeView === 'heatmap');

    // Scatter uses its own bounds; grid/heatmap use clean bounds
    if (activeView === 'scatter') {
      setBounds(SCATTER_BOUNDS.xMin, SCATTER_BOUNDS.xMax, SCATTER_BOUNDS.yMin, SCATTER_BOUNDS.yMax);
    } else {
      setBounds(CLEAN_BOUNDS.xMin, CLEAN_BOUNDS.xMax, CLEAN_BOUNDS.yMin, CLEAN_BOUNDS.yMax);
    }

    drawBackground(clean ? {clean:true} : {});

    var filtered = points.filter(function(s) {
      if (!resultMatch(s, activeResult)) return false;
      if (activeType !== 'all' && (s.pitch_type || s.type || 'Unknown') !== activeType) return false;
      if (activeHand !== 'all' && (s.batter_side || s.side || '') !== activeHand) return false;
      return true;
    });

    updateStats(filtered);

    if      (activeView === 'scatter') drawScatter(filtered);
    else if (activeView === 'grid')    drawGrid(filtered);
    else if (activeView === 'heatmap') drawHeatmap(filtered);

    // Strike zone drawn on ALL views
    drawStrikeZone();

    // Legend visibility
    var legend = document.getElementById('zone-legend');
    if (legend) legend.style.display = activeView === 'scatter' ? '' : 'none';
  }

  requestAnimationFrame(function() { drawZone(); });

  // ── Tooltip (scatter only) ─────────────────────
  var tooltip = document.getElementById('zone-tooltip');

  canvas.addEventListener('mousemove', function(e) {
    if (activeView !== 'scatter') { tooltip.classList.add('hidden'); return; }
    var rect = canvas.getBoundingClientRect();
    var mx = (e.clientX - rect.left) * (CSS_W / rect.width);
    var my = (e.clientY - rect.top)  * (CSS_H / rect.height);

    var best = null, bestDist = Infinity;
    var filtered = points.filter(function(s) {
      if (!resultMatch(s, activeResult)) return false;
      if (activeType !== 'all' && (s.pitch_type || s.type || 'Unknown') !== activeType) return false;
      if (activeHand !== 'all' && (s.batter_side || s.side || '') !== activeHand) return false;
      return true;
    });
    filtered.forEach(function(s) {
      var px=toCanvasX(s.x), py=toCanvasY(s.y);
      var dist = Math.sqrt((mx-px)*(mx-px)+(my-py)*(my-py));
      if (dist < bestDist && dist < 14) { bestDist = dist; best = s; }
    });

    if (best) {
      canvas.style.cursor = 'pointer';
      var ttx=toCanvasX(best.x), tty=toCanvasY(best.y);
      var offX = ttx > W*0.65 ? -180 : 12;
      var offY = tty > H*0.65 ? -110 : 8;
      tooltip.style.left = (ttx+offX)+'px';
      tooltip.style.top  = (tty+offY)+'px';
      var t = best.pitch_type || best.type || 'Unknown';
      var dotStyle = 'display:inline-block;width:10px;height:10px;border-radius:50%;background:'+typeColorMap[t]+';margin-right:6px;vertical-align:middle';
      tooltip.innerHTML =
        '<div class="zt-pitch"><span style="'+dotStyle+'"></span>'+t+'</div>'+
        '<div class="zt-row"><span>Outcome</span><span>'+(best.outcome||'—')+'</span></div>'+
        '<div class="zt-row"><span>Count</span><span>'+(best.count||'—')+'</span></div>'+
        '<div class="zt-row"><span>Pitcher</span><span>'+(best.pitcher||'—')+'</span></div>'+
        (best.contact ? '<div class="zt-row"><span>Contact</span><span>'+best.contact+'</span></div>' : '')+
        (best.spray   ? '<div class="zt-row"><span>Spray</span><span>'+best.spray+'</span></div>' : '')+
        '<div class="zt-coords">x: '+(best.x!=null?best.x.toFixed(3):'—')+'  y: '+(best.y!=null?best.y.toFixed(3):'—')+'</div>';
      tooltip.classList.remove('hidden');
    } else {
      canvas.style.cursor = 'default';
      tooltip.classList.add('hidden');
    }
  });

  canvas.addEventListener('mouseleave', function() {
    tooltip.classList.add('hidden');
    canvas.style.cursor = 'default';
  });

  // ── Filter buttons ─────────────────────────────
  container.querySelectorAll('#zone-view-btns .zone-filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      container.querySelectorAll('#zone-view-btns .zone-filter-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      activeView = btn.dataset.view;
      tooltip.classList.add('hidden');
      drawZone();
    });
  });

  container.querySelectorAll('#zone-result-filters .zone-filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      container.querySelectorAll('#zone-result-filters .zone-filter-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      activeResult = btn.dataset.result;
      drawZone();
    });
  });

  // Pitch type filter buttons
  container.querySelectorAll('#zone-type-filters .zone-filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      container.querySelectorAll('#zone-type-filters .zone-filter-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      activeType = btn.dataset.ptype;
      drawZone();
    });
  });

  // Batter handedness filter buttons
  container.querySelectorAll('#zone-hand-filters .zone-filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      container.querySelectorAll('#zone-hand-filters .zone-filter-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      activeHand = btn.dataset.hand;
      drawZone();
    });
  });
}


// ── PITCH SPLITS TAB ──────────────────────────────
function renderSplits(name, type, pitch) {
  let points = [];
  if (type === 'batter' && pitch && pitch.scatter) {
    points = pitch.scatter;
  } else if (type === 'pitcher') {
    DATA.pitches.forEach(function(bp) {
      if (!bp.scatter) return;
      bp.scatter.forEach(function(s) { if (s.pitcher === name) points.push(s); });
    });
  }

  if (!points.length) {
    return '<div class="empty-state"><div class="empty-state-icon">📊</div><h3>No split data</h3></div>';
  }

  // Pitch type breakdown
  const typeMap = {};
  points.forEach(function(s) {
    const t = s.pitch_type || 'Unknown';
    if (!typeMap[t]) typeMap[t] = { total: 0, k: 0, hit: 0, ball: 0, strike: 0 };
    typeMap[t].total++;
    if (s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking') typeMap[t].k++;
    if (['Single','Double','Triple','Home Run'].includes(s.outcome)) typeMap[t].hit++;
    if (s.outcome === 'Ball') typeMap[t].ball++;
    if (['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome)) typeMap[t].strike++;
  });

  const total = points.length;

  return '<div class="stat-card" style="margin-bottom:20px">' +
    '<div class="stat-card-header"><span class="stat-card-title">Pitch Mix</span></div>' +
    '<div class="pitch-mix-grid">' +
    Object.entries(typeMap).map(function(entry) {
      return '<div class="pitch-mix-item">' +
        '<div class="pitch-mix-pct">' + fmt1(entry[1].total / total * 100) + '%</div>' +
        '<div class="pitch-mix-type">' + entry[0] + '</div>' +
        '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px">' + entry[1].total + ' pitches</div>' +
        '</div>';
    }).join('') + '</div></div>' +
    '<div class="stat-card">' +
    '<div class="stat-card-header"><span class="stat-card-title">By Pitch Type</span></div>' +
    '<div class="table-wrap"><table class="stat-table"><thead><tr>' +
    '<th style="text-align:left">Type</th><th>#</th><th>%</th><th>K</th><th>HIT</th><th>STR%</th><th>BALL%</th>' +
    '</tr></thead><tbody>' +
    Object.entries(typeMap).map(function(entry) {
      const d = entry[1];
      return '<tr>' +
        '<td style="text-align:left;color:var(--text)">' + entry[0] + '</td>' +
        '<td>' + d.total + '</td>' +
        '<td class="highlight-val">' + fmt1(d.total/total*100) + '%</td>' +
        '<td>' + d.k + '</td>' +
        '<td>' + d.hit + '</td>' +
        '<td>' + fmt1(d.strike/d.total*100) + '%</td>' +
        '<td>' + fmt1(d.ball/d.total*100) + '%</td>' +
        '</tr>';
    }).join('') +
    '</tbody></table></div></div>';
}

// ── TABLE BUILDERS ────────────────────────────────
function buildHittingTable(players) {
  const rows = players.map(function(p) {
    const team = resolveTeam(p.batter_team);
    return '<tr>' +
      '<td><a class="player-name-cell" data-name="' + p.batter + '" data-type="batter">' + p.batter + '</a></td>' +
      '<td>' + (team ? team.abbreviation : '—') + '</td>' +
      '<td>' + fmtN(p.AB) + '</td>' +
      '<td class="highlight-val">' + fmt3(p.AVG) + '</td>' +
      '<td>' + fmt3(p.OBP) + '</td>' +
      '<td>' + fmt3(p.SLG) + '</td>' +
      '<td class="highlight-val">' + fmt3(p.OPS) + '</td>' +
      '<td>' + fmtN(p.H) + '</td>' +
      '<td>' + fmtN(p['2B']) + '</td>' +
      '<td>' + fmtN(p['3B']) + '</td>' +
      '<td>' + fmtN(p.HR) + '</td>' +
      '<td>' + fmtN(p.BB) + '</td>' +
      '<td>' + fmtN(p.K) + '</td>' +
      '</tr>';
  }).join('');
  return '<div class="table-wrap"><table class="stat-table"><thead><tr>' +
    '<th style="text-align:left">Player</th><th>Team</th><th>AB</th><th>AVG</th><th>OBP</th><th>SLG</th><th>OPS</th>' +
    '<th>H</th><th>2B</th><th>3B</th><th>HR</th><th>BB</th><th>K</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function buildPitcherListTable(names) {
  const rows = names.map(function(name) {
    const pts = [];
    DATA.pitches.forEach(function(bp) {
      if (!bp.scatter) return;
      bp.scatter.forEach(function(s) { if (s.pitcher === name) pts.push(s); });
    });
    const tot = pts.length;
    const ks  = pts.filter(function(s) { return s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking'; }).length;
    const bbs = pts.filter(function(s) { return s.outcome === 'Walk'; }).length;
    const str = pts.filter(function(s) { return ['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome); }).length;
    return '<tr>' +
      '<td><a class="player-name-cell" data-name="' + name + '" data-type="pitcher">' + name + '</a></td>' +
      '<td>' + tot + '</td>' +
      '<td class="highlight-val">' + ks + '</td>' +
      '<td>' + bbs + '</td>' +
      '<td class="highlight-val">' + (tot > 0 ? fmt1(ks/tot*100) + '%' : '—') + '</td>' +
      '<td>' + (tot > 0 ? fmt1(str/tot*100) + '%' : '—') + '</td>' +
      '</tr>';
  }).join('');
  return '<div class="table-wrap"><table class="stat-table"><thead><tr>' +
    '<th style="text-align:left">Pitcher</th><th>Pitches</th><th>K</th><th>BB</th><th>K%</th><th>STR%</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

// ── SORT + LINKS ──────────────────────────────────
function initTableSort(table) {
  if (!table) return;
  const headers = table.querySelectorAll('th');
  let sortCol = -1, sortAsc = true;
  headers.forEach(function(th, i) {
    th.addEventListener('click', function() {
      const tbody = table.querySelector('tbody');
      const rows  = Array.from(tbody.querySelectorAll('tr'));
      const asc   = sortCol === i ? !sortAsc : true;
      rows.sort(function(a, b) {
        const av = ((a.cells[i]||{}).textContent||'').replace(/[^0-9.\-]/g,'');
        const bv = ((b.cells[i]||{}).textContent||'').replace(/[^0-9.\-]/g,'');
        const an = parseFloat(av), bn = parseFloat(bv);
        if (!isNaN(an) && !isNaN(bn)) return asc ? an-bn : bn-an;
        return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
      rows.forEach(function(r) { tbody.appendChild(r); });
      headers.forEach(function(h) { h.classList.remove('sorted'); });
      th.classList.add('sorted'); sortCol = i; sortAsc = asc;
    });
  });
}

function initPlayerLinks(container, type) {
  container.querySelectorAll('[data-name]').forEach(function(el) {
    el.addEventListener('click', function() {
      navigate('players.html?player=' + encodeURIComponent(el.dataset.name) + '&type=' + (el.dataset.type || type));
    });
  });
}

init();
