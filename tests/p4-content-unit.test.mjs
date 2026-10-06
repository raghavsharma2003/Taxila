// ship5 p4-content unit tests: the catalogue rung, the production catalog, the host grade session, the rest rule and
// the 3-minute floor, the seam-bridge merge (Stagecraft + Wave 2 on one stage), board sync, the lesson lifecycle and the
// stage's busy share. Pure: no network, no DB, no model (every model call is a fake).
import { test } from "node:test";
import assert from "node:assert/strict";
import { entryFromRecord, checkSpec, unknownKitIds, loadCatalogue, catalogueEntry, catalogueTopicsByArchetype, kitTopicAny, EXPLAINER } from "../server/stagecraft/catalogue.js";
import { createBuilders, boardTwinFor, stringsOfSpec } from "../server/stagecraft/builders.js";
import { productionCatalog, stagecraftMode, startStagecraft, stopStagecraft, _sweep, specChainCfg } from "../server/stagecraft/lesson.js";
import { createStageGradeSession, actOf } from "../server/stagecraft/grade.js";
import { wantAt, restIsDue, restRetire } from "../server/stagecraft/policy.js";
import { admissible } from "../server/stagecraft/catalog.js";
import { familyKey } from "../server/stagecraft/sources.js";
import * as bridge from "../server/stagecraft/seam-bridge.js";
import { stageRest, kernelView } from "../server/stagecraft/kernel-point.js";
import { revealPoint, REST_CFG } from "../server/stagecraft/adapters.js";
import * as boardSync from "../server/stagecraft/board-sync.js";
import { StagecraftHost } from "../server/stagecraft/host.js";
import { studioSeam, _lesson } from "../server/studio/seam.js";
import { ENGINE_SPECS_EXT } from "../shared/studio-spec-ext/index.ts";
import { ENGINE_SPECS } from "../shared/studio-spec.ts";

const T = "c6-maths-ch05-t02";        // a catalogue topic with a checked game (sieve-storm@1) and a checked explainer
const { kitFromFile } = await import("../server/content/kits.js");
const { getTopic } = await import("../server/content/curriculum.js");
globalThis.__kits = Object.fromEntries(["c5-maths-ch02-t01"].map((t) => [t, kitFromFile(getTopic(t))]));
const kit = kitTopicAny(T);
const clone = (x) => structuredClone(x);

// ───────────── the catalogue rung ─────────────
test("catalogue: a checked topic yields its game and explainer, re-validated against the current registry and kit", () => {
  const e = catalogueEntry(T);
  assert.ok(e, "the topic file is in data/studio-catalogue");
  assert.equal(e.status.check, "pass");
  assert.equal(e.game?.archetype, "sieve-storm@1");
  assert.equal(e.explainer?.archetype, EXPLAINER);
  assert.equal(e.game.kind, "game"); assert.equal(e.explainer.kind, "animation");
  assert.deepEqual(unknownKitIds(kit, e.game.spec), []);
  assert.ok(e.boards.length >= 1, "whiteboard beats that pass the strict shape and the stage lint");
});

test("catalogue: the kit-id validator refuses a spec citing an id that is not this topic's (never trusted to the prompt)", () => {
  const e = catalogueEntry(T);
  const bad = clone(e.explainer.spec);
  bad.task = { ...bad.task, src: "c6-maths-ch99-t01-i01" };
  const r = checkSpec(EXPLAINER, bad, kit);
  assert.equal(r.ok, false); assert.match(r.why, /^unknown_kit_id/);
  assert.deepEqual(unknownKitIds(kit, { a: [{ targets: `${T}-m-nope` }] }), [`${T}-m-nope`]);
});

