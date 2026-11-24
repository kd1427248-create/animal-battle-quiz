// 職業と技。ダメージ式は battle.js のまま。ここにある effect は、戦闘側が後から読む名前。
// レベルは職業ごと。転職しても、他の職業のレベルは足さない。転職条件用の記録だけ残る。

const BASIC_JOBS = ["warrior", "martial", "mage", "priest", "thief", "gadabout"];

const JOBS = {
  warrior: {
    name: "戦士", rank: "basic", role: "攻撃と守備が高い前衛",
    hp: 220, atk: 55, def: 55, spd: 40, mp: 18,
    learn: [[1, "ukenagashi"], [3, "kabau"], [9, "shippu"], [12, "moroha"], [15, "kyusho"], [18, "nioudachi"], [24, "tsuruginomai"], [26, "metalgiri"], [28, "samidareken"], [32, "konshin"], [35, "kaishinhitchu"], [40, "shinrabansho"]],
  },
  martial: {
    name: "武闘家", rank: "basic", role: "素早さと攻撃が高い",
    hp: 160, atk: 70, def: 30, spd: 80, mp: 22,
    learn: [[4, "ashibarai"], [8, "tobihiza"], [11, "hitchuken"], [14, "kamaitachi"], [17, "seikenzuki"], [20, "sutemiuchi"], [23, "mawashigeri"], [26, "bakuretsu"], [29, "itetsuku"], [32, "kaishinhitchu"], [40, "godbakuretsu"]],
  },
  mage: {
    name: "魔法使い", rank: "basic", role: "攻撃呪文が得意で、打たれ弱い",
    hp: 130, atk: 35, def: 28, spd: 55, mp: 40,
    learn: [[1, "mera"], [2, "sukara"], [4, "hyado"], [7, "gira"], [8, "sukuruto"], [10, "bomiosSlow"], [11, "io"], [12, "mahotra"], [13, "begirama"], [15, "merami"], [16, "hyadaruko"], [18, "baikirt"], [19, "iora"], [20, "hyadain"], [21, "medapani"], [23, "begiragon"], [24, "merazoma"], [26, "mahyado"], [30, "meragaia"], [40, "medoroa"]],
  },
  priest: {
    name: "僧侶", rank: "basic", role: "回復と補助",
    hp: 180, atk: 40, def: 45, spd: 50, mp: 34,
    learn: [[1, "hoimi"], [2, "nifram"], [3, "manusa"], [4, "bagi"], [6, "rukanii"], [7, "kiarii"], [8, "rahoruAll"], [9, "piorimu"], [10, "zameha"], [10, "zao"], [12, "behoimi"], [12, "mahotoon"], [14, "rukanan"], [14, "magicbarrier"], [16, "bagima"], [17, "bashirura"], [18, "zaki"], [18, "behoimu"], [19, "zaoraru"], [21, "zaraki"], [21, "fubaha"], [24, "bagikurosu"], [24, "behoma"], [25, "megante"], [25, "behomara"], [40, "zaoriku"]],
  },
  thief: {
    name: "盗賊", rank: "basic", role: "すばやく、素材と先制を取る",
    hp: 150, atk: 48, def: 32, spd: 90, mp: 24,
    learn: [[1, "nusumu"], [3, "sunakemuri"], [5, "nemuriattack"], [8, "wingblow"], [10, "shibire"], [13, "assassinatk"], [14, "shinobiashi"], [18, "rasenuchi"], [21, "hypnos"], [24, "oikaze"], [30, "kingtime"], [40, "nusumu2"]],
  },
  gadabout: {
    name: "遊び人", rank: "basic", role: "最初は数値が低く、役に立ちにくい",
    hp: 140, atk: 30, def: 25, spd: 60, mp: 20,
    learn: [[4, "tsukkomi"], [10, "megazaru"], [12, "bukimi"], [16, "ouen"], [17, "moonsault"], [20, "hassledance"], [24, "maryokukakusei"]],
  },
  battlemaster: {
    name: "バトルマスター", rank: "advanced", role: "物理の火力が一番高い",
    parents: { warrior: 20, martial: 20 },
    trait: "anger",
    hp: 200, atk: 85, def: 40, spd: 70, mp: 24,
    learn: [[1, "yaibakudaki"], [3, "futou"], [7, "samidaregiri"], [11, "sutemi"], [14, "hayabusagiri"], [15, "kiaidame"], [20, "shintou"], [35, "tensionboost"], [40, "gigaslash"], [99, "zenshin"]],
  },
  sage: {
    name: "賢者", rank: "advanced", role: "回復が一番高く、攻撃呪文も使える",
    parents: { priest: 20, mage: 20 },
    alt: { gadabout: 25 },
    trait: "echo",
    hp: 170, atk: 45, def: 40, spd: 55, mp: 50,
    learn: [[1, "hoimi"], [3, "sukara"], [5, "rukanii"], [6, "merami"], [8, "behoimi"], [10, "dorukuma"], [12, "bagikurosu"], [13, "behoma"], [14, "behomara"], [15, "iora"], [16, "zaoriku"], [17, "ionazun"], [18, "maryokukakusei"], [18, "parupunte"], [24, "manuha"], [40, "iogrande"], [40, "dorumadon"], [99, "madante"]],
  },
  ranger: {
    name: "レンジャー", rank: "advanced", role: "攻撃しながら味方を安定させる",
    parents: { martial: 20, thief: 20 },
    trait: "shadowbind",
    hp: 175, atk: 68, def: 35, spd: 85, mp: 28,
    learn: [[1, "viperfang"], [3, "jibarika"], [7, "tigerclaw"], [11, "dualcutter"], [14, "fubaha"], [20, "nemuriuchi"], [40, "chemibomb"], [99, "pantherrush"]],
  },
  magicKnight: {
    name: "魔法戦士", rank: "advanced", role: "味方の火力を底上げする",
    parents: { warrior: 20, mage: 20 },
    trait: "forcebreak",
    hp: 200, atk: 60, def: 48, spd: 50, mp: 36,
    learn: [[1, "kaengiri"], [2, "mahyadogiri"], [3, "inazumagiri"], [5, "begirama"], [8, "baishion"], [12, "mppasser"], [15, "iora"], [16, "choubun"], [22, "bukimi"], [40, "gigacross"], [99, "burstrainbow"]],
  },
  paladin: {
    name: "パラディン", rank: "advanced", role: "耐久に特化した壁",
    parents: { warrior: 20, priest: 20 },
    trait: "paladinGuard",
    hp: 240, atk: 50, def: 70, spd: 35, mp: 30,
    learn: [[1, "kabutowari"], [3, "sukara"], [6, "kabau"], [9, "behoimi"], [13, "tekkogiri"], [16, "onomatsuri"], [22, "musclepose"], [30, "ouenboost"], [40, "miracle"], [60, "paladinguard"], [99, "grandcross"]],
  },
  superstar: {
    name: "スーパースター", rank: "advanced", role: "補助が多く、回復もできる",
    parents: { martial: 20, gadabout: 20 },
    trait: "showtime",
    hp: 170, atk: 55, def: 35, spd: 75, mp: 32,
    learn: [[1, "rasenuchi"], [3, "dragonuchi"], [7, "dualcutter"], [11, "hassledance"], [14, "encore"], [20, "charismabarrier"]],
  },
  pirate: {
    name: "海賊", rank: "advanced", role: "敵の火力を落としながら殴る",
    parents: { warrior: 20, thief: 20 },
    trait: "pressure",
    hp: 210, atk: 62, def: 58, spd: 55, mp: 26,
    learn: [[1, "houkou"], [3, "daibougyo"], [5, "shinkuha"], [8, "tekkogiri"], [12, "onomatsuri"], [14, "warcry"], [20, "kaishinguard"], [40, "infinityedge"], [99, "maelstrom"]],
  },
};

const TRAITS = {
  anger: "ターン開始時、たまに自分のダメージが上がる",
  echo: "呪文がたまに2回連続で発動する",
  shadowbind: "攻撃したとき、たまに敵を休みにする",
  forcebreak: "攻撃したとき、たまに敵の属性の耐性を下げる",
  paladinGuard: "たまに仲間ひとりのダメージを全部引き受け、致死でもHP1で耐える",
  showtime: "特技を使ったとき、たまにランダムな良い効果が付く",
  pressure: "ダメージを受けたとき、たまに敵を威圧する",
};

