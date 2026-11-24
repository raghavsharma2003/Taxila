import fs from "node:fs";
import { choicesFor, choiceShape } from "/home/user/Taxila/server/director/items.js";
const NUMERIC = /^[−-]?\d[\d,]*(?:\.\d+)?$/; const FRACTION = /^(\d+)\s*\/\s*(\d+)$/;
const sh = (x) => { const s = choiceShape(x); return s; };
let keys = 0, offered = 0, odd = 0, two = 0; const ex = [];
for (const f of fs.readdirSync("/home/user/Taxila/data/kits").filter((x) => x.endsWith(".json"))) {
  const k = JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/" + f, "utf8"));
  for (const t of k.topics ?? []) for (const it of t.items ?? []) {
    const key = String(it.answer ?? "").trim();
    if (!key || key.length > 40 || NUMERIC.test(key.replace(/,/g, "")) || FRACTION.test(key)) continue;
    keys++;
    const c = choicesFor(it, { items: t.items }, 1);
    if (!c) continue; offered++; if (c.length === 3) two++;
    if (ex.length < 12 && Math.random() < 0.01) ex.push(`${it.id}: [${c.join(" | ")}]`);
  }
}
console.log(JSON.stringify({ nonNumericKeys: keys, chipsOffered: offered, withTwoDistractors: two }));
for (const e of ex) console.log(e);
