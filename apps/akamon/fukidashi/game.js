// ふきだしの ことば - game.js
// 共通の Sound・$・say・hanamaru・actions・shuffle・ri は ../common/akamon.js

const MARK=['①','②','③'];

// ばめんの もんだい（ぶんしょうは すべて オリジナル）
// choices の さいしょが せいかい（ひょうじの ときに まぜる）
const SCENES=[
  {pic:'🚸',scene:'みちを わたる まえに、おかあさんが いいました。',who:'👩',before:'くるまが くるかも しれないから、',after:'',
   choices:['みぎと ひだりを よく みてね。','そらを よく みてね。','あしもとだけ みてね。'],why:'みちを わたる ときは、みぎと ひだりを みて くるまが こないか たしかめるね。'},
  {pic:'🍙',scene:'ごはんを たべる まえに いう ことばは？',who:'🧒',before:'',after:'',
   choices:['いただきます。','ごちそうさまでした。','おやすみなさい。'],why:'たべる まえは「いただきます」、たべおわったら「ごちそうさまでした」だね。'},
  {pic:'✏️',scene:'ともだちに けしゴムを かして もらいました。',who:'🧒',before:'',after:'',
   choices:['ありがとう。','ごめんね。','いってきます。'],why:'なにかを して もらったら「ありがとう」と いおうね。'},
  {pic:'🌙',scene:'よる、ねる まえに かぞくに いいます。',who:'🧒',before:'',after:'',
   choices:['おやすみなさい。','おはよう ございます。','いただきます。'],why:'ねる まえは「おやすみなさい」。あさ おきたら「おはよう ございます」だね。'},
  {pic:'🎒',scene:'がっこうへ いく ときに、いえの ひとに いいます。',who:'🧒',before:'',after:'',
   choices:['いってきます。','ただいま。','おかえりなさい。'],why:'でかける ときは「いってきます」、かえったら「ただいま」だね。'},
  {pic:'🏠',scene:'がっこうから いえに かえって きました。',who:'🧒',before:'',after:'',
   choices:['ただいま。','いってきます。','いってらっしゃい。'],why:'かえって きた ときは「ただいま」。いえの ひとは「おかえりなさい」と こたえるね。'},
  {pic:'💥',scene:'ろうかで ともだちに ぶつかって しまいました。',who:'🧒',before:'',after:'',
   choices:['ごめんなさい。だいじょうぶ？','ありがとう。','やったあ。'],why:'ぶつかって しまったら、あやまって あいての ことを しんぱいしようね。'},
  {pic:'🚃',scene:'でんしゃの なかで、おとうとが おおきな こえを だしました。',who:'👦',before:'でんしゃの なかでは ',after:'',
   choices:['しずかに しようね。','もっと おおきな こえで はなそうね。','はしりまわろうね。'],why:'でんしゃの なかには ほかの ひとも いるから、しずかに しようね。'},
  {pic:'☔',scene:'そとを みると、あめが ふって います。',who:'👩',before:'でかける ときは ',after:'',
   choices:['かさを もって いこうね。','ぼうしだけで いいよ。','まどを あけて おこうね。'],why:'あめの ひは かさを もって いくと ぬれないね。'},
  {pic:'🏊',scene:'プールに はいる まえに、せんせいが いいました。',who:'🧑‍🏫',before:'けがを しないように ',after:'',
   choices:['じゅんび たいそうを しようね。','すぐに とびこもうね。','おやつを たべようね。'],why:'からだを うごかす まえは、じゅんび たいそうで けがを ふせぐよ。'},
  {pic:'📚',scene:'としょかんで ほんを かりました。',who:'🧑‍💼',before:'よみおわったら ',after:'',
   choices:['かえしに きてね。','すてて いいよ。','ずっと もって いてね。'],why:'かりた ものは、つかいおわったら かえそうね。'}
];

