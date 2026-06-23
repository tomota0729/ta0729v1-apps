// ---- 状態管理 ----
const state = {
  grade: null,
  questions: [],
  current: 0,
  answers: [],
  timer: null,  // 進行中のタイマーを追跡
};

// ---- ユーティリティ ----
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeLabel(item) {
  const parts = [];
  if (item.kun) parts.push(item.kun);
  if (item.on)  parts.push(item.on);
  return parts.join(' / ');
}

// ---- 画面切り替え ----
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ---- 学年選択画面 ----
function initGradeScreen() {
  const grid = document.getElementById('gradeGrid');
  grid.innerHTML = '';
  Object.entries(GRADE_INFO).forEach(([grade, info]) => {
    const btn = document.createElement('button');
    btn.className = 'grade-btn' + (info.available ? '' : ' disabled');
    btn.style.borderTop = `5px solid ${info.color}`;
    btn.innerHTML = `
      <span class="grade-label">${info.label}</span>
      <span class="grade-count">${info.count}字</span>
    `;
    if (info.available) {
      btn.addEventListener('click', () => startQuiz(Number(grade)));
    }
    grid.appendChild(btn);
  });
  showScreen('screen-grade');
}

// ---- クイズ開始 ----
function startQuiz(grade) {
  if (state.timer) { clearTimeout(state.timer); state.timer = null; }
  state.grade = grade;
  const pool = KANJI_DATA[grade];
  state.questions = shuffle(pool).slice(0, 5);
  state.current = 0;
  state.answers = [];
  showScreen('screen-quiz');
  renderQuestion();
}

// ---- 問題表示 ----
function renderQuestion() {
  const q = state.questions[state.current];
  const total = state.questions.length;

  // プログレスバー
  document.getElementById('progressBar').style.width = `${(state.current / total) * 100}%`;
  document.getElementById('quizCounter').textContent = `${state.current + 1} / ${total}`;

  // 漢字
  document.getElementById('kanjiDisplay').textContent = q.kanji;

  // 選択肢生成（正解1 + 不正解3）
  const pool = KANJI_DATA[state.grade];
  const wrongItems = pool
    .filter(k => k.kanji !== q.kanji)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const allChoices = shuffle([{ ...q, isCorrect: true }, ...wrongItems.map(w => ({ ...w, isCorrect: false }))]);

  const choicesEl = document.getElementById('choices');
  choicesEl.innerHTML = '';

  allChoices.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.dataset.correct = item.isCorrect ? '1' : '0';

    btn.innerHTML = `
      <div class="choice-row">
        <span class="choice-label on-label">音</span>
        <span class="choice-reading">${item.on || '―'}</span>
      </div>
      <div class="choice-row">
        <span class="choice-label kun-label">訓</span>
        <span class="choice-reading">${item.kun || '―'}</span>
      </div>
    `;

    btn.addEventListener('click', () => selectAnswer(btn, item.isCorrect, makeLabel(q), makeLabel(item)));
    choicesEl.appendChild(btn);
  });
}

// ---- 回答選択 ----
function selectAnswer(selectedBtn, isCorrect, correctLabel, chosenLabel) {
  // 全ボタン無効化
  const allBtns = document.querySelectorAll('.choice-btn');
  allBtns.forEach(b => {
    b.classList.add('answered');
    b.style.cursor = 'default';
    // 正解ボタンを常に緑にする
    if (b.dataset.correct === '1') {
      b.classList.add('correct');
    }
  });

  // 選んだボタンが不正解なら赤に
  if (!isCorrect) {
    selectedBtn.classList.add('wrong');
    selectedBtn.classList.remove('correct');
  }

  showFeedback(isCorrect);

  state.answers.push({
    correct: isCorrect,
    kanji: state.questions[state.current].kanji,
    answer: correctLabel,
    chosen: chosenLabel,
  });

  if (isCorrect) {
    state.timer = setTimeout(() => {
      state.timer = null;
      nextQuestion();
    }, 1300);
  } else {
    document.getElementById('btnNext').style.display = 'block';
  }
}

// ---- 次の問題へ進む ----
function nextQuestion() {
  document.getElementById('btnNext').style.display = 'none';
  state.current++;
  if (state.current < state.questions.length) {
    renderQuestion();
  } else {
    showResult();
  }
}

// ---- フィードバック表示 ----
function showFeedback(isCorrect) {
  const el = document.getElementById('feedbackOverlay');
  el.textContent = isCorrect ? '⭕' : '❌';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 750);
}

// ---- 結果画面 ----
function showResult() {
  const correct = state.answers.filter(a => a.correct).length;
  const total = state.answers.length;

  document.getElementById('scoreNum').textContent = correct;
  document.getElementById('scoreTotal').textContent = total;

  const msgs = [
    'またちゃれんじしよう！🌟',
    'もうすこし！がんばって！💪',
    'もうすこし！がんばって！💪',
    'よくできました！😊',
    'すごい！よくできました！✨',
    'かんぺき！すばらしい！🎉',
  ];
  document.getElementById('resultMessage').textContent = msgs[correct] || msgs[0];

  // 問題一覧
  const list = document.getElementById('resultList');
  list.innerHTML = '';
  state.answers.forEach(a => {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.innerHTML = `
      <div class="ri-kanji">${a.kanji}</div>
      <div class="ri-readings">
        <div class="ri-correct">正解：${a.answer}</div>
        ${!a.correct ? `<div style="color:#F44336;font-size:0.85rem">あなた：${a.chosen}</div>` : ''}
      </div>
      <div class="ri-mark">${a.correct ? '⭕' : '❌'}</div>
    `;
    list.appendChild(item);
  });

  showScreen('screen-result');
}

// ---- ボタンイベント ----
document.getElementById('btnNext').addEventListener('click', nextQuestion);
document.getElementById('btnBackFromQuiz').addEventListener('click', () => {
  if (confirm('やめますか？')) initGradeScreen();
});
document.getElementById('btnRetry').addEventListener('click', () => startQuiz(state.grade));
document.getElementById('btnBackToGrade').addEventListener('click', initGradeScreen);

// ---- 起動 ----
initGradeScreen();
