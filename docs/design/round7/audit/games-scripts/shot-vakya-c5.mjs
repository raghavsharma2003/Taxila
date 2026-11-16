// Games audit: mount the one vakya level the forge3 360px cert never judged (c5-english-ch09-t01), with the bank items the server would attach.
// Needs the dev harness: npx vite --config src/play/dev/vite.play.config.mjs --port 5199 --host 127.0.0.1 &   then   node this.mjs <outdir>
import { chromium } from "playwright";
import { vakyaItems, coverage } from "../../../../../server/play/levels.js";
const e = coverage().entries.find(x => x.topicId==="c5-english-ch09-t01" && x.family==="vakya");
const items = vakyaItems(e.grammar.bank, e.topicId);
console.log("items", items.length, JSON.stringify(e.grammar));
const b = await chromium.launch();
for (const [w,h] of [[360,640],[412,860]]) {
  const p = await (await b.newContext({ viewport:{width:w,height:h}, hasTouch:true, isMobile:true })).newPage();
  const q = new URLSearchParams({ family:"vakya", mode:"rail", goal:"build", class:"5", topic:e.topicId, skill:e.skillId, engine:"2d", lang:"hinglish", fade:"1", grammar: JSON.stringify({ ...e.grammar, items }) });
  await p.goto("http://127.0.0.1:5199/src/play/dev/index.html?"+q); await p.waitForTimeout(2500);
  await p.screenshot({ path: `${process.argv[2] ?? "."}/vakya-c5-${w}.png` });
  console.log(w, (await p.evaluate(()=>document.body.innerText.slice(0,160))).replace(/\n/g," | "));
}
await b.close();
