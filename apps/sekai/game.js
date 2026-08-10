// せかいの国タッチ - game.js
// 世界地図で国をハイライト → 4択で国名をこたえる

const $ = id => document.getElementById(id);

// ---- 大陸ごとの色 ----
const REGION_COLORS = {
  asia:     '#FFCDD2',
  europe:   '#BBDEFB',
  africa:   '#FFE0B2',
  namerica: '#C8E6C9',
  samerica: '#E1BEE7',
  oceania:  '#B2EBF2',
};
const NEUTRAL = '#DCE3EA';   // 対象外の国
const TARGET  = '#FF6F00';   // 出題中の国（オレンジ）

// ---- 国データ（code は SVG の id＝ISO 3166-1 alpha-2 小文字） ----
const COUNTRIES = [
  // アジア（ロシアは地図が横に広いのでズームの都合上アジアに含める）
  { code:'jp', name:'日本',        ruby:'にほん',         region:'asia' },
  { code:'cn', name:'中国',        ruby:'ちゅうごく',     region:'asia' },
  { code:'kr', name:'韓国',        ruby:'かんこく',       region:'asia' },
  { code:'in', name:'インド',      ruby:'いんど',         region:'asia' },
  { code:'th', name:'タイ',        ruby:'たい',           region:'asia' },
  { code:'vn', name:'ベトナム',    ruby:'べとなむ',       region:'asia' },
  { code:'id', name:'インドネシア',ruby:'いんどねしあ',   region:'asia' },
  { code:'ph', name:'フィリピン',  ruby:'ふぃりぴん',     region:'asia' },
  { code:'sa', name:'サウジアラビア',ruby:'さうじあらびあ',region:'asia' },
  { code:'mn', name:'モンゴル',    ruby:'もんごる',       region:'asia' },
  { code:'ru', name:'ロシア',      ruby:'ろしあ',         region:'asia' },
  // ヨーロッパ
  { code:'fr', name:'フランス',    ruby:'ふらんす',       region:'europe' },
  { code:'de', name:'ドイツ',      ruby:'どいつ',         region:'europe' },
  { code:'it', name:'イタリア',    ruby:'いたりあ',       region:'europe' },
  { code:'gb', name:'イギリス',    ruby:'いぎりす',       region:'europe' },
  { code:'es', name:'スペイン',    ruby:'すぺいん',       region:'europe' },
  { code:'nl', name:'オランダ',    ruby:'おらんだ',       region:'europe' },
  { code:'ch', name:'スイス',      ruby:'すいす',         region:'europe' },
  { code:'gr', name:'ギリシャ',    ruby:'ぎりしゃ',       region:'europe' },
  { code:'se', name:'スウェーデン',ruby:'すうぇーでん',   region:'europe' },
  // アフリカ
  { code:'eg', name:'エジプト',    ruby:'えじぷと',       region:'africa' },
  { code:'za', name:'南アフリカ',  ruby:'みなみあふりか', region:'africa' },
  { code:'ke', name:'ケニア',      ruby:'けにあ',         region:'africa' },
  { code:'ng', name:'ナイジェリア',ruby:'ないじぇりあ',   region:'africa' },
  { code:'ma', name:'モロッコ',    ruby:'もろっこ',       region:'africa' },
  { code:'et', name:'エチオピア',  ruby:'えちおぴあ',     region:'africa' },
  // 北アメリカ
  { code:'us', name:'アメリカ',    ruby:'あめりか',       region:'namerica' },
  { code:'ca', name:'カナダ',      ruby:'かなだ',         region:'namerica' },
  { code:'mx', name:'メキシコ',    ruby:'めきしこ',       region:'namerica' },
  { code:'cu', name:'キューバ',    ruby:'きゅーば',       region:'namerica' },
  // 南アメリカ
  { code:'br', name:'ブラジル',    ruby:'ぶらじる',       region:'samerica' },
  { code:'ar', name:'アルゼンチン',ruby:'あるぜんちん',   region:'samerica' },
  { code:'cl', name:'チリ',        ruby:'ちり',           region:'samerica' },
  { code:'pe', name:'ペルー',      ruby:'ぺるー',         region:'samerica' },
  { code:'co', name:'コロンビア',  ruby:'ころんびあ',     region:'samerica' },
  // オセアニア
  { code:'au', name:'オーストラリア',ruby:'おーすとらりあ',region:'oceania' },
  { code:'nz', name:'ニュージーランド',ruby:'にゅーじーらんど',region:'oceania' },
  { code:'pg', name:'パプアニューギニア',ruby:'ぱぷあにゅーぎにあ',region:'oceania' },
];

// ---- 大陸メニュー ----
const QUIZ_REGIONS = [
  { key:'asia',     label:'アジア',      ruby:'あじあ',         emoji:'🌏' },
  { key:'europe',   label:'ヨーロッパ',  ruby:'よーろっぱ',     emoji:'🏰' },
  { key:'africa',   label:'アフリカ',    ruby:'あふりか',       emoji:'🦁' },
  { key:'namerica', label:'北アメリカ',  ruby:'きたあめりか',   emoji:'🗽' },
  { key:'samerica', label:'南アメリカ',  ruby:'みなみあめりか', emoji:'⚽' },
  { key:'oceania',  label:'オセアニア',  ruby:'おせあにあ',     emoji:'🐨' },
  { key:'all',      label:'ぜんぶ',      ruby:'ぜんぶチャレンジ',emoji:'🌐' },
];

