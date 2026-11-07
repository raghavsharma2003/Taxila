import fs from "node:fs";
import { fadeItem } from "/home/user/Taxila/server/director/fading.js";
import { askText } from "/home/user/Taxila/server/director/say.js";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import * as C from "/home/user/Taxila/server/content/curriculum.js";
const out = { kits: 0, fade: 0, cardHasProblem: 0, cardCut: 0 }; const ex = [];
for (const f of fs.readdirSync("/home/user/Taxila/data/kits").filter((x) => x.endsWith(".json"))) for (const t of JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/" + f, "utf8")).topics ?? []) {
  const top = C.getTopic(t.topicId); if (!top) continue; const kit = kitFromFile(top); if (!kit?.workedExample) continue; out.kits++;
  for (let i = 0; i < (kit.workedExample.steps ?? []).length; i++) {
    const it = fadeItem(kit, { index: i }); if (!it) continue; out.fade++;
    const card = askText(it.prompt_en);
    const head = String(kit.workedExample.problem).split(/\s+/).slice(0, 3).join(" ");
    if (card.includes(head)) out.cardHasProblem++;
    if (card !== it.prompt_en.replace(/\s+/g, " ").trim()) out.cardCut++;
    if (ex.length < 4 && i === 1) ex.push(card);
  }
}
console.log(JSON.stringify(out)); for (const e of ex) console.log(e);
const { norm } = await import("/home/user/Taxila/server/director/items.js");
let gives = 0; const gx = [];
for (const f of fs.readdirSync("/home/user/Taxila/data/kits").filter((x) => x.endsWith(".json"))) for (const t of JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/" + f, "utf8")).topics ?? []) {
  const top = C.getTopic(t.topicId); if (!top) continue; const kit = kitFromFile(top); if (!kit?.workedExample) continue;
  for (let i = 0; i < (kit.workedExample.steps ?? []).length; i++) {
    const it = fadeItem(kit, { index: i }); if (!it) continue;
    const line = kit.workedExample.fadedVersion[i];
    const before = ` ${norm(line)} `, after = ` ${norm(it.prompt_en)} `, key = ` ${norm(it.answer)} `;
    if (!before.includes(key) && after.includes(key)) { gives++; if (gx.length < 8) gx.push(`${it.answer} | ${it.prompt_en}`); }
  }
}
console.log("cardNowContainsKey", gives); for (const g of gx) console.log(g);
