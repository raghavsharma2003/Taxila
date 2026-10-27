import { initLessonState, step } from "/home/user/Taxila/server/director/state.js";
import { instructionsFor } from "/home/user/Taxila/server/compiler/instructions.js";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { CTX, BRIEF } from "/home/user/Taxila/tests/fixtures/kit.mjs";
let worst = 0, n = 0, err = 0;
for (const id of ["c4-maths-ch08-t01", "c7-maths-ch08-t01", "c6-science-ch01-t01", "c5-evs-ch01-t01", "c9-science-ch01-t01"]) {
  const t = getTopic(id); if (!t) continue; const K = kitFromFile(t);
  const history = Object.fromEntries(K.skills.map((s) => [s.id, ["correct", "incorrect"]]));
  for (const ctx of [{ ...CTX }, { ...CTX, renamed: true, hasCallback: true, firstMeeting: false, interests: ["cricket"] }, { ...CTX, firstMeeting: true, address: "aap" }]) {
    const r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...ctx, topicTitle: t.title }, seed: 3, now: 0, history }), { event: "start", kit: K, now: 0 });
    try { for (const lane of ["text","voice"]) instructionsFor({ ...r.state, brief: BRIEF, mode: lane }, K, lane); n++; worst = Math.max(worst, r.move.shape.length); } catch (e) { err++; console.log(id, e.message.slice(0, 200)); }
  }
}
console.log({ n, err, worstShapeChars: worst });
