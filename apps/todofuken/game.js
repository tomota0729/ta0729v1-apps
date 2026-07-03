// 都道府県タッチ - game.js

// ---- 都道府県データ (group: 地理グループ) ----
// id は japan-map.js の <g data-code="N"> と一致する（1〜47）
const PREFS = [
  // 北海道 group:0
  { id:1,  name:'北海道',  ruby:'ほっかいどう', group:0 },
  // 東北 group:1
  { id:2,  name:'青森',   ruby:'あおもり',     group:1 },
  { id:3,  name:'岩手',   ruby:'いわて',       group:1 },
  { id:4,  name:'宮城',   ruby:'みやぎ',       group:1 },
  { id:5,  name:'秋田',   ruby:'あきた',       group:1 },
  { id:6,  name:'山形',   ruby:'やまがた',     group:1 },
  { id:7,  name:'福島',   ruby:'ふくしま',     group:1 },
  // 関東 group:2
  { id:8,  name:'茨城',   ruby:'いばらき',     group:2 },
  { id:9,  name:'栃木',   ruby:'とちぎ',       group:2 },
  { id:10, name:'群馬',   ruby:'ぐんま',       group:2 },
  { id:11, name:'埼玉',   ruby:'さいたま',     group:2 },
  { id:12, name:'千葉',   ruby:'ちば',         group:2 },
  { id:13, name:'東京',   ruby:'とうきょう',   group:2 },
  { id:14, name:'神奈川', ruby:'かながわ',     group:2 },
  // 中部 group:3
  { id:15, name:'新潟',   ruby:'にいがた',     group:3 },
  { id:16, name:'富山',   ruby:'とやま',       group:3 },
  { id:17, name:'石川',   ruby:'いしかわ',     group:3 },
  { id:18, name:'福井',   ruby:'ふくい',       group:3 },
  { id:19, name:'山梨',   ruby:'やまなし',     group:3 },
  { id:20, name:'長野',   ruby:'ながの',       group:3 },
  { id:21, name:'静岡',   ruby:'しずおか',     group:3 },
  { id:22, name:'愛知',   ruby:'あいち',       group:3 },
  { id:23, name:'岐阜',   ruby:'ぎふ',         group:3 },
  // 近畿 group:4
  { id:24, name:'三重',   ruby:'みえ',         group:4 },
  { id:25, name:'滋賀',   ruby:'しが',         group:4 },
  { id:26, name:'京都',   ruby:'きょうと',     group:4 },
  { id:27, name:'大阪',   ruby:'おおさか',     group:4 },
  { id:28, name:'兵庫',   ruby:'ひょうご',     group:4 },
  { id:29, name:'奈良',   ruby:'なら',         group:4 },
  { id:30, name:'和歌山', ruby:'わかやま',     group:4 },
  // 中国 group:5
  { id:31, name:'鳥取',   ruby:'とっとり',     group:5 },
  { id:32, name:'島根',   ruby:'しまね',       group:5 },
  { id:33, name:'岡山',   ruby:'おかやま',     group:5 },
  { id:34, name:'広島',   ruby:'ひろしま',     group:5 },
  { id:35, name:'山口',   ruby:'やまぐち',     group:5 },
  // 四国 group:6
  { id:36, name:'徳島',   ruby:'とくしま',     group:6 },
  { id:37, name:'香川',   ruby:'かがわ',       group:6 },
  { id:38, name:'愛媛',   ruby:'えひめ',       group:6 },
  { id:39, name:'高知',   ruby:'こうち',       group:6 },
  // 九州 group:7
  { id:40, name:'福岡',   ruby:'ふくおか',     group:7 },
  { id:41, name:'佐賀',   ruby:'さが',         group:7 },
  { id:42, name:'長崎',   ruby:'ながさき',     group:7 },
  { id:43, name:'熊本',   ruby:'くまもと',     group:7 },
  { id:44, name:'大分',   ruby:'おおいた',     group:7 },
  { id:45, name:'宮崎',   ruby:'みやざき',     group:7 },
  { id:46, name:'鹿児島', ruby:'かごしま',     group:7 },
  // 沖縄 group:8
  { id:47, name:'沖縄',   ruby:'おきなわ',     group:8 },
];

