// ============================================================
//  漢字シューティング  ‑ Canvas 2D ゲーム本体
//  KANJI_DATA / GRADE_INFO は ../kanji/data.js から読み込み
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ---- 画面切り替え ----
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ============================================================
//  サウンド（WebAudio で簡易生成）
// ============================================================
const Sound = {
  ctx: null,
  on: true,
  init() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  blip(freq, dur, type = 'square', vol = 0.12) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(t); osc.stop(t + dur);
  },
  fire()  { this.blip(880, 0.08, 'square', 0.05); },
  hit()   { this.blip(220, 0.12, 'sawtooth', 0.10); },
  damage(){ this.blip(110, 0.3, 'sawtooth', 0.15); },
  power() { this.blip(660, 0.12, 'sine', 0.14); setTimeout(()=>this.blip(990,0.14,'sine',0.14),90); },
  boss()  {
    if (!this.on || !this.ctx) return;
    [523,659,784,1046].forEach((f,i)=> setTimeout(()=>this.blip(f,0.22,'triangle',0.13), i*110));
  }
};

// ============================================================
//  ゲーム状態
// ============================================================
let G = null;

function newGame(grade) {
  const W = canvas.clientWidth, H = canvas.clientHeight;
  return {
    grade,
    pool: KANJI_DATA[grade],
    W, H,
    running: true,
    mode: 'play',           // 'play' | 'reveal'
    last: 0,
    score: 0,
    lives: 3,
    combo: 0,
    bestCombo: 0,
    kills: 0,
    learned: new Set(),
    // プレイヤー
    ship: { x: W/2, y: H - 90, tx: W/2, ty: H - 90, r: 26, power: 0 },
    dragging: false,
    fireTimer: 0,
    fireInterval: 0.28,
    // 出現
    spawnTimer: 0,
    spawnInterval: 1.1,
    difficulty: 1,
    // オブジェクト
    bullets: [],
    enemies: [],
    particles: [],
    stars: [],
    items: [],
    popups: [],
    // 演出
    shake: 0,
    bossPending: false,
    nextMiniAt: 10,
    nextBossAt: 30,
  };
}

// ============================================================
//  キャンバスのサイズ調整
// ============================================================
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (G) { G.W = w; G.H = h; }
}

// ============================================================
//  星空（背景）
// ============================================================
function initStars() {
  G.stars = [];
  const n = 80;
  for (let i = 0; i < n; i++) {
    G.stars.push({
      x: Math.random() * G.W,
      y: Math.random() * G.H,
      z: Math.random() * 0.8 + 0.2,   // 奥行き（速度・大きさ）
    });
  }
}

// ============================================================
//  漢字エネミー生成
// ============================================================
function pickKanji() {
  return G.pool[Math.floor(Math.random() * G.pool.length)];
}

function spawnEnemy() {
  const k = pickKanji();
  const size = 42;
  const x = size + Math.random() * (G.W - size * 2);
  G.enemies.push({
    type: 'normal',
    data: k,
    x, y: -size,
    vy: (G.H / 11) * (0.85 + G.difficulty * 0.12),
    vx: (Math.random() - 0.5) * 30,
    size, hp: 1, maxHp: 1,
    hitFlash: 0,
  });
}

function spawnMiniBoss() {
  const k = pickKanji();
  const size = 84;
  G.enemies.push({
    type: 'mini',
    data: k,
    x: G.W / 2, y: -size,
    vy: G.H / 22,
    vx: 40,
    size, hp: 6, maxHp: 6,
    hitFlash: 0,
  });
  showWarning('⚠ ちゅうボス しゅつげん！', '#FFD54F');
}

function spawnBoss() {
  const k = pickKanji();
  const size = 130;
  G.enemies.push({
    type: 'boss',
    data: k,
    x: G.W / 2, y: -size,
    vy: G.H / 30,
    vx: 70,
    size, hp: 14, maxHp: 14,
    hitFlash: 0,
    arrived: false,
  });
  showWarning('⚠ WARNING ⚠\nボス しゅつげん！', '#FF5252');
  Sound.boss();
}

// ============================================================
//  弾の発射
// ============================================================
function fire() {
  const s = G.ship;
  if (s.power > 0) {
    G.bullets.push(makeBullet(s.x, s.y - s.r, 0));
    G.bullets.push(makeBullet(s.x - 16, s.y - s.r + 6, -120));
    G.bullets.push(makeBullet(s.x + 16, s.y - s.r + 6, 120));
  } else {
    G.bullets.push(makeBullet(s.x, s.y - s.r, 0));
  }
  Sound.fire();
}
function makeBullet(x, y, vx) {
  return { x, y, vx, vy: -680, r: 5 };
}