const SKILLS = {
  attack: { name: "通常攻撃", kind: "skill", mp: 0, target: "one", effect: { power: 1 } },
  rengeki: { name: "連撃", kind: "skill", mp: 3, target: "one", effect: { power: 0.35, hits: 3, qte: true, miss: 0.1 } },
  breath: { name: "ひのいき", kind: "skill", mp: 0, target: "one", element: "breath", effect: { power: 1.25 } },
  breathAll: { name: "かえんのいき", kind: "skill", mp: 0, target: "all", element: "breath", effect: { power: 0.85 } },
  sweep: { name: "なぎ払い", kind: "skill", mp: 0, target: "all", effect: { power: 0.72 } },
  majingiri: { name: "まじんぎり", kind: "skill", mp: 6, target: "one", effect: { power: 1.6, qte: true } },
  bunmawashi: { name: "ぶんまわし", kind: "skill", mp: 8, target: "all", effect: { power: 0.9, qte: true } },
  kabutowari: { name: "かぶとわり", kind: "skill", mp: 4, target: "one", effect: { power: 0.8, qte: true, defDown: 0.3 } },
  seikenzuki: { name: "せいけんづき", kind: "skill", mp: 5, target: "one", effect: { power: 1.45, qte: true } },
  mawashigeri: { name: "まわしげり", kind: "skill", mp: 7, target: "all", effect: { power: 0.85, qte: true } },
  kiaitame: { name: "きあいため", kind: "skill", mp: 4, target: "self", effect: { nextPower: 0.7 } },
  mera: { name: "メラ", kind: "spell", mp: 3, target: "one", element: "fire", effect: { power: 1.1 } },
  hyado: { name: "ヒャド", kind: "spell", mp: 3, target: "one", element: "ice", effect: { power: 1.1 } },
  io: { name: "イオ", kind: "spell", mp: 8, target: "all", element: "blast", effect: { power: 0.95 } },
  rahoru: { name: "ラリホー", kind: "spell", mp: 4, target: "one", effect: { sleep: 0.7 } },
  hoimi: { name: "ホイミ", kind: "spell", mp: 3, target: "ally", effect: { heal: 0.18 } },
  sukara: { name: "スカラ", kind: "spell", mp: 4, target: "ally", effect: { defUp: 0.4, rounds: 3 } },
  kiarii: { name: "キアリー", kind: "spell", mp: 3, target: "ally", effect: { cure: "poison" } },
  zaoraru: { name: "ザオラル", kind: "spell", mp: 10, target: "ally", effect: { revive: 0.5, heal: 0.3 } },
  nusumu: { name: "ぬすむ", kind: "skill", mp: 0, target: "one", effect: { steal: true } },
  shinobiashi: { name: "しのびあし", kind: "skill", mp: 3, target: "self", effect: { skipEnemyFirst: 0.7 } },
  dokubari: { name: "どくばり", kind: "skill", mp: 4, target: "one", effect: { power: 0.7, qte: true, poison: 0.45 } },
  pafupafu: { name: "ぱふぱふ", kind: "skill", mp: 3, target: "one", effect: { charm: 0.6 } },
  fushiginaodori: { name: "ふしぎなおどり", kind: "skill", mp: 4, target: "one", effect: { mpDrain: 0.25 } },
  parupunte: { name: "パルプンテ", kind: "skill", mp: 8, target: "special", effect: { random: true } },
  yaibakudaki: { name: "やいばくだき", kind: "skill", mp: 5, target: "one", effect: { power: 1.2, qte: true, atkDown: 0.4 } },
  samidaregiri: { name: "さみだれ斬り", kind: "skill", mp: 8, target: "random", effect: { power: 0.55, hits: 4, qte: true } },
  sutemi: { name: "すてみ", kind: "skill", mp: 4, target: "self", effect: { atkUp: 0.8, takenUp: 0.3, rounds: 3 } },
  hayabusagiri: { name: "はやぶさ斬り", kind: "skill", mp: 6, target: "one", effect: { power: 0.75, hits: 2, qte: true } },
  kiaidame: { name: "気合い溜め", kind: "skill", mp: 4, target: "self", effect: { powerTurn: 2 } },
  tensionboost: { name: "テンションブースト", kind: "skill", mp: 10, target: "self", effect: { tension: 100, doubleNext: true } },
  gigaslash: { name: "ギガスラッシュ", kind: "skill", mp: 18, target: "all", element: "bolt", effect: { power: 1.25, qte: true, slash: true } },
  gigadein: { name: "ギガデイン", kind: "spell", mp: 32, target: "all", element: "bolt", effect: { power: 2.4 } },
  behoimi: { name: "ベホイミ", kind: "spell", mp: 8, target: "ally", effect: { heal: 0.36 } },
  merami: { name: "メラミ", kind: "spell", mp: 8, target: "one", element: "fire", effect: { power: 1.5 } },
  iora: { name: "イオラ", kind: "spell", mp: 14, target: "all", element: "blast", effect: { power: 1.25 } },
  dorukuma: { name: "ドルクマ", kind: "spell", mp: 6, target: "one", element: "dark", effect: { power: 1.3 } },
  rukanii: { name: "ルカニ", kind: "spell", mp: 4, target: "one", effect: { defDown: 0.4, rounds: 3 } },
  bomios: { name: "ボミオス", kind: "spell", mp: 4, target: "one", effect: { atkDown: 0.35, rounds: 3 } },
  dokukiri: { name: "どくぎり", kind: "skill", mp: 0, target: "one", effect: { power: 0.75, poison: 0.65 } },
  explode: { name: "爆発", kind: "skill", mp: 0, target: "one", effect: { power: 1.35, explode: true } },
  flee: { name: "にげる", kind: "skill", mp: 0, target: "self", effect: { flee: true } },
  maryokukakusei: { name: "魔力かくせい", kind: "spell", mp: 8, target: "self", effect: { spellPower: 0.8, rounds: 3 } },
  viperfang: { name: "ヴァイパーファング", kind: "skill", mp: 6, target: "one", effect: { power: 1.1, qte: true, poison: 0.7 } },
  tigerclaw: { name: "タイガークロー", kind: "skill", mp: 7, target: "one", effect: { power: 0.55, hits: 3, qte: true } },
  dualcutter: { name: "デュアルカッター", kind: "skill", mp: 10, target: "all", effect: { power: 0.5, hits: 2, qte: true } },
  fubaha: { name: "フバーハ", kind: "spell", mp: 5, target: "allies", effect: { breathCut: 0.5, rounds: 3 } },
  nemuriuchi: { name: "ねむり打ち", kind: "skill", mp: 8, target: "all", effect: { power: 0.7, qte: true, sleep: 0.4 } },
  kaengiri: { name: "かえん斬り", kind: "skill", mp: 5, target: "one", element: "fire", effect: { power: 1.15, qte: true } },
  mahyadogiri: { name: "マヒャド斬り", kind: "skill", mp: 6, target: "one", element: "ice", effect: { power: 1.25, qte: true } },
  inazumagiri: { name: "いなずま斬り", kind: "skill", mp: 6, target: "one", element: "bolt", effect: { power: 1.25, qte: true } },
  begirama: { name: "ベギラマ", kind: "spell", mp: 8, target: "all", element: "fire", effect: { power: 0.8 } },
  baishion: { name: "バイシオン", kind: "spell", mp: 6, target: "ally", effect: { atkUp: 0.4, rounds: 3 } },
  mppasser: { name: "MPパサー", kind: "skill", mp: 0, target: "ally", effect: { giveMp: 0.3 } },
  kabau: { name: "かばう", kind: "skill", mp: 3, target: "ally", effect: { cover: true } },
  musclepose: { name: "マッスルポーズ", kind: "skill", mp: 6, target: "self", effect: { defUp: 0.4, heal: 0.12, rounds: 3 } },
  encore: { name: "アンコール", kind: "skill", mp: 8, target: "ally", effect: { extraTurn: true } },
  hassledance: { name: "ハッスルダンス", kind: "skill", mp: 6, target: "allies", effect: { heal: 0.12 } },
  charismabarrier: { name: "カリスマバリア", kind: "skill", mp: 6, target: "allies", effect: { physicalCut: 0.5, charges: 1 } },
  rasenuchi: { name: "らせん打ち", kind: "skill", mp: 6, target: "one", effect: { power: 1.15, qte: true, confuse: 0.4 } },
  houkou: { name: "咆哮", kind: "skill", mp: 5, target: "all", effect: { roar: true } },
  daibougyo: { name: "だいぼうぎょ", kind: "skill", mp: 4, target: "self", effect: { cut: 0.9, charges: 1 } },
  onomatsuri: { name: "オノまつり", kind: "skill", mp: 8, target: "all", effect: { power: 0.95, qte: true } },
  warcry: { name: "ウォークライ", kind: "skill", mp: 4, target: "self", effect: { atkUp: 0.45, rounds: 3 } },
  ukenagashi: { name: "うけながし", kind: "skill", mp: 2, target: "self", effect: { cut: 0.55, guardName: "受け" } },
  shippu: { name: "しっぷう突き", kind: "skill", mp: 3, target: "one", effect: { power: 1.25, qte: true } },
  moroha: { name: "もろば斬り", kind: "skill", mp: 5, target: "one", effect: { power: 1.9, qte: true, selfRatio: 0.12 } },
  kyusho: { name: "きゅうしょ突き", kind: "skill", mp: 6, target: "one", effect: { power: 1.05, qte: true, death: 0.22 } },
  nioudachi: { name: "におうだち", kind: "skill", mp: 6, target: "self", effect: { coverAll: true } },
  tsuruginomai: { name: "つるぎのまい", kind: "skill", mp: 10, target: "random", effect: { power: 0.4, hits: 5, qte: true } },
  metalgiri: { name: "メタル斬り", kind: "skill", mp: 4, target: "one", effect: { power: 1, qte: true, metalHit: 8 } },
  samidareken: { name: "さみだれけん", kind: "skill", mp: 10, target: "all", effect: { power: 0.75, qte: true } },
  konshin: { name: "渾身斬り", kind: "skill", mp: 12, target: "one", effect: { power: 2.1, qte: true } },
  ashibarai: { name: "足ばらい", kind: "skill", mp: 3, target: "one", effect: { power: 0.8, qte: true, spdDown: 0.25 } },
  tobihiza: { name: "とびひざげり", kind: "skill", mp: 4, target: "one", effect: { power: 1.2, qte: true } },
  hitchuken: { name: "必中拳", kind: "skill", mp: 5, target: "one", effect: { power: 1.3, qte: true } },
  kamaitachi: { name: "かまいたち", kind: "skill", mp: 5, target: "one", effect: { power: 1.35, qte: true } },
  sutemiuchi: { name: "すてみ", kind: "skill", mp: 4, target: "one", effect: { power: 1.65, qte: true, takenUp: 0.25 } },
  bakuretsu: { name: "ばくれつけん", kind: "skill", mp: 10, target: "random", effect: { power: 0.45, hits: 4, qte: true } },
  itetsuku: { name: "いてつく波紋", kind: "skill", mp: 6, target: "one", effect: { power: 0.4, dispel: true } },
  kaishinhitchu: { name: "会心必中", kind: "skill", mp: 12, target: "one", effect: { power: 1.4, qte: true, sureCrit: true } },
  gira: { name: "ギラ", kind: "spell", mp: 4, target: "all", element: "fire", effect: { power: 0.55 } },
  sukuruto: { name: "スクルト", kind: "spell", mp: 6, target: "allies", effect: { defUp: 0.25, rounds: 3 } },
  bomiosSlow: { name: "ボミオス", kind: "spell", mp: 4, target: "all", effect: { spdDown: 0.3, rounds: 3 } },
  mahotra: { name: "マホトラ", kind: "spell", mp: 0, target: "one", effect: { mpDrain: 0.3 } },
  hyadaruko: { name: "ヒャダルコ", kind: "spell", mp: 8, target: "all", element: "ice", effect: { power: 0.9 } },
  baikirt: { name: "バイキルト", kind: "spell", mp: 8, target: "ally", effect: { atkUp: 0.55, rounds: 3 } },
  hyadain: { name: "ヒャダイン", kind: "spell", mp: 12, target: "all", element: "ice", effect: { power: 1.15 } },
  medapani: { name: "メダパニ", kind: "spell", mp: 5, target: "one", effect: { confuse: 0.65 } },
  begiragon: { name: "ベギラゴン", kind: "spell", mp: 14, target: "all", element: "fire", effect: { power: 1.15 } },
  merazoma: { name: "メラゾーマ", kind: "spell", mp: 16, target: "one", element: "fire", effect: { power: 2.1 } },
  mahyado: { name: "マヒャド", kind: "spell", mp: 12, target: "all", element: "ice", effect: { power: 1.25 } },
  nifram: { name: "ニフラム", kind: "spell", mp: 4, target: "all", effect: { death: 0.28 } },
  manusa: { name: "マヌーサ", kind: "spell", mp: 4, target: "all", effect: { blind: 0.4, rounds: 3 } },
  bagi: { name: "バギ", kind: "spell", mp: 4, target: "all", effect: { power: 0.6 } },
  rahoruAll: { name: "ラリホー", kind: "spell", mp: 5, target: "all", effect: { sleep: 0.55 } },
  piorimu: { name: "ピオリム", kind: "spell", mp: 4, target: "allies", effect: { spdUp: 0.25, rounds: 3 } },
  zameha: { name: "ザメハ", kind: "spell", mp: 3, target: "allies", effect: { wake: true } },
  zao: { name: "ザオ", kind: "spell", mp: 6, target: "ally", effect: { revive: 0.4, heal: 0.08 } },
  mahotoon: { name: "マホトーン", kind: "spell", mp: 5, target: "all", effect: { silence: 0.7, rounds: 3 } },
  rukanan: { name: "ルカナン", kind: "spell", mp: 6, target: "all", effect: { defDown: 0.25, rounds: 3 } },
  magicbarrier: { name: "マジックバリア", kind: "spell", mp: 6, target: "allies", effect: { spellCut: 0.4, rounds: 3 } },
  bagima: { name: "バギマ", kind: "spell", mp: 8, target: "all", effect: { power: 0.95 } },
  bashirura: { name: "バシルーラ", kind: "spell", mp: 8, target: "one", effect: { power: 0.5, death: 0.45 } },
  zaki: { name: "ザキ", kind: "spell", mp: 8, target: "one", effect: { death: 0.6 } },
  behoimu: { name: "ベホイム", kind: "spell", mp: 12, target: "ally", effect: { heal: 0.55 } },
  zaraki: { name: "ザラキ", kind: "spell", mp: 12, target: "all", effect: { death: 0.32 } },
  bagikurosu: { name: "バギクロス", kind: "spell", mp: 14, target: "all", effect: { power: 1.3 } },
  behoma: { name: "ベホマ", kind: "spell", mp: 16, target: "ally", effect: { fullHeal: true } },
  megante: { name: "メガンテ", kind: "spell", mp: 1, target: "all", effect: { power: 2.2, explode: true } },
  behomara: { name: "ベホマラー", kind: "spell", mp: 18, target: "allies", effect: { heal: 0.28 } },
  zaoriku: { name: "ザオリク", kind: "spell", mp: 20, target: "ally", effect: { revive: 1, heal: 0.4 } },
  sunakemuri: { name: "すなけむり", kind: "skill", mp: 2, target: "all", effect: { blind: 0.35, rounds: 3 } },
  nemuriattack: { name: "ねむりアタック", kind: "skill", mp: 3, target: "one", effect: { power: 0.75, sleep: 0.55 } },
  wingblow: { name: "ウィングブロウ", kind: "skill", mp: 4, target: "one", effect: { power: 1.2, qte: true } },
  shibire: { name: "しびれアタック", kind: "skill", mp: 4, target: "one", effect: { power: 0.75, paralyze: 0.45 } },
  assassinatk: { name: "アサシンアタック", kind: "skill", mp: 6, target: "one", effect: { power: 1, death: 0.25 } },
  hypnos: { name: "ヒュプノスハント", kind: "skill", mp: 6, target: "one", effect: { power: 0.9, vsStatus: 4 } },
  oikaze: { name: "おいかぜ", kind: "skill", mp: 4, target: "self", effect: { breathCut: 0.8, rounds: 1 } },
  tsukkomi: { name: "ツッコミ", kind: "skill", mp: 3, target: "ally", effect: { cleanse: true } },
  megazaru: { name: "メガザルダンス", kind: "skill", mp: 0, target: "allies", effect: { fullHeal: true, explode: true } },
  bukimi: { name: "ぶきみなひかり", kind: "skill", mp: 5, target: "one", effect: { mark: "耐性", rounds: 3 } },
  ouen: { name: "おうえん", kind: "skill", mp: 5, target: "ally", effect: { atkUp: 0.7, rounds: 1 } },
  moonsault: { name: "ムーンサルト", kind: "skill", mp: 10, target: "all", effect: { power: 0.7, fewBonus: 2.2, qte: true } },
  ionazun: { name: "イオナズン", kind: "spell", mp: 22, target: "all", element: "blast", effect: { power: 1.7 } },
  iogrande: { name: "イオグランデ", kind: "spell", mp: 32, target: "all", element: "blast", effect: { power: 2.3 } },
  dorumadon: { name: "ドルマドン", kind: "spell", mp: 28, target: "one", element: "dark", effect: { power: 5.2, spellDown: 0.5, rounds: 4 } },
  manuha: { name: "マヌーハ", kind: "spell", mp: 3, target: "ally", effect: { cureBlind: true } },
  futou: { name: "不撓不屈", kind: "skill", mp: 4, target: "self", effect: { cleanse: true } },
  shintou: { name: "しんとうめっきゃく", kind: "skill", mp: 6, target: "self", effect: { breathCut: 0.6, rounds: 3 } },
  jibarika: { name: "ジバリカ", kind: "spell", mp: 4, target: "one", effect: { power: 0.7 } },
  choubun: { name: "超ぶんまわし", kind: "skill", mp: 12, target: "all", effect: { power: 1.35, qte: true } },
  tekkogiri: { name: "鉄甲斬", kind: "skill", mp: 8, target: "one", effect: { power: 1.7, qte: true, defDown: 0.3 } },
  dragonuchi: { name: "ドラゴン打ち", kind: "skill", mp: 6, target: "one", effect: { power: 1.35, qte: true } },
  shinkuha: { name: "しんくうは", kind: "skill", mp: 6, target: "all", effect: { power: 0.9, qte: true } },
  kaishinguard: { name: "会心ガード", kind: "skill", mp: 6, target: "self", effect: { cut: 0.7, guardName: "会心" } },
  shinrabansho: { name: "森羅万象斬", kind: "skill", mp: 16, target: "one", effect: { power: 2.4, qte: true } },
  meragaia: { name: "メラガイアー", kind: "spell", mp: 24, target: "one", element: "fire", effect: { power: 2.8 } },
  medoroa: { name: "メドローア", kind: "spell", mp: 36, target: "one", element: "bolt", effect: { power: 3.2 } },
  gigacross: { name: "ギガクロス", kind: "skill", mp: 22, target: "all", effect: { power: 1.35, qte: true, allElement: true, forceBreak: true } },
  ouenboost: { name: "応援", kind: "skill", mp: 6, target: "ally", effect: { powerTurn: 2 } },
  miracle: { name: "ミラクルインパクト", kind: "skill", mp: 16, target: "one", effect: { power: 1.7, qte: true, partyHeal: 0.12 } },
  godbakuretsu: { name: "ゴットばくれつけん", kind: "skill", mp: 18, target: "random", effect: { power: 0.5, hits: 10, qte: true } },
  kingtime: { name: "キングタイム", kind: "skill", mp: 0, target: "self", effect: { passive: "first" } },
  nusumu2: { name: "盗む", kind: "skill", mp: 0, target: "self", effect: { passive: "drop" } },
  chemibomb: { name: "ケミカルボンバー", kind: "skill", mp: 16, target: "all", effect: { power: 0.85, qte: true, trip: 1, paralyze: 1, poison: 1 } },
  infinityedge: { name: "インフィニティエッジ", kind: "skill", mp: 18, target: "all", effect: { power: 0.8, hits: 3, qte: true, superCrit: true } },
  maelstrom: { name: "メイルストロム", kind: "skill", mp: 24, target: "random", effect: { power: 1.5, hits: 3, qte: true, apex: true, elements: ["wind", "water", "ice"], intimidate: 0.3, rounds: 3 } },
  zenshin: { name: "全身全霊斬り", kind: "skill", mp: 24, target: "one", effect: { power: 5, qte: true, apex: true, ignoreDef: true } },
  burstrainbow: { name: "バーストレインボウ", kind: "skill", mp: 32, target: "one", effect: { power: 4, qte: true, apex: true, allElement: true, allResistDown: true, superWeak: true, ignoreResist: true } },
  madante: { name: "マダンテ", kind: "spell", mp: 0, target: "one", effect: { mpBurst: 20, apex: true } },
  paladinguard: { name: "パラディンガード", kind: "skill", mp: 10, target: "self", effect: { ward: true, wardCut: 0.5, rounds: 3 } },
  grandcross: { name: "グランドクロス", kind: "skill", mp: 30, target: "one", effect: { grandCross: 10, qte: true, apex: true } },
  pantherrush: { name: "パンサーラッシュ", kind: "skill", mp: 22, target: "random", effect: { power: 1, hits: 4, qte: true, apex: true, partyCrit: 0.4 } },
  kamikudaku: { name: "かみくだく", kind: "skill", mp: 0, target: "one", effect: { power: 2.8 } },
  otakebi: { name: "おたけび", kind: "skill", mp: 0, target: "all", effect: { paralyze: 0.65 } },
  hageshii: { name: "はげしいほのお", kind: "skill", mp: 0, target: "all", element: "breath", effect: { power: 1.45 } },
  shakunetsu: { name: "しゃくねつのほのお", kind: "skill", mp: 0, target: "all", element: "breath", effect: { power: 1.9 } },
  mahokanta: { name: "マホカンタ", kind: "spell", mp: 4, target: "self", effect: { spellReflect: 2 } },
  itetsukuhadou: { name: "いてつくはどう", kind: "spell", mp: 8, target: "all", effect: { dispel: true } },
  maryokuFocus: { name: "魔力集中", kind: "spell", mp: 8, target: "self", effect: { spellPower: 0.8, rounds: 3 } },
};

