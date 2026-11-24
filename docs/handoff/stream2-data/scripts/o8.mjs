import { getKit } from "/home/user/Taxila/server/content/index.js";
import { gateCtxFor, regate, retime, withSectors, codeBoard } from "/home/user/Taxila/server/stagecraft/board-sync.js";
import { claimsCalls } from "/home/user/Taxila/server/stagecraft/claims-board.js";
import { screenClaims } from "/home/user/Taxila/server/studio/qa/semantics.js";
import { expand } from "/home/user/Taxila/server/forge/explainer/templates.js";
const T="c7-maths-ch08-t01";
for (const text of ["Aarav, fraction mein upar wala number liye gaye parts, neeche wala total equal parts batata hai. 5 slices mein 2 liye—fraction kya hoga?",
"Aarav, screen par 15 equal boxes hain; 6 shaded boxes ko count kijiye. Fraction mein upar shaded, neeche total—likhiye."]) {
  const kit=await getKit(T,{generate:false});
  for (const mode of ["fresh","continue"]) {
  const ask={ intent: { intentId: "L:wb:1", lessonId: "L", kind: "whiteboard" }, line: { lessonId: "L", text }, kit: { topicId: T }, mode };
  const ctx=gateCtxFor(ask,{kit});
  console.log("==",mode,JSON.stringify(screenClaims(text)), JSON.stringify(claimsCalls(text)), "code:", codeBoard(ask,{kit,lessonId:"L"},ctx)?.template ?? "none");
  for (const call of claimsCalls(text)) { const x=expand(call); if(!x.ok){console.log(" expand",x.errors);continue;}
    const s=withSectors(retime(x.script,x.script.durationMs,ctx.speechMs),ctx.reply);
    const g=regate({...s,board:{w:400,h:300,ground:"paper",...s.board}},{...ask,mode:"fresh"},ctx);
    console.log("  ",g.ok?"PASS":g.gate.checks.filter(c=>!c.pass).map(c=>c.id+JSON.stringify(c.detail).slice(0,160)).join(" | ")); }
  }
}
