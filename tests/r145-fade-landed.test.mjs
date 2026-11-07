// census 14.5 (F8, 3437b744 t9-13): the faded step (a gap in the worked example) was posed right after the worked lead,
// whatever the child said to it. A don't-know or an off-topic reply to the worked steps now gets the whole worked example
// instead, then practice; an engaged reply still gets the gap. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const NE = cls("no_evidence");
const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
const withFlag = (f) => ({ ...NE, flags: { ...NE.flags, [f]: true } });
function toLead(seed) {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX }, seed, now: 0 }), { event: "start", kit: K, now: 0 });
  for (let i = 0; i < 12 && !(r.move.kind === "worked_example" && r.state.teachPlan[r.state.teachIdx] === "fade"); i++) r = turn(r, NE);
  assert.equal(r.state.teachPlan[r.state.teachIdx], "fade", "the lesson reaches the worked lead with a faded step next");
  return r;
}

test("a don't-know or an off-topic reply to the worked lead: the whole worked example, then practice; the gap is never posed", () => {
  for (const seed of [1, 2, 3]) for (const f of ["dontKnow", "offTopic"]) {
    let r = turn(toLead(seed), withFlag(f), { text: "x" });
    assert.equal(r.move.kind, "worked_example", `${f} seed ${seed}`);
    assert.equal(r.state.guidance.reason, "fade.not_landed");
    const kinds = [r.move.itemId ?? r.move.kind];
    for (let i = 0; i < 6 && r.state.phase !== "practice"; i++) { r = turn(r, NE); kinds.push(r.move.itemId ?? r.move.kind); }
    assert.equal(r.state.phase, "practice", kinds.join(" "));
    assert.ok(!kinds.some((k) => String(k).startsWith("fade:")), kinds.join(" "));
  }
});

test("an engaged reply to the worked lead still gets the faded step", () => {
  const r = turn(toLead(1), NE, { text: "haan" });
  assert.match(String(r.move.itemId), /^fade:/);
});
