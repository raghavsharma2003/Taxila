import { initLessonState, step } from "/home/user/Taxila/server/director/state.js";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { CTX, cls } from "/home/user/Taxila/tests/fixtures/kit.mjs";
import * as boardSync from "/home/user/Taxila/server/stagecraft/board-sync.js";
import { answersRequest, isDrawing } from "/home/user/Taxila/server/studio/request.js";
const kit = kitFromFile(getTopic("c6-maths-ch06-t01"));
let r = step(initLessonState({ topicId: kit.topicId, kit, ctx: { ...CTX, classLevel: 6, ageBand: "10-12" }, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
r = step(r.state, { event: "turn", kit, cls: { ...cls("no_evidence"), request: { type: "visual", kind: "picture", whole: true } }, text: "picture dikhao", now: 20000 });
console.log("move", r.move.kind, r.move.request, "module", r.state.module?.engine);
const script = r.state.module?.params?.script;
if (!script) { console.log("no rung script"); process.exit(); }
console.log("ops", script.ops.map((o) => o.op + (o.text ? ":" + o.text : "")).join(" | "), "isDrawing", isDrawing(script));
const line = "picture: ek rectangle ki opposite sides 50 metre aur 30 metre hain. Aap boundary ki chaar sides kaise likhenge?";
const ask = { intent: { kind: "whiteboard", lessonId: "L", intentId: "L:wb:1", request: { kind: "picture" } }, line: { text: line, lessonId: "L" }, mode: "fresh" };
const ctx = boardSync.gateCtxFor(ask, { kit, redact: [], prior: [] });
const t = boardSync.templateBoard(ask, script, ctx);
console.log("templateBoard ok:", !!t?.script, t?.why ?? "", JSON.stringify((t?.gate?.checks ?? []).filter((c) => !c.pass).map((c) => c.id)));
console.log("answersRequest(picture, no subject):", t?.script ? answersRequest(t.script, { kind: "picture" }) : "n/a");
