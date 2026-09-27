// ボタンで動かそう - game.js

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

const BTN={
  up:{sym:'▲',dr:-1,dc:0,n:2,label:'うえに 2ます',cls:'k-up',col:'--b-up'},
  down:{sym:'●',dr:1,dc:0,n:1,label:'したに 1ます',cls:'k-down',col:'--b-down'},
  left:{sym:'◆',dr:0,dc:-1,n:2,label:'ひだりに 2ます',cls:'k-left',col:'--b-left'},
  right:{sym:'★',dr:0,dc:1,n:3,label:'みぎに 3ます',cls:'k-right',col:'--b-right'}
};
const ORDER=['up','down','left','right'];
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const STEP=RM?80:240;
const CELL=60;
const NS='http://www.w3.org/2000/svg';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const K=(r,c)=>r*100+c;
const $=id=>document.getElementById(id);
function el(tag,attrs={},parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}
const REASON={
  out:'ますの そとに でちゃうので エラー！ 🚗は まったく うごきません。',
  visited:'いちど とおった ますを また とおるので エラー！ 🚗は まったく うごきません。'
};

/* ルール本体：1回ボタンを押したときの動き */
function tryMove(rows,cols,pos,visited,key){
  const b=BTN[key];let r=pos[0],c=pos[1];const path=[];
  for(let i=0;i<b.n;i++){
    r+=b.dr;c+=b.dc;
    if(r<0||r>=rows||c<0||c>=cols)return{ok:false,reason:'out',path,bad:[r,c]};
    if(visited.has(K(r,c)))return{ok:false,reason:'visited',path,bad:[r,c]};
    path.push([r,c]);
  }
  return{ok:true,path,end:[r,c]};
}
function simulate(rows,cols,start,seq){
  const visited=new Set([K(...start)]);let pos=start;const trail=[start];
  for(let i=0;i<seq.length;i++){
    const res=tryMove(rows,cols,pos,visited,seq[i]);
    if(!res.ok)return{ok:false,at:i,reason:res.reason,trail};
    for(const p of res.path){visited.add(K(...p));trail.push(p)}
    pos=res.end;
  }
  return{ok:true,end:pos,trail,visited};
}