test("catalogue: unchecked, failed-check, fell-back, unknown-archetype and safety-floor entries are never usable", () => {
  const raw = JSON.parse(JSON.stringify({ topicId: T, class: 6, subject: "maths", game: { archetype: "sieve-storm@1", spec: catalogueEntry(T).game.spec }, explainer: { spec: catalogueEntry(T).explainer.spec } }));
  const unchecked = entryFromRecord(raw, { kit });
  assert.equal(unchecked.game, null); assert.equal(unchecked.status.game, "unchecked");
  const failed = entryFromRecord({ ...raw, check: { verdict: "fail" } }, { kit });
  assert.equal(failed.game, null);
  const passed = entryFromRecord({ ...raw, check: { verdict: "pass" } }, { kit });
  assert.ok(passed.game && passed.explainer);
  const junk = entryFromRecord({ ...raw, check: { verdict: "pass" }, game: { archetype: "sieve-storm@1", spec: { nonsense: true } } }, { kit });
  assert.equal(junk.game, null); assert.equal(junk.status.game, "fell_back");
  const unknown = entryFromRecord({ ...raw, check: { verdict: "pass" }, game: { archetype: "no-such@1", spec: {} } }, { kit });
  assert.equal(unknown.status.game, "unknown_archetype");
  const floor = entryFromRecord({ ...raw, topicId: "c7-science-ch06-t01", check: { verdict: "pass" } });
  assert.equal(floor.status.game, "safety_excluded"); assert.equal(floor.game, null);
});

test("production catalog: extension engines are admissible ONLY for topics with a checked authored spec", () => {
  const cat = productionCatalog({ fresh: true });
  const rows = catalogueTopicsByArchetype(loadCatalogue());
  assert.ok(cat.rs4["sieve-storm@1"].topics.includes(T));
  for (const [id, a] of Object.entries(cat.rs4)) {
    if (!(id in ENGINE_SPECS_EXT)) continue;
    for (const t of a.topics) assert.ok((rows[id] ?? []).includes(t), `${id} admits ${t} only through the catalogue`);
  }
  // base engines keep their reviewed outcomes
  for (const [id, d] of Object.entries(ENGINE_SPECS)) for (const t of d.outcomes.topics) assert.ok(cat.rs4[id].topics.includes(t));
  // the explainer is an animation kind; an explain want admits it on its topic
  const a = admissible(cat, { topicId: T, kinds: ["animation", "simulation", "diagram"] });
  assert.equal(a[0]?.archetype, EXPLAINER);
});

test("builders: the instant rung serves THIS topic's authored spec; an extension engine without one is never on-topic", () => {
  const b = createBuilders();
  const key = { topicId: T, lang: "hinglish" };
  const r = b.instant.engineDefault({ archetype: "sieve-storm@1", kind: "game" }, key);
  assert.equal(r.payload.source, "catalogue");
  assert.deepEqual(r.payload.spec, catalogueEntry(T).game.spec);
  assert.ok(r.checks.onTopic && r.checks.truth && r.checks.spec.ok);
  const off = b.instant.engineDefault({ archetype: "sieve-storm@1", kind: "game" }, { topicId: "c4-evs-ch01-t01", lang: "en" });
  assert.equal(off.checks.onTopic, false, "no authored spec for that topic: the extension default is another lesson's content");
  const rs4 = b.instant.engineDefault({ archetype: "slice-at@1", kind: "game" }, { topicId: "c4-maths-ch05-t01", lang: "en" });
  assert.ok(rs4.checks.onTopic);
});

test("builders: the board twin carries the piece's title and the kit's key terms (same values as its facts)", () => {
  const tw = boardTwinFor({ archetype: "sieve-storm@1", family: "f", need: "practice" }, T);
  assert.equal(tw.values.title, ENGINE_SPECS_EXT["sieve-storm@1"].title);
  assert.equal(tw.board.title, tw.values.title);
  assert.ok(tw.board.lines.length >= 1 && tw.board.lines.length <= 4);
  for (const l of tw.board.lines) assert.ok(l.length <= 64);
  const s = stringsOfSpec(catalogueEntry(T).explainer.spec);
  assert.ok(Object.keys(s).length > 3);
  for (const v of Object.values(s)) assert.ok(!/^c[4-7]-[a-z]+-ch\d/.test(v), "kit ids are not child-visible strings");
});

