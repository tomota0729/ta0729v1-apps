'use strict';

/* ========= データ ========= */

const CATEGORIES = [
  {
    id: 'wafugetsu',
    name: '和風月名',
    ruby: 'わふうつきな',
    emoji: '🌙',
    color: '#5C6BC0',
  },
  {
    id: 'shukujitsu',
    name: '国民の祝日',
    ruby: 'こくみんのしゅくじつ',
    emoji: '🎌',
    color: '#C62828',
  },
  {
    id: 'kotowaza',
    name: 'ことわざ',
    ruby: 'ことわざ',
    emoji: '📖',
    color: '#2E7D32',
  },
  {
    id: 'gyoji',
    name: '季節の行事',
    ruby: 'きせつのぎょうじ',
    emoji: '🎋',
    color: '#F57F17',
  },
  {
    id: 'juunishi',
    name: '十二支',
    ruby: 'じゅうにし',
    emoji: '🧭',
    color: '#6A1B9A',
  },
];

const QUIZ_DATA = {
  wafugetsu: [
    { q: '1月（いちがつ）のむかしのよびかたは？', choices: ['むつき', 'きさらぎ', 'やよい', 'うづき'], answer: 'むつき', fact: '「むつき」は、家族やなかまが仲むつまじくすることから生まれた言葉といわれています！' },
    { q: '2月（にがつ）のむかしのよびかたは？', choices: ['むつき', 'きさらぎ', 'やよい', 'みなづき'], answer: 'きさらぎ', fact: '「きさらぎ」は、さむさで着物（きもの）を重ね着（かさねぎ）することからきたといわれています！' },
    { q: '3月（さんがつ）のむかしのよびかたは？', choices: ['うづき', 'やよい', 'さつき', 'むつき'], answer: 'やよい', fact: '「やよい」は、草木（くさき）がいきいきと生い茂る（おいしげる）月という意味があります！' },
    { q: '4月（しがつ）のむかしのよびかたは？', choices: ['やよい', 'うづき', 'みなづき', 'きさらぎ'], answer: 'うづき', fact: '「うづき」は、ウツギという白い花が咲く（さく）ことから名づけられました！' },
    { q: '5月（ごがつ）のむかしのよびかたは？', choices: ['うづき', 'みなづき', 'さつき', 'ふみづき'], answer: 'さつき', fact: '「さつき」は、田植え（たうえ）をする月という意味で、「早苗月（さなへつき）」が縮まったとも言われます！' },
    { q: '6月（ろくがつ）のむかしのよびかたは？', choices: ['さつき', 'みなづき', 'ふみづき', 'はづき'], answer: 'みなづき', fact: '「みなづき」は「水無月（みなづき）」と書きます。夏で水が乾く（かわく）月という意味です！' },
    { q: '7月（しちがつ）のむかしのよびかたは？', choices: ['みなづき', 'ふみづき', 'はづき', 'ながつき'], answer: 'ふみづき', fact: '「ふみづき」は「文月（ふみづき）」と書きます。七夕（たなばた）に詩（し）や文（ふみ）を書く風習（ふうしゅう）からきています！' },
    { q: '8月（はちがつ）のむかしのよびかたは？', choices: ['ふみづき', 'はづき', 'ながつき', 'かんなづき'], answer: 'はづき', fact: '「はづき」は「葉月（はづき）」と書きます。木の葉（このは）が落ち始める（おちはじめる）月です！' },
    { q: '9月（くがつ）のむかしのよびかたは？', choices: ['はづき', 'ながつき', 'かんなづき', 'しもつき'], answer: 'ながつき', fact: '「ながつき」は「長月（ながつき）」と書きます。夜（よる）が長くなる月という意味です！' },
    { q: '10月（じゅうがつ）のむかしのよびかたは？', choices: ['ながつき', 'かんなづき', 'しもつき', 'しわす'], answer: 'かんなづき', fact: '「かんなづき」は「神無月（かんなづき）」と書き、全国の神さまが出雲（いずも）に集まるため、ほかの地域では神さまがいなくなる月と言われます！' },
    { q: '11月（じゅういちがつ）のむかしのよびかたは？', choices: ['かんなづき', 'しもつき', 'しわす', 'むつき'], answer: 'しもつき', fact: '「しもつき」は「霜月（しもつき）」と書きます。霜（しも）が降り始める（ふりはじめる）寒い月です！' },
    { q: '12月（じゅうにがつ）のむかしのよびかたは？', choices: ['しもつき', 'しわす', 'むつき', 'きさらぎ'], answer: 'しわす', fact: '「しわす」は「師走（しわす）」と書きます。お師匠さん（おしょうさん）も走り回るほど忙しい（いそがしい）月という意味です！' },
  ],

  shukujitsu: [
    { q: 'お正月（おしょうがつ）。1月1日の祝日（しゅくじつ）の名前は？', choices: ['元日（がんじつ）', '成人の日（せいじんのひ）', '建国記念の日（けんこくきねんのひ）', '天皇誕生日（てんのうたんじょうび）'], answer: '元日（がんじつ）', fact: '元日（がんじつ）は年の始めをお祝いする日。古くから神社（じんじゃ）に初もうで（はつもうで）をする習慣（しゅうかん）があります！' },
    { q: '大人（おとな）になったことをお祝いする1月の祝日は？', choices: ['元日（がんじつ）', '成人の日（せいじんのひ）', '春分の日（しゅんぶんのひ）', '敬老の日（けいろうのひ）'], answer: '成人の日（せいじんのひ）', fact: '成人の日（せいじんのひ）は、20歳（はたち）になった大人（おとな）を祝う日。最近は18歳（じゅうはっさい）から大人とされています！' },
    { q: '日本という国が生まれた（うまれた）ことをお祝いする2月の祝日は？', choices: ['建国記念の日（けんこくきねんのひ）', '文化の日（ぶんかのひ）', '勤労感謝の日（きんろうかんしゃのひ）', '元日（がんじつ）'], answer: '建国記念の日（けんこくきねんのひ）', fact: '2月11日は「建国記念の日（けんこくきねんのひ）」。日本という国が始まった（はじまった）ことをお祝いします！' },
    { q: '春（はる）のまん中（まんなか）の日、昼（ひる）と夜（よる）の長さが同じになる3月の祝日は？', choices: ['春分の日（しゅんぶんのひ）', '秋分の日（しゅうぶんのひ）', '建国記念の日（けんこくきねんのひ）', '文化の日（ぶんかのひ）'], answer: '春分の日（しゅんぶんのひ）', fact: '春分の日（しゅんぶんのひ）は、昼と夜の長さがほぼ同じ！この前後の7日間を「お彼岸（おひがん）」といい、おはかまいりをします！' },
    { q: '子ども（こども）たちが元気（げんき）に育つ（そだつ）ことを祝う5月5日の祝日は？', choices: ['こどもの日', '成人の日（せいじんのひ）', '文化の日（ぶんかのひ）', '敬老の日（けいろうのひ）'], answer: 'こどもの日', fact: 'こどもの日はもともと「端午の節句（たんごのせっく）」。こいのぼりや兜（かぶと）を飾り（かざり）、ちまきや柏餅（かしわもち）を食べます！' },
    { q: '海（うみ）の恵み（めぐみ）に感謝（かんしゃ）する7月の祝日は？', choices: ['海の日（うみのひ）', '山の日（やまのひ）', '体育の日（たいいくのひ）', 'みどりの日'], answer: '海の日（うみのひ）', fact: '海の日（うみのひ）は7月の第3月曜日。日本は島国（しまぐに）なので、海への感謝（かんしゃ）を表す特別な祝日です！' },
    { q: '山（やま）に感謝（かんしゃ）する8月11日の祝日は？', choices: ['山の日（やまのひ）', '海の日（うみのひ）', 'みどりの日', '敬老の日（けいろうのひ）'], answer: '山の日（やまのひ）', fact: '山の日（やまのひ）は2016年にできた比較的（ひかくてき）新しい祝日。「山に親しむ（したしむ）機会（きかい）を得て（えて）、山の恩恵（おんけい）に感謝する」日です！' },
    { q: 'おじいさん・おばあさんをうやまう9月の祝日は？', choices: ['敬老の日（けいろうのひ）', '成人の日（せいじんのひ）', '体育の日（たいいくのひ）', 'こどもの日'], answer: '敬老の日（けいろうのひ）', fact: '敬老の日（けいろうのひ）は、長い間（ながいあいだ）社会（しゃかい）のために働いてきた（はたらいてきた）お年寄り（おとしより）に感謝する日です！' },
    { q: '秋（あき）のまん中の日、また昼と夜の長さが同じになる9月の祝日は？', choices: ['秋分の日（しゅうぶんのひ）', '春分の日（しゅんぶんのひ）', '敬老の日（けいろうのひ）', '海の日（うみのひ）'], answer: '秋分の日（しゅうぶんのひ）', fact: '秋分（しゅうぶん）の日も彼岸（ひがん）の中日（なかび）。「暑さ寒さも彼岸まで（あつささむさもひがんまで）」ということわざもあります！' },
    { q: '文化（ぶんか）や芸術（げいじゅつ）をお祝いする11月3日の祝日は？', choices: ['文化の日（ぶんかのひ）', '勤労感謝の日（きんろうかんしゃのひ）', 'みどりの日', '建国記念の日（けんこくきねんのひ）'], answer: '文化の日（ぶんかのひ）', fact: '文化の日（ぶんかのひ）は11月3日。この日は晴れ（はれ）の日が多いことで知られ「晴れの特異日（はれのとくいび）」ともよばれます！' },
  ],

  kotowaza: [
    { q: '「いしのうえにも○ねん」── ○に入る（はいる）のは？', choices: ['さん', 'いち', 'ご', 'じゅう'], answer: 'さん', fact: '「石の上にも三年（いしのうえにもさんねん）」── つらくても3年がまんすれば、いつかきっとうまくいくという意味です！' },
    { q: '「さるも○からおちる」── ○に入るのは？', choices: ['き', 'やま', 'かわ', 'いけ'], answer: 'き', fact: '「猿も木から落ちる（さるもきからおちる）」── どんなにじょうずな人でも、ときには失敗（しっぱい）するという意味です！' },
    { q: '「七転び○起き（ななころびおき）」── ○に入るのは？', choices: ['はち', 'に', 'ろく', 'じゅう'], answer: 'はち', fact: '「七転び八起き（ななころびやおき）」── 何度（なんど）転（ころ）んでもあきらめずに立ち上がる（たちあがる）という意味です！' },
    { q: '「はなよりも○○○」── 見た目より実質（じっしつ）を大切にするという意味。○○○に入るのは？', choices: ['だんご', 'すし', 'もち', 'おにぎり'], answer: 'だんご', fact: '「花より団子（はなよりだんご）」── きれいなものより、おいしいものや役に立つ（やくにたつ）ものを好む（このむ）という意味です！' },
    { q: '「にどあることは○どある」── 似た（にた）ことは繰り返す（くりかえす）という意味。○に入るのは？', choices: ['さん', 'ご', 'よん', 'に'], answer: 'さん', fact: '「二度あることは三度ある（にどあることはさんどある）」── よいことにも悪いことにも使います！' },
    { q: '「ちりもつもれば○○○○になる」── 小さいものでも積み重ねれば（つみかさなれば）大きくなるという意味。○○○○は？', choices: ['やまとなる', 'うみとなる', 'かわとなる', 'そらとなる'], answer: 'やまとなる', fact: '「塵も積もれば山となる（ちりもつもればやまとなる）」── ちいさな努力（どりょく）も続けると（つづけると）大きな結果（けっか）になります！' },
    { q: '「ねこにこばん」の「こばん」ってなに？', choices: ['むかしのお金（かね）', 'さかな', 'きんいろのおかし', 'たからもの'], answer: 'むかしのお金（かね）', fact: '「猫に小判（ねこにこばん）」── どんなに価値（かち）のあるものでも、分からない人（わからないひと）には意味がない（いみがない）という意味！' },
    { q: '「いそがば○○れ」── 急いでいるときこそ安全（あんぜん）な道を選ぶべきという意味。○○に入るのは？', choices: ['まわ', 'はし', 'とま', 'すす'], answer: 'まわ', fact: '「急がば回れ（いそがばまわれ）」── 近道（ちかみち）に見えても危険（きけん）な道より、遠くても安全な道のほうが結局（けっきょく）早いという意味です！' },
    { q: '「のどもとすぎれば○○をわすれる」── つらいことも終わると（おわると）すぐ忘れる（わすれる）という意味。○○は？', choices: ['あつさ', 'さむさ', 'からさ', 'にがさ'], answer: 'あつさ', fact: '「喉元過ぎれば熱さを忘れる（のどもとすぎればあつさをわすれる）」── 苦しいことも過ぎてしまえば（すぎてしまえば）すぐ忘れてしまうという意味！' },
    { q: '「みのほどをしれ」── 自分（じぶん）の力（ちから）に合った（あった）行動（こうどう）をしなさいという意味のことわざ。同じ意味の言葉（ことば）は？', choices: ['ぶんをわきまえろ', 'はやくはしれ', 'もっとがんばれ', 'ゆっくりすすめ'], answer: 'ぶんをわきまえろ', fact: '「身の程を知れ（みのほどをしれ）」── 自分の立場（たちば）や力を正しく（ただしく）理解（りかい）することが大切という意味です！' },
  ],

  gyoji: [
    { q: '1月7日、七草（ななくさ）入りのおかゆを食べる行事（ぎょうじ）は？', choices: ['じんじつ', 'せつぶん', 'たなばた', 'おおみそか'], answer: 'じんじつ', fact: '「人日（じんじつ）」の七草がゆ。春の七草（ハコベ・ナズナなど）を入れたおかゆを食べて、その年（そのとし）の病気（びょうき）を防ぐ（ふせぐ）といわれています！' },
    { q: '2月3日ごろ、豆（まめ）をまいて「おにはそと！ふくはうち！」という行事は？', choices: ['せつぶん', 'おしょうがつ', 'たなばた', 'ひなまつり'], answer: 'せつぶん', fact: '節分（せつぶん）の豆まきは、鬼（おに）を追い払い（おいはらい）、福（ふく）を呼び込む（よびこむ）行事。自分の歳（とし）の数だけ豆を食べる地域（ちいき）もあります！' },
    { q: '3月3日、女の子（おんなのこ）の健やか（すこやか）な成長（せいちょう）を願う（ねがう）行事は？', choices: ['ひなまつり', 'たんごのせっく', 'しちごさん', 'おぼん'], answer: 'ひなまつり', fact: '雛祭り（ひなまつり）は「桃の節句（もものせっく）」ともいいます。雛人形（ひなにんぎょう）を飾り（かざり）、ちらし寿司（ちらしずし）やひなあられを食べます！' },
    { q: '4月・5月に春の行楽（こうらく）を楽しむ、有名（ゆうめい）な日本の行事は？', choices: ['はなみ', 'もみじがり', 'ゆきあそび', 'ほたるみ'], answer: 'はなみ', fact: '花見（はなみ）はサクラの下（した）でお弁当（おべんとう）を食べたりする日本の春の風物詩（ふうぶつし）。奈良時代（ならじだい）ごろから続く（つづく）歴史ある行事です！' },
    { q: '7月7日、短冊（たんざく）に願い（ねがい）を書いて笹（ささ）に飾る（かざる）行事は？', choices: ['たなばた', 'せつぶん', 'ひなまつり', 'おしょうがつ'], answer: 'たなばた', fact: '七夕（たなばた）は、織姫（おりひめ）と彦星（ひこぼし）が1年に1度（いちど）だけ会う（あう）伝説（でんせつ）からきています。中国（ちゅうごく）から伝わった（つたわった）行事です！' },
    { q: '8月中旬（ちゅうじゅん）、ご先祖（せんぞ）の霊（れい）をむかえてお祈り（いのり）する行事は？', choices: ['おぼん', 'たなばた', 'せつぶん', 'かがみびらき'], answer: 'おぼん', fact: 'お盆（おぼん）は、亡くなった（なくなった）ご先祖様（せんぞさま）が家（いえ）に帰ってくる（かえってくる）期間（きかん）。お墓参り（おはかまいり）や盆踊り（ぼんおどり）をします！' },
    { q: '11月15日、3歳・5歳・7歳の子どもの成長（せいちょう）を神社（じんじゃ）でお祝いする行事は？', choices: ['しちごさん', 'ひなまつり', 'たんごのせっく', 'おぼん'], answer: 'しちごさん', fact: '七五三（しちごさん）は子どもの健やかな成長を感謝（かんしゃ）する行事。千歳飴（ちとせあめ）という長い飴（ながいあめ）をもらいます！' },
    { q: '大晦日（おおみそか）12月31日の夜（よる）、お寺（おてら）の鐘（かね）を108回（かい）つく行事は？', choices: ['じょやのかね', 'はつもうで', 'せつぶん', 'おぼん'], answer: 'じょやのかね', fact: '除夜の鐘（じょやのかね）の108回は、人間の108つの煩悩（ぼんのう）＝欲（よく）や悩み（なやみ）を取り除く（とりのぞく）ためと言われています！' },
  ],

  juunishi: [
    { q: '十二支（じゅうにし）のいちばん最初（さいしょ）の動物（どうぶつ）は？', choices: ['ね（ねずみ）', 'うし', 'とら', 'うさぎ'], answer: 'ね（ねずみ）', fact: 'ねずみが1番になったのは、神さまの元（もと）へ行くときに、うしの背中（せなか）に乗って（のって）、先にとびおりたから、という伝説（でんせつ）があります！' },
    { q: '「ね」のつぎの干支（えと）は？', choices: ['うし', 'とら', 'うさぎ', 'たつ'], answer: 'うし', fact: 'うし（丑・うし）は十二支の2番目。勤勉（きんべん）で粘り強い（ねばりづよい）象徴（しょうちょう）とされています！' },
    { q: '十二支で「うし」のつぎは？', choices: ['とら', 'うさぎ', 'たつ', 'へび'], answer: 'とら', fact: '寅（とら）は3番目。「虎（とら）は千里（せんり）を往（い）き、千里を帰る（かえる）」という言葉（ことば）があり、行動力（こうどうりょく）の象徴です！' },
    { q: '十二支で「とら」のつぎは？', choices: ['うさぎ', 'たつ', 'へび', 'うま'], answer: 'うさぎ', fact: '卯（うさぎ）は4番目。うさぎは月（つき）の動物（どうぶつ）ともされていて、縁起（えんぎ）のよい動物です！' },
    { q: '十二支の5番目、空（そら）を飛ぶ（とぶ）唯一（ゆいいつ）の空想上（くうそうじょう）の生き物（いきもの）は？', choices: ['たつ（りゅう）', 'へび', 'とり', 'うし'], answer: 'たつ（りゅう）', fact: '辰（たつ）は竜（りゅう）のこと。十二支の中でただ一つの空想上の生き物で、強さ（つよさ）や幸運（こううん）の象徴とされています！' },
    { q: '十二支で「たつ」のつぎは？', choices: ['へび', 'うま', 'ひつじ', 'さる'], answer: 'へび', fact: '巳（へび）は6番目。ヘビは脱皮（だっぴ）することから「再生（さいせい）」や「永遠（えいえん）」の象徴とされています！' },
    { q: '十二支の7番目、走る（はしる）のが速い（はやい）動物は？', choices: ['うま', 'さる', 'とり', 'いぬ'], answer: 'うま', fact: '午（うま）は7番目。「午前（ごぜん）・午後（ごご）」という言葉は、真昼（まひる）の十二支「午（うま）」の時刻（じこく）から来ています！' },
    { q: '十二支の8番目、草（くさ）をもぐもぐ食べる（たべる）のんびりした動物は？', choices: ['ひつじ', 'うま', 'さる', 'いぬ'], answer: 'ひつじ', fact: '未（ひつじ）は8番目。「未来（みらい）」という漢字の「未」はひつじの干支（えと）からきています！' },
    { q: '十二支の9番目、木登り（きのぼり）が上手（じょうず）な動物は？', choices: ['さる', 'とり', 'いぬ', 'いのしし'], answer: 'さる', fact: '申（さる）は9番目。「さる」は「去る（さる）」と読めることから、縁起（えんぎ）がいい動物とされています！' },
    { q: '十二支の10番目、にわとりの仲間（なかま）は？', choices: ['とり', 'さる', 'いぬ', 'いのしし'], answer: 'とり', fact: '酉（とり）は10番目。昔（むかし）は「酉の刻（とりのこく）」が夕方5〜7時ごろ。この時刻に神社（じんじゃ）の「酉の市（とりのいち）」が行われます！' },
    { q: '十二支の11番目、番犬（ばんけん）としても活躍（かつやく）する動物は？', choices: ['いぬ', 'とり', 'さる', 'いのしし'], answer: 'いぬ', fact: '戌（いぬ）は11番目。「いぬ」は忠実（ちゅうじつ）で家族（かぞく）を守る（まもる）ことから、子どもが生まれる月に「戌の日（いぬのひ）」にお参り（おまいり）する習慣（しゅうかん）があります！' },
    { q: '十二支の最後（さいご）、12番目の動物は？', choices: ['いのしし', 'いぬ', 'うし', 'さる'], answer: 'いのしし', fact: '亥（いのしし）は12番目。いのししは「猪突猛進（ちょとつもうしん）」のことわざのとおり、まっすぐに突き進む（つきすすむ）元気（げんき）な動物の象徴です！' },
  ],
};

