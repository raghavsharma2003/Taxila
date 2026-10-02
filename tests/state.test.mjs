import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step, evidenceFrom, shouldAskWhy, LIMITS } from "../server/director/state.js";
import { applyEvidence, newSkillState } from "../server/learner/bkt.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const fresh = (over = {}) => initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0, ...over });
const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
const NE = cls("no_evidence");

/** Drive a new (novice) learner from the greeting to the first practice item. */
function toPractice() {
  let r = step(fresh(), { event: "start", kit: K, now: 0 });
  while (r.state.phase !== "practice" || !r.move.itemId) r = turn(r, NE);
  return r;
}

test("start: greet, then hook → explain → worked example for a novice, then the first item", () => {
  let r = step(fresh(), { event: "start", kit: K, now: 0 });
  assert.equal(r.move.kind, "greet");
  assert.match(r.move.shape, /AI teacher/, "first meeting names the teacher as an AI");
  const kinds = [];
  while (!r.move.itemId) { r = turn(r, NE); kinds.push(r.move.kind); }
  assert.deepEqual(kinds, ["hook", "explain", "worked_example", "worked_example", "practice"]);
  assert.match(r.state.queue[1], /^diag:/, "a spoken diagnostic is second in line");
});

test("experienced learner attempts first (expertise reversal): no worked example, F8 first item", () => {
  const skills = { [K.skills[0].id]: { ...newSkillState(K.skills[0].id, "T3"), pKnown: 0.7, status: "learned_today", attempts: 4, correctUnaided: 3, generativePass: true } };
  let r = step(fresh({ skills }), { event: "start", kit: K, now: 0 });
  const kinds = [];
  while (!r.move.itemId) { r = turn(r, NE); kinds.push(r.move.kind); }
  assert.deepEqual(kinds, ["hook", "practice"]);
  assert.equal(r.move.format, "F8");
});

test("hint ladder never reveals before rung 4, then poses an isomorphic item", () => {
  let r = toPractice();
  const item = r.item;
  const levels = [];
  for (let i = 0; i < 4; i++) {
    r = turn(r, cls("incorrect"));
    levels.push(r.move.hintLevel);
    if (r.move.hintLevel < 4) {
      assert.match(r.move.shape, /the key stays unsaid/);
      assert.doesNotMatch(r.move.shape, /say the key plainly/);
      assert.ok(!r.move.shape.includes(item.answer), `rung ${r.move.hintLevel} shape must not carry the key`);
    }
  }
  assert.deepEqual(levels, [1, 2, 3, 4]);
  assert.match(r.move.shape, /say the key plainly/);
  r = turn(r, cls("correct"));
  assert.ok(r.move.itemId && r.move.itemId !== item.id, "an isomorphic item follows the assertion");
  assert.equal(r.item.skillId, item.skillId);
  assert.equal(r.move.hintLevel, 0);
});

test("no evidence is taken after an assertion (the answer was said)", () => {
  let r = toPractice();
  for (let i = 0; i < 4; i++) r = turn(r, cls("incorrect"));
  assert.equal(r.state.hintLevel, 4);
  assert.deepEqual(evidenceFrom(r.state, cls("correct"), K), []);
});

test("a misconception gets one re-teach with the kit's representation, then the ladder", () => {
  let r = toPractice();
  while (!r.item?.targetsMisconception) r = turn(r, cls("correct"));
  const mis = { misconceptionId: "c4-maths-ch05-t01-m1" };
  r = turn(r, cls("misconception", mis));
  assert.equal(r.move.kind, "reteach");
  assert.match(r.move.shape, /two same-size rotis/);
  assert.equal(r.state.flagged[mis.misconceptionId], 1);
  r = turn(r, cls("misconception", mis));
  assert.equal(r.move.kind, "hint", "the same misconception is not re-taught twice in a lesson");
  assert.ok(r.move.hintLevel < 4);
});

test("why-after-correct: always on a new skill, never after a hinted answer", () => {
  let r = toPractice();
  r = turn(r, cls("correct"));
  assert.equal(r.move.kind, "probe");
  assert.equal(r.move.probe, "P2");
  // hinted correct → no why
  r = turn(r, cls("correct"));        // answers the why
  while (!r.move.itemId || r.move.probe === "P2") r = turn(r, cls("correct"));
  r = turn(r, cls("incorrect"));
  assert.equal(r.move.kind, "hint");
  r = turn(r, cls("correct"));
  assert.notEqual(r.move.probe, "P2", "a hinted success is not followed by a why");
});

test("why-after-correct: sampled at ~40% once a skill is consolidating", () => {
  const item = K.items.find((i) => i.kind === "practice");
  let asked = 0;
  const N = 2000;
  for (let seed = 0; seed < N; seed++) {
    if (shouldAskWhy({ seed, turn: 7 }, item, { generativePass: true })) asked++;
  }
  const rate = asked / N;
  assert.ok(Math.abs(rate - LIMITS.whyConsolidating) < 0.05, `rate ${rate}`);
  assert.equal(shouldAskWhy({ seed: 1, turn: 1 }, item, { generativePass: false }), true);
  assert.equal(shouldAskWhy({ seed: 1, turn: 1 }, K.items.find((i) => i.kind === "why"), undefined), false);
});