test("builders: a generated spec citing an unknown kit id is unusable; a valid one is checked by Q8 on every string", async () => {
  const good = catalogueEntry(T).game.spec;
  let q8Saw = null;
  const mk = (json) => createBuilders({ chat: async () => ({ json, usage: {} }), q8: async (strings) => { q8Saw = strings; return { ok: true }; } });
  const key = { topicId: T, lang: "hinglish", band: "B3" };
  const bad = clone(good); bad.rounds[0].targets = "c6-maths-ch05-t02-m-invented";
  const r1 = await mk(bad).generatedSpec({ archetype: "sieve-storm@1", kind: "game", need: "practice" }, "taxila-fast-bg", new AbortController().signal, key);
  assert.equal(r1.ok, false); assert.equal(r1.why, "unknown_kit_id");
  const r2 = await mk(clone(good)).generatedSpec({ archetype: "sieve-storm@1", kind: "game", need: "practice" }, "taxila-fast-bg", new AbortController().signal, key);
  assert.equal(r2.ok, true); assert.ok(r2.checks.onTopic && r2.checks.contentSafe);
  assert.equal(q8Saw, null, "no string the model wrote is new: nothing to check twice");
  const fresh = clone(good); fresh.title = "Prime hunt in the bazaar";
  const r3 = await mk(fresh).generatedSpec({ archetype: "sieve-storm@1", kind: "game", need: "practice" }, "taxila-fast-bg", new AbortController().signal, key);
  assert.equal(r3.ok, true);
  assert.deepEqual(Object.values(q8Saw), ["Prime hunt in the bazaar"], "Q8 sees exactly the strings the model wrote");
  const blocked = await createBuilders({ chat: async () => ({ json: clone(fresh), usage: {} }), q8: async () => ({ ok: false }) }).generatedSpec({ archetype: "sieve-storm@1", kind: "game", need: "practice" }, "taxila-fast-bg", new AbortController().signal, key);
  assert.equal(blocked.checks.contentSafe, false, "a Q8 finding makes the spec unshowable (allChecks)");
});

// ───────────── host grading ─────────────
test("grade: the engine registry grades the act; every claim in the value is stripped; the envelope is unwrapped", () => {
  const spec = catalogueEntry(T).explainer.spec;
  const g = createStageGradeSession(EXPLAINER, spec);
  assert.deepEqual(g.items, ["task"]);
  const right = spec.task.kind === "tap" ? spec.task.answer : spec.task.kind === "order" ? spec.task.items : spec.task.answer;
  const wrongV = spec.task.kind === "tap" ? "__nope__" : spec.task.kind === "order" ? [...spec.task.items].reverse() : spec.task.answer + 1e6;
  const w = g.grade({ itemId: "task", value: wrongV, archetype: EXPLAINER, correct: true });
  assert.equal(w.correct, false, "a wrong act claiming correct:true is wrong");
  assert.equal(g.wrongCount, 1);
  const r = g.grade({ itemId: "task", value: right, archetype: EXPLAINER, correct: false });
  assert.equal(r.correct, true, "the right act claiming correct:false is right");
  assert.equal(r.closedItem, true); assert.equal(g.complete, true);
  const again = g.grade({ itemId: "task", value: right });
  assert.equal(again.alreadyClosed, true);
  assert.deepEqual(actOf({ value: { verdict: "right", n: 3 }, itemId: "x" }), { itemId: "x", value: { n: 3 } });
  const u = createStageGradeSession(EXPLAINER, spec).grade({ itemId: "not-an-item", value: 1 });
  assert.equal(u.ungraded, true); assert.equal(u.correct, false);
});