// ============================================================
//  パーティクル（爆発）
// ============================================================
function explode(x, y, color, count = 18, spread = 220) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = Math.random() * spread + 40;
    G.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0.6 + Math.random() * 0.4,
      max: 1,
      color,
      r: 2 + Math.random() * 3,
    });
  }
}

// ============================================================
//  読み方ポップアップ（撃破時に浮かぶ）
// ============================================================
function readingText(d) {
  const parts = [];
  if (d.on && d.on !== '―')  parts.push('音 ' + d.on);
  if (d.kun && d.kun !== '―') parts.push('訓 ' + d.kun);
  return parts.join('　');
}
function addPopup(x, y, kanji, reading) {
  G.popups.push({ x, y, kanji, reading, life: 1.3, max: 1.3 });
}

// ============================================================
//  中央演出（WARNING・読み方リール）
// ============================================================
const overlay = document.getElementById('stageOverlay');

function showWarning(text, color) {
  const el = document.createElement('div');
  el.style.cssText = `color:${color};font-weight:700;font-size:1.8rem;line-height:1.5;white-space:pre-line;text-shadow:0 0 18px ${color};animation:warnFlash 1.4s ease;`;
  el.textContent = text;
  overlay.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

function showReadingReveal(d, big) {
  G.mode = 'reveal';
  const wrap = document.createElement('div');
  wrap.className = 'reveal-wrap';
  wrap.innerHTML = `
    <div class="reveal-kanji">${d.kanji}</div>
    <div class="reveal-readings">
      ${d.on && d.on !== '―' ? `<div><span class="rv-badge on">音</span>${d.on}</div>` : ''}
      ${d.kun && d.kun !== '―' ? `<div><span class="rv-badge kun">訓</span>${d.kun}</div>` : ''}
    </div>
    ${big ? '<div class="reveal-clear">★ ボスげきは！ ★</div>' : ''}
  `;
  overlay.appendChild(wrap);
  const dur = big ? 2200 : 1500;
  setTimeout(() => {
    wrap.remove();
    if (G) G.mode = 'play';
  }, dur);
}

// ============================================================
//  更新
// ============================================================
function update(dt) {
  // 星は常に流す
  for (const st of G.stars) {
    st.y += (40 + st.z * 120) * dt;
    if (st.y > G.H) { st.y = 0; st.x = Math.random() * G.W; }
  }

  if (G.mode !== 'play') return;   // 演出中は更新を止める

  // 難易度をゆっくり上げる
  G.difficulty += dt * 0.012;
  G.spawnInterval = Math.max(0.55, 1.1 - G.difficulty * 0.05);

  // プレイヤー移動（指へなめらか追従）
  const s = G.ship;
  s.x += (s.tx - s.x) * Math.min(1, dt * 14);
  s.y += (s.ty - s.y) * Math.min(1, dt * 14);
  s.x = Math.max(s.r, Math.min(G.W - s.r, s.x));
  s.y = Math.max(G.H * 0.45, Math.min(G.H - 60, s.y));
  if (s.power > 0) s.power -= dt;

  // 自動連射
  G.fireTimer -= dt;
  if (G.fireTimer <= 0) { fire(); G.fireTimer = G.fireInterval; }

  // 弾移動
  for (const b of G.bullets) { b.x += b.vx * dt; b.y += b.vy * dt; }
  G.bullets = G.bullets.filter(b => b.y > -20);

  // 出現
  const bossOnField = G.enemies.some(e => e.type === 'boss');
  if (!bossOnField) {
    G.spawnTimer -= dt;
    if (G.spawnTimer <= 0) { spawnEnemy(); G.spawnTimer = G.spawnInterval; }
  }

  // エネミー移動
  for (const e of G.enemies) {
    e.y += e.vy * dt;
    e.x += e.vx * dt;
    if (e.x < e.size/2 || e.x > G.W - e.size/2) e.vx *= -1;
    if (e.hitFlash > 0) e.hitFlash -= dt;
    if (e.type === 'boss' && !e.arrived && e.y >= G.H * 0.22) {
      e.arrived = true; e.vy = 0;
    }
  }

  // 衝突判定（弾 → エネミー）
  for (const e of G.enemies) {
    for (const b of G.bullets) {
      if (b.dead) continue;
      const dx = b.x - e.x, dy = b.y - e.y;
      if (dx*dx + dy*dy < (e.size/2 + b.r) * (e.size/2 + b.r)) {
        b.dead = true;
        e.hp--;
        e.hitFlash = 0.12;
        explode(b.x, b.y, '#4FC3F7', 6, 120);
        if (e.hp <= 0) { destroyEnemy(e); }
        else { Sound.hit(); }
      }
    }
  }
  G.bullets = G.bullets.filter(b => !b.dead);

  // エネミーが下に到達 → ライフ減
  for (const e of G.enemies) {
    if (e.y - e.size/2 > G.H) {
      e.gone = true;
      if (e.type === 'normal') loseLife();
    }
  }
  G.enemies = G.enemies.filter(e => !e.gone && e.hp > 0);

  // アイテム（パワーアップ）
  for (const it of G.items) {
    it.y += it.vy * dt;
    it.spin += dt * 4;
    const dx = it.x - s.x, dy = it.y - s.y;
    if (dx*dx + dy*dy < (it.r + s.r) * (it.r + s.r)) {
      it.got = true; s.power = 6; Sound.power();
      addPopup(s.x, s.y - 40, '★', 'パワーアップ！');
    }
  }
  G.items = G.items.filter(it => !it.got && it.y < G.H + 30);

  // パーティクル
  for (const p of G.particles) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vy += 60 * dt; p.life -= dt;
  }
  G.particles = G.particles.filter(p => p.life > 0);

  // ポップアップ
  for (const pu of G.popups) { pu.y -= 26 * dt; pu.life -= dt; }
  G.popups = G.popups.filter(pu => pu.life > 0);

  // 画面シェイク減衰
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 40);
}

