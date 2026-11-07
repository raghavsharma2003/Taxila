import fs from "node:fs";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { targetFor } from "/home/user/Taxila/server/director/classify.js";
import { completeForms } from "/home/user/Taxila/server/grading/corroborate.js";
const HL = /[ऀ-ॿ]|\b(?:hai|hain|ka|ki|ke|ko|se|mein|aur|nahi|karo|rakho|wala|wali|hota|hoti|jaata|jaati|taaki|kyunki|paani|ek|do|teen)\b/i;
const out = []; let items = 0;
for (const f of fs.readdirSync("data/kits").filter((x) => x.endsWith(".json"))) {
  if (/-(hindi|english)\.json$/.test(f)) continue;
  for (const k of JSON.parse(fs.readFileSync("data/kits/" + f, "utf8")).topics ?? []) {
    const t = getTopic(k.topicId); if (!t) continue; const K = kitFromFile(t); if (!K) continue;
    for (const item of K.items) {
      if (typeof item.answer !== "string" || ["why", "teachback"].includes(item.kind)) continue;
      const target = targetFor({ phase: "practice" }, K, item); if (target.mode !== "item") continue;
      if (/^\s*[-\d.,/ ₹%]+\s*[a-z]{0,3}\s*$/i.test(target.key)) continue; items++;
      const forms = completeForms(target);
      const hl = (target.also ?? []).filter((a) => HL.test(a));
      if (!hl.length || forms.some((x) => HL.test(x))) continue;
      if (!hl.every((a) => target.alsoLabel?.[a] === "partial")) continue;
      out.push({ kit: k.topicId, item: item.id, kind: item.kind, key: target.key, hinglishPartial: hl });
    }
  }
}
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
const bySubj = {}; for (const r of out) { const s = r.kit.split("-")[1]; bySubj[s] = (bySubj[s] ?? 0) + 1; }
console.log(items, "word-key items (science / evs / sst / maths kits);", out.length, "listed", JSON.stringify(bySubj));
