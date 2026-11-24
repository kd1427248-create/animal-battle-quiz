const R = window.AdventureRules;
const B = window.JobBook;
if (!R || !B) {
  document.getElementById("app").innerHTML = '<section class="window"><h1>読み込み失敗</h1><p>data.js と adventure-rules.js が読めていません。</p><p>Shift+再読み込みするか、8771 で adventure.html を開いてください。</p></section>';
  throw new Error("AdventureRules missing");
}
const KEY = "dq-journey-save";

const app = document.getElementById("app");
const state = {
  save: load(),
  screen: "boot",
  log: [],
  battle: null,
  loot: [],
  picking: null,
};

function loadFromObject(save) {
  if (!save) save = R.blankSave("ゆうしゃ");
  if (!save.id) save.id = crypto.randomUUID ? crypto.randomUUID() : `p${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  if (!Array.isArray(save.gear)) save.gear = [];
  if (save.gear.includes("demiseSword")) {
    save.gear = save.gear.filter((id) => id !== "demiseSword");
    const magic = (B.WEAPONS.dawnDagger.jobs || []).includes(save.job);
    const next = magic ? "dawnDagger" : "starless";
    if (!save.gear.includes(next)) save.gear.push(next);
    if (save.weapon === "demiseSword") save.weapon = next;
  }
  if (!Array.isArray(save.cleared)) save.cleared = [];
  if (!Array.isArray(save.diffCleared)) save.diffCleared = [];
  if (!save.diffCleared.length && (save.cleared || []).length) save.diffCleared = [1];
  if (!save.difficulty) save.difficulty = 1;
  if (!save.jobLevels) save.jobLevels = {};
  if (!save.materials || typeof save.materials !== "object") save.materials = {};
  R.rememberLevel(save);
  ["weapon", "armor"].forEach((slot) => {
    if (save[slot] && !save.gear.includes(save[slot])) save.gear.push(save[slot]);
    const item = save[slot] && B.WEAPONS[save[slot]];
    const itemSlot = item && (item.slot === "armor" ? "armor" : "weapon");
    if (!item || itemSlot !== slot || (save.job && item.jobs && !item.jobs.includes(save.job))) save[slot] = null;
  });
  return save;
}

function load() {
  let save;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) save = JSON.parse(raw);
  } catch (error) { /* 新しいセーブを作る */ }
  return loadFromObject(save);
}

function persist() {
  localStorage.setItem(KEY, JSON.stringify(state.save));
}

function keepGear(save, id) {
  if (!save.gear) save.gear = [];
  if (!save.gear.includes(id)) save.gear.push(id);
}

function glyph(mark, tone) {
  return `<span class="ico${tone ? ` ${tone}` : ""}" aria-hidden="true">${mark}</span>`;
}

const GEAR_ICON = {
  stick: "🪵", knife: "🗡️", staff: "🪄", clothes: "👕", leather: "🦺",
  copper: "⚔️", claw: "✋", fan: "🪭", ironArmor: "🛡️", poisonClaw: "☠️",
  robe: "🥋", steel: "⚔️", evade: "💨", assassin: "🗡️", thunder: "⚡",
  shell: "🐚", starFan: "✨", magicArmor: "🔮", fireSword: "🔥", dragonClaw: "🐉",
  steelArmor: "🛡️", holy: "✨", dragonArmor: "🐉",   king: "👑", galaxia: "⚔️", popStarHammer: "🔨",
  demonSword: "😈", dragonSlayer: "🐉", nightDagger: "🌑", sageStaff: "📖", foxFan: "🦊",
  ryuouArmor: "🐲", archRobe: "🧙", windRobe: "🍃",
  magicKnife: "🔮", guardCloth: "🥋", iceStaff: "❄️", sleepKnife: "💤",
  lightStaff: "🌟", blessRobe: "🤍", swiftKnife: "🦅", lightCloth: "🪶",
  boltSword: "⚡", numbClaw: "⚡", mendStaff: "💚", cape: "🧥",
  goldFan: "🪙", glitter: "✨", dragonSword: "🐲", dragonRobe: "🐉",
  demonDagger: "😈", demonArmor: "😈", zomaSword: "🗡️", ruinStaff: "💀",
  metalCoat: "🪙", shadowCoat: "🌑", legendClaw: "✋",
};

const MAT_ICON = {
  slimeGel: "🟢", wing: "🪶", ectoplasm: "👻", iron: "⚙️", scale: "🐉",
  orb: "🔮", fang: "🦷", cloth: "🧵", shell: "🐚", jewel: "💎",
  bone: "🦴", silk: "🎀", ore: "⛏️", charm: "🔖", demon: "😈",
  speedSeed: "🌱", xpPlant: "🌿", scentBag: "👜", fleeRing: "💍", holyKnife: "🗡️", sageWater: "💧", goldBeak: "🟡",
  popStar: "⭐",
};

const SKILL_ICON = {
  attack: "⚔️", rengeki: "👊", breath: "🔥", majingiri: "⚔️", bunmawashi: "🌀",
  kabutowari: "🛡️", seikenzuki: "👊", mawashigeri: "🦵", kiaitame: "💪",
  mera: "🔥", hyado: "❄️", io: "💥", rahoru: "💤", hoimi: "💚", sukara: "🛡️",
  kiarii: "✨", zaoraru: "💫", nusumu: "👜", shinobiashi: "👟", dokubari: "☠️",
  pafupafu: "💗", fushiginaodori: "🎵", parupunte: "❓", yaibakudaki: "⚔️",
  samidaregiri: "🌧️", sutemi: "💢", hayabusagiri: "⚡", behoimi: "💚", merami: "🔥",
  iora: "💥", ionazun: "💥", iogrande: "☄️", dorukuma: "🌑", dorumadon: "🖤", rukanii: "📉", bomios: "📉", dokukiri: "☠️",
  explode: "💣", flee: "💨", maryokukakusei: "✨", viperfang: "🦷", tigerclaw: "✋",
  dualcutter: "⚔️", fubaha: "🛡️", nemuriuchi: "💤", begirama: "🔥", baishion: "💪",
  mppasser: "🔵", kabau: "🛡️", musclepose: "💪", encore: "🔁", hassledance: "💃",
  charismabarrier: "🛡️", rasenuchi: "🌀", houkou: "📣", daibougyo: "🛡️",
  onomatsuri: "🪓", warcry: "📣",
  kiaidame: "💪", tensionboost: "🔥", gigaslash: "⚡",
  shinrabansho: "🌿", meragaia: "🔥", medoroa: "⚡", gigacross: "🌈",
  ouenboost: "📣", miracle: "💫", godbakuretsu: "👊", kingtime: "👑",
  nusumu2: "👜", chemibomb: "🧪", infinityedge: "🗡️",
  zenshin: "💥", burstrainbow: "🌈", madante: "🌌", maelstrom: "🌊",
  paladinguard: "🛡️", grandcross: "✝️", pantherrush: "🐆",
};

const GEAR_LOOK = [
  [/ギャラクシア/, "⚔️", "holy"],
  [/星のつち/, "🔨", "blade"],
  [/誕生と終焉/, "🗡️", "magic"],
  [/星なき夜/, "⚔️", "holy"],
  [/ルビス|王者の剣/, "⚔️", "holy"],
  [/杖|つえ|スタッフ/, "🪄", "magic"],
  [/槍|やり|ランス|スピア|フォーク/, "🔱", "blade"],
  [/斧|オノ|アックス|がま/, "🪓", "blade"],
  [/ブーメラン|月輪|スワロー|ウィング/, "🌀", "blade"],
  [/ハンマー|かなづち|てっきゅう|モーニングスター/, "🔨", "blade"],
  [/ムチ|ウィップ|むち|テイル/, "🪢", "claw"],
  [/扇|ファン/, "🪭", "cloth"],
  [/爪|ツメ|ナックル|クロウ/, "✋", "claw"],
  [/ナイフ|ダガー|はり|ばり|ばさみ/, "🗡️", "blade"],
  [/こんぼう|棍|のぼう$/, "🪵", "claw"],
  [/そろばん/, "🧮", "holy"],
  [/チェーンクロス/, "⛓️", "blade"],
  [/剣|つるぎ|ソード|キラー|けん$/, "⚔️", "blade"],
  [/はごろも|ローブ|ころも|ほうい|トーガ|法衣/, "🧙", "magic"],
  [/マント|コート/, "🧥", "cloth"],
  [/ドレス|スカート/, "👗", "cloth"],
  [/よろい|メイル|むねあて|こうら|かたびら/, "🛡️", "armor"],
  [/服|ふく|ベスト|スーツ|ボレロ|どうぎ|まえかけ|こしまき|しょうぞく|ぶとうぎ|ぎ$/, "👕", "cloth"],
];

function gearLook(id) {
  const item = B.WEAPONS[id];
  const name = item ? item.name : "";
  const found = GEAR_LOOK.find(([pattern]) => pattern.test(name));
  if (GEAR_ICON[id]) return { mark: GEAR_ICON[id], tone: found ? found[2] : "blade" };
  if (found) return { mark: found[1], tone: found[2] };
  if (item && item.slot === "armor") return { mark: "🛡️", tone: "armor" };
  return { mark: "⚔️", tone: "blade" };
}

function gearIcon(id) {
  const look = gearLook(id);
  return glyph(look.mark, look.tone);
}

function matIcon(id) {
  return glyph(MAT_ICON[id] || "📦");
}

function skillIcon(skill) {
  return glyph(SKILL_ICON[skill.id] || (skill.kind === "spell" ? "✨" : "⚔️"));
}

function sourceLine(id) {
  const rows = B.MATERIAL_SOURCES[id] || [];
  if (!rows.length) return "入手先がない";
  return rows.map((row) => `${row.region}の${row.monsters.join("、")}`).join("／");
}

function craftCard(save, recipe) {
  const item = B.WEAPONS[recipe.id];
  const owned = (save.gear || []).includes(recipe.id);
  const goldShort = save.gold < recipe.gold;
  const lines = Object.entries(recipe.materials).map(([id, need]) => {
    const have = save.materials[id] || 0;
    const short = have < need;
    const where = short ? `<br><span class="muted">${esc(sourceLine(id))}</span>` : "";
    return `<p class="${short ? "short" : "muted"}">${matIcon(id)}${esc(B.MATERIALS[id] || id)} ${have}/${need}${short ? "　足りない" : ""}${where}</p>`;
  }).join("");
  const gold = `<p class="${goldShort ? "short" : "muted"}">ゴールド ${save.gold}/${recipe.gold}G${goldShort ? "　足りない" : ""}</p>`;
  const ready = !owned && !goldShort && Object.entries(recipe.materials).every(([id, need]) => (save.materials[id] || 0) >= need);
  const button = owned ? `<p class="muted">所持している</p>` : `<button data-craft="${recipe.id}" ${ready ? "" : "disabled"}>つくる</button>`;
  return `<section class="window recipe"><h2>${gearIcon(recipe.id)}${esc(item.name)}</h2><p class="muted">${itemNote(item)}</p>${gold}${lines}${button}</section>`;
}

function dropNames(ids) {
  if (!ids || !ids.length) return "なし";
  return ids.map((id) => `${matIcon(id)}${esc(B.MATERIALS[id] || id)}`).join("、");
}

function finaleHtml(word) {
  const win = word === "勝ち";
  return `<div class="finale ${win ? "win" : "lose"}"><p class="finale-kicker">${win ? "WIN" : "LOSE"}</p><p class="finale-word">${esc(word)}</p><p class="finale-sub">${win ? "相手を倒した" : "倒されてしまった"}</p></div>`;
}

function playFinale(battle, log, word, then) {
  if (!battle || !battle.allies) {
    then();
    return;
  }
  const units = [...battle.foes, ...battle.allies];
  const hpLanded = document.querySelector(".field") && units.every((unit) => shownHp[unit.id] === Math.max(0, unit.hp));
  if (!hpLanded) paintFight(battle, log, "", "決着");
  const reveal = () => {
    const field = document.querySelector(".field");
    if (!field) paintFight(battle, log, "", word);
    const live = document.querySelector(".field");
    if (live && !live.querySelector(".finale")) live.insertAdjacentHTML("beforeend", finaleHtml(word));
    const phase = document.querySelector(".phase");
    if (phase) phase.textContent = word;
    if (word === "勝ち") Sfx.win();
    else Sfx.lose();
    setTimeout(then, 1100);
  };
  setTimeout(reveal, hpLanded ? 0 : 1000);
}

function resultCard(title, xp, gold, drops, notes, label) {
  return `<section class="window"><h1>${esc(title)}</h1>
    <p>経験値　${xp}</p>
    <p>ゴールド　${gold}G</p>
    <p>ドロップ　${dropNames(drops)}</p>
    ${notes && notes.length ? `<p>${notes.map(esc).join("<br>")}</p>` : ""}
    ${label ? `<button id="ok">${esc(label)}</button>` : ""}</section>`;
}

function esc(text) {
  return String(text ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

const Sfx = {
  ctx: null,
  ensure() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) this.ctx = new AudioCtx();
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },
  beep(freq, dur, type, gain, slide) {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), now + dur);
    amp.gain.setValueAtTime(0.001, now);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.002, gain), now + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.001, now + Math.max(dur, 0.03));
    osc.connect(amp).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  },
  hit(crit) {
    if (crit) {
      this.beep(640, 0.1, "square", 0.05, 1040);
      this.beep(880, 0.18, "triangle", 0.045);
    } else this.beep(170, 0.09, "square", 0.045, 80);
  },
  heal() { this.beep(480, 0.14, "sine", 0.045, 720); },
  select() { this.beep(340, 0.05, "sine", 0.03); },
  battle() {
    this.beep(392, 0.12, "sine", 0.06);
    setTimeout(() => this.beep(494, 0.12, "sine", 0.06), 140);
    setTimeout(() => this.beep(587, 0.28, "sine", 0.055), 280);
  },
  cast() {
    this.beep(440, 0.07, "sine", 0.035);
    setTimeout(() => this.beep(554, 0.1, "sine", 0.03), 70);
  },
  poison() {
    this.beep(196, 0.08, "sine", 0.04);
    setTimeout(() => this.beep(165, 0.16, "sine", 0.03), 80);
  },
  buff() {
    this.beep(523, 0.08, "sine", 0.04);
    setTimeout(() => this.beep(659, 0.16, "sine", 0.038), 90);
  },
  debuff() {
    this.beep(440, 0.08, "sine", 0.035);
    setTimeout(() => this.beep(370, 0.16, "sine", 0.03), 90);
  },
  qteStart() { this.beep(880, 0.04, "sine", 0.025); },
  qte(label) {
    if (label === "PERFECT") this.beep(880, 0.16, "triangle", 0.05, 1320);
    else if (label === "GOOD") this.beep(700, 0.12, "triangle", 0.045);
    else if (label === "success") this.beep(560, 0.1, "sine", 0.04);
    else this.beep(392, 0.09, "sine", 0.05);
  },
  win() {
    this.beep(523, 0.1, "triangle", 0.045);
    setTimeout(() => this.beep(659, 0.1, "triangle", 0.045), 110);
    setTimeout(() => this.beep(784, 0.18, "triangle", 0.045), 220);
  },
  lose() { this.beep(240, 0.28, "sine", 0.045, 90); },
};

let cutin = null;
let advanceToken = 0;
let comboPumpToken = 0;
let battleWatch = 0;

function scheduleAdvance(wait) {
  const token = ++advanceToken;
  setTimeout(() => {
    if (token !== advanceToken) return;
    advance();
  }, Math.max(0, wait || 0));
}

function queuePumpCombo(wait) {
  const token = ++comboPumpToken;
  setTimeout(() => {
    if (token !== comboPumpToken) return;
    pumpCombo();
  }, Math.max(0, wait || 0));
}

function armBattleWatch() {
  clearTimeout(battleWatch);
  battleWatch = setTimeout(() => {
    if (state.screen !== "battle" || !state.battle) return;
    if (holdBattle || state.picking || state.aim || document.querySelector(".qte, .chant, .apex, #qte-stop, #chant-stop, #apex-stop")) {
      armBattleWatch();
      return;
    }
    clearBadCombo(state.battle);
    if (state.battle.combo) queuePumpCombo(40);
    else scheduleAdvance(60);
  }, 5500);
}

function battlePhaseLabel(battle) {
  const rank = B.difficultyOf(battle.difficulty || 1);
  if (battle.combo && battle.combo.label) return battle.combo.label;
  if (state.opening) return `${rank.name}　遭遇`;
  if (state.picking && state.picking.hp > 0) return `${rank.name}　${state.picking.name}`;
  if (state.turnFocus && state.turnFocus.hp > 0) return `${rank.name}　${state.turnFocus.name}`;
  const next = battle.queue && battle.queueIndex != null ? battle.queue[battle.queueIndex] : null;
  if (next && next.hp > 0) return `${rank.name}　${next.name}`;
  return `${rank.name}　${battle.round || 1}ラウンド`;
}

function showCutin(name) {
  const spec = CUTIN[name];
  if (!spec) return;
  cutin = { spec, name, until: performance.now() + 980 };
}

function mountCutin() {
  if (!cutin) return;
  const left = cutin.until - performance.now();
  const field = document.querySelector(".field");
  if (!field) return;
  if (left <= 40) {
    cutin = null;
    return;
  }
  if (field.querySelector(".slash")) return;
  const node = document.createElement("div");
  node.className = `slash ${cutin.spec.kind}${cutin.name.length >= 7 ? " long" : ""}`;
  node.style.animationDelay = `-${980 - left}ms`;
  node.innerHTML = `<p class="slash-kicker">${cutin.spec.kicker}</p><p class="slash-word">${esc(cutin.name)}</p>`;
  field.appendChild(node);
}

const CUTIN = {
  ギガスラッシュ: { kind: "thunder", kicker: "THUNDER" },
  イオグランデ: { kind: "blast", kicker: "BLAST" },
  ドルマドン: { kind: "dark", kicker: "DARK" },
  会心必中: { kind: "crit", kicker: "CRIT" },
  森羅万象斬: { kind: "forest", kicker: "SLASH" },
  メラガイアー: { kind: "fire", kicker: "FIRE" },
  メドローア: { kind: "bolt", kicker: "ZAP" },
  ギガクロス: { kind: "rainbow", kicker: "CROSS" },
  応援: { kind: "cheer", kicker: "CHEER" },
  ミラクルインパクト: { kind: "holy", kicker: "MIRACLE" },
  ゴットばくれつけん: { kind: "rush", kicker: "GOD" },
  ザオリク: { kind: "life", kicker: "LIFE" },
  キングタイム: { kind: "king", kicker: "FIRST" },
  盗む: { kind: "thief", kicker: "STEAL" },
  ケミカルボンバー: { kind: "bomb", kicker: "CHEM" },
  インフィニティエッジ: { kind: "edge", kicker: "EDGE" },
  全身全霊斬り: { kind: "zenshin", kicker: "ALL" },
  バーストレインボウ: { kind: "burst", kicker: "BURST" },
  マダンテ: { kind: "void", kicker: "MP" },
  メイルストロム: { kind: "mael", kicker: "STORM" },
  かみくだく: { kind: "bite", kicker: "BITE" },
  はげしいほのお: { kind: "blaze", kicker: "FIRE" },
  しゃくねつのほのお: { kind: "inferno", kicker: "INFERNO" },
  マホカンタ: { kind: "mirror", kicker: "REFLECT" },
  いてつくはどう: { kind: "frost", kicker: "WAVE" },
  魔力集中: { kind: "focus", kicker: "MAGIC" },
  "第二形態・竜王": { kind: "dragon", kicker: "DRAGON" },
  "終焉の一撃": { kind: "demise", kicker: "END" },
  "第二形態・終焉": { kind: "demise", kicker: "END" },
  パラディンガード: { kind: "guard", kicker: "GUARD" },
  グランドクロス: { kind: "gcross", kicker: "CROSS" },
  パンサーラッシュ: { kind: "panther", kicker: "RUSH" },
};

function playLines(lines) {
  (lines || []).forEach((line) => {
    Object.keys(CUTIN).forEach((name) => {
      if (line.includes(name)) showCutin(name);
    });
    if (line.includes("（会心）") || line.includes("（超会心）") || line.includes("（暴走）")) Sfx.hit(true);
    else if (line.includes("上がった")) Sfx.buff();
    else if (line.includes("下がった") || line.includes("威圧")) Sfx.debuff();
    else if (line.includes("ダメージ")) Sfx.hit(false);
    else if (line.includes("回復") || line.includes("生き返")) Sfx.heal();
    else if (line.includes("毒")) Sfx.poison();
    else if (line.includes("の ")) Sfx.cast();
  });
}

let shownHp = {};

function itemNote(item) {
  const bits = [];
  if (item.atk) bits.push(`攻撃+${item.atk}`);
  if (item.def) bits.push(`守備+${item.def}`);
  if (item.mp) bits.push(`MP+${item.mp}`);
  if (item.spd) bits.push(`素早さ+${item.spd}`);
  if (item.hp) bits.push(`HP+${item.hp}`);
  if (item.special) bits.push(item.special);
  return bits.join("　");
}

function openStatsSheet(unit) {
  const sheet = document.getElementById("sheet");
  const backdrop = document.getElementById("backdrop");
  if (!sheet || !backdrop || !unit) return;
  const weapon = state.save.weapon && B.WEAPONS[state.save.weapon];
  const armor = state.save.armor && B.WEAPONS[state.save.armor];
  sheet.hidden = false;
  backdrop.hidden = false;
  sheet.innerHTML = `<h2>ステータス</h2>
    <p>${esc(unit.name)}</p>
    <p>HP ${Math.max(0, unit.hp)} / ${unit.maxHp}</p>
    <p>MP ${unit.mp} / ${unit.maxMp}</p>
    <p>攻撃 ${unit.atk}</p>
    <p>守備 ${unit.def}</p>
    <p>素早さ ${unit.spd}</p>
    ${weapon ? `<p>${gearIcon(state.save.weapon)}${esc(weapon.name)}${weapon.special ? `　${esc(weapon.special)}` : ""}</p>` : "<p>武器なし</p>"}
    ${armor ? `<p>${gearIcon(state.save.armor)}${esc(armor.name)}${armor.special ? `　${esc(armor.special)}` : ""}</p>` : "<p>防具なし</p>"}
    <button class="primary" id="close-stats" type="button">閉じる</button>`;
  document.getElementById("close-stats").onclick = () => {
    sheet.hidden = true;
    backdrop.hidden = true;
  };
  backdrop.onclick = () => {
    sheet.hidden = true;
    backdrop.hidden = true;
  };
}

function skillDetail(skill) {
  const effect = skill.effect || {};
  const aim = { one: "敵ひとり", all: "敵全体", ally: "味方ひとり", self: "自分", allies: "味方全員", random: "敵をばらまき", special: "ランダム" }[skill.target] || "";
  const bits = [];
  const rounds = effect.rounds ? `　${effect.rounds}ラウンド` : "";
  if (effect.power) {
    const pct = Math.round(effect.power * 100);
    bits.push(effect.hits > 1 ? `${effect.hits}回、1回威力${pct}%` : `威力${pct}%`);
  }
  const elementNames = { fire: "炎", ice: "氷", blast: "爆発", breath: "息", dark: "闇", bolt: "雷", wind: "風", water: "水" };
  const element = elementNames[skill.element];
  if (element) bits.push(element);
  if (effect.elements && effect.elements.length) bits.push(effect.elements.map((name) => elementNames[name] || name).join("・"));
  if (effect.intimidate) bits.push("威圧");
  if (skill.kind === "spell" && effect.power) bits.push("たまに暴走");
  if (effect.fullHeal) bits.push("HP全回復");
  else if (effect.heal) bits.push(`HP${Math.round(effect.heal * 100)}%回復`);
  if (effect.revive) bits.push(effect.revive >= 1 ? "確実に蘇生" : `${Math.round(effect.revive * 100)}%で蘇生`);
  if (effect.atkUp) bits.push(`攻撃アップ${rounds}`);
  if (effect.defUp) bits.push(`守備アップ${rounds}`);
  if (effect.spdUp) bits.push(`素早さアップ${rounds}`);
  if (effect.atkDown) bits.push(`攻撃ダウン${rounds}`);
  if (effect.defDown) bits.push(`守備ダウン${rounds}`);
  if (effect.spdDown) bits.push(`素早さダウン${rounds}`);
  if (effect.spellPower) bits.push(`呪文が強くなる${rounds}`);
  if (effect.spellCut) bits.push(`呪文を軽減${rounds}`);
  if (effect.spellDown) bits.push(`呪文耐性を大きく下げる${rounds}`);
  if (effect.breathCut) bits.push(`息を軽減${rounds}`);
  if (effect.takenUp) bits.push(`受けるダメージが増える${rounds}`);
  if (effect.cut || effect.physicalCut) bits.push("次のダメージを軽減");
  if (effect.sleep) bits.push("眠り");
  if (effect.poison) bits.push(effect.poison >= 1 ? "必ず毒" : "毒");
  if (effect.confuse) bits.push("混乱");
  if (effect.paralyze) bits.push(effect.paralyze >= 1 ? "必ずしびれ" : "しびれ");
  if (effect.trip) bits.push(effect.trip >= 1 ? "必ず転ばせる" : "たまに転ばせる");
  if (effect.ignoreDef) bits.push("守備を無視");
  if (effect.allResistDown) bits.push("全属性の耐性を下げる");
  if (effect.superWeak) bits.push("超弱点確定");
  if (effect.mpBurst) bits.push(`消費したMPの${effect.mpBurst}倍`);
  if (effect.allElement) bits.push("全属性");
  if (effect.forceBreak) bits.push("フォースブレイク確定");
  if (effect.partyHeal) bits.push(`味方全員HP${Math.round(effect.partyHeal * 100)}%回復`);
  if (effect.superCrit) bits.push("会心30%。出ると超会心");
  if (effect.passive === "first") bits.push("パッシブ。戦闘開始時、必ず先制");
  if (effect.spellReflect) bits.push(`呪文を${effect.spellReflect}回はね返す`);
  if (effect.charm) bits.push("魅了");
  if (effect.silence) bits.push("呪文封じ");
  if (effect.blind) bits.push("幻惑");
  if (effect.death && !effect.power) bits.push("即死させることがある");
  else if (effect.death) bits.push("たまに即死");
  if (effect.steal) bits.push("素材をぬすむ");
  if (effect.cure === "poison") bits.push("毒を治す");
  if (effect.cleanse) bits.push("悪い状態を治す");
  if (effect.wake) bits.push("眠りを覚ます");
  if (effect.cureBlind) bits.push("幻惑を治す");
  if (effect.dispel) bits.push("相手の強化を消す");
  if (effect.cover) bits.push("味方の代わりに受ける");
  if (effect.coverAll) bits.push("全員の代わりに受ける");
  if (effect.ward) bits.push(`単体攻撃を${Math.round((effect.wardCut || 0.5) * 100)}%軽減して引き受ける　${effect.rounds || 3}ラウンド`);
  if (effect.grandCross) bits.push(`味方が受けたダメージの${effect.grandCross}倍。使うとリセット`);
  if (effect.partyCrit) bits.push(`味方全体の会心+${Math.round(effect.partyCrit * 100)}%。戦闘中ずっと`);
  if (effect.powerTurn) bits.push(`次の攻撃の威力${effect.powerTurn}倍`);
  if (effect.tension) bits.push(`テンション${effect.tension}`);
  if (effect.doubleNext) bits.push("次の攻撃が2回当たる");
  if (effect.nextPower) bits.push("次の攻撃が強くなる");
  if (effect.selfRatio) bits.push("自分も傷つく");
  if (effect.explode) bits.push("自分は倒れる");
  if (effect.sureCrit) bits.push("会心が必ず出る");
  if (effect.metalHit) bits.push("メタルに通じる");
  if (effect.mpDrain) bits.push("MPを吸い取る");
  if (effect.giveMp) bits.push("MPを渡す");
  if (effect.extraTurn) bits.push("もう一度行動させる");
  if (effect.roar) bits.push("敵の攻撃を下げる");
  if (effect.skipEnemyFirst) bits.push("敵の先制を止めやすい");
  if (effect.mark) bits.push("呪文に弱くする");
  if (effect.fewBonus) bits.push("敵が少ないほど強い");
  if (effect.vsStatus) bits.push("眠りや混乱に大ダメージ");
  if (effect.flee) bits.push("その場から離れる");
  if (effect.random) bits.push("何が起きるか分からない");
  if (effect.miss) bits.push("外れることがある");
  if (effect.qte && !effect.apex) bits.push("タイミングで威力が変わる");
  if (effect.apex) bits.push("針を3回、同じ位置で止める");
  if (skill.kind === "spell" && !effect.apex) bits.push("詠唱の重なりで効果が変わる");
  const cost = effect.mpBurst ? "MP全部" : (skill.mp ? `MP${skill.mp}` : "MP0");
  return [cost, aim, bits.join("、")].filter(Boolean).join("　");
}

function skillBlocked(skill, mp) {
  if (skill.effect && skill.effect.mpBurst) return mp <= 0;
  return skill.mp > mp;
}

function qteWindow() {
  const goodHalf = 0.08;
  const min = Math.max(0.3, goodHalf);
  const max = Math.min(0.7, 1 - goodHalf);
  return { center: min + Math.random() * (max - min), coreHalf: 0.008, perfectHalf: 0.03, goodHalf };
}

function qteBand(layout, band) {
  const half = band === "core" ? layout.coreHalf : band === "perfect" ? layout.perfectHalf : layout.goodHalf;
  return `left:${(layout.center - half) * 100}%;width:${half * 200}%`;
}

function qteLabel(dist, layout) {
  if (dist <= layout.coreHalf) return { mult: 1.5, label: "PERFECT" };
  if (dist <= layout.perfectHalf) return { mult: 1.2, label: "GOOD" };
  if (dist <= layout.goodHalf) return { mult: 1, label: "success" };
  return { mult: 0.5, label: "miss" };
}

function statsLine(save) {
  const stats = R.growth(save);
  R.ensureVitals(save);
  const job = B.JOBS[save.job];
  const level = (save.jobLevels && save.jobLevels[save.job]) || 1;
  return `${esc(save.name)}　${esc(job ? job.name : "無職")}　Lv${level}　${save.hp}/${stats.maxHp}　MP ${save.mp}/${stats.maxMp}　${save.gold}G`;
}

function render() {
  try {
    renderScreen();
    app.dataset.booted = "1";
  } catch (error) {
    app.innerHTML = `<section class="window"><h1>止まった</h1><p>${esc(error && error.message)}</p></section>`;
  }
}

function heroName(fallback) {
  const input = document.getElementById("hero-name");
  const name = (input ? input.value : fallback || "").trim().slice(0, 8);
  return name || fallback || "ゆうしゃ";
}

function renderScreen() {
  const save = state.save;
  if (state.screen === "create") {
    app.innerHTML = `<section class="window"><h1>名前と職業</h1><p class="muted">最初のひとりは、このスマホに残る。</p></section>
      <input id="hero-name" maxlength="8" value="${esc(save.name)}" placeholder="名前">
      ${B.BASIC_JOBS.map((id) => {
        const job = B.JOBS[id];
        return `<button data-job="${id}"><b>${esc(job.name)}</b><span class="muted">${esc(job.role)}　HP${job.hp} MP${job.mp}</span></button>`;
      }).join("")}`;
    app.querySelectorAll("[data-job]").forEach((button) => {
      button.onclick = () => {
        save.name = heroName(save.name);
        R.chooseJob(save, button.dataset.job);
        persist();
        state.screen = "town";
        render();
      };
    });
    return;
  }
  if (state.screen === "town") {
    const weapon = save.weapon && B.WEAPONS[save.weapon] ? B.WEAPONS[save.weapon].name : "なし";
    const armor = save.armor && B.WEAPONS[save.armor] ? B.WEAPONS[save.armor].name : "なし";
    app.innerHTML = `<section class="window"><h1>街</h1><p>${statsLine(save)}</p><p class="muted">${save.weapon ? gearIcon(save.weapon) : glyph("⚔️")}${esc(weapon)}　${save.armor ? gearIcon(save.armor) : glyph("🛡️")}${esc(armor)}</p></section>
      <input id="hero-name" maxlength="8" value="${esc(save.name)}" placeholder="名前">
      <button id="rename">名前を変える</button>
      <button data-go="bag">所持</button>
      <button data-go="stats">ステータス</button>
      <button data-go="shop">買う</button>
      <button data-go="market">市場</button>
      <button data-go="craft">つくる</button>
      <button data-go="jobs">転職</button>
      <button data-go="depart">出発する</button>
      <button data-go="room">部屋（最大4人）</button>
      <button data-go="raid">大ボス</button>
      <button data-go="transfer">セーブうつし</button>`;
    document.getElementById("rename").onclick = () => {
      save.name = heroName(save.name);
      persist();
      render();
    };
    app.querySelectorAll("[data-go]").forEach((button) => {
      button.onclick = () => {
        state.screen = button.dataset.go;
        render();
      };
    });
    return;
  }
  if (state.screen === "transfer") {
    const blob = JSON.stringify(save);
    app.innerHTML = `<section class="window"><h1>セーブうつし</h1>
      <p>別のURL（クラウドなど）で遊ぶとき、下の文を全部コピーして、向こうで貼り付ける。</p>
      <p class="muted">同じスマホ・同じブラウザなら、いつもどおり自動で残る。</p></section>
      <textarea id="save-out" rows="8" readonly>${esc(blob)}</textarea>
      <button class="primary" id="copy-save" type="button">コピーする</button>
      <textarea id="save-in" rows="8" placeholder="ここにセーブを貼る"></textarea>
      <button class="primary" id="import-save" type="button">このセーブで上書き</button>
      <button data-back type="button">戻る</button>`;
    document.getElementById("copy-save").onclick = async () => {
      const text = document.getElementById("save-out").value;
      try {
        await navigator.clipboard.writeText(text);
        roomError = "";
        alert("コピーした。新しいURLで「セーブうつし」に貼って。");
      } catch (error) {
        document.getElementById("save-out").select();
        alert("長押しでコピーして。");
      }
    };
    document.getElementById("import-save").onclick = () => {
      const raw = (document.getElementById("save-in").value || "").trim();
      if (!raw) return;
      try {
        const next = JSON.parse(raw);
        if (!next || typeof next !== "object" || !next.name) throw new Error("形式が違う");
        state.save = loadFromObject(next);
        persist();
        state.screen = "town";
        render();
      } catch (error) {
        alert("読み込めなかった。文が途中で切れてないか見て。");
      }
    };
    app.querySelector("[data-back]").onclick = () => {
      state.screen = "town";
      render();
    };
    return;
  }
  if (state.screen === "stats") {
    const stats = R.growth(save);
    const job = B.JOBS[save.job];
    const cap = B.LEVEL_CAP || 99;
    const capped = save.level >= cap;
    const need = 16 + save.level * 12;
    const weaponItem = save.weapon && B.WEAPONS[save.weapon];
    const armorItem = save.armor && B.WEAPONS[save.armor];
    app.innerHTML = `<section class="window"><h1>ステータス</h1>
      <p>${esc(save.name)}　${esc(job ? job.name : "無職")}　Lv${save.level}</p>
      <p>HP ${save.hp} / ${stats.maxHp}</p>
      <p>MP ${save.mp} / ${stats.maxMp}</p>
      <p>攻撃 ${stats.atk}</p>
      <p>守備 ${stats.def}</p>
      <p>素早さ ${stats.spd}</p>
      <p>たね　攻撃+${save.atkBoost || 0}　守備+${save.defBoost || 0}　HP+${save.hpBoost || 0}　MP+${save.mpBoost || 0}　素早さ+${save.spdBoost || 0}</p>
      <p>経験値 ${capped ? "カンスト" : `${save.xp} / ${need}`}</p>
      ${job && job.trait ? `<p>${esc(B.TRAITS[job.trait] || "")}</p>` : ""}
      <p>覚えている技　${B.jobSkills(save.job, save.level).filter((skill) => skill.id !== "attack").map((skill) => esc(skill.name)).join("、") || "まだない"}</p>
      <p>${(() => { const next = B.nextSkill(save.job, save.level); return next ? `次の習得　Lv${next.level}　${esc(next.name)}` : "覚える技はもうない"; })()}</p>
      <p>${weaponItem ? `${gearIcon(save.weapon)}${esc(weaponItem.name)}${weaponItem.special ? `　${esc(weaponItem.special)}` : ""}` : "武器なし"}</p>
      <p>${armorItem ? `${gearIcon(save.armor)}${esc(armorItem.name)}${armorItem.special ? `　${esc(armorItem.special)}` : ""}` : "防具なし"}</p>
    </section><button data-back>街へ</button>`;
    bindBack();
    return;
  }
  if (state.screen === "bag") {
    const gear = (save.gear || []).filter((id) => R.canEquip(save, id)).map((id) => {
      const item = B.WEAPONS[id];
      if (!item) return "";
      const on = save.weapon === id || save.armor === id;
      return `<button data-equip="${id}">${gearIcon(id)}${esc(item.name)}　${itemNote(item)}${on ? "　装備中" : ""}</button>`;
    }).join("") || "<p>装備できるものはまだない。</p>";
    const mats = Object.entries(save.materials).filter(([, n]) => n > 0).map(([id, n]) => `<span class="item-line">${matIcon(id)}${esc(B.MATERIALS[id] || id)} × ${n}</span>`).join("") || "素材はない";
    const seeds = save.materials.speedSeed || 0;
    const plant = save.materials.xpPlant || 0;
    const scent = save.materials.scentBag || 0;
    const plantOn = save.xpPlant || save.tripXp;
    const scentOn = save.scent || save.tripScent;
    app.innerHTML = `<section class="window"><h1>所持</h1><p class="muted">装備</p>${gear}<p class="muted">素材</p><div class="item-list">${mats}</div>${seeds ? `<button id="use-seed">${matIcon("speedSeed")}すばやさのたねを使う（素早さ+1）</button>` : ""}${plant ? `<button id="use-plant" ${plantOn ? "disabled" : ""}>${matIcon("xpPlant")}経験の株を使う${plantOn ? "　効いている" : ""}</button>` : ""}${scent ? `<button id="use-scent" ${scentOn ? "disabled" : ""}>${matIcon("scentBag")}匂い袋を使う${scentOn ? "　効いている" : ""}</button>` : ""}</section><button data-back>街へ</button>`;
    bindBack();
    const seed = document.getElementById("use-seed");
    if (seed) seed.onclick = () => {
      save.materials.speedSeed -= 1;
      save.spdBoost = (save.spdBoost || 0) + 1;
      persist();
      render();
    };
    const usePlant = document.getElementById("use-plant");
    if (usePlant) usePlant.onclick = () => {
      if (save.xpPlant || save.tripXp || !(save.materials.xpPlant > 0)) return;
      save.materials.xpPlant -= 1;
      save.xpPlant = 1;
      persist();
      render();
    };
    const useScent = document.getElementById("use-scent");
    if (useScent) useScent.onclick = () => {
      if (save.scent || save.tripScent || !(save.materials.scentBag > 0)) return;
      save.materials.scentBag -= 1;
      save.scent = 2;
      persist();
      render();
    };
    app.querySelectorAll("[data-equip]").forEach((button) => {
      button.onclick = () => {
        const item = B.WEAPONS[button.dataset.equip];
        if (item.slot === "armor") save.armor = button.dataset.equip;
        else save.weapon = button.dataset.equip;
        persist();
        render();
      };
    });
    return;
  }
  if (state.screen === "market") {
    const bought = save.seedBuys || {};
    const tools = Object.entries(B.CONSUMABLES).map(([id, item]) => {
      const have = save.materials[id] || 0;
      return `<button data-tool="${id}" ${save.gold < item.price ? "disabled" : ""}>${matIcon(id)}${esc(item.name)}　${item.price}G　所持${have}<span class="detail">${esc(item.detail)}</span></button>`;
    }).join("");
    const seedMark = { atk: "⚔️", def: "🛡️", hp: "💚", mp: "💧", spd: "🌱" };
    const seeds = Object.entries(B.SEEDS).map(([id, item]) => {
      const price = B.seedPrice(id, bought[id] || 0);
      const have = save[item.key] || 0;
      return `<button data-seed="${id}" ${save.gold < price ? "disabled" : ""}>${glyph(seedMark[id])}${esc(item.name)}　${price}G　いま+${have}</button>`;
    }).join("");
    const mats = B.MATERIAL_SHOP.map(([id, price]) => {
      const have = save.materials[id] || 0;
      return `<button data-mat="${id}" ${save.gold < price ? "disabled" : ""}>${matIcon(id)}${esc(B.MATERIALS[id] || id)}　${price}G　所持${have}</button>`;
    }).join("");
    app.innerHTML = `<section class="window"><h1>市場</h1><p>${save.gold}G</p><p class="muted">株と袋は所持から使って、次の旅のあいだだけ。たねは買うたび高くなる。</p></section>
      <p class="muted">道具</p>${tools}
      <p class="muted">たね</p>${seeds}
      <p class="muted">素材</p>${mats}
      <button data-back>街へ</button>`;
    bindBack();
    app.querySelectorAll("[data-tool]").forEach((button) => {
      button.onclick = () => {
        const item = B.CONSUMABLES[button.dataset.tool];
        if (save.gold < item.price) return;
        save.gold -= item.price;
        save.materials[button.dataset.tool] = (save.materials[button.dataset.tool] || 0) + 1;
        persist();
        render();
      };
    });
    app.querySelectorAll("[data-seed]").forEach((button) => {
      button.onclick = () => {
        const id = button.dataset.seed;
        const item = B.SEEDS[id];
        const count = (save.seedBuys && save.seedBuys[id]) || 0;
        const price = B.seedPrice(id, count);
        if (save.gold < price) return;
        save.gold -= price;
        save.seedBuys = save.seedBuys || {};
        save.seedBuys[id] = count + 1;
        save[item.key] = (save[item.key] || 0) + item.gain;
        const stats = R.growth(save);
        save.hp = stats.maxHp;
        save.mp = stats.maxMp;
        persist();
        render();
      };
    });
    app.querySelectorAll("[data-mat]").forEach((button) => {
      button.onclick = () => {
        const price = B.MATERIAL_SHOP.find(([id]) => id === button.dataset.mat)[1];
        if (save.gold < price) return;
        save.gold -= price;
        save.materials[button.dataset.mat] = (save.materials[button.dataset.mat] || 0) + 1;
        persist();
        render();
      };
    });
    return;
  }
  if (state.screen === "shop") {
    const items = Object.entries(B.WEAPONS).filter(([id, item]) => item.price > 0 && B.shopOpen(save.cleared, item) && R.canEquip(save, id)).sort((a, b) => a[1].price - b[1].price);
    const next = B.REGIONS.find((region) => !(save.cleared || []).includes(region.id) && Object.entries(B.WEAPONS).some(([id, item]) => item.unlock === region.id && R.canEquip(save, id)));
    app.innerHTML = `<section class="window"><h1>武器屋</h1><p>${save.gold}G</p><p class="muted">${next ? `${esc(next.name)}をクリアすると、新しい品が入る。` : "品ぞろえはここまで。"}</p></section>
      ${items.map(([id, item]) => {
        const owned = (save.gear || []).includes(id);
        return `<button data-buy="${id}" ${owned || save.gold < item.price ? "disabled" : ""}>${gearIcon(id)}${esc(item.name)}　${item.price}G　${itemNote(item)}${owned ? "　所持" : ""}</button>`;
      }).join("")}
      <button data-back>街へ</button>`;
    bindBack();
    app.querySelectorAll("[data-buy]").forEach((button) => {
      button.onclick = () => {
        const item = B.WEAPONS[button.dataset.buy];
        save.gold -= item.price;
        keepGear(save, button.dataset.buy);
        if (item.slot === "armor") save.armor = button.dataset.buy;
        else save.weapon = button.dataset.buy;
        persist();
        render();
      };
    });
    return;
  }
  if (state.screen === "craft") {
    const cards = B.RECIPES.filter((recipe) => R.canEquip(save, recipe.id)).map((recipe) => craftCard(save, recipe)).join("") || "<p>今の職業で作れるものはない。</p>";
    app.innerHTML = `<section class="window"><h1>工房</h1><div class="item-list">${Object.entries(save.materials).filter(([, n]) => n > 0).map(([id, n]) => `<span class="item-line">${matIcon(id)}${esc(B.MATERIALS[id] || id)}×${n}</span>`).join("") || "素材はない"}</div></section>
      ${cards}
      <button data-back>街へ</button>`;
    bindBack();
    app.querySelectorAll("[data-craft]").forEach((button) => {
      button.onclick = () => {
        const recipe = B.RECIPES.find((item) => item.id === button.dataset.craft);
        save.gold -= recipe.gold;
        Object.entries(recipe.materials).forEach(([id, n]) => { save.materials[id] -= n; });
        const item = B.WEAPONS[recipe.id];
        keepGear(save, recipe.id);
        if (item.slot === "armor") save.armor = recipe.id;
        else save.weapon = recipe.id;
        persist();
        render();
      };
    });
    return;
  }
  if (state.screen === "jobs") {
    R.rememberLevel(save);
    persist();
    const basics = B.BASIC_JOBS.filter((id) => id !== save.job);
    const advanced = Object.keys(B.JOBS).filter((id) => B.JOBS[id].rank === "advanced" && id !== save.job);
    const haveOf = (id) => Number(save.jobLevels && save.jobLevels[id]) || 0;
    const parentLine = (table) => Object.entries(table || {}).map(([id, need]) => {
      return `${B.JOBS[id].name} ${haveOf(id)}/${need}`;
    }).join("　");
    const needLine = (job) => {
      const main = parentLine(job.parents);
      const alt = parentLine(job.alt);
      return alt ? `${main}　または　${alt}` : main;
    };
    const recorded = B.BASIC_JOBS.map((id) => `${B.JOBS[id].name} Lv${haveOf(id)}`).join("　");
    app.innerHTML = `<section class="window"><h1>転職</h1><p class="muted">レベルは職業ごとに別。上級職は、下のレベルを全部満たすと開く。賢者は、僧侶20と魔法使い20、または遊び人25。</p><p>${esc(recorded)}</p></section>
      ${basics.map((id) => `<button data-job="${id}">${esc(B.JOBS[id].name)}　${esc(B.JOBS[id].role)}</button>`).join("")}
      ${advanced.map((id) => {
        const job = B.JOBS[id];
        const open = id === "sage" ? R.sageReady(save.jobLevels) : B.promotionReady(save.jobLevels, id);
        return `<button data-job="${id}" ${open ? "" : "disabled"}>${esc(job.name)}　${esc(needLine(job))}</button>`;
      }).join("")}
      <button data-back>街へ</button>`;
    bindBack();
    app.querySelectorAll("[data-job]").forEach((button) => {
      button.onclick = () => {
        R.chooseJob(save, button.dataset.job);
        persist();
        state.screen = "town";
        render();
      };
    });
    return;
  }
  if (state.screen === "depart") {
    const list = B.REGIONS.map((region) => {
      const open = B.regionOpen(save.cleared, region);
      const here = save.region === region.id;
      const done = (save.cleared || []).includes(region.id);
      const label = here ? `${region.name}　${save.step + 1}戦目の続き` : `${region.name}${done ? "　クリア済" : ""}`;
      return `<button data-region="${region.id}" ${open ? "" : "disabled"}>${esc(label)}</button>`;
    }).join("");
    app.innerHTML = `<section class="window"><h1>出発</h1><p class="muted">国をひとつクリアすると、その難易度の一つ上が開く。やばいは雑魚も2回動く。旅の途中では変えられない。</p>${save.xpPlant ? "<p>経験の株が効いている</p>" : ""}${save.scent ? "<p>匂い袋で戦闘が2回増える</p>" : ""}</section>
      ${B.DIFFICULTIES.map((rank) => {
        const open = B.difficultyOpen(save.diffCleared, rank.id);
        const on = (save.difficulty || 1) === rank.id;
        const lockedRun = save.region && !on;
        const note = on ? "　選択中" : open ? "" : "　未開放";
        return `<button data-diff="${rank.id}" ${open && !lockedRun ? "" : "disabled"}>${esc(rank.name)}${note}</button>`;
      }).join("")}
      ${list}
      ${save.region ? "<button id=\"retire\">リタイアして街へ</button>" : ""}
      <button data-back>街へ戻る</button>`;
    bindBack();
    app.querySelectorAll("[data-diff]").forEach((button) => {
      button.onclick = () => {
        if (save.region) return;
        save.difficulty = Number(button.dataset.diff);
        persist();
        render();
      };
    });
    app.querySelectorAll("[data-region]").forEach((button) => {
      button.onclick = () => beginRegion(B.REGIONS.find((region) => region.id === button.dataset.region));
    });
    const retire = document.getElementById("retire");
    if (retire) retire.onclick = () => {
      R.restAtTown(save);
      persist();
      state.screen = "town";
      render();
    };
    return;
  }
  if (state.screen === "raid") {
    const done = new Set(save.raids || []);
    app.innerHTML = `<section class="window"><h1>大ボス</h1><p>1人でも挑める。強さは人数で変わらない。負けても、旅の途中ならその場所は残る。</p>${B.RAIDS.map((raid) => `<button data-solo-raid="${raid.id}">${esc(raid.name)}${done.has(raid.id) ? "　討伐済" : ""}<span class="detail">${esc(raid.blurb)}</span></button>`).join("")}</section><button data-back>街へ</button>`;
    bindBack();
    app.querySelectorAll("[data-solo-raid]").forEach((button) => {
      button.onclick = () => beginRaid(B.raidOf(button.dataset.soloRaid));
    });
    return;
  }
  if (state.screen === "room") {
    renderRoom();
    return;
  }
  if (state.screen === "battle") renderBattle();
}

function bindBack() {
  const button = app.querySelector("[data-back]");
  if (button) button.onclick = () => { state.screen = "town"; render(); };
}

function beginRaid(raid) {
  if (!raid) return;
  state.save.raidReturn = {
    region: state.save.region,
    step: state.save.step,
    tripXp: state.save.tripXp || 0,
    tripScent: state.save.tripScent || 0,
  };
  if (state.save.xpPlant) {
    state.save.tripXp = 1;
    state.save.xpPlant = 0;
  }
  persist();
  startFight(raid.foes);
  state.battle.raidId = raid.id;
}

function beginRegion(region) {
  const fresh = state.save.region !== region.id;
  if (fresh) {
    state.save.region = region.id;
    state.save.step = 0;
    state.save.tripXp = state.save.xpPlant ? 1 : 0;
    state.save.xpPlant = 0;
    state.save.tripScent = state.save.scent || 0;
    state.save.scent = 0;
    R.ensureVitals(state.save);
  }
  persist();
  const ids = B.rollBattle(region, state.save.step, state.save.tripScent || 0);
  startFight(ids, region);
}

function clearBadCombo(battle) {
  if (!battle || !battle.combo) return;
  const c = battle.combo;
  const broken = c.left == null || c.total == null || Number.isNaN(c.left) || c.left < 0;
  const spent = typeof c.left === "number" && c.left <= 0;
  if (broken || spent) battle.combo = null;
}

function addLog(lines) {
  const list = (Array.isArray(lines) ? lines : [lines]).filter(Boolean);
  state.log = state.log.concat(list).slice(-48);
  if (state.battle) state.battle.log = state.log.slice();
}

function startFight(ids) {
  state.loot = [];
  state.battle = R.startEncounter([state.save], ids, state.save.difficulty || 1);
  const names = state.battle.foes.map((unit) => unit.name).join("、");
  state.log = [`${names}が現れた`].concat(state.battle.popstarLog || []);
  if (state.battle.skipFoes) {
    state.log.push("キングタイム");
    showCutin("キングタイム");
  }
  state.screen = "battle";
  state.cursor = 0;
  state.aim = null;
  state.opening = true;
  state.enemyCue = null;
  state.picking = null;
  state.turnFocus = null;
  shownHp = {};
  Sfx.battle();
  renderBattle();
  armBattleWatch();
  setTimeout(() => {
    state.opening = false;
    advance();
  }, 320);
}

function advance() {
  const battle = state.battle;
  if (!R || !battle) return;
  armBattleWatch();
  clearBadCombo(battle);
  if (battle.combo) {
    queuePumpCombo(battle.combo.popstar ? 80 : 400);
    return;
  }
  const allies = battle.allies.filter((unit) => unit.hp > 0);
  const foes = battle.foes.filter((unit) => unit.hp > 0);
  if (!allies.length || !foes.length) return finishFight(allies.length > 0);
  if (!battle.queue || battle.queueIndex == null || battle.queueIndex >= battle.queue.length) {
    battle.queue = window.AdventureRules.orderOf(battle);
    battle.queueIndex = 0;
    battle.ambush = battle.skipFoes;
    battle.skipFoes = false;
  }
  const actor = battle.queue[battle.queueIndex];
  if (actor && actor.side === "foe" && battle.ambush) {
    battle.ambush = false;
    battle.queueIndex += 1;
    addLog(`${actor.name}は様子を見ている`);
    state.turnFocus = battle.queue[battle.queueIndex] || null;
    renderBattle();
    scheduleAdvance(280);
    return;
  }
  if (!actor || actor.hp <= 0) {
    battle.queueIndex += 1;
    scheduleAdvance(0);
    return;
  }
  state.turnFocus = actor;
  if (actor.side === "foe" && state.enemyCue !== actor.id) {
    state.enemyCue = actor.id;
    state.picking = null;
    renderBattle();
    scheduleAdvance(1300);
    return;
  }
  const log = [];
  if (actor.side === "foe") state.picking = null;
  if (!window.AdventureRules.tickTurnStart(actor, Math.random, log)) {
    addLog(log);
    battle.queueIndex += 1;
    renderBattle();
    scheduleAdvance(1000);
    return;
  }
  if (log.length) addLog(log);
  const sway = window.AdventureRules.swayAction(battle, actor, Math.random);
  if (sway) {
    if (sway.line) addLog(sway.line);
    if (sway.idle) {
      battle.queueIndex += 1;
      renderBattle();
      scheduleAdvance(1000);
      return;
    }
    act(actor, sway.skill, sway.target, 1);
    return;
  }
  if (actor.side === "foe") {
    state.picking = null;
    const pick = window.AdventureRules.enemyPick(actor, battle);
    if (!pick || !pick.skill) {
      addLog(`${actor.name}は動けなかった`);
      battle.queueIndex += 1;
      scheduleAdvance(240);
      return;
    }
    act(actor, pick.skill, pick.target, 1);
    return;
  }
  state.picking = actor;
  state.turnFocus = actor;
  renderBattle();
}

function act(actor, skill, target, qte) {
  if (actor) {
    state.turnFocus = actor;
    if (actor.side === "foe") state.enemyCue = actor.id;
  }
  armBattleWatch();
  let comboQueued = false;
  try {
    const lines = window.AdventureRules.castSkill(state.battle, actor, skill, target, qte, Math.random, state.loot);
    const out = (Array.isArray(lines) ? lines : [lines]).filter(Boolean);
    if (!out.length && skill) addLog(`${actor.name}の ${skill.name}`);
    else addLog(out);
    playLines(out.length ? out : lines);
    clearBadCombo(state.battle);
    if (state.battle.combo) {
      renderBattle();
      const comboDelay = state.battle.combo.popstar ? 950 : 900;
      comboQueued = true;
      queuePumpCombo(comboDelay);
      return;
    }
  } catch (error) {
    console.error(error);
    if (state.battle) state.battle.combo = null;
    addLog("戦闘処理でエラーが起きた");
    renderBattle();
  }
  if (!comboQueued) finishAct(actor);
}

function pumpCombo() {
  const battle = state.battle;
  armBattleWatch();
  if (!battle) {
    scheduleAdvance(100);
    return;
  }
  clearBadCombo(battle);
  if (!battle.combo) {
    scheduleAdvance(100);
    return;
  }
  const actorId = battle.combo.actorId;
  const pop = !!battle.combo.popstar;
  let result = { log: [], done: true };
  try {
    result = window.AdventureRules.stepCombo(battle, Math.random);
  } catch (error) {
    console.error(error);
    battle.combo = null;
    addLog("連撃の処理でエラーが起きた");
    renderBattle();
    const actor = [...battle.allies, ...battle.foes].find((unit) => unit.id === actorId);
    finishAct(actor);
    return;
  }
  clearBadCombo(battle);
  if ((result.log || []).length) addLog(result.log);
  playLines(result.log);
  renderBattle();
  const hitWait = pop
    ? (battle.combo && (battle.combo.master || battle.combo.total >= 20) ? 220
      : battle.combo && battle.combo.total >= 9 ? 560
      : 780)
    : 520;
  if (!result.done && battle.combo) {
    queuePumpCombo(hitWait);
    return;
  }
  if (battle.combo) battle.combo = null;
  const actor = [...battle.allies, ...battle.foes].find((unit) => unit.id === actorId);
  setTimeout(() => finishAct(actor), pop ? 950 : 900);
}

function finishAct(actor) {
  state.enemyCue = null;
  state.battle.queueIndex += 1;
  if (actor && actor.extra) {
    actor.extra = false;
    state.battle.queue.splice(state.battle.queueIndex, 0, actor);
  }
  if (state.battle.queueIndex >= state.battle.queue.length) {
    const tail = window.AdventureRules.endRound(state.battle);
    addLog(tail);
    playLines(tail);
    state.battle.round += 1;
    state.battle.queueIndex = null;
  }
  renderBattle();
  const battle = state.battle;
  const over = !battle.allies.some((unit) => unit.hp > 0) || !battle.foes.some((unit) => unit.hp > 0);
  const popstarRaid = battle.foes.some((unit) => unit.popstar);
  const cutinLive = cutin && cutin.until > performance.now();
  const nextActor = battle.queue && battle.queueIndex != null ? battle.queue[battle.queueIndex] : null;
  state.turnFocus = nextActor && nextActor.hp > 0 ? nextActor : null;
  const wait = over ? 1100
    : cutinLive ? 650
    : (actor && actor.side === "foe" ? (popstarRaid ? 900 : 1200) : (popstarRaid ? 650 : 450));
  scheduleAdvance(wait);
}

function paintFight(battle, log, dock, phase) {
  const foes = `<div class="hud-row">${battle.foes.map((unit) => hud(unit)).join("")}</div>`;
  const allies = `<div class="hud-row">${battle.allies.map((unit) => hud(unit)).join("")}</div>`;
  const recent = (log || []).slice(-4);
  const crowd = battle.allies.length + battle.foes.length > 3 ? " crowd" : "";
  const actors = [
    ...battle.foes.map((unit, index) => actorMark(unit, `foe-${index}`)),
    ...battle.allies.map((unit, index) => actorMark(unit, `ally-${index}`)),
  ].join("");
  app.innerHTML = `<div class="stage arena-stage">
    <p class="phase">${esc(phase)}</p>
    ${foes}
    <div class="logline"><div class="feed">${recent.length ? recent.map((line, index) => { const drama = line.startsWith("【"); const now = index === recent.length - 1; return `<p class="${drama ? "drama" : ""}${now ? " now" : ""}">${esc(line)}</p>`; }).join("") : `<p class="now">戦闘開始</p>`}</div><button type="button" id="open-log">ログ</button></div>
    <div class="field${crowd}"><div class="ground"></div>${actors}${recent.length ? `<p class="banner">${esc(recent[recent.length - 1])}</p>` : ""}</div>
    ${allies}
    <div class="dock">${dock}</div>
  </div>
  <div class="backdrop" id="backdrop" hidden></div>
  <div class="sheet" id="sheet" hidden></div>`;
  document.getElementById("open-log").onclick = () => {
    document.getElementById("sheet").hidden = false;
    document.getElementById("backdrop").hidden = false;
    document.getElementById("sheet").innerHTML = `<h2>ログ</h2>${(log || []).map((line, index, all) => `<p class="${index === all.length - 1 ? "now" : ""}">${esc(line)}</p>`).join("")}<button class="primary" id="close-log" type="button">閉じる</button>`;
    document.getElementById("close-log").onclick = () => {
      document.getElementById("sheet").hidden = true;
      document.getElementById("backdrop").hidden = true;
    };
  };
  slideBars([...battle.foes, ...battle.allies]);
  punchFx([...battle.foes, ...battle.allies]);
  mountCutin();
  app.querySelectorAll("[data-aura]").forEach((button) => {
    button.onclick = () => {
      const sheet = document.getElementById("sheet");
      const backdrop = document.getElementById("backdrop");
      sheet.hidden = false;
      backdrop.hidden = false;
      sheet.innerHTML = `<h2>${esc(button.dataset.aura)}</h2><p>${esc(button.dataset.detail)}</p><button class="primary" id="close-aura" type="button">閉じる</button>`;
      const close = () => {
        sheet.hidden = true;
        backdrop.hidden = true;
      };
      document.getElementById("close-aura").onclick = close;
      backdrop.onclick = close;
    };
  });
}

const AURA_ICON = {
  怒り: "💢", すてみ: "💥", ポーズ: "💪", 雄叫: "📣", バイシオン: "⚔️", 魔力: "✨", 息防: "🌬️", 威圧: "😨",
  山彦: "🔁", ショー: "🌟", 影: "🌑", 耐性: "🔓",
  攻撃アップ: "🗡️", 攻撃ダウン: "📉", 守備アップ: "🛡️", 守備ダウン: "🛡️",
  素早さアップ: "💨", 素早さダウン: "💨", 呪文強化: "✨", 呪文軽減: "🔮", 息軽減: "🌬️", 被ダメ: "💥",
  気合: "🔥", 防御: "🛡️", 大防: "🛡️", バリア: "🫧", かばう: "🤝", 守護: "🛡️",
  毒: "☠️", 眠: "💤", 魅了: "💗", 混乱: "💫", 呪文封じ: "🚫", しびれ: "⚡", 転び: "💫", 幻: "👁", 魔防: "🔮",
  闇の衣: "🌑", 運命: "⌛", テンション: "🔥", 反撃: "⚡", 氷壁: "🧊", 倍率: "✖️", 歩み: "💚",
  呪縛: "❄️", 回復不可: "🚫", 昇天: "💫", 二撃: "⚡⚡", 反射: "🪞",
};
const AURA_FACE = {
  怒り: ["💢", "怒"], すてみ: ["💥", "捨"], ポーズ: ["💪", "ポーズ"], 雄叫: ["📣", "雄"],
  バイシオン: ["⚔️", "バイ"], 魔力: ["✨", "魔"], 息防: ["🌬️", "息"], 威圧: ["😨", "威"],
  山彦: ["🔁", "山彦"], ショー: ["🌟", "ショー"], 影: ["🌑", "影"], 耐性: ["🔓", "耐性"],
  攻撃アップ: ["🗡️", "攻"], 攻撃ダウン: ["📉", "攻↓"], 守備アップ: ["🛡️", "守"], 守備ダウン: ["🛡️", "守↓"],
  素早さアップ: ["💨", "速"], 素早さダウン: ["💨", "速↓"], 呪文強化: ["✨", "魔"], 呪文軽減: ["🔮", "魔防"],
  息軽減: ["🌬️", "息"], 被ダメ: ["💥", "被"], 幻: ["👁", "幻"],
  気合: ["🔥", "気合"], 防御: ["🛡️", "防"], 大防: ["🛡️", "大防"], バリア: ["🫧", "バリア"],
  かばう: ["🤝", "かば"], 守護: ["🛡️", "守護"],
  毒: ["☠️", "毒"], 眠: ["💤", "眠"], 魅了: ["💗", "魅"], 混乱: ["💫", "乱"],
  呪文封じ: ["🚫", "封"], しびれ: ["⚡", "痺"], 転び: ["💫", "転"],
  闇の衣: ["🌑", "衣"], 運命: ["⌛", "刻"], テンション: ["🔥", "張"], 反撃: ["⚡", "チャンス"],
  氷壁: ["🧊", "氷壁"], 倍率: ["✖️", "倍"], 歩み: ["💚", "歩"],
  呪縛: ["❄️", "呪"], 回復不可: ["🚫", "封癒"], 昇天: ["💫", "昇"], 二撃: ["⚡", "二"], 反射: ["🪞", "反射"],
  レベルダウン: ["📉", "Lv"],
  パラディンガード: ["🛡️", "守"], 被ダメージ: ["💥", "被"], 会心率: ["💥", "会心"],
  炎上: ["🔥", "炎"], 追撃: ["🗡️", "追撃"], カウンター: ["🪞", "ｶｳﾝﾀ"],
  超会心: ["💥", "超会"], 物理無効: ["🛡️", "物無"], 無敵: ["⭐", "無敵"],
  ため: ["⏳", "ため"], 必中: ["🎯", "必中"], デバフ無効: ["✨", "無効"],
  会心固定: ["💗", "会心"], 防御無視: ["🗡️", "貫"], 輝き: ["⚔️", "輝"],
  本気: ["🔥", "本気"], コピー: ["🌀", "ｺﾋﾟｰ"], エンチャント: ["🌈", "ｴﾝﾁ"],
  メラーガ: ["🔥", "メラ"], スプラ: ["💧", "ｽﾌﾟ"], ブリザ: ["❄️", "ﾌﾞﾘ"],
  バリッカ: ["⚡", "ﾊﾞﾘ"], ウィンガ: ["🍃", "ｳｨﾝ"],
  マスク: ["🎭", "仮面"], ジャンプ: ["🛸", "ｼﾞｬﾝ"], 庇う: ["🛡️", "庇"],
  ワドコプター: ["🚁", "ﾜﾄﾞ"], 行動増: ["⏭️", "行動"],
};

function auraButton(tone, title, rounds, detail) {
  const face = AURA_FACE[title] || [AURA_ICON[title] || "✦", title.slice(0, 2)];
  const turn = rounds > 0 ? `<span class="bturn">${rounds}</span>` : "";
  return `<button type="button" class="badge ${tone}" data-aura="${esc(title)}" data-detail="${esc(detail)}"><span class="glyph">${face[0]}</span><span class="bname">${esc(face[1])}</span>${turn}</button>`;
}

function labeledDetail(unit, label, rounds) {
  const kinds = (unit.auras || []).filter((aura) => aura.label === label).map((aura) => aura.kind);
  const bits = [];
  if (kinds.includes("atkUp")) bits.push("攻撃が上がっている");
  if (kinds.includes("defUp")) bits.push("守備が上がっている");
  if (kinds.includes("takenUp")) bits.push("受けるダメージが増える");
  if (kinds.includes("spellPower")) bits.push("呪文の威力が上がっている");
  if (kinds.includes("breathCut")) bits.push("息のダメージが減る");
  if (kinds.includes("atkDown")) bits.push("攻撃が下がっている");
  if (kinds.includes("defDown")) bits.push("守備が下がっている");
  return `${bits.join("。") || "効果がかかっている"}。あと${rounds}ラウンド`;
}

function markLine(unit) {
  const list = unit.auras || [];
  const plain = (kind) => list.filter((aura) => aura.kind === kind && !aura.label);
  const sumPlain = (kind) => plain(kind).reduce((total, aura) => total + aura.value, 0);
  const leftPlain = (kind) => (plain(kind).length ? Math.max(...plain(kind).map((aura) => aura.rounds)) : 0);
  const items = [];
  const seen = new Set();
  list.filter((aura) => aura.label).forEach((aura) => {
    if (seen.has(aura.label)) return;
    seen.add(aura.label);
    const rounds = Math.max(...list.filter((item) => item.label === aura.label).map((item) => item.rounds));
    const tone = aura.label === "怒り" ? "rage" : aura.kind === "atkDown" || aura.kind === "defDown" || aura.kind === "takenUp" ? "down" : "up";
    items.push(auraButton(tone, aura.label, rounds, labeledDetail(unit, aura.label, rounds)));
  });
  (unit.marks || []).forEach((mark) => {
    const detail = {
      山彦: "呪文がもう一度出ることがある",
      ショー: "特技のあと、少し回復することがある",
      影: "次の行動が止まりやすい",
      耐性: "属性ダメージが増えている",
      全耐性: "どの属性の攻撃も弱点になる",
    }[mark.label] || "効果がかかっている";
    items.push(auraButton(mark.tone, mark.label, mark.rounds, `${detail}。あと${mark.rounds}ラウンド`));
  });
  const plainIcon = (kind, tone, title, text) => {
    if (sumPlain(kind) <= 0) return;
    const left = leftPlain(kind);
    items.push(auraButton(tone, title, left, `${text}。あと${left}ラウンド`));
  };
  plainIcon("atkUp", "up", "攻撃アップ", "攻撃が上がっている");
  plainIcon("atkDown", "down", "攻撃ダウン", "攻撃が下がっている");
  plainIcon("defUp", "up", "守備アップ", "守備が上がっている");
  plainIcon("defDown", "down", "守備ダウン", "守備が下がっている");
  plainIcon("spdUp", "up", "素早さアップ", "素早さが上がっている");
  plainIcon("spdDown", "down", "素早さダウン", "素早さが下がっている");
  plainIcon("spellPower", "up", "呪文強化", "呪文の威力が上がっている");
  plainIcon("spellCut", "up", "呪文軽減", "受ける呪文が減っている");
  plainIcon("spellDown", "down", "呪文弱体", "受ける呪文が増えている");
  plainIcon("breathCut", "up", "息軽減", "受ける息が減っている");
  plainIcon("takenUp", "down", "被ダメ", "受けるダメージが増えている");
  plainIcon("blind", "bad", "幻", "攻撃が外れやすい");
  if (unit.nextPower) items.push(auraButton("up", "気合", 0, "次の攻撃が強くなる"));
  if (unit.powerTurn > 1) items.push(auraButton("up", "気合", 0, `次の攻撃の威力が${unit.powerTurn}倍`));
  if (unit.tension > 0) items.push(auraButton("up", "テンション", 0, `テンション ${unit.tension}。次の攻撃のダメージが${Math.round((1 + unit.tension / 100) * 100)}%`));
  if (unit.doubleNext) items.push(auraButton("up", "二撃", 0, "次の攻撃が2回当たる"));
  if (unit.cutCharge) items.push(auraButton("up", unit.guardName || "防御", 0, "次に受けるダメージが減る"));
  if (unit.ward > 0) items.push(auraButton("up", "パラディンガード", unit.ward, `味方への単体攻撃を${Math.round((unit.wardCut || 0.5) * 100)}%軽減して引き受ける。あと${unit.ward}ラウンド`));
  if (unit.partyTaken > 0) items.push(auraButton("down", "被ダメージ", 0, `味方が受けたダメージ ${unit.partyTaken}。グランドクロスはこの10倍`));
  if (unit.critAura > 0) items.push(auraButton("up", "会心率", 0, `会心と暴走が${Math.round(unit.critAura * 100)}%上がっている`));
  if (unit.guarding) items.push(auraButton("up", "守護", 0, "かばった相手は、一撃では倒れない"));
  if (unit.levelDown > 0) items.push(auraButton("down", "レベルダウン", unit.levelDown, `攻撃と守備が${unit.levelDown * 5}%下がっている`));
  if (unit.poison > 0) items.push(auraButton("bad", "毒", unit.poison, `行動できる。ラウンドの終わりにダメージ。あと${unit.poison}回`));
  if (unit.silence > 0) items.push(auraButton("bad", "呪文封じ", unit.silence, `攻撃はできる。呪文が出せない。あと${unit.silence}ラウンド`));
  if (unit.paralyze > 0) items.push(auraButton("bad", "しびれ", unit.paralyze, "このターン、動けないことがある"));
  if (unit.trip > 0) items.push(auraButton("bad", "転び", unit.trip, "次の行動ができない"));
  if (unit.spellReflect > 0) items.push(auraButton("up", "反射", unit.spellReflect, `次の攻撃呪文を${unit.spellReflect}回はね返す`));
  if (unit.sleep > 0) items.push(auraButton("bad", "眠", unit.sleep, "眠っているあいだは行動できない。ダメージで起きる"));
  if (unit.charm > 0) items.push(auraButton("bad", "魅了", unit.charm, "味方を攻撃してしまう"));
  if (unit.confuse > 0) items.push(auraButton("bad", "混乱", unit.confuse, "敵味方かまわず切りかかる"));
  if (unit.seals && unit.seals.length) {
    const left = unit.seals.reduce((max, seal) => Math.max(max, seal.rounds), 0);
    items.push(auraButton("bad", "呪縛", left, `${unit.seals.map((seal) => seal.name).join("、")}は出せない`));
  }
  if (unit.noHeal > 0) items.push(auraButton("bad", "回復不可", unit.noHeal, "回復できない"));
  if (unit.ascend) items.push(auraButton("bad", "昇天", 0, "ラウンドの終わりに、いまのHPの半分のダメージ"));
  if (unit.rep && unit.rep.cloak) items.push(auraButton("down", "闇の衣", 0, `ダメージを90%軽減。通したダメージ ${unit.rep.taken}/100 で剥がれる`));
  if (unit.rep && unit.rep.wall) items.push(auraButton("up", "氷壁", 0, "次のダメージを無効にして、20%を返す"));
  if (unit.rep && unit.rep.frenzy) items.push(auraButton("rage", "反撃", 0, "動けないあいだ、受けるダメージが3倍。与えた分だけ攻撃した側が回復する"));
  if (unit.rep && unit.rep.phase === 2 && unit.rep.doom > 0) items.push(auraButton("rage", "運命", unit.rep.doom, `あと${unit.rep.doom}ラウンドで必殺。必殺のあいだ会心必中、ダメージ2.5倍`));
  if (unit.rep && unit.rep.tension) items.push(auraButton("up", "テンション", 0, `テンション ${unit.rep.tension}`));
  if (unit.rep && unit.rep.power > 1) items.push(auraButton("up", "倍率", 0, `与えるダメージ ${unit.rep.power} 倍`));
  if (unit.rep && unit.rep.mend) items.push(auraButton("up", "歩み", 0, "ラウンドの終わりに、そのラウンドで受けたダメージの30%を回復"));
  if (unit.burn > 0) items.push(auraButton("bad", "炎上", unit.burn, `ラウンド終了時にダメージ。命中も少し下がる。あと${unit.burn}ラウンド`));
  if (unit.meta && unit.meta.metaKnights > 0) {
    items.push(auraButton("up", "追撃", unit.meta.metaKnights, `ダメージを与えるたび、メタナイツが追加で小ダメージ。あと${unit.meta.metaKnights}ラウンド`));
  }
  if (unit.galacticCounter) items.push(auraButton("up", "カウンター", 0, "次に物理ダメージを受けたとき、同じ量を反射する。そのあと次の攻撃が超会心になる"));
  if (unit.superCritNext) items.push(auraButton("up", "超会心", 0, "次の攻撃は超会心になる"));
  if (unit.wadCopter > 0) items.push(auraButton("up", "ワドコプター", unit.wadCopter, `物理無効。効果が切れると月落とし。あと${unit.wadCopter}ラウンド`));
  else if (unit.physicalImmune > 0) items.push(auraButton("up", "物理無効", unit.physicalImmune, `物理攻撃を受けない。あと${unit.physicalImmune}ラウンド`));
  if (unit.invincible > 0) items.push(auraButton("up", "無敵", unit.invincible, `ダメージを受けない。あと${unit.invincible}ラウンド`));
  if (unit.chargeLeft > 0) items.push(auraButton("up", "ため", unit.chargeLeft, `力を溜めている。あと${unit.chargeLeft}ターンで発動`));
  if (unit.sureHit) items.push(auraButton("up", "必中", 0, "攻撃が外れない"));
  if (unit.popstarDebuffImmune) items.push(auraButton("up", "デバフ無効", 0, "攻撃ダウンなどの弱体を受けない"));
  if (unit.popstarAlwaysCrit) items.push(auraButton("up", "会心固定", 0, "攻撃が必ず会心になる"));
  if (unit.popstarIgnoreDef) items.push(auraButton("up", "防御無視", 0, "相手の守備を無視する。会心が超会心になる"));
  if (unit.popstarDamageReduce || unit.popstarDamageCap) {
    const bits = [];
    if (unit.popstarDamageReduce) bits.push(`受けるダメージ${Math.round(unit.popstarDamageReduce * 100)}%軽減`);
    if (unit.popstarDamageCap) bits.push(`1回のダメージは最大HPの${Math.round(unit.popstarDamageCap * 100)}%まで`);
    items.push(auraButton("up", "輝き", 0, bits.join("。")));
  }
  if (unit.kirby) {
    if (unit.kirby.serious) items.push(auraButton("rage", "本気", 0, "本気モード。1ラウンドに3回行動する"));
    if (unit.kirby.copy || unit.kirby.form !== "plain") {
      const form = { sword: "ソード", beam: "ビーム", cutter: "カッター", plain: "すっぴん" }[unit.kirby.form] || unit.kirby.form;
      items.push(auraButton("up", "コピー", 0, `${form}をコピーしている`));
    }
    if (unit.kirby.friendsEnchant && unit.kirby.form !== "beam") {
      const enchantName = {
        meraga: "メラーガ", spla: "スプラ", blizza: "ブリザ", ballikka: "バリッカ", winga: "ウィンガ", ready: "エンチャント",
      }[unit.kirby.enchant] || "エンチャント";
      const enchantDetail = {
        meraga: "炎上を付与する",
        spla: "味方を回復する",
        blizza: "凍結を付与する",
        ballikka: "まひを付与する",
        winga: "対象のデバフを全体に広げる",
        ready: "攻撃に属性追加効果が付く",
      }[unit.kirby.enchant] || "攻撃に属性追加効果が付く";
      items.push(auraButton("up", enchantName, 0, `フレンズエンチャント。${enchantDetail}`));
    }
  }
  if (unit.dedede) {
    if (unit.dedede.mask > 0) items.push(auraButton("rage", "マスク", unit.dedede.mask, `マスクドデデデ。行動が増える。あと${unit.dedede.mask}ラウンド`));
    if (unit.dedede.jump) items.push(auraButton("up", "ジャンプ", unit.dedede.jump.left || 1, "空中にいる。次に全体へ大ダメージ＋まひ＋幻惑"));
    if (unit.dedede.coverAll > 0) items.push(auraButton("up", "庇う", unit.dedede.coverAll, `味方への攻撃を引き受ける。デバフ無効。あと${unit.dedede.coverAll}ラウンド`));
  }
  if (unit.menace > 1) items.push(auraButton("up", "行動増", 0, `1ラウンドに${unit.menace}回行動する`));
  if (!items.length) return "";
  return `<div class="icons">${items.join("")}</div>`;
}

function hud(unit) {
  const low = unit.maxHp && unit.hp / unit.maxHp <= 0.3 ? " low" : "";
  const mp = unit.side === "ally" ? `MP ${unit.mp}/${unit.maxMp}` : `素早さ ${unit.spd}`;
  const down = unit.hp <= 0 ? "　戦闘不能" : "";
  const marks = markLine(unit);
  return `<section class="hud"><div class="hud-top"><h2>${esc(unit.name)}</h2><p>HP ${Math.max(0, unit.hp)} / ${unit.maxHp}</p></div><div class="hp${low}"><span id="bar-${unit.id}"></span></div><div class="hud-top foot"><p class="trait">${mp}${down}</p>${marks}</div></section>`;
}

function enchantFrame(unit) {
  if (!(unit.kirby && unit.kirby.friendsEnchant && unit.kirby.form !== "beam")) return "";
  const key = unit.kirby.enchant || "ready";
  return ` enchant-${esc(key)}`;
}

function actorMark(unit, slot) {
  const art = unit.side === "foe" ? `art/foe-${unit.name}.png` : `art/job-${unit.job || "hero"}.png`;
  const frame = enchantFrame(unit);
  return `<div class="actor ${slot}${unit.hp <= 0 ? " down" : ""}${frame}" id="card-${unit.id}"><div class="portrait"><img src="${esc(art)}" alt="" onerror="this.hidden=true"><span>${esc(unit.name)}</span></div>${markLine(unit)}</div>`;
}

function slideBars(units) {
  units.forEach((unit) => {
    const bar = document.getElementById(`bar-${unit.id}`);
    if (!bar || !unit.maxHp) return;
    const after = Math.max(0, unit.hp) / unit.maxHp * 100;
    const beforeHp = shownHp[unit.id];
    const before = beforeHp == null ? after : Math.max(0, beforeHp) / unit.maxHp * 100;
    bar.style.width = `${before}%`;
    if (before === after) return;
    bar.getBoundingClientRect();
    bar.style.transition = "width 0.45s ease";
    bar.style.width = `${after}%`;
  });
}

function punchFx(units) {
  let shook = false;
  units.forEach((unit) => {
    const after = Math.max(0, unit.hp);
    const before = shownHp[unit.id];
    shownHp[unit.id] = after;
    if (before == null || before === after) return;
    const card = document.getElementById(`card-${unit.id}`);
    if (!card) return;
    const delta = after - before;
    card.classList.add(delta < 0 ? "hurt" : "heal");
    const floater = document.createElement("div");
    floater.className = `floater ${delta < 0 ? "dmg" : "heal"}`;
    floater.textContent = `${delta < 0 ? "" : "+"}${delta}`;
    card.appendChild(floater);
    if (delta < 0) shook = true;
  });
  if (!shook) return;
  document.body.classList.remove("shake");
  document.body.getBoundingClientRect();
  document.body.classList.add("shake");
}

function renderBattle() {
  const battle = state.battle;
  const actor = state.picking;
  let dock = "";
  if (state.aim) {
    dock = aimButtons(state.aim.actor, state.aim.skill);
  } else if (actor && actor.hp > 0) {
    dock = `<div class="skill-grid">${actor.skills.map((skill, index) => skill.effect && skill.effect.passive ? "" : `<button class="choice" data-skill="${index}" ${skillBlocked(skill, actor.mp) ? "disabled" : ""}><strong>${skillIcon(skill)}${esc(skill.name)}</strong><span class="detail">${esc(skillDetail(skill))}</span></button>`).join("")}</div><button id="open-stats" type="button">ステータス</button><button id="run" type="button">リタイア</button>`;
  } else dock = `<button id="open-stats" type="button">ステータス</button><button id="run" type="button">リタイア</button>`;
  const phase = battlePhaseLabel(battle);
  paintFight(battle, state.log, dock, phase);
  app.querySelectorAll("[data-skill]").forEach((button) => {
    button.onclick = () => chooseSkill(actor, actor.skills[Number(button.dataset.skill)]);
  });
  app.querySelectorAll("[data-target]").forEach((button) => {
    button.onclick = () => confirmSkill(state.aim.actor, state.aim.skill, button.dataset.target);
  });
  const aimBack = document.getElementById("aim-back");
  if (aimBack) aimBack.onclick = () => cancelAim();
  const run = document.getElementById("run");
  if (run) run.onclick = () => {
    window.AdventureRules.restAtTown(state.save);
    persist();
    state.screen = "town";
    state.battle = null;
    state.aim = null;
    render();
  };
  const stats = document.getElementById("open-stats");
  if (stats) stats.onclick = () => openStatsSheet(actor || battle.allies[0]);
}

function aimButtons(actor, skill) {
  const battle = state.screen === "room" && roomView ? roomView.battle : state.battle;
  const head = `<p class="window"><strong>${skillIcon(skill)}${esc(skill.name)}</strong><span class="detail">${esc(skillDetail(skill))}</span></p>`;
  if (skill.target === "ally") {
    const allies = battle.allies.filter((unit) => skill.effect.revive || unit.hp > 0);
    return head + allies.map((unit) => `<button data-target="${unit.id}">${esc(unit.name)}${unit.hp <= 0 ? "　戦闘不能" : ""}</button>`).join("") + `<button type="button" id="aim-back">戻る</button>`;
  }
  const foes = battle.foes.filter((unit) => unit.hp > 0);
  if (foes.length > 1 && skill.target === "one") {
    return head + foes.map((unit) => `<button data-target="${unit.id}">${esc(unit.name)}</button>`).join("") + `<button type="button" id="aim-back">戻る</button>`;
  }
  return head + `<button type="button" id="aim-back">戻る</button>`;
}

function chooseSkill(actor, skill) {
  Sfx.select();
  const needsAlly = skill.target === "ally";
  const foes = state.battle.foes.filter((unit) => unit.hp > 0);
  if (needsAlly || (foes.length > 1 && skill.target === "one")) {
    state.aim = { actor, skill };
    holdBattle = true;
    renderBattle();
    return;
  }
  holdBattle = true;
  state.aim = null;
  confirmSkill(actor, skill, foes[0] ? foes[0].id : actor.id);
}

function cancelAim() {
  state.aim = null;
  holdBattle = false;
  roomChoosing = false;
  if (state.screen === "room") renderRoomBattle();
  else renderBattle();
}

function confirmSkill(actor, skill, target) {
  state.picking = null;
  state.aim = null;
  holdBattle = true;
  const resume = (result) => {
    if (!result) {
      state.picking = actor;
      holdBattle = false;
      renderBattle();
      return;
    }
    Sfx.qte(result.label);
    holdBattle = false;
    act(actor, skill, target, result.mult);
  };
  if (skill.effect && skill.effect.apex) {
    runApex().then(resume);
    return;
  }
  if (skill.kind === "spell") {
    runChant().then(resume);
    return;
  }
  if (skill.effect && skill.effect.qte) {
    runQte().then(resume);
    return;
  }
  holdBattle = false;
  act(actor, skill, target, 1);
}

function chantScale(pos) {
  return 0.42 + pos * 0.9;
}

function chantTicks(count, inner, outer) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    const x1 = (100 + Math.cos(angle) * inner).toFixed(1);
    const y1 = (100 + Math.sin(angle) * inner).toFixed(1);
    const x2 = (100 + Math.cos(angle) * outer).toFixed(1);
    const y2 = (100 + Math.sin(angle) * outer).toFixed(1);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }).join("");
}

function chantTriangle(turn, radius) {
  const points = [0, 1, 2].map((index) => {
    const angle = turn + (index / 3) * Math.PI * 2 - Math.PI / 2;
    return `${(100 + Math.cos(angle) * radius).toFixed(1)},${(100 + Math.sin(angle) * radius).toFixed(1)}`;
  }).join(" ");
  return `<polygon points="${points}"/>`;
}

function chantWindow() {
  const goodHalf = 0.14;
  const min = Math.max(0.28, goodHalf);
  const max = Math.min(0.72, 1 - goodHalf);
  return { center: min + Math.random() * (max - min), coreHalf: 0.055, perfectHalf: 0.09, goodHalf };
}

function chantRadius(pos) {
  return 78.936 * chantScale(pos);
}

function chantZones(layout) {
  const radius = chantRadius(layout.center);
  const band = (half) => (2 * (chantRadius(layout.center + half) - radius)).toFixed(1);
  return `<svg class="chant-zones" viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r="${radius.toFixed(1)}" fill="none" stroke="rgba(158,217,184,0.45)" stroke-width="${band(layout.goodHalf)}"/><circle cx="110" cy="110" r="${radius.toFixed(1)}" fill="none" stroke="#e6c36a" stroke-width="${band(layout.perfectHalf)}"/><circle cx="110" cy="110" r="${radius.toFixed(1)}" fill="none" stroke="#ff2d2d" stroke-width="${band(layout.coreHalf)}"/></svg>`;
}

function chantMark(kind) {
  if (kind === "board") {
    return `<svg class="chant-board" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="97" fill="#071433" stroke="#c4a35a" stroke-width="2"/><circle cx="100" cy="100" r="78" fill="none" stroke="#8d7340" stroke-width="1"/><circle cx="100" cy="100" r="56" fill="none" stroke="#8d7340" stroke-width="1" stroke-dasharray="2 3"/><g stroke="#c4a35a" stroke-width="1.6">${chantTicks(24, 86, 96)}</g><circle cx="100" cy="100" r="7" fill="#e6c36a"/></svg>`;
  }
  if (kind === "seal") {
    return `<svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="92" fill="rgba(7,20,51,0.35)" stroke="#e6c36a" stroke-width="3"/><circle cx="100" cy="100" r="76" fill="none" stroke="#f3e6bf" stroke-width="1.2"/><g fill="none" stroke="#e6c36a" stroke-width="1.7">${chantTriangle(0, 46)}${chantTriangle(Math.PI, 46)}</g><g stroke="#f3e6bf" stroke-width="2">${chantTicks(8, 80, 92)}</g><circle cx="100" cy="100" r="16" fill="none" stroke="#e6c36a" stroke-width="2"/><circle cx="100" cy="100" r="4" fill="#e6c36a"/></svg>`;
  }
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><g class="chant-spin"><circle cx="100" cy="100" r="92" fill="none" stroke="#f4fbff" stroke-width="3.5"/><g stroke="#9fd0ff" stroke-width="2">${chantTicks(12, 84, 92)}</g></g></svg>`;
}

