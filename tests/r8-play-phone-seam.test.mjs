// Round 8 (C2 Games, main's goal 2026-11-10): Studio's phone routing, END TO END, dry, in the gate. On a 360 px phone Studio
// refuses its v2 world and hands the game's place to the play family (server/studio/seam.js phonePlayFor → forge3/live.js
// buildLive { reason: "phone" } → play/start.js startSession → play/choose.js chooseEntry). For the four pilot topics
// (evals/knows-her/children.mjs PILOT_TOPICS), every scripted skill (Studio's practice need asks a game for the last one; a
// contrast or explain game, or the Stagecraft bridge, can ask for any), at vp p360:
//   1. the family/mode chosen is a coverage entry admitting the skill, certified at p360 for the art served (certs/play.json)
//   2. the because records: the picker's own (when the learner model moved the choice) plus exactly one studio_gate record;
//      the phone reason never makes a child why-line
//   3. the first screen: the level validates, inits, is solvable, has its board twin; the browser-measured certificate
//      samples for (topic, family/mode, goal, art) at p360 all mounted the game in a box >= MIN_BOX with no p360 fail, and the
//      p360 play box of the stage contract is >= MIN_BOX. (NOT a browser render of THIS level: the per-level first frame is
//      the play-cert harness's; this suite stays code-only.)
//   4. the evidence: the level is driven to its end through the routes a lesson uses (/api/play/level → /api/play/act) on the
//      solver's acts and on a mal-rule wrong path (malActs, then the solve), and the signed tokens are folded by the lesson
//      turn (brain/turn.js playEventsOf → routes/lesson.js planTurn): one game event per level for the skill, with the
//      outcome, the misconception, the trail (first try, misses), and the PLAY facts row with verdict / first_try / misses /
//      chose (the because kind).
// The seeded learners (children.mjs childrenFor) are read through an in-memory query fake (their ledger rows and open mix-ups),
// so what is known about her moves the pick. No DB, no network, no model; fixed NOW for the children.
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PILOT_TOPICS, childrenFor } from "../evals/knows-her/children.mjs";
import { studioSeam, phonePlayInstead, _lesson, _setDeps, phonePlayStats } from "../server/studio/seam.js";
import { noteViewport } from "../server/studio/seam.js";
import { viewportOf } from "../server/forge3/tray-gate.js";
import { admitPlay, playCertificates, playPassed } from "../server/forge3/compose.js";
import { coverage, entriesFor, entryKey } from "../server/play/levels.js";
import { verifySession } from "../server/play/session.js";
import { routes, playDeps } from "../server/play/routes.js";
import { whyLine } from "../server/play/why.js";
import { LOGIC } from "../src/play/families/index.ts";
import { env } from "../src/play/core/pick.ts";
import { MIN_BOX } from "../src/play/core/box.ts";
import { __test } from "../server/routes/lesson.js";
import { playEventsOf } from "../server/brain/turn.js";
import { initLessonState, step } from "../server/director/state.js";
import { findItem } from "../server/director/items.js";
import { newLearnerState } from "../server/comprehension/fuse.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, BRIEF } from "./fixtures/kit.mjs";

const { planTurn } = __test;
const CERTS = playCertificates();
const CONTRACT = JSON.parse(readFileSync(new URL("../server/forge3/certs/box-contract.json", import.meta.url), "utf8")).stageFirst.bands;
const GATE = { fact: "the Studio world is too small to play at 360 px", source: "studio_gate", kind: "play.studio_gate" };
const LEARNERS = ["new", "meera", "kabir", "player"];
const logit = (p) => Math.log(p / (1 - p));
const classOf = (topicId) => Number(/^c(\d+)-/.exec(topicId)[1]);
let uid = 0;
const uuid = () => `00000000-0000-4000-8000-${(++uid).toString(16).padStart(12, "0")}`;

/**
 * Her learner tables, from the seeded child's input: kt_misconception = her open mix-ups (p → logit); kt_skill_state = her
 * ledger rows (pL = (unaided right + 1) / (attempts + 2), display = the status). Nothing from this lesson (kt_evidence,
 * reteach_attempts are empty): a lesson's own focus is r8-play-pick's.
 */