// ───────────── the rest rule and the 3-minute floor ─────────────
const catalog = productionCatalog();
const base = { pointKind: "trp", turnSeq: 10, beat: "practice_set", skillId: "s1", topicId: T, lastPolicyRevealTurn: 2, shownThisBeat: [] };
test("rest rule: plan- and signal-led wants wait while the stage has been busy ≥ 50% (after the 2-minute grace)", () => {
  assert.equal(restIsDue({ busyShare: 0.6, teachingMs: 60_000 }, REST_CFG), false, "grace");
  assert.equal(restIsDue({ busyShare: 0.6, teachingMs: 300_000 }, REST_CFG), true);
  assert.equal(restIsDue({ busyShare: 0.4, teachingMs: 300_000 }, REST_CFG), false);
  assert.equal(restIsDue({}, REST_CFG), false, "no input: inert");
  const cfg = { catalog, ...REST_CFG };
  assert.ok(wantAt({ ...base }, cfg), "free stage: the beat's piece");
  assert.equal(wantAt({ ...base, busyShare: 0.7, teachingMs: 400_000, lastVisualAgoMs: 0 }, cfg), null, "busy: rest");
  assert.ok(wantAt({ ...base, busyShare: 0.7, teachingMs: 400_000, signal: { stepState: "stuck_unproductive" } }, cfg) === null, "a signal-led want rests too");
});
test("rest rule: a child's request, a board reteach and a misconception contrast are exempt", () => {
  const cfg = { catalog, ...REST_CFG };
  const busy = { busyShare: 0.9, teachingMs: 600_000, lastVisualAgoMs: 0 };
  const req = wantAt({ ...base, ...busy, request: { kind: "game_request", seq: 10 } }, cfg);
  assert.equal(req?.childRequested, true);
  const on = { family: familyKey("s1", "practice"), archetype: "sieve-storm@1", kind: "game", revealedTurn: 6 };
  const re = wantAt({ ...base, ...busy, board: { onStage: on, wrongCount: 2 } }, cfg);
  assert.equal(re?.need, "re_represent");
  const con = wantAt({ ...base, ...busy, misconception: { id: `${T}-m1`, state: "active", revealedTurn: 8 } }, cfg);
  assert.equal(con?.need, "contrast_misconception");
});
test("3-minute floor: with nothing on stage for 150 s and no flow, the beat's idea comes back even if shown earlier in the beat", () => {
  const cfg = { catalog, ...REST_CFG };
  const fam = familyKey("s1", "practice");
  assert.equal(wantAt({ ...base, shownThisBeat: [fam] }, cfg), null, "shown this beat: no re-show by default");
  const w = wantAt({ ...base, shownThisBeat: [fam], lastVisualAgoMs: 160_000, busyShare: 0.2, teachingMs: 600_000 }, cfg);
  assert.equal(w?.family, fam);
  assert.equal(wantAt({ ...base, shownThisBeat: [fam], lastVisualAgoMs: 160_000, inFlow: true, busyShare: 0.2, teachingMs: 600_000 }, cfg), null, "in flow: no interruption");
});
test("rest retire: a piece up ≥ 4 turns steps down when rest is due, never while it is answered this turn or in a safeguard", () => {
  const on = { revealedTurn: 4 };
  const x = { busyShare: 0.8, teachingMs: 600_000, turnSeq: 9, board: { onStage: on } };
  assert.equal(restRetire(x, REST_CFG), true);
  assert.equal(restRetire({ ...x, board: { onStage: on, answeredThisTurn: true } }, REST_CFG), false);
  assert.equal(restRetire({ ...x, safety: true }, REST_CFG), false);
  assert.equal(restRetire({ ...x, turnSeq: 6 }, REST_CFG), false);
  assert.equal(restRetire({ ...x, busyShare: 0.3 }, REST_CFG), false);
});

// ───────────── one stage: the bridge's merge ─────────────
const instantOnly = () => ({ instant: createBuilders().instant, generatedSpec: async () => ({ ok: false }), image: async () => ({ ok: false }), liveCodegen: async () => ({ ok: false }), library: async () => ({ ok: false }) });
const keyOf = (lessonId) => ({ lessonId, topicId: T, skillId: kit.skills?.[0]?.id ?? `${T}-s1`, beat: "practice_set", itemId: null, misconceptionId: null, misconceptionState: "unknown", hintRung: 0, representation: null, band: "B3", lang: "hinglish", kitHash: "k", learnerRev: 0, floorRev: 1, pending: [] });
function setup(lessonId, { onScreen = null } = {}) {
  studioSeam.prefetch({ lessonId, purpose: "practice" });     // registers the seam lesson, no W2 pieces
  const L = _lesson(lessonId);
  if (onScreen) { L.pieces.set(onScreen.intentId, onScreen); L.onScreen = onScreen.intentId; }
  const host = bridge.attach(lessonId, new StagecraftHost({ lessonId, mode: "on", catalog, builders: instantOnly(), clock: () => 400_000 }));
  host.input({ t: "state", key: keyOf(lessonId), at: 0 });
  return { L, host };
}
const pointFor = (lessonId, o = {}) => revealPoint({ lessonId, turnSeq: 9, safety: false, beat: "practice_set", beatChanged: true, topicId: T, skillId: keyOf(lessonId).skillId, band: "B3", lang: "hinglish", kitHash: "k",
  lastPolicyRevealTurn: 0, at: 400_000, phase: "her_turn", ...o }, { catalog });