const LEVEL_CAP = 99;

function jobSkills(jobId, level) {
  const job = JOBS[jobId];
  if (!job) return [];
  const lv = level || 1;
  const ids = (job.learn || job.skills || []).map((item) => (Array.isArray(item) ? item : [1, item])).filter(([need]) => need <= lv).map(([, id]) => id);
  return ["attack", ...ids].filter((id) => SKILLS[id]).map((id) => ({ id, ...SKILLS[id] }));
}

function nextSkill(jobId, level) {
  const job = JOBS[jobId];
  if (!job || !job.learn) return null;
  const next = job.learn.find(([need]) => need > (level || 1));
  if (!next || next[0] > LEVEL_CAP || !SKILLS[next[1]]) return null;
  return { level: next[0], name: SKILLS[next[1]].name };
}

function meetsParents(jobLevels, table) {
  const entries = Object.entries(table || {});
  return entries.length > 0 && entries.every(([parent, need]) => (jobLevels[parent] || 0) >= need);
}

function promotionReady(jobLevels, jobId) {
  const job = JOBS[jobId];
  if (!job || job.rank !== "advanced") return false;
  return meetsParents(jobLevels, job.parents) || meetsParents(jobLevels, job.alt);
}

function availableJobs(jobLevels) {
  return Object.keys(JOBS).filter((id) => JOBS[id].rank === "basic" || promotionReady(jobLevels, id));
}

const BLADE = ["warrior", "battlemaster", "magicKnight", "paladin", "pirate"];
const CLAW = ["martial", "ranger", "superstar", "battlemaster"];
const KNIFE = ["thief", "ranger", "pirate", "gadabout"];
const STAFF = ["mage", "priest", "sage", "magicKnight"];
const FAN = ["gadabout", "superstar", "sage"];
const HEAVY = ["warrior", "battlemaster", "paladin", "pirate", "magicKnight"];
const ROBE = ["mage", "priest", "sage", "magicKnight", "superstar", "gadabout"];
const LIGHT = ["thief", "ranger", "gadabout", "superstar", "martial"];

