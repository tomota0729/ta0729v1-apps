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
function loadRecords() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { best: { add: null, sub: null, mix: null }, history: [] };
}
function saveRecords(rec) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(rec)); } catch (e) {}
}

function renderRecords() {
  const rec = loadRecords();
  const list = $('recordList');
  const rows = MODE_ORDER
    .filter(m => rec.best[m] != null)
    .map(m => `
      <div class="record-row">
        <span class="rr-mode">${MODES[m].emoji} ${MODES[m].name}</span>
        <span class="rr-time">${rec.best[m].toFixed(1)} びょう</span>
      </div>`);
  list.innerHTML = rows.length
    ? rows.join('')
    : '<div class="record-empty">まだ記録がないよ。やってみよう！</div>';
}

// ---- モード選択 ----
function initModeSelect() {
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
        <span class="mode-ruby">${mode.ruby}</span>
      </span>`;
    btn.addEventListener('click', () => startCountdown(m));
    grid.appendChild(btn);
  });
  renderRecords();
  showScreen('mode');
}

// ---- 問題生成 ----
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function genProblem(mode) {
  let op = mode;
  if (mode === 'mix') op = Math.random() < 0.5 ? 'add' : 'sub';

  let a, b, ans, sym;
  if (op === 'add') {
    a = rand(0, 9); b = rand(0, 9);
    ans = a + b; sym = '＋';
  } else {
    a = rand(0, 9); b = rand(0, a);   // 答えがマイナスにならない
    ans = a - b; sym = '－';
  }
  return { a, b, sym, ans };
}

// ---- カウントダウン ----
function startCountdown(mode) {
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
        startGame(mode);
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
function startGame(mode) {
  cancelAnimationFrame(timerRAF);
  G = { mode, qIdx: 0, input: '', locked: false, startTime: performance.now() };
  loadProblem();
  tickTimer();
}

function loadProblem() {
  G.problem = genProblem(G.mode);
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
    const isNew = saveResult(G.mode, time);
    showSuccess(time, isNew);
  } else {
    showFailure(G.qIdx + 1, time);
  }
}

function saveResult(mode, time) {
  const rec = loadRecords();
  let isNew = false;
  if (rec.best[mode] == null || time < rec.best[mode]) {
    rec.best[mode] = time;
    isNew = true;
  }
  rec.history.unshift({ mode, time, date: Date.now() });
  rec.history = rec.history.slice(0, 10);
  saveRecords(rec);
  return isNew;
}

// ---- 結果 ----
function medalFor(time) {
  if (time < 20) return { emoji: '🥇', label: 'ゴールド' };
  if (time < 35) return { emoji: '🥈', label: 'シルバー' };
  return { emoji: '🥉', label: 'ブロンズ' };
}

// 成功（10問クリア）
function showSuccess(time, isNew) {
  showScreen('result');
  const medal = medalFor(time);
  $('resultMedal').textContent = medal.emoji;
  $('newRecord').style.display = isNew ? '' : 'none';
  $('resultTime').textContent = `${time.toFixed(1)} びょう！`;
  const avg = (time / TOTAL_Q).toFixed(1);
  $('resultStats').innerHTML = `
    <div>${MODES[G.mode].emoji} ${MODES[G.mode].name}モード</div>
    <div>メダル：${medal.emoji} ${medal.label}</div>
    <div>🎯 ノーミスでクリア！</div>
    <div>1もんへいきん <b>${avg}</b> びょう</div>
  `;
}

// 失敗（1問でもまちがえたら終了）
function showFailure(failedQ, time) {
  showScreen('result');
  $('resultMedal').textContent = '😢';
  $('newRecord').style.display = 'none';
  $('resultTime').textContent = 'ざんねん！';
  $('resultStats').innerHTML = `
    <div>${MODES[G.mode].emoji} ${MODES[G.mode].name}モード</div>
    <div><b>${failedQ}</b> もんめで まちがえたよ</div>
    <div>ここまで ${time.toFixed(1)} びょう</div>
    <div style="margin-top:6px; color:#888; font-size:0.9rem">ノーミスで10もんクリアをめざそう！</div>
  `;
}

// ---- 記録クリア ----
function clearRecords() {
  if (confirm('きろくをぜんぶけしますか？')) {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    renderRecords();
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
  $('btnRetry').addEventListener('click', () => startCountdown(G.mode));
  $('btnBackMode').addEventListener('click', initModeSelect);
});
