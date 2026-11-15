// 質問と点数は animal_battle_quiz.xlsx「質問と点数」と同じ。
// 同点は回答番号の合計 S（A=0 … D=3）で優先順位をずらす。乱数は使わない。
// 優先順はシートの並び。全4096通りの偏りと一致する。

const TYPE_ORDER = ["ネコ科", "イヌ科", "大型", "鳥類", "爬虫類"];
const STAT_ORDER = ["攻撃", "守備", "HP"];
const ATTACK_SKILLS = ["強打", "連撃", "急所狙い", "吸収", "貫通"];
const SKILL_ORDER = [
  "強打",
  "連撃",
  "急所狙い",
  "吸収",
  "貫通",
  "ガード",
  "気合",
  "硬化",
  "毒",
  "弱体",
  "反撃",
];

const QUESTIONS = [
  {
    id: "Q1",
    prompt: "宝箱を見つけた！どうする？",
    options: [
      { label: "すぐに開ける", type2: "ネコ科", type1: "イヌ科", stat: "攻撃", attack: "急所狙い", support: "気合" },
      { label: "罠を調べてから開ける", type2: "鳥類", type1: "爬虫類", stat: "守備", attack: "貫通", support: "ガード" },
      { label: "仲間と相談して開ける", type2: "イヌ科", type1: "大型", stat: "HP", attack: "吸収", support: "硬化" },
      { label: "見張りを立てて様子見", type2: "大型", type1: "鳥類", stat: "守備", attack: "強打", support: "反撃" },
    ],
  },
  {
    id: "Q2",
    prompt: "ライバルに勝負を挑まれた！",
    options: [
      { label: "受けて立つ", type2: "ネコ科", type1: "大型", stat: "攻撃", attack: "強打", support: "気合" },
      { label: "作戦を練ってから", type2: "爬虫類", type1: "鳥類", stat: "攻撃", attack: "連撃", support: "反撃" },
      { label: "ルールを確認する", type2: "鳥類", type1: "イヌ科", stat: "守備", attack: "貫通", support: "弱体" },
      { label: "みんなの動きを見て合わせる", type2: "イヌ科", type1: "大型", stat: "守備", attack: "吸収", support: "硬化" },
    ],
  },
  {
    id: "Q3",
    prompt: "長い道のりを行くなら？",
    options: [
      { label: "全力で駆け抜ける", type2: "ネコ科", type1: "鳥類", stat: "攻撃", attack: "連撃", support: "気合" },
      { label: "ペースを守って進む", type2: "イヌ科", type1: "大型", stat: "HP", attack: "吸収", support: "ガード" },
      { label: "近道や裏道を探す", type2: "爬虫類", type1: "ネコ科", stat: "守備", attack: "急所狙い", support: "毒" },
      { label: "重い荷物も背負って行く", type2: "大型", type1: "イヌ科", stat: "守備", attack: "強打", support: "硬化" },
    ],
  },
  {
    id: "Q4",
    prompt: "みんなで鍋を囲む。あなたは？",
    options: [
      { label: "具材を取り合う", type2: "ネコ科", type1: "爬虫類", stat: "攻撃", attack: "急所狙い", support: "弱体" },
      { label: "みんなに取り分ける", type2: "イヌ科", type1: "大型", stat: "HP", attack: "吸収", support: "反撃" },
      { label: "こっそり好物を確保", type2: "爬虫類", type1: "鳥類", stat: "守備", attack: "連撃", support: "毒" },
      { label: "全体を見て火加減を調整", type2: "鳥類", type1: "イヌ科", stat: "HP", attack: "貫通", support: "弱体" },
    ],
  },
  {
    id: "Q5",
    prompt: "苦手な相手が現れたら？",
    options: [
      { label: "正面からぶつかる", type2: "大型", type1: "ネコ科", stat: "攻撃", attack: "強打", support: "反撃" },
      { label: "距離をとって観察", type2: "鳥類", type1: "爬虫類", stat: "HP", attack: "貫通", support: "弱体" },
      { label: "軽くかわして逃げる", type2: "ネコ科", type1: "鳥類", stat: "HP", attack: "急所狙い", support: "ガード" },
      { label: "弱点を探って仕掛ける", type2: "爬虫類", type1: "イヌ科", stat: "攻撃", attack: "連撃", support: "毒" },
    ],
  },
  {
    id: "Q6",
    prompt: "理想の勝ち方は？",
    options: [
      { label: "一撃で決める", type2: "大型", type1: "ネコ科", stat: "攻撃", attack: "急所狙い", support: "気合" },
      { label: "じわじわ追い詰める", type2: "爬虫類", type1: "大型", stat: "HP", attack: "連撃", support: "毒" },
      { label: "無傷で勝つ", type2: "鳥類", type1: "ネコ科", stat: "守備", attack: "貫通", support: "ガード" },
      { label: "最後まで立っていた者が勝ち", type2: "イヌ科", type1: "大型", stat: "HP", attack: "吸収", support: "硬化" },
    ],
  },
];

function empty(keys) {
  const scores = {};
  keys.forEach((key) => {
    scores[key] = 0;
  });
  return scores;
}

function rotate(order, shift) {
  const amount = shift % order.length;
  return order.slice(amount).concat(order.slice(0, amount));
}

function pickByScore(scores, order, shift, mode) {
  const rotated = rotate(order, shift);
  let target = scores[order[0]];
  order.forEach((key) => {
    const value = scores[key];
    if (mode === "max" ? value > target : value < target) target = value;
  });
  return rotated.find((key) => scores[key] === target);
}

function pickTop(scores, order, shift, count) {
  const rank = new Map(rotate(order, shift).map((key, index) => [key, index]));
  return order
    .slice()
    .sort((a, b) => {
      if (scores[b] !== scores[a]) return scores[b] - scores[a];
      return rank.get(a) - rank.get(b);
    })
    .slice(0, count);
}

function judge(answers) {
  if (!Array.isArray(answers) || answers.length !== QUESTIONS.length) {
    throw new Error("回答は6問ぶん必要です");
  }
  const shift = answers.reduce((sum, index) => sum + index, 0);
  const types = empty(TYPE_ORDER);
  const stats = empty(STAT_ORDER);
  const skills = empty(SKILL_ORDER);

  answers.forEach((choice, questionIndex) => {
    const option = QUESTIONS[questionIndex].options[choice];
    if (!option) throw new Error("選択肢が不正です");
    types[option.type2] += 2;
    types[option.type1] += 1;
    stats[option.stat] += 1;
    skills[option.attack] += 1;
    skills[option.support] += 1;
  });

  const type = pickByScore(types, TYPE_ORDER, shift, "max");
  const statUp = pickByScore(stats, STAT_ORDER, shift, "max");
  const statRest = STAT_ORDER.filter((key) => key !== statUp);
  const statDown = rotate(STAT_ORDER, shift).find((key) => {
    if (!statRest.includes(key)) return false;
    return statRest.every((other) => stats[key] <= stats[other]);
  });
  const attack = pickByScore(skills, ATTACK_SKILLS, shift, "max");
  const pool = SKILL_ORDER.filter((key) => key !== attack);
  const others = pickTop(skills, pool, shift, 2);

  return {
    type,
    statUp,
    statDown,
    statFlat: STAT_ORDER.find((key) => key !== statUp && key !== statDown),
    attack,
    others,
    skills: [attack, ...others],
    scores: { types, stats, skills },
    shift,
  };
}

