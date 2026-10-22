// QA 14.4.1 (65fae3d0, 3e2fcb15): at the worked example she used a garden of her own (5 and 3, 6 and 4) instead of the kit's
// park, and a "pata nahi" or an off-topic reply got "Pehle 6 plus 4 kitna?". (a) Every worked part names the kit's example
// in LESSON NOW and forbids one of her own; (b) a stuck or off-topic child is shown the steps, never asked to compute.
// Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const NE = cls("no_evidence");
const withFlag = (f) => ({ ...NE, flags: { ...NE.flags, [f]: true } });
const turn = (K, r, c) => step(r.state, { event: "turn", kit: K, cls: c, text: "x", now: (r.state.turn + 1) * 20_000 });
const start = (K, seed) => step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX }, seed, now: 0 }), { event: "start", kit: K, now: 0 });
const ASKS_NEXT = /ask them for the next step/;
const SHOWS = /show this part's steps yourself.*nothing for them to work out/;

test("(a) every worked part is the kit's example from LESSON NOW, never one of her own, and its content is the kit's problem", () => {
  const K = kit();
  for (const seed of [1, 2, 3]) {
    let r = start(K, seed);
    let seen = 0;
    for (let i = 0; i < 12 && r.state.phase !== "practice"; i++) {
      r = turn(K, r, i === 3 ? withFlag("dontKnow") : NE);
      if (r.move.kind !== "worked_example") continue;
      seen += 1;
      assert.match(r.move.shape, /the one in LESSON NOW with its own numbers and names, never an example of your own/);
      assert.ok(r.state.lastContent.includes(`worked example: ${K.workedExample.problem}`), JSON.stringify(r.state.lastContent));
    }
    assert.ok(seen >= 2, `seed ${seed}: worked parts seen ${seen}`);
  }
});

test("(b) a don't-know or an off-topic reply at the worked lead: the steps are shown, nothing to compute", () => {
  const K = kit();
  for (const seed of [1, 2, 3]) for (const f of ["dontKnow", "offTopic"]) {
    let r = start(K, seed);
    for (let i = 0; i < 12 && r.move.kind !== "worked_example"; i++) r = turn(K, r, NE);
    assert.match(r.move.shape, ASKS_NEXT, "an engaged child at the lead is still asked for the next step");
    r = turn(K, r, withFlag(f));
    assert.equal(r.move.kind, "worked_example", `${f} seed ${seed}`);
    assert.match(r.move.shape, SHOWS, `${f} seed ${seed}`);
    assert.doesNotMatch(r.move.shape, ASKS_NEXT);
  }
});

test("(b) a full worked example (no faded step): stuck after part 1 shows part 2; an engaged child is asked for the next step", () => {
  const K = kit();
  K.workedExample = { ...K.workedExample, fadedVersion: undefined };
  const toPart1 = (seed) => {
    let r = start(K, seed);
    for (let i = 0; i < 12 && r.move.kind !== "worked_example"; i++) r = turn(K, r, NE);
    assert.equal(r.move.kind, "worked_example");
    assert.match(r.move.shape, /part 1 of 2/);
    return r;
  };
  for (const seed of [1, 2]) {
    const stuck = turn(K, toPart1(seed), withFlag("dontKnow"));
    assert.equal(stuck.move.kind, "worked_example");
    assert.match(stuck.move.shape, /part 2 of 2/);
    assert.match(stuck.move.shape, SHOWS);
    const engaged = turn(K, toPart1(seed), NE);
    assert.match(engaged.move.shape, /part 2 of 2/);
    assert.match(engaged.move.shape, ASKS_NEXT);
  }
});
