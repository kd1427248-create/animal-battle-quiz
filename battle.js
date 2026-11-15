// animal_battle_stats.xlsx の基本ステータス。±10%は質問結果。素早さは変えない。
// 通常攻撃の威力は表にないので 1.0。超会心は 5%でダメージ2倍。QTEなし。
// 鳥類のQTEは判定幅を1.5倍にしている（表には「広い」とだけある）。
const BASE_STATS = {
  ネコ科: { hp: 130, atk: 50, def: 28, spd: 80 },
  イヌ科: { hp: 200, atk: 50, def: 50, spd: 50 },
  大型: { hp: 240, atk: 40, def: 60, spd: 25 },
  鳥類: { hp: 210, atk: 65, def: 50, spd: 70 },
  爬虫類: { hp: 220, atk: 55, def: 68, spd: 45 },
};

const TRAITS = {
  ネコ科: "超会心率+8%",
  イヌ科: "",
  大型: "先攻を取れない",
  鳥類: "QTE判定が広い",
  爬虫類: "毒などの状態異常",
};

const CRIT_MULT = 2;
const CAP = { up: 0.6, defUp: 1, down: 0.65, cut: 0.9, evasion: 0.75, crit: 1, healDown: 0.75 };

const EXTRA = {
  吸収: { absorb: 0.3 },
  貫通: { pierce: true },
  ガード: { charges: [{ kind: "guard", value: 0.9 }] },
  気合: { buff: true, auras: [{ kind: "power", value: 0.45, rounds: 2 }] },
  硬化: { buff: true, auras: [{ kind: "defUp", value: 1, rounds: 3 }] },
  毒: { foeAuras: [{ kind: "poison", value: 0.45, rounds: 3 }] },
  弱体: { foeAuras: [{ kind: "atkDown", value: 0.6, rounds: 3 }] },
  反撃: { charges: [{ kind: "counter", value: 0.9 }] },
  身かわし: { charges: [{ kind: "guard", value: 0.8 }, { kind: "sureCrit", value: 1 }] },
  遠吠え: { buff: true, heal: 0.2, auras: [{ kind: "atkUp", value: 0.3, rounds: 2 }, { kind: "defUp", value: 0.9, rounds: 2 }] },
  根を張る: { buff: true, auras: [{ kind: "regen", value: 0.08, rounds: 3 }, { kind: "defUp", value: 0.85, rounds: 2 }] },
  追い風: { buff: true, auras: [{ kind: "evasion", value: 0.7, rounds: 2 }, { kind: "qteSlow", value: 1, rounds: 1 }] },
  封じ: { seal: true, foeAuras: [{ kind: "healDown", value: 0.6, rounds: 5 }, { kind: "defDown", value: 0.55, rounds: 3 }] },
  初日の出: { buff: true, auras: [{ kind: "critUp", value: 0.45, rounds: 2 }], charges: [{ kind: "sureHit", value: 1 }] },
  雪化粧: { heal: 0.08, auras: [{ kind: "cut", value: 0.75, rounds: 2 }] },
  桜吹雪: { buff: true, auras: [{ kind: "critUp", value: 0.15, rounds: 2 }], foeAuras: [{ kind: "defDown", value: 0.6, rounds: 2 }] },
  春風: { buff: true, auras: [{ kind: "evasion", value: 0.6, rounds: 2 }, { kind: "qteSlow", value: 1, rounds: 1 }] },
  新緑: { buff: true, auras: [{ kind: "regen", value: 0.06, rounds: 3 }, { kind: "defUp", value: 0.8, rounds: 2 }] },
  梅雨: { auras: [{ kind: "evasion", value: 0.6, rounds: 2 }], foeAuras: [{ kind: "atkDown", value: 0.55, rounds: 2 }] },
  夏祭り: { buff: true, auras: [{ kind: "critUp", value: 0.15, rounds: 2 }], charges: [{ kind: "nextPower", value: 0.7 }] },
  入道雲: { buff: true, auras: [{ kind: "atkUp", value: 0.4, rounds: 2 }], charges: [{ kind: "sureHit", value: 1 }] },
  月見: { heal: 0.2, auras: [{ kind: "defUp", value: 1, rounds: 1 }] },
  紅葉: { foeAuras: [{ kind: "defDown", value: 0.55, rounds: 2 }, { kind: "atkDown", value: 0.45, rounds: 2 }] },
  木枯らし: { buff: true, auras: [{ kind: "critUp", value: 0.3, rounds: 2 }, { kind: "evasion", value: 0.6, rounds: 2 }] },
  冬至: { heal: 0.15, auras: [{ kind: "cut", value: 0.7, rounds: 2 }] },
};

function quizApi() {
  if (typeof window !== "undefined" && window.AnimalQuiz) return window.AnimalQuiz;
  return require("./quiz.js");
}

function blankAuras() {
  return {};
}

function skillFromName(name, tag) {
  const quiz = quizApi();
  const base = quiz.SKILLS[name];
  const extra = EXTRA[name] || {};
  if (base) {
    return {
      name,
      tag,
      power: base.power,
      hits: base.hits || 1,
      qte: !!base.qte,
      crit: base.crit || 0,
      miss: base.miss || 0,
      uses: base.uses,
      usesLeft: base.uses,
      absorb: extra.absorb || 0,
      pierce: !!extra.pierce,
      buff: !!extra.buff,
      heal: extra.heal || 0,
      auras: extra.auras || [],
      foeAuras: extra.foeAuras || [],
      charges: extra.charges || [],
      seal: !!extra.seal,
    };
  }
  const typeSkill = Object.values(quiz.TYPE_SKILLS).find((skill) => skill.name === name);
  const monthSkill = quiz.MONTH_SKILLS.find((skill) => skill.name === name);
  const info = typeSkill || monthSkill;
  return {
    name,
    tag,
    power: 0,
    hits: 1,
    qte: false,
    crit: 0,
    miss: 0,
    uses: info.uses,
    usesLeft: info.uses,
    absorb: extra.absorb || 0,
    pierce: false,
    buff: !!extra.buff,
    heal: extra.heal || 0,
    auras: extra.auras || [],
    foeAuras: extra.foeAuras || [],
    charges: extra.charges || [],
    seal: !!extra.seal,
  };
}

function normalAttack() {
  return {
    name: "通常攻撃",
    tag: "通常",
    power: 1,
    hits: 1,
    qte: false,
    crit: 0.05,
    miss: 0,
    uses: null,
    usesLeft: null,
    absorb: 0,
    pierce: false,
    buff: false,
    heal: 0,
    auras: [],
    foeAuras: [],
    charges: [],
    seal: false,
  };
}

function makeFighter(side, result, month, title) {
  const quiz = quizApi();
  const base = BASE_STATS[result.type];
  const hpMod = result.statUp === "HP" ? 1.1 : result.statDown === "HP" ? 0.9 : 1;
  const atkMod = result.statUp === "攻撃" ? 1.1 : result.statDown === "攻撃" ? 0.9 : 1;
  const defMod = result.statUp === "守備" ? 1.1 : result.statDown === "守備" ? 0.9 : 1;
  const typeSkill = quiz.TYPE_SKILLS[result.type];
  const monthSkill = quiz.MONTH_SKILLS[month - 1];
  return {
    side,
    title: title || "",
    type: result.type,
    month,
    maxHp: Math.round(base.hp * hpMod),
    hp: Math.round(base.hp * hpMod),
    atk: Math.round(base.atk * atkMod),
    def: Math.round(base.def * defMod),
    spd: base.spd,
    tension: 0,
    trait: TRAITS[result.type],
    auras: blankAuras(),
    charges: { guard: [], counter: [], sureHit: 0, sureCrit: 0, nextPower: 0, nextAbsorb: 0 },
    seal: null,
    lastSkill: null,
    turns: 0,
    skills: [
      ...result.skills.map((name) => skillFromName(name, "質問")),
      skillFromName(typeSkill.name, "タイプ"),
      skillFromName(monthSkill.name, "誕生月"),
      normalAttack(),
    ],
  };
}

function auraList(fighter, kind) {
  return fighter.auras[kind] || [];
}

const TENSION_BUFFS = { atkUp: 1, defUp: 1, power: 1, critUp: 1, cut: 1, evasion: 1, regen: 1, qteSlow: 1 };

function tensionScale(fighter) {
  if (fighter.rep && fighter.rep.tension > 0) return 1 + fighter.rep.tension / 100;
  return 1;
}

function auraSum(fighter, kind) {
  const sum = auraList(fighter, kind).reduce((total, entry) => total + entry.value, 0);
  if (TENSION_BUFFS[kind]) return sum * tensionScale(fighter);
  return sum;
}

function guideAura(fighter, kind) {
  return auraList(fighter, kind)
    .filter((entry) => entry.source === "導き手")
    .reduce((sum, entry) => sum + entry.value, 0) * tensionScale(fighter);
}

function currentAtk(fighter) {
  const guide = guideAura(fighter, "atkUp");
  const up = Math.min(CAP.up, Math.max(0, auraSum(fighter, "atkUp") - guide)) + guide;
  const down = Math.min(CAP.down, auraSum(fighter, "atkDown"));
  return fighter.atk * (1 + up - down);
}

function receiveHeal(fighter, raw) {
  if (fighter.noHeal) return 0;
  const cut = Math.min(CAP.healDown, auraSum(fighter, "healDown"));
  return Math.max(0, Math.round(raw * (1 - cut)));
}

function refillUses(fighter) {
  fighter.skills.forEach((skill) => {
    if (skill.uses != null) skill.usesLeft = skill.uses;
  });
}

function hurt(fighter, amount, log) {
  if (!(amount > 0)) return false;
  if (fighter.hp - amount <= 0 && fighter.stoneCharges > 0) {
    const side = [fighter, fighter.partner].filter(Boolean);
    fighter.hp = 1;
    if (log) log.push(`${fighter.side}はHP1で踏みとどまった`);
    side.forEach((mate) => { mate.stoneCharges -= 1; });
    side.forEach((mate) => {
      if (mate !== fighter && mate.hp <= 0) return;
      mate.crawling = false;
      gainHp(mate, mate.maxHp);
      refillUses(mate);
      if (log) log.push(`${mate.side}はHPと技回数が全開になった`);
    });
    return true;
  }
  if (fighter.hp - amount <= 0 && fighter.grit) {
    fighter.grit = false;
    fighter.hp = Math.max(1, Math.round(fighter.maxHp * 0.3));
    if (log) log.push(`${fighter.side}は不死鳥の羽で持ちこたえた`);
    return true;
  }
  fighter.hp = Math.max(0, fighter.hp - amount);
  return false;
}

function gainHp(fighter, amount) {
  if (!(amount > 0)) return 0;
  if (fighter.hp <= 0 || fighter.crawling) {
    const revived = fighter.hp <= 0;
    fighter.hp = Math.min(fighter.maxHp, 1);
    fighter.crawling = true;
    return revived ? 1 : 0;
  }
  const before = fighter.hp;
  fighter.hp = Math.min(fighter.maxHp, before + amount);
  return fighter.hp - before;
}

function shareHeal(fighter, amount, log) {
  if (!(amount > 0)) return;
  const partner = fighter.partner;
  if (partner) {
    const raw = Math.max(1, Math.round(partner.maxHp * (amount / fighter.maxHp)));
    const wasDown = partner.hp <= 0;
    const echoed = receiveHeal(partner, raw);
    const gained = gainHp(partner, echoed);
    if (gained > 0) log.push(wasDown ? `${partner.side}はHP1で復活した` : `${partner.side}も ${gained} 回復した`);
    return;
  }
  if (typeof fighter.onShareHeal !== "function") return;
  const echoed = fighter.onShareHeal(amount / fighter.maxHp);
  if (echoed) log.push(`相方も ${echoed} 回復した`);
}

function currentDef(fighter) {
  const up = Math.min(CAP.defUp, auraSum(fighter, "defUp"));
  const down = Math.min(CAP.down, auraSum(fighter, "defDown"));
  return fighter.def * (1 + up - down);
}

const BUFF_KINDS = new Set(["atkUp", "defUp", "power", "critUp", "cut", "evasion", "regen", "qteSlow"]);

function putAura(fighter, source, spec, actor) {
  const list = fighter.auras[spec.kind] || (fighter.auras[spec.kind] = []);
  const entry = { source, value: spec.value, rounds: spec.rounds, fresh: BUFF_KINDS.has(spec.kind) };
  if (spec.kind === "poison") entry.dot = Math.max(1, Math.round(currentAtk(actor) * spec.value));
  const prev = list.find((item) => item.source === source);
  if (prev) {
    prev.rounds = spec.rounds;
    prev.fresh = entry.fresh;
    if (entry.dot) prev.dot = entry.dot;
  } else {
    list.push(entry);
  }
}

function putCharge(fighter, source, spec) {
  if (spec.kind === "guard" || spec.kind === "counter") {
    const list = fighter.charges[spec.kind];
    const prev = list.find((item) => item.source === source);
    if (prev) prev.value = spec.value;
    else list.push({ source, value: spec.value });
    return;
  }
  fighter.charges[spec.kind] = spec.value;
}

function canUse(fighter, skill) {
  if (skill.usesLeft === 0) return false;
  if (fighter.seal && fighter.seal.name === skill.name) return false;
  if (fighter.seals && fighter.seals.some((seal) => seal.name === skill.name)) return false;
  return true;
}

