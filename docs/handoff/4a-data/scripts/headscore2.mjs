import fs from "fs";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { targetFor } from "/home/user/Taxila/server/director/classify.js";
import { corroborate } from "/home/user/Taxila/server/grading/corroborate.js";
const done = JSON.parse(fs.readFileSync(process.argv[2]));
const kits = {};
const kitOf = (id) => { const topic = (id.match(/^(c\d-[a-z]+-ch\d+-t\d+)/) ?? [])[1]; if (!topic) return null; return (kits[topic] ??= (() => { const tp = getTopic(topic); return tp ? kitFromFile(tp) : null; })()); };
const tab = {}; const flips = [];
for (const c of Object.values(done)) { if (c.skip || c.out === "err") continue;
  const truth = c.outcome === "right" ? "right" : "notright";
  const before = c.out === "correct" ? "credit" : ["incorrect", "misconception", "partial"].includes(c.out) ? "nocredit" : "lost";
  let after = before;
  if (c.out === "no_evidence" && String(c.corr ?? "").startsWith("unsupported_credit")) {
    const kit = kitOf(c.item); const it = kit.items.find((x) => x.id === c.item);
    const target = targetFor({ phase: "practice", hintLevel: 0, activeItemId: it.id }, kit, it);
    const r = corroborate({ target, text: c.text, result: { source: "model", outcome: "correct", confidence: 0.9 } });
    if (r.outcome === "correct") { after = "credit"; flips.push({ truth, arm: c.arm, corr: r.corroboration, text: c.text.slice(0, 110), key: it.answer, kind: it.kind }); }
  }
  for (const [k, v] of [["before", before], ["after", after]]) { const key = `${c.arm} ${k}`; tab[key] ??= {}; tab[key][`${truth}→${v}`] = (tab[key][`${truth}→${v}`] ?? 0) + 1; }
}
for (const [k, v] of Object.entries(tab)) console.log(k.padEnd(16), "right credited", v["right→credit"] ?? 0, "| wrong credited", v["notright→credit"] ?? 0, "| right lost", v["right→lost"] ?? 0);
console.log("rescued", flips.length, "false", flips.filter((f) => f.truth === "notright").length);
for (const f of flips.filter((f) => f.truth === "notright")) console.log("FALSE", JSON.stringify(f));
