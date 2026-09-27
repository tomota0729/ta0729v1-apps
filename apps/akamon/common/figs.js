// 赤門クイズ 共通 - figs.js
// 問題の 図を SVG で かく 部品。どれも SVG の 文字列を かえす（絵は 絵文字＋図形。もとの テストの 絵は つかわない）

const FIG = (() => {
  const NUM = ['','①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳'];
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const svg = (w, h, body) => `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  const emoji = (x, y, e, size = 34) => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" dominant-baseline="central">${e}</text>`;
  const label = (x, y, t, size = 20, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" dominant-baseline="central" fill="var(--ink,#1C2B45)" ${extra}>${esc(t)}</text>`;

  // わくの 中の ます目から n こ えらんで、すこし ずらして おく
  function scatterPos(n, cols, rows, cw, ch, rng, x0 = 0, y0 = 0) {
    const cells = shuffle([...Array(cols * rows).keys()], rng).slice(0, n);
    return cells.map(i => [
      x0 + (i % cols + 0.5) * cw + (rng() - 0.5) * cw * 0.35,
      y0 + (Math.floor(i / cols) + 0.5) * ch + (rng() - 0.5) * ch * 0.35
    ]);
  }

  return {
    NUM,

    // 絵を ちらして ならべる。items = [{e:'🍎', n:5}, {e:'🍊', n:3}]
    scatter(items, rng, {cols = 6, rows = 4} = {}) {
      const total = items.reduce((s, it) => s + it.n, 0);
      while (cols * rows < total) cols++;
      const W = cols * 56, H = rows * 56;
      const pos = scatterPos(total, cols, rows, 56, 56, rng, 0, 0);
      let body = `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="14" fill="var(--paper,#fff)" stroke="var(--ink,#1C2B45)" stroke-width="3"/>`;
      let k = 0;
      items.forEach(it => { for (let i = 0; i < it.n; i++) { const [x, y] = pos[k++]; body += emoji(x, y, it.e, 36); } });
      return svg(W, H, body);
    },

    // わくの 中に 10こ（total）ある うち、いくつかを 手（または うちわ）で かくして いる
    hidden(visible, rng, {e = '🟢', cover = '✋'} = {}) {
      const W = 360, H = 220;
      let body = `<rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="16" fill="var(--paper,#fff)" stroke="var(--ink,#1C2B45)" stroke-width="3"/>`;
      // みぎがわ（x 170〜350）に 見えている ぶん
      scatterPos(visible, 3, 4, 58, 50, rng, 175, 12).forEach(([x, y]) => body += emoji(x, y, e, 30));
      // ひだりがわに 大きな 手
      body += `<circle cx="95" cy="115" r="82" fill="#FCE3C8" opacity=".55"/>` + emoji(95, 118, cover, 130);
      return svg(W, H, body);
    },

    // よこに ならんだ もの。marks = {位置(0から): '🍎'} で ちがう 絵に できる。numbers=true で 下に ①②…
    row(n, {e = '🌰', marks = {}, numbers = true, ends = ['ひだり', 'みぎ'], ring = []} = {}) {
      const cw = 52, W = n * cw + 20, H = numbers ? 120 : 90;
      let body = '';
      for (let i = 0; i < n; i++) {
        const x = 10 + cw * (i + 0.5);
        if (ring.includes(i)) body += `<circle cx="${x}" cy="44" r="24" fill="none" stroke="var(--accent,#2F6FDB)" stroke-width="3"/>`;
        body += emoji(x, 44, marks[i] || e, 36);
        if (numbers) body += label(x, 94, NUM[i + 1], 24);
      }
      if (ends) body += label(24, 10, ends[0], 14) + label(W - 24, 10, ends[1], 14);
      return svg(W, H, body);
    },

    // 人の れつ（ひだりが まえ）。special = {位置: '👧'}
    line(n, special = {}) {
      const cw = 48, W = n * cw + 70, H = 110;
      let body = label(30, 20, 'まえ', 16, 'font-weight="700"') + `<path d="M8 40 L22 32 L22 48 Z" fill="var(--ink,#1C2B45)"/>`;
      for (let i = 0; i < n; i++) {
        const x = 50 + cw * (i + 0.5);
        const s = special[i];
        if (s) body += `<circle cx="${x}" cy="60" r="24" fill="#FFE28A" stroke="#E0513B" stroke-width="3"/>` + label(x, 98, '▲', 16, 'fill="#E0513B"');
        body += emoji(x, 60, s || '🧑', 34);
      }
      body += label(W - 30, 20, 'うしろ', 16, 'font-weight="700"');
      return svg(W, H, body);
    },

    // とけい（h じ m ふん）
    clock(h, m) {
      const R = 100, C = 110;
      let body = `<circle cx="${C}" cy="${C}" r="${R}" fill="var(--paper,#fff)" stroke="var(--ink,#1C2B45)" stroke-width="6"/>`;
      for (let i = 0; i < 60; i++) {
        const a = i * Math.PI / 30, big = i % 5 === 0, r1 = big ? R - 12 : R - 7;
        body += `<line x1="${C + Math.sin(a) * r1}" y1="${C - Math.cos(a) * r1}" x2="${C + Math.sin(a) * (R - 3)}" y2="${C - Math.cos(a) * (R - 3)}" stroke="var(--ink,#1C2B45)" stroke-width="${big ? 3 : 1.4}"/>`;
      }
      for (let i = 1; i <= 12; i++) {
        const a = i * Math.PI / 6;
        body += label(C + Math.sin(a) * (R - 28), C - Math.cos(a) * (R - 28), i, 20, 'font-weight="700"');
      }
      const ha = ((h % 12) + m / 60) * Math.PI / 6, ma = m * Math.PI / 30;
      body += `<line x1="${C}" y1="${C}" x2="${C + Math.sin(ha) * 50}" y2="${C - Math.cos(ha) * 50}" stroke="var(--ink,#1C2B45)" stroke-width="9" stroke-linecap="round"/>`;
      body += `<line x1="${C}" y1="${C}" x2="${C + Math.sin(ma) * 78}" y2="${C - Math.cos(ma) * 78}" stroke="var(--ink,#1C2B45)" stroke-width="5" stroke-linecap="round"/>`;
      body += `<circle cx="${C}" cy="${C}" r="7" fill="var(--ink,#1C2B45)"/>`;
      return svg(220, 220, body);
    },

    // お金（10円・5円・1円）を さいふの 中に
    coins(list, rng) {
      const W = 360, H = 200;
      let body = `<path d="M40 60 Q180 10 320 60 L330 170 Q180 200 30 170 Z" fill="#FFF3C4" stroke="var(--ink,#1C2B45)" stroke-width="3"/>`;
      const pos = scatterPos(list.length, 5, 2, 56, 56, rng, 40, 70);
      list.forEach((v, i) => {
        const [x, y] = pos[i], col = v === 10 ? '#C8743A' : v === 5 ? '#D9B23A' : '#C9CED6', r = v === 1 ? 20 : 24;
        body += `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" stroke="#555" stroke-width="2"/>` + label(x, y, v, v === 10 ? 18 : 16, 'font-weight="700" fill="#222"');
      });
      return svg(W, H, body);
    },

    // さいころ（1〜6 の め）を ならべる。faces = [3, null]（null は「？」）
    dice(faces) {
      const S = 110, W = faces.length * (S + 30) + 10;
      const P = {1: [[.5, .5]], 2: [[.25, .25], [.75, .75]], 3: [[.25, .25], [.5, .5], [.75, .75]], 4: [[.25, .25], [.75, .25], [.25, .75], [.75, .75]],
        5: [[.25, .25], [.75, .25], [.5, .5], [.25, .75], [.75, .75]], 6: [[.25, .22], [.75, .22], [.25, .5], [.75, .5], [.25, .78], [.75, .78]]};
      let body = '';
      faces.forEach((f, i) => {
        const x0 = 20 + i * (S + 30);
        body += `<rect x="${x0}" y="10" width="${S}" height="${S}" rx="18" fill="var(--paper,#fff)" stroke="var(--ink,#1C2B45)" stroke-width="4"/>`;
        if (f) P[f].forEach(([px, py]) => body += `<circle cx="${x0 + px * S}" cy="${10 + py * S}" r="${f === 1 ? 14 : 10}" fill="${f === 1 ? '#D6363A' : 'var(--ink,#1C2B45)'}"/>`);
        else body += label(x0 + S / 2, 10 + S / 2, '？', 54, 'font-weight="700"');
      });
      return svg(W, S + 20, body);
    },

    // 2まいの カード（左・右）
    cards(values) {
      const W = values.length * 130 + 10;
      let body = '';
      values.forEach((v, i) => {
        const x0 = 15 + i * 130;
        body += `<rect x="${x0}" y="8" width="100" height="120" rx="12" fill="${v === '？' ? '#DDE3EA' : 'var(--paper,#fff)'}" stroke="var(--ink,#1C2B45)" stroke-width="3"/>` + label(x0 + 50, 68, v, 52, 'font-weight="700"');
      });
      return svg(W, 136, body);
    },

    // けいさんの しき（大きく）。parts = ['3', '+', '□', '=', '7']
    formula(parts) {
      const W = parts.length * 60 + 20;
      let body = '';
      parts.forEach((p, i) => {
        const x = 10 + 60 * (i + 0.5);
        if (p === '□') body += `<rect x="${x - 26}" y="14" width="52" height="52" rx="6" fill="#DDE3EA" stroke="var(--ink,#1C2B45)" stroke-width="2.5"/>`;
        else body += label(x, 40, p, 44, 'font-weight="600"');
      });
      return svg(W, 80, body);
    },

    // 絵の れい（ぶんしょうだいの さしえ）
    scene(e) {
      const list = Array.from(e.replace(/️/g, ''));
      return svg(list.length * 72 + 20, 90, list.map((x, i) => emoji(46 + i * 72, 45, x, 60)).join(''));
    }
  };
})();