function effectLive(fighter, target, skill) {
  if (skill.auras.some((spec) => auraList(fighter, spec.kind).some((entry) => entry.source === skill.name))) return true;
  if (target && skill.foeAuras.some((spec) => auraList(target, spec.kind).some((entry) => entry.source === skill.name))) return true;
  if (skill.charges.some((spec) => {
    if (spec.kind === "guard" || spec.kind === "counter") {
      return fighter.charges[spec.kind].some((item) => item.source === skill.name);
    }
    return fighter.charges[spec.kind] > 0;
  })) return true;
  return !!(skill.seal && target && target.seal);
}

function aiPick(fighter, target) {
  const usable = fighter.skills.filter((skill) => canUse(fighter, skill));
  const heal = usable.find((skill) => skill.heal >= 0.08 && fighter.hp < fighter.maxHp * 0.5);
  if (heal) return heal;
  const support = usable.find((skill) => !skill.power && !effectLive(fighter, target, skill));
  if (support) return support;
  const attacks = usable.filter((skill) => skill.power);
  if (attacks.length) return attacks.slice().sort((a, b) => attackScore(b) - attackScore(a))[0];
  return usable[0] || null;
}

function attackScore(skill) {
  const miss = skill.qte ? 0 : skill.miss;
  const score = skill.power * skill.hits * (1 - miss) * (1 + skill.crit * 0.5);
  return skill.name === "通常攻撃" ? score - 10 : score;
}

const CHARGE_BUFFS = {
  guard: { id: "guard", glyph: "🛡️", short: "防", name: "ガード", tone: "up" },
  counter: { id: "counter", glyph: "↩️", short: "反撃", name: "反撃待ち", tone: "up" },
  sureHit: { id: "sureHit", glyph: "🎯", short: "必中", name: "必中", tone: "up" },
  sureCrit: { id: "sureCrit", glyph: "💥", short: "必会", name: "超会心必中", tone: "up" },
  nextPower: { id: "nextPower", glyph: "⬆️", short: "次威", name: "次の威力アップ", tone: "up" },
};

function buffGrants(skill) {
  const items = [];
  skill.auras.forEach((spec) => {
    if (!BUFF_KINDS.has(spec.kind)) return;
    const item = STATUS_AURAS.find((entry) => entry.id === spec.kind);
    if (item) items.push(item);
  });
  skill.charges.forEach((spec) => {
    if (CHARGE_BUFFS[spec.kind]) items.push(CHARGE_BUFFS[spec.kind]);
  });
  return items;
}

function applySupport(actor, target, skill, log) {
  if (!skill.power) log.push(`${actor.side}は${skill.name}を使った`);
  skill.auras.forEach((spec) => putAura(actor, skill.name, spec, actor));
  skill.foeAuras.forEach((spec) => putAura(target, skill.name, spec, actor));
  skill.charges.forEach((spec) => putCharge(actor, skill.name, spec));
  if (skill.partyGuard && actor.partner && actor.partner.hp > 0) {
    putCharge(actor.partner, skill.name, { kind: "guard", value: 0.9 });
    log.push(`${actor.partner.side}にもガード`);
  }
  buffGrants(skill).forEach((item) => log.push(`${actor.side}に ${item.name}`));
  if (skill.heal || skill.flatHeal) {
    const raw = skill.flatHeal || Math.max(1, Math.round(actor.maxHp * skill.heal));
    const wasDown = actor.hp <= 0;
    const amount = receiveHeal(actor, raw);
    const gained = gainHp(actor, amount);
    if (amount > 0) {
      if (wasDown && gained > 0) log.push(`${actor.side}はHP1で復活した`);
      else if (gained > 0) log.push(`${actor.side}は ${gained} 回復した`);
      shareHeal(actor, amount, log);
    } else {
      log.push(`${actor.side}は回復できなかった`);
    }
  }
  if (skill.seal) {
    if (target.lastSkill && target.lastSkill !== "通常攻撃") {
      target.seal = { name: target.lastSkill, rounds: 4 };
      log.push(`${target.side}の${target.lastSkill}を封じた`);
    } else {
      log.push("封じる技がなかった");
    }
  }
}

function attackContext(actor, target, skill, qte) {
  const traitCrit = actor.type === "ネコ科" ? 0.08 : 0;
  const perfectAim = skill.name === "急所狙い" && qte >= 1.5;
  return {
    sureHit: actor.charges.sureHit > 0 || perfectAim,
    sureCrit: actor.charges.sureCrit > 0,
    evasion: Math.min(CAP.evasion, auraSum(target, "evasion")),
    powerAura: auraSum(actor, "power"),
    nextPower: actor.charges.nextPower,
    critBonus: Math.min(CAP.crit, skill.crit + auraSum(actor, "critUp") + traitCrit),
    qte,
    dealt: 0,
  };
}

function landHit(actor, target, skill, ctx, rng, log, opening) {
  const sureHit = opening && ctx.sureHit;
  if (!sureHit && rng() < skill.miss) {
    log.push(`${skill.name}は外れた`);
    return { miss: true, damage: 0, crit: false, reduced: false };
  }
  let atk = currentAtk(actor);
  let def = currentDef(target);
  if (skill.pierce) def *= 0.5;
  const power = skill.power * (1 + ctx.powerAura + (opening ? ctx.nextPower : 0));
  const crit = (opening && ctx.sureCrit) || rng() < ctx.critBonus;
  const roll = 0.9 + rng() * 0.2;
  const raw = atk * power * (100 / (100 + def)) * ctx.qte * (crit ? CRIT_MULT : 1) * roll;
  const frozen = !!target.freeze;
  if (frozen) target.freeze = false;
  const guardCharge = opening ? target.charges.guard.reduce((sum, item) => sum + item.value, 0) : 0;
  let guard = actor === target || frozen || (skill.pierce && ctx.qte >= 1.2)
    ? 0
    : Math.min(CAP.cut, guardCharge + auraSum(target, "cut"));
  let damage = Math.max(1, Math.round(raw * (1 + (actor.tension || 0) / 100) * (1 - guard) * (frozen ? 1.1 : 1)));
  if (target.rep && target.rep.cloak) damage = Math.max(1, Math.round(damage * 0.1));
  if (target.rep && target.rep.frenzy) damage *= 3;
  if (target.rep && target.rep.wall) {
    const back = Math.max(1, Math.round(damage * 0.2 * (1 + target.rep.tension / 100)));
    target.rep.wall = false;
    const saved = hurt(actor, back, log);
    log.push(`${target.side}は光の氷壁で防いだ`);
    if (!saved) log.push(`${actor.side}に反撃 ${back}`);
    return { miss: false, damage: 0, crit, reduced: true };
  }
  let reduced = false;
  const saved = hurt(target, damage, log);
  if (!saved) {
    if (target.rep && target.rep.cloak) target.rep.taken += damage;
    if (target.rep && target.rep.mend) target.rep.hurt += damage;
    if (target.rep && target.rep.frenzy && damage > 0) {
      const heal = receiveHeal(actor, damage);
      const gained = gainHp(actor, heal);
      if (gained > 0) log.push(`${actor.side}は ${gained} 回復した`);
    }
    reduced = guard > 0 || (target.rep && target.rep.cloak);
    log.push(`${target.side}に ${damage} ダメージ${crit ? "（超会心）" : ""}${reduced ? "（軽減）" : ""}${frozen ? "（凍結）" : ""}`);
  }
  return { miss: false, damage: saved ? 0 : damage, crit, reduced };
}

function applyAttackFollowup(actor, target, skill, dealt, firstDamage, log) {
  if (dealt > 0 && (skill.absorb || actor.charges.nextAbsorb)) {
    const ratio = Math.max(skill.absorb || 0, actor.charges.nextAbsorb || 0);
    const raw = Math.max(1, Math.round(dealt * ratio));
    const heal = receiveHeal(actor, raw);
    const gained = gainHp(actor, heal);
    if (heal > 0) {
      if (gained > 0) log.push(`${actor.side}は ${gained} 吸収した`);
      shareHeal(actor, heal, log);
    } else {
      log.push(`${actor.side}は吸収できなかった`);
    }
  }
  if (firstDamage > 0 && target.charges.counter.length) {
    const ratio = target.charges.counter.reduce((sum, item) => sum + item.value, 0);
    const back = Math.max(1, Math.round(firstDamage * ratio));
    if (!hurt(actor, back, log)) log.push(`${actor.side}に反撃 ${back}`);
  }
}

function closeAttack(actor, target, firstDamage, log) {
  actor.charges.sureHit = 0;
  actor.charges.sureCrit = 0;
  actor.charges.nextPower = 0;
  actor.charges.nextAbsorb = 0;
  if (actor.tension > 0) {
    actor.tension = 0;
    if (log) log.push(`${actor.side}のテンションを使い切った`);
  }
  if (firstDamage > 0) {
    target.charges.guard = [];
    target.charges.counter = [];
  }
}

function resolveAttack(actor, target, skill, qte, rng, log) {
  const ctx = attackContext(actor, target, skill, qte);
  let firstDamage = 0;
  if (!ctx.sureHit && !target.freeze && rng() < ctx.evasion) {
    log.push(`${target.side}は${skill.name}を回避した`);
  } else {
    for (let hit = 0; hit < skill.hits; hit += 1) {
      const blow = landHit(actor, target, skill, ctx, rng, log, hit === 0);
      if (hit === 0) firstDamage = blow.damage;
      ctx.dealt += blow.damage;
    }
    applyAttackFollowup(actor, target, skill, ctx.dealt, firstDamage, log);
  }
  closeAttack(actor, target, firstDamage, log);
}

function spendUse(skill) {
  if (skill.usesLeft != null) skill.usesLeft -= 1;
}

function skillToAct(actor, skill, log) {
  if (skill && canUse(actor, skill)) return skill;
  const sealed = skill && ((actor.seal && actor.seal.name === skill.name) || (actor.seals && actor.seals.some((item) => item.name === skill.name)));
  if (sealed) {
    log.push(`${actor.side}の${skill.name}は氷で封じられていた`);
    const normal = actor.skills.find((item) => item.name === "通常攻撃" && canUse(actor, item));
    if (normal) return normal;
  }
  log.push(`${actor.side}は技を出せなかった`);
  return null;
}

async function playCombo(actor, target, skill, qte, log, view) {
  log.push(`${actor.side}の${skill.name}`);
  const ctx = attackContext(actor, target, skill, qte);
  const rng = Math.random;
  let firstDamage = 0;
  if (!ctx.sureHit && !target.freeze && rng() < ctx.evasion) {
    log.push(`${target.side}は${skill.name}を回避した`);
    renderBattle(view({ banner: skill.name, bannerSide: sideOf(actor), phaseText: `${skill.name} 回避`, actor: actor.side, whiff: target.side, whiffKind: "evade" }));
    await wait(900);
  } else {
    for (let hit = 0; hit < skill.hits; hit += 1) {
      const blow = landHit(actor, target, skill, ctx, rng, log, hit === 0);
      if (hit === 0) firstDamage = blow.damage;
      ctx.dealt += blow.damage;
      const key = target.slot || (target.side === "あなた" ? "player" : "enemy");
      renderBattle(view({
        banner: skill.name,
        bannerSide: sideOf(actor),
        phaseText: `${skill.name} ${hit + 1}/${skill.hits}`,
        actor: actor.side,
        whiff: blow.miss ? target.side : "",
        fxCrit: blow.crit ? { [key]: true } : {},
        fxCut: blow.reduced ? { [key]: true } : {},
      }));
      await wait(1100);
    }
    const mark = log.length;
    applyAttackFollowup(actor, target, skill, ctx.dealt, firstDamage, log);
    if (log.length > mark) {
      renderBattle(view({
        banner: skill.name,
        bannerSide: sideOf(actor),
        phaseText: skill.name,
        actor: actor.side,
        fxCrit: fxCrit(log.slice(mark), [actor, target]),
      }));
      await wait(900);
    }
  }
  closeAttack(actor, target, firstDamage, log);
}

function finishAct(actor, target, skill, log) {
  applySupport(actor, target, skill, log);
  spendUse(skill);
  actor.lastSkill = skill.name;
  actor.turns += 1;
}

function act(actor, target, skill, qte, rng, log) {
  if (skill.power) {
    log.push(`${actor.side}の${skill.name}`);
    resolveAttack(actor, target, skill, qte, rng, log);
  }
  finishAct(actor, target, skill, log);
}

function rechargeQuestion(fighter, log, rng) {
  const skills = fighter.skills.filter((skill) => skill.tag === "質問");
  if (!skills.length || skills.some((skill) => skill.usesLeft > 0)) return;
  const skill = skills[Math.floor(rng() * skills.length)];
  skill.usesLeft += 1;
  log.push(`${fighter.side}の${skill.name}がもう1回使える`);
}