test("a correct answer with a wrong reason is a misconception flag, not a success (rule 3)", () => {
  let r = toPractice();
  r = turn(r, cls("correct"));
  assert.equal(r.move.probe, "P2");
  const ev = evidenceFrom(r.state, cls("misconception", { misconceptionId: "c4-maths-ch05-t01-m1" }), K);
  assert.equal(ev[0].probe, "P2");
  assert.equal(ev[0].outcome, "misconception");
  r = turn(r, cls("misconception", { misconceptionId: "c4-maths-ch05-t01-m1" }));
  assert.equal(r.move.kind, "reteach");
});

test("full lesson with every answer right reaches learned_today but never mastered (needs a later session)", () => {
  let r = step(fresh(), { event: "start", kit: K, now: 0 });
  const skills = {};
  const startedAt = new Date(0);
  for (let i = 0; i < 60 && !r.end; i++) {
    const c = r.state.phase === "teachback" ? cls("correct", { covered: K.expectations }) : r.move.itemId || r.state.phase === "teachback" ? cls("correct") : NE;
    for (const ev of evidenceFrom(r.state, c, K)) {
      skills[ev.skillId] = applyEvidence(skills[ev.skillId] ?? newSkillState(ev.skillId, "T3", startedAt), ev, { topicType: "T3", now: new Date(i * 20_000), lessonStartedAt: startedAt });
      r.state.skills[ev.skillId] = { ...skills[ev.skillId] };
    }
    r = turn(r, c);
  }
  assert.equal(r.end, true);
  assert.equal(r.move.kind, "wrap");
  const statuses = Object.values(skills).map((s) => s.status);
  assert.ok(statuses.includes("learned_today"), statuses.join(","));
  assert.ok(!statuses.includes("mastered"));
});

test("teach-back runs before the wrap and a pass ends the lesson", () => {
  let r = toPractice();
  r.state.practiced = LIMITS.practiceMax;   // practice budget spent
  r = turn(r, cls("correct"));
  assert.equal(r.move.probe, "P2", "the why on a new skill still comes first");
  r = turn(r, cls("correct"));
  assert.equal(r.move.kind, "teachback");
  assert.equal(r.move.probe, "P1");
  assert.match(r.move.shape, /Golu/);
  const ev = evidenceFrom(r.state, cls("correct", { covered: K.expectations }), K);
  assert.ok(ev.length >= 1 && ev.every((e) => e.probe === "P1"));
  r = turn(r, cls("correct", { covered: K.expectations }));
  assert.equal(r.move.kind, "wrap");
  assert.equal(r.end, true);
});

test("distress goes to the safeguard move before anything else, and stays there", () => {
  let r = toPractice();
  r = turn(r, cls("correct", { flags: { distress: true } }));
  assert.equal(r.move.kind, "safeguard");
  assert.match(r.move.shape, /1098/);
  assert.deepEqual(evidenceFrom(r.state, cls("correct"), K), [], "no evidence is taken while safeguarding");
  r = turn(r, NE);
  assert.equal(r.move.kind, "safeguard");
  r = turn(r, NE);
  assert.equal(r.move.kind, "repair", "only after calm turns does the teacher ask whether to continue");
  assert.ok(r.ui.chips?.some((c) => c.id === "safe:stop"));
});

test("'I want to stop' ends the lesson now; a pata-nahi loop gets a break with choices", () => {
  let r = toPractice();
  const stop = turn(r, cls("no_evidence", { flags: { wantsToStop: true } }));
  assert.equal(stop.move.kind, "wrap");
  assert.equal(stop.end, true);
  const dk = cls("no_evidence", { flags: { dontKnow: true } });
  r = turn(r, dk); r = turn(r, dk); r = turn(r, dk);
  assert.equal(r.move.kind, "break");
  assert.deepEqual(r.ui.chips.map((c) => c.id), ["break:easier", "break:rest", "break:continue"]);
});

test("a diagnostic item shows tap chips, and evidence from a mini-kit weighs half", () => {
  let r = toPractice();
  r = turn(r, cls("correct"));   // why
  r = turn(r, cls("correct"));   // next: diagnostic (after a short explain of its skill)
  while (!r.item?.diagnostic) r = turn(r, NE);
  assert.equal(r.move.probe, "P7");
  assert.equal(r.ui.chips.length, 2);
  const mini = kit(false);
  const evFull = evidenceFrom(r.state, cls("correct"), K)[0];
  const evMini = evidenceFrom(r.state, cls("correct"), mini)[0];
  assert.equal(evMini.weight, evFull.weight / 2);
});

test("step is pure: the input state is not mutated", () => {
  const s = fresh();
  const snapshot = JSON.stringify(s);
  step(s, { event: "start", kit: K, now: 0 });
  assert.equal(JSON.stringify(s), snapshot);
});
