// 赤門クイズ 共通 - runner.js
// 問題画面の すすめかた。
//   RUN.test(maker, opts) … テスト：本番と おなじに さいごまで とき、さいごに まとめて こたえあわせ
// ページには #qview（#prog #intro #stem #fig #choices #say-quiz #q-actions）と #other が ある前提。

const RUN = (() => {
  const MARK = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
  const make = ([g, v]) => ({...GENS[g](Math.random, v), gen: g, variant: v});
  const show = (qv) => { $('qview').hidden = !qv; $('other').hidden = qv; };
  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  function render(q, {progL, progR, picked = null, onPick}) {
    show(true);
    $('prog').innerHTML = `<span>${progL}</span><span>${progR || ''}</span>`;
    $('intro').textContent = q.intro || '';
    $('intro').hidden = !q.intro;
    $('stem').textContent = q.stem;
    $('fig').innerHTML = q.fig || '';
    const box = $('choices'); box.innerHTML = '';
    q.els = q.choices.map((c, i) => {
      const b = document.createElement('button');
      b.className = 'choice' + (picked === i ? ' picked' : '');
      b.innerHTML = `<span class="no">${MARK[i]}</span>${c}`;
      b.onclick = () => onPick(i, b);
      box.appendChild(b);
      return b;
    });
  }

  // ---------- テスト ----------
  const bestKey = id => `akamon-best-${id}`;
  function getBest(id) { try { return JSON.parse(localStorage.getItem(bestKey(id))); } catch (e) { return null; } }
  function setBest(id, v) { try { localStorage.setItem(bestKey(id), JSON.stringify(v)); } catch (e) {} }

  // yearOrMaker … 回の データ、または「まいかい あたらしい 回を つくる 関数」（ランダム テスト）
  // opts.back / opts.backLabel … けっか画面の「えらびなおす」ボタン
  function test(yearOrMaker, opts = {}) {
    const maker = typeof yearOrMaker === 'function' ? yearOrMaker : () => yearOrMaker;
    let year = maker();
    let qs, ans, cur, start, timer;
    function build() {
      qs = [];
      year.dai.forEach((d, di) => {
        d.items.forEach((it, si) => qs.push({...make(it), dai: di + 1, sho: si + 1}));
      });
      ans = qs.map(() => null);
    }
    function begin(fresh) {
      if (fresh) year = maker();
      build(); cur = 0; start = Date.now();
      clearInterval(timer); timer = setInterval(() => { const el = document.querySelector('#prog .t'); if (el) el.textContent = fmt(Math.floor((Date.now() - start) / 1000)); }, 1000);
      go(0);
    }
    function go(i) {
      cur = i; const q = qs[i];
      const done = ans.filter(a => a !== null).length;
      render(q, {progL: `だい${q.dai}もん（${q.sho}）　<b>${i + 1}</b> / ${qs.length}<span class="bar"><i style="width:${Math.round(done / qs.length * 100)}%"></i></span>`, progR: `⏱ <span class="t">${fmt(Math.floor((Date.now() - start) / 1000))}</span>`, picked: ans[i], onPick: (k) => {
        ans[i] = k; q.els.forEach((b, j) => b.classList.toggle('picked', j === k)); Sound.step();
        if (i < qs.length - 1) setTimeout(() => { if (cur === i) go(i + 1); }, 350);
        else nav();
      }});
      say('say-quiz', ans.filter(a => a === null).length ? `のこり ${ans.filter(a => a === null).length}もん` : 'ぜんぶ こたえたよ。「こたえあわせ」を おそう。');
      nav();
    }
    function nav() {
      const list = [];
      if (cur > 0) list.push(['prev', '← まえへ', () => go(cur - 1)]);
      if (cur < qs.length - 1) list.push(['next', 'つぎへ →', () => go(cur + 1)]);
      list.push(['check', 'こたえあわせ', result, cur === qs.length - 1]);
      actions(list);
    }
    function result() {
      clearInterval(timer);
      const sec = Math.floor((Date.now() - start) / 1000);
      const ok = qs.filter((q, i) => ans[i] === q.answer).length;
      const best = getBest(year.id);
      if (!best || ok > best.ok) setBest(year.id, {ok, total: qs.length});
      show(false);
      let rows = '';
      year.dai.forEach((d, di) => {
        const mine = qs.map((q, i) => ({q, i})).filter(x => x.q.dai === di + 1);
        rows += `<div class="dai-row"><span class="t">だい${di + 1}もん ${d.t}</span>${mine.map(({q, i}) =>
          `<span class="mk ${ans[i] === null ? 'n' : ans[i] === q.answer ? 'o' : 'x'}">${ans[i] === q.answer ? '○' : '×'}</span>`).join('')}</div>`;
      });
      const misses = qs.map((q, i) => ({q, i})).filter(x => ans[x.i] !== x.q.answer).map(({q, i}) =>
        `<div class="miss"><div class="h">だい${q.dai}もん（${q.sho}）</div>${q.intro ? `<div>${q.intro}</div>` : ''}<div>${q.stem}</div>
         ${q.fig ? `<div class="fig">${q.fig}</div>` : ''}
         <div>あなたの こたえ：${ans[i] === null ? 'なし' : MARK[ans[i]] + q.choices[ans[i]]}　→　<b>こたえ：${MARK[q.answer]}${q.choices[q.answer]}</b></div>
         <div>かんがえかた：${q.explain}</div></div>`).join('');
      const rate = ok / qs.length;
      const stars = rate === 1 ? 3 : rate >= 0.7 ? 2 : rate >= 0.4 ? 1 : 0;
      const face = ['💪', '🙂', '😊', '🎉'][stars];
      $('other').innerHTML = `<div class="result"><div class="stars">${face} ${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
        <div class="score-big">${qs.length}もん中 ${ok}もん せいかい</div>
        <div style="text-align:center">じかん ${fmt(sec)}${best && ok > best.ok ? '　🏆 じこベスト こうしん！' : ''}</div>${rows}${misses}</div>`;
      say('say-quiz', ok === qs.length ? 'ぜんぶ せいかい！ すばらしい！' : 'まちがえた もんだいの かんがえかたを よもう。', ok === qs.length ? 'ok' : '');
      actions([['again', 'もういちど（ちがう もんだいで）', () => begin(true), true], ['list', opts.backLabel || 'かいを えらぶ', () => location.href = opts.back || './']]);
      if (stars >= 2) hanamaru();
    }
    begin(false);
  }

  return {test, getBest};
})();