const qOf = (input) => async (sql, params) => {
  if (/from kt_misconception/.test(sql)) return (input.mixups ?? []).filter((m) => params[1].includes(m.id)).map((m) => ({ misconception_id: m.id, logit: logit(m.p) }));
  if (/from kt_skill_state/.test(sql)) {
    const s = input.skills?.[params[1]];
    return s ? [{ p_l: (s.correctUnaided + 1) / (s.attempts + 2), display: s.status, n: s.attempts, run: 0, recent: [] }] : [];
  }
  return [];
};

/** Studio's own door at p360: a Studio lesson, the device's box, the refused v2 game's place → the play piece (or null). */
async function phonePiece({ topicId, skillId, child, q }) {
  const lessonId = uuid();
  noteViewport(lessonId, { w: 324, h: 187 }, false);
  assert.equal(viewportOf(lessonId).vp, "p360");
  studioSeam.prefetch({ lessonId, purpose: "practice", topicId, child });
  _setDeps({ q });
  const asked = phonePlayStats.asked;
  phonePlayInstead(lessonId, { kind: "game", need: "practice", skillId, topicId, archetype: "v2:world", intentId: `${lessonId}:st:1` });
  assert.equal(phonePlayStats.asked, asked + 1, "Studio asked the play side once");
  let piece = null;
  for (let i = 0; i < 200 && !piece; i++) {
    await new Promise((r) => setTimeout(r, 10));
    piece = [..._lesson(lessonId).pieces.values()].find((x) => x.source === "play") ?? null;
  }
  return { lessonId, piece };
}

const fakeRes = () => { const r = { statusCode: 0, headers: {}, body: null, setHeader(k, v) { r.headers[k] = v; }, end(s) { r.body = s ? JSON.parse(s) : null; } }; return r; };
async function call(route, body) {
  const res = fakeRes();
  await routes[route]({}, res, body);
  assert.equal(res.statusCode, 200, `${route}: ${JSON.stringify(res.body)}`);
  return res.body;
}

