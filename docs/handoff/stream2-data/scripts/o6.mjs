import { getKit } from "/home/user/Taxila/server/content/index.js";
import { gateCtxFor, codeBoard } from "/home/user/Taxila/server/stagecraft/board-sync.js";
const topic="c6-science-ch01-t01", text="Ishaan, screen par animation move nahi hogi; flow dekhiye: Observe, Ask, Predict, Test, phir Conclude. Ismein pehla step kya hai?";
const kit=await getKit(topic,{generate:false});
const t={};
for (const item of [null,...kit.items]) for (const mode of ["fresh","continue"]) {
  const ask={ intent: { intentId: "L:wb:1", lessonId: "L", kind: "whiteboard" }, line: { lessonId: "L", text }, kit: { topicId: topic, item }, mode };
  const ctx=gateCtxFor(ask,{kit, prior: []});
  const r=codeBoard(ask,{kit,lessonId:"L"},ctx);
  const k=`${mode} ${r?r.template:"none"}`; t[k]=(t[k]??0)+1;
}
console.log(t);
import { certifyForTray } from "/home/user/Taxila/server/forge3/tray-gate.js";
{ const ask={ intent: { intentId: "L:wb:1", lessonId: "L", kind: "whiteboard" }, line: { lessonId: "L", text }, kit: { topicId: topic }, mode:"fresh" };
  const r=codeBoard(ask,{kit,lessonId:"L"},gateCtxFor(ask,{kit}));
  for (const vp of ["p360","p412","l1366"]) for (const young of [false,true]) console.log(vp, young, JSON.stringify(certifyForTray({kind:"whiteboard",script:r.script},{vp,young})));
}
