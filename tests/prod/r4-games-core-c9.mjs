#!/usr/bin/env node
// Round 4 · G1 · certificate C9 for Antariksh (BUILD-PLAN §3.1): on a LOCAL PRODUCTION build, a scripted lesson on each
// Nishana topic gets the game
//   (a) ASKED: the child types "game khelna hai" → the lesson turn's Studio slot carries a play piece (forge3 live.js);
//   (b) AT A PRACTICE BEAT: plain turns until the Director's practice_set beat reveals the prefetched play piece
//       (games-core patch 03; without it this half reports "not reached");
// and in both, through the server grade into the ledger: the level (Nishana; Antariksh renders it, with a dress), its
// solution posted as raw acts with the engine on screen, the signed evidence + seam tokens on a module-only turn, the
// teacher's full turn, exactly one kt_evidence row via "game" for the level's skill. Pure API (what the device would send);
// costs the lesson's reply model calls.
//   NODE_USE_ENV_PROXY=1 TAXILA_BASE=http://127.0.0.1:8787 node tests/prod/r4-games-core-c9.mjs [--only <topic>] [--beat 0|1]
// File name is not a node --test pattern (npm test never hits a server).
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { withTestAccount, ok, warn, done, BASE, isLocal, dbq } from "./lib.mjs";
import { LOGIC } from "../../src/play/families/index.ts";
import { reactionProblems } from "../../shared/play.ts";
import { ENGINE_THEMES } from "../../src/play/engines/core3d/api.ts";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const ONLY = arg("only", null), BEAT = arg("beat", "1") !== "0", MAX_TURNS = Number(arg("turns", 14));
const OUT = arg("out", join(process.cwd(), "docs/design/round4/build/games-core/results"));
mkdirSync(OUT, { recursive: true });
const cov = JSON.parse(readFileSync(new URL("../../data/play/coverage.json", import.meta.url), "utf8"));
const TOPICS = [...new Set(cov.entries.filter((e) => e.family === "nishana").map((e) => e.topicId))].filter((t) => !ONLY || t === ONLY);
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 800, via: "touch", act }));
const PLAIN = ["haan", "theek hai", "samajh gaya", "aage chalo", "haan, aur karte hain", "ok", "haan samjha", "chalo next"];
const report = { at: new Date().toISOString(), base: BASE, local: isLocal, topics: [] };

