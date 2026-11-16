import { initLessonState, step } from "/home/user/Taxila/server/director/state.js";
import { kit, CTX, cls } from "/home/user/Taxila/tests/fixtures/kit.mjs";
const K = kit(); const NE = cls("no_evidence");
const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
for (const seed of [1,2,3,4,5,6]) {
let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX }, seed, now: 0 }), { event: "start", kit: K, now: 0 });
console.log("seed", seed, r.state.teachPlan, r.state.guidance);
for (let i=0;i<10 && r.state.phase!=="practice";i++){ r = turn(r, i>3?{...NE,flags:{...NE.flags,dontKnow:true}}:NE, {text:"x"}); console.log(" ", r.move.kind, r.state.phase, JSON.stringify(r.move.shape).slice(0,140), JSON.stringify(r.move.content??r.move.lines)?.slice(0,120)); }
}
