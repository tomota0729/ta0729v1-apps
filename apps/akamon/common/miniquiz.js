// 赤門クイズ 共通 - miniquiz.js
// こたえたら すぐ ○× → 「つぎの もんだい」→ さいごに けっか、の かんたんな すすめかた。
//   MQ.run({total, ask, autoNext})
//     ask(n, done) … n もんめを #stem #fig #choices に かく。こたえたら done(せいかい?, [ついかの ボタン…]) を よぶ
//     autoNext … せいかいの とき、この ミリびょう あとに じどうで つぎへ（ついかの ボタンが ある ときは すすまない）
//     こたえた あとは、ボタン いがいの ところを タップしても つぎへ すすむ
// ページには #qview（#prog #stem #fig #choices）#other #say-quiz #q-actions が ある前提。

const MQ = (() => {
  let T, ok, n, ask, autoNext = 0, timer, tapReady = false;
  const progress = () => { $('prog').innerHTML = `<span><b>${n}</b> / ${T}もん</span><span>せいかい ${ok}</span>`; };
  // こたえた あとは、がめんの どこかを タップしても つぎへ（ボタンは それぞれの はたらきを する）
  document.addEventListener('click', e => {
    if (!tapReady || e.target.closest('button')) return;
    next();
  });
  function next() {
    clearTimeout(timer); tapReady = false;
    if (n >= T) return finish();
    n++; $('qview').hidden = false; $('other').hidden = true;
    progress(); actions([]); say('say-quiz', '');
    ask(n, done);
  }
  // opts.wait … この もんだいだけ じどうで すすむまでの ミリびょうを かえる（くみたてを 見せる とき など）
  function done(correct, extra = [], opts = {}) {
    if (correct) { ok++; hanamaru(); } else { Sound.wrong(); batsu(); }
    progress();
    actions([...extra, ['next', n >= T ? 'けっかを みる' : 'つぎの もんだい', next, true]]);
    const wait = opts.wait || autoNext;
    if (correct && wait && !extra.length) timer = setTimeout(next, wait);
    setTimeout(() => { tapReady = true; }, 400);   // こたえた タップで すぐ すすまない ように すこし まつ
  }
  function finish() {
    tapReady = false;
    $('qview').hidden = true; $('other').hidden = false;
    const rate = ok / T, stars = rate === 1 ? 3 : rate >= 0.7 ? 2 : rate >= 0.4 ? 1 : 0;
    $('other').innerHTML = `<div class="cover"><div class="stars">${['💪', '🙂', '😊', '🎉'][stars]} ${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
      <div class="score-big">${T}もん中 ${ok}もん せいかい</div>
      <div class="note">${ok === T ? 'ぜんぶ せいかい！ すごい！' : 'まちがえた ところは、くみたてて たしかめて みよう。'}</div></div>`;
    say('say-quiz', '');
    actions([['again', 'もういちど', () => { n = 0; ok = 0; next(); }, true], ['back', '赤門クイズへ', () => location.href = '../']]);
    if (stars >= 2) hanamaru();
  }
  return {run(o) { T = o.total; ask = o.ask; autoNext = o.autoNext || 0; n = 0; ok = 0; next(); }};
})();
