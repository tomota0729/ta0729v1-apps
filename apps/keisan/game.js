// スピードけいさん - game.js

// ---- サウンド（簡易WebAudio） ----
const Sound = {
  ctx: null,
  init() { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {} },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  beep(freqs, dur = 0.15, type = 'sine', vol = 0.22) {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    freqs.forEach((f, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.connect(g); g.connect(this.ctx.destination);
      o.frequency.value = f;
      const st = t + i * dur;
      g.gain.setValueAtTime(vol, st);
      g.gain.exponentialRampToValueAtTime(0.001, st + dur);
      o.start(st); o.stop(st + dur);
    });
  },
  correct() { this.beep([784], 0.12); },
  wrong()   { this.beep([200, 150], 0.14, 'sawtooth', 0.18); },
  finish()  { this.beep([523, 659, 784, 1047], 0.16); }
};

// ---- モード設定 ----
const MODES = {
  add: { emoji: '➕', name: 'たし算',   ruby: 'たしざん',  sym: '＋' },
  sub: { emoji: '➖', name: 'ひき算',   ruby: 'ひきざん',  sym: '－' },
  mix: { emoji: '🔀', name: 'ミックス', ruby: 'みっくす',  sym: '＋－' }
};
const MODE_ORDER = ['add', 'sub', 'mix'];

// ---- レベル設定 ----
const LEVELS = {
  1: { label: 'レベル1', desc: { add: '1けた ＋ 1けた', sub: '1けた － 1けた', mix: 'たしざん・ひきざん' } },
  2: { label: 'レベル2', desc: { add: '10〜20 ＋ 1けた', sub: '10〜20 － 1けた', mix: '10〜20 の ミックス' } }
};
const LEVEL_ORDER = [1, 2];
let currentLevel = 1;

const TOTAL_Q = 10;
const STORE_KEY = 'keisan-records';

// ---- 状態 ----
let G = {};
let timerRAF = null;

const $ = id => document.getElementById(id);

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(`screen-${name}`).classList.add('active');
  $('appHeader').style.display = (name === 'quiz') ? 'none' : '';
}

// ---- 記録（localStorage） ----
const recKey = (level, mode) => `${level}:${mode}`;

function loadRecords() {
  let rec = null;
  try { const raw = localStorage.getItem(STORE_KEY); rec = raw ? JSON.parse(raw) : null; } catch (e) {}
  if (!rec || typeof rec !== 'object') rec = {};
  if (!rec.best || typeof rec.best !== 'object') rec.best = {};
  if (!Array.isArray(rec.history)) rec.history = [];
  // 旧データ移行：レベルなし → レベル1
  const best = {};
  for (const k in rec.best) {
    if (rec.best[k] == null) continue;
    best[k.indexOf(':') >= 0 ? k : ('1:' + k)] = rec.best[k];
  }
  rec.best = best;
  rec.history = rec.history.map(h => (h.level ? h : Object.assign({ level: 1 }, h)));
  return rec;
}
function saveRecords(rec) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(rec)); } catch (e) {}
}

function renderRecords() {
  const rec = loadRecords();
  const list = $('recordList');
  const rows = MODE_ORDER
    .filter(m => rec.best[recKey(currentLevel, m)] != null)
    .map(m => `
      <div class="record-row">
        <span class="rr-mode">${MODES[m].emoji} ${MODES[m].name}</span>
        <span class="rr-time">${rec.best[recKey(currentLevel, m)].toFixed(1)} びょう</span>
      </div>`);
  list.innerHTML = rows.length
    ? rows.join('')
    : '<div class="record-empty">まだ記録がないよ。やってみよう！</div>';
}

// ---- モード選択 ----
function buildLevelRow() {
  const row = $('levelRow');
  row.innerHTML = '';
  LEVEL_ORDER.forEach(lv => {
    const btn = document.createElement('button');
    btn.className = 'level-btn' + (lv === currentLevel ? ' on' : '');
    btn.textContent = LEVELS[lv].label;
    btn.addEventListener('click', () => {
      currentLevel = lv;
      buildLevelRow();
      buildModeGrid();
      renderRecords();
    });
    row.appendChild(btn);
  });
}

function buildModeGrid() {
  const grid = $('modeGrid');
  grid.innerHTML = '';
  MODE_ORDER.forEach(m => {
    const mode = MODES[m];
    const btn = document.createElement('button');
    btn.className = 'mode-btn';
    btn.innerHTML = `
      <span class="mode-emoji">${mode.emoji}</span>
      <span class="mode-texts">
        <span class="mode-name">${mode.name}</span>
        <span class="mode-desc">${LEVELS[currentLevel].desc[m]}</span>
      </span>`;
    btn.addEventListener('click', () => startCountdown(m, currentLevel));
    grid.appendChild(btn);
  });
}

function initModeSelect() {
  buildLevelRow();
  buildModeGrid();
  renderRecords();
  showScreen('mode');
}

