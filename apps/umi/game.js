// うみの うちあい — 10×10 の海戦ゲーム（コンピューターと対戦）
'use strict';

/* ================= ロジック（画面なしでも動く） ================= */
const UMI = (() => {
  const N = 10;
  const LENS = [5, 4, 3, 3, 2];
  let STRONG_SLACK = 0.8;
  const ROWS = 'ABCDEFGHIJ';
  const label = (r, c) => ROWS[r] + '-' + (c + 1);
  const inb = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
  const ri = n => Math.floor(Math.random() * n);

  // 船をランダムに置く。grid[r][c] = 船の番号 or -1
  function place() {
    for (;;) {
      const grid = Array.from({ length: N }, () => Array(N).fill(-1));
      const ships = [];
      let ok = true;
      for (let i = 0; i < LENS.length && ok; i++) {
        const len = LENS[i];
        let placed = false;
        for (let t = 0; t < 200 && !placed; t++) {
          const v = Math.random() < 0.5;
          const r = ri(v ? N - len + 1 : N), c = ri(v ? N : N - len + 1);
          const cells = [];
          for (let k = 0; k < len; k++) cells.push(v ? [r + k, c] : [r, c + k]);
          if (cells.every(([a, b]) => grid[a][b] < 0)) {
            cells.forEach(([a, b]) => (grid[a][b] = i));
            ships.push({ len, r, c, v, cells, hits: 0, sunk: false });
            placed = true;
          }
        }
        if (!placed) ok = false;
      }
      if (ok) return { grid, ships };
    }
  }

  function newSide() {
    const { grid, ships } = place();
    return { grid, ships, shot: Array.from({ length: N }, () => Array(N).fill(null)), hint: {} };
  }

  // まわり8マスの船マスの数
  function around(side, r, c) {
    let n = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const a = r + dr, b = c + dc;
      if (inb(a, b) && side.grid[a][b] >= 0) n++;
    }
    return n;
  }

  // うつ → {kind:'hit'|'miss', ship, sunk, count, over}
  function fire(side, r, c) {
    if (side.shot[r][c]) return null;
    const id = side.grid[r][c];
    if (id >= 0) {
      side.shot[r][c] = 'hit';
      const s = side.ships[id];
      s.hits++;
      if (s.hits === s.len) s.sunk = true;
      return { kind: 'hit', ship: s, sunk: s.sunk, over: side.ships.every(x => x.sunk) };
    }
    side.shot[r][c] = 'miss';
    const count = around(side, r, c);
    side.hint[r + ',' + c] = count;
    return { kind: 'miss', count, over: false };
  }

  function neighbors8(r, c) {
    const out = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++)
      if ((dr || dc) && inb(r + dr, c + dc)) out.push([r + dr, c + dc]);
    return out;
  }

  // 見えている情報だけで「ぜったいに いない」マス
  // simple=true: 0 のまわりだけ（子ども向けガイド）
  function knownEmpty(side, simple) {
    const empty = new Set();
    for (const key in side.hint) {
      const [r, c] = key.split(',').map(Number);
      const n = side.hint[key];
      const nb = neighbors8(r, c);
      if (simple) {
        if (n === 0) nb.forEach(([a, b]) => { if (!side.shot[a][b]) empty.add(a + ',' + b); });
      } else {
        const hits = nb.filter(([a, b]) => side.shot[a][b] === 'hit').length;
        if (hits === n) nb.forEach(([a, b]) => { if (!side.shot[a][b]) empty.add(a + ',' + b); });
      }
    }
    return empty;
  }

  // コンピューターの一手。side = 子どもの海（コンピューターから見えるのは shot / hint / 沈んだ船だけ）
  function cpuMove(side, level) {
    const free = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!side.shot[r][c]) free.push([r, c]);
    if (level === 0) return free[ri(free.length)];
    // つよい でも ときどき ふつうの うちかたに する（子どもが かてる くらいに）
    if (level === 2 && Math.random() < STRONG_SLACK) level = 1;

    const sunkCells = new Set();
    side.ships.forEach(s => { if (s.sunk) s.cells.forEach(([a, b]) => sunkCells.add(a + ',' + b)); });
    const open = []; // 沈んでいない船の あたりマス
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++)
      if (side.shot[r][c] === 'hit' && !sunkCells.has(r + ',' + c)) open.push([r, c]);
    const empty = level >= 2 ? knownEmpty(side, false) : new Set();
    const usable = ([r, c]) => inb(r, c) && !side.shot[r][c] && !empty.has(r + ',' + c);

    // ねらいうち：あたりのとなり
    let cand = [];
    if (open.length) {
      const key = new Set(open.map(([a, b]) => a + ',' + b));
      // 2つ以上ならんでいたら、その線の先
      for (const [r, c] of open) {
        for (const [dr, dc] of [[0, 1], [1, 0]]) {
          if (key.has((r + dr) + ',' + (c + dc))) {
            let a = r, b = c;
            while (key.has(a + ',' + b)) { a -= dr; b -= dc; }
            if (usable([a, b])) cand.push([a, b]);
            a = r; b = c;
            while (key.has(a + ',' + b)) { a += dr; b += dc; }
            if (usable([a, b])) cand.push([a, b]);
          }
        }
      }
      if (!cand.length) {
        for (const [r, c] of open)
          for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]])
            if (usable([r + dr, c + dc])) cand.push([r + dr, c + dc]);
      }
    }
    if (!cand.length) cand = free.filter(usable);
    if (!cand.length) cand = free;
    if (level === 1) return cand[ri(cand.length)];

    // つよい：おける船の数（密度）＋ ヒント数字で重みづけ
    const rest = side.ships.filter(s => !s.sunk).map(s => s.len);
    const blocked = (r, c) => side.shot[r][c] === 'miss' || sunkCells.has(r + ',' + c) || empty.has(r + ',' + c);
    const dens = Array.from({ length: N }, () => Array(N).fill(0));
    for (const len of rest) {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) for (const v of [0, 1]) {
        const cells = [];
        for (let k = 0; k < len; k++) cells.push(v ? [r + k, c] : [r, c + k]);
        if (!cells.every(([a, b]) => inb(a, b) && !blocked(a, b))) continue;
        const cover = cells.filter(([a, b]) => side.shot[a][b] === 'hit').length;
        const w = open.length ? (cover ? 1 + cover * 4 : 0.05) : 1;
        cells.forEach(([a, b]) => { dens[a][b] += w; });
      }
    }
    for (const key in side.hint) {
      const [r, c] = key.split(',').map(Number);
      const nb = neighbors8(r, c);
      const left = side.hint[key] - nb.filter(([a, b]) => side.shot[a][b] === 'hit').length;
      if (left > 0) {
        const un = nb.filter(([a, b]) => !side.shot[a][b] && !empty.has(a + ',' + b));
        un.forEach(([a, b]) => { dens[a][b] *= 1 + left / Math.max(1, un.length) * 2; });
      }
    }
    let best = -1, picks = [];
    for (const [r, c] of cand) {
      const d = dens[r][c];
      if (d > best + 1e-9) { best = d; picks = [[r, c]]; }
      else if (Math.abs(d - best) < 1e-9) picks.push([r, c]);
    }
    return picks[ri(picks.length)];
  }

  return { N, LENS, ROWS, label, place, newSide, around, fire, cpuMove, knownEmpty, neighbors8 };
})();

