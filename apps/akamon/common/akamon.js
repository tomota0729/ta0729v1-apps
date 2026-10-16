// 赤門クイズ 共通 - akamon.js
// どの問題でも使う：効果音・はなまる・ひとこと・ボタン列・ランダム

// ---- サウンド（簡易WebAudio） ----
const Sound={
  ctx:null,
  init(){if(this.ctx)return;try{this.ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}},
  beep(freqs,dur=0.15,type='sine',vol=0.2){
    this.init();if(!this.ctx)return;if(this.ctx.state==='suspended')this.ctx.resume();
    const t=this.ctx.currentTime;
    freqs.forEach((f,i)=>{
      const o=this.ctx.createOscillator(),g=this.ctx.createGain();
      o.type=type;o.connect(g);g.connect(this.ctx.destination);o.frequency.value=f;
      const st=t+i*dur;g.gain.setValueAtTime(vol,st);g.gain.exponentialRampToValueAtTime(0.001,st+dur);
      o.start(st);o.stop(st+dur);
    });
  },
  step(){this.beep([660],0.06,'triangle',0.12)},
  wrong(){this.beep([200,150],0.14,'sawtooth',0.16)},
  finish(){this.beep([523,659,784,1047],0.16)}
};

// ---- 小さな道具 ----
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const $=id=>document.getElementById(id);

// ランダム（seed つき：さいしょの 1もんを いつも おなじに したいとき用）
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const ri=(rng,n)=>Math.floor(rng()*n);
function shuffle(arr,rng=Math.random){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=ri(rng,i+1);[a[i],a[j]]=[a[j],a[i]]}return a}

// ひとこと（tone: 'ok' | 'ng'）
function say(id,text,tone){const e=$(id);e.textContent=text;e.className='say'+(tone?' '+tone:'')}

// したの ボタン列。list = [[id, 'ラベル', 関数, primary?], ...]
function actions(list,boxId='q-actions'){
  const box=$(boxId);box.innerHTML='';const out={};
  list.forEach(([id,label,fn,primary])=>{
    const b=document.createElement('button');b.className='btn'+(primary?' primary':'');b.textContent=label;b.onclick=fn;box.appendChild(b);out[id]=b;
  });
  return out;
}

// ---- はなまる ----
let score=0;
function ensureHana(){
  if($('hana'))return;
  const d=document.createElement('div');d.id='hana';d.hidden=true;
  // ふつうの 赤い まる（さっと かいて、すぐ きえる）
  d.innerHTML='<svg viewBox="0 0 300 300" aria-hidden="true"><circle class="ring" cx="150" cy="150" r="110"/></svg>';
  document.body.appendChild(d);
}
// まちがいの ばつ（さっと かいて、すぐ きえる）
let batsuTimers=[];
function batsu(){
  let d=$('batsu');
  if(!d){
    d=document.createElement('div');d.id='batsu';d.hidden=true;
    d.innerHTML='<svg viewBox="0 0 300 300" aria-hidden="true"><path class="b1" d="M70 70 L230 230"/><path class="b2" d="M230 70 L70 230"/></svg>';
    document.body.appendChild(d);
  }
  batsuTimers.forEach(clearTimeout);
  d.hidden=false;d.className='';d.getBoundingClientRect();d.className='on';
  batsuTimers=[setTimeout(()=>d.classList.add('out'),700),setTimeout(()=>{d.hidden=true;d.className=''},1000)];
}
let hanaTimers=[];
function hanamaru(){
  ensureHana();
  score++;if($('score'))$('score').textContent=score;Sound.finish();
  hanaTimers.forEach(clearTimeout);
  const h=$('hana');h.hidden=false;h.className='';h.getBoundingClientRect();h.className='on';
  hanaTimers=[setTimeout(()=>h.classList.add('out'),700),setTimeout(()=>{h.hidden=true;h.className=''},1000)];
}