/** The lesson turn that receives the game's module events (the same planTurn the lesson route runs). */
function lessonState(kit, topicId, lessonId) {
  const r = step(initLessonState({ topicId, kit, ctx: { ...CTX, classLevel: classOf(topicId), sessionId: lessonId }, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
  return { ...r.state, brief: { ...BRIEF, classLevel: classOf(topicId) }, mode: "text", seq: 3 };
}
async function lessonReceives({ kit, topicId, lessonId, child, act }) {
  const evs = [{ moduleId: "play-1", engine: "play", type: "goal_met", name: "level_end", data: { ev: act.evidenceToken, seam: act.seamToken }, at: 1 }];
  const playTokens = playEventsOf(evs, { childId: child.id, lessonId });
  const s = lessonState(kit, topicId, lessonId);
  const p = await planTurn(s, null, { kit, child: { id: child.id, legal_mode: "M1", class_level: child.class_level }, lesson: { id: lessonId, started_at: new Date(0).toISOString() },
    activeItem: findItem(s, kit, s.activeItemId), moduleOnly: true, moduleEvents: evs, playTokens, answer: "", childText: "", leaked: false,
    live: Promise.resolve({ state: newLearnerState({ childId: child.id, classLevel: child.class_level }), maxSeq: 0 }), carried: [], now: 60_000 });
  return { row: evs[0].playRow, games: p.events.filter((e) => e.via === "game"), wrote: p.writes.some((w) => w.ktEvidence) };
}
const pairs = (row) => Object.fromEntries(String(row ?? "").split(" ").slice(1).map((x) => x.split("=")).filter((x) => x.length === 2));

/** Every check for one (topic, skill, learner). → the table row. */
async function seamFor(topicId, skillId, learner, C, kit, childId) {
  // (one child id per skill across the learners: the level seed is the child's, so only what is known about her differs)
  const child = { id: childId, class_level: classOf(topicId), language_pref: "hinglish" };
  const { lessonId, piece } = await phonePiece({ topicId, skillId, child, q: qOf(C.children[learner].input) });
  // 1. admitted at 360
  assert.ok(piece, `${skillId} × ${learner}: no play piece took the refused world's place`);
  assert.equal(piece.phone, true); assert.equal(piece.kind, "game"); assert.equal(piece.instead, `${lessonId}:st:1`);
  const a = piece.artifact.play, key = `${a.family}/${a.mode}`;
  const s = verifySession(a.sessionId);
  assert.ok(s, "the piece carries a signed play session");
  assert.equal(s.lessonId, lessonId, "the session is bound to the lesson");
  const entry = entriesFor({ skillId }).find((e) => entryKey(e) === s.key);
  assert.ok(entry, `${s.key}: a coverage entry admitting ${skillId}`);
  assert.ok(coverage().entries.includes(entry));
  assert.equal(`${entry.family}/${entry.mode}`, key);
  assert.equal(a.topicId, topicId);
  assert.equal(playPassed(CERTS, a.family, a.mode, a.art, "p360", classOf(topicId), topicId), true, `${key} in ${a.art} certified at p360`);
  // 2. because: the picker's own + exactly one studio_gate record; never a child line from the phone reason
  const because = s.because ?? [];
  const gates = because.filter((b) => b.source === "studio_gate");
  assert.equal(gates.length, 1, JSON.stringify(because));
  assert.deepEqual(gates[0], { choice: `${key} for the phone`, ...GATE });
  assert.equal(because.at(-1), gates[0], "the gate record comes after the picker's");
  assert.equal(whyLine([gates[0]], { lang: "hinglish", level: { family: a.family } }), null, "the phone reason is no why-line");
  if (s.why) assert.notEqual(s.why.reason, "studio_gate");
  if (!because.some((b) => b.source !== "studio_gate")) assert.equal(s.why, undefined, "no line when only the phone reason is there");
  // 3. the first screen
  const lv = await call("POST /api/play/level", { sessionId: a.sessionId });
  const level = lv.level, logic = LOGIC[key];
  assert.equal(level.levelId, a.levelId);
  assert.ok(logic.validate(level), `${level.levelId} validates`);
  assert.ok(logic.init(level), "inits");
  const sol = logic.solve(level);
  assert.ok(Array.isArray(sol) && sol.length > 0, `${level.levelId} is solvable`);
  assert.ok(piece.artifact.boardTwin?.board?.lines?.length, "a board twin for a box that cannot lay it out");
  const samples = (CERTS.samples ?? []).filter((x) => x.topicId === topicId && x.key === key && x.goal === level.goal && x.art === a.art && !x.noLevel);
  assert.ok(samples.length > 0, `${topicId} ${key}/${level.goal} in ${a.art}: judged at p360`);
  for (const x of samples) {
    assert.equal(x.byViewport?.p360, true, `${x.levelId}: p360`);
    if (x.game) assert.equal(x.game.p360, true, `${x.levelId}: the game mounted at p360`);
    if (x.box?.p360) assert.ok(x.box.p360.w >= MIN_BOX.w && x.box.p360.h >= MIN_BOX.h, JSON.stringify(x.box.p360));
    assert.deepEqual((x.fails ?? []).filter((f) => f.startsWith("p360:")), []);
  }
  // 4. the evidence, through the lesson's route, folded by the lesson turn
  const out = { key, art: a.art, sources: because.map((b) => b.source), kinds: because.map((b) => b.kind), level: level.levelId, firstScreen: true, evidence: [] };
  const right = await call("POST /api/play/act", { sessionId: a.sessionId, levelId: level.levelId, acts: env(sol), final: true });
  assert.equal(right.grade.verdict, "solved");
  assert.ok(right.evidenceToken && right.seamToken, "a lesson level end signs evidence and the seam row");
  const R = await lessonReceives({ kit, topicId, lessonId, child, act: right });
  assert.equal(R.games.length, 1, "one game event for the level");
  assert.equal(R.games[0].target, level.skillId); assert.equal(R.games[0].skillId ?? R.games[0].target, level.skillId);
  assert.equal(R.games[0].playTrail.firstTry, true); assert.equal(R.games[0].playTrail.misses, 0);
  assert.ok(R.wrote, "written to kt_evidence");
  const rp = pairs(R.row);
  assert.equal(rp.game, key); assert.equal(rp.verdict, "solved"); assert.equal(rp.first_try, "1"); assert.equal(rp.misses, "0");
  assert.equal(rp.chose, (because[0]?.kind ?? "").replace(/^play\./, ""), "the row names the choice's because kind");
  out.evidence.push("right");
  const mal = Object.keys(level.mal ?? {}).find((m) => logic.malActs(level, m));
  if (mal) {
    const wrong = await call("POST /api/play/act", { sessionId: a.sessionId, levelId: level.levelId, acts: env([...logic.malActs(level, mal), ...sol]), final: true });
    const W = await lessonReceives({ kit, topicId, lessonId, child, act: wrong });
    assert.equal(W.games.length, 1);
    const g = W.games[0];
    assert.equal(g.target, level.skillId);
    assert.equal(g.playTrail.firstTry, false); assert.ok(g.playTrail.misses >= 1);
    assert.deepEqual(g.playTrail.mal[0], { rule: mal, mis: level.mal[mal] });
    assert.equal(g.misconceptionId, level.mal[mal], "the mal-rule's kit misconception reaches her learner state");
    const wp = pairs(W.row);
    // (a mal-rule that commits a state the solver's acts cannot undo ends not solved: the verdict is the grade's own)
    assert.equal(wp.verdict, wrong.grade.verdict); assert.equal(wp.first_try, "0"); assert.equal(wp.misses, String(g.playTrail.misses));
    out.evidence.push(`mal:${mal}→${wrong.grade.verdict}`);
  } else out.evidence.push("no mal-rule");
  return out;
}

describe("round 8: Studio's phone routing → the play family, end to end (dry, p360, pilot topics × seeded learners)", () => {
  const KEEP = {};
  before(() => { for (const k of ["FORGE3_PLAY", "STUDIO_PHONE_PLAY", "TAXILA_EARLY_PIECE"]) { KEEP[k] = process.env[k]; delete process.env[k]; } });
  after(() => { _setDeps({ q: null }); for (const [k, v] of Object.entries(KEEP)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } });
  const saved = { ...playDeps };
  before(() => { playDeps.requireChild = async (_req, id) => ({ guardian: { id: "g" }, child: { id, class_level: 5, first_name: "Riya", language_pref: "hinglish" } }); playDeps.q = async () => []; });
  after(() => Object.assign(playDeps, saved));

  const table = {};
  for (const topicId of PILOT_TOPICS) {
    test(`${topicId}: every scripted skill × every seeded learner gets an admitted family at p360, its because, a first screen and its evidence`, async () => {
      const C = childrenFor(topicId);
      const kit = kitFromFile(getTopic(topicId));
      for (const sk of C.kit.skills) {
        assert.ok(admitPlay(sk.id, topicId), `${sk.id}: admitted`);
        const childId = uuid();
        for (const learner of LEARNERS) (table[topicId] ??= {})[`${sk.id} × ${learner}`] = await seamFor(topicId, sk.id, learner, C, kit, childId);
      }
    });
  }

  // r8 C2 Games: the round-8 engine modes (kon/place on c6-maths-ch02-t03; kon/name on c6-maths-ch02-t02). No lesson script is
  // live for these topics yet, so children.mjs has no seeded learners for them: a new child (nothing known) takes every kit
  // skill through the same door, checks and evidence as the pilot topics.
  for (const [topicId, game] of [["c6-maths-ch02-t03", "kon/place"]]) {
    test(`${topicId}: every kit skill gets an admitted family at p360 (${game} among them), its because, a first screen and its evidence`, async () => {
      const kit = kitFromFile(getTopic(topicId));
      const C = { children: { new: { input: {} } } };
      const keys = new Set();
      for (const sk of kit.skills) {
        assert.ok(admitPlay(sk.id, topicId), `${sk.id}: admitted`);
        const row = await seamFor(topicId, sk.id, "new", C, kit, uuid());
        keys.add(row.key);
        assert.ok(row.evidence.length >= 1);
      }
      assert.ok(keys.has(game), `${game} served for one of the skills: ${[...keys]}`);
    });
  }

  test("the p360 stage gives a play piece at least MIN_BOX (or Studio shows its board twin)", () => {
    for (const band of Object.values(CONTRACT)) {
      const b = band.p360.play.box;
      assert.ok(b.w >= MIN_BOX.w && b.h >= MIN_BOX.h, JSON.stringify(b));
    }
  });

  test("what is known about her changes the pick, and the because names the fact", () => {
    // c6 area & perimeter: Kabir's open mix-up (area for perimeter, 0.82) moves his first nazariya level to one that tells it
    // apart; Meera's ledger (s1 mastered; s2 P(skill) 0.40) fades s1 and serves arena/pick on s2 for its band fit
    const c6 = table["c6-maths-ch06-t01"];
    assert.ok(c6, "the c6 topic ran");
    const at = (sk, who) => c6[`c6-maths-ch06-t01-${sk} × ${who}`];
    assert.deepEqual(at("s1", "new").sources, ["studio_gate"]);
    assert.deepEqual(at("s1", "kabir").kinds, ["play.pick_mixup", "play.studio_gate"]);
    assert.notEqual(at("s1", "kabir").level, at("s1", "new").level, "his level is not the class default's");
    assert.deepEqual(at("s1", "meera").kinds, ["play.fade_history", "play.studio_gate"]);
    assert.equal(at("s2", "new").key, "nazariya/floor");
    assert.equal(at("s2", "meera").key, "arena/pick");
    assert.deepEqual(at("s2", "meera").kinds, ["play.pick_fit", "play.studio_gate"]);
    // c5 comparing fractions: the same-top-number belief serves its strips level for Kabir and Player, not for New
    const c5 = table["c5-maths-ch02-t02"];
    for (const who of ["kabir", "player"]) assert.deepEqual(c5[`c5-maths-ch02-t02-s1 × ${who}`].kinds, ["play.pick_mixup", "play.studio_gate"], who);
    assert.notEqual(c5["c5-maths-ch02-t02-s1 × kabir"].level, c5["c5-maths-ch02-t02-s1 × new"].level);
    // c4 / c5 arena-only skills: Meera's P(skill) moves the arena challenge inside the one game, and says so
    for (const [t, sk] of [["c4-maths-ch05-t01", "s2"], ["c5-maths-ch02-t02", "s2"]]) {
      const row = table[t][`${t}-${sk} × meera`], plain = table[t][`${t}-${sk} × new`];
      assert.equal(row.key, plain.key); assert.notEqual(row.level, plain.level);
      assert.deepEqual(row.kinds, ["play.pick_fit", "play.studio_gate"], t);
    }
  });

  test("over the whole matrix: a game or level that differs from a new child's always carries a because from her learner state", () => {
    let moved = 0;
    for (const [t, rows] of Object.entries(table)) for (const [k, r] of Object.entries(rows)) {
      const plain = rows[k.replace(/ × \w+$/, " × new")];
      if (r === plain || (r.key === plain.key && r.level === plain.level)) continue;
      moved++;
      assert.ok(r.sources.some((s) => s === "kt_misconception" || s === "kt_skill_state"), `${t} ${k}: ${r.key} ${r.level} vs ${plain.key} ${plain.level} with only ${r.sources}`);
    }
    assert.ok(moved >= 8, `${moved} moved picks`);
  });

  test("the because facts are the learner's own: mix-up by its kit belief and posterior, fit by her P(skill)", async () => {
    const C = childrenFor("c6-maths-ch06-t01");
    const kabir = await phonePiece({ topicId: "c6-maths-ch06-t01", skillId: "c6-maths-ch06-t01-s1", child: { id: uuid(), class_level: 6, language_pref: "hinglish" }, q: qOf(C.children.kabir.input) });
    const b = verifySession(kabir.piece.artifact.play.sessionId).because;
    assert.equal(b[0].source, "kt_misconception");
    assert.match(b[0].fact, /^open mix-up: Confuses perimeter with area.*, 0\.82$/);
    assert.equal(b[0].mis, C.children.kabir.input.mixups[0].id);
    const meera = await phonePiece({ topicId: "c6-maths-ch06-t01", skillId: "c6-maths-ch06-t01-s2", child: { id: uuid(), class_level: 6, language_pref: "hinglish" }, q: qOf(C.children.meera.input) });
    const m = verifySession(meera.piece.artifact.play.sessionId).because;
    assert.equal(m[0].source, "kt_skill_state");
    assert.match(m[0].fact, /^P\(skill\) 0\.40: first try /);
    // Studio's own piece keeps its phone line; the picker's records ride the signed session (see docs/patches/to-studio)
    assert.match(meera.piece.because, /^phone: arena covers this skill$/);
  });

  after(() => {
    if (process.env.R8_PHONE_SEAM_TABLE) {
      for (const [t, rows] of Object.entries(table)) for (const [k, r] of Object.entries(rows)) console.log(`${t}\t${k}\t${r.key}\t${r.art}\t${r.kinds.join("+")}\t${r.level}\t${r.firstScreen ? "ok" : "-"}\t${r.evidence.join(",")}`);
    }
  });
});