// グループごとの色（地図表示用）
const GROUP_COLORS = {
  0: '#80CBC4', // 北海道 teal
  1: '#90CAF9', // 東北   blue
  2: '#A5D6A7', // 関東   green
  3: '#FFE082', // 中部   yellow
  4: '#FFAB91', // 近畿   orange
  5: '#CE93D8', // 中国   purple
  6: '#80DEEA', // 四国   cyan
  7: '#F48FB1', // 九州   pink
  8: '#BCAAA4', // 沖縄   brown
};

// クイズのエリア設定
const QUIZ_REGIONS = [
  { label:'北海道・東北', ruby:'ほっかいどう・とうほく', emoji:'🌲', groups:[0,1], color:'#81C784' },
  { label:'関東',         ruby:'かんとう',               emoji:'🏙', groups:[2],   color:'#64B5F6' },
  { label:'中部',         ruby:'ちゅうぶ',               emoji:'🗻', groups:[3],   color:'#FFD54F' },
  { label:'近畿',         ruby:'きんき',                 emoji:'⛩', groups:[4],   color:'#FF8A65' },
  { label:'中国・四国',   ruby:'ちゅうごく・しこく',     emoji:'🌊', groups:[5,6], color:'#BA68C8' },
  { label:'九州・沖縄',   ruby:'きゅうしゅう・おきなわ', emoji:'🌺', groups:[7,8], color:'#F06292' },
  { label:'全国チャレンジ', ruby:'ぜんこくチャレンジ',   emoji:'🗾', groups:[0,1,2,3,4,5,6,7,8], color:'#26A69A' },
];

const QUESTIONS_PER_ROUND = 3;

// ---- ゲーム状態 ----
let G = { regionIdx: 0, pool: [], questions: [], qIdx: 0, correct: 0, wrong: [], wrongIds: new Set() };

const $ = id => document.getElementById(id);

// ---- 地図のSVG生成（本物の日本地図を注入） ----
function buildMap() {
  const wrap = $('mapWrap');
  wrap.innerHTML = JAPAN_MAP_SVG;

  // <title>（県名ツールチップ）を除去 → ホバーで答えが漏れないように
  wrap.querySelectorAll('title').forEach(t => t.remove());

  // 各都道府県をグループ色で塗る
  resetAllPrefColors();
}

// data-code="id" の <g> に fill を設定（子の polygon/path は継承する）
function setPrefColor(id, color) {
  const el = document.querySelector(`#prefMap [data-code="${id}"]`);
  if (el) el.setAttribute('fill', color);
}

function resetAllPrefColors() {
  PREFS.forEach(p => setPrefColor(p.id, GROUP_COLORS[p.group]));
}

// ---- 地図ズーム（該当地方だけ大きく表示） ----
const FULL_VIEWBOX = '0 0 1000 1000';

// 要素の外接矩形をルートSVGの座標系へ変換して返す
function svgSpaceRect(el, svg) {
  const b = el.getBBox();
  const ctm = svg.getScreenCTM().inverse().multiply(el.getScreenCTM());
  const corners = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]];
  const pts = corners.map(([x, y]) => {
    const p = svg.createSVGPoint(); p.x = x; p.y = y;
    return p.matrixTransform(ctm);
  });
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

// 指定県の集合にviewBoxをフィットさせる
function fitViewBoxTo(prefIds) {
  const svg = $('prefMap');
  if (!svg || !svg.getScreenCTM) return;
  try {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    prefIds.forEach(id => {
      const el = svg.querySelector(`[data-code="${id}"]`);
      if (!el) return;
      const r = svgSpaceRect(el, svg);
      minX = Math.min(minX, r.minX); minY = Math.min(minY, r.minY);
      maxX = Math.max(maxX, r.maxX); maxY = Math.max(maxY, r.maxY);
    });
    if (!isFinite(minX)) return;
    const w = maxX - minX, h = maxY - minY;
    const padX = w * 0.08 + 10, padY = h * 0.08 + 10;
    svg.setAttribute('viewBox', `${minX - padX} ${minY - padY} ${w + padX * 2} ${h + padY * 2}`);
  } catch (e) { /* getScreenCTMが取れない場合は何もしない */ }
}

