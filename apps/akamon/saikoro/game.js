// さいころの かくれた め - game.js
// むかいあう めんを たすと 7 に なる きまりで、「うえ」か「した」の めんの 目を かんがえる。
// もんだいは「した」「うえ」「ふたつ（2つの さいころの つながる もんだい）」の 3しゅるい。

// さいころの 目 → 向き（ほんものの さいころと おなじ ならび）
const VEC = {1: [0, 0, 1], 6: [0, 0, -1], 2: [0, 1, 0], 5: [0, -1, 0], 3: [1, 0, 0], 4: [-1, 0, 0]};
const numOf = v => +Object.keys(VEC).find(k => VEC[k].every((x, i) => x === v[i]));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// ランダムな むきの さいころ：うえ・まえ・みぎ（top を きめたい ときは わたす）
function randomDie(top = 1 + ri(Math.random, 6)) {
  let front; do { front = 1 + ri(Math.random, 6); } while (front === top || front === 7 - top);
  return {top, front, right: numOf(cross(VEC[top], VEC[front]))};
}

// ---- こたえかた ----
function numpad(ans, onPick) {
  const box = $('choices'); box.innerHTML = '<div class="numpad" id="np"></div>';
  for (let v = 1; v <= 6; v++) {
    const b = document.createElement('button'); b.textContent = v;
    b.onclick = () => { [...$('np').children].forEach((x, i) => { x.disabled = true; if (i + 1 === ans) x.classList.add('right'); }); if (v !== ans) b.classList.add('wrong'); onPick(v === ans); };
    $('np').appendChild(b);
  }
}
const judge = (ok, why, done) => { say('say-quiz', (ok ? 'せいかい！ ' : 'ざんねん。') + why, ok ? 'ok' : 'ng'); done(ok); };

// ---- もんだいの しゅるい（した・うえ・ふたつ） ----
const KINDS = {
  // 1 うえが 見えて いる → した
  shita(done) {
    const d = randomDie(), ans = 7 - d.top;
    $('stem').textContent = 'この さいころの「した」の めん（やじるしの ところ）の 目は いくつですか。';
    $('fig').innerHTML = CUBE.dieSVG([d], {marks: [{die: 0, face: 'bottom'}]});
    numpad(ans, ok => judge(ok, `したと むかいあうのは うえの めん（${d.top}）。7−${d.top}＝${ans}`, done));
  },
  // 2 したの 目が わかって いる → うえ
  ue(done) {
    const d = randomDie(), ans = d.top, under = 7 - d.top;
    $('stem').textContent = `この さいころの「した」の めんの 目は ${under}です。「うえ」の めん（？）の 目は いくつですか。`;
    $('fig').innerHTML = CUBE.dieSVG([{...d, top: null}], {marks: [{die: 0, face: 'top'}, {die: 0, face: 'bottom', label: under}]});
    numpad(ans, ok => judge(ok, `うえと むかいあうのは したの めん（${under}）。7−${under}＝${ans}`, done));
  },
  // 3 ふたつ（つながる）：したを あわせると ○ → ひだりの うえ
  tsunagu(done) {
    const a = randomDie(), b = randomDie(), aB = 7 - a.top, bB = 7 - b.top, sum = aB + bB, ans = a.top;
    $('stem').textContent = '2つの さいころの「した」の めんを あわせると、ずの ように なります。ひだりの さいころの「うえ」の めん（？）の 目は いくつですか。';
    $('fig').innerHTML = CUBE.dieSVG([{...a, top: null}, b], {marks: [{die: 0, face: 'top'}, {die: 0, face: 'bottom', blank: true}, {die: 1, face: 'bottom', blank: true}], sum: `あわせて ${sum}`});
    numpad(ans, ok => judge(ok, `① みぎの したは 7−${b.top}＝${bB}。② ひだりの したは ${sum}−${bB}＝${aB}。③ ひだりの うえは 7−${aB}＝${ans}`, done));
  },
};

// ---- 5もんの くみあわせ（した・うえ・ふたつ の かず）----
// 10とおりから 1つを ランダムに えらび、5もんの じゅんばんも まぜる。
// ふつうは どれも 1もん いじょう でる。10かいに 1かいは むずかしい「ふたつ 5もん」。
const PATTERNS = [
  [3, 1, 1], [1, 3, 1], [1, 1, 3],
  [2, 2, 1], [2, 2, 1], [2, 1, 2], [2, 1, 2], [1, 2, 2], [1, 2, 2],
  [0, 0, 5]   // むずかしい
];
let order = [];

MQ.run({total: 5, autoNext: 1800, ask(n, done) {
  if (n === 1) {
    const [s, u, f] = PATTERNS[ri(Math.random, PATTERNS.length)];
    order = shuffle([...Array(s).fill('shita'), ...Array(u).fill('ue'), ...Array(f).fill('tsunagu')]);
  }
  KINDS[order[n - 1]](done);
  if (n === 1) say('say-quiz', f5() ? 'きょうは むずかしい かい！ ぜんぶ 2つの さいころだよ。' : 'さいころは、うえと したの めんの 目を たすと 7に なるよ。');
}});
function f5() { return order.every(k => k === 'tsunagu'); }
