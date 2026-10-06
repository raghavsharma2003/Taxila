// round2 truth: build a CANDIDATE data/kits-parts.json (server/content/parts.js format) from two-rater label files
// (label-parts.mjs --out ...). Only AGREED labels go in: an item's `parts` only where both raters called it multi-part,
// each acceptable entry only where both gave the same label. Disagreements get no row (today's behaviour) and are written
// to a separate list for the human pass the parts decision requires. This script never writes data/kits-parts.json: the
// output path is explicit, and shipping it is a main-loop / owner decision (docs/design/round2/truth/APPLY.md §3c).
//
//   node evals/grading-truth/build-parts.mjs --out <candidate.json> --disagree <list.json> <labels.json> [<labels.json> …]
import { readFileSync, writeFileSync } from "node:fs";

const argv = process.argv.slice(2);
const opt = (n) => { const i = argv.indexOf(n); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const OUT = opt("--out"), DIS = opt("--disagree");
if (!OUT || !argv.length) { console.error("usage: build-parts.mjs --out <file> [--disagree <file>] <labels.json>..."); process.exit(2); }
const items = {}, disagree = [];
const tally = { files: 0, items: 0, withParts: 0, acceptable: { complete: 0, partial: 0, wrong: 0 }, disagree: 0 };
for (const f of argv) {
  const d = JSON.parse(readFileSync(f, "utf8"));
  tally.files++;
  for (const [id, it] of Object.entries(d.items ?? {})) {
    const row = {};
    if (Array.isArray(it.parts) && it.parts.length >= 2) { row.parts = it.parts; tally.withParts++; }
    if (it.acceptable && Object.keys(it.acceptable).length) {
      row.acceptable = it.acceptable;
      for (const v of Object.values(it.acceptable)) tally.acceptable[v] = (tally.acceptable[v] ?? 0) + 1;
    }
    if (Object.keys(row).length) { items[id] = row; tally.items++; }
  }
  for (const x of d.disagree ?? []) { disagree.push(x); tally.disagree++; }
}
const meta = { built: new Date().toISOString(), from: argv, rule: "agreed two-rater labels only; disagreements have no row (human pass pending)", ...tally };
writeFileSync(OUT, JSON.stringify({ meta, items }, null, 1));
if (DIS) writeFileSync(DIS, JSON.stringify({ meta: { n: disagree.length, from: argv }, disagree }, null, 1));
console.log(JSON.stringify(meta, null, 1));