function endRound(player, enemy, log, rng, extras) {
  const random = rng || Math.random;
  const fighters = [player, enemy].concat(extras || []).filter(Boolean);
  fighters.forEach((fighter) => {
    auraList(fighter, "regen").forEach((entry) => {
      const raw = Math.max(1, Math.round(fighter.maxHp * entry.value * tensionScale(fighter)));
      const wasDown = fighter.hp <= 0;
      const amount = receiveHeal(fighter, raw);
      const gained = gainHp(fighter, amount);
      if (amount > 0) {
        if (wasDown && gained > 0) log.push(`${fighter.side}はHP1で復活した`);
        else if (gained > 0) log.push(`${fighter.side}は ${gained} 回復した`);
        shareHeal(fighter, amount, log);
      } else {
        log.push(`${fighter.side}は回復できなかった`);
      }
    });
    if (fighter.regenFlat) {
      const wasDown = fighter.hp <= 0;
      const amount = receiveHeal(fighter, fighter.regenFlat);
      const gained = gainHp(fighter, amount);
      if (amount > 0) {
        if (wasDown && gained > 0) log.push(`${fighter.side}は破邪の宝玉でHP1で復活した`);
        else if (gained > 0) log.push(`${fighter.side}は破邪の宝玉で ${gained} 回復した`);
        shareHeal(fighter, amount, log);
      }
    }
  });
  fighters.forEach((fighter) => {
    auraList(fighter, "poison").forEach((entry) => {
      if (!hurt(fighter, entry.dot, log)) log.push(`${fighter.side}は毒で ${entry.dot} ダメージ`);
    });
    if (fighter.seal) {
      fighter.seal.rounds -= 1;
      if (fighter.seal.rounds <= 0) fighter.seal = null;
    }
    if (typeof fighter.noHeal === "number" && fighter.noHeal > 0) {
      fighter.noHeal -= 1;
      if (fighter.noHeal <= 0) fighter.noHeal = 0;
    }
    if (fighter.levelDown) {
      if (fighter.levelDown.fresh) fighter.levelDown.fresh = false;
      else {
        fighter.levelDown.rounds -= 1;
        if (fighter.levelDown.rounds <= 0) {
          clearLevelDown(fighter);
          log.push(`${fighter.side}のレベルダウンが解けた`);
        }
      }
    }
    Object.keys(fighter.auras).forEach((kind) => {
      fighter.auras[kind] = fighter.auras[kind].filter((entry) => {
        if (entry.fresh) {
          entry.fresh = false;
          return true;
        }
        entry.rounds -= 1;
        return entry.rounds > 0;
      });
    });
    rechargeQuestion(fighter, log, random);
  });
}

function alive(fighter) {
  return fighter.hp > 0;
}

function turnOrder(a, b, rng) {
  if (a.type === "大型" && b.type !== "大型") return [b, a];
  if (b.type === "大型" && a.type !== "大型") return [a, b];
  if (a.spd === b.spd) return rng() < 0.5 ? [a, b] : [b, a];
  return a.spd > b.spd ? [a, b] : [b, a];
}

function turnOrderMany(fighters, rng) {
  const keyed = fighters.map((fighter) => ({
    fighter,
    late: fighter.type === "大型" ? 1 : 0,
    spd: fighter.spd,
    tie: rng(),
  }));
  keyed.sort((a, b) => a.late - b.late || b.spd - a.spd || a.tie - b.tie);
  return keyed.map((item) => item.fighter);
}

function simulateBattle(playerResult, playerMonth, enemyResult, enemyMonth, rng) {
  const random = rng || Math.random;
  const player = makeFighter("あなた", playerResult, playerMonth);
  const enemy = makeFighter("相手", enemyResult, enemyMonth);
  const log = [];
  let round = 1;
  while (alive(player) && alive(enemy)) {
    log.push(`-- ラウンド ${round}`);
    const chosen = {
      player: aiPick(player, enemy),
      enemy: aiPick(enemy, player),
    };
    const order = turnOrder(player, enemy, random);
    for (let i = 0; i < order.length; i += 1) {
      const actor = order[i];
      const target = actor === player ? enemy : player;
      if (!alive(actor) || !alive(target)) break;
      const skill = skillToAct(actor, actor === player ? chosen.player : chosen.enemy, log);
      if (skill) act(actor, target, skill, 1, random, log);
    }
    if (alive(player) && alive(enemy)) endRound(player, enemy, log, random);
    round += 1;
  }
  let winner = "draw";
  if (player.hp > 0 && enemy.hp <= 0) winner = "player";
  else if (enemy.hp > 0 && player.hp <= 0) winner = "enemy";
  else if (player.hp !== enemy.hp) winner = player.hp > enemy.hp ? "player" : "enemy";
  return { winner, rounds: round - 1, playerHp: player.hp, enemyHp: enemy.hp, log };
}

function skillBlurb(name) {
  const quiz = quizApi();
  const base = quiz.SKILLS[name];
  if (base) {
    const parts = [];
    if (base.power != null) parts.push(`威力${base.power}`);
    if (base.hits != null) parts.push(`${base.hits}ヒット`);
    if (base.qte != null) parts.push(base.qte ? "QTEあり" : "QTEなし");
    parts.push(`回数${base.uses}`);
    if (base.crit != null) parts.push(`超会心${Math.round(base.crit * 1000) / 10}%`);
    if (base.miss != null) parts.push(`ミス${Math.round(base.miss * 1000) / 10}%`);
    return `${parts.join(" / ")}。${base.note}`;
  }
  const typed = Object.values(quiz.TYPE_SKILLS).find((skill) => skill.name === name);
  const month = quiz.MONTH_SKILLS.find((skill) => skill.name === name);
  const info = typed || month;
  if (info) return `回数${info.uses}。${info.main}／${info.sub}`;
  if (name === "破邪の宝玉") return "回数1。代表の闇の衣を剥がす。";
  if (name === "でかキノコ") return "回数2。HPを30回復する。";
  if (name === "全員ガード") return "回数2。味方全員の、次の攻撃の初撃を90%軽減する。";
  return "威力1 / 1ヒット / QTEなし / 回数無制限 / 超会心5%。技封じの対象外。";
}

let battleGen = 0;

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
    } else {
      this.beep(170, 0.09, "square", 0.045, 80);
    }
  },
  guard() {
    this.beep(310, 0.12, "triangle", 0.05, 180);
  },
  miss() {
    this.beep(392, 0.09, "sine", 0.05);
    setTimeout(() => this.beep(311, 0.16, "sine", 0.04), 90);
  },
  heal() {
    this.beep(480, 0.14, "sine", 0.045, 720);
  },
  select() {
    this.beep(340, 0.05, "sine", 0.03);
  },
  battle() {
    this.beep(392, 0.12, "sine", 0.06);
    setTimeout(() => this.beep(494, 0.12, "sine", 0.06), 140);
    setTimeout(() => this.beep(587, 0.28, "sine", 0.055), 280);
  },
  round() {
    this.beep(523, 0.08, "sine", 0.045);
    setTimeout(() => this.beep(659, 0.14, "sine", 0.04), 110);
  },
  turn(yours) {
    this.beep(yours ? 698 : 349, 0.1, "sine", 0.04);
  },
  cast() {
    this.beep(440, 0.07, "sine", 0.035);
    setTimeout(() => this.beep(554, 0.1, "sine", 0.03), 70);
  },
  buff() {
    this.beep(523, 0.08, "sine", 0.04);
    setTimeout(() => this.beep(659, 0.16, "sine", 0.038), 90);
  },
  ult(kind) {
    if (kind === "nova") {
      this.beep(70, 0.45, "sawtooth", 0.05, 40);
      setTimeout(() => this.beep(196, 0.4, "square", 0.045, 880), 220);
      setTimeout(() => this.beep(740, 0.32, "triangle", 0.04), 620);
      return;
    }
    if (kind === "rainbow") {
      [523, 659, 784, 988, 1175].forEach((freq, index) => {
        setTimeout(() => this.beep(freq, 0.18, "triangle", 0.04), index * 110);
      });
      return;
    }
    this.beep(988, 0.42, "sine", 0.04, 494);
    setTimeout(() => this.beep(1319, 0.36, "sine", 0.035), 240);
    setTimeout(() => this.beep(1568, 0.28, "triangle", 0.03), 520);
  },
  debuff() {
    this.beep(440, 0.08, "sine", 0.035);
    setTimeout(() => this.beep(370, 0.16, "sine", 0.03), 90);
  },
  poison() {
    this.beep(196, 0.08, "sine", 0.04);
    setTimeout(() => this.beep(165, 0.16, "sine", 0.03), 80);
  },
  stuck() {
    this.beep(294, 0.1, "sine", 0.035);
    setTimeout(() => this.beep(247, 0.14, "sine", 0.03), 100);
  },
  recharge() {
    this.beep(440, 0.07, "sine", 0.035);
    setTimeout(() => this.beep(659, 0.12, "sine", 0.035), 80);
  },
  qteStart() {
    this.beep(880, 0.04, "sine", 0.025);
  },
  draw() {
    this.beep(349, 0.12, "sine", 0.04);
    setTimeout(() => this.beep(349, 0.16, "sine", 0.032), 160);
  },
  qte(label) {
    if (label === "PERFECT") this.beep(880, 0.16, "triangle", 0.05, 1320);
    else if (label === "GOOD") this.beep(700, 0.12, "triangle", 0.045);
    else if (label === "success") this.beep(560, 0.1, "sine", 0.04);
    else this.miss();
  },
  win() {
    this.beep(523, 0.1, "triangle", 0.045);
    setTimeout(() => this.beep(659, 0.1, "triangle", 0.045), 110);
    setTimeout(() => this.beep(784, 0.18, "triangle", 0.045), 220);
  },
  lose() {
    this.beep(240, 0.28, "sine", 0.045, 90);
  },
  theme: null,
  themeOwner: 0,
  boss(owner) {
    this.stopBoss();
    if (!this.ensure()) return;
    const notes = [87, 98, 73, 110, 82, 65];
    let step = 0;
    this.themeOwner = owner;
    const tick = () => {
      if (owner !== battleGen || this.themeOwner !== owner) {
        this.stopBoss();
        return;
      }
      const note = notes[step % notes.length];
      this.beep(note, 0.42, "triangle", 0.04);
      this.beep(note / 2, 0.48, "sine", 0.025);
      step += 1;
    };
    tick();
    this.theme = setInterval(tick, 520);
  },
  stopBoss() {
    this.themeOwner = 0;
    if (this.theme) clearInterval(this.theme);
    this.theme = null;
  },
};

let shownHp = null;

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

const STATUS_AURAS = [
  { id: "poison", glyph: "☠️", short: "毒", name: "毒", tone: "bad", detail: "ラウンドの終わりにダメージ" },
  { id: "healDown", glyph: "💔", short: "回−", name: "回復量ダウン", tone: "down", detail: "回復量が下がっている" },
  { id: "atkDown", glyph: "⚔️", short: "攻−", name: "攻撃ダウン", tone: "down", detail: "攻撃が下がっている" },
  { id: "defDown", glyph: "🛡️", short: "守−", name: "守備ダウン", tone: "down", detail: "守備が下がっている" },
  { id: "qteSlow", glyph: "🐢", short: "遅い", name: "QTEが遅い", tone: "down", detail: "タイミングバーの動きが遅い" },
  { id: "atkUp", glyph: "⚔️", short: "攻+", name: "攻撃アップ", tone: "up", detail: "攻撃が上がっている" },
  { id: "defUp", glyph: "🛡️", short: "守+", name: "守備アップ", tone: "up", detail: "守備が上がっている" },
  { id: "power", glyph: "💥", short: "威力", name: "威力アップ", tone: "up", detail: "技の威力が上がっている" },
  { id: "critUp", glyph: "🎯", short: "超会", name: "超会心アップ", tone: "up", detail: "超会心が出やすくなっている" },
  { id: "cut", glyph: "🧱", short: "軽減", name: "ダメージ軽減", tone: "up", detail: "受けるダメージが減っている" },
  { id: "evasion", glyph: "💨", short: "回避", name: "回避", tone: "up", detail: "攻撃を確率で避ける" },
  { id: "regen", glyph: "💚", short: "回復", name: "持続回復", tone: "up", detail: "ラウンドの終わりに回復する" },
];

function pct(value) {
  return Math.round(value * 100);
}

function statusDetail(fighter, spec, list) {
  let sum = list.reduce((total, entry) => total + entry.value, 0);
  if (TENSION_BUFFS[spec.id]) sum *= tensionScale(fighter);
  if (spec.id === "healDown") return `回復量−${pct(Math.min(CAP.healDown, sum))}%`;
  if (spec.id === "poison") {
    const dot = list.reduce((total, entry) => total + (entry.dot || 0), 0);
    return `ラウンドの終わりに ${dot} ダメージ`;
  }
  if (spec.id === "atkDown") return `攻撃−${pct(Math.min(CAP.down, sum))}%`;
  if (spec.id === "defDown") return `守備−${pct(Math.min(CAP.down, sum))}%`;
  if (spec.id === "atkUp") {
    const guide = list.filter((entry) => entry.source === "導き手").reduce((total, entry) => total + entry.value, 0) * tensionScale(fighter);
    const rest = Math.max(0, sum - guide);
    return `攻撃+${pct(Math.min(CAP.up, rest) + guide)}%`;
  }
  if (spec.id === "defUp") return `守備+${pct(Math.min(CAP.defUp, sum))}%`;
  if (spec.id === "power") return `技の威力+${pct(sum)}%`;
  if (spec.id === "critUp") return `超会心率+${pct(Math.min(CAP.crit, sum))}%`;
  if (spec.id === "cut") return `受けるダメージを${pct(Math.min(CAP.cut, sum))}%軽減`;
  if (spec.id === "evasion") return `回避${pct(Math.min(CAP.evasion, sum))}%`;
  if (spec.id === "regen") {
    const amount = list.reduce((total, entry) => total + Math.max(1, Math.round(fighter.maxHp * entry.value * tensionScale(fighter))), 0);
    return `ラウンドの終わりに ${amount} 回復`;
  }
  if (spec.id === "qteSlow") return "タイミングバーが約3倍ゆっくり";
  return spec.detail;
}