// ---- 問題生成 ----
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function genProblem(mode, level) {
  let op = mode;
  if (mode === 'mix') op = Math.random() < 0.5 ? 'add' : 'sub';

  let a, b, ans, sym;
  if (op === 'add') {
    a = rand(level === 2 ? 10 : 0, level === 2 ? 20 : 9); b = rand(0, 9);
    ans = a + b; sym = '＋';
  } else {
    if (level === 2) {
      a = rand(10, 20); b = rand(0, 9);           // a≥10>b なので必ず0以上
    } else {
      a = rand(0, 9); b = rand(0, 9);
      if (b > a) { const t = a; a = b; b = t; }   // 大きい数－小さい数（マイナスにしない）
    }
    ans = a - b; sym = '－';
  }
  return { a, b, sym, ans };
}

// ---- カウントダウン ----
function startCountdown(mode, level) {
  Sound.resume();
  showScreen('quiz');
  const overlay = $('countdownOverlay');
  const num = $('countdownNum');
  overlay.classList.remove('hidden');
  num.style.fontSize = '';

  // 事前にゲーム状態を用意（画面は準備状態に）
  $('qNum').textContent = `1 / ${TOTAL_Q}`;
  $('qTimer').textContent = '⏱ 0.0';
  $('progressFill').style.width = '0%';
  $('problemText').textContent = '';
  renderAnswer('', null);

  let count = 3;
  num.textContent = count;
  const tick = setInterval(() => {
    count--;
    if (count <= 0) {
      clearInterval(tick);
      num.textContent = 'スタート！';
      num.style.fontSize = '3.2rem';
      setTimeout(() => {
        overlay.classList.add('hidden');
        num.style.fontSize = '';
        startGame(mode, level);
      }, 650);
    } else {
      num.textContent = count;
      num.style.animation = 'none';
      void num.offsetWidth;
      num.style.animation = '';
    }
  }, 850);
}

// ---- ゲーム開始 ----
function startGame(mode, level) {
  cancelAnimationFrame(timerRAF);
  G = { mode, level, qIdx: 0, input: '', locked: false, startTime: performance.now() };
  loadProblem();
  tickTimer();
}

function loadProblem() {
  G.problem = genProblem(G.mode, G.level);
  G.input = '';
  G.locked = false;
  $('qNum').textContent = `${G.qIdx + 1} / ${TOTAL_Q}`;
  $('progressFill').style.width = `${(G.qIdx / TOTAL_Q) * 100}%`;
  const p = G.problem;
  $('problemText').textContent = `${p.a} ${p.sym} ${p.b} ＝`;
  renderAnswer('', null);
}

function renderAnswer(text, cls) {
  const at = $('answerText');
  const box = $('answerBox');
  if (!text) {
    at.textContent = '?';
    at.className = 'answer-text placeholder';
  } else {
    at.textContent = text;
    at.className = 'answer-text' + (cls ? ` ${cls}` : '');
  }
  box.className = 'answer-box' + (cls ? ` ${cls}` : '');
}

// ---- タイマー（カウントアップ） ----
function tickTimer() {
  const elapsed = (performance.now() - G.startTime) / 1000;
  $('qTimer').textContent = `⏱ ${elapsed.toFixed(1)}`;
  timerRAF = requestAnimationFrame(tickTimer);
}

// ---- テンキー入力 ----
function handleKey(val) {
  if (G.locked) return;
  Sound.resume();
  if (val === 'DEL') {
    G.input = G.input.slice(0, -1);
    renderAnswer(G.input, null);
    return;
  }
  if (!/^\d$/.test(val)) return;
  const ansLen = String(G.problem.ans).length;
  if (G.input.length >= ansLen) return;
  G.input += val;

  // 答えの桁数に達したら自動チェック（OK不要）
  if (G.input.length === ansLen) {
    checkAnswer();
  } else {
    renderAnswer(G.input, null);
  }
}

function checkAnswer() {
  const entered = parseInt(G.input, 10);
  if (entered === G.problem.ans) {
    // 正解 → 自動で次へ
    G.locked = true;
    Sound.correct();
    renderAnswer(G.input, 'correct');
    G.qIdx++;
    $('progressFill').style.width = `${(G.qIdx / TOTAL_Q) * 100}%`;
    if (G.qIdx >= TOTAL_Q) {
      setTimeout(() => finishGame(true), 350);
    } else {
      setTimeout(loadProblem, 300);
    }
  } else {
    // 不正解 → その場で失敗して終了（スピード・正確さを鍛える）
    G.locked = true;
    Sound.wrong();
    renderAnswer(G.input, 'wrong');
    setTimeout(() => finishGame(false), 600);
  }
}

// ---- 終了 ----
function finishGame(success) {
  cancelAnimationFrame(timerRAF);
  const time = (performance.now() - G.startTime) / 1000;
  if (success) {
    Sound.finish();
    const { entry, rank } = saveResult(G.mode, G.level, time);
    showSuccess(time, entry, rank);
  } else {
    showFailure(G.qIdx + 1, time);
  }
}

