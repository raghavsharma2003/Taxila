import { initLessonState, step } from "/home/user/Taxila/server/director/state.js";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { requestOf } from "/home/user/Taxila/server/director/requests.js";
import { CTX, cls } from "/home/user/Taxila/tests/fixtures/kit.mjs";
const K = kitFromFile(getTopic("c6-maths-ch06-t01")); const NE = cls("no_evidence");
for (const t of ["mujhe koi aur topic padhna hai", "kuch aur padhna hai", "doosra topic padhao", "koi doosra topic", "mujhe kuch aur padhna hai"]) console.log(JSON.stringify(t).padEnd(36), JSON.stringify(requestOf(t)));
let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6 }, seed: 2, now: 0 }), { event: "start", kit: K, now: 0 });
for (let i = 0; i < 3; i++) r = step(r.state, { event: "turn", kit: K, cls: NE, now: (i + 1) * 20000 });
for (let i = 0; i < 3; i++) { const text = "mujhe koi aur topic padhna hai"; r = step(r.state, { event: "turn", kit: K, cls: { ...NE, source: "request", request: requestOf(text) }, text, now: 100000 + i * 20000 }); console.log("ask", i + 1, "→", r.move.kind, r.move.request, JSON.stringify((r.ui?.chips ?? []).map((c) => c.id)), "|", r.move.shape.slice(0, 110)); }
