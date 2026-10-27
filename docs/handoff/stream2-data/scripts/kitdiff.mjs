import fs from "node:fs";
const a = await import("/home/user/Taxila/server/director/items-prev.tmp.js");
const b = await import("/home/user/Taxila/server/director/items.js");
let n = 0; const moved = [];
for (const f of fs.readdirSync("/home/user/Taxila/data/kits").filter((x) => x.endsWith(".json"))) {
  const k = JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/" + f, "utf8"));
  for (const t of k.topics ?? []) for (const i of t.items ?? []) for (const h of [...(i.hints ?? []).flatMap((x) => typeof x === "string" ? [x] : [x.en, x.hi, x.text].filter(Boolean)), i.worked_example?.en, i.explain_en].filter(Boolean)) {
    n++; const x = a.revealsAnswer(String(h), i), y = b.revealsAnswer(String(h), i);
    if (x !== y) moved.push({ id: i.id, key: i.answer, acc: i.acceptable, x, y, h: String(h).slice(0, 140) });
  }
}
console.log(n, moved.length); for (const m of moved) console.log(JSON.stringify(m));