if (typeof module !== 'undefined') module.exports = UMI;

/* ================= 画面 ================= */
if (typeof document !== 'undefined') (() => {
  const { N, label } = UMI;
  const C = 30, O = 30;
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---- 効果音 ---- */
  const Snd = (() => {
    let ctx = null;
    const ac = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)());
    function tone(f, d, type = 'sine', vol = .18, when = 0, f2) {
      try {
        const a = ac(), t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
        o.type = type; o.frequency.setValueAtTime(f, t);
        if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
        o.connect(g).connect(a.destination); o.start(t); o.stop(t + d);
      } catch (e) {}
    }
    function noise(d, vol = .35) {
      try {
        const a = ac(), b = a.createBuffer(1, a.sampleRate * d, a.sampleRate), x = b.getChannelData(0);
        for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / x.length) ** 2;
        const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = 900;
        s.buffer = b; g.gain.value = vol; s.connect(f).connect(g).connect(a.destination); s.start();
      } catch (e) {}
    }
    return {
      hit() { noise(.5); tone(120, .4, 'square', .12, 0, 50); },
      miss() { tone(600, .18, 'sine', .15, 0, 200); tone(400, .15, 'sine', .08, .08, 150); },
      sunk() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .18, 'triangle', .15, i * .1)); },
      turn() { tone(880, .08, 'sine', .08); },
      win() { [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, .22, 'triangle', .16, i * .14)); },
      lose() { [392, 349, 330, 262].forEach((f, i) => tone(f, .3, 'sine', .14, i * .2)); },
      tap() { tone(700, .05, 'sine', .06); },
    };
  })();

  /* ---- SVG 部品 ---- */
  const at = (r, c) => [O + c * C + C / 2, O + r * C + C / 2];
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function star(x, y, ro, rin, n) {
    let p = '';
    for (let i = 0; i < n * 2; i++) {
      const a = Math.PI * i / n - Math.PI / 2, rr = i % 2 ? rin : ro;
      p += (i ? 'L' : 'M') + (x + rr * Math.cos(a)).toFixed(1) + ',' + (y + rr * Math.sin(a)).toFixed(1);
    }
    return p + 'Z';
  }
  function drawHit(g, x, y, anim, small) {
    const w = el('g', { class: anim ? 'pop' : '' }, g);
    const k = small ? 0.55 : 1;
    el('path', { d: star(x, y, 13 * k, 6 * k, 8), fill: '#E24B4A', stroke: '#A32D2D', 'stroke-width': 1 }, w);
    el('path', { d: star(x, y, 6 * k, 3 * k, 8), fill: '#FAC775' }, w);
    return w;
  }
  function drawMiss(g, x, y, n, anim) {
    const w = el('g', { class: anim ? 'pop' : '' }, g);
    el('circle', { cx: x, cy: y, r: 11, fill: '#fff', stroke: '#378ADD', 'stroke-width': 2 }, w);
    if (n !== undefined) {
      const t = el('text', { x, y: y + 5, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 600, fill: '#0C447C' }, w);
      t.textContent = n;
    }
    return w;
  }
  function shipPath(s) {
    const { r, c, len: l, v } = s, W = C - 8, L = l * C - 6;
    if (!v) {
      const x = O + c * C + 3, y = O + r * C + 4;
      return `M${x + 8},${y} L${x + L - 14},${y} Q${x + L},${y + W / 2} ${x + L - 14},${y + W} L${x + 8},${y + W} Q${x},${y + W} ${x},${y + W / 2} Q${x},${y} ${x + 8},${y}Z`;
    }
    const X = O + c * C + 4, Y = O + r * C + 3;
    return `M${X},${Y + 8} L${X},${Y + L - 14} Q${X + W / 2},${Y + L} ${X + W},${Y + L - 14} L${X + W},${Y + 8} Q${X + W},${Y} ${X + W / 2},${Y} Q${X},${Y} ${X},${Y + 8}Z`;
  }
  function drawShip(g, s, cls) {
    const w = el('g', { class: cls || '' }, g);
    el('path', { d: shipPath(s), fill: '#5F5E5A', stroke: '#2C2C2A', 'stroke-width': 1.5 }, w);
    const k = Math.floor(s.len * 0.42);
    const [bx, by] = at(s.v ? s.r + k : s.r, s.v ? s.c : s.c + k);
    if (s.v) el('rect', { x: bx - 6, y: by - 9, width: 12, height: 18, rx: 3, fill: '#B4B2A9' }, w);
    else el('rect', { x: bx - 9, y: by - 6, width: 18, height: 12, rx: 3, fill: '#B4B2A9' }, w);
    for (let i = 0; i < s.len; i++) {
      if (i === k) continue;
      const [px, py] = at(s.v ? s.r + i : s.r, s.v ? s.c : s.c + i);
      el('circle', { cx: px, cy: py, r: 2.5, fill: '#D3D1C7' }, w);
    }
    return w;
  }
  // 盤の土台。layers: cells / ships / guide / marks / frame
  function makeBoard(svg) {
    svg.innerHTML = '';
    const L = {};
    const base = el('g', {}, svg);
    for (let i = 0; i < N; i++) {
      el('text', { x: O + i * C + C / 2, y: 20, 'text-anchor': 'middle', 'font-size': 14, fill: '#4A5A6A' }, base).textContent = i + 1;
      el('text', { x: 15, y: O + i * C + C / 2 + 5, 'text-anchor': 'middle', 'font-size': 14, fill: '#4A5A6A' }, base).textContent = UMI.ROWS[i];
    }
    L.cells = el('g', {}, svg);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++)
      el('rect', { x: O + c * C, y: O + r * C, width: C, height: C, fill: '#E6F1FB', stroke: '#B5D4F4', 'stroke-width': 1, class: 'cell', 'data-r': r, 'data-c': c }, L.cells);
    L.guide = el('g', { 'pointer-events': 'none' }, svg);
    L.frame = el('g', { 'pointer-events': 'none' }, svg);
    L.ships = el('g', { 'pointer-events': 'none' }, svg);
    L.marks = el('g', { 'pointer-events': 'none' }, svg);
    return L;
  }
  function showFrame(L, r, c) {
    L.frame.innerHTML = '';
    const r0 = Math.max(0, r - 1), c0 = Math.max(0, c - 1), r1 = Math.min(N - 1, r + 1), c1 = Math.min(N - 1, c + 1);
    el('rect', {
      x: O + c0 * C, y: O + r0 * C, width: (c1 - c0 + 1) * C, height: (r1 - r0 + 1) * C,
      fill: '#FAEEDA', 'fill-opacity': .45, stroke: '#BA7517', 'stroke-width': 2.5, 'stroke-dasharray': '6 4', class: 'reveal',
    }, L.frame);
  }

  /* ---- 状態 ---- */
  let me, cpu, level = 1, myTurn = false, busy = false, shots = 0, hintHits = 0, over = false;
  let Lsetup, Lcpu, Lme;

  function setupScreen() {
    me = UMI.newSide();
    Lsetup = makeBoard($('b-setup'));
    me.ships.forEach(s => drawShip(Lsetup.ships, s, 'reveal'));
  }

  function fleetIcons(box, side) {
    box.innerHTML = '';
    side.ships.forEach(s => {
      const w = s.len * 14;
      const svg = el('svg', { viewBox: `0 0 ${w} 14`, width: w, height: 14 });
      el('path', { d: `M3,2 L${w - 6},2 Q${w},7 ${w - 6},12 L3,12 Q1,12 1,7 Q1,2 3,2Z`, fill: s.sunk ? '#E0DED6' : '#5F5E5A', stroke: s.sunk ? '#C9C7BE' : '#2C2C2A' }, svg);
      if (s.sunk) el('path', { d: `M2,7 L${w - 2},7`, stroke: '#E24B4A', 'stroke-width': 2 }, svg);
      box.appendChild(svg);
    });
  }

  function setTurn(mine) {
    myTurn = mine;
    const t = $('turn');
    t.hidden = false;
    t.className = 'turn ' + (mine ? 'me' : 'cpu');
    t.textContent = mine ? 'あなたの ばん' : 'コンピューターの ばん…';
    $('cpu-block').classList.toggle('active-me', mine);
    $('me-block').classList.toggle('active-cpu', !mine);
    Snd.turn();
  }

  function msg(html) { $('msg').innerHTML = html; }

  function refreshGuide() {
    Lcpu.guide.innerHTML = '';
    if (level >= 2) return;
    UMI.knownEmpty(cpu, true).forEach(k => {
      const [r, c] = k.split(',').map(Number);
      el('rect', { x: O + c * C + 1, y: O + r * C + 1, width: C - 2, height: C - 2, fill: '#C9D6E2' }, Lcpu.guide);
    });
  }

  function startBattle() {
    cpu = UMI.newSide();
    shots = 0; hintHits = 0; over = false; busy = false;
    $('shots').textContent = 0;
    $('screen-setup').classList.remove('active');
    $('screen-battle').classList.add('active');
    Lcpu = makeBoard($('b-cpu'));
    Lme = makeBoard($('b-me'));
    me.ships.forEach(s => drawShip(Lme.ships, s));
    $('ic-hit').innerHTML = ''; drawHit($('ic-hit'), 15, 15);
    $('ic-miss').innerHTML = ''; drawMiss($('ic-miss'), 15, 15, 2);
    fleetIcons($('fleet-cpu'), cpu);
    fleetIcons($('fleet-me'), me);
    msg('コンピューターの うみの マスを タップして うとう！');
    setTurn(true);
  }

  function missText(who, r, c, n) {
    return `${who}${label(r, c)} は はずれ。<br>まわりの 8マス（てんせんの わく）に ふねが <b class="num">${n}マス</b> ${n ? 'かくれて いるよ' : 'も ないよ'}`;
  }

  function isHintNeighbor(side, r, c) {
    return UMI.neighbors8(r, c).some(([a, b]) => (side.hint[a + ',' + b] || 0) > 0);
  }

  async function playerShoot(r, c) {
    if (!myTurn || busy || over) return;
    if (cpu.shot[r][c]) {
      // 数字のマス → もう一度わくを見せる
      if (cpu.shot[r][c] === 'miss') { showFrame(Lcpu, r, c); msg(missText('', r, c, cpu.hint[r + ',' + c])); Snd.tap(); }
      return;
    }
    busy = true;
    const helped = isHintNeighbor(cpu, r, c);
    const res = UMI.fire(cpu, r, c);
    shots++; $('shots').textContent = shots;
    const [x, y] = at(r, c);
    Lcpu.frame.innerHTML = '';
    if (res.kind === 'hit') {
      if (helped) hintHits++;
      drawHit(Lcpu.marks, x, y, true).dataset.k = r + ',' + c; Snd.hit();
      if (res.sunk) {
        // しずめた船は 形を見せて、小さい あたりマークを のせる
        await sleep(450);
        res.ship.cells.forEach(([a, b]) => { const m = Lcpu.marks.querySelector(`[data-k="${a},${b}"]`); if (m) m.remove(); });
        drawShip(Lcpu.marks, res.ship, 'reveal');
        res.ship.cells.forEach(([a, b]) => drawHit(Lcpu.marks, ...at(a, b), false, true));
        fleetIcons($('fleet-cpu'), cpu);
        setTimeout(() => Snd.sunk(), 350);
        msg(`${label(r, c)} … <b>あたり！</b><br>${res.ship.len}マスの ふねを しずめた！`);
      } else msg(`${label(r, c)} … <b>あたり！</b><br>となりの どっちに つづいて いるかな？`);
    } else {
      drawMiss(Lcpu.marks, x, y, res.count, true); Snd.miss();
      showFrame(Lcpu, r, c);
      msg(missText('', r, c, res.count));
      refreshGuide();
    }
    if (res.over) return finish(true);
    await sleep(res.kind === 'miss' ? 2200 : 1500);
    if (over) return;
    setTurn(false);
    await sleep(1000);
    cpuShoot();
  }

  async function cpuShoot() {
    const [r, c] = UMI.cpuMove(me, level);
    const res = UMI.fire(me, r, c);
    const [x, y] = at(r, c);
    Lme.frame.innerHTML = '';
    Lcpu.frame.innerHTML = '';
    if (res.kind === 'hit') {
      drawHit(Lme.marks, x, y, true); Snd.hit();
      if (res.sunk) {
        fleetIcons($('fleet-me'), me);
        setTimeout(() => Snd.sunk(), 350);
        msg(`コンピューターが ${label(r, c)} を うった … <b>あたり！</b><br>じぶんの ${res.ship.len}マスの ふねが しずんだ…`);
      } else msg(`コンピューターが ${label(r, c)} を うった … <b>あたり！</b>`);
    } else {
      drawMiss(Lme.marks, x, y, res.count, true); Snd.miss();
      showFrame(Lme, r, c);
      msg(`コンピューターが ${label(r, c)} を うった … はずれ`);
    }
    if (res.over) return finish(false);
    await sleep(1600);
    if (over) return;
    Lme.frame.innerHTML = '';
    busy = false;
    setTurn(true);
  }

  async function finish(win) {
    over = true; busy = true;
    $('turn').hidden = true;
    if (!win) cpu.ships.forEach(s => { if (!s.sunk) drawShip(Lcpu.ships, s, 'reveal'); });
    await sleep(1400);
    win ? Snd.win() : Snd.lose();
    $('res-title').textContent = win ? '🎉 かち！' : 'まけ… つぎは がんばろう';
    $('res-shots').textContent = `うった かず：${shots}かい`;
    $('res-hint').textContent = hintHits ? `すうじの ヒントで あてた かず：${hintHits}かい　すごい！` : 'すうじの ヒントの となりを ねらうと あたりやすいよ';
    $('overlay').hidden = false;
  }

  /* ---- 操作 ---- */
  $('b-cpu').addEventListener('click', e => {
    const t = e.target.closest('.cell');
    if (t) playerShoot(+t.dataset.r, +t.dataset.c);
  });
  $('btn-reroll').addEventListener('click', () => { Snd.tap(); setupScreen(); });
  document.querySelectorAll('.lv').forEach(b => b.addEventListener('click', () => {
    level = +b.dataset.lv; Snd.tap();
    document.querySelectorAll('.lv').forEach(x => x.classList.toggle('on', x === b));
  }));
  $('btn-start').addEventListener('click', () => { Snd.tap(); startBattle(); });
  $('btn-again').addEventListener('click', () => {
    $('overlay').hidden = true;
    $('screen-battle').classList.remove('active');
    $('screen-setup').classList.add('active');
    $('turn').hidden = true;
    setupScreen();
  });

  setupScreen();
  if (/[?&]test=1/.test(location.search)) window.__umi = { get cpu() { return cpu; }, get me() { return me; } };
})();