test("merge: a Stagecraft reveal wins over a Wave 2 proposal and carries a stage-tagged facts row and a 1000x625 stage", () => {
  const id = "m-1"; setup(id);
  const v = bridge.augmentView(id, { statuses: [], onScreen: null, propose: { reveal: "w2-x" } }, pointFor(id));
  assert.notEqual(v.propose.reveal, "w2-x");
  const p = _lesson(id).pieces.get(v.propose.reveal);
  assert.equal(p.source, "stagecraft");
  assert.ok(bridge.isStageArchetype(v.revealing.archetype));
  const slot = bridge.stagecraftSlot(p);
  assert.deepEqual(slot.artifact.stage, { w: 1000, h: 625 });
  assert.equal(slot.artifact.kind, "stagecraft");
  assert.ok(bridge.gradeSessionFor(p), "graded by the engine registry");
  bridge.detach(id);
});
test("merge: a Wave 2 piece the child is on stays for a plan-led want, and is replaced for the child's own request", () => {
  const w2 = { intentId: "w2-on", kind: "game", state: "in_use", source: "library", revealedTurn: 8 };
  const id = "m-2"; setup(id, { onScreen: { ...w2 } });
  const v = bridge.augmentView(id, { statuses: [], onScreen: { kind: "game" } }, pointFor(id));
  assert.equal(v.propose?.reveal, undefined, "the child's piece stays");
  bridge.detach(id);
  const id2 = "m-3"; setup(id2, { onScreen: { ...w2 } });
  kernelView(id2).request = { kind: "game_request", seq: 9 };
  const v2 = bridge.augmentView(id2, { statuses: [], onScreen: { kind: "game" } }, pointFor(id2, { request: { kind: "game_request", seq: 9 } }));
  assert.ok(v2.propose?.reveal && v2.propose.requested === true, "their request is answered on stage");
  bridge.detach(id2);
});
test("merge: when the stage must rest, a plan-led Wave 2 reveal is withheld and a long-standing piece retires", () => {
  const id = "m-4"; const { L } = setup(id);
  const busy = { busyShare: 0.9, teachingMs: 600_000, lastVisualAgoMs: 0 };
  const v = bridge.augmentView(id, { statuses: [], onScreen: null, propose: { reveal: "w2-y" } }, pointFor(id, busy));
  assert.equal(v.propose?.reveal, undefined);
  bridge.detach(id);
  const id2 = "m-5"; const s2 = setup(id2, { onScreen: { intentId: "old", kind: "game", state: "revealed", source: "library", revealedTurn: 1 } });
  s2.L.turn = 9;
  const v2 = bridge.augmentView(id2, { statuses: [], onScreen: { kind: "game" } }, pointFor(id2, busy));
  assert.equal(v2.propose?.retire, "old");
  bridge.detach(id2);
  void L;
});

// ───────────── board sync ─────────────
const okScript = (n = 3, durationMs = 3000) => ({ v: 1, scriptId: "s", line: { lessonId: "L" }, anchor: "line_audio_start", board: { w: 400, h: 300, ground: "chalk" }, mode: "fresh", durationMs,
  ops: Array.from({ length: n }, (_, i) => ({ id: `r${i}`, op: "rect", at: [20 + i * 120, 120], w: 100, h: 60, startMs: 200 + i * 700, endMs: 600 + i * 700 })) });
