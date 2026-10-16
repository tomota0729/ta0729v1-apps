// てんかいず 3たく - game.js
// 3つの てんかいずから、はこ（さいころ）に なる ものを えらぶ。
// せいかいは 11しゅるいの どれか（むきも ランダム）、ほかの 2つは くみたてられない 6マスの かたち。

const LABEL = ['ア', 'イ', 'ウ'];

// まちがいの かたちで、かさなって しまう めんを 赤く
function overlapRing(cells) {
  const {face} = CUBE.roll(cells), cnt = {};
  face.forEach(f => cnt[f] = (cnt[f] || 0) + 1);
  return face.map(f => cnt[f] > 1);
}

// くみたてて みせる。bad=true の ときは、ぶつかる めんを あかく して かさなりを みせる
function showFold(cells, bad) {
  const {face} = CUBE.roll(cells);
  say('say-quiz', 'みて いてね。1まいずつ おって いくよ……');
  if (bad) {
    CUBE.play($('fig'), cells, {clash: overlapRing(cells)}, () =>
      say('say-quiz', 'あかい めんが おなじ ところに きて ぶつかって しまうね。そのぶん ほかの ところが あいて しまうので、はこに ならないよ。「⭕ せいかいを くみたてる」も みて みよう。', 'ng'));
  } else {
    CUBE.play($('fig'), cells, {fill: face.map(x => CUBE.COLORS[x >> 1])}, () =>
      say('say-quiz', 'ぴったり はこに なったね。むかいあう めんは おなじ いろだよ。', 'ok'));
  }
}

// 5もんぶんの てんかいず（上下1こずつ／ほか の バランスを cube.js の netPlan で きめる）
let plan;

MQ.run({total: 5, autoNext: 16000, ask(n, done) {
  if (n === 1) plan = CUBE.netPlan();
  const good = CUBE.randomNet(plan.ids[n - 1]);
  const ex = new Set([CUBE.canon(good.cells)]);
  const bad1 = CUBE.randomBad(ex); ex.add(CUBE.canon(bad1));
  const bad2 = CUBE.randomBad(ex);
  const opts = shuffle([{cells: good.cells, ok: true}, {cells: bad1, ok: false}, {cells: bad2, ok: false}]);
  $('stem').textContent = 'くみたてると はこ（さいころ）に なる てんかいずは どれですか。';
  $('choices').innerHTML = '';
  const box = $('fig'); box.innerHTML = '<div class="netopts" id="opts"></div>';
  let answered = false;
  opts.forEach((o, i) => {
    const b = document.createElement('button');
    b.className = 'netopt';
    b.innerHTML = `<span class="lb">${LABEL[i]}</span>${CUBE.netSVG(o.cells, {S: 40})}`;
    b.onclick = () => {
      if (answered) return; answered = true;
      opts.forEach((x, j) => {
        const el = $('opts').children[j];
        if (x.ok) {
          const {face} = CUBE.roll(x.cells);
          el.classList.add('right');
          el.querySelector('svg').outerHTML = CUBE.netSVG(x.cells, {S: 40, fill: face.map(f => CUBE.COLORS[f >> 1])});
        } else if (j === i) {
          el.classList.add('wrong');
          el.querySelector('svg').outerHTML = CUBE.netSVG(x.cells, {S: 40, ring: overlapRing(x.cells)});
        }
      });
      const ans = LABEL[opts.findIndex(x => x.ok)];
      if (o.ok) say('say-quiz', `せいかい！ ${LABEL[i]}を くみたてて みるよ。`, 'ok');
      else say('say-quiz', `ざんねん。こたえは ${ans}。えらんだ ${LABEL[i]}を くみたてて みるよ。`, 'ng');
      done(o.ok, o.ok ? [] : [['fold', `⭕ せいかい（${ans}）を くみたてる`, () => showFold(good.cells)], ['foldbad', `❌ ${LABEL[i]}を くみたてる`, () => showFold(o.cells, true)]]);
      // ○×の いろを すこし 見せてから、えらんだ てんかいずを じどうで くみたてる
      setTimeout(() => { if (b.isConnected) showFold(o.cells, !o.ok); }, 1300);   // つぎの もんだいに すすんで いたら しない
    };
    $('opts').appendChild(b);
  });
  say('say-quiz', n === 1 && plan.hard ? 'きょうは むずかしい かい！ ぜんぶ「上下1こずつ」いがいの かたちだよ。' : 'あたまの なかで おりたたんで みよう。');
}});