/* ========= 状態 ========= */
let G = {
  catId: null,
  questions: [],
  idx: 0,
  score: 0,
  answered: false,
};

/* ========= UI要素 ========= */
const screens    = document.querySelectorAll('.screen');
const catGrid    = document.getElementById('catGrid');
const qNum       = document.getElementById('qNum');
const qScore     = document.getElementById('qScore');
const questionText = document.getElementById('questionText');
const heeCard    = document.getElementById('heeCard');
const heeText    = document.getElementById('heeText');
const btnNextHee = document.getElementById('btnNextHee');
const choicesEl  = document.getElementById('choices');
const resultEmoji   = document.getElementById('resultEmoji');
const resultTitle   = document.getElementById('resultTitle');
const resultScore   = document.getElementById('resultScore');
const resultComment = document.getElementById('resultComment');
const btnRetry   = document.getElementById('btnRetry');
const btnBackCat = document.getElementById('btnBackCat');

/* ========= 画面切替 ========= */
function showScreen(id) {
  screens.forEach(s => s.classList.toggle('active', s.id === id));
}

/* ========= カテゴリ選択 ========= */
function buildCatGrid() {
  catGrid.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const data = QUIZ_DATA[cat.id] || [];
    const btn = document.createElement('button');
    btn.className = 'cat-btn';
    btn.style.borderColor = cat.color;
    btn.innerHTML = `
      <span class="cat-emoji">${cat.emoji}</span>
      <span class="cat-name">${cat.name}</span>
      <span class="cat-ruby">${cat.ruby}</span>
      <span class="cat-count">${data.length}もん</span>
    `;
    btn.addEventListener('click', () => startQuiz(cat.id));
    catGrid.appendChild(btn);
  });
}

