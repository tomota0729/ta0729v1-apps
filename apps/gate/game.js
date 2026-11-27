// かずの ゲート ラン — ゲートを えらんで なかまを ふやし、ボスに かつ（小1〜2・たし算ひき算）
'use strict';

/* ================= もんだい（画面なしでも動く） ================= */
const GATE = (() => {
  const COUNT = 3, START = 10;
  const STARTS = [10, 20, 20];      // ひきざん・みっくすは へる ゲートも あるので 多めに はじめる
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  // ゲートの式は [A, ±B, ±C] の形（さいしょは いつも プラス）。値 = 合計。通ると その値だけ なかまが ふえる
  const sum = op => op.reduce((a, b) => a + b, 0);
  const text = op => op.map((t, i) => (i === 0 && t >= 0 ? '' : t >= 0 ? '＋' : '−') + Math.abs(t)).join('');
  // マイナスの ゲート（−3−4 など、こたえが マイナス）は その ぶんだけ なかまが へる
  const eff = op => sum(op);
  // マイナスの式を作る（かんたん：−1けた−1けた ／ ふつう：−2けた−1けた ／ むずかしい：3つ）
  function negOp(diff, type) {
    let op;
    if (diff === 0) op = [-ri(1, 9), -ri(1, 9)];
    else if (diff === 1) op = [-ri(10, 19), -ri(1, 9)];
    else if (type === 2 && Math.random() < .5) op = [-ri(5, 9), ri(1, 4), -ri(1, 9)];
    else op = [-ri(1, 9), -ri(1, 9), -ri(1, 9)];
    op.neg = true;
    return op;
  }

  const TYPES = ['たしざん', 'ひきざん', 'みっくす'];
  const DIFFS = ['かんたん', 'ふつう', 'むずかしい'];

  // たしざん / ひきざん の式を1つ作る
  function makeOp(kind, diff) {
    if (diff === 0) {                       // かんたん：1けた どうし
      if (kind === 'add') return [ri(1, 9), ri(1, 9)];
      const a = ri(2, 9); return [a, -ri(1, a - 1)];
    }
    if (diff === 1) {                       // ふつう：2けたと 1けた
      if (kind === 'add') return [ri(10, 19), ri(1, 9)];
      const a = ri(10, 19); return [a, -ri(1, 9)];
    }
    // むずかしい：A＋B＋C など 3つ
    if (kind === 'add') return [ri(1, 9), ri(1, 9), ri(1, 9)];
    if (kind === 'sub') { const a = ri(10, 19); return [a, -ri(1, 9), -ri(1, 9)]; }
    return Math.random() < .5 ? [ri(2, 9), ri(1, 9), -ri(1, 9)] : [ri(5, 9), -ri(1, 4), ri(1, 9)];
  }

  // neg=true のときは マイナス どうし（へりが すくない ほうを えらぶ）。片方だけ マイナスは 出さない
  function makePair(type, diff, neg) {
    if (neg) return [negOp(diff, type), negOp(diff, type)];
    return makePair0(type, diff);
  }
  function makePair0(type, diff) {
    if (type === 0) return [makeOp('add', diff), makeOp('add', diff)];
    if (type === 1) return [makeOp('sub', diff), makeOp('sub', diff)];
    // みっくす：A＋B と C−B が まざる（むずかしいは 3つの まぜた式も）
    if (diff === 2 && Math.random() < .5) return [makeOp('mix', 2), makeOp(Math.random() < .5 ? 'add' : 'sub', 2)];
    return [makeOp('add', diff), makeOp('sub', diff)];
  }

  // 式の とちゅう（左から じゅんに 計算）でも 0 以下に ならない
  const okOp = op => {
    if (op.neg) return sum(op) < 0;                 // マイナスの式は こたえが マイナスなら よい
    let c = 0; for (const t of op) { c += t; if (c < 1) return false; } return true;
  };

  // 7つのゲートとボスを作る
  function makeStage(type, diff, count = COUNT) {
    const start = STARTS[type];
    for (let tries = 0; tries < 1000; tries++) {
      const gates = [];
      let lo = start;
      const negAt = type > 0 ? Math.floor(Math.random() * count) : -1;   // ひきざん・みっくす：マイナス どうしは ちょうど 1回
      for (let i = 0; i < count; i++) {
        const wantClose = Math.random() < 0.5;     // 差が 1〜3 の「まよう」組み合わせを 半分くらい
        let g = null;
        for (let t = 0; t < 500 && !g; t++) {
          let [p, q] = makePair(type, diff, i === negAt);
          if (Math.random() < .5) [p, q] = [q, p];
          if (!okOp(p) || !okOp(q) || p.includes(0) || q.includes(0)) continue;
          const diffV = Math.abs(eff(p) - eff(q));
          if (diffV === 0) continue;
          if (lo + Math.min(eff(p), eff(q)) < 1) continue;      // どちらを えらんでも 1にん いじょう のこる
          if (wantClose ? diffV > 3 : (diffV <= 3 && t < 250)) continue;
          g = { L: p, R: q };
        }
        if (!g) break;
        gates.push(g);
        lo += Math.min(eff(g.L), eff(g.R));
      }
      if (gates.length < count) continue;
      const best = start + gates.reduce((a, g) => a + Math.max(eff(g.L), eff(g.R)), 0);
      const diffs = gates.map(g => Math.abs(eff(g.L) - eff(g.R))).sort((a, b) => a - b);
      const s2 = diffs[0] + diffs[1];
      const boss = best - Math.max(1, Math.ceil(s2 / 2));   // 全問正解なら かち・2問まちがえると まけ
      if (boss < 1) continue;
      return { type, diff, count, key: type + '_' + diff + '_' + count, start, gates, best, boss };
    }
    throw new Error('stage');
  }

  return { COUNT, START, STARTS, TYPES, DIFFS, sum, eff, text, okOp, makeStage };
})();

if (typeof module !== 'undefined') module.exports = GATE;

