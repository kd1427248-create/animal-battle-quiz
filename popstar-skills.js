(function () {
// ポップスター大ボス用スキル定義（PDF仕様名）
function popSkill(id, name, target, effectExtra) {
  return {
    id: `pop_${id}`,
    name,
    kind: "skill",
    mp: 0,
    target,
    effect: { popstar: id, ...effectExtra },
  };
}

const POPSTAR_SKILL_DEFS = {
  sliding: popSkill("sliding", "スライディング", "one", { power: 0.45 }),
  dive: popSkill("dive", "急降下", "one", { power: 0.5 }),
  airShot: popSkill("airShot", "空気弾", "one", { power: 0.4 }),
  crash: popSkill("crash", "クラッシュ", "all", { power: 0, fixedAll: 999, kirbyReset: true }),
  tategiri: popSkill("tategiri", "たてぎり", "one", { power: 0.55 }),
  swordHundred: popSkill("swordHundred", "たてぎり→百れつぎり→きめぎり", "random", { combo: { hits: 7, power: 0.35, opening: 0.6, finale: 1.2 } }),
  spinningSword: popSkill("spinningSword", "スピニングソード", "all", { power: 0.75 }),
  chopping: popSkill("chopping", "チョッピング", "one", { power: 0.85 }),
  stabDown: popSkill("stabDown", "したづき", "one", { power: 0.9, ignoreDef: true }),
  meteorEnd: popSkill("meteorEnd", "きり上げスラッシュ〜メテオエンド", "one", { combo: { hits: 2, power: 0.95, crit: 0.3, locked: true } }),
  kaitengiri: popSkill("kaitengiri", "回てんぎり", "all", { charge: 1, combo: { hits: 3, power: 0.8, crit: 0.5, all: true } }),
  beamWhip: popSkill("beamWhip", "ビームウィップ", "all", { power: 0.5, element: "bolt" }),
  cycleBeam: popSkill("cycleBeam", "サイクルビーム", "one", { power: 0.8, paralyze: 1, element: "bolt" }),
  beamGatling: popSkill("beamGatling", "ビームマシンガン", "random", { combo: { hits: 9, power: 0.15, crit: 0.5, element: "bolt" } }),
  hadoBeam: popSkill("hadoBeam", "はどうビーム", "all", { power: 1.05, atkDown: 0.2, rounds: 3, element: "bolt" }),
  captureBeam: popSkill("captureBeam", "キャプチャービーム", "one", { sleep: 1, element: "bolt" }),
  cutterBoomerang: popSkill("cutterBoomerang", "カッターブーメラン", "all", { power: 0.55 }),
  hyperBoomerang: popSkill("hyperBoomerang", "ハイパーブーメラン", "all", { charge: 1, power: 1.15, defDown: 0.2, rounds: 3 }),
  dashCutter: popSkill("dashCutter", "ダッシュカッターぎり", "one", { power: 0.8, defDown: 0.15, rounds: 2 }),
  cutterRush: popSkill("cutterRush", "カッターめったぎり〜ファイナルカッター", "random", { combo: { hits: 11, power: 0.25, finale: 1.3 } }),
  karatake: popSkill("karatake", "からたけわり", "one", { power: 0.95, crit: 0.4, atkDown: 0.2, rounds: 3 }),
  starWarrior: popSkill("starWarrior", "星の戦士", "self", { opener: true }),
  courageGuide: popSkill("courageGuide", "勇気のしるべ", "self", { opener: true }),
  pinkDevil: popSkill("pinkDevil", "ピンクの悪魔", "self", { opener: true }),
  starRod: popSkill("starRod", "スターロッドを振りかざす", "random", { drama: true, combo: { hits: 10, power: 0.85 } }),
  ultraSword: popSkill("ultraSword", "ウルトラソード！！", "one", { drama: true, fixed: 9999 }),
  robobot: popSkill("robobot", "プラネットバスター", "all", { drama: true, dramaLines: ["ロボボアーマーを呼んだ", "最終決戦艦 ハルバードモード", "プラネットバスター"], power: 100 }),
  hydra: popSkill("hydra", "ハイドラとドラグーンを呼んだ", "one", { drama: true, hydra: true }),
  megaCannon: popSkill("megaCannon", "メガキャノン！", "one", { drama: true, pierceGuard: true, fixed: 9999 }),
  quickSpin: popSkill("quickSpin", "神速のクイックスピン！", "random", { drama: true, combo: { hits: 3, power: 10 } }),
  ribbon: popSkill("ribbon", "リボンクリスタルが光り輝く", "all", { drama: true, power: 10, dispel: true }),
  bigBang: popSkill("bigBang", "ビックバン！！！！", "one", { drama: true, instakill: true }),
  masterCopy: popSkill("masterCopy", "ファイナルソード！", "one", { drama: true, masterScript: true }),
  tripleStar: popSkill("tripleStar", "トリプルスター！", "random", { drama: true, combo: { hits: 3, fixedEach: 999 } }),
  rainbowSword: popSkill("rainbowSword", "虹の剣を振りかざした！", "all", { drama: true, reviveFoes: true }),
  knightCode: popSkill("knightCode", "騎士道", "all", { opener: true, onPlayers: true }),
  condor: popSkill("condor", "メタコンドルダイブ", "all", { power: 0.8, defDown: 0.2, rounds: 3 }),
  gCounter: popSkill("gCounter", "ギャラクティックカウンター", "self", { galacticCounter: true }),
  metaTriple: popSkill("metaTriple", "メタ3連ぎり", "random", { combo: { hits: 3, power: 0.7 } }),
  metaSpin: popSkill("metaSpin", "メタ回転ぎり", "all", { power: 0.85 }),
  halberdShot: popSkill("halberdShot", "戦艦ハルバードの砲撃！", "all", { combo: { hits: 3, power: 0.55, all: true }, metaKnights: 3 }),
  machTornado: popSkill("machTornado", "マッハトルネイド", "all", { power: 1.25, atkUp: 0.3, rounds: 99, galacticCounter: true }),
  dignity: popSkill("dignity", "いきなり大王の威厳", "self", { opener: true }),
  hammerSkill: popSkill("hammerSkill", "自慢のハンマー捌き", "self", { opener: true }),
  superJump: popSkill("superJump", "スーパーデデデジャンプ", "self", { jumpWindup: true }),
  oniHammer: popSkill("oniHammer", "鬼殺しデデデハンマー", "one", { power: 1.4, burn: true }),
  hammerThrow: popSkill("hammerThrow", "デデデハンマー投げ", "all", { power: 0.75, trip: 0.3 }),
  coverAll: popSkill("coverAll", "庇う", "self", { dededeCover: 3 }),
  grindHammer: popSkill("grindHammer", "グリグリハンマー", "one", { combo: { hits: 3, power: 0.4 } }),
  stumble: popSkill("stumble", "ズッこけ", "all", { confuse: 0.55 }),
  maskedDedede: popSkill("maskedDedede", "マスクドデデデに変身", "self", { maskTransform: true }),
  newHammerCombo: popSkill("newHammerCombo", "ニューデデデハンマーコンボ", "random", { combo: { hits: 10, power: 0.45, levelDown: true, finale: 1.5, finaleParalyze: true } }),
  braveBandana: popSkill("braveBandana", "勇気のバンダナ", "self", { opener: true }),
  abilitySeed: popSkill("abilitySeed", "能力のもと", "self", { kirbyCopy: true }),
  earthStamp: popSkill("earthStamp", "大地づき", "all", { power: 0.55, trip: 0.15 }),
  wadCopter: popSkill("wadCopter", "ワドコプター", "self", { wadCopter: 3 }),
  cheerPom: popSkill("cheerPom", "おうえんぽんぽん", "allies", { foeBuff: true, atkUp: 0.3, crit: 0.25, rounds: 3, recast: true }),
  energyDrink: popSkill("energyDrink", "みんなに元気ドリンク", "allies", { foeHeal: 0.25 }),
  invincibleCandy: popSkill("invincibleCandy", "無敵キャンディ", "ally", { invincible: 3 }),
  maximTomato: popSkill("maximTomato", "みんなにマキシムトマト", "allies", { foeFullHeal: true, kirbySerious: true }),
};

function popstarSkill(id) {
  const def = POPSTAR_SKILL_DEFS[id];
  if (!def) return { id: "pop_unknown", name: "？？？", mp: 0, target: "one", kind: "skill", effect: { power: 0.5 } };
  return { ...def, effect: { ...(def.effect || {}) } };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { POPSTAR_SKILL_DEFS, popstarSkill };
}
if (typeof window !== "undefined") {
  window.PopstarSkills = { POPSTAR_SKILL_DEFS, popstarSkill };
}})();
