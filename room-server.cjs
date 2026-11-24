// 部屋サーバー。セーブ本体は端末の localStorage。サーバーは盤面と、戻す用の自分のセーブだけ持つ。
const http = require("http");
const fs = require("fs");
const path = require("path");
const R = require("./adventure-rules.js");
const Book = require("./data.js");

const ROOT = path.resolve(__dirname);
const PORT = Number(process.env.PORT || 8771);
const rooms = new Map();

function publicPath(pathname) {
  let clean = decodeURIComponent(pathname || "/");
  if (clean.startsWith("/animal-battle-quiz/")) clean = clean.slice("/animal-battle-quiz".length) || "/";
  if (clean === "/" || clean === "") clean = "/adventure.html";
  return clean;
}

function isRoomPath(pathname) {
  return pathname === "/room" || pathname === "/animal-battle-quiz/room";
}

function member(room, saveId) {
  return room.members.find((item) => item.saveId === saveId);
}

function touch(room) {
  const now = Date.now();
  room.members.forEach((item) => {
    item.away = now - item.lastSeen > 4000;
  });
}

function pushLog(room, lines) {
  const list = (Array.isArray(lines) ? lines : [lines]).filter(Boolean);
  room.log = room.log.concat(list).slice(-48);
}

function clearBattle(room) {
  room.battle = null;
  room.windup = null;
  room.openingUntil = 0;
  room.readyAt = 0;
  room.comboAt = 0;
  room.command = null;
  room.waitingFor = null;
}

function livingAllies(battle) {
  return ((battle && battle.allies) || []).filter((unit) => unit.hp > 0);
}

function finishAct(room, actor) {
  if (actor) actor.started = false;
  room.battle.queueIndex += 1;
  if (actor && actor.extra) {
    actor.extra = false;
    room.battle.queue.splice(room.battle.queueIndex, 0, actor);
  }
  if (room.battle.queueIndex >= room.battle.queue.length) {
    pushLog(room, R.endRound(room.battle));
    room.battle.round += 1;
    room.battle.queueIndex = null;
  }
  const over = !livingAllies(room.battle).length || !room.battle.foes.some((unit) => unit.hp > 0);
  const pop = room.battle.foes.some((unit) => unit.popstar);
  if (over) room.readyAt = Date.now() + 1100;
  else if (actor && actor.side === "foe") room.readyAt = Date.now() + (pop ? 900 : 1200);
  else if (actor) room.readyAt = Date.now() + (pop ? 650 : 450);
}

function clearBadCombo(battle) {
  if (!battle || !battle.combo) return;
  const c = battle.combo;
  if (c.left == null || c.total == null || Number.isNaN(c.left) || c.left <= 0) battle.combo = null;
}

function applyAct(room, actor, skill, target, qte) {
  let lines = [];
  try {
    lines = R.castSkill(room.battle, actor, skill, target, qte, Math.random, room.loot);
  } catch (error) {
    console.error(error);
    room.battle.combo = null;
    lines = ["戦闘処理でエラーが起きた"];
  }
  pushLog(room, lines);
  clearBadCombo(room.battle);
  if (room.battle.combo) {
    room.comboAt = Date.now() + (room.battle.combo.popstar ? 950 : 900);
    return;
  }
  finishAct(room, actor);
}