/* ========= シャッフル ========= */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ========= クイズ開始 ========= */
function startQuiz(catId) {
  G.catId = catId;
  const pool = QUIZ_DATA[catId] || [];
  G.questions = shuffle(pool).slice(0, Math.min(10, pool.length));
  G.idx = 0;
  G.score = 0;
  G.answered = false;
  showScreen('screen-quiz');
  renderQuestion();
}

/* ========= 問題描画 ========= */
function renderQuestion() {
  G.answered = false;
  heeCard.style.display = 'none';

  const q = G.questions[G.idx];
  qNum.textContent = `${G.idx + 1} / ${G.questions.length}`;
  qScore.textContent = `✅ ${G.score}`;
  questionText.textContent = q.q;

  choicesEl.innerHTML = '';
  const shuffledChoices = shuffle(q.choices);
  shuffledChoices.forEach(ch => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = ch;
    btn.addEventListener('click', () => handleChoice(btn, ch, q));
    choicesEl.appendChild(btn);
  });
}

/* ========= 選択処理 ========= */
function handleChoice(btn, chosen, q) {
  if (G.answered) return;
  G.answered = true;

  const allBtns = choicesEl.querySelectorAll('.choice-btn');
  allBtns.forEach(b => { b.disabled = true; });

  if (chosen === q.answer) {
    btn.classList.add('correct');
    G.score++;
    qScore.textContent = `✅ ${G.score}`;
    showHeeCard(q.fact);
  } else {
    btn.classList.add('wrong');
    allBtns.forEach(b => {
      if (b.textContent === q.answer) b.classList.add('correct');
    });
    setTimeout(() => showHeeCard(q.fact), 600);
  }
}