class Board{
  constructor(svg,opts={}){this.svg=svg;this.onCell=opts.onCell||null;this.onChange=opts.onChange||null;this.busy=false}
  setup({rows,cols,start,home=null,items=[]}){
    Object.assign(this,{rows,cols,start,home,items});this.build();this.reset();
  }
  build(){
    const S=CELL,m=S*.55,svg=this.svg;svg.innerHTML='';
    svg.setAttribute('viewBox',`${-m} ${-m} ${this.cols*S+2*m} ${this.rows*S+2*m}`);
    const gC=el('g',{},svg);this.rects=[];
    for(let r=0;r<this.rows;r++){this.rects.push([]);for(let c=0;c<this.cols;c++){
      const rc=el('rect',{x:c*S,y:r*S,width:S,height:S,class:'cell'+(this.onCell?' clickable':'')},gC);
      if(this.onCell)rc.addEventListener('click',()=>this.onCell(r,c));
      this.rects[r].push(rc);
    }}
    el('rect',{x:0,y:0,width:this.cols*S,height:this.rows*S,class:'frame'},svg);
    this.gMarks=el('g',{},svg);
    this.poly=el('polyline',{class:'trail'},svg);
    const [sx,sy]=this.center(...this.start);
    el('circle',{cx:sx,cy:sy,r:6,class:'start-dot'},svg);
    if(this.home){const [x,y]=this.center(...this.home);const t=el('text',{x,y,class:'emoji'},svg);t.textContent='🏠'}
    this.itemEls=this.items.map(it=>{const [x,y]=this.center(...it);const t=el('text',{x,y,class:'emoji item'},svg);t.textContent='🍎';return t});
    this.gErr=el('g',{},svg);
    this.car=el('g',{class:'car'},svg);
    this.carIn=el('g',{},this.car);
    const t=el('text',{x:0,y:0,class:'emoji'},this.carIn);t.textContent='🚗';
  }
  center(r,c){return[c*CELL+CELL/2,r*CELL+CELL/2]}
  visitedSet(){return new Set(this.trail.map(p=>K(...p)))}
  reset(){
    this.pos=[...this.start];this.trail=[[...this.start]];this.hist=[];
    this.clearErr();this.clearMarks();this.draw();this.placeCar(true);this.onChange&&this.onChange();
  }
  draw(){
    const v=this.visitedSet();
    for(let r=0;r<this.rows;r++)for(let c=0;c<this.cols;c++)this.rects[r][c].classList.toggle('visited',v.has(K(r,c)));
    this.poly.setAttribute('points',this.trail.map(p=>this.center(...p).join(',')).join(' '));
    this.items.forEach((it,i)=>this.itemEls[i].classList.toggle('got',v.has(K(...it))));
  }
  placeCar(jump){
    const [x,y]=this.center(...this.pos);
    if(jump){this.car.classList.add('jump');this.car.style.transform=`translate(${x}px,${y}px)`;this.car.getBoundingClientRect();this.car.classList.remove('jump')}
    else this.car.style.transform=`translate(${x}px,${y}px)`;
  }
  async press(key){
    if(this.busy)return null;this.busy=true;this.clearErr();
    const res=tryMove(this.rows,this.cols,this.pos,this.visitedSet(),key);
    if(!res.ok){Sound.wrong();await this.showErr(res)}
    else{
      for(const cell of res.path){this.pos=cell;this.trail.push(cell);Sound.step();this.draw();this.placeCar();await sleep(STEP)}
      this.hist.push({key,len:res.path.length});
    }
    this.busy=false;this.onChange&&this.onChange();return res;
  }
  undo(){
    if(this.busy||!this.hist.length)return;
    const h=this.hist.pop();this.trail.splice(this.trail.length-h.len);this.pos=this.trail[this.trail.length-1];
    this.clearErr();this.draw();this.placeCar();this.onChange&&this.onChange();
  }
  async showErr(res){
    const pts=[this.pos,...res.path,res.bad].map(p=>this.center(...p));
    const [bx,by]=pts[pts.length-1];
    // そとに出る場合は ×印を枠のすぐ外に
    const clamp=(v,max)=>Math.max(-CELL*.3,Math.min(max+CELL*.3,v));
    const ex=clamp(bx,this.cols*CELL),ey=clamp(by,this.rows*CELL);
    pts[pts.length-1]=[ex,ey];
    el('polyline',{points:pts.map(p=>p.join(',')).join(' '),class:'err-line'},this.gErr);
    const t=el('text',{x:ex,y:ey,class:'err-x'},this.gErr);t.textContent='×';
    this.carIn.classList.remove('shake');this.carIn.getBoundingClientRect();this.carIn.classList.add('shake');
    await sleep(500);
  }
  clearErr(){this.gErr&&(this.gErr.innerHTML='')}
  clearMarks(){this.gMarks&&(this.gMarks.innerHTML='')}
  mark(r,c,cls){const [x,y]=this.center(r,c);el('circle',{cx:x,cy:y,r:CELL*.4,class:cls},this.gMarks)}
  ghost(key,res){
    const color=`var(${BTN[key].col})`;
    const pts=[this.pos,...res.path];if(!res.ok)pts.push(res.bad);
    const cs=pts.map(p=>this.center(...p));
    if(!res.ok){const l=cs[cs.length-1];l[0]=Math.max(-CELL*.3,Math.min(this.cols*CELL+CELL*.3,l[0]));l[1]=Math.max(-CELL*.3,Math.min(this.rows*CELL+CELL*.3,l[1]))}
    el('polyline',{points:cs.map(p=>p.join(',')).join(' '),class:'ghost'+(res.ok?'':' ng'),style:`stroke:${color}`},this.gMarks);
    const [x,y]=cs[cs.length-1];
    if(res.ok){el('circle',{cx:x,cy:y,r:17,class:'ghost-end',style:`fill:${color}`},this.gMarks);const t=el('text',{x,y,class:'ghost-lbl'},this.gMarks);t.textContent=BTN[key].sym}
    else{const t=el('text',{x,y,class:'err-x'},this.gMarks);t.textContent='×'}
  }
}