/* ================= 画面 ================= */
if (typeof document !== 'undefined') (() => {
  const $ = id => document.getElementById(id);
  const cv = $('cv'), ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1;

  /* ---- 画像（img/ に置けば自動でつかう） ---- */
  const IMG = {};
  ['nakama_run1', 'nakama_run2', 'nakama_win', 'nakama_lose', 'boss1', 'boss2', 'boss3', 'gate_frame', 'fx_plus', 'fx_minus', 'bg_sky', 'title_art'].forEach(k => {
    const im = new Image();
    im.onload = () => { IMG[k] = im; if (k === 'title_art') { $('logo-img').src = im.src; $('logo-img').hidden = false; } };
    im.src = 'img/' + k + (k === 'bg_sky' || k === 'title_art' ? '.jpg' : '.png') + '?v=2';
  });

  /* ---- 効果音 ---- */
  const Snd = (() => {
    let ac = null;
    const A = () => (ac ||= new (window.AudioContext || window.webkitAudioContext)());
    function tone(f, d, type = 'sine', vol = .16, when = 0, f2) {
      try {
        const a = A(), t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
        o.type = type; o.frequency.setValueAtTime(f, t);
        if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
        o.connect(g).connect(a.destination); o.start(t); o.stop(t + d);
      } catch (e) {}
    }
    return {
      tap() { tone(660, .06, 'sine', .08); },
      up() { [523, 659, 784].forEach((f, i) => tone(f, .14, 'triangle', .15, i * .07)); },
      down() { tone(440, .25, 'sine', .14, 0, 220); },
      ng() { tone(300, .3, 'square', .07, 0, 180); },
      boss() { tone(110, .5, 'sawtooth', .1, 0, 70); },
      win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, .22, 'triangle', .16, i * .13)); },
      lose() { [392, 349, 330, 262].forEach((f, i) => tone(f, .3, 'sine', .14, i * .2)); },
      slash() { tone(1400, .08, 'sawtooth', .07, 0, 500); tone(240, .12, 'square', .08, .02, 90); },
      throw() { tone(500, .3, 'sine', .07, 0, 160); },
      thud() { tone(140, .25, 'triangle', .16, 0, 60); },
      boom() { tone(90, .7, 'sawtooth', .16, 0, 35); tone(60, .9, 'square', .1, .05, 30); },
      roar() { tone(160, .8, 'sawtooth', .13, 0, 70); tone(110, .9, 'square', .08, .1, 55); },
      cry() { [660, 880].forEach((f, i) => tone(f, .12, 'triangle', .12, i * .1)); },
    };
  })();

  /* ---- 状態 ---- */
  const G = 2.6;                 // ゲートの間かく（世界の長さ）。ひろめに して つぎの ゲートを 見やすく
  const SPEED_T = [5.2, 3.4]; // ゲート1つ分を走る秒数（はやさは [0] で こてい）
  const LENS = [3, 5, 7];       // もんだいの かず：みじかい・ふつう・ながい
  let ty = 0, df = 0, sp = 0, stage = null;   // sp = もんだいの かずの えらんだ ばんごう
  const CNT = () => (stage ? stage.gates.length : LENS[sp]);
  let mode = 'title';            // title / run / battle / result
  let cam = 0, n = 10, side = 0, sideX = 0, next = 0, waiting = false;
  let log = [], correct = 0, popTimer = 0, bossN = 0, bossShown = 0, t0 = 0, bossKind = 1;
  // えんしゅつ
  let shownN = 10, lastStep = 0;          // 見えている なかまの数（1体ずつ ふえる・へる）
  const spawnT = [], fadeOuts = [];       // ふえた時刻 / きえていく なかま
  let parts = [];                          // キラキラ・けむり
  let flash = null;                        // えらんだ パネルの ひかり {i, side, t}
  let adv = 0, knock = 0, bossFall = 0;    // ボス戦の うごき

  try { ty = +(localStorage.getItem('gate_ty') ?? 0) % 3; df = +(localStorage.getItem('gate_df') ?? 0) % 3; sp = +(localStorage.getItem('gate_len') ?? 0) % 3; } catch (e) {}

  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  addEventListener('resize', resize); resize();

  /* ---- 遠近 ---- */
  const horizon = () => H * 0.34;   // 画面の上に 正解コメントの すきまを あける
  const playerY = () => H * 0.86;
  const boostLine = () => horizon() + (playerY() - horizon()) * 0.15;   // これより うえを タップすると かそく
  const halfW = () => Math.min(W * 0.39, H * 0.6);   // 手前の道はばは 画面はばの 8わり くらい
  const scaleAt = d => 1 / (1 + d * 0.9);
  const yAt = d => horizon() + (playerY() - horizon()) * scaleAt(d);

  /* ---- 描く ---- */
  function drawBg() {
    const hz = horizon();
    if (IMG.bg_sky) {
      const im = IMG.bg_sky, r = Math.max(W / im.width, hz * 1.25 / im.height);
      ctx.drawImage(im, (W - im.width * r) / 2, hz * 1.1 - im.height * r, im.width * r, im.height * r);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, hz);
      g.addColorStop(0, '#7EC8F2'); g.addColorStop(1, '#D9F1FF');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, hz + 2);
      ctx.fillStyle = '#9BD58A';
      ctx.beginPath(); ctx.moveTo(0, hz);
      for (let x = 0; x <= W; x += W / 8) ctx.lineTo(x, hz - 18 - 14 * Math.sin(x / W * 7 + 1));
      ctx.lineTo(W, hz); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      [[.2, .35], [.7, .22], [.45, .55]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(W * x, hz * y, 34, 12, 0, 0, 7); ctx.ellipse(W * x + 22, hz * y - 6, 22, 12, 0, 0, 7); ctx.fill(); });
    }
    // 草
    const gg = ctx.createLinearGradient(0, hz, 0, H);
    gg.addColorStop(0, '#8CCB6E'); gg.addColorStop(1, '#5FAE4A');
    ctx.fillStyle = gg; ctx.fillRect(0, hz, W, H - hz);
  }

  // 世界の位置 wz（cam からの きょり d）・横の位置 u（-1＝道の左はし、+1＝右はし）を 画面へ
  const toScreen = (d, u) => { const s = scaleAt(d); return [W / 2 + u * halfW() * s, yAt(d), s]; };
  const hash = k => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  function drawRoad() {
    const cx = W / 2, hw = halfW();
    const far = 9, near = -0.6;
    const quad = (a, b, u0, u1) => {
      const [x1, y1] = toScreen(a, u0), [x2] = toScreen(a, u1), [x3, y3] = toScreen(b, u1), [x4] = toScreen(b, u0);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y1); ctx.lineTo(x3, y3); ctx.lineTo(x4, y3); ctx.closePath();
    };
    // 石の 道（したじ）
    ctx.fillStyle = '#C9BBA3'; quad(far, near, -1, 1); ctx.fill();
    // 石の タイル（列ごとに ずらす）
    const step = 0.28, COLS = 6;
    for (let k = Math.floor((cam + near) / step); k * step < cam + far; k++) {
      const d1 = Math.max(k * step - cam, near), d2 = Math.min((k + 1) * step - cam, far);
      if (d2 <= d1) continue;
      const off = (k % 2) ? 0.5 : 0;
      for (let c = -1; c < COLS; c++) {
        const u0 = Math.max(-1, -1 + (c + off) * 2 / COLS), u1 = Math.min(1, -1 + (c + off + 1) * 2 / COLS);
        if (u1 <= u0) continue;
        const h = hash(k * 13 + c);
        ctx.fillStyle = `hsl(${32 + h * 10}, ${16 + h * 10}%, ${70 + h * 9}%)`;
        quad(d1, d2, u0 + 0.012, u1 - 0.012); ctx.fill();
      }
      // 石の すきま（よこ）
      const [xa, ya] = toScreen(d1, -1), [xb] = toScreen(d1, 1);
      ctx.strokeStyle = 'rgba(110,95,75,.45)'; ctx.lineWidth = Math.max(1, 2 * scaleAt(d1));
      ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, ya); ctx.stroke();
    }
    // ふちの 石
    ctx.strokeStyle = '#8C7B62'; ctx.lineWidth = 5;
    [-1, 1].forEach(sd => { const [x1, y1] = toScreen(far, sd), [x2, y2] = toScreen(near, sd); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); });
    // ふちの 草と 花（遠くから じゅんに）
    const fstep = 0.32;
    for (let k = Math.ceil((cam + far) / fstep); k * fstep > cam + near; k--) {
      const d = k * fstep - cam;
      [-1, 1].forEach(sd => {
        const h = hash(k * 7 + sd);
        const [x, y, sc] = toScreen(d, sd * (1.02 + h * 0.06));
        const r = hw * 0.07 * sc;
        ctx.fillStyle = '#4E9A3C';
        ctx.beginPath(); ctx.arc(x - r * .6, y - r * .3, r * .8, 0, 7); ctx.arc(x + r * .5, y - r * .4, r * .9, 0, 7); ctx.arc(x, y - r * .9, r * .8, 0, 7); ctx.fill();
        if (h > 0.45) { ctx.fillStyle = ['#FF8FB1', '#FFE066', '#FFFFFF', '#B197FC'][Math.floor(h * 40) % 4]; ctx.beginPath(); ctx.arc(x + r * .2, y - r * 1.2, r * .35, 0, 7); ctx.fill(); }
      });
    }
  }

  // 草地の 木と しげみ（遠くから じゅんに描く）
  function drawTrees() {
    const hw = halfW(), tstep = 0.9, far = 9, near = -0.6;
    for (let k = Math.ceil((cam + far) / tstep); k * tstep > cam + near; k--) {
      const d = k * tstep - cam;
      [-1, 1].forEach(sd => {
        const h = hash(k * 3 + sd * 5);
        const u = sd * (1.45 + h * 1.2);
        const [x, y, sc] = toScreen(d, u);
        if (x < -hw || x > W + hw) return;
        if (h < 0.55) {   // 木
          const tr = hw * 0.32 * sc;
          ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(x, y, tr * .8, tr * .22, 0, 0, 7); ctx.fill();
          ctx.fillStyle = '#7A5230'; ctx.fillRect(x - tr * .12, y - tr * 1.1, tr * .24, tr * 1.1);
          ctx.fillStyle = h < 0.28 ? '#3F8F3A' : '#4FA34A';
          ctx.beginPath(); ctx.arc(x, y - tr * 1.55, tr * .7, 0, 7); ctx.arc(x - tr * .45, y - tr * 1.15, tr * .5, 0, 7); ctx.arc(x + tr * .45, y - tr * 1.15, tr * .5, 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(x - tr * .25, y - tr * 1.8, tr * .25, 0, 7); ctx.fill();
        } else {          // しげみ
          const br = hw * 0.14 * sc;
          ctx.fillStyle = '#5DAE48';
          ctx.beginPath(); ctx.arc(x - br * .7, y - br * .5, br * .75, 0, 7); ctx.arc(x + br * .6, y - br * .55, br * .8, 0, 7); ctx.arc(x, y - br, br * .85, 0, 7); ctx.fill();
        }
      });
    }
  }

  // 古い iPad（iOS 15 まで）は ctx.roundRect が ないので 自分で 描く
  function rrect(x, y, w, h, r) {
    r = Math.max(0, Math.min(+r || 0, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // gate_frame.png（1200×579）の あいている ところ：左 188〜547、右 653〜1013、上の梁の下 146〜下まで
  const FRAME = { w: 1200, h: 579, L: [188, 547], R: [653, 1013], top: 146, outer: [51, 1149] };
  function gateBox(d) {
    const s = scaleAt(d), y = yAt(d), cx = W / 2, hw = halfW() * s;
    const fw = hw * 2 * FRAME.w / (FRAME.outer[1] - FRAME.outer[0]) * 1.04;   // 外の柱が 道の はしに くる
    const f = fw / FRAME.w, fh = FRAME.h * f, x0 = cx - fw / 2, top = y - fh;
    const panel = ([l, r]) => ({ x: x0 + l * f, w: (r - l) * f, y: top + FRAME.top * f, h: (FRAME.h - FRAME.top) * f });
    return { s, y, cx, fw, fh, x0, top, Lp: panel(FRAME.L), Rp: panel(FRAME.R) };
  }

  function drawGate(i, d) {
    const g = stage.gates[i], B = gateBox(d), s = B.s;
    const used = i < next;
    const alpha = used ? Math.max(0, 1 + d * 2) : 1;
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha;
    const panels = [['L', -1, B.Lp], ['R', 1, B.Rp]];
    // 1) まほうの ひかりの パネル（左＝青・右＝赤）
    panels.forEach(([k, sd, P]) => {
      const chosen = used && log[i] && log[i].side === sd;
      const gr = ctx.createLinearGradient(0, P.y, 0, P.y + P.h);
      if (chosen) { gr.addColorStop(0, 'rgba(255,240,150,.9)'); gr.addColorStop(1, 'rgba(255,200,60,.75)'); }
      else if (sd < 0) { gr.addColorStop(0, 'rgba(120,200,255,.78)'); gr.addColorStop(.6, 'rgba(40,120,255,.55)'); gr.addColorStop(1, 'rgba(20,70,200,.35)'); }
      else { gr.addColorStop(0, 'rgba(255,150,170,.78)'); gr.addColorStop(.6, 'rgba(240,60,90,.55)'); gr.addColorStop(1, 'rgba(180,20,60,.35)'); }
      ctx.fillStyle = gr; ctx.fillRect(P.x, P.y, P.w, P.h);
      // ルーンの ひかり（ゆらゆら）
      const tt = performance.now() / 600 + i;
      ctx.strokeStyle = sd < 0 ? 'rgba(200,240,255,.55)' : 'rgba(255,220,230,.55)';
      ctx.lineWidth = Math.max(1, 2.5 * s);
      ctx.beginPath(); ctx.ellipse(P.x + P.w / 2, P.y + P.h * .55, P.w * (.36 + .03 * Math.sin(tt)), P.h * .36, 0, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(P.x + P.w / 2, P.y + P.h * .55, P.w * .26, P.h * (.25 + .02 * Math.cos(tt)), 0, 0, 7); ctx.stroke();
      if (flash && flash.i === i && flash.side === sd) {
        const k = Math.max(0, 1 - (performance.now() - flash.t) / 600);
        if (k > 0) { ctx.save(); ctx.globalAlpha = alpha * k; ctx.shadowColor = '#FFF7B0'; ctx.shadowBlur = 30 * s; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(P.x, P.y, P.w, P.h); ctx.restore(); }
      }
    });
    // 2) わく（柱と梁）
    if (IMG.gate_frame) ctx.drawImage(IMG.gate_frame, B.x0, B.top, B.fw, B.fh);
    else {
      const f = B.fw / FRAME.w;
      ctx.fillStyle = '#8A8F9C';
      [[51, 188], [547, 653], [1013, 1149]].forEach(([l, r]) => ctx.fillRect(B.x0 + l * f, B.top + 12 * f, (r - l) * f, B.fh - 12 * f));
      ctx.fillStyle = '#6B7180'; ctx.fillRect(B.x0 + 30 * f, B.top + 12 * f, B.fw - 60 * f, 134 * f);
    }
    // 3) 式の文字（いちばん上に描くので 柱に かくれない）
    panels.forEach(([k, sd, P]) => {
      const txt = GATE.text(g[k]);
      let fs = P.h * 0.28;
      const fit = () => { ctx.font = `800 ${fs}px "M PLUS Rounded 1c", sans-serif`; return ctx.measureText(txt).width; };
      while (fit() > P.w * 0.9 && fs > 6) fs *= 0.92;
      if (d < 4.5 && fs < 13) { fs = 13; fit(); }      // 遠くても 読める 大きさ
      const tx = P.x + P.w / 2, ty = P.y + P.h * 0.36;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(3, fs * 0.22); ctx.strokeStyle = sd < 0 ? '#0B2E6B' : '#6B0B25'; ctx.strokeText(txt, tx, ty);
      ctx.lineWidth = Math.max(1.5, fs * 0.1); ctx.strokeStyle = '#FFFFFF'; ctx.strokeText(txt, tx, ty);
      ctx.fillStyle = '#FFFFFF'; ctx.fillText(txt, tx, ty);
    });
    ctx.restore();
  }

  function blob(x, y, r, phase, tint) {
    if (hop > 0 && IMG.nakama_win) { const im = IMG.nakama_win, h = r * 2.3, w = h * im.width / im.height; ctx.drawImage(im, x - w / 2, y - h + r * 0.2, w, h); return; }
    const im = IMG.nakama_run1 && (IMG.nakama_run2 && phase > 0 ? IMG.nakama_run2 : IMG.nakama_run1);
    if (im) { const h = r * 2.2, w = h * im.width / im.height, hop = phase > 0 ? r * 0.18 : 0; ctx.drawImage(im, x - w / 2, y - h + r * 0.2 - hop, w, h); return; }
    // かりの キャラ（まるい ひよこ）
    const bob = Math.sin(phase * Math.PI) * r * 0.15;
    ctx.fillStyle = tint || '#FFD43B';
    ctx.beginPath(); ctx.ellipse(x, y - r + bob, r, r * 0.95, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#E0A100'; ctx.lineWidth = Math.max(1, r * 0.12); ctx.stroke();
    ctx.fillStyle = '#23324A';
    ctx.beginPath(); ctx.arc(x - r * .35, y - r * 1.1 + bob, r * .13, 0, 7); ctx.arc(x + r * .35, y - r * 1.1 + bob, r * .13, 0, 7); ctx.fill();
    ctx.fillStyle = '#FF8A3D';
    ctx.beginPath(); ctx.moveTo(x - r * .18, y - r * .85 + bob); ctx.lineTo(x + r * .18, y - r * .85 + bob); ctx.lineTo(x, y - r * .62 + bob); ctx.fill();
    ctx.fillStyle = 'rgba(255,120,120,.5)';
    ctx.beginPath(); ctx.arc(x - r * .62, y - r * .78 + bob, r * .14, 0, 7); ctx.arc(x + r * .62, y - r * .78 + bob, r * .14, 0, 7); ctx.fill();
  }

  // なかまの ならび（うずまき）
  // 隊列：まえの列から 5人ずつ。おおいときは うしろの列に かさなる（[よこ, たて] は キャラの大きさ r が 単位）
  const SPOTS = (() => { const a = []; for (let i = 0; i < 60; i++) { const c = i % 5, j = Math.floor(i / 5); a.push([(c - 2) * 1.35 + (j % 2 ? 0.67 : 0), -j * 0.75]); } return a; })();

  // 見えている数を 1体ずつ n に ちかづける
  function stepCrowd(now) {
    const target = Math.max(0, Math.min(n, 30));
    if (shownN === target || now - lastStep < 55) return;
    lastStep = now;
    if (shownN < target) { spawnT[shownN] = now; shownN++; }
    else { shownN--; fadeOuts.push({ i: shownN, t: now }); }
  }

  function crowdPos() {
    const hw = halfW();
    return { x: W / 2 + sideX * hw * 0.5, y: playerY() - adv * (playerY() - yAt(0.55)) * 0.38 + knock * H * 0.12, sc: 1 - adv * 0.12 };
  }

  function drawCrowd(now) {
    stepCrowd(now);
    const hw = halfW(), { x, y, sc } = crowdPos();
    const r = hw * 0.11 * sc;
    const running = (mode === 'run' && !waiting) || (mode === 'battle' && adv < 1);
    const base = 1 - knock * 0.6;
    ctx.save(); ctx.globalAlpha = base;
    // かげ
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    const rows = Math.ceil(Math.max(1, shownN) / 5);
    ctx.beginPath(); ctx.ellipse(x, y - r * rows * 0.3, r * 3.6, r * (0.6 + rows * 0.4), 0, 0, 7); ctx.fill();
    const list = [];
    for (let i = 0; i < shownN; i++) {
      const age = (now - (spawnT[i] || 0)) / 220;
      const k = age >= 1 ? 1 : age < 0.7 ? age / 0.7 * 1.25 : 1.25 - (age - 0.7) / 0.3 * 0.25; // ぽんっ
      list.push({ i, k, a: 1, up: 0 });
    }
    for (let j = fadeOuts.length - 1; j >= 0; j--) {
      const f = fadeOuts[j], age = (now - f.t) / 300;
      if (age >= 1 || f.i < shownN) { fadeOuts.splice(j, 1); continue; }
      list.push({ i: f.i, k: 1 + age * 0.4, a: 1 - age, up: age * r * 2 });
    }
    const jump = i => hop > 0 ? Math.abs(Math.sin(now / 160 + i * 0.9)) * r * 0.9 : 0;
    list.map(o => Object.assign(o, { px: x + SPOTS[o.i][0] * r, py: y + SPOTS[o.i][1] * r - o.up - jump(o.i) }))
      .sort((p, q) => p.py - q.py)
      .forEach(o => {
        ctx.globalAlpha = base * o.a;
        blob(o.px, o.py, r * o.k, running ? ((now / 180 + o.i * .37) % 2 > 1 ? 1 : 0) : 0);
      });
    ctx.globalAlpha = base;
    // 人数
    if (shownN > 0 || mode !== 'battle') badge(x, y - r * (2.9 + (rows - 1) * 0.75), String(Math.max(0, n)), '#1E5AA8', hw * (mode === 'battle' ? 0.12 : 0.085) * Math.max(.8, sc));
    ctx.restore();
  }

  /* ---- キラキラ・けむり ---- */
  function burst(kind, scale = 1) {
    const { x, y } = crowdPos(), hw = halfW() * scale;
    const cy = y - halfW() * 0.25 - (scale < 1 ? halfW() * 0.25 : 0) + (Math.random() - .5) * hw * (scale < 1 ? 1.5 : 0);
    if (IMG[kind === 'plus' ? 'fx_plus' : 'fx_minus']) {
      parts.push({ img: kind, x: x + (scale < 1 ? (Math.random() - .5) * halfW() * .6 : 0), y: cy, t: performance.now(), life: 700, size: hw * 0.9 });
      return;
    }
    for (let i = 0; i < (kind === 'plus' ? 16 : 10); i++) {
      const a = Math.random() * Math.PI * 2, v = hw * (kind === 'plus' ? 1.4 : 0.6) * (0.5 + Math.random());
      parts.push({ kind, x, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (kind === 'plus' ? hw * .6 : hw * .3), t: performance.now(), life: kind === 'plus' ? 700 : 900,
        size: hw * (kind === 'plus' ? 0.07 : 0.12) * (0.7 + Math.random() * .6), hue: ['#FFD43B', '#FF7EB3', '#7CD3FF', '#9BE36D'][i % 4] });
    }
  }
  function drawParts(now, dt) {
    parts = parts.filter(p => now - p.t < p.life);
    parts.forEach(p => {
      const k = (now - p.t) / p.life;
      if (p.img) {
        const im = IMG[p.img === 'plus' ? 'fx_plus' : 'fx_minus'], sz = p.size * (0.6 + k * 0.6);
        ctx.globalAlpha = 1 - k; ctx.drawImage(im, p.x - sz / 2, p.y - sz / 2, sz, sz * im.height / im.width); ctx.globalAlpha = 1;
        return;
      }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += halfW() * 2.2 * dt * (p.kind === 'plus' ? 1 : -0.2);
      ctx.globalAlpha = 1 - k;
      if (p.kind === 'plus') { ctx.fillStyle = p.hue; star(p.x, p.y, p.size, p.size * .45); }
      else { ctx.fillStyle = 'rgba(235,235,240,.9)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 + k), 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
    });
  }
  function star(x, y, ro, rin) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = Math.PI * i / 5 - Math.PI / 2, r = i % 2 ? rin : ro; ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); }
    ctx.fill();
  }

  function badge(x, y, t, color, fs) {
    ctx.font = `800 ${fs}px "M PLUS Rounded 1c", sans-serif`;
    const w = ctx.measureText(t).width + fs * 1.0, h = fs * 1.35;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (IMG.ui_badge) {
      const bw = w + fs * 0.6, bh = h * 1.25;
      ctx.drawImage(IMG.ui_badge, x - bw / 2, y - bh / 2, bw, bh);
      ctx.lineWidth = fs * 0.2; ctx.strokeStyle = color; ctx.strokeText(t, x, y + fs * .04);
      ctx.fillStyle = '#fff'; ctx.fillText(t, x, y + fs * .04);
      return;
    }
    ctx.fillStyle = color; rrect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillText(t, x, y + fs * .04);
  }

  function bossGeom() {
    const d = (CNT() + 1) * G - cam, s = scaleAt(d), y = yAt(d), size = halfW() * 1.1 * s;
    return { d, s, y, size, cx: W / 2, cy: y - size * 0.65 };
  }

  function drawBoss(d) {
    const s = scaleAt(d), y = yAt(d), hw = halfW();
    const size = hw * 1.1 * s;
    const im = IMG['boss' + bossKind];
    ctx.save();
    if (roar > 0) {                                   // ほえる：ふくらむ
      const k = 1 + Math.sin(Math.min(1, roar) * Math.PI) * 0.12;
      ctx.translate(W / 2, y); ctx.scale(k, k); ctx.translate(-W / 2, -y);
    }
    if (hurt > 0) ctx.translate(Math.sin(performance.now() / 22) * size * 0.04 * hurt, 0);   // こうげきを うけて ゆれる
    if (bossFall > 0) {
      ctx.globalAlpha = Math.max(0, 1 - bossFall);
      ctx.translate(W / 2, y); ctx.rotate(bossFall * 1.2); ctx.translate(-W / 2, -y + bossFall * size * 0.3);
    } else if (mode === 'battle' && adv >= 1) {
      ctx.translate(Math.sin(performance.now() / 40) * size * 0.02, 0); // ぶるぶる
    }
    if (im) {
      const h = size * 1.3, w = h * im.width / im.height;
      ctx.drawImage(im, W / 2 - w / 2, y - h, w, h);
      if (glow > 0) {                                 // かちの まえ：ひかる
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, glow) * 0.8;
        const gr = ctx.createRadialGradient(W / 2, y - h * .5, 0, W / 2, y - h * .5, h * .7);
        gr.addColorStop(0, 'rgba(255,255,230,1)'); gr.addColorStop(1, 'rgba(255,220,120,0)');
        ctx.fillStyle = gr; ctx.fillRect(W / 2 - h, y - h * 1.2, h * 2, h * 1.4);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      }
    } else {
      // かりの ボス（おおきな くも）
      const x = W / 2;
      ctx.fillStyle = '#8B5CF6';
      ctx.beginPath(); ctx.ellipse(x, y - size * .55, size * .62, size * .55, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(x - size * .38, y - size * .95, size * .2, 0, 7); ctx.arc(x + size * .38, y - size * .95, size * .2, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x - size * .2, y - size * .65, size * .12, 0, 7); ctx.arc(x + size * .2, y - size * .65, size * .12, 0, 7); ctx.fill();
      ctx.fillStyle = '#23324A';
      ctx.beginPath(); ctx.arc(x - size * .18, y - size * .63, size * .06, 0, 7); ctx.arc(x + size * .18, y - size * .63, size * .06, 0, 7); ctx.fill();
      ctx.strokeStyle = '#23324A'; ctx.lineWidth = Math.max(2, size * .03);
      ctx.beginPath(); ctx.arc(x, y - size * .36, size * .16, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    }
    if (eyes > 0 && bossFall <= 0) {
      const ey = y - size * 1.3 * 0.74, ex = size * 0.13;
      ctx.globalCompositeOperation = 'lighter';
      [-1, 1].forEach(sd => {
        const gr = ctx.createRadialGradient(W / 2 + sd * ex, ey, 0, W / 2 + sd * ex, ey, size * 0.12);
        gr.addColorStop(0, `rgba(255,80,60,${eyes})`); gr.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(W / 2 + sd * ex, ey, size * 0.12, 0, 7); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
    if (bossFall >= 1) return;
    if (mode === 'battle' || mode === 'result') hpBar(W / 2, y - size * 1.42, Math.max(180, size * 1.15), bossShown, stage.boss);
    else badge(W / 2, y - size * 1.35, 'ボス ' + Math.max(0, Math.round(bossShown)), '#C2410C', Math.max(12, hw * 0.075 * Math.max(s, .55)));
  }

  function hpBar(x, y, w, v, max) {
    const h = Math.max(20, w * 0.11), r = Math.max(0, Math.min(1, v / max));
    ctx.fillStyle = 'rgba(20,10,30,.8)'; rrect(x - w / 2 - 3, y - h / 2 - 3, w + 6, h + 6, h / 2 + 3); ctx.fill();
    const gr = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    gr.addColorStop(0, '#FF3B3B'); gr.addColorStop(1, '#FFB23B');
    if (r > 0) { ctx.fillStyle = gr; rrect(x - w / 2, y - h / 2, Math.max(h, w * r), h, h / 2); ctx.fill(); }
    ctx.strokeStyle = '#FFE9A8'; ctx.lineWidth = 2; rrect(x - w / 2 - 3, y - h / 2 - 3, w + 6, h + 6, h / 2 + 3); ctx.stroke();
    const t = 'ボス ' + Math.max(0, Math.round(v));
    ctx.font = `800 ${h * 0.82}px "M PLUS Rounded 1c", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 4; ctx.strokeStyle = '#3A0A0A'; ctx.strokeText(t, x, y + 1); ctx.fillStyle = '#fff'; ctx.fillText(t, x, y + 1);
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - (frame.last || now)) / 1000); frame.last = now;
    if (mode === 'run') update(dt);
    if (mode === 'battle') updateBattle(dt);
    sideX += (side - sideX) * Math.min(1, dt * 10);

    let shook = false;
    if (shakeT > 0) {
      shakeT -= dt; shook = true; ctx.save();
      ctx.translate((Math.random() - .5) * shakeA * 2, (Math.random() - .5) * shakeA * 2);
      if (shakeT <= 0) shakeA = 0;
    }
    drawBg(); drawRoad(); drawTrees();
    if (stage) {
      const bossD = (CNT() + 1) * G - cam;
      if (bossD < 9) drawBoss(bossD);
      for (let i = stage.gates.length - 1; i >= 0; i--) {
        const d = (i + 1) * G - cam;
        if (d < 9 && d > -0.4) drawGate(i, d);
      }
      if (mode !== 'title') drawCrowd(now);
      drawParts(now, dt);
      if (mode === 'battle' || mode === 'result') drawBattleFx(now, dt);
    }
    if (shook) ctx.restore();
    if (darken > 0) { ctx.fillStyle = `rgba(10,5,25,${darken})`; ctx.fillRect(0, 0, W, H); }
    if (stage && (mode === 'battle' || mode === 'result')) drawBanner();
    if (stage && (mode === 'run' || mode === 'battle')) drawBoostZone();
    requestAnimationFrame(frame);
  }

  // うえの「はやく」ゾーンの めじるし
  function drawBoostZone() {
    const y = boostLine(), on = mode === 'battle' ? bboost > 0 : boost > 0;
    ctx.fillStyle = on ? 'rgba(255,215,90,.22)' : 'rgba(255,255,255,.10)';
    ctx.fillRect(0, 56, W, y - 56);
    ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); ctx.setLineDash([]);
    const fs = Math.max(13, Math.min(20, W * 0.022));
    ctx.font = `800 ${fs}px "M PLUS Rounded 1c", sans-serif`; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(20,30,60,.7)';
    const t = mode === 'battle' ? (on ? '▲▲ はやおくり！' : '▲ ここを タップで はやおくり') : (on ? '▲▲ はやく！' : '▲ ここを タップで はやく');
    ctx.strokeText(t, W - 12, y - 6); ctx.fillStyle = on ? '#FFE27A' : '#fff'; ctx.fillText(t, W - 12, y - 6);
  }

  /* ---- うごき ---- */
  // タップすると しばらく はやく なる
  let boost = 0;
  function boostMul(dt) { if (boost > 0) { boost -= dt; return 3.5; } return 1; }
  function update(dt) {
    if (popTimer > 0 && (popTimer -= dt) <= 0) $('pop').hidden = true;
    if (next < CNT()) {
      const D = (next + 1) * G, d = D - cam;
      // えらんだ がわに いたまま 自動で すすむ（タップで かそく）
      if (d <= 0) { passGate(); return; }
      cam += G / SPEED_T[0] * boostMul(dt) * dt;
      if (cam > D) cam = D;
    } else {
      $('hint').hidden = true;
      const D = (CNT() + 1) * G - 0.55;
      // さいごの もんだいが おわったら ボスまで 自動で かそく
      boostMul(dt);
      cam += G / SPEED_T[0] * dt * 4;
      if (cam >= D) { cam = D; startBattle(); }
    }
  }

  function passGate() {
    waiting = false;
    const g = stage.gates[next];
    const mine = side < 0 ? g.L : g.R, other = side < 0 ? g.R : g.L;
    const dm = GATE.eff(mine), dothers = GATE.eff(other);
    const vm = GATE.sum(mine), vo = GATE.sum(other);
    const before = n;
    n = before + dm;
    const good = dm > dothers;
    if (good) correct++;
    log.push({ side, before, mine, other, after: n, good });
    const say = (op, v) => op.neg ? `${GATE.text(op)} → ${-v}にん へる` : `${GATE.text(op)} ＝ ${v}`;
    const f = say(mine, vm);
    const otherTxt = `${side < 0 ? 'みぎ' : 'ひだり'}は ${say(other, vo)} だったよ`;
    const ch = dm >= 0 ? `＋${dm}にん` : `−${-dm}にん`;
    $('pop').innerHTML = `<div class="f">${f}</div>` +
      (good ? `<div class="ok">${before} ${dm < 0 ? '−' : '＋'} ${Math.abs(dm)} ＝ ${n}にん・${mine.neg ? 'へりが すくない ほう・' : ''}せいかい！</div>` : `<div class="ng">${before} ${dm < 0 ? '−' : '＋'} ${Math.abs(dm)} ＝ ${n}にん・おしい！</div><div class="other">${otherTxt}</div>`);
    $('pop').hidden = false; $('pop').style.animation = 'none'; void $('pop').offsetWidth; $('pop').style.animation = '';
    popTimer = good ? 1.1 : 2.0;
    good ? (dm >= 0 ? Snd.up() : Snd.down()) : Snd.ng();
    flash = { i: next, side, t: performance.now() };
    burst(dm >= 0 ? 'plus' : 'minus');
    next++;
    $('gatecount').textContent = next < CNT() ? `ゲート ${next + 1}/${CNT()}` : 'ボス！';
  }

  /* ---- ボス戦（たたかい） ---- */
  const battle = { from: 0, hit: 0 };
  let bt = 0, bboost = 0, shakeT = 0, shakeA = 0, fx = [], banner = null, darken = 0, glow = 0, hop = 0, hurt = 0, roar = 0;
  let events = [], tEnd = 0, eyes = 0;
  const shake = (a, d = 0.25) => { shakeA = Math.max(shakeA, a); shakeT = Math.max(shakeT, d); };
  const split = (total, k) => { const a = []; for (let i = 0; i < k; i++) a.push(Math.floor(total / k) + (i < total % k ? 1 : 0)); return a; };
  const say = (text, color) => { banner = { text, color, t: performance.now() }; };

  function startBattle() {
    mode = 'battle'; bt = 0; bboost = 0;
    $('pop').hidden = true; $('hint').hidden = true; Snd.boss();
    const A = n, B = stage.boss, m = Math.min(A, B);
    battle.from = A; battle.win = A > B; battle.m = m; battle.tie = A === B; side = 0;
    bossShown = B; fx = []; banner = null; darken = 0; glow = 0; hop = 0; hurt = 0; roar = 0; eyes = 0;
    // とつげき K回 ＋ ボスの はんげき J回。へる数の 合計は ルールどおり（かち：ボス B・なかま B ／ まけ：なかま A ぜんぶ）
    // おなじ数のときは ボスを HP 1、なかまを 数人 のこして 止め、さいごの 一撃で まける
    const keep = battle.tie ? Math.min(m, Math.max(1, Math.min(3, Math.ceil(m * 0.15)))) : 0;
    battle.keep = keep;
    const dmgT = battle.tie ? m - 1 : m, lossT = m - keep;
    const K = Math.max(1, Math.max(Math.min(dmgT, 3), Math.min(8, Math.ceil(dmgT / 3))));
    const J = lossT - K >= 2 ? Math.max(1, Math.floor(K / 3)) : 0;
    const cl = J ? Math.max(J, Math.min(lossT - K, Math.round(lossT * 0.3))) : 0;
    const dmg = split(dmgT, K), lossC = split(lossT - cl, K), lossJ = split(cl, J);
    const gap = Math.min(0.72, 3.6 / K);
    events = [];
    for (let k = 0; k < K; k++) events.push({ at: 1.3 + k * gap, type: 'charge', dmg: dmg[k], loss: lossC[k] });
    for (let j = 0; j < J; j++) events.push({ at: 1.3 + (Math.floor((j + 0.5) * K / J) + 0.45) * gap, type: 'counter', loss: lossJ[j] });
    events.sort((x, y) => x.at - y.at);
    tEnd = events[events.length - 1].at + 0.9;
  }

  function knightFront() {          // 隊列の まえの はしの 位置
    const { x, y, sc } = crowdPos(), r = halfW() * 0.11 * sc;
    return { x, y, r };
  }

  function updateBattle(dt) {
    const mul = bboost > 0 ? 2.4 : 1;
    if (bboost > 0) bboost -= dt;
    const step = dt * mul;
    bt += step;
    adv = Math.min(1, bt / 0.9);
    if (hurt > 0) hurt = Math.max(0, hurt - step * 3);
    if (bt > 0.45 && !battle.go) { battle.go = true; say('たたかえ！', '#FFD43B'); }
    // できごと
    for (const e of events) {
      if (e.done || bt < e.at) continue;
      e.done = true;
      const B = bossGeom(), K = knightFront();
      if (e.type === 'charge') {
        n = Math.max(0, n - e.loss);
        const c = Math.max(1, Math.min(4, e.loss));
        for (let i = 0; i < c; i++) {
          fx.push({ type: 'charger', s: bt + i * 0.06, dur: 0.42, x0: K.x + (i - (c - 1) / 2) * K.r * 1.3, y0: K.y - K.r * 0.2, r0: K.r,
            x1: B.cx + (i - (c - 1) / 2) * B.size * 0.18, y1: B.y - B.size * 0.4, r1: halfW() * 0.11 * B.s, dmg: i === 0 ? e.dmg : 0 });
        }
      } else {
        Snd.throw();
        fx.push({ type: 'shot', s: bt, dur: 0.6, x0: B.cx, y0: B.cy, x1: K.x, y1: K.y - K.r, loss: e.loss, size: B.size * 0.16, kind: bossKind });
        roar = 0.01;
      }
    }
    if (roar > 0) roar = roar >= 1 ? 0 : Math.min(1, roar + step * 2.5);
    // とつげき・たま の すすみ
    fx.forEach(f => {
      if (f.hitDone || f.type === 'slash' || f.type === 'flyer') return;
      if (bt - f.s >= f.dur) {
        f.hitDone = true;
        if (f.type === 'charger') {
          if (f.dmg) { bossShown = Math.max(battle.tie ? 1 : stage.boss - battle.m, bossShown - f.dmg); hurt = 1; shake(6, .2); Snd.slash(); }
          fx.push({ type: 'slash', s: bt, dur: 0.28, x: f.x1, y: f.y1 - f.r1 * 1.2, R: Math.max(30, bossGeom().size * 0.32), rot: Math.random() * Math.PI });
          sparks(f.x1, f.y1 - f.r1, 9);
        } else {
          n = Math.max(0, n - f.loss); shake(8, .25); Snd.thud();
          parts.push({ img: 'minus', x: f.x1, y: f.y1, t: performance.now(), life: 600, size: halfW() * 0.5 });
          for (let i = 0; i < Math.max(1, Math.min(3, f.loss)); i++)
            fx.push({ type: 'flyer', s: bt, dur: 0.9, x: f.x1 + (Math.random() - .5) * 40, y: f.y1, vx: (Math.random() < .5 ? -1 : 1) * (120 + Math.random() * 160), vy: -(380 + Math.random() * 200), r: knightFront().r });
        }
      }
    });
    fx = fx.filter(f => !(f.hitDone && (f.type === 'charger' || f.type === 'shot')) && !(f.dur && (f.type === 'slash' || f.type === 'flyer') && bt - f.s > f.dur));
    // けっちゃく
    if (bt >= tEnd && battle.tie) {
      // あいうち…？ → ボスが ぐらっと うごき 目が ひかる → さいごの 一撃
      const e0 = bt - tEnd;
      bossShown = 1;
      if (!battle.ai) { battle.ai = true; n = battle.keep; say('あいうち…？', '#FFFFFF'); }
      if (e0 > 0.9) { eyes = Math.min(1, (e0 - 0.9) / 0.4); hurt = Math.max(hurt, 0.5); }
      if (e0 > 1.2 && !battle.stir) { battle.stir = true; roar = 0.01; Snd.roar(); shake(5, .3); }
      if (e0 > 1.6 && !battle.last) {
        battle.last = true; Snd.throw();
        const B = bossGeom(), K = knightFront();
        fx.push({ type: 'shot', s: bt, dur: 0.5, x0: B.cx, y0: B.cy, x1: K.x, y1: K.y - K.r, loss: battle.keep, size: B.size * 0.26, kind: bossKind });
      }
    }
    if (bt >= tEnd + (battle.tie ? 2.3 : 0)) {
      n = battle.win ? battle.from - battle.m : 0;
      bossShown = battle.tie ? 1 : stage.boss - battle.m;
      const e = bt - tEnd - (battle.tie ? 2.3 : 0);
      if (battle.win) {
        glow = Math.min(1, e / 0.6);
        if (e > 0.6 && !battle.boom) {
          battle.boom = true; glow = 0; shake(16, .5); Snd.boom();
          const B = bossGeom();
          parts.push({ img: 'plus', x: B.cx, y: B.cy, t: performance.now(), life: 900, size: B.size * 2.2 });
          sparks(B.cx, B.cy, 30); hop = 1; say('しょうり！', '#FFD43B'); confetti();
          setTimeout(() => Snd.cry(), 250);
        }
        if (e > 0.7) bossFall = Math.min(1, (e - 0.7) / 0.7);
        if (e > 2.4) finish(true);
      } else {
        knock = Math.min(1, e / 0.6);
        if (e > 0.4 && !battle.roared) { battle.roared = true; roar = 0.01; shake(10, .5); Snd.roar(); say('まけ…', '#B9A7FF'); }
        darken = Math.min(0.38, e * 0.4);
        if (e > 2.2) finish(false);
      }
    }
  }

  function finish(win) {
    if (mode !== 'battle') return;
    mode = 'result'; showResult(win);
  }

  function sparks(x, y, c) {
    for (let i = 0; i < c; i++) {
      const a = Math.random() * Math.PI * 2, v = 160 + Math.random() * 320;
      fx.push({ type: 'spark', t: performance.now(), life: 450, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120 });
    }
  }
  function confetti() {
    const cols = ['#FF5C8A', '#FFD43B', '#4DD4FF', '#7CE36D', '#B197FC', '#FF9F43'];
    for (let i = 0; i < 90; i++) fx.push({ type: 'conf', t: performance.now() + Math.random() * 600, life: 2600, x: Math.random() * W, y: -20 - Math.random() * H * .3,
      vx: (Math.random() - .5) * 60, vy: 120 + Math.random() * 160, rot: Math.random() * 6, vr: (Math.random() - .5) * 10, c: cols[i % cols.length], w: 6 + Math.random() * 6 });
  }

  function drawBattleFx(now, dt) {
    fx = fx.filter(f => !(f.life && now - f.t > f.life));
    for (const f of fx) {
      if (f.type === 'charger') {
        const k = Math.max(0, Math.min(1, (bt - f.s) / f.dur));
        if (bt < f.s) continue;
        const x = f.x0 + (f.x1 - f.x0) * k, y = f.y0 + (f.y1 - f.y0) * k - Math.sin(k * Math.PI) * f.r0 * 1.2;
        blob(x, y, f.r0 + (f.r1 - f.r0) * k, (now / 90) % 2 > 1 ? 1 : 0);
      } else if (f.type === 'shot') {
        const k = Math.max(0, Math.min(1, (bt - f.s) / f.dur));
        const x = f.x0 + (f.x1 - f.x0) * k, y = f.y0 + (f.y1 - f.y0) * k - Math.sin(k * Math.PI) * halfW() * 0.35, r = f.size * (0.6 + k * 0.7);
        const col = f.kind === 1 ? ['#FFF3B0', '#FF7A1A', 'rgba(255,80,0,0)'] : f.kind === 2 ? ['#E8E2D6', '#8C8577', 'rgba(90,80,70,0)'] : ['#E6CCFF', '#7B2FF7', 'rgba(60,0,120,0)'];
        for (let tr = 3; tr >= 1; tr--) {    // しっぽ
          const kk = Math.max(0, k - tr * 0.05), tx = f.x0 + (f.x1 - f.x0) * kk, ty = f.y0 + (f.y1 - f.y0) * kk - Math.sin(kk * Math.PI) * halfW() * 0.35;
          ctx.globalAlpha = 0.25 / tr * 2; ctx.fillStyle = col[1]; ctx.beginPath(); ctx.arc(tx, ty, r * (1 - tr * 0.15), 0, 7); ctx.fill();
        }
        ctx.globalAlpha = 1;
        const gr = ctx.createRadialGradient(x, y, 0, x, y, r * 1.6);
        gr.addColorStop(0, col[0]); gr.addColorStop(0.45, col[1]); gr.addColorStop(1, col[2]);
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, 7); ctx.fill();
      } else if (f.type === 'slash') {
        const k = (bt - f.s) / f.dur; if (k < 0 || k > 1) continue;
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
        ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 18; ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineCap = 'round';
        [[1, 0], [-1, 0.5]].forEach(([dir, off]) => {
          ctx.lineWidth = Math.max(2, f.R * 0.12 * (1 - k));
          ctx.beginPath(); ctx.arc(0, 0, f.R * (0.8 + k * 0.3), off + dir * (-1.1 + k * 0.6), off + dir * (0.6 + k * 1.2), dir < 0); ctx.stroke();
        });
        ctx.restore();
      } else if (f.type === 'flyer') {
        const k = (bt - f.s) / f.dur, t = bt - f.s; if (k < 0 || k > 1) continue;
        ctx.save(); ctx.globalAlpha = 1 - k; ctx.translate(f.x + f.vx * t, f.y + f.vy * t + 700 * t * t); ctx.rotate(t * 8 * Math.sign(f.vx));
        blob(0, f.r, f.r, 0); ctx.restore();
      } else if (f.type === 'spark') {
        const t = (now - f.t) / 1000, k = (now - f.t) / f.life;
        const x = f.x + f.vx * t, y = f.y + f.vy * t + 500 * t * t;
        ctx.strokeStyle = `rgba(255,${200 + Math.floor(55 * (1 - k))},90,${1 - k})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - f.vx * 0.03, y - f.vy * 0.03); ctx.stroke();
      } else if (f.type === 'conf') {
        if (now < f.t) continue;
        const t = (now - f.t) / 1000;
        ctx.save(); ctx.translate(f.x + f.vx * t + Math.sin(t * 3 + f.rot) * 20, f.y + f.vy * t); ctx.rotate(f.rot + f.vr * t);
        ctx.fillStyle = f.c; ctx.fillRect(-f.w / 2, -f.w * 0.3, f.w, f.w * 0.6); ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawBanner() {
    if (!banner) return;
    const age = (performance.now() - banner.t) / 1000;
    if (age > 1.2 && (banner.text === 'たたかえ！' || banner.text === 'あいうち…？')) { banner = null; return; }
    const sc = age < 0.25 ? 0.4 + age / 0.25 * 0.75 : age < 0.4 ? 1.15 - (age - 0.25) / 0.15 * 0.15 : 1;
    const a = (banner.text === 'たたかえ！' || banner.text === 'あいうち…？') ? Math.max(0, Math.min(1, (1.2 - age) / 0.3)) : 1;
    const fs = Math.min(W * 0.13, H * 0.13, 110) * sc;
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${fs}px "M PLUS Rounded 1c", sans-serif`;
    const y = H * 0.3;
    ctx.lineJoin = 'round'; ctx.lineWidth = fs * 0.2; ctx.strokeStyle = '#2A1240'; ctx.strokeText(banner.text, W / 2, y);
    ctx.lineWidth = fs * 0.08; ctx.strokeStyle = '#FFFFFF'; ctx.strokeText(banner.text, W / 2, y);
    ctx.fillStyle = banner.color; ctx.fillText(banner.text, W / 2, y);
    ctx.restore();
  }

  function showResult(win) {
    $('hud').hidden = true; $('hint').hidden = true;
    win ? Snd.win() : Snd.lose();
    const stars = win ? (correct === CNT() ? 3 : correct === CNT() - 1 ? 2 : 1) : 0;
    $('res-title').textContent = win ? 'かち！ 🎉' : 'まけ…';
    $('res-stars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    $('res-text').innerHTML = `なかま ${battle.from}にん と ボス ${stage.boss} … ${win ? 'かった！' : battle.from === stage.boss ? 'おしい！ おなじ かずだと ボスの かち' : 'とどかなかった…'}<br>せいかい ${correct} / ${CNT()}`;
    const lab = op => op.neg ? `${GATE.text(op)} → ${-GATE.sum(op)}にん へる` : `${GATE.text(op)} ＝ ${GATE.sum(op)}`;
    $('res-log').innerHTML = log.map(e => `<li class="${e.good ? '' : 'ng'}">${lab(e.mine)}　${e.good ? '○' : '× （' + lab(e.other) + ' の ほうが よかった）'}</li>`).join('');
    try {
      const key = 'gate_best_' + stage.key;
      if (stars > +(localStorage.getItem(key) || 0)) localStorage.setItem(key, stars);
    } catch (e) {}
    $('result').hidden = false;
  }

  function begin(newStage) {
    if (newStage || !stage) stage = GATE.makeStage(ty, df, LENS[sp]);
    bossKind = 1 + Math.floor(Math.random() * 3);
    cam = -0.6; n = stage.start; side = -1; sideX = -1; next = 0; waiting = false; boost = 0;
    log = []; correct = 0; popTimer = 0; bossShown = stage.boss;
    shownN = 0; spawnT.length = 0; fadeOuts.length = 0; parts = []; flash = null; adv = 0; knock = 0; bossFall = 0;
    fx = []; banner = null; darken = 0; glow = 0; hop = 0; hurt = 0; roar = 0; shakeT = 0; shakeA = 0; bt = 0; bboost = 0;
    battle.go = battle.boom = battle.roared = battle.ai = battle.stir = battle.last = false; eyes = 0;
    $('title').hidden = true; $('result').hidden = true; $('pop').hidden = true;
    $('hud').hidden = false; $('gatecount').textContent = `ゲート 1/${CNT()}`;
    $('hint').textContent = 'したを タップで ひだり・みぎ ／ うえ（そら）を タップで はやく'; $('hint').hidden = false;
    mode = 'run';
  }

  function toTitle() {
    mode = 'title'; stage = GATE.makeStage(ty, df, LENS[sp]);
    adv = 0; knock = 0; bossFall = 0; parts = [];
    fx = []; banner = null; darken = 0; glow = 0; hop = 0; hurt = 0; roar = 0; shakeT = 0;
    $('hud').hidden = true; $('hint').hidden = true; $('pop').hidden = true; $('result').hidden = true;
    $('title').hidden = false;
    renderTitle();
  }

  function renderTitle() {
    document.querySelectorAll('#ty button').forEach(b => b.classList.toggle('on', +b.dataset.v === ty));
    document.querySelectorAll('#lv button').forEach(b => b.classList.toggle('on', +b.dataset.v === df));
    document.querySelectorAll('#sp button').forEach(b => b.classList.toggle('on', +b.dataset.v === sp));
    let s = '';
    try { const v = +(localStorage.getItem(`gate_best_${ty}_${df}_${LENS[sp]}`) || 0); s = v ? `${GATE.TYPES[ty]}・${GATE.DIFFS[df]}・${LENS[sp]}もん ${'★'.repeat(v)}` : ''; } catch (e) {}
    $('best').textContent = s ? 'きろく：' + s : '';
  }

  /* ---- そうさ ---- */
  cv.addEventListener('pointerdown', e => {
    if (mode === 'battle') { if (e.clientY < boostLine()) { bboost = 1.2; Snd.tap(); } return; }
    if (mode !== 'run') return;
    // うえの ほう（空）を タップ → かそく ／ したの ほう → ひだり・みぎを えらぶ（かそく しない）
    if (e.clientY < boostLine()) boost = 0.7;
    else if (next < CNT()) side = e.clientX < W / 2 ? -1 : 1;
    $('hint').hidden = true;
    Snd.tap();
  });
  addEventListener('keydown', e => {
    if (mode !== 'run') return;
    if (e.key === 'ArrowLeft') side = -1; else if (e.key === 'ArrowRight') side = 1;
    else if (e.key === 'ArrowUp' || e.key === ' ') boost = 0.7; else return;
  });
  document.querySelectorAll('#ty button').forEach(b => b.addEventListener('click', () => { ty = +b.dataset.v; Snd.tap(); try { localStorage.setItem('gate_ty', ty); } catch (e) {} renderTitle(); }));
  document.querySelectorAll('#lv button').forEach(b => b.addEventListener('click', () => { df = +b.dataset.v; Snd.tap(); try { localStorage.setItem('gate_df', df); } catch (e) {} renderTitle(); }));
  document.querySelectorAll('#sp button').forEach(b => b.addEventListener('click', () => { sp = +b.dataset.v; Snd.tap(); try { localStorage.setItem('gate_len', sp); } catch (e) {} renderTitle(); }));
  $('btn-start').addEventListener('click', () => { Snd.tap(); begin(true); });
  $('btn-retry').addEventListener('click', () => { Snd.tap(); begin(false); });
  $('btn-new').addEventListener('click', () => { Snd.tap(); begin(true); });
  $('btn-title').addEventListener('click', () => { Snd.tap(); toTitle(); });
  $('btn-home').addEventListener('click', () => { Snd.tap(); toTitle(); });

  // タイトルの うしろで 道を ながしておく
  stage = GATE.makeStage(ty, df, LENS[sp]);
  (function idle() { if (mode === 'title') { cam += 0.01; if (cam > 6) cam = 0; } requestAnimationFrame(idle); })();
  renderTitle();
  requestAnimationFrame(frame);
  if (/[?&]test=1/.test(location.search)) window.__gate = { get stage() { return stage; }, get n() { return n; }, get mode() { return mode; }, get next() { return next; }, get waiting() { return waiting; }, get bt() { return bt; }, get bossHP() { return bossShown; }, get tEnd() { return tEnd; }, setN(v) { n = v; } };
})();
