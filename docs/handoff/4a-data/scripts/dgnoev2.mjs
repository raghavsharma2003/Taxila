import fs from "node:fs";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { targetFor, classify } from "/home/user/Taxila/server/director/classify.js";
console.info = () => {}; console.warn = () => {};
const R = process.argv[2], arm = process.argv[3];
const kits = {}; const kitOf = (id) => { const tp = String(id).match(/^c\d+-[a-z]+-ch\d+-t\d+/)?.[0]; return tp ? (kits[tp] ??= kitFromFile(getTopic(tp))) : null; };
const jobs = []; const cats = {};
for (const f of fs.readdirSync(R + "/records").filter((f) => f.includes(`--${arm}--`))) {
  const r = JSON.parse(fs.readFileSync(`${R}/records/${f}`, "utf8"));
  for (const t of r.turns) {
    const d = t.decided; if (d?.outcome !== "right") continue;
    const cls = t.reasons?.classification; if (cls && cls.outcome !== "no_evidence") continue;
    const graded = t.reasons?.item?.id ?? null;
    const c = !graded ? "no card graded this turn" : graded !== d.itemId ? "graded against a different card than the child answered" : "graded against the right card";
    cats[c] = (cats[c] ?? 0) + 1;
    if (c === "graded against the right card") jobs.push({ f: f.split("--")[0], n: t.n, depth: d.depth, kind: d.kind, id: d.itemId, text: t.child?.sent ?? "" });
  }
}
console.log(arm, cats);
const out = []; let i = 0;
await Promise.all(Array.from({ length: 6 }, async () => { while (i < jobs.length) { const j = jobs[i++];
  const kit = kitOf(j.id); const item = kit?.items.find((x) => x.id === j.id); if (!item) continue;
  const target = targetFor({ phase: "practice", hintLevel: 0, activeItemId: j.id }, kit, item);
  const r = await classify({ target, childText: j.text, asrConfidence: 1, typed: true, lang: "hinglish", kit }).catch(() => ({ outcome: "err" }));
  out.push({ ...j, key: String(item.answer).slice(0, 80), now: r.outcome, source: r.source, corr: r.corroboration ?? null }); } }));
const why = {}; for (const o of out) { const k = `${o.now} ${o.source}${o.corr ? " " + o.corr : ""}`; why[k] = (why[k] ?? 0) + 1; }
console.log(Object.entries(why).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${String(v).padStart(4)}  ${k}`).join("\n"));
fs.writeFileSync(process.argv[4], JSON.stringify(out, null, 1));
