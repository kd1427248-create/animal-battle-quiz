// 街・成長・戦闘。ダメージは battle.js と同じ形（攻撃 × 威力 × 守備補正 × タイミング × 会心 × 乱数）。
const Book = typeof window !== "undefined" ? window.JobBook : require("./data.js");
const PopstarBattle = typeof window !== "undefined" ? window.PopstarBattle : require("./popstar-battle.js");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function blankSave(name) {
  return {
    name: name || "ゆうしゃ",
    job: "",
    level: 1,
    xp: 0,
    jobLevels: {},
    gold: 0,
    materials: {},
    weapon: null,
    armor: null,
    hp: null,
    mp: null,
    region: null,
    step: 0,
    cleared: [],
    gear: [],
    raids: [],
    difficulty: 1,
    diffCleared: [],
  };
}

function wornItem(save, slot) {
  const id = save && save[slot];
  const item = id && Book.WEAPONS[id];
  if (!item || !save.job) return null;
  const itemSlot = item.slot === "armor" ? "armor" : "weapon";
  if (itemSlot !== slot) return null;
  if (item.jobs && !item.jobs.includes(save.job)) return null;
  return item;
}

function growth(save) {
  const job = Book.JOBS[save.job] || { hp: 20, mp: 0, atk: 8, def: 6, spd: 8 };
  const level = (save.jobLevels && save.jobLevels[save.job]) || 1;
  const steps = Math.max(0, level - 1);
  const weapon = wornItem(save, "weapon");
  const armor = wornItem(save, "armor");
  return {
    maxHp: Math.round(job.hp * (1 + 0.06 * steps)) + (armor && armor.hp ? armor.hp : 0) + (save.hpBoost || 0),
    maxMp: job.mp + steps * 2 + (armor && armor.mp ? armor.mp : 0) + (save.mpBoost || 0),
    atk: job.atk + steps * 3 + (weapon && weapon.atk ? weapon.atk : 0) + (save.atkBoost || 0),
    def: job.def + steps * 2 + (armor && armor.def ? armor.def : 0) + (save.defBoost || 0),
    spd: job.spd + steps + (weapon && weapon.spd ? weapon.spd : 0) + (armor && armor.spd ? armor.spd : 0) + (save.spdBoost || 0),
  };
}

function restAtTown(save) {
  const stats = growth(save);
  save.hp = stats.maxHp;
  save.mp = stats.maxMp;
  save.region = null;
  save.step = 0;
  save.tripXp = 0;
  save.tripScent = 0;
}

function ensureVitals(save) {
  const stats = growth(save);
  if (save.hp == null) save.hp = stats.maxHp;
  if (save.mp == null) save.mp = stats.maxMp;
  save.hp = Math.max(0, Math.min(stats.maxHp, save.hp));
  save.mp = Math.max(0, Math.min(stats.maxMp, save.mp));
  return stats;
}

function xpNeed(level) {
  return 16 + level * 12;
}

function rememberLevel(save) {
  if (!save.jobLevels) save.jobLevels = {};
  const cap = Book.LEVEL_CAP || 99;
  Object.keys(save.jobLevels).forEach((id) => {
    save.jobLevels[id] = Math.min(cap, Math.max(1, Number(save.jobLevels[id]) || 1));
  });
  if (!save.job) return save.jobLevels;
  const recorded = Number(save.jobLevels[save.job]) || 1;
  const shown = Number(save.level) || 1;
  save.jobLevels[save.job] = Math.min(cap, Math.max(recorded, shown));
  save.level = save.jobLevels[save.job];
  if (save.level >= cap) save.xp = 0;
  return save.jobLevels;
}

function sageReady(jobLevels) {
  const levels = jobLevels || {};
  const priest = Number(levels.priest) || 0;
  const mage = Number(levels.mage) || 0;
  const gadabout = Number(levels.gadabout) || 0;
  return (priest >= 20 && mage >= 20) || gadabout >= 25;
}

function gainXp(save, amount) {
  const notes = [];
  const cap = Book.LEVEL_CAP || 99;
  rememberLevel(save);
  if (!save.job || save.level >= cap) {
    save.xp = 0;
    if ((amount || 0) > 0) notes.push("レベル99なので経験値は入らない");
    return notes;
  }
  save.xp += Math.max(0, amount || 0);
  while (save.level < cap && save.xp >= xpNeed(save.level)) {
    save.xp -= xpNeed(save.level);
    const prev = save.level;
    save.jobLevels[save.job] = prev + 1;
    save.level = save.jobLevels[save.job];
    notes.push(`${Book.JOBS[save.job].name} レベル ${save.level}`);
    Book.jobSkills(save.job, save.level).forEach((skill) => {
      if (skill.id === "attack") return;
      if (Book.jobSkills(save.job, prev).some((item) => item.id === skill.id)) return;
      notes.push(`${skill.name}を覚えた`);
    });
  }
  if (save.level >= cap) {
    save.xp = 0;
    notes.push("レベル99で止まった");
  }
  const stats = growth(save);
  save.hp = Math.max(0, Math.min(stats.maxHp, save.hp));
  save.mp = Math.max(0, Math.min(stats.maxMp, save.mp));
  return notes;
}

function chooseJob(save, jobId) {
  const first = !save.job;
  rememberLevel(save);
  const advanced = !first && Book.JOBS[jobId] && Book.JOBS[jobId].rank === "advanced";
  const ready = jobId === "sage" ? sageReady(save.jobLevels) : Book.promotionReady(save.jobLevels, jobId);
  if (advanced && !ready) return false;
  if (!first && Book.JOBS[jobId].rank === "advanced") save.gold -= 0;
  save.job = jobId;
  if (!save.jobLevels[jobId]) save.jobLevels[jobId] = 1;
  save.level = save.jobLevels[jobId];
  save.xp = 0;
  ["weapon", "armor"].forEach((slot) => {
    if (save[slot] && !canEquip(save, save[slot])) save[slot] = null;
  });
  restAtTown(save);
  return true;
}

function canEquip(save, itemId) {
  const item = Book.WEAPONS[itemId];
  if (!item) return false;
  if (!item.jobs) return true;
  return item.jobs.includes(save.job);
}

function unitFromSave(save, seat) {
  const stats = growth(save);
  ensureVitals(save);
  const weapon = wornItem(save, "weapon");
  const armor = wornItem(save, "armor");
  return {
    id: `a${seat}`,
    seat,
    name: save.name,
    job: save.job,
    side: "ally",
    hp: save.hp,
    maxHp: stats.maxHp,
    mp: save.mp,
    maxMp: stats.maxMp,
    atk: stats.atk,
    def: stats.def,
    spd: stats.spd,
    skills: (() => {
      const list = Book.jobSkills(save.job, save.level).map((skill) => ({
        ...skill,
        effect: { ...(skill.effect || {}) },
      }));
      const attack = list.find((skill) => skill.id === "attack");
      if (attack && weapon) {
        if (weapon.group) attack.target = "all";
        if (weapon.hits > 1) attack.effect = { ...(attack.effect || {}), hits: weapon.hits };
      }
      if (weapon && weapon.grant && Book.SKILLS[weapon.grant] && !list.some((skill) => skill.id === weapon.grant)) {
        list.push({ id: weapon.grant, ...Book.SKILLS[weapon.grant] });
      }
      return list;
    })(),
    auras: [],
    nextPower: 0,
    cover: null,
    cutCharge: 0,
    sleep: 0,
    poison: 0,
    charm: 0,
    confuse: 0,
    trait: Book.JOBS[save.job].trait || "",
    material: null,
    weaponPoison: weapon && weapon.poison || 0,
    weaponElement: weapon && weapon.element || "",
    weaponCrit: weapon && weapon.crit || 0,
    weaponCritIgnore: !!(weapon && weapon.critIgnore),
    weaponPartyHeal: weapon && weapon.partyHealOnHit || 0,
    weaponLevelDown: !!(weapon && weapon.levelDown),
    weaponOverkill: !!(weapon && weapon.overkill),
    weaponSpell: (weapon && weapon.spell || 0) + (armor && armor.spell || 0),
    weaponDrain: weapon && weapon.drain || 0,
    weaponDragon: !!(weapon && weapon.dragon),
    weaponPierce: weapon && weapon.pierce || 0,
    weaponPierceChance: weapon && weapon.pierceChance != null ? weapon.pierceChance : 1,
    weaponSleep: weapon && weapon.sleep || 0,
    weaponParalyze: weapon && weapon.paralyze || 0,
    weaponCharm: weapon && weapon.charm || 0,
    armorSpellCut: armor && armor.spellCut || 0,
    armorBreathCut: armor && armor.breathCut || 0,
    armorPhysCut: armor && armor.physCut || 0,
    armorDodge: armor && armor.dodge || 0,
    armorRegen: armor && armor.regen || 0,
    weaponGroup: !!(weapon && weapon.group),
    weaponHits: weapon && weapon.hits || 1,
    weaponDeath: weapon && weapon.death || 0,
    weaponMiss: weapon && weapon.miss || 0,
    weaponRecoil: weapon && weapon.recoil || 0,
    weaponMpOnHit: weapon && weapon.mpOnHit || 0,
    weaponMetal: weapon && weapon.metalHit || 0,
    weaponBeast: !!(weapon && weapon.beast),
    weaponUndead: !!(weapon && weapon.undead),
    curse: Math.max(weapon && weapon.curse || 0, armor && armor.curse || 0),
    armorFireCut: armor && armor.fireCut || 0,
    armorIceCut: armor && armor.iceCut || 0,
    armorThorns: armor && armor.thorns || 0,
    armorMpCut: armor && armor.mpCut || 0,
    deathResist: !!(armor && armor.deathResist),
    silenceResist: !!(armor && armor.silenceResist),
    statusResist: !!(armor && armor.statusResist),
    special: [weapon && weapon.special, armor && armor.special].filter(Boolean).join("／"),
  };
}

function blankRep() {
  return {
    phase: 1, taken: 0, cloak: true, tension: 0, doom: 0, doomReady: false,
    frenzy: false, skip: 0, calm: 0, opened: false, step: 0, power: 1,
    wall: false, mend: false, hurt: 0, usedUlts: [], fireUlt: false,
    howled: false, hold: false, pendingUlt: "",
  };
}