const askFor = (id, text, content = ["Three boxes side by side for the plan."]) => ({ intent: { intentId: id, lessonId: "L", kind: "whiteboard", style: { band: "B3" } }, line: { lessonId: "L", text }, mode: "fresh", kit: { topicId: T, content } });
const delay = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms));
test("board sync: a speculative board that passes against her real line is shown at once and no line plan is paid for", async () => {
  let lineCalls = 0;
  const planner = async (ask) => { if (/Three boxes side by side/.test(ask.line.text)) return { ok: true, script: okScript(), usd: 0.0003 }; lineCalls++; return { ok: false, usd: 0.0003 }; };
  const ask = askFor("bs-1", "Yeh dekho, teen boxes ek line mein.");
  assert.equal(boardSync.prepare(ask, { kit, planWhiteboard: planner }), true);
  await boardSync._specs.get("bs-1").promise;
  const r = await boardSync.plan(ask, { kit, planWhiteboard: planner });
  assert.equal(r.ok, true); assert.equal(r.source, "spec"); assert.equal(lineCalls, 0);
  assert.ok(r.syncMs < 250, `answered from the speculative board in ${r.syncMs} ms`);
});
test("board sync: the line plan wins inside the deadline; a slow line plan yields to a passing late speculative board", async () => {
  const fast = async () => ({ ok: true, script: okScript(), usd: 0 });
  const r = await boardSync.plan(askFor("bs-2", "Teen boxes."), { kit, planWhiteboard: async (a) => (await delay(20), fast(a)) });
  assert.equal(r.source, "line");
  process.env.TAXILA_BOARD_SYNC_MS = "300";
  const ask = askFor("bs-3", "Teen boxes.");
  boardSync.prepare(ask, { kit, planWhiteboard: async () => (await delay(150), { ok: true, script: okScript(), usd: 0 }) });
  const r2 = await boardSync.plan(ask, { kit, planWhiteboard: async () => (await delay(2000), { ok: true, script: okScript(), usd: 0 }) });
  assert.equal(r2.source, "spec"); assert.ok(r2.syncMs < 900, `synced at ${r2.syncMs} ms`);
  delete process.env.TAXILA_BOARD_SYNC_MS;
});
test("board sync: nothing by the deadline and no code board → the line plan whenever it lands (the pre-ship5 path)", async () => {
  process.env.TAXILA_BOARD_SYNC_MS = "300";
  const r = await boardSync.plan(askFor("bs-4", "Teen boxes."), { kit: null, planWhiteboard: async () => (await delay(500), { ok: true, script: okScript(), usd: 0 }) });
  assert.equal(r.source, "line"); assert.ok(r.syncMs >= 450);
  delete process.env.TAXILA_BOARD_SYNC_MS;
});
test("board sync: the code board answers at the deadline when its re-gate against her line passes", async () => {
  process.env.TAXILA_BOARD_SYNC_MS = "300";
  const sci = kitTopicAny("c7-science-ch01-t01");
  const ask = { intent: { intentId: "bs-5", lessonId: "L", kind: "whiteboard", style: { band: "B3" } }, line: { lessonId: "L", text: "Plants apna khana khud banate hain, sunlight aur water se." }, mode: "fresh", kit: { topicId: "c7-science-ch01-t01", content: [] } };
  const r = await boardSync.plan(ask, { kit: sci && (await import("../server/content/kits.js")).kitFromFile((await import("../server/content/curriculum.js")).getTopic("c7-science-ch01-t01")), planWhiteboard: async () => (await delay(3000), { ok: false, usd: 0 }) });
  assert.equal(r.ok, true); assert.equal(r.source, "code"); assert.ok(r.syncMs < 1200, `code board at ${r.syncMs} ms`);
  assert.equal(r.script.anchor, "line_audio_start");
  delete process.env.TAXILA_BOARD_SYNC_MS;
});
test("board sync: a speculative board whose counts disagree with her line is refused by the re-gate; the kill switch is the old planner", async () => {
  const circle = { ...okScript(0), ops: [{ id: "c", op: "circle", c: [200, 150], r: 80, startMs: 100, endMs: 600 }, ...[0, 1, 2].map((i) => ({ id: `p${i}`, op: "sector", c: [200, 150], r: 80, fromDeg: i * 120, toDeg: (i + 1) * 120, startMs: 700 + i * 200, endMs: 900 + i * 200 }))] };
  const ask = askFor("bs-6", "Isko 4 equal parts mein baanto.", ["A circle cut into 3 equal parts."]);
  const ctx = boardSync.gateCtxFor(ask, { kit });
  assert.equal(boardSync.regate(circle, ask, ctx).ok, false, "3 sectors while she says 4");
  process.env.TAXILA_BOARD_SYNC = "0";
  let called = 0;
  const r = await boardSync.plan(askFor("bs-7", "x"), { kit, planWhiteboard: async () => { called++; return { ok: false, why: "x" }; } });
  assert.equal(called, 1); assert.equal(r.source, undefined);
  delete process.env.TAXILA_BOARD_SYNC;
  const rt = boardSync.retime(okScript(3, 3000), 3000, 6000);
  assert.equal(rt.ops[1].startMs, 1800);
});

