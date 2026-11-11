import { getKit } from "/home/user/Taxila/server/content/index.js";
import { codeBoard, gateCtxFor, regate, retime, withSectors } from "/home/user/Taxila/server/stagecraft/board-sync.js";
import { claimsCalls } from "/home/user/Taxila/server/stagecraft/claims-board.js";
import { explainerFor } from "/home/user/Taxila/server/forge/explainer/lesson.js";
import { screenClaims } from "/home/user/Taxila/server/studio/qa/semantics.js";
const cases = [
 ["c5-maths-ch01-t01","Aarav, board par dekhiye: 50,000 → 50 thousands → fifty thousand. Ab 60,000 ko words mein likhiye."],
 ["c5-maths-ch01-t01","Aarav, 41,000 mein 41 thousands hain, isliye “forty-one thousand” likhenge. Aap 25,000 ko words mein bolkar dekhiye."],
 ["c7-maths-ch08-t01","Aarav, board par rectangle 5 columns aur 3 rows mein hai: total 15 parts. Marked parts giniye—kitne dikh rahe hain?"],
 ["c7-maths-ch08-t01","Aarav, rectangle ko 5 columns aur 3 rows mein dekhiye; 6 shaded boxes count karke bataiye: total boxes kitne hain?"],
 ["c7-maths-ch08-t01","Screen par rectangle dekhiye: 15 equal parts, unmein 6 marked. Marked fraction ko simplest form mein kaise likhenge?"],
];
for (const [topic, text] of cases) {
  const kit = await getKit(topic, { generate: false });
  const ask = { intent: { intentId: "L:wb:1", lessonId: "L", kind: "whiteboard", beat: "explain" }, line: { lessonId: "L", text }, kit: { topicId: topic, content: [] }, mode: "fresh" };
  const ctx = gateCtxFor(ask, { kit });
  console.log("\n==", text.slice(0, 70), JSON.stringify(screenClaims(text)), JSON.stringify(claimsCalls(text)));
  const r = codeBoard(ask, { kit, lessonId: "L" }, ctx);
  console.log(" code:", r ? `ok ${r.template}` : "none");
  if (!r) {
    for (const t of [{ text }, {}]) {
      const x = explainerFor({ lessonId: "L", kit, item: null, openItem: null, band: "B3", ...t });
      if (!x?.params?.script) { console.log("  explainer: none"); continue; }
      const s = withSectors(retime(x.params.script, Math.max(800, Number(x.params.script.durationMs) || 0), ctx.speechMs), ctx.reply);
      const g = regate({ ...s, board: { w: 400, h: 300, ground: "paper", ...(s.board ?? {}) } }, ask, ctx);
      console.log("  explainer", x.template, x.by, g.ok ? "PASS" : g.gate.checks.filter(c=>!c.pass).map(c=>c.id+":"+JSON.stringify(c.detail).slice(0,140)).join(" | "));
    }
  }
}