function saveResult(mode, level, time) {
  const rec = loadRecords();
  const key = recKey(level, mode);
  if (rec.best[key] == null || time < rec.best[key]) {
    rec.best[key] = time;
  }
  const entry = { level, mode, time, date: Date.now() };
  rec.history.push(entry);
  // レベルごとにタイムの速い順で上位30件だけ保持（レベル別ランキングが安定する）
  const kept = [];
  LEVEL_ORDER.forEach(lv => {
    kept.push(...rec.history.filter(h => h.level === lv).sort((a, b) => a.time - b.time).slice(0, 30));
  });
  rec.history = kept;
  saveRecords(rec);
  // 今回の記録の順位（同レベル内、1始まり。漏れたら0）
  const rank = rec.history
    .filter(h => h.level === level).sort((a, b) => a.time - b.time)
    .findIndex(h => h.date === entry.date && h.time === entry.time && h.mode === entry.mode) + 1;
  return { entry, rank };
}

// 日時を M/D HH:MM に整形
function formatDate(ms) {
  const d = new Date(ms);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 結果画面のランキング（今のレベルの全モードまとめて上位5・日時付き）
function renderRanking(currentEntry) {
  const rec = loadRecords();
  const box = $('ranking');
  const lvl = G.level || currentLevel;
  const top = rec.history.filter(h => h.level === lvl).sort((a, b) => a.time - b.time).slice(0, 5);
  let rows;
  if (top.length === 0) {
    rows = '<div class="rank-empty">まだ記録がないよ。ノーミスでクリアしよう！</div>';
  } else {
    rows = top.map((h, i) => {
      const isMe = currentEntry && h.time === currentEntry.time && h.date === currentEntry.date && h.mode === currentEntry.mode;
      return `
        <div class="rank-row${isMe ? ' me' : ''}">
          <span class="rank-no">${i + 1}</span>
          <span class="rank-mode">${MODES[h.mode].emoji}</span>
          <span class="rank-time">${h.time.toFixed(1)}びょう</span>
          <span class="rank-date">${formatDate(h.date)}</span>
        </div>`;
    }).join('');
  }
  box.innerHTML = `<div class="ranking-title">🏆 レベル${lvl} ランキング トップ5</div>${rows}`;
}

// ---- 結果 ----
// 成功（10問クリア）。メダルは今回の順位が1〜3位のときだけ表示。
function showSuccess(time, entry, rank) {
  showScreen('result');
  const isMedal = rank >= 1 && rank <= 3;
  const medalEmoji = ['🥇', '🥈', '🥉'][rank - 1];
  $('resultMedal').textContent = isMedal ? medalEmoji : '🏁';
  if (isMedal) {
    $('newRecord').textContent = `🎉 ${rank}いにランクイン！`;
    $('newRecord').style.display = '';
  } else {
    $('newRecord').style.display = 'none';
  }
  $('resultTime').textContent = `${time.toFixed(1)} びょう！`;
  const avg = (time / TOTAL_Q).toFixed(1);
  const rankText = rank >= 1 ? `<div>ランキング <b>${rank}</b> い</div>` : '';
  $('resultStats').innerHTML = `
    <div>レベル${G.level}　${MODES[G.mode].emoji} ${MODES[G.mode].name}モード</div>
    <div>🎯 ノーミスでクリア！</div>
    <div>1もんへいきん <b>${avg}</b> びょう</div>
    ${rankText}
  `;
  renderRanking(entry);
}

// 失敗（1問でもまちがえたら終了）
function showFailure(failedQ, time) {
  showScreen('result');
  $('resultMedal').textContent = '😢';
  $('newRecord').style.display = 'none';
  $('resultTime').textContent = 'ざんねん！';
  $('resultStats').innerHTML = `
    <div>レベル${G.level}　${MODES[G.mode].emoji} ${MODES[G.mode].name}モード</div>
    <div><b>${failedQ}</b> もんめで まちがえたよ</div>
    <div>ここまで ${time.toFixed(1)} びょう</div>
    <div style="margin-top:6px; color:#888; font-size:0.9rem">ノーミスで10もんクリアをめざそう！</div>
  `;
  renderRanking(null);
}

// ---- 記録クリア ----
function clearRecords() {
  if (confirm('きろくをぜんぶけしますか？')) {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    renderRecords();
    if ($('ranking')) renderRanking(null);
  }
}

// ---- 起動 ----
document.addEventListener('DOMContentLoaded', () => {
  Sound.init();
  initModeSelect();

  document.querySelectorAll('.num-btn').forEach(btn => {
    if (btn.classList.contains('num-spacer')) return;
    btn.addEventListener('click', () => handleKey(btn.dataset.v));
    btn.addEventListener('touchstart', e => { e.preventDefault(); handleKey(btn.dataset.v); }, { passive: false });
  });

  $('btnClear').addEventListener('click', clearRecords);
  $('btnResetRanking').addEventListener('click', clearRecords);
  $('btnRetry').addEventListener('click', () => startCountdown(G.mode, G.level));
  $('btnBackMode').addEventListener('click', initModeSelect);
});
