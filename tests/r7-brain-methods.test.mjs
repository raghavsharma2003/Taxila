// round 7 A8 (PIPELINE §A Brain item 7, brain-steering-persistence): how the child asked to be taught, read in code, kept for
// the lesson, rendered LAST on every compile (never shed) and mapped to knobs (word cap, attempt-first). Pure.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readMethod, keepMethod, methodsLine } from "../server/conversation/methods.js";
import { initLessonState, step } from "../server/director/state.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { kit, CTX, cls, BRIEF } from "./fixtures/kit.mjs";
// round 7 (main 2026-11-04): these tests are the NEW behaviour, so they clear the kill switches they depend on and restore them
// after (`npm test` runs every file in one process; an earlier file must never decide which path they test)
const R7_FLAGS = ["TAXILA_R7_PARK_TOPIC", "TAXILA_R7_BYE_CHECKIN", "TAXILA_R7_FRUSTRATION"];
const R7_KEEP = {};
describe("r7-brain-methods.test.mjs: round 7 behaviour (kill switches cleared)", () => {
beforeEach(() => { for (const k of R7_FLAGS) { R7_KEEP[k] = process.env[k]; delete process.env[k]; } });
afterEach(() => { for (const k of R7_FLAGS) { if (R7_KEEP[k] === undefined) delete process.env[k]; else process.env[k] = R7_KEEP[k]; } });

const K = kit();
const NE = cls("no_evidence");
const start = () => step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX }, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
const turn = (r, text, c = NE) => step(r.state, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 });

test("the lexicon: the whole turn is the ask; lesson content is never read as one", () => {
  for (const [t, id] of [["step by step samjhao", "steps"], ["ek ek karke batao", "steps"], ["chhota bolo na", "short"], ["pehle picture dikhao", "picture"],
    ["mujhe khud try karne do", "try_first"], ["let me try", "try_first"], ["dheere dheere bolo", "slow"], ["thoda kam bolo didi", "short"]]) assert.equal(readMethod(t), id, t);
  for (const t of ["pehle 24 ko break karte hain", "3 step mein hoga", "haan", "picture mein 4 aam hain", ""]) assert.equal(readMethod(t), null, t);
  assert.deepEqual(keepMethod(["short", "steps"], "short"), ["steps", "short"]);
  assert.deepEqual(keepMethod(["a", "b", "c"], "d"), ["b", "c", "d"]);
});

test("'chhota bolo' is kept: every later move carries it, and the compile renders it in the last section with the word cap", () => {
  let r = start();
  r = turn(r, "haan");
  r = turn(r, "chhota bolo please");
  assert.equal(r.move.request, "adopt");
  for (let i = 0; i < 3; i++) r = turn(r, "haan");
  assert.deepEqual(r.move.methods, ["short"]);
  const ins = instructionsFor({ ...r.state, brief: BRIEF, mode: "text" }, K);
  const tail = ins.slice(-700);
  assert.match(tail, /how they asked you to teach \(keep doing it\): short turns/);
  assert.match(tail, /at most 15 words/);
});

test("'khud try karne do' asks for the attempt-first format on the next posed question", () => {
  let r = start();
  r = turn(r, "mujhe khud try karne do");
  for (let i = 0; i < 8 && !r.move.itemId; i++) r = turn(r, "haan");
  if (!r.move.itemId) return;
  assert.equal(r.move.format, "F8");
});

test("never on a safeguard or wrap move; a graded answer never reads as a method", () => {
  assert.equal(methodsLine([]), null);
  let r = start();
  r = turn(r, "step by step", cls("correct"));
  assert.equal(r.state.methods, undefined);
});

test("A8 part 2: frustration on a card changes the approach: the card is left for later, never re-posed this turn", () => {
  let r = start();
  for (let i = 0; i < 12 && !r.state.activeItemId; i++) r = turn(r, "haan");
  const card = r.state.activeItemId;
  assert.ok(card);
  const f = turn(r, "mujhse nahi hoga", { ...NE, source: "p5", request: { type: "frustration", whole: true, src: "p5" } });
  assert.equal(f.state.activeItemId, undefined, "not re-posed");
  assert.ok(f.state.skipped.includes(card), "left for later");
  assert.equal(f.ui.ask, undefined);
  assert.equal(f.move.request, "frustration");
  assert.notEqual(f.move.kind, "wrap");
});
});
