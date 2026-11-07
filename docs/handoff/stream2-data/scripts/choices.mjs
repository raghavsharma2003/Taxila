import fs from "node:fs";
import { choicesFor } from "/home/user/Taxila/server/director/items.js";
const NUMERIC = /^[−-]?\d[\d,]*(?:\.\d+)?$/; const FRACTION = /^(\d+)\s*\/\s*(\d+)$/;
const shape = (x) => ({ digits: /\d/.test(x), working: /[()=+×÷]|\bso\b|\bbecause\b/i.test(x), words: x.split(/\s+/).length, cur: /₹|rs\b/i.test(x) });
let other = 0, offered = 0, odd = 0; const ex = [];
for (const f of fs.readdirSync("data/kits").filter((x) => x.endsWith(".json"))) {
  const k = JSON.parse(fs.readFileSync("data/kits/" + f, "utf8"));
  for (const t of k.topics ?? []) for (const it of t.items ?? []) {
    const key = String(it.answer ?? "").trim();
    if (!key || key.length > 40 || NUMERIC.test(key.replace(/,/g, "")) || FRACTION.test(key)) continue;
    other++;
    const c = choicesFor(it, { items: t.items }, 1);
    if (!c) continue; offered++;
    const ks = shape(key); const ds = c.filter((x) => x !== key).map(shape);
    const bad = ds.some((d) => d.digits !== ks.digits || d.working !== ks.working || d.cur !== ks.cur || Math.max(d.words, ks.words) > 2 * Math.min(d.words, ks.words) + 1);
    if (bad) { odd++; if (ex.length < 20) ex.push(`${it.id}: [${c.join(" | ")}] key=${key}`); }
  }
}
console.log(JSON.stringify({ nonNumericKeys: other, chipsOffered: offered, keyStandsOutByShape: odd }));
for (const e of ex) console.log(e);