function unitFromMonster(monsterId, index, partySize, difficulty) {
  if (monsterId === "rep") {
    return {
      id: `f${index}`,
      name: "代表",
      side: "foe",
      hp: 1000,
      maxHp: 1000,
      mp: 40,
      maxMp: 40,
      atk: 63,
      def: 40,
      spd: 100,
      skills: [{ id: "rep", name: "代表", mp: 0, target: "one", kind: "skill", effect: {} }],
      auras: [],
      nextPower: 0,
      cover: null,
      cutCharge: 0,
      sleep: 0,
      poison: 0,
      charm: 0,
      confuse: 0,
      trait: "",
      material: null,
      gold: 220,
      xp: 180,
      menace: 2,
      metal: false,
      flee: 0,
      weak: "",
      boss: true,
      rep: blankRep(),
    };
  }
  if (monsterId === "ryuou") {
    return {
      id: `f${index}`,
      name: "りゅうおう",
      side: "foe",
      hp: 3200,
      maxHp: 3200,
      mp: 999,
      maxMp: 999,
      atk: 130,
      def: 80,
      spd: 85,
      skills: [{ id: "attack", name: "通常攻撃", mp: 0, target: "one", kind: "skill", effect: { power: 1 } }],
      auras: [],
      nextPower: 0,
      cover: null,
      cutCharge: 0,
      sleep: 0,
      poison: 0,
      charm: 0,
      confuse: 0,
      trait: "",
      material: "orb",
      gold: 800,
      xp: 500,
      menace: 2,
      metal: false,
      flee: 0,
      weak: "bolt",
      boss: true,
      species: "dragon",
      spellReflect: 0,
      dragon: { phase: 1, step: 0, hold: false, focus: false, wave: false },
    };
  }
  if (monsterId === "demise") {
    return {
      id: `f${index}`,
      name: "終焉の獣",
      side: "foe",
      hp: 36000,
      maxHp: 36000,
      mp: 999,
      maxMp: 999,
      atk: 280,
      def: 170,
      spd: 150,
      skills: [{ id: "demise", name: "終焉", mp: 0, target: "one", kind: "skill", effect: { demise: true } }],
      auras: [],
      nextPower: 0,
      cover: null,
      cutCharge: 0,
      sleep: 0,
      poison: 0,
      charm: 0,
      confuse: 0,
      trait: "",
      material: "orb",
      gold: 8000,
      xp: 2400,
      menace: 3,
      metal: false,
      flee: 0,
      weak: "",
      boss: true,
      statusResist: true,
      deathResist: true,
      silenceResist: true,
      demise: { phase: 1, step: 0, hold: false, pending: "" },
    };
  }
  if (monsterId === "kirby" || monsterId === "metaknight" || monsterId === "dedede" || monsterId === "bandana") {
    if (PopstarBattle && PopstarBattle.createUnit) return PopstarBattle.createUnit(monsterId, index);
  }
  const src = Book.MONSTERS[monsterId];
  const rank = Book.difficultyOf(difficulty);
  const scale = src.boss && partySize > 1 ? partySize / 2 : 1;
  return {
    id: `f${index}`,
    name: src.name,
    side: "foe",
    hp: Math.round(src.hp * scale * rank.hp),
    maxHp: Math.round(src.hp * scale * rank.hp),
    mp: src.mp,
    maxMp: src.mp,
    atk: Math.round(src.atk * rank.atk),
    def: Math.round(src.def * rank.def),
    spd: Math.round(src.spd * (rank.spd || 1)),
    skills: (src.skills || []).map((id) => {
      const skill = Book.SKILLS[id] || Book.SKILLS.attack;
      return { id, ...skill, effect: { ...(skill.effect || {}) } };
    }),
    auras: [],
    nextPower: 0,
    cover: null,
    cutCharge: 0,
    sleep: 0,
    poison: 0,
    charm: 0,
    confuse: 0,
    trait: "",
    material: src.material && (src.dropRate == null || Math.random() < src.dropRate) ? src.material : null,
    gold: Math.round(src.gold * rank.reward),
    xp: Math.round(src.xp * (rank.xp || rank.reward)),
    menace: src.boss ? 2 : 1,
    boss: !!src.boss,
    extraAct: !!(rank.twice && !src.boss),
    metal: !!src.metal,
    flee: src.flee || 0,
    weak: src.weak || "",
  };
}

function living(list) {
  return list.filter((unit) => unit.hp > 0);
}

const AURA_CAP = { atkUp: 1.2, atkDown: 0.6, defUp: 1.2, defDown: 0.6, spellPower: 1.2, takenUp: 0.8, breathCut: 0.75, spellDown: 0.6 };

function auraSum(unit, kind) {
  return (unit.auras || []).filter((aura) => aura.kind === kind).reduce((sum, aura) => sum + aura.value, 0);
}

function putAura(unit, kind, value, rounds, label) {
  unit.auras = unit.auras || [];
  if (label) unit.auras = unit.auras.filter((aura) => aura.label !== label);
  unit.auras.push({ kind, value, rounds, label: label || "" });
  const cap = AURA_CAP[kind];
  const sum = auraSum(unit, kind);
  if (!cap || sum <= cap) return;
  const scale = cap / sum;
  unit.auras.forEach((aura) => {
    if (aura.kind === kind) aura.value *= scale;
  });
}

function putMark(unit, label, tone, rounds) {
  unit.marks = (unit.marks || []).filter((mark) => mark.label !== label);
  unit.marks.push({ label, tone, rounds });
}

function levelFactor(unit) {
  const stacks = Math.max(0, Math.min(5, (unit && unit.levelDown) || 0));
  return 1 - stacks * 0.05;
}

function strike(actor, target, power, qte, rng, element, flags) {
  const spell = !!(flags && flags.spell);
  const critRate = 0.05 + ((flags && flags.swing) ? (actor.weaponCrit || 0) : 0) + ((flags && flags.superCrit) ? 0.25 : 0) + Math.max(0, actor.critAura || 0);
  const spiked = (flags && flags.sureCrit) || rng() < Math.min(0.95, critRate);
  const crit = spiked && !spell;
  const surge = spiked && spell;
  const superCrit = !!(spiked && flags && flags.superCrit && !spell);
  const atkMod = Math.min(1.2, Math.max(0, auraSum(actor, "atkUp"))) - Math.min(0.6, Math.max(0, auraSum(actor, "atkDown")));
  const atk = actor.atk * levelFactor(actor) * (1 + atkMod + (actor.nextPower || 0));
  const defMod = Math.min(1.2, Math.max(0, auraSum(target, "defUp"))) - Math.min(0.6, Math.max(0, auraSum(target, "defDown")));
  const metalCrit = !!(target.metal && spiked && !spell);
  let def = Math.max(0, target.def * levelFactor(target) * (1 + defMod));
  if ((flags && flags.ignoreDef) || metalCrit || (crit && actor.weaponCritIgnore)) def = 0;
  else if (flags && flags.swing && actor.weaponPierce && rng() < (actor.weaponPierceChance == null ? 1 : actor.weaponPierceChance)) def *= 1 - actor.weaponPierce;
  const elements = (flags && flags.elements && flags.elements.length) ? flags.elements : (element ? [element] : []);
  const mixed = !!(flags && flags.elements && flags.elements.length);
  let amount = atk * power * (100 / (100 + def)) * qte * (superCrit ? 2 : spiked ? 1.5 : 1) * (0.9 + rng() * 0.2);
  if (target.cutCharge) amount *= 1 - target.cutCharge;
  amount *= 1 + Math.max(0, auraSum(target, "takenUp"));
  if (!(flags && flags.ignoreResist)) {
    if (flags && flags.spell) {
      const cut = Math.min(0.6, Math.max(0, auraSum(target, "spellCut")) + Math.max(0, target.armorSpellCut || 0));
      const down = Math.min(0.6, Math.max(0, auraSum(target, "spellDown")));
      amount *= Math.max(0.4, 1 - cut + down);
    }
    const breathGuard = Math.max(0, target.armorBreathCut || 0) + Math.max(0, auraSum(target, "breathCut"));
    if (elements.includes("breath") && breathGuard > 0) amount *= 1 - Math.min(0.75, breathGuard);
    if (!(flags && flags.spell) && !elements.includes("breath") && !mixed && target.armorPhysCut) amount *= 1 - Math.min(0.75, Math.max(0, target.armorPhysCut));
    if (elements.includes("fire") && target.armorFireCut) amount *= 1 - Math.min(0.75, Math.max(0, target.armorFireCut));
    if (elements.includes("ice") && target.armorIceCut) amount *= 1 - Math.min(0.75, Math.max(0, target.armorIceCut));
  }
  if (elements.length && (target.marks || []).some((mark) => mark.label === "耐性")) amount *= 1.2;
  if (flags && flags.allElement && (target.marks || []).some((mark) => mark.label === "耐性")) amount *= 1.2;
  const allWeak = (target.marks || []).some((mark) => mark.label === "全耐性");
  let weak = flags && flags.allElement ? !!target.weak : elements.some((name) => target.weak === name);
  if (!weak && allWeak && (element || (flags && flags.allElement))) weak = true;
  const superWeak = !!(flags && flags.superWeak);
  if (superWeak) amount *= 2;
  else if (weak) amount *= 1.5;
  if (flags && flags.vsDragon && target.species === "dragon") amount *= 1.5;
  if (flags && flags.swing && flags.vsBeast && target.species === "beast") amount *= 1.5;
  if (flags && flags.swing && flags.vsUndead && target.species === "undead") amount *= 1.5;
  if (actor.powerTurn > 1) amount *= actor.powerTurn;
  if (actor.tension > 0) amount *= 1 + actor.tension / 100;
  amount = Math.max(1, Math.round(amount));
  if (target.metal && !metalCrit) amount = flags && flags.metalHit ? flags.metalHit : 1;
  return { amount, crit, surge, superCrit, superWeak, weak };
}

function repStrike(boss, target, base, rng) {
  const rep = boss.rep;
  const crit = rep.phase === 2 && (rep.doomReady || rng() < 0.3);
  const critMult = crit ? (rep.doomReady ? 2.5 : 2) : 1;
  const defMod = Math.min(1.2, Math.max(0, auraSum(target, "defUp"))) - Math.min(0.6, Math.max(0, auraSum(target, "defDown")));
  const def = Math.max(0, target.def * levelFactor(target) * (1 + defMod));
  const defScale = (100 + 50 * 0.35) / (100 + def * 0.35);
  const roll = 0.9 + rng() * 0.2;
  let amount = base * rep.power * (boss.atk * levelFactor(boss) / 55) * defScale * roll * critMult;
  if (target.cutCharge) amount *= 1 - target.cutCharge;
  return { amount: Math.max(1, Math.round(amount)), crit };
}

function awakenDemise(state, unit, log) {
  const demise = unit.demise;
  if (!demise || demise.phase !== 1) return;
  demise.phase = 2;
  demise.step = 0;
  demise.hold = true;
  demise.pending = "";
  unit.name = "終焉";
  unit.maxHp = 52000;
  unit.hp = 52000;
  unit.atk = 360;
  unit.def = 220;
  unit.spd = 180;
  unit.auras = [];
  unit.marks = [];
  unit.sleep = 0;
  unit.poison = 0;
  unit.paralyze = 0;
  unit.silence = 0;
  unit.confuse = 0;
  unit.charm = 0;
  unit.trip = 0;
  if (state.combo) state.combo = null;
  log.push("第二形態・終焉");
  log.push("まだ、終わらない");
}

function awakenDragon(state, unit, log) {
  const dragon = unit.dragon;
  if (!dragon || dragon.phase !== 1) return;
  dragon.phase = 2;
  dragon.step = 0;
  dragon.hold = true;
  unit.name = "竜王";
  unit.maxHp = 4800;
  unit.hp = 4800;
  unit.atk = 165;
  unit.def = 100;
  unit.spd = 110;
  unit.weak = "";
  unit.auras = [];
  unit.marks = [];
  unit.sleep = 0;
  unit.poison = 0;
  unit.paralyze = 0;
  unit.silence = 0;
  unit.confuse = 0;
  unit.charm = 0;
  unit.trip = 0;
  unit.spellReflect = 0;
  if (state.combo) state.combo = null;
  log.push("第二形態・竜王");
}