function makePad(box,onPress,toggle){
  box.innerHTML='';box.classList.toggle('toggle',!!toggle);const map={};
  for(const k of ORDER){
    const b=document.createElement('button');b.className='pad-btn '+BTN[k].cls;
    b.innerHTML=`<span class="s">${BTN[k].sym}</span><span class="l">${BTN[k].label}</span>`+(toggle?'<span class="res"></span>':'');
    b.setAttribute('aria-label',BTN[k].sym+' '+BTN[k].label);
    if(toggle)b.setAttribute('aria-pressed','false');
    b.addEventListener('click',()=>onPress(k,b));box.appendChild(b);map[k]=b;
  }
  return map;
}
function chip(k){const s=document.createElement('span');s.className='chip '+BTN[k].cls;s.textContent=BTN[k].sym;return s}
function chipsInto(box,seq,arrows){
  box.innerHTML='';seq.forEach((k,i)=>{if(i&&arrows){const a=document.createElement('span');a.className='arrow';a.textContent='→';box.appendChild(a)}box.appendChild(chip(k))});
}
function say(id,text,tone){const e=$(id);e.textContent=text;e.className='say'+(tone?' '+tone:'')}

/* はなまる */
let score=0;
function hanamaru(){
  score++;$('score').textContent=score;Sound.finish();
  const h=$('hana');h.hidden=false;h.className='';h.getBoundingClientRect();h.className='on';
  setTimeout(()=>h.classList.add('out'),1900);setTimeout(()=>{h.hidden=true;h.className=''},2500);
}

/* タブ */
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(x=>x.setAttribute('aria-selected',x===t?'true':'false'));
  ['rule','free','quiz'].forEach(n=>$('p-'+n).hidden=n!==t.dataset.tab);
}));

/* ① きまり */
const bRule=new Board($('b-rule'));
bRule.setup({rows:6,cols:6,start:[4,3],home:[3,4]});
let demoRunning=false;
makePad($('pad-rule'),async k=>{
  if(demoRunning)return;
  const r=await bRule.press(k);if(!r)return;
  if(r.ok){say('say-rule',`${BTN[k].sym} は ${BTN[k].label} すすむよ。`+(bRule.home&&K(...bRule.pos)===K(...bRule.home)?' 🏠に ついた！':''))}
  else say('say-rule',REASON[r.reason],'ng');
});
$('rule-undo').onclick=()=>{if(!demoRunning){bRule.undo();say('say-rule','1つ もどしたよ。')}};
$('rule-reset').onclick=()=>{if(!demoRunning){bRule.reset();say('say-rule','はじめに もどしたよ。')}};
const DEMOS=[
  {seq:['right'],intro:'🚗は みぎから 3ばんめの ますに いるよ。★で みぎに 3ます すすめるかな？',end:''},
  {seq:['left','up','right','down'],intro:'◆→▲→★→● の じゅんに おしてみるよ。',end:'🏠に ついた！ どの ますも 1かいしか とおって いないから だいじょうぶ。'},
  {seq:['up','left','down','right'],intro:'こんどは ▲→◆→●→★ の じゅんに おしてみるよ。',end:''}
];
document.querySelectorAll('.demo-btn').forEach(btn=>btn.addEventListener('click',async()=>{
  if(demoRunning||bRule.busy)return;demoRunning=true;
  const d=DEMOS[+btn.dataset.demo];bRule.reset();say('say-rule',d.intro);await sleep(RM?300:1300);
  for(const k of d.seq){
    say('say-rule',`${BTN[k].sym} を おすと…… ${BTN[k].label}`);await sleep(RM?200:700);
    const r=await bRule.press(k);
    if(!r.ok){
      say('say-rule',REASON[r.reason]+(r.reason==='visited'?' ×の ますは さっき とおった ますだね。':' ますは みぎに 2つしか ないね。'),'ng');
      demoRunning=false;return;
    }
    await sleep(RM?100:450);
  }
  say('say-rule',d.end,'ok');demoRunning=false;
}));