function destroyEnemy(e) {
  G.kills++;
  G.combo++;
  G.bestCombo = Math.max(G.bestCombo, G.combo);
  G.learned.add(e.data.kanji);

  const mult = 1 + Math.floor(G.combo / 5) * 0.5;
  let base = e.type === 'boss' ? 1000 : e.type === 'mini' ? 300 : 50;
  G.score += Math.round(base * mult);

  const color = e.type === 'normal' ? '#FFD54F' : '#FF7043';
  explode(e.x, e.y, color, e.type === 'normal' ? 18 : 40, e.type === 'normal' ? 220 : 360);
  G.shake = e.type === 'normal' ? 6 : 18;

  updateHUD();

  if (e.type === 'normal') {
    addPopup(e.x, e.y, e.data.kanji, readingText(e.data));
    Sound.hit();
    // たまにパワーアップ出現
    if (Math.random() < 0.08) {
      G.items.push({ x: e.x, y: e.y, vy: G.H/8, r: 16, spin: 0 });
    }
  } else if (e.type === 'mini') {
    Sound.boss();
    showReadingReveal(e.data, false);
  } else if (e.type === 'boss') {
    Sound.boss();
    showReadingReveal(e.data, true);
    G.difficulty += 0.6;   // ボス撃破で次が少し難しく
  }

  // 次のボス判定
  if (G.kills >= G.nextBossAt) {
    G.nextBossAt += 30;
    G.nextMiniAt = G.kills + 10;
    setTimeout(() => { if (G && G.running) spawnBoss(); }, 800);
  } else if (G.kills >= G.nextMiniAt) {
    G.nextMiniAt += 10;
    setTimeout(() => { if (G && G.running) spawnMiniBoss(); }, 600);
  }
}

function loseLife() {
  G.lives--;
  G.combo = 0;
  G.shake = 16;
  Sound.damage();
  updateHUD();
  if (G.lives <= 0) gameOver();
}

