// おえかき - app.js

const canvas = document.getElementById('canvas');
const box = document.getElementById('canvasBox');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;
const $ = id => document.getElementById(id);

// ---- 設定 ----
const COLORS = ['#E53935', '#FB8C00', '#FDD835', '#43A047', '#1E88E5', '#00ACC1', '#8E24AA', '#EC407A', '#6D4C41', '#000000'];
const SIZES = [4, 10, 18, 28, 40];
const TOOLS = [
  { id: 'pen',      em: '✏', name: 'ペン' },
  { id: 'eraser',   em: '🧽', name: 'けしゴム' },
  { id: 'rainbow',  em: '🌈', name: 'にじいろ' },
  { id: 'stamp',    em: '⭐', name: 'スタンプ' },
  { id: 'coloring', em: '🖍', name: 'ぬりえ' }
];
const STAMPS = ['🐶', '🐱', '🐰', '⭐', '🌟', '🌸', '🌈', '🦋', '🚗', '🚀', '🍓', '❤️'];
const TEMPLATES = [
  { em: '🌸', name: 'はな' }, { em: '🚗', name: 'くるま' }, { em: '🐱', name: 'ねこ' },
  { em: '🦋', name: 'ちょう' }, { em: '🐟', name: 'さかな' }, { em: '❤️', name: 'ハート' }
];

const state = { color: COLORS[0], size: 18, shape: 'round', tool: 'pen', stamp: STAMPS[0], hue: 0 };
const undoStack = [];

// ---- キャンバスのサイズ調整（絵を保持） ----
function fit(preserve) {
  const data = preserve ? canvas.toDataURL() : null;
  const r = box.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(r.width * dpr));
  canvas.height = Math.max(1, Math.round(r.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, r.width, r.height);
  if (data) {
    const img = new Image();
    img.onload = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    img.src = data;
  }
}
const W = () => box.getBoundingClientRect().width;
const H = () => box.getBoundingClientRect().height;

function hint(m) { $('hint').textContent = m; }

// ---- undo ----
function snapshot() {
  try { undoStack.push(canvas.toDataURL()); if (undoStack.length > 12) undoStack.shift(); } catch (e) {}
}
function restore(url) {
  const img = new Image();
  img.onload = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  img.src = url;
}

// ---- 色 ----
function buildColors() {
  const wrap = $('colors');
  COLORS.forEach((c, i) => {
    const b = document.createElement('div');
    b.className = 'swatch' + (i === 0 ? ' on' : '');
    b.style.background = c;
    b.addEventListener('click', () => {
      state.color = c;
      if (state.tool !== 'pen' && state.tool !== 'rainbow') setTool('pen');
      wrap.querySelectorAll('.swatch').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
    });
    wrap.appendChild(b);
  });
}

// ---- ペンの形 ----
function buildShapes() {
  const wrap = $('shapeSeg');
  [['round', '●'], ['square', '■']].forEach(([sh, label], i) => {
    const b = document.createElement('button');
    b.className = 'opt' + (i === 0 ? ' on' : '');
    b.textContent = label;
    b.addEventListener('click', () => {
      state.shape = sh;
      wrap.querySelectorAll('.opt').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      updateSizePrev();
      buildSizePop();
    });
    wrap.appendChild(b);
  });
}

// ---- ふとさ ----
function updateSizePrev() {
  const d = $('sizePrev');
  const v = Math.max(8, Math.min(22, state.size * 0.6));
  d.style.width = v + 'px';
  d.style.height = v + 'px';
  d.style.borderRadius = state.shape === 'square' ? '3px' : '50%';
}
function buildSizePop() {
  const pop = $('sizePop');
  pop.innerHTML = '';
  SIZES.forEach(sz => {
    const d = document.createElement('div');
    d.className = 'size-dot' + (sz === state.size ? ' on' : '');
    const v = Math.max(10, sz * 0.8);
    d.style.width = v + 'px';
    d.style.height = v + 'px';
    d.style.borderRadius = state.shape === 'square' ? '3px' : '50%';
    d.addEventListener('click', () => {
      state.size = sz;
      buildSizePop();
      updateSizePrev();
      pop.classList.remove('show');
      fitSoon();
    });
    pop.appendChild(d);
  });
}