// ---- ひづけの もんだい（あした・きのう・あさって・おととい） ----
const MONTH_YOMI=['','いちがつ','にがつ','さんがつ','しがつ','ごがつ','ろくがつ','しちがつ','はちがつ','くがつ','じゅうがつ','じゅういちがつ','じゅうにがつ'];
const DAY_YOMI=['','ついたち','ふつか','みっか','よっか','いつか','むいか','なのか','ようか','ここのか','とおか',
  'じゅういちにち','じゅうににち','じゅうさんにち','じゅうよっか','じゅうごにち','じゅうろくにち','じゅうしちにち','じゅうはちにち','じゅうくにち','はつか',
  'にじゅういちにち','にじゅうににち','にじゅうさんにち','にじゅうよっか','にじゅうごにち','にじゅうろくにち','にじゅうしちにち','にじゅうはちにち','にじゅうくにち','さんじゅうにち','さんじゅういちにち'];
const REL=[{w:'あした',d:1},{w:'きのう',d:-1},{w:'あさって',d:2},{w:'おととい',d:-2}];
const date=(m,d)=>`<ruby>${m}月<rt>${MONTH_YOMI[m]}</rt></ruby><ruby>${d}日<rt>${DAY_YOMI[d]}</rt></ruby>`;

function dateQ(){
  const m=1+ri(Math.random,12),d=3+ri(Math.random,25);      // 3〜27日（つきを またがない）
  const rels=shuffle(REL);
  const right=rels[0];
  // まちがい：ほかの ことばに、ちがう ひの ひづけを くっつける
  const wrong=rels.slice(1,3).map(r=>{
    const offs=REL.map(x=>x.d).filter(o=>o!==r.d);
    return `${r.w}は ${date(m,d+offs[ri(Math.random,offs.length)])}ですね。`;
  });
  const how=right.d>0?`${right.d}にち あと`:`${-right.d}にち まえ`;
  return {pic:'📅',scene:'ふたりで カレンダーを みて はなして います。',who:'👧',
    before:`きょうは ${date(m,d)}です。<br>`,after:'',
    choices:[`${right.w}は ${date(m,d+right.d)}ですね。`,...wrong],
    why:`「${right.w}」は きょうから ${how}の ひ だね。`};
}

let Q={},last=-1,first=true;

function pickQ(){
  if(first){first=false;last=0;return SCENES[0]}
  if(Math.random()<0.4)return dateQ();
  let i;do{i=ri(Math.random,SCENES.length)}while(i===last);
  last=i;return SCENES[i];
}

function newQ(){
  const base=pickQ();
  Q={...base,done:false};
  Q.opts=shuffle(base.choices.map((t,i)=>({t,ok:i===0})));
  $('scene').innerHTML=`<span class="pic" aria-hidden="true">${base.pic}</span>${base.scene}`;
  $('who').textContent=base.who;
  $('bubble').innerHTML=`${base.before}<span class="hole" id="hole">？</span>${base.after}`;
  const box=$('choices');box.innerHTML='';
  Q.opts.forEach((o,i)=>{
    const b=document.createElement('button');b.className='choice';
    b.innerHTML=`<span class="no">${MARK[i]}</span>${o.t}`;
    b.onclick=()=>answer(i);box.appendChild(b);o.el=b;
  });
  say('say-quiz','ばめんを よく よんで、ふきだしに あう ことばを えらんでね。');
  Q.acts=actions([['next','つぎの もんだい',newQ,true]]);
}

function answer(i){
  if(Q.done)return;Q.done=true;
  const o=Q.opts[i];
  Q.opts.forEach(x=>{x.el.disabled=true;if(x.ok)x.el.classList.add('right')});
  const hole=$('hole');hole.innerHTML=Q.opts.find(x=>x.ok).t;hole.classList.add('ok');
  if(o.ok){say('say-quiz','せいかい！ '+Q.why,'ok');hanamaru()}
  else{o.el.classList.add('wrong');Sound.wrong();say('say-quiz',`ざんねん。こたえは ${MARK[Q.opts.findIndex(x=>x.ok)]}。${Q.why}`,'ng')}
}

newQ();