function setFit(prefIds) {
  G.fitPrefIds = prefIds;
  applyZoom();
}

function applyZoom() {
  const svg = $('prefMap');
  if (!svg) return;
  if (G.zoomedOut || !G.fitPrefIds || !G.fitPrefIds.length) {
    svg.setAttribute('viewBox', FULL_VIEWBOX);
  } else {
    fitViewBoxTo(G.fitPrefIds);
  }
  updateZoomBtn();
}

function updateZoomBtn() {
  const btn = $('zoomToggle');
  if (btn) btn.textContent = G.zoomedOut ? '🔍 ちほうをアップ' : '🗾 ぜんたいを見る';
}

// ---- 画面切り替え ----
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(`screen-${name}`).classList.add('active');
  $('appHeader').style.display = '';
}

// ---- エリア選択 ----
function initRegionSelect() {
  const grid = $('regionGrid');
  grid.innerHTML = '';

  QUIZ_REGIONS.forEach((r, i) => {
    const btn = document.createElement('button');
    btn.className = 'region-btn' + (i === QUIZ_REGIONS.length - 1 ? ' all-btn' : '');
    btn.style.borderColor = r.color;
    const count = PREFS.filter(p => r.groups.includes(p.group)).length;
    btn.innerHTML = `
      <span class="r-emoji">${r.emoji}</span>
      <span class="r-name" style="color:${r.color}">${r.label}</span>
      <span class="r-ruby">${r.ruby}</span>
      <span class="r-count">${count}けん</span>
    `;
    btn.addEventListener('click', () => startQuiz(i));
    grid.appendChild(btn);
  });

  showScreen('region');
}

// ---- クイズ開始 ----
function startQuiz(regionIdx) {
  G.regionIdx = regionIdx;
  const r = QUIZ_REGIONS[regionIdx];
  G.pool = PREFS.filter(p => r.groups.includes(p.group));

  // シャッフルして最大QUESTIONS_PER_ROUND問
  const shuffled = [...G.pool].sort(() => Math.random() - 0.5);
  G.questions = shuffled.slice(0, Math.min(QUESTIONS_PER_ROUND, shuffled.length));
  G.qIdx = 0;
  G.correct = 0;
  G.wrong = [];
  G.wrongIds = new Set();
  G.zoomedOut = false;
  G.isNationwide = (regionIdx === QUIZ_REGIONS.length - 1);
  // 地方モードは選んだ地方全体にフィット。全国は問題ごとにフィットする。
  G.fitPrefIds = G.isNationwide ? null : G.pool.map(p => p.id);

  showScreen('quiz');
  resetAllPrefColors();
  showQuestion();
}

// ---- 問題表示 ----
function showQuestion() {
  const q = G.questions[G.qIdx];
  $('qProgress').textContent = `${G.qIdx + 1} / ${G.questions.length}`;
  $('qScore').textContent = `✅ ${G.correct}`;
  $('questionText').textContent = `この県はどこ？`;
  $('btnNext').style.display = 'none';

  // 全県をリセット、対象県をハイライト
  resetAllPrefColors();
  setPrefColor(q.id, '#FF6F00');

  // 対象県を点滅で強調
  const svg = $('prefMap');
  if (svg) {
    svg.querySelectorAll('.target-pulse').forEach(e => e.classList.remove('target-pulse'));
    const tgt = svg.querySelector(`[data-code="${q.id}"]`);
    if (tgt) tgt.classList.add('target-pulse');
  }

  // 地図ズーム：問題が変わったら該当地方にフィット（拡大状態を解除）
  G.zoomedOut = false;
  if (G.isNationwide) {
    setFit(PREFS.filter(p => p.group === q.group).map(p => p.id));
  } else {
    applyZoom();
  }

  // 選択肢生成
  const choices = makeChoices(q);
  renderChoices(choices, q.id);
}