const QUESTIONS_PER_ROUND = 5;
const FULL_VIEWBOX = '30.767 241.591 784.077 458.627';

let svg = null;   // #worldMap

// ---- 状態 ----
let G = {
  regionKey: 'asia',
  isAll: false,
  pool: [],
  questions: [],
  qIdx: 0,
  correct: 0,
  wrongCodes: [],
  zoomLevel: 'region',   // 'country' | 'region' | 'full'
};

// ---- ユーティリティ ----
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function findCountry(code) { return COUNTRIES.find(c => c.code === code); }
function elFor(code) { return svg.querySelector('[id="' + code + '"]'); }

// ---- 地図の色 ----
function setColor(code, color) {
  const el = elFor(code);
  if (!el) return;
  el.setAttribute('fill', color);
  el.querySelectorAll('path').forEach(p => p.setAttribute('fill', color));
}
function neutralizeAll() {
  svg.querySelectorAll('path').forEach(p => p.setAttribute('fill', NEUTRAL));
}
// プールの国を地域色にもどす（対象外はグレーのまま）
function paintPool() {
  neutralizeAll();
  G.pool.forEach(c => setColor(c.code, REGION_COLORS[c.region]));
}

// ---- 地図の構築 ----
function buildMap() {
  const wrap = $('mapWrap');
  wrap.innerHTML = WORLD_MAP_SVG;
  svg = $('worldMap');
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.querySelectorAll('title').forEach(t => t.remove());
  neutralizeAll();
}

// ---- ズーム（viewBox を対象にフィット） ----
// 要素のバウンディングボックスを SVG ルート座標系に変換
function svgSpaceRect(el) {
  const bb = el.getBBox();
  const m = svg.getScreenCTM().inverse().multiply(el.getScreenCTM());
  const pts = [
    { x: bb.x, y: bb.y },
    { x: bb.x + bb.width, y: bb.y },
    { x: bb.x, y: bb.y + bb.height },
    { x: bb.x + bb.width, y: bb.y + bb.height },
  ].map(p => {
    const sp = svg.createSVGPoint();
    sp.x = p.x; sp.y = p.y;
    return sp.matrixTransform(m);
  });
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  return {
    x: Math.min(...xs), y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}
function fitViewBoxTo(codes, padFrac, padMin) {
  if (padFrac == null) padFrac = 0.08;
  if (padMin == null) padMin = 10;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  codes.forEach(code => {
    const el = elFor(code);
    if (!el) return;
    let r;
    try { r = svgSpaceRect(el); } catch (e) { return; }
    if (!isFinite(r.x) || r.w <= 0) return;
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.w);
    maxY = Math.max(maxY, r.y + r.h);
  });
  if (!isFinite(minX)) { svg.setAttribute('viewBox', FULL_VIEWBOX); return; }
  const w = maxX - minX, h = maxY - minY;
  const padX = w * padFrac + padMin, padY = h * padFrac + padMin;
  svg.setAttribute('viewBox',
    (minX - padX) + ' ' + (minY - padY) + ' ' + (w + padX * 2) + ' ' + (h + padY * 2));
}
// 出題中の国が見える範囲へズーム
function applyZoom() {
  const q = G.questions[G.qIdx];
  if (!q) return;
  if (G.zoomLevel === 'full') {
    svg.setAttribute('viewBox', FULL_VIEWBOX);
  } else if (G.zoomLevel === 'country') {
    // その国に大きく寄る（まわりも少し見える）
    fitViewBoxTo([q.code], 0.7, 16);
  } else if (G.isAll) {
    // たいりく（ぜんぶモード）：その国の大陸にズーム
    const region = findCountry(q.code).region;
    fitViewBoxTo(COUNTRIES.filter(c => c.region === region).map(c => c.code));
  } else {
    // たいりく：えらんだ大陸にズーム
    fitViewBoxTo(G.pool.map(c => c.code));
  }
}
function updateZoomBtn() {
  document.querySelectorAll('.zoom-btn').forEach(b =>
    b.classList.toggle('on', b.dataset.z === G.zoomLevel));
}

// ---- 画面切替 ----
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $('screen-' + name).classList.add('active');
}

// ---- 大陸選択画面 ----
function buildRegionSelect() {
  const grid = $('regionGrid');
  grid.innerHTML = '';
  QUIZ_REGIONS.forEach(r => {
    const count = r.key === 'all'
      ? COUNTRIES.length
      : COUNTRIES.filter(c => c.region === r.key).length;
    const btn = document.createElement('button');
    btn.className = 'region-btn' + (r.key === 'all' ? ' all-btn' : '');
    btn.innerHTML =
      '<span class="r-emoji">' + r.emoji + '</span>' +
      '<span class="r-name">' + r.label + '</span>' +
      '<span class="r-ruby">' + r.ruby + '</span>' +
      '<span class="r-count">' + count + 'か国</span>';
    btn.addEventListener('click', () => startQuiz(r.key));
    grid.appendChild(btn);
  });
}