/* ② じゆう */
const bFree=new Board($('b-free'),{onChange:()=>{
  chipsInto($('free-hist'),bFree.hist.map(h=>h.key),true);
  $('free-count').textContent=`とおった ます：${bFree.trail.length} こ　／　おした かず：${bFree.hist.length} かい`;
}});
bFree.setup({rows:6,cols:6,start:[3,2]});
makePad($('pad-free'),async k=>{
  const r=await bFree.press(k);if(!r)return;
  if(r.ok)say('say-free',`${BTN[k].sym}：${BTN[k].label} すすんだよ。`);
  else{
    // どのボタンも押せないか
    const any=ORDER.some(x=>tryMove(6,6,bFree.pos,bFree.visitedSet(),x).ok);
    say('say-free',REASON[r.reason]+(any?'':' もう どの ボタンも おせないね。「1つ もどす」か「はじめから」で やりなおそう。'),'ng');
  }
});
$('free-undo').onclick=()=>{bFree.undo();say('say-free','1つ もどしたよ。')};
$('free-reset').onclick=()=>{bFree.reset();say('say-free','はじめに もどしたよ。')};

/* ③ もんだい */
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const ri=(rng,n)=>Math.floor(rng()*n);
const N=6;
let qType=1,Q={},first={1:true,2:true,3:true};
const bQuiz=new Board($('b-quiz'),{onCell:(r,c)=>{if(qType===2)pickCell(r,c)}});
function actions(list){const box=$('q-actions');box.innerHTML='';const out={};list.forEach(([id,label,fn,primary])=>{const b=document.createElement('button');b.className='btn'+(primary?' primary':'');b.textContent=label;b.onclick=fn;box.appendChild(b);out[id]=b});return out}

/* (1) おせる ボタンを ぜんぶ えらぶ */
function newQ1(){
  let pos,ans;
  if(first[1]){pos=[1,2];first[1]=false}
  else do{pos=[ri(Math.random,N),ri(Math.random,N)];ans=ORDER.filter(k=>tryMove(N,N,pos,new Set([K(...pos)]),k).ok)}while(ans.length<1||ans.length>3);
  ans=ORDER.filter(k=>tryMove(N,N,pos,new Set([K(...pos)]),k).ok);
  Q={pos,ans,sel:new Set(),done:false};
  bQuiz.setup({rows:N,cols:N,start:pos});
  $('q-title').textContent='(1) おせる ボタンは どれ？';
  $('q-text').textContent='🚗が いま いる ところで、おせる ボタンを ぜんぶ えらんでね。（そとに でちゃう ボタンは おせないよ）';
  $('q-chips').innerHTML='';$('q-legend').textContent='';
  const pad=makePad($('pad-quiz'),(k,b)=>{
    if(Q.done)return;
    Q.sel.has(k)?Q.sel.delete(k):Q.sel.add(k);b.setAttribute('aria-pressed',Q.sel.has(k)?'true':'false');
    Q.acts.check.disabled=Q.sel.size===0;
  },true);
  Q.pad=pad;
  say('say-quiz','ボタンを おすと えらべるよ。もう いちど おすと やめられるよ。');
  Q.acts=actions([['check','こたえあわせ',checkQ1,true],['next','つぎの もんだい',newQ1]]);
  Q.acts.check.disabled=true;
}
function checkQ1(){
  if(Q.done)return;Q.done=true;Q.acts.check.disabled=true;
  const ok=Q.ans.length===Q.sel.size&&Q.ans.every(k=>Q.sel.has(k));
  for(const k of ORDER){
    const res=tryMove(N,N,Q.pos,new Set([K(...Q.pos)]),k);bQuiz.ghost(k,res);
    const b=Q.pad[k];b.style.opacity=1;b.querySelector('.res').textContent=res.ok?'○':'×';
  }
  $('q-legend').textContent='せん：それぞれの ボタンで すすむ みち　×：そとに でちゃう';
  if(ok){say('say-quiz','せいかい！ おせる ボタンは '+Q.ans.map(k=>BTN[k].sym).join(' と ')+' だね。','ok');hanamaru()}
  else say('say-quiz','ざんねん。こたえは '+Q.ans.map(k=>BTN[k].sym).join(' と ')+'。ボードの せんを みて、どの ボタンが そとに でちゃうか たしかめよう。','ng');
}