function settle(room, kind) {
  const battle = room.battle;
  const xp = battle.foes.reduce((sum, foe) => sum + (foe.xp || 0), 0);
  const gold = battle.foes.reduce((sum, foe) => sum + (foe.gold || 0), 0);
  room.members.forEach((item) => {
    const unit = battle.allies[item.seat];
    if (kind === "win") {
      R.writeBack(item.save, unit);
      const bonus = R.dropBonus(battle.allies);
      battle.foes.forEach((foe) => {
        if (foe.material) item.save.materials[foe.material] = (item.save.materials[foe.material] || 0) + bonus;
      });
      room.loot.forEach((drop) => {
        if (drop.who === item.seat) item.save.materials[drop.material] = (item.save.materials[drop.material] || 0) + 1;
      });
      item.save.gold += gold;
      const personal = item.save.tripXp ? xp * 2 : xp;
      item.xpGain = personal;
      item.notes = R.gainXp(item.save, personal);
      if (item.save.tripXp) item.notes.unshift("経験の株で経験値が2倍");
      if (room.raid) item.notes = R.grantRaidPrize(item.save, room.raidId, Math.random).concat(item.notes);
      if (bonus > 1) item.notes.push("ドロップが2倍");
      item.drops = [];
      battle.foes.forEach((foe) => {
        if (!foe.material) return;
        for (let i = 0; i < bonus; i += 1) item.drops.push(foe.material);
      });
      room.loot.forEach((drop) => { if (drop.who === item.seat) item.drops.push(drop.material); });
      return;
    }
    if (room.raid) {
      const region = item.save.region;
      const step = item.save.step;
      R.restAtTown(item.save);
      item.save.region = region;
      item.save.step = step;
    } else {
      R.restAtTown(item.save);
    }
    item.notes = [];
  });
  if (kind === "win" && R.dropBonus(battle.allies) > 1) pushLog(room, "盗む");
  if (kind === "win" && !room.raid) {
    const region = Book.REGIONS.find((item) => item.id === room.regionId);
    room.step += 1;
    if (region && room.step >= Book.battleCount(region, room.extra || 0)) {
      room.members.forEach((item) => {
        if (!item.save.cleared.includes(region.id)) item.save.cleared.push(region.id);
        R.markDifficulty(item.save, room.difficulty || 1);
        R.restAtTown(item.save);
      });
      room.phase = "lobby";
      room.result = { kind: "clear", xp, gold };
      clearBattle(room);
      return;
    }
    room.phase = "between";
    room.result = { kind: "win", xp, gold };
    clearBattle(room);
    return;
  }
  if (kind === "win" && room.raid) {
    room.members.forEach((item) => {
      const cleared = room.raidId || "ryuou";
      if (!item.save.raids.includes(cleared)) item.save.raids.push(cleared);
      R.restAtTown(item.save);
    });
    room.phase = "lobby";
    room.raid = false;
    room.raidId = "";
    room.result = { kind: "clear", xp, gold };
    clearBattle(room);
    return;
  }
  room.phase = "lobby";
  room.raid = false;
  room.raidId = "";
  room.regionId = null;
  room.result = { kind: "wipe", xp: 0, gold: 0 };
  clearBattle(room);
}

function step(room) {
  if (room.phase !== "battle" || !room.battle) return;
  clearBadCombo(room.battle);
  if (room.readyAt && Date.now() < room.readyAt) return;
  if (room.battle.combo) {
    if (room.comboAt && Date.now() < room.comboAt) return;
    const actor = [...room.battle.allies, ...room.battle.foes].find((unit) => unit.id === room.battle.combo.actorId);
    const result = R.stepCombo(room.battle, Math.random);
    pushLog(room, result.log);
    if (!result.done) {
      const wait = room.battle.combo && room.battle.combo.popstar ? 700 : 520;
      room.comboAt = Date.now() + wait;
      return;
    }
    room.comboAt = 0;
    finishAct(room, actor);
    return;
  }
  for (let guard = 0; guard < 24; guard += 1) {
    const battle = room.battle;
    if (!livingAllies(battle).length) return settle(room, "wipe");
    if (!battle.foes.some((unit) => unit.hp > 0)) return settle(room, "win");
    if (!battle.queue || battle.queueIndex == null || battle.queueIndex >= battle.queue.length) {
      battle.queue = R.orderOf(battle);
      battle.queueIndex = 0;
      battle.ambush = battle.skipFoes;
      battle.skipFoes = false;
    }
    const actor = battle.queue[battle.queueIndex];
    if (actor && actor.side === "foe" && battle.ambush) {
      battle.ambush = false;
      battle.queueIndex += 1;
      pushLog(room, `${actor.name}は様子を見ている`);
      room.readyAt = Date.now() + 1000;
      return;
    }
    if (!actor || actor.hp <= 0) {
      battle.queueIndex += 1;
      continue;
    }
    if (actor.side === "foe" && room.windup !== actor.id) {
      room.windup = actor.id;
      const pop = battle.foes.some((unit) => unit.popstar);
      room.readyAt = Date.now() + (pop ? 1300 : 1000);
      return;
    }
    if (actor.side === "foe") room.windup = null;
    if (!actor.started) {
      actor.started = true;
      const log = [];
      if (!R.tickTurnStart(actor, Math.random, log)) {
        if (log.length) pushLog(room, log);
        actor.started = false;
        battle.queueIndex += 1;
        room.readyAt = Date.now() + 1000;
        return;
      }
      if (log.length) pushLog(room, log);
    }
    const sway = R.swayAction(battle, actor, Math.random);
    if (sway) {
      if (sway.idle) {
        if (sway.line) pushLog(room, sway.line);
        actor.started = false;
        battle.queueIndex += 1;
        room.readyAt = Date.now() + 1000;
        return;
      }
      if (sway.line) pushLog(room, sway.line);
      if (actor.side === "foe") room.windup = null;
      room.command = null;
      room.waitingFor = null;
      applyAct(room, actor, sway.skill, sway.target, 1);
      return;
    }
    if (actor.side === "foe") {
      const pick = R.enemyPick(actor, battle);
      applyAct(room, actor, pick.skill, pick.target, 1);
      return;
    }
    const who = room.members.find((item) => item.seat === actor.seat);
    if (!who || who.away || !room.command || room.command.saveId !== who.saveId) {
      room.waitingFor = who ? who.saveId : null;
      return;
    }
    const skill = actor.skills.find((item) => item.id === room.command.skillId) || actor.skills[0];
    const command = room.command;
    room.command = null;
    room.waitingFor = null;
    applyAct(room, actor, skill, command.target, command.qte || 1);
    return;
  }
}