// ---- クイズ開始 ----
function startQuiz(regionKey) {
  G.regionKey = regionKey;
  G.isAll = (regionKey === 'all');
  G.pool = G.isAll ? COUNTRIES.slice() : COUNTRIES.filter(c => c.region === regionKey);
  const n = Math.min(QUESTIONS_PER_ROUND, G.pool.length);
  G.questions = shuffle(G.pool).slice(0, n);
  G.qIdx = 0;
  G.correct = 0;
  G.wrongCodes = [];
  G.zoomLevel = 'region';

  showScreen('quiz');
  updateZoomBtn();
  paintPool();
  showQuestion();
}

// ---- 出題 ----
function showQuestion() {
  const q = G.questions[G.qIdx];
  $('qProgress').textContent = (G.qIdx + 1) + ' / ' + G.questions.length;
  $('qScore').textContent = '◯ ' + G.correct;
  $('questionText').textContent = 'この国は どこ？';
  $('btnNext').style.display = 'none';

  paintPool();
  setColor(q.code, TARGET);
  const tEl = elFor(q.code);
  if (tEl) tEl.classList.add('target-pulse');

  renderChoices(makeChoices(q), q.code);
  applyZoom();
}

// 正解＋同じ大陸から誤答3つ（足りなければ全体から補う）
function makeChoices(target) {
  const same = G.pool.filter(c => c.code !== target.code && c.region === target.region);
  let wrongs = shuffle(same).slice(0, 3);
  if (wrongs.length < 3) {
    const others = shuffle(COUNTRIES.filter(c =>
      c.code !== target.code && !wrongs.some(w => w.code === c.code)));
    wrongs = wrongs.concat(others.slice(0, 3 - wrongs.length));
  }
  return shuffle([target, ...wrongs]);
}

function renderChoices(choices, correctCode) {
  const box = $('choices');
  box.innerHTML = '';
  choices.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.dataset.code = c.code;
    btn.innerHTML =
      '<span class="c-name">' + c.name + '</span>' +
      '<span class="c-ruby">' + c.ruby + '</span>';
    btn.addEventListener('click', () => handleChoice(c.code, correctCode, btn));
    box.appendChild(btn);
  });
}

function handleChoice(chosen, correctCode, btn) {
  const btns = [...$('choices').children];
  btns.forEach(b => b.disabled = true);

  const q = G.questions[G.qIdx];
  const tEl = elFor(q.code);
  if (tEl) tEl.classList.remove('target-pulse');

  if (chosen === correctCode) {
    btn.classList.add('correct');
    G.correct++;
    $('qScore').textContent = '◯ ' + G.correct;
    setColor(correctCode, '#43A047');
    setTimeout(nextOrResult, 900);
  } else {
    btn.classList.add('wrong');
    btns.find(b => b.dataset.code === correctCode).classList.add('correct');
    if (!G.wrongCodes.includes(correctCode)) G.wrongCodes.push(correctCode);
    setColor(correctCode, '#43A047');
    $('btnNext').style.display = 'block';
  }
}

function nextOrResult() {
  G.qIdx++;
  if (G.qIdx >= G.questions.length) showResult();
  else showQuestion();
}

// ---- 結果 ----
function showResult() {
  const total = G.questions.length;
  const pct = G.correct / total;
  let emoji = '🎉';
  if (pct < 0.5) emoji = '💪';
  else if (pct < 0.8) emoji = '😊';
  else if (pct < 1) emoji = '👏';
  $('resultEmoji').textContent = emoji;
  $('resultScoreText').textContent = total + 'もん中 ' + G.correct + 'もん せいかい！';

  const wrap = $('nigateWrap');
  const list = $('nigateList');
  if (G.wrongCodes.length === 0) {
    wrap.style.display = 'none';
  } else {
    wrap.style.display = 'block';
    list.innerHTML = '';
    G.wrongCodes.forEach(code => {
      const c = findCountry(code);
      if (!c) return;
      const chip = document.createElement('div');
      chip.className = 'nigate-chip';
      chip.innerHTML =
        '<span class="nc-name">' + c.name + '</span>' +
        '<span class="nc-ruby">' + c.ruby + '</span>';
      list.appendChild(chip);
    });
  }
  showScreen('result');
}

// ---- 起動 ----
document.addEventListener('DOMContentLoaded', () => {
  buildMap();
  buildRegionSelect();

  $('btnHome').addEventListener('click', () => location.href = '../../');
  document.querySelectorAll('.zoom-btn').forEach(b => {
    b.addEventListener('click', () => {
      G.zoomLevel = b.dataset.z;
      updateZoomBtn();
      applyZoom();
    });
  });
  $('btnNext').addEventListener('click', nextOrResult);
  $('btnRetry').addEventListener('click', () => startQuiz(G.regionKey));
  $('btnBackRegion').addEventListener('click', () => showScreen('region'));
});
