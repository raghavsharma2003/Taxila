import { getKit } from "/home/user/Taxila/server/content/index.js";
import { gateCtxFor, regate, retime, withSectors } from "/home/user/Taxila/server/stagecraft/board-sync.js";
import { claimsCalls } from "/home/user/Taxila/server/stagecraft/claims-board.js";
import { expand } from "/home/user/Taxila/server/forge/explainer/templates.js";
const cases=[["c7-maths-ch08-t01","Screen par rectangle dekhiye: 5 columns aur 3 rows hain; 3/5 wale hisson mein 2 rows mark hain. Marked chhote parts kitne dikh rahe hain?",{template:"fraction-of@1",a:2,b:3,c:3,d:5,hideResult:true}],
["c6-science-ch01-t01","Ishaan, screen par animation move nahi hogi; flow dekhiye: Observe, Ask, Predict, Test, phir Conclude. Ismein pehla step kya hai?",null],
["c6-science-ch01-t01","Ishaan, screen par animation nahi chalegi; flow dekhiye: Observe, Question, Predict, Fair test, Observe-conclude. Ismein pehla step kya hai?",null]];
for (const [topic,text,extra] of cases) {
  const kit=await getKit(topic,{generate:false});
  const ask={ intent: { intentId: "L:wb:1", lessonId: "L", kind: "whiteboard" }, line: { lessonId: "L", text }, kit: { topicId: topic }, mode: "fresh" };
  const ctx=gateCtxFor(ask,{kit});
  for (const call of [...claimsCalls(text), ...(extra?[extra]:[])]) {
    const x=expand(call); if(!x.ok){console.log(call.template,"expand",x.errors);continue;}
    const s=withSectors(retime(x.script,x.script.durationMs,ctx.speechMs),ctx.reply);
    const g=regate({...s,board:{w:400,h:300,ground:"paper",...s.board}},ask,ctx);
    console.log(JSON.stringify(call).slice(0,120), g.ok?"PASS":g.gate.checks.filter(c=>!c.pass).map(c=>c.id+JSON.stringify(c.detail).slice(0,160)).join(" | "));
  }
}