function begin(room, foeIds) {
  room.members.forEach((item) => { item.drops = []; item.notes = []; });
  const party = room.members.map((item) => item.save);
  room.battle = R.startEncounter(party, foeIds, room.difficulty || 1);
  const names = room.battle.foes.map((unit) => unit.name).join("、");
  room.log = [`${names}が現れた`].concat(room.battle.popstarLog || []);
  if (room.battle.skipFoes) room.log.push("キングタイム");
  room.loot = [];
  room.command = null;
  room.waitingFor = null;
  room.result = null;
  room.openingUntil = Date.now() + 700;
  room.readyAt = room.openingUntil;
  room.windup = null;
  room.phase = "battle";
}

function labelOf(room, saveId, waiting) {
  const rank = Book.difficultyOf(room.difficulty || 1).name;
  const battle = room.battle;
  if (!battle) return "待合";
  if (battle.combo) return battle.combo.label;
  if (room.openingUntil && Date.now() < room.openingUntil) return `${rank}　遭遇`;
  if (room.windup) {
    const unit = [...(battle.allies || []), ...(battle.foes || [])].find((item) => item.id === room.windup);
    return `${rank}　${unit ? unit.name : "…"}`;
  }
  if (room.waitingFor) {
    const actor = (battle.allies || []).find((unit) => {
      const who = room.members.find((item) => item.saveId === room.waitingFor);
      return who && unit.seat === who.seat;
    });
    const name = actor ? actor.name : (waiting ? waiting.save.name : "だれか");
    return `${rank}　${name}`;
  }
  const next = battle.queue && battle.queueIndex != null ? battle.queue[battle.queueIndex] : null;
  if (next && next.hp > 0) return `${rank}　${next.name}`;
  return `${rank}　${battle.round || 1}ラウンド`;
}

function publicView(room, saveId) {
  touch(room);
  step(room);
  const me = member(room, saveId);
  const waiting = room.members.find((item) => item.saveId === room.waitingFor);
  return {
    code: room.code,
    leaderId: room.leaderId,
    youAreLeader: room.leaderId === saveId,
    phase: room.phase,
    raid: room.raid,
    raidId: room.raidId || "",
    raids: Book.RAIDS,
    regionId: room.regionId,
    step: room.step,
    result: room.result,
    log: room.log,
    waitingFor: room.waitingFor,
    waitingName: waiting ? waiting.save.name : "",
    members: room.members.map((item) => ({
      saveId: item.saveId,
      name: item.save.name,
      level: item.save.level,
      job: item.save.job,
      hp: item.save.hp,
      away: item.away,
      seat: item.seat,
    })),
    battle: room.battle,
    yourSave: me ? me.save : null,
    yourNotes: me ? me.notes || [] : [],
    yourXp: me && me.xpGain != null ? me.xpGain : null,
    yourDrops: me ? me.drops || [] : [],
    turnLabel: labelOf(room, saveId, waiting),
    openRegions: Book.REGIONS.filter((region) => room.members.every((item) => Book.regionOpen(item.save.cleared, region))).map((region) => ({ id: region.id, name: region.name })),
    difficulty: room.difficulty || 1,
    openDifficulties: Book.DIFFICULTIES.map((rank) => ({
      id: rank.id,
      name: rank.name,
      open: room.members.every((item) => Book.difficultyOpen(item.save.diffCleared, rank.id)),
    })),
  };
}

