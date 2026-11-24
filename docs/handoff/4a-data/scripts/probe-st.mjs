import { initLessonState, step } from "/home/user/Taxila/server/director/state.js";
import { requestOf } from "/home/user/Taxila/server/director/requests.js";
import { classifyFast } from "/home/user/Taxila/server/director/classify.js";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { CTX, cls } from "/home/user/Taxila/tests/fixtures/kit.mjs";
const id = process.argv[2] ?? "c5-maths-ch03-t01";
const K = kitFromFile(getTopic(id));
console.log(id, K.workedExample?.problem);
const NE = cls("no_evidence");
const say = (r, text) => { const q = requestOf(text); const dk = /pata nahi|samajh nahi/.test(text); return step(r.state, { event: "turn", kit: K, cls: q ? { ...NE, source: "request", request: q } : dk ? { ...NE, flags: { ...NE.flags, dontKnow: true } } : NE, text, now: (r.state.turn + 1) * 20_000 }); };
for (const seed of [1,2,3]) {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6 }, seed, now: 0 }), { event: "start", kit: K, now: 0 });
  console.log("seed", seed, r.move.kind, r.state.teachPlan, "req", JSON.stringify(requestOf("samajh nahi aaya, ek example se samjhao")));
  for (const t of ["samajh nahi aaya, ek example se samjhao", "pata nahi", "pata nahi", "pata nahi"]) { r = say(r, t); console.log("  ", t, "→", r.move.kind, r.move.request ?? "", r.state.guidance?.reason, "|", r.move.shape.slice(0, 150)); }
}