/** the play artifact in a turn response (inline slot) or on the Studio stream for this lesson */
async function playIn(api, lessonId, turn) {
  const a = turn?.ui?.studioSlot?.artifact;
  if (a?.kind === "play") return a;
  const id = turn?.ui?.studioSlot?.intentId;
  if (id && /:play:/.test(id)) {
    for (let k = 0; k < 6; k++) {
      const s = await api("GET", `/api/studio/slot?lessonId=${lessonId}&intentId=${encodeURIComponent(id)}`, undefined, [200, 404]).catch(() => null);
      const art = s?.slot?.artifact ?? s?.artifact;
      if (art?.kind === "play") return art;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return null;
}

/** the play piece → server grade → signed tokens → module-only turn → the ledger */
async function foldThrough(api, child, lessonId, art, seq, tag) {
  const lr = await api("POST", "/api/play/level", { sessionId: art.play.sessionId });
  const lv = lr.level, logic = LOGIC[`${lv.family}/${lv.mode}`];
  ok(lv.family === "nishana", `${tag}: a Nishana level (${lv.family}/${lv.mode} ${lv.goal}, skill ${lv.skillId})`);
  ok(ENGINE_THEMES.antariksh.includes(lr.dress?.dress?.theme), `${tag}: Antariksh's dress rides the level (${lr.dress?.dress?.theme} / ${lr.dress?.dress?.wrapper}, verb ${lr.dress?.verb})`);
  const sol = env(logic.solve(lv));
  let r = null;
  const lines = [];
  for (let k = 1; k <= sol.length; k++) {
    r = await api("POST", "/api/play/act", { sessionId: r?.sessionId ?? lr.sessionId, levelId: lv.levelId, acts: sol.slice(0, k), engine: "antariksh" });
    if (r.reaction?.text) lines.push(r.reaction.text);
  }
  ok(r?.grade?.verdict === "solved" && typeof r.evidenceToken === "string" && r.seam?.kind === "level_end", `${tag}: the server's replay grades it solved; signed evidence + level_end seam`);
  ok(lines.every((t) => !reactionProblems(t).length && !/jhanda|flag/i.test(t)), `${tag}: her ${lines.length} play lines pass the guard and describe the 3D screen (${lines.join(" | ").slice(0, 120)})`);
  const before = isLocal ? (await dbq("select count(*)::int as n from kt_evidence where child_id = $1 and via = 'game'", [child.id]))[0].n : 0;
  const ev = (data, type, name) => ({ moduleId: art.play.sessionId.slice(0, 12), engine: "play", type, name, data, at: Date.now() });
  const turn = await api("POST", "/api/lesson/turn", { lessonId, childText: "", turnSeq: seq, moduleEvents: [ev({ ev: r.evidenceToken }, "interaction", "play_evidence"), ev({ seam: r.seamToken }, "goal_met", "level_end")] });
  const said = String(turn.teacherReply ?? "");
  ok(!!turn.move?.kind && said.length > 0, `${tag}: she takes a full turn at the level end ("${said.slice(0, 90)}")`);
  let rows = null;
  if (isLocal) {
    rows = await dbq("select skill_ids, outcome, via, item_key from kt_evidence where child_id = $1 and via = 'game' order by seq desc limit 3", [child.id]);
    const after = (await dbq("select count(*)::int as n from kt_evidence where child_id = $1 and via = 'game'", [child.id]))[0].n;
    ok(after === before + 1 && rows[0]?.item_key === `play:${lv.levelId}` && (rows[0]?.skill_ids ?? []).includes(lv.skillId), `${tag}: exactly one kt_evidence row via game for ${lv.skillId} (${before} → ${after})`);
  } else warn(`${tag}: ledger check runs on local targets only`);
  return { skillId: lv.skillId, goal: lv.goal, levelId: lv.levelId, dress: lr.dress?.dress ?? null, said: said.slice(0, 160), lines, ledger: rows?.[0] ?? null };
}

await withTestAccount(async ({ api }) => {
  const kids = {};
  const childFor = async (cls) => {
    if (kids[cls]) return kids[cls];
    const { child } = await api("POST", "/api/children", { firstName: `Riya${cls}`, classLevel: cls, languagePref: "hinglish", interests: ["cricket", "space"] });
    await api("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
    await api("POST", "/api/parent/controls", { childId: child.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
    return (kids[cls] = child);
  };
  for (const topicId of TOPICS) {
    const e = cov.entries.find((x) => x.topicId === topicId);
    const child = await childFor(e.classLevel);
    const row = { topicId, asked: null, beat: null };
    // (a) asked
    try {
      const les = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", topicId });
      await api("POST", "/api/lesson/turn", { lessonId: les.lessonId, childText: "haan", turnSeq: 1 });
      const t = await api("POST", "/api/lesson/turn", { lessonId: les.lessonId, childText: "game khelna hai", turnSeq: 2 });
      const art = await playIn(api, les.lessonId, t);
      if (ok(!!art, `C9a ${topicId}: "game khelna hai" → a play piece on the slot (${art ? `${art.play.family}/${art.play.mode}` : "none"})`)) row.asked = await foldThrough(api, child, les.lessonId, art, 3, `C9a ${topicId}`);
      await api("POST", "/api/lesson/end", { lessonId: les.lessonId }, [200, 201, 404, 409]).catch(() => null);
    } catch (er) { ok(false, `C9a ${topicId}: ${String(er.message ?? er).slice(0, 160)}`); }
    // (b) at the practice beat (no ask)
    if (BEAT) try {
      const les = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", topicId });
      let art = null, n = 0;
      for (n = 1; n <= MAX_TURNS && !art; n++) {
        const t = await api("POST", "/api/lesson/turn", { lessonId: les.lessonId, childText: PLAIN[(n - 1) % PLAIN.length], turnSeq: n });
        art = await playIn(api, les.lessonId, t);
        if (art) row.beatTurn = n;
      }
      if (art) row.beat = await foldThrough(api, child, les.lessonId, art, n + 1, `C9b ${topicId}`);
      else warn(`C9b ${topicId}: no play piece at a practice beat within ${MAX_TURNS} plain turns`);
      ok(!!art, `C9b ${topicId}: the practice beat offers the game (turn ${row.beatTurn ?? "-"})`);
      await api("POST", "/api/lesson/end", { lessonId: les.lessonId }, [200, 201, 404, 409]).catch(() => null);
    } catch (er) { ok(false, `C9b ${topicId}: ${String(er.message ?? er).slice(0, 160)}`); }
    report.topics.push(row);
    writeFileSync(join(OUT, `c9${ONLY ? "-" + ONLY : ""}.json`), JSON.stringify(report, null, 1));
  }
}, { tag: "g1c9", child: { classLevel: 5 } });

writeFileSync(join(OUT, `c9${ONLY ? "-" + ONLY : ""}.json`), JSON.stringify(report, null, 1));
console.log("wrote", join(OUT, `c9${ONLY ? "-" + ONLY : ""}.json`));
done();