const WEAPONS = {
  stick: { name: "ひのきのぼう", atk: 5, price: 80, unlock: null, jobs: [...BLADE, ...CLAW] },
  knife: { name: "ブロンズナイフ", atk: 8, price: 100, unlock: null, jobs: KNIFE },
  staff: { name: "まどうしのつえ", atk: 7, price: 100, unlock: null, jobs: STAFF },
  clothes: { name: "ぬののふく", def: 6, price: 60, unlock: null, slot: "armor", jobs: null },
  leather: { name: "かわのよろい", def: 11, price: 140, unlock: null, slot: "armor", jobs: null },
  copper: { name: "どうのつるぎ", atk: 14, price: 280, unlock: "alefgard", jobs: BLADE, pierce: 0.5, pierceChance: 0.3, special: "30%で守備を半減" },
  claw: { name: "てつのツメ", atk: 12, price: 260, unlock: "alefgard", jobs: CLAW, paralyze: 0.25, special: "攻撃がときどきしびれ" },
  fan: { name: "おどりこの扇", atk: 16, price: 240, unlock: "alefgard", jobs: FAN, charm: 0.2, special: "攻撃がときどき魅了" },
  ironArmor: { name: "てつのよろい", def: 16, price: 320, unlock: "alefgard", slot: "armor", jobs: HEAVY, physCut: 0.1, special: "受ける物理ダメージ-10%" },
  poisonClaw: { name: "どくのツメ", atk: 22, price: 460, unlock: "aliahan", jobs: CLAW, poison: 0.4, special: "攻撃がときどき毒" },
  robe: { name: "まほうのローブ", def: 8, mp: 10, price: 400, unlock: "aliahan", slot: "armor", jobs: ROBE, spellCut: 0.2, special: "受ける呪文-20%" },
  steel: { name: "はがねのつるぎ", atk: 26, price: 620, unlock: "romaria", jobs: BLADE, pierce: 0.35, pierceChance: 1, special: "守備の35%を無視" },
  evade: { name: "みかわしのふく", def: 12, spd: 10, price: 540, unlock: "romaria", slot: "armor", jobs: LIGHT, dodge: 0.12, special: "12%で物理をかわす" },
  assassin: { name: "アサシンダガー", atk: 28, price: 780, unlock: "kazave", jobs: KNIFE, crit: 0.1, special: "会心+10%" },
  thunder: { name: "いかずちのつえ", atk: 24, price: 860, unlock: "isis", jobs: STAFF, spell: 0.2, special: "呪文の威力+20%" },
  shell: { name: "みずのはごろも", def: 16, mp: 16, price: 800, unlock: "isis", slot: "armor", jobs: ROBE, breathCut: 0.3, special: "息ダメージ-30%" },
  starFan: { name: "スターファン", atk: 30, price: 1100, unlock: "porta", jobs: FAN, spell: 0.15, charm: 0.15, special: "呪文+15%。ときどき魅了" },
  magicArmor: { name: "まほうのよろい", def: 24, mp: 8, price: 1200, unlock: "porta", slot: "armor", jobs: [...HEAVY, ...ROBE], spellCut: 0.35, special: "受ける呪文-35%" },
  fireSword: { name: "ほのおのつるぎ", atk: 38, price: 1500, unlock: "baharata", jobs: BLADE, element: "fire", special: "攻撃が炎属性" },
  dragonClaw: { name: "りゅうのツメ", atk: 40, price: 1700, unlock: "dharma", jobs: CLAW, crit: 0.08, dragon: true, special: "会心+8%。ドラゴンに強い" },
  steelArmor: { name: "はがねのよろい", def: 32, price: 1600, unlock: "dharma", slot: "armor", jobs: HEAVY, physCut: 0.15, special: "受ける物理ダメージ-15%" },
  holy: { name: "せいなるつえ", atk: 36, price: 2000, unlock: "jipang", jobs: STAFF, drain: 0.15, special: "与えたダメージの15%を回復" },
  dragonArmor: { name: "りゅうのよろい", def: 44, price: 2600, unlock: "necrogond", slot: "armor", jobs: HEAVY, breathCut: 0.45, regen: 0.05, special: "息-45%。ラウンド終わりにHP5%回復" },
  king: { name: "王者のつるぎ", atk: 54, price: 3400, unlock: "baramos", jobs: BLADE, crit: 0.15, special: "会心+15%" },
  dawnDagger: {
    name: "誕生と終焉", atk: 132, price: 0, unlock: null,
    jobs: ["mage", "priest", "sage", "magicKnight"],
    partyHealOnHit: 0.2, levelDown: true,
    special: "与えたダメージの20%で味方全員を回復。当てるたび相手の攻撃と守備が5%下がり、5回まで",
  },
  starless: {
    name: "星なき夜", atk: 160, price: 0, unlock: null,
    jobs: ["warrior", "martial", "thief", "gadabout", "battlemaster", "ranger", "paladin", "superstar", "pirate"],
    overkill: true,
    special: "倒しきった余ったダメージを、ほかの敵に与える",
  },
  galaxia: {
    name: "ギャラクシア", atk: 148, price: 0, unlock: null, jobs: BLADE,
    crit: 0.12, pierce: 0.35, pierceChance: 1,
    special: "会心+12%。守備の35%を無視。ポップスター討伐のレアドロップ",
  },
  popStarHammer: {
    name: "星のつち", atk: 142, price: 0, unlock: null,
    jobs: ["warrior", "battlemaster", "paladin", "martial", "pirate"],
    crit: 0.1, dragon: true,
    special: "会心+10%。ドラゴンに強い。星のかけらで工房製作",
  },
};

function shopOpen(cleared, item) {
  return !item.unlock || (cleared || []).includes(item.unlock);
}

const RECIPES = [
  { id: "copper", materials: { iron: 2 }, gold: 180 },
  { id: "fan", materials: { cloth: 2 }, gold: 200 },
  { id: "poisonClaw", materials: { fang: 2 }, gold: 280 },
  { id: "robe", materials: { cloth: 2, wing: 1 }, gold: 240 },
  { id: "ironArmor", materials: { iron: 3 }, gold: 260 },
  { id: "evade", materials: { cloth: 2, wing: 1 }, gold: 360 },
  { id: "steel", materials: { iron: 3, fang: 1 }, gold: 420 },
  { id: "assassin", materials: { fang: 2, cloth: 1 }, gold: 480 },
  { id: "thunder", materials: { jewel: 1, wing: 2 }, gold: 640 },
  { id: "shell", materials: { shell: 3 }, gold: 520 },
  { id: "starFan", materials: { silk: 2, jewel: 1 }, gold: 700 },
  { id: "magicArmor", materials: { jewel: 1, cloth: 2 }, gold: 760 },
  { id: "fireSword", materials: { scale: 2, iron: 2 }, gold: 900 },
  { id: "dragonClaw", materials: { scale: 2, fang: 1 }, gold: 920 },
  { id: "holy", materials: { charm: 2, jewel: 1 }, gold: 1100 },
  { id: "steelArmor", materials: { ore: 3 }, gold: 980 },
  { id: "dragonArmor", materials: { scale: 3, ore: 1 }, gold: 1600 },
  { id: "king", materials: { demon: 2, scale: 2, jewel: 1 }, gold: 1800 },
  { id: "popStarHammer", materials: { popStar: 8, scale: 2, ore: 2 }, gold: 2800 },
];

const DQ_JOB = {
  勇: ["warrior", "battlemaster", "paladin"],
  戦: ["warrior", "battlemaster", "paladin", "pirate", "magicKnight"],
  武: ["martial", "ranger", "battlemaster", "superstar"],
  魔: ["mage", "sage", "magicKnight"],
  僧: ["priest", "sage", "paladin"],
  盗: ["thief", "ranger", "pirate"],
  商: ["gadabout"],
  遊: ["gadabout", "superstar"],
  賢: ["sage"],
  物: ["martial", "ranger"],
};

function dqJobs(text) {
  if (!text || text.startsWith("全")) return null;
  const set = new Set();
  for (const ch of text) (DQ_JOB[ch] || []).forEach((id) => set.add(id));
  return [...set];
}

function dqBand(stat) {
  const steps = ["alefgard", "aliahan", "romaria", "kazave", "isis", "porta", "baharata", "dharma", "jipang", "necrogond", "baramos", "zoma"];
  const cuts = [12, 24, 36, 48, 60, 75, 90, 105, 120, 140, 160];
  const index = cuts.findIndex((cut) => stat < cut);
  return steps[index < 0 ? steps.length - 1 : index];
}

// 原作の順位は残す。序盤はひのきのぼう付近、終盤は王者のつるぎを少し超え、攻撃123以上と守備112以上だけ跳ねる。
function scaleWeapon(stat) {
  if (stat >= 123) return Math.round(92 + ((stat - 123) / (206 - 123)) * 36);
  return Math.round(6 + ((stat - 5) / (122 - 5)) * 58);
}

function scaleArmor(stat) {
  if (stat >= 112) return Math.round(58 + ((stat - 112) / (147 - 112)) * 22);
  return Math.round(8 + ((stat - 9) / (110 - 9)) * 38);
}

function dqMats(stat) {
  if (stat >= 140) return { orb: 1, demon: 3, scale: 4, jewel: 3, ore: 4 };
  if (stat >= 110) return { demon: 2, scale: 3, jewel: 2, ore: 3, silk: 2 };
  if (stat >= 80) return { scale: 2, jewel: 2, ore: 2, fang: 3 };
  if (stat >= 50) return { jewel: 1, ore: 2, fang: 2, iron: 3 };
  return { iron: 2, cloth: 2, fang: 1 };
}

