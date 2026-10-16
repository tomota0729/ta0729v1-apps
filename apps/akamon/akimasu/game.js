// てんかいずの あいた ます - game.js
// さいころの てんかいずに 3つだけ 数が かいて ある。むかいあう めんを たすと 7 に なる きまりで、
// 「？」の ます 1つの 数を こたえる。こたえたら 数の はいった てんかいずを くみたてて たしかめる。

let net = null;   // {cells, face, num, shown, target}

function newNet() {
  const {cells} = CUBE.randomNet();
  const {face} = CUBE.roll(cells);
  // めんの くみ (0,1)(2,3)(4,5) に、(1,6)(2,5)(3,4) を ランダムに わりあてる
  const pairs = shuffle([[1, 6], [2, 5], [3, 4]]).map(p => Math.random() < .5 ? p : [p[1], p[0]]);
  const num = face.map(f => pairs[f >> 1][f & 1]);
  // くみごとに 1つは 見せて、もう1つを かくす。かくした うちの 1つを「？」に
  const shown = cells.map(() => false);
  [0, 1, 2].forEach(g => { const idx = face.map((f, i) => (f >> 1) === g ? i : -1).filter(i => i >= 0); shown[idx[ri(Math.random, 2)]] = true; });
  const hidden = cells.map((_, i) => i).filter(i => !shown[i]);
  return {cells, face, num, shown, target: hidden[ri(Math.random, hidden.length)]};
}

function draw(hintPair) {
  const t = net.target, answered = hintPair !== undefined;
  const text = net.cells.map((_, i) => net.shown[i] ? net.num[i] : i === t ? (answered ? net.num[i] : '？') : '');
  const fill = net.cells.map((_, i) => answered && (net.face[i] >> 1) === hintPair ? CUBE.COLORS[hintPair] : (net.shown[i] ? '#F7D6E3' : CUBE.PINK));
  const ring = net.cells.map((_, i) => i === t);
  const textColor = net.cells.map((_, i) => i === t ? '#D6363A' : '#1C2B45');
  $('fig').innerHTML = CUBE.netSVG(net.cells, {S: 70, text, fill, ring, textColor});
}

// keepQ … まちがえた ときは「？」の めんを「？」の まま くみたてる
function showFold(keepQ) {
  say('say-quiz', 'みて いてね。1まいずつ おって いくよ……');
  const text = net.num.map((v, i) => keepQ && i === net.target ? '？' : v);
  CUBE.play($('fig'), net.cells, {text, fill: net.face.map(x => CUBE.COLORS[x >> 1])}, () =>
    say('say-quiz', keepQ
      ? '「？」と おなじ いろの めんが むかいあって いるね。たすと 7に なる 数を かんがえよう。'
      : 'さいころに なったね。おなじ いろの めんが むかいあって、たすと 7だよ。', keepQ ? 'ng' : 'ok'));
}

MQ.run({total: 5, ask(n, done) {
  net = newNet();
  const target = net.target;
  const partner = net.face.findIndex(f => f === CUBE.opposite(net.face[target]));
  const ans = net.num[target];
  $('stem').textContent = 'てんかいずを くみたてて さいころに します。「？」の ますに はいる 数は いくつですか。';
  draw();
  const box = $('choices'); box.innerHTML = '<div class="numpad" id="np"></div>';
  for (let v = 1; v <= 6; v++) {
    const b = document.createElement('button'); b.textContent = v;
    b.onclick = () => {
      [...$('np').children].forEach((x, i) => { x.disabled = true; if (i + 1 === ans) x.classList.add('right'); });
      if (v !== ans) b.classList.add('wrong');
      draw(net.face[target] >> 1);   // むかいあう 2つの めんを おなじ いろで ひからせる
      const why = `「？」と むかいあうのは ${net.num[partner]}の めん。7−${net.num[partner]}＝${ans}`;
      say('say-quiz', v === ans ? `せいかい！ ${why}` : `ざんねん。${why}`, v === ans ? 'ok' : 'ng');
      // こたえたら じどうで くみたてる（せいかいなら 見おわってから つぎへ）
      done(v === ans, [], {wait: 17000});
      setTimeout(() => { if (b.isConnected) showFold(v !== ans); }, 1500);
    };
    $('np').appendChild(b);
  }
  if (n === 1) say('say-quiz', '「？」と むかいあう めんを さがそう。まっすぐ 3つ ならんだ とき、りょうはしが むかいあうよ。');
}});
