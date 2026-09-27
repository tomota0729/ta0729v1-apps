// かずの ならび - game.js
// 共通の Sound・sleep・$・say・hanamaru・actions・shuffle・ri は ../common/akamon.js

const LEN=6;       // □の かず
const MARK=['①','②','③','④'];

// もんだいの しゅるい（小1の はんい）
const KINDS=[
  {steps:[1,2],max:20},
  {steps:[3],max:30},
  {steps:[5,10],max:100}
];

let Q={},first=true;

function genQ(){
  if(first){first=false;return {seq:[2,4,6,8,10,12],blanks:[2,5],step:2,dir:1}}
  const kind=KINDS[ri(Math.random,KINDS.length)];
  const step=kind.steps[ri(Math.random,kind.steps.length)];
  const dir=Math.random()<0.6?1:-1;                 // ふえる ほうを すこし おおめに
  const span=step*(LEN-1);
  const lo=dir>0?0:span, hi=dir>0?kind.max-span:kind.max;
  let start=lo+ri(Math.random,hi-lo+1);
  if(step>=5)start-=start%step;                     // 5ずつ・10ずつは きりの いい かずから
  const seq=Array.from({length:LEN},(_,i)=>start+dir*step*i);
  // あなを 2つ（さいしょの 2つが りょうほう あな だと むずかしすぎるので さける）
  let blanks;
  do{blanks=shuffle([...Array(LEN).keys()]).slice(0,2).sort((a,b)=>a-b)}while(blanks[0]===0&&blanks[1]===1);
  return {seq,blanks,step,dir};
}

// まちがいの せんたくし（よく ある まちがい）
function makeChoices(q){
  const a=q.seq[q.blanks[0]],b=q.seq[q.blanks[1]],s=q.step;
  const key=p=>p.join(',');
  const cands=shuffle([
    [a,b+1],[a,b-1],[a+1,b],[a-1,b],
    [a+s,b+s],[a-s,b-s],[a,b+s],[a,b-s],[a+s,b],[a-s,b]
  ]).filter(p=>p.every(n=>n>=0&&n<=120));
  const seen=new Set([key([a,b])]);const wrong=[];
  for(const p of cands){if(seen.has(key(p)))continue;seen.add(key(p));wrong.push(p);if(wrong.length===3)break}
  return shuffle([[a,b],...wrong]).map(p=>({pair:p,ok:p[0]===a&&p[1]===b}));
}

function renderSeq(fill){
  const box=$('seq');box.innerHTML='';
  Q.seq.forEach((n,i)=>{
    if(i){const l=document.createElement('span');l.className='link';box.appendChild(l)}
    const d=document.createElement('span');
    const bi=Q.blanks.indexOf(i);
    if(bi<0){d.className='box';d.textContent=n}
    else if(fill){d.className='box '+(fill.ok?'filled-ok':'filled-ng');d.textContent=n}
    else{d.className='box blank'}
    box.appendChild(d);
  });
}

function newQ(){
  Q={...genQ(),done:false};
  Q.choices=makeChoices(Q);
  renderSeq(null);
  const box=$('choices');box.innerHTML='';
  Q.choices.forEach((c,i)=>{
    const b=document.createElement('button');b.className='choice';
    b.innerHTML=`<span class="no">${MARK[i]}</span>${c.pair[0]} と ${c.pair[1]}`;
    b.onclick=()=>answer(i);box.appendChild(b);c.el=b;
  });
  say('say-quiz','ひだりから じゅんばんに かずを よんでみよう。いくつずつ かわって いるかな？');
  Q.acts=actions([['next','つぎの もんだい',newQ,true]]);
}

function answer(i){
  if(Q.done)return;Q.done=true;
  const c=Q.choices[i];
  Q.choices.forEach(x=>{x.el.disabled=true;if(x.ok)x.el.classList.add('right')});
  const how=`${Q.step}ずつ ${Q.dir>0?'ふえて':'へって'} いるね。`;
  renderSeq({ok:c.ok});
  if(c.ok){say('say-quiz',`せいかい！ ${how}`,'ok');hanamaru()}
  else{c.el.classList.add('wrong');Sound.wrong();say('say-quiz',`ざんねん。${how} こたえは ${MARK[Q.choices.findIndex(x=>x.ok)]}の ${Q.seq[Q.blanks[0]]} と ${Q.seq[Q.blanks[1]]}。`,'ng')}
}

newQ();
