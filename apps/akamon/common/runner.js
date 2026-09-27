// 赤門クイズ 共通 - runner.js
// 問題画面の すすめかた。
//   RUN.practice(unitKey)  … たんげん れんしゅう：こたえたら すぐ ○×と かんがえかた、10もんで けっか
//   RUN.test(year)         … ねんべつ テスト：本番と おなじに さいごまで とき、さいごに こたえあわせ
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

  // ---------- たんげん れんしゅう ----------
  function practice(unitKey, total = 10) {
    const unit = UNITS[unitKey];
    let n = 0, ok = 0, last = null;
    function next() {
      if (n >= total) return finish();
      let it; do { it = unit.items[ri(Math.random, unit.items.length)]; } while (unit.items.length > 1 && it === last);
      last = it;
      const q = make(it); n++;
      let done = false;
      render(q, {progL: `<b>${n}</b> / ${total}もん`, progR: `せいかい ${ok}`, onPick: i => {
        if (done) return; done = true;
        q.els.forEach((b, j) => { b.disabled = true; if (j === q.answer) b.classList.add('right'); });
        if (i === q.answer) { ok++; say('say-quiz', 'せいかい！ ' + q.explain, 'ok'); hanamaru(); }
        else { q.els[i].classList.add('wrong'); Sound.wrong(); say('say-quiz', `ざんねん。こたえは ${MARK[q.answer]}。${q.explain}`, 'ng'); }
        actions([['next', n >= total ? 'けっかを みる' : 'つぎの もんだい', next, true]]);
      }});
      say('say-quiz', 'よく よんで こたえを えらんでね。');
      actions([]);
    }
    function finish() {
      show(false);
      $('other').innerHTML = `<div class="cover"><div class="big">${unit.emoji} ${unit.name}</div>
        <div class="score-big">${total}もん中 ${ok}もん せいかい</div>
        <div class="note">${ok === total ? 'ぜんぶ せいかい！ すごい！' : 'まちがえた もんだいは、もういちど ちょうせん しよう。'}</div></div>`;
      actions([['again', 'もういちど', () => { n = 0; ok = 0; next(); }, true], ['back', 'たんげんを えらぶ', () => location.href = './']]);
      if (ok === total) hanamaru();
    }
    next();
  }

  // ---------- ねんべつ テスト ----------
  const bestKey = id => `akamon-best-${id}`;
  function getBest(id) { try { return JSON.parse(localStorage.getItem(bestKey(id))); } catch (e) { return null; } }
  function setBest(id, v) { try { localStorage.setItem(bestKey(id), JSON.stringify(v)); } catch (e) {} }

  function test(year) {
    let qs, ans, cur, start, timer;
    function build() {
      qs = [];
      year.dai.forEach((d, di) => {
        d.items.forEach((it, si) => qs.push({...make(it), dai: di + 1, sho: si + 1}));
      });
      ans = qs.map(() => null);
    }
    function cover() {
      show(false);
      const best = getBest(year.id);
      $('other').innerHTML = `<div class="cover"><div class="big">📅 ${year.label}</div>
        <div>だいもん ${year.dai.length}つ・ぜんぶで ${year.dai.reduce((s, d) => s + d.items.length, 0)}もん　じかん ${year.minutes || 20}ぷん が めやす</div>
        <div class="note">${year.dai.map((d, i) => `だい${i + 1}もん ${d.t}`).join('　')}</div>
        <div class="note">この かいの テストと おなじ しゅるいの もんだいが、まいかい ちがう かずで でるよ。<br>こたえは さいごに まとめて あわせるよ。</div>
        ${best ? `<div>いままでの いちばん：<b>${best.ok} / ${best.total}</b></div>` : ''}
        ${year.note ? `<div class="note">※ ${year.note}</div>` : ''}</div>`;
      actions([['start', 'はじめる', begin, true]]);
      say('say-quiz', '');
    }
    function begin() {
      build(); cur = 0; start = Date.now();
      clearInterval(timer); timer = setInterval(() => { const el = document.querySelector('#prog .t'); if (el) el.textContent = fmt(Math.floor((Date.now() - start) / 1000)); }, 1000);
      go(0);
    }
    function go(i) {
      cur = i; const q = qs[i];
      render(q, {progL: `だい${q.dai}もん（${q.sho}）　<b>${i + 1}</b> / ${qs.length}`, progR: `⏱ <span class="t">${fmt(Math.floor((Date.now() - start) / 1000))}</span>`, picked: ans[i], onPick: (k) => {
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
      $('other').innerHTML = `<div class="result"><div class="score-big">${qs.length}もん中 ${ok}もん せいかい</div>
        <div style="text-align:center">じかん ${fmt(sec)}</div>${rows}${misses}</div>`;
      say('say-quiz', ok === qs.length ? 'ぜんぶ せいかい！ すばらしい！' : 'まちがえた もんだいの かんがえかたを よもう。', ok === qs.length ? 'ok' : '');
      actions([['again', 'もういちど（ちがう かずで）', begin, true], ['list', 'かいを えらぶ', () => location.href = './']]);
      if (ok >= Math.ceil(qs.length * 0.8)) hanamaru();
    }
    cover();
  }

  return {practice, test, getBest};
})();
