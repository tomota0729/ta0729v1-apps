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

class Board{
  constructor(svg,opts={}){this.svg=svg;this.onChange=opts.onChange||null;this.busy=false}
  setup({rows,cols,start,home=null,items=[]}){
    Object.assign(this,{rows,cols,start,home,items});this.build();this.reset();
  }
  build(){
    const S=CELL,m=S*.55,svg=this.svg;svg.innerHTML='';
    svg.setAttribute('viewBox',`${-m} ${-m} ${this.cols*S+2*m} ${this.rows*S+2*m}`);
    const gC=el('g',{},svg);this.rects=[];
    for(let r=0;r<this.rows;r++){this.rects.push([]);for(let c=0;c<this.cols;c++){
      const rc=el('rect',{x:c*S,y:r*S,width:S,height:S,class:'cell'},gC);
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
}

function makePad(box,onPress){
  box.innerHTML='';
  for(const k of ORDER){
    const b=document.createElement('button');b.className='pad-btn '+BTN[k].cls;
    b.innerHTML=`<span class="s">${BTN[k].sym}</span><span class="l">${BTN[k].label}</span>`;
    b.setAttribute('aria-label',BTN[k].sym+' '+BTN[k].label);
    b.addEventListener('click',()=>onPress(k));box.appendChild(b);
  }
}
function chip(k){const s=document.createElement('span');s.className='chip '+BTN[k].cls;s.textContent=BTN[k].sym;return s}
function say(id,text,tone){const e=$(id);e.textContent=text;e.className='say'+(tone?' '+tone:'')}

/* はなまる */
let score=0;
function hanamaru(){
  score++;$('score').textContent=score;Sound.finish();
  const h=$('hana');h.hidden=false;h.className='';h.getBoundingClientRect();h.className='on';
  setTimeout(()=>h.classList.add('out'),1900);setTimeout(()=>{h.hidden=true;h.className=''},2500);
}

/* もんだい */
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const ri=(rng,n)=>Math.floor(rng()*n);
const N=6;
let Q={},firstQ=true;
const bQuiz=new Board($('b-quiz'));
function actions(list){const box=$('q-actions');box.innerHTML='';const out={};list.forEach(([id,label,fn,primary])=>{const b=document.createElement('button');b.className='btn'+(primary?' primary':'');b.textContent=label;b.onclick=fn;box.appendChild(b);out[id]=b});return out}

/* 7かいで 🍎を 2つ とおって 🏠へ */
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
  const p=gen3(firstQ?mulberry(20260927):Math.random);firstQ=false;
  Q={...p,done:false};
  bQuiz.setup({rows:N,cols:N,start:p.start,home:p.home,items:p.items});
  $('q-title').textContent='🍎を 2つ とおって、7かいで 🏠に ぴったり とまろう';
  makePad($('pad-quiz'),press3);
  say('say-quiz','ボタンを おすと 🚗が うごくよ。まちがえたら「1つ もどす」。');
  Q.acts=actions([['undo','1つ もどす',()=>{if(!Q.done)bQuiz.undo()}],['reset','はじめから',()=>{Q.done=false;bQuiz.reset();say('say-quiz','はじめに もどしたよ。')}],['ans','こたえを みる',showAns3],['next','つぎの もんだい',newQ3,true]]);
}
function slots3(){
  const box=$('q-chips');box.innerHTML='';
  for(let i=0;i<7;i++){const h=bQuiz.hist[i];if(h)box.appendChild(chip(h.key));else{const s=document.createElement('span');s.className='slot';s.textContent=i+1;box.appendChild(s)}}
}
bQuiz.onChange=slots3;
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

newQ3();