// ---- モード（道具）＆ピッカー ----
function buildTools() {
  const wrap = $('tools');
  TOOLS.forEach(t => {
    const b = document.createElement('button');
    b.className = 'tool' + (t.id === 'pen' ? ' on' : '');
    b.dataset.t = t.id;
    b.innerHTML = `<span class="em">${t.em}</span>${t.name}`;
    b.addEventListener('click', () => { setTool(t.id); fitSoon(); });
    wrap.appendChild(b);
  });

  const sp = $('stampPick');
  STAMPS.forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'pick' + (i === 0 ? ' on' : '');
    b.textContent = s;
    b.addEventListener('click', () => {
      state.stamp = s;
      sp.querySelectorAll('.pick').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
    });
    sp.appendChild(b);
  });

  const cp = $('colorPick');
  TEMPLATES.forEach(t => {
    const b = document.createElement('button');
    b.className = 'pick';
    b.textContent = t.em;
    b.title = t.name;
    b.addEventListener('click', () => loadTemplate(t.name));
    cp.appendChild(b);
  });
}

function setTool(id) {
  state.tool = id;
  $('tools').querySelectorAll('.tool').forEach(x => x.classList.toggle('on', x.dataset.t === id));
  $('stampPick').classList.toggle('show', id === 'stamp');
  $('colorPick').classList.toggle('show', id === 'coloring');
  const names = { pen: 'ペン', eraser: 'けしゴム', rainbow: 'にじいろ', stamp: 'スタンプ', coloring: 'ぬりえ' };
  $('modeBtn').textContent = 'モード：' + names[id] + ' ▾';
  hint(id === 'eraser' ? 'なぞって けすよ'
     : id === 'rainbow' ? 'かくと いろが かわる！'
     : id === 'stamp' ? 'したの えを えらんで タップ'
     : id === 'coloring' ? 'したの えを えらんで いろぬり'
     : 'ペンで かくよ');
}

// ---- ぬりえテンプレ ----
function loadTemplate(name) {
  snapshot();
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W(), H());
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  const cx = W() / 2, cy = H() / 2;
  const TAU = Math.PI * 2;
  if (name === 'はな') {
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU;
      ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * 55, cy + Math.sin(a) * 55, 34, 34, 0, 0, TAU); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(cx, cy, 30, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy + 62); ctx.lineTo(cx, cy + 150); ctx.stroke();
  } else if (name === 'ハート') {
    ctx.beginPath();
    ctx.moveTo(cx, cy + 70);
    ctx.bezierCurveTo(cx - 115, cy - 20, cx - 50, cy - 100, cx, cy - 40);
    ctx.bezierCurveTo(cx + 50, cy - 100, cx + 115, cy - 20, cx, cy + 70);
    ctx.stroke();
  } else if (name === 'くるま') {
    ctx.strokeRect(cx - 90, cy - 12, 180, 56);
    ctx.beginPath();
    ctx.moveTo(cx - 58, cy - 12); ctx.lineTo(cx - 38, cy - 52); ctx.lineTo(cx + 38, cy - 52); ctx.lineTo(cx + 64, cy - 12);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(cx - 52, cy + 52, 20, 0, TAU); ctx.moveTo(cx + 72, cy + 52); ctx.arc(cx + 52, cy + 52, 20, 0, TAU); ctx.stroke();
  } else if (name === 'さかな') {
    ctx.beginPath(); ctx.ellipse(cx - 14, cy, 80, 46, 0, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 64, cy); ctx.lineTo(cx + 112, cy - 38); ctx.lineTo(cx + 112, cy + 38); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx - 54, cy - 10, 5, 0, TAU); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(cx, cy, 72, 0, TAU); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 58, cy - 54); ctx.lineTo(cx - 38, cy - 100); ctx.lineTo(cx - 10, cy - 64);
    ctx.moveTo(cx + 58, cy - 54); ctx.lineTo(cx + 38, cy - 100); ctx.lineTo(cx + 10, cy - 64);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(cx - 26, cy - 8, 6, 0, TAU); ctx.moveTo(cx + 32, cy - 8); ctx.arc(cx + 26, cy - 8, 6, 0, TAU); ctx.stroke();
  }
  hint('すきな いろで ぬってね！');
}