function makeChoices(target) {
  // 同じグループから優先的に誤答候補を集める
  let pool = G.pool.filter(p => p.id !== target.id);

  // プールが3未満の場合は全都道府県から補充
  if (pool.length < 3) {
    pool = PREFS.filter(p => p.id !== target.id);
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const wrong = shuffled.slice(0, 3);
  return [...wrong, target].sort(() => Math.random() - 0.5);
}

function renderChoices(choices, correctId) {
  const container = $('choices');
  container.innerHTML = '';

  choices.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.dataset.id = p.id;
    btn.innerHTML = `
      <span class="c-name">${p.name}</span>
      <span class="c-ruby">${p.ruby}</span>
    `;
    btn.addEventListener('click', () => handleChoice(p.id, correctId, choices));
    container.appendChild(btn);
  });
}

// ---- 答え合わせ ----
function handleChoice(selectedId, correctId, choices) {
  // ボタンを無効化
  $('choices').querySelectorAll('.choice-btn').forEach(b => b.disabled = true);

  // 点滅を止める（正誤の色を見やすく）
  const svg = $('prefMap');
  if (svg) svg.querySelectorAll('.target-pulse').forEach(e => e.classList.remove('target-pulse'));

  const isCorrect = selectedId === correctId;

  if (isCorrect) {
    G.correct++;
    $('qScore').textContent = `✅ ${G.correct}`;
    setPrefColor(correctId, '#43A047');
    // 正解ボタンを緑に
    $('choices').querySelector(`[data-id="${correctId}"]`).classList.add('correct');
    // 0.9秒後に次へ自動進行
    setTimeout(nextOrResult, 900);

  } else {
    G.wrongIds.add(correctId);
    G.wrong.push(PREFS.find(p => p.id === correctId));
    setPrefColor(selectedId, '#E53935');
    setPrefColor(correctId, '#43A047');
    // 押したボタンを赤、正解ボタンを緑
    $('choices').querySelector(`[data-id="${selectedId}"]`).classList.add('wrong');
    $('choices').querySelector(`[data-id="${correctId}"]`).classList.add('correct');
    // 「つぎへ」ボタンを表示
    $('btnNext').style.display = '';
  }
}

function nextOrResult() {
  G.qIdx++;
  if (G.qIdx < G.questions.length) {
    showQuestion();
  } else {
    showResult();
  }
}

// ---- 結果 ----
function showResult() {
  showScreen('result');

  const total = G.questions.length;
  const pct = Math.round(G.correct / total * 100);

  let emoji = '😊';
  if (pct === 100) emoji = '🏆';
  else if (pct >= 80) emoji = '🎉';
  else if (pct >= 60) emoji = '👍';
  else emoji = '📖';

  $('resultEmoji').textContent = emoji;
  $('resultScoreText').textContent =
    `${total}もんちゅう ${G.correct}もんせいかい！（${pct}%）`;

  // 苦手リスト
  const nigate = $('nigate');
  const list = $('nigateList');
  // 重複除去
  const uniqueWrong = [...new Map(G.wrong.map(p => [p.id, p])).values()];
  if (uniqueWrong.length > 0) {
    nigate.style.display = '';
    list.innerHTML = uniqueWrong.map(p => `
      <div class="nigate-chip">
        <span class="nc-name">${p.name}</span>
        <span class="nc-ruby">${p.ruby}</span>
      </div>
    `).join('');
  } else {
    nigate.style.display = 'none';
  }
}

// ---- 起動 ----
document.addEventListener('DOMContentLoaded', () => {
  buildMap();
  initRegionSelect();

  $('btnNext').addEventListener('click', nextOrResult);
  $('btnRetry').addEventListener('click', () => startQuiz(G.regionIdx));
  $('btnBackRegion').addEventListener('click', initRegionSelect);
  $('zoomToggle').addEventListener('click', () => {
    G.zoomedOut = !G.zoomedOut;
    applyZoom();
  });
});