// HD-2Dの攻撃・守備と効能。店にあるものはゴールド、それ以外は工房。盾・兜・装飾品の枠はない。
const DQ_GEAR = [
  ["club", "こんぼう", 5, "w", "勇戦武僧商遊賢物", 1, {}, ""],
  ["poisonNeedle", "どくばり", 10, "w", "魔盗", 1, { death: 0.35 }, "急所に当たると即死"],
  ["boomerang", "ブーメラン", 11, "w", "勇魔盗商遊物", 0, { group: true }, "敵全体に攻撃"],
  ["holyKnifeW", "せいなるナイフ", 12, "w", "全", 1, {}, ""],
  ["sickle", "くさりがま", 16, "w", "勇戦武僧盗商遊賢", 1, {}, ""],
  ["cloudStaff", "あまぐものつえ", 16, "w", "魔僧賢", 0, { grant: "mahotoon" }, "マホトーンを唱える"],
  ["thornWhip", "とげのむち", 19, "w", "勇魔盗遊賢物", 1, { group: true }, "敵全体に攻撃"],
  ["bladeBoomerang", "やいばのブーメラン", 24, "w", "勇魔盗商遊物", 0, { group: true }, "敵全体に攻撃"],
  ["ironSpear", "てつのやり", 24, "w", "勇戦武僧商遊賢物", 1, {}, ""],
  ["chainCross", "チェーンクロス", 27, "w", "盗商遊賢物", 1, { group: true }, "敵全体に攻撃"],
  ["sleepStaff", "ねむりのつえ", 29, "w", "魔僧賢", 0, { grant: "rahoru" }, "ラリホーを唱える"],
  ["sealStaff", "まふうじのつえ", 31, "w", "魔僧賢", 1, { grant: "mahotoon" }, "マホトーンを唱える"],
  ["steelNeedle", "はがねのはりせん", 31, "w", "商遊", 1, {}, ""],
  ["beastWhip", "ビーストウィップ", 34, "w", "遊物", 1, { group: true }, "敵全体に攻撃"],
  ["holyLance", "ホーリーランス", 34, "w", "僧賢物", 1, { undead: true }, "ゾンビ系に強い"],
  ["ironAxe", "てつのオノ", 37, "w", "勇戦武商遊", 0, {}, ""],
  ["morningStar", "モーニングスター", 38, "w", "僧賢物", 1, {}, ""],
  ["runeStaff", "ルーンスタッフ", 39, "w", "魔僧賢", 0, {}, ""],
  ["steelWhip", "はがねのむち", 40, "w", "勇盗遊賢物", 1, { group: true }, "敵全体に攻撃"],
  ["lifeStaff", "ふっかつのつえ", 40, "w", "僧賢", 0, { grant: "zaoraru" }, "ザオラルを唱える"],
  ["judgeStaff", "さばきのつえ", 42, "w", "僧賢", 1, { grant: "bagi" }, "バギを唱える"],
  ["powerKnuckle", "パワーナックル", 43, "w", "武盗", 0, {}, ""],
  ["windBoomerang", "風のブーメラン", 46, "w", "勇魔盗遊物", 1, { group: true }, "敵全体に攻撃"],
  ["bigScissors", "おおばさみ", 48, "w", "戦", 1, {}, ""],
  ["rippleStaff", "さざなみのつえ", 48, "w", "魔僧賢", 0, { grant: "mahokanta" }, "マホカンタを唱える"],
  ["twinSwallow", "ツインスワロー", 52, "w", "勇魔盗遊物", 0, { group: true }, "敵全体に攻撃"],
  ["falconSword", "はやぶさのけん", 55, "w", "勇盗商賢", 1, { hits: 2 }, "通常攻撃が2回"],
  ["battleFork", "バトルフォーク", 56, "w", "戦商物", 1, {}, ""],
  ["bigHammer", "おおかなづち", 61, "w", "戦", 1, {}, ""],
  ["dragonTail", "ドラゴンテイル", 62, "w", "勇戦盗遊賢物", 1, { group: true, dragon: true }, "敵全体。ドラゴンに強い"],
  ["goldClaw", "黄金の爪", 62, "w", "武", 0, {}, ""],
  ["flameBoomerang", "炎のブーメラン", 65, "w", "勇魔盗商遊物", 0, { group: true, element: "fire" }, "敵全体。攻撃が炎属性"],
  ["battleAxe", "バトルアックス", 66, "w", "戦", 1, {}, ""],
  ["zombieKiller", "ゾンビキラー", 68, "w", "勇戦僧商賢", 0, { undead: true }, "ゾンビ系に強い"],
  ["kusanagi", "くさなぎのけん", 70, "w", "勇戦賢", 0, { grant: "rukanan" }, "ルカナンを唱える"],
  ["gaiaSword", "ガイアのつるぎ", 74, "w", "勇戦", 0, {}, ""],
  ["sandSpear", "さじんのやり", 76, "w", "戦商物", 1, { grant: "manusa" }, "マヌーサを唱える"],
  ["busterWhip", "バスターウィップ", 77, "w", "戦物", 0, { group: true }, "敵全体に攻撃"],
  ["charmSword", "ゆうわくのけん", 79, "w", "戦盗商遊", 0, { charm: 0.25 }, "攻撃がときどき魅了"],
  ["flameClaw", "ほのおのツメ", 80, "w", "武物", 1, { grant: "merami" }, "メラミを唱える"],
  ["warHammer", "ウォーハンマー", 81, "w", "戦", 1, {}, ""],
  ["abacus", "まほうのそろばん", 82, "w", "商", 1, {}, ""],
  ["sageStaffDq", "けんじゃのつえ", 84, "w", "魔僧賢", 1, { grant: "behoimi" }, "ベホイミを唱える"],
  ["dragonKiller", "ドラゴンキラー", 87, "w", "勇戦", 1, { dragon: true }, "ドラゴンに強い"],
  ["boltSwordDq", "いなずまのけん", 90, "w", "勇戦", 0, { grant: "iora" }, "イオラを唱える"],
  ["empressWhip", "女帝のムチ", 94, "w", "魔盗商遊物", 0, { group: true }, "敵全体に攻撃"],
  ["dragonCrow", "ドラゴンクロウ", 95, "w", "武盗商物", 0, { dragon: true }, "ドラゴンに強い"],
  ["powerStaff", "りりょくのつえ", 96, "w", "魔僧賢", 1, { mpOnHit: 3 }, "通常攻撃でMPを3使う"],
  ["demonSpear", "デーモンスピア", 96, "w", "戦僧商賢物", 0, { death: 0.2 }, "ときどき即死"],
  ["blizzardSword", "ふぶきのつるぎ", 101, "w", "勇戦", 1, { grant: "hyadaruko" }, "ヒャダルコを唱える"],
  ["metalWing", "メタルウィング", 102, "w", "勇魔盗遊物", 0, { group: true, metalHit: 8 }, "敵全体。メタルにダメージ"],
  ["beastClaw", "まじゅうのツメ", 107, "w", "武盗物", 0, { beast: true }, "獣系に強い"],
  ["thunderSword", "らいじんのけん", 107, "w", "勇戦", 0, { grant: "begiragon" }, "ベギラゴンを唱える"],
  ["demonAxe", "まじんのオノ", 110, "w", "戦", 0, { crit: 0.2, miss: 0.25 }, "会心が出やすい。外れも多い"],
  ["bastardSword", "バスタードソード", 113, "w", "勇戦", 1, {}, ""],
  ["auroraStaff", "オーロラの杖", 115, "w", "魔賢", 0, { grant: "itetsukuhadou" }, "良い効果を打ち消す"],
  ["gringham", "グリンガムのムチ", 118, "w", "勇戦盗遊賢物", 0, { group: true }, "敵全体に攻撃"],
  ["justiceAbacus", "正義のそろばん", 122, "w", "商", 0, {}, ""],
  ["birdStaff", "神鳥の杖", 123, "w", "魔僧賢", 0, { grant: "merazoma" }, "メラゾーマを唱える"],
  ["moonRing", "はてんの月輪", 131, "w", "勇魔盗商遊物", 0, { group: true }, "敵全体に攻撃"],
  ["breakSword", "はかいのつるぎ", 135, "w", "勇戦", 0, { crit: 0.22, curse: 0.2 }, "呪われる。麻痺することがある。会心が出やすい"],
  ["ogreSpear", "きしんの魔槍", 139, "w", "戦商物", 0, {}, ""],
  ["kingSword", "王者の剣", 140, "w", "勇", 0, { grant: "bagikurosu" }, "バギクロスを唱える"],
  ["curseSword", "もろはのつるぎ", 148, "w", "勇戦", 0, { recoil: 0.25 }, "呪われる。与えたダメージの1/4が返る"],
  ["orichalcum", "オリハルコンのツメ", 150, "w", "武盗物", 0, {}, ""],
  ["breakBall", "はかいのてっきゅう", 155, "w", "勇戦武盗賢物", 0, { group: true }, "敵全体に攻撃"],
  ["kingAxe", "はおうのオノ", 162, "w", "戦物", 0, {}, ""],
  ["rubissSword", "ルビスの剣", 206, "w", "全", 0, { grant: "gigadein" }, "ギガデインを唱える"],
  ["traveler", "たびびとのふく", 9, "a", "勇戦魔僧盗商遊賢物", 1, {}, ""],
  ["gi", "けいこぎ", 10, "a", "武遊賢", 1, {}, ""],
  ["turtle", "カメのこうら", 15, "a", "魔商物", 1, {}, ""],
  ["shellArmor", "こうらのよろい", 17, "a", "勇戦僧商賢", 1, {}, ""],
  ["leatherCape", "レザーマント", 19, "a", "魔僧盗賢物", 1, {}, ""],
  ["chainMail", "くさりかたびら", 21, "a", "勇戦僧商賢", 1, {}, ""],
  ["giTop", "ぶとうぎ", 22, "a", "武賢", 1, {}, ""],
  ["ironApron", "てつのまえかけ", 25, "a", "商物", 1, {}, ""],
  ["loincloth", "かわのこしまき", 25, "a", "勇戦商遊物", 1, {}, ""],
  ["magicSkirt", "マジカルスカート", 29, "a", "全", 1, { spellCut: 0.25 }, "攻撃呪文のダメージを軽減"],
  ["blackSuit", "くろしょうぞく", 33, "a", "武盗", 1, { dodge: 0.1 }, "物理をかわしやすい"],
  ["furVest", "毛皮のベスト", 43, "a", "戦商物", 1, { fireCut: 0.3, iceCut: 0.3, breathCut: 0.3 }, "炎・吹雪を軽減"],
  ["loudClothes", "はでなふく", 45, "a", "遊", 1, {}, ""],
  ["wizardRobe", "まじないしの服", 46, "a", "魔遊賢", 1, { silenceResist: true }, "呪文封じに強い"],
  ["magicVestment", "まほうのほうい", 48, "a", "僧賢", 1, { spellCut: 0.3 }, "攻撃呪文のダメージを軽減"],
  ["wonderBolero", "ふしぎなボレロ", 50, "a", "戦武魔僧盗商遊賢", 0, { mpCut: 0.5 }, "呪文の消費MPが半分"],
  ["swiftVest", "はやてのベスト", 52, "a", "武盗商遊物", 1, { spd: 30 }, ""],
  ["partyDress", "パーティードレス", 52, "a", "盗遊", 1, {}, ""],
  ["niceSuit", "おしゃれなスーツ", 54, "a", "盗遊", 0, {}, ""],
  ["archmageRobe", "だいまどうローブ", 60, "a", "魔", 1, { silenceResist: true }, "呪文封じに強い"],
  ["angelRobe", "てんしのローブ", 63, "a", "魔僧賢", 1, { deathResist: true }, "即死に強い"],
  ["ninjaSuit", "しのびのふく", 64, "a", "武盗", 0, { dodge: 0.2 }, "物理をかわしやすい"],
  ["silverMail", "ぎんのむねあて", 66, "a", "戦物", 1, {}, ""],
  ["earthArmor", "だいちのよろい", 68, "a", "勇戦物", 0, {}, ""],
  ["magicApron", "まほうのまえかけ", 72, "a", "商物", 1, { spellCut: 0.3 }, "攻撃呪文のダメージを軽減"],
  ["dragonMail", "ドラゴンメイル", 80, "a", "勇戦物", 1, { fireCut: 0.35, iceCut: 0.35, breathCut: 0.35 }, "炎・吹雪を軽減"],
  ["dragonGi", "竜のどうぎ", 87, "a", "武商", 1, { fireCut: 0.3, iceCut: 0.3, breathCut: 0.3 }, "炎・吹雪を軽減"],
  ["bladeArmor", "やいばのよろい", 88, "a", "勇戦", 1, { thorns: 0.5 }, "物理ダメージの半分を跳ね返す"],
  ["dragonRobeDq", "ドラゴンローブ", 94, "a", "魔僧賢", 0, { fireCut: 0.35, iceCut: 0.35, breathCut: 0.35 }, "炎・吹雪を軽減"],
  ["flameArmor", "ほのおのよろい", 94, "a", "勇戦", 1, { iceCut: 0.4, breathCut: 0.25 }, "吹雪を軽減"],
  ["darkRobe", "やみのころも", 97, "a", "武盗遊", 0, { dodge: 0.22 }, "回避率が上がる"],
  ["bandedMail", "バンデッドメイル", 104, "a", "戦商物", 1, {}, ""],
  ["lightDress", "ひかりのドレス", 105, "a", "全", 0, { spellCut: 0.35 }, "攻撃呪文のダメージを軽減"],
  ["hellArmor", "じごくのよろい", 110, "a", "勇戦", 0, { curse: 0.22, spellCut: 0.3 }, "呪われる。動けない時がある。呪文を軽減"],
  ["greatTree", "大樹のマント", 112, "a", "勇僧商賢物", 0, { silenceResist: true }, "呪文封じに強い"],
  ["pirateCoat", "大海賊のコート", 117, "a", "盗商遊", 0, { spd: 40 }, ""],
  ["lightArmor", "ひかりのよろい", 118, "a", "勇", 0, { regen: 0.04, spellCut: 0.25 }, "ラウンド終わりにHP4%回復。呪文を軽減"],
  ["birdRobe", "神鳥の法衣", 125, "a", "魔遊賢", 0, { mpCut: 0.34 }, "呪文の消費MPが2/3"],
  ["heavenToga", "そうてんのトーガ", 132, "a", "武僧盗賢物", 0, { spellCut: 0.3, statusResist: true }, "攻撃呪文を軽減。毒・眠り・マヒに強い"],
  ["birdArmor", "神鳥のよろい", 147, "a", "勇戦", 0, { thorns: 0.5, regen: 0.05 }, "ダメージの半分を跳ね返し、少しずつ回復"],
];