function join(code, save) {
  let room = rooms.get(code);
  if (!room) {
    room = {
      code,
      leaderId: save.id,
      members: [],
      phase: "lobby",
      regionId: null,
      step: 0,
      extra: 0,
      raid: false,
      raidId: "",
      difficulty: 1,
      battle: null,
      log: [],
      loot: [],
      command: null,
      waitingFor: null,
      result: null,
    };
    rooms.set(code, room);
  }
  let mine = member(room, save.id);
  if (!Array.isArray(save.diffCleared)) save.diffCleared = [];
  if (!save.diffCleared.length && (save.cleared || []).length) save.diffCleared = [1];
  if (!mine && room.phase !== "lobby") {
    const error = new Error("戦闘中は新しい人は入れない");
    error.status = 409;
    throw error;
  }
  if (!mine && room.members.length >= 4) {
    const error = new Error("部屋は4人まで");
    error.status = 409;
    throw error;
  }
  if (!mine) {
    mine = { saveId: save.id, save, seat: room.members.length, lastSeen: Date.now(), away: false, notes: [] };
    room.members.push(mine);
  } else if (room.phase === "lobby") {
    const seat = mine.seat;
    mine.save = save;
    mine.seat = seat;
  }
  mine.lastSeen = Date.now();
  mine.away = false;
  return publicView(room, save.id);
}

function act(code, body) {
  const room = rooms.get(code);
  if (!room) {
    const error = new Error("部屋がない");
    error.status = 404;
    throw error;
  }
  const mine = member(room, body.saveId);
  if (!mine) {
    const error = new Error("席がない");
    error.status = 404;
    throw error;
  }
  mine.lastSeen = Date.now();
  mine.away = false;
  if (room.phase === "lobby" && body.save) mine.save = body.save;
  if (body.intent === "difficulty") {
    if (room.leaderId !== body.saveId) {
      const error = new Error("難易度はリーダーだけ");
      error.status = 403;
      throw error;
    }
    if (room.phase !== "lobby") {
      const error = new Error("旅の途中では変えられない");
      error.status = 409;
      throw error;
    }
    const rank = Number(body.difficulty) || 1;
    const open = room.members.every((item) => Book.difficultyOpen(item.save.diffCleared, rank));
    if (!open) {
      const error = new Error("まだ開けない難易度");
      error.status = 403;
      throw error;
    }
    room.difficulty = rank;
    return publicView(room, body.saveId);
  }
  if (body.intent === "depart" || body.intent === "raid") {
    if (room.leaderId !== body.saveId) {
      const error = new Error("出発はリーダーだけ");
      error.status = 403;
      throw error;
    }
    if (room.phase !== "lobby" && room.phase !== "between") {
      const error = new Error("今は出せない");
      error.status = 409;
      throw error;
    }
    if (body.intent === "raid") {
      const raid = Book.raidOf(body.raidId);
      if (!raid) {
        const error = new Error("その大ボスはいない");
        error.status = 404;
        throw error;
      }
      if (room.members.length < (raid.minParty || 2)) {
        const error = new Error("大ボスは2人以上");
        error.status = 409;
        throw error;
      }
      room.raid = true;
      room.raidId = raid.id;
    } else {
      room.raid = false;
      room.raidId = "";
    }
    if (!room.raid && room.phase !== "between") {
      const picked = Book.REGIONS.find((region) => region.id === body.regionId) || Book.REGIONS[0];
      const open = room.members.every((item) => Book.regionOpen(item.save.cleared, picked));
      if (!open) {
        const error = new Error("まだ開いていない地域");
        error.status = 403;
        throw error;
      }
      room.regionId = picked.id;
      room.step = 0;
      room.extra = 0;
    }
    if (room.phase === "lobby") {
      const rank = room.difficulty || 1;
      const allowed = room.members.every((item) => Book.difficultyOpen(item.save.diffCleared, rank));
      if (!allowed) {
        const error = new Error("まだ開けない難易度");
        error.status = 403;
        throw error;
      }
      if (body.intent === "depart") {
        room.extra = room.members.reduce((max, item) => Math.max(max, item.save.scent || 0), 0);
        room.members.forEach((item) => {
          item.save.scent = 0;
          item.save.tripXp = item.save.xpPlant ? 1 : 0;
          item.save.xpPlant = 0;
        });
      } else {
        room.extra = 0;
        room.members.forEach((item) => {
          item.save.tripXp = item.save.xpPlant ? 1 : 0;
          item.save.xpPlant = 0;
        });
      }
    }
    const region = Book.REGIONS.find((item) => item.id === room.regionId) || Book.REGIONS[0];
    const raid = room.raid ? Book.raidOf(room.raidId) : null;
    const foes = raid ? raid.foes : Book.rollBattle(region, room.step, room.extra || 0);
    begin(room, foes);
    return publicView(room, body.saveId);
  }
  if (body.intent === "retire") {
    if (room.leaderId !== body.saveId) {
      const error = new Error("リタイアはリーダーだけ");
      error.status = 403;
      throw error;
    }
    room.members.forEach((item) => R.restAtTown(item.save));
    room.phase = "lobby";
    room.raid = false;
    room.raidId = "";
    room.regionId = null;
    room.step = 0;
    room.extra = 0;
    room.result = { kind: "retire", xp: 0, gold: 0 };
    clearBattle(room);
    return publicView(room, body.saveId);
  }
  if (body.intent === "command") {
    if (room.waitingFor !== body.saveId) {
      const error = new Error("まだ自分のターンではない");
      error.status = 409;
      throw error;
    }
    room.command = { saveId: body.saveId, skillId: body.skillId, target: body.target, qte: body.qte };
    step(room);
    return publicView(room, body.saveId);
  }
  if (body.intent === "leave") {
    if (room.phase !== "lobby") {
      const error = new Error("冒険中は抜けられない");
      error.status = 409;
      throw error;
    }
    room.members = room.members.filter((item) => item.saveId !== body.saveId);
    room.members.forEach((item, index) => { item.seat = index; });
    if (!room.members.length) rooms.delete(code);
    else if (room.leaderId === body.saveId) room.leaderId = room.members[0].saveId;
    return { left: true };
  }
  return publicView(room, body.saveId);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}); }
      catch (error) { reject(error); }
    });
  });
}