// animal_battle_skills.xlsx「質問由来11型」「タイプ専用5技」の数値。
const SKILLS = {
  強打: { power: 1.2, hits: 1, qte: true, uses: 2, crit: 0.1, miss: 0, note: "QTEで0.6〜1.8倍" },
  連撃: { power: 0.35, hits: 3, qte: true, uses: 4, crit: 0.05, miss: 0.1, note: "3回ヒット。ミス率はヒットごと。QTEで0.6〜1.8倍" },
  急所狙い: { power: 0.9, hits: 1, qte: true, uses: 2, crit: 0.6, miss: 0.4, note: "ハイリスク型。QTEで0.6〜1.8倍。パーフェクトなら必中" },
  吸収: { power: 0.8, hits: 1, qte: true, uses: 3, crit: 0.1, miss: 0.1, note: "与ダメージの3割を回復。QTEで0.6〜1.8倍" },
  貫通: { power: 0.8, hits: 1, qte: true, uses: 3, crit: 0.1, miss: 0.1, note: "相手の守備を半分無視。GOOD以上ならガードと軽減も無視。QTEで0.4〜1.2倍" },
  ガード: { uses: 2, note: "次の攻撃の初撃を90%軽減" },
  気合: { uses: 2, note: "2ターン、威力+45%" },
  硬化: { uses: 2, note: "3ターン、守備+100%" },
  毒: { uses: 3, note: "3ターン継続ダメージ（攻撃×0.45/ターン）" },
  弱体: { uses: 3, note: "3ターン、相手の攻撃−60%" },
  反撃: { uses: 2, note: "次の攻撃の初撃の90%を相手に返す" },
};

const TYPE_SKILLS = {
  ネコ科: {
    name: "身かわし",
    uses: 1,
    main: "次の攻撃の初撃を80%軽減",
    sub: "次の自分の攻撃が超会心必中",
  },
  イヌ科: {
    name: "遠吠え",
    uses: 2,
    main: "2ラウンド、攻撃+30%・守備+90%",
    sub: "最大HPの20%を回復",
  },
  大型: {
    name: "根を張る",
    uses: 1,
    main: "持続回復3ラウンド（最大HPの8%/ラウンド）",
    sub: "2ラウンド、守備+85%",
  },
  鳥類: {
    name: "追い風",
    uses: 2,
    main: "2ラウンド、回避70%（相手の攻撃が確率で外れる）",
    sub: "1ラウンド、QTEバーが遅くなる",
  },
  爬虫類: {
    name: "封じ",
    uses: 1,
    main: "相手が最後に使った技を4ラウンド封じる（通常攻撃は封じない）",
    sub: "回復量−60%（5ラウンド）＋守備−55%（3ラウンド）",
  },
};

const MONTH_SKILLS = [
  { name: "初日の出", uses: 2, main: "2ラウンド、超会心率+45%", sub: "次の攻撃が必中" },
  { name: "雪化粧", uses: 2, main: "2ラウンド、被ダメージ75%軽減", sub: "最大HPの8%回復" },
  { name: "桜吹雪", uses: 2, main: "2ラウンド、相手の守備−60%", sub: "2ラウンド、超会心率+15%" },
  { name: "春風", uses: 2, main: "2ラウンド、回避60%", sub: "1ラウンド、QTEバーが遅くなる" },
  { name: "新緑", uses: 1, main: "持続回復3ラウンド（最大HPの6%/ラウンド）", sub: "2ラウンド、守備+80%" },
  { name: "梅雨", uses: 2, main: "2ラウンド、相手の攻撃−55%", sub: "2ラウンド、回避60%" },
  { name: "夏祭り", uses: 1, main: "次の攻撃の威力+70%", sub: "2ラウンド、超会心率+15%" },
  { name: "入道雲", uses: 2, main: "2ラウンド、攻撃+40%", sub: "次の攻撃が必中" },
  { name: "月見", uses: 1, main: "最大HPの20%回復", sub: "1ラウンド、守備+100%" },
  { name: "紅葉", uses: 2, main: "2ラウンド、相手の守備−55%", sub: "2ラウンド、相手の攻撃−45%" },
  { name: "木枯らし", uses: 2, main: "2ラウンド、超会心率+30%", sub: "2ラウンド、回避60%" },
  { name: "冬至", uses: 1, main: "最大HPの15%回復", sub: "2ラウンド、被ダメージ70%軽減" },
];

function percent(value) {
  const shown = Math.round(value * 1000) / 10;
  return `${shown}%`;
}

function skillSpec(name) {
  const skill = SKILLS[name];
  const parts = [];
  if (skill.power != null) parts.push(`威力${skill.power}`);
  if (skill.hits != null) parts.push(`${skill.hits}ヒット`);
  if (skill.qte != null) parts.push(skill.qte ? "QTEあり" : "QTEなし");
  parts.push(`回数${skill.uses}`);
  if (skill.crit != null) parts.push(`超会心${percent(skill.crit)}`);
  if (skill.miss != null) parts.push(`ミス${percent(skill.miss)}`);
  return `${parts.join(" / ")}。${skill.note}`;
}

const AnimalQuiz = {
  QUESTIONS,
  TYPE_ORDER,
  STAT_ORDER,
  ATTACK_SKILLS,
  SKILL_ORDER,
  SKILLS,
  TYPE_SKILLS,
  MONTH_SKILLS,
  judge,
};

if (typeof window !== "undefined") window.AnimalQuiz = AnimalQuiz;
if (typeof module !== "undefined" && module.exports) module.exports = AnimalQuiz;

