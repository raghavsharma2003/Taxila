import { codeBoard, gateCtxFor } from "/home/user/Taxila/server/stagecraft/board-sync.js";
import { claimsCalls } from "/home/user/Taxila/server/stagecraft/claims-board.js";
import { certifyForTray } from "/home/user/Taxila/server/forge3/tray-gate.js";
for (const text of ["Ishaan, is screen par animation nahi chalegi. Flow mein dekhiye: Observe, Ask, Predict, Test, phir Conclude. Pehla step kya hai?",
 "Ishaan, screen par animation nahi chalegi; flow dekhiye: Observe, Question, Predict, Fair test, Observe-conclude. Ismein pehla step kya hai?",
 "Board par steps dekho: Observe, Predict, Test. Predict ke baad kya aata hai?"]) {
  const ask={ intent: { intentId: "L:wb:1", lessonId: "L", kind: "whiteboard" }, line: { lessonId: "L", text }, kit: null, mode: "fresh" };
  const r=codeBoard(ask,{lessonId:"L"},gateCtxFor(ask,{}));
  console.log(JSON.stringify(claimsCalls(text)), r?.ok, r && ["p360","p412","l1366"].map(v=>certifyForTray({kind:"whiteboard",script:r.script},{vp:v}).ok));
  if (r) console.log(r.script.ops.filter(o=>o.op==="text").map(o=>o.text).join(" | "));
}
