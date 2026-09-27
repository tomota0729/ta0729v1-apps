// 赤門クイズ 共通 - years.js
// ランダム テストの もと：17回ぶんの 回ごとに「大問の ならびと 問題の しゅるい」だけを かいた もの。
// 問題の 文・数は GENS（gens.js）が 毎回 つくる。もとの テストの 文や 数の くみあわせは のせない。
// items は [ジェネレーター, しゅるい]。note … にた べつの もんだいで かわりに だして いる ところ。

const Y = (g, ...vs) => vs.map(v => [g, v]);

// ランダム テスト：17回ぶんの 問題の しゅるいから n こ えらぶ（よく でる しゅるいほど でやすい）。
// 本番と おなじように、かず → けいさん → ぶんしょうだい の じゅんに ならべ、おなじ しゅるいを 大問に まとめる。
const GEN_ORDER = ['kazoe', 'kakure10', 'ikutsu', 'ookisa', 'okane', 'card', 'nanbanme', 'gyouretsu', 'keisan', 'narabi', 'kurikaeshi', 'saikoro', 'tokei', 'bunsho'];
const GEN_TITLE = {kazoe: 'かずを かぞえる', kakure10: '10の まとまり', ikutsu: 'いくつと いくつ', ookisa: 'かずの 大きさ', okane: 'おかね', card: 'カード',
  nanbanme: 'なんばんめ', gyouretsu: 'ならんだ 人', keisan: 'けいさん', narabi: 'かずの ならび', kurikaeshi: 'きまり', saikoro: 'さいころ', tokei: 'とけい', bunsho: 'ぶんしょうだい'};
function randomYear(n) {
  const pool = YEARS.flatMap(y => y.dai.flatMap(d => d.items));
  const picked = [], seen = new Set();
  for (let guard = 0; picked.length < n && guard < 500; guard++) {
    const it = pool[Math.floor(Math.random() * pool.length)], key = it.join('/');
    if (seen.has(key) && guard < 300) continue;   // おなじ しゅるいは なるべく かさねない
    seen.add(key); picked.push(it);
  }
  picked.sort((a, b) => GEN_ORDER.indexOf(a[0]) - GEN_ORDER.indexOf(b[0]));
  const dai = [];
  picked.forEach(it => {
    const last = dai[dai.length - 1];
    if (last && last.g === it[0]) last.items.push(it);
    else dai.push({g: it[0], t: GEN_TITLE[it[0]] || '', items: [it]});
  });
  return {id: `random-${n}`, label: `ランダム ${n}もん`, dai};
}

