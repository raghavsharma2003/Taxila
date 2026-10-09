// round3 truth: a CANDIDATE kits-parts file that adds the P1 rows of the human-pass list (acceptable entries both raters
// call NOT complete: one says partial, the other wrong) as "partial". Today the product credits every one of them as a
// complete answer, because a disputed entry has no row and an entry with no row is the kit's claim. Never writes data/.
// Also writes the matching TRUTH file for the battery (the c1-9 labels plus those entries as partial), so
// `run.mjs --parts <truth>` scores HEAD's shipped data against "both raters say not complete".
//   node evals/grading-truth/round3/p1-candidate.mjs --truth-out <scratch>/truth-p1.json
// (the truth file is 4 MB and fully regenerable: write it to a scratch directory, never into the repo)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
const HERE = new URL(".", import.meta.url).pathname, MAIN = resolve(HERE, "../../..");
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const TRUTH_OUT = arg("--truth-out", null);
if (!TRUTH_OUT) throw new Error("--truth-out <path> (a scratch path: the truth file is regenerable)");
const LABELS = JSON.parse(readFileSync(join(MAIN, "evals/grading-truth/data/parts-labels-c1-9.json"), "utf8"));
const SHIPPED = JSON.parse(readFileSync(join(MAIN, "data/kits-parts.json"), "utf8"));
const [RA, RB] = LABELS.meta?.raters ?? ["gpt-5.6-terra", "DeepSeek-V4-Pro"];
const p1 = (LABELS.disagree ?? []).filter((d) => d.entry != null && [d[RA], d[RB]].every((x) => x === "partial" || x === "wrong"));
const cand = structuredClone(SHIPPED);
const truth = structuredClone(LABELS);
let added = 0;
for (const d of p1) {
  const row = (cand.items[d.id] ??= {});
  row.acceptable = { ...(row.acceptable ?? {}) };
  if (!row.acceptable[d.entry]) { row.acceptable[d.entry] = "partial"; added++; }
  const t = (truth.items[d.id] ??= { acceptable: {} });
  t.acceptable = { ...(t.acceptable ?? {}), [d.entry]: "partial" };
}
cand.meta = { ...cand.meta, candidate: "round3 truth P1", built: new Date().toISOString(),
  rule: `${cand.meta?.rule ?? ""}; PLUS ${added} acceptable entries both raters call not complete (partial vs wrong), shipped as partial (NOT human-adjudicated)` };
truth.meta = { ...truth.meta, round3: `truth for the battery: + ${p1.length} P1 entries labelled partial (both raters: not complete)` };
const outC = join(MAIN, "docs/design/round3/truth/data/kits-parts.p1-candidate.json");
mkdirSync(join(MAIN, "docs/design/round3/truth/data"), { recursive: true });
writeFileSync(outC, JSON.stringify(cand, null, 1) + "\n");
writeFileSync(resolve(TRUTH_OUT), JSON.stringify(truth) + "\n");
console.log(JSON.stringify({ p1: p1.length, added, candidate: outC.replace(MAIN + "/", ""), truth: resolve(TRUTH_OUT) }));