function statusItems(fighter) {
  const items = [];
  STATUS_AURAS.forEach((spec) => {
    const list = auraList(fighter, spec.id);
    if (!list.length) return;
    const fresh = list.some((entry) => entry.fresh);
    const rounds = list.reduce((max, entry) => Math.max(max, entry.rounds), 0);
    items.push({ ...spec, detail: statusDetail(fighter, spec, list), rounds, fresh });
  });
  if (fighter.charges.guard.length) {
    const guard = Math.min(CAP.cut, fighter.charges.guard.reduce((sum, item) => sum + item.value, 0));
    items.push({ id: "guard", glyph: "🛡️", short: "防", name: "ガード", tone: "up", detail: `次の攻撃の初撃を${pct(guard)}%軽減`, rounds: null });
  }
  if (fighter.charges.counter.length) {
    const counter = fighter.charges.counter.reduce((sum, item) => sum + item.value, 0);
    items.push({ id: "counter", glyph: "↩️", short: "反撃", name: "反撃待ち", tone: "up", detail: `次の攻撃の初撃の${pct(counter)}%を返す`, rounds: null });
  }
  if (fighter.charges.sureHit) items.push({ id: "sureHit", glyph: "🎯", short: "必中", name: "必中", tone: "up", detail: "次の攻撃の初撃は必中", rounds: null });
  if (fighter.charges.sureCrit) items.push({ id: "sureCrit", glyph: "💥", short: "必会", name: "超会心必中", tone: "up", detail: "次の攻撃の初撃は超会心（ダメージ2倍）", rounds: null });
  if (fighter.charges.nextPower) items.push({ id: "nextPower", glyph: "⬆️", short: "次威", name: "次の威力アップ", tone: "up", detail: `次の攻撃の初撃の威力+${pct(fighter.charges.nextPower)}%`, rounds: null });
  if (fighter.charges.nextAbsorb) items.push({ id: "nextAbsorb", glyph: "🩸", short: "吸", name: "ダメージ回復", tone: "up", detail: "次の攻撃で与えたダメージを回復する", rounds: null });
  if (fighter.seal) {
    items.push({
      id: "seal",
      glyph: "🚫",
      short: "封じ",
      name: `${fighter.seal.name}封じ`,
      tone: "bad",
      detail: `${fighter.seal.name}は出せない。通常攻撃は出せる`,
      rounds: fighter.seal.rounds,
    });
  }
  if (fighter.grit) {
    items.push({ id: "grit", glyph: "🪶", short: "羽", name: "不死鳥の羽", tone: "up", detail: "次に倒れそうになったとき、HP30%で持ちこたえる", rounds: null });
  }
  if (fighter.fairy) {
    items.push({ id: "fairy", glyph: "✨", short: "光", name: "守りの光", tone: "up", detail: "この勝負で倒れて勝ち残ると、HP50%で戻る", rounds: null });
  }
  if (fighter.oneUp) {
    items.push({ id: "oneup", glyph: "🍄", short: "再", name: "やり直し", tone: "up", detail: "この勝負で倒れて勝ち残ると、HP全回復で戻る", rounds: null });
  }
  if (fighter.regenFlat) {
    items.push({ id: "light", glyph: "🌕", short: "玉", name: "破邪の宝玉", tone: "up", detail: `ラウンドの終わりに ${fighter.regenFlat} 回復`, rounds: null });
  }
  if (fighter.bell) {
    items.push({ id: "bell", glyph: "🔔", short: "鈴", name: "呼び鈴", tone: "up", detail: "呼び鈴を持っている", rounds: null });
  }
  if (fighter.tension > 0) {
    const effect = fighter.tension >= 100
      ? "次の攻撃だけダメージ2倍"
      : `次の攻撃だけ威力+${pct(fighter.tension / 100)}%`;
    items.push({ id: "tension", glyph: "🔥", short: "張", name: "テンション", tone: "up", detail: `テンション ${fighter.tension}。${effect}`, rounds: null });
  }
  if (fighter.stoneCharges > 0) {
    items.push({ id: "stone", glyph: "🪨", short: "石", name: "復活の石", tone: "up", detail: "倒れそうになるとHP1で踏みとどまり、味方のHPと技回数が全開になる", rounds: fighter.stoneCharges });
  }
  if (fighter.freeze) {
    items.push({ id: "freeze", glyph: "❄️", short: "凍", name: "凍結", tone: "bad", detail: "次のダメージ+10%。回避もガードもできない", rounds: null });
  }
  if (fighter.ascend) {
    items.push({ id: "ascend", glyph: "💫", short: "昇", name: "昇天", tone: "bad", detail: "ラウンドの終わりに、いまのHPの半分のダメージ", rounds: null });
  }
  if (fighter.noHeal) {
    items.push({ id: "noHeal", glyph: "🚫", short: "封癒", name: "回復不可", tone: "bad", detail: "回復できない", rounds: fighter.noHeal });
  }
  if (fighter.levelDown) {
    const dropped = fighter.levelDown.level * 5;
    items.push({
      id: "levelDown",
      glyph: "↓",
      short: "Lv-",
      name: "レベルダウン",
      tone: "down",
      detail: `レベル${fighter.levelDown.level}。攻撃・守備・HPが${dropped}%下がっている`,
      rounds: fighter.levelDown.rounds,
    });
  }
  if (fighter.seals && fighter.seals.length) {
    const rounds = fighter.seals.reduce((max, item) => Math.max(max, item.rounds), 0);
    items.push({
      id: "hex",
      glyph: "❄️",
      short: "呪",
      name: "氷の呪縛",
      tone: "bad",
      detail: `${fighter.seals.map((item) => item.name).join("、")}は出せない`,
      rounds,
    });
  }
  if (fighter.rep && fighter.rep.cloak) {
    items.push({ id: "cloak", glyph: "🌑", short: "衣", name: "闇の衣", tone: "down", detail: `ダメージを90%軽減する。通したダメージ ${fighter.rep.taken}/100 で剥がれる`, rounds: null });
  }
  if (fighter.rep && fighter.rep.phase === 2 && fighter.rep.tension > 0) {
    items.push({ id: "tension", glyph: "🔥", short: "張", name: "テンション", tone: "up", detail: `テンション ${fighter.rep.tension}。高いほど、バフと一部の技が強い`, rounds: null });
  }
  if (fighter.rep && fighter.rep.frenzy) {
    items.push({ id: "frenzy", glyph: "⚡", short: "チャンス", name: "反撃チャンス", tone: "bad", detail: "このあいだ代表は動けない。代表へのダメージは3倍で、与えた分だけ回復する", rounds: null });
  }
  if (fighter.rep && fighter.rep.wall) {
    items.push({ id: "wall", glyph: "🧊", short: "氷壁", name: "光の氷壁", tone: "up", detail: "次のダメージを無効にし、20%を返す", rounds: null });
  }
  if (fighter.rep && fighter.rep.power > 1) {
    items.push({ id: "repPower", glyph: "✖️", short: "倍", name: "ダメージ倍率", tone: "up", detail: `与えるダメージ ${fighter.rep.power} 倍`, rounds: null });
  }
  if (fighter.rep && fighter.rep.mend) {
    items.push({ id: "mend", glyph: "💚", short: "歩", name: "止まらぬあゆみ", tone: "up", detail: "ラウンドの終わりに、そのラウンドで受けたダメージの30%を回復", rounds: null });
  }
  if (fighter.rep && fighter.rep.phase === 2 && fighter.rep.doom > 0) {
    items.push({
      id: "doom",
      glyph: "⌛",
      short: "刻",
      name: "運命の刻",
      tone: "bad",
      detail: `あと${fighter.rep.doom}ラウンド。0で超会心必中、超会心ダメージ2.5倍、攻撃2倍、確定先制`,
      rounds: fighter.rep.doom,
    });
  }
  const toneRank = { bad: 0, down: 1, up: 2 };
  items.sort((a, b) => toneRank[a.tone] - toneRank[b.tone]);
  return items;
}