function awakenRep(state, unit, log) {
  const rep = unit.rep;
  if (!rep || rep.phase !== 1) return;
  rep.phase = 2;
  rep.cloak = false;
  rep.hold = true;
  rep.doom = 6;
  rep.doomHold = true;
  unit.name = "新入生代表";
  unit.maxHp = 6000;
  unit.hp = 6000;
  unit.spd = 110;
  log.push("第二形態・新入生代表");
  log.push("ほう、、、我が闇の衣を剥がす術を知っていたとはな、、、");
  log.push("しかし同じこと");
  log.push("我が腕の中で、もがき、苦しむがよい");
  state.allies.forEach((ally) => {
    ally.auras = (ally.auras || []).filter((aura) => ["atkDown", "defDown", "spdDown", "takenUp", "blind", "spellDown"].includes(aura.kind));
  });
}

function pickUlt(rep) {
  const all = ["nova", "rainbow", "heaven"];
  let pool = all.filter((name) => !(rep.usedUlts || []).includes(name));
  if (!pool.length) {
    rep.usedUlts = [];
    pool = all.slice();
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function nextRepMove(unit) {
  const rep = unit.rep;
  if (rep.pendingUlt) return rep.pendingUlt;
  if (rep.phase === 1) return "poke";
  if (!rep.opened) return "calm";
  if (rep.doom === 1 && !rep.howled) return "howl";
  return ["hex", "march", "flag", "blade", "wall", "hits"][rep.step % 6];
}

function commitRepMove(unit, move) {
  const rep = unit.rep;
  if (rep.pendingUlt && move === rep.pendingUlt) {
    rep.pendingUlt = "";
    rep.usedUlts.push(move);
    rep.skip = 1;
    rep.ulting = true;
    return;
  }
  if (move === "calm") {
    rep.opened = true;
    rep.calm += 1;
    return;
  }
  if (move === "howl") {
    rep.howled = true;
    return;
  }
  if (rep.phase === 2 && ["hex", "march", "flag", "blade", "wall", "hits"].includes(move)) rep.step += 1;
}

function beginRepMove(state, actor, rng, log) {
  const move = nextRepMove(actor);
  commitRepMove(actor, move);
  const party = living(state.allies);
  const weakest = party.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  const title = actor.rep.phase === 1 ? "代表" : "新入生代表";
  if (move === "poke" || move === "hits") {
    const total = move === "poke" ? 5 : 6;
    state.combo = { actorId: actor.id, rep: true, left: total, total, base: 5, mode: "weakest", name: "通常攻撃", label: "通常攻撃", ult: !!actor.rep.ulting };
    log.push(`${title}の通常攻撃`);
    return log;
  }
  if (move === "calm") {
    log.push("余裕綽々だ");
    return log;
  }
  if (move === "howl") {
    party.forEach((ally) => {
      const before = (ally.auras || []).length;
      ally.auras = (ally.auras || []).filter((aura) => ["atkDown", "defDown", "spdDown", "takenUp", "blind", "spellDown"].includes(aura.kind));
      log.push(before > ally.auras.length ? `${ally.name}のバフが解けた` : `${ally.name}に解けるバフはなかった`);
    });
    log.push("大人の事情のはどう");
    return log;
  }
  if (move === "march") {
    actor.rep.tension = 50;
    actor.rep.mend = true;
    putAura(actor, "atkUp", 0.2, 2);
    putAura(actor, "defUp", 0.2, 2);
    log.push("止まらぬあゆみ");
    log.push("テンション 50");
    return log;
  }
  if (move === "wall") {
    actor.rep.wall = true;
    log.push("光の氷壁");
    log.push("次のダメージを無効にし、20%を返す");
    return log;
  }
  if (move === "blade") {
    if (weakest) {
      const blow = repStrike(actor, weakest, 60, rng);
      const victim = hurt(state, weakest, blow.amount, log, true);
      log.push(`天裂く凶刃`);
      log.push(`${victim.name}に ${blow.amount} ダメージ${blow.crit ? "（会心）" : ""}`);
    }
    actor.rep.power = Math.round((actor.rep.power + 0.05) * 100) / 100;
    log.push(`ダメージ倍率が ${actor.rep.power} 倍になった`);
    return log;
  }
  if (move === "nova") {
    log.push("スーパーノヴァ");
    if (weakest) {
      const blow = repStrike(actor, weakest, 260, rng);
      const victim = hurt(state, weakest, blow.amount, log, true);
      victim.noHeal = 4;
      victim.ascend = true;
      log.push(`${victim.name}に ${blow.amount} ダメージ${blow.crit ? "（会心）" : ""}`);
      log.push(`${victim.name}は4ラウンド回復できない`);
    }
    actor.rep.doomReady = false;
    actor.rep.ulting = false;
    return log;
  }
  const waves = {
    hex: { base: 20, mode: "all", label: "氷の呪縛", seal: true },
    flag: { base: 50, mode: "all", label: "グロリアスフラッグ", execute: true },
    rainbow: { base: 140, mode: "all", label: "バーストレインボウ", tension: 100 },
    heaven: { base: 21, mode: "random", total: 15, label: "導きの天翔", levelDown: true },
  };
  const wave = waves[move];
  if (wave) {
    const total = wave.total || party.length;
    if (!total) {
      log.push(wave.label);
      actor.rep.doomReady = false;
      actor.rep.ulting = false;
      return log;
    }
    state.combo = { actorId: actor.id, rep: true, left: total, total, base: wave.base, mode: wave.mode, name: wave.label, label: wave.label, seal: wave.seal, execute: wave.execute, tension: wave.tension || 0, levelDown: wave.levelDown, ult: !!actor.rep.ulting, cursor: 0, ids: party.map((unit) => unit.id) };
    log.push(wave.label);
    return log;
  }
  log.push("通常攻撃");
  actor.rep.doomReady = false;
  actor.rep.ulting = false;
  return log;
}

function stepRepHit(state, rng) {
  const combo = state.combo;
  const log = [];
  const actor = [...state.allies, ...state.foes].find((unit) => unit.id === combo.actorId);
  const party = living(state.allies);
  if (!actor || actor.hp <= 0 || !party.length || combo.left <= 0) {
    state.combo = null;
    return { log, done: true };
  }
  let target = party[0];
  if (combo.mode === "all") target = party.find((unit) => unit.id === (combo.ids || [])[combo.cursor]) || null;
  if (combo.mode === "weakest") target = party.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  if (combo.mode === "random") target = party[Math.floor(rng() * party.length)];
  if (!target) {
    combo.left -= 1;
    combo.cursor += 1;
    if (combo.left <= 0) {
      if (actor.rep) {
        actor.rep.doomReady = false;
        actor.rep.ulting = false;
      }
      state.combo = null;
    }
    return { log, done: !state.combo };
  }
  const blow = repStrike(actor, target, combo.base, rng);
  const victim = hurt(state, target, blow.amount, log, combo.mode === "weakest" || combo.mode === "one");
  log.push(`${victim.name}に ${blow.amount} ダメージ${blow.crit ? "（会心）" : ""}`);
  if (combo.seal && victim.hp > 0) {
    const pool = (victim.skills || []).filter((skill) => skill.id !== "attack");
    pool.sort(() => rng() - 0.5).slice(0, 2).forEach((skill) => {
      victim.seals = victim.seals || [];
      victim.seals.push({ name: skill.name, rounds: 2 });
      log.push(`${victim.name}の${skill.name}を封じた`);
    });
    if (rng() < 0.5) {
      victim.paralyze = 2;
      log.push(`${victim.name}は凍った`);
    }
  }
  if (combo.execute && victim.hp > 0 && victim.hp / victim.maxHp <= 0.15) {
    victim.hp = 0;
    log.push(`${victim.name}は崩壊した`);
  }
  if (combo.levelDown && victim.hp > 0) {
    victim.atk = Math.max(1, Math.round(victim.atk * 0.95));
    victim.def = Math.max(1, Math.round(victim.def * 0.95));
    victim.maxHp = Math.max(1, Math.round(victim.maxHp * 0.95));
    victim.hp = Math.min(victim.hp, victim.maxHp);
    const buff = (victim.auras || []).find((aura) => ["atkUp", "defUp", "spdUp", "spellPower"].includes(aura.kind));
    if (buff) {
      victim.auras = victim.auras.filter((aura) => aura !== buff);
      actor.auras = actor.auras || [];
      actor.auras.push(buff);
      log.push(`${actor.name}は強化を奪った`);
    }
    log.push(`${victim.name}はレベルダウン`);
  }
  combo.cursor += 1;
  combo.left -= 1;
  const n = combo.total - combo.left;
  combo.label = `${combo.name || "攻撃"} ${n}/${combo.total}`;
  if (combo.left <= 0) {
    if (combo.tension && actor.rep) {
      actor.rep.tension = combo.tension;
      log.push(`テンション ${combo.tension}`);
    }
    if (actor.rep) {
      actor.rep.doomReady = false;
      actor.rep.ulting = false;
    }
    state.combo = null;
  }
  return { log, done: !state.combo };
}

function partyHasGrandCross(state) {
  return (state.allies || []).some((unit) => (unit.skills || []).some((skill) => skill.id === "grandcross"));
}

function addTaken(state, unit, lost) {
  if (!state || !unit || unit.side !== "ally" || lost <= 0) return;
  state.taken = (state.taken || 0) + lost;
  if (!partyHasGrandCross(state)) return;
  state.allies.forEach((ally) => { ally.partyTaken = state.taken; });
}

function hurt(state, target, amount, log, solo, source, spell) {
  if (PopstarBattle && (state.foes || []).some((unit) => unit.popstar)) {
    target = PopstarBattle.redirectTarget(state, target, solo);
    if (source && PopstarBattle.resolveIncoming) {
      const resolved = PopstarBattle.resolveIncoming(state, source, target, amount, log, !!spell);
      target = resolved.target;
      amount = resolved.amount;
      if (resolved.done) return target;
    } else {
      amount = PopstarBattle.adjustDamage(amount, target);
      if (target.invincible > 0) {
        log.push(`${target.name}は無敵だ`);
        return target;
      }
    }
  }
  const coverId = target.cover;
  let victim = target;
  if (coverId) {
    const guard = state.allies.find((unit) => unit.id === coverId && unit.hp > 0);
    if (guard && guard.id !== target.id) {
      victim = guard;
      log.push(`${guard.name}がかばった`);
      if (guard.trait === "paladinGuard") amount = Math.min(amount, guard.hp - 1);
    }
  } else if (solo && target.side === "ally") {
    const ward = (state.allies || []).find((unit) => unit.ward > 0 && unit.hp > 0 && unit.id !== target.id);
    if (ward) {
      victim = ward;
      amount = Math.max(1, Math.round(amount * (1 - (ward.wardCut || 0.5))));
      log.push(`${ward.name}が盾になって受けた`);
    }
  }
  const before = victim.hp;
  victim.hp = Math.max(0, victim.hp - amount);
  victim.hurtFrom = before;
  if (victim.demise && victim.demise.phase === 1 && victim.hp <= 0) awakenDemise(state, victim, log);
  addTaken(state, victim, before - victim.hp);
  if (victim.trait === "pressure" && Math.random) {
    /* pressure is applied by the caller with rng */
  }
  return victim;
}

function spillOverkill(state, actor, surplus, spell, log, seen) {
  if (surplus <= 0 || seen.size > 16) return;
  const others = living(state.foes).filter((unit) => !seen.has(unit.id));
  const chains = [];
  others.forEach((unit) => {
    seen.add(unit.id);
    let amount = surplus;
    if (!spell && unit.armorThorns && amount > 1 && actor.hp > 0 && actor.id !== unit.id) {
      const bounced = Math.min(amount - 1, Math.max(1, Math.round(amount * Math.min(0.75, unit.armorThorns))));
      amount -= bounced;
      actor.hp = Math.max(0, actor.hp - bounced);
      log.push(`${actor.name}に ${bounced} 跳ね返した`);
    }
    const before = unit.hp;
    const hit = hurt(state, unit, amount, log);
    log.push(`${hit.name}に余剰 ${amount} ダメージ`);
    if (amount > before && hit.hp <= 0) chains.push(amount - before);
  });
  chains.forEach((extra) => spillOverkill(state, actor, extra, spell, log, seen));
}

function noteWeaponHit(state, actor, victim, dealt, spell, log) {
  if (!actor || actor.side !== "ally" || !victim || victim.side !== "foe" || dealt <= 0) return;
  const hpBefore = victim.hurtFrom == null ? victim.hp : victim.hurtFrom;
  if (actor.weaponPartyHeal) {
    const base = Math.min(dealt, Math.max(0, hpBefore));
    const gain = Math.max(0, Math.round(base * actor.weaponPartyHeal));
    if (gain > 0) {
      living(state.allies).forEach((unit) => {
        if (unit.noHeal > 0) return;
        const before = unit.hp;
        unit.hp = Math.min(unit.maxHp, unit.hp + gain);
        if (unit.hp > before) log.push(`${unit.name}は ${unit.hp - before} 回復した`);
      });
    }
  }
  if (actor.weaponLevelDown && victim.hp > 0) {
    victim.levelDown = Math.min(5, (victim.levelDown || 0) + 1);
    log.push(`${victim.name}のレベルが下がった ${victim.levelDown}`);
  }
  if (actor.weaponOverkill && dealt > hpBefore) {
    spillOverkill(state, actor, dealt - hpBefore, spell, log, new Set([victim.id]));
  }
}

function healUnit(unit, ratio) {
  if (unit.noHeal > 0) return 0;
  const gain = Math.max(1, Math.round(unit.maxHp * ratio));
  const before = unit.hp;
  unit.hp = Math.min(unit.maxHp, unit.hp + gain);
  return unit.hp - before;
}

function targetsOf(state, actor, skill, chosen) {
  if (actor.sway && chosen) {
    const forced = [...state.allies, ...state.foes].find((unit) => unit.id === chosen && unit.hp > 0);
    if (forced) return [forced];
  }
  const enemies = actor.side === "ally" ? living(state.foes) : living(state.allies);
  const friends = actor.side === "ally" ? living(state.allies) : living(state.foes);
  if (skill.target === "all" || skill.target === "random") return enemies;
  if (skill.target === "allies") return friends;
  if (skill.target === "self") return [actor];
  if (skill.target === "ally") {
    const pool = skill.effect && skill.effect.revive
      ? (actor.side === "ally" ? state.allies : state.foes)
      : friends;
    const found = pool.find((unit) => unit.id === chosen && (skill.effect.revive ? true : unit.hp > 0));
    if (found) return [found];
    return skill.effect && skill.effect.revive ? [] : friends.slice(0, 1);
  }
  const found = enemies.find((unit) => unit.id === chosen) || enemies[0];
  return found ? [found] : [];
}

function applyHit(state, actor, target, skill, qte, rng, log, once) {
  const effect = skill.effect || {};
  let power = (effect.power || 0) * (1 + (skill.kind === "spell" ? auraSum(actor, "spellPower") + (actor.weaponSpell || 0) : 0));
  if (effect.fewBonus) {
    const crowd = actor.side === "ally" ? living(state.foes) : living(state.allies);
    power *= effect.fewBonus / Math.max(1, crowd.length);
  }
  if (!power) return;
  const hits = once ? 1 : (effect.hits || 1);
  for (let hit = 0; hit < hits; hit += 1) {
    const pool = !once && skill.target === "random"
      ? (actor.side === "ally" ? living(state.foes) : living(state.allies))
      : [target];
    const mark = pool[Math.floor(rng() * pool.length)] || target;
    if (!mark || mark.hp <= 0) break;
    if (auraSum(actor, "blind") && rng() < Math.min(0.6, auraSum(actor, "blind"))) {
      log.push(`${skill.name}は外れた`);
      continue;
    }
    if (skill.kind !== "spell" && mark.armorDodge && rng() < mark.armorDodge) {
      log.push(`${mark.name}はかわした`);
      continue;
    }
    if (effect.miss && rng() < effect.miss) {
      log.push(`${skill.name}は外れた`);
      continue;
    }
    if (actor.weaponMiss && skill.id === "attack" && rng() < actor.weaponMiss) {
      log.push(`${skill.name}は外れた`);
      continue;
    }
    const hitPower = effect.vsStatus && (mark.sleep > 0 || mark.confuse > 0 || mark.paralyze > 0) ? power * effect.vsStatus : power;
    if (effect.forceBreak) putMark(mark, "耐性", "down", 3);
    if (effect.allResistDown) {
      putMark(mark, "全耐性", "down", 3);
      log.push(`${mark.name}は全属性の耐性が下がった`);
    }
    const swing = skill.id === "attack";
    const blow = strike(actor, mark, hitPower, qte, rng, skill.element || (swing ? actor.weaponElement : ""), {
      swing,
      sureCrit: !!effect.sureCrit,
      metalHit: effect.metalHit || (swing ? actor.weaponMetal || 0 : 0),
      spell: skill.kind === "spell",
      superCrit: !!effect.superCrit,
      allElement: !!effect.allElement,
      elements: effect.elements || null,
      ignoreDef: !!effect.ignoreDef,
      ignoreResist: !!effect.ignoreResist,
      superWeak: !!effect.superWeak,
      vsDragon: !!((swing && actor.weaponDragon) || (skill.name || "").includes("ドラゴン")),
      vsBeast: !!(swing && actor.weaponBeast),
      vsUndead: !!(swing && actor.weaponUndead),
    });
    let dealt = blow.amount;
    const cloaked = !!(mark.rep && mark.rep.cloak);
    if (mark.rep && mark.rep.wall) {
      const back = Math.max(1, Math.round(dealt * 0.2 * (1 + mark.rep.tension / 100)));
      mark.rep.wall = false;
      actor.hp = Math.max(0, actor.hp - back);
      log.push(`${mark.name}は光の氷壁で防いだ`);
      log.push(`${actor.name}に反撃 ${back}`);
      continue;
    }
    if (cloaked) dealt = Math.max(1, Math.round(dealt * 0.1));
    if (mark.rep && mark.rep.frenzy) dealt *= 3;
    let bounced = 0;
    if (mark.armorThorns && skill.kind !== "spell" && dealt > 1 && actor.hp > 0 && actor.id !== mark.id) {
      bounced = Math.min(dealt - 1, Math.max(1, Math.round(dealt * Math.min(0.75, mark.armorThorns))));
      dealt -= bounced;
    }
    const victim = hurt(state, mark, dealt, log, skill.target === "one", actor, skill.kind === "spell");
    if (victim.dragon && victim.dragon.phase === 1 && victim.hp <= 0) awakenDragon(state, victim, log);
    const spike = blow.superCrit ? "（超会心）" : blow.surge ? "（暴走）" : blow.crit ? "（会心）" : "";
    if (bounced > 0 && actor.hp > 0) {
      const before = actor.hp;
      actor.hp = Math.max(0, actor.hp - bounced);
      addTaken(state, actor, before - actor.hp);
      log.push(`${actor.name}に ${bounced} 跳ね返した`);
    }
    log.push(`${victim.name}に ${(victim.side === "ally" && victim.hurtFrom != null ? Math.max(0, victim.hurtFrom - victim.hp) : dealt)} ダメージ${spike}${blow.superWeak ? "　超弱点" : blow.weak ? "　弱点" : ""}${cloaked ? "（軽減）" : ""}`);
    noteWeaponHit(state, actor, victim, dealt, skill.kind === "spell", log);
    if (cloaked && victim.rep) {
      victim.rep.taken += dealt;
      if (victim.rep.taken >= 100) awakenRep(state, victim, log);
    }
    if (victim.rep && victim.rep.mend) victim.rep.hurt += dealt;
    if (victim.rep && victim.rep.frenzy && dealt > 0 && actor.hp > 0) {
      const before = actor.hp;
      actor.hp = Math.min(actor.maxHp, actor.hp + dealt);
      if (actor.hp > before) log.push(`${actor.name}は ${actor.hp - before} 回復した`);
    }
    if (actor.weaponDrain && skill.id === "attack" && blow.amount > 0) {
      const gain = Math.max(1, Math.round(blow.amount * actor.weaponDrain));
      const before = actor.hp;
      actor.hp = Math.min(actor.maxHp, actor.hp + gain);
      if (actor.hp > before) log.push(`${actor.name}は ${actor.hp - before} 回復した`);
    }
    if (actor.weaponRecoil && skill.id === "attack" && blow.amount > 0 && actor.hp > 0) {
      const back = Math.max(1, Math.round(blow.amount * actor.weaponRecoil));
      actor.hp = Math.max(0, actor.hp - back);
      log.push(`${actor.name}は反動で ${back} ダメージ`);
    }
    if (actor.weaponDeath && skill.id === "attack" && victim.hp > 0 && victim.menace < 2 && !victim.deathResist && rng() < actor.weaponDeath) {
      victim.hp = 0;
      log.push(`${victim.name}は急所を突かれた`);
    }
    if (effect.intimidate && victim.hp > 0) {
      putAura(victim, "atkDown", effect.intimidate, effect.rounds || 3, "威圧");
      log.push(`${victim.name}は威圧された`);
    }
    if (effect.poison && !victim.statusResist && rng() < effect.poison) {
      victim.poison = 3;
      log.push(`${victim.name}は毒になった`);
    } else if (actor.weaponPoison && skill.id === "attack" && !victim.statusResist && rng() < actor.weaponPoison) {
      victim.poison = 3;
      log.push(`${victim.name}は毒になった`);
    }
    if (actor.weaponParalyze && skill.id === "attack" && !victim.statusResist && rng() < actor.weaponParalyze) {
      victim.paralyze = 2;
      log.push(`${victim.name}はしびれた`);
    }
    if (actor.weaponCharm && skill.id === "attack" && !victim.statusResist && rng() < actor.weaponCharm) {
      victim.charm = 2;
      log.push(`${victim.name}は魅了された`);
    }
    if (effect.sleep && !victim.statusResist && rng() < effect.sleep) {
      victim.sleep = 2;
      log.push(`${victim.name}は眠った`);
    }
    if (victim.sleep > 0 && victim.hp > 0 && !effect.sleep) {
      victim.sleep = 0;
      log.push(`${victim.name}は痛みで目を覚ました`);
    }
    if (actor.weaponSleep && skill.id === "attack" && !victim.statusResist && rng() < actor.weaponSleep) {
      victim.sleep = 2;
      log.push(`${victim.name}は眠った`);
    }
    if (effect.paralyze && !victim.statusResist && rng() < effect.paralyze) {
      victim.paralyze = 2;
      log.push(`${victim.name}はしびれた`);
    }
    if (effect.trip && rng() < effect.trip) {
      victim.trip = 1;
      log.push(`${victim.name}は転んだ`);
    }
    if (effect.forceBreak) log.push(`${victim.name}の耐性が下がった`);
    if (effect.death && victim.hp > 0 && victim.menace < 2 && !victim.deathResist && rng() < effect.death) {
      victim.hp = 0;
      log.push(`${victim.name}は消え去った`);
    }
    if (effect.confuse && rng() < effect.confuse) {
      victim.confuse = 3;
      log.push(`${victim.name}は混乱した`);
    }
    if (effect.defDown) {
      putAura(victim, "defDown", effect.defDown, effect.rounds || 3);
      log.push(`${victim.name}の守備が下がった`);
    }
    if (effect.atkDown && rng() < 0.6) {
      putAura(victim, "atkDown", effect.atkDown, effect.rounds || 3);
      log.push(`${victim.name}の攻撃が下がった`);
    }
    if (actor.trait === "shadowbind" && rng() < 0.25) {
      victim.sleep = Math.max(victim.sleep, 1);
      putMark(victim, "影", "down", 2);
      log.push(`${victim.name}は休みになった`);
    }
    if (actor.trait === "forcebreak" && skill.element && rng() < 0.3) {
      putMark(victim, "耐性", "down", 2);
      log.push(`${victim.name}の耐性が下がった`);
    }
    if (victim.trait === "pressure" && rng() < 0.3) {
      putAura(actor, "atkDown", 0.2 * (victim.menace || 1), 2, "威圧");
      log.push(`${actor.name}は威圧された`);
    }
    actor.nextPower = 0;
    if (victim.cutCharge) {
      victim.cutCharge = 0;
      victim.guardName = "";
    }
  }
}

function spendOpeners(actor) {
  actor.powerTurn = 0;
  actor.tension = 0;
}

function chantedSkill(skill, qte) {
  const rate = Number(qte);
  if (!skill || skill.kind !== "spell" || !(rate > 0) || rate === 1) return { skill, note: "" };
  const effect = { ...(skill.effect || {}) };
  ["heal", "partyHeal", "defUp", "atkUp", "atkDown", "defDown", "spdUp", "spdDown", "spellPower", "breathCut", "spellCut", "spellDown", "takenUp", "sleep", "confuse", "silence", "blind", "poison", "paralyze", "charm", "death", "mpDrain"].forEach((key) => {
    if (typeof effect[key] === "number") effect[key] *= rate;
  });
  ["sleep", "confuse", "silence", "blind", "poison", "paralyze", "charm", "death"].forEach((key) => {
    if (typeof effect[key] === "number") effect[key] = Math.min(0.95, effect[key]);
  });
  if (typeof effect.revive === "number" && rate < 1) effect.revive *= rate;
  if (effect.fullHeal && rate < 1) {
    effect.fullHeal = false;
    effect.heal = 0.5 * rate;
  }
  const note = rate >= 1.5 ? "詠唱が完璧だ" : rate >= 1.2 ? "詠唱がうまく決まった" : "詠唱が乱れた";
  return { skill: { ...skill, effect }, note };
}

function castSkill(state, actor, skill, chosen, qte, rng, loot) {
  const log = [];
  if (actor.hp <= 0) return log;
  if ((actor.seals || []).some((seal) => seal.name === skill.name)) {
    log.push(`${skill.name}は封じられている`);
    return log;
  }
  if (skill.effect && skill.effect.popstar && PopstarBattle) return PopstarBattle.cast(state, actor, skill, chosen, qte, rng, log);
  if (skill.effect && skill.effect.rep) return beginRepMove(state, actor, rng, log);
  if (skill.kind === "spell" && actor.silence > 0) {
    log.push(`${actor.name}は呪文が封じられている`);
    return log;
  }
  let cost = skill.mp || 0;
  if (skill.effect && skill.effect.mpBurst) {
    if (actor.mp <= 0) {
      log.push("MPが足りない");
      return log;
    }
    cost = actor.mp;
  }
  if (skill.id === "attack" && actor.weaponMpOnHit) cost += actor.weaponMpOnHit;
  if (skill.kind === "spell" && actor.armorMpCut && !(skill.effect && skill.effect.mpBurst)) cost = Math.max(0, Math.ceil(cost * (1 - actor.armorMpCut)));
  if (cost > actor.mp) {
    log.push("MPが足りない");
    return log;
  }
  actor.mp -= cost;
  log.push(`${actor.name}の ${skill.name}`);
  const chant = chantedSkill(skill, qte);
  if (chant.note) log.push(chant.note);
  skill = chant.skill;
  const effect = skill.effect || {};
  if (effect.demise) {
    resolveDemise(state, actor, rng, log);
    return log;
  }
  if (effect.grandCross) {
    const rate = Number(qte) > 0 ? Number(qte) : 1;
    const stored = state.taken || 0;
    state.taken = 0;
    (state.allies || []).forEach((unit) => { unit.partyTaken = 0; });
    const amount = Math.max(0, Math.round(stored * effect.grandCross * rate));
    const foes = living(state.foes);
    const mark = foes.find((unit) => unit.id === chosen) || foes[0];
    if (!mark || amount <= 0) {
      log.push(amount <= 0 ? "まだダメージを受けていない" : "対象がいない");
      return log;
    }
    const victim = hurt(state, mark, amount, log, true);
    log.push(`${victim.name}に ${amount} ダメージ`);
    noteWeaponHit(state, actor, victim, amount, false, log);
    return log;
  }
  if (effect.mpBurst) {
    const rate = Number(qte) > 0 ? Number(qte) : 1;
    targetsOf(state, actor, skill, chosen).forEach((unit) => {
      let mark = unit;
      if (mark.spellReflect > 0 && mark.side !== actor.side) {
        mark.spellReflect -= 1;
        log.push(`${mark.name}は呪文をはね返した`);
        mark = actor;
      }
      let amount = Math.max(1, Math.round(cost * effect.mpBurst * rate));
      if (mark.metal) amount = 1;
      if (mark.rep && mark.rep.cloak) amount = Math.max(1, Math.round(amount * 0.1));
      if (mark.rep && mark.rep.wall) {
        const back = Math.max(1, Math.round(amount * 0.2));
        mark.rep.wall = false;
        actor.hp = Math.max(0, actor.hp - back);
        log.push(`${mark.name}は光の氷壁で防いだ`);
        log.push(`${actor.name}に反撃 ${back}`);
        return;
      }
      const victim = hurt(state, mark, amount, log, true);
      log.push(`${victim.name}に ${amount} ダメージ`);
      noteWeaponHit(state, actor, victim, amount, true, log);
    });
    return log;
  }
  if (effect.flee) {
    actor.hp = 0;
    actor.xp = 0;
    actor.gold = 0;
    actor.material = null;
    log.push(`${actor.name}は逃げ出した`);
    return log;
  }
  if (effect.random) {
    const table = [
      () => { const gain = healUnit(actor, 0.22); log.push(`${actor.name}は ${gain} 回復した`); },
      () => { actor.mp = Math.min(actor.maxMp, actor.mp + Math.round(actor.maxMp * 0.4)); log.push("MPが戻った"); },
      () => { const foe = living(state.foes)[0]; if (foe) applyHit(state, actor, foe, { effect: { power: 1.3 }, kind: "spell", mp: 0, target: "one" }, 1, rng, log); },
      () => log.push("何も起こらなかった"),
    ];
    table[Math.floor(rng() * table.length)]();
    return log;
  }
  if (effect.passive) {
    log.push("いつも効いている");
    return log;
  }
  if (effect.steal) {
    const foe = targetsOf(state, actor, skill, chosen)[0];
    const times = (knows(actor, "drop") ? 2 : 1);
    if (foe && foe.material && rng() < 0.7) {
      for (let i = 0; i < times; i += 1) loot.push({ who: actor.seat, material: foe.material });
      log.push(times > 1 ? `${foe.material}を${times}つぬすんだ` : `${foe.material}をぬすんだ`);
      if (times > 1) log.push("盗む");
    } else log.push("ぬすみそこねた");
    return log;
  }
  if (effect.skipEnemyFirst) {
    state.skipFoes = rng() < effect.skipEnemyFirst;
    log.push(state.skipFoes ? "敵はこちらに気づいていない" : "気づかれてしまった");
    return log;
  }
  if (effect.nextPower) {
    actor.nextPower = effect.nextPower;
    log.push("次の攻撃が強くなる");
    return log;
  }
  if (effect.powerTurn) {
    const who = skill.target === "ally" ? (targetsOf(state, actor, skill, chosen)[0] || actor) : actor;
    who.powerTurn = effect.powerTurn;
    log.push(who.id === actor.id ? "次の攻撃の威力が2倍" : `${who.name}の次の攻撃の威力が2倍`);
  }
  if (effect.tension) {
    actor.tension = effect.tension;
    log.push(`テンション ${effect.tension}`);
  }
  if (effect.doubleNext) {
    actor.doubleNext = true;
    log.push("次の攻撃は2回当たる");
  }
  if (effect.heal && skill.target !== "one" && skill.target !== "all" && skill.target !== "random") {
    targetsOf(state, actor, skill, chosen).forEach((unit) => {
      if (effect.revive && unit.hp <= 0) {
        if (rng() < effect.revive) {
          unit.hp = Math.max(1, Math.round(unit.maxHp * effect.heal));
          log.push(`${unit.name}は生き返った`);
        } else log.push("蘇生は失敗した");
        return;
      }
      if (unit.hp <= 0) return;
      const gain = healUnit(unit, effect.heal);
      log.push(gain > 0 ? `${unit.name}は ${gain} 回復した` : `${unit.name}のHPは満タンだった`);
    });
  }
  if (effect.cure) {
    targetsOf(state, actor, skill, chosen).forEach((unit) => {
      unit.poison = 0;
      log.push(`${unit.name}の毒が治った`);
    });
  }
  if (effect.defUp) {
    const label = skill.id === "musclepose" ? "ポーズ" : "";
    targetsOf(state, actor, skill, chosen).forEach((unit) => { putAura(unit, "defUp", effect.defUp, effect.rounds || 3, label); log.push(`${unit.name}の守備が上がった`); });
  }
  if (effect.atkUp) {
    const label = skill.id === "sutemi" ? "すてみ" : skill.id === "warcry" ? "雄叫" : skill.id === "baishion" ? "バイシオン" : "";
    targetsOf(state, actor, skill, chosen).forEach((unit) => { putAura(unit, "atkUp", effect.atkUp, effect.rounds || 3, label); log.push(`${unit.name}の攻撃が上がった`); });
  }
  if (effect.takenUp) { putAura(actor, "takenUp", effect.takenUp, effect.rounds || 3, "すてみ"); log.push(`${actor.name}はダメージを受けやすくなった`); }
  if (effect.spellPower) { putAura(actor, "spellPower", effect.spellPower, effect.rounds || 3, "魔力"); log.push(`${actor.name}の魔力が上がった`); }
  if (effect.breathCut) targetsOf(state, actor, skill, chosen).forEach((unit) => { putAura(unit, "breathCut", effect.breathCut, effect.rounds || 3, "息防"); log.push(`${unit.name}は息を防ぎやすくなった`); });
  if (effect.physicalCut) targetsOf(state, actor, skill, chosen).forEach((unit) => { unit.cutCharge = effect.physicalCut; unit.guardName = "バリア"; log.push(`${unit.name}にバリア`); });
  if (effect.cut) { actor.cutCharge = effect.cut; actor.guardName = effect.guardName || "大防"; log.push(`${actor.name}は身を守った`); }
  if (effect.coverAll) {
    living(state.allies).forEach((unit) => { if (unit.id !== actor.id) unit.cover = actor.id; });
    log.push(`${actor.name}が仲間の盾になった`);
  }
  if (effect.ward) {
    actor.ward = effect.rounds || 3;
    actor.wardCut = effect.wardCut == null ? 0.5 : effect.wardCut;
    log.push(`${actor.name}は単体攻撃を引き受ける`);
  }
  if (effect.partyCrit) {
    state.allies.forEach((unit) => { unit.critAura = Math.max(unit.critAura || 0, effect.partyCrit); });
    log.push(`味方の会心率が${Math.round(effect.partyCrit * 100)}%上がった`);
  }
  if (effect.fullHeal) {
    targetsOf(state, actor, skill, chosen).forEach((unit) => {
      if (unit.hp <= 0) return;
      const gain = unit.maxHp - unit.hp;
      unit.hp = unit.maxHp;
      log.push(gain > 0 ? `${unit.name}は全回復した` : `${unit.name}のHPは満タンだった`);
    });
  }
  if (effect.cleanse) {
    targetsOf(state, actor, skill, chosen).forEach((unit) => {
      unit.poison = 0;
      unit.sleep = 0;
      unit.charm = 0;
      unit.confuse = 0;
      unit.paralyze = 0;
      unit.silence = 0;
      unit.auras = (unit.auras || []).filter((aura) => aura.kind !== "atkDown" && aura.kind !== "defDown" && aura.kind !== "spdDown" && aura.kind !== "blind");
      log.push(`${unit.name}の状態が治った`);
    });
  }
  if (effect.wake) {
    targetsOf(state, actor, skill, chosen).forEach((unit) => {
      unit.sleep = 0;
      log.push(`${unit.name}の眠りが解けた`);
    });
  }
  if (effect.cureBlind) {
    targetsOf(state, actor, skill, chosen).forEach((unit) => {
      unit.auras = (unit.auras || []).filter((aura) => aura.kind !== "blind");
      log.push(`${unit.name}の幻惑が解けた`);
    });
  }
  if (effect.blind) {
    targetsOf(state, actor, skill, chosen).forEach((unit) => {
      if (rng() < effect.blind) {
        putAura(unit, "blind", effect.blind, effect.rounds || 3, "幻");
        log.push(`${unit.name}は幻に包まれた`);
      } else log.push(`${unit.name}には幻が効かなかった`);
    });
  }
  if (!effect.power) {
    targetsOf(state, actor, skill, chosen).forEach((unit) => {
      if (unit.hp <= 0) return;
      if (effect.sleep && rng() < effect.sleep) {
        unit.sleep = 2;
        log.push(`${unit.name}は眠った`);
      }
      if (effect.poison && rng() < effect.poison) {
        unit.poison = 3;
        log.push(`${unit.name}は毒になった`);
      }
      if (effect.paralyze && rng() < effect.paralyze) {
        unit.paralyze = 2;
        log.push(`${unit.name}はしびれた`);
      }
      if (effect.confuse && rng() < effect.confuse) {
        unit.confuse = 3;
        log.push(`${unit.name}は混乱した`);
      }
    });
  }
  if (effect.spdDown) targetsOf(state, actor, skill, chosen).forEach((unit) => { putAura(unit, "spdDown", effect.spdDown, effect.rounds || 3); log.push(`${unit.name}の素早さが下がった`); });
  if (effect.spdUp) targetsOf(state, actor, skill, chosen).forEach((unit) => { putAura(unit, "spdUp", effect.spdUp, effect.rounds || 3); log.push(`${unit.name}の素早さが上がった`); });
  if (effect.spellCut) targetsOf(state, actor, skill, chosen).forEach((unit) => { putAura(unit, "spellCut", effect.spellCut, effect.rounds || 3, "魔防"); log.push(`${unit.name}は呪文を防ぎやすくなった`); });
  if (effect.spellDown) targetsOf(state, actor, skill, chosen).forEach((unit) => { putAura(unit, "spellDown", effect.spellDown, effect.rounds || 4, "魔防ダウン"); log.push(`${unit.name}の呪文耐性が大きく下がった`); });
  if (effect.silence) {
    targetsOf(state, actor, skill, chosen).forEach((unit) => {
      if (rng() < effect.silence && !unit.silenceResist) {
        unit.silence = effect.rounds || 3;
        log.push(`${unit.name}は呪文が出せなくなった`);
      }
    });
  }
  if (effect.dispel) {
    targetsOf(state, actor, skill, chosen).forEach((unit) => {
      unit.auras = (unit.auras || []).filter((aura) => aura.kind === "atkDown" || aura.kind === "defDown" || aura.kind === "spdDown" || aura.kind === "takenUp" || aura.kind === "blind" || aura.kind === "spellDown");
      unit.marks = [];
      log.push(`${unit.name}の良い効果が消えた`);
    });
  }
  if (effect.mark) targetsOf(state, actor, skill, chosen).forEach((unit) => { putMark(unit, effect.mark, "down", effect.rounds || 3); log.push(`${unit.name}は呪文に弱くなった`); });
  if (effect.death && !effect.power) {
    targetsOf(state, actor, skill, chosen).forEach((unit) => {
      if (unit.menace >= 2) {
        log.push(`${unit.name}には効かなかった`);
        return;
      }
      if (unit.deathResist) {
        log.push(`${unit.name}には効かなかった`);
        return;
      }
      if (rng() < effect.death) {
        unit.hp = 0;
        log.push(`${unit.name}は消え去った`);
      } else log.push(`${unit.name}は耐えきった`);
    });
  }
  if (effect.cover) {
    const mate = state.allies.find((unit) => unit.id === chosen);
    if (mate) {
      mate.cover = actor.id;
      actor.guarding = actor.trait === "paladinGuard";
      log.push(`${actor.name}が${mate.name}をかばう`);
    }
  }
  if (effect.giveMp) {
    const mate = state.allies.find((unit) => unit.id === chosen && unit.hp > 0);
    if (mate) {
      const gift = Math.max(1, Math.round(actor.maxMp * effect.giveMp));
      const moved = Math.min(gift, actor.mp);
      actor.mp -= moved;
      mate.mp = Math.min(mate.maxMp, mate.mp + moved);
      log.push(`${mate.name}にMPを ${moved} 渡した`);
    }
  }
  if (effect.mpDrain) {
    targetsOf(state, actor, skill, chosen).forEach((unit) => {
      const lost = Math.max(1, Math.round(unit.maxMp * effect.mpDrain));
      unit.mp = Math.max(0, unit.mp - lost);
      log.push(`${unit.name}のMPが減った`);
    });
  }
  if (effect.charm) {
    targetsOf(state, actor, skill, chosen).forEach((unit) => {
      if (rng() < effect.charm) {
        unit.charm = 2;
        log.push(`${unit.name}は魅了された`);
      }
    });
  }
  if (effect.extraTurn) {
    const mate = state.allies.find((unit) => unit.id === chosen);
    if (mate) {
      mate.extra = true;
      log.push(`${mate.name}はもう一度動ける`);
    }
  }
  if (effect.roar) {
    living(state.foes).forEach((unit) => {
      putAura(unit, "atkDown", 0.25 * (unit.menace || 1), 3);
      log.push(`${unit.name}は戦意を失った`);
    });
  }
  if (!effect.power && (effect.defDown || effect.atkDown)) {
    targetsOf(state, actor, skill, chosen).forEach((unit) => {
      if (effect.defDown) {
        putAura(unit, "defDown", effect.defDown, effect.rounds || 3);
        log.push(`${unit.name}の守備が下がった`);
      }
      if (effect.atkDown && rng() < (effect.power ? 1 : 0.9)) {
        putAura(unit, "atkDown", effect.atkDown, effect.rounds || 3);
        log.push(`${unit.name}の攻撃が下がった`);
      }
    });
  }
  if (effect.spellReflect) {
    actor.spellReflect = (actor.spellReflect || 0) + effect.spellReflect;
    log.push("呪文をはね返す構え");
  }
  if (effect.power && skill.kind === "spell") {
    const wall = targetsOf(state, actor, skill, chosen).find((unit) => unit.spellReflect > 0 && unit.side !== actor.side);
    if (wall) {
      wall.spellReflect -= 1;
      log.push(`${wall.name}は呪文をはね返した`);
      applyHit(state, actor, actor, { ...skill, target: "one" }, qte, rng, log, true);
      return log;
    }
  }
  if (effect.power && (effect.hits || 1) > 1 || (effect.power && actor.doubleNext)) {
    let hits = effect.hits || 1;
    if (actor.doubleNext) {
      hits *= 2;
      actor.doubleNext = false;
      log.push("2回当たる");
    }
    if (hits > 1) {
      state.combo = { actorId: actor.id, skillId: skill.id, chosen, qte, left: hits, total: hits, label: skill.name };
      return log;
    }
  }
  if (effect.power) {
    const marks = targetsOf(state, actor, skill, chosen);
    const times = skill.kind === "spell" && ((actor.trait === "echo" && rng() < 0.3) || (actor.armorEcho && rng() < actor.armorEcho)) ? 2 : 1;
    for (let time = 0; time < times; time += 1) {
      if (time === 1) {
        log.push("やまびこ");
        putMark(actor, "山彦", "up", 1);
      }
      marks.forEach((mark) => { if (mark.hp > 0) applyHit(state, actor, mark, skill, qte, rng, log); });
    }
    spendOpeners(actor);
  }
  if (effect.partyHeal) {
    living(actor.side === "ally" ? state.allies : state.foes).forEach((unit) => {
      const gain = healUnit(unit, effect.partyHeal);
      if (gain > 0) log.push(`${unit.name}は ${gain} 回復した`);
    });
  }
  if (effect.selfRatio && actor.hp > 0) {
    const loss = Math.max(1, Math.round(actor.maxHp * effect.selfRatio));
    actor.hp = Math.max(0, actor.hp - loss);
    log.push(`${actor.name}は反動で ${loss} ダメージ`);
  }
  if (effect.explode) {
    actor.hp = 0;
    log.push(`${actor.name}は爆発した`);
  }
  if (actor.trait === "showtime" && skill.id !== "attack" && rng() < 0.25) {
    const gain = healUnit(actor, 0.1);
    putMark(actor, "ショー", "up", 1);
    log.push(`ショータイムで ${gain} 回復した`);
  }
  return log;
}

function tickTurnStart(unit, rng, log) {
  if (unit.curse && rng() < unit.curse) {
    log.push(`${unit.name}は呪いで体が動かない`);
    return false;
  }
  if (unit.dragon && unit.dragon.hold) {
    unit.dragon.hold = false;
    log.push("竜王は力をためている");
    return false;
  }
  if (unit.demise && unit.demise.hold) {
    unit.demise.hold = false;
    log.push("終焉は力をためている");
    return false;
  }
  if (unit.rep && unit.rep.hold) {
    log.push(`${unit.name}は様子を見ている`);
    return false;
  }
  if (unit.rep && unit.rep.skip > 0) {
    unit.rep.skip -= 1;
    unit.rep.frenzy = true;
    log.push("代表は動けない");
    return false;
  }
  unit.sway = "";
  if (unit.trip > 0) {
    unit.trip = 0;
    log.push(`${unit.name}は転んで動けない`);
    return false;
  }
  if (unit.sleep > 0) {
    if (rng() < 0.35) {
      unit.sleep = 0;
      log.push(`${unit.name}は目を覚ました`);
    } else {
      unit.sleep -= 1;
      log.push(`${unit.name}は眠っている`);
      return false;
    }
  }
  if (unit.paralyze > 0) {
    unit.paralyze -= 1;
    if (rng() < 0.5) {
      log.push(`${unit.name}はしびれて動けない`);
      return false;
    }
    log.push(`${unit.name}はしびれをこらえた`);
  }
  if (unit.charm > 0) {
    unit.sway = "charm";
    log.push(`${unit.name}は魅了されている`);
  } else if (unit.confuse > 0) {
    unit.sway = "confuse";
    log.push(`${unit.name}は混乱している`);
  }
  if (unit.trait === "anger" && rng() < 0.3) {
    putAura(unit, "atkUp", 0.3, 1, "怒り");
    log.push(`${unit.name}は怒った`);
  }
  return true;
}

function endRound(state) {
  const log = [];
  if (PopstarBattle && (state.foes || []).some((unit) => unit.popstar)) PopstarBattle.endRound(state, log);
  [...state.allies, ...state.foes].forEach((unit) => {
    if (unit.hp <= 0) return;
    const opened = unit.hp;
    let poisonLine = "";
    let healLine = "";
    if (unit.poison > 0) {
      const dot = Math.max(1, Math.round(unit.maxHp * 0.08));
      unit.hp = Math.max(0, unit.hp - dot);
      addTaken(state, unit, Math.min(dot, opened));
      unit.poison -= 1;
      poisonLine = `${unit.name}は毒で ${dot} ダメージ`;
    }
    if (unit.armorRegen > 0 && unit.hp > 0 && unit.hp < unit.maxHp) {
      const before = unit.hp;
      const gain = Math.max(1, Math.round(unit.maxHp * unit.armorRegen));
      unit.hp = Math.min(unit.maxHp, unit.hp + gain);
      const healed = unit.hp - before;
      if (healed > 0) healLine = `${unit.name}は鎧で ${healed} 回復した`;
    }
    if (unit.hp < opened) {
      if (healLine) log.push(healLine);
      if (poisonLine) log.push(poisonLine);
    } else {
      if (poisonLine) log.push(poisonLine);
      if (healLine) log.push(healLine);
    }
    unit.auras = (unit.auras || []).map((aura) => ({ ...aura, rounds: aura.rounds - 1 })).filter((aura) => aura.rounds > 0);
    unit.marks = (unit.marks || []).map((mark) => ({ ...mark, rounds: mark.rounds - 1 })).filter((mark) => mark.rounds > 0);
    unit.cover = null;
    unit.guarding = false;
    if (unit.ward > 0) unit.ward -= 1;
    if (unit.confuse > 0) unit.confuse -= 1;
    if (unit.charm > 0) unit.charm -= 1;
    if (unit.silence > 0) unit.silence -= 1;
    if (unit.noHeal > 0) unit.noHeal -= 1;
    if (unit.seals) {
      unit.seals.forEach((seal) => { seal.rounds -= 1; });
      unit.seals = unit.seals.filter((seal) => seal.rounds > 0);
    }
  });
  state.allies.forEach((unit) => {
    if (!unit.ascend || unit.hp <= 0) return;
    const damage = Math.max(1, Math.round(unit.hp * 0.5));
    unit.hp = Math.max(0, unit.hp - damage);
    log.push(`${unit.name}は昇天で ${damage} ダメージ`);
  });
  state.foes.forEach((unit) => {
    if (!unit.rep || unit.hp <= 0) return;
    const rep = unit.rep;
    if (rep.hold) rep.hold = false;
    if (rep.frenzy && rep.skip <= 0) rep.frenzy = false;
    if (rep.mend && rep.hurt > 0) {
      const heal = Math.max(1, Math.round(rep.hurt * 0.3));
      const before = unit.hp;
      unit.hp = Math.min(unit.maxHp, unit.hp + heal);
      if (unit.hp > before) log.push(`${unit.name}は ${unit.hp - before} 回復した`);
    }
    rep.hurt = 0;
    if (rep.phase < 2) return;
    if (rep.doomHold) {
      rep.doomHold = false;
      log.push(`運命の刻 残り${rep.doom}`);
      return;
    }
    if (rep.doom > 0) {
      rep.doom -= 1;
      log.push(`運命の刻 残り${rep.doom}`);
      if (rep.doom === 0) {
        rep.doom = 6;
        rep.pendingUlt = pickUlt(rep);
        rep.howled = false;
        rep.doomReady = true;
        log.push("運命の刻 残り0");
      }
    }
  });
  return log;
}

function speedOf(unit) {
  const up = Math.min(0.5, Math.max(0, auraSum(unit, "spdUp")));
  const down = Math.min(0.5, Math.max(0, auraSum(unit, "spdDown")));
  return unit.spd * (1 + up - down);
}

function orderOf(state) {
  const list = [...state.allies, ...state.foes].filter((unit) => unit.hp > 0).sort((a, b) => speedOf(b) - speedOf(a));
  const out = [];
  list.forEach((unit) => {
    out.push(unit);
    const rep = unit.rep;
    const repTwice = rep && rep.phase === 2 && !rep.hold && rep.skip <= 0 && !rep.pendingUlt;
    const dragonExtra = unit.dragon && !unit.dragon.hold ? (unit.dragon.phase === 2 ? 3 : 1) : 0;
    const demiseExtra = unit.demise && !unit.demise.hold ? (unit.demise.phase === 2 ? 2 : 1) : 0;
    const bossTwice = !rep && !unit.dragon && !unit.demise && (unit.popstarRole ? unit.menace >= 2 : (unit.boss || unit.menace >= 2));
    const bossThrice = !rep && !unit.dragon && !unit.demise && unit.popstarRole && unit.menace >= 3;
    const trashTwice = unit.extraAct && !unit.boss && !rep && !unit.dragon && !unit.demise;
    if (repTwice || bossTwice || trashTwice) out.push(unit);
    if (bossThrice) out.push(unit);
    for (let extra = 0; extra < dragonExtra + demiseExtra; extra += 1) out.push(unit);
  });
  return out;
}

function swayAction(state, actor, rng) {
  if (!actor || (actor.sway !== "charm" && actor.sway !== "confuse")) return null;
  const attack = (actor.skills || []).find((skill) => skill.id === "attack") || {
    id: "attack", name: "通常攻撃", mp: 0, target: "one", kind: "skill", effect: { power: 1 },
  };
  const friends = (actor.side === "ally" ? state.allies : state.foes).filter((unit) => unit.hp > 0 && unit.id !== actor.id);
  const foes = (actor.side === "ally" ? state.foes : state.allies).filter((unit) => unit.hp > 0);
  if (actor.sway === "charm") {
    if (!friends.length) return { idle: true, line: `${actor.name}はぼーっとしている` };
    const mate = friends[Math.floor(rng() * friends.length)];
    return { skill: attack, target: mate.id, line: `${actor.name}は魅了されて${mate.name}を攻撃した` };
  }
  const pool = [...friends, ...foes];
  if (!pool.length) return { idle: true, line: `${actor.name}は混乱している` };
  const mark = pool[Math.floor(rng() * pool.length)];
  return { skill: attack, target: mark.id, line: `${actor.name}は混乱して${mark.name}に切りかかった` };
}

function dragonSkill(id) {
  const src = Book.SKILLS[id] || Book.SKILLS.attack;
  return { id, ...src, mp: 0 };
}

function nextDragonMove(unit) {
  const dragon = unit.dragon;
  const low = unit.hp * 2 <= unit.maxHp;
  if (dragon.phase === 1) {
    if (low && !dragon.focus) {
      dragon.focus = true;
      return "maryokuFocus";
    }
    if (low && !dragon.wave) {
      dragon.wave = true;
      return "itetsukuhadou";
    }
    const pattern = ["attack", "rahoru", "mahotoon", "mahokanta", "bukimi", "begiragon", "behoimu"];
    const move = pattern[dragon.step % pattern.length];
    dragon.step += 1;
    return move;
  }
  const pattern = low
    ? ["baikirt", "sukuruto", "kamikudaku", "kamikudaku", "shakunetsu", "merazoma", "otakebi", "behoimu"]
    : ["baikirt", "sukuruto", "kamikudaku", "kamikudaku", "hageshii", "begiragon", "otakebi", "behoimu", "piorimu", "attack"];
  const move = pattern[dragon.step % pattern.length];
  dragon.step += 1;
  return move;
}

function demiseScale(target) {
  const defMod = Math.min(1.2, Math.max(0, auraSum(target, "defUp"))) - Math.min(0.6, Math.max(0, auraSum(target, "defDown")));
  const def = Math.max(0, target.def * levelFactor(target) * (1 + defMod));
  return 170 / (100 + def * 0.28);
}

function demiseDamage(actor, target, power, rng, breath) {
  let amount = actor.atk * levelFactor(actor) * power * demiseScale(target) * (0.9 + rng() * 0.2);
  if (target.cutCharge) amount *= 1 - target.cutCharge;
  amount *= 1 + Math.max(0, auraSum(target, "takenUp"));
  if (breath) {
    const guard = Math.max(0, target.armorBreathCut || 0) + Math.max(0, auraSum(target, "breathCut"));
    if (guard > 0) amount *= 1 - Math.min(0.75, guard);
  } else if (target.armorPhysCut) amount *= 1 - Math.min(0.75, Math.max(0, target.armorPhysCut));
  return Math.max(1, Math.round(amount));
}

function nextDemiseMove(unit) {
  const demise = unit.demise;
  const pattern = demise.phase === 2 ? ["crush", "breath", "end", "crush"] : ["crush", "breath", "seal", "breath"];
  const move = pattern[demise.step % pattern.length];
  demise.step += 1;
  demise.pending = move;
  return move;
}

function resolveDemise(state, actor, rng, log) {
  const move = actor.demise.pending || "crush";
  actor.demise.pending = "";
  const party = living(state.allies);
  if (!party.length) return;
  const weakest = party.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  const hitOne = (target, power) => {
    const amount = demiseDamage(actor, target, power, rng, false);
    const victim = hurt(state, target, amount, log, true);
    log.push(`${victim.name}に ${amount} ダメージ`);
  };
  if (move === "seal") {
    const caster = party.slice().sort((a, b) => b.mp - a.mp)[0];
    if (caster.silenceResist) log.push(`${caster.name}は呪文封じをこらえた`);
    else {
      caster.silence = 2;
      log.push(`${caster.name}は呪文を封じられた`);
    }
    hitOne(weakest, 1.1);
    return;
  }
  if (move === "breath" || move === "end") {
    party.forEach((target) => {
      if (target.hp <= 0) return;
      const amount = demiseDamage(actor, target, move === "end" ? 2.4 : 1.4, rng, true);
      const victim = hurt(state, target, amount, log, false);
      log.push(`${victim.name}に ${amount} ダメージ`);
    });
    return;
  }
  hitOne(weakest, actor.demise.phase === 2 ? 3.2 : 2.8);
}

function grantRaidPrize(save, raidId, rng) {
  const notes = [];
  const raid = Book.raidOf(raidId);
  if (!Array.isArray(save.gear)) save.gear = [];
  if (raidId === "demise") {
    const magic = (Book.WEAPONS.dawnDagger.jobs || []).includes(save.job);
    const id = magic ? "dawnDagger" : "starless";
    if (!save.gear.includes(id)) {
      save.gear.push(id);
      notes.push(`${Book.WEAPONS[id].name}を手に入れた`);
    }
  }
  if (raid && raid.rareDrop) {
    const roll = rng ? rng() : Math.random();
    const prize = raid.rareDrop;
    if (roll < prize.rate) {
      if (!save.gear.includes(prize.id)) {
        save.gear.push(prize.id);
        notes.push(`${Book.WEAPONS[prize.id].name}を手に入れた`);
      } else notes.push("レア武器はもう持っている");
    }
  }
  return notes;
}

function enemyPick(unit, state) {
  if (unit.popstarRole && PopstarBattle) {
    const picked = PopstarBattle.enemyPick(unit, state, Math.random);
    if (picked) return picked;
  }
  if (unit.demise) {
    const names = { crush: "砕く", breath: "終焉の息", seal: "呪文封じ", end: "終焉の一撃" };
    const move = nextDemiseMove(unit);
    return {
      skill: { id: "demise", name: names[move] || "終焉", mp: 0, target: "one", kind: "skill", effect: { demise: true } },
      target: null,
    };
  }
  if (unit.dragon) {
    const id = nextDragonMove(unit);
    const skill = dragonSkill(id);
    const party = living(state.allies);
    const weakest = party.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    const mark = skill.target === "one" || skill.target === "ally"
      ? (skill.target === "ally" ? unit : weakest)
      : null;
    return { skill, target: mark ? mark.id : null };
  }
  if (unit.rep) {
    const names = {
      poke: "通常攻撃", hits: "通常攻撃", calm: "余裕綽々", howl: "はどう", march: "止まらぬあゆみ",
      wall: "光の氷壁", blade: "天裂く凶刃", hex: "氷の呪縛", flag: "グロリアスフラッグ",
      nova: "スーパーノヴァ", rainbow: "バーストレインボウ", heaven: "導きの天翔",
    };
    const move = nextRepMove(unit);
    return {
      skill: { id: "rep", name: names[move] || "代表", mp: 0, target: "one", kind: "skill", effect: { rep: true } },
      target: null,
    };
  }
  if (unit.flee && state.round > 1 && Math.random() < unit.flee) {
    const flee = unit.skills.find((skill) => skill.effect && skill.effect.flee) || unit.skills[0];
    return { skill: flee, target: unit.id };
  }
  const ready = unit.skills.filter((skill) => (skill.mp || 0) <= unit.mp && skill.effect);
  const friends = living(state.foes).filter((friend) => friend.hp < friend.maxHp);
  const heals = ready.filter((skill) => skill.effect.heal && !skill.effect.power);
  if (friends.length && heals.length && Math.random() < 0.7) {
    const hurt = friends.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    const spell = heals.sort((a, b) => (b.effect.heal || 0) - (a.effect.heal || 0))[0];
    return { skill: spell, target: hurt.id };
  }
  const party = living(state.allies);
  const weakest = party.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  const foe = party.length <= 1 || Math.random() < 0.35
    ? weakest
    : party[Math.floor(Math.random() * party.length)];
  const debuffed = foe && (auraSum(foe, "defDown") > 0 || auraSum(foe, "atkDown") > 0 || foe.poison > 0 || foe.sleep > 0);
  const debuffs = ready.filter((skill) => {
    const effect = skill.effect;
    return effect.defDown || effect.atkDown || effect.poison || effect.sleep;
  });
  if (debuffs.length && foe && !debuffed && Math.random() < 0.4) {
    return { skill: debuffs[Math.floor(Math.random() * debuffs.length)], target: foe.id };
  }
  const blows = ready.filter((skill) => skill.effect.power);
  const group = blows.filter((skill) => skill.target === "all" || skill.target === "random");
  if (group.length && party.length >= 2 && Math.random() < 0.45) {
    return { skill: group[Math.floor(Math.random() * group.length)], target: foe ? foe.id : null };
  }
  const singles = blows.filter((skill) => skill.target !== "all" && skill.target !== "random");
  const pool = singles.length ? singles : (blows.length ? blows : ready);
  const skill = pool[Math.floor(Math.random() * pool.length)] || unit.skills[0];
  return { skill, target: foe ? foe.id : null };
}

function markDifficulty(save, id) {
  const rank = Number(id || save.difficulty) || 1;
  if (!Array.isArray(save.diffCleared)) save.diffCleared = [];
  if (!save.diffCleared.includes(rank)) save.diffCleared.push(rank);
}

function stepCombo(state, rng) {
  const combo = state.combo;
  const log = [];
  if (!combo) return { log, done: true };
  if (combo.popstar && PopstarBattle) return PopstarBattle.stepCombo(state, rng);
  if (combo.rep) return stepRepHit(state, rng);
  const actor = [...state.allies, ...state.foes].find((unit) => unit.id === combo.actorId);
  const skill = actor && (actor.skills || []).find((item) => item.id === combo.skillId);
  if (!actor || actor.hp <= 0 || !skill) {
    state.combo = null;
    return { log, done: true };
  }
  const foes = actor.side === "ally" ? living(state.foes) : living(state.allies);
  let mark = null;
  if (skill.target === "all") {
    if (!combo.waveQueue || !combo.waveQueue.length) combo.waveQueue = foes.map((unit) => unit.id);
    while (combo.waveQueue.length && !mark) {
      const id = combo.waveQueue.shift();
      mark = foes.find((unit) => unit.id === id) || null;
    }
    if (!mark) {
      state.combo = null;
      return { log, done: true };
    }
  } else if (skill.target === "random") {
    mark = foes[Math.floor(rng() * foes.length)] || null;
  } else {
    mark = [...state.allies, ...state.foes].find((unit) => unit.id === combo.chosen) || null;
    if (!mark || mark.hp <= 0) {
      state.combo = null;
      return { log, done: true };
    }
  }
  if (!mark) {
    state.combo = null;
    return { log, done: true };
  }
  const n = combo.total - combo.left + 1;
  combo.label = `${skill.name} ${n}/${combo.total}`;
  applyHit(state, actor, mark, skill, combo.qte, rng, log, true);
  if (!state.combo) return { log, done: true };
  const waveDone = skill.target !== "all" || !(combo.waveQueue && combo.waveQueue.length);
  if (waveDone) combo.left -= 1;
  const still = actor.side === "ally" ? living(state.foes) : living(state.allies);
  const lockedKill = skill.target !== "all" && skill.target !== "random" && mark.hp <= 0;
  const done = lockedKill || combo.left <= 0 || !still.length;
  if (done) {
    spendOpeners(actor);
    state.combo = null;
  }
  return { log, done };
}

function knows(unit, passive) {
  return (unit.skills || []).some((skill) => skill.effect && skill.effect.passive === passive);
}

function dropBonus(allies) {
  return (allies || []).some((unit) => knows(unit, "drop")) ? 2 : 1;
}

function startEncounter(party, monsterIds, difficulty) {
  const rank = Number(difficulty) || 1;
  const allies = party.map((save, index) => unitFromSave(save, index));
  const state = {
    allies,
    foes: monsterIds.map((id, index) => unitFromMonster(id, index, party.length, rank)),
    difficulty: rank,
    round: 1,
    skipFoes: allies.some((unit) => knows(unit, "first")),
    queue: [],
  };
  if (PopstarBattle && PopstarBattle.initBattle) PopstarBattle.initBattle(state);
  return state;
}

function applyRewards(save, foes, stolen) {
  const xp = foes.reduce((sum, foe) => sum + (foe.xp || 0), 0);
  const gold = foes.reduce((sum, foe) => sum + (foe.gold || 0), 0);
  save.gold += gold;
  foes.forEach((foe) => {
    if (!foe.material) return;
    save.materials[foe.material] = (save.materials[foe.material] || 0) + 1;
  });
  stolen.forEach((drop) => {
    if (drop.who !== save.seat) return;
    save.materials[drop.material] = (save.materials[drop.material] || 0) + 1;
  });
  const notes = gainXp(save, xp);
  const mine = partyUnit(save);
  return { xp, gold, notes, hp: mine.hp, mp: mine.mp };
}

function partyUnit(save) {
  return save;
}

function writeBack(save, unit) {
  const stats = growth(save);
  save.hp = Math.max(0, Math.min(stats.maxHp, unit.hp));
  save.mp = Math.max(0, Math.min(stats.maxMp, unit.mp));
}

if (PopstarBattle && PopstarBattle.bind) {
  PopstarBattle.bind({
    living,
    hurt,
    healUnit,
    putAura,
    putMark,
    strike,
    targetsOf,
    auraSum,
  });
}

const AdventureRules = {
  blankSave, growth, restAtTown, ensureVitals, chooseJob, canEquip, gainXp, markDifficulty, rememberLevel, sageReady,
  unitFromSave, startEncounter, castSkill, stepCombo, tickTurnStart, endRound, orderOf, enemyPick, swayAction, writeBack, dropBonus, grantRaidPrize,
};

if (typeof window !== "undefined") window.AdventureRules = AdventureRules;
if (typeof module !== "undefined" && module.exports) module.exports = AdventureRules;