DQ_GEAR.forEach(([id, name, stat, kind, who, shop, extra, special]) => {
  const scaled = kind === "a" ? scaleArmor(stat) : scaleWeapon(stat);
  const item = {
    name,
    price: shop ? Math.max(120, Math.round(scaled * 48)) : 0,
    unlock: shop ? dqBand(stat) : null,
    jobs: dqJobs(who),
    special,
    ...extra,
  };
  if (extra.spd) item.spd = Math.max(4, Math.round(extra.spd * 0.4));
  if (kind === "a") {
    item.slot = "armor";
    item.def = scaled;
  } else {
    item.atk = scaled;
  }
  WEAPONS[id] = item;
  if (!shop) RECIPES.push({ id, materials: dqMats(stat), gold: Math.round(stat * 22) });
});

const MONSTERS = {
  slime: { name: "スライム", hp: 28, atk: 16, def: 8, spd: 20, mp: 0, xp: 6, gold: 8, material: "slimeGel", skills: ["attack"] },
  slimebes: { name: "スライムベス", hp: 36, atk: 20, def: 10, spd: 18, mp: 0, xp: 8, gold: 10, material: "slimeGel", skills: ["attack"] },
  babble: { name: "バブルスライム", hp: 40, atk: 18, def: 10, spd: 22, mp: 8, xp: 8, gold: 12, material: "slimeGel", skills: ["attack", "sweep"] },
  snail: { name: "スライムつむり", hp: 52, atk: 18, def: 20, spd: 8, mp: 0, xp: 10, gold: 12, material: "slimeGel", skills: ["attack"] },
  marine: { name: "マリンスライム", hp: 40, atk: 22, def: 12, spd: 16, mp: 0, xp: 9, gold: 12, material: "slimeGel", skills: ["attack"] },
  hoimi: { name: "ホイミスライム", hp: 44, atk: 12, def: 10, spd: 14, mp: 20, xp: 12, gold: 14, material: "slimeGel", skills: ["hoimi", "attack"] },
  metalSlime: { name: "メタルスライム", hp: 4, atk: 14, def: 40, spd: 220, mp: 0, xp: 100, gold: 6, material: "speedSeed", metal: true, flee: 0.2, skills: ["flee", "attack"] },
  liquid: { name: "はぐれメタル", hp: 5, atk: 22, def: 60, spd: 255, mp: 0, xp: 240, gold: 16, material: "speedSeed", metal: true, flee: 0.28, skills: ["flee", "attack"] },
  bomb: { name: "ばくだんいわ", hp: 48, atk: 34, def: 8, spd: 10, mp: 0, xp: 14, gold: 16, material: "ore", skills: ["explode"] },
  ghoul: { name: "グール", hp: 72, atk: 30, def: 16, spd: 22, mp: 8, xp: 16, gold: 18, material: "bone", skills: ["attack", "hyado"] },
  chimera: { name: "キメラ", hp: 90, atk: 34, def: 18, spd: 24, mp: 12, xp: 22, gold: 24, material: "fang", skills: ["breath", "breathAll", "attack"] },
  skullgon: { name: "スカルゴン", hp: 80, atk: 32, def: 22, spd: 12, mp: 0, xp: 18, gold: 20, material: "bone", skills: ["attack", "sweep"] },
  darth: { name: "ダースリカント", hp: 100, atk: 36, def: 20, spd: 20, mp: 0, xp: 24, gold: 26, material: "ore", skills: ["attack", "breath", "breathAll"] },
  baramosBros: { name: "バラモスブロス", hp: 180, atk: 42, def: 26, spd: 18, mp: 16, xp: 48, gold: 70, material: "demon", boss: true, skills: ["breath", "breathAll", "attack", "mera"] },
  crow: { name: "おおがらす", hp: 46, atk: 24, def: 12, spd: 36, mp: 0, xp: 12, gold: 14, material: "wing", skills: ["attack", "sweep"] },
  rabbit: { name: "いっかくうさぎ", hp: 42, atk: 22, def: 10, spd: 42, mp: 0, xp: 12, gold: 12, material: "speedSeed", dropRate: 0.4, skills: ["attack"] },
  anteater: { name: "おおありくい", hp: 64, atk: 28, def: 18, spd: 16, mp: 0, xp: 14, gold: 16, material: "speedSeed", dropRate: 0.35, skills: ["attack"] },
  frogger: { name: "フロッガー", hp: 50, atk: 24, def: 14, spd: 28, mp: 0, xp: 12, gold: 14, material: "slimeGel", weak: "ice", skills: ["attack"] },
  ghostAnteater: { name: "おばけありくい", hp: 70, atk: 30, def: 16, spd: 18, mp: 0, xp: 16, gold: 16, material: "bone", skills: ["attack"] },
  wasp: { name: "さそりばち", hp: 54, atk: 30, def: 14, spd: 32, mp: 0, xp: 14, gold: 16, material: "fang", skills: ["dokukiri", "attack"] },
  mage: { name: "まほうつかい", hp: 48, atk: 26, def: 12, spd: 30, mp: 24, xp: 16, gold: 20, material: "cloth", skills: ["mera", "rukanii", "attack"] },
  almiraj: { name: "アルミラージ", hp: 58, atk: 32, def: 14, spd: 38, mp: 0, xp: 16, gold: 18, material: "fang", skills: ["attack"] },
  caterpillar: { name: "キャタピラー", hp: 60, atk: 26, def: 16, spd: 12, mp: 0, xp: 14, gold: 14, material: "cloth", skills: ["attack"] },
  butterfly: { name: "じんめんちょう", hp: 70, atk: 28, def: 16, spd: 30, mp: 0, xp: 18, gold: 20, material: "cloth", weak: "blast", skills: ["attack", "sweep"] },
  toad: { name: "ポイズントード", hp: 66, atk: 30, def: 14, spd: 18, mp: 0, xp: 16, gold: 18, material: "slimeGel", skills: ["dokukiri", "attack"] },
  zombie: { name: "アニマルゾンビ", hp: 80, atk: 34, def: 18, spd: 14, mp: 0, xp: 18, gold: 18, material: "bone", skills: ["attack"] },
  bee: { name: "キラービー", hp: 62, atk: 32, def: 12, spd: 36, mp: 0, xp: 16, gold: 16, material: "fang", skills: ["dokukiri", "attack"] },
  batman: { name: "こうもりおとこ", hp: 74, atk: 30, def: 16, spd: 34, mp: 0, xp: 18, gold: 22, material: "holyKnife", dropRate: 0.3, skills: ["attack"] },
  mushroom: { name: "おばけキノコ", hp: 68, atk: 26, def: 20, spd: 12, mp: 0, xp: 16, gold: 16, material: "cloth", skills: ["dokukiri", "attack"] },
  armyCrab: { name: "ぐんたいガニ", hp: 96, atk: 32, def: 28, spd: 10, mp: 0, xp: 20, gold: 22, material: "shell", skills: ["attack", "sweep"] },
  kandataKid: { name: "カンダタこぶん", hp: 50, atk: 28, def: 10, spd: 24, mp: 0, xp: 12, gold: 14, material: "cloth", skills: ["attack"] },
  kandata: { name: "カンダタ", hp: 160, atk: 40, def: 24, spd: 16, mp: 0, xp: 50, gold: 80, material: "fleeRing", boss: true, skills: ["attack"] },
  gizmo: { name: "ギズモ", hp: 70, atk: 30, def: 16, spd: 22, mp: 0, xp: 16, gold: 18, material: "ore", skills: ["attack"] },
  poisonWorm: { name: "どくイモムシ", hp: 64, atk: 28, def: 14, spd: 14, mp: 0, xp: 16, gold: 16, material: "fang", skills: ["dokukiri", "attack"] },
  flutter: { name: "デスフラッター", hp: 72, atk: 32, def: 16, spd: 34, mp: 0, xp: 18, gold: 18, material: "wing", skills: ["attack"] },
  hasami: { name: "じごくのハサミ", hp: 110, atk: 40, def: 26, spd: 18, mp: 0, xp: 24, gold: 26, material: "ore", skills: ["attack"] },
  druid: { name: "ドルイド", hp: 78, atk: 30, def: 16, spd: 28, mp: 28, xp: 22, gold: 24, material: "silk", skills: ["mera", "rukanii", "bomios"] },
  mummy: { name: "ミイラおとこ", hp: 84, atk: 34, def: 20, spd: 14, mp: 10, xp: 20, gold: 22, material: "cloth", skills: ["dokukiri", "rukanii", "attack"] },
  centipede: { name: "かえんムカデ", hp: 90, atk: 38, def: 18, spd: 22, mp: 8, xp: 22, gold: 22, material: "fang", skills: ["mera", "attack"] },
  kingToad: { name: "だいおうガマ", hp: 120, atk: 40, def: 22, spd: 12, mp: 0, xp: 24, gold: 26, material: "slimeGel", skills: ["attack", "sweep"] },
  laugh: { name: "わらいぶくろ", hp: 70, atk: 28, def: 16, spd: 30, mp: 12, xp: 18, gold: 24, material: "cloth", skills: ["rukanii", "attack"] },
  mimic: { name: "ひとくいばこ", hp: 88, atk: 42, def: 20, spd: 12, mp: 0, xp: 26, gold: 36, material: "sageWater", dropRate: 0.35, skills: ["attack"] },
  mummyEye: { name: "マミーズアイ", hp: 96, atk: 32, def: 14, spd: 32, mp: 36, xp: 30, gold: 40, material: "jewel", skills: ["mera", "io", "rukanii"] },
  nile: { name: "ナイルのあくま", hp: 240, atk: 50, def: 28, spd: 18, mp: 16, xp: 70, gold: 100, material: "demon", boss: true, skills: ["attack", "breath", "breathAll"] },
  dog: { name: "バリイドドッグ", hp: 100, atk: 38, def: 20, spd: 30, mp: 0, xp: 22, gold: 24, material: "fang", skills: ["attack"] },
  matango: { name: "マタンゴ", hp: 92, atk: 34, def: 22, spd: 16, mp: 8, xp: 22, gold: 22, material: "cloth", skills: ["dokukiri", "attack"] },
  vampire: { name: "バンパイア", hp: 110, atk: 40, def: 20, spd: 34, mp: 20, xp: 26, gold: 30, material: "ectoplasm", skills: ["hyado", "rukanii", "attack"] },
  catfly: { name: "キャットフライ", hp: 86, atk: 36, def: 16, spd: 36, mp: 0, xp: 22, gold: 22, material: "wing", skills: ["attack"] },
  jackal: { name: "デスジャッカル", hp: 104, atk: 42, def: 20, spd: 28, mp: 0, xp: 24, gold: 24, material: "fang", skills: ["attack"] },
  merge: { name: "マージマタンゴ", hp: 120, atk: 36, def: 24, spd: 18, mp: 24, xp: 26, gold: 28, material: "cloth", skills: ["mera", "rukanii", "attack"] },
  heat: { name: "ヒートギズモ", hp: 108, atk: 44, def: 22, spd: 20, mp: 8, xp: 26, gold: 26, material: "ore", skills: ["mera", "attack"] },
  illusion: { name: "げんじゅつし", hp: 90, atk: 34, def: 16, spd: 32, mp: 28, xp: 24, gold: 28, material: "cloth", skills: ["rukanii", "bomios", "mera"] },
  catbat: { name: "キャットバット", hp: 96, atk: 38, def: 18, spd: 40, mp: 0, xp: 24, gold: 24, material: "wing", skills: ["attack"] },
  kandata2: { name: "カンダタ", hp: 300, atk: 56, def: 30, spd: 22, mp: 0, xp: 90, gold: 140, material: "fleeRing", boss: true, skills: ["attack"] },
  ox: { name: "マッドオックス", hp: 140, atk: 46, def: 26, spd: 16, mp: 0, xp: 28, gold: 28, material: "bone", skills: ["attack", "sweep"] },
  garuda: { name: "ガルーダ", hp: 130, atk: 44, def: 22, spd: 36, mp: 12, xp: 30, gold: 32, material: "wing", skills: ["breath", "breathAll", "attack"] },
  beak: { name: "おおくちばし", hp: 120, atk: 48, def: 20, spd: 28, mp: 0, xp: 28, gold: 30, material: "wing", skills: ["attack", "sweep"] },
  bear: { name: "ごうけつぐま", hp: 160, atk: 50, def: 26, spd: 18, mp: 0, xp: 32, gold: 34, material: "fang", skills: ["attack", "sweep"] },
  masked: { name: "きめんどうし", hp: 110, atk: 40, def: 22, spd: 30, mp: 32, xp: 30, gold: 34, material: "silk", skills: ["io", "bomios", "rukanii"] },
  magma: { name: "ようがんまじん", hp: 150, atk: 48, def: 28, spd: 16, mp: 12, xp: 32, gold: 36, material: "ore", skills: ["mera", "breath", "breathAll"] },
  numb: { name: "しびれあげは", hp: 100, atk: 36, def: 18, spd: 34, mp: 16, xp: 26, gold: 28, material: "wing", skills: ["rahoru", "attack"] },
  pecker: { name: "デッドペッカー", hp: 130, atk: 46, def: 22, spd: 38, mp: 0, xp: 30, gold: 32, material: "bone", skills: ["attack", "sweep"] },
  orochi: { name: "やまたのおろち", hp: 360, atk: 58, def: 32, spd: 24, mp: 20, xp: 110, gold: 160, material: "scale", boss: true, weak: "ice", skills: ["breath", "breathAll", "attack", "io"] },
  troll: { name: "トロル", hp: 170, atk: 50, def: 28, spd: 14, mp: 0, xp: 34, gold: 36, material: "bone", skills: ["attack", "sweep"] },
  imp: { name: "ミニデーモン", hp: 110, atk: 42, def: 18, spd: 36, mp: 20, xp: 30, gold: 32, material: "demon", skills: ["mera", "rukanii"] },
  frost: { name: "フロストギズモ", hp: 130, atk: 44, def: 24, spd: 22, mp: 12, xp: 30, gold: 30, material: "ore", skills: ["hyado", "attack"] },
  ice: { name: "ひょうがまじん", hp: 160, atk: 48, def: 30, spd: 16, mp: 16, xp: 34, gold: 36, material: "ore", skills: ["hyado", "breath"] },
  behoma: { name: "ベホマスライム", hp: 140, atk: 30, def: 24, spd: 14, mp: 40, xp: 36, gold: 40, material: "slimeGel", skills: ["behoimi", "hoimi"] },
  bird: { name: "ごくらくちょう", hp: 120, atk: 40, def: 20, spd: 40, mp: 0, xp: 30, gold: 34, material: "wing", skills: ["attack", "sweep"] },
  goat: { name: "ゴートドン", hp: 180, atk: 52, def: 28, spd: 18, mp: 0, xp: 36, gold: 38, material: "bone", skills: ["attack", "sweep"] },
  phantom: { name: "ファントム", hp: 140, atk: 44, def: 20, spd: 48, mp: 28, xp: 40, gold: 50, material: "ectoplasm", weak: "fire", skills: ["hyado", "rukanii", "mera", "io"] },
  gate: { name: "よみのばんにん", hp: 280, atk: 56, def: 32, spd: 20, mp: 12, xp: 80, gold: 110, material: "bone", boss: true, weak: "fire", skills: ["attack", "breath", "breathAll", "sweep"] },
  revenant: { name: "レヴナント", hp: 340, atk: 60, def: 30, spd: 26, mp: 24, xp: 100, gold: 140, material: "ectoplasm", boss: true, skills: ["hyado", "io", "attack"] },
  snow: { name: "スノードラゴン", hp: 200, atk: 54, def: 30, spd: 22, mp: 16, xp: 40, gold: 44, material: "scale", skills: ["hyado", "breath", "breathAll"] },
  lion: { name: "ライオンヘッド", hp: 180, atk: 56, def: 26, spd: 24, mp: 0, xp: 38, gold: 40, material: "fang", skills: ["attack", "sweep"] },
  evilMage: { name: "エビルマージ", hp: 140, atk: 46, def: 22, spd: 30, mp: 40, xp: 40, gold: 48, material: "cloth", skills: ["io", "mera", "bomios"] },
  statue: { name: "うごくせきぞう", hp: 220, atk: 52, def: 36, spd: 8, mp: 0, xp: 40, gold: 42, material: "ore", skills: ["attack", "sweep"] },
  baramos: { name: "バラモス", hp: 460, atk: 68, def: 38, spd: 30, mp: 40, xp: 160, gold: 220, material: "goldBeak", boss: true, skills: ["io", "bomios", "rukanii", "breath"] },
  trollKing: { name: "トロルキング", hp: 240, atk: 60, def: 32, spd: 16, mp: 0, xp: 48, gold: 50, material: "bone", skills: ["attack", "sweep"] },
  dragon: { name: "ドラゴン", hp: 220, atk: 58, def: 30, spd: 24, mp: 16, xp: 46, gold: 52, material: "scale", skills: ["breath", "breathAll", "attack"] },
  salamander: { name: "サラマンダー", hp: 200, atk: 56, def: 26, spd: 28, mp: 20, xp: 46, gold: 48, material: "scale", skills: ["breath", "breathAll", "mera"] },
  archmage: { name: "アークマージ", hp: 160, atk: 50, def: 24, spd: 32, mp: 48, xp: 50, gold: 56, material: "cloth", skills: ["io", "mera", "rukanii"] },
  daimajin: { name: "だいまじん", hp: 260, atk: 62, def: 34, spd: 14, mp: 12, xp: 52, gold: 54, material: "ore", skills: ["attack", "sweep", "breath", "breathAll"] },
  balrog: { name: "バルログ", hp: 230, atk: 64, def: 28, spd: 30, mp: 20, xp: 54, gold: 56, material: "demon", skills: ["breath", "breathAll", "mera", "attack"] },
  dragonZombie: { name: "ドラゴンゾンビ", hp: 250, atk: 60, def: 30, spd: 18, mp: 0, xp: 52, gold: 50, material: "bone", skills: ["breath", "breathAll", "attack"] },
  manticore: { name: "マントゴーア", hp: 210, atk: 58, def: 26, spd: 32, mp: 0, xp: 48, gold: 48, material: "fang", skills: ["attack", "sweep"] },
  swordoid: { name: "ソードイド", hp: 190, atk: 66, def: 32, spd: 26, mp: 0, xp: 48, gold: 46, material: "iron", skills: ["attack", "sweep"] },
  madhand: { name: "マドハンド", hp: 150, atk: 48, def: 18, spd: 40, mp: 16, xp: 44, gold: 40, material: "ectoplasm", skills: ["attack", "rukanii"] },
  hydra: { name: "キングヒドラ", hp: 420, atk: 70, def: 36, spd: 22, mp: 20, xp: 140, gold: 180, material: "scale", boss: true, skills: ["breath", "breathAll", "attack", "io"] },
  baramosZombie: { name: "バラモスゾンビ", hp: 400, atk: 66, def: 34, spd: 20, mp: 28, xp: 150, gold: 190, material: "demon", boss: true, skills: ["io", "breath", "breathAll", "attack"] },
  zoma: { name: "ゾーマ", hp: 640, atk: 78, def: 44, spd: 34, mp: 50, xp: 260, gold: 340, material: "charm", boss: true, skills: ["io", "iora", "hyado", "breath", "breathAll", "bomios"] },
  rep: { name: "代表", hp: 1000, atk: 63, def: 40, spd: 100, mp: 40, xp: 180, gold: 220, boss: true, skills: ["attack", "io", "breath", "rukanii"] },
  ryuou: { name: "りゅうおう", hp: 3200, atk: 130, def: 80, spd: 85, mp: 999, xp: 500, gold: 800, material: "orb", boss: true, weak: "bolt", skills: ["attack"] },
  kirby: { name: "カービィ", hp: 12000, atk: 320, def: 86, spd: 112, mp: 120, xp: 700, gold: 1200, material: "popStar", boss: true },
  metaknight: { name: "メタナイト", hp: 10300, atk: 280, def: 82, spd: 122, mp: 180, xp: 650, gold: 1100, material: "popStar", boss: true },
  dedede: { name: "デデデ大王", hp: 13700, atk: 250, def: 158, spd: 68, mp: 90, xp: 680, gold: 1150, material: "popStar", boss: true },
  bandana: { name: "バンダナワドルディ", hp: 8000, atk: 120, def: 72, spd: 98, mp: 220, xp: 620, gold: 1050, material: "popStar", boss: true },
};

