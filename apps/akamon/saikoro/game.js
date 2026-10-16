// さいころの かくれた め - game.js
// むかいあう めんを たすと 7 に なる きまりで、「うえ」か「した」の めんの 目を あてる。
// 2つの さいころで「ひとつ わかると つぎも わかる」つながる もんだいも だす。

// さいころの 目 → 向き（ほんものの さいころと おなじ ならび）
const VEC = {1: [0, 0, 1], 6: [0, 0, -1], 2: [0, 1, 0], 5: [0, -1, 0], 3: [1, 0, 0], 4: [-1, 0, 0]};
const numOf = v => +Object.keys(VEC).find(k => VEC[k].every((x, i) => x === v[i]));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// ランダムな むきの さいころ：うえ・まえ・みぎ
function randomDie() {
  const top = 1 + ri(Math.random, 6);
  let front; do { front = 1 + ri(Math.random, 6); } while (front === top || front === 7 - top);
  return {top, front, right: numOf(cross(VEC[top], VEC[front]))};
}

function numpad(ans, onPick) {
  const box = $('choices'); box.innerHTML = '<div class="numpad" id="np"></div>';
  for (let v = 1; v <= 6; v++) {
    const b = document.createElement('button'); b.textContent = v;
    b.onclick = () => { [...$('np').children].forEach((x, i) => { x.disabled = true; if (i + 1 === ans) x.classList.add('right'); }); if (v !== ans) b.classList.add('wrong'); onPick(v); };
    $('np').appendChild(b);
  }
}
const judge = (ok, why, done) => { say('say-quiz', (ok ? 'せいかい！ ' : 'ざんねん。') + why, ok ? 'ok' : 'ng'); done(ok); };

// もんだいの しゅるい
const KINDS = {
  // A：うえが 見えて いる → した
  shita(done) {
    const d = randomDie(), ans = 7 - d.top;
    $('stem').textContent = 'この さいころの「した」の めん（やじるしの ところ）の 目は いくつですか。';
    $('fig').innerHTML = CUBE.dieSVG([d], {marks: [{die: 0, face: 'bottom'}]});
    numpad(ans, v => judge(v === ans, `したと むかいあうのは うえの めん（${d.top}）。7−${d.top}＝${ans}`, done));
  },
  // B：うえが ？、したの 目が わかって いる → うえ
  ue(done) {
    const d = randomDie(), ans = d.top, under = 7 - d.top;
    $('stem').textContent = `この さいころの「した」の めんの 目は ${under}です。「うえ」の めん（？）の 目は いくつですか。`;
    $('fig').innerHTML = CUBE.dieSVG([{...d, top: null}], {marks: [{die: 0, face: 'top'}, {die: 0, face: 'bottom', label: under}]});
    numpad(ans, v => judge(v === ans, `うえと むかいあうのは したの めん（${under}）。7−${under}＝${ans}`, done));
  },
  // C：つながる もんだい（みぎの した → ひだりの した → ひだりの うえ）
  tsunagu(done) {
    const a = randomDie(), b = randomDie();
    const bBottom = 7 - b.top, aBottom = 7 - a.top, sum = aBottom + bBottom, ans = a.top;
    $('stem').textContent = '2つの さいころの「した」の めんを あわせると、ずの ように なります。ひだりの さいころの「うえ」の めん（？）の 目は いくつですか。';
    $('fig').innerHTML = CUBE.dieSVG([{...a, top: null}, b], {marks: [{die: 0, face: 'top'}, {die: 0, face: 'bottom', blank: true}, {die: 1, face: 'bottom', blank: true}], sum: `あわせて ${sum}`});
    numpad(ans, v => judge(v === ans,
      `① みぎの したは 7−${b.top}＝${bBottom}。② ひだりの したは ${sum}−${bBottom}＝${aBottom}。③ ひだりの うえは 7−${aBottom}＝${ans}`, done));
  }
};
// でやすさ（A・B を おおめに）
const BAG = ['shita', 'shita', 'shita', 'shita', 'ue', 'ue', 'ue', 'ue', 'tsunagu', 'tsunagu'];

MQ.run({total: 5, autoNext: 1800, ask(n, done) {
  KINDS[BAG[ri(Math.random, BAG.length)]](done);
  if (n === 1) say('say-quiz', 'さいころは、うえと したの めんの 目を たすと 7に なるよ。');
}});
