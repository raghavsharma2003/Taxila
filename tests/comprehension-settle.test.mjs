// Held-verdict settle (BUILD-PLAN W1-C #2; comprehension audit G2). The why-probe's blind verdict used to live only in
// an in-process map read WITHOUT waiting at the next turn: prod settle was 0/5 at a 0 s reply. Now the next turn waits
// up to 600 ms, verdicts are read by event id from pending_grade on any replica, a verdict that lands after the fold is
// applied once as a correction (`<id>:late`, U/T only), and every turn logs a settle line. No network, no database:
// the store is injected.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { gradeLater, settleHeld, settledGrade, awaitGrade, forgetGrade, lateEvent, finalEvent, lessonOfEvent, settleStats,
  _setStore, _resetSettleStats, LATE_VIA } from "../server/comprehension/later.js";
import { awaitSettled } from "../server/comprehension/session.js";
import { newLearnerState, fuseEvidence } from "../server/comprehension/fuse.js";
import { outcomeIndex } from "../server/learner/kt/outcomes.js";

const LESSON = "11111111-1111-4111-8111-111111111111";
let n = 0;
const why = () => ({ id: `${LESSON}:${++n}:0`, sessionId: LESSON, sessionStartAt: "2026-10-04T05:00:00.000Z", at: "2026-10-04T05:01:00.000Z",
  episodeId: `${LESSON}:why${n}`, skillIds: ["s1"], target: "s1", cls: "probe.why", outcome: outcomeIndex("probe.why", "full"), grader: "llm", via: "dialogue" });
const PRESENT = [{ label: "present", spanOk: true, op: "R-EXP", targetId: "s1:e1", graderVersion: "g", model: "m", ms: 5, span: "both pieces from the same roti" }];
const req = { childText: "both pieces from the same roti", targets: [{ id: "s1:e1", textEn: "equal parts of one whole" }] };
const gradeIn = (ms, results = PRESENT) => () => new Promise((r) => setTimeout(() => r(results[0]), ms));

/** An in-memory pending_grade with the same row-lock semantics (each call is atomic). */
function memStore() {
  const rows = new Map(), calls = { persist: [], claim: [], read: 0, correct: [] };
  return {
    rows, calls,
    async persist(id, lessonId, results) {
      calls.persist.push({ id, results });
      const r = rows.get(id) ?? { fallback: false, corrected: false };
      r.results = results; rows.set(id, r);
      return { fallback: r.fallback && !r.corrected, written: true };
    },
    async claim(ids) {
      calls.claim.push(ids);
      const out = {};
      for (const id of ids) { const r = rows.get(id) ?? { results: null, corrected: false }; r.fallback = true; rows.set(id, r); if (r.results) out[id] = r.results; }
      return out;
    },
    async read(ids) { calls.read++; return Object.fromEntries(ids.filter((id) => rows.get(id)?.results).map((id) => [id, rows.get(id).results])); },
    async correct(ev, results) { calls.correct.push({ ev, results }); const r = rows.get(ev.id); if (r.corrected) return false; r.corrected = true; return true; },
  };
}
const quiet = (fn) => async (...a) => { const i = console.info; console.info = () => {}; try { return await fn(...a); } finally { console.info = i; } };
beforeEach(() => _resetSettleStats());

test("a verdict that lands within 600 ms is folded at the next turn (the 0 s reply case)", quiet(async () => {
  const s = memStore(); _setStore(s);
  const ev = why();
  gradeLater(ev, req, { grade: gradeIn(150) });
  assert.equal(settledGrade(ev.id), undefined, "not in yet when the child answers at once");
  const t0 = Date.now();
  const r = await settleHeld([ev.id], 600);
  assert.ok(Date.now() - t0 < 500, "it returns as soon as the verdict lands, not at the deadline");
  assert.equal(r.settled, 1); assert.deepEqual(r.fallback, []);
  assert.equal(settledGrade(ev.id)[0].label, "present");
  assert.deepEqual(s.calls.claim, [], "nothing is claimed");
  await new Promise((r2) => setTimeout(r2, 20));
  assert.equal(s.calls.persist.length, 1, "the verdict is written by event id");
  assert.equal(s.calls.persist[0].results[0].span, null, "never the child's verbatim span");
  assert.equal(s.calls.correct.length, 0);
  forgetGrade(ev.id);
}));

