// けいさんフラッシュ - app.js

const $ = id => document.getElementById(id);

// ---- 設定 ----
const OPS = [
  { id: 'add', name: 'たし算', sym: '＋' },
  { id: 'sub', name: 'ひき算', sym: '−' }
];
const LEVELS = [1, 2];
const LEVEL_DESC = {
  add: { 1: '1けた ＋ 1けた', 2: 'くり上がり（10〜19 ＋ 1けた）' },
  sub: { 1: '1けた − 1けた', 2: 'くり下がり（10〜19 − 1けた）' }
};
const COUNTS = [10, 20, 30];

// ---- 状態 ----
let G = {
  op: null,
  level: null,
  count: 10,
  deck: [],
  idx: 0,
  wrongs: [],
  round: 1,
  firstOK: 0,
  total: 0,
  firstWrongs: []
};

// ---- 画面切替 ----
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(`screen-${name}`).classList.add('active');
}

// ---- トップ画面 ----
function buildTop() {
  const opRow = $('opRow');
  opRow.innerHTML = '';
  OPS.forEach(o => {
    const b = document.createElement('button');
    b.className = 'op-btn' + (G.op === o.id ? ' on' : '');
    b.textContent = `${o.name} ${o.sym}`;
    b.addEventListener('click', () => { G.op = o.id; buildTop(); refreshStart(); });
    opRow.appendChild(b);
  });

  const list = $('levelList');
  list.innerHTML = '';
  LEVELS.forEach(lv => {
    const desc = G.op ? LEVEL_DESC[G.op][lv] : (lv === 1 ? '1けた どうし' : 'くり上がり・くり下がり（10〜19）');
    const btn = document.createElement('button');
    btn.className = 'level-btn' + (G.level === lv ? ' on' : '');
    btn.innerHTML = `<span class="level-name">レベル${lv}</span><span class="level-desc">${desc}</span>`;
    btn.addEventListener('click', () => { G.level = lv; buildTop(); refreshStart(); });
    list.appendChild(btn);
  });

  const seg = $('countSeg');
  seg.innerHTML = '';
  COUNTS.forEach(c => {
    const b = document.createElement('button');
    b.className = 'count-opt' + (G.count === c ? ' on' : '');
    b.textContent = c;
    b.addEventListener('click', () => { G.count = c; buildTop(); });
    seg.appendChild(b);
  });
}
function refreshStart() { $('btnStart').disabled = !(G.op && G.level); }

// ---- 問題生成（偏り無し・繰り上がり/繰り下がり条件・直前重複回避） ----
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function makeProblem(op, level) {
  let a, b, ans, sym;
  if (op === 'add') {
    sym = '＋';
    if (level === 1) { a = rnd(1, 9); b = rnd(1, 9); }
    else { do { a = rnd(10, 19); b = rnd(1, 9); } while ((a % 10) + b < 10); } // くり上がり必須
    ans = a + b;
  } else {
    sym = '−';
    if (level === 1) { a = rnd(1, 9); b = rnd(1, 9); if (b > a) { const t = a; a = b; b = t; } } // a≥b
    else { do { a = rnd(10, 19); b = rnd(1, 9); } while ((a % 10) >= b); } // くり下がり必須
    ans = a - b;
  }
  return { a, b, sym, ans, text: `${a} ${sym} ${b}` };
}

function genDeck(op, level, n) {
  const deck = [];
  let prev = '';
  for (let i = 0; i < n; i++) {
    let p, guard = 0;
    do { p = makeProblem(op, level); guard++; } while (p.text === prev && guard < 20); // 直前と同じは避ける
    prev = p.text;
    deck.push(p);
  }
  return deck;
}

// ---- フロー ----
function startGame() {
  G.total = G.count;
  G.firstOK = 0;
  G.firstWrongs = [];
  G.round = 1;
  startRound(genDeck(G.op, G.level, G.count), false);
}

function startRound(deck, isRedo) {
  G.deck = deck;
  G.idx = 0;
  G.wrongs = [];
  $('screen-flash').classList.toggle('redo', !!isRedo);
  showScreen('flash');
  showCard();
}

function showCard() {
  if (G.idx >= G.deck.length) { endRound(); return; }
  const p = G.deck[G.idx];
  $('progress').textContent = `もんだい ${G.idx + 1} / ${G.deck.length}`;
  $('problem').innerHTML = `${p.a} <span class="plus">${p.sym}</span> ${p.b}`;
}

function mark(ok) {
  if (G.idx >= G.deck.length) return;
  const p = G.deck[G.idx];
  if (G.round === 1 && ok) G.firstOK++;
  if (G.round === 1 && !ok) G.firstWrongs.push(p);
  if (!ok) G.wrongs.push(p);
  G.idx++;
  setTimeout(showCard, 120);
}

function endRound() {
  if (G.wrongs.length > 0) {
    G.round++;
    $('redoCount').textContent = `${G.wrongs.length}もん`;
    renderWrongList($('wrongList'), G.wrongs);
    showScreen('redo');
  } else {
    finish();
  }
}

function beginRedo() { startRound(G.wrongs.slice(), true); }

function renderWrongList(el, list) {
  el.innerHTML = list.map(p =>
    `<div class="wrong-item">${p.a} <span class="plus">${p.sym}</span> ${p.b}</div>`
  ).join('');
}

function finish() {
  $('doneStats').innerHTML = `
    <div>もんだい <b>${G.total}</b> もん</div>
    <div>1かいめで ◯ <b>${G.firstOK}</b> もん</div>
    <div>なおした かず <b>${G.total - G.firstOK}</b> もん</div>
  `;
  const ten = $('tendency');
  if (G.firstWrongs.length > 0) {
    ten.innerHTML = `<div class="tendency-label">1かいめで まちがえた もんだい</div><div class="wrong-list" id="tendencyList"></div>`;
    renderWrongList($('tendencyList'), G.firstWrongs);
  } else {
    ten.innerHTML = '';
  }
  showScreen('done');
}

// ---- 起動 ----
document.addEventListener('DOMContentLoaded', () => {
  buildTop();
  refreshStart();

  $('btnHome').addEventListener('click', () => location.href = '../../');
  $('btnStart').addEventListener('click', () => { if (G.op && G.level) startGame(); });
  $('btnOk').addEventListener('click', () => mark(true));
  $('btnWrong').addEventListener('click', () => mark(false));
  $('btnBeginRedo').addEventListener('click', beginRedo);
  $('btnRestart').addEventListener('click', startGame);
  $('btnChangeLevel').addEventListener('click', () => showScreen('top'));

  // PCキー：位置に合わせて 左/Enter=⭕（せいかい）、右/Backspace=❌（まちがい）
  document.addEventListener('keydown', e => {
    if (!$('screen-flash').classList.contains('active')) return;
    if (e.key === 'ArrowLeft' || e.key === 'Enter') { e.preventDefault(); mark(true); }
    else if (e.key === 'ArrowRight' || e.key === 'Backspace') { e.preventDefault(); mark(false); }
  });
});
