// 赤門クイズ 共通 - cube.js
// さいころ・立方体の てんかいず。
// - NETS：立方体の てんかいず 11しゅるい（マスの [よこ, たて]）
// - roll(cells)：てんかいずの 上で さいころを ころがして、マスごとに 立方体の どの めんかを だす
//     → 6めん ぜんぶ ちがえば くみたてられる。めん番号 0-1, 2-3, 4-5 が むかいあう
// - SVG：てんかいず・さいころの 立体図 / fold3d：くみたてる アニメーション

const CUBE = (() => {
  const NETS = [
    // 1-4-1（まん中に 4つ ならぶ）6しゅるい
    [[0,0],[0,1],[1,1],[2,1],[3,1],[0,2]],
    [[0,0],[0,1],[1,1],[2,1],[3,1],[1,2]],
    [[0,0],[0,1],[1,1],[2,1],[3,1],[2,2]],
    [[0,0],[0,1],[1,1],[2,1],[3,1],[3,2]],
    [[1,0],[0,1],[1,1],[2,1],[3,1],[1,2]],
    [[1,0],[0,1],[1,1],[2,1],[3,1],[2,2]],
    // 2-3-1  3しゅるい
    [[0,0],[1,0],[1,1],[2,1],[3,1],[1,2]],
    [[0,0],[1,0],[1,1],[2,1],[3,1],[2,2]],
    [[0,0],[1,0],[1,1],[2,1],[3,1],[3,2]],
    // 2-2-2（かいだん）
    [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2]],
    // 3-3
    [[0,0],[1,0],[2,0],[2,1],[3,1],[4,1]]
  ];
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const key = (x, y) => x + ',' + y;

  // かたちを ずらして 左上を (0,0) に
  function norm(cells) {
    const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1]));
    return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  }
  // まわす（90°×r）・うらがえす
  function transform(cells, r, flip) {
    let cs = cells.map(([x, y]) => [flip ? -x : x, y]);
    for (let i = 0; i < r; i++) cs = cs.map(([x, y]) => [y, -x]);
    return norm(cs);
  }
  const shapeKey = cells => norm(cells).map(c => key(...c)).join(' ');
  // まわしても うらがえしても おなじ かたちなら おなじ キー
  const canon = cells => {
    let best = null;
    for (let f = 0; f < 2; f++) for (let r = 0; r < 4; r++) { const k = shapeKey(transform(cells, r, !!f)); if (best === null || k < best) best = k; }
    return best;
  };

  // さいころを ころがす。かえりち：face[i] = i ばんめの マスが なる めん（0〜5）
  function roll(cells) {
    const idx = new Map(cells.map((c, i) => [key(...c), i]));
    const face = Array(cells.length).fill(null);
    const parent = Array(cells.length).fill(-1);
    face[0] = 0;
    const st = [[0, {b: 0, t: 1, n: 2, s: 3, e: 4, w: 5}]];
    const seen = new Set([0]);
    while (st.length) {
      const [i, o] = st.shift();
      const [x, y] = cells[i];
      DIRS.forEach(([dx, dy]) => {
        const j = idx.get(key(x + dx, y + dy));
        if (j === undefined || seen.has(j)) return;
        let p;
        if (dx === 1) p = {b: o.e, e: o.t, t: o.w, w: o.b, n: o.n, s: o.s};
        else if (dx === -1) p = {b: o.w, w: o.t, t: o.e, e: o.b, n: o.n, s: o.s};
        else if (dy === 1) p = {b: o.s, s: o.t, t: o.n, n: o.b, e: o.e, w: o.w};
        else p = {b: o.n, n: o.t, t: o.s, s: o.b, e: o.e, w: o.w};
        seen.add(j); face[j] = p.b; parent[j] = i; st.push([j, p]);
      });
    }
    return {face, parent};
  }
  const isCube = cells => cells.length === 6 && new Set(roll(cells).face).size === 6;
  const opposite = f => f ^ 1;   // 0↔1, 2↔3, 4↔5

  // ランダムな むきの ただしい てんかいず
  function randomNet(i = Math.floor(Math.random() * NETS.length)) {
    return {id: i, cells: transform(NETS[i], Math.floor(Math.random() * 4), Math.random() < 0.5)};
  }
  // くみたてられない 6マスの かたち（ランダム）
  function randomBad(exclude = new Set()) {
    for (let guard = 0; guard < 500; guard++) {
      const cs = [[0, 0]], has = new Set([key(0, 0)]);
      while (cs.length < 6) {
        const [x, y] = cs[Math.floor(Math.random() * cs.length)], [dx, dy] = DIRS[Math.floor(Math.random() * 4)];
        if (!has.has(key(x + dx, y + dy))) { has.add(key(x + dx, y + dy)); cs.push([x + dx, y + dy]); }
      }
      const c = canon(cs);
      if (isCube(cs) || exclude.has(c)) continue;
      // はばが ひろすぎる かたち（6れつ）は つかわない
      const n = norm(cs), w = Math.max(...n.map(p => p[0])) + 1, h = Math.max(...n.map(p => p[1])) + 1;
      if (Math.max(w, h) > 5) continue;
      return n;
    }
  }

  // ---------- SVG ----------
  const PINK = '#F2B8CF', COLORS = ['#F7A8A8', '#9CC9F2', '#A8E0A8'];   // むかいあう めんの いろ（3しゅるい）
  const PIPS = {1: [[.5, .5]], 2: [[.27, .27], [.73, .73]], 3: [[.25, .25], [.5, .5], [.75, .75]], 4: [[.27, .27], [.73, .27], [.27, .73], [.73, .73]],
    5: [[.25, .25], [.75, .25], [.5, .5], [.25, .75], [.75, .75]], 6: [[.28, .22], [.72, .22], [.28, .5], [.72, .5], [.28, .78], [.72, .78]]};

  // てんかいず。opts.fill[i] / opts.text[i] / opts.ring[i]（ふちを こく） / opts.pips[i]（目の点）
  function netSVG(cells, {S = 60, fill = [], text = [], ring = [], pips = [], textColor = [], pad = 6} = {}) {
    const n = norm(cells);
    const W = (Math.max(...n.map(c => c[0])) + 1) * S + pad * 2, H = (Math.max(...n.map(c => c[1])) + 1) * S + pad * 2;
    // norm で ならびが かわるので、もとの じゅんばんで かく
    const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1]));
    let body = '';
    cells.forEach(([cx, cy], i) => {
      const x = (cx - mx) * S + pad, y = (cy - my) * S + pad;
      body += `<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="${fill[i] || PINK}" stroke="${ring[i] ? '#D6363A' : '#333'}" stroke-width="${ring[i] ? 5 : 2}"/>`;
      if (pips[i]) PIPS[pips[i]].forEach(([px, py]) => body += `<circle cx="${x + px * S}" cy="${y + py * S}" r="${S * (pips[i] === 1 ? .12 : .08)}" fill="${pips[i] === 1 ? '#D6363A' : '#222'}"/>`);
      if (text[i] !== undefined && text[i] !== '') body += `<text x="${x + S / 2}" y="${y + S / 2}" font-size="${S * .55}" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="${textColor[i] || '#1C2B45'}">${text[i]}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  }

  // さいころの 立体図（上・まえ・みぎ が 見える）。dice = [{top, front, right}, ...] を よこに くっつけて ならべる。
  // marks = [{die, face, blank}] … かくれた めんを 外から 矢印と「？」の ふだで さす（blank：ふだを からに）
  //   face: 'bottom'（した。下から さす） / 'top'（うえ。上から さす）
  // sum … した の ふだを かっこで まとめて「あわせて ○」と かく（例 'あわせて 8'）
  function dieSVG(dice, {S = 120, marks = [], sum = ''} = {}) {
    const d = S * 0.45, M = marks.length ? 130 : 10;   // 矢印と「？」の ふだを かく よはく
    const extra = sum ? 115 : 0;                         // 「あわせて」の ぶん 下を ひろく
    const W = dice.length * S + d + M * 2, H = S + d + M * 2 + extra;
    let body = '', over = '';
    const quad = pts => pts.map(p => p.join(',')).join(' ');
    const pipsOn = (n, o, u, v, r) => (PIPS[n] || []).map(([a, b]) => {
      const x = o[0] + u[0] * a + v[0] * b, y = o[1] + u[1] * a + v[1] * b;
      return `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.8}" fill="${n === 1 ? '#D6363A' : '#222'}"/>`;
    }).join('');
    dice.forEach((f, i) => {
      const x0 = M + i * S, y0 = M + d;
      const front = [[x0, y0], [x0 + S, y0], [x0 + S, y0 + S], [x0, y0 + S]];
      const top = [[x0, y0], [x0 + d, y0 - d], [x0 + S + d, y0 - d], [x0 + S, y0]];
      const right = [[x0 + S, y0], [x0 + S + d, y0 - d], [x0 + S + d, y0 + S - d], [x0 + S, y0 + S]];
      const face = (pts, n, o, u, v, fill) => {
        let s = `<polygon points="${quad(pts)}" fill="${fill}" stroke="#222" stroke-width="3" stroke-linejoin="round"/>`;
        if (n === '？') s += `<text x="${(pts[0][0] + pts[2][0]) / 2}" y="${(pts[0][1] + pts[2][1]) / 2}" font-size="${S * .45}" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="#D6363A">？</text>`;
        else if (n) s += pipsOn(n, o, u, v, S * 0.07);
        return s;
      };
      if (i === dice.length - 1) body += face(right, f.right, [x0 + S, y0], [d, -d], [0, S], '#E6E9EE');
      body += face(top, f.top, [x0, y0], [S, 0], [d, -d], '#F5F6F8');
      body += face(front, f.front, [x0, y0], [S, 0], [0, S], '#FFFFFF');
    });
    // かくれた めん：外からの 矢印 ＋「？」の ふだ
    // label を わたすと、わかって いる 数として くろで かく（きく ところ「？」は あか）
    const RED = '#D6363A', INK = '#1C2B45';
    const tag = (x, y, blank, label) => {
      const c = label !== undefined ? INK : RED;
      return `<rect x="${x - 30}" y="${y - 30}" width="60" height="60" rx="10" fill="#fff" stroke="${c}" stroke-width="4"/>`
        + (blank ? '' : `<text x="${x}" y="${y + 2}" font-size="40" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="${c}">${label !== undefined ? label : '？'}</text>`);
    };
    const bottomTags = [];
    const arrow = (x1, y1, x2, y2, c = RED) => {   // (x1,y1) から (x2,y2) へ。さきに 三角
      const a = Math.atan2(y2 - y1, x2 - x1), h = 18;
      const p1 = [x2 - h * Math.cos(a - .45), y2 - h * Math.sin(a - .45)], p2 = [x2 - h * Math.cos(a + .45), y2 - h * Math.sin(a + .45)];
      return `<line x1="${x1}" y1="${y1}" x2="${x2 - 10 * Math.cos(a)}" y2="${y2 - 10 * Math.sin(a)}" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`
        + `<polygon points="${x2},${y2} ${p1.join(',')} ${p2.join(',')}" fill="${c}"/>`;
    };
    marks.forEach(({die, face, blank, label}) => {
      const x0 = M + die * S, y0 = M + d, c = label !== undefined ? INK : RED;
      let from, to;
      if (face === 'bottom') {
        to = [x0 + S / 2 + d / 2, y0 + S + 4]; from = [to[0], y0 + S + 62];
        over += arrow(...from, ...to, c) + tag(from[0], from[1] + 30, blank, label);
        bottomTags.push([from[0], from[1] + 60]);   // ふだの 下はし
      } else {   // top：うえの めん（見えて いる めんに 上から 矢印）
        to = [x0 + S / 2 + d / 2, y0 - d / 2 - 2]; from = [to[0], to[1] - 64];
        over += arrow(...from, ...to, c) + tag(from[0], from[1] - 30, blank, label);
      }
    });
    // 「あわせて ○」：した の ふだの 下に かっこ（︸）と もじ
    if (sum && bottomTags.length) {
      const xl = Math.min(...bottomTags.map(t => t[0])) - 30, xr = Math.max(...bottomTags.map(t => t[0])) + 30;
      const y = bottomTags[0][1] + 10, xm = (xl + xr) / 2;
      over += `<path d="M${xl} ${y} Q${xl} ${y + 18} ${xl + 20} ${y + 18} L${xm - 14} ${y + 18} Q${xm} ${y + 18} ${xm} ${y + 32} Q${xm} ${y + 18} ${xm + 14} ${y + 18} L${xr - 20} ${y + 18} Q${xr} ${y + 18} ${xr} ${y}" fill="none" stroke="#333" stroke-width="3"/>`
        + `<text x="${xm}" y="${y + 62}" font-size="36" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="#1C2B45">${sum}</text>`;
    }
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${body}${over}</svg>`;
  }

  // ---------- くみたてる（CSS 3D） ----------
  // el の 中に てんかいずを つくる。fold(true) で くみたて、fold(false) で ひらく。
  // まん中に ちかい めんから 1まいずつ ゆっくり おる（STEP びょうずつ ずらして、1まい TURN びょう）。
  // clash[i] = true の めんは あかく はんとうめいに（くみたてられない かたちで ぶつかる めん）
  const TURN = 1.2, STEP = 0.9, SPIN = 1.5;
  // zoom … おりおわった さいころを なんばいに して まわすか
  function fold3d(el, cells, {S = 70, fill = [], text = [], pips = [], clash = [], zoom = 1} = {}) {
    const {parent} = roll(cells);
    // いちばん となりが おおい マスを まん中（根）に して、木を つくりなおす
    const idx = new Map(cells.map((c, i) => [key(...c), i]));
    const deg = cells.map(([x, y]) => DIRS.filter(([dx, dy]) => idx.has(key(x + dx, y + dy))).length);
    const root = deg.indexOf(Math.max(...deg));
    const par = Array(cells.length).fill(-1), order = [root], seen = new Set([root]);
    for (let k = 0; k < order.length; k++) {
      const [x, y] = cells[order[k]];
      DIRS.forEach(([dx, dy]) => { const j = idx.get(key(x + dx, y + dy)); if (j !== undefined && !seen.has(j)) { seen.add(j); par[j] = order[k]; order.push(j); } });
    }
    void parent;
    const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1]));
    const W = (Math.max(...cells.map(c => c[0])) - mx + 1) * S, H = (Math.max(...cells.map(c => c[1])) - my + 1) * S;
    el.innerHTML = '';
    const scene = document.createElement('div'); scene.className = 'fold-scene';
    scene.style.cssText = `position:relative;width:${W}px;height:${H}px;margin:auto;transform-style:preserve-3d;transition:transform 1.2s ease`;
    el.appendChild(scene);
    const divs = [];
    order.forEach(i => {
      const dv = document.createElement('div');
      dv.className = 'fold-face';
      dv.style.cssText = `position:absolute;width:${S}px;height:${S}px;transform-style:preserve-3d;box-sizing:border-box;`
        + (clash[i] ? 'border:3px solid #D6363A;background:rgba(214,54,58,.55);' : `border:2px solid #333;background:${fill[i] || PINK};`)
        + `display:grid;place-items:center;font-weight:700;font-size:${S * .5}px;color:#1C2B45`;
      if (pips[i]) dv.innerHTML = `<svg viewBox="0 0 1 1" style="width:100%;height:100%;position:absolute;inset:0">${PIPS[pips[i]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="${pips[i] === 1 ? .12 : .08}" fill="${pips[i] === 1 ? '#D6363A' : '#222'}"/>`).join('')}</svg>`;
      else if (text[i] !== undefined) dv.textContent = text[i];
      const p = par[i];
      if (p < 0) { dv.style.left = (cells[i][0] - mx) * S + 'px'; dv.style.top = (cells[i][1] - my) * S + 'px'; scene.appendChild(dv); }
      else {
        const dx = cells[i][0] - cells[p][0], dy = cells[i][1] - cells[p][1];
        dv.style.left = dx * S + 'px'; dv.style.top = dy * S + 'px';
        dv.style.transformOrigin = dx === 1 ? 'left center' : dx === -1 ? 'right center' : dy === 1 ? 'center top' : 'center bottom';
        dv.dataset.axis = dx ? 'Y' : 'X';
        dv.dataset.sign = dx === 1 ? 1 : dx === -1 ? -1 : dy === 1 ? -1 : 1;   // ぜんぶ おくへ おれる むき
        divs[p].appendChild(dv);
      }
      divs[i] = dv;
    });
    const rc = [(cells[root][0] - mx + .5) * S, (cells[root][1] - my + .5) * S];
    scene.style.transformOrigin = `${rc[0]}px ${rc[1]}px ${-S / 2}px`;
    // おりおわったら、さいころの まん中を わくの まん中に もってきて、zoom ばいに する（quiz.css の cube-spin も つかう）
    scene.style.setProperty('--tx', `${W / 2 - rc[0]}px`);
    scene.style.setProperty('--ty', `${H / 2 - rc[1]}px`);
    scene.style.setProperty('--tz', `${S / 2}px`);
    scene.style.setProperty('--k', zoom);
    const DONE = `translate3d(var(--tx), var(--ty), var(--tz)) scale(var(--k)) rotateX(-28deg) rotateY(-35deg) rotateZ(0deg)`;
    const hinges = order.slice(1).map(i => divs[i]);   // おる じゅんばん（まん中に ちかい めんから）
    const foldTime = (hinges.length - 1) * STEP + TURN;
    let spinTimer;
    return {
      // on=true：1まいずつ おって、くるっと まわしたあと、いろいろな むきに クルクル まわしつづける。
      // かえりちは まわしはじめるまでの びょう
      fold(on) {
        clearTimeout(spinTimer);
        scene.classList.remove('spin');
        if (on) spinTimer = setTimeout(() => scene.classList.add('spin'), (foldTime + SPIN) * 1000);
        hinges.forEach((dv, k) => {
          const delay = on ? k * STEP : (hinges.length - 1 - k) * 0.35;
          dv.style.transition = `transform ${on ? TURN : 0.6}s ease ${delay}s`;
          dv.style.transform = on ? `rotate${dv.dataset.axis}(${dv.dataset.sign * 90}deg)` : '';
        });
        scene.style.transition = `transform ${SPIN}s ease ${on ? foldTime : 0}s`;
        scene.style.transform = on ? DONE : '';
        return on ? foldTime + SPIN : (hinges.length - 1) * 0.35 + 0.6;
      }
    };
  }

  // box（#fig など）に くみたてを だして はじめる。「🔁 もういちど」で ひらいて また おる。
  // after … おりおわった ときに よぶ（せつめいを だす など）
  function play(box, cells, opts = {}, after) {
    box.innerHTML = '<div class="fold-wrap"></div><button class="btn replay" type="button">🔁 もういちど</button>';
    const wrap = box.querySelector('.fold-wrap');
    const w = wrap.clientWidth || 400, h = wrap.clientHeight || 300;
    // てんかいずが わくに ちょうど はいる 大きさ（たて・よこの マスの かずから）
    const n = norm(cells), cols = Math.max(...n.map(c => c[0])) + 1, rows = Math.max(...n.map(c => c[1])) + 1;
    const S = Math.max(36, Math.min(150, Math.floor(Math.min(w / (cols + .4), h / (rows + .4)))));
    // おりおわった さいころ（ななめから 見ると 1ぺんの やく 1.7ばい）が わくの 7わりに なるように 大きく
    const zoom = Math.max(1, Math.min(2.6, Math.min(w, h) * 0.7 / (S * 1.7)));
    const f = fold3d(wrap, cells, {...opts, S, zoom});
    let timer;
    const run = () => { const t = f.fold(true); clearTimeout(timer); timer = setTimeout(() => after && after(), t * 1000); };
    setTimeout(run, 250);
    box.querySelector('.replay').onclick = () => { clearTimeout(timer); const back = f.fold(false); timer = setTimeout(run, back * 1000 + 300); };
  }

  return {NETS, norm, transform, canon, roll, isCube, opposite, randomNet, randomBad, netSVG, dieSVG, fold3d, play, COLORS, PINK, PIPS};
})();