/* (2) どこに とまる？ */
function newQ2(){
  let start,seq,sim;
  if(first[2]){start=[2,2];seq=['down','right','up','left'];first[2]=false;sim=simulate(N,N,start,seq)}
  else for(;;){
    start=[ri(Math.random,N),ri(Math.random,N)];seq=Array.from({length:4},()=>ORDER[ri(Math.random,4)]);
    sim=simulate(N,N,start,seq);if(sim.ok&&K(...sim.end)!==K(...start))break;
  }
  Q={start,seq,end:sim.end,pick:null,done:false};
  bQuiz.setup({rows:N,cols:N,start});
  $('q-title').textContent='(2) 🚗は どこに とまる？';
  $('q-text').textContent='したの じゅんばんに ボタンを おすと、🚗は さいごに どの ますに とまるかな？ とまる ますを タップしてね。';
  chipsInto($('q-chips'),seq,true);$('q-legend').textContent='';
  $('pad-quiz').innerHTML='';
  say('say-quiz','あたまの なかで 🚗を うごかしてみよう。ゆびで なぞっても いいよ。');
  Q.acts=actions([['check','こたえあわせ',checkQ2,true],['replay','もういちど みる',replayQ2],['next','つぎの もんだい',newQ2]]);
  Q.acts.check.disabled=true;Q.acts.replay.disabled=true;
}
function pickCell(r,c){
  if(Q.done||bQuiz.busy)return;Q.pick=[r,c];bQuiz.clearMarks();bQuiz.mark(r,c,'pick');Q.acts.check.disabled=false;
  say('say-quiz','ここで いい？ よければ「こたえあわせ」を おしてね。');
}
async function playSeq(seq){
  bQuiz.reset();if(Q.pick)bQuiz.mark(...Q.pick,'pick');
  for(const k of seq){await bQuiz.press(k);await sleep(RM?50:250)}
}
async function checkQ2(){
  if(Q.done)return;Q.done=true;Q.acts.check.disabled=true;Q.acts.next.disabled=true;
  say('say-quiz','🚗を うごかして たしかめるよ……');
  await playSeq(Q.seq);
  Q.acts.next.disabled=false;Q.acts.replay.disabled=false;
  if(K(...Q.pick)===K(...Q.end)){say('say-quiz','せいかい！ ぴったり とまったね。','ok');hanamaru()}
  else{bQuiz.mark(...Q.end,'right-mark');say('say-quiz','ざんねん。🚗が とまった ますが こたえだよ。ボタンを 1つずつ たしかめてみよう。','ng')}
  $('q-legend').textContent='あおい まる：あなたの こたえ　みどりの てんせん：こたえ';
}
async function replayQ2(){
  if(bQuiz.busy)return;Q.acts.replay.disabled=true;await playSeq(Q.seq);
  if(K(...Q.pick)!==K(...Q.end))bQuiz.mark(...Q.end,'right-mark');Q.acts.replay.disabled=false;
}