/* ========= へぇカード ========= */
function showHeeCard(fact) {
  heeText.textContent = fact;
  heeCard.style.display = 'flex';
  heeCard.style.animation = 'none';
  void heeCard.offsetWidth;
  heeCard.style.animation = '';
  heeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function nextQuestion() {
  G.idx++;
  if (G.idx < G.questions.length) {
    renderQuestion();
  } else {
    showResult();
  }
}

btnNextHee.addEventListener('click', nextQuestion);

/* ========= 結果 ========= */
function showResult() {
  showScreen('screen-result');
  const total = G.questions.length;
  const pct = G.score / total;

  let emoji = '🎉', title = 'すごい！', comment = 'ぜんぶせいかい！にほんのふしぎをよくしってるね！';
  if (pct < 0.4) {
    emoji = '😊'; title = 'おつかれ！'; comment = 'もう一度チャレンジ（ちゃれんじ）してみよう！';
  } else if (pct < 0.7) {
    emoji = '👍'; title = 'なかなかいい！'; comment = 'もうすこしでパーフェクト！もう一度やってみよう！';
  } else if (pct < 1.0) {
    emoji = '🌟'; title = 'すごい！'; comment = 'もう少し（もうすこし）でぜんぶせいかいだったよ！';
  }

  resultEmoji.textContent = emoji;
  resultTitle.textContent = title;
  resultScore.textContent = `${total}もんちゅう ${G.score}もんせいかい`;
  resultComment.textContent = comment;
}

btnRetry.addEventListener('click', () => startQuiz(G.catId));
btnBackCat.addEventListener('click', () => {
  showScreen('screen-cat');
});

/* ========= 起動 ========= */
buildCatGrid();
showScreen('screen-cat');
