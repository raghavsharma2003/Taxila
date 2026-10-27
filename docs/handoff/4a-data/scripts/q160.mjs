import { initLessonState, step } from "/home/user/Taxila/server/director/state.js";
import { classifyFast, targetFor } from "/home/user/Taxila/server/director/classify.js";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { findItem } from "/home/user/Taxila/server/director/items.js";
import { CTX, cls } from "/home/user/Taxila/tests/fixtures/kit.mjs";
const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
const it = K.items.find((i) => /^160\b/.test(String(i.answer)));
console.log(it?.id, it?.answer, it?.prompt_hi?.slice(0, 80));
let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6 }, seed: 2, now: 0 }), { event: "start", kit: K, now: 0 });
r.state.activeItemId = it.id;
const t = targetFor(r.state, K, it);
for (const x of ["160?", "160", "160 m?", "kya 160?", "160 hai?", "160 m"]) {
  const c = classifyFast({ target: t, text: x });
  console.log(JSON.stringify(x), "→", c ? JSON.stringify({ o: c.outcome, src: c.source, f: c.flags, mods: c.mods, corr: c.corroboration }) : null);
}
