import fs from "fs";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { targetFor, classify } from "/home/user/Taxila/server/director/classify.js";
console.info = () => {};
const o = JSON.parse(fs.readFileSync(process.argv[2])); const k = Object.keys(o).find((k) => o[k].form === 2);
const [id] = k.split("#"); const v = o[k]; console.log(k, v);
for (const f of fs.readdirSync("/home/user/Taxila/data/kits").filter((f) => /^c\d-[a-z]+\.json$/.test(f))) { const d = JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/" + f));
  for (const t of d.topics ?? []) for (const it of t.items ?? []) if (it.id === id) {
    const kit = kitFromFile(getTopic(t.topicId)); const item = kit.items.find((x) => x.id === id);
    const r = await classify({ target: targetFor({ phase: "practice", hintLevel: 0, activeItemId: id }, kit, item), childText: v.text, asrConfidence: 0.9, typed: false, lang: "hindi", kit });
    console.log(JSON.stringify(r).slice(0, 800)); process.exit(0); } }
