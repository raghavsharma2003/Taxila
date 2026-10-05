// adjudicate.mjs — merge the two labelers into gold. Agreement (after norm()) → gold. Disagreement → listed in
// data/disagreements.json for a human/adjudicator pass; data/adjudicated.json (id:index → label) resolves them.
// Unresolved disagreements are EXCLUDED from scoring (counted and reported, never silently dropped).
//   node evals/translit/adjudicate.mjs
import fs from "node:fs";
import path from "node:path";
import { words } from "./tokens.mjs";
import { norm } from "./norm.mjs";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const rd = (f) => JSON.parse(fs.readFileSync(path.join(HERE, "data", f), "utf8"));
// A label with no Devanagari letter (DeepSeek often echoed the word instead of "=") means "keep Latin".
const keepify = (L) => Object.fromEntries(Object.entries(L).map(([id, t]) => [id, t.map((x) => (/[\u0900-\u097F]/.test(String(x)) ? String(x).trim() : "="))]));
const corpus = rd("corpus.json"), A = keepify(rd("labels-gpt61.json").labels), B = keepify(rd("labels-ds4f.json").labels);
const adj = fs.existsSync(path.join(HERE, "data/adjudicated.json")) ? rd("adjudicated.json") : {};
const gold = {}; const dis = []; let agree = 0, total = 0, resolved = 0, classAgree = 0;
for (const r of corpus.rows) {
  const a = A[r.id], b = B[r.id];
  if (!a || !b) continue;
  const ws = words(r.text);
  const g = ws.map((x, k) => {
    total++;
    if ((a[k] === "=") === (b[k] === "=")) classAgree++;
    if (norm(a[k]) === norm(b[k])) { agree++; return a[k]; }
    const key = `${r.id}:${k}`;
    if (adj[key]) { resolved++; return adj[key]; }
    dis.push({ key, w: x.w, a: a[k], b: b[k], ctx: r.text.slice(Math.max(0, x.i - 40), x.i + x.w.length + 40) });
    return null;
  });
  gold[r.id] = { split: r.split, labels: g };
}
fs.writeFileSync(path.join(HERE, "data/gold.json"), JSON.stringify({ v: "taxila-translit-gold/1", labelers: ["taxila-gpt61-sol", "taxila-ds4f-0731"], rows: gold }, null, 0));
fs.writeFileSync(path.join(HERE, "data/disagreements.json"), JSON.stringify(dis, null, 1));
const summary = { replies: Object.keys(gold).length, words: total, agreeExact: agree, agreeClass: classAgree, resolved, unresolved: dis.length };
fs.writeFileSync(path.join(HERE, "data/gold-summary.json"), JSON.stringify(summary, null, 1));
console.log(summary, `exact agreement ${(100 * agree / total).toFixed(1)}%, keep-vs-convert agreement ${(100 * classAgree / total).toFixed(1)}%`);
