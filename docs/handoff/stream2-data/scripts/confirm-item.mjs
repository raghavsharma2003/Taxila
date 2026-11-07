import { initLessonState, step } from "/home/user/Taxila/server/director/state.js";
import { kit as mk, CTX, cls } from "/home/user/Taxila/tests/fixtures/kit.mjs";
const kit = mk();
let r = step(initLessonState({ topicId: kit.topicId, kit, ctx: CTX, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
let now = 0;
for (let i = 0; i < 30 && r.state.phase !== "done"; i++) {
  const posed = r.move.itemId;
  const outcome = posed ? "correct" : "no_evidence";
  const prevKind = r.move.kind;
  r = step(r.state, { event: "turn", kit, cls: cls(outcome), text: "ok", now: (now += 10_000) });
  if (posed) console.log(JSON.stringify({ answered: posed, prevKind, nextKind: r.move.kind, nextItem: r.move.itemId ?? null, active: r.state.activeItemId ?? null, hint: r.state.hintLevel, pendingWhy: r.state.pendingWhy ?? null, probe: r.move.probe ?? null }));
}