if (typeof document !== "undefined") {
  const MARKS = ["A", "B", "C", "D"];
  const state = {
    phase: "intro",
    intro: 0,
    month: 1,
    step: 0,
    answers: [],
    mode: "free",
    coop: false,
    seat: 0,
    party: [],
    active: 0,
    chapter: 0,
    line: 0,
    storyBeat: "before",
    foes: [],
    run: null,
    script: [],
    offer: [],
    rewardNext: "next",
    rewardSeat: 0,
    rewardPicks: 0,
    pickedName: "",
    bossRounds: null,
    note: "",
    shortcut: "",
    passNote: "",
  };

  const SECRET_LIMIT = 8;
  const BOSS = {
    kicker: "第5話",
    title: "大舞台",
    titleName: "ゴウ",
    speaker: "祭りの主・ゴウ",
    type: "大型",
    month: 7,
    answers: [2, 0, 3, 3, 0, 1],
    same: "同じ大型か。舞台の上で、ゆっくりやろう。",
  };
  const SECRET = {
    kicker: "裏",
    title: "閉園のあと",
    titleName: "代表",
    speaker: "代表",
    type: "ネコ科",
    month: 1,
    answers: [0, 0, 0, 0, 0, 0],
    same: "同じネコ科か。裏でも、正面からいこう。",
  };
  const PLACES = [
    {
      kicker: "第1話",
      title: "門の前",
      open: (foe) => [
        { who: "", text: "森の文化祭がはじまる。勝負は5つ。最後は大舞台。" },
        { who: "", text: "あなたは診断された動物のまま、門の前に立った。" },
        { who: foe.type, text: "通るなら、ここで勝負だ。" },
      ],
      close: (foe) => [
        { who: foe.type, text: "通してやる。次は屋台だ。" },
        { who: "", text: "傷は少しだけ癒えた。体力は、全部は戻らない。" },
      ],
    },
    {
      kicker: "第2話",
      title: "屋台の前",
      open: (foe) => [
        { who: foe.type, text: "屋台の前で、勝負を売ってきた。" },
        { who: foe.type, text: "勝ったら、何か拾えるらしい。" },
      ],
      close: (foe) => [
        { who: foe.type, text: "次は風の通りだ。足場に気をつけて。" },
        { who: "", text: "傷は少しだけ癒えた。" },
      ],
    },
    {
      kicker: "第3話",
      title: "風の通り",
      open: (foe) => [
        { who: "", text: "風の強い通りに、相手が待っていた。" },
        { who: foe.type, text: "ここで止まってもいい。進むなら勝負だ。" },
      ],
      close: (foe) => [
        { who: foe.type, text: "通りは抜けた。次は裏路地だ。" },
        { who: "", text: "傷は少しだけ癒えた。" },
      ],
    },
    {
      kicker: "第4話",
      title: "裏路地",
      open: (foe) => [
        { who: "", text: "大舞台の手前。裏路地は狭い。" },
        { who: foe.type, text: "ここを抜けたら、あとは大舞台だけだ。" },
      ],
      close: (foe) => [
        { who: foe.type, text: "大舞台は、この先だ。" },
        { who: "", text: "傷は少しだけ癒えた。ラスボスは、残った体力のまま。" },
      ],
    },
  ];
  const REWARDS = [
    { id: "atk", from: "古い王国", name: "ちからの木の実", detail: "この先、攻撃+15%。重なる。" },
    { id: "def", from: "古い王国", name: "まもりの木の実", detail: "この先、守備+15%。重なる。" },
    { id: "spd", from: "古い王国", name: "はやさの木の実", detail: "この先、素早さ+20。重なる。大型は先に動けない。" },
    { id: "phoenix", from: "古い王国", name: "不死鳥の羽", detail: "次の勝負、最初に倒れそうになったときHP30%で持ちこたえる。持っているものは置き換わる。" },
    { id: "hp", from: "緑の荒野", name: "心の器", detail: "最大HP+20%。増えた分だけ回復する。" },
    { id: "hipotion", from: "緑の荒野", name: "赤い小瓶", detail: "いま、HPを80%回復する。" },
    { id: "fairy", from: "緑の荒野", name: "守りの光", detail: "次の勝負で倒れて勝ち残ったら、HP50%で戻る。持っているものは置き換わる。" },
    { id: "shield", from: "緑の荒野", name: "古の大盾", detail: "次の勝負、最初の一撃を90%軽減。持っているものは置き換わる。" },
    { id: "hp", from: "跳ねる国", name: "育ちキノコ", detail: "この先、最大HP+20%。増えた分だけ回復する。" },
    { id: "guard", from: "跳ねる国", name: "きらめき星", detail: "序盤の数ラウンド、受けるダメージを90%軽減。持っているものは置き換わる。" },
    { id: "kiai", from: "跳ねる国", name: "火の花", detail: "序盤の数ラウンド、技の威力+50%。持っているものは置き換わる。" },
    { id: "oneup", from: "跳ねる国", name: "やり直しキノコ", detail: "次の勝負で倒れて勝ち残ったら、HP全回復で戻る。持っているものは置き換わる。" },
    { id: "atk", from: "図鑑の世界", name: "ちからの粉", detail: "この先、攻撃+15%。重なる。" },
    { id: "def", from: "図鑑の世界", name: "守りの粉", detail: "この先、守備+15%。重なる。" },
    { id: "hp", from: "図鑑の世界", name: "命の粉", detail: "最大HP+20%。増えた分だけ回復する。" },
    { id: "candy", from: "図鑑の世界", name: "ふしぎなアメ", detail: "攻撃+15%、守備+15%、最大HP+20%。" },
    { id: "potion", from: "水晶の旅", name: "傷薬", detail: "いま、HPを40%回復する。" },
    { id: "hipotion", from: "水晶の旅", name: "上等な傷薬", detail: "いま、HPを80%回復する。" },
    { id: "max", from: "水晶の旅", name: "魔力のしずく", detail: "質問技が全部、回数+1。" },
    { id: "elixir", from: "水晶の旅", name: "万能薬", detail: "HPが全回復し、質問技が全部、回数+1。" },
    { id: "snack", from: "丸い星", name: "まんまるトマト", detail: "いま、HPが全回復する。" },
    { id: "invuln", from: "丸い星", name: "無敵のアメ", detail: "序盤の数ラウンド、受けるダメージを90%軽減。持っているものは置き換わる。" },
    { id: "mic", from: "丸い星", name: "叫びの笛", detail: "次の攻撃の威力が2倍。持っているものは置き換わる。" },
    { id: "k1up", from: "丸い星", name: "やり直しの札", detail: "次の勝負で倒れて勝ち残ったら、HP全回復で戻る。持っているものは置き換わる。" },
    { id: "snack", from: "地下の食堂", name: "あったかパイ", detail: "いま、HPが全回復する。" },
    { id: "atk", from: "地下の食堂", name: "英雄サンド", detail: "この先、攻撃+15%。重なる。" },
    { id: "steak", from: "地下の食堂", name: "厚い肉", detail: "いま、HPを80%回復する。" },
    { id: "donut", from: "地下の食堂", name: "糸のドーナツ", detail: "いま、HPを40%回復する。" },
  ];
  const SECRET_REWARDS = [
    { id: "light", name: "破邪の宝玉", detail: "攻撃+30、守備+30、素早さ+30、最大HP+30。毎ラウンド50回復。技として1回、闇の衣を剥がせる。大型は先に動けない。" },
    { id: "bell", name: "呼び鈴", detail: "毎ラウンド、鐘が鳴る。" },
    { id: "shroom", name: "でかキノコ", detail: "最大HP+150。技「でかキノコ」が付く。30回復で、2回まで。" },
    { id: "stone", name: "復活の石", detail: "倒れそうになるとHP1で踏みとどまる。そのあと、味方のHPと技の回数が全開になる。" },
  ];

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function withMissColor(text) {
    return escapeHtml(text).replace(/ミス\d+(?:\.\d+)?%/g, (hit) => `<span class="miss-rate">${hit}</span>`);
  }

  function skillButton(slot, name) {
    return `<button class="choice" type="button" data-skill-name="${escapeHtml(name)}" data-skill-slot="${escapeHtml(slot)}"><strong>${escapeHtml(name)}</strong><span class="detail">${escapeHtml(slot)}</span></button>`;
  }

  function showSheet(html) {
    const backdrop = document.getElementById("backdrop");
    const sheet = document.getElementById("sheet");
    backdrop.hidden = false;
    sheet.hidden = false;
    sheet.innerHTML = html;
    const close = () => {
      backdrop.hidden = true;
      sheet.hidden = true;
      sheet.innerHTML = "";
    };
    backdrop.onclick = close;
    const closer = sheet.querySelector("[data-close]");
    if (closer) closer.onclick = close;
    return close;
  }

  const PORTRAITS = {
    ネコ科: "art/neko.png",
    イヌ科: "art/inu.png",
    大型: "art/oogata.png",
    鳥類: "art/tori.png",
    爬虫類: "art/hachuu.png",
  };

  function portraitHtml(type, large) {
    return `<div class="portrait${large ? " lg" : ""}"><img src="${PORTRAITS[type] || ""}" alt="" onerror="this.hidden=true"><span>イラスト<br>${escapeHtml(type)}</span></div>`;
  }

  function resultHtml(result) {
    const statLine = STAT_ORDER.map((stat) => {
      if (stat === result.statUp) return `<span class="up">${stat} +10%</span>`;
      if (stat === result.statDown) return `<span class="down">${stat} −10%</span>`;
      return `${stat} 変化なし`;
    }).join("<br>");
    const typeSkill = TYPE_SKILLS[result.type];
    const monthSkill = MONTH_SKILLS[state.month - 1];
    const skills = [
      skillButton("攻撃枠", result.attack),
      ...result.others.map((skill) => skillButton("技", skill)),
      skillButton("タイプ", typeSkill.name),
      skillButton(`${state.month}月`, monthSkill.name),
    ].join("");
    return `
      <div class="stage">
        <section class="win result-head">
          ${portraitHtml(result.type, true)}
          <div class="result-body">
            <h2>診断結果</h2>
            <p class="type">${escapeHtml(result.type)}</p>
            <p>${statLine}</p>
            ${state.mode === "story" && state.coop ? `<p class="lead">${state.seat === 0 ? "1人目。覚えたら、画面を2人目に渡す。" : "2人目。この2人で、物語を進める。"}</p>` : ""}
            ${state.mode === "story" && !state.coop ? `<p class="lead">この動物で、5連戦を勝ち抜く。体力は次の話へ残る。</p>` : ""}
          </div>
        </section>
        <section class="win">
          <h2>技（タップで詳細）</h2>
          ${skills}
        </section>
        <div class="dock">
          <button class="primary" id="fight" type="button">${state.mode === "story" ? (state.coop && state.seat === 0 ? "2人目に渡す" : "物語をはじめる") : "このデータで戦う"}</button>
          <button class="ghost" id="again" type="button">診断をやり直す</button>
        </div>
      </div>
      <div class="backdrop" id="backdrop" hidden></div>
      <div class="sheet" id="sheet" hidden></div>
    `;
  }

  function renderIntro() {
    const pages = [
      {
        kicker: "文化祭バトル",
        title: "動物バトル診断",
        body: `
          <p>6問答えると、動物になってその場で戦える。</p>
          <div class="chips">
            <span class="chip">ネコ科</span>
            <span class="chip">イヌ科</span>
            <span class="chip">大型</span>
            <span class="chip">鳥類</span>
            <span class="chip">爬虫類</span>
          </div>
          <p class="lead">同じ答えなら、いつも同じ結果になる。</p>
        `,
      },
      {
        kicker: "遊び方 1",
        title: "まず診断",
        body: `
          <ol class="steps">
            <li><span class="n">1</span>誕生月を選ぶ。月の技は、質問と関係なく月だけで決まる。</li>
            <li><span class="n">2</span>質問は6問。だいたい1分。</li>
            <li><span class="n">3</span>タイプ、ステータス、使える技が決まる。</li>
          </ol>
          <p class="lead">そのあと、一戦か、5連戦のストーリーを選ぶ。ストーリーは勝つたびに、同じ作品から4つ出て、1つ拾う。</p>
        `,
      },
      {
        kicker: "遊び方 2",
        title: "1対1で戦う",
        body: `
          <ol class="steps">
            <li><span class="n">1</span>ラウンドごとに、技を1つ選ぶ。</li>
            <li><span class="n">2</span>速いほうが先に動く。</li>
            <li><span class="n">3</span>相手のHPを0にしたら勝ち。</li>
          </ol>
          <p class="lead">効いている効果は、動物の下のアイコン。タップすると説明が出る。</p>
        `,
      },
      {
        kicker: "遊び方 3",
        title: "タイミングで止める",
        body: `
          <p>攻撃技はバーが動く。<strong>今だ！</strong>で止める。</p>
          <div class="qte demo" aria-hidden="true">
            <div class="good"></div>
            <div class="perfect"></div>
            <div class="core" style="left:49.2%;width:1.6%"></div>
            <div class="marker"></div>
          </div>
          <p class="qte-key">
            <b class="perfect">PERFECT</b> 赤い線<br>
            <b class="good">GOOD</b> 濃い緑　<b class="ok">success</b> 薄い緑　<b class="miss">miss</b> 外したとき
          </p>
          <p class="lead">赤い線が一番強い。細いので、かなりむずい。</p>
        `,
      },
    ];
    const page = pages[state.intro];
    const last = state.intro === pages.length - 1;
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="intro">
        <article class="intro-card">
          <p class="intro-kicker">${escapeHtml(page.kicker)}</p>
          <h1>${escapeHtml(page.title)}</h1>
          ${page.body}
        </article>
        <div class="dots">${pages.map((_, index) => `<i class="${index === state.intro ? "on" : ""}"></i>`).join("")}</div>
        <div class="dock">
          <button class="primary" id="intro-next" type="button">${last ? "はじめる" : "つぎへ"}</button>
          ${state.intro ? `<button class="ghost" id="intro-back" type="button">戻る</button>` : ""}
          ${last ? "" : `<button class="textbtn skip" id="intro-skip" type="button">スキップ</button>`}
        </div>
      </div>
    `;
    const blip = () => {
      if (window.Sfx) window.Sfx.select();
    };
    const openMode = () => {
      blip();
      state.phase = "mode";
      render();
    };
    document.getElementById("intro-next").onclick = () => {
      if (last) {
        openMode();
        return;
      }
      blip();
      state.intro += 1;
      render();
    };
    const back = document.getElementById("intro-back");
    if (back) {
      back.onclick = () => {
        blip();
        state.intro -= 1;
        render();
      };
    }
    const skip = document.getElementById("intro-skip");
    if (skip) skip.onclick = openMode;
  }

  function renderMode() {
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="intro">
        <article class="intro-card">
          <p class="intro-kicker">文化祭バトル</p>
          <h1>どう遊ぶ？</h1>
          <p>診断は同じ。戦いかたが違う。</p>
          <p class="lead">ストーリーはダンジョン。奥へ進んで、勝つたびに宝箱から1つ拾う。最後はラスボス。</p>
        </article>
        <div class="dock">
          <button class="choice mode-card" id="mode-free" type="button"><strong>一戦</strong><span class="detail">診断した動物で、相手と1回戦う。</span></button>
          <button class="choice mode-card" id="mode-story" type="button"><strong>ストーリー</strong><span class="detail">森の文化祭。ひとりでも、2人で並んででも進める。</span></button>
        </div>
      </div>
    `;
    const pick = (mode) => {
      if (window.Sfx) window.Sfx.select();
      state.mode = mode;
      state.coop = false;
      state.phase = "month";
      state.step = 0;
      state.answers = [];
      render();
    };
    document.getElementById("mode-free").onclick = () => pick("free");
    document.getElementById("mode-story").onclick = () => {
      if (window.Sfx) window.Sfx.select();
      state.mode = "story";
      state.phase = "party";
      render();
    };
  }

  function renderParty() {
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="intro">
        <article class="intro-card">
          <p class="intro-kicker">ストーリー</p>
          <h1>何人で進める？</h1>
          <p>2人のときは、2人そろって同じ勝負に出る。拾ったものは2人とも受け取る。負けたら、その物語は終わり。</p>
        </article>
        <div class="dock">
          <button class="choice mode-card" id="party-one" type="button"><strong>ひとり</strong><span class="detail">診断した動物だけで、奥へ進む。</span></button>
          <button class="choice mode-card" id="party-two" type="button"><strong>ふたり</strong><span class="detail">2人とも診断して、同じ勝負に出る。負けたら続きはない。</span></button>
        </div>
        <form class="pass-row" id="pass-form">
          <input id="pass-word" type="text" autocomplete="off" maxlength="16" placeholder="合言葉" aria-label="合言葉">
          <button class="ghost" type="submit">通す</button>
        </form>
        ${state.passNote ? `<p class="lead pass-note">${escapeHtml(state.passNote)}</p>` : ""}
      </div>
    `;
    const start = (coop) => {
      if (window.Sfx) window.Sfx.select();
      state.coop = coop;
      state.seat = 0;
      state.party = [];
      state.phase = "month";
      state.step = 0;
      state.answers = [];
      render();
    };
    document.getElementById("party-one").onclick = () => start(false);
    document.getElementById("party-two").onclick = () => start(true);
    document.getElementById("pass-form").onsubmit = (event) => {
      event.preventDefault();
      const word = document.getElementById("pass-word").value.trim();
      if (word === "うらぼす" || word === "ウラボス") {
        state.shortcut = "secret";
        state.passNote = "通った。診断のあと、裏ボスの前に出る。";
      } else {
        state.shortcut = "";
        state.passNote = word ? "合言葉が違う。" : "";
      }
      render();
    };
  }

  function renderPass() {
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="intro">
        <article class="intro-card">
          <p class="intro-kicker">ストーリー</p>
          <h1>2人目に渡して</h1>
          <p>1人目の診断は終わった。画面を渡して、2人目が答える。</p>
          <p class="lead">1人目の動物は、ここでは出さない。</p>
        </article>
        <div class="dock">
          <button class="primary" id="pass-next" type="button">2人目の診断をはじめる</button>
        </div>
      </div>
    `;
    document.getElementById("pass-next").onclick = () => {
      if (window.Sfx) window.Sfx.select();
      state.seat = 1;
      state.phase = "month";
      state.step = 0;
      state.answers = [];
      render();
    };
  }

  function blankRun() {
    return { atk: 0, def: 0, hp: 0, spd: 0, crit: 0, uses: {}, item: null, hpNow: null, fallen: false, orb: false, grit: false, light: false, bell: false, shroom: false, stone: false };
  }

  function secretReady() {
    if (state.bossRounds == null) return false;
    if (!state.coop) return state.bossRounds <= SECRET_LIMIT;
    return state.party.length > 1 && state.party.every((member) => !member.run.fallen);
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      const held = copy[index];
      copy[index] = copy[swap];
      copy[swap] = held;
    }
    return copy;
  }

  function foeOfType(type) {
    for (let tryCount = 0; tryCount < 80; tryCount += 1) {
      const answers = [0, 1, 2, 3, 4, 5].map(() => Math.floor(Math.random() * 4));
      if (judge(answers).type === type) {
        return { type, month: 1 + Math.floor(Math.random() * 12), answers, titleName: "" };
      }
    }
    for (let packed = 0; packed < 4096; packed += 1) {
      const answers = [0, 1, 2, 3, 4, 5].map((index) => (packed >> (index * 2)) & 3);
      if (judge(answers).type === type) {
        return { type, month: 1 + Math.floor(Math.random() * 12), answers, titleName: "" };
      }
    }
    return { type, month: 1, answers: [0, 0, 0, 0, 0, 0], titleName: "" };
  }

  function beginRun() {
    state.foes = shuffle(TYPE_ORDER).slice(0, 4).map((type) => foeOfType(type));
    if (state.coop) {
      state.party.forEach((member) => {
        member.run = blankRun();
      });
      state.run = state.party[0].run;
      state.answers = state.party[0].answers;
      state.month = state.party[0].month;
    } else {
      state.run = blankRun();
    }
    state.chapter = 0;
    state.line = 0;
    state.bossRounds = null;
    state.note = "";
    state.offer = [];
    if (state.shortcut === "secret") {
      state.shortcut = "";
      state.passNote = "";
      state.chapter = PLACES.length;
      state.bossRounds = 0;
      openReward("secret");
      return;
    }
    setScene("before");
  }

  function playerMax(run) {
    const fighter = window.AnimalBattle.makeFighter("あなた", judge(state.answers), state.month);
    let max = Math.round(fighter.maxHp * (1 + 0.2 * (run.hp || 0)));
    if (run.light) max += 30;
    if (run.shroom) max += 150;
    return max;
  }

  function hpPair() {
    const max = playerMax(state.run);
    const now = state.run.hpNow == null ? max : Math.max(1, Math.min(max, state.run.hpNow));
    return { now, max };
  }

  function runSummary() {
    const bits = [];
    if (state.run.atk) bits.push(`攻撃+${state.run.atk * 15}%`);
    if (state.run.def) bits.push(`守備+${state.run.def * 15}%`);
    if (state.run.hp) bits.push(`最大HP+${state.run.hp * 20}%`);
    if (state.run.spd) bits.push(`素早さ+${state.run.spd * 20}`);
    if (state.run.crit) bits.push(`超会心+${state.run.crit * 20}%`);
    if (state.run.light) bits.push("破邪の宝玉");
    if (state.run.bell) bits.push("呼び鈴");
    if (state.run.shroom) bits.push("でかキノコ");
    if (state.run.stone) bits.push("復活の石");
    if (state.run.grit) bits.push("一度持ちこたえる");
    Object.entries(state.run.uses).forEach(([name, count]) => bits.push(`${name}+${count}`));
    if (state.run.item) {
      const held = REWARDS.find((card) => card.id === state.run.item);
      if (held) bits.push(held.name);
    }
    const hp = hpPair();
    return `HP ${hp.now} / ${hp.max}${bits.length ? `　${bits.join("　")}` : ""}`;
  }

  function dungeonRows() {
    const rows = PLACES.map((place, index) => ({
      label: `${index + 1}F`,
      name: place.title,
      kind: "floor",
      index,
    }));
    rows.push({ label: "5F", name: BOSS.title, kind: "boss", index: PLACES.length });
    const secretLive = state.storyBeat === "secret-before"
      || state.storyBeat === "secret-after"
      || state.storyBeat === "secret-ending"
      || ((state.storyBeat === "reward" || state.storyBeat === "reward-pass") && state.rewardNext === "secret")
      || (state.storyBeat === "after" && state.chapter >= PLACES.length && secretReady());
    if (secretLive) rows.push({ label: "裏", name: SECRET.title, kind: "secret", index: PLACES.length + 1 });
    const here = state.chapter >= PLACES.length ? PLACES.length : state.chapter;
    const beat = state.storyBeat;
    rows.forEach((row) => {
      row.state = "later";
      row.mark = row.kind === "boss" ? "ボ" : row.kind === "secret" ? "裏" : String(row.index + 1);
    });
    const markDone = (upto) => {
      rows.forEach((row) => {
        if (row.index < upto) row.state = "done";
      });
    };
    const setRow = (index, nextState) => {
      const row = rows.find((item) => item.index === index);
      if (row) row.state = nextState;
    };
    if (beat === "gameover") {
      markDone(here);
      setRow(here, "now");
    } else if (beat === "before") {
      markDone(here);
      setRow(here, "now");
    } else if (beat === "secret-before") {
      markDone(PLACES.length + 1);
      setRow(PLACES.length + 1, "now");
    } else if (beat === "after" && state.chapter < PLACES.length) {
      markDone(here + 1);
      setRow(here + 1, "soon");
    } else if (beat === "after" && secretReady()) {
      markDone(PLACES.length + 1);
      setRow(PLACES.length + 1, "soon");
    } else if (beat === "after" || beat === "ending") {
      markDone(PLACES.length + 1);
    } else if (beat === "secret-after" || beat === "secret-ending") {
      rows.forEach((row) => { row.state = "done"; });
    } else if (beat === "reward" || beat === "reward-pass") {
      if (state.rewardNext === "secret") {
        markDone(PLACES.length + 1);
        setRow(PLACES.length + 1, "soon");
        rows.splice(rows.length - 1, 0, { label: "宝", name: "宝箱", kind: "chest", state: "now", mark: "宝", index: -1 });
      } else {
        markDone(here + 1);
        setRow(here + 1, "soon");
        rows.splice(here + 1, 0, { label: "宝", name: "宝箱", kind: "chest", state: "now", mark: "宝", index: -1 });
      }
    }
    rows.forEach((row) => {
      if (row.state === "done") row.mark = "✓";
    });
    return rows;
  }

  function dungeonHtml() {
    const rows = dungeonRows();
    const now = rows.find((row) => row.state === "now");
    const done = rows.filter((row) => row.state === "done");
    const here = now || done[done.length - 1] || null;
    const hereAt = here ? rows.indexOf(here) : -1;
    const ahead = hereAt < 0 ? [] : rows.slice(hereAt + 1);
    const passed = hereAt > 0 ? rows[hereAt - 1] : null;
    const beat = state.storyBeat;
    const kicker = beat === "gameover" ? "敗退"
      : beat === "ending" || beat === "secret-ending" || beat === "secret-after" ? "抜けた"
      : beat === "reward" || beat === "reward-pass" ? "宝箱"
      : beat === "after" ? "クリア"
      : "いま";
    const farLabel = ahead.length ? "奥" : "奥まで来た";
    const road = ahead.slice().reverse().map((row, index) => {
      const away = ahead.length - index;
      const nearest = index === ahead.length - 1;
      return `<div class="step ${nearest ? "next" : "far"} ${row.kind}" style="--away:${away}">
        <span>${escapeHtml(row.name)}</span>
        <span class="step-tag">${escapeHtml(row.label)}</span>
      </div>`;
    }).join("");
    const stand = here ? `<div class="step here ${here.kind}">
      <span class="step-kicker">${escapeHtml(kicker)}</span>
      <strong>${escapeHtml(here.name)}</strong>
      <span class="step-tag">${escapeHtml(here.label)}</span>
    </div>` : "";
    const back = passed && passed.state === "done" ? `<p class="depth-back">通った　${escapeHtml(passed.name)}</p>` : "";
    return `<section class="depth" aria-label="ダンジョン">
      <p class="depth-far">${farLabel}</p>
      <div class="depth-road">${road}${stand}</div>
      ${back}
    </section>`;
  }

  function foeNow() {
    if (state.storyBeat === "secret-before" || state.storyBeat === "secret-after") return SECRET;
    if (state.chapter >= PLACES.length) return BOSS;
    return state.foes[state.chapter];
  }

  function sceneMeta() {
    if (state.storyBeat === "gameover") return { kicker: "ストーリー", title: "敗退" };
    if (state.storyBeat === "ending" || state.storyBeat === "secret-ending") {
      return { kicker: "森の文化祭", title: "閉会" };
    }
    if (state.storyBeat === "secret-before" || state.storyBeat === "secret-after") return SECRET;
    if (state.chapter >= PLACES.length) return BOSS;
    return PLACES[state.chapter];
  }

  function castTypes() {
    if (state.coop && state.party.length) return state.party.map((member) => judge(member.answers).type);
    return [judge(state.answers).type];
  }

  function withMember(member, read) {
    const prev = { answers: state.answers, month: state.month, run: state.run };
    state.answers = member.answers;
    state.month = member.month;
    state.run = member.run;
    const value = read();
    state.answers = prev.answers;
    state.month = prev.month;
    state.run = prev.run;
    return value;
  }

  function linesFor(beat) {
    const note = state.note ? [{ who: "", text: state.note }] : [];
    state.note = "";
    const types = castTypes();
    const playerType = types[0];
    const crown = state.coop ? "今年の大舞台は、2人のものだ。" : `今年の大舞台は、${playerType}のあなたのものだ。`;
    if (beat === "gameover") {
      return [
        { who: "", text: "2人とも、倒れてしまった。" },
        { who: "", text: "この物語は、ここまで。続きはできない。" },
      ];
    }
    if (beat === "ending") {
      return note.concat([
        { who: "", text: "5つの勝負を、勝ち抜けた。" },
        { who: "", text: "ゴウは舞台の端に座っている。" },
        { who: "", text: crown },
        { who: "", text: state.coop ? "2人とも一度も倒れていなければ、閉園のあとに何かいた。" : "もう少し早く舞台を終わらせていれば、閉園のあとに何かいた。" },
      ]);
    }
    if (beat === "secret-ending") {
      return note.concat([
        { who: "", text: "5つの勝負と、そのあとまで勝ち抜けた。" },
        { who: "代表", text: "・・・" },
        { who: "", text: state.coop ? "今年の大舞台も、そのあとも、2人のものだ。" : `今年の大舞台も、そのあとも、${playerType}のあなたのものだ。` },
      ]);
    }
    if (beat === "secret-before") {
      const lines = [
        { who: "", text: "閉園のあと、舞台の裏に人影があった。" },
        { who: "代表", text: "・・・" },
      ];
      return note.concat(lines);
    }
    if (beat === "secret-after") {
      return note.concat([
        { who: "代表", text: "・・・" },
        { who: "", text: "代表は手を振って、暗がりへ戻った。" },
      ]);
    }
    const foe = foeNow();
    if (beat === "after" && state.chapter >= PLACES.length) {
      return note.concat([
        { who: "祭りの主・ゴウ", text: "……通したな。" },
        { who: "", text: "大舞台は、静かになった。" },
      ]);
    }
    if (beat === "before" && state.chapter >= PLACES.length) {
      const lines = [
        { who: "", text: "大舞台。ここまでの傷は、残ったまま。" },
        { who: "祭りの主・ゴウ", text: "ここが大舞台。僕は先には動かない。" },
        { who: "祭りの主・ゴウ", text: "そのぶん、次の一撃は重い。" },
      ];
      if (types.includes(BOSS.type)) lines.push({ who: BOSS.speaker, text: state.coop ? `同じ${BOSS.type}が、いるな。` : BOSS.same });
      return note.concat(lines);
    }
    const place = PLACES[state.chapter];
    const lines = (beat === "after" ? place.close(foe) : place.open(foe)).slice();
    if (beat === "before" && types.includes(foe.type)) {
      lines.push({ who: foe.type, text: state.coop ? `同じ${foe.type}が、いるな。` : `同じ${foe.type}同士だ。` });
    }
    return note.concat(lines);
  }

  function setScene(beat) {
    state.storyBeat = beat;
    state.line = 0;
    state.script = linesFor(beat);
    render();
  }

  function openReward(next) {
    if (next === "secret") {
      state.offerFrom = "閉園のあと";
      state.offer = shuffle(SECRET_REWARDS);
    } else {
      const series = [];
      REWARDS.forEach((card) => {
        if (!series.includes(card.from)) series.push(card.from);
      });
      const from = series[Math.floor(Math.random() * series.length)];
      state.offerFrom = from;
      state.offer = shuffle(REWARDS.filter((card) => card.from === from)).slice(0, 4);
    }
    state.rewardNext = next;
    state.rewardSeat = 0;
    state.rewardPicks = 0;
    state.pickedName = "";
    state.storyBeat = "reward";
    state.line = 0;
    state.script = [];
    render();
  }

  function growHp() {
    const before = playerMax(state.run);
    state.run.hp += 1;
    const after = playerMax(state.run);
    if (state.run.hpNow != null) state.run.hpNow = Math.min(after, state.run.hpNow + (after - before));
  }

  function healNow(ratio) {
    const max = playerMax(state.run);
    const now = state.run.hpNow == null ? max : Math.max(0, Math.min(max, state.run.hpNow));
    state.run.hpNow = Math.min(max, now + Math.max(1, Math.round(max * ratio)));
  }

  function applyReward(card) {
    if (card.id === "light") {
      state.run.light = true;
      state.run.hpNow = playerMax(state.run);
      return "攻撃と守備と素早さとHPが30上がった。";
    }
    if (card.id === "bell") {
      state.run.bell = true;
      state.run.hpNow = playerMax(state.run);
      return "呼び鈴を持った。";
    }
    if (card.id === "shroom") {
      state.run.shroom = true;
      state.run.hpNow = playerMax(state.run);
      return "体が大きくなり、でかキノコを持った。";
    }
    if (card.id === "stone") {
      state.run.stone = true;
      state.run.hpNow = playerMax(state.run);
      return "復活の石を持った。";
    }
    if (card.id === "atk" || card.id === "candy") state.run.atk += 1;
    if (card.id === "def" || card.id === "candy") state.run.def += 1;
    if (card.id === "hp" || card.id === "candy") growHp();
    if (card.id === "spd") state.run.spd += 1;
    if (card.id === "max" || card.id === "elixir") {
      judge(state.answers).skills.forEach((name) => {
        state.run.uses[name] = (state.run.uses[name] || 0) + 1;
      });
    }
    const held = ["guard", "kiai", "shield", "invuln", "mic", "oneup", "k1up", "phoenix", "fairy"];
    if (held.includes(card.id)) state.run.item = card.id;
    if (card.id === "potion" || card.id === "donut") healNow(0.4);
    if (card.id === "hipotion" || card.id === "steak") healNow(0.8);
    if (card.id === "snack" || card.id === "elixir") state.run.hpNow = playerMax(state.run);
    if (card.id === "max") return "質問技が全部、回数+1。";
    if (card.id === "elixir") return "HPが全回復し、質問技が全部、回数+1。";
    return "";
  }

  function takeReward(card) {
    if (state.rewardNext === "secret" && !state.coop) {
      const note = applyReward(card);
      if ((state.rewardPicks || 0) === 0) {
        state.pickedName = card.name;
        state.note = note || "";
        state.rewardPicks = 1;
        state.offer = state.offer.filter((item) => item.id !== card.id);
        render();
        return;
      }
      state.note = [state.note, note].filter(Boolean).join("");
      setScene("secret-before");
      return;
    }
    if (state.rewardNext === "secret" && state.coop) {
      const note = withMember(state.party[state.rewardSeat], () => applyReward(card));
      const line = note ? `${state.rewardSeat + 1}人目、${note}` : "";
      if (state.rewardSeat === 0) {
        state.pickedName = card.name;
        state.note = line;
        state.rewardSeat = 1;
        state.storyBeat = "reward-pass";
        render();
        return;
      }
      state.note = [state.note, line].filter(Boolean).join("");
      setScene("secret-before");
      return;
    }
    if (state.coop) {
      const notes = [];
      state.party.forEach((member, index) => {
        const note = withMember(member, () => applyReward(card));
        if (note) notes.push(`${index + 1}人目、${note}`);
      });
      if (notes.length) state.note = notes.join("");
    } else {
      const note = applyReward(card);
      if (note) state.note = note;
    }
    if (state.rewardNext === "secret") {
      setScene("secret-before");
      return;
    }
    state.chapter += 1;
    setScene("before");
  }

  function memberLine(member, index) {
    const type = judge(member.answers).type;
    const line = withMember(member, runSummary);
    return `${index + 1}人目・${type}　${line}`;
  }

  function copyRun(run) {
    return {
      atk: run.atk,
      def: run.def,
      hp: run.hp,
      spd: run.spd || 0,
      crit: run.crit || 0,
      uses: { ...run.uses },
      item: run.item,
      hpNow: run.hpNow,
      orb: !!run.orb,
      grit: !!run.grit,
      light: !!run.light,
      bell: !!run.bell,
      shroom: !!run.shroom,
      stone: !!run.stone,
    };
  }

  function keepHp(member, fighter) {
    let ratio = 0.15;
    if (fighter.hp <= 0 && fighter.oneUp) ratio = 1;
    else if (fighter.hp <= 0 && fighter.fairy) ratio = 0.5;
    const heal = Math.round(fighter.maxHp * ratio);
    member.run.hpNow = Math.min(fighter.maxHp, Math.max(0, fighter.hp) + heal);
  }

  function startStoryBattle(foe, facing) {
    const members = state.coop ? state.party : [{ answers: state.answers, month: state.month, run: state.run }];
    const snaps = members.map((member) => ({ hpNow: member.run.hpNow, item: member.run.item }));
    const runs = members.map((member) => copyRun(member.run));
    members.forEach((member) => { member.run.item = null; });
    if (!state.coop) state.run = members[0].run;
    const setup = {
      answers: foe.answers,
      month: foe.month,
      title: foe.titleName,
      run: runs[0],
      noContinue: state.coop,
      rep: facing === "secret",
      onWin(round, player, ally) {
        if (player.fallen) members[0].run.fallen = true;
        if (ally && ally.fallen && members[1]) members[1].run.fallen = true;
        keepHp(members[0], player);
        if (ally && members[1]) keepHp(members[1], ally);
        state.phase = "story";
        if (facing === "boss") state.bossRounds = round;
        setScene(facing === "secret" ? "secret-after" : "after");
      },
      onLose() {
        state.phase = "story";
        setScene("gameover");
      },
      onLeave() {
        members.forEach((member, index) => {
          member.run.hpNow = snaps[index].hpNow;
          member.run.item = snaps[index].item;
        });
        state.phase = "story";
        setScene(facing === "secret" ? "secret-before" : "before");
      },
    };
    if (state.coop && members[1]) {
      setup.ally = { result: judge(members[1].answers), month: members[1].month, run: runs[1] };
    }
    window.AnimalBattle.start(judge(members[0].answers), members[0].month, setup);
  }

  function renderStory() {
    if (state.storyBeat === "reward") {
      renderReward();
      return;
    }
    if (state.storyBeat === "reward-pass") {
      renderRewardPass();
      return;
    }
    const lines = state.script.length ? state.script : [{ who: "", text: "" }];
    const line = lines[Math.min(state.line, lines.length - 1)];
    const last = state.line >= lines.length - 1;
    const meta = sceneMeta();
    const ending = state.storyBeat === "ending" || state.storyBeat === "secret-ending" || state.storyBeat === "gameover";
    let label = "つぎへ";
    if (last && ending) label = "";
    else if (last && (state.storyBeat === "before" || state.storyBeat === "secret-before")) label = "バトル";
    else if (last && state.storyBeat === "after" && state.chapter < PLACES.length) label = "奥へ進む";
    else if (last && state.storyBeat === "after" && secretReady()) label = "裏へ";
    else if (last && (state.storyBeat === "after" || state.storyBeat === "secret-after")) label = "閉会へ";
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="intro">
        ${dungeonHtml()}
        <article class="intro-card">
          <p class="intro-kicker">${escapeHtml(meta.kicker)}</p>
          <h1>${escapeHtml(meta.title)}</h1>
          ${state.storyBeat === "before" || state.storyBeat === "secret-before" ? (state.coop ? state.party.map((member, index) => `<p class="lead">${escapeHtml(memberLine(member, index))}</p>`).join("") : `<p class="lead">${escapeHtml(runSummary())}</p>`) : ""}
          ${line.who ? `<p class="speaker">${escapeHtml(line.who)}</p>` : ""}
          <p class="story-line">${escapeHtml(line.text)}</p>
        </article>
        <div class="dock">
          ${label ? `<button class="primary" id="story-next" type="button">${escapeHtml(label)}</button>` : ""}
          ${last && ending ? `<button class="primary" id="story-again" type="button">${state.coop ? "もう一度この2人で" : "もう一度この動物で"}</button><button class="ghost" id="story-mode" type="button">モード選択へ</button>` : ""}
        </div>
      </div>
    `;
    const blip = () => {
      if (window.Sfx) window.Sfx.select();
    };
    const next = document.getElementById("story-next");
    if (next) {
      next.onclick = () => {
        blip();
        if (!last) {
          state.line += 1;
          render();
          return;
        }
        if (state.storyBeat === "before") {
          const foe = state.chapter >= PLACES.length ? BOSS : state.foes[state.chapter];
          const facing = state.chapter >= PLACES.length ? "boss" : "chapter";
          startStoryBattle(foe, facing);
          return;
        }
        if (state.storyBeat === "secret-before") {
          startStoryBattle(SECRET, "secret");
          return;
        }
        if (state.storyBeat === "after" && state.chapter < PLACES.length) {
          openReward("next");
          return;
        }
        if (state.storyBeat === "after" && secretReady()) {
          openReward("secret");
          return;
        }
        if (state.storyBeat === "secret-after") {
          setScene("secret-ending");
          return;
        }
        setScene("ending");
      };
    }
    const again = document.getElementById("story-again");
    if (again) again.onclick = () => { blip(); beginRun(); };
    const back = document.getElementById("story-mode");
    if (back) {
      back.onclick = () => {
        blip();
        state.phase = "mode";
        render();
      };
    }
  }

  function renderRewardPass() {
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="intro">
        ${dungeonHtml()}
        <article class="intro-card">
          <p class="intro-kicker">閉園のあと</p>
          <h1>2人目に渡して</h1>
          <p>1人目は${escapeHtml(state.pickedName)}を持った。</p>
          <p class="lead">2人目は、同じものでも、別のものでも選べる。</p>
        </article>
        <div class="dock">
          <button class="primary" id="reward-pass" type="button">2人目が選ぶ</button>
        </div>
      </div>
    `;
    document.getElementById("reward-pass").onclick = () => {
      if (window.Sfx) window.Sfx.select();
      state.storyBeat = "reward";
      render();
    };
  }

  function renderReward() {
    const app = document.getElementById("app");
    const secret = state.rewardNext === "secret";
    const seat = state.rewardSeat || 0;
    const picks = state.rewardPicks || 0;
    const title = !secret ? "4つのうち、1つ"
      : state.coop ? `${seat + 1}人目が、1つ`
      : picks === 0 ? "最終決戦の品から、2つ" : "もう1つ";
    const secretLead = !secret ? "" : state.coop
      ? (seat === 0 ? "最終決戦の品。2人とも、1つずつ選ぶ。" : `1人目は${state.pickedName}。2人目も、1つ選ぶ。`)
      : picks === 0 ? "1人なら、2つ持てる。" : `1つ目は${state.pickedName}。もう1つ選ぶ。`;
    const sub = secret && state.coop ? "" : (state.coop ? "選んだものは、2人とも受け取る。" : runSummary());
    app.innerHTML = `
      <div class="intro">
        ${dungeonHtml()}
        <article class="intro-card">
          <p class="intro-kicker">${escapeHtml(state.offerFrom || "宝箱")}</p>
          <h1>${escapeHtml(title)}</h1>
          ${secretLead ? `<p class="lead">${escapeHtml(secretLead)}</p>` : ""}
          ${sub ? `<p class="lead">${escapeHtml(sub)}</p>` : ""}
          ${state.coop ? state.party.map((member, index) => `<p class="lead">${escapeHtml(memberLine(member, index))}</p>`).join("") : ""}
        </article>
        <div class="reward-list">
          ${state.offer.map((card, index) => `<button class="choice mode-card" type="button" data-reward="${index}"><strong>${escapeHtml(card.name)}</strong><span class="detail">${escapeHtml(card.detail)}</span></button>`).join("")}
        </div>
      </div>
    `;
    document.querySelectorAll("[data-reward]").forEach((button) => {
      button.onclick = () => {
        if (window.Sfx) window.Sfx.select();
        takeReward(state.offer[Number(button.dataset.reward)]);
      };
    });
  }

  function renderMonth() {
    const app = document.getElementById("app");
    app.innerHTML = `
      <h1>${state.coop ? `${state.seat + 1}人目の診断` : "動物バトル診断"}</h1>
      <p class="lead">誕生月の技は質問と関係なく、月だけで決まります。</p>
      <p class="prompt">${state.coop ? `${state.seat + 1}人目の誕生月は？` : "誕生月は？"}</p>
      <div class="months" id="months"></div>
      <button class="ghost" id="mode-back" type="button">モード選択に戻る</button>
    `;
    const months = document.getElementById("months");
    MONTH_SKILLS.forEach((skill, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice";
      button.textContent = `${index + 1}月`;
      button.onclick = () => {
        state.month = index + 1;
        state.phase = "quiz";
        state.step = 0;
        state.answers = [];
        render();
      };
      months.appendChild(button);
    });
    document.getElementById("mode-back").onclick = () => {
      state.phase = "mode";
      state.step = 0;
      state.answers = [];
      render();
    };
  }

  function render() {
    const app = document.getElementById("app");
    if (!app) return;
    if (state.phase === "intro") {
      renderIntro();
      return;
    }
    if (state.phase === "mode") {
      renderMode();
      return;
    }
    if (state.phase === "party") {
      renderParty();
      return;
    }
    if (state.phase === "pass") {
      renderPass();
      return;
    }
    if (state.phase === "month") {
      renderMonth();
      return;
    }
    if (state.phase === "story") {
      renderStory();
      return;
    }
    if (state.step >= QUESTIONS.length) {
      app.innerHTML = resultHtml(judge(state.answers));
      document.getElementById("again").onclick = () => {
        state.phase = "month";
        state.step = 0;
        state.answers = [];
        render();
      };
      document.getElementById("fight").onclick = () => {
        if (state.mode === "story" && state.coop && state.seat === 0) {
          state.party[0] = { answers: state.answers.slice(), month: state.month, run: blankRun() };
          state.phase = "pass";
          render();
          return;
        }
        if (state.mode === "story" && state.coop) {
          state.party[1] = { answers: state.answers.slice(), month: state.month, run: blankRun() };
          state.phase = "story";
          beginRun();
          return;
        }
        if (state.mode === "story") {
          state.phase = "story";
          beginRun();
          return;
        }
        window.AnimalBattle.start(judge(state.answers), state.month);
      };
      document.querySelectorAll("[data-skill-name]").forEach((button) => {
        button.onclick = () => {
          const name = button.dataset.skillName;
          const typed = TYPE_SKILLS[judge(state.answers).type];
          const monthSkill = MONTH_SKILLS[state.month - 1];
          let body = `回数${monthSkill.uses}。${monthSkill.main}／${monthSkill.sub}`;
          if (typed && typed.name === name) body = `回数${typed.uses}。${typed.main}／${typed.sub}`;
          else if (monthSkill.name !== name) body = skillSpec(name);
          showSheet(`
            <h2>${escapeHtml(name)}</h2>
            <p>${withMissColor(body)}</p>
            <button class="primary" data-close type="button">閉じる</button>
          `);
        };
      });
      return;
    }
    const question = QUESTIONS[state.step];
    app.innerHTML = `
      <h1>${state.coop ? `${state.seat + 1}人目の診断` : "動物バトル診断"}</h1>
      <p class="lead">${state.coop ? `${state.seat + 1}人目。6問、だいたい1分。` : "6問、だいたい1分。同じ答えなら、いつも同じ結果になります。"}</p>
      <p class="progress">${state.step + 1} / ${QUESTIONS.length}</p>
      <p class="prompt">${escapeHtml(question.prompt)}</p>
      <div id="choices"></div>
      <button class="ghost" id="back" type="button">戻る</button>
    `;
    const choices = document.getElementById("choices");
    question.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice";
      button.innerHTML = `<strong><span class="mark">${MARKS[index]}</span>${escapeHtml(option.label)}</strong>`;
      button.onclick = () => {
        state.answers[state.step] = index;
        state.step += 1;
        render();
      };
      choices.appendChild(button);
    });
    document.getElementById("back").onclick = () => {
      if (state.step === 0) {
        state.phase = "month";
      } else {
        state.step -= 1;
      }
      render();
    };
  }

  render();
}
