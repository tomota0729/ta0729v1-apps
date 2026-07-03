// 計算レース - game.js

// ---- roundRect ポリフィル（iPad Safari 16.4未満対策） ----
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
    else if (Array.isArray(r)) r = { tl: r[0]||0, tr: r[1]||r[0]||0, br: r[2]||r[0]||0, bl: r[3]||r[1]||r[0]||0 };
    else r = { tl: 0, tr: 0, br: 0, bl: 0 };
    this.moveTo(x + r.tl, y);
    this.arcTo(x + w, y,     x + w, y + h, r.tr);
    this.arcTo(x + w, y + h, x,     y + h, r.br);
    this.arcTo(x,     y + h, x,     y,     r.bl);
    this.arcTo(x,     y,     x + w, y,     r.tl);
    this.closePath();
    return this;
  };
}

// ---- サウンド ----
const Sound = {
  ctx: null,
  on: true,
  init() {
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  },
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  play(type) {
    if (!this.on || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.connect(g); g.connect(this.ctx.destination);

    switch (type) {
      case 'correct':
        o.frequency.setValueAtTime(523, t);
        o.frequency.setValueAtTime(784, t + 0.1);
        g.gain.setValueAtTime(0.28, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        o.start(t); o.stop(t + 0.35); break;

      case 'wrong':
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(220, t);
        o.frequency.setValueAtTime(150, t + 0.15);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        o.start(t); o.stop(t + 0.28); break;

      case 'combo':
        [523, 659, 784].forEach((f, i) => {
          const o2 = this.ctx.createOscillator();
          const g2 = this.ctx.createGain();
          o2.connect(g2); g2.connect(this.ctx.destination);
          o2.frequency.value = f;
          g2.gain.setValueAtTime(0.22, t + i * 0.09);
          g2.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.18);
          o2.start(t + i * 0.09); o2.stop(t + i * 0.09 + 0.18);
        }); break;

      case 'goal':
        [523, 659, 784, 1047].forEach((f, i) => {
          const o2 = this.ctx.createOscillator();
          const g2 = this.ctx.createGain();
          o2.connect(g2); g2.connect(this.ctx.destination);
          o2.frequency.value = f;
          g2.gain.setValueAtTime(0.3, t + i * 0.13);
          g2.gain.exponentialRampToValueAtTime(0.001, t + i * 0.13 + 0.28);
          o2.start(t + i * 0.13); o2.stop(t + i * 0.13 + 0.28);
        }); break;

      case 'select1':
        o.frequency.setValueAtTime(300, t);
        o.frequency.linearRampToValueAtTime(200, t + 0.2);
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        o.start(t); o.stop(t + 0.22); break;

      case 'select2':
        o.frequency.setValueAtTime(400, t);
        o.frequency.linearRampToValueAtTime(700, t + 0.18);
        g.gain.setValueAtTime(0.22, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        o.start(t); o.stop(t + 0.22); break;

      case 'select3':
        o.frequency.setValueAtTime(600, t);
        o.frequency.linearRampToValueAtTime(1200, t + 0.25);
        g.gain.setValueAtTime(0.22, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        o.start(t); o.stop(t + 0.28); break;
    }
  }
};

// ---- のりもの設定 ----
const VEHICLES = {
  1: { emoji: '🚗', sound: 'select1', color: '#E53935',
       ops: [
         { id: 'add', label: 'たし算', sym: '＋' },
         { id: 'sub', label: 'ひき算', sym: '－' }
       ]},
  2: { emoji: '🏎', sound: 'select2', color: '#1565C0',
       ops: [
         { id: 'add', label: 'たし算', sym: '＋' },
         { id: 'sub', label: 'ひき算', sym: '－' },
         { id: 'mul', label: 'かけ算', sym: '×' }
       ]},
  3: { emoji: '🚀', sound: 'select3', color: '#F9A825',
       ops: [
         { id: 'add', label: 'たし算', sym: '＋' },
         { id: 'sub', label: 'ひき算', sym: '－' },
         { id: 'mul', label: 'かけ算', sym: '×' },
         { id: 'div', label: 'わり算', sym: '÷' }
       ]}
};

const VEHICLE_NAMES = { 1: 'じどうしゃ', 2: 'レーシングカー', 3: 'ロケット' };

// ---- のりものをCanvasに描く ----
function drawVehicleOnCanvas(cv, grade) {
  try {
    drawVehicleInner(cv, grade);
  } catch (e) {
    // 描画に失敗しても他の処理を止めない（保険）
    console.warn('vehicle draw failed:', e);
  }
}

function drawVehicleInner(cv, grade) {
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);
  const cx = cv.width / 2, cy = cv.height / 2;

  if (grade === 1) {
    // 赤いファミリーカー（丸みあり）
    ctx.fillStyle = '#E53935';
    ctx.beginPath(); ctx.roundRect(cx - 32, cy - 12, 64, 24, 8); ctx.fill();
    ctx.fillStyle = '#FFCDD2';
    ctx.beginPath(); ctx.roundRect(cx - 18, cy - 26, 36, 16, 6); ctx.fill();
    // 窓
    ctx.fillStyle = '#B3E5FC';
    ctx.beginPath(); ctx.roundRect(cx - 13, cy - 23, 11, 10, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(cx + 2, cy - 23, 11, 10, 3); ctx.fill();
    // タイヤ
    [[cx - 18, cy + 13], [cx + 18, cy + 13]].forEach(([wx, wy]) => {
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.arc(wx, wy, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#bbb';
      ctx.beginPath(); ctx.arc(wx, wy, 4, 0, Math.PI * 2); ctx.fill();
    });

  } else if (grade === 2) {
    // 青いF1カー（シャープ）
    ctx.fillStyle = '#1565C0';
    ctx.beginPath();
    ctx.moveTo(cx - 36, cy);
    ctx.lineTo(cx - 36, cy - 10);
    ctx.lineTo(cx + 38, cy - 10);
    ctx.lineTo(cx + 44, cy);
    ctx.lineTo(cx + 38, cy + 10);
    ctx.lineTo(cx - 36, cy + 10);
    ctx.closePath(); ctx.fill();
    // コックピット
    ctx.fillStyle = '#90CAF9';
    ctx.beginPath(); ctx.ellipse(cx + 2, cy - 10, 13, 7, 0, 0, Math.PI * 2); ctx.fill();
    // フロントウイング
    ctx.fillStyle = '#0D47A1';
    ctx.fillRect(cx + 34, cy + 6, 18, 5);
    // リアウイング
    ctx.fillRect(cx - 50, cy - 14, 14, 5);
    // タイヤ
    [[cx - 22, cy + 10], [cx + 22, cy + 10]].forEach(([wx, wy]) => {
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.ellipse(wx, wy, 6, 10, 0, 0, Math.PI * 2); ctx.fill();
    });
    // 炎
    drawFlame(ctx, cx - 44, cy, 14);

  } else {
    // 金色ロケット（右向き）
    ctx.fillStyle = '#F9A825';
    ctx.beginPath();
    ctx.moveTo(cx + 44, cy);
    ctx.lineTo(cx + 22, cy - 13);
    ctx.lineTo(cx - 22, cy - 13);
    ctx.lineTo(cx - 32, cy);
    ctx.lineTo(cx - 22, cy + 13);
    ctx.lineTo(cx + 22, cy + 13);
    ctx.closePath(); ctx.fill();
    // ノーズ
    ctx.fillStyle = '#FFF9C4';
    ctx.beginPath();
    ctx.moveTo(cx + 44, cy);
    ctx.lineTo(cx + 24, cy - 8);
    ctx.lineTo(cx + 24, cy + 8);
    ctx.closePath(); ctx.fill();
    // フィン（上）
    ctx.fillStyle = '#E65100';
    ctx.beginPath();
    ctx.moveTo(cx - 22, cy - 13);
    ctx.lineTo(cx - 32, cy - 26);
    ctx.lineTo(cx - 32, cy - 13);
    ctx.closePath(); ctx.fill();
    // フィン（下）
    ctx.beginPath();
    ctx.moveTo(cx - 22, cy + 13);
    ctx.lineTo(cx - 32, cy + 26);
    ctx.lineTo(cx - 32, cy + 13);
    ctx.closePath(); ctx.fill();
    // 窓
    ctx.fillStyle = '#B3E5FC';
    ctx.beginPath(); ctx.arc(cx + 10, cy, 9, 0, Math.PI * 2); ctx.fill();
    // 炎
    drawFlame(ctx, cx - 36, cy, 18);
  }
}

function drawFlame(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  const grd = ctx.createRadialGradient(0, 0, 2, 0, 0, size);
  grd.addColorStop(0, 'rgba(255,230,80,0.95)');
  grd.addColorStop(0.5, 'rgba(255,120,0,0.8)');
  grd.addColorStop(1, 'rgba(255,60,0,0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.ellipse(-size * 0.3, 0, size, size * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---- 問題生成 ----
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function genProblem(grade, op) {
  let a, b, ans, sym;
  switch (op) {
    case 'add':
      if (grade === 1)      { a = rand(1, 9);   b = rand(1, Math.min(9, 20 - a)); }
      else if (grade === 2) { a = rand(10, 89);  b = rand(1, Math.min(50, 99 - a)); }
      else                  { a = rand(100, 799); b = rand(1, Math.min(199, 999 - a)); }
      ans = a + b; sym = '＋'; break;

    case 'sub':
      if (grade === 1)      { a = rand(3, 20);   b = rand(1, a - 1); }
      else if (grade === 2) { a = rand(20, 99);  b = rand(1, a - 1); }
      else                  { a = rand(200, 999); b = rand(1, a - 1); }
      ans = a - b; sym = '－'; break;

    case 'mul':
      a = rand(2, 9); b = rand(2, 9);
      ans = a * b; sym = '×'; break;

    case 'div':
      b = rand(2, 9); ans = rand(2, 9);
      a = b * ans; sym = '÷'; break;
  }
  return { a, b, sym, ans };
}

// ---- ランク ----
const RANKS = [
  { min: 0,    label: '🏅 ドライバー',   msg: 'ゴールした！すごい！' },
  { min: 500,  label: '🥈 レーサー',     msg: 'スピードがあるね！' },
  { min: 1000, label: '🥇 チャンピオン', msg: 'けいさんがはやい！天才！' },
  { min: 1800, label: '🏆 グランプリ王者', msg: 'コンボ炸裂！最強だ！' }
];

// ---- ゲーム状態 ----
let G = {};
let timerID = null;

const GOAL_CORRECT = 30;

// ---- DOM ----
const $ = id => document.getElementById(id);

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(`screen-${name}`).classList.add('active');
  $('appHeader').style.display = (name === 'game') ? 'none' : '';
}

// ---- モード選択 ----
function initModeSelect() {
  const grid = $('vehicleGrid');
  grid.innerHTML = '';
  $('opSelect').style.display = 'none';

  [1, 2, 3].forEach(grade => {
    const v = VEHICLES[grade];
    const card = document.createElement('div');
    card.className = 'vehicle-card';
    card.innerHTML = `
      <canvas class="vehicle-canvas" width="160" height="80" data-grade="${grade}"></canvas>
      <div class="vehicle-label">${VEHICLE_NAMES[grade]}</div>
      <div class="vehicle-ops" style="color:${v.color}">${v.ops.map(o => o.sym).join(' ')}</div>
    `;
    card.addEventListener('click', () => selectGrade(grade));
    grid.appendChild(card);
    drawVehicleOnCanvas(card.querySelector('canvas'), grade);
  });
}

function selectGrade(grade) {
  Sound.play(VEHICLES[grade].sound);
  document.querySelectorAll('.vehicle-card').forEach((c, i) => {
    c.classList.toggle('selected', i + 1 === grade);
  });

  const opSel = $('opSelect');
  opSel.style.display = 'block';
  const btns = $('opButtons');
  btns.innerHTML = '';
  VEHICLES[grade].ops.forEach(op => {
    const b = document.createElement('button');
    b.className = 'op-btn';
    b.textContent = `${op.sym} ${op.label}`;
    b.style.borderColor = VEHICLES[grade].color;
    b.style.color = VEHICLES[grade].color;
    b.addEventListener('click', () => startCountdown(grade, op.id));
    btns.appendChild(b);
  });

  opSel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ---- カウントダウン ----
function startCountdown(grade, op) {
  showScreen('game');
  $('trackVehicle').textContent = VEHICLES[grade].emoji;
  const overlay = $('countdownOverlay');
  const num = $('countdownNum');
  overlay.classList.remove('hidden');

  let count = 3;
  num.textContent = count;

  const tick = setInterval(() => {
    count--;
    if (count <= 0) {
      clearInterval(tick);
      num.textContent = 'スタート！';
      num.style.fontSize = '3.5rem';
      setTimeout(() => {
        overlay.classList.add('hidden');
        num.style.fontSize = '';
        startGame(grade, op);
      }, 700);
    } else {
      num.textContent = count;
      num.style.animation = 'none';
      void num.offsetWidth;
      num.style.animation = '';
    }
  }, 900);
}

// ---- ゲーム開始 ----
function startGame(grade, op) {
  clearInterval(timerID);
  G = { grade, op, score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0,
        progress: 0, timer: 60, locked: false };

  setProgress(0);
  $('timerDisp').textContent = 60;
  $('timerWrap').classList.remove('warn');
  $('comboWrap').textContent = '';

  nextProblem();
  timerID = setInterval(tickTimer, 1000);
}

function nextProblem() {
  G.problem = genProblem(G.grade, G.op);
  G.input = '';
  renderProblem();
}

function renderProblem(overrideText, overrideClass) {
  const p = G.problem;
  $('problemText').textContent = `${p.a} ${p.sym} ${p.b} ＝`;
  const ansText = $('answerText');
  const ansBox  = $('answerBox');
  ansText.textContent = overrideText !== undefined ? overrideText : (G.input || '?');
  ansText.className = 'answer-text' + (overrideClass ? ` ${overrideClass}` : '');
  ansBox.className   = 'answer-box'  + (overrideClass ? ` ${overrideClass}` : '');
}

// ---- テンキー入力 ----
function handleKey(val) {
  if (G.locked) return;
  Sound.resume();
  if (val === 'DEL') {
    G.input = G.input.slice(0, -1);
    renderProblem();
    return;
  }
  if (val === 'OK') {
    if (!G.input) return;
    checkAnswer();
    return;
  }
  if (G.input.length >= 4) return;
  G.input += val;
  renderProblem();
}

function checkAnswer() {
  const entered = parseInt(G.input, 10);
  const isCorrect = entered === G.problem.ans;

  if (isCorrect) {
    G.correct++;
    G.combo++;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;

    const mult = G.combo >= 10 ? 3 : G.combo >= 5 ? 2 : G.combo >= 3 ? 1.5 : 1;
    G.score += Math.round(10 * mult);
    G.progress += 1 / GOAL_CORRECT;

    Sound.play(G.combo >= 3 ? 'combo' : 'correct');
    showCombo();
    renderProblem(entered, 'correct');
    setProgress(G.progress, false);

    if (G.progress >= 1) { goalReached(); return; }
    setTimeout(() => nextProblem(), 380);

  } else {
    G.wrong++;
    G.combo = 0;
    G.progress -= 1 / (GOAL_CORRECT * 2);
    if (G.progress < 0) G.progress = 0;

    Sound.play('wrong');
    G.locked = true;
    renderProblem(G.problem.ans, 'wrong');
    setProgress(G.progress, true);

    setTimeout(() => {
      G.locked = false;
      nextProblem();
    }, 850);
  }
}

function setProgress(val, retreat = false) {
  const pct = Math.min(Math.max(val, 0), 1) * 88 + 3;
  const fill = $('trackFill');
  fill.style.width = `${pct}%`;
  fill.classList.toggle('retreat', retreat);
  if (retreat) setTimeout(() => fill.classList.remove('retreat'), 400);
}

function showCombo() {
  if (G.combo < 3) { $('comboWrap').textContent = ''; return; }
  const mult = G.combo >= 10 ? '×3' : G.combo >= 5 ? '×2' : '×1.5';
  const cw = $('comboWrap');
  cw.textContent = `COMBO ${mult}! 🔥`;
  cw.classList.remove('show');
  void cw.offsetWidth;
  cw.classList.add('show');
}

// ---- タイマー ----
function tickTimer() {
  G.timer--;
  $('timerDisp').textContent = G.timer;
  if (G.timer <= 10) $('timerWrap').classList.add('warn');
  if (G.timer <= 0) endGame();
}

// ---- ゴール ----
function goalReached() {
  clearInterval(timerID);
  G.score += G.timer * 5;
  Sound.play('goal');
  setTimeout(() => showResult(), 1200);
}

function endGame() {
  clearInterval(timerID);
  setTimeout(() => showResult(), 600);
}

// ---- 結果 ----
function showResult() {
  showScreen('result');
  $('resultVehicle').textContent = VEHICLES[G.grade].emoji;

  let rank = RANKS[0];
  for (const r of RANKS) { if (G.score >= r.min) rank = r; }

  $('resultRank').textContent = rank.label;
  $('resultScore').textContent = G.score.toLocaleString();
  $('resultStats').innerHTML = `
    <div>せいかい <b>${G.correct}</b> もん ／ まちがい <b>${G.wrong}</b> もん</div>
    <div>さいこうコンボ <b>×${G.maxCombo}</b></div>
    <div style="margin-top:6px; color:#888; font-size:0.9rem">${rank.msg}</div>
  `;
}

// ---- 起動 ----
document.addEventListener('DOMContentLoaded', () => {
  Sound.init();
  initModeSelect();

  document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', () => handleKey(btn.dataset.v));
    btn.addEventListener('touchstart', e => { e.preventDefault(); handleKey(btn.dataset.v); }, { passive: false });
  });

  $('btnRetry').addEventListener('click', () => startCountdown(G.grade, G.op));
  $('btnBackMode').addEventListener('click', () => { showScreen('mode'); initModeSelect(); });
});
