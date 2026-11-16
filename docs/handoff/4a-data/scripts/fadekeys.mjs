import fs from "node:fs";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { fadeItem } from "/home/user/Taxila/server/director/fading.js";
let kits = 0, fades = 0, multi = 0; const ex = [];
for (const f of fs.readdirSync("/home/user/Taxila/data/kits").filter((x) => x.endsWith(".json"))) {
  const j = JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/" + f, "utf8"));
  for (const k of j.topics ?? []) {
    const t = getTopic(k.topicId); if (!t) continue; const K = kitFromFile(t); if (!K) continue; kits++;
    const it = fadeItem(K, {}); if (!it) continue; fades++;
    if (/[.!?।]\s+\S/u.test(it.answer)) { multi++; if (ex.length < 25) ex.push(`${k.topicId} ${it.id}: ${JSON.stringify(it.answer)}`); }
  }
}
console.log(kits, "kits;", fades, "with a faded step;", multi, "keys carry a sentence after the answer");
for (const e of ex) console.log("  ", e);
