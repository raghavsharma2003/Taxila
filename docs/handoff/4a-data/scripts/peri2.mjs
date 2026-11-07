import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { initLessonState, step } from "/home/user/Taxila/server/director/state.js";
import { targetFor, classifyFast } from "/home/user/Taxila/server/director/classify.js";
import { CTX, cls } from "/home/user/Taxila/tests/fixtures/kit.mjs";
const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
const NE = cls("no_evidence");
for (const seed of [1, 2, 3, 4]) for (const ctx of [{ ...CTX, classLevel: 6 }, { ...CTX, classLevel: 6, novice: true }]) {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx, seed, now: 0 }), { event: "start", kit: K, now: 0 });
  const seq = [];
  for (let i = 0; i < 6; i++) {
    const it = r.move.itemId; const tgt = targetFor(r.state, K, it ? null : null);
    seq.push(`${r.move.kind}${it ? ":" + it.slice(-5) : ""}[${(r.ui?.whiteboard?.value ?? "").toString().slice(0, 30)}]`);
    r = step(r.state, { event: "turn", kit: K, cls: NE, text: "130 metre", now: (i + 1) * 20000 });
  }
  console.log(seed, ctx.novice ? "novice" : "plain ", r.state.guidance?.level, seq.join(" → "));
}