/* (3) 7かいで 🍎を 2つ とおって 🏠へ */
function solve3(start,home,items,limit=40){
  const sols=[];const seq=[];const vis=new Set([K(...start)]);
  (function dfs(pos){
    if(sols.length>=limit)return;
    if(seq.length===7){if(K(...pos)===K(...home)&&items.every(it=>vis.has(K(...it))))sols.push([...seq]);return}
    for(const k of ORDER){
      const r=tryMove(N,N,pos,vis,k);if(!r.ok)continue;
      r.path.forEach(p=>vis.add(K(...p)));seq.push(k);dfs(r.end);seq.pop();r.path.forEach(p=>vis.delete(K(...p)));
    }
  })(start);
  return sols;
}
function gen3(rng){
  let best=null;
  for(let t=0;t<400;t++){
    const start=[ri(rng,N),ri(rng,N)];const vis=new Set([K(...start)]);let pos=start;const trail=[start];let ok=true;
    for(let i=0;i<7;i++){
      const opts=ORDER.map(k=>[k,tryMove(N,N,pos,vis,k)]).filter(x=>x[1].ok);
      if(!opts.length){ok=false;break}
      const [,r]=opts[ri(rng,opts.length)];r.path.forEach(p=>{vis.add(K(...p));trail.push(p)});pos=r.end;
    }
    if(!ok)continue;
    const home=pos;if(K(...home)===K(...start))continue;
    const mids=trail.slice(1,-1);if(mids.length<2)continue;
    const a=ri(rng,mids.length);let b=ri(rng,mids.length-1);if(b>=a)b++;
    const items=[mids[a],mids[b]];
    const sols=solve3(start,home,items);
    if(!best||sols.length<best.sols.length)best={start,home,items,sols};
    if(sols.length<=3)break;
  }
  return best;
}
function newQ3(){
  const p=gen3(first[3]?mulberry(20260927):Math.random);first[3]=false;
  Q={...p,done:false};
  bQuiz.setup({rows:N,cols:N,start:p.start,home:p.home,items:p.items});
  $('q-title').textContent='(3) 7かいで 🏠に ぴったり とまろう';
  $('q-text').textContent='🍎を 2つとも とおって、ボタンを ちょうど 7かい おしたときに 🏠で とまるように しよう。';
  $('q-legend').textContent='';
  makePad($('pad-quiz'),press3);
  say('say-quiz','ボタンを おすと 🚗が うごくよ。まちがえたら「1つ もどす」。');
  Q.acts=actions([['undo','1つ もどす',()=>{if(!Q.done)bQuiz.undo()}],['reset','はじめから',()=>{Q.done=false;bQuiz.reset();say('say-quiz','はじめに もどしたよ。')}],['ans','こたえを みる',showAns3],['next','つぎの もんだい',newQ3,true]]);
}
function slots3(){
  const box=$('q-chips');box.innerHTML='';
  for(let i=0;i<7;i++){const h=bQuiz.hist[i];if(h)box.appendChild(chip(h.key));else{const s=document.createElement('span');s.className='slot';s.textContent=i+1;box.appendChild(s)}}
}
bQuiz.onChange=()=>{if(qType===3)slots3()};
async function press3(k){
  if(Q.done||bQuiz.busy)return;
  if(bQuiz.hist.length>=7){say('say-quiz','もう 7かい おしたよ。「1つ もどす」か「はじめから」で やりなおそう。','ng');return}
  const r=await bQuiz.press(k);if(!r)return;
  if(!r.ok){say('say-quiz',REASON[r.reason]+' おした かずには はいらないよ。','ng');return}
  const n=bQuiz.hist.length;
  if(n<7){say('say-quiz',`${n}かい おしたよ。あと ${7-n}かい。`);return}
  const v=bQuiz.visitedSet();const got=Q.items.filter(it=>v.has(K(...it))).length;const home=K(...bQuiz.pos)===K(...Q.home);
  if(home&&got===2){Q.done=true;say('say-quiz','せいかい！ 🍎を 2つ とおって 🏠に ぴったり とまったね。','ok');hanamaru()}
  else if(!home)say('say-quiz',`7かい おしたけど 🏠に とまって いないね（🍎は ${got}こ）。「1つ もどす」で かんがえなおそう。`,'ng');
  else say('say-quiz',`🏠には ついたけど、🍎を ${got}こしか とおって いないね。2つとも とおる みちを さがそう。`,'ng');
}
async function showAns3(){
  if(bQuiz.busy)return;Q.done=true;const sol=Q.sols[0];
  say('say-quiz','こたえの ひとつ： '+sol.map(k=>BTN[k].sym).join(' → '));
  bQuiz.reset();for(const k of sol){await bQuiz.press(k);await sleep(RM?50:200)}
  say('say-quiz','こたえの ひとつ： '+sol.map(k=>BTN[k].sym).join(' → ')+(Q.sols.length>1?`（ほかにも ${Q.sols.length-1}つ あるよ）`:''),'ok');
}

const QS={1:newQ1,2:newQ2,3:newQ3};
document.querySelectorAll('.qtab').forEach(t=>t.addEventListener('click',()=>{
  if(bQuiz.busy)return;
  document.querySelectorAll('.qtab').forEach(x=>x.setAttribute('aria-selected',x===t?'true':'false'));
  qType=+t.dataset.q;QS[qType]();
}));
newQ1();
