import fs from "node:fs";
import { initLessonState, step } from "/home/user/Taxila/server/director/state.js";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import * as C from "/home/user/Taxila/server/content/curriculum.js";
import { CTX, cls } from "/home/user/Taxila/tests/fixtures/kit.mjs";
const A = await import("/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/request-pre.mjs");
const B = await import("/home/user/Taxila/server/studio/request.js");
let topics = 0, rungs = 0, before = 0, after = 0; const flipped = [];
for (const f of fs.readdirSync("/home/user/Taxila/data/kits").filter((x) => x.endsWith(".json"))) for (const t of JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/" + f, "utf8")).topics ?? []) {
  const top = C.getTopic(t.topicId); if (!top) continue; const kit = kitFromFile(top); if (!kit) continue; topics++;
  try {
    const cl = Number(t.topicId.match(/^c(\d+)/)[1]);
    let r = step(initLessonState({ topicId: kit.topicId, kit, ctx: { ...CTX, classLevel: cl, ageBand: cl <= 4 ? "6-9" : "10-12" }, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
    r = step(r.state, { event: "turn", kit, cls: { ...cls("no_evidence"), request: { type: "visual", kind: "picture", whole: true } }, text: "picture dikhao", now: 20000 });
    const s = r.state.module?.engine === "explainer@1" ? r.state.module.params?.script : null; if (!s) continue; rungs++;
    const a = A.isDrawing(s), b = B.isDrawing(s); before += a; after += b;
    if (a !== b && flipped.length < 12) flipped.push(`${t.topicId}: ${s.ops.map((o) => o.op + (o.text ? ":" + o.text : "")).join(" ").slice(0, 110)}`);
  } catch {}
}
console.log(JSON.stringify({ topics, rungsOnPictureAsk: rungs, drawingBefore: before, drawingAfter: after }));
for (const x of flipped) console.log(x);
