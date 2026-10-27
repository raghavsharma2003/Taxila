import { getKit } from "/home/user/Taxila/server/content/index.js";
import { gateCtxFor, regate, retime, withSectors, codeBoard } from "/home/user/Taxila/server/stagecraft/board-sync.js";
import { claimsCalls } from "/home/user/Taxila/server/stagecraft/claims-board.js";
import { screenClaims } from "/home/user/Taxila/server/studio/qa/semantics.js";
import { expand } from "/home/user/Taxila/server/forge/explainer/templates.js";
const T="c7-maths-ch08-t01";
const lines=["Screen par rectangle ka 3/5 hissa liya, phir uska 2/3: 15 boxes mein 6 marked, yani 2/3 × 3/5 = 6/15. Aap simplify karke batayiye.",
"Screen par dekhiye: poora rectangle 15 equal boxes hai; 3/5 wale hissa mein 9 boxes, unka 2/3 yani 6 marked boxes. 6/15 ko simplify kijiye.",
"Board par 12 equal boxes hain, 3 groups mein. Har group mein 4 boxes dikh rahe hain. Ab 2 groups giniye.",
"Screen par 3 equal columns dekhiye. Har column ko 5 equal boxes mein baantiye; pehle 2 columns par dhyaan dijiye."];
const kit=await getKit(T,{generate:false});
for (const text of lines) {
  const ask={ intent: { intentId: "L:wb:1", lessonId: "L", kind: "whiteboard" }, line: { lessonId: "L", text }, kit: { topicId: T }, mode: "fresh" };
  const ctx=gateCtxFor(ask,{kit});
  console.log("==",text.slice(0,50),JSON.stringify(screenClaims(text)), JSON.stringify(claimsCalls(text)), "code:", codeBoard(ask,{kit,lessonId:"L"},ctx)?.template ?? "none");
  for (const call of claimsCalls(text)) { const x=expand(call); if(!x.ok){console.log(" expand",x.errors);continue;}
    const s=withSectors(retime(x.script,x.script.durationMs,ctx.speechMs),ctx.reply);
    const g=regate({...s,board:{w:400,h:300,ground:"paper",...s.board}},ask,ctx);
    console.log("  ",call.template,g.ok?"PASS":g.gate.checks.filter(c=>!c.pass).map(c=>c.id+JSON.stringify(c.detail).slice(0,160)).join(" | ")); }
}
