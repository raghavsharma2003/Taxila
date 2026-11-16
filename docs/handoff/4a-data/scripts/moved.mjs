import fs from "node:fs"; import path from "node:path";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { targetFor, classifyFast } from "/home/user/Taxila/server/director/classify.js";
import { corroborate as NEW } from "/home/user/Taxila/server/grading/corroborate.js";
import { corroborate as OLD } from "./oldcorr/corroborate.js";
console.info = () => {};
const files = []; const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p) : p.endsWith(".json") && p.includes("records") && files.push(p); } };
walk(process.argv[2]);
const kits = {}; const kitOf = (id) => { const tp = String(id).match(/^c\d+-[a-z]+-ch\d+-t\d+/)?.[0]; return tp ? (kits[tp] ??= kitFromFile(getTopic(tp))) : null; };
const lines = new Map(); let all = new Set();
for (const f of files) { let j; try { j = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; }
  for (const t of j.turns ?? []) { const s = t.child?.sent ?? t.child?.asr?.text ?? t.child?.say; if (typeof s !== "string" || !s.trim()) continue; all.add(s);
    const id = t.reasons?.item?.id; if (id && !lines.has(`${s}\u0000${id}`)) lines.set(`${s}\u0000${id}`, { s, id }); } }
let n = 0; const moved = [];
for (const { s, id } of lines.values()) {
  const kit = kitOf(id); const item = kit?.items.find((i) => i.id === id); if (!item) continue; n++;
  const target = targetFor({ phase: "practice", hintLevel: 0, activeItemId: id }, kit, item);
  const fast = classifyFast({ target, childText: s, typed: true });
  if (fast.result) { if (fast.result.source === "number_reason_head") moved.push(`number path: no_evidence (number_hedge) -> correct | ${id} | ${s}`); continue; }
  const lab = { outcome: "correct", confidence: 0.9, source: "model", flags: {} };
  const a = OLD({ target, text: s, result: lab }), b = NEW({ target, text: s, result: lab });
  if (a.outcome !== b.outcome) moved.push(`model "correct": ${a.outcome} (${a.corroboration}) -> ${b.outcome} (${b.corroboration}) | ${id} | ${s}`);
}
console.log(`${all.size} child lines; ${n} (line, graded card) pairs; moved ${moved.length}`);
for (const m of moved) console.log("  ", m);
