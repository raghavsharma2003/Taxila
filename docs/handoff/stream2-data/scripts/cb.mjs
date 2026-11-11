import * as boardSync from "/home/user/Taxila/server/stagecraft/board-sync.js";
import { kitTopicAny } from "/home/user/Taxila/server/stagecraft/catalogue.js";
const kit = kitTopicAny("c6-maths-ch05-t02");
const ask = { intent: { intentId: "bs-2", lessonId: "L", kind: "whiteboard", style: { band: "B3" } }, line: { lessonId: "L", text: "Teen boxes." }, mode: "fresh", kit: { topicId: "c6-maths-ch05-t02", content: [] }, requested: true };
for (let i = 0; i < 3; i++) { const t = performance.now(); const r = boardSync.codeBoard(ask, { kit, lessonId: "L" }, boardSync.gateCtxFor(ask, { kit })); console.log(Math.round(performance.now() - t), "ms", r?.template ?? "none"); }