function statusIcons(fighter, key) {
  const items = statusItems(fighter);
  if (!items.length) return "";
  return `<div class="icons">${items.map((item) => `
    <button type="button" class="badge ${item.tone}${item.fresh ? " just" : ""}" data-badge="${key}:${item.id}" aria-label="${escapeHtml(item.name)}">
      <span class="glyph" aria-hidden="true">${item.glyph}</span>
      <span class="bname">${escapeHtml(item.short)}</span>
      ${item.rounds != null && item.rounds < 50 ? `<span class="bturn">${item.rounds}</span>` : ""}
    </button>`).join("")}</div>`;
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

function portraitHtml(type, extraClass, buttonId) {
  const cls = extraClass ? ` ${extraClass}` : "";
  const open = buttonId
    ? `<button type="button" class="portrait${cls}" id="${buttonId}" aria-label="ステータスを見る">`
    : `<div class="portrait${cls}">`;
  const close = buttonId ? "</button>" : "</div>";
  return `${open}<img src="${PORTRAITS[type] || ""}" alt="" onerror="this.hidden=true"><span>イラスト<br>${escapeHtml(type)}</span>${close}`;
}

function showFighterStats(fighter) {
  const atk = Math.round(currentAtk(fighter));
  const def = Math.round(currentDef(fighter));
  const traitCrit = fighter.type === "ネコ科" ? 0.08 : 0;
  const critNow = Math.min(CAP.crit, traitCrit + auraSum(fighter, "critUp"));
  const line = (label, base, now) => (
    now === base
      ? `<p><strong>${label}</strong>　${base}</p>`
      : `<p><strong>${label}</strong>　${base} → ${now}</p>`
  );
  let critLine = "";
  if (fighter.charges.sureCrit) critLine = `<p><strong>超会心</strong>　次の攻撃は100%</p>`;
  else if (critNow > traitCrit) {
    critLine = traitCrit > 0
      ? `<p><strong>超会心</strong>　+${pct(traitCrit)}% → +${pct(critNow)}%</p>`
      : `<p><strong>超会心</strong>　+${pct(critNow)}%</p>`;
  } else if (critNow > 0) critLine = `<p><strong>超会心</strong>　+${pct(critNow)}%</p>`;
  showSheet(`
    <h2>${escapeHtml(fighter.side)}・${escapeHtml(fighter.type)}</h2>
    <p><strong>HP</strong>　${Math.max(0, fighter.hp)} / ${fighter.maxHp}</p>
    ${line("攻撃", fighter.atk, atk)}
    ${line("守備", fighter.def, def)}
    <p><strong>素早さ</strong>　${fighter.spd}</p>
    ${critLine}
    ${fighter.trait ? `<p><strong>特性</strong>　${escapeHtml(fighter.trait)}</p>` : ""}
    <button class="primary" data-close type="button">閉じる</button>
  `);
}

function cardId(view, side) {
  if (!side) return "";
  if (view.player && view.player.side === side) return "card-player";
  if (view.ally && view.ally.side === side) return "card-ally";
  return "card-enemy";
}

function renderBattle(view) {
  const app = document.getElementById("app");
  const prev = shownHp || {
    player: view.player.hp,
    enemy: view.enemy.hp,
    ally: view.ally ? view.ally.hp : 0,
  };
  const recent = view.log.slice(-3);
  const picker = view.picker || view.player;
  const hud = (fighter, key) => {
    const from = Math.max(0, prev[key]) / fighter.maxHp;
    return `
      <section class="hud">
        <div class="hud-top">
          <h2>${escapeHtml(fighter.title ? `${fighter.title}・${fighter.type}` : `${fighter.side}・${fighter.type}`)}</h2>
          <p>HP ${Math.max(0, fighter.hp)} / ${fighter.maxHp}</p>
        </div>
        <div class="hp ${fighter.hp / fighter.maxHp <= 0.3 ? "low" : ""}" id="hp-${key}"><span id="fill-${key}" style="width:${Math.max(0, Math.min(1, from)) * 100}%"></span></div>
        <div class="hud-top foot">
          <p class="trait">素早さ ${fighter.spd}${fighter.trait ? `／${escapeHtml(fighter.trait)}` : ""}</p>
          ${statusIcons(fighter, key)}
        </div>
      </section>`;
  };
  const skills = view.waiting
    ? `<div class="skill-grid">${picker.skills.map((skill, index) => {
      const uses = skill.usesLeft == null ? "∞" : skill.usesLeft;
      const seal = (picker.seals || []).find((item) => item.name === skill.name);
      const frame = seal ? " frozen" : skill.partyGuard ? " story-guard" : "";
      const detail = seal ? `氷の呪縛 / あと${seal.rounds}` : `${skill.tag} / 残り${uses}`;
      return `<button class="choice${frame}" type="button" data-skill="${index}"><strong>${escapeHtml(skill.name)}</strong><span class="detail">${escapeHtml(detail)}</span></button>`;
    }).join("")}</div>`
    : "";
  const qteType = view.qteType || view.player.type;
  const qte = view.qte
    ? `<div class="qte ${qteType === "鳥類" ? "wide" : ""}" id="qte"><div class="good" style="${qteBandStyle(view.qteLayout, "good")}"></div><div class="perfect" style="${qteBandStyle(view.qteLayout, "perfect")}"></div><div class="core" style="${qteBandStyle(view.qteLayout, "core")}"></div><div class="marker" id="marker"></div></div><button class="primary" id="qte-stop" type="button">今だ！</button>`
    : "";
  const handoff = view.handoff
    ? `<button class="primary" id="handoff" type="button">${escapeHtml(view.handoff)}</button>`
    : "";
  const end = view.finished
    ? `${view.endPrimary === null ? "" : `<button class="primary" id="rematch" type="button">${escapeHtml(view.endPrimary || "同じカードでもう一戦")}</button>`}${view.endGhost === null ? "" : `<button class="ghost" id="restart" type="button">${escapeHtml(view.endGhost || "診断からやり直す")}</button>`}`
    : "";
  const picks = view.picks
    ? `<section class="win"><h2>このラウンドの行動</h2><p>あなた　<strong>${escapeHtml(view.picks.player)}</strong></p><p>相手　<strong>${escapeHtml(view.picks.enemy)}</strong></p></section>`
    : "";
  app.innerHTML = `
    <div class="stage arena-stage${view.command ? " command" : ""}${view.ally ? " doubles" : ""}${(view.picker || view.player).skills.some((skill) => skill.orb || skill.flatHeal || skill.partyGuard) ? " orb" : ""}${view.ultFlash ? ` ult-hit ${view.ultFlash}` : ""}">
      <p class="phase">ラウンド ${view.round}　${escapeHtml(view.phaseText)}</p>
      ${hud(view.enemy, "enemy")}
      <div class="logline">
        <div class="feed">${recent.length ? recent.map((line, index) => `<p class="${index === recent.length - 1 ? "now" : ""}">${escapeHtml(line)}</p>`).join("") : `<p class="now">戦いがはじまる</p>`}</div>
        <button type="button" id="open-log">ログ</button>
      </div>
      <div class="field depth-hall${view.enemy.rep ? " throne-hall rep" : view.enemy.title === "ゴウ" ? " throne-hall gou" : ""}">
        <div class="ground"></div>
        ${view.enemy.rep || view.enemy.title === "ゴウ" ? `<div class="throne" aria-hidden="true"><div class="throne-back"></div><div class="throne-arm left"></div><div class="throne-arm right"></div><div class="throne-seat"></div></div>` : ""}
        <div class="actor enemy" id="card-enemy">${portraitHtml(view.enemy.type, "field-art")}</div>
        <div class="actor player" id="card-player">${portraitHtml(view.player.type, "field-art", "open-stats")}</div>
        ${view.ally ? `<div class="actor ally" id="card-ally">${portraitHtml(view.ally.type, "field-art", "open-stats-ally")}</div>` : ""}
        ${view.banner ? `<p class="banner ${view.bannerSide || ""}${view.speech ? " speech" : ""}${view.ultFlash ? " ult" : ""}">${escapeHtml(view.banner)}</p>` : ""}
        ${view.bellNote ? `<div class="bell-card"><p class="bell-who">${escapeHtml(view.bellNote.name)}</p>${view.bellNote.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>` : ""}
        ${view.finale ? finaleHtml(view.finale) : ""}
      </div>
      ${view.ally ? `<div class="hud-row">${hud(view.player, "player")}${hud(view.ally, "ally")}</div>` : hud(view.player, "player")}
      ${picks}
      <div class="dock">
        ${qte || skills || handoff}
        ${end}
      </div>
      ${view.ult ? ultHtml(view.ult) : ""}
    </div>
    <div class="backdrop" id="backdrop" hidden></div>
    <div class="sheet" id="sheet" hidden></div>
  `;
  const openLog = document.getElementById("open-log");
  if (openLog) {
    openLog.onclick = () => {
      showSheet(`
        <h2>ログ</h2>
        <div class="log">${view.log.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>
        <button class="primary" data-close type="button">閉じる</button>
      `);
      const box = document.querySelector("#sheet .log");
      if (box) box.scrollTop = box.scrollHeight;
    };
  }
  const openStats = document.getElementById("open-stats");
  if (openStats) openStats.onclick = () => showFighterStats(view.player);
  const openAlly = document.getElementById("open-stats-ally");
  if (openAlly && view.ally) openAlly.onclick = () => showFighterStats(view.ally);
  document.querySelectorAll("[data-badge]").forEach((button) => {
    button.onclick = () => {
      const [key, id] = button.dataset.badge.split(":");
      const fighter = key === "ally" ? view.ally : key === "player" ? view.player : view.enemy;
      const item = statusItems(fighter).find((entry) => entry.id === id);
      if (!item) return;
      showSheet(`
        <p class="badge-hero ${item.tone}">${item.glyph}</p>
        <h2>${escapeHtml(item.name)}</h2>
        <p>${escapeHtml(item.detail)}</p>
        <p>${item.rounds != null ? (item.rounds < 50 ? `残り ${item.rounds} ラウンド` : "この勝負の間") : "次に発動する"}</p>
        <button class="primary" data-close type="button">閉じる</button>
      `);
    };
  });
  const keys = view.ally ? ["player", "ally", "enemy"] : ["player", "enemy"];
  keys.forEach((key) => {
    const fighter = key === "ally" ? view.ally : key === "player" ? view.player : view.enemy;
    const grants = (view.fxGrant || {})[key] || [];
    if (grants.length) stampGrants(document.getElementById(`card-${key}`), grants);
    const fill = document.getElementById(`fill-${key}`);
    const from = Math.max(0, prev[key]) / fighter.maxHp;
    const to = Math.max(0, fighter.hp) / fighter.maxHp;
    fill.style.width = `${Math.max(0, Math.min(1, from)) * 100}%`;
    if (from !== to) {
      fill.getBoundingClientRect();
      fill.style.width = `${Math.max(0, Math.min(1, to)) * 100}%`;
    }
    const before = Math.max(0, prev[key]);
    const after = Math.max(0, fighter.hp);
    const delta = after - before;
    if (delta === 0) return;
    const cardEl = document.getElementById(`card-${key}`);
    const crit = delta < 0 && (view.fxCrit || {})[key];
    const cut = delta < 0 && (view.fxCut || {})[key];
    cardEl.classList.add(delta < 0 ? "hurt" : "heal");
    const floater = document.createElement("div");
    floater.className = `floater ${delta < 0 ? (crit ? "crit" : "dmg") : "heal"}`;
    floater.textContent = `${delta < 0 ? "" : "+"}${delta}`;
    cardEl.appendChild(floater);
    if (crit) stampImpact(cardEl, cut ? "pop high" : "pop", { glyph: "🎯", short: "超会", tone: "up" });
    if (cut) stampImpact(cardEl, crit ? "pop low" : "pop", { glyph: "🛡️", short: "防", tone: "up" });
    if (view.actor) {
      Sfx[delta < 0 ? "hit" : "heal"](crit);
      if (cut) Sfx.guard();
    }
    if (delta < 0) {
      app.classList.remove("shake");
      app.getBoundingClientRect();
      app.classList.add("shake");
    }
  });
  if (view.whiff) {
    const cardEl = document.getElementById(cardId(view, view.whiff));
    if (cardEl) {
      const evaded = view.whiffKind === "evade";
      stampImpact(cardEl, "pop", evaded
        ? { glyph: "💨", short: "回避", tone: "up" }
        : { glyph: "💨", short: "ミス", tone: "down" });
      Sfx.miss();
    }
  }
  if (view.actor) {
    const actorCard = document.getElementById(cardId(view, view.actor));
    if (actorCard) actorCard.classList.add("swing");
  }
  if (view.finished) {
    if (view.phaseText.includes("勝ち")) Sfx.win();
    else if (view.phaseText.includes("負け")) Sfx.lose();
    else Sfx.draw();
  }
  shownHp = {
    player: Math.max(0, view.player.hp),
    enemy: Math.max(0, view.enemy.hp),
    ally: view.ally ? Math.max(0, view.ally.hp) : 0,
  };
  const log = document.getElementById("log");
  if (log) log.scrollTop = log.scrollHeight;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sideOf(actor) {
  if (actor.team) return actor.team === "foe" ? "foe" : "you";
  return actor.side === "あなた" ? "you" : "foe";
}

function finaleHtml(word) {
  const tone = word === "勝ち" ? "win" : word === "負け" ? "lose" : "draw";
  const kicker = word === "勝ち" ? "WIN" : word === "負け" ? "LOSE" : "DRAW";
  const sub = word === "勝ち" ? "相手を倒した" : word === "負け" ? "倒されてしまった" : "決着がつかなかった";
  return `<div class="finale ${tone}"><p class="finale-kicker">${kicker}</p><p class="finale-word">${escapeHtml(word)}</p><p class="finale-sub">${sub}</p></div>`;
}

function ultHtml(ult) {
  return `<div class="ult-cut ${ult.kind}"><div class="ult-burst"></div><div class="ult-burst late"></div><p class="ult-kicker">${escapeHtml(ult.kicker || "必殺")}</p><p class="ult-name">${escapeHtml(ult.name)}</p>${ult.line ? `<p class="ult-line">${escapeHtml(ult.line)}</p>` : ""}</div>`;
}

function qteWindow(wide) {
  const scale = wide ? 1.5 : 1;
  const perfectHalf = 0.03 * scale;
  const goodHalf = 0.08 * scale;
  const coreHalf = 0.008 * scale;
  const min = Math.max(0.3, goodHalf);
  const max = Math.min(0.7, 1 - goodHalf);
  return {
    center: min + Math.random() * (max - min),
    coreHalf,
    perfectHalf,
    goodHalf,
  };
}

function qteBandStyle(layout, band) {
  if (!layout) return "";
  const half = band === "core" ? layout.coreHalf : band === "perfect" ? layout.perfectHalf : layout.goodHalf;
  return `left:${(layout.center - half) * 100}%;width:${half * 200}%`;
}

function qteResult(dist, layout) {
  if (dist <= layout.coreHalf) return { mult: 1.5, label: "PERFECT" };
  if (dist <= layout.perfectHalf) return { mult: 1.2, label: "GOOD" };
  if (dist <= layout.goodHalf) return { mult: 1, label: "success" };
  return { mult: 0.5, label: "miss" };
}

function askQte(slow, layout) {
  return new Promise((resolve) => {
    const marker = document.getElementById("marker");
    const button = document.getElementById("qte-stop");
    const period = slow ? 3300 : 1100;
    const started = performance.now();
    let pos = 0;
    let stopped = false;
    function frame(now) {
      if (stopped) return;
      const cycle = ((now - started) / period) % 2;
      pos = cycle < 1 ? cycle : 2 - cycle;
      marker.style.left = `${pos * 100}%`;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    function finish() {
      if (stopped) return;
      stopped = true;
      document.removeEventListener("keydown", onKey);
      const dist = Math.abs(pos - layout.center);
      resolve(qteResult(dist, layout));
    }
    function onKey(event) {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        finish();
      }
    }
    button.onclick = finish;
    document.addEventListener("keydown", onKey);
  });
}

function fxOn(lines, fighters, word) {
  const list = fighters && fighters.length ? fighters : [
    { side: "あなた", slot: "player" },
    { side: "相手", slot: "enemy" },
  ];
  const out = {};
  list.forEach((fighter) => {
    const slot = fighter.slot || (fighter.side === "あなた" ? "player" : "enemy");
    out[slot] = lines.some((line) => line.includes(`${fighter.side}に`) && line.includes(word));
  });
  return out;
}

function fxCrit(lines, fighters) {
  return fxOn(lines, fighters, "超会心");
}

function fxCut(lines, fighters) {
  return fxOn(lines, fighters, "軽減");
}

function whiffOf(lines, actorSide, targetSide) {
  const foe = targetSide || (actorSide === "あなた" ? "相手" : "あなた");
  if (lines.some((line) => line.includes(`${foe}は`) && line.includes("回避"))) return foe;
  if (lines.some((line) => line.includes("外れた"))) return foe;
  return "";
}

function stampGrants(cardEl, items) {
  const portrait = cardEl && cardEl.querySelector(".portrait");
  if (!portrait) return;
  const row = document.createElement("div");
  row.className = "impact grant";
  row.innerHTML = items.map((item) => `<span class="badge ${item.tone}"><span class="glyph">${item.glyph}</span><span class="bname">${escapeHtml(item.name)}</span></span>`).join("");
  portrait.appendChild(row);
}

function stampImpact(cardEl, kind, item) {
  const portrait = cardEl.querySelector(".portrait");
  if (!portrait) return;
  const stamp = document.createElement("div");
  stamp.className = `impact ${kind}`;
  stamp.innerHTML = `<span class="badge ${item.tone}"><span class="glyph">${item.glyph}</span><span class="bname">${escapeHtml(item.short)}</span></span>`;
  portrait.appendChild(stamp);
}

function applyStoryRun(fighter, run) {
  if (!run) return;
  fighter.atk = Math.round(fighter.atk * (1 + 0.15 * (run.atk || 0)));
  fighter.def = Math.round(fighter.def * (1 + 0.15 * (run.def || 0)));
  fighter.maxHp = Math.round(fighter.maxHp * (1 + 0.2 * (run.hp || 0)));
  fighter.spd += 20 * (run.spd || 0);
  if (run.light) {
    fighter.atk += 30;
    fighter.def += 30;
    fighter.spd += 30;
    fighter.maxHp += 30;
    fighter.regenFlat = 50;
    fighter.orb = true;
  }
  if (run.shroom) {
    fighter.maxHp += 150;
    fighter.skills.unshift(shroomSkill());
  }
  fighter.hp = run.hpNow == null ? fighter.maxHp : Math.max(1, Math.min(fighter.maxHp, run.hpNow));
  if (run.crit) putAura(fighter, "ピントレンズ", { kind: "critUp", value: 0.2 * run.crit, rounds: 99 }, fighter);
  Object.entries(run.uses || {}).forEach(([name, extra]) => {
    const skill = fighter.skills.find((item) => item.tag === "質問" && item.name === name);
    if (!skill || skill.usesLeft == null || !extra) return;
    skill.uses += extra;
    skill.usesLeft += extra;
  });
  if (run.item === "guard" || run.item === "invuln") {
    putAura(fighter, run.item === "invuln" ? "無敵のアメ" : "きらめき星", { kind: "cut", value: 0.9, rounds: 3 }, fighter);
  }
  if (run.item === "kiai") putAura(fighter, "火の花", { kind: "power", value: 0.5, rounds: 3 }, fighter);
  if (run.item === "shield") putCharge(fighter, "古の大盾", { kind: "guard", value: 0.9 });
  if (run.item === "mic") putCharge(fighter, "叫びの笛", { kind: "nextPower", value: 1 });
  if (run.item === "phoenix") fighter.grit = true;
  if (run.item === "fairy") fighter.fairy = true;
  if (run.item === "oneup" || run.item === "k1up") fighter.oneUp = true;
  if (run.grit) fighter.grit = true;
  if (run.orb) fighter.orb = true;
  if (run.bell) fighter.bell = true;
  if (run.stone) fighter.stone = true;
}

function shroomSkill() {
  return {
    name: "でかキノコ",
    tag: "アイテム",
    power: 0,
    hits: 1,
    qte: false,
    crit: 0,
    miss: 0,
    uses: 2,
    usesLeft: 2,
    absorb: 0,
    pierce: false,
    buff: false,
    heal: 0,
    flatHeal: 30,
    auras: [],
    foeAuras: [],
    charges: [],
    seal: false,
  };
}

function partyGuardSkill() {
  return {
    name: "全員ガード",
    tag: "ストーリー",
    power: 0,
    hits: 1,
    qte: false,
    crit: 0,
    miss: 0,
    uses: 2,
    usesLeft: 2,
    absorb: 0,
    pierce: false,
    buff: true,
    heal: 0,
    auras: [],
    foeAuras: [],
    charges: [{ kind: "guard", value: 0.9 }],
    seal: false,
    partyGuard: true,
  };
}

function orbSkill() {
  return {
    name: "破邪の宝玉",
    tag: "アイテム",
    power: 0,
    hits: 1,
    qte: false,
    crit: 0,
    miss: 0,
    uses: 1,
    usesLeft: 1,
    absorb: 0,
    pierce: false,
    buff: false,
    heal: 0,
    auras: [],
    foeAuras: [],
    charges: [],
    seal: false,
    orb: true,
  };
}

function applyRep(enemy) {
  enemy.title = "代表";
  enemy.type = "裏";
  enemy.maxHp = 1000;
  enemy.hp = 1000;
  enemy.spd = 100;
  enemy.trait = "闇の衣";
  enemy.rep = {
    phase: 1,
    taken: 0,
    tension: 0,
    doom: 0,
    doomReady: false,
    frenzy: false,
    skip: 0,
    calm: 0,
    opened: false,
    step: 0,
    power: 1,
    cloak: true,
    wall: false,
    mend: false,
    hurt: 0,
    usedUlts: [],
    fireUlt: false,
    howled: false,
  };
}

function paintRep(enemy) {
  const rep = enemy.rep;
  if (!rep) return;
  if (rep.phase === 1) enemy.trait = `闇の衣 ${rep.taken}/100`;
  else if (rep.frenzy && rep.doom > 0) enemy.trait = `反撃チャンス／運命の刻 残り${rep.doom}`;
  else if (rep.frenzy) enemy.trait = "反撃チャンス";
  else if (rep.doom > 0) enemy.trait = `運命の刻 残り${rep.doom}`;
  else if (rep.doomReady) enemy.trait = `テンション ${rep.tension}`;
  else enemy.trait = `テンション ${rep.tension}`;
  enemy.spd = rep.phase === 1 ? 100 : 110;
}

function repHit(boss, target, base, log, name, pierce, critChance) {
  const blank = { damage: 0, crit: false, reduced: false, missed: false };
  if (!target || !alive(target)) return blank;
  const frozen = !!target.freeze;
  if (frozen) target.freeze = false;
  if (!frozen && !pierce && Math.random() < Math.min(CAP.evasion, auraSum(target, "evasion"))) {
    log.push(`${target.side}は${name}を回避した`);
    return { ...blank, missed: true };
  }
  let guard = 0;
  if (!frozen && !pierce) {
    const charge = target.charges.guard.reduce((sum, item) => sum + item.value, 0);
    guard = Math.min(CAP.cut, charge + auraSum(target, "cut"));
  }
  const chance = critChance == null ? 0.3 : critChance;
  const crit = boss.rep.phase === 2 && (boss.rep.doomReady || Math.random() < chance);
  const critMult = crit ? (boss.rep.doomReady ? 2.5 : CRIT_MULT) : 1;
  const atkScale = boss.atk > 0 ? currentAtk(boss) / boss.atk : 1;
  const defScale = (100 + 50 * 0.35) / (100 + currentDef(target) * 0.35);
  const roll = 0.9 + Math.random() * 0.2;
  let amount = base * boss.rep.power * atkScale * defScale * roll * critMult;
  if (frozen) amount *= 1.1;
  amount = Math.max(1, Math.round(amount * (1 - guard)));
  const saved = hurt(target, amount, log);
  if (guard > 0) target.charges.guard = [];
  if (!saved && target.hp <= 0) target.fallen = true;
  if (!saved) log.push(`${target.side}に ${amount} ダメージ${crit ? "（超会心）" : ""}${guard > 0 ? "（軽減）" : ""}${frozen ? "（凍結）" : ""}`);
  return { damage: saved ? 0 : amount, crit: !!(crit && !saved), reduced: guard > 0, missed: false };
}

function applyLevelDown(fighter, log) {
  if (!fighter.levelDown) {
    fighter.levelDown = {
      level: 0,
      rounds: 3,
      fresh: true,
      atk: fighter.atk,
      def: fighter.def,
      maxHp: fighter.maxHp,
    };
  }
  const down = fighter.levelDown;
  down.level += 1;
  const scale = Math.max(0, 1 - 0.05 * down.level);
  const nextMax = Math.max(1, Math.round(down.maxHp * scale));
  const hpRatio = fighter.maxHp > 0 ? nextMax / fighter.maxHp : 1;
  fighter.atk = Math.max(1, Math.round(down.atk * scale));
  fighter.def = Math.max(1, Math.round(down.def * scale));
  fighter.maxHp = nextMax;
  if (fighter.hp > 0) fighter.hp = Math.max(1, Math.round(fighter.hp * hpRatio));
  log.push(`${fighter.side}はレベルダウン（${down.level}）`);
}

function clearLevelDown(fighter) {
  const down = fighter.levelDown;
  if (!down) return false;
  const prevMax = fighter.maxHp;
  fighter.atk = down.atk;
  fighter.def = down.def;
  fighter.maxHp = down.maxHp;
  if (fighter.hp > 0 && prevMax > 0) {
    fighter.hp = Math.min(down.maxHp, Math.max(1, Math.round(fighter.hp * (down.maxHp / prevMax))));
  }
  fighter.levelDown = null;
  return true;
}

function stealBuff(boss, target, log) {
  const kinds = ["atkUp", "defUp", "power", "critUp", "cut", "evasion", "regen", "qteSlow"];
  for (let i = 0; i < kinds.length; i += 1) {
    const kind = kinds[i];
    const list = auraList(target, kind);
    if (!list.length) continue;
    const entry = list.shift();
    putAura(boss, entry.source || "導きの天翔", { kind, value: entry.value, rounds: entry.rounds || 2 }, boss);
    log.push(`${target.side}のバフを奪った`);
    return;
  }
  if (target.charges.guard.length) {
    const guard = target.charges.guard.shift();
    putCharge(boss, "導きの天翔", { kind: "guard", value: guard.value });
    log.push(`${target.side}のガードを奪った`);
  }
}

function sealTwo(target, log) {
  const pool = target.skills.filter((skill) => skill.name !== "通常攻撃" && !skill.orb && !skill.partyGuard && canUse(target, skill));
  const picked = pool.sort(() => Math.random() - 0.5).slice(0, 2);
  if (!picked.length) {
    log.push("封じる技がなかった");
    return;
  }
  if (!target.seals) target.seals = [];
  picked.forEach((skill) => {
    target.seals.push({ name: skill.name, rounds: 2 });
    log.push(`${target.side}の${skill.name}を封じた`);
  });
}

function pickRepMove(boss) {
  if (boss.rep.phase === 1) return "poke";
  if (!boss.rep.opened && boss.rep.calm < 2) {
    boss.rep.opened = true;
    boss.rep.calm += 1;
    return "calm";
  }
  boss.rep.opened = true;
  const pattern = ["hex", "march", "flag", "blade", "wall", "hits"];
  const move = pattern[boss.rep.step % pattern.length];
  boss.rep.step += 1;
  return move;
}

async function playRepMove(boss, party, move, log, view, still) {
  const living = () => party.filter(alive);
  const weakest = () => living().slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];

  async function beat(name, index, total, target, info, ultKind) {
    if (still && !still()) return false;
    const key = target && target.slot;
    renderBattle(view({
      banner: name,
      bannerSide: "foe",
      phaseText: total > 1 ? `${name} ${index}/${total}` : name,
      actor: boss.side,
      whiff: info && info.missed && target ? target.side : "",
      whiffKind: info && info.missed ? "evade" : "",
      fxCrit: key && info && info.crit ? { [key]: true } : {},
      fxCut: key && info && info.reduced ? { [key]: true } : {},
      ultFlash: ultKind || "",
    }));
    await wait(ultKind === "heaven" ? Math.round(760 / 1.2) : ultKind ? 1200 : total > 1 ? 900 : 1400);
    return !still || still();
  }

  async function openUlt(kind, name, line) {
    if (still && !still()) return false;
    Sfx.ult(kind);
    renderBattle(view({
      ult: { kind, name, line, kicker: "必殺" },
      phaseText: name,
      ultFlash: kind,
    }));
    await wait(2100);
    return !still || still();
  }

  async function announce(name) {
    log.push(name);
    return beat(name, 1, 1, null, null);
  }

  async function strikes(name, count, base, pierce, pick, each, ultKind, critChance) {
    log.push(name);
    if (ultKind) {
      const opened = await openUlt(ultKind, name, ultKind === "heaven" ? "天が、落ちてくる" : "");
      if (!opened) return false;
    }
    for (let hit = 0; hit < count; hit += 1) {
      const target = pick(hit);
      if (!target || !alive(target)) break;
      const info = repHit(boss, target, base, log, name, pierce, critChance);
      if (each) each(target, info);
      const ok = await beat(name, hit + 1, count, target, info, ultKind);
      if (!ok) return false;
    }
    return true;
  }

  if (move === "poke" || move === "hits") {
    const title = move === "poke" ? "代表" : "新入生代表";
    const count = move === "poke" ? 5 : 6;
    const target = weakest();
    log.push(`${title}の通常攻撃`);
    for (let hit = 0; hit < count; hit += 1) {
      if (!target || !alive(target)) break;
      const info = repHit(boss, target, 5, log, "通常攻撃", false);
      const ok = await beat("通常攻撃", hit + 1, count, target, info);
      if (!ok) return "通常攻撃";
    }
    return "通常攻撃";
  }
  if (move === "calm") {
    await announce("余裕綽々だ");
    return "余裕綽々だ";
  }
  if (move === "hex") {
    const targets = living();
    log.push("氷の呪縛");
    for (let index = 0; index < targets.length; index += 1) {
      const target = targets[index];
      const info = repHit(boss, target, 20, log, "氷の呪縛", false);
      sealTwo(target, log);
      if (Math.random() < 0.5 && alive(target)) {
        target.freeze = true;
        log.push(`${target.side}は凍った`);
      }
      const ok = await beat("氷の呪縛", index + 1, targets.length, target, info);
      if (!ok) return "氷の呪縛";
    }
    return "氷の呪縛";
  }
  if (move === "march") {
    boss.rep.tension = 50;
    boss.rep.mend = true;
    const boost = 0.2;
    putAura(boss, "止まらぬあゆみ", { kind: "atkUp", value: boost, rounds: 2 }, boss);
    putAura(boss, "止まらぬあゆみ", { kind: "defUp", value: boost, rounds: 2 }, boss);
    log.push("止まらぬあゆみ");
    log.push(`テンション ${boss.rep.tension}`);
    await beat("止まらぬあゆみ", 1, 1, null, null);
    return "止まらぬあゆみ";
  }
  if (move === "flag") {
    const targets = living();
    log.push("グロリアスフラッグ");
    for (let index = 0; index < targets.length; index += 1) {
      const target = targets[index];
      const info = repHit(boss, target, 50, log, "グロリアスフラッグ", false);
      if (alive(target) && target.hp / target.maxHp <= 0.15) {
        if (target.stoneCharges > 0) hurt(target, target.hp, log);
        else {
          target.hp = 0;
          target.fallen = true;
          log.push(`${target.side}は崩壊した`);
        }
      }
      const ok = await beat("グロリアスフラッグ", index + 1, targets.length, target, info);
      if (!ok) return "グロリアスフラッグ";
    }
    return "グロリアスフラッグ";
  }
  if (move === "blade") {
    const target = weakest();
    log.push("天裂く凶刃");
    const info = target ? repHit(boss, target, 60, log, "天裂く凶刃", false) : null;
    boss.rep.power = Math.round((boss.rep.power + 0.05) * 100) / 100;
    log.push(`ダメージ倍率が ${boss.rep.power} 倍になった`);
    await beat("天裂く凶刃", 1, 1, target, info);
    return "天裂く凶刃";
  }
  if (move === "wall") {
    boss.rep.wall = true;
    log.push("光の氷壁");
    log.push("次のダメージを無効にし、20%を返す");
    await beat("光の氷壁", 1, 1, null, null);
    return "光の氷壁";
  }
  if (move === "howl") {
    log.push("大人の事情のはどう");
    const targets = living();
    targets.forEach((target) => {
      const tension = target.tension > 0;
      if (tension) target.tension = 0;
      const cleared = clearPositiveBuffs(target) || tension;
      log.push(cleared ? `${target.side}のバフが解けた` : `${target.side}に解けるバフはなかった`);
    });
    Sfx.debuff();
    await beat("大人の事情のはどう", 1, 1, null, null);
    return "大人の事情のはどう";
  }
  if (move === "nova") {
    const target = weakest();
    log.push("スーパーノヴァ");
    const opened = await openUlt("nova", "スーパーノヴァ", "すべてを、白く焼く");
    if (!opened) return "スーパーノヴァ";
    const info = target ? repHit(boss, target, 260, log, "スーパーノヴァ", false) : null;
    if (target) {
      target.noHeal = 4;
      target.ascend = true;
      log.push(`${target.side}は4ラウンド回復できない。昇天がついた`);
    }
    await beat("スーパーノヴァ", 1, 1, target, info, "nova");
    return "スーパーノヴァ";
  }
  if (move === "rainbow") {
    const targets = living();
    log.push("バーストレインボウ");
    const opened = await openUlt("rainbow", "バーストレインボウ", "七色が、貫く");
    if (!opened) return "バーストレインボウ";
    for (let index = 0; index < targets.length; index += 1) {
      const target = targets[index];
      const info = repHit(boss, target, 140, log, "バーストレインボウ", true);
      const ok = await beat("バーストレインボウ", index + 1, targets.length, target, info, "rainbow");
      if (!ok) return "バーストレインボウ";
    }
    boss.rep.tension = 100;
    log.push("テンション 100");
    await beat("テンション 100", 1, 1, null, null, "rainbow");
    return "バーストレインボウ";
  }
  if (move === "heaven") {
    const ok = await strikes("導きの天翔", 15, 21, false, () => {
      const pool = living();
      if (!pool.length) return null;
      return pool[Math.floor(Math.random() * pool.length)];
    }, (target, info) => {
      if (info && !info.missed) applyLevelDown(target, log);
      if (info && !info.missed && alive(target)) stealBuff(boss, target, log);
    }, "heaven", 0.4);
    if (!ok) return "導きの天翔";
    return "導きの天翔";
  }
  return "通常攻撃";
}

function repRoundEnd(boss, party, log) {
  if (!boss.rep || boss.rep.phase < 2) return "";
  party.forEach((fighter) => {
    if (fighter.ascend && alive(fighter)) {
      const damage = Math.max(1, Math.round(fighter.hp * 0.5));
      const saved = hurt(fighter, damage, log);
      if (!saved && fighter.hp <= 0) fighter.fallen = true;
      if (!saved) log.push(`${fighter.side}は昇天で ${damage} ダメージ`);
    }
    if (fighter.seals) {
      fighter.seals.forEach((seal) => { seal.rounds -= 1; });
      fighter.seals = fighter.seals.filter((seal) => seal.rounds > 0);
    }
  });
  if (boss.rep.mend && boss.rep.hurt > 0 && alive(boss)) {
    const heal = Math.max(1, Math.round(boss.rep.hurt * 0.3));
    gainHp(boss, heal);
    log.push(`${boss.side}は ${heal} 回復した`);
  }
  boss.rep.hurt = 0;
  if (boss.rep.doomHold) {
    boss.rep.doomHold = false;
    log.push(`運命の刻 残り${boss.rep.doom}`);
    return `運命の刻 残り${boss.rep.doom}`;
  }
  if (boss.rep.doom > 0) {
    boss.rep.doom -= 1;
    log.push(`運命の刻 残り${boss.rep.doom}`);
    if (boss.rep.doom === 0) {
      boss.rep.doom = 6;
      boss.rep.fireUlt = true;
      boss.rep.howled = false;
      return "運命の刻 残り0";
    }
    return `運命の刻 残り${boss.rep.doom}`;
  }
  return "";
}

function pickUnusedUlt(boss) {
  const all = ["nova", "rainbow", "heaven"];
  if (!boss.rep.usedUlts) boss.rep.usedUlts = [];
  let pool = all.filter((name) => boss.rep.usedUlts.indexOf(name) < 0);
  if (!pool.length) {
    boss.rep.usedUlts = [];
    pool = all.slice();
  }
  const move = pool[Math.floor(Math.random() * pool.length)];
  boss.rep.usedUlts.push(move);
  return move;
}

const POSITIVE_AURAS = ["atkUp", "defUp", "power", "critUp", "cut", "evasion", "regen", "qteSlow"];

function clearPositiveBuffs(fighter) {
  let cleared = false;
  POSITIVE_AURAS.forEach((kind) => {
    const list = fighter.auras[kind];
    if (list && list.length) {
      fighter.auras[kind] = [];
      cleared = true;
    }
  });
  const charges = fighter.charges;
  if (!charges) return cleared;
  if (charges.guard.length) {
    charges.guard = [];
    cleared = true;
  }
  if (charges.counter.length) {
    charges.counter = [];
    cleared = true;
  }
  if (charges.sureHit) {
    charges.sureHit = 0;
    cleared = true;
  }
  if (charges.sureCrit) {
    charges.sureCrit = 0;
    cleared = true;
  }
  if (charges.nextPower) {
    charges.nextPower = 0;
    cleared = true;
  }
  if (charges.nextAbsorb) {
    charges.nextAbsorb = 0;
    cleared = true;
  }
  return cleared;
}

const NEGATIVE_AURAS = ["atkDown", "defDown", "healDown", "poison"];

function clearDebuffs(fighter) {
  let cleared = false;
  NEGATIVE_AURAS.forEach((kind) => {
    const list = fighter.auras[kind];
    if (list && list.length) {
      fighter.auras[kind] = [];
      cleared = true;
    }
  });
  if (fighter.seal) {
    fighter.seal = null;
    cleared = true;
  }
  if (fighter.seals && fighter.seals.length) {
    fighter.seals = [];
    cleared = true;
  }
  if (fighter.freeze) {
    fighter.freeze = false;
    cleared = true;
  }
  if (fighter.ascend) {
    fighter.ascend = false;
    cleared = true;
  }
  if (fighter.noHeal) {
    fighter.noHeal = 0;
    cleared = true;
  }
  if (clearLevelDown(fighter)) cleared = true;
  return cleared;
}

function restoreOneUse(fighter) {
  let restored = false;
  fighter.skills.forEach((skill) => {
    if (skill.uses == null || skill.usesLeft == null) return;
    if (skill.usesLeft < skill.uses) {
      skill.usesLeft += 1;
      restored = true;
    }
  });
  return restored;
}

function bellCall(kind, party, enemy, log) {
  const living = party.filter(alive);
  if (kind === "guide") {
    log.push("導き手が駆けつけた");
    const lines = [];
    let restored = false;
    living.forEach((fighter) => {
      const amount = receiveHeal(fighter, 30);
      const gained = gainHp(fighter, amount);
      if (amount <= 0) {
        log.push(`${fighter.side}は回復できなかった`);
        lines.push(`${fighter.side}は回復できなかった`);
      } else if (gained > 0) {
        log.push(`${fighter.side}は ${gained} 回復した`);
        lines.push(`${fighter.side}は ${gained} 回復した`);
      } else {
        lines.push(`${fighter.side}のHPは満タンだった`);
      }
      if (restoreOneUse(fighter)) {
        log.push(`${fighter.side}の技が1回戻った`);
        restored = true;
        lines.push(`${fighter.side}の技が1回戻った`);
      }
      putAura(fighter, "導き手", { kind: "atkUp", value: 1, rounds: 2 }, fighter);
      putAura(fighter, "導き手", { kind: "defUp", value: 1, rounds: 2 }, fighter);
      putCharge(fighter, "導き手", { kind: "nextAbsorb", value: 1 });
      log.push(`${fighter.side}は攻撃と守備が100%上がり、次の攻撃のダメージを回復する`);
    });
    lines.push("攻撃と守備が100%上がった");
    lines.push("次の攻撃のダメージを回復する");
    if (!restored) lines.push("技はもう全開だった");
    return { name: "導き手が駆けつけた", lines };
  }
  if (kind === "star") {
    log.push("星の使いが駆けつけた");
    let allies = false;
    living.forEach((fighter) => {
      if (clearDebuffs(fighter)) allies = true;
    });
    const allyLine = allies ? "味方のデバフが解けた" : "味方に解けるデバフはなかった";
    log.push(allyLine);
    let foe = clearPositiveBuffs(enemy);
    if (enemy.rep) {
      if (enemy.rep.wall) {
        enemy.rep.wall = false;
        foe = true;
      }
      if (enemy.rep.mend) {
        enemy.rep.mend = false;
        foe = true;
      }
      if (enemy.rep.tension > 0) {
        enemy.rep.tension = 0;
        foe = true;
      }
      if (enemy.rep.power > 1) {
        enemy.rep.power = 1;
        foe = true;
      }
    }
    const foeLine = foe ? "相手のバフが解けた" : "相手に解けるバフはなかった";
    log.push(foeLine);
    const lines = [allyLine, foeLine];
    if (enemy.rep && enemy.rep.cloak) {
      log.push("闇の衣はそのまま");
      lines.push("闇の衣はそのまま");
    }
    return { name: "星の使いが駆けつけた", lines };
  }
  if (kind === "plumber") {
    log.push("帽子の人が駆けつけた");
    living.forEach((fighter) => {
      putCharge(fighter, "帽子の人", { kind: "sureCrit", value: 1 });
      putCharge(fighter, "帽子の人", { kind: "nextPower", value: 0.4 });
      log.push(`${fighter.side}は超会心必中、次の攻撃の威力が40%上がった`);
    });
    return { name: "帽子の人が駆けつけた", lines: ["超会心が必中になった", "次の攻撃の威力が40%上がった"] };
  }
  if (kind === "student") {
    log.push("見知らぬ生徒が駆けつけた");
    living.forEach((fighter) => {
      refillUses(fighter);
      log.push(`${fighter.side}の技回数が全開になった`);
    });
    return { name: "見知らぬ生徒が駆けつけた", lines: ["技回数が全開になった"] };
  }
  log.push("古い英雄が駆けつけた");
  return { name: "古い英雄が駆けつけた", lines: [], flash: "極大斬撃！！！", slash: true };
}

function landGigaslash(enemy, living, log) {
  const damage = 100;
  log.push("極大斬撃！！！");
  const mark = log.length;
  const saved = hurt(enemy, damage, log);
  const lines = [];
  if (!saved && enemy.hp <= 0) enemy.fallen = true;
  if (!saved) {
    if (enemy.rep && enemy.rep.mend) enemy.rep.hurt += damage;
    log.push(`${enemy.side}に ${damage} ダメージ`);
    lines.push(`${enemy.side}に ${damage} ダメージ`);
  } else {
    log.slice(mark).forEach((line) => lines.push(line));
  }
  living.forEach((fighter) => {
    fighter.tension = 100;
    log.push(`${fighter.side}のテンションが100になった。次の攻撃だけダメージ2倍`);
  });
  if (living.length) lines.push(living.length > 1 ? "味方のテンションが100になった" : `${living[0].side}のテンションが100になった`);
  if (living.length) lines.push("次の攻撃だけダメージ2倍");
  return lines;
}

async function playBattle(playerResult, playerMonth, enemyResult, enemyMonth, setup) {
  const gen = ++battleGen;
  Sfx.stopBoss();
  const player = makeFighter("あなた", playerResult, playerMonth);
  applyStoryRun(player, setup && setup.run);
  player.slot = "player";
  player.team = "you";
  let ally = null;
  if (setup && setup.ally) {
    ally = makeFighter("2人目", setup.ally.result, setup.ally.month);
    applyStoryRun(ally, setup.ally.run);
    ally.slot = "ally";
    ally.team = "you";
    player.side = "1人目";
    player.partner = ally;
    ally.partner = player;
  } else if (setup && setup.onAllyHeal) {
    player.onShareHeal = setup.onAllyHeal;
  }
  const enemy = makeFighter("相手", enemyResult, enemyMonth, setup && setup.title);
  if (setup && setup.rep) applyRep(enemy);
  enemy.slot = "enemy";
  enemy.team = "foe";
  shownHp = null;
  Sfx.ensure();
  const who = enemy.rep ? enemy.title : enemy.title ? `${enemy.title}（${enemy.type}・${enemy.month}月）` : `${enemy.type}（${enemy.month}月）`;
  const log = [];
  if (ally) {
    log.push(`${player.side}は${player.type}（${player.month}月）`);
    log.push(`${ally.side}は${ally.type}（${ally.month}月）`);
  }
  log.push(`相手は${who}`);
  let round = 1;
  let finished = false;
  const party = [player, ally].filter(Boolean);
  if (enemy.rep) party.forEach((fighter) => {
    if (fighter.orb) fighter.skills.unshift(orbSkill());
  });
  if (setup && setup.onWin) party.forEach((fighter) => fighter.skills.push(partyGuardSkill()));
  const stoneCharges = party.reduce((sum, fighter) => sum + (fighter.stone ? 1 : 0), 0);
  party.forEach((fighter) => { fighter.stoneCharges = stoneCharges; });
  const cast = party.concat([enemy]);

  function friendsUp() {
    return party.some(alive);
  }

  function focusAlly() {
    const living = party.filter(alive);
    if (!living.length) return null;
    living.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
    return living[0];
  }

  function view(extra) {
    if (enemy.rep) paintRep(enemy);
    return {
      player,
      ally,
      enemy,
      log: log.slice(),
      round,
      waiting: false,
      qte: false,
      finished,
      phaseText: "",
      ...extra,
    };
  }

  async function ringHero(owner) {
    const kinds = ["guide", "star", "plumber", "student", "legend"];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const call = bellCall(kind, party, enemy, log);
    renderBattle(view({
      banner: call.name,
      bannerSide: "you",
      phaseText: call.name,
      actor: owner.side,
    }));
    if (kind === "star") Sfx.debuff();
    else Sfx.buff();
    await wait(1000);
    if (gen !== battleGen) return;
    if (call.flash) {
      renderBattle(view({
        banner: call.flash,
        bannerSide: "you",
        phaseText: call.flash,
        actor: owner.side,
      }));
      await wait(900);
      if (gen !== battleGen) return;
    }
    if (call.slash) {
      call.lines = landGigaslash(enemy, party.filter(alive), log);
      renderBattle(view({
        banner: call.flash,
        bannerSide: "you",
        phaseText: call.flash,
        actor: owner.side,
        fxCrit: { enemy: true },
      }));
      await wait(1000);
      if (gen !== battleGen) return;
    }
    renderBattle(view({
      phaseText: call.name,
      actor: owner.side,
      bellNote: call,
    }));
    await wait(2200);
  }

  async function say(text) {
    log.push(text);
    renderBattle(view({ banner: text, bannerSide: "foe", speech: true, phaseText: text }));
    Sfx.turn(false);
    await wait(1600);
  }

  async function awaken() {
    if (!enemy.rep || enemy.rep.phase !== 1 || !alive(enemy)) return;
    enemy.rep.phase = 2;
    enemy.rep.cloak = false;
    enemy.maxHp = 2000;
    enemy.hp = 2000;
    enemy.title = "新入生代表";
    enemy.spd = 110;
    enemy.rep.doom = 6;
    enemy.rep.doomHold = true;
    enemy.rep.hold = true;
    party.forEach((fighter) => {
      fighter.skills = fighter.skills.filter((skill) => !skill.orb);
    });
    log.push("第二形態・新入生代表");
    if (Sfx.cloakTheme) Sfx.boss(gen);
    await playRepMove(enemy, party, "howl", log, view, () => gen === battleGen);
    if (gen !== battleGen) return;
    const lines = [
      "ほう、、、我が闇の衣を剥がす術を知っていたとはな、、、",
      "しかし同じこと",
      "我が腕の中で、もがき、苦しむがよい",
    ];
    for (let i = 0; i < lines.length; i += 1) await say(lines[i]);
    if (gen !== battleGen) return;
    if (!Sfx.cloakTheme) Sfx.boss(gen);
  }

  renderBattle(view({ banner: "バトル開始！", bannerSide: "start", phaseText: "バトル開始！" }));
  Sfx.battle();
  await wait(1400);

  function askSkill(fighter, phaseText) {
    return new Promise((resolve) => {
      renderBattle(view({ command: true, waiting: true, picker: fighter, phaseText }));
      document.querySelectorAll("[data-skill]").forEach((button) => {
        button.onclick = () => {
          Sfx.select();
          const picked = fighter.skills[Number(button.dataset.skill)];
          const usable = canUse(fighter, picked);
          const close = showSheet(`
            <h2>${escapeHtml(picked.name)}</h2>
            <p>${withMissColor(skillBlurb(picked.name))}</p>
            ${usable ? `<button class="primary" id="use-skill" type="button">これに決める</button>` : `<p class="detail">今は使えない</p>`}
            <button class="ghost" data-close type="button">戻る</button>
          `);
          const use = document.getElementById("use-skill");
          if (use) {
            use.onclick = () => {
              close();
              resolve(picked);
            };
          }
        };
      });
    });
  }

  while (friendsUp() && alive(enemy)) {
    if (gen !== battleGen) return;
    cast.forEach((fighter) => { fighter.crawling = false; });
    if (enemy.rep && enemy.rep.chanceNext) {
      enemy.rep.chanceNext = false;
      enemy.rep.frenzy = true;
      enemy.rep.skip = 1;
    }
    if (enemy.rep && enemy.rep.phase === 2 && enemy.rep.skip === 0 && enemy.rep.frenzy) {
      enemy.rep.frenzy = false;
    }
    const you = party.filter(alive);
    const picks = new Map();
    for (let i = 0; i < you.length; i += 1) {
      const fighter = you[i];
      if (ally && i > 0) {
        await new Promise((resolve) => {
          renderBattle(view({ phaseText: `${fighter.side}に渡して`, handoff: `${fighter.side}の番` }));
          document.getElementById("handoff").onclick = () => {
            Sfx.select();
            resolve();
          };
        });
      }
      picks.set(fighter, await askSkill(fighter, ally ? `${fighter.side}の番` : "行動を選ぶ"));
    }
    const enemySkill = aiPick(enemy, focusAlly() || player);
    async function callout(text, ms, side) {
      renderBattle(view({ banner: text, bannerSide: side || "", phaseText: text }));
      if (text.endsWith("ラウンド")) Sfx.round();
      else if (side === "you") Sfx.turn(true);
      else if (side === "foe") Sfx.turn(false);
      await wait(ms);
    }
    function cueSupport(skill) {
      if (skill.foeAuras.length || skill.seal) Sfx.debuff();
      else if (!skill.power && !skill.heal && !skill.flatHeal) Sfx.cast();
    }
    await callout(`${round}ラウンド`, 1300);
    let order = ally ? turnOrderMany(cast.filter(alive), Math.random) : turnOrder(player, enemy, Math.random);
    if (enemy.rep && enemy.rep.phase === 2 && alive(enemy)) {
      if (enemy.rep.skip > 0) {
        enemy.rep.skip -= 1;
        enemy.rep.frenzy = true;
        order = order.filter((fighter) => fighter !== enemy);
        log.push("代表は動けない");
      } else {
        if (enemy.rep.frenzy) enemy.rep.frenzy = false;
        const at = Math.max(0, order.indexOf(enemy));
        const rest = order.filter((fighter) => fighter !== enemy);
        rest.splice(at, 0, enemy);
        rest.splice(at, 0, enemy);
        order = rest;
      }
    }
    for (let i = 0; i < order.length; i += 1) {
      const actor = order[i];
      if (!alive(actor) || !alive(enemy) || !friendsUp()) break;
      if (actor.rep) {
        if (actor.rep.hold || actor.rep.frenzy) continue;
        let move;
        if (actor.rep.phase === 2 && actor.rep.doom === 1 && !actor.rep.howled) {
          actor.rep.howled = true;
          move = "howl";
        } else {
          move = pickRepMove(actor);
        }
        await playRepMove(actor, party, move, log, view, () => gen === battleGen);
        if (gen !== battleGen) return;
        party.forEach((fighter) => {
          if (fighter.hp <= 0) fighter.fallen = true;
        });
        const again = order[i + 1];
        if (again === actor && alive(actor) && friendsUp() && !actor.rep.hold && !actor.rep.frenzy) {
          await wait(1100);
          if (gen !== battleGen) return;
        }
        continue;
      }
      const target = actor.team === "you" ? enemy : focusAlly();
      if (!target || !alive(target)) break;
      const planned = actor.team === "foe" ? enemySkill : picks.get(actor);
      const skill = skillToAct(actor, planned, log);
      const side = sideOf(actor);
      await callout(actor.team === "you" ? `${actor.side}の番` : "相手の番", 1100, side);
      if (actor.team === "you" && actor.bell && alive(enemy)) {
        await ringHero(actor);
        if (gen !== battleGen) return;
        if (!alive(enemy) || !friendsUp()) break;
      }
      if (skill && skill.orb) {
        spendUse(skill);
        if (enemy.rep && enemy.rep.phase === 1 && alive(enemy)) await awaken();
        if (gen !== battleGen) return;
        continue;
      }
      if (!skill) {
        renderBattle(view({ banner: "動けない", bannerSide: side, phaseText: `${actor.side}は動けなかった` }));
        Sfx.stuck();
        await wait(1100);
        continue;
      }
      let qte = 1;
      if (actor.team === "you" && skill.qte) {
        const qteLayout = qteWindow(actor.type === "鳥類");
        renderBattle(view({ banner: skill.name, bannerSide: side, qte: true, qteLayout, qteType: actor.type, phaseText: `${skill.name}：赤い線で止める` }));
        Sfx.qteStart();
        const result = await askQte(auraSum(actor, "qteSlow") > 0, qteLayout);
        qte = result.mult;
        Sfx.qte(result.label);
        log.push(`QTE ${result.label}`);
        const bar = document.getElementById("qte");
        if (bar) {
          bar.className = "qte result";
          bar.innerHTML = `<p class="qte-result" data-qte="${escapeHtml(result.label)}">${escapeHtml(result.label)}</p>`;
        }
        await wait(800);
      }
      if (skill.power && skill.hits > 1) {
        await playCombo(actor, target, skill, qte, log, view);
        finishAct(actor, target, skill, log);
      } else {
        const mark = log.length;
        act(actor, target, skill, qte, Math.random, log);
        const slice = log.slice(mark);
        cueSupport(skill);
        renderBattle(view({
          banner: skill.name,
          bannerSide: side,
          phaseText: skill.name,
          actor: actor.side,
          fxCrit: fxCrit(slice, cast),
          fxCut: fxCut(slice, cast),
          whiff: whiffOf(slice, actor.side, target.side),
          whiffKind: slice.some((line) => line.includes("回避")) ? "evade" : "",
        }));
        await wait(1500);
      }
      party.forEach((fighter) => {
        if (fighter.hp <= 0) fighter.fallen = true;
      });
      const buffs = buffGrants(skill);
      if (buffs.length) {
        const key = actor.slot || (actor.side === "あなた" ? "player" : "enemy");
        renderBattle(view({
          banner: buffs.map((item) => item.name).join("・"),
          bannerSide: side,
          phaseText: "バフ",
          fxGrant: { [key]: buffs },
        }));
        Sfx.buff();
        await wait(1700);
      }
      if (enemy.rep && enemy.rep.phase === 1 && enemy.rep.taken >= 100 && alive(enemy)) await awaken();
    }
    if (friendsUp() && alive(enemy)) {
      if (enemy.rep) enemy.rep.hold = false;
      const before = log.length;
      endRound(player, enemy, log, Math.random, ally ? [ally] : null);
      const finale = enemy.rep ? repRoundEnd(enemy, party, log) : "";
      if (finale) {
        renderBattle(view({ banner: finale, bannerSide: "foe", phaseText: finale }));
        if (finale.indexOf("運命の刻") === 0) Sfx.turn(false);
        else Sfx.buff();
        await wait(1500);
      }
      if (enemy.rep && enemy.rep.fireUlt && alive(enemy) && friendsUp()) {
        enemy.rep.fireUlt = false;
        await say("これで終わりだ！");
        if (gen !== battleGen) return;
        const ult = pickUnusedUlt(enemy);
        await playRepMove(enemy, party, ult, log, view, () => gen === battleGen);
        if (gen !== battleGen) return;
        party.forEach((fighter) => {
          if (fighter.hp <= 0) fighter.fallen = true;
        });
        if (alive(enemy) && friendsUp()) {
          enemy.rep.chanceNext = true;
          log.push("代表は次のラウンド、動けない");
          await say("反撃チャンス！");
          if (gen !== battleGen) return;
          log.push("運命の刻 残り6");
          renderBattle(view({ banner: "運命の刻 残り6", bannerSide: "foe", phaseText: "運命の刻 残り6" }));
          Sfx.turn(false);
          await wait(1500);
        }
      }
      party.forEach((fighter) => {
        if (fighter.hp <= 0) fighter.fallen = true;
      });
      const tail = log.slice(before);
      if (tail.some((line) => line.includes("毒で"))) Sfx.poison();
      if (tail.some((line) => line.includes("回復した"))) Sfx.heal();
      if (tail.some((line) => line.includes("もう1回使える"))) Sfx.recharge();
      round += 1;
    } else break;
  }

  finished = true;
  Sfx.stopBoss();
  const won = friendsUp() && enemy.hp <= 0;
  const lost = enemy.hp > 0 && !friendsUp();
  let phaseText = "引き分け";
  if (won) phaseText = "勝ち";
  else if (lost) phaseText = "負け";
  player.hp = Math.max(0, player.hp);
  if (ally) ally.hp = Math.max(0, ally.hp);
  enemy.hp = Math.max(0, enemy.hp);
  shownHp = { player: player.hp, enemy: enemy.hp, ally: ally ? ally.hp : 0 };
  const story = setup && setup.onWin;
  renderBattle(view({
    phaseText,
    finished: true,
    finale: phaseText,
    endPrimary: story ? (won ? "つぎへ" : (setup.noContinue ? "おわる" : "もう一回")) : "",
    endGhost: story ? (setup.noContinue ? null : "話にもどる") : "",
  }));
  const rematch = document.getElementById("rematch");
  if (rematch) {
    rematch.onclick = () => {
      if (story && won) {
        clearLevelDown(player);
        if (ally) clearLevelDown(ally);
        setup.onWin(round, player, ally);
      } else if (story && setup.noContinue) setup.onLose();
      else playBattle(playerResult, playerMonth, enemyResult, enemyMonth, setup || null);
    };
  }
  const restart = document.getElementById("restart");
  if (restart) {
    restart.onclick = () => {
      if (story) setup.onLeave();
      else window.location.reload();
    };
  }
}

function start(result, month, setup) {
  const quiz = quizApi();
  const enemyAnswers = setup && setup.answers
    ? setup.answers
    : Array.from({ length: 6 }, () => Math.floor(Math.random() * 4));
  const enemyMonth = setup && setup.month ? setup.month : 1 + Math.floor(Math.random() * 12);
  playBattle(result, month, quiz.judge(enemyAnswers), enemyMonth, setup || null);
}

const AnimalBattle = { BASE_STATS, makeFighter, simulateBattle, start };
if (typeof window !== "undefined") {
  window.AnimalBattle = AnimalBattle;
  window.Sfx = Sfx;
  const unlock = () => {
    const ctx = Sfx.ensure();
    if (ctx && ctx.state === "suspended") ctx.resume();
  };
  document.addEventListener("pointerdown", unlock);
  window.addEventListener("pagehide", () => Sfx.stopBoss());
}
if (typeof module !== "undefined" && module.exports) module.exports = AnimalBattle;