test("a verdict later than the wait: the turn claims the fallback, and the late verdict becomes ONE correction", quiet(async () => {
  const s = memStore(); _setStore(s);
  const ev = why();
  const p = gradeLater(ev, req, { grade: gradeIn(250) });
  const r = await settleHeld([ev.id], 60);
  assert.deepEqual(r.fallback, [ev.id]);
  assert.deepEqual(s.calls.claim, [[ev.id]]);
  assert.equal(settledGrade(ev.id), undefined);
  await p; await new Promise((r2) => setTimeout(r2, 20));
  assert.equal(settledGrade(ev.id), undefined, "a claimed fallback never turns into a folded verdict as well (no double count)");
  assert.equal(s.calls.correct.length, 1, "the verdict is applied as a correction");
  assert.equal(settleStats().late, 1);
  forgetGrade(ev.id);
}));

test("another replica graded it: the verdict is read from pending_grade by event id", quiet(async () => {
  const s = memStore(); _setStore(s);
  const ev = why();
  setTimeout(() => s.persist(ev.id, LESSON, PRESENT), 150);  // lands on the other replica while this turn waits
  const r = await settleHeld([ev.id], 600);
  assert.equal(r.settled, 1); assert.equal(r.via.db, 1);
  assert.ok(s.calls.read >= 2, "polled");
  assert.equal(settledGrade(ev.id)[0].label, "present");
  forgetGrade(ev.id);
}));

test("the verdict lands elsewhere between the deadline and the claim: the claim returns it and the turn folds it", quiet(async () => {
  const s = memStore(); _setStore(s);
  const ev = why();
  const realRead = s.read; s.read = async () => ({});       // the polls miss it ...
  s.rows.set(ev.id, { results: PRESENT, fallback: false, corrected: false }); // ... but it is in when the claim runs
  const r = await settleHeld([ev.id], 30);
  s.read = realRead;
  assert.equal(r.settled, 1); assert.deepEqual(r.fallback, []);
  assert.equal(settledGrade(ev.id)[0].label, "present");
  forgetGrade(ev.id);
}));

test("no store (database down): an unsettled event falls back after the wait, never throws", quiet(async () => {
  _setStore({ persist: async () => { throw new Error("down"); }, claim: async () => { throw new Error("down"); }, read: async () => { throw new Error("down"); }, correct: async () => false });
  const warn = console.warn; console.warn = () => {};
  try {
    const ev = why();
    const r = await settleHeld([ev.id], 50);
    assert.deepEqual(r.fallback, [ev.id]);
    await awaitSettled([ev.id], 20);                             // the seam never rejects
    assert.equal(await awaitGrade(ev.id, 10), undefined);
    assert.deepEqual(await settleHeld([], 600), { held: 0, settled: 0, fallback: [], waitedMs: 0, via: { local: 0, db: 0 } });
  } finally { console.warn = warn; }
}));

test("lateEvent: deterministic id, via late, the grader's outcome and span check; nothing when every target is NA", () => {
  const ev = { ...why(), outcome: outcomeIndex("probe.why", "none") };
  const late = lateEvent(ev, PRESENT);
  assert.equal(late.id, `${ev.id}:late`); assert.equal(late.via, LATE_VIA);
  assert.equal(late.outcome, outcomeIndex("probe.why", "full")); assert.equal(late.spanOk, true); assert.equal(late.grader, "llm");
  assert.equal(lateEvent(ev, [{ label: "NA", spanOk: false, op: "R-EXP", targetId: "s1:e1" }]), null);
  assert.equal(lessonOfEvent(ev.id), LESSON); assert.equal(lessonOfEvent("nope:1:0"), null);
});

test("folding a correction: K is untouched (the fallback took the K step), U moves, replay of both rows is stable", () => {
  const ev = why();
  const fallback = finalEvent(ev, undefined).event;                       // what the turn folded: classifier outcome, spanOk false
  const s0 = newLearnerState({ childId: "c", classLevel: 5 });
  const s1 = fuseEvidence(s0, [{ ...fallback, seq: 1 }]);
  const late = { ...lateEvent(ev, PRESENT), seq: 2 };
  const s2 = fuseEvidence(s1, [late]);
  assert.equal(s2.ledger.skills.s1.pL, s1.ledger.skills.s1.pL, "no second K step");
  assert.equal(JSON.stringify(s2.ledger.ability), JSON.stringify(s1.ledger.ability), "no θ observation");
  assert.ok(s1.comp.skills.s1.U.p === s0.comp.skills.s1?.U.p || s1.comp.skills.s1.U.n === 0, "the unchecked positive carried no U (E6)");
  assert.ok(s2.comp.skills.s1.U.p > s1.comp.skills.s1.U.p, "the late checked verdict moves U");
  assert.equal(s2.ledger.seen[late.id], 2, "the ledger records it (writer stages it; seq order holds)");
  assert.equal(s2.ledger.lastSeq, 2);
  const replay = fuseEvidence(s0, [{ ...fallback, seq: 1 }, late]);
  assert.equal(JSON.stringify(replay.comp.skills), JSON.stringify(s2.comp.skills), "replay = online");
  assert.equal(JSON.stringify(fuseEvidence(s2, [late]).comp), JSON.stringify(s2.comp), "re-delivery is a no-op");
});