// ───────────── lifecycle and the stage's busy share ─────────────
test("lifecycle: STAGECRAFT defaults on (owner: ship it); off attaches nothing; practice gets none; stop detaches", async () => {
  assert.equal(stagecraftMode({}), "on"); assert.equal(stagecraftMode({ STAGECRAFT: "off" }), "off");
  assert.equal(stagecraftMode({ STAGECRAFT: "shadow" }), "shadow"); assert.equal(stagecraftMode({ STAGECRAFT: "bogus" }), "on");
  assert.equal(await startStagecraft({ lessonId: "lc-1" }, { mode: "off", builders: instantOnly() }), null);
  assert.equal(await startStagecraft({ lessonId: "lc-2", purpose: "practice" }, { mode: "on", builders: instantOnly() }), null);
  const h = await startStagecraft({ lessonId: "lc-3", child: { studio_control: "ready_made" } }, { mode: "on", builders: instantOnly(), timerMs: 60_000 });
  assert.ok(h && bridge.hostFor("lc-3") === h);
  assert.equal(h.state.meta.control, "ready_made", "a parent's ready-made-only: nothing speculative");
  stopStagecraft("lc-3");
  assert.equal(bridge.hostFor("lc-3"), null);
  const h4 = await startStagecraft({ lessonId: "lc-4" }, { mode: "on", builders: instantOnly(), timerMs: 60_000 });
  assert.ok(h4); _sweep(Date.now() + 46 * 60_000); assert.equal(bridge.hostFor("lc-4"), null, "idle hosts are swept");
});
test("stage rest: busy share from the seam's own stage (pieces until retired, boards for their drawing) and the last visual", () => {
  const id = "sr-1";
  studioSeam.prefetch({ lessonId: id, purpose: "practice" });
  const L = _lesson(id);
  const t0 = 1_000_000;
  L.startedAt = t0;
  L.pieces.set("a", { intentId: "a", kind: "game", state: "revealed", revealedAt: t0 + 60_000 });
  let r = stageRest(id, {}, t0 + 120_000);
  assert.equal(r.lastVisualAgoMs, 0, "a piece is up");
  assert.ok(Math.abs(r.busyShare - 0.5) < 1e-9);
  L.pieces.get("a").state = "retired";
  r = stageRest(id, {}, t0 + 180_000);
  assert.ok(Math.abs(r.busyShare - 120_000 / 180_000) < 1e-9);
  L.pieces.set("wb", { intentId: "wb", kind: "whiteboard", state: "revealed", revealedAt: t0 + 200_000, artifact: { script: { durationMs: 6000 } } });
  r = stageRest(id, { lastMove: { skillId: "k" }, history: { k: ["incorrect", "correct", "correct"] } }, t0 + 240_000);
  assert.ok(Math.abs(r.busyShare - 126_000 / 240_000) < 1e-9);
  assert.equal(r.lastVisualAgoMs, 40_000);
  assert.equal(r.inFlow, true);
});

test("board asks: 'board pe dikhao' / 'draw it' / 'diagram' are the live whiteboard's; no piece competes and nothing is kept as a request", async () => {
  const { requestFromText } = await import("../server/stagecraft/sources.js");
  for (const t of ["samajh nahi aaya, board pe dikhao", "draw it", "show me a diagram", "whiteboard pe bana ke samjhao"]) assert.equal(requestFromText(t), "board_request", t);
  assert.equal(requestFromText("picture dikhao"), "visual_request");
  assert.equal(wantAt({ ...base, request: { kind: "board_request", seq: 10 } }, { catalog, ...REST_CFG }), null);
  const lessonId = "br-1"; setup(lessonId);
  const { stagecraftPointFor } = await import("../server/stagecraft/kernel-point.js");
  const p = stagecraftPointFor({ lesson: { id: lessonId, topic_id: T }, prev: { beat: { type: "explain" }, turn: 5 }, state: {}, kit, child: { class_level: 6 }, childText: "board pe dikhao" });
  assert.equal(p.want, null);
  assert.equal(kernelView(lessonId).request, null, "not kept for the next turn");
  bridge.detach(lessonId);
});