// ============================================================
//  描画
// ============================================================
function draw() {
  const W = G.W, H = G.H;
  ctx.clearRect(0, 0, W, H);

  // シェイク
  let ox = 0, oy = 0;
  if (G.shake > 0) {
    ox = (Math.random() - 0.5) * G.shake;
    oy = (Math.random() - 0.5) * G.shake;
  }
  ctx.save();
  ctx.translate(ox, oy);

  // 背景の星
  for (const st of G.stars) {
    ctx.globalAlpha = 0.3 + st.z * 0.7;
    ctx.fillStyle = '#cfd8ff';
    const r = st.z * 1.8;
    ctx.fillRect(st.x, st.y, r, r);
  }
  ctx.globalAlpha = 1;

  // アイテム
  for (const it of G.items) {
    ctx.save();
    ctx.translate(it.x, it.y); ctx.rotate(it.spin);
    ctx.fillStyle = '#FFD54F';
    ctx.shadowColor = '#FFD54F'; ctx.shadowBlur = 16;
    ctx.font = "700 30px 'Klee One', sans-serif";
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('★', 0, 0);
    ctx.restore();
  }
  ctx.shadowBlur = 0;

  // 弾（レーザービーム）
  for (const b of G.bullets) {
    ctx.strokeStyle = '#9be7ff';
    ctx.lineWidth = b.r;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#4FC3F7'; ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - b.vx * 0.012, b.y + 16);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // エネミー（漢字）
  for (const e of G.enemies) drawEnemy(e);

  // プレイヤー機体
  drawShip(G.ship);

  // パーティクル
  for (const p of G.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 読み方ポップアップ
  for (const pu of G.popups) {
    const a = Math.min(1, pu.life / pu.max * 1.4);
    ctx.globalAlpha = a;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = "600 30px 'Klee One', sans-serif";
    ctx.shadowColor = '#7C4DFF'; ctx.shadowBlur = 14;
    ctx.fillText(pu.kanji, pu.x, pu.y - 22);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFD54F';
    ctx.font = "600 17px 'Klee One', sans-serif";
    ctx.fillText(pu.reading, pu.x, pu.y + 6);
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawShip(s) {
  ctx.save();
  ctx.translate(s.x, s.y);

  // エンジンの炎
  const flame = 14 + Math.random() * 10;
  const grd = ctx.createLinearGradient(0, s.r, 0, s.r + flame + 16);
  grd.addColorStop(0, '#FFD54F');
  grd.addColorStop(0.5, '#FF7043');
  grd.addColorStop(1, 'rgba(255,87,67,0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.moveTo(-8, s.r - 4);
  ctx.lineTo(0, s.r + flame + 14);
  ctx.lineTo(8, s.r - 4);
  ctx.closePath();
  ctx.fill();

  // バリア（パワーアップ中）
  if (s.power > 0) {
    ctx.strokeStyle = 'rgba(79,195,247,0.7)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#4FC3F7'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(0, 0, s.r + 12, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // 機体（シャープな三角）
  ctx.shadowColor = '#4FC3F7'; ctx.shadowBlur = 14;
  const body = ctx.createLinearGradient(0, -s.r, 0, s.r);
  body.addColorStop(0, '#E1F5FE');
  body.addColorStop(1, '#4FC3F7');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(0, -s.r - 6);
  ctx.lineTo(s.r, s.r);
  ctx.lineTo(s.r * 0.4, s.r * 0.5);
  ctx.lineTo(-s.r * 0.4, s.r * 0.5);
  ctx.lineTo(-s.r, s.r);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // コックピット
  ctx.fillStyle = '#7C4DFF';
  ctx.beginPath();
  ctx.ellipse(0, -s.r * 0.1, 6, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawEnemy(e) {
  ctx.save();
  ctx.translate(e.x, e.y);

  const isBig = e.type !== 'normal';
  const ringColor = e.type === 'boss' ? '#FF5252'
                  : e.type === 'mini' ? '#FFD54F' : '#7C4DFF';

  // シールドリング
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = isBig ? 4 : 2;
  ctx.globalAlpha = 0.8;
  ctx.shadowColor = ringColor; ctx.shadowBlur = isBig ? 22 : 12;
  ctx.beginPath();
  ctx.arc(0, 0, e.size / 2 + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // 漢字
  ctx.fillStyle = e.hitFlash > 0 ? '#fff' : '#E8EAF6';
  ctx.shadowColor = ringColor; ctx.shadowBlur = isBig ? 18 : 8;
  ctx.font = `600 ${e.size}px 'Klee One', sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(e.data.kanji, 0, 2);
  ctx.shadowBlur = 0;

  // HPバー（中ボス・ボス）
  if (isBig) {
    const w = e.size, h = 7;
    const y = -e.size / 2 - 18;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(-w/2, y, w, h);
    ctx.fillStyle = ringColor;
    ctx.fillRect(-w/2, y, w * (e.hp / e.maxHp), h);
  }

  ctx.restore();
}

// ============================================================
//  HUD
// ============================================================
function updateHUD() {
  document.getElementById('hudScore').textContent = G.score;
  document.getElementById('hudLives').textContent =
    '❤'.repeat(Math.max(0, G.lives)) + '🖤'.repeat(Math.max(0, 3 - G.lives));
  const comboEl = document.getElementById('hudCombo');
  if (G.combo >= 2) {
    comboEl.textContent = `COMBO ×${G.combo}！`;
    comboEl.classList.add('show');
  } else {
    comboEl.classList.remove('show');
  }
}

// ============================================================
//  メインループ
// ============================================================
function loop(ts) {
  if (!G || !G.running) return;
  const dt = Math.min(0.05, (ts - G.last) / 1000 || 0);
  G.last = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// ============================================================
//  開始・終了
// ============================================================
function startGame(grade) {
  Sound.init();
  document.body.classList.add('playing');
  showScreen('screen-game');
  resizeCanvas();
  G = newGame(grade);
  initStars();
  updateHUD();
  overlay.innerHTML = '';
  showWarning('スタート！', '#4FC3F7');
  G.last = performance.now();
  requestAnimationFrame(loop);
}

function gameOver() {
  G.running = false;
  document.body.classList.remove('playing');
  Sound.damage();

  // ランク判定
  const sc = G.score;
  let rank = '☆ PILOT', msg = 'よく がんばった！';
  if (sc >= 8000)      { rank = '★★★ CAPTAIN'; msg = 'でんせつの パイロット！'; }
  else if (sc >= 4000) { rank = '★★ ACE';      msg = 'すごい うでまえ！'; }
  else if (sc >= 1500) { rank = '★ FIGHTER';    msg = 'いいちょうし！'; }

  document.getElementById('resultRank').textContent = rank;
  document.getElementById('resultScore').textContent = sc;
  document.getElementById('resultMessage').textContent = msg;
  document.getElementById('resultStats').innerHTML =
    `たおした かんじ：<b>${G.kills}</b> こ<br>` +
    `おぼえた かんじ：<b>${G.learned.size}</b> しゅるい<br>` +
    `さいだい コンボ：<b>${G.bestCombo}</b>`;
  showScreen('screen-result');
}

function quitGame() {
  if (G) G.running = false;
  document.body.classList.remove('playing');
  overlay.innerHTML = '';
  initGradeScreen();
}

// ============================================================
//  学年選択画面
// ============================================================
function initGradeScreen() {
  const grid = document.getElementById('gradeGrid');
  grid.innerHTML = '';
  Object.entries(GRADE_INFO).forEach(([grade, info]) => {
    const btn = document.createElement('button');
    btn.className = 'grade-btn' + (info.available ? '' : ' disabled');
    btn.style.borderColor = info.color;
    btn.innerHTML = `
      <span class="grade-label">${info.label}</span>
      <span class="grade-count">${info.count}字</span>
    `;
    if (info.available) {
      btn.addEventListener('click', () => {
        // フォント読込を待ってから開始（漢字が別フォントで出るのを防ぐ）
        document.fonts.load("600 48px 'Klee One'").then(() => startGame(Number(grade)));
      });
    }
    grid.appendChild(btn);
  });
  showScreen('screen-grade');
}

// ============================================================
//  入力（ドラッグ移動）
// ============================================================
function pointerPos(ev) {
  const rect = canvas.getBoundingClientRect();
  const p = ev.touches ? ev.touches[0] : ev;
  return { x: p.clientX - rect.left, y: p.clientY - rect.top };
}
function onDown(ev) {
  if (!G || !G.running) return;
  Sound.init();
  G.dragging = true;
  const p = pointerPos(ev);
  G.ship.tx = p.x; G.ship.ty = p.y;
  ev.preventDefault();
}
function onMove(ev) {
  if (!G || !G.running || !G.dragging) return;
  const p = pointerPos(ev);
  G.ship.tx = p.x; G.ship.ty = p.y;
  ev.preventDefault();
}
function onUp() { if (G) G.dragging = false; }

canvas.addEventListener('mousedown', onDown);
canvas.addEventListener('mousemove', onMove);
window.addEventListener('mouseup', onUp);
canvas.addEventListener('touchstart', onDown, { passive: false });
canvas.addEventListener('touchmove', onMove, { passive: false });
window.addEventListener('touchend', onUp);

window.addEventListener('resize', resizeCanvas);

// ---- ボタン ----
document.getElementById('quitBtn').addEventListener('click', () => {
  if (confirm('やめますか？')) quitGame();
});
document.getElementById('soundBtn').addEventListener('click', (e) => {
  Sound.on = !Sound.on;
  e.target.textContent = Sound.on ? '🔊' : '🔇';
});
document.getElementById('btnRetry').addEventListener('click', () => startGame(G ? G.grade : 1));
document.getElementById('btnBackToGrade').addEventListener('click', initGradeScreen);

// ---- 起動 ----
initGradeScreen();