// ---- 描画 ----
let drawing = false, last = null;
function pos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function penColor() {
  if (state.tool === 'eraser') return '#fff';
  if (state.tool === 'rainbow') { state.hue = (state.hue + 12) % 360; return `hsl(${state.hue},85%,55%)`; }
  return state.color;
}
function dot(p) {
  const c = penColor();
  ctx.fillStyle = c;
  const s = state.size;
  if (state.shape === 'square') ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
  else { ctx.beginPath(); ctx.arc(p.x, p.y, s / 2, 0, Math.PI * 2); ctx.fill(); }
}
function segment(a, b) {
  const c = penColor();
  ctx.strokeStyle = c;
  ctx.lineWidth = state.size;
  ctx.lineCap = state.shape === 'square' ? 'butt' : 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  if (state.shape === 'square') dot(b);
}

canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  if (state.tool === 'stamp') {
    snapshot();
    const p = pos(e);
    ctx.font = (state.size * 2.4) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.stamp, p.x, p.y);
    return;
  }
  drawing = true;
  last = pos(e);
  snapshot();
  dot(last);
});
canvas.addEventListener('pointermove', e => {
  if (!drawing) return;
  e.preventDefault();
  const p = pos(e);
  segment(last, p);
  last = p;
});
function endDraw() { drawing = false; last = null; }
canvas.addEventListener('pointerup', endDraw);
canvas.addEventListener('pointercancel', endDraw);
canvas.addEventListener('pointerleave', endDraw);

// ---- 保存（写真へ／ダウンロード） ----
function dataURLtoBlob(url) {
  const parts = url.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const bin = atob(parts[1]);
  let n = bin.length;
  const u8 = new Uint8Array(n);
  while (n--) u8[n] = bin.charCodeAt(n);
  return new Blob([u8], { type: mime });
}
function save() {
  const blob = dataURLtoBlob(canvas.toDataURL('image/png'));
  const file = new File([blob], 'oekaki.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: 'おえかき' })
      .then(() => hint('ほぞんできたかな？'))
      .catch(() => {});
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'oekaki.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  hint('がぞうを ほぞんしたよ！');
}

// ---- ボタン ----
let resizeTimer = null;
function fitSoon() { requestAnimationFrame(() => fit(true)); }

document.addEventListener('DOMContentLoaded', () => {
  buildColors();
  buildShapes();
  buildSizePop();
  updateSizePrev();
  buildTools();
  fit(false);

  $('sizeBtn').addEventListener('click', () => {
    const show = $('sizePop').classList.toggle('show');
    if (show) { $('modePanel').classList.remove('show'); $('modeBtn').classList.remove('on'); }
    fitSoon();
  });
  $('modeBtn').addEventListener('click', () => {
    const show = $('modePanel').classList.toggle('show');
    $('modeBtn').classList.toggle('on', show);
    if (show) $('sizePop').classList.remove('show');
    fitSoon();
  });

  $('btnUndo').addEventListener('click', () => { if (undoStack.length) restore(undoStack.pop()); });
  $('btnClear').addEventListener('click', () => {
    if (confirm('ぜんぶ けしても いい？')) { snapshot(); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W(), H()); hint('まっしろに なったよ！'); }
  });
  $('btnSave').addEventListener('click', save);

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => fit(true), 150);
  });
  window.addEventListener('orientationchange', () => setTimeout(() => fit(true), 250));
});