const REGIONS = [
  { id: "alefgard", name: "アレフガルド", after: null, battles: [
    { pool: ["slime", "slimebes", "babble", "snail", "marine", "hoimi"], min: 1, max: 2 },
    { pool: ["slime", "babble", "bomb", "marine", "hoimi"], min: 1, max: 2 },
    { pool: ["ghoul", "chimera", "skullgon", "darth", "bomb"], min: 1, max: 2 },
    { pool: ["ghoul", "chimera", "skullgon", "darth", "hoimi"], min: 2, max: 2 },
    { ids: ["baramosBros"] },
  ] },
  { id: "aliahan", name: "アリアハン", after: "alefgard", battles: [
    { pool: ["crow", "rabbit", "anteater", "frogger"], min: 1, max: 2 },
    { pool: ["ghostAnteater", "wasp", "babble", "frogger"], min: 1, max: 2 },
    { pool: ["mage", "almiraj", "caterpillar", "crow"], min: 1, max: 2 },
    { pool: ["almiraj", "caterpillar", "mage", "wasp"], min: 2, max: 3 },
  ] },
  { id: "romaria", name: "ロマリア", after: "aliahan", battles: [
    { pool: ["butterfly", "toad", "zombie", "bee"], min: 1, max: 2 },
    { pool: ["batman", "mushroom", "armyCrab", "bee"], min: 1, max: 2 },
    { pool: ["butterfly", "batman", "armyCrab", "zombie"], min: 2, max: 2 },
    { ids: ["kandataKid", "kandataKid", "kandata"] },
  ] },
  { id: "kazave", name: "カザーブ", after: "romaria", battles: [
    { pool: ["gizmo", "poisonWorm", "flutter", "armyCrab", "zombie"], min: 1, max: 2 },
    { pool: ["gizmo", "poisonWorm", "flutter"], min: 2, max: 2 },
    { pool: ["armyCrab", "zombie", "flutter", "gizmo"], min: 2, max: 2 },
    { pool: ["poisonWorm", "armyCrab", "zombie", "flutter"], min: 2, max: 3 },
  ] },
  { id: "isis", name: "イシス", after: "kazave", battles: [
    { pool: ["hasami", "druid", "mummy", "centipede"], min: 1, max: 2 },
    { pool: ["kingToad", "laugh", "mimic", "centipede"], min: 1, max: 2 },
    { pool: ["druid", "mummy", "mimic", "laugh"], min: 2, max: 2 },
    { ids: ["mummyEye", "nile"] },
  ] },
  { id: "porta", name: "ポルタ", after: "isis", battles: [
    { pool: ["flutter", "dog", "matango", "vampire"], min: 1, max: 2 },
    { pool: ["matango", "vampire", "druid"], min: 1, max: 2 },
    { pool: ["dog", "vampire", "druid", "matango"], min: 2, max: 2 },
    { pool: ["vampire", "dog", "druid", "flutter"], min: 2, max: 3 },
  ] },
  { id: "baharata", name: "バハラタ", after: "porta", battles: [
    { pool: ["hasami", "catfly", "jackal"], min: 1, max: 2 },
    { pool: ["merge", "heat", "illusion"], min: 1, max: 2 },
    { pool: ["laugh", "mimic", "catbat", "jackal"], min: 2, max: 2 },
    { ids: ["kandata2"] },
  ] },
  { id: "dharma", name: "ダーマ", after: "baharata", battles: [
    { pool: ["catbat", "ox", "illusion"], min: 1, max: 2 },
    { pool: ["garuda", "beak", "illusion"], min: 1, max: 2 },
    { pool: ["ox", "garuda", "catbat"], min: 2, max: 2 },
    { pool: ["garuda", "beak", "ox", "illusion"], min: 2, max: 3 },
  ] },
  { id: "jipang", name: "ジパング", after: "dharma", battles: [
    { pool: ["kingToad", "bear", "masked", "magma"], min: 1, max: 2 },
    { pool: ["kingToad", "numb", "pecker", "bear"], min: 1, max: 2 },
    { ids: ["orochi"] },
    { ids: ["orochi"] },
  ] },
  { id: "necrogond", name: "ネクロゴンド", after: "jipang", battles: [
    { pool: ["troll", "imp", "frost", "ice"], min: 1, max: 2 },
    { pool: ["ice", "behoma", "bird", "goat", "pecker"], min: 1, max: 2 },
    { ids: ["phantom", "gate"] },
    { ids: ["revenant"] },
  ] },
  { id: "baramos", name: "バラモス", after: "necrogond", battles: [
    { pool: ["snow", "lion", "evilMage"], min: 1, max: 2 },
    { pool: ["statue", "troll", "evilMage", "lion"], min: 1, max: 2 },
    { pool: ["snow", "statue", "troll"], min: 2, max: 2 },
    { ids: ["baramos"] },
  ] },
  { id: "zoma", name: "ゾーマ", after: "baramos", battles: [
    { pool: ["trollKing", "dragon", "salamander", "archmage"], min: 1, max: 2 },
    { pool: ["daimajin", "balrog", "dragonZombie", "manticore", "swordoid", "madhand"], min: 1, max: 2 },
    { ids: ["hydra"] },
    { ids: ["baramosZombie"] },
    { ids: ["zoma"] },
  ] },
];

