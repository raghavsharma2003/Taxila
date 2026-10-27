import fs from "node:fs"; import path from "node:path";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { targetFor, classifyFast } from "/home/user/Taxila/server/director/classify.js";
import { corroborate as NEW } from "/home/user/Taxila/server/grading/corroborate.js";
import { corroborate as OLD } from "./oldcorr3/corroborate.js";
console.info = () => {};
const kits = {}; const kitOf = (id) => { const tp = String(id).match(/^c\d+-[a-z]+-ch\d+-t\d+/)?.[0]; try { return tp ? (kits[tp] ??= kitFromFile(getTopic(tp))) : null; } catch { return null; } };
const pairs = [];
for (const r of JSON.parse(fs.readFileSync("testlines.json"))) pairs.push({ src: "TEST", s: r.text, id: r.item_id, label: r.outcome });
const files = []; const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p) : p.endsWith(".json") && p.includes("records") && files.push(p); } };
walk("sl3/evals"); const seen = new Set();
for (const f of files) { const j = JSON.parse(fs.readFileSync(f, "utf8")); for (const t of j.turns ?? []) { const s = t.child?.sent; const id = t.reasons?.item?.id; if (s && id && !seen.has(s + id)) { seen.add(s + id); pairs.push({ src: "simlab", s, id, label: "correct" }); } } }
const tally = { TEST: { n: 0, creditedBefore: 0, lost: 0 }, simlab: { n: 0, creditedBefore: 0, lost: 0 } }; const lost = [];
for (const p of pairs) {
  const kit = kitOf(p.id); const item = kit?.items.find((i) => i.id === p.id); if (!item) continue;
  const T = tally[p.src]; T.n++;
  const target = targetFor({ phase: "practice", hintLevel: 0, activeItemId: p.id }, kit, item);
  const fast = classifyFast({ target, childText: p.s, typed: true });
  if (fast.result) {
    if (fast.result.source === "number_taken_back") { T.creditedBefore++; T.lost++; lost.push(`${p.src} number_working -> taken_back | ${p.id} | ${p.s}`); }
    else if (fast.result.outcome === "correct") T.creditedBefore++;
    continue;
  }
  if (p.label !== "correct") continue;
  const lab = { outcome: "correct", confidence: 0.9, source: "model", flags: {} };
  const a = OLD({ target, text: p.s, result: lab }), b = NEW({ target, text: p.s, result: lab });
  if (a.outcome === "correct") { T.creditedBefore++; if (b.outcome !== "correct") { T.lost++; lost.push(`${p.src} ${a.corroboration} -> ${b.corroboration} | ${p.id} | ${p.s}`); } }
}
console.log(JSON.stringify(tally)); for (const l of lost) console.log("  ", l.slice(0, 260));
