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
const TIME_MS = 3000;   // 3秒で自動×

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
  firstWrongs: [],
  answered: false,
  currentAns: null
};
let timerId = null;

// ---- 音（WebAudio） ----
const Sound = {
  ctx: null,
  init() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } this.resume(); },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  tone(freqs, dur, type, vol, glideTo) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    freqs.forEach((f, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.connect(g); g.connect(this.ctx.destination);
      const st = t + i * dur;
      o.frequency.setValueAtTime(f, st);
      if (glideTo && i === freqs.length - 1) o.frequency.exponentialRampToValueAtTime(glideTo, st + dur);
      g.gain.setValueAtTime(vol, st);
      g.gain.exponentialRampToValueAtTime(0.001, st + dur);
      o.start(st); o.stop(st + dur);
    });
  },
  correct() { this.tone([988, 1319], 0.12, 'triangle', 0.25); },     // てぃるん（上昇2音）
  wrong() { this.tone([200], 0.32, 'sawtooth', 0.20, 150); }         // ぶー（低いブザー）
};

// ---- バイブ（まちがい時。iOS Safari は非対応） ----
function buzz() { if (navigator.vibrate) { try { navigator.vibrate([120, 60, 120]); } catch (e) {} } }

// ---- 画面切替 ----
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(`screen-${name}`).classList.add('active');
}

// ---- タイマー ----
function startTimer() {
  const fill = $('timerFill');
  fill.style.transition = 'none';
  fill.style.width = '100%';
  void fill.offsetWidth;
  fill.style.transition = `width ${TIME_MS}ms linear`;
  fill.style.width = '0%';
  timerId = setTimeout(onTimeout, TIME_MS);
}
function stopTimer() {
  if (timerId) { clearTimeout(timerId); timerId = null; }
  const fill = $('timerFill');
  const w = getComputedStyle(fill).width;
  fill.style.transition = 'none';
  fill.style.width = w;
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

// 公平なシャッフル（フィッシャー–イェーツ）
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 正解に“それとなく似た”3択。答えの「大小の位置」も「ボタン位置」も均等（中央に寄らない）。
function makeChoices(ans) {
  const [g1, g2] = shuffle([1, 2, 3]).slice(0, 2);   // 異なる2つの差（±3以内）
  const rank = Math.floor(Math.random() * 3);        // 0=最小 / 1=中間 / 2=最大 を均等に
  let vals;
  if (rank === 2 && ans - g1 >= 0 && ans - g2 >= 0) {
    vals = [ans, ans - g1, ans - g2];                // 答え＝最大
  } else if (rank === 1 && ans - g2 >= 0) {
    vals = [ans, ans + g1, ans - g2];                // 答え＝中間
  } else if (rank === 1 && ans - g1 >= 0) {
    vals = [ans, ans + g2, ans - g1];                // 中間（下側を作れる方に調整）
  } else {
    vals = [ans, ans + g1, ans + g2];                // 答え＝最小（下が作れない時のフォールバック含む）
  }
  return shuffle(vals);                              // ボタン位置も均等
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
  G.answered = false;
  G.currentAns = p.ans;
  $('progress').textContent = `もんだい ${G.idx + 1} / ${G.deck.length}`;
  $('problem').innerHTML = `${p.a} <span class="plus">${p.sym}</span> ${p.b}`;
  clearFeedback();
  renderChoices(makeChoices(p.ans));
  startTimer();
}

function showFeedback(ok) {
  const fb = $('feedback');
  fb.textContent = ok ? '◯' : '✕';
  fb.className = 'feedback show ' + (ok ? 'ok' : 'wrong');
}
function clearFeedback() {
  $('feedback').className = 'feedback';
}

function renderChoices(vals) {
  const box = $('choices');
  box.innerHTML = '';
  vals.forEach(v => {
    const b = document.createElement('button');
    b.className = 'choice-btn';
    b.textContent = v;
    b.dataset.v = v;
    b.addEventListener('click', () => handleChoice(v, b));
    box.appendChild(b);
  });
}

function record(ok) {
  const p = G.deck[G.idx];
  if (G.round === 1 && ok) G.firstOK++;
  if (G.round === 1 && !ok) G.firstWrongs.push(p);
  if (!ok) G.wrongs.push(p);
}

function revealCorrect(chosenBtn, ok) {
  const btns = [...$('choices').children];
  btns.forEach(x => {
    x.disabled = true;
    if (Number(x.dataset.v) === G.currentAns) x.classList.add('correct');
  });
  if (!ok && chosenBtn) chosenBtn.classList.add('wrong');
}

function handleChoice(v, btn) {
  if (G.answered) return;
  G.answered = true;
  Sound.resume();
  stopTimer();
  const ok = (v === G.currentAns);
  revealCorrect(btn, ok);
  showFeedback(ok);
  if (ok) Sound.correct(); else { Sound.wrong(); buzz(); }
  record(ok);
  setTimeout(nextCard, ok ? 600 : 850);
}

function onTimeout() {
  if (G.answered) return;
  G.answered = true;
  timerId = null;
  revealCorrect(null, false);   // 時間切れ＝できなかった問題
  showFeedback(false);
  Sound.wrong(); buzz();
  record(false);
  setTimeout(nextCard, 850);
}

function nextCard() {
  G.idx++;
  showCard();
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
  $('btnStart').addEventListener('click', () => { Sound.init(); if (G.op && G.level) startGame(); });
  $('btnBeginRedo').addEventListener('click', beginRedo);
  $('btnRestart').addEventListener('click', startGame);
  $('btnChangeLevel').addEventListener('click', () => showScreen('top'));

  // PCキー：1/2/3 で左・中・右の選択肢をえらぶ
  document.addEventListener('keydown', e => {
    if (!$('screen-flash').classList.contains('active')) return;
    const map = { '1': 0, '2': 1, '3': 2 };
    if (e.key in map) {
      e.preventDefault();
      const b = $('choices').children[map[e.key]];
      if (b && !b.disabled) b.click();
    }
  });
});