function send(res, status, body) {
  const raw = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET, POST, OPTIONS",
  });
  res.end(raw);
}

function serveFile(req, res) {
  const url = new URL(req.url, "http://127.0.0.1");
  const clean = publicPath(url.pathname);
  const file = path.resolve(ROOT, `.${clean}`);
  if (!file.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    const type = file.endsWith(".html") ? "text/html; charset=utf-8"
      : file.endsWith(".js") || file.endsWith(".cjs") ? "text/javascript; charset=utf-8"
        : file.endsWith(".css") ? "text/css; charset=utf-8"
          : file.endsWith(".png") ? "image/png"
            : file.endsWith(".jpg") || file.endsWith(".jpeg") ? "image/jpeg"
              : "application/octet-stream";
    res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (url.pathname === "/health") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end("ok");
    return;
  }
  if (isRoomPath(url.pathname)) {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "content-type",
        "access-control-allow-methods": "GET, POST, OPTIONS",
      });
      res.end();
      return;
    }
    try {
      if (req.method === "GET") {
        const room = rooms.get(url.searchParams.get("code"));
        if (!room) return send(res, 404, { error: "部屋がない" });
        const saveId = url.searchParams.get("saveId");
        const mine = member(room, saveId);
        if (!mine) return send(res, 404, { error: "席がない" });
        mine.lastSeen = Date.now();
        return send(res, 200, publicView(room, saveId));
      }
      const body = await readBody(req);
      if (body.intent === "join") return send(res, 200, join(String(body.code || ""), body.save));
      return send(res, 200, act(String(body.code || ""), body));
    } catch (error) {
      console.error(error);
      return send(res, error.status || 400, { error: error.message || "失敗" });
    }
  }
  if (req.method === "GET") return serveFile(req, res);
  res.writeHead(405);
  res.end("no");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`room ${PORT}`);
});