["ghoul", "zombie", "skullgon", "gate", "revenant", "baramosZombie"].forEach((id) => {
  if (MONSTERS[id]) MONSTERS[id].species = "undead";
});
["crow", "rabbit", "anteater", "frogger", "wasp", "almiraj", "butterfly", "toad", "bee", "chimera"].forEach((id) => {
  if (MONSTERS[id]) MONSTERS[id].species = MONSTERS[id].species || "beast";
});

function rollWave(region, wave) {
  const ids = wave.ids ? wave.ids.slice() : Array.from({ length: wave.min + Math.floor(Math.random() * ((wave.max || wave.min) - wave.min + 1)) }, () => wave.pool[Math.floor(Math.random() * wave.pool.length)]);
  const boss = ids.some((id) => MONSTERS[id] && MONSTERS[id].boss);
  if (!boss && ids.length < 3 && Math.random() < 0.1) {
    const late = region.id === "necrogond" || region.id === "baramos" || region.id === "zoma";
    ids.push(late && Math.random() < 0.4 ? "liquid" : "metalSlime");
  }
  return ids;
}

function rollBattle(region, step, extra) {
  const bonus = extra || 0;
  if (step < bonus) {
    const pools = region.battles.filter((wave) => !(wave.ids || []).some((id) => MONSTERS[id] && MONSTERS[id].boss));
    return rollWave(region, pools[step % Math.max(1, pools.length)] || region.battles[0]);
  }
  return rollWave(region, region.battles[step - bonus] || region.battles[region.battles.length - 1]);
}

function battleCount(region, extra) {
  return region.battles.length + (extra || 0);
}

function regionOpen(cleared, region) {
  return !region.after || (cleared || []).includes(region.after);
}

function materialSources() {
  const map = {};
  const add = (mat, region, monster) => {
    if (!mat || !monster) return;
    if (!map[mat]) map[mat] = [];
    let row = map[mat].find((item) => item.region === region);
    if (!row) {
      if (map[mat].length >= 2) return;
      row = { region, monsters: [] };
      map[mat].push(row);
    }
    if (!row.monsters.includes(monster) && row.monsters.length < 2) row.monsters.push(monster);
  };
  REGIONS.forEach((region) => {
    (region.battles || []).forEach((wave) => {
      (wave.pool || wave.ids || []).forEach((id) => {
        const monster = MONSTERS[id];
        if (monster) add(monster.material, region.name, monster.name);
      });
    });
  });
  RAIDS.forEach((raid) => {
    (raid.foes || []).forEach((id) => {
      const monster = MONSTERS[id];
      if (monster) add(monster.material, "大ボス", monster.name);
    });
  });
  map.speedSeed = [{ region: "戦闘中", monsters: ["メタルスライム"] }, { region: "ネクロゴンド以降", monsters: ["はぐれメタル"] }];
  return map;
}

const DIFFICULTIES = [
  { id: 1, name: "ふつう", hp: 1, atk: 1, def: 1, reward: 1, xp: 1 },
  { id: 2, name: "きつい", hp: 1.45, atk: 1.25, def: 1.2, reward: 1.35, xp: 2 },
  { id: 3, name: "激辛", hp: 1.9, atk: 1.5, def: 1.35, reward: 1.7, xp: 3 },
  { id: 4, name: "地獄", hp: 2.5, atk: 1.8, def: 1.55, reward: 2.1, xp: 4.5 },
  { id: 5, name: "やばい", hp: 4, atk: 2.8, def: 2.4, spd: 1.4, reward: 3, xp: 7, twice: true },
];

function difficultyOf(id) {
  return DIFFICULTIES.find((rank) => rank.id === Number(id)) || DIFFICULTIES[0];
}

function difficultyOpen(cleared, id) {
  const rank = Number(id) || 1;
  return rank <= 1 || (cleared || []).includes(rank - 1);
}

const RAIDS = [
  { id: "rep", name: "代表", blurb: "新入生代表。闇の衣が剥がれると第二形態になる。", minParty: 1, foes: ["rep"] },
  { id: "ryuou", name: "竜王", blurb: "りゅうおう。体力が尽きると竜王になる。竜王は1ターンに4回動く。人の姿は雷が弱点で、ドラゴンへの攻撃も通る。", minParty: 1, foes: ["ryuou"] },
  { id: "demise", name: "終焉", blurb: "99が4人で、やっと届く。前半は2回、終焉になってから3回動く。魔法職は短剣「誕生と終焉」、物理職は剣「星なき夜」。", minParty: 1, foes: ["demise"] },
  {
    id: "popstar",
    name: "ポップスター",
    blurb: "カービィ・メタナイト・デデデ大王・バンダナワドルディの4人同時。鬼畜。星のかけらと、25%でギャラクシア。工房で星のつち。",
    minParty: 1,
    foes: ["kirby", "metaknight", "dedede", "bandana"],
    rareDrop: { id: "galaxia", rate: 0.25 },
  },
];

function raidOf(id) {
  return RAIDS.find((raid) => raid.id === id) || null;
}

const MATERIAL_SOURCES = materialSources();

const MATERIALS = {
  slimeGel: "スライムゼリー",
  wing: "つばさ",
  ectoplasm: "ゆうれいの息",
  iron: "てっくず",
  scale: "りゅうのうろこ",
  orb: "まおうのたま",
  fang: "するどい牙",
  cloth: "ぬのきれ",
  shell: "こうら",
  jewel: "ほうせき",
  bone: "まがったほね",
  silk: "まほうの絹",
  ore: "こうてつ",
  charm: "せいなるお守り",
  demon: "まもののつの",
  speedSeed: "すばやさのたね",
  xpPlant: "経験の株",
  scentBag: "匂い袋",
  fleeRing: "にげにげリング",
  holyKnife: "せいなるナイフ",
  sageWater: "けんじゃのせいすい",
  goldBeak: "きんのクチバシ",
  popStar: "星のかけら",
};

const MATERIAL_SHOP = [
  ["slimeGel", 40], ["cloth", 50], ["bone", 50], ["wing", 60],
  ["fang", 70], ["iron", 80], ["shell", 90], ["ectoplasm", 100],
  ["ore", 160], ["scale", 180], ["jewel", 200], ["silk", 220],
  ["charm", 280], ["demon", 320],
];

const SEEDS = {
  atk: { name: "攻撃のたね", key: "atkBoost", gain: 1, base: 500 },
  def: { name: "守備のたね", key: "defBoost", gain: 1, base: 450 },
  hp: { name: "HPのたね", key: "hpBoost", gain: 12, base: 300 },
  mp: { name: "MPのたね", key: "mpBoost", gain: 2, base: 400 },
  spd: { name: "すばやさのたね", key: "spdBoost", gain: 1, base: 600 },
};

function seedPrice(id, bought) {
  const seed = SEEDS[id];
  if (!seed) return 0;
  return Math.round(seed.base * (1.45 ** (bought || 0)));
}

const CONSUMABLES = {
  xpPlant: { name: "経験の株", price: 1200, detail: "次の旅の経験値が2倍。使い切り" },
  scentBag: { name: "匂い袋", price: 1000, detail: "次の旅の戦闘が2回増える。使い切り" },
};

const JobBook = {
  JOBS, TRAITS, SKILLS, BASIC_JOBS, WEAPONS, RECIPES, MONSTERS, REGIONS, RAIDS, MATERIALS, MATERIAL_SOURCES, DIFFICULTIES, LEVEL_CAP,
  MATERIAL_SHOP, SEEDS, CONSUMABLES,
  jobSkills, nextSkill, promotionReady, availableJobs, regionOpen, shopOpen, difficultyOf, difficultyOpen, rollBattle, battleCount, raidOf, seedPrice,
};

if (typeof window !== "undefined") window.JobBook = JobBook;
if (typeof module !== "undefined" && module.exports) module.exports = JobBook;