test("a why is folded as soon as ONE target comes back present with a checked span (the slower targets cannot change it)", quiet(async () => {
  const s = memStore(); _setStore(s);
  const ev = why();
  const two = { ...req, targets: [{ id: "s1:e1", textEn: "a" }, { id: "s1:e2", textEn: "b" }] };
  let call = 0;
  const grade = (r) => new Promise((res) => { const i = call++; setTimeout(() => res(i === 0 ? { ...PRESENT[0], targetId: r.target.id } : { label: "absent", spanOk: false, op: "R-EXP", targetId: r.target.id }), i === 0 ? 60 : 900); });
  gradeLater(ev, two, { grade });
  const t0 = Date.now();
  const r = await settleHeld([ev.id], 600);
  assert.equal(r.settled, 1); assert.ok(Date.now() - t0 < 400, "decided by the first present, not the 900 ms target");
  const got = settledGrade(ev.id);
  assert.equal(got.length, 2);
  assert.equal(got.filter((x) => x.op).length, 1, "the pending target is a placeholder with no op (never audited)");
  const fe = finalEvent(ev, got);
  assert.equal(fe.graded, true); assert.equal(fe.event.spanOk, true);
  assert.equal(fe.event.outcome, outcomeIndex("probe.why", "full"));
  assert.deepEqual(s.calls.claim, []);
  forgetGrade(ev.id);
}));

test("a teach-back waits for every target (its coverage rule needs all of them)", quiet(async () => {
  const s = memStore(); _setStore(s);
  const ev = { ...why(), cls: "probe.teachback", outcome: outcomeIndex("probe.teachback", "high") };
  const two = { ...req, targets: [{ id: "s1:e1", textEn: "a" }, { id: "s1:e2", textEn: "b" }] };
  let call = 0;
  const grade = (r) => new Promise((res) => { const i = call++; setTimeout(() => res({ ...PRESENT[0], targetId: r.target.id }), i === 0 ? 30 : 700); });
  const p = gradeLater(ev, two, { grade });
  const r = await settleHeld([ev.id], 200);
  assert.equal(r.settled, 0, "not decided by one target");
  await p; await new Promise((r2) => setTimeout(r2, 20));
  assert.equal(s.calls.correct.length, 1, "it lands as a correction instead");
  forgetGrade(ev.id);
}));

// Settle BESIDE the classifier (seam-patches/w1c-lesson-early-grade.patch; fixer finding: a serial 600 ms wait after
// a post-commit grade settled 0/4 at a 0 s reply): the wait lasts until both 600 ms have passed and the classifier is
// done, capped; it never outlasts max(600 ms, classifier).
test("until: a verdict that lands while the classifier still runs is folded; the wait ends with the classifier", quiet(async () => {
  const s = memStore(); _setStore(s);
  const ev = why();
  gradeLater(ev, req, { grade: gradeIn(900) });
  let release; const cls = new Promise((r) => { release = r; });
  setTimeout(release, 1200);                                   // the classifier takes 1.2 s
  const t0 = Date.now();
  const r = await settleHeld([ev.id], 600, { until: cls });
  const waited = Date.now() - t0;
  assert.equal(r.settled, 1, "the 900 ms verdict is in: past the old 600 ms deadline, inside the classifier's time");
  assert.ok(waited >= 850 && waited < 1150, `returns when the verdict lands (${waited} ms), not at the classifier's end`);
}));

test("until: an unsettled verdict holds the turn no longer than max(600 ms, classifier), and is claimed", quiet(async () => {
  const s = memStore(); _setStore(s);
  const a = why(), b = why();
  gradeLater(a, req, { grade: gradeIn(3000) });
  gradeLater(b, req, { grade: gradeIn(3000) });
  // fast classifier (100 ms): the 600 ms floor holds
  let t0 = Date.now();
  let r = await awaitSettled([a.id], 600, { until: new Promise((res) => setTimeout(res, 100)) }).then(() => null);
  let waited = Date.now() - t0;
  assert.ok(waited >= 580 && waited < 800, `fast classifier: the 600 ms floor (${waited} ms)`);
  assert.deepEqual(s.calls.claim.at(-1), [a.id], "claimed at the deadline");
  // slow classifier (1 s): the wait ends with it
  t0 = Date.now();
  r = await settleHeld([b.id], 600, { until: new Promise((res) => setTimeout(res, 1000)) });
  waited = Date.now() - t0;
  assert.equal(r.settled, 0);
  assert.ok(waited >= 980 && waited < 1200, `slow classifier: ends with it (${waited} ms)`);
  // a hung classifier: the cap holds
  const c = why();
  gradeLater(c, req, { grade: gradeIn(5000) });
  t0 = Date.now();
  r = await settleHeld([c.id], 100, { until: new Promise(() => {}), capMs: 400 });
  waited = Date.now() - t0;
  assert.ok(waited >= 380 && waited < 600, `hung classifier: capped (${waited} ms)`);
  assert.equal(r.fallback.length, 1);
}));

