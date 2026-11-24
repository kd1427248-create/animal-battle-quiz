(function () {
/* ポップスター大ボス戦闘（PDFフル）— adventure-rules から bind される */
const Book = typeof window !== "undefined" ? window.JobBook : require("./data.js");
let popstarSkill;
if (typeof window !== "undefined") {
  if (!window.PopstarSkills || !window.PopstarSkills.popstarSkill) {
    throw new Error("popstar-skills.js が読めません。Shift+再読み込みするか 8771 経由で開いてください");
  }
  popstarSkill = window.PopstarSkills.popstarSkill;
} else {
  popstarSkill = require("./popstar-skills.js").popstarSkill;
}

let H = null;

const KIRBY_FORMS = ["plain", "sword", "beam", "cutter"];
const COPY_FORMS = ["sword", "beam", "cutter", "crash"];

const KIRBY_POOL = {
  plain: ["sliding", "dive", "airShot", "crash"],
  sword: ["swordHundred", "spinningSword", "chopping", "stabDown", "meteorEnd", "kaitengiri"],
  beam: ["beamWhip", "cycleBeam", "beamGatling", "hadoBeam", "captureBeam"],
  cutter: ["cutterBoomerang", "hyperBoomerang", "dashCutter", "cutterRush", "karatake"],
};

const KIRBY_SERIOUS = [
  "starRod", "ultraSword", "robobot", "hydra", "quickSpin", "ribbon", "bigBang", "masterCopy", "tripleStar", "rainbowSword",
];

const META_POOL = ["condor", "gCounter", "metaTriple", "metaSpin", "halberdShot", "machTornado"];
const DEDE_POOL = ["superJump", "oniHammer", "hammerThrow", "coverAll", "grindHammer", "stumble", "maskedDedede", "newHammerCombo"];
const BANDANA_POOL = ["earthStamp", "wadCopter", "cheerPom", "energyDrink", "invincibleCandy", "abilitySeed", "maximTomato"];

function drama(log, line) {
  log.push(`【${line}】`);
}

function kirbyOf(state) {
  return (state.foes || []).find((unit) => unit.popstarRole === "kirby");
}

function findFoeRole(state, role) {
  return (state.foes || []).find((unit) => unit.popstarRole === role && unit.hp > 0);
}

function findDedede(state) {
  return findFoeRole(state, "dedede");
}

function skillList(ids) {
  return ids.map((id) => popstarSkill(id));
}

function refreshKirbySkills(unit) {
  const form = unit.kirby.form || "plain";
  let ids = [...(KIRBY_POOL[form] || KIRBY_POOL.plain)];
  if (unit.kirby.serious) ids = ids.concat(KIRBY_SERIOUS);
  unit.skills = skillList(ids);
  unit.menace = unit.kirby.serious ? 3 : 2;
  if (unit.kirby.serious) {
    unit.popstarAlwaysCrit = true;
    unit.popstarIgnoreDef = true;
  }
}

function baseUnit(index, src, role, menace) {
  return {
    id: `f${index}`,
    name: src.name,
    side: "foe",
    hp: src.hp,
    maxHp: src.hp,
    mp: src.mp || 120,
    maxMp: src.mp || 120,
    atk: src.atk,
    def: src.def,
    spd: src.spd,
    skills: [],
    auras: [],
    nextPower: 0,
    cover: null,
    cutCharge: 0,
    sleep: 0,
    poison: 0,
    charm: 0,
    confuse: 0,
    trait: "",
    material: "popStar",
    gold: src.gold,
    xp: src.xp,
    menace,
    metal: false,
    flee: 0,
    weak: "",
    boss: true,
    popstar: true,
    popstarRole: role,
    popstarDebuffImmune: false,
    physicalImmune: 0,
    invincible: 0,
    galacticCounter: false,
    burn: 0,
    sureHit: false,
    chargeSkill: null,
    chargeLeft: 0,
  };
}

function createUnit(monsterId, index) {
  const src = Book.MONSTERS[monsterId];
  if (!src) return null;
  if (monsterId === "kirby") {
    const unit = baseUnit(index, src, "kirby", 2);
    unit.kirby = { form: "plain", serious: false, copy: false, friendsEnchant: false, enchant: "", opened: false };
    refreshKirbySkills(unit);
    return unit;
  }
  if (monsterId === "metaknight") {
    const unit = baseUnit(index, src, "meta", 2);
    unit.meta = { opened: false, metaKnights: 0, shine: true };
    unit.popstarDamageCap = 0.5;
    unit.popstarDamageReduce = 0.3;
    unit.skills = skillList(META_POOL);
    return unit;
  }
  if (monsterId === "dedede") {
    const unit = baseUnit(index, src, "dedede", 2);
    unit.dedede = { opened: false, mask: 0, jump: null, coverAll: 0 };
    unit.skills = skillList(DEDE_POOL);
    return unit;
  }
  if (monsterId === "bandana") {
    const unit = baseUnit(index, src, "bandana", 1);
    unit.bandana = { opened: false, maximUsed: false };
    unit.skills = skillList(BANDANA_POOL);
    return unit;
  }
  return null;
}

function giveKirbyCopy(state, log, rng) {
  const kirby = kirbyOf(state);
  if (!kirby || kirby.hp <= 0) return;
  const pick = COPY_FORMS[Math.floor(rng() * COPY_FORMS.length)];
  kirby.kirby.copy = true;
  kirby.kirby.friendsEnchant = true;
  if (!kirby.kirby.enchant) kirby.kirby.enchant = "ready";
  if (pick === "crash") {
    kirby.kirby.form = "plain";
    log.push("カービィはクラッシュを思い出した");
  } else {
    kirby.kirby.form = pick;
    log.push(`カービィは${pick === "sword" ? "ソード" : pick === "beam" ? "ビーム" : "カッター"}をコピーした`);
  }
  refreshKirbySkills(kirby);
}

function awakenKirbySerious(state, log) {
  const kirby = kirbyOf(state);
  if (!kirby || kirby.kirby.serious) return;
  kirby.kirby.serious = true;
  kirby.kirby.form = "plain";
  refreshKirbySkills(kirby);
  drama(log, "カービィが本気モードになった");
  log.push("カービィの行動が3回になる");
  castMove(state, kirby, popstarSkill("starWarrior"), null, 1, Math.random, log);
  castMove(state, kirby, popstarSkill("courageGuide"), null, 1, Math.random, log);
  castMove(state, kirby, popstarSkill("pinkDevil"), null, 1, Math.random, log);
}

function bind(helpers) {
  H = helpers;
}

function initBattle(state) {
  if (!(state.foes || []).some((unit) => unit.popstar)) return;
  const log = [];
  const meta = findFoeRole(state, "meta");
  if (meta && !meta.meta.opened) {
    meta.meta.opened = true;
    castMove(state, meta, popstarSkill("knightCode"), null, 1, Math.random, log);
    log.push("メタナイトはギャラクシアの輝きを放っている");
  }
  const dedede = findFoeRole(state, "dedede");
  if (dedede && !dedede.dedede.opened) {
    dedede.dedede.opened = true;
    castMove(state, dedede, popstarSkill("dignity"), null, 1, Math.random, log);
    castMove(state, dedede, popstarSkill("hammerSkill"), null, 1, Math.random, log);
  }
  const bandana = findFoeRole(state, "bandana");
  if (bandana && !bandana.bandana.opened) {
    bandana.bandana.opened = true;
    castMove(state, bandana, popstarSkill("braveBandana"), null, 1, Math.random, log);
    castMove(state, bandana, popstarSkill("abilitySeed"), null, 1, Math.random, log);
  }
  state.popstarLog = log;
}

function popstarDamage(actor, target, opts, qte, rng) {
  if (opts.fixed) return opts.fixed;
  if (opts.pct) {
    const base = Math.max(1, Math.round(target.maxHp * (opts.pct / 100)));
    return Math.min(base, Math.round(target.maxHp * (target.popstarDamageCap || 1)));
  }
  if (!opts.power) return 0;
  const element = opts.element || (actor.kirby && actor.kirby.form === "beam" ? "bolt" : "");
  const skill = {
    kind: opts.spell ? "spell" : "skill",
    element,
    effect: {
      power: opts.power,
      ignoreDef: !!opts.ignoreDef || !!actor.popstarIgnoreDef,
      sureCrit: !!opts.sureCrit || !!actor.popstarAlwaysCrit,
      superCrit: !!opts.superCrit,
    },
  };
  const blow = H.strike(actor, target, opts.power, qte, rng, skill.element, {
    swing: true,
    sureCrit: skill.effect.sureCrit,
    spell: false,
    ignoreDef: skill.effect.ignoreDef,
  });
  let amount = blow.amount;
  if (actor.side === "foe") amount = Math.round(amount * 1.35);
  if (actor.superCritNext) {
    actor.superCritNext = false;
    amount = Math.round(amount * 2.5);
  }
  return amount;
}

function rawHurt(target, amount) {
  const before = target.hp;
  target.hp = Math.max(0, target.hp - amount);
  target.hurtFrom = before;
  return target;
}

function fireGalacticCounter(state, actor, target, amount, log) {
  if (!target.galacticCounter || !(amount > 0) || !actor || actor.side === target.side) return false;
  target.galacticCounter = false;
  target.superCritNext = true;
  log.push("ギャラクティックカウンター！");
  const back = Math.max(1, amount);
  rawHurt(actor, back);
  log.push(`${actor.name}に ${back} ダメージ（反射）`);
  log.push(`${target.name}の次の攻撃は超会心`);
  return true;
}

function applyDamage(state, actor, target, amount, log, solo, opts) {
  const physical = !(opts && opts.spell);
  if (target.invincible > 0 || (physical && target.physicalImmune > 0)) {
    log.push(`${target.name}は攻撃を跳ね返した`);
    return target;
  }
  if (target.popstarDamageReduce) amount = Math.max(1, Math.round(amount * (1 - target.popstarDamageReduce)));
  if (target.popstarDamageCap) {
    const cap = Math.max(1, Math.round(target.maxHp * target.popstarDamageCap));
    amount = Math.min(amount, cap);
  }
  const countered = physical && fireGalacticCounter(state, actor, target, amount, log);
  const victim = rawHurt(target, amount);
  if (countered) return victim;
  if (actor.meta && actor.meta.metaKnights > 0 && victim.side === "ally") {
    const chip = Math.max(1, Math.round(actor.atk * 0.15));
    rawHurt(victim, chip);
    log.push(`メタナイツの追撃 ${chip}`);
  }
  friendsEnchantHit(state, actor, victim, log, Math.random);
  return victim;
}

function resolveIncoming(state, actor, target, amount, log, spell) {
  if (target.invincible > 0) {
    log.push(`${target.name}は無敵だ`);
    return { target, amount: 0, done: true };
  }
  if (!spell && target.physicalImmune > 0) {
    log.push(`${target.name}は攻撃を跳ね返した`);
    return { target, amount: 0, done: true };
  }
  amount = adjustDamage(amount, target);
  if (!spell) fireGalacticCounter(state, actor, target, amount, log);
  return { target, amount, done: false };
}

function friendsEnchantHit(state, actor, victim, log, rng) {
  if (actor.popstarRole !== "kirby" || !actor.kirby.friendsEnchant || victim.side !== "ally") return;
  if (actor.kirby.form === "beam" || victim.hp <= 0) return;
  const roll = rng();
  if (roll < 0.2) {
    victim.burn = 3;
    actor.kirby.enchant = "meraga";
    log.push("メラーガ");
  } else if (roll < 0.35) {
    const allies = H.living(state.foes).filter((u) => u.id !== actor.id);
    allies.forEach((u) => { u.hp = Math.min(u.maxHp, u.hp + Math.round(u.maxHp * 0.08)); });
    actor.kirby.enchant = "spla";
    log.push("スプラ");
  } else if (roll < 0.5) {
    victim.sleep = 2;
    actor.kirby.enchant = "blizza";
    log.push("ブリザ");
  } else if (roll < 0.65) {
    victim.paralyze = 2;
    actor.kirby.enchant = "ballikka";
    log.push("バリッカ");
  } else if (roll < 0.8) {
    const debuffs = (victim.auras || []).filter((aura) => ["atkDown", "defDown", "spdDown", "takenUp", "blind", "spellDown"].includes(aura.kind));
    H.living(state.allies).forEach((unit) => {
      if (unit.id === victim.id) return;
      if (debuffs.length) {
        debuffs.forEach((aura) => H.putAura(unit, aura.kind, aura.power || 0.15, Math.max(1, aura.rounds || 2), "ウィンガ"));
      } else {
        H.putAura(unit, "defDown", 0.15, 2, "ウィンガ");
      }
    });
    actor.kirby.enchant = "winga";
    log.push("ウィンガ");
  }
}

function beginPopCombo(state, actor, skill, chosen, spec, log) {
  const total = spec.hits || 1;
  if (skill.effect && skill.effect.metaKnights && actor.meta) {
    actor.meta.metaKnights = skill.effect.metaKnights;
  }
  state.combo = {
    popstar: true,
    actorId: actor.id,
    skillId: skill.id,
    chosen,
    left: total,
    total,
    spec: { ...spec, skillName: skill.name },
    label: skill.name,
    finale: spec.finale || 0,
    fixed: spec.fixed || 0,
    levelDown: !!spec.levelDown,
    qte: 1,
  };
  log.push(`${actor.name}の ${skill.name}`);
}

function pickComboTarget(party, combo, rng, first, last) {
  const spec = combo.spec || {};
  if (spec.all) {
    if (!combo.waveQueue || !combo.waveQueue.length) {
      combo.waveQueue = party.map((unit) => unit.id);
    }
    while (combo.waveQueue.length) {
      const id = combo.waveQueue.shift();
      const target = party.find((unit) => unit.id === id);
      if (target) return target;
    }
    return null;
  }
  let target = party[Math.floor(rng() * party.length)];
  const locked = combo.chosen && party.find((unit) => unit.id === combo.chosen);
  if (locked && (spec.locked || first || (last && combo.finale))) target = locked;
  return target;
}

function popComboHit(state, actor, combo, rng, log) {
  const party = attackTargets(state, actor);
  if (!party.length) return false;
  const spec = combo.spec || {};
  const first = combo.left === combo.total && !(combo.waveQueue && combo.waveQueue.length);
  const lastWave = combo.left === 1;
  const n = combo.total - combo.left + 1;
  combo.label = `${spec.skillName || combo.label || "連撃"} ${n}/${combo.total}`;
  const target = pickComboTarget(party, combo, rng, first, lastWave);
  if (!target) return false;
  const last = lastWave && !(combo.waveQueue && combo.waveQueue.length);
  let power = spec.power || 0.5;
  if (first && spec.opening) power = spec.opening;
  if (last && combo.finale) power = combo.finale;
  const hitOpts = { power, ignoreDef: true, element: spec.element };
  let amount = spec.fixedEach || (combo.fixed && last ? combo.fixed : popstarDamage(actor, target, hitOpts, combo.qte, rng));
  let crit = false;
  if (spec.crit && rng() < spec.crit) {
    amount = Math.round(amount * 1.8);
    crit = true;
  }
  const victim = applyDamage(state, actor, target, amount, log, true);
  log.push(`${victim.name}に ${amount} ダメージ${crit ? "（会心）" : ""}`);
  if (combo.levelDown && victim.hp > 0 && victim.side === "ally") {
    victim.levelDown = Math.min(5, (victim.levelDown || 0) + 1);
    log.push(`${victim.name}のレベルが下がった`);
  }
  if (last && spec.finaleParalyze && victim.hp > 0) {
    victim.paralyze = 2;
    H.putAura(victim, "defDown", 0.2, 3);
    H.putAura(victim, "spdDown", 0.2, 3);
    log.push(`${victim.name}はまひした。守備と素早さが下がった`);
  }
  sideEffects(victim, spec, rng, log);
  return true;
}

function stepMasterCombo(state, actor, combo, rng, log) {
  const party = H.living(state.allies);
  if (!party.length) {
    state.combo = null;
    return true;
  }
  if (combo.phase === "chip") {
    combo.label = `ミジンソード ${combo.total - combo.left + 1}/${combo.total}`;
    const target = party[Math.floor(rng() * party.length)];
    const amount = Math.max(1, Math.round(actor.atk * 0.02));
    H.hurt(state, target, amount, log, true);
    log.push(`${target.name}に ${amount} ダメージ`);
    combo.left -= 1;
    if (combo.left <= 0) {
      drama(log, "波動斬り");
      combo.phase = "wave";
      combo.waveQueue = party.map((unit) => unit.id);
      combo.label = "波動斬り";
    }
    return false;
  }
  if (combo.phase === "wave") {
    if (!combo.waveQueue || !combo.waveQueue.length) combo.waveQueue = party.map((unit) => unit.id);
    while (combo.waveQueue.length) {
      const id = combo.waveQueue.shift();
      const target = party.find((unit) => unit.id === id);
      if (!target) continue;
      const victim = applyDamage(state, actor, target, 999, log, true);
      log.push(`${victim.name}に 999 ダメージ`);
      break;
    }
    if (!(combo.waveQueue && combo.waveQueue.length)) {
      drama(log, "ファイナルソード！");
      combo.phase = "finale";
      combo.label = "ファイナルソード！";
    }
    return false;
  }
  const mark = party.find((unit) => unit.id === combo.chosen) || party[Math.floor(rng() * party.length)];
  if (mark) {
    const amount = popstarDamage(actor, mark, { power: 10 }, combo.qte || 1, rng);
    const victim = applyDamage(state, actor, mark, amount, log, true);
    log.push(`${victim.name}に ${amount} ダメージ`);
  }
  state.combo = null;
  return true;
}

function stepPopCombo(state, rng) {
  const log = [];
  const combo = state.combo;
  if (!combo || !combo.popstar) return { log, done: true };
  const actor = [...state.allies, ...state.foes].find((unit) => unit.id === combo.actorId);
  if (!actor || actor.hp <= 0) {
    state.combo = null;
    return { log, done: true };
  }
  if (combo.master) {
    stepMasterCombo(state, actor, combo, rng, log);
    return { log, done: !state.combo };
  }
  if (!(combo.left > 0) || !popComboHit(state, actor, combo, rng, log)) {
    state.combo = null;
    return { log, done: true };
  }
  const waveDone = !(combo.spec && combo.spec.all) || !(combo.waveQueue && combo.waveQueue.length);
  if (waveDone) {
    combo.left -= 1;
    if (combo.left <= 0) state.combo = null;
  }
  return { log, done: !state.combo };
}

function attackTargets(state, actor) {
  return actor.side === "foe" ? H.living(state.allies) : H.living(state.foes);
}

function sideEffects(target, opts, rng, log) {
  if (target.hp <= 0) return;
  if (opts.atkDown) {
    H.putAura(target, "atkDown", opts.atkDown, opts.rounds || 3);
    log.push(`${target.name}の攻撃が下がった`);
  }
  if (opts.defDown) {
    H.putAura(target, "defDown", opts.defDown, opts.rounds || 3);
    log.push(`${target.name}の守備が下がった`);
  }
  if (opts.confuse && rng() < opts.confuse) {
    target.confuse = 3;
    log.push(`${target.name}は混乱した`);
  }
  if (opts.paralyze && rng() < opts.paralyze) {
    target.paralyze = 2;
    log.push(`${target.name}はまひした`);
  }
  if (opts.trip && rng() < opts.trip) {
    target.trip = 1;
    log.push(`${target.name}は転んだ（休み）`);
  }
  if (opts.blind) {
    target.blind = Math.max(target.blind || 0, opts.blind);
    log.push(`${target.name}は幻惑された`);
  }
  if (opts.burn) {
    target.burn = 2;
    log.push(`${target.name}は炎上した`);
  }
  if (opts.sleep) {
    target.sleep = 2;
    log.push(`${target.name}は動けなくなった`);
  }
  if (opts.dispel) {
    target.auras = (target.auras || []).filter((a) => a.kind === "atkDown" || a.kind === "defDown");
    log.push(`${target.name}のバフが消えた`);
  }
}

function hitAll(state, actor, opts, qte, rng, log) {
  attackTargets(state, actor).forEach((target) => {
    if (opts.fixedAll || opts.power || opts.pct) {
      const amount = opts.fixedAll ? opts.fixedAll : popstarDamage(actor, target, opts, qte, rng);
      const victim = applyDamage(state, actor, target, amount, log, false);
      log.push(`${victim.name}に ${amount} ダメージ`);
    }
    sideEffects(target, opts, rng, log);
  });
}

function castMove(state, actor, skill, chosen, qte, rng, log) {
  const effect = skill.effect || {};
  const key = effect.popstar;
  if (effect.charge && !actor.chargeReady) {
    actor.chargeSkill = key;
    actor.chargeLeft = effect.charge;
    log.push(`${actor.name}の ${skill.name}`);
    log.push(`${actor.name}は力を溜めている`);
    return log;
  }
  actor.chargeReady = false;
  if (effect.opener) {
    if (key === "starWarrior") {
      actor.popstarDebuffImmune = true;
      H.putAura(actor, "atkUp", 0.5, 99);
      H.putAura(actor, "defUp", 0.5, 99);
      log.push("星の戦士の加護");
    } else if (key === "courageGuide") actor.popstarIgnoreDef = true;
    else if (key === "pinkDevil") actor.popstarAlwaysCrit = true;
    else if (key === "dignity") H.putAura(actor, "atkUp", 0.4, 99);
    else if (key === "hammerSkill") actor.sureHit = true;
    else if (key === "braveBandana") actor.popstarDebuffImmune = true;
    else if (key === "knightCode" && effect.onPlayers) {
      H.living(state.allies).forEach((unit) => {
        H.putAura(unit, "atkUp", 0.25, 5);
        H.putAura(unit, "defUp", 0.25, 5);
      });
      log.push("騎士道…勇者側の攻撃と守備が上がった");
    }
    log.push(`${actor.name}の ${skill.name}`);
    return log;
  }
  if (effect.dramaLines) effect.dramaLines.forEach((line) => drama(log, line));
  else if (effect.drama) drama(log, skill.name);
  if (effect.masterScript) {
    drama(log, "マスター！をコピーした！");
    drama(log, "ミジンソード");
    state.combo = {
      popstar: true,
      master: true,
      phase: "chip",
      actorId: actor.id,
      chosen,
      left: 100,
      total: 100,
      label: "ミジンソード",
      qte: Number(qte) > 0 ? Number(qte) : 1,
    };
    return log;
  }
  if (effect.hydra) {
    if (rng() < 0.5) {
      drama(log, "メガキャノン！");
      const mark = H.living(state.allies).find((u) => u.id === chosen) || H.living(state.allies)[0];
      if (mark) {
        mark.endure = 0;
        mark.surviveOnce = false;
        const victim = applyDamage(state, actor, mark, 9999, log, true);
        log.push(`${victim.name}に 9999 ダメージ（ふみとどまり無効）`);
      }
      return log;
    }
    drama(log, "神速のクイックスピン！");
    beginPopCombo(state, actor, popstarSkill("quickSpin"), chosen, { hits: 3, power: 10 }, log);
    return log;
  }
  if (effect.kirbyCopy) {
    giveKirbyCopy(state, log, rng);
    log.push(`${actor.name}の ${skill.name}`);
    return log;
  }
  if (effect.kirbySerious || (key === "maximTomato" && effect.foeFullHeal)) {
    drama(log, "みんなにマキシムトマト");
    (state.foes || []).forEach((unit) => { unit.hp = unit.maxHp; });
    log.push("ポップスターのみんなが全回復した");
    if (actor.bandana) actor.bandana.maximUsed = true;
    actor.skills = actor.skills.filter((s) => s.effect.popstar !== "maximTomato");
    awakenKirbySerious(state, log);
    return log;
  }
  if (effect.foeHeal) {
    H.living(state.foes).forEach((unit) => {
      const gain = H.healUnit(unit, effect.foeHeal);
      if (gain > 0) log.push(`${unit.name}は ${gain} 回復した`);
    });
    log.push(`${actor.name}の ${skill.name}`);
    return log;
  }
  if (effect.foeFullHeal && !effect.kirbySerious) {
    H.living(state.foes).forEach((unit) => { unit.hp = unit.maxHp; log.push(`${unit.name}は全回復した`); });
    return log;
  }
  if (effect.foeBuff) {
    log.push(`${actor.name}の ${skill.name}`);
    H.living(state.foes).forEach((unit) => {
      H.putAura(unit, "atkUp", effect.atkUp || 0.3, effect.rounds || 3);
      if (effect.crit) unit.critAura = Math.max(unit.critAura || 0, effect.crit);
      if (effect.recast && unit.id !== actor.id) unit.extra = true;
    });
    log.push("ポップスターのみんなの攻撃と会心率が上がった");
    if (effect.recast) log.push("仲間がもう一度動ける");
    return log;
  }
  if (effect.reviveFoes) {
    (state.foes || []).forEach((unit) => {
      if (unit.hp <= 0) unit.hp = unit.maxHp;
      else unit.hp = unit.maxHp;
    });
    log.push("虹の剣！敵が全員復活し全回復した");
    return log;
  }
  if (effect.galacticCounter && !effect.power) {
    actor.galacticCounter = true;
    log.push(`${actor.name}の ${skill.name}`);
    log.push("ギャラクティックカウンターの構え");
    return log;
  }
  if (effect.dededeCover) {
    actor.dedede.coverAll = effect.dededeCover;
    actor.popstarDebuffImmune = true;
    log.push("デデデ大王が仲間を庇う");
    return log;
  }
  if (effect.maskTransform) {
    actor.dedede.mask = 3;
    actor.menace = 3;
    log.push("マスクドデデデに変身！行動が増える");
    return log;
  }
  if (effect.jumpWindup) {
    actor.dedede.jump = { left: 1, invuln: true };
    actor.physicalImmune = 1;
    log.push("スーパーデデデジャンプ…跳び上がった");
    return log;
  }
  if (effect.wadCopter) {
    actor.physicalImmune = effect.wadCopter;
    actor.wadCopter = effect.wadCopter;
    log.push(`${actor.name}の ${skill.name}　${effect.wadCopter}ラウンド物理無効`);
    return log;
  }
  if (effect.physicalImmune) {
    actor.physicalImmune = effect.physicalImmune;
    log.push(`${actor.name}の ${skill.name}`);
    return log;
  }
  if (effect.invincible) {
    const mates = H.living(state.foes).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
    const target = mates[0];
    if (target) {
      target.invincible = effect.invincible;
      log.push(`${target.name}に無敵キャンディ`);
    }
    return log;
  }
  if (effect.combo) {
    beginPopCombo(state, actor, skill, chosen, effect.combo, log);
    return log;
  }
  if (effect.kirbyReset && effect.fixedAll) {
    hitAll(state, actor, { fixedAll: effect.fixedAll }, qte, rng, log);
    if (actor.kirby) {
      actor.kirby.form = "plain";
      actor.kirby.copy = false;
      refreshKirbySkills(actor);
      log.push("カービィはすっぴんに戻った");
    }
    return log;
  }
  if (!effect.drama) log.push(`${actor.name}の ${skill.name}`);
  if (effect.instakill) {
    const left = H.living(state.allies);
    const target = left.find((u) => u.id === chosen) || left[Math.floor(rng() * left.length)];
    if (target) {
      target.hp = 0;
      log.push(`${target.name}は戦闘不能になった`);
    }
    return log;
  }
  if (effect.fixed) {
    H.targetsOf(state, actor, skill, chosen).forEach((target) => {
      const victim = applyDamage(state, actor, target, effect.fixed, log, true);
      log.push(`${victim.name}に ${effect.fixed} ダメージ`);
    });
    return log;
  }
  if ((skill.target === "all" || effect.fixedAll) && (effect.power || effect.fixedAll || effect.pct)) {
    const party = attackTargets(state, actor);
    if (party.length > 1) {
      state.combo = {
        popstar: true,
        actorId: actor.id,
        skillId: skill.id,
        chosen,
        left: 1,
        total: 1,
        waveQueue: party.map((unit) => unit.id),
        spec: {
          skillName: skill.name,
          all: true,
          power: effect.power,
          pct: effect.pct,
          fixedEach: effect.fixedAll || 0,
          element: effect.element,
          atkDown: effect.atkDown,
          defDown: effect.defDown,
          confuse: effect.confuse,
          paralyze: effect.paralyze,
          trip: effect.trip,
          dispel: effect.dispel,
          rounds: effect.rounds,
        },
        label: skill.name,
        finale: 0,
        fixed: 0,
        levelDown: false,
        qte: Number(qte) > 0 ? Number(qte) : 1,
      };
      if (effect.metaKnights && actor.meta) {
        actor.meta.metaKnights = effect.metaKnights;
        log.push(`メタナイツが追撃の構え　${effect.metaKnights}ラウンド`);
      }
      return log;
    }
    hitAll(state, actor, effect, qte, rng, log);
  } else if (skill.target === "all" || effect.fixedAll) {
    hitAll(state, actor, effect, qte, rng, log);
  } else {
    H.targetsOf(state, actor, skill, chosen).forEach((target) => {
      let amount = popstarDamage(actor, target, effect, qte, rng);
      let crit = false;
      if (effect.crit && rng() < effect.crit) {
        amount = Math.round(amount * 1.8);
        crit = true;
      }
      if (amount > 0) {
        const victim = applyDamage(state, actor, target, amount, log, true);
        log.push(`${victim.name}に ${amount} ダメージ${crit ? "（会心）" : ""}`);
      }
      sideEffects(target, effect, rng, log);
    });
  }
  if (effect.metaKnights && actor.meta) {
    actor.meta.metaKnights = effect.metaKnights;
    log.push(`メタナイツが追撃の構え　${effect.metaKnights}ラウンド`);
  }
  if (effect.atkUp && !effect.foeBuff) {
    H.putAura(actor, "atkUp", effect.atkUp, effect.rounds || 3);
    log.push(`${actor.name}の攻撃が上がった`);
  }
  if (effect.galacticCounter) actor.galacticCounter = true;
  return log;
}

function cast(state, actor, skill, chosen, qte, rng, log) {
  if (actor.chargeLeft > 0 && actor.chargeSkill) {
    actor.chargeLeft -= 1;
    if (actor.chargeLeft > 0) {
      log.push(`${actor.name}は力を溜めている`);
      return log;
    }
    const charged = popstarSkill(actor.chargeSkill);
    actor.chargeSkill = null;
    actor.chargeReady = true;
    return castMove(state, actor, charged, chosen, qte, rng, log);
  }
  return castMove(state, actor, skill, chosen, qte, rng, log);
}

function pickRandom(list, rng) {
  return list[Math.floor(rng() * list.length)];
}

function enemyPick(unit, state, rng) {
  const party = H.living(state.allies);
  const weakest = party.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  const mark = weakest || party[0];
  if (!mark) return null;
  if (unit.popstarRole === "bandana") {
    const team = state.foes || [];
    const down = team.filter((f) => f.hp <= 0 && f.id !== unit.id).length;
    const teamRate = team.reduce((sum, f) => sum + Math.max(0, f.hp), 0) / team.reduce((sum, f) => sum + f.maxHp, 0);
    if (!unit.bandana.maximUsed && (down >= 2 || teamRate < 0.35)) {
      return { skill: popstarSkill("maximTomato"), target: unit.id };
    }
    const hurt = H.living(team).filter((f) => f.hp < f.maxHp * 0.7);
    if (hurt.length && rng() < 0.4) return { skill: popstarSkill("energyDrink"), target: unit.id };
    const weakFoe = H.living(team).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (weakFoe && weakFoe.hp < weakFoe.maxHp * 0.4 && !(weakFoe.invincible > 0) && rng() < 0.4) {
      return { skill: popstarSkill("invincibleCandy"), target: weakFoe.id };
    }
    if (rng() < 0.2) return { skill: popstarSkill("abilitySeed"), target: unit.id };
    const pool = ["earthStamp", "earthStamp", "wadCopter", "cheerPom"].filter((id) => id !== "wadCopter" || !(unit.wadCopter > 0));
    return { skill: popstarSkill(pickRandom(pool, rng)), target: mark.id };
  }
  if (unit.popstarRole === "kirby" && unit.kirby.serious) {
    const dead = (state.foes || []).some((f) => f.hp <= 0);
    if (dead && rng() < 0.4) return { skill: popstarSkill("rainbowSword"), target: unit.id };
    const pool = unit.skills.filter((s) => s.effect.popstar !== "rainbowSword" && !s.effect.opener);
    const skill = pickRandom(pool, rng);
    return { skill, target: mark.id };
  }
  if (unit.popstarRole === "dedede") {
    if ((unit.dedede.coverAll || 0) <= 0 && rng() < 0.35) return { skill: popstarSkill("coverAll"), target: unit.id };
    if (unit.dedede.mask > 0 && rng() < 0.5) return { skill: popstarSkill("newHammerCombo"), target: mark.id };
    if (rng() < 0.25) return { skill: popstarSkill("maskedDedede"), target: unit.id };
  }
  if (unit.popstarRole === "meta" && rng() < 0.3) return { skill: popstarSkill("gCounter"), target: unit.id };
  const blows = unit.skills.filter((s) => !s.effect.opener);
  const skill = pickRandom(blows.length ? blows : unit.skills, rng);
  const t = skill.target === "self" || skill.target === "allies" ? unit.id : mark.id;
  return { skill, target: t };
}

function redirectTarget(state, target, solo) {
  if (!solo || target.side !== "foe") return target;
  const dedede = findDedede(state);
  if (!dedede || dedede.hp <= 0 || (dedede.dedede.coverAll || 0) <= 0) return target;
  if (target.id === dedede.id) return target;
  return dedede;
}

function adjustDamage(amount, victim) {
  if (!victim.popstarDamageReduce && !victim.popstarDamageCap) return amount;
  if (victim.popstarDamageReduce) amount = Math.max(1, Math.round(amount * (1 - victim.popstarDamageReduce)));
  if (victim.popstarDamageCap) amount = Math.min(amount, Math.max(1, Math.round(victim.maxHp * victim.popstarDamageCap)));
  return amount;
}

function endRound(state, log) {
  (state.allies || []).forEach((unit) => {
    if (unit.hp <= 0 || !(unit.burn > 0)) return;
    const dot = Math.max(1, Math.round(unit.maxHp * 0.06));
    unit.hp = Math.max(0, unit.hp - dot);
    unit.burn -= 1;
    log.push(`${unit.name}は炎上で ${dot} ダメージ`);
  });
  (state.foes || []).forEach((unit) => {
    if (unit.hp > 0 && unit.wadCopter > 0) {
      unit.wadCopter -= 1;
      if (unit.wadCopter <= 0) {
        const party = H.living(state.allies);
        const mark = party[Math.floor(Math.random() * party.length)];
        drama(log, "月落とし");
        if (mark) {
          const amount = popstarDamage(unit, mark, { power: 1.6 }, 1, Math.random);
          const victim = H.hurt(state, mark, amount, log, true);
          log.push(`${victim.name}に ${amount} ダメージ`);
        }
      }
    }
  });
  (state.foes || []).forEach((unit) => {
    if (unit.hp <= 0) return;
    if (unit.burn > 0) {
      const dot = Math.max(1, Math.round(unit.maxHp * 0.06));
      unit.hp = Math.max(0, unit.hp - dot);
      unit.burn -= 1;
      log.push(`${unit.name}は炎上で ${dot} ダメージ`);
    }
    if (unit.dedede && unit.dedede.jump && unit.dedede.jump.left > 0) {
      unit.dedede.jump.left -= 1;
      if (unit.dedede.jump.left <= 0) {
        unit.physicalImmune = 0;
        hitAll({ allies: state.allies, foes: state.foes }, unit, { power: 1.35, confuse: 0.5, paralyze: 0.4 }, 1, Math.random, log);
        log.push("スーパーデデデジャンプが落下！");
        unit.dedede.jump = null;
      }
    }
    if (unit.dedede && unit.dedede.mask > 0) unit.dedede.mask -= 1;
    if (unit.dedede && unit.dedede.coverAll > 0) unit.dedede.coverAll -= 1;
    if (unit.physicalImmune > 0) unit.physicalImmune -= 1;
    if (unit.invincible > 0) unit.invincible -= 1;
    if (unit.meta && unit.meta.metaKnights > 0) unit.meta.metaKnights -= 1;
    if (unit.dedede && unit.dedede.mask <= 0 && unit.menace > 2) unit.menace = 2;
  });
}

const PopstarBattle = {
  bind,
  createUnit,
  initBattle,
  cast,
  enemyPick,
  stepCombo: stepPopCombo,
  redirectTarget,
  adjustDamage,
  resolveIncoming,
  endRound,
  refreshKirbySkills,
};

if (typeof module !== "undefined" && module.exports) module.exports = PopstarBattle;
if (typeof window !== "undefined") window.PopstarBattle = PopstarBattle;})();
