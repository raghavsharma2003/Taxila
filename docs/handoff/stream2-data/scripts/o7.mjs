import { getKit } from "/home/user/Taxila/server/content/index.js";
import { gateCtxFor, regate, retime, withSectors, codeBoard } from "/home/user/Taxila/server/stagecraft/board-sync.js";
import { claimsCalls } from "/home/user/Taxila/server/stagecraft/claims-board.js";
import { screenClaims } from "/home/user/Taxila/server/studio/qa/semantics.js";
import { expand } from "/home/user/Taxila/server/forge/explainer/templates.js";
const cases=[["c4-maths-ch05-t01","Aarav, board par teen barabar parts dekho; ek part shade hai. Kitne parts shade hue?"],
["c7-maths-ch08-t01","Aarav, screen ke rectangle mein 3 columns aur 5 rows dekhiye; shaded hissa 2 columns aur 3 rows cover karta hai. Marked boxes kitne?"],
["c7-maths-ch08-t01","Aarav, board par 3 columns aur 5 rows banaiye: kul 15 boxes. Unmein 6 shade kijiye. Aap marked boxes ki sankhya boliye."]];
for (const [topic,text] of cases) {
  const kit=await getKit(topic,{generate:false});
  const ask={ intent: { intentId: "L:wb:1", lessonId: "L", kind: "whiteboard" }, line: { lessonId: "L", text }, kit: { topicId: topic }, mode: "fresh" };
  const ctx=gateCtxFor(ask,{kit});
  console.log("==",JSON.stringify(screenClaims(text)), "code:", codeBoard(ask,{kit,lessonId:"L"},ctx)?.template ?? "none");
  for (const call of claimsCalls(text)) {
    const x=expand(call); if(!x.ok){console.log(call.template,"expand",x.errors);continue;}
    const s=withSectors(retime(x.script,x.script.durationMs,ctx.speechMs),ctx.reply);
    const g=regate({...s,board:{w:400,h:300,ground:"paper",...s.board}},ask,ctx);
    console.log(" ",JSON.stringify(call).slice(0,120), g.ok?"PASS":g.gate.checks.filter(c=>!c.pass).map(c=>c.id+JSON.stringify(c.detail).slice(0,160)).join(" | "));
  }
}
