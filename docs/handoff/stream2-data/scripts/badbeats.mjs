import fs from "node:fs"; import path from "node:path";
import { normalizeScript, lintScript } from "/home/user/Taxila/shared/whiteboard.js";
import { cutCells, namedShapeMissing } from "/home/user/Taxila/server/studio/qa/whiteboard.js";
const DIR = "data/studio-catalogue/topics";
const kits = new Map();
const kitOf = (t) => { const m = /^(c\d+)-([a-z]+)-/.exec(t); if (!m) return null; const f = `data/kits/${m[1]}-${m[2]}.json`; if (!kits.has(f)) kits.set(f, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null); return kits.get(f)?.topics?.find((x) => x.topicId === t) ?? null; };
let total = 0, loaded = 0, bad = 0; const topics = {}; const why = {};
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith(".json"))) {
  const rec = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  const kit = kitOf(rec.topicId);
  for (const b of rec.whiteboard?.beats ?? []) {
    if (!b?.script) continue; total++;
    const n = normalizeScript(b.script, { strict: true });
    if (!n.ok || !n.script || lintScript(n.script).length) continue; // already not loaded
    loaded++;
    const line = String(rec.explainer?.spec?.text?.[b.line] ?? b.line ?? "");
    const r = [];
    if (cutCells(n.script.ops, { kit, reply: line }).length) r.push("W16");
    if (namedShapeMissing(line, n.script.ops).length) r.push("W15");
    if (r.length) { bad++; (topics[rec.topicId] ??= []).push(b.line); for (const x of r) why[x] = (why[x] ?? 0) + 1; }
  }
}
console.log({ beatsTotal: total, loadedNow: loaded, refusedByNewChecks: bad, why, topics: Object.keys(topics).length });
fs.writeFileSync(process.argv[2] ?? "/dev/null", JSON.stringify(topics, null, 1));