const YEARS = [
  {id: '2025-11', label: '2025ねん 11がつ', dai: [
    {t: '10の まとまり', items: Y('kakure10', 'hand', 'hand', 'hand')},
    {t: 'なんばんめ', items: Y('nanbanme', 'one', 'one', 'between')},
    {t: 'けいさん', items: Y('keisan', 'add', 'add_carry', 'sub', 'sub', 'box_a', 'box_b', 'sub_box', 'box_sub')},
    {t: 'ぶんしょうだい', items: [['bunsho', 'fueru'], ['tokei', 'han'], ['bunsho', 'noriori'], ['bunsho', 'matomari'], ['bunsho', 'wakeru']]}]},
  {id: '2025-06', label: '2025ねん 6がつ', note: 'つみきの 見え方・ピースの かさねあわせ・カードの おもてうら は、にた べつの もんだいに して います。', dai: [
    {t: 'かずを かぞえる', items: Y('kazoe', 'plain', 'plain', 'plain', 'plain', 'plain')},
    {t: 'かずの ならび', items: Y('narabi', 'up1', 'down1', 'up2')},
    {t: 'ふえたり へったり', items: Y('bunsho', 'fueru', 'nokori', 'nokori', 'moratte', 'moratte')},
    {t: 'かたち（かわり）', items: Y('ookisa', 'more', 'more', 'middle')},
    {t: 'パーティー', items: [['ookisa', 'rank'], ['ookisa', 'middle'], ['bunsho', 'matomari'], ['bunsho', 'wakeru'], ['bunsho', 'wakeru']]},
    {t: 'ピース（かわり）', items: Y('kazoe', 'mixed', 'mixed', 'awase')},
    {t: 'カード（かわり）', items: Y('saikoro', 'other', 'other', 'sum', 'sum')}]},
  {id: '2024-11', label: '2024ねん 11がつ', note: 'ますめの ひろさくらべ は、にた べつの もんだいに して います。', dai: [
    {t: '10の まとまり', items: Y('kakure10', 'hand', 'hand')},
    {t: 'なんばんめ', items: Y('nanbanme', 'one', 'which')},
    {t: 'けいさん', items: Y('keisan', 'add', 'add_carry', 'sub', 'sub_borrow', 'box_b')},
    {t: 'ぶんしょうだい・とけい', items: [['bunsho', 'fueru'], ['bunsho', 'chigai'], ['okane', null], ['tokei', 'ji'], ['tokei', 'han']]},
    {t: 'ひろさ（かわり）', items: Y('kazoe', 'mixed', 'awase')}]},
  {id: '2024-06', label: '2024ねん 6がつ', note: 'つみきの 見え方 は、にた べつの もんだいに して います。', dai: [
    {t: 'いくつと いくつ', items: Y('ikutsu', 'ato', 'ato', 'toru', 'toru')},
    {t: 'ぶんしょうだい', items: Y('bunsho', 'hako', 'wakeru', 'chigai')},
    {t: 'つみき（かわり）', items: Y('kazoe', 'mixed', 'mixed')}]},
  {id: '2023-11', label: '2023ねん 11がつ', dai: [
    {t: 'おかね', items: Y('okane', null, null, null, null)},
    {t: 'けいさん', items: Y('keisan', 'add', 'add', 'sub')},
    {t: 'カード', items: Y('card', 'plus5', 'plus5', 'minus5')},
    {t: 'なんばんめ・ぶんしょうだい', items: [['gyouretsu', 'ushiro'], ['bunsho', 'nokori'], ['bunsho', 'hajime']]}]},
  {id: '2023-06', label: '2023ねん 6がつ', note: 'つみきの かいだん は、にた べつの もんだいに して います。', dai: [
    {t: 'かずを かぞえる', items: Y('kazoe', 'plain', 'plain')},
    {t: 'あわせた かず', items: Y('kazoe', 'awase', 'awase')},
    {t: 'かずの じゅんばん', items: Y('ookisa', 'middle', 'rank')},
    {t: 'ぶんしょうだい', items: Y('bunsho', 'fueru', 'nokori', 'nenrei', 'wakeru', 'hanbun')},
    {t: 'すごろく', items: Y('saikoro', 'sum', 'other')},
    {t: 'つみき（かわり）', items: Y('kurikaeshi', 'count', 'count', 'repeat')}]},
  {id: '2022-11', label: '2022ねん 11がつ', note: 'ますめの ながさくらべ は、にた べつの もんだいに して います。', dai: [
    {t: '10の まとまり', items: Y('kakure10', 'ato10', 'ato10', 'ato10')},
    {t: 'ながさ（かわり）', items: Y('ookisa', 'max1', 'min', 'rank')},
    {t: 'けいさん', items: Y('keisan', 'add', 'sub', 'box_b', 'sub_box', 'three')},
    {t: 'ぶんしょうだい', items: [['bunsho', 'noriori'], ['bunsho', 'chigai'], ['bunsho', 'nenrei'], ['keisan', 'box_a'], ['bunsho', 'wakeru']]},
    {t: 'せきの なんばんめ', items: Y('gyouretsu', 'mae', 'zenbu')},
    {t: 'きまり', items: Y('kurikaeshi', 'repeat', 'updown', 'count')}]},
  {id: '2022-06', label: '2022ねん 6がつ', dai: [
    {t: 'かずを かぞえる', items: Y('kazoe', 'plain', 'plain', 'plain', 'plain')},
    {t: 'かくれた かず', items: Y('kakure10', 'total', 'total')},
    {t: 'カード', items: Y('card', 'plus3', 'plus3', 'minus3', 'minus3')}]},
  {id: '2021-11', label: '2021ねん 11がつ', note: 'ケーキを きる もんだい は、にた べつの もんだいに して います。', dai: [
    {t: 'ケーキ（かわり）', items: Y('kazoe', 'mixed', 'mixed')},
    {t: 'けいさん', items: Y('keisan', 'add', 'add_carry', 'sub', 'sub_borrow')},
    {t: 'ぶんしょうだい', items: Y('bunsho', 'nokori', 'hanbun', 'noriori')}]},
  {id: '2021-06', label: '2021ねん 6がつ', dai: [
    {t: 'かずを かぞえる', items: [['kazoe', 'plain'], ['kazoe', 'plain'], ['kazoe', 'plain'], ['kakure10', 'ato10']]},
    {t: 'ならんだ 人', items: [['kazoe', 'mixed'], ['gyouretsu', 'ushiro'], ['gyouretsu', 'mae'], ['gyouretsu', 'aida'], ['gyouretsu', 'ushironin']]}]},
  {id: '2020-11', label: '2020ねん 11がつ', dai: [
    {t: 'ぶんしょうだい', items: [['bunsho', 'hajime'], ['bunsho', 'chigai'], ['bunsho', 'matomari'], ['ookisa', 'rank'], ['tokei', 'ato']]},
    {t: 'きまり', items: Y('kurikaeshi', 'repeat', 'count', 'updown')},
    {t: 'ぎょうれつ', items: Y('gyouretsu', 'mae', 'zenbu')}]},
  {id: '2020-06', label: '2020ねん 6がつ', dai: [
    {t: 'あわせた かず', items: Y('kazoe', 'awase', 'awase')},
    {t: 'ぶんしょうだい', items: Y('bunsho', 'nokori', 'ippai')},
    {t: 'なんばんめ', items: Y('gyouretsu', 'mae', 'ushiro', 'aida')}]},
  {id: '2016-11', label: '2016ねん 11がつ', dai: [
    {t: 'さいころ', items: Y('saikoro', 'other', 'other')}]},
  {id: '2016-06', label: '2016ねん 6がつ', dai: [
    {t: 'かずを かぞえる', items: Y('kazoe', 'plain', 'plain')},
    {t: 'どちらが おおい', items: Y('ookisa', 'more', 'more')},
    {t: 'えらんで かぞえる', items: Y('kazoe', 'mixed')},
    {t: '10の まとまり', items: Y('kakure10', 'ato10', 'ato10')}]},
  {id: '2015-11', label: '2015ねん 11がつ', dai: [
    {t: '10の まとまり', items: Y('kakure10', 'hand', 'hand', 'hand')},
    {t: 'かずの 大きさ', items: Y('ookisa', 'max1', 'rank', 'middle')},
    {t: 'けいさん', items: Y('keisan', 'add', 'add_carry', 'sub', 'sub_borrow')}]},
  {id: '2013-11', label: '2013ねん 11がつ', dai: [
    {t: '10の まとまり', items: Y('kakure10', 'hand', 'hand', 'hand')},
    {t: 'かずの ならび', items: Y('narabi', 'up1', 'up2')},
    {t: 'けいさん', items: Y('keisan', 'add', 'box_a', 'add_carry')},
    {t: 'なんばんめ', items: Y('gyouretsu', 'ushironin', 'zenbu')}]},
  {id: '2012-11', label: '2012ねん 11がつ', dai: [
    {t: 'かずの 大きさ', items: Y('ookisa', 'max1', 'max2')},
    {t: 'けいさん', items: Y('keisan', 'add', 'add_carry', 'sub_box')},
    {t: 'なんばんめ', items: Y('gyouretsu', 'ushironin', 'aida')},
    {t: 'ぶんしょうだい', items: Y('bunsho', 'chigai', 'hajime', 'noriori')}]}
];
