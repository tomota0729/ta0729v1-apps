// 赤門クイズ 共通 - gens.js
// 問題ジェネレーター。全国統一小学生テスト（小1さんすう）と おなじ「かたち・かんがえかた」の 問題を、
// 数や 場面を かえて 毎回 あたらしく つくる。（もとの 問題文・数の くみあわせは つかわない）
//
// GENS.<名前>(rng, variant) → {intro, stem, fig, choices, answer, explain}
//   intro … 大問の 文（なくてよい） / stem … 小問の 文 / fig … SVG文字列（なくてよい）
//   choices … せんたくしの 文字（①などは runner が つける） / answer … せいかいの 番号（0から）

const GENS = (() => {
  const pick = (rng, arr) => arr[ri(rng, arr.length)];
  const rand = (rng, a, b) => a + ri(rng, b - a + 1);   // a〜b

  // こたえの まわりの 数で せんたくしを つくる（ぜんぶ ちがう・min〜max）
  function numChoices(rng, ans, {k = 4, min = 0, max = 20, unit = '', near = 3} = {}) {
    const set = new Set([ans]);
    let guard = 0;
    while (set.size < k && guard++ < 200) {
      const v = ans + (rng() < 0.5 ? -1 : 1) * rand(rng, 1, near);
      if (v >= min && v <= max) set.add(v);
    }
    for (let v = min; set.size < k && v <= max; v++) set.add(v);
    const nums = [...set].sort((a, b) => a - b);
    return {choices: nums.map(v => `${v}${unit}`), answer: nums.indexOf(ans)};
  }
  // 文字の せんたくし（さいしょが せいかい）を まぜる
  function textChoices(rng, list) {
    const uniq = [...new Set(list)];
    const order = shuffle(uniq.map((t, i) => ({t, ok: i === 0})), rng);
    return {choices: order.map(o => o.t), answer: order.findIndex(o => o.ok)};
  }
  const variantOf = (rng, v, list) => v || pick(rng, list);

  const FRUITS = ['🍎', '🍊', '🍓', '🍒', '🍋', '🍑', '🍐', '🍇'];
  const THINGS = ['🌸', '⭐', '🎈', '🍬', '🍪', '🌰', '🍄', '🐟'];

  return {
    // ---- 10の まとまり ----
    kakure10(rng, v) {
      v = variantOf(rng, v, ['hand', 'ato10', 'total']);
      if (v === 'total') {   // あわせて N こ の うち、かたほうの 手に かくれた かず
        const N = rand(rng, 5, 9), see = rand(rng, 1, N - 1), ans = N - see;
        return {
          intro: `おはじきは ぜんぶで ${N}こ あります。いくつかは 手の 中に かくして います。`,
          stem: 'かくして いる おはじきは なんこですか。',
          fig: FIG.hidden(see, rng, {e: pick(rng, ['🔴', '🟠', '🔵'])}),
          ...numChoices(rng, ans, {min: 1, max: 9, unit: 'こ', near: 2}),
          explain: `みえて いるのは ${see}こ。${N}は ${see}と ${ans}。`
        };
      }
      if (v === 'hand') {
        const see = rand(rng, 1, 9), ans = 10 - see;
        const cover = pick(rng, ['✋', '🪭']), e = pick(rng, ['🟢', '🔵', '🟡', '🟣']);
        return {
          intro: `わくの 中には おはじきが 10こ あります。その うちの いくつかは ${cover === '✋' ? '手' : 'うちわ'}で かくして います。`,
          stem: 'かくして いる おはじきは なんこですか。',
          fig: FIG.hidden(see, rng, {e, cover}),
          ...numChoices(rng, ans, {k: 5, min: 1, max: 9, unit: 'こ', near: 2}),
          explain: `みえて いるのは ${see}こ。10は ${see}と ${ans}。だから かくれて いるのは ${ans}こ。`
        };
      }
      const n = rand(rng, 3, 9), ans = 10 - n, e = pick(rng, FRUITS);
      return {
        stem: `${e}を 10こに するには、あと なんこ あれば よいですか。`,
        fig: FIG.scatter([{e, n}], rng, {cols: 5, rows: 2}),
        ...numChoices(rng, ans, {min: 1, max: 9, unit: 'こ', near: 2}),
        explain: `${e}は ${n}こ。10は ${n}と ${ans}。`
      };
    },

    // ---- かずを かぞえる ----
    kazoe(rng, v) {
      v = variantOf(rng, v, ['plain', 'mixed', 'awase']);
      const [e, o] = shuffle([...FRUITS, ...THINGS], rng);
      if (v === 'awase') {
        const a = rand(rng, 2, 6), b = rand(rng, 2, 6);
        return {
          stem: `ひだりと みぎの ${e}を あわせると、ぜんぶで なんこに なりますか。`,
          fig: `<div style="display:flex;gap:16px;width:100%;justify-content:center"><div style="flex:1;max-width:240px">${FIG.scatter([{e, n: a}], rng, {cols: 3, rows: 2})}</div><div style="flex:1;max-width:240px">${FIG.scatter([{e, n: b}], rng, {cols: 3, rows: 2})}</div></div>`,
          ...numChoices(rng, a + b, {min: 2, max: 14, unit: 'こ', near: 2}),
          explain: `${a}こと ${b}こ を あわせて ${a + b}こ。`
        };
      }
      const n = rand(rng, v === 'plain' ? 4 : 5, v === 'plain' ? 12 : 10);
      const items = v === 'plain' ? [{e, n}] : [{e, n}, {e: o, n: rand(rng, 3, 8)}];
      return {
        stem: v === 'plain' ? `${e}は なんこ ありますか。` : `${e}だけ かぞえましょう。${e}は なんこ ありますか。`,
        fig: FIG.scatter(items, rng),
        ...numChoices(rng, n, {min: 1, max: 20, unit: 'こ', near: 2}),
        explain: `${e}に しるしを つけながら 1つずつ かぞえると ${n}こ。`
      };
    },

    // ---- なんばんめ（よこに ならんだ もの） ----
    nanbanme(rng, v) {
      v = variantOf(rng, v, ['one', 'which', 'between']);
      const n = rand(rng, 8, 12), e = pick(rng, ['🌰', '🍂', '🍄', '🐟', '🚗', '🎈']);
      const side = pick(rng, ['ひだり', 'みぎ']);
      if (v === 'one') {
        const k = rand(rng, 2, n - 1), pos = side === 'ひだり' ? k : n - k + 1;   // 1から
        const cands = [pos, n - pos + 1, pos + 1, pos - 1, pos + 2].filter(p => p >= 1 && p <= n);
        const {choices, answer} = textChoices(rng, cands.map(p => FIG.NUM[p]).slice(0, 4));
        return {
          stem: `${side}から かぞえて ${k}こめの ${e}は どれですか。`,
          fig: FIG.row(n, {e}), choices, answer,
          explain: `${side}はしから 1、2、3…と かぞえて ${k}こめは ${FIG.NUM[pos]}。`
        };
      }
      if (v === 'which') {
        const p = rand(rng, 1, n), m = pick(rng, ['🍎', '⭐', '🌸']);
        const ans = side === 'ひだり' ? p : n - p + 1;
        return {
          stem: `${m}は ${side}から かぞえて なんばんめですか。`,
          fig: FIG.row(n, {e, marks: {[p - 1]: m}, numbers: false}),
          ...numChoices(rng, ans, {min: 1, max: n, unit: 'ばんめ', near: 2}),
          explain: `${side}はしから かぞえると、${m}は ${ans}ばんめ。`
        };
      }
      // between：ひだりから a こめ と みぎから b こめ の あいだ
      let a, b, L, R;
      do { a = rand(rng, 2, n - 3); b = rand(rng, 2, n - 3); L = a; R = n - b + 1; } while (R - L < 2);
      const ans = R - L - 1;
      return {
        stem: `ひだりから ${a}こめと、みぎから ${b}こめの あいだには、${e}が なんこ ありますか。`,
        fig: FIG.row(n, {e}),
        ...numChoices(rng, ans, {min: 1, max: n, unit: 'こ', near: 2}),
        explain: `ひだりから ${a}こめは ${FIG.NUM[L]}、みぎから ${b}こめは ${FIG.NUM[R]}。その あいだは ${ans}こ。`
      };
    },

    // ---- ならんだ 人（れつ） ----
    gyouretsu(rng, v) {
      v = variantOf(rng, v, ['mae', 'ushiro', 'ushironin', 'aida', 'zenbu']);
      const n = rand(rng, 7, 12), t = rand(rng, 2, n - 1);   // t = まえから t ばんめ
      const name = pick(rng, ['はなこさん', 'ゆいさん', 'みおさん', 'さくらさん']);
      if (v === 'zenbu') {
        const a = rand(rng, 3, 9), b = rand(rng, 3, 9), ans = a + b - 1;
        return {
          stem: `子どもが 1れつに ならんで います。${name}は まえから ${a}ばんめで、うしろから ${b}ばんめです。ぜんぶで なんにん ならんで いますか。`,
          fig: FIG.scene('🧒🧒👧🧒'),
          ...numChoices(rng, ans, {min: 3, max: 20, unit: 'にん', near: 2}),
          explain: `${name}を 2かい かぞえて いるので、${a}＋${b}−1＝${ans}にん。`
        };
      }
      if (v === 'aida') {
        let t2; do { t2 = rand(rng, 1, n); } while (Math.abs(t2 - t) < 2);
        const ans = Math.abs(t2 - t) - 1;
        return {
          stem: '👧と 👦の あいだには なんにん いますか。',
          fig: FIG.line(n, {[t - 1]: '👧', [t2 - 1]: '👦'}),
          ...numChoices(rng, ans, {min: 1, max: n, unit: 'にん', near: 2}),
          explain: `👧と 👦の あいだの 子を かぞえると ${ans}にん。`
        };
      }
      const fig = FIG.line(n, {[t - 1]: '👧'});
      const Q = {
        mae: [`👧は まえから ${t}ばんめです。👧の まえには なんにん いますか。`, t - 1, `まえから ${t}ばんめなので、まえに いるのは ${t}−1＝${t - 1}にん。`, 'にん'],
        ushiro: [`👧は うしろから なんばんめですか。`, n - t + 1, `うしろから かぞえると ${n - t + 1}ばんめ。`, 'ばんめ'],
        ushironin: [`👧の うしろには なんにん いますか。`, n - t, `👧より うしろの 子を かぞえると ${n - t}にん。`, 'にん'],
      }[v];
      return {stem: Q[0], fig, ...numChoices(rng, Q[1], {min: 0, max: n, unit: Q[3], near: 2}), explain: Q[2]};
    },

    // ---- けいさん ----
    keisan(rng, v) {
      v = variantOf(rng, v, ['add', 'add_carry', 'sub', 'sub_borrow', 'box_a', 'box_b', 'sub_box', 'box_sub', 'three']);
      let a, b, c, parts, ans;
      const addPair = carry => { do { a = rand(rng, 1, 9); b = rand(rng, 1, 9); } while (carry ? a + b <= 10 : a + b > 10); };
      switch (v) {
        case 'add': addPair(false); ans = a + b; parts = [a, '+', b, '=', '□']; break;
        case 'add_carry': addPair(true); ans = a + b; parts = [a, '+', b, '=', '□']; break;
        case 'sub': a = rand(rng, 3, 10); b = rand(rng, 1, a - 1); ans = a - b; parts = [a, '−', b, '=', '□']; break;
        case 'sub_borrow': do { a = rand(rng, 11, 18); b = rand(rng, 2, 9); } while (a % 10 >= b || a - b >= 10); ans = a - b; parts = [a, '−', b, '=', '□']; break;
        case 'box_a': c = rand(rng, 5, 15); b = rand(rng, 1, Math.min(9, c - 1)); ans = c - b; parts = ['□', '+', b, '=', c]; break;
        case 'box_b': c = rand(rng, 5, 15); a = rand(rng, 1, Math.min(9, c - 1)); ans = c - a; parts = [a, '+', '□', '=', c]; break;
        case 'sub_box': a = rand(rng, 5, 12); c = rand(rng, 0, a - 1); ans = a - c; parts = [a, '−', '□', '=', c]; break;
        case 'box_sub': b = rand(rng, 1, 9); c = rand(rng, 1, 9); ans = b + c; parts = ['□', '−', b, '=', c]; break;
        default: a = rand(rng, 2, 9); b = rand(rng, 1, 9); c = rand(rng, 1, a + b - 1); ans = a + b - c; parts = [a, '+', b, '−', c, '=', '□'];
      }
      const shown = parts.map(p => p === '□' ? ans : p).join(' ');
      return {
        stem: '□に あてはまる かずは どれですか。',
        fig: FIG.formula(parts.map(String)),
        ...numChoices(rng, ans, {min: 0, max: 20, near: 2}),
        explain: `${shown} だね。`
      };
    },

    // ---- ぶんしょうだい ----
    bunsho(rng, v) {
      v = variantOf(rng, v, ['fueru', 'nokori', 'chigai', 'hajime', 'noriori', 'matomari', 'wakeru', 'hako', 'nenrei', 'hanbun', 'ippai', 'moratte']);
      const e = pick(rng, ['🍬', '🍪', '🍙', '🍓', '🍊']);
      const nm = pick(rng, ['たろうさん', 'ゆきさん', 'けんさん', 'あおいさん']);
      let stem, ans, explain, unit = 'こ', fig = FIG.scene(e), max = 20;
      switch (v) {
        case 'fueru': { const a = rand(rng, 3, 9), b = rand(rng, 2, 9); ans = a + b;
          stem = `${nm}は ${e}を ${a}こ もって います。おかあさんから ${b}こ もらいました。${e}は ぜんぶで なんこに なりましたか。`;
          explain = `${a}＋${b}＝${ans}`; break; }
        case 'nokori': { const a = rand(rng, 6, 15), b = rand(rng, 2, Math.min(9, a - 1)); ans = a - b;
          stem = `${e}が ${a}こ ありました。${b}こ たべると、のこりは なんこですか。`; explain = `${a}−${b}＝${ans}`; break; }
        case 'chigai': { const a = rand(rng, 5, 14); let b; do { b = rand(rng, 3, 14); } while (Math.abs(a - b) < 2);
          const d = Math.abs(a - b), [big, small] = a > b ? ['あか', 'きいろ'] : ['きいろ', 'あか'];
          return {
            stem: `あかい はなが ${a}ほん、きいろい はなが ${b}ほん あります。どちらが なんぼん おおいですか。`,
            fig: FIG.scene('🌷🌼'),
            ...textChoices(rng, [`${big}が ${d}ぼん おおい`, `${small}が ${d}ぼん おおい`, `${big}が ${d + 1}ぼん おおい`, `${big}が ${d - 1}ぼん おおい`]),
            explain: `${big}の ほうが おおい。${Math.max(a, b)}−${Math.min(a, b)}＝${d}`
          }; }
        case 'hajime': { const b = rand(rng, 2, 8), c = rand(rng, b + 2, 16); ans = c - b;
          stem = `${nm}は ${e}を いくつか もって いました。ともだちから ${b}こ もらったので、${c}こに なりました。はじめに なんこ もって いましたか。`;
          explain = `もらう まえに もどして かんがえるよ。${c}−${b}＝${ans}`; break; }
        case 'noriori': { const a = rand(rng, 4, 10), b = rand(rng, 1, a - 1), c = rand(rng, 1, 6); ans = a - b + c; unit = 'にん';
          const place = pick(rng, [['🚌', 'バスに', 'つぎの バスていで'], ['🛗', 'エレベーターに', 'つぎの かいで']]); fig = FIG.scene(place[0]);
          stem = `${place[1]} ${a}にん のって いました。${place[2]} ${b}にん おりて、${c}にん のりました。いま なんにん のって いますか。`;
          explain = `${a}−${b}＋${c}＝${ans}`; break; }
        case 'matomari': { const a = rand(rng, 2, 3), b = rand(rng, 2, 4), c = rand(rng, 1, 3); ans = a * b + c;
          stem = `1ふくろに ${a}こずつ はいった ${e}の ふくろが ${b}ふくろ と、ふくろに はいって いない ${e}が ${c}こ あります。${e}は ぜんぶで なんこ ありますか。`;
          explain = `${Array(b).fill(a).join('＋')}＋${c}＝${ans}`; break; }
        case 'wakeru': { const k = rand(rng, 2, 3), per = rand(rng, 2, 5), N = k * per; ans = per;
          stem = `${e}が ${N}こ あります。${k}にんで おなじ かずずつ わけると、ひとり なんこに なりますか。`;
          explain = `1こずつ じゅんばんに くばって いくと、ひとり ${per}こ。${Array(k).fill(per).join('＋')}＝${N}`; break; }
        case 'hako': { const N = 2 * rand(rng, 2, 7); ans = N / 2; unit = 'はこ'; fig = FIG.scene('📦');
          stem = `${e}が ${N}こ あります。1はこに 2こずつ いれると、はこは なんはこ いりますか。`;
          explain = `2こずつ まとめると ${ans}はこ（2を ${ans}かい たすと ${N}）。`; break; }
        case 'nenrei': { const a = rand(rng, 5, 8), b = rand(rng, 2, 6); ans = a + b; unit = 'さい'; fig = FIG.scene('👦🧒');
          stem = `${nm}は ${a}さいです。おにいさんは ${nm}より ${b}さい うえです。おにいさんは なんさいですか。`;
          explain = `${a}＋${b}＝${ans}`; break; }
        case 'ippai': { const cap = rand(rng, 6, 10), have = rand(rng, 1, cap - 1); ans = cap - have; fig = FIG.scene('📦' + e);
          stem = `はこには ${e}が ${cap}こ はいります。いま ${have}こ はいって います。あと なんこ いれると いっぱいに なりますか。`;
          explain = `${cap}−${have}＝${ans}`; break; }
        case 'moratte': { const a = rand(rng, 3, 9), b = rand(rng, 1, 6), c = rand(rng, 1, a + b - 1), eatFirst = rng() < 0.5;
          const x = eatFirst ? Math.min(c, a - 1) : c; ans = eatFirst ? a - x + b : a + b - x;
          stem = eatFirst
            ? `かごに ${e}が ${a}こ あります。${x}こ たべたあと、${b}こ もらいました。かごの ${e}は なんこに なりましたか。`
            : `かごに ${e}が ${a}こ あります。${b}こ もらったあと、${x}こ たべました。かごの ${e}は なんこに なりましたか。`;
          explain = eatFirst ? `${a}−${x}＋${b}＝${ans}` : `${a}＋${b}−${x}＝${ans}`; break; }
        default: { const N = 2 * rand(rng, 2, 8); ans = N / 2;
          stem = `${e}が ${N}こ あります。その はんぶんを たべました。のこりは なんこですか。`;
          explain = `はんぶんは おなじ かずに 2つに わけた 1つぶん。${ans}と ${ans}で ${N}。`; }
      }
      return {stem, fig, ...numChoices(rng, ans, {min: 0, max: max + 10, unit, near: 2}), explain};
    },

    // ---- とけい ----
    tokei(rng, v) {
      v = variantOf(rng, v, ['ji', 'han', 'ato']);
      const h = rand(rng, 1, 12), nx = h % 12 + 1, pv = (h + 10) % 12 + 1;
      if (v === 'ato') {
        const d = rand(rng, 1, 3), ans = (h + d - 1) % 12 + 1;
        return {
          stem: `とけいは いま ${h}じです。${d}じかん たつと なんじに なりますか。`,
          fig: FIG.clock(h, 0),
          ...textChoices(rng, [`${ans}じ`, `${(ans % 12) + 1}じ`, `${(ans + 10) % 12 + 1}じ`, `${ans}じはん`]),
          explain: `${h}じから ながい はりが ${d}かい まわると ${ans}じ。`
        };
      }
      const han = v === 'han';
      return {
        stem: 'とけいは なんじ（なんじはん）を さして いますか。',
        fig: FIG.clock(h, han ? 30 : 0),
        ...textChoices(rng, han ? [`${h}じはん`, `${nx}じはん`, `${h}じ`, `${nx}じ`] : [`${h}じ`, `${nx}じ`, `${pv}じ`, `${h}じはん`]),
        explain: han ? `みじかい はりが ${h}と ${nx}の あいだ、ながい はりが 6なので ${h}じはん。` : `みじかい はりが ${h}、ながい はりが 12なので ${h}じ。`
      };
    },

    // ---- かずの 大きさ（いちばん大きい・○ばんめ・まん中・どちらが おおい） ----
    ookisa(rng, v) {
      v = variantOf(rng, v, ['max1', 'max2', 'min', 'rank', 'middle', 'more']);
      if (v === 'more') {
        const a = rand(rng, 4, 9); let b; do { b = rand(rng, 4, 9); } while (b === a);
        const e = pick(rng, THINGS);
        return {
          stem: `${e}が おおいのは ア と イの どちらですか。`,
          fig: `<div style="display:flex;gap:16px;width:100%;justify-content:center"><div style="flex:1;max-width:260px"><div style="text-align:center;font-weight:700">ア</div>${FIG.scatter([{e, n: a}], rng, {cols: 3, rows: 3})}</div><div style="flex:1;max-width:260px"><div style="text-align:center;font-weight:700">イ</div>${FIG.scatter([{e, n: b}], rng, {cols: 3, rows: 3})}</div></div>`,
          ...textChoices(rng, [a > b ? 'ア' : 'イ', a > b ? 'イ' : 'ア']),
          explain: `アは ${a}こ、イは ${b}こ。${a > b ? 'ア' : 'イ'}の ほうが おおい。`
        };
      }
      const two = v === 'max2' || rng() < 0.4;
      const set = new Set(); while (set.size < 5) set.add(two ? rand(rng, 10, 99) : rand(rng, 0, 10));
      const nums = shuffle([...set], rng), sorted = [...nums].sort((a, b) => a - b);
      const cards = FIG.formula(nums.map(String).join(' , ').split(' '));
      const Q = {
        max1: ['いちばん 大きい かずは どれですか。', sorted[4]], max2: ['いちばん 大きい かずは どれですか。', sorted[4]],
        min: ['いちばん 小さい かずは どれですか。', sorted[0]],
        rank: [`大きい ほうから かぞえて ${pick(rng, [2, 3])}ばんめの かずは どれですか。`, null],
        middle: ['小さい じゅんに ならべた とき、まん中に なる かずは どれですか。', sorted[2]]
      }[v];
      let ans = Q[1];
      if (v === 'rank') { const k = +Q[0].match(/(\d)ばんめ/)[1]; ans = sorted[5 - k]; }
      const {choices, answer} = textChoices(rng, [ans, ...nums.filter(x => x !== ans)].map(String).slice(0, 5));
      return {stem: Q[0], fig: cards, choices, answer, explain: `小さい じゅんに ならべると ${sorted.join('、')}。`};
    },

    // ---- お金（10円・5円・1円） ----
    okane(rng) {
      const t = rand(rng, 0, 2), f = rand(rng, 0, 2), o = rand(rng, t + f ? 0 : 1, 4);
      const list = shuffle([...Array(t).fill(10), ...Array(f).fill(5), ...Array(o).fill(1)], rng);
      const ans = 10 * t + 5 * f + o;
      return {
        stem: 'おさいふの 中の お金は なん円ですか。',
        fig: FIG.coins(list, rng),
        ...numChoices(rng, ans, {k: 5, min: 1, max: 40, unit: '円', near: 3}),
        explain: `10円が ${t}こ、5円が ${f}こ、1円が ${o}こ で ${ans}円。`
      };
    },

    // ---- いくつと いくつ（あと いくつで ○こ／いくつ とると のこり ○こ） ----
    ikutsu(rng, v) {
      v = variantOf(rng, v, ['ato', 'toru']);
      const goal = rand(rng, 6, 12), have = rand(rng, 2, goal - 1), e = pick(rng, FRUITS);
      if (v === 'ato') return {
        stem: `${e}を ${goal}こに するには、あと なんこ あれば よいですか。`,
        fig: FIG.scatter([{e, n: have}], rng, {cols: 6, rows: 2}),
        ...numChoices(rng, goal - have, {min: 1, max: 12, unit: 'こ', near: 2}),
        explain: `${have}と ${goal - have}で ${goal}。`
      };
      const left = rand(rng, 1, goal - 1);
      return {
        stem: `${e}が ${goal}こ あります。なんこ とると、のこりが ${left}こに なりますか。`,
        fig: FIG.scatter([{e, n: goal}], rng, {cols: 6, rows: 2}),
        ...numChoices(rng, goal - left, {min: 1, max: 12, unit: 'こ', near: 2}),
        explain: `${goal}は ${left}と ${goal - left}。だから ${goal - left}こ とる。`
      };
    },

    // ---- カード（みぎの カードが ひだりより N 大きい／小さい） ----
    card(rng, v) {
      v = variantOf(rng, v, ['plus3', 'minus3', 'plus5', 'minus5']);
      const N = +v.slice(-1), plus = v.startsWith('plus');
      const a = plus ? rand(rng, 0, 10) : rand(rng, N, 12);
      const b = plus ? a + N : a - N;
      const askRight = rng() < 0.6;
      const ans = askRight ? b : a;
      return {
        stem: `みぎの カードは ひだりの カードより ${N} ${plus ? '大きい' : '小さい'} かずです。「？」に はいる かずは どれですか。`,
        fig: FIG.cards(askRight ? [a, '？'] : ['？', b]),
        ...numChoices(rng, ans, {min: 0, max: 20, near: 2}),
        explain: plus ? `${a}より ${N} 大きい かずは ${b}。` : `${a}より ${N} 小さい かずは ${b}。`
      };
    },

    // ---- きまりの ある ならび（くりかえし・かずの ぶんだけ・へって ふえる） ----
    kurikaeshi(rng, v) {
      v = variantOf(rng, v, ['repeat', 'count', 'updown']);
      let seq;
      if (v === 'repeat') { const unit = shuffle([1, 2, 3, 4, 5], rng).slice(0, rand(rng, 3, 4)); seq = Array.from({length: 12}, (_, i) => unit[i % unit.length]); }
      else if (v === 'count') { seq = []; for (let k = 1; seq.length < 12; k++) for (let j = 0; j < k && seq.length < 12; j++) seq.push(k); }
      else { const s = rand(rng, 14, 20); seq = []; let x = s; for (let i = 0; i < 12; i++) { seq.push(x); x += i % 2 === 0 ? -2 : 1; } }
      const hole = rand(rng, 6, 10), ans = seq[hole];
      const text = seq.map((x, i) => i === hole ? '□' : x).join(', ') + ' …';
      return {
        stem: 'ある きまりで かずが ならんで います。□に はいる かずは どれですか。',
        fig: `<div style="font-size:26px;font-weight:700;letter-spacing:.05em;text-align:center;line-height:1.8">${text}</div>`,
        ...numChoices(rng, ans, {min: 0, max: 20, near: 2}),
        explain: {repeat: 'おなじ ならびが くりかえして いるよ。', count: '1が 1こ、2が 2こ、3が 3こ…と ならんで いるよ。', updown: '2へって 1ふえる、を くりかえして いるよ。'}[v] + `□は ${ans}。`
      };
    },

    // ---- さいころ（2つ あわせて いくつ／もう1つの め） ----
    saikoro(rng, v) {
      v = variantOf(rng, v, ['other', 'sum']);
      const a = rand(rng, 1, 6), b = rand(rng, 1, 6);
      if (v === 'sum') return {
        stem: '2つの さいころの めを あわせると いくつですか。',
        fig: FIG.dice([a, b]),
        ...numChoices(rng, a + b, {min: 2, max: 12, near: 2}),
        explain: `${a}と ${b}で ${a + b}。`
      };
      return {
        stem: `2つの さいころの めを あわせると ${a + b}に なりました。みぎの さいころの めは いくつですか。`,
        fig: FIG.dice([a, null]),
        ...numChoices(rng, b, {min: 1, max: 6, near: 2}),
        explain: `${a}と あわせて ${a + b}に なるのは ${b}。`
      };
    },

    // ---- かずの ならび（おなじ かずずつ ふえる・へる） ----
    narabi(rng, v) {
      v = variantOf(rng, v, ['up1', 'up2', 'down1']);
      const step = v === 'up2' ? 2 : 1, dir = v === 'down1' ? -1 : 1, L = 7;
      const start = dir > 0 ? rand(rng, 0, 20 - step * (L - 1)) : rand(rng, step * (L - 1), 20);
      const seq = Array.from({length: L}, (_, i) => start + dir * step * i);
      const hole = rand(rng, 2, L - 1), ans = seq[hole];
      const text = seq.map((x, i) => i === hole ? '□' : x).join('、');
      return {
        stem: `かずが きまりどおりに ならんで います。□に はいる かずは どれですか。`,
        fig: FIG.formula(text.split('、').map(String)),
        ...numChoices(rng, ans, {min: 0, max: 20, near: 2}),
        explain: `${step}ずつ ${dir > 0 ? 'ふえて' : 'へって'} いるので ${ans}。`
      };
    }
  };
})();