test("board asks: a piece on stage steps down so the whiteboard can draw on her line", () => {
  const id = "m-6"; setup(id, { onScreen: { intentId: "g", kind: "game", state: "in_use", source: "stagecraft", revealedTurn: 8 } });
  const v = bridge.augmentView(id, { statuses: [], onScreen: { kind: "game" } }, pointFor(id, { request: { kind: "board_request", seq: 9 } }));
  assert.equal(v.propose?.retire, "g");
  bridge.detach(id);
});

test("board sync: the Director's template rung, re-timed to her line, answers at the deadline when it passes; as the last rung it is still re-timed", async () => {
  process.env.TAXILA_BOARD_SYNC_MS = "300";
  const tpl = { ...okScript(3, 9000), ops: okScript(3, 9000).ops.map((o, i) => ({ ...o, startMs: 500 + i * 2500, endMs: 900 + i * 2500 })) };
  const ask = askFor("bs-8", "Dekho, teen boxes ek line mein.", []);
  const r = await boardSync.plan(ask, { kit: null, fallbackScript: tpl, planWhiteboard: async () => (await delay(2000), { ok: false, usd: 0 }) });
  assert.equal(r.source, "template"); assert.ok(r.syncMs < 1200);
  assert.ok(Math.max(...r.script.ops.map((o) => o.endMs)) < 9000, "re-timed to her (shorter) line");
  const rt = boardSync.retimeToLine(tpl, "Dekho, teen boxes.");
  assert.ok(rt.durationMs < tpl.durationMs);
  delete process.env.TAXILA_BOARD_SYNC_MS;
});

test("board sync: an unused speculative board of the same lesson serves the next fresh line when it passes against it (once)", async () => {
  const planner = async () => ({ ok: true, script: okScript(), usd: 0 });
  const a1 = askFor("L9:wb:4", "Teen boxes.");
  boardSync.prepare(a1, { kit, planWhiteboard: planner });
  await boardSync._specs.get("L9:wb:4").promise;
  const a2 = askFor("L9:wb:5", "Dekho, teen boxes ek line mein.");
  const ctx = boardSync.gateCtxFor(a2, { kit });
  const t = boardSync.takeSpec(a2, ctx);
  assert.ok(t?.reused, "the earlier turn's board, re-gated against this line");
  assert.equal(boardSync.takeSpec(askFor("L9:wb:6", "Teen boxes."), ctx), null, "used once");
  assert.equal(boardSync.takeSpec({ ...askFor("L8:wb:1", "x"), mode: "continue" }, ctx), null);
});
test("board sync: the topic's catalogue boards are code-board candidates (re-gated against her line)", async () => {
  const k = kitFromFileFor("c5-maths-ch02-t01");
  const ask = { intent: { intentId: "cb-1", lessonId: "L", kind: "whiteboard", style: { band: "B3" } }, line: { lessonId: "L", text: "Dekho, 3/4 ka matlab hai chaar barabar hisson mein se teen." }, mode: "fresh", kit: { topicId: "c5-maths-ch02-t01", content: [] } };
  const r = boardSync.codeBoard(ask, { kit: k, lessonId: "L" }, boardSync.gateCtxFor(ask, { kit: k }));
  assert.ok(r?.ok, "a kit board passes against her line");
  assert.equal(r.gate.pass, true);
});
function kitFromFileFor(t) { return globalThis.__kits?.[t]; }

test("spec chain: DEPLOY_STAGECRAFT_SPEC (owner action O-1) goes first; unset keeps the background twin; never a live-path lane", async () => {
  assert.deepEqual(specChainCfg({}), {});
  const c = specChainCfg({ DEPLOY_STAGECRAFT_SPEC: "taxila-stagecraft" });
  assert.deepEqual(c.chains.spec, ["taxila-stagecraft", "taxila-fast-bg"]);
  assert.deepEqual(c.absent, []);
  const { pickDeployment } = await import("../server/stagecraft/quota.js");
  const { DEFAULT_CONFIG } = await import("../server/stagecraft/config.js");
  const bad = specChainCfg({ DEPLOY_STAGECRAFT_SPEC: "taxila-fast" });
  assert.equal(pickDeployment({}, "spec", { ...DEFAULT_CONFIG, ...bad }, 0), "taxila-fast-bg", "the reply lane is refused even when named; the twin serves");
});
