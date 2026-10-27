import { initLessonState, step } from "/home/user/Taxila/server/director/state.js";
import { kit, CTX, cls } from "/home/user/Taxila/tests/fixtures/kit.mjs";
const K = kit();
const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
const NE = cls("no_evidence");
const DK = { ...NE, flags: { ...NE.flags, dontKnow: true } };
const OFF = { ...NE, flags: { ...NE.flags, offTopic: true } };
for (const [name, reply] of [["engaged", NE], ["dontknow", DK], ["off", OFF]]) for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX }, seed, now: 0 }), { event: "start", kit: K, now: 0 });
  const seq = [];
  for (let i = 0; i < 14; i++) {
    if (seq.some((x) => x.startsWith("=>"))) { seq.push(`${r.move.kind}${r.move.itemId ? ":" + r.move.itemId : ""}`); if (seq.length > 9) break; r = turn(r, NE); continue; }
    seq.push(`${r.move.kind}${r.move.itemId ? ":" + r.move.itemId : ""}`);
    if (r.move.kind === "worked_example" && r.state.teachPlan[r.state.teachIdx] === "fade") { r = turn(r, reply, { text: "x" }); seq.push(`=>${r.move.kind}${r.move.itemId ? ":" + r.move.itemId : ""}`); break; }
    r = turn(r, NE);
  }
  console.log(name, seed, r.state.guidance?.level, seq.join(" "));
}