test("a late correction keeps its held event's source weight (game / module), never full weight", async () => {
  const { temper, sourceOf } = await import("../server/learner/kt/bktr.js");
  const dlg = lateEvent(why(), PRESENT), mod = lateEvent({ ...why(), via: "module" }, PRESENT), game = lateEvent({ ...why(), via: "game" }, PRESENT);
  assert.ok(dlg.id.endsWith(":late") && mod.id.endsWith(":late:module") && game.id.endsWith(":late:game"));
  for (const e of [dlg, mod, game]) assert.equal(e.via, LATE_VIA);
  assert.deepEqual([sourceOf(dlg), sourceOf(mod), sourceOf(game)], ["late", "module", "game"]);
  assert.deepEqual([temper(dlg), temper(mod), temper(game)], [1, 0.75, 0.5]);
  assert.equal(temper({ via: "module", id: "x" }), 0.75, "an ordinary event: its own via, as before");
});

test("pregrade: a grade started before the turn is classified is adopted by gradeLater, never run twice", quiet(async () => {
  const s = memStore(); _setStore(s);
  const { pregrade } = await import("../server/comprehension/later.js");
  let calls = 0;
  const grade = () => { calls++; return new Promise((r) => setTimeout(() => r(PRESENT[0]), 300)); };
  const ev = why();
  assert.equal(pregrade(LESSON, req, { grade }), true);
  assert.equal(pregrade(LESSON, req, { grade }), true, "a resend does not start a second grade");
  await new Promise((r) => setTimeout(r, 200));                   // the classifier and the plan take 200 ms
  gradeLater(ev, req, { grade });
  assert.equal(calls, 1, "one R-EXP call for the one target: the pregrade's");
  const t0 = Date.now();
  const r = await settleHeld([ev.id], 600);
  assert.equal(r.settled, 1);
  assert.ok(Date.now() - t0 < 250, "it lands ~100 ms after the plan: the 200 ms before it were already graded");
  // a different answer text is a different request: graded on its own
  const ev2 = why();
  gradeLater(ev2, { ...req, childText: "something else entirely" }, { grade });
  assert.equal(calls, 2);
  assert.equal(pregrade(LESSON, { childText: "", targets: req.targets }, { grade }), false, "nothing to grade: nothing started");
}));

test("hedge: a grader call still out after HEDGE_MS is sent once more; the first real verdict wins", quiet(async () => {
  const s = memStore(); _setStore(s);
  const { HEDGE_MS, gradeHedgeStats } = await import("../server/comprehension/later.js");
  const h0 = gradeHedgeStats();
  let n = 0;
  // the first call hangs in the tail (6 s); the hedge answers in 200 ms
  const grade = () => { n++; const ms = n === 1 ? 6000 : 200; return new Promise((r) => setTimeout(() => r({ ...PRESENT[0], model: `call${n}` }), ms)); };
  const ev = why();
  const t0 = Date.now();
  const res = await gradeLater(ev, req, { grade });
  const took = Date.now() - t0;
  assert.equal(n, 2, "one hedge");
  assert.equal(res[0].model, "call2"); assert.equal(res[0].hedged, true);
  assert.ok(took >= HEDGE_MS && took < HEDGE_MS + 600, `lands at ≈ HEDGE_MS + 200 ms (${took} ms), not at 6 s`);
  assert.ok(res[0].ms >= HEDGE_MS, "ms runs from the first call");
  const h1 = gradeHedgeStats();
  // (≥: earlier tests' deliberately slow grades are still in flight and hedge in this window too)
  assert.ok(h1.hedged - h0.hedged >= 1 && h1.hedgeWon - h0.hedgeWon >= 1, JSON.stringify([h0, h1]));
  // a fast call is never hedged
  n = 10;
  const fast = () => { n++; return new Promise((r) => setTimeout(() => r(PRESENT[0]), 50)); };
  await gradeLater(why(), req, { grade: fast });
  assert.equal(n, 11);
}));
