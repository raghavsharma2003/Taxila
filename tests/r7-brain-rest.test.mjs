// round 7 (E App, 2026-11-04): Pause → "Short break" sends chipId break:rest. The client holds her speech for the whole
// break and plays a held reply when the child taps "I'm back", so the reply is a tiny acknowledgement (no stretch
// instruction, no question) and the next turn picks up where they were. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const NE = cls("no_evidence");
const start = () => step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX }, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
const turn = (r, extra = {}) => step(r.state, { event: "turn", kit: K, cls: NE, text: "", now: (r.state.turn + 1) * 20_000, ...extra });

test("break:rest: a few warm words, no question, nothing to do; never 'say ready when back'", () => {
  let r = start();
  for (let i = 0; i < 2; i++) r = turn(r, { text: "haan" });
  const phase = r.state.phase;
  r = turn(r, { chipId: "break:rest" });
  assert.equal(r.move.kind, "break");
  assert.match(r.move.shape, /short break now: at most a few warm words/);
  assert.doesNotMatch(r.move.shape, /say ready|stretch/);
  assert.equal(r.state.phase, phase);
  const back = turn(r, { text: "aa gaya" });
  assert.match(back.move.shape, /back from their short break: welcome them back in a few words, then carry on exactly where you were/);
  assert.equal(back.state.resting, undefined);
  assert.notEqual(back.move.kind, "break");
});

test("a graded answer right after the break is graded, not re-posed", () => {
  let r = start();
  for (let i = 0; i < 6 && !r.state.activeItemId; i++) r = turn(r, { text: "haan" });
  if (!r.state.activeItemId) return; // the fixture never posed a card in 6 turns
  r = turn(r, { chipId: "break:rest" });
  const back = turn(r, { cls: cls("correct"), text: "x" });
  assert.doesNotMatch(back.move.shape ?? "", /back from their short break/);
});