function apexWindow() {
  const goodHalf = 0.05;
  return { center: 0.16 + Math.random() * 0.68, coreHalf: 0.01, perfectHalf: 0.022, goodHalf };
}

function apexDist(pos, center) {
  const raw = Math.abs(pos - center);
  return Math.min(raw, 1 - raw);
}

function apexWedge(center, half, color) {
  const start = (center - half) * Math.PI * 2 - Math.PI / 2;
  const end = (center + half) * Math.PI * 2 - Math.PI / 2;
  const point = (angle, radius) => `${(100 + Math.cos(angle) * radius).toFixed(2)},${(100 + Math.sin(angle) * radius).toFixed(2)}`;
  const large = half * 2 > 0.5 ? 1 : 0;
  return `<path d="M${point(start, 54)} L${point(start, 86)} A86,86 0 ${large} 1 ${point(end, 86)} L${point(end, 54)} A54,54 0 ${large} 0 ${point(start, 54)} Z" fill="${color}"/>`;
}

function runApex() {
  return new Promise((resolve) => {
    const layout = apexWindow();
    const specs = [
      { period: 820, offset: 0, tip: 16 },
      { period: 1460, offset: 0.41, tip: 36 },
      { period: 2100, offset: 0.73, tip: 56 },
    ];
    const dock = document.querySelector(".dock");
    const zones = `${apexWedge(layout.center, layout.goodHalf, "rgba(158,217,184,0.85)")}${apexWedge(layout.center, layout.perfectHalf, "#e6c36a")}${apexWedge(layout.center, layout.coreHalf, "#ff2d2d")}`;
    const needles = specs.map((hand, index) => `<div class="apex-needle ${index === 0 ? "on" : "wait"}" id="apex-hand-${index}"><svg viewBox="0 0 200 200" aria-hidden="true"><line x1="100" y1="108" x2="100" y2="${hand.tip}" stroke-width="4" stroke-linecap="round"/></svg></div>`).join("");
    dock.innerHTML = `<div class="apex" id="apex"><svg class="apex-board" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" fill="#071433" stroke="#c4a35a" stroke-width="3"/>${zones}<circle cx="100" cy="100" r="8" fill="#e6c36a"/></svg>${needles}</div><p class="chant-hint" id="apex-hint">同じ赤に3回　1/3</p><button class="primary" id="apex-stop" type="button">決めろ</button><button id="apex-back" type="button">戻る</button>`;
    Sfx.qteStart();
    const nodes = specs.map((_, index) => document.getElementById(`apex-hand-${index}`));
    const started = performance.now();
    const hits = [];
    let stopped = false;
    const place = (now) => specs.map((hand) => (hand.offset + (now - started) / hand.period) % 1);
    function frame(now) {
      if (stopped) return;
      const positions = place(now);
      nodes.forEach((node, index) => {
        if (index < hits.length) return;
        node.style.transform = `translate(-50%, -50%) rotate(${positions[index] * 360}deg)`;
      });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    document.getElementById("apex-stop").onclick = () => {
      if (stopped) return;
      const index = hits.length;
      const pos = place(performance.now())[index];
      nodes[index].style.transform = `translate(-50%, -50%) rotate(${pos * 360}deg)`;
      nodes[index].classList.remove("on", "wait");
      nodes[index].classList.add("held");
      hits.push(qteLabel(apexDist(pos, layout.center), layout));
      Sfx.select();
      if (hits.length < 3) {
        nodes[hits.length].classList.remove("wait");
        nodes[hits.length].classList.add("on");
        document.getElementById("apex-hint").textContent = `同じ赤に3回　${hits.length + 1}/3`;
        return;
      }
      stopped = true;
      const mult = hits.reduce((sum, hit) => sum + hit.mult, 0) / 3;
      const label = mult >= 1.4 ? "PERFECT" : mult >= 1.12 ? "GOOD" : mult >= 0.9 ? "success" : "miss";
      resolve({ mult, label });
    };
    document.getElementById("apex-back").onclick = () => {
      if (stopped) return;
      stopped = true;
      resolve(null);
    };
  });
}

function runChant() {
  return new Promise((resolve) => {
    const layout = chantWindow();
    const dock = document.querySelector(".dock");
    dock.innerHTML = `<div class="chant" id="chant">${chantMark("board")}${chantZones(layout)}<div class="chant-ring" id="chant-ring">${chantMark("ring")}</div></div><p class="chant-hint">赤い輪がパーフェクト</p><button class="primary" id="chant-stop" type="button">唱える</button><button id="chant-back" type="button">戻る</button>`;
    Sfx.qteStart();
    const ring = document.getElementById("chant-ring");
    const started = performance.now();
    let pos = 0;
    let stopped = false;
    function frame(now) {
      if (stopped) return;
      const cycle = ((now - started) / 1400) % 2;
      pos = cycle < 1 ? cycle : 2 - cycle;
      ring.style.transform = `translate(-50%, -50%) scale(${chantScale(pos)})`;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    document.getElementById("chant-stop").onclick = () => {
      if (stopped) return;
      stopped = true;
      resolve(qteLabel(Math.abs(pos - layout.center), layout));
    };
    document.getElementById("chant-back").onclick = () => {
      if (stopped) return;
      stopped = true;
      resolve(null);
    };
  });
}

function runQte() {
  return new Promise((resolve) => {
    const layout = qteWindow();
    const dock = document.querySelector(".dock");
    dock.innerHTML = `<div class="qte" id="qte"><div class="good" style="${qteBand(layout, "good")}"></div><div class="perfect" style="${qteBand(layout, "perfect")}"></div><div class="core" style="${qteBand(layout, "core")}"></div><div class="marker" id="marker"></div></div><button class="primary" id="qte-stop" type="button">今だ！</button><button id="qte-back" type="button">戻る</button>`;
    Sfx.qteStart();
    const marker = document.getElementById("marker");
    const started = performance.now();
    let pos = 0;
    let stopped = false;
    function frame(now) {
      if (stopped) return;
      const cycle = ((now - started) / 1100) % 2;
      pos = cycle < 1 ? cycle : 2 - cycle;
      marker.style.left = `${pos * 100}%`;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    document.getElementById("qte-stop").onclick = () => {
      if (stopped) return;
      stopped = true;
      resolve(qteLabel(Math.abs(pos - layout.center), layout));
    };
    document.getElementById("qte-back").onclick = () => {
      if (stopped) return;
      stopped = true;
      resolve(null);
    };
  });
}

function finishRaid(won) {
  const save = state.save;
  const battle = state.battle;
  const back = save.raidReturn;
  const raid = B.raidOf(battle.raidId);
  let xp = 0;
  let gold = 0;
  let notes = [];
  let drops = [];
  if (won) {
    xp = battle.foes.reduce((sum, foe) => sum + (foe.xp || 0), 0);
    if (save.tripXp) xp *= 2;
    gold = battle.foes.reduce((sum, foe) => sum + (foe.gold || 0), 0);
    save.gold += gold;
    const bonus = window.AdventureRules.dropBonus(battle.allies);
    battle.foes.forEach((foe) => {
      if (foe.material) save.materials[foe.material] = (save.materials[foe.material] || 0) + bonus;
    });
    state.loot.forEach((drop) => {
      if (drop.who === 0) save.materials[drop.material] = (save.materials[drop.material] || 0) + 1;
    });
    notes = window.AdventureRules.grantRaidPrize(save, battle.raidId, Math.random).concat(window.AdventureRules.gainXp(save, xp));
    if (save.tripXp) notes.unshift("経験の株で経験値が2倍");
    battle.foes.forEach((foe) => {
      if (!foe.material) return;
      for (let i = 0; i < bonus; i += 1) drops.push(foe.material);
    });
    if (!save.raids) save.raids = [];
    if (!save.raids.includes(battle.raidId)) save.raids.push(battle.raidId);
  }
  window.AdventureRules.restAtTown(save);
  if (back) {
    save.region = back.region;
    save.step = back.step || 0;
    save.tripXp = back.tripXp || 0;
    save.tripScent = back.tripScent || 0;
  }
  delete save.raidReturn;
  persist();
  const title = won ? `${raid ? raid.name : "大ボス"}討伐` : "負け";
  playFinale(battle, state.log, won ? "勝ち" : "負け", () => {
    const body = won
      ? resultCard(title, xp, gold, drops, notes, "街へ")
      : `<section class="window"><h1>負け</h1><p>体力は戻った。旅の途中だった場所は残る。</p><button id="ok">街へ</button></section>`;
    app.innerHTML = body;
    document.getElementById("ok").onclick = () => { state.screen = "town"; render(); };
  });
}

function finishFight(won) {
  const save = state.save;
  const battle = state.battle;
  window.AdventureRules.writeBack(save, battle.allies[0]);
  if (battle.raidId) return finishRaid(won);
  if (!won) {
    window.AdventureRules.restAtTown(save);
  persist();
  playFinale(battle, state.log, "負け", () => {
    app.innerHTML = `<section class="window"><h1>全滅</h1><p>街まで戻された。進行は捨てて、レベルと所持は残る。倒れただけでは抜けない。生きている味方がいれば、ザオラルで戻せる。</p><button id="ok">街へ</button></section>`;
    document.getElementById("ok").onclick = () => { state.screen = "town"; render(); };
  });
  return;
}
  let xp = battle.foes.reduce((sum, foe) => sum + (foe.xp || 0), 0);
  if (save.tripXp) xp *= 2;
  const gold = battle.foes.reduce((sum, foe) => sum + (foe.gold || 0), 0);
  save.gold += gold;
  const bonus = window.AdventureRules.dropBonus(battle.allies);
  battle.foes.forEach((foe) => {
    if (foe.material) save.materials[foe.material] = (save.materials[foe.material] || 0) + bonus;
  });
  state.loot.forEach((drop) => {
    if (drop.who === 0) save.materials[drop.material] = (save.materials[drop.material] || 0) + 1;
  });
  const notes = window.AdventureRules.gainXp(save, xp);
  if (save.tripXp) notes.unshift("経験の株で経験値が2倍");
  const drops = [];
  battle.foes.forEach((foe) => {
    if (!foe.material) return;
    for (let i = 0; i < bonus; i += 1) drops.push(foe.material);
  });
  state.loot.forEach((drop) => { if (drop.who === 0) drops.push(drop.material); });
  if (bonus > 1) notes.push("ドロップが2倍");
  const region = B.REGIONS.find((item) => item.id === save.region) || B.REGIONS[0];
  save.step += 1;
  const cleared = save.step >= B.battleCount(region, save.tripScent || 0);
  if (cleared) {
    if (!save.cleared.includes(region.id)) save.cleared.push(region.id);
    window.AdventureRules.markDifficulty(save);
    window.AdventureRules.restAtTown(save);
  }
  persist();
  const title = cleared ? `${region.name}クリア` : "リザルト";
  const next = cleared ? "街へ" : "次へ";
  if (bonus > 1) showCutin("盗む");
  playFinale(battle, state.log, "勝ち", () => {
    app.innerHTML = resultCard(title, xp, gold, drops, notes, next);
    document.getElementById("ok").onclick = () => {
      if (cleared) {
        state.screen = "town";
        render();
        return;
      }
      startFight(B.rollBattle(region, save.step, save.tripScent || 0));
    };
  });
}

const ROOM_KEY = "dq-journey-room";
let roomTimer = 0;
let roomView = null;
let roomError = "";
let finaleLock = false;
let pendingRoom = null;
let roomChoosing = false;
let holdBattle = false;

function renderRoom() {
  if (!roomView) {
    const remembered = localStorage.getItem(ROOM_KEY) || "";
    app.innerHTML = `<section class="window"><h1>部屋</h1><p class="muted">みんな同じアドレスを開く。</p><p class="muted">${esc(sharePage())}</p><p class="muted" id="room-error">${esc(roomError)}</p></section>
      <input id="code" inputmode="numeric" maxlength="4" value="${esc(remembered)}" placeholder="部屋番号" style="font:inherit;width:100%;margin:0 0 0.45rem;padding:0.75rem;border:2px solid #e6d48a;background:#0d2758;color:inherit">
      <button id="enter">入る</button><button data-back>街へ</button>`;
    bindBack();
    document.getElementById("enter").onclick = () => enterRoom(document.getElementById("code").value.trim());
    return;
  }
  const me = roomView.youAreLeader;
  const names = roomView.members.map((item) => `${esc(item.name)} Lv${item.level}${item.hp <= 0 ? "　戦闘不能" : ""}${item.away ? "（離席）" : ""}${item.saveId === roomView.leaderId ? "　リーダー" : ""}`).join("<br>");
  if (roomView.phase === "battle" && roomView.battle && roomView.battle.allies) {
    renderRoomBattle();
    return;
  }
  const result = roomView.result;
  const headline = result && result.kind === "wipe" ? "全滅" : result && result.kind === "retire" ? "リタイア" : result && result.kind === "clear" ? "クリア" : result && result.kind === "win" ? "勝ち" : "待合";
  const detail = result && result.kind === "wipe" ? "倒れた人は、生きている味方がいるあいだはパーティに残る。全員倒れると街に戻る。"
    : result && result.kind === "retire" ? "リーダーが戻した。レベルと所持は残っている。"
      : result && (result.kind === "win" || result.kind === "clear") ? ""
        : "戦闘が始まるまで、アプリを落としてもこの番号で戻れる。";
  const reward = result && (result.kind === "win" || result.kind === "clear")
    ? resultCard(headline, roomView.yourXp != null ? roomView.yourXp : result.xp, result.gold, roomView.yourDrops || [], roomView.yourNotes || [], "")
    : "";
  const regionButtons = me && roomView.phase === "lobby"
    ? (roomView.openRegions || []).map((region) => `<button data-region="${region.id}">${esc(region.name)}へ</button>`).join("")
    : "";
  const diffButtons = me && roomView.phase === "lobby"
    ? (roomView.openDifficulties || []).map((rank) => `<button data-diff="${rank.id}" class="${roomView.difficulty === rank.id ? "primary" : ""}" ${rank.open ? "" : "disabled"}>${esc(rank.name)}${rank.open ? "" : "　未開放"}</button>`).join("")
    : "";
  app.innerHTML = `<section class="window"><h1>部屋 ${esc(roomView.code)}</h1><p>${names}</p><p class="muted">${detail}</p>${roomView.phase === "lobby" ? `<p>難易度　${esc((roomView.openDifficulties || []).find((rank) => rank.id === roomView.difficulty)?.name || "ふつう")}</p>` : ""}</section>
    ${reward}
    ${diffButtons}
    ${me && roomView.phase === "between" ? `<button id="go-region">次へ</button>` : ""}
    ${regionButtons}
    ${me && roomView.phase === "lobby" ? `<p class="muted">大ボス</p>${(roomView.raids || []).map((raid) => `<button data-raid="${raid.id}" ${roomView.members.length < (raid.minParty || 2) ? "disabled" : ""}>${esc(raid.name)}${(roomView.yourSave && (roomView.yourSave.raids || []).includes(raid.id)) ? "　討伐済" : ""}</button>`).join("")}` : ""}
    ${me && roomView.phase !== "lobby" ? `<button id="retire">リタイア</button>` : ""}
    ${!me && roomView.phase !== "lobby" ? `<p class="muted">リタイアはリーダーが決める。</p>` : ""}
    <p class="muted" id="room-error">${esc(roomError)}</p>
    ${roomView.phase === "lobby" ? `<button id="leave">部屋を出る</button>` : ""}`;
  const region = document.getElementById("go-region");
  if (region) region.onclick = () => roomAct({ intent: "depart", regionId: roomView.regionId });
  app.querySelectorAll("[data-diff]").forEach((button) => {
    button.onclick = () => roomAct({ intent: "difficulty", difficulty: Number(button.dataset.diff) });
  });
  app.querySelectorAll("[data-region]").forEach((button) => {
    button.onclick = () => roomAct({ intent: "depart", regionId: button.dataset.region });
  });
  app.querySelectorAll("[data-raid]").forEach((button) => {
    button.onclick = () => roomAct({ intent: "raid", raidId: button.dataset.raid });
  });
  const retire = document.getElementById("retire");
  if (retire) retire.onclick = () => roomAct({ intent: "retire" });
  const leave = document.getElementById("leave");
  if (leave) leave.onclick = () => leaveRoom();
}

function renderRoomBattle() {
  const battle = roomView.battle;
  const mine = battle.allies.find((unit) => unit.seat === (roomView.members.find((item) => item.saveId === state.save.id) || {}).seat);
  const myTurn = roomView.waitingFor === state.save.id && mine && mine.hp > 0;
  let dock = "";
  if (state.aim) dock = aimButtons(state.aim.actor, state.aim.skill);
  else if (myTurn) {
    dock = `<div class="skill-grid">${mine.skills.filter((skill) => !(skill.effect && skill.effect.passive)).map((skill) => `<button class="choice" data-skill="${skill.id}" ${skillBlocked(skill, mine.mp) ? "disabled" : ""}><strong>${skillIcon(skill)}${esc(skill.name)}</strong><span class="detail">${esc(skillDetail(skill))}</span></button>`).join("")}</div>`;
  } else {
    const wait = mine && mine.hp <= 0 ? "戦闘不能。ザオラルを待っている。" : (roomView.turnLabel || "相手の番");
    dock = `<p class="window">${esc(wait)}</p>`;
  }
  if (roomView.youAreLeader) dock += `<button id="retire" type="button">リタイア</button>`;
  if (mine) dock += `<button id="open-stats" type="button">ステータス</button>`;
  paintFight(battle, roomView.log, dock, roomView.turnLabel || "戦闘");
  app.querySelectorAll("[data-skill]").forEach((button) => {
    button.onclick = () => chooseRoomSkill(mine, mine.skills.find((skill) => skill.id === button.dataset.skill));
  });
  app.querySelectorAll("[data-target]").forEach((button) => {
    button.onclick = () => sendRoomSkill(state.aim.skill, button.dataset.target);
  });
  const aimBack = document.getElementById("aim-back");
  if (aimBack) aimBack.onclick = () => cancelAim();
  const retire = document.getElementById("retire");
  if (retire) retire.onclick = () => roomAct({ intent: "retire" });
  const stats = document.getElementById("open-stats");
  if (stats && mine) stats.onclick = () => openStatsSheet(mine);
}

function chooseRoomSkill(actor, skill) {
  Sfx.select();
  const foes = roomView.battle.foes.filter((unit) => unit.hp > 0);
  if (skill.target === "ally" || (foes.length > 1 && skill.target === "one")) {
    state.aim = { actor, skill };
    roomChoosing = true;
    holdBattle = true;
    renderRoomBattle();
    return;
  }
  holdBattle = true;
  sendRoomSkill(skill, foes[0] ? foes[0].id : actor.id);
}

function sendRoomSkill(skill, target) {
  const go = (qte) => {
    roomChoosing = false;
    holdBattle = false;
    state.aim = null;
    roomAct({ intent: "command", skillId: skill.id, target, qte });
  };
  if (skill.effect && skill.effect.apex) {
    roomChoosing = true;
    holdBattle = true;
    runApex().then((result) => {
      if (!result) {
        state.aim = null;
        roomChoosing = false;
        holdBattle = false;
        renderRoomBattle();
        return;
      }
      Sfx.qte(result.label);
      go(result.mult);
    });
    return;
  }
  if (skill.kind === "spell") {
    roomChoosing = true;
    holdBattle = true;
    runChant().then((result) => {
      if (!result) {
        state.aim = null;
        roomChoosing = false;
        holdBattle = false;
        renderRoomBattle();
        return;
      }
      Sfx.qte(result.label);
      go(result.mult);
    });
    return;
  }
  if (skill.effect && skill.effect.qte) {
    roomChoosing = true;
    holdBattle = true;
    runQte().then((result) => {
      if (!result) {
        state.aim = null;
        roomChoosing = false;
        holdBattle = false;
        renderRoomBattle();
        return;
      }
      Sfx.qte(result.label);
      go(result.mult);
    });
    return;
  }
  go(1);
}

function roomPath() {
  if (location.pathname.includes("/animal-battle-quiz/")) return "/animal-battle-quiz/room";
  return "/room";
}

function roomEndpoint(search) {
  const configured = window.ROOM_API || localStorage.getItem("dq-journey-room-api");
  let base;
  if (configured) base = configured.replace(/\/$/, "");
  else if (location.port === "8771" || location.protocol === "http:" || location.protocol === "https:") {
    base = `${location.origin}${roomPath()}`;
  } else {
    base = `http://127.0.0.1:8771/animal-battle-quiz/room`;
  }
  if (!search) return base;
  return `${base}${search.charAt(0) === "?" ? search : `?${search}`}`;
}

function sharePage() {
  if (location.protocol === "http:" || location.protocol === "https:") {
    if (location.pathname.includes("/animal-battle-quiz/")) {
      return `${location.origin}/animal-battle-quiz/adventure.html`;
    }
    return `${location.origin}/adventure.html`;
  }
  return `http://127.0.0.1:8771/animal-battle-quiz/adventure.html`;
}

async function leaveRoom() {
  const data = await roomAct({ intent: "leave" });
  if (!data || !data.left) return;
  localStorage.removeItem(ROOM_KEY);
  roomView = null;
  state.screen = "town";
  render();
}

async function enterRoom(code) {
  roomError = "";
  if (!/^\d{4}$/.test(code)) {
    roomError = "4桁の番号にする";
    render();
    return;
  }
  localStorage.setItem(ROOM_KEY, code);
  await roomAct({ intent: "join", code, save: state.save });
}

async function roomAct(body) {
  const code = body.code || localStorage.getItem(ROOM_KEY);
  try {
    const response = await fetch(roomEndpoint(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...body, code, saveId: state.save.id, save: state.save }),
    });
    const data = await response.json();
    if (!response.ok) {
      roomError = data.error || "部屋に入れない";
      if (response.status === 404) {
        localStorage.removeItem(ROOM_KEY);
        roomView = null;
      }
      render();
      return;
    }
    if (data.left) return data;
    adoptRoom(data);
    return data;
  } catch (error) {
    roomError = "部屋につながらない。同じアドレスを開き直して。しばらく待ってからもう一度。";
    render();
  }
}

function freshLines(prev, next) {
  if (!prev || !next) return [];
  const anchor = prev[prev.length - 1];
  const at = next.lastIndexOf(anchor);
  if (at < 0) return next.slice();
  return next.slice(at + 1);
}

function battleFingerprint(battle) {
  if (!battle) return "";
  const bits = [...(battle.allies || []), ...(battle.foes || [])].map((unit) => `${unit.id}:${unit.hp}:${unit.mp}`);
  return bits.join("|");
}

function adoptRoom(data) {
  if (finaleLock) {
    pendingRoom = data;
    return;
  }
  const prev = roomView;
  const sameTurn = prev && data.waitingFor === prev.waitingFor && data.phase === prev.phase;
  const battleChanged = prev && data.battle && prev.battle && battleFingerprint(prev.battle) !== battleFingerprint(data.battle);
  const logGrew = prev && data.log && (data.log.length > (prev.log || []).length);
  const entered = data.phase === "battle" && (!prev || prev.phase !== "battle");
  const lines = freshLines(prev && prev.log, data.log);
  roomView = data;
  roomError = "";
  if (data.yourSave) {
    state.save = data.yourSave;
    persist();
  }
  state.screen = "room";
  if (entered) {
    shownHp = {};
    Sfx.battle();
  }
  playLines(lines);
  const cut = data.result && prev && prev.battle && prev.phase === "battle" && (!prev.result || prev.result.kind !== data.result.kind) && (data.result.kind === "win" || data.result.kind === "clear" || data.result.kind === "wipe");
  if (data.result && (!prev || !prev.result || prev.result.kind !== data.result.kind) && !cut) {
    if (data.result.kind === "wipe" || data.result.kind === "retire") Sfx.lose();
    if (data.result.kind === "win" || data.result.kind === "clear") Sfx.win();
  }
  if ((roomChoosing || holdBattle) && sameTurn && !cut && !battleChanged && !logGrew) return;
  roomChoosing = false;
  holdBattle = false;
  state.aim = null;
  if (cut) {
    finaleLock = true;
    const word = data.result.kind === "wipe" ? "負け" : "勝ち";
    playFinale(prev.battle, data.log || prev.log || [], word, () => {
      finaleLock = false;
      if (pendingRoom) {
        const next = pendingRoom;
        pendingRoom = null;
        adoptRoom(next);
        return;
      }
      render();
    });
    return;
  }
  render();
}

async function pollRoom() {
  const code = localStorage.getItem(ROOM_KEY);
  if (!code || state.screen !== "room" || document.hidden) return;
  try {
    const response = await fetch(roomEndpoint(`code=${code}&saveId=${state.save.id}`));
    if (!response.ok) {
      if (response.status === 404) {
        roomError = "部屋が消えた。番号をもう一度入れて入り直して。";
        roomView = null;
        localStorage.removeItem(ROOM_KEY);
        render();
      }
      return;
    }
    const data = await response.json();
    const next = JSON.stringify(data);
    if (next !== JSON.stringify(roomView)) adoptRoom(data);
  } catch (error) { /* 次の確認で戻す */ }
}

function boot() {
  persist();
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled || button.dataset.skill != null || button.id === "qte-stop" || button.id === "chant-stop" || button.id === "apex-stop") return;
    Sfx.select();
  });
  state.screen = state.save.job ? "town" : "create";
  if (state.save.job && localStorage.getItem(ROOM_KEY)) state.screen = "room";
  render();
  if (state.screen === "room") enterRoom(localStorage.getItem(ROOM_KEY));
  roomTimer = setInterval(pollRoom, 250);
}

boot();
